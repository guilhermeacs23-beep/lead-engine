'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Lead } from '@/types'
import { KanbanColumn } from './kanban-column'
import { fetchLeadsByStatus, updateLeadStatus } from '@/lib/supabase'
import { useUIStore, GRADIENT_PRESETS } from '@/store/ui-store'
import { formatCurrencyShort, getScoreColor } from '@/lib/utils'
import { SOURCE_LABELS, SEGMENT_LABELS } from '@/lib/mock-data'
import { LeadDrawer } from '@/components/ui/lead-drawer'
import {
  Kanban, List, Calendar, Filter, Sparkles,
  Loader2, Plus, X, ChevronUp, ChevronDown,
  Phone, Mail, Building2, TrendingUp,
} from 'lucide-react'
import { Map as MapIcon } from 'lucide-react'
import { CalendarioView } from '@/components/ui/calendario-view'
import { MapaView } from '@/components/ui/mapa-view'

const VIEW_TABS = [
  { id: 'kanban',     label: 'Kanban',     Icon: Kanban   },
  { id: 'lista',      label: 'Lista',      Icon: List     },
  { id: 'calendario', label: 'Calendário', Icon: Calendar },
  { id: 'mapa',       label: 'Mapa',       Icon: MapIcon  },
]

const STATUS_LABELS: Record<string, string> = {
  novo: 'Novo Lead', contactado: 'Contactado', proposta: 'Proposta',
  negociando: 'Negociando', fechado: 'Fechado', perdido: 'Perdido',
}

const STATUS_COLORS: Record<string, string> = {
  novo: '#818cf8', contactado: '#60a5fa', proposta: '#fbbf24',
  negociando: '#f472b6', fechado: '#34d399', perdido: '#ef4444',
}

type SortKey = 'empresa' | 'status' | 'valor_estimado' | 'score_ia' | 'segmento'
type SortDir = 'asc' | 'desc'

interface HoverCard {
  lead: Lead
  x: number
  y: number
  type: 'row' | 'contact'
}

