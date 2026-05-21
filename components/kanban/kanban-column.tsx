'use client'
import React, { useState, useRef, useEffect } from 'react'
import { Lead } from '@/types'
import { LeadCard } from './lead-card'
import { formatCurrencyShort } from '@/lib/utils'
import { Plus, Trash2, Pencil, Check, X, Palette } from 'lucide-react'
import { GRADIENT_PRESETS } from '@/store/ui-store'

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

/** Extrai o primeiro hex do CSS background (gradient ou solid) */
function firstColor(bg: string): string {
  const m = bg.match(/#[0-9a-fA-F]{3,6}/)
  return m ? m[0] : '#6366f1'
}

export function KanbanColumn({
  id, title, color, fixed, index = 0, leads,
  onAddLead, onLeadClick, onMoveCard, onDelete, onRename, onColorChange
}: KanbanColumnProps) {
  const total = leads.reduce((sum, l) => sum + (l.valor_estimado ?? 0), 0)
  const solid = firstColor(color)

  const [isDragOver, setIsDragOver] = useState(false)
  const [editOpen,   setEditOpen]   = useState(false)
  const [editTitle,  setEditTitle]  = useState(title)
  const [editColor,  setEditColor]  = useState(color)
  const panelRef = useRef<HTMLDivElement>(null)

  // Fecha painel ao clicar fora
  useEffect(() => {
    if (!editOpen) return
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setEditOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [editOpen])

  function handleSave() {
    if (editTitle.trim()) onRename?.(id, editTitle.trim())
    if (editColor !== color) onColorChange?.(id, editColor)
    setEditOpen(false)
  }

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

  return (
    <div className="flex w-[220px] flex-shrink-0 flex-col gap-2">

      {/* ── Wrapper único: header colorido + cards ── */}
      <div
        style={{
          borderRadius: 12,
          overflow: 'hidden',
          border: isDragOver ? `2px dashed ${solid}` : '1px solid rgba(255,255,255,0.09)',
          transition: 'border 0.15s',
        }}
      >
        {/* Header colorido alto — título DENTRO da cor */}
        <div style={{ background: color, position: 'relative' }}>
          <div style={{ padding: '14px 12px 12px' }}>
            {/* Linha título + ações */}
            <div className="flex items-center justify-between gap-1.5">
              <span className="flex-1 truncate text-[12px] font-bold text-white uppercase tracking-wide drop-shadow-sm">
                {title}
              </span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                  style={{ background: 'rgba(0,0,0,0.22)' }}
                >
                  {leads.length}
                </span>
                {!fixed && (
                  <button
                    onClick={() => { setEditTitle(title); setEditColor(color); setEditOpen(v => !v) }}
                    className="rounded p-0.5 text-white/60 hover:bg-white/20 hover:text-white transition-all"
                    title="Editar etapa"
                  >
                    <Pencil size={11} strokeWidth={2} />
                  </button>
                )}
                {!fixed && (
                  <button
                    onClick={() => onDelete?.(id)}
                    className="rounded p-0.5 text-white/60 hover:bg-white/20 hover:text-red-300 transition-all"
                    title="Excluir etapa"
                  >
                    <Trash2 size={11} strokeWidth={2} />
                  </button>
                )}
              </div>
            </div>

            {/* Valor monetário — branco, sem fundo extra */}
            <p
              className="mt-2"
              style={{
                fontSize: 20,
                fontWeight: 300,
                color: 'rgba(255,255,255,0.95)',
                letterSpacing: '-0.4px',
                textShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }}
            >
              {total > 0
                ? `${formatCurrencyShort(total)}/mês`
                : <span style={{ opacity: 0.4, fontSize: 14 }}>—</span>}
            </p>
          </div>

          {/* Painel de edição — abre abaixo do header, dentro do colored bg */}
          {editOpen && (
            <div
              ref={panelRef}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 50,
                background: 'rgba(15,15,35,0.97)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '0 0 10px 10px',
                padding: 12,
                boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
              }}
            >
              {/* Input de nome */}
              <p className="mb-1.5 text-[10px] font-medium text-white/50 uppercase tracking-wide">Nome</p>
              <input
                autoFocus
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
                className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none mb-3"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
              />

              {/* Paleta de gradientes */}
              <p className="mb-2 text-[10px] font-medium text-white/50 uppercase tracking-wide flex items-center gap-1">
                <Palette size={10} />Cor / Gradiente
              </p>
              <div className="grid grid-cols-6 gap-1.5 mb-3">
                {GRADIENT_PRESETS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setEditColor(g)}
                    title={g}
                    style={{
                      height: 28,
                      borderRadius: 6,
                      background: g,
                      outline: editColor === g ? '2px solid white' : '2px solid transparent',
                      outlineOffset: 1,
                      transition: 'outline 0.1s, transform 0.1s',
                      transform: editColor === g ? 'scale(1.1)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>

              {/* Botões */}
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: editColor }}
                >
                  <Check size={12} strokeWidth={2.5} />
                  Salvar
                </button>
                <button
                  onClick={() => setEditOpen(false)}
                  className="rounded-lg px-3 py-2 text-xs text-white/50 hover:bg-white/10 transition-all"
                >
                  <X size={12} strokeWidth={2} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Cards */}
        <div
          className="flex flex-col gap-2 overflow-y-auto p-2"
          style={{
            minHeight: 60,
            background: isDragOver ? `${solid}12` : 'rgba(255,255,255,0.03)',
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
