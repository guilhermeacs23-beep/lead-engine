'use client'
import React from 'react'
import { Lead } from '@/types'
import { formatCurrencyShort, getScoreColor } from '@/lib/utils'
import { SOURCE_LABELS, SEGMENT_LABELS, LABEL_COLORS } from '@/lib/mock-data'
import { Mail, Clock } from 'lucide-react'

interface LeadCardProps {
  lead: Lead
  onClick?: (lead: Lead) => void
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const score = getScoreColor(lead.score_ia)
  const source = SOURCE_LABELS[lead.fonte]
  const segment = SEGMENT_LABELS[lead.segmento]
  const labelGradient = LABEL_COLORS[lead.status]

  return (
    <div className="lead-card group" onClick={() => onClick?.(lead)}>
      {/* Label colorida */}
      <div className="mb-2.5 h-[2.5px] w-3/5 rounded-full" style={{ background: labelGradient }} />

      {/* Nome da empresa */}
      <p className="text-[12px] font-medium text-white/92 leading-tight">{lead.empresa}</p>
      <p className="mt-0.5 mb-2.5 text-[10px] text-white/40">
        {lead.contato_nome} · {lead.contato_cargo}
      </p>

      {/* Valor estimado */}
      {lead.valor_estimado && (
        <p className="mb-2 text-[13px] font-medium" style={{ color: getColumnColor(lead.status) }}>
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
        <span
          className="score-badge ml-auto"
          style={{ color: score.color, background: score.bg }}
        >
          {lead.score_ia}
        </span>
      </div>

      {/* Footer */}
      <div className="mt-2.5 flex items-center justify-between border-t pt-2"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <span className="kicon flex items-center gap-1 text-[10px] text-white/30">
            <Mail size={11} strokeWidth={1.5} />
            {Math.floor(Math.random() * 8) + 1}
          </span>
          <span className="kicon flex items-center gap-1 text-[10px] text-white/30">
            <Clock size={11} strokeWidth={1.5} />
            {Math.floor(Math.random() * 5) + 1}d
          </span>
        </div>

        {lead.responsavel_iniciais && (
          <div
            className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-medium"
            style={{
              background: `${lead.responsavel_cor}33`,
              color: lead.responsavel_cor,
              border: `1.5px solid ${lead.responsavel_cor}44`,
            }}
          >
            {lead.responsavel_iniciais}
          </div>
        )}
      </div>
    </div>
  )
}

function getColumnColor(status: string): string {
  const map: Record<string, string> = {
    novo:        '#818cf8',
    contactado:  '#60a5fa',
    proposta:    '#fbbf24',
    negociando:  '#f472b6',
    fechado:     '#34d399',
  }
  return map[status] ?? '#818cf8'
}
