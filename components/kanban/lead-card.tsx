'use client'
import { Lead } from '@/types'
import { formatCurrencyShort, getScoreColor } from '@/lib/utils'
import { SOURCE_LABELS, SEGMENT_LABELS } from '@/lib/mock-data'
import { Phone, Mail, MessageSquare, Plus } from 'lucide-react'

interface LeadCardProps {
  lead: Lead
  onClick?: (lead: Lead) => void
  color?: string
}

const STATUS_VALUE_COLOR: Record<string, string> = {
  novo:       '#5b5fc7',
  contactado: '#2563eb',
  proposta:   '#d97706',
  negociando: '#db2777',
  fechado:    '#059669',
  perdido:    '#dc2626',
}

export function LeadCard({ lead, onClick, color = '#818cf8' }: LeadCardProps) {
  const score      = getScoreColor(lead.score_ia)
  const source     = SOURCE_LABELS[lead.fonte]
  const segment    = SEGMENT_LABELS[lead.segmento] ?? lead.segmento
  const valueColor = STATUS_VALUE_COLOR[lead.status] ?? '#5b5fc7'

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('leadId', lead.id)
    e.dataTransfer.effectAllowed = 'move'
    setTimeout(() => { (e.target as HTMLElement).style.opacity = '0.4' }, 0)
  }
  function handleDragEnd(e: React.DragEvent) {
    (e.target as HTMLElement).style.opacity = '1'
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onClick?.(lead)}
      style={{
        background: '#ffffff',
        borderRadius: 8,
        boxShadow: '0 1px 6px rgba(0,0,0,0.10)',
        border: '1px solid #e5e7eb',
        padding: '10px 8px 10px 12px',
        cursor: 'grab',
        display: 'flex', gap: 8, alignItems: 'flex-start',
        transition: 'box-shadow 0.15s, transform 0.1s',
        margin: '0 4px',
        position: 'relative',
        borderLeft: `3px solid ${color}`,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.14)'
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 6px rgba(0,0,0,0.10)'
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
      }}
    >
      {/* Conteúdo principal */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Empresa */}
        <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', lineHeight: 1.3, marginBottom: 2 }}>
          {lead.empresa}
        </p>

        {/* Contato */}
        {lead.contato_nome && (
          <p style={{ fontSize: 11, color: '#6366f1', fontWeight: 500, marginBottom: 6 }}>
            {lead.contato_nome}
            {lead.contato_cargo ? ` · ${lead.contato_cargo}` : ''}
          </p>
        )}

        {/* Valor estimado */}
        {lead.valor_estimado && (
          <p style={{ fontSize: 12, fontWeight: 700, color: valueColor, marginBottom: 6 }}>
            {formatCurrencyShort(lead.valor_estimado)}/mês
          </p>
        )}

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          <span style={{
            fontSize: 10, padding: '1px 6px', borderRadius: 4,
            background: '#f3f4f6', color: '#6b7280', fontWeight: 500,
          }}>
            {segment}
          </span>
          {source && (
            <span style={{
              fontSize: 10, padding: '1px 6px', borderRadius: 4, fontWeight: 500,
              color: source.color, background: source.bg,
            }}>
              {source.label}
            </span>
          )}
          <span style={{
            fontSize: 10, padding: '1px 6px', borderRadius: 4, fontWeight: 700, marginLeft: 'auto',
            color: score.color, background: score.bg,
          }}>
            {lead.score_ia}
          </span>
        </div>

        {/* Botão + Atividade */}
        <button
          onClick={e => { e.stopPropagation(); onClick?.(lead) }}
          style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 11, color: '#9ca3af', fontWeight: 500,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#6366f1')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#9ca3af')}
        >
          <Plus size={10} strokeWidth={2.5} /> Atividade
        </button>
      </div>

      {/* ── Ícones de contato empilhados na direita (estilo Bitrix) ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
        <ActionIcon
          href={lead.telefone ? `tel:${lead.telefone}` : undefined}
          title={lead.telefone || 'Sem telefone'}
          disabled={!lead.telefone}
          hoverColor="#2563eb"
          hoverBg="#dbeafe"
        >
          <Phone size={12} strokeWidth={1.8} />
        </ActionIcon>
        <ActionIcon
          href={lead.email ? `mailto:${lead.email}` : undefined}
          title={lead.email || 'Sem e-mail'}
          disabled={!lead.email}
          hoverColor="#059669"
          hoverBg="#d1fae5"
        >
          <Mail size={12} strokeWidth={1.8} />
        </ActionIcon>
        <ActionIcon
          onClick={e => { e.stopPropagation(); onClick?.(lead) }}
          title="Abrir notas"
          hoverColor="#7c3aed"
          hoverBg="#ede9fe"
        >
          <MessageSquare size={12} strokeWidth={1.8} />
        </ActionIcon>
      </div>
    </div>
  )
}

// ── Helper: ícone de ação ──────────────────────────────────────
function ActionIcon({
  children, href, title, disabled, hoverColor, hoverBg, onClick,
}: {
  children: React.ReactNode
  href?: string
  title?: string
  disabled?: boolean
  hoverColor: string
  hoverBg: string
  onClick?: (e: React.MouseEvent) => void
}) {
  const base: React.CSSProperties = {
    width: 26, height: 26, borderRadius: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#f3f4f6', color: disabled ? '#d1d5db' : '#9ca3af',
    border: 'none', cursor: disabled ? 'default' : 'pointer',
    transition: 'background 0.12s, color 0.12s',
    textDecoration: 'none', flexShrink: 0,
  }

  const handleEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled) return
    const el = e.currentTarget as HTMLElement
    el.style.background = hoverBg
    el.style.color = hoverColor
  }
  const handleLeave = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget as HTMLElement
    el.style.background = '#f3f4f6'
    el.style.color = disabled ? '#d1d5db' : '#9ca3af'
  }

  if (href && !disabled) {
    return (
      <a href={href} title={title} style={base}
        onClick={ev => ev.stopPropagation()}
        onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
        {children}
      </a>
    )
  }

  return (
    <button title={title} style={base} disabled={disabled}
      onClick={onClick}
      onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
    </button>
  )
}
