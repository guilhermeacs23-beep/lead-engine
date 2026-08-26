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
    <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', position: 'relative', minHeight: 0 }}>

      {/* ── 1. Header FINO (36px) — sem uppercase agressivo ── */}
      <div style={{
        background: color,
        borderRadius: '8px 8px 0 0',
        padding: '7px 10px',
        display: 'flex', alignItems: 'center', gap: 6,
        minHeight: 36,
      }}>
        <span style={{
          flex: 1, fontSize: 12, fontWeight: 600, color: '#fff',
          letterSpacing: '0.02em',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {title}
        </span>
        <span style={{
          minWidth: 20, height: 20, borderRadius: 10,
          background: 'rgba(0,0,0,0.22)',
          color: '#fff', fontSize: 10, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 5px', flexShrink: 0,
        }}>
          {leads.length}
        </span>
        {!fixed && (
          <>
            <button onClick={openEdit} title="Editar"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.65)', padding: 2, lineHeight: 0, flexShrink: 0 }}>
              <Pencil size={10} strokeWidth={2} />
            </button>
            <button onClick={() => onDelete?.(id)} title="Excluir"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.65)', padding: 2, lineHeight: 0, flexShrink: 0 }}>
              <Trash2 size={10} strokeWidth={2} />
            </button>
          </>
        )}
      </div>

      {/* ── 2. R$0 como PÍLLULA centralizada ── */}
      <div style={{
        display: 'flex', justifyContent: 'center',
        padding: '8px 10px 4px',
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          background: 'rgba(255,255,255,0.18)',
          borderRadius: 20, padding: '3px 14px',
          fontSize: 13, fontWeight: 300, color: '#fff',
          letterSpacing: '-0.3px',
        }}>
          {total > 0
            ? `R$${formatCurrencyShort(total)}`
            : <span>R$<strong style={{ fontWeight: 700 }}>0</strong></span>}
        </span>
      </div>

      {/* ── 3. Botão + DENTRO da coluna, abaixo do pill ── */}
      <div style={{ padding: '4px 10px 6px' }}>
        <button
          onClick={() => onAddLead?.(id)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: index === 0 ? 'flex-start' : 'center',
            gap: 4, padding: '6px 10px',
            background: index === 0 ? 'rgba(255,255,255,0.20)' : 'transparent',
            border: index === 0 ? 'none' : 'none',
            borderRadius: 6, cursor: 'pointer',
            color: '#fff', fontSize: 12, fontWeight: 500,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.28)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = index === 0 ? 'rgba(255,255,255,0.20)' : 'transparent')}
        >
          <Plus size={13} strokeWidth={2.5} />
          {index === 0 ? 'Lead rápido' : ''}
        </button>
      </div>

      {/* ── Área de cards ── */}
      <div
        style={{
          flex: 1, minHeight: 60,
          display: 'flex', flexDirection: 'column', gap: 6,
          overflowY: 'auto', padding: '4px 4px 8px',
          background: isDragOver ? `${color}15` : 'transparent',
          borderLeft: isDragOver ? `2px dashed ${color}80` : '2px solid transparent',
          transition: 'background 0.15s',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {leads.map(lead => (
          <LeadCard key={lead.id} lead={lead} onClick={onLeadClick} color={color} />
        ))}
      </div>

      {/* ── Painel de edição flutuante ── */}
      {editOpen && (
        <div ref={panelRef} style={{
          position: 'absolute', top: 44, left: 0, right: 0, zIndex: 200,
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
