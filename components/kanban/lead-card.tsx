'use client'
import { Lead } from '@/types'
import { formatCurrencyShort, getScoreColor } from '@/lib/utils'
import { SOURCE_LABELS, SEGMENT_LABELS } from '@/lib/mock-data'
import { Mail, Clock } from 'lucide-react'

interface LeadCardProps {
  lead: Lead
  onClick?: (lead: Lead) => void
}

const STATUS_GRADIENT: Record<string, string> = {
  novo:       'linear-gradient(90deg, #6366f1, #a78bfa)',
  contactado: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
  proposta:   'linear-gradient(90deg, #f59e0b, #fbbf24)',
  negociando: 'linear-gradient(90deg, #ec4899, #f472b6)',
  fechado:    'linear-gradient(90deg, #10b981, #34d399)',
  perdido:    'linear-gradient(90deg, #ef4444, #f87171)',
}

const STATUS_VALUE_COLOR: Record<string, string> = {
  novo:       '#6366f1',
  contactado: '#3b82f6',
  proposta:   '#f59e0b',
  negociando: '#ec4899',
  fechado:    '#10b981',
  perdido:    '#ef4444',
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const score  = getScoreColor(lead.score_ia)
  const source = SOURCE_LABELS[lead.fonte]
  const segment = SEGMENT_LABELS[lead.segmento] ?? lead.segmento
  const labelGradient = STATUS_GRADIENT[lead.status] ?? 'linear-gradient(90deg,#94a3b8,#cbd5e1)'
  const valueColor    = STATUS_VALUE_COLOR[lead.status] ?? '#6366f1'

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
      className="lead-card group cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onClick?.(lead)}
    >
      {/* Colored top strip */}
      <div className="mb-2.5 h-[3px] w-3/5 rounded-full" style={{ background: labelGradient }} />

      {/* Company name */}
      <p className="text-[12px] font-semibold leading-tight text-slate-800">{lead.empresa}</p>
      <p className="mt-0.5 mb-2.5 text-[10px] text-slate-400">
        {lead.contato_nome} · {lead.contato_cargo}
      </p>

      {/* Value */}
      {lead.valor_estimado && (
        <p className="mb-2 text-[13px] font-semibold" style={{ color: valueColor }}>
          {formatCurrencyShort(lead.valor_estimado)}/mês
        </p>
      )}

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-1">
        <span className="tag">{segment}</span>
        {source && (
          <span className="tag" style={{ color: source.color, borderColor: `${source.color}40`, background: source.bg }}>
            {source.label}
          </span>
        )}
        <span className="score-badge ml-auto" style={{ color: score.color, background: score.bg }}>
          {lead.score_ia}
        </span>
      </div>

      {/* Footer */}
      <div className="mt-2.5 flex items-center gap-2 border-t pt-2" style={{ borderColor: '#f1f5f9' }}>
        <span className="flex items-center gap-1 text-[10px] text-slate-400">
          <Mail size={11} strokeWidth={1.5} />
          {Math.floor(Math.random() * 8) + 1}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-slate-400">
          <Clock size={11} strokeWidth={1.5} />
          {Math.floor(Math.random() * 5) + 1}d
        </span>
      </div>
    </div>
  )
}
