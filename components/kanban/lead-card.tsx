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
  novo:       '#5b5fc7',
  contactado: '#2563eb',
  proposta:   '#d97706',
  negociando: '#db2777',
  fechado:    '#059669',
  perdido:    '#dc2626',
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const score        = getScoreColor(lead.score_ia)
  const source       = SOURCE_LABELS[lead.fonte]
  const segment      = SEGMENT_LABELS[lead.segmento] ?? lead.segmento
  const labelGradient = STATUS_GRADIENT[lead.status] ?? 'linear-gradient(90deg,#94a3b8,#cbd5e1)'
  const valueColor   = STATUS_VALUE_COLOR[lead.status] ?? '#5b5fc7'

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
      {/* Barra colorida de status */}
      <div className="mb-3 h-[3px] w-3/5 rounded-full" style={{ background: labelGradient }} />

      {/* Nome da empresa */}
      <p className="text-[14px] font-bold leading-tight text-slate-800">{lead.empresa}</p>
      <p className="mt-1 mb-3 text-[12px] font-medium text-slate-500">
        {lead.contato_nome} · {lead.contato_cargo}
      </p>

      {/* Valor estimado */}
      {lead.valor_estimado && (
        <p className="mb-2.5 text-[14px] font-bold" style={{ color: valueColor }}>
          {formatCurrencyShort(lead.valor_estimado)}/mês
        </p>
      )}

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="tag">{segment}</span>
        {source && (
          <span className="tag" style={{ color: source.color, borderColor: `${source.color}40`, background: source.bg }}>
            {source.label}
          </span>
        )}
        <span className="score-badge ml-auto text-[12px]" style={{ color: score.color, background: score.bg }}>
          {lead.score_ia}
        </span>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center gap-3 border-t pt-2.5" style={{ borderColor: '#edf2f7' }}>
        <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
          <Mail size={12} strokeWidth={1.5} />
          {Math.floor(Math.random() * 8) + 1}
        </span>
        <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
          <Clock size={12} strokeWidth={1.5} />
          {Math.floor(Math.random() * 5) + 1}d
        </span>
      </div>
    </div>
  )
}
