'use client'
import { useState, useEffect, useRef } from 'react'
import { fetchLeadsByStatus } from '@/lib/supabase'
import { SEGMENT_LABELS } from '@/lib/mock-data'
import { getScoreColor, formatCurrencyShort } from '@/lib/utils'
import { Loader2, MapPin } from 'lucide-react'

const CITY_COORDS: Record<string, [number, number]> = {
  'São Paulo,SP':             [-23.5505,-46.6333], 'Rio de Janeiro,RJ':      [-22.9068,-43.1729],
  'Belo Horizonte,MG':        [-19.9191,-43.9386], 'Porto Alegre,RS':         [-30.0346,-51.2177],
  'Curitiba,PR':              [-25.4284,-49.2733], 'Recife,PE':               [ -8.0476,-34.8770],
  'Salvador,BA':              [-12.9714,-38.5014], 'Fortaleza,CE':            [ -3.7319,-38.5267],
  'Manaus,AM':                [ -3.1019,-60.0250], 'Belém,PA':                [ -1.4558,-48.4902],
  'Goiânia,GO':               [-16.6869,-49.2648], 'Campinas,SP':             [-22.9099,-47.0626],
  'Cuiabá,MT':                [-15.6014,-56.0979], 'Florianópolis,SC':        [-27.5954,-48.5480],
  'Vitória,ES':               [-20.3155,-40.3128], 'Uberlândia,MG':           [-18.9186,-48.2772],
  'Ribeirão Preto,SP':        [-21.1767,-47.8208], 'Santos,SP':               [-23.9608,-46.3336],
  'São José dos Campos,SP':   [-23.1791,-45.8872], 'Sorocaba,SP':             [-23.5015,-47.4526],
  'Londrina,PR':              [-23.3045,-51.1696], 'Joinville,SC':            [-26.3044,-48.8487],
  'Blumenau,SC':              [-26.9194,-49.0661], 'Caxias do Sul,RS':        [-29.1678,-51.1794],
  'Pelotas,RS':               [-31.7654,-52.3371], 'Maringá,PR':              [-23.4273,-51.9375],
  'Cascavel,PR':              [-24.9555,-53.4552], 'Foz do Iguaçu,PR':        [-25.5469,-54.5882],
  'Rondonópolis,MT':          [-16.4727,-54.6358], 'Anápolis,GO':             [-16.3281,-48.9533],
  'Feira de Santana,BA':      [-12.2664,-38.9663], 'Campina Grande,PB':       [ -7.2306,-35.8811],
  'Natal,RN':                 [ -5.7945,-35.2110], 'Fortaleza,CE':            [ -3.7319,-38.5267],
  'João Pessoa,PB':           [ -7.1195,-34.8450], 'Palmas,TO':               [-10.2491,-48.3243],
  'Guarulhos,SP':             [-23.4543,-46.5337], 'São Bernardo do Campo,SP':[-23.6914,-46.5646],
  'Montes Claros,MG':         [-16.7281,-43.8634], 'Juiz de Fora,MG':         [-21.7611,-43.3496],
  'Campo Grande,MS':          [-20.4697,-54.6201], 'Maceió,AL':               [ -9.6658,-35.7350],
  'Porto Velho,RO':           [ -8.7612,-63.9004], 'Rio Branco,AC':           [ -9.9754,-67.8249],
  'Chapecó,SC':               [-27.1005,-52.6156], 'Piracicaba,SP':            [-22.7253,-47.6492],
  'Jundiaí,SP':               [-23.1857,-46.8977], 'Teresina,PI':             [ -5.0920,-42.8034],
}

const STATUS_CONFIG: Record<string, { label: string; color: string; order: number }> = {
  novo:       { label: 'Novo Lead',   color: '#818cf8', order: 0 },
  contactado: { label: 'Contactado',  color: '#60a5fa', order: 1 },
  proposta:   { label: 'Proposta',    color: '#fbbf24', order: 2 },
  negociando: { label: 'Negociando',  color: '#f472b6', order: 3 },
  fechado:    { label: 'Fechado',     color: '#34d399', order: 4 },
  perdido:    { label: 'Perdido',     color: '#ef4444', order: 5 },
}

function injectCSS() {
  if (document.getElementById('mv-css')) return
  const s = document.createElement('style')
  s.id = 'mv-css'
  s.textContent = `
    .mv-tip { background:rgba(10,8,28,0.97)!important; border:0.5px solid rgba(255,255,255,0.18)!important;
      border-radius:12px!important; padding:0!important; color:#fff!important;
      box-shadow:0 12px 40px rgba(0,0,0,0.7)!important; backdrop-filter:blur(20px); max-width:220px; }
    .mv-tip::before { display:none!important; }
    .leaflet-tooltip-top.mv-tip::before { display:block!important; border-top-color:rgba(255,255,255,0.18)!important; }
  `
  document.head.appendChild(s)
}

