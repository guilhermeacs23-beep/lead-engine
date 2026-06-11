'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { MapPin, Navigation, RefreshCw, Wifi, WifiOff, ChevronLeft, ChevronRight, Radio, Clock } from 'lucide-react'

// ── tipos ────────────────────────────────────────────────────
interface Agent {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  ativo: boolean
  last_location?: { lat: number; lng: number; recorded_at: string; speed?: number }
  stops_count?: number
}

interface Stop {
  id: number
  agent_id: string
  lat: number
  lng: number
  started_at: string
  ended_at: string | null
  duracao_min: number | null
}

interface LocPoint {
  lat: number
  lng: number
  recorded_at: string
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

function toDateStr(d) {
  return d.toISOString().slice(0, 10)
}

function isToday(dateStr) {
  return dateStr === toDateStr(new Date())
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function fmtDateLabel(dateStr) {
  if (isToday(dateStr)) return 'Hoje'
  const d = new Date(dateStr + 'T12:00:00')
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (toDateStr(yesterday) === dateStr) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return diff + 's atrás'
  if (diff < 3600) return Math.floor(diff / 60) + 'min atrás'
  return Math.floor(diff / 3600) + 'h atrás'
}

// ── Mapa ─────────────────────────────────────────────────────
function FieldMap({ agents, stops, route, routeColor, selectedAgent, isHistory, onSelectAgent }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef({})
  const stopMarkersRef = useRef([])
  const routeLineRef = useRef(null)
  const startMarkerRef = useRef(null)
  const lRef = useRef(null)

  // init
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return
    if (mapInstanceRef.current) return
    import('leaflet').then((L) => {
      lRef.current = L
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })
      mapInstanceRef.current = L.map(mapRef.current, {
        center: [-19.9, -43.9],
        zoom: 11,
        zoomControl: true,
      })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap', maxZoom: 19,
      }).addTo(mapInstanceRef.current)
    })
  }, [])

  // rota histórica (polyline)
  useEffect(() => {
    const map = mapInstanceRef.current
    const L = lRef.current
    if (!map || !L) return

    if (routeLineRef.current) { routeLineRef.current.remove(); routeLineRef.current = null }
    if (startMarkerRef.current) { startMarkerRef.current.remove(); startMarkerRef.current = null }

    if (route.length > 1) {
      const coords = route.map((p) => [p.lat, p.lng])
      routeLineRef.current = L.polyline(coords, {
        color: routeColor || '#6366f1',
        weight: 4,
        opacity: 0.85,
      }).addTo(map)

      // marcador de início (verde)
      const first = route[0]
      const startIcon = L.divIcon({
        className: '',
        html: '<div style="width:14px;height:14px;background:#22c55e;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>',
        iconSize: [14, 14], iconAnchor: [7, 7],
      })
      startMarkerRef.current = L.marker([first.lat, first.lng], { icon: startIcon })
        .addTo(map)
        .bindPopup('Início: ' + fmtTime(first.recorded_at))

      // marcador de fim
      const last = route[route.length - 1]
      const endIcon = L.divIcon({
        className: '',
        html: '<div style="width:14px;height:14px;background:' + (routeColor || '#6366f1') + ';border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>',
        iconSize: [14, 14], iconAnchor: [7, 7],
      })
      L.marker([last.lat, last.lng], { icon: endIcon })
        .addTo(map)
        .bindPopup((isHistory ? 'Último ping: ' : 'Agora: ') + fmtTime(last.recorded_at))

      map.fitBounds(routeLineRef.current.getBounds(), { padding: [40, 40] })
    }
  }, [route, routeColor, isHistory])

  // marcadores ao vivo
  useEffect(() => {
    const map = mapInstanceRef.current
    const L = lRef.current
    if (!map || !L || isHistory) return

    agents.forEach((agent, i) => {
      const loc = agent.last_location
      if (!loc) return
      const color = COLORS[i % COLORS.length]
      const isSel = agent.id === selectedAgent
      const icon = L.divIcon({
        className: '',
        html: '<div style="width:' + (isSel ? 20 : 14) + 'px;height:' + (isSel ? 20 : 14) + 'px;background:' + color + ';border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 3px ' + color + '55"></div>',
        iconSize: [isSel ? 20 : 14, isSel ? 20 : 14],
        iconAnchor: [isSel ? 10 : 7, isSel ? 10 : 7],
      })
      if (markersRef.current[agent.id]) {
        markersRef.current[agent.id].setLatLng([loc.lat, loc.lng]).setIcon(icon)
      } else {
        markersRef.current[agent.id] = L.marker([loc.lat, loc.lng], { icon })
          .addTo(map)
          .bindPopup('<b>' + agent.nome + '</b><br/>' + timeAgo(loc.recorded_at))
          .on('click', () => onSelectAgent(agent.id))
      }
    })
  }, [agents, selectedAgent, isHistory, onSelectAgent])

  // paradas numeradas
  useEffect(() => {
    const map = mapInstanceRef.current
    const L = lRef.current
    if (!map || !L) return

    stopMarkersRef.current.forEach((m) => m.remove())
    stopMarkersRef.current = []

    const shown = selectedAgent ? stops.filter((s) => s.agent_id === selectedAgent) : stops
    shown.forEach((stop, idx) => {
      const icon = L.divIcon({
        className: '',
        html: '<div style="width:22px;height:22px;background:#f59e0b;border:2px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#000;box-shadow:0 2px 6px rgba(0,0,0,0.35)">' + (idx + 1) + '</div>',
        iconSize: [22, 22], iconAnchor: [11, 11],
      })
      const m = L.marker([stop.lat, stop.lng], { icon }).addTo(map)
      const dur = stop.duracao_min ? stop.duracao_min + 'min' : 'em andamento'
      m.bindPopup('<b>Parada ' + (idx + 1) + '</b><br/>' + fmtTime(stop.started_at) + ' · ' + dur)
      stopMarkersRef.current.push(m)
    })
  }, [stops, selectedAgent])

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </>
  )
}

