'use client'
import React, { useState } from 'react'
import { Lead } from '@/types'
import { LeadCard } from './lead-card'
import { formatCurrencyShort } from '@/lib/utils'
import { Plus, Trash2, Pencil, Check } from 'lucide-react'

interface KanbanColumnProps {
  id: string
  title: string
  color: string
  fixed?: boolean
  index?: number
  leads: Lead[]
  onAddLead?: (status: string) => void
  onLeadClick?: (lead: Lead) => void
  onMoveCard?: (leadId: string, newStatus: string) => void
  onDelete?: (id: string) => void
  onRename?: (id: string, title: string) => void
}

export function KanbanColumn({
  id, title, color, fixed, index = 0, leads,
  onAddLead, onLeadClick, onMoveCard, onDelete, onRename
}: KanbanColumnProps) {
  const total = leads.reduce((sum, l) => sum + (l.valor_estimado ?? 0), 0)
  const [isDragOver, setIsDragOver] = useState(false)
  const [editing, setEditing]       = useState(false)
  const [editTitle, setEditTitle]   = useState(title)

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
    <div className="flex w-[220px] flex-shrink-0 flex-col gap-2">

      {/* ── Coluna inteira como UM bloco unificado ── */}
      <div
        style={{
          borderRadius: 12,
          overflow: 'hidden',
          border: `1px solid rgba(255,255,255,0.10)`,
          outline: isDragOver ? `2px dashed ${color}` : '2px dashed transparent',
          outlineOffset: 2,
          transition: 'outline 0.15s',
        }}
      >
        {/* Barra colorida top */}
        <div style={{ background: color, height: 5 }} />

        {/* Título + valor */}
        <div
          style={{
            background: 'rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            padding: '8px 10px 10px',
          }}
        >
          <div className="flex items-center justify-between gap-1">
            {editing ? (
              <input
                autoFocus
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') saveRename()
                  if (e.key === 'Escape') setEditing(false)
                }}
                className="flex-1 rounded px-1 text-[11px] font-bold text-white bg-white/20 outline-none"
                style={{ minWidth: 0 }}
              />
            ) : (
              <span
                className="flex-1 truncate text-[11px] font-bold text-white/90 uppercase tracking-wide"
                onDoubleClick={() => !fixed && setEditing(true)}
              >
                {title}
              </span>
            )}

            <div className="flex items-center gap-1 flex-shrink-0">
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
                style={{ background: color }}
              >
                {leads.length}
              </span>
              {editing ? (
                <button onClick={saveRename} className="text-white/70 hover:text-white">
                  <Check size={11} strokeWidth={2} />
                </button>
              ) : !fixed ? (
                <>
                  <button onClick={() => { setEditTitle(title); setEditing(true) }}
                    className="text-white/35 hover:text-white/80 transition-colors" title="Renomear">
                    <Pencil size={10} strokeWidth={2} />
                  </button>
                  <button onClick={() => onDelete?.(id)}
                    className="text-white/35 hover:text-red-400 transition-colors" title="Excluir etapa">
                    <Trash2 size={10} strokeWidth={2} />
                  </button>
                </>
              ) : null}
            </div>
          </div>

          <p className="mt-2 text-center"
            style={{ fontSize: 19, fontWeight: 400, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.3px' }}>
            {total > 0
              ? `${formatCurrencyShort(total)}/mês`
              : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>—</span>}
          </p>
        </div>

        {/* Cards */}
        <div
          className="flex flex-col gap-2 overflow-y-auto p-2"
          style={{
            minHeight: 60,
            background: isDragOver ? `${color}12` : 'rgba(255,255,255,0.03)',
            transition: 'background 0.15s',
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={onLeadClick} />
          ))}
        </div>
      </div>

      {/* Adicionar lead — fora do wrapper, abaixo */}
      <button
        onClick={() => onAddLead?.(id)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] text-white/50 transition-all hover:bg-white/[0.07] hover:text-white/80"
        style={{ border: '0.5px dashed rgba(255,255,255,0.15)' }}
      >
        <Plus size={12} strokeWidth={2} />
        Adicionar lead
      </button>
    </div>
  )
}
