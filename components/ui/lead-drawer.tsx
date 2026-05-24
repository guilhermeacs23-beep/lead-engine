'use client'
import { Lead } from '@/types'
import { SOURCE_LABELS, SEGMENT_LABELS } from '@/lib/mock-data'
import { getScoreColor, formatCurrencyShort } from '@/lib/utils'
import {
  fetchActivities, addActivity, saveLeadNotes, updateLeadStatus,
  type Activity,
} from '@/lib/supabase'
import { useEffect, useState, useRef, useCallback } from 'react'
import {
  X, Phone, Mail, Globe, MapPin, Linkedin,
  Building2, Tag, TrendingUp, Star,
  ChevronRight, MessageSquare, PhoneCall, Users,
  FileText, Send, Loader2, CheckCircle, Clock,
} from 'lucide-react'

interface LeadDrawerProps {
  lead: Lead | null
  onClose: () => void
  onStageChange?: (leadId: string, newStatus: string) => void
}

const STATUS_STEPS = ['novo', 'contactado', 'proposta', 'negociando', 'fechado'] as const
type PipelineStatus = typeof STATUS_STEPS[number]

const STATUS_LABELS: Record<string, string> = {
  novo: 'Novo', contactado: 'Contactado', proposta: 'Proposta',
  negociando: 'Negociando', fechado: 'Fechado',
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  nota:     <MessageSquare size={12} strokeWidth={1.5} />,
  ligacao:  <PhoneCall size={12} strokeWidth={1.5} />,
  email:    <Mail size={12} strokeWidth={1.5} />,
  reuniao:  <Users size={12} strokeWidth={1.5} />,
  proposta: <FileText size={12} strokeWidth={1.5} />,
  status:   <CheckCircle size={12} strokeWidth={1.5} />,
}

const ACTIVITY_COLORS: Record<string, string> = {
  nota: '#a78bfa', ligacao: '#60a5fa', email: '#34d399',
  reuniao: '#fbbf24', proposta: '#f472b6', status: '#94a3b8',
}

const ACTIVITY_LABELS: Record<string, string> = {
  nota: 'Nota', ligacao: 'Ligação', email: 'E-mail',
  reuniao: 'Reunião', proposta: 'Proposta', status: 'Status',
}

