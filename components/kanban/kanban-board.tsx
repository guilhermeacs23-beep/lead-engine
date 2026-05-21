'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { Lead } from '@/types'
import { KanbanColumn } from './kanban-column'
import { fetchLeadsByStatus, updateLeadStatus } from '@/lib/supabase'
import { useUIStore, GRADIENT_PRESETS } from '@/store/ui-store'
import { Kanban, List, Calendar, Map, Filter, Sparkles, Loader2, Plus, X } from 'lucide-react'

const VIEW_TABS = [
  { id: 'kanban',     label: 'Kanban',     Icon: Kanban   },
  { id: 'lista',      label: 'Lista',      Icon: List     },
  { id: 'calendario', label: 'Calendário', Icon: Calendar },
  { id: 'mapa',       label: 'Mapa',       Icon: Map      },
]

export function KanbanBoard() {
  const [leads,   setLeads]   = useState<Lead[]>([])
  const [view,    setView]    = useState('kanban')
  const [loading, setLoading] = useState(true)

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

      {/* Board */}
      {loading && leads.length === 0 ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-white/30">
          <Loader2 size={18} className="animate-spin" />Carregando pipeline…
        </div>
      ) : (
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

              {/* Seletor de gradiente */}
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
      )}
    </div>
  )
}
