'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import {
  Kanban, Users, CheckSquare, Map, BarChart2,
  UsersRound, ChevronRight, TrendingUp, Clock, Target, Activity,
  ChevronDown, ArrowRight,
} from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const TENANT_ID = '00000000-0000-0000-0000-000000000001'

const QUICK_LINKS = [
  { href: '/pipeline',   icon: Kanban,      label: 'Pipeline',   desc: 'Funil de vendas',       color: '#818cf8' },
  { href: '/leads',      icon: Users,       label: 'Leads',      desc: 'Base de prospects',     color: '#60a5fa' },
  { href: '/tarefas',    icon: CheckSquare, label: 'Tarefas',    desc: 'Atividades da equipe',  color: '#34d399' },
  { href: '/relatorios', icon: BarChart2,   label: 'Análises',   desc: 'Métricas e relatórios', color: '#fbbf24' },
  { href: '/mapa',       icon: Map,         label: 'Mapa',       desc: 'Leads por região',      color: '#f472b6' },
  { href: '/grupos',     icon: UsersRound,  label: 'Grupos',     desc: 'Times de trabalho',     color: '#a78bfa' },
]

const STAGE_COLORS: Record<string, string> = {
  novo: '#818cf8', contactado: '#60a5fa', proposta: '#fbbf24',
  negociando: '#f472b6', fechado: '#34d399', perdido: '#ef4444',
}
const STAGE_LABELS: Record<string, string> = {
  novo: 'Novo', contactado: 'Contactado', proposta: 'Proposta',
  negociando: 'Negociando', fechado: 'Fechado', perdido: 'Perdido',
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

interface StageRow { status: string; count: number }

interface Stats {
  totalLeads: number        // todos os leads no sistema (prospects EBT + pipeline)
  pipelineAtivo: number     // só em_pipeline=true e não fechado/perdido
  leadsEsseMes: number      // leads em pipeline criados este mês
  tarefasPendentes: number
  byStage: StageRow[]       // contagem por etapa (só em_pipeline=true)
  fechados: number
  conversao: number         // % fechados / total pipeline
}

export default function HomePage() {
  const router = useRouter()
  const [nome,       setNome]       = useState('')
  const [stats,      setStats]      = useState<Stats | null>(null)
  const [expanded,   setExpanded]   = useState(false)  // Visão Geral expandida

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: prof } = await supabase.from('profiles').select('nome').eq('id', user.id).single()
      setNome(prof?.nome?.split(' ')[0] || user.email?.split('@')[0] || '')

      // Total geral (todos os leads no sistema)
      const { count: totalLeads } = await supabase
        .from('leads').select('*', { count: 'exact', head: true })
        .eq('tenant_id', TENANT_ID)

      // Tarefas pendentes
      const { count: tarefasPendentes } = await supabase
        .from('tarefas').select('*', { count: 'exact', head: true })
        .eq('tenant_id', TENANT_ID).eq('status', 'pendente')

      // Leads em pipeline criados este mês
      const inicioDeMes = new Date(); inicioDeMes.setDate(1); inicioDeMes.setHours(0, 0, 0, 0)
      const { count: leadsEsseMes } = await supabase
        .from('leads').select('*', { count: 'exact', head: true })
        .eq('tenant_id', TENANT_ID)
        .eq('em_pipeline', true)
        .gte('created_at', inicioDeMes.toISOString())

      // Pipeline por etapa — APENAS em_pipeline=true
      const { data: stageData } = await supabase
        .from('leads').select('status')
        .eq('tenant_id', TENANT_ID)
        .eq('em_pipeline', true)
        .in('status', ['novo','contactado','proposta','negociando','fechado','perdido'])

      const stageCounts: Record<string, number> = {}
      for (const row of stageData ?? []) {
        stageCounts[row.status] = (stageCounts[row.status] || 0) + 1
      }
      const byStage = ['novo','contactado','proposta','negociando','fechado','perdido']
        .map(status => ({ status, count: stageCounts[status] ?? 0 }))

      const pipelineAtivo = byStage
        .filter(s => s.status !== 'fechado' && s.status !== 'perdido')
        .reduce((a, b) => a + b.count, 0)

      const fechados = stageCounts['fechados'] ?? stageCounts['fechado'] ?? 0
      const totalPipeline = byStage.reduce((a, b) => a + b.count, 0)
      const conversao = totalPipeline > 0 ? Math.round((fechados / totalPipeline) * 100) : 0

      setStats({
        totalLeads: totalLeads ?? 0,
        leadsEsseMes: leadsEsseMes ?? 0,
        tarefasPendentes: tarefasPendentes ?? 0,
        pipelineAtivo,
        byStage,
        fechados,
        conversao,
      })
    }
    load()
  }, [])

  const pipelineStages = stats?.byStage.filter(s => s.status !== 'perdido') ?? []
  const maxStage = Math.max(...pipelineStages.map(s => s.count), 1)

  // Taxas de conversão entre etapas
  function convRate(fromIdx: number): string {
    if (!stats) return '—'
    const stages = ['novo','contactado','proposta','negociando','fechado']
    const from = stats.byStage.find(s => s.status === stages[fromIdx])?.count ?? 0
    const to   = stats.byStage.find(s => s.status === stages[fromIdx + 1])?.count ?? 0
    if (from === 0) return '—'
    return `${Math.round((to / from) * 100)}%`
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      height: '100%', overflow: 'auto', padding: '32px 24px 40px',
    }}>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, marginBottom: 12 }}>
          <img src="/logo-lp.png" alt="Lead+"
            style={{ width: 64, height: 64, objectFit: 'contain', filter: 'drop-shadow(0 4px 24px rgba(224,79,10,0.35))' }} />
          <h1 style={{ fontSize: 60, fontWeight: 900, letterSpacing: '-2px', color: '#ffffff', margin: 0, lineHeight: 1 }}>
            Lead<span style={{ color: '#E04F0A' }}>+</span>
          </h1>
        </div>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.55)', margin: '0 0 20px', letterSpacing: '0.04em' }}>
          Inteligência que impulsiona
        </p>
        {nome && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 100, padding: '8px 20px', backdropFilter: 'blur(8px)',
          }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#E04F0A,#fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
              {nome[0]?.toUpperCase()}
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', fontWeight: 500 }}>
              {greeting()}, <strong style={{ color: '#fff', fontWeight: 700 }}>{nome}</strong>
            </span>
          </div>
        )}
      </div>

      {/* ── Quick access ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '100%', maxWidth: 820, marginBottom: 16 }}>
        {QUICK_LINKS.map(({ href, icon: Icon, label, desc, color }) => (
          <button key={href} onClick={() => router.push(href)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 18px', borderRadius: 16,
              background: '#ffffff', border: '1px solid #e5e7eb',
              cursor: 'pointer', textAlign: 'left',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.transform = 'translateY(-2px)'
              el.style.boxShadow = `0 8px 24px ${color}30`
              el.style.border = `1px solid ${color}55`
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.transform = 'translateY(0)'
              el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
              el.style.border = '1px solid #e5e7eb'
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 11, flexShrink: 0,
              background: `${color}18`, border: `1.5px solid ${color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={17} strokeWidth={1.6} style={{ color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#111827' }}>{label}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>{desc}</p>
            </div>
            <ChevronRight size={13} strokeWidth={1.5} style={{ color: '#d1d5db', flexShrink: 0 }} />
          </button>
        ))}
      </div>

      {/* ── Visão Geral (clicável, expande) ── */}
      <div style={{
        width: '100%', maxWidth: 820,
        background: '#ffffff', borderRadius: 20,
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
        overflow: 'hidden',
      }}>
        {/* Header clicável */}
        <button
          onClick={() => setExpanded(v => !v)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '18px 24px',
            background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: expanded ? '1px solid #f3f4f6' : 'none',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#f9fafb')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'none')}
        >
          <Activity size={16} strokeWidth={1.8} style={{ color: '#6366f1' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', flex: 1, textAlign: 'left' }}>Visão Geral</span>
          <span style={{ fontSize: 11, color: '#9ca3af', marginRight: 6 }}>
            {expanded ? 'Fechar' : 'Ver detalhes do funil'}
          </span>
          <ChevronDown size={15} strokeWidth={1.8} style={{
            color: '#9ca3af',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s',
          }} />
        </button>

        <div style={{ padding: '0 24px 20px' }}>
          {/* KPIs — sempre visíveis */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, paddingTop: 20, marginBottom: expanded ? 24 : 0 }}>
            {[
              { label: 'Total no sistema',    value: stats?.totalLeads       ?? '—', icon: Users,      color: '#60a5fa', hint: 'prospects + pipeline' },
              { label: 'Pipeline ativo',       value: stats?.pipelineAtivo    ?? '—', icon: Target,     color: '#818cf8', hint: 'em andamento' },
              { label: 'Entrados este mês',    value: stats?.leadsEsseMes     ?? '—', icon: TrendingUp, color: '#34d399', hint: 'no pipeline' },
              { label: 'Tarefas pendentes',    value: stats?.tarefasPendentes ?? '—', icon: Clock,      color: '#fbbf24', hint: '' },
            ].map(({ label, value, icon: Icon, color, hint }) => (
              <div key={label} style={{ padding: '14px 16px', borderRadius: 12, background: '#f9fafb', border: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={13} strokeWidth={1.8} style={{ color }} />
                  </div>
                  <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>{label}</span>
                </div>
                <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827', lineHeight: 1 }}>
                  {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
                </p>
                {hint && <p style={{ margin: '4px 0 0', fontSize: 10, color: '#9ca3af' }}>{hint}</p>}
              </div>
            ))}
          </div>

          {/* Detalhes expandidos — saúde do funil */}
          {expanded && (
            <>
              {/* Barra por etapa */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Leads por etapa (pipeline)
                </p>
                {stats && pipelineStages.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pipelineStages.map(({ status, count }) => {
                      const pct = Math.round((count / maxStage) * 100)
                      const color = STAGE_COLORS[status] ?? '#94a3b8'
                      return (
                        <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ width: 90, fontSize: 12, color: '#374151', fontWeight: 500, flexShrink: 0 }}>
                            {STAGE_LABELS[status]}
                          </span>
                          <div style={{ flex: 1, height: 10, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`, background: color, transition: 'width 0.6s ease', minWidth: count > 0 ? 6 : 0 }} />
                          </div>
                          <span style={{ width: 40, fontSize: 12, fontWeight: 700, color: '#111827', textAlign: 'right', flexShrink: 0 }}>
                            {count.toLocaleString('pt-BR')}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Nenhum lead no pipeline ainda</p>
                )}
              </div>

              {/* Taxas de conversão entre etapas */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Conversão entre etapas
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap', gap: 4 } as any}>
                  {['novo','contactado','proposta','negociando','fechado'].map((s, i, arr) => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{
                        padding: '6px 12px', borderRadius: 20,
                        background: `${STAGE_COLORS[s]}18`, border: `1px solid ${STAGE_COLORS[s]}40`,
                        fontSize: 11, fontWeight: 600, color: STAGE_COLORS[s],
                      }}>
                        {STAGE_LABELS[s]}
                        <span style={{ marginLeft: 6, fontWeight: 800 }}>
                          {stats?.byStage.find(b => b.status === s)?.count ?? 0}
                        </span>
                      </div>
                      {i < arr.length - 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <ArrowRight size={12} style={{ color: '#d1d5db' }} />
                          <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>{convRate(i)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Botão ir para pipeline */}
              <button
                onClick={() => router.push('/pipeline')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 10,
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, color: '#fff',
                }}
              >
                <Kanban size={13} strokeWidth={1.8} /> Abrir Pipeline
              </button>
            </>
          )}
        </div>
      </div>

      <p style={{ marginTop: 28, fontSize: 11, color: 'rgba(255,255,255,0.20)', letterSpacing: '0.06em' }}>
        EBT Transportadora · Lead Engine v1.0
      </p>
    </div>
  )
}
