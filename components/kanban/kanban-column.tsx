'use client'
import React, { useState, useRef, useEffect } from 'react'
import { Lead } from '@/types'
import { LeadCard } from './lead-card'
import { formatCurrencyShort } from '@/lib/utils'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { COLOR_PALETTE } from '@/store/ui-store'

interface KanbanColumnProps {
  id: string; title: string; color: string; fixed?: boolean; index?: number
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
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setEditOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [editOpen])

  function openEdit() { setEditTitle(title); setEditColor(color); setEditOpen(true) }
  function handleSave() {
    if (editTitle.trim()) onRename?.(id, editTitle.trim())
    onColorChange?.(id, editColor)
    setEditOpen(false)
  }
  function handleDragOver(e: React.DragEvent) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setIsDragOver(true) }
  function handleDragLeave(e: React.DragEvent) { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false) }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setIsDragOver(false)
    const leadId = e.dataTransfer.getData('leadId')
    if (leadId) onMoveCard?.(leadId, id)
  }

  return (
    <div
      className="flex flex-shrink-0 flex-col"
      style={{ width: 240, position: 'relative', minHeight: 0 }}
    >
      {/* ── Header compacto estilo Bitrix ── */}
      <div style={{
        background: color,
        borderRadius: '10px 10px 0 0',
        padding: '8px 10px',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{
          flex: 1, fontSize: 13, fontWeight: 700, color: '#fff',
          textTransform: 'uppercase', letterSpacing: '0.04em',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {title}
        </span>

        {/* Contador */}
        <span style={{
          minWidth: 22, height: 22, borderRadius: 11,
          background: 'rgba(0,0,0,0.25)',
          color: '#fff', fontSize: 11, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 6px',
        }}>
          {leads.length}
        </span>

        {!fixed && (
          <>
            <button onClick={openEdit}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: 2, lineHeight: 0 }}
              title="Editar">
              <Pencil size={11} strokeWidth={2} />
            </button>
            <button onClick={() => onDelete?.(id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: 2, lineHeight: 0 }}
              title="Excluir">
              <Trash2 size={11} strokeWidth={2} />
            </button>
          </>
        )}
      </div>

      {/* ── Linha de valor (estilo Bitrix: R$X em cinza) ── */}
      <div style={{
        background: 'rgba(255,255,255,0.85)',
        borderLeft: `3px solid ${color}`,
        padding: '6px 10px',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ fontSize: 13, fontWeight: 300, color: '#6b7280', letterSpacing: '-0.3px' }}>
          {total > 0 ? `R$ ${formatCurrencyShort(total)}/mês` : <span style={{ color: '#d1d5db' }}>R$0</span>}
        </span>
      </div>

      {/* ── Área de cards (drop zone) ── */}
      <div
        className="flex flex-col gap-2 overflow-y-auto"
        style={{
          flex: 1, minHeight: 60, padding: '6px 0',
          background: isDragOver ? `${color}12` : 'transparent',
          borderLeft: isDragOver ? `2px dashed ${color}` : '2px solid transparent',
          transition: 'background 0.15s, border 0.15s',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {leads.map(lead => (
          <LeadCard key={lead.id} lead={lead} onClick={onLeadClick} color={color} />
        ))}
      </div>

      {/* ── Botão adicionar (estilo Bitrix: + Adicionar) ── */}
      <button
        onClick={() => onAddLead?.(id)}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '7px 10px',
          background: 'rgba(255,255,255,0.75)',
          border: 'none', borderTop: '1px solid rgba(0,0,0,0.06)',
          borderRadius: '0 0 8px 8px',
          cursor: 'pointer', color: '#6b7280', fontSize: 12, fontWeight: 500,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.95)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.75)')}
      >
        <Plus size={13} strokeWidth={2.5} style={{ color }} />
        Adicionar lead
      </button>

      {/* ── Painel de edição flutuante ── */}
      {editOpen && (
        <div ref={panelRef} style={{
          position: 'absolute', top: 52, left: 0, right: 0, zIndex: 100,
          background: '#1e1b4b', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: 14,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}>
          <p style={{ marginBottom: 4, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nome da etapa</p>
          <input autoFocus value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
            style={{ width: '100%', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff', marginBottom: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', outline: 'none', boxSizing: 'border-box' }}
          />
          <p style={{ marginBottom: 8, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cor</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 12 }}>
            {COLOR_PALETTE.map(c => (
              <button key={c} onClick={() => setEditColor(c)} style={{
                width: 30, height: 30, borderRadius: '50%', background: c,
                outline: editColor === c ? `3px solid ${c}` : '2px solid transparent',
                outlineOffset: 2, transform: editColor === c ? 'scale(1.2)' : 'scale(1)',
                transition: 'all 0.12s', border: 'none', cursor: 'pointer',
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSave} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              borderRadius: 8, padding: '8px', fontSize: 13, fontWeight: 700, color: '#fff',
              background: editColor, border: 'none', cursor: 'pointer',
            }}>
              <Check size={13} strokeWidth={2.5} /> Salvar
            </button>
            <button onClick={() => setEditOpen(false)} style={{
              borderRadius: 8, padding: '8px 12px', color: 'rgba(255,255,255,0.4)',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer',
            }}>
              <X size={13} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
