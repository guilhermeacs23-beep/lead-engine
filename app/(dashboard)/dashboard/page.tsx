'use client'
import React from 'react'
import { useState, useEffect } from 'react'
import { fetchDashboardMetrics, fetchLeads, fetchFunnelData, fetchActivitiesStats } from '@/lib/supabase'
import { SOURCE_LABELS, SEGMENT_LABELS } from '@/lib/mock-data'
import { formatCurrencyShort } from '@/lib/utils'
import { TrendingUp, TrendingDown, Loader2, Activity, Target, BarChart2 } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  novo: 'Novo', contactado: 'Contactado', proposta: 'Proposta',
  negociando: 'Negociando', fechado: 'Fechado', perdido: 'Perdido',
}

const STATUS_COLORS: Record<string, string> = {
  novo: '#818cf8', contactado: '#60a5fa', proposta: '#fbbf24',
  negociando: '#f472b6', fechado: '#34d399', perdido: '#ef4444',
}

const TIPO_LABELS: Record<string, string> = {
  ligacao: 'Ligação', email: 'E-mail', reuniao: 'Reunião',
  nota: 'Nota', proposta: 'Proposta', status: 'Status',
}

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
      <div className="flex h-full items-center justify-center gap-2 text-sm text-white/30">
        <Loader2 size={18} className="animate-spin" />Carregando Insights…
      </div>
    )
  }

  const METRIC_CARDS = metrics ? [
    {
      label: 'Leads este mês',
      value: metrics.leads_mes,
      delta: `+${metrics.leads_delta}% vs mês anterior`,
      up: true,
    },
    {
      label: 'Em negociação',
      value: formatCurrencyShort(metrics.valor_pipeline),
      delta: `+${metrics.oportunidades} oportunidades`,
      up: true,
    },
    {
      label: 'Fechados (mês)',
      value: metrics.fechados_mes,
      delta: `${formatCurrencyShort(metrics.valor_fechado)} convertido`,
      up: true,
    },
    {
      label: 'Taxa de conversão',
      value: `${metrics.taxa_conversao}%`,
      delta: `${metrics.taxa_delta}% vs meta`,
      up: metrics.taxa_delta >= 0,
    },
  ] : []

  const maxFunnelCount = Math.max(...funnel.map(f => f.count), 1)

  return (
    <div className="flex h-full flex-col overflow-auto p-5 gap-4">

      {/* -- KPIs -- */}
      <div className="grid grid-cols-4 gap-3">
        {METRIC_CARDS.map((m) => (
          <div key={m.label} className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.10)' }}>
            <p className="mb-1.5 text-[11px] text-white/50">{m.label}</p>
            <p className="text-2xl font-medium text-white/95">{m.value}</p>
            <p className={`mt-1 flex items-center gap-1 text-[11px] ${m.up ? 'text-emerald-400' : 'text-red-400'}`}>
              {m.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {m.delta}
            </p>
          </div>
        ))}
      </div>

      {/* -- Saúde do funil -- */}
      <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.10)' }}>
        <div className="mb-4 flex items-center gap-2">
          <Target size={14} className="text-indigo-400" strokeWidth={1.5} />
          <p className="text-[13px] font-medium text-white/80">Saúde do funil</p>
          <span className="ml-auto text-[11px] text-white/35">
            Taxa de ganho: <span className="text-white/70">{metrics?.taxa_conversao ?? 0}%</span>
          </span>
        </div>

        {funnel.length === 0 ? (
          <p className="py-6 text-center text-xs text-white/30">Nenhum lead no pipeline ainda</p>
        ) : (
          <div className="flex items-end gap-0">
            {funnel.map((step, i) => {
              const color = STATUS_COLORS[step.step] ?? '#6366f1'
              const barH  = maxFunnelCount > 0 ? Math.max(8, Math.round((step.count / maxFunnelCount) * 80)) : 8
              return (
                <div key={step.step} className="flex flex-1 flex-col items-center gap-2">
                  {/* Conversion arrow between steps */}
                  <div className="flex w-full items-center justify-center">
                    {i > 0 && (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: `${color}20`, color }}>
                        {step.pct_conversao}%
                      </span>
                    )}
                  </div>

                  {/* Count above bar */}
                  <span className="text-[13px] font-medium text-white/80">{step.count}</span>

                  {/* Bar */}
                  <div className="relative w-full overflow-hidden rounded-t-lg"
                    style={{ height: barH, background: `${color}CC` }}>
                    <div className="absolute inset-0 opacity-30"
                      style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)' }} />
                  </div>

                  {/* Label */}
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                    <span className="