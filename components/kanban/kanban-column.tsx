'use client'
import React from 'react'
import { Lead, LeadStatus } from '@/types'
import { LeadCard } from './lead-card'
import { formatCurrencyShort } from '@/lib/utils'
import { Plus } from 'lucide-react'

interface KanbanColumnProps {
  id: LeadStatus
  title: string
  color: string
  dotColor: string
  leads: Lead[]
  onAddLead?: (status: LeadStatus) => void
  onLeadClick?: (lead: Lead) => void
  onMoveCard?: (leadId: string, newStatus: LeadStatus) => void
}

export function KanbanColumn({
  id, title, color, leads, onAddLead, onLeadClick, onMoveCard
}: KanbanColumnProps) {
  const total = leads.reduce((sum, l) => sum + (l.valor_estimado ?? 0), 0)

  return (
    <div className="flex w-[210px] flex-shrink-0 flex-col">
      {/* Header glassmorphism */}
      <div className="kanban-col-head">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ background: color }} />
            <span className="text-[11px] font-medium text-white/85">{title}</span>
          </div>
          <span className="rounded-lg px-1.5 py-0.5 text-[10px] text-white/50"
            style={{ background: 'rgba(255,255,255,0.10)' }}>
            {leads.length}
          </span>
        </div>
        <p className="mt-1 text-[13px] font-medium" style={{ color }}>
          {total > 0 ? `${formatCurrencyShort(total)}/mês` : '—'}
        </p>
      </div>

      {/* Body */}
      <div className="kanban-col-body flex-1 overflow-y-auto" style={{ minHeight: 80 }}>
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onClick={onLeadClick} />
        ))}
      </div>

      {/* Add button */}
      <button
        onClick={() => onAddLead?.(id)}
        className="mt-1.5 flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] text-white/35 transition-all hover:bg-white/[0.07] hover:text-white/60"
        style={{ border: '0.5px dashed rgba(255,255,255,0.12)' }}
      >
        <Plus size={12} 