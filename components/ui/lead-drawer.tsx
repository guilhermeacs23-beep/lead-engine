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
  if (diff < 60)    return 'agora'
  if (diff < 3600)  return `${Math.floor(diff / 60)}min atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function LeadDrawer({ lead, onClose, onStageChange }: LeadDrawerProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loadingAct, setLoadingAct] = useState(false)
  const [newActType, setNewActType] = useState<ActivityType>('nota')
  const [newActText, setNewActText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [notes, setNotes]           = useState('')
  const [notesSaving, setNotesSaving] = useState(false)
  const [notesSaved, setNotesSaved]   = useState(false)
  const [movingTo, setMovingTo]       = useState<string | null>(null)
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
  const leadExt = lead as any

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
                  className="flex items-ce