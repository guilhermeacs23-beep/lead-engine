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
        boxShadow: '0 1px 5px rgba(0,0,0,0.10)',
        border: '1px solid rgba(0,0,0,0.07)',
        borderLeft: `3px solid ${color}`,
        padding: '10px 8px 8px 11px',
        cursor: 'grab',
        display: 'flex',
        gap: 6,
        alignItems: 'flex-start',
        transition: 'box-shadow 0.15s, transform 0.1s',
        position: 'relative',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(0,0,0,0.14)'
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 5px rgba(0,0,0,0.10)'
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
      }}
    >
      {/* ── Conteúdo principal ── */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* 6. Nome — peso normal (não bold gritante) */}
        <p style={{ fontSize: 13, fontWeight: 500, color: '#111827', lineHeight: 1.35, marginBottom: 3 }}>
          {lead.empresa}
        </p>

        {/* Contato como link azul (estilo Bitrix) */}
        {lead.contato_nome && (
          <p style={{ fontSize: 11, color: '#6366f1', fontWeight: 400, marginBottom: 7, lineHeight: 1.3 }}>
            {lead.contato_nome}
            {lead.contato_cargo ? ` · ${lead.contato_cargo}` : ''}
          </p>
        )}

        {/* Valor */}
        {lead.valor_estimado && (
          <p style={{ fontSize: 12, fontWeight: 600, color: valueColor, marginBottom: 7 }}>
            {formatCurrencyShort(lead.valor_estimado)}/mês
          </p>
        )}

        {/* Tags pequenas */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 8 }}>
          <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: '#f3f4f6', color: '#6b7280' }}>
            {segment}
          </span>
          {source && (
            <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, color: source.color, background: source.bg }}>
              {source.label}
            </span>
          )}
          <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, color: score.color, background: score.bg, marginLeft: 'auto', fontWeight: 600 }}>
            {lead.score_ia}
          </span>
        </div>

        {/* + Atividade */}
        <button
          onClick={e => { e.stopPropagation(); onClick?.(lead) }}
          style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 11, color: '#b0b8c8', fontWeight: 400,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            transition: 'color 0.12s',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#6366f1')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#b0b8c8')}
        >
          <Plus size={10} strokeWidth={2.5} /> Atividade
        </button>
      </div>

      {/* ── 4. Ícones SEM fundo — só traço cinza (estilo Bitrix) ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, paddingTop: 2 }}>
        <GhostIcon
          href={lead.telefone ? `tel:${lead.telefone}` : undefined}
          title={lead.telefone || 'Sem telefone'}
          disabled={!lead.telefone}
          hoverColor="#2563eb"
        >
          <Phone size={13} strokeWidth={1.6} />
        </GhostIcon>
        <GhostIcon
          href={lead.email ? `mailto:${lead.email}` : undefined}
          title={lead.email || 'Sem e-mail'}
          disabled={!lead.email}
          hoverColor="#059669"
        >
          <Mail size={13} strokeWidth={1.6} />
        </GhostIcon>
        <GhostIcon
          onClick={e => { e.stopPropagation(); onClick?.(lead) }}
          title="Notas"
          hoverColor="#7c3aed"
        >
          <MessageSquare size={13} strokeWidth={1.6} />
        </GhostIcon>
      </div>
    </div>
  )
}

// ── Ícone "fantasma" sem fundo — apenas cor no hover ────────────
function GhostIcon({
  children, href, title, disabled, hoverColor, onClick,
}: {
  children: React.ReactNode
  href?: string
  title?: string
  disabled?: boolean
  hoverColor: string
  onClick?: (e: React.MouseEvent) => void
}) {
  const base: React.CSSProperties = {
    width: 22, height: 22,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'transparent',
    color: disabled ? '#dde3ed' : '#c2cad8',
    border: 'none', cursor: disabled ? 'default' : 'pointer',
    borderRadius: 4,
    transition: 'color 0.12s',
    textDecoration: 'none', flexShrink: 0, padding: 0,
  }
  const enter = (e: React.MouseEvent<HTMLElement>) => {
    if (!disabled) (e.currentTarget as HTMLElement).style.color = hoverColor
  }
  const leave = (e: React.MouseEvent<HTMLElement>) => {
    (e.currentTarget as HTMLElement).style.color = disabled ? '#dde3ed' : '#c2cad8'
  }

  if (href && !disabled) {
    return (
      <a href={href} title={title} style={base}
        onClick={ev => ev.stopPropagation()}
        onMouseEnter={enter} onMouseLeave={leave}>
        {children}
      </a>
    )
  }
  return (
    <button title={title} style={base} disabled={disabled}
      onClick={onClick} onMouseEnter={enter} onMouseLeave={leave}>
      {children}
    </button>
  )
}
