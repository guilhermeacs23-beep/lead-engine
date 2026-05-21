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
      <div className="flex h-full items-center justify-center gap-2 text-base text-white/50">
        <Loader2 size={20} className="animate-spin" />Carregando Insights…
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

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {METRIC_CARDS.map((m) => (
          <div key={m.label} className="rounded-xl p-5"
            style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.10)' }}>
            <p className="mb-2 text-[13px] font-medium text-white">{m.label}</p>
            <p className="text-3xl font-semibold text-white">{m.value}</p>
            <p className={`mt-1.5 flex items-center gap-1 text-[13px] font-medium ${m.up ? 'text-emerald-400' : 'text-red-400'}`}>
              {m.up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {m.delta}
            </p>
          </div>
        ))}
      </div>

      {/* Saude do funil */}
      <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.10)' }}>
        <div className="mb-4 flex items-center gap-2">
          <Target size={16} className="text-indigo-400" strokeWidth={1.5} />
          <p className="text-[15px] font-semibold text-white">Saúde do funil</p>
          <span className="ml-auto text-[13px] text-white/70">
            Taxa de ganho: <span className="font-semibold text-white">{metrics?.taxa_conversao ?? 0}%</span>
          </span>
        </div>

        {funnel.length === 0 ? (
          <p className="py-6 text-center text-sm text-white/50">Nenhum lead no pipeline ainda</p>
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
                      <span className="rounded-full px-2 py-0.5 text-[12px] font-semibold"
                        style={{ background: `${color}20`, color }}>
                        {step.pct_conversao}%
                      </span>
                    )}
                  </div>

                  {/* Count above bar */}
                  <span className="text-[15px] font-semibold text-white">{step.count}</span>

                  {/* Bar */}
                  <div className="relative w-full overflow-hidden rounded-t-lg"
                    style={{ height: barH, background: `${color}CC` }}>
                    <div className="absolute inset-0 opacity-30"
                      style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)' }} />
                  </div>

                  {/* Label */}
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="h-2 w-2 rounded-full" style={{ background: color }} />
                    <span className="text-[12px] font-medium text-white">{STATUS_LABELS[step.step]}</span>
                    {step.valor > 0 && (
                      <span className="text-[12px] font-semibold" style={{ color }}>
                        {formatCurrencyShort(step.valor)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Row 3: Leads recentes + Fontes + Atividades */}
      <div className="grid grid-cols-3 gap-4">

        {/* Leads recentes */}
        <div className="glass-card flex flex-col overflow-hidden">
          <div className="mb-3 flex items-center gap-2">
            <BarChart2 size={15} className="text-indigo-400" strokeWidth={1.5} />
            <p className="text-[15px] font-semibold text-white">Leads recentes</p>
          </div>
          {recent.length === 0 ? (
            <p className="py-4 text-center text-sm text-white/50">Nenhum lead ainda</p>
          ) : recent.map((lead) => (
            <div key={lead.id}
              className="flex items-center gap-2 border-b py-2.5"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ background: STATUS_COLORS[lead.status] ?? '#94a3b8' }} />
              <div className="flex-1 min-w-0">
                <p className="truncate text-[13px] font-semibold text-white">{lead.empresa}</p>
                <p className="truncate text-[12px] text-white/70">
                  {SEGMENT_LABELS[lead.segmento] ?? lead.segmento} · {lead.cidade}
                </p>
              </div>
              <span className="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium"
                style={{ color: STATUS_COLORS[lead.status], background: `${STATUS_COLORS[lead.status]}20` }}>
                {STATUS_LABELS[lead.status] ?? lead.status}
              </span>
            </div>
          ))}
        </div>

        {/* Fontes de leads */}
        <div className="glass-card flex flex-col">
          <div className="mb-3 flex items-center gap-2">
            <Activity size={15} className="text-indigo-400" strokeWidth={1.5} />
            <p className="text-[15px] font-semibold text-white">Fontes de leads</p>
          </div>
          <div className="flex flex-col gap-3">
            {(metrics?.por_fonte ?? []).map(({ fonte, pct }: { fonte: string; pct: number }) => {
              const src = SOURCE_LABELS[fonte]
              return (
                <div key={fonte} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-white">{src?.label ?? fonte}</span>
                    <span className="text-[13px] font-semibold text-white">{pct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full"
                    style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: src?.color ?? '#6366f1' }} />
                  </div>
                </div>
              )
            })}
            {(!metrics?.por_fonte || metrics.por_fonte.length === 0) && (
              <p className="py-4 text-center text-sm text-white/50">Sem dados de fontes</p>
            )}
          </div>
        </div>

        {/* Status de atividades */}
        <div className="glass-card flex flex-col">
          <div className="mb-3 flex items-center gap-2">
            <Activity size={15} className="text-indigo-400" strokeWidth={1.5} />
            <p className="text-[15px] font-semibold text-white">Atividades</p>
            <span className="ml-auto rounded-full px-2 py-0.5 text-[12px] font-medium text-white"
              style={{ background: 'rgba(255,255,255,0.08)' }}>
              {activities.total} total
            </span>
          </div>

          {activities.total === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-4">
              <p className="text-sm text-white/60">Nenhuma atividade registrada</p>
              <p className="text-[12px] text-white/40 text-center">As atividades aparecerão aqui quando os vendedores registrarem ligações, e-mails e reuniões</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {activities.por_tipo.map(({ tipo, count, color }: { tipo: string; count: number; color: string }) => {
                const pct = activities.total > 0 ? Math.round((count / activities.total) * 100) : 0
                return (
                  <div key={tipo} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ background: color }} />
                        <span className="text-[13px] font-medium text-white">{TIPO_LABELS[tipo] ?? tipo}</span>
                      </div>
                      <span className="text-[13px] font-semibold text-white">{count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full"
                      style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