// ── Página principal ─────────────────────────────────────────
export default function CampoPage() {
  const [agents, setAgents] = useState([])
  const [stops, setStops] = useState([])
  const [route, setRoute] = useState([])
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()))
  const [online, setOnline] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingRoute, setLoadingRoute] = useState(false)
  const tenantRef = useRef(null)

  const isLive = isToday(selectedDate)

  // datas
  function prevDay() {
    const d = new Date(selectedDate + 'T12:00:00')
    d.setDate(d.getDate() - 1)
    setSelectedDate(toDateStr(d))
    setRoute([])
  }
  function nextDay() {
    const d = new Date(selectedDate + 'T12:00:00')
    d.setDate(d.getDate() + 1)
    if (toDateStr(d) <= toDateStr(new Date())) {
      setSelectedDate(toDateStr(d))
      setRoute([])
    }
  }

  // busca agentes + dados do dia selecionado
  const fetchData = useCallback(async (dateStr) => {
    setLoading(true)
    const { data: profile } = await supabase.from('profiles').select('tenant_id').single()
    if (!profile) { setLoading(false); return }
    tenantRef.current = profile.tenant_id

    const dayStart = new Date(dateStr + 'T00:00:00-03:00').toISOString()
    const dayEnd = new Date(dateStr + 'T23:59:59-03:00').toISOString()

    const [{ data: agentsData }, { data: stopsData }] = await Promise.all([
      supabase.from('field_agents').select('*').eq('tenant_id', profile.tenant_id).eq('ativo', true),
      supabase.from('field_stops').select('*')
        .eq('tenant_id', profile.tenant_id)
        .gte('started_at', dayStart)
        .lte('started_at', dayEnd)
        .order('started_at', { ascending: true }),
    ])

    if (!agentsData) { setLoading(false); return }

    // última loc de cada agente no dia selecionado
    const enriched = await Promise.all(agentsData.map(async (agent) => {
      const { data: locs } = await supabase
        .from('field_locations')
        .select('lat, lng, recorded_at, speed')
        .eq('agent_id', agent.id)
        .gte('recorded_at', dayStart)
        .lte('recorded_at', dayEnd)
        .order('recorded_at', { ascending: false })
        .limit(1)

      const agentStops = (stopsData || []).filter((s) => s.agent_id === agent.id)
      return {
        ...agent,
        last_location: locs && locs[0] ? locs[0] : undefined,
        stops_count: agentStops.length,
      }
    }))

    setAgents(enriched)
    setStops((stopsData || []))
    setLoading(false)
  }, [])

  // carrega rota completa quando agente é selecionado
  const fetchRoute = useCallback(async (agentId, dateStr) => {
    if (!agentId) { setRoute([]); return }
    setLoadingRoute(true)
    const dayStart = new Date(dateStr + 'T00:00:00-03:00').toISOString()
    const dayEnd = new Date(dateStr + 'T23:59:59-03:00').toISOString()

    const { data: locs } = await supabase
      .from('field_locations')
      .select('lat, lng, recorded_at')
      .eq('agent_id', agentId)
      .gte('recorded_at', dayStart)
      .lte('recorded_at', dayEnd)
      .order('recorded_at', { ascending: true })

    setRoute(locs || [])
    setLoadingRoute(false)
  }, [])

  useEffect(() => {
    fetchData(selectedDate)
    setRoute([])
    setSelectedAgent(null)
  }, [selectedDate, fetchData])

  useEffect(() => {
    if (selectedAgent) {
      fetchRoute(selectedAgent, selectedDate)
    } else {
      setRoute([])
    }
  }, [selectedAgent, selectedDate, fetchRoute])

  // realtime apenas para hoje
  useEffect(() => {
    if (!isLive) return

    const channel = supabase.channel('campo-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'field_locations' }, (payload) => {
        const loc = payload.new
        setAgents((prev) => prev.map((a) =>
          a.id === loc.agent_id
            ? { ...a, last_location: { lat: loc.lat, lng: loc.lng, recorded_at: loc.recorded_at, speed: loc.speed } }
            : a
        ))
        if (loc.agent_id === selectedAgent) {
          setRoute((prev) => [...prev, { lat: loc.lat, lng: loc.lng, recorded_at: loc.recorded_at }])
        }
        setOnline(true)
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'field_stops' }, (payload) => {
        setStops((prev) => [...prev, payload.new])
        setAgents((prev) => prev.map((a) =>
          a.id === payload.new.agent_id ? { ...a, stops_count: (a.stops_count || 0) + 1 } : a
        ))
      })
      .subscribe((status) => setOnline(status === 'SUBSCRIBED'))

    return () => { supabase.removeChannel(channel) }
  }, [isLive, selectedAgent])

  const selectedAgentObj = agents.find((a) => a.id === selectedAgent) || null
  const selectedColor = selectedAgent ? COLORS[agents.findIndex((a) => a.id === selectedAgent) % COLORS.length] : '#6366f1'
  const activeAgents = agents.filter((a) => a.last_location)

  return (
    <div className="flex h-full gap-0 overflow-hidden">

      {/* ── Painel esquerdo ── */}
      <div className="flex w-72 flex-shrink-0 flex-col overflow-hidden border-r" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>

        {/* Header */}
        <div className="flex flex-col gap-3 px-4 pt-4 pb-3" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-semibold text-white/90">App de Campo</h1>
            <div className="flex items-center gap-1.5">
              {isLive
                ? <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400"><Radio size={10} className="animate-pulse" /> Ao vivo</span>
                : <span className="text-[10px] text-white/40">Histórico</span>}
              {online ? <Wifi size={12} className="text-emerald-400/60" /> : <WifiOff size={12} className="text-red-400" />}
            </div>
          </div>

          {/* Seletor de data */}
          <div className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.09)' }}>
            <button onClick={prevDay} className="text-white/40 hover:text-white/80 transition-colors p-0.5">
              <ChevronLeft size={15} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-white">{fmtDateLabel(selectedDate)}</span>
              <input
                type="date"
                value={selectedDate}
                max={toDateStr(new Date())}
                onChange={(e) => { if (e.target.value) setSelectedDate(e.target.value) }}
                className="w-0 opacity-0 absolute"
                id="date-picker"
              />
              <label htmlFor="date-picker" className="cursor-pointer text-[10px] text-white/30 hover:text-white/60">▾</label>
            </div>
            <button
              onClick={nextDay}
              disabled={isLive}
              className="p-0.5 transition-colors"
              style={{ color: isLive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.4)' }}
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(99,102,241,0.1)', border: '0.5px solid rgba(99,102,241,0.2)' }}>
              <p className="text-[18px] font-bold text-indigo-300">{activeAgents.length}</p>
              <p className="text-[10px] text-white/40">{isLive ? 'em campo' : 'com dados'}</p>
            </div>
            <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(245,158,11,0.1)', border: '0.5px solid rgba(245,158,11,0.2)' }}>
              <p className="text-[18px] font-bold text-amber-300">{stops.length}</p>
              <p className="text-[10px] text-white/40">paradas</p>
            </div>
          </div>
        </div>

        {/* Lista de agentes */}
        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1.5">
          {loading && <p className="text-xs text-white/35 px-1 py-4 text-center">Carregando...</p>}
          {!loading && agents.length === 0 && (
            <p className="text-xs text-white/35 px-1 py-4 text-center">Nenhum vendedor ativo</p>
          )}
          {agents.map((agent, i) => {
            const isSel = agent.id === selectedAgent
            const hasData = !!agent.last_location
            const color = COLORS[i % COLORS.length]
            const initials = agent.nome.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(isSel ? null : agent.id)}
                className="flex w-full items-center gap-2.5 rounded-xl p-2.5 text-left transition-all"
                style={{
                  background: isSel ? color + '18' : 'rgba(255,255,255,0.03)',
                  border: '0.5px solid ' + (isSel ? color + '55' : 'rgba(255,255,255,0.06)'),
                }}
              >
                <div className="relative h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: color }}>
                  {initials}
                  <span className={'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#13131f] ' + (hasData ? 'bg-emerald-400' : 'bg-white/15')} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-white/85">{agent.nome}</p>
                  <p className="text-[10px] text-white/40">
                    {hasData
                      ? (isLive ? timeAgo(agent.last_location.recorded_at) : fmtTime(agent.last_location.recorded_at))
                      : 'Sem dados neste dia'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[12px] font-semibold" style={{ color }}>{agent.stops_count || 0}</p>
                  <p className="text-[9px] text-white/30">paradas</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Detalhes do agente selecionado + timeline de paradas */}
        {selectedAgentObj && (
          <div className="flex flex-col" style={{ borderTop: '0.5px solid rgba(255,255,255,0.07)', maxHeight: '45%' }}>
            <div className="px-4 py-2.5 flex items-center justify-between">
              <p className="text-[11px] font-semibold" style={{ color: selectedColor }}>{selectedAgentObj.nome}</p>
              {loadingRoute && <span className="text-[10px] text-white/30">carregando rota...</span>}
              {!loadingRoute && route.length > 0 && (
                <span className="text-[10px] text-white/35">{route.length} pings</span>
              )}
            </div>

            {selectedAgentObj.telefone && (
              <a href={'tel:' + selectedAgentObj.telefone}
                className="mx-4 mb-2 flex items-center gap-1.5 text-[11px] text-white/50 hover:text-white/80">
                📞 {selectedAgentObj.telefone}
              </a>
            )}

            {/* Timeline de paradas */}
            <div className="overflow-y-auto px-3 pb-3 flex flex-col gap-1">
              <p className="text-[10px] font-medium uppercase tracking-wider text-white/30 px-1 mb-1">Paradas do dia</p>
              {stops.filter((s) => s.agent_id === selectedAgentObj.id).length === 0 && (
                <p className="text-[11px] text-white/30 px-1">Nenhuma parada registrada</p>
              )}
              {stops.filter((s) => s.agent_id === selectedAgentObj.id).map((stop, idx) => (
                <div key={stop.id} className="flex items-start gap-2 rounded-lg px-2 py-1.5" style={{ background: 'rgba(245,158,11,0.07)' }}>
                  <div className="mt-0.5 h-4 w-4 flex-shrink-0 flex items-center justify-center rounded-full text-[9px] font-bold text-amber-300"
                    style={{ background: 'rgba(245,158,11,0.25)' }}>
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-white/75">
                      {fmtTime(stop.started_at)}
                      {stop.ended_at ? ' – ' + fmtTime(stop.ended_at) : ' · em andamento'}
                    </p>
                    <p className="text-[10px] text-white/40">
                      {stop.duracao_min ? stop.duracao_min + ' min parado' : 'em andamento'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Mapa ── */}
      <div className="relative flex-1 overflow-hidden">
        <FieldMap
          agents={agents}
          stops={stops}
          route={route}
          routeColor={selectedColor}
          selectedAgent={selectedAgent}
          isHistory={!isLive}
          onSelectAgent={(id) => setSelectedAgent((prev) => prev === id ? null : id)}
        />

        {/* overlay sem dados */}
        {!loading && activeAgents.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
            <Navigation size={32} className="text-white/20 mb-3" />
            <p className="text-sm font-medium text-white/50">
              {isLive ? 'Nenhum vendedor em campo agora' : 'Sem dados neste dia'}
            </p>
            <p className="text-xs text-white/30 mt-1">
              {isLive ? 'Os pontos aparecem assim que o app enviar localização' : 'Tente selecionar outro dia'}
            </p>
          </div>
        )}

        {/* hint quando nenhum agente selecionado */}
        {!loading && activeAgents.length > 0 && !selectedAgent && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-xl px-4 py-2 text-[12px] text-white/60"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', border: '0.5px solid rgba(255,255,255,0.1)' }}>
            Selecione um vendedor para ver a rota do dia
          </div>
        )}

        {/* botão refresh (live) */}
        {isLive && (
          <button
            onClick={() => fetchData(selectedDate)}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:text-white/80 transition-all"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '0.5px solid rgba(255,255,255,0.1)' }}
            title="Atualizar"
          >
            <RefreshCw size={13} />
          </button>
        )}
      </div>
    </div>
  )
}
