'use client'
import React, { useState, useRef, useEffect } from 'react'
import { Lead } from '@/types'
import { LeadCard } from './lead-card'
import { formatCurrencyShort } from '@/lib/utils'
import { Plus, Pencil, Check, X } from 'lucide-react'

// Bitrix-style full color palette (9 rows × 10 cols)
const BITRIX_PALETTE = [
  '#9BE0E0','#9BD4E0','#9BC8E0','#9BBCE0','#9BB0E0','#9BA4E0','#B09BE0','#C49BE0','#D89BE0','#EAB0D8',
  '#4DC9C9','#4DBDCE','#4DB1D4','#4DA5DA','#4D99E0','#7B7DE0','#A07DE0','#C47DE0','#E07DB0','#E07D8C',
  '#00BCD4','#03A9F4','#2196F3','#3F51B5','#673AB7','#9C27B0','#E91E63','#F44336','#FF5722','#FF9800',
  '#00E5FF','#00B0FF','#2979FF','#3D5AFE','#651FFF','#D500F9','#FF1744','#FF3D00','#FF6D00','#FFAB00',
  '#00BFA5','#00C853','#64DD17','#AEEA00','#FFD600','#FFAB40','#FF6E40','#E53935','#D81B60','#8D6E63',
  '#00897B','#43A047','#7CB342','#C0CA33','#FDD835','#FFB300','#FB8C00','#F4511E','#C62828','#AD1457',
  '#00695C','#2E7D32','#558B2F','#9E9D24','#F9A825','#FF8F00','#E65100','#B71C1C','#880E4F','#4A148C',
  '#607D8B','#546E7A','#455A64','#37474F','#263238','#212121','#424242','#616161','#9E9E9E','#BDBDBD',
  '#B0BEC5','#CFD8DC','#ECEFF1','#F5F5F5','#FAFAFA','#FFFFFF','#1A237E','#0D47A1','#01579B','#006064',
]

interface KanbanColumnProps {
  id: string; title: string; color: string; fixed?: boolean; index?: number
  leads: Lead[]
  onAddLead?: (status: string) => void
  onLeadClick?: (lead: Lead) => void
  onMoveCard?: (leadId: string, newStatus: string) => void
  onDelete?: (id: string) => void
  onRename?: (id: string, title: string) => void
  onColorChange?: (id: string, color: string) => void
  onAddColumnAfter?: (afterId: string) => void
}

