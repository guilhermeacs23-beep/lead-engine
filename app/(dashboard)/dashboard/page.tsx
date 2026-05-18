'use client'
import { useState, useEffect } from 'react'
import { fetchDashboardMetrics, fetchLeads } from '@/lib/supabase'
import { SOURCE_LABELS, SEGMENT_LABELS } from '@/lib/mock-data'
import { formatCurrencyShort } from '@/lib/utils'
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react'

const WEEK_BARS = [40, 65, 35, 80, 55]

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null)
  const [recent,  setRecent]  = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [m, leads] = await Promise.all([
        fetchDashboardMetrics(),
        fetchLeads(),
      ])
      setMetrics(m)
      setRecent(leads.slice(0, 5))
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-white/30">
        <Loader2 size={18} className="animate-spin" />Carregando métricas…
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

  return (
    <div className="flex h-full flex-col overflow-auto p-5">
      {/* Métricas */}
      <div className="mb-5 grid grid-cols-4 gap-3">
        {METRIC_CARDS.map((m) => (
          <div key={m.label}
            className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.10)' }}
          >
            <p className="mb-1.5 text-[11px] text-white/50">{m.label}</p>
            <p className="text-2xl font-medium text-white/95">{m.value}</p>
            <p className={`mt-1 flex items-center gap-1 text-[11px] ${m.up ? 'text-emerald-400' : 'text-red-400'}`}>
              {m.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {m.delta}
            </p>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid flex-1 grid-cols-2 gap-4">
        {/* Leads recentes */}
        <div className="glass-card flex flex-col gap-0 overflow-hidden">
          <p className="mb-3 text-[13px] font-medium text-white/80">Leads recentes</p>
          {recent.length === 0 ? (
            <p className="py-4 text-center text-xs text-white/30">Nenhum lead ainda</p>
          ) : recent.map((lead) => (
            <div key={lead.id}
              className="flex items-center gap-2.5 border-b py-2.5"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ background: lead.score_ia >= 80 ? '#ef4444' : lead.score_ia >= 65 ? '#f59e0b' : '#60a5fa' }} />
              <div className="flex-1 min-w-0">
                <p className="truncate text-[12px] font-medium text-white/90">{lead.empresa}</p>
                <p className="truncate text-[10px] text-white/40">
                  {SEGMENT_LABELS[lead.segmento] ?? lead.segmento} · {lead.cidade}, {lead.estado}
                </p>
              </div>
              <span className="shrink-0 rounded-lg px-2 py-0.5 text-[10px]"
                style={getStatusStyle(lead.status)}>
                {getStatusLabel(lead.status)}
              </span>
            </div>
          ))}
        </div>

        {/* Fontes + Gráfico */}
        <div className="glass-card flex flex-col gap-4">
          <div>
            <p className="mb-3 text-[13px] font-medium text-white/80">Leads por semana</p>
            <div className="flex h-20 items-end gap-2">
              {WEEK_BARS.map((h, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="w-full rounded-t-sm" style={{ height: `${h}%`, background: 'rgba(99,102,241,0.5)' }} />
                  <span className="text-[10px] text-white/30">S{i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <p className="mb-3 text-[13px] font-medium text-white/80">Fontes de leads</p>
            <div className="flex flex-col gap-2.5">
              {(metrics?.por_fonte ?? []).map(({ fonte, pct }: { fonte: string; pct: number }) => {
                const src = SOURCE_LABELS[fonte]
                return (
                  <div key={fonte} className="flex items-center gap-2.5 text-[12px]">
                    <span className="w-24 text-white/50">{src?.label ?? fonte}</span>
                    <div className="flex-1 overflow-hidden rounded-full"
                      style={{ height: 5, background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: src?.color ?? '#6366f1' }} />
                    </div>
                    <span className="w-8 text-right font-medium text-white/80">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

functio