type ActivityType = 'nota' | 'ligacao' | 'email' | 'reuniao' | 'proposta'

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60)     return 'agora'
  if (diff < 3600)   return `${Math.floor(diff / 60)}min atrás`
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h atrás`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function LeadDrawer({ lead, onClose, onStageChange }: LeadDrawerProps) {
  const [activities,   setActivities]   = useState<Activity[]>([])
  const [loadingAct,   setLoadingAct]   = useState(false)
  const [newActType,   setNewActType]   = useState<ActivityType>('nota')
  const [newActText,   setNewActText]   = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const [notes,        setNotes]        = useState('')
  const [notesSaving,  setNotesSaving]  = useState(false)
  const [notesSaved,   setNotesSaved]   = useState(false)
  const [movingTo,     setMovingTo]     = useState<string | null>(null)
  const notesSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadActivities = useCallback(async (leadId: string) => {
    setLoadingAct(true)
    const data = await fetchActivities(leadId)
    setActivities(data)
    setLoadingAct(false)
  }, [])

  useEffect(() => {
    if (!lead) return
    setNotes(lead.observacoes ?? '')
    setActivities([])
    setNewActText('')
    loadActivities(lead.id)
  }, [lead?.id])

  if (!lead) return null

  const score   = getScoreColor(lead.score_ia)
  const source  = SOURCE_LABELS[lead.fonte]
  const segment = SEGMENT_LABELS[lead.segmento]
  const stepIdx = STATUS_STEPS.indexOf(lead.status as PipelineStatus)

  async function handleMoveStage(status: PipelineStatus) {
    if (status === lead.status || movingTo) return
    setMovingTo(status)
    const ok = await updateLeadStatus(lead.id, status)
    if (ok) {
      onStageChange?.(lead.id, status)
      await addActivity(lead.id, 'status', `Etapa alterada para "${STATUS_LABELS[status]}"`)
      await loadActivities(lead.id)
    }
    setMovingTo(null)
  }

  async function handleAddActivity() {
    if (!newActText.trim() || submitting) return
    setSubmitting(true)
    const ok = await addActivity(lead.id, newActType, newActText.trim())
    if (ok) {
      setNewActText('')
      await loadActivities(lead.id)
    }
    setSubmitting(false)
  }

  function handleNotesChange(val: string) {
    setNotes(val)
    setNotesSaved(false)
    if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current)
    notesSaveTimer.current = setTimeout(async () => {
      setNotesSaving(true)
      await saveLeadNotes(lead.id, val)
      setNotesSaving(false)
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(false), 2000)
    }, 800)
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-[440px] flex-col overflow-hidden"
        style={{
          background: 'rgba(12,10,30,0.97)',
          backdropFilter: 'blur(32px)',
          borderLeft: '0.5px solid rgba(255,255,255,0.12)',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
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
              <h2 className="text-sm font-semibold text-white/95">{lead.empresa}</h2>
              <p className="mt-0.5 text-xs text-white/45">{segment} · {lead.cidade}, {lead.estado}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/35 transition-all hover:bg-white/10 hover:text-white/70">
            <X size={15} strokeWidth={1.5} />
          </button>
        </div>

        {/* Score + Valor */}
        <div className="flex gap-2 px-5 py-4" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1"
            style={{ background: score.bg, border: `0.5px solid ${score.color}40` }}>
            <TrendingUp size={14} strokeWidth={1.5} style={{ color: score.color }} />
            <span className="text-xs text-white/60">Score IA</span>
            <span className="ml-auto text-lg font-semibold" style={{ color: score.color }}>{lead.score_ia}</span>
          </div>
          {lead.valor_estimado && (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1"
              style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.10)' }}>
              <Star size={14} strokeWidth={1.5} className="text-amber-400" />
              <span className="text-xs text-white/60">Potencial</span>
              <span className="ml-auto text-sm font-semibold text-white/90">
                {formatCurrencyShort(lead.valor_estimado)}/mês
              </span>
            </div>
          )}
        </div>

        {/* Pipeline progress — clicável */}
        <div className="px-5 py-4" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
          <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-white/30">Mover para etapa</p>
          <div className="flex items-stretch gap-1">
            {STATUS_STEPS.map((s, i) => {
              const isActive  = i <= stepIdx
              const isCurrent = s === lead.status
              const isLoading = movingTo === s
              return (
                <button
                  key={s}
                  disabled={!!movingTo}
                  onClick={() => handleMoveStage(s)}
                  className="flex flex-1 flex-col items-center gap-1.5 py-1 transition-all hover:opacity-80"
                >
                  <div className="h-1.5 w-full rounded-full transition-all"
                    style={{ background: isActive ? '#6366f1' : 'rgba(255,255,255,0.10)' }} />
                  {isLoading
                    ? <Loader2 size={8} className="animate-spin text-indigo-300" />
                    : <span className={`text-[9px] transition-colors ${isCurrent ? 'font-semibold text-indigo-300' : isActive ? 'text-white/50' : 'text-white/20'}`}>
                        {STATUS_LABELS[s]}
                      </span>
                  }
                </button>
              )
            })}
          </div>
          {lead.status === 'perdido' && (
            <p className="mt-2 text-center text-[10px] text-red-400/70">Lead marcado como perdido</p>
          )}
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
                : <span className="text-white/25 italic">Não informado</span>}
            </InfoRow>
            <InfoRow icon={<Mail size={13} strokeWidth={1.5} />} label="E-mail">
              {lead.email
                ? <a href={`mailto:${lead.email}`} className="text-indigo-400 hover:underline">{lead.email}</a>
                : <span className="text-white/25 italic">Não informado</span>}
            </InfoRow>
            <InfoRow icon={<Linkedin size={13} strokeWidth={1.5} />} label="LinkedIn">
              <a href={`https://linkedin.com/company/${encodeURIComponent(lead.empresa)}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-indigo-400 hover:underline">
                Ver perfil <ChevronRight size={11} />
              </a>
            </InfoRow>
            {lead.website && (
              <InfoRow icon={<Globe size={13} strokeWidth={1.5} />} label="Website">
                <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-indigo-400 hover:underline">
                  {lead.website} <ChevronRight size={11} />
                </a>
              </InfoRow>
            )}
            <InfoRow icon={<MapPin size={13} strokeWidth={1.5} />} label="Localização">
              <span className="text-white/70">{lead.cidade}, {lead.estado}</span>
            </InfoRow>
            {source && (
              <InfoRow icon={<Tag size={13} strokeWidth={1.5} />} label="Fonte">
                <span className="rounded px-1.5 py-0.5 text-[11px] font-medium"
                  style={{ color: source.color, background: source.bg }}>
                  {source.label}
                </span>
              </InfoRow>
            )}
          </Section>

          {/* Notas */}
          <Section title="Notas internas">
            <div className="relative">
              <textarea
                value={notes}
                onChange={e => handleNotesChange(e.target.value)}
                placeholder="Adicione observações sobre este lead…"
                rows={4}
                className="w-full resize-none rounded-xl px-3 py-2.5 text-sm text-white/80 outline-none placeholder:text-white/20"
                style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.10)' }}
              />
              {(notesSaving || notesSaved) && (
                <span className="absolute bottom-3 right-3 text-[10px] text-white/30">
                  {notesSaving ? 'Salvando…' : '✓ Salvo'}
                </span>
              )}
            </div>
          </Section>

          {/* Adicionar atividade */}
          <Section title="Registrar atividade">
            {/* Tipo selector */}
            <div className="mb-2 flex gap-1.5 flex-wrap">
              {(['nota','ligacao','email','reuniao','proposta'] as ActivityType[]).map(t => (
                <button key={t} onClick={() => setNewActType(t)}
                  className="rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all"
                  style={newActType === t
                    ? { background: ACTIVITY_COLORS[t] + '25', color: ACTIVITY_COLORS[t], border: `0.5px solid ${ACTIVITY_COLORS[t]}60` }
                    : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
                  {ACTIVITY_LABELS[t]}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <textarea
                value={newActText}
                onChange={e => setNewActText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddActivity() } }}
                placeholder={`Descreva a ${ACTIVITY_LABELS[newActType].toLowerCase()}…`}
                rows={2}
                className="flex-1 resize-none rounded-xl px-3 py-2 text-sm text-white/80 outline-none placeholder:text-white/20"
                style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.10)' }}
              />
              <button onClick={handleAddActivity} disabled={!newActText.trim() || submitting}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center self-end rounded-xl transition-all disabled:opacity-30 hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {submitting ? <Loader2 size={14} className="animate-spin text-white" /> : <Send size={14} className="text-white" />}
              </button>
            </div>
          </Section>

          {/* Timeline de atividades */}
          <Section title={`Histórico (${activities.length})`}>
            {loadingAct ? (
              <div className="flex items-center gap-2 py-4 text-xs text-white/30">
                <Loader2 size={13} className="animate-spin" />Carregando…
              </div>
            ) : activities.length === 0 ? (
              <p className="py-4 text-center text-xs text-white/25">Nenhuma atividade registrada ainda</p>
            ) : (
              <div className="flex flex-col gap-3">
                {activities.map((act) => {
                  const color = ACTIVITY_COLORS[act.tipo] ?? '#94a3b8'
                  return (
                    <div key={act.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
                          style={{ background: color + '20', color }}>
                          {ACTIVITY_ICONS[act.tipo]}
                        </div>
                        <div className="mt-1 flex-1 w-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                      </div>
                      <div className="flex-1 pb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-semibold" style={{ color }}>
                            {ACTIVITY_LABELS[act.tipo]}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-white/30">
                            <Clock size={9} />
                            {timeAgo(act.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-white/65 leading-relaxed">{act.descricao}</p>
                        {act.autor_nome && (
                          <p className="mt-1 text-[10px] text-white/25">{act.autor_nome}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Section>

          <div className="h-6" />
        </div>
      </div>
    </>
  )
}

// ── Helpers ───────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/30">{title}</p>
      {children}
    </div>
  )
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-start gap-2.5">
      <span className="mt-0.5 text-white/30">{icon}</span>
      <span className="w-24 flex-shrink-0 text-xs text-white/35">{label}</span>
      <div className="flex flex-1 flex-wrap items-center gap-1 text-xs">{children}</div>
    </div>
  )
}