export function KanbanColumn({
  id, title, color, fixed, index = 0, leads,
  onAddLead, onLeadClick, onMoveCard, onDelete, onRename, onColorChange, onAddColumnAfter
}: KanbanColumnProps) {
  const total = leads.reduce((sum, l) => sum + (l.valor_estimado ?? 0), 0)
  const [isDragOver,  setIsDragOver]  = useState(false)
  const [editOpen,    setEditOpen]    = useState(false)
  const [editTitle,   setEditTitle]   = useState(title)
  const [editColor,   setEditColor]   = useState(color)
  const [hdrHover,    setHdrHover]    = useState(false)
  const [customColor, setCustomColor] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editOpen) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setEditOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [editOpen])

  function openEdit() { setEditTitle(title); setEditColor(color); setCustomColor(''); setEditOpen(true) }
  function handleSave() {
    const finalColor = customColor.match(/^#[0-9a-fA-F]{6}$/) ? customColor : editColor
    if (editTitle.trim()) onRename?.(id, editTitle.trim())
    onColorChange?.(id, finalColor)
    setEditOpen(false)
  }
  function handleDragOver(e: React.DragEvent) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setIsDragOver(true) }
  function handleDragLeave(e: React.DragEvent) { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false) }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setIsDragOver(false)
    const leadId = e.dataTransfer.getData('leadId')
    if (leadId) onMoveCard?.(leadId, id)
  }

  const previewColor = customColor.match(/^#[0-9a-fA-F]{6}$/) ? customColor : editColor

  return (
    <div className="flex w-[240px] flex-shrink-0 flex-col" style={{ position: 'relative', borderLeft: '2px dashed rgba(255,255,255,0.30)', paddingLeft: '0px' }}>

      {/* ── Header colorido estilo Bitrix ── */}
      <div
        onMouseEnter={() => setHdrHover(true)}
        onMouseLeave={() => { setHdrHover(false) }}
        style={{
          background: color,
          borderRadius: editOpen ? '10px 10px 0 0' : '10px 10px 0 0',
          padding: '9px 10px',
          position: 'relative',
          transition: 'filter 0.15s',
          filter: hdrHover ? 'brightness(1.08)' : 'brightness(1)',
        }}
      >
        <div className="flex items-center gap-2">
          {/* Título + count */}
          {editOpen ? (
            <input autoFocus value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
              className="flex-1 rounded px-2 py-0.5 text-[13px] font-bold text-white outline-none"
              style={{ background: 'rgba(0,0,0,0.25)', border: '1.5px solid rgba(255,255,255,0.5)' }}
            />
          ) : (
            <span className="flex-1 truncate text-[13px] font-bold text-white uppercase tracking-wide drop-shadow">
              {title}
            </span>
          )}

          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
              style={{ background: 'rgba(0,0,0,0.28)' }}>
              {leads.length}
            </span>

            {/* Botão lápis — aparece no hover OU quando editando */}
            {!fixed && (hdrHover || editOpen) && (
              <button
                onClick={editOpen ? handleSave : openEdit}
                className="rounded p-1 text-white/80 hover:bg-white/25 hover:text-white transition-all"
                title={editOpen ? 'Salvar' : 'Editar nome/cor'}
              >
                {editOpen ? <Check size={12} strokeWidth={2.5} /> : <Pencil size={12} strokeWidth={2} />}
              </button>
            )}
            {editOpen && (
              <button onClick={() => setEditOpen(false)}
                className="rounded p-1 text-white/60 hover:bg-white/20 hover:text-white transition-all">
                <X size={12} strokeWidth={2} />
              </button>
            )}

            {/* + para adicionar nova coluna APÓS esta — aparece no hover */}
            {!editOpen && hdrHover && (
              <button
                onClick={() => onAddColumnAfter?.(id)}
                className="rounded p-1 text-white/80 hover:bg-white/25 hover:text-white transition-all"
                title="Adicionar etapa após esta"
              >
                <Plus size={12} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Color picker estilo Bitrix (aparece ao editar) ── */}
      {editOpen && (
        <div ref={panelRef} style={{
          position: 'absolute', top: 44, left: 0, zIndex: 200, width: 260,
          background: '#fff',
          border: '1px solid #d0d7de',
          borderRadius: '0 0 10px 10px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          padding: '10px',
        }}>
          {/* Grid de cores */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10,1fr)', gap: 3, marginBottom: 8 }}>
            {BITRIX_PALETTE.map((c) => (
              <button key={c} onClick={() => { setEditColor(c); setCustomColor('') }}
                style={{
                  width: 20, height: 20, borderRadius: 3, background: c, border: 'none',
                  cursor: 'pointer',
                  outline: editColor === c && !customColor ? '2.5px solid #333' : '1px solid rgba(0,0,0,0.08)',
                  outlineOffset: 1,
                  transform: editColor === c && !customColor ? 'scale(1.2)' : 'scale(1)',
                  transition: 'all 0.1s',
                }}
              />
            ))}
          </div>

          {/* Preview + custom color input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid #eee', paddingTop: 8 }}>
            <div style={{
              width: 36, height: 24, borderRadius: 4, background: previewColor,
              border: '1px solid #d0d7de', flexShrink: 0,
            }} />
            <input
              value={customColor}
              onChange={e => setCustomColor(e.target.value)}
              placeholder="Cor personalizada"
              className="flex-1 text-[12px] text-gray-600 outline-none"
              style={{ border: 'none', background: 'transparent' }}
              maxLength={7}
            />
            <button onClick={handleSave}
              className="rounded px-3 py-1 text-[12px] font-semibold text-white"
              style={{ background: previewColor, border: 'none', cursor: 'pointer', flexShrink: 0 }}>
              OK
            </button>
          </div>
        </div>
      )}

      {/* ── Valor monetário ── */}
      <div style={{
        background: 'rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '10px 12px 12px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 20, fontWeight: 300, color: '#ffffff', letterSpacing: '-0.5px' }}>
          {total > 0
            ? `${formatCurrencyShort(total)}/mês`
            : <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>R$0</span>}
        </p>
      </div>

      {/* ── Cards ── */}
      <div
        className="flex flex-col gap-2 overflow-y-auto p-2"
        style={{
          minHeight: 60,
          background: isDragOver ? `${color}18` : 'rgba(255,255,255,0.025)',
          transition: 'background 0.15s',
          border: isDragOver ? `2px dashed ${color}` : '1px solid rgba(255,255,255,0.08)',
          borderTop: 'none',
          borderBottom: 'none',
        }}
        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
      >
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onClick={onLeadClick} />
        ))}
      </div>

      {/* ── + Adicionar lead — DENTRO da coluna, abaixo do último card ── */}
      <button onClick={() => onAddLead?.(id)}
        className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all"
        style={{
          border: '1px solid rgba(255,255,255,0.22)',
          borderTop: 'none',
          borderRadius: '0 0 10px 10px',
          background: 'rgba(255,255,255,0.10)',
          color: 'rgba(255,255,255,0.90)',
          letterSpacing: '0.02em',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.18)'
          e.currentTarget.style.color = '#ffffff'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.10)'
          e.currentTarget.style.color = 'rgba(255,255,255,0.90)'
        }}
      >
        <Plus size={13} strokeWidth={2.5} />
        + Adicionar
      </button>
    </div>
  )
}
