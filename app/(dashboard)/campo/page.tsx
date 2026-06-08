'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { MapPin, Users, Clock, Navigation, RefreshCw, Wifi, WifiOff } from 'lucide-react'

// ── tipos ────────────────────────────────────────────────────
interface Agent {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  ativo: boolean
  last_location?: { lat: number; lng: number; recorded_at: string; speed?: number }
  stops_today?: number
  km_today?: number
}

interface Stop {
  id: number
  agent_id: string
  lat: number
  lng: number
  endereco: string | null
  started_at: string
  ended_at: string | null
  duracao_min: number | null
  lead_id: string | null
}

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#84cc16','#f97316','#14b8a6']

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return `${diff}s atrás`
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
  return `${Math.floor(diff / 3600)}h atrás`
}

// ── componente do mapa (client-only) ────────────────────────
function FieldMap({ agents, stops, selectedAgent, onSelectAgent }: {
  agents: Agent[]
  stops: Stop[]
  selectedAgent: string | null
  onSelectAgent: (id: string) => void
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Record<string, any>>({})
  const stopMarkersRef = useRef<any[]>([])

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return
    if (mapInstanceRef.current) return

    import('leaflet').then((L) => {
      // fix icon paths no Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, {
        center: [-15.77, -47.93],
        zoom: 5,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map
    })
  }, [])

  // atualiza marcadores dos agentes
  useEffect(() => {
    if (!mapInstanceRef.current) return
    import('leaflet').then((L) => {
      agents.forEach((agent, i) => {
        const loc = agent.last_location
        if (!loc) return
        const color = COLORS[i % COLORS.length]
        const isSelected = agent.id === selectedAgent

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width:${isSelected ? 18 : 14}px;
            height:${isSelected ? 18 : 14}px;
            background:${color};
            border:3px solid ${isSelected ? '#fff' : 'rgba(255,255,255,0.7)'};
            border-radius:50%;
            box-shadow:0 0 0 ${isSelected ? '4px' : '2px'} ${color}55;
            transition: all 0.3s;
          "></div>`,
          iconSize: [isSelected ? 18 : 14, isSelected ? 18 : 14],
          iconAnchor: [isSelected ? 9 : 7, isSelected ? 9 : 7],
        })

        if (markersRef.current[agent.id]) {
          markersRef.current[agent.id]
            .setLatLng([loc.lat, loc.lng])
            .setIcon(icon)
        } else {
          const marker = L.marker([loc.lat, loc.lng], { icon })
            .addTo(mapInstanceRef.current)
            .bindPopup(`<b>${agent.nome}</b><br/>${timeAgo(loc.recorded_at)}`)
            .on('click', () => onSelectAgent(agent.id))
          markersRef.current[agent.id] = marker
        }
      })
    })
  }, [agents, selectedAgent, onSelectAgent])

  // paradas do dia
  useEffect(() => {
    if (!mapInstanceRef.current) return
    import('leaflet').then((L) => {
      stopMarkersRef.current.forEach(m => m.remove())
      stopMarkersRef.current = []

      const agentStops = selectedAgent ? stops.filter(s => s.agent_id === selectedAgent) : stops
      agentStops.forEach((stop) => {
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:8px;height:8px;background:#fbbf24;border:2px solid #fff;border-radius:50%;opacity:0.85"></div>`,
          iconSize: [8, 8],
          iconAnchor: [4, 4],
        })
        const m = L.marker([stop.lat, stop.lng], { icon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <b>Parada</b><br/>
            ${stop.endereco || 'Localização desconhecida'}<br/>
            ${new Date(stop.started_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            ${stop.duracao_min ? ` · ${stop.duracao_min}min` : ''}
          `)
        stopMarkersRef.current.push(m)
      })
    })
  }, [stops, selectedAgent])

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '12px' }} />
    </>
  )
}

// ── página principal ─────────────────────────────────────────
export default function CampoPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [stops, setStops] = useState<Stop[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [online, setOnline] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)
  const tenantId = useRef<string | null>(null)

  // busca agentes + última localização + paradas de hoje
  const fetchData = useCallback(async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .single()
    if (!profile) return
    tenantId.current = profile.tenant_id

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [{ data: agentsData }, { data: stopsData }] = await Promise.all([
      supabase.from('field_agents').select('*').eq('tenant_id', profile.tenant_id).eq('ativo', true),
      supabase.from('field_stops').select('*')
        .eq('tenant_id', profile.tenant_id)
        .gte('started_at', today.toISOString()),
    ])

    if (!agentsData) return

    // última localização de cada agente
    const enriched = await Promise.all(agentsData.map(async (agent) => {
      const { data: locs } = await supabase
        .from('field_locations')
        .select('lat, lng, recorded_at, speed')
        .eq('agent_id', agent.id)
        .gte('recorded_at', today.toISOString())
        .order('recorded_at', { ascending: false })
        .limit(1)

      const agentStops = (stopsData || []).filter(s => s.agent_id === agent.id)
      const kmToday = 0 // calculado a partir dos pings em produção

      return {
        ...agent,
        last_location: locs?.[0] || undefined,
        stops_today: agentStops.length,
        km_today: kmToday,
      } as Agent
    }))

    setAgents(enriched)
    setStops((stopsData || []) as Stop[])
    setLastUpdate(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()

    // Realtime: novos pings GPS
    const channel = supabase
      .channel('campo-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'field_locations',
      }, (payload) => {
        const loc = payload.new as any
        setAgents(prev => prev.map(a =>
          a.id === loc.agent_id
            ? { ...a, last_location: { lat: loc.lat, lng: loc.lng, recorded_at: loc.recorded_at, speed: loc.speed } }
            : a
        ))
        setLastUpdate(new Date())
        setOnline(true)
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'field_stops',
      }, (payload) => {
        setStops(prev => [...prev, payload.new as Stop])
      })
      .subscribe((status) => {
        setOnline(status === 'SUBSCRIBED')
      })

    return () => { supabase.removeChannel(channel) }
  }, [fetchData])

  const selected = agents.find(a => a.id === selectedAgent)
  const activeAgents = agents.filter(a => a.last_location)

  return (
    <div className="flex h-full gap-4 p-4 overflow-hidden">

      {/* ── Painel lateral ── */}
      <div className="flex w-72 flex-shrink-0 flex-col gap-3 overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-white/90">App de Campo</h1>
            <p className="text-xs text-white/45">
              {activeAgents.length} de {agents.length} vendedores ativos
            </p>
          </div>
          <div className="flex items-center gap-2">
            {online
              ? <Wifi size={14} className="text-emerald-400" />
              : <WifiOff size={14} className="text-red-400" />}
            <button
              onClick={fetchData}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white/80 transition-all"
              title="Atualizar"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* Stats rápidos */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Em campo', value: activeAgents.length, icon: Navigation, color: 'text-indigo-400' },
            { label: 'Paradas hoje', value: stops.length, icon: MapPin, color: 'text-amber-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
              <Icon size={14} className={color + ' mb-1'} />
              <p className="text-xl font-bold text-white/90">{value}</p>
              <p className="text-[10px] text-white/45">{label}</p>
            </div>
          ))}
        </div>

        {/* Lista de agentes */}
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-white/40 px-1">Vendedores</p>
          {loading && <p className="text-xs text-white/40 px-1">Carregando...</p>}
          {agents.map((agent, i) => {
            const isSelected = agent.id === selectedAgent
            const hasLoc = !!agent.last_location
            const color = COLORS[i % COLORS.length]

            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(isSelected ? null : agent.id)}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all"
                style={{
                  background: isSelected ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `0.5px solid ${isSelected ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)'}`,
                }}
              >
                {/* Avatar */}
                <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: color }}>
                  {agent.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-black/40 ${hasLoc ? 'bg-emerald-400' : 'bg-white/20'}`} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-white/85">{agent.nome}</p>
                  <p className="text-[10px] text-white/45">
                    {hasLoc
                      ? `${agent.stops_today || 0} paradas · ${timeAgo(agent.last_location!.recorded_at)}`
                      : 'Sem sinal hoje'}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-medium" style={{ color }}>
                    {agent.stops_today || 0}
                  </p>
                  <p className="text-[9px] text-white/30">paradas</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Detalhe do agente selecionado */}
        {selected && (
          <div className="rounded-xl p-3" style={{ background: 'rgba(99,102,241,0.08)', border: '0.5px solid rgba(99,102,241,0.3)' }}>
            <p className="mb-2 text-xs font-semibold text-indigo-300">{selected.nome}</p>
            <div className="flex flex-col gap-1.5">
              {selected.telefone && (
                <a href={`tel:${selected.telefone}`} className="flex items-center gap-2 text-[11px] text-white/60 hover:text-white/90">
                  📞 {selected.telefone}
                </a>
              )}
              {selected.last_location && (
                <p className="text-[11px] text-white/50">
                  <Clock size={10} className="inline mr-1" />
                  Último ping: {timeAgo(selected.last_location.recorded_at)}
                </p>
              )}
              {selected.last_location?.speed !== undefined && (
                <p className="text-[11px] text-white/50">
                  🚗 {Math.round((selected.last_location.speed || 0) * 3.6)} km/h
                </p>
              )}
            </div>

            {/* Paradas do dia deste agente */}
            {stops.filter(s => s.agent_id === selected.id).length > 0 && (
              <div className="mt-2 border-t border-white/10 pt-2">
                <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-white/35">Paradas hoje</p>
                {stops.filter(s => s.agent_id === selected.id).map((stop, idx) => (
                  <div key={stop.id} className="flex items-start gap-2 mb-1.5">
                    <div className="mt-0.5 h-4 w-4 flex-shrink-0 flex items-center justify-center rounded-full bg-amber-500/20 text-[9px] font-bold text-amber-300">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-[10px] text-white/70">{stop.endereco || 'Localização'}</p>
                      <p className="text-[9px] text-white/35">
                        {new Date(stop.started_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        {stop.duracao_min ? ` · ${stop.duracao_min}min` : ' · em andamento'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rodapé atualização */}
        <p className="text-center text-[10px] text-white/25 mt-auto">
          Atualizado às {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      </div>

      {/* ── Mapa ── */}
      <div className="relative flex-1 overflow-hidden rounded-2xl" style={{ border: '0.5px solid rgba(255,255,255,0.08)' }}>
        <FieldMap
          agents={agents}
          stops={stops}
          selectedAgent={selectedAgent}
          onSelectAgent={(id) => setSelectedAgent(prev => prev === id ? null : id)}
        />

        {/* overlay "sem dados" */}
        {!loading && activeAgents.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm rounded-2xl">
            <Navigation size={32} className="text-white/25 mb-3" />
            <p className="text-sm font-medium text-white/60">Nenhum vendedor em campo</p>
            <p className="text-xs text-white/35 mt-1">Os pontos aparecem assim que o app enviar localização</p>
          </div>
        )}
      </div>
    </div>
  )
}
