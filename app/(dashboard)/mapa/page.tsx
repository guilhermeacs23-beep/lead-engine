'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchLeads } from '@/lib/supabase'
import { SEGMENT_LABELS } from '@/lib/mock-data'
import { getScoreColor } from '@/lib/utils'
import { Loader2, X, MapPin, Filter } from 'lucide-react'

const CITY_COORDS: Record<string, [number, number]> = {
  'São Paulo,SP':              [-23.5505, -46.6333],
  'Rio de Janeiro,RJ':         [-22.9068, -43.1729],
  'Belo Horizonte,MG':         [-19.9191, -43.9386],
  'Porto Alegre,RS':           [-30.0346, -51.2177],
  'Curitiba,PR':               [-25.4284, -49.2733],
  'Recife,PE':                 [ -8.0476, -34.8770],
  'Salvador,BA':               [-12.9714, -38.5014],
  'Fortaleza,CE':              [ -3.7319, -38.5267],
  'Manaus,AM':                 [ -3.1019, -60.0250],
  'Belém,PA':                  [ -1.4558, -48.4902],
  'Goiânia,GO':                [-16.6869, -49.2648],
  'Campinas,SP':               [-22.9099, -47.0626],
  'São Luís,MA':               [ -2.5307, -44.3068],
  'Maceió,AL':                 [ -9.6658, -35.7350],
  'Natal,RN':                  [ -5.7945, -35.2110],
  'Teresina,PI':               [ -5.0920, -42.8034],
  'Campo Grande,MS':           [-20.4697, -54.6201],
  'João Pessoa,PB':            [ -7.1195, -34.8450],
  'Aracaju,SE':                [-10.9472, -37.0731],
  'Cuiabá,MT':                 [-15.6014, -56.0979],
  'Florianópolis,SC':          [-27.5954, -48.5480],
  'Vitória,ES':                [-20.3155, -40.3128],
  'Uberlândia,MG':             [-18.9186, -48.2772],
  'Ribeirão Preto,SP':         [-21.1767, -47.8208],
  'Santos,SP':                 [-23.9608, -46.3336],
  'São José dos Campos,SP':    [-23.1791, -45.8872],
  'Sorocaba,SP':               [-23.5015, -47.4526],
  'Londrina,PR':               [-23.3045, -51.1696],
  'Joinville,SC':              [-26.3044, -48.8487],
  'Blumenau,SC':               [-26.9194, -49.0661],
  'Caxias do Sul,RS':          [-29.1678, -51.1794],
  'Pelotas,RS':                [-31.7654, -52.3371],
  'Chapecó,SC':                [-27.1005, -52.6156],
  'Cascavel,PR':               [-24.9555, -53.4552],
  'Maringá,PR':                [-23.4273, -51.9375],
  'Foz do Iguaçu,PR':          [-25.5469, -54.5882],
  'Rondonópolis,MT':           [-16.4727, -54.6358],
  'Anápolis,GO':               [-16.3281, -48.9533],
  'Feira de Santana,BA':       [-12.2664, -38.9663],
  'Caruaru,PE':                [ -8.2760, -35.9761],
  'Mossoró,RN':                [ -5.1875, -37.3440],
  'Campina Grande,PB':         [ -7.2306, -35.8811],
  'Palmas,TO':                 [-10.2491, -48.3243],
  'Porto Velho,RO':            [ -8.7612, -63.9004],
  'Rio Branco,AC':             [ -9.9754, -67.8249],
  'Macapá,AP':                 [  0.0390, -51.0664],
  'Boa Vista,RR':              [  2.8235, -60.6758],
  'Imperatriz,MA':             [ -5.5260, -47.4789],
  'Volta Redonda,RJ':          [-22.5233, -44.1028],
  'Juiz de Fora,MG':           [-21.7611, -43.3496],
  'Montes Claros,MG':          [-16.7281, -43.8634],
  'São Carlos,SP':             [-21.9974, -47.8916],
  'Piracicaba,SP':             [-22.7253, -47.6492],
  'Jundiaí,SP':                [-23.1857, -46.8977],
  'Osasco,SP':                 [-23.5329, -46.7919],
  'Guarulhos,SP':              [-23.4543, -46.5337],
  'São Bernardo do Campo,SP':  [-23.6914, -46.5646],
  'Santo André,SP':            [-23.6639, -46.5383],
}

