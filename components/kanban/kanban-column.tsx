'use client'
import React, { useState } from 'react'
import { Lead, LeadStatus } from '@/types'
import { LeadCard } from './lead-card'
import { formatCurrencyShort } from '@/lib/utils'
import { Plus, Trash2, Pencil, Check } from 'lucide-react'

interface KanbanColumnProps {
  id: string
  title: string
  color: string
  fixed?: boolean
  leads: Lead[]
  onAddLead?: (status: string) => void
  onLeadClick?: (lead: Lead) => void
  onMoveCard?: (leadId: string, newStatus: string) => void
  onDelete?: (id: string) => void
  onRename?: (id: string, title: string) => void
}

export function KanbanColumn({
  id, title, color, fixed, leads, onAddLead, onLeadClick, onMoveCard, onDelete, onRename
}: KanbanColumnProps) {
  const total = leads.reduce((sum, l) => sum + (l.valor_estimado ?? 0), 0)
  const [isDragOver, setIsDragOver] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(title)

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }
  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false)
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const leadId = e.dataTransfer.getData('leadId')
    if (leadId) onMoveCard?.(leadId, id)
  }
  function saveRename() {
    if (editTitle.trim()) onRename?.(id, editTitle.trim())
    setEditing(false)
  }

  return (
    <div className="flex w-[210px] flex-shrink-0 flex-col">

      {/* ── Faixa colorida estreita (Bitrix style) ── */}
      <div
        style={{
          background: color,
          borderRadius: '10px 10px 0 0',
          padding: '5px 10px',
        }}
      >
        <div className="flex items-center justify-between gap-1 min-h-[20px]">
          {editing ? (
            <input
              autoFocus
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setEditing(false) }}
              className="flex-1 rounded px-1 text-[11px] font-semibold text-white bg-white/20 outline-none placeholder:text-white/50"
              style={{ minWidth: 0 }}
            />
          ) : (
            <span
              className="flex-1 truncate text-[11px] font-bold text-white uppercase tracking-wide leading-tight"
              onDoubleClick={() => !fixed && setEditing(true)}
            >
              {title}
            </span>
          )}

          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white bg-black/20">
              {leads.length}
            </span>
            {editing ? (
              <button onClick={saveRename} className="text-white/80 hover:text-white">
                <Check size={11} strokeWidth={2} />
              </button>
            ) : !fixed ? (
              <>
                <button
                  onClick={() => { setEditTitle(title); setEditing(true) }}
                  className="text-white/70 hover:text-white transition-colors"
                  title="Renomear"
                >
                  <Pencil size={10} strokeWidth={2} />
                </button>
                <button
                  onClick={() => onDelete?.(id)}
                  className="text-white/70 hover:text-white transition-colors"
                  title="Excluir etapa"
                >
                  <Trash2 size={10} strokeWidth={2} />
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Sub-header: valor em destaque, sem fundo pintado ── */}
      <div
        style={{
          background: 'rgba(255,255,255,0.05)',
          borderLeft: '0.5px solid rgba(255,255,255,0.08)',
          borderRight: '0.5px solid rgba(255,255,255,0.08)',
          padding: '8px 12px 6px',
        }}
      >
        <p className="text-[15px] font-semibold text-white leading-tight">
          {total > 0 ? `${formatCurrencyShort(total)}/mês` : <span className="text-white/35 text-[13px]">—</span>}
        </p>
      </div>

      {/* ── Drop zone / cards ── */}
      <div
        className="kanban-col-body flex-1 overflow-y-auto transition-all duration-150"
        style={{
          minHeight: 80,
          outline: isDragOver ? `2px dashed ${color}` : '2px dashed transparent',
          outlineOffset: '-3px',
          borderRadius: '0 0 10px 10px',
          background: isDragOver ? `${color}15` : undefined,
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onClick={onLeadClick} />
        ))}
      </div>

      {/* ── Adicionar lead ── */}
      <button
        onClick={() => onAddLead?.(id)}
        className="mt-1.5 flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] text-white/50 transition-all hover:bg-white/[0.07] hover:text-white/80"
        style={{ border: '0.5px dashed rgba(255,255,255,0.15)' }}
      >
        <Plus size={12} strokeWidth={2} />
        Adicionar lead
      </button>
    </div>
  )
}
