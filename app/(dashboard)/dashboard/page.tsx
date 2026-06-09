'use client'
import React, { useState, useEffect } from 'react'
import { fetchDashboardMetrics, fetchLeads, fetchFunnelData, fetchActivitiesStats } from '@/lib/supabase'
import { SOURCE_LABELS, SEGMENT_LABELS } from '@/lib/mock-data'
import { formatCurrencyShort } from '@/lib/utils'
import {
  TrendingUp, TrendingDown, Loader2,
  Users, Target, BarChart2, Activity, Download,
} from 'lucide-react'

/* ── Paleta de status ─────────────────────────────────────── */
const STATUS_LABELS: Record<string, string> = {
  novo: 'Novo', contactado: 'Contactado', proposta: 'Proposta',
  negociando: 'Negociando', fechado: 'Fechado', perdido: 'Perdido',
}
const STATUS_COLORS: Record<string, string> = {
  novo: '#818cf8', contactado: '#60a5fa', proposta: '#fbbf24',
  negociando: '#f472b6', fechado: '#34d399', perdido: '#ef4444',
}

/* ── Card branco reutilizável ─────────────────────────────── */
function Card({ children, className = '', style = {} }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties
}) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{
        background: 'rgba(255,255,255,0.10)',
        border: '0.5px solid rgba(255,255,255,0.18)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        backdropFilter: 'blur(12px)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/* ── Mini gráfico de área (SVG) ───────────────────────────── */
function SparkArea({ data, color = '#6366f1' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null
  const W = 120; const H = 40; const P = 4
  const max = Math.max(...data, 1)
  const pts = data.map((v, i) => ({
    x: P + (i / (data.length - 1)) * (W - P * 2),
    y: H - P - (v / max) * (H - P * 2),
  }))
  const poly = pts.map(p => `${p.x},${p.y}`).join(' ')
  const area = `M${pts[0].x},${H} ` + pts.map(p => `L${p.x},${p.y}`).join(' ') + ` L${pts[pts.length - 1].x},${H} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: W, height: H }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.30" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color.replace('#', '')})`} />
      <polyline points={poly} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ── Gráfico de barras do funil ───────────────────────────── */
function FunnelChart({ steps }: { steps: any[] }) {
  const max = Math.max(...steps.map(s => s.count), 1)
  return (
    <div className="flex items-end gap-0 pt-2">
      {steps.map((step, i) => {
        const color = STATUS_COLORS[step.step] ?? '#6366f1'
        const barH = Math.max(12, Math.round((step.count / max) * 96))
        return (
          <div key={step.step} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-center justify-center h-5">
              {i > 0 && (
                <span className="rounded-full px-1.5 py-0.5 text-[11px] font-semibold"
                  style={{ background: `${color}25`, color }}>
                  {step.pct_conversao}%
                </span>
              )}
            </div>
            <span className="text-[14px] font-bold text-white">{step.count}</span>
            <div className="relative w-full overflow-hidden rounded-t-lg"
              style={{ height: barH, background: `${color}CC` }}>
              <div className="absolute inset-0"
                style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)' }} />
            </div>
            <div className="flex flex-col items-center gap-0.5 mt-1">
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
              <span className="text-[11px] font-medium text-white/80">{STATUS_LABELS[step.step]}</span>
              {step.valor > 0 && (
                <span className="text-[11px] font-semibold" style={{ color }}>
                  {formatCurrencyShort(step.valor)}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Página principal ─────────────────────────────────────── */
export default function DashboardPage() {
  const [metrics,    setMetrics]    = useState<any>(null)
  const [recent,     setRecent]     = useState<any[]>([])
  const [funnel,     setFunnel]     = useState<any[]>([])
  const [activities, setActivities] = useState<any>({ total: 0, por_tipo: [] })
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    async function load() {
      const [m, leads, f, a] = await Promise.all([
        fetchDashboardMetrics(),
        fetchLeads(),
        fetchFunnelData(),
        fetchActivitiesStats(),
      ])
      setMetrics(m)
      setRecent(leads.slice(0, 5))
      setFunnel(f)
      setActivities(a)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-white/50">
        <Loader2 size={18} className="animate-spin" /> Carregando…
      </div>
    )
  }

  const KPI_CARDS = metrics ? [
    {
      label: 'Leads este mês',
      value: String(metrics.leads_mes),
      delta: `+${metrics.leads_delta}% vs mês anterior`,
      up: true,
      icon: Users,
      color: '#818cf8',
      spark: [2, 4, 3, 6, 5, 8, metrics.leads_mes],
    },
    {
      label: 'Em negociação',
      value: formatCurrencyShort(metrics.valor_pipeline),
      delta: `${metrics.oportunidades} oportunidades`,
      up: true,
      icon: Target,
      color: '#60a5fa',
      spark: [40, 55, 48, 70, 65, 80, metrics.valor_pipeline / 3000],
    },
    {
      label: 'Fechados (mês)',
      value: String(metrics.fechados_mes),
      delta: `${formatCurrencyShort(metrics.valor_fechado)} convertido`,
      up: true,
      icon: TrendingUp,
      color: '#34d399',
      spark: [1, 2, 1, 3, 2, 4, metrics.fechados_mes],
    },
    {
      label: 'Conversão',
      value: `${metrics.taxa_conversao}%`,
      delta: `${metrics.taxa_delta}% vs meta`,
      up: metrics.taxa_delta >= 0,
      icon: BarChart2,
      color: '#f472b6',
      spark: [20, 25, 22, 30, 28, 35, metrics.taxa_conversao],
    },
  ] : []

  return (
    <div className="flex h-full flex-col overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <div>
          <h1 className="text-[20px] font-bold text-white">Dashboard</h1>
          <p className="text-[13px] text-white/50 mt-0.5">
            {metrics?.total_leads ?? 0} leads no banco · dados em tempo real
          </p>
        </div>
        <button className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-medium text-white/60 transition-all hover:bg-white/[0.07]"
          style={{ border: '0.5px solid rgba(255,255,255,0.12)' }}>
          <Download size={13} strokeWidth={1.5} /> Exportar
        </button>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6 flex flex-col gap-4">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3">
          {KPI_CARDS.map((k) => (
            <Card key={k.label}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[12px] font-medium text-white/55">{k.label}</p>
                  <p className="mt-1.5 text-[28px] font-bold leading-none text-white">{k.value}</p>
                  <p className={`mt-2 flex items-center gap-1 text-[12px] font-medium ${k.up ? 'text-emerald-400' : 'text-red-400'}`}>
                    {k.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {k.delta}
                  </p>
                </div>
                <SparkArea data={k.spark} color={k.color} />
              </div>
            </Card>
          ))}
        </div>

        {/* Funil + Fontes */}
        <div className="grid grid-cols-5 gap-4">

          {/* Saúde do funil */}
          <Card className="col-span-3">
            <div className="mb-3 flex items-center gap-2">
              <Target size={15} className="text-indigo-400" strokeWidth={1.5} />
              <p className="text-[15px] font-semibold text-white">Saúde do funil</p>
              <span className="ml-auto text-[13px] text-white/50">
                Conversão: <span className="font-semibold text-white">{metrics?.taxa_conversao ?? 0}%</span>
              </span>
            </div>
            {funnel.length === 0 ? (
              <p className="py-8 text-center text-sm text-white/40">Nenhum lead no pipeline</p>
            ) : (
              <FunnelChart steps={funnel} />
            )}
          </Card>

          {/* Fontes de leads */}
          <Card className="col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <Activity size={15} className="text-indigo-400" strokeWidth={1.5} />
              <p className="text-[15px] font-semibold text-white">Fontes de leads</p>
            </div>
            <div className="flex flex-col gap-3">
              {(metrics?.por_fonte ?? []).length === 0 ? (
                <p className="py-6 text-center text-sm text-white/40">Sem dados de fontes</p>
              ) : (metrics?.por_fonte ?? []).map(({ fonte, pct }: { fonte: string; pct: number }) => {
                const src = SOURCE_LABELS[fonte]
                return (
                  <div key={fonte} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium text-white/80">{src?.label ?? fonte}</span>
                      <span className="text-[13px] font-bold text-white">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: src?.color ?? '#6366f1' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Leads recentes + Atividades */}
        <div className="grid grid-cols-3 gap-4">

          {/* Leads recentes */}
          <Card className="col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <BarChart2 size={15} className="text-indigo-400" strokeWidth={1.5} />
              <p className="text-[15px] font-semibold text-white">Leads recentes</p>
            </div>
            {recent.length === 0 ? (
              <p className="py-6 text-center text-sm text-white/40">Nenhum lead cadastrado ainda</p>
            ) : recent.map((lead) => (
              <div key={lead.id}
                className="flex items-center gap-3 border-b py-3 last:border-0"
                style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="h-2 w-2 flex-shrin