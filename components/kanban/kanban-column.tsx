'use client'
import React, { useState, useRef, useEffect } from 'react'
import { Lead } from '@/types'
import { LeadCard } from './lead-card'
import { formatCurrencyShort } from '@/lib/utils'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { COLOR_PALETTE } from '@/store/ui-store'

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
  onColorChange?: (id: string, color: string) => void
}

export function KanbanColumn({
  id, title, color, fixed, index = 0, leads,
  onAddLead, onLeadClick, onMoveCard, onDelete, onRename, onColorChange
}: KanbanColumnProps) {
  const total = leads.reduce((sum, l) => sum + (l.valor_estimado ?? 0), 0)

  const [isDragOver, setIsDragOver] = useState(false)
  const [editOpen,   setEditOpen]   = useState(false)
  const [editTitle,  setEditTitle]  = useState(title)
  const [editColor,  setEditColor]  = useState(color)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editOpen) return
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setEditOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [editOpen])

  function openEdit() {
    setEditTitle(title)
    setEditColor(color)
    setEditOpen(true)
  }

  function handleSave() {
    if (editTitle.trim()) onRename?.(id, editTitle.trim())
    onColorChange?.(id, editColor)   // sempre aplica — sem comparação que pode falhar
    setEditOpen(false)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setIsDragOver(true)
  }
  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false)
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setIsDragOver(false)
    const leadId = e.dataTransfer.getData('leadId')
    if (leadId) onMoveCard?.(leadId, id)
  }

  return (
    <div className="flex w-[220px] flex-shrink-0 flex-col gap-2">

      {/* ── Wrapper único com overflow hidden — tudo compartilha os cantos ── */}
      <div
        style={{
          borderRadius: 12,
          overflow: 'visible',   // permite painel flutuar fora
          border: isDragOver ? `2px dashed ${color}` : '1px solid rgba(255,255,255,0.09)',
          transition: 'border 0.15s',
          position: 'relative',
        }}
      >
        {/* Header colorido com título dentro */}
        <div
          style={{
            background: color,
            borderRadius: '11px 11px 0 0',
            padding: '14px 12px 14px',
          }}
        >
          {/* Título + ícones */}
          <div className="flex items-center justify-between gap-1.5">
            <span className="flex-1 truncate text-[12px] font-bold text-white uppercase tracking-wide">
              {title}
            </span>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                style={{ background: 'rgba(0,0,0,0.25)' }}>
                {leads.length}
              </span>
              {!fixed && (
                <button onClick={openEdit}
                  className="rounded p-0.5 text-white/60 hover:bg-white/20 hover:text-white transition-all"
                  title="Editar cor / nome">
                  <Pencil size={11} strokeWidth={2} />
                </button>
              )}
              {!fixed && (
                <button onClick={() => onDelete?.(id)}
                  className="rounded p-0.5 text-white/60 hover:bg-white/20 hover:text-red-200 transition-all"
                  title="Excluir etapa">
                  <Trash2 size={11} strokeWidth={2} />
                </button>
              )}
            </div>
          </div>

          {/* Valor — branco puro, centralizado, sem herdar cor */}
          <p style={{
            marginTop: 10,
            fontSize: 20,
            fontWeight: 300,
            color: '#ffffff',
            textAlign: 'center',
            letterSpacing: '-0.4px',
            textShadow: '0 1px 6px rgba(0,0,0,0.3)',
          }}>
            {total > 0
              ? `${formatCurrencyShort(total)}/mês`
              : <span style={{ opacity: 0.35, fontSize: 14 }}>—</span>}
          </p>
        </div>

        {/* Painel de edição flutuante */}
        {editOpen && (
          <div ref={panelRef} style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 100,
            marginTop: 4,
            background: 'rgba(15,12,40,0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 10,
            padding: 14,
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          }}>
            {/* Nome */}
            <p className="mb-1 text-[10px] font-semibold text-white/40 uppercase tracking-wider">Nome da etapa</p>
            <input
              autoFocus
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none mb-3"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)' }}
            />

            {/* Paleta de cores sólidas */}
            <p className="mb-2 text-[10px] font-semibold text-white/40 uppercase tracking-wider">Cor da coluna</p>
            <div className="grid grid-cols-6 gap-2 mb-4">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setEditColor(c)}
                  title={c}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: c,
                    outline: editColor === c ? `3px solid ${c}` : '2px solid transparent',
                    outlineOffset: 2,
                    transform: editColor === c ? 'scale(1.2)' : 'scale(1)',
                    transition: 'all 0.12s ease',
                    boxShadow: editColor === c ? `0 0 10px ${c}88` : 'none',
                  }}
                />
              ))}
            </div>

            {/* Preview da cor selecionada */}
            <div className="mb-3 flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ background: editColor + '22', border: `1px solid ${editColor}44` }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, background: editColor, flexShrink: 0 }} />
              <span className="text-xs text-white/70 font-mono">{editColor}</span>
            </div>

            {/* Botões */}
            <div className="flex gap-2">
              <button onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-white"
                style={{ background: editColor, boxShadow: `0 4px 14px ${editColor}55` }}>
                <Check size={12} strokeWidth={2.5} /> Salvar
              </button>
              <button onClick={() => setEditOpen(false)}
                className="rounded-lg px-3 py-2 text-xs text-white/40 hover:bg-white/10 transition-all">
                <X size={12} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}

        {/* Cards */}
        <div
          className="flex flex-col gap-2 overflow-y-auto p-2"
          style={{
            minHeight: 60,
            borderRadius: '0 0 11px 11px',
            background: isDragOver ? `${color}15` : 'rgba(255,255,255,0.03)',
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

      {/* Adicionar lead */}
      <button onClick={() => onAddLead?.(id)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] text-white/50 transition-all hover:bg-white/[0.07] hover:text-white/80"
        style={{ border: '0.5px dashed rgba(255,255,255,0.15)' }}>
        <Plus size={12} strokeWidth={2} /> Adicionar lead
      </button>
    </div>
  )
}
