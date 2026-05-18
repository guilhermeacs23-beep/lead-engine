'use client'
import { useState, useEffect, useCallback } from 'react'
import { Lead, LeadStatus } from '@/types'
import { KanbanColumn } from './kanban-column'
import { KANBAN_COLUMNS } from '@/lib/mock-data'
import { fetchLeadsByStatus, updateLeadStatus } from '@/lib/supabase'
import { Kanban, List, Calendar, Map, Filter, Sparkles, Loader2 } from 'lucide-react'

const VIEW_TABS = [
  { id: 'kanban',      label: 'Kanban',      Icon: Kanban   },
  { id: 'lista',       label: 'Lista',       Icon: List     },
  { id: 'calendario',  label: 'Calendário',  Icon: Calendar },
  { id: 'mapa',        label: 'Mapa',        Icon: Map      },
]

export function KanbanBoard() {
  const [leads,   setLeads]   = useState<Lead[]>([])
  const [view,    setView]    = useState('kanban')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetchLeadsByStatus()
    setLeads(data as Lead[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function getLeadsByStatus(status: LeadStatus) {
    return leads.filter((l) => l.status === status)
  }

  async function handleMoveCard(leadId: string, newStatus: LeadStatus) {
    // Optimistic update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l))
    await updateLeadStatus(leadId, newStatus)
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
                : 'text-white/40 hover:bg-white/[0.06] hover:text-white/70'}`}
          >
            <Icon size={12} strokeWidth={1.5} />
            {label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          {loading && (
            <span className="flex items-center gap-1.5 text-xs text-white/30">
              <Loader2 size={11} className="animate-spin" />Sincronizando…
            </span>
          )}
          <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-white/45 transition-all hover:bg-white/[0.06] hover:text-white/70"
            style={{ border: '0.5px solid rgba(255,255,255,0.10)' }}>
            <Filter size={11} strokeWidth={1.5} />
            Filtros
          </button>
          <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-all"
 