export function MapaView() {
  const mapEl      = useRef<HTMLDivElement>(null)
  const mapRef     = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [leads,    setLeads]    = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [mapReady, setMapReady] = useState(false)
  const [selected, setSelected] = useState<string | null>(null) // lead id
  const [filterStatus, setFilterStatus] = useState<string>('todos')

  useEffect(() => {
    fetchLeadsByStatus().then(data => { setLeads(data); setLoading(false) })
  }, [])

  // Load Leaflet once
  useEffect(() => {
    if (typeof window === 'undefined') return
    if ((window as any).L) { injectCSS(); setMapReady(true); return }
    const link = Object.assign(document.createElement('link'), {
      rel: 'stylesheet', href: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    })
    document.head.appendChild(link)
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => { injectCSS(); setMapReady(true) }
    document.head.appendChild(script)
  }, [])

  // Init map
  useEffect(() => {
    if (!mapReady || !mapEl.current || mapRef.current) return
    const L = (window as any).L
    const map = L.map(mapEl.current, { zoomControl: false }).setView([-15.5, -48.5], 4)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO', subdomains: 'abcd', maxZoom: 19,
    }).addTo(map)
    mapRef.current = map
    // Force Leaflet to recalculate size (needed when rendered inside a tab)
    setTimeout(() => map.invalidateSize(), 150)
  }, [mapReady])

  // Re-invalidate size whenever mapReady flips (tab switch)
  useEffect(() => {
    if (!mapRef.current || !mapReady) return
    const t1 = setTimeout(() => mapRef.current?.invalidateSize(), 100)
    const t2 = setTimeout(() => mapRef.current?.invalidateSize(), 500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [mapReady])

  // Plot markers
  useEffect(() => {
    if (!mapRef.current || !mapReady || leads.length === 0) return
    const L = (window as any).L
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    const filtered = filterStatus === 'todos' ? leads : leads.filter(l => l.status === filterStatus)

    filtered.forEach(lead => {
      const coords = CITY_COORDS[`${lead.cidade},${lead.estado}`]
      if (!coords) return
      const cfg   = STATUS_CONFIG[lead.status] ?? { color: '#6366f1', label: lead.status }
      const score = lead.score_ia ?? 60
      const r     = 6 + Math.round(score / 22)

      const marker = L.circleMarker(coords, {
        radius: r, fillColor: cfg.color,
        color: 'rgba(255,255,255,0.65)', weight: 1.5,
        opacity: selected && selected !== lead.id ? 0.35 : 1,
        fillOpacity: selected && selected !== lead.id ? 0.35 : 0.88,
      }).addTo(mapRef.current)

      const valor = lead.valor_estimado ? formatCurrencyShort(lead.valor_estimado) + '/mês' : null
      const tipHtml = `
        <div style="padding:12px 14px;min-width:185px">
          <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#fff">${lead.empresa}</p>
          <p style="margin:0 0 8px;font-size:11px;color:rgba(255,255,255,0.5)">
            ${lead.contato_nome}${lead.contato_cargo ? ' · ' + lead.contato_cargo : ''}
          </p>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span style="font-size:12px;font-weight:600;padding:2px 8px;border-radius:6px;
              background:${cfg.color}22;color:${cfg.color}">${cfg.label}</span>
            ${valor ? `<span style="font-size:12px;font-weight:600;color:#34d399">${valor}</span>` : ''}
          </div>
          <p style="margin:6px 0 0;font-size:11px;color:rgba(255,255,255,0.35)">${lead.cidade}, ${lead.estado}</p>
        </div>`

      marker.bindTooltip(tipHtml, {
        direction: 'top', permanent: false, sticky: false,
        className: 'mv-tip', offset: [0, -(r + 4)],
      })
      marker.on('click', () => setSelected(id => id === lead.id ? null : lead.id))
      markersRef.current.push(marker)
    })
  }, [leads, mapReady, filterStatus, selected])

  // Sorted sidebar leads
  const sidebarLeads = [...leads]
    .filter(l => filterStatus === 'todos' || l.status === filterStatus)
    .sort((a, b) => (STATUS_CONFIG[a.status]?.order ?? 9) - (STATUS_CONFIG[b.status]?.order ?? 9))

  const statusCounts = leads.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (loading) return (
    <div className="flex flex-1 items-center justify-center gap-2 text-sm text-white/40">
      <Loader2 size={18} className="animate-spin" />Carregando mapa…
    </div>
  )

  return (
    <div className="flex flex-1 overflow-hidden">

      {/* ── MAP ── */}
      <div className="relative flex-1">
        <div ref={mapEl} className="h-full w-full" style={{ background: '#0c0a1e', minHeight: 400 }} />

        {/* Funnel legend overlay */}
        <div className="absolute bottom-10 left-4 z-[1000] rounded-xl p-3"
          style={{ background: 'rgba(10,8,28,0.93)', border: '0.5px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)' }}>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">Etapa do funil</p>
          <div className="flex flex-col gap-1.5">
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <button key={k}
                onClick={() => setFilterStatus(f => f === k ? 'todos' : k)}
                className="flex items-center gap-2 rounded-lg px-2 py-1 transition-all hover:bg-white/[0.07]"
                style={{ opacity: filterStatus !== 'todos' && filterStatus !== k ? 0.4 : 1 }}>
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: v.color }} />
                <span className="text-[12px] text-white">{v.label}</span>
                <span className="ml-1 text-[11px] text-white/40">{statusCounts[k] ?? 0}</span>
              </button>
            ))}
          </div>
          {filterStatus !== 'todos' && (
            <button onClick={() => setFilterStatus('todos')}
              className="mt-2 w-full rounded-lg py-1 text-[11px] text-white/40 hover:text-white/70 transition-all"
              style={{ border: '0.5px solid rgba(255,255,255,0.10)' }}>
              Mostrar todos
            </button>
          )}
        </div>
      </div>

      {/* ── SIDEBAR ── */}
      <div className="flex w-64 shrink-0 flex-col overflow-hidden xl:w-72"
        style={{ borderLeft: '0.5px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.02)' }}>

        {/* Header */}
        <div className="px-4 py-3" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
          <p className="text-[13px] font-semibold text-white">Pipeline no mapa</p>
          <p className="text-[11px] text-white/40">
            {sidebarLeads.length} lead{sidebarLeads.length !== 1 ? 's' : ''}
            {filterStatus !== 'todos' ? ` · ${STATUS_CONFIG[filterStatus]?.label}` : ''}
          </p>
        </div>

        {/* Lead list */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          {sidebarLeads.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-12 text-center">
              <p className="text-sm text-white/30">Nenhum lead</p>
            </div>
          ) : (
            sidebarLeads.map(lead => {
              const cfg      = STATUS_CONFIG[lead.status] ?? { color: '#6366f1', label: lead.status }
              const hasCords = !!CITY_COORDS[`${lead.cidade},${lead.estado}`]
              const isActive = selected === lead.id
              return (
                <button key={lead.id}
                  onClick={() => setSelected(id => id === lead.id ? null : lead.id)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-all"
                  style={{
                    borderBottom: '0.5px solid rgba(255,255,255,0.05)',
                    background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                  }}>

                  {/* Status dot */}
                  <div className="mt-1 flex h-2.5 w-2.5 shrink-0 items-center justify-center">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: cfg.color }} />
                  </div>

                  {/* Info */}
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="truncate text-[13px] font-semibold text-white">{lead.empresa}</p>
                    <p className="truncate text-[11px] text-white/45">{lead.contato_nome}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{ color: 'rgba(255,255,255,0.70)', background: 'rgba(255,255,255,0.10)' }}>
                        {cfg.label}
                      </span>
                      {lead.valor_estimado > 0 && (
                        <span className="text-[10px] font-medium text-white/60">
                          {formatCurrencyShort(lead.valor_estimado)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-white/30">
                      <MapPin size={8} strokeWidth={1.5} />
                      <span className={hasCords ? '' : 'line-through opacity-40'}>
                        {lead.cidade}, {lead.estado}
                      </span>
                      {!hasCords && <span className="text-white/25"> · sem coords</span>}
                    </div>
                  </div>

                  {/* Score */}
                  <span className="shrink-0 text-[12px] font-bold text-white/70">
                    {lead.score_ia}
                  </span>
                </button>
              )
            })
          )}
        </div>

        {/* Footer totals */}
        <div className="px-4 py-3" style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
          <p className="text-[11px] text-white/30">
            Pipeline total:{' '}
            <span className="font-semibold text-white">
              {formatCurrencyShort(
                leads.filter(l => !['fechado','perdido'].includes(l.status))
                     .reduce((s, l) => s + (l.valor_estimado ?? 0), 0)
              )}/mês
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