export function KanbanBoard() {
  const [leads,        setLeads]        = useState<Lead[]>([])
  const [view,         setView]         = useState('kanban')
  const [loading,      setLoading]      = useState(true)
  const [sortKey,      setSortKey]      = useState<SortKey>('score_ia')
  const [sortDir,      setSortDir]      = useState<SortDir>('desc')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [hoverCard,    setHoverCard]    = useState<HoverCard | null>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { columns, addColumn, removeColumn, renameColumn, changeColumnColor } = useUIStore()
  const [adding,   setAdding]   = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newColor, setNewColor] = useState(GRADIENT_PRESETS[0])

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetchLeadsByStatus()
    setLeads(data as Lead[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function getLeadsByStatus(status: string) {
    return leads.filter((l) => l.status === status)
  }

  async function handleMoveCard(leadId: string, newStatus: string) {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus as any } : l))
    await updateLeadStatus(leadId, newStatus)
  }

  function handleDrawerStageChange(leadId: string, newStatus: string) {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus as any } : l))
    setSelectedLead(prev => prev?.id === leadId ? { ...prev, status: newStatus as any } : prev)
  }

  function handleAddColumn() {
    if (!newTitle.trim()) return
    const id = newTitle.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    addColumn({ id, title: newTitle.trim(), color: newColor })
    setNewTitle('')
    setNewColor(GRADIENT_PRESETS[0])
    setAdding(false)
  }

  function handleDeleteColumn(id: string) {
    if (!confirm('Excluir esta etapa? Os leads nela não serão apagados.')) return
    removeColumn(id)
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'score_ia' || key === 'valor_estimado' ? 'desc' : 'asc')
    }
  }

  function showHover(lead: Lead, e: React.MouseEvent, type: 'row' | 'contact') {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      setHoverCard({
        lead,
        x: type === 'contact' ? rect.left : rect.right + 8,
        y: rect.top,
        type,
      })
    }, 300)
  }

  function hideHover() {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    setHoverCard(null)
  }

  const sortedLeads = [...leads].sort((a, b) => {
    let va: any = (a as any)[sortKey] ?? ''
    let vb: any = (b as any)[sortKey] ?? ''
    if (typeof va === 'string') va = va.toLowerCase()
    if (typeof vb === 'string') vb = vb.toLowerCase()
    if (va < vb) return sortDir === 'asc' ? -1 : 1
    if (va > vb) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronUp size={11} className="opacity-25" />
    if (sortDir === 'asc') return <ChevronUp size={11} className="text-indigo-300" />
    return <ChevronDown size={11} className="text-indigo-300" />
  }

  return (
    <div className="flex h-full flex-col" onMouseLeave={hideHover}>

      {/* LeadDrawer */}
      <LeadDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onStageChange={handleDrawerStageChange}
      />

      {/* Hover card */}
      {hoverCard && (
        <div
          className="pointer-events-none fixed z-50"
          style={{
            left: hoverCard.type === 'contact'
              ? Math.max(8, hoverCard.x - 260)
              : Math.min(hoverCard.x, window.innerWidth - 280),
            top: Math.min(hoverCard.y, window.innerHeight - 220),
          }}
        >
          {hoverCard.type === 'row' ? (
            /* ── Row hover: resumo do lead ── */
            <div className="w-64 rounded-xl p-4 shadow-2xl"
              style={{ background: 'rgba(18,16,40,0.98)', border: '0.5px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(24px)' }}>
              {/* Empresa */}
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  {(hoverCard.lead as any).empresa?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white">{(hoverCard.lead as any).empresa}</p>
                  <p className="text-[11px] text-white/45">{(hoverCard.lead as any).cidade}, {(hoverCard.lead as any).estado}</p>
                </div>
              </div>
              {/* Etapa */}
              {(() => {
                const color = STATUS_COLORS[(hoverCard.lead as any).status] ?? '#94a3b8'
                return (
                  <span className="mb-2.5 inline-block rounded-lg px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{ color, background: `${color}20` }}>
                    {STATUS_LABELS[(hoverCard.lead as any).status]}
                  </span>
                )
              })()}
              {/* Valor + Score */}
              <div className="mt-2 flex gap-2">
                {(hoverCard.lead as any).valor_estimado && (
                  <div className="flex-1 rounded-lg px-2.5 py-2"
                    style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <p className="text-[10px] text-white/40">Potencial</p>
                    <p className="text-[13px] font-bold text-white">
                      {formatCurrencyShort((hoverCard.lead as any).valor_estimado)}/mês
                    </p>
                  </div>
                )}
                {(() => {
                  const score = getScoreColor((hoverCard.lead as any).score_ia)
                  return (
                    <div className="flex-1 rounded-lg px-2.5 py-2"
                      style={{ background: score.bg }}>
                      <p className="text-[10px] text-white/40">Score IA</p>
                      <p className="text-[13px] font-bold" style={{ color: score.color }}>
                        {(hoverCard.lead as any).score_ia}
                      </p>
                    </div>
                  )
                })()}
              </div>
              {/* Segmento */}
              <p className="mt-2.5 text-[11px] text-white/40">
                {SEGMENT_LABELS[(hoverCard.lead as any).segmento] ?? (hoverCard.lead as any).segmento}
              </p>
            </div>
          ) : (
            /* ── Contact hover: mini card ── */
            <div className="w-60 rounded-xl p-4 shadow-2xl"
              style={{ background: 'rgba(18,16,40,0.98)', border: '0.5px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(24px)' }}>
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#0ea5e9,#6366f1)' }}>
                  {(hoverCard.lead as any).contato_nome?.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white">{(hoverCard.lead as any).contato_nome}</p>
                  <p className="text-[11px] text-white/45">{(hoverCard.lead as any).contato_cargo}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {(hoverCard.lead as any).telefone && (
                  <a href={`tel:${(hoverCard.lead as any).telefone}`}
                    className="pointer-events-auto flex items-center gap-2 text-[12px] text-indigo-300 hover:underline">
                    <Phone size={12} strokeWidth={1.5} />
                    {(hoverCard.lead as any).telefone}
                  </a>
                )}
                {(hoverCard.lead as any).email && (
                  <a href={`mailto:${(hoverCard.lead as any).email}`}
                    className="pointer-events-auto flex items-center gap-2 text-[12px] text-indigo-300 hover:underline">
                    <Mail size={12} strokeWidth={1.5} />
                    {(hoverCard.lead as any).email}
                  </a>
                )}
                {!(hoverCard.lead as any).telefone && !(hoverCard.lead as any).email && (
                  <p className="text-[11px] italic text-white/25">Sem dados de contato</p>
                )}
              </div>
              <div className="mt-3 border-t pt-2.5" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <p className="text-[11px] text-white/35">{(hoverCard.lead as any).empresa}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub-bar */}
      <div
        className="flex h-11 flex-shrink-0 items-center gap-1.5 px-5"
        style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(16px)',
          borderBottom: '0.5px solid rgba(255,255,255,0.07)',
        }}
      >
        {VIEW_TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setView(id)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-all duration-150
              ${view === id
                ? 'bg-indigo-500/20 font-medium text-indigo-300'
                : 'text-white/55 hover:bg-white/[0.06] hover:text-white/80'}`}
          >
            <Icon size={12} strokeWidth={1.5} />
            {label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {loading && (
            <span className="flex items-center gap-1.5 text-xs text-white/40">
              <Loader2 size={11} className="animate-spin" />Sincronizando…
            </span>
          )}
          <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-white/60 transition-all hover:bg-white/[0.06] hover:text-white/80"
            style={{ border: '0.5px solid rgba(255,255,255,0.10)' }}>
            <Filter size={11} strokeWidth={1.5} />Filtros
          </button>
          <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-all"
            style={{
              background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))',
              border: '0.5px solid rgba(139,92,246,0.35)',
              color: '#a78bfa',
            }}>
            <Sparkles size={11} strokeWidth={1.5} />Gerar Leads IA
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && leads.length === 0 ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-white/30">
          <Loader2 size={18} className="animate-spin" />Carregando pipeline…
        </div>
      ) : view === 'kanban' ? (

        /* ── KANBAN ── */
        <div className="flex flex-1 gap-3 overflow-x-auto overflow-y-hidden p-4 items-start">
          {columns.map((col, idx) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              color={col.color}
              fixed={col.fixed}
              index={idx}
              leads={getLeadsByStatus(col.id)}
              onMoveCard={handleMoveCard}
              onDelete={handleDeleteColumn}
              onRename={renameColumn}
              onColorChange={changeColumnColor}
              onLeadClick={(lead) => setSelectedLead(lead)}
              onAddColumnAfter={(afterId) => { setAdding(true); setNewTitle('') }}
            />
          ))}
          {!adding ? (
            <button
              onClick={() => setAdding(true)}
              className="flex w-[210px] flex-shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm text-white/45 transition-all hover:bg-white/[0.07] hover:text-white/70"
              style={{ border: '1.5px dashed rgba(255,255,255,0.15)', alignSelf: 'flex-start' }}
            >
              <Plus size={14} strokeWidth={2} />Nova etapa
            </button>
          ) : (
            <div className="flex w-[220px] flex-shrink-0 flex-col gap-3 rounded-xl p-3"
              style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.15)', alignSelf: 'flex-start' }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-white/70">Nova etapa</p>
                <button onClick={() => setAdding(false)} className="text-white/30 hover:text-white/60">
                  <X size={13} strokeWidth={2} />
                </button>
              </div>
              <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddColumn() }}
                placeholder="Nome da etapa…"
                className="rounded-lg px-3 py-2 text-xs text-white/80 outline-none placeholder:text-white/25"
                style={{ background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.15)' }}
              />
              <div className="grid grid-cols-6 gap-1.5">
                {GRADIENT_PRESETS.map(g => (
                  <button key={g} onClick={() => setNewColor(g)}
                    style={{
                      height: 24, borderRadius: 5, background: g,
                      outline: newColor === g ? '2px solid white' : '2px solid transparent',
                      outlineOffset: 1, transform: newColor === g ? 'scale(1.12)' : 'scale(1)',
                      transition: 'all 0.1s',
                    }} />
                ))}
              </div>
              <button onClick={handleAddColumn} disabled={!newTitle.trim()}
                className="rounded-lg py-1.5 text-xs font-medium text-white transition-all disabled:opacity-40"
                style={{ background: newColor }}>
                Criar etapa
              </button>
            </div>
          )}
        </div>

      ) : view === 'lista' ? (

        /* ── LISTA (Bitrix style) ── */
        <div className="flex-1 overflow-auto" style={{ background: '#f5f6f8' }}>
          <div className="min-w-[900px]">
            {/* Cabeçalho */}
            <div className="flex items-center gap-0 text-[12px] font-semibold text-gray-500 uppercase tracking-wide px-4 py-2.5"
              style={{ background: '#fff', borderBottom: '1.5px solid #e5e7eb' }}>
              <div style={{ width: 32, flexShrink: 0 }} />
              {([
                ['empresa',        'Negócio',      '220px'],
                ['status',         'Fase',         '200px'],
                [null,             'Atividade',    '190px'],
                [null,             'Cliente',      '160px'],
                ['valor_estimado', 'Montante',     '110px'],
                [null,             'Responsável',  '140px'],
                [null,             'Criado',        '100px'],
              ] as [string|null, string, string][]).map(([k, label, w]) => (
                <div key={label} style={{ minWidth: w, flex: w === '220px' ? 1 : undefined }}>
                  {k ? (
                    <button onClick={() => handleSort(k as SortKey)}
                      className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
                      {label} <SortIcon k={k as SortKey} />
                    </button>
                  ) : (
                    <span>{label}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Linhas */}
            {sortedLeads.length === 0 ? (
              <div className="py-20 text-center text-sm text-gray-400 bg-white">Nenhum lead no pipeline</div>
            ) : sortedLeads.map((lead, i) => {
              const score   = getScoreColor((lead as any).score_ia)
              const status  = STATUS_LABELS[(lead as any).status] ?? (lead as any).status
              const color   = STATUS_COLORS[(lead as any).status] ?? '#94a3b8'
              const stageOrder = ['novo','contactado','proposta','negociando','fechado','perdido']
              const stageIdx   = stageOrder.indexOf((lead as any).status)
              const totalStages = 6
              const pct = stageIdx >= 0 ? Math.round(((stageIdx + 1) / totalStages) * 100) : 0
              const createdAt = (lead as any).created_at
                ? new Date((lead as any).created_at).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'})
                : '—'
              return (
                <div key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  onMouseEnter={(e) => showHover(lead, e, 'row')}
                  onMouseLeave={hideHover}
                  className="flex items-center gap-0 px-4 py-3 cursor-pointer transition-colors text-sm"
                  style={{
                    background: '#fff',
                    borderBottom: '1px solid #e9ebee',
                  }}
                  onMouseOver={e => (e.currentTarget as HTMLElement).style.background='#f0f2f5'}
                  onMouseOut={e => (e.currentTarget as HTMLElement).style.background='#fff'}
                >
                  {/* Checkbox */}
                  <div style={{ width: 32, flexShrink: 0 }}>
                    <div className="w-4 h-4 rounded border-2 border-gray-300 hover:border-indigo-500 transition-colors" />
                  </div>

                  {/* Negócio */}
                  <div style={{ flex: 1, minWidth: '220px', marginRight: 8 }}>
                    <p className="font-semibold text-indigo-600 hover:underline leading-snug">
                      {(lead as any).empresa}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Vendas</p>
                  </div>

                  {/* Fase — barra de progresso estilo Bitrix */}
                  <div style={{ minWidth: '200px', paddingRight: 12 }}>
                    <div className="flex gap-0.5 mb-1" style={{ height: 5 }}>
                      {stageOrder.slice(0, totalStages - 1).map((s, si) => (
                        <div key={s} style={{
                          flex: 1, height: '100%',
                          background: si <= stageIdx && (lead as any).status !== 'perdido'
                            ? STATUS_COLORS[s] ?? '#94a3b8'
                            : (lead as any).status === 'perdido' ? '#ef4444' : '#e5e7eb',
                          borderRadius: si === 0 ? '3px 0 0 3px' : si === totalStages - 2 ? '0 3px 3px 0' : 0,
                        }} />
                      ))}
                    </div>
                    <p className="text-[12px] font-medium" style={{ color }}>{status}</p>
                  </div>

                  {/* Atividade */}
                  <div style={{ minWidth: '190px', paddingRight: 12 }}>
                    <p className="text-[12px] text-gray-400 italic">Nenhuma atividade</p>
                  </div>

                  {/* Cliente */}
                  <div style={{ minWidth: '160px', paddingRight: 12 }}
                    onClick={(e) => { e.stopPropagation(); setSelectedLead(lead) }}
                    onMouseEnter={(e) => { e.stopPropagation(); showHover(lead, e, 'contact') }}
                    onMouseLeave={(e) => { e.stopPropagation(); hideHover() }}>
                    <p className="text-[12px] font-semibold text-indigo-600 hover:underline cursor-pointer">
                      {(lead as any).contato_nome}
                    </p>
                  </div>

                  {/* Montante */}
                  <div style={{ minWidth: '110px', paddingRight: 12 }}>
                    <p className="text-[13px] font-bold text-gray-800">
                      {(lead as any).valor_estimado ? formatCurrencyShort((lead as any).valor_estimado) : 'R$ 0'}
                    </p>
                  </div>

                  {/* Responsável */}
                  <div style={{ minWidth: '140px', paddingRight: 12 }}>
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                        G
                      </div>
                      <span className="text-[12px] text-gray-600 truncate">Guilherme</span>
                    </div>
                  </div>

                  {/* Criado */}
                  <div style={{ minWidth: '100px' }}>
                    <p className="text-[12px] text-gray-500">{createdAt}</p>
                  </div>
                </div>
              )
            })}

            {/* Rodapé */}
            <div className="flex items-center justify-between px-5 py-3 text-[12px]"
              style={{ background: '#fff', borderTop: '1.5px solid #e5e7eb', color: '#6b7280' }}>
              <span>Selecionado: 0 / {sortedLeads.length} &nbsp; <strong className="text-gray-800">Total: MOSTRAR QUANTIDADE</strong></span>
              <span className="font-semibold text-gray-800">
                {formatCurrencyShort(sortedLeads.reduce((s, l) => s + ((l as any).valor_estimado ?? 0), 0))}
              </span>
            </div>
          </div>
        </div>

      ) : (

        /* ── CALENDÁRIO ── */
        view === 'calendario' ? (
          <CalendarioView />
        ) : (
        <MapaView />
        )
      )}
    </div>
  )
}
