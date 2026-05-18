'use client'
import { Lead } from '@/types'
import { SOURCE_LABELS, SEGMENT_LABELS } from '@/lib/mock-data'
import { getScoreColor, formatCurrencyShort } from '@/lib/utils'
import {
  X, Phone, Mail, Globe, MapPin, Linkedin,
  Building2, Tag, TrendingUp, Clock, Plus,
  ChevronRight, Star,
} from 'lucide-react'

interface LeadDrawerProps {
  lead: Lead | null
  onClose: () => void
}

const STATUS_STEPS = ['novo', 'contactado', 'proposta', 'negociando', 'fechado']
const STATUS_LABELS: Record<string, string> = {
  novo: 'Novo', contactado: 'Contactado', proposta: 'Proposta',
  negociando: 'Negociando', fechado: 'Fechado',
}

export function LeadDrawer({ lead, onClose }: LeadDrawerProps) {
  if (!lead) return null

  const score  = getScoreColor(lead.score_ia)
  const source = SOURCE_LABELS[lead.fonte]
  const segment = SEGMENT_LABELS[lead.segmento]
  const stepIdx = STATUS_STEPS.indexOf(lead.status)

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-[420px] flex-col overflow-hidden"
        style={{
          background: 'rgba(12,10,30,0.95)',
          backdropFilter: 'blur(32px)',
          borderLeft: '0.5px solid rgba(255,255,255,0.12)',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-4"
          style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              {lead.empresa.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-sm font-medium text-white/95">{lead.empresa}</h2>
              <p className="mt-0.5 text-xs text-white/45">{segment} · {lead.cidade}, {lead.estado}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/35 transition-all hover:bg-white/10 hover:text-white/70">
            <X size={15} strokeWidth={1.5} />
          </button>
        </div>

        {/* Score IA + Status pipeline */}
        <div className="px-5 py-4" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1"
              style={{ background: score.bg, border: `0.5px solid ${score.color}40` }}>
              <TrendingUp size={14} strokeWidth={1.5} style={{ color: score.color }} />
              <span className="text-xs text-white/60">Score IA</span>
              <span className="ml-auto text-lg font-medium" style={{ color: score.color }}>{lead.score_ia}</span>
            </div>
            {lead.valor_estimado && (
              <div className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1"
                style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.10)' }}>
                <Star size={14} strokeWidth={1.5} className="text-amber-400" />
                <span className="text-xs text-white/60">Potencial</span>
                <span className="ml-auto text-sm font-medium text-white/90">
                  {formatCurrencyShort(lead.valor_estimado)}/mês
                </span>
              </div>
            )}
          </div>

          {/* Pipeline progress */}
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-white/30">Etapa no pipeline</p>
          <div className="flex items-center gap-1">
            {STATUS_STEPS.map((s, i) => (
              <div key={s} className="flex flex-1 flex-col items-center gap-1">
                <div className="h-1 w-full rounded-full transition-all"
                  style={{ background: i <= stepIdx ? '#6366f1' : 'rgba(255,255,255,0.10)' }} />
                <span className="text-[9px] text-white/30">{STATUS_LABELS[s]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* Contato */}
          <Section title="Contato">
            <InfoRow icon={<Building2 size={13} strokeWidth={1.5} />} label="Responsável">
              <span className="text-white/80">{lead.contato_nome}</span>
              <span className="ml-1.5 text-white/40">· {lead.contato_cargo}</span>
            </InfoRow>
            <InfoRow icon={<Phone size={13} strokeWidth={1.5} />} label="Telefone">
              {lead.telefone
                ? <a href={`tel:${lead.telefone}`} className="text-indigo-400 hover:underline">{lead.telefone}</a>
                : <span className="text-white/25 italic">Não informado</span>
              }
            </InfoRow>
            <InfoRow icon={<Mail size={13} strokeWidth={1.5} />} label="E-mail">
              {lead.email
                ? <a href={`mailto:${lead.email}`} className="text-indigo-400 hover:underline">{lead.email}</a>
                : <span className="text-white/25 italic">Não informado</span>
              }
            </InfoRow>
            <InfoRow icon={<Linkedin size={13} strokeWidth={1.5} />} label="LinkedIn">
              <a href={`https://linkedin.com/company/${lead.empresa.toLowerCase().replace(/\s+/g, '-')}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-indigo-400 hover:underline">
                Ver perfil <ChevronRight size={11} />
              </a>
            </InfoRow>
            {lead.website && (
              <InfoRow icon={<Globe size={13} strokeWidth={1.5} />} label="Website">
                <a href={lead.website} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-indigo-400 hover:underline">
                  {lead.website} <ChevronRight size={11} />
                </a>
              </InfoRow>
            )}
            <InfoRow icon={<MapPin size={13} strokeWidth={1.5} />} label="Endereço">
              <span className="text-white/70">{lead.cidade}, {lead.estado} · Brasil</span>
            </InfoRow>
          </Section>

          {/* Dados da empresa */}
          <Section title="Dados da empresa">
            <InfoRow icon={<Tag size={13} strokeWidth={1.5} />} label="Segmento">
              <span className="tag">{segment}</span>
            </InfoRow>
            {lead.cnae && (
              <InfoRow icon={<Tag size={13} strokeWidth={1.5} />} label="CNAE">
                <span className="text-white/70">{lead.cnae}</span>
              </InfoRow>
            )}
            <InfoRow icon={<Tag size={13} strokeWidth={1.5} />} label="Fonte">
              {source && (
                <span className="rounded-lg px-2 py-0.5 text-[11px]"
                  style={{ color: source.color, background: source.bg }}>
                  {source.label}
                </span>
              )}
            </InfoRow>
            {lead.responsavel_nome && (
              <InfoRow icon={<Building2 size={13} strokeWidth={1.5} />} label="Vendedor">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-medium"
                    style={{ background: `${lead.responsavel_cor}33`, color: lead.responsavel_cor }}>
                    {lead.responsavel_iniciais}
                  </div>
                  <span className="text-white/70">{lead.responsavel_nome}</span>
                </div>
              </InfoRow>
            )}
          </Section>

          {/* Sugestão IA */}
          <Section title="Inteligência IA">
            <div className="rounded-xl p-3 text-xs leading-relaxed text-white/55"
              style={{ background: 'rgba(99,102,241,0.08)', border: '0.5px solid rgba(99,102,241,0.2)' }}>
              <p className="mb-1 font-medium text-indigo-300">Sugestão de abordagem</p>
              <p>
                Empresa com alto volume de carga em {lead.segmento === 'agronegocio' ? 'safras regionais' : 'distribuição regional'}.
                Potencial de {formatCurrencyShort(lead.valor_estimado ?? 15000)}/mês em fretes.
                Recomendado abordar o decisor logístico com proposta de {lead.cidade} como hub de distribuição.
              </p>
            </div>
          </Section>

          {/* Observações */}
          <Section title="Observações">
            <textarea
              placeholder="Adicione uma nota sobre este lead..."
              rows={3}
              className="w-full resize-none rounded-xl p-3 text-xs text-white/70 outline-none placeholder:text-white/25"
              style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.10)' }}
              defaultValue={lead.observacoes ?? ''}
            />
          </Section>
        </div>

        {/* Footer actions */}
        <div className="flex gap-2 p-4" style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
          <button className="btn-primary flex flex-1 items-center justify-center gap-1.5 text-xs">
            <Plus size={13} strokeWidth={2} />
            Adicionar ao Pipeline
          </button>
          <button className="btn-ghost flex items-center gap-1.5 text-xs px-4">
            <Phone size={13} strokeWidth={1.5} />
            Ligar
          </button>
          <button className="btn-ghost flex items-center gap-1.5 text-xs px-4">
            <Mail size={13} strokeWidth={1.5} />
            E-mail
          </button>
        </div>
      </div>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
      <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-white/30">{title}</p>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  )
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-white/25">{icon}</span>
      <span className="w-24 flex-shrink-0 text-xs text-white/40">{label}</span>
      <div className="flex min-w-0 flex-1 items-center text-xs">{children}</div>
    </div>
  )
}
