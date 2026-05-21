'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { Lead } from '@/types'
import { KanbanColumn } from './kanban-column'
import { fetchLeadsByStatus, updateLeadStatus } from '@/lib/supabase'
import { useUIStore, GRADIENT_PRESETS } from '@/store/ui-store'
import { formatCurrencyShort } from '@/lib/utils'
import { getScoreColor } from '@/lib/utils'
import { SOURCE_LABELS, SEGMENT_LABELS } from '@/lib/mock-data'
import { Kanban, List, Calendar, Map, Filter, Sparkles, Loader2, Plus, X, ChevronUp, ChevronDown } from 'lucide-react'

const VIEW_TABS = [
  { id: 'kanban',     label: 'Kanban',     Icon: Kanban   },
  { id: 'lista',      label: 'Lista',      Icon: List     },
  { id: 'calendario', label: 'Calendário', Icon: Calendar },
  { id: 'mapa',       label: 'Mapa',       Icon: Map      },
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

export function KanbanBoard() {
  const [leads,   setLeads]   = useState<Lead[]>([])
  const [view,    setView]    = useState('kanban')
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('score_ia')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

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

  const sortedLeads = [...leads].sort((a, b) => {
    let va: any = a[sortKey] ?? ''
    let vb: any = b[sortKey] ?? ''
    if (typeof va === 'string') va = va.toLowerCase()
    if (typeof vb === 'string') vb = vb.toLowerCase()
    if (va < vb) return sortDir === 'asc' ? -1 : 1
    if (va > vb) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronUp size={11} className="opacity-25" />
    return sortDir === 'asc'
      ? <ChevronUp size={11} className="text-indigo-300" />
      : <ChevronDown size={11} className="text-indigo-300" />
  }

  return (
    <div className="flex h-full flex-col">
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

      {/* Loading state */}
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
            />
          ))}

          {/* Nova etapa */}
          {!adding ? (
            <button
              onClick={() => setAdding(true)}
              className="flex w-[210px] flex-shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm text-white/45 transition-all hover:bg-white/[0.07] hover:text-white/70"
              style={{ border: '1.5px dashed rgba(255,255,255,0.15)', alignSelf: 'flex-start' }}
            >
              <Plus size={14} strokeWidth={2} />
              Nova etapa
            </button>
          ) : (
            <div
              className="flex w-[220px] flex-shrink-0 flex-col gap-3 rounded-xl p-3"
              style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.15)', alignSelf: 'flex-start' }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-white/70">Nova etapa</p>
                <button onClick={() => setAdding(false)} className="text-white/30 hover:text-white/60">
                  <X size={13} strokeWidth={2} />
                </button>
              </div>

              <input
                autoFocus
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddColumn() }}
                placeholder="Nome da etapa…"
                className="rounded-lg px-3 py-2 text-xs text-white/80 outline-none placeholder:text-white/25"
                style={{ background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.15)' }}
              />

              <div className="grid grid-cols-6 gap-1.5">
                {GRADIENT_PRESETS.map(g => (
                  <button
                    key={g}
                    onClick={() => setNewColor(g)}
                    style={{
                      height: 24,
                      borderRadius: 5,
                      background: g,
                      outline: newColor === g ? '2px solid white' : '2px solid transparent',
                      outlineOffset: 1,
                      transform: newColor === g ? 'scale(1.12)' : 'scale(1)',
                      transition: 'all 0.1s',
                    }}
                  />
                ))}
              </div>

              <button
                onClick={handleAddColumn}
                disabled={!newTitle.trim()}
                className="rounded-lg py-1.5 text-xs font-medium text-white transition-all disabled:opacity-40"
                style={{ background: newColor }}
              >
                Criar etapa
              </button>
            </div>
          )}
        </div>
      ) : view === 'lista' ? (
        /* ── LISTA ── */
        <div className="flex-1 overflow-auto p-4">
          <div className="overflow-hidden rounded-xl" style={{ border: '0.5px solid rgba(255,255,255,0.10)' }}>
            {/* Cabeçalho */}
            <div
              className="grid items-center px-4 py-3 text-[13px] font-semibold text-white"
              style={{
                gridTemplateColumns: '2fr 1.2fr 1fr 0.8fr 0.7fr 0.7fr',
                background: 'rgba(255,255,255,0.07)',
                borderBottom: '0.5px solid rgba(255,255,255,0.10)',
              }}
            >
              {([
                ['empresa',         'Empresa'    ],
                ['status',          'Etapa'      ],
                ['segmento',        'Segmento'   ],
                ['valor_estimado',  'Valor/mês'  ],
                ['score_ia',        'Score IA'   ],
              ] as [SortKey, string][]).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => handleSort(k)}
                  className="flex items-center gap-1 hover:text-indigo-300 transition-colors"
                >
                  {label} <SortIcon k={k} />
                </button>
              ))}
              <span>Contato</span>
            </div>

            {sortedLeads.length === 0 ? (
              <div className="py-16 text-center text-sm text-white/40">Nenhum lead no pipeline</div>
            ) : (
              sortedLeads.map(lead => {
                const score  = getScoreColor(lead.score_ia)
                const source = SOURCE_LABELS[lead.fonte]
                const status = STATUS_LABELS[lead.status] ?? lead.status
                const color  = STATUS_COLORS[lead.status] ?? '#94a3b8'
                return (
                  <div
                    key={lead.id}
                    className="grid items-center px-4 py-3.5 text-sm transition-all hover:bg-white/[0.04]"
                    style={{
                      gridTemplateColumns: '2fr 1.2fr 1fr 0.8fr 0.7fr 0.7fr',
                      borderBottom: '0.5px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {/* Empresa */}
                    <div>
                      <p className="font-semibold text-white">{lead.empresa}</p>
                      <p className="mt-0.5 text-[12px] text-white/55">{lead.cidade}, {lead.estado}</p>
                    </div>

                    {/* Etapa */}
                    <span
                      className="w-fit rounded-lg px-2.5 py-1 text-[12px] font-semibold"
                      style={{ color, background: `${color}20` }}
                    >
                      {status}
                    </span>

                    {/* Segmento */}
                    <span className="font-medium text-white">
                      {SEGMENT_LABELS[lead.segmento] ?? lead.segmento}
                    </span>

                    {/* Valor */}
                    <span className="font-bold text-white">
                      {lead.valor_estimado ? `${formatCurrencyShort(lead.valor_estimado)}/mês` : '—'}
                    </span>

                    {/* Score */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 overflow-hidden rounded-full" style={{ height: 5, background: 'rgba(255,255,255,0.10)' }}>
                        <div className="h-full rounded-full" style={{ width: `${lead.score_ia}%`, background: score.color }} />
                      </div>
                      <span className="min-w-[28px] text-right text-[13px] font-bold" style={{ color: score.color }}>
                        {lead.score_ia}
                      </span>
                    </div>

                    {/* Contato */}
                    <div>
                      <p className="text-[13px] font-medium text-white">{lead.contato_nome}</p>
                      {source && (
                        <span className="mt-0.5 inline-block rounded px-1.5 py-0.5 text-[11px] font-medium"
                          style={{ color: source.color, background: source.bg }}>
                          {source.label}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Rodapé com total */}
          <div className="mt-3 flex items-center justify-between px-1">
            <span className="text-[13px] text-white/60">{sortedLeads.length} leads no pipeline</span>
            <span className="text-[13px] font-semibold text-white">
              Total: {formatCurrencyShort(sortedLeads.reduce((s, l) => s + (l.valor_estimado ?? 0), 0))}/mês
            </span>
          </div>
        </div>
      ) : (
        /* ── CALENDÁRIO / MAPA (placeholder) ── */
        <div className="flex flex-1 items-center justify-center flex-col gap-3">
          <div className="rounded-2xl p-5"
            style={{ background: 'rgba(99,102,241,0.10)', border: '0.5px solid rgba(99,102,241,0.25)' }}>
            {view === 'calendario'
              ? <Calendar size={32} strokeWidth={1.2} className="text-indigo-300" />
              : <Map size={32} strokeWidth={1.2} className="text-indigo-300" />}
          </div>
          <p className="text-[15px] font-semibold text-white">
            {view === 'calendario' ? 'Calendário de atividades' : 'Mapa logístico'}
          </p>
          <p className="text-sm text-white/50">Em desenvolvimento</p>
        </div>
      )}
    </div>
  )
}