const SEG_COLORS: Record<string, string> = {
  agronegocio: '#34d399', varejo: '#60a5fa', industria: '#818cf8',
  farmaceutico: '#f472b6', moda: '#fbbf24', construcao: '#f97316',
  alimentos: '#a78bfa', logistica: '#0ea5e9', tecnologia: '#94a3b8',
}

const STATUS_COLORS: Record<string, string> = {
  novo:'#818cf8', contactado:'#60a5fa', proposta:'#fbbf24',
  negociando:'#f472b6', fechado:'#34d399', perdido:'#ef4444',
}

export default function MapaPage() {
  const mapEl      = useRef<HTMLDivElement>(null)
  const mapRef     = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [leads,      setLeads]      = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [mapReady,   setMapReady]   = useState(false)
  const [filterBy,   setFilterBy]   = useState<'segmento' | 'status'>('segmento')
  const [selected,   setSelected]   = useState<any | null>(null)
  const [plotted,    setPlotted]    = useState(0)

  // Load leads
  useEffect(() => {
    fetchLeads().then(data => {
      setLeads(data)
      setLoading(false)
    })
  }, [])

  // Load Leaflet
  useEffect(() => {
    if (typeof window === 'undefined') return
    const link = Object.assign(document.createElement('link'), {
      rel: 'stylesheet', href: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    })
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => setMapReady(true)
    document.head.appendChild(script)
  }, [])

  // Init map
  useEffect(() => {
    if (!mapReady || !mapEl.current || mapRef.current) return
    const L = (window as any).L
    const map = L.map(mapEl.current, { zoomControl: false }).setView([-14.2, -51.9], 4)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      subdomains: 'abcd', maxZoom: 19,
    }).addTo(map)
    mapRef.current = map
  }, [mapReady])

  // Plot markers whenever leads or filterBy changes
  useEffect(() => {
    if (!mapRef.current || !mapReady || leads.length === 0) return
    const L   = (window as any).L
    const map = mapRef.current

    // Remove old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    let count = 0
    leads.forEach(lead => {
      const coords = CITY_COORDS[`${lead.cidade},${lead.estado}`]
      if (!coords) return

      const color = filterBy === 'segmento'
        ? (SEG_COLORS[lead.segmento] ?? '#6366f1')
        : (STATUS_COLORS[lead.status] ?? '#6366f1')

      const score = lead.score_ia ?? 60
      const r     = 5 + Math.round(score / 25)

      const marker = L.circleMarker(coords, {
        radius: r, fillColor: color, color: 'rgba(255,255,255,0.6)',
        weight: 1.5, opacity: 1, fillOpacity: 0.82,
      }).addTo(map)

      marker.on('click', () => setSelected(lead))
      markersRef.current.push(marker)
      count++
    })
    setPlotted(count)
  }, [leads, mapReady, filterBy])

  const mappedCount   = leads.filter(l => CITY_COORDS[`${l.cidade},${l.estado}`]).length
  const unmappedCount = leads.length - mappedCount

  return (
    <div className="relative flex h-full overflow-hidden">

      {/* Map container */}
      <div ref={mapEl} className="flex-1" style={{ background: '#0c0a1e' }} />

      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center gap-2 text-sm text-white/50"
          style={{ background: 'rgba(12,10,30,0.8)' }}>
          <Loader2 size={18} className="animate-spin" />Carregando leads…
        </div>
      )}

      {/* Controls panel */}
      <div className="absolute left-4 top-4 z-10 flex flex-col gap-3">
        {/* Stats */}
        <div className="rounded-xl px-4 py-3 text-sm"
          style={{ background: 'rgba(13,11,32,0.92)', border: '0.5px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(12px)' }}>
          <p className="font-semibold text-white">{plotted} leads no mapa</p>
          <p className="text-[12px] text-white/40">de {leads.length} total · {unmappedCount} sem coords</p>
        </div>

        {/* Color by */}
        <div className="rounded-xl p-3"
          style={{ background: 'rgba(13,11,32,0.92)', border: '0.5px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(12px)' }}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/30 flex items-center gap-1.5">
            <Filter size={10} />Colorir por
          </p>
          <div className="flex gap-2">
            {(['segmento', 'status'] as const).map(v => (
              <button key={v} onClick={() => setFilterBy(v)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all capitalize"
                style={filterBy === v
                  ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }
                  : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)' }}>
                {v === 'segmento' ? 'Segmento' : 'Status'}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="rounded-xl p-3"
          style={{ background: 'rgba(13,11,32,0.92)', border: '0.5px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(12px)' }}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/30">Legenda</p>
          <div className="flex flex-col gap-1.5">
            {filterBy === 'segmento'
              ? Object.entries(SEG_COLORS).map(([k, c]) => (
                <span key={k} className="flex items-center gap-2 text-[12px] text-white/70">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: c }} />
                  {SEGMENT_LABELS[k] ?? k}
                </span>
              ))
              : Object.entries(STATUS_COLORS).map(([k, c]) => (
                <span key={k} className="flex items-center gap-2 text-[12px] text-white/70">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: c }} />
                  {{novo:'Novo',contactado:'Contactado',proposta:'Proposta',negociando:'Negociando',fechado:'Fechado',perdido:'Perdido'}[k]}
                </span>
              ))
            }
          </div>
        </div>
      </div>

      {/* Lead detail panel */}
      {selected && (
        <div className="absolute right-4 top-4 z-10 w-72 rounded-xl overflow-hidden"
          style={{ background: 'rgba(13,11,32,0.95)', border: '0.5px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-start justify-between p-4"
            style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold text-white"
                style={{ background: `linear-gradient(135deg,${SEG_COLORS[selected.segmento] ?? '#6366f1'},${SEG_COLORS[selected.segmento] ?? '#8b5cf6'})` }}>
                {selected.empresa?.charAt(0) ?? '?'}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-white">{selected.empresa}</p>
                <p className="text-[12px] text-white/45">{selected.contato_nome}</p>
              </div>
            </div>
            <button onClick={() => setSelected(null)}
              className="text-white/30 hover:text-white/60 transition-all mt-0.5">
              <X size={14} />
            </button>
          </div>
          <div className="flex flex-col gap-2 p-4">
            {[
              { label: 'Segmento', value: SEGMENT_LABELS[selected.segmento] ?? selected.segmento },
              { label: 'Localização', value: `${selected.cidade}, ${selected.estado}` },
              { label: 'Cargo', value: selected.contato_cargo },
              { label: 'Telefone', value: selected.telefone },
              { label: 'E-mail', value: selected.email },
            ].filter(r => r.value).map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-2">
                <span className="shrink-0 text-[12px] text-white/40">{label}</span>
                <span className="text-right text-[12px] font-medium text-white">{value}</span>
              </div>
            ))}
            {selected.score_ia && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 overflow-hidden rounded-full" style={{ height: 5, background: 'rgba(255,255,255,0.10)' }}>
                  <div className="h-full rounded-full" style={{ width: `${selected.score_ia}%`, background: getScoreColor(selected.score_ia).color }} />
                </div>
                <span className="text-[13px] font-bold" style={{ color: getScoreColor(selected.score_ia).color }}>
                  {selected.score_ia}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
