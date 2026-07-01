'use client'
import React, { useState, useEffect } from 'react'
import { fetchDashboardMetrics, fetchLeads, fetchFunnelData, fetchActivitiesStats } from '@/lib/supabase'
import { SOURCE_LABELS, SEGMENT_LABELS } from '@/lib/mock-data'
import { formatCurrencyShort } from '@/lib/utils'
import { TrendingUp, TrendingDown, Loader2, Users, Target, BarChart2, Activity, Download } from 'lucide-react'

const STATUS_LABELS = {
  novo: 'Novo', contactado: 'Contactado', proposta: 'Proposta',
  negociando: 'Negociando', fechado: 'Fechado', perdido: 'Perdido',
}
const STATUS_COLORS = {
  novo: '#818cf8', contactado: '#60a5fa', proposta: '#fbbf24',
  negociando: '#f472b6', fechado: '#34d399', perdido: '#ef4444',
}
const TIPO_LABELS = {
  ligacao: 'Ligação', email: 'E-mail', reuniao: 'Reunião',
  nota: 'Nota', proposta: 'Proposta', status: 'Status',
}

const CARD_STYLE = {
  background: '#fff',
  border: '1px solid #e5e5e5',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
}

export default function RelatoriosPage() {
  const [metrics, setMetrics] = useState(null)
  const [recent, setRecent] = useState([])
  const [funnel, setFunnel] = useState([])
  const [activities, setActivities] = useState({ total: 0, por_tipo: [] })
  const [loading, setLoading] = useState(true)

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

  const maxFunnelCount = Math.max(...funnel.map((f) => f.count), 1)

  return (
    <div className="flex h-full flex-col overflow-auto">

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <div>
          <h1 className="text-[20px] font-bold text-white">Relatórios</h1>
          <p className="text-[13px] text-white/50 mt-0.5">
            {metrics ? metrics.total_leads : 0} leads no banco · dados em tempo real
          </p>
        </div>
        <button
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-medium text-white/60 transition-all hover:bg-white/[0.07]"
          style={{ border: '0.5px solid rgba(255,255,255,0.12)' }}
        >
          <Download size={13} strokeWidth={1.5} /> Exportar
        </button>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6 flex flex-col gap-4">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3">
          {metrics && [
            { label: 'Leads este mês', value: String(metrics.leads_mes), delta: '+' + metrics.leads_delta + '% vs mês anterior', up: true, icon: Users },
            { label: 'Em negociação', value: formatCurrencyShort(metrics.valor_pipeline), delta: metrics.oportunidades + ' oportunidades', up: true, icon: Target },
            { label: 'Fechados (mês)', value: String(metrics.fechados_mes), delta: formatCurrencyShort(metrics.valor_fechado) + ' convertido', up: true, icon: TrendingUp },
            { label: 'Conversão', value: metrics.taxa_conversao + '%', delta: metrics.taxa_delta + '% vs meta', up: metrics.taxa_delta >= 0, icon: BarChart2 },
          ].map((k) => {
            const KIcon = k.icon
            return (
              <div key={k.label} className="rounded-2xl p-5" style={CARD_STYLE}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[12px] font-medium" style={{ color: '#888' }}>{k.label}</p>
                  <KIcon size={15} strokeWidth={1.5} style={{ color: '#ccc' }} />
                </div>
                <p className="text-[28px] font-bold leading-none" style={{ color: '#111' }}>{k.value}</p>
                <p className={'mt-2 flex items-center gap-1 text-[12px] font-medium ' + (k.up ? 'text-emerald-500' : 'text-red-500')}>
                  {k.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {k.delta}
                </p>
              </div>
            )
          })}
        </div>

        {/* Funil + Fontes */}
        <div className="grid grid-cols-5 gap-4">

          {/* Saúde do Funil */}
          <div className="col-span-3 rounded-2xl p-5" style={CARD_STYLE}>
            <div className="mb-4 flex items-center gap-2">
              <Target size={15} className="text-indigo-500" strokeWidth={1.5} />
              <p className="text-[15px] font-semibold" style={{ color: '#111' }}>Saúde do Funil</p>
              <span className="ml-auto text-[13px]" style={{ color: '#888' }}>
                Conversão: <span className="font-semibold" style={{ color: '#111' }}>{metrics ? metrics.taxa_conversao : 0}%</span>
              </span>
            </div>
            {funnel.length === 0 ? (
              <p className="py-8 text-center text-sm" style={{ color: '#aaa' }}>Nenhum lead no pipeline</p>
            ) : (
              <div className="flex items-end gap-0">
                {funnel.map((step, i) => {
                  const color = STATUS_COLORS[step.step] || '#6366f1'
                  const barH = Math.max(12, Math.round((step.count / maxFunnelCount) * 96))
                  return (
                    <div key={step.step} className="flex flex-1 flex-col items-center gap-1.5">
                      <div className="flex w-full items-center justify-center h-5">
                        {i > 0 && (
                          <span className="rounded-full px-1.5 py-0.5 text-[11px] font-semibold"
                            style={{ background: color + '20', color }}>
                            {step.pct_conversao}%
                          </span>
                        )}
                      </div>
                      <span className="text-[14px] font-bold" style={{ color: '#111' }}>{step.count}</span>
                      <div className="relative w-full overflow-hidden rounded-t-lg"
                        style={{ height: barH, background: color + 'CC' }}>
                        <div className="absolute inset-0"
                          style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.25), transparent)' }} />
                      </div>
                      <div className="flex flex-col items-center gap-0.5 mt-1">
                        <div className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                        <span className="text-[11px] font-medium" style={{ color: '#555' }}>{STATUS_LABELS[step.step]}</span>
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
            )}
          </div>

          {/* Fontes de leads */}
          <div className="col-span-2 rounded-2xl p-5" style={CARD_STYLE}>
            <div className="mb-3 flex items-center gap-2">
              <Activity size={15} className="text-indigo-500" strokeWidth={1.5} />
              <p className="text-[15px] font-semibold" style={{ color: '#111' }}>Fontes de leads</p>
            </div>
            <div className="flex flex-col gap-3">
              {(metrics ? metrics.por_fonte : []).map(({ fonte, pct }) => {
                const src = SOURCE_LABELS[fonte]
                return (
                  <div key={fonte} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium" style={{ color: '#555' }}>{src ? src.label : fonte}</span>
                      <span className="text-[13px] font-bold" style={{ color: '#111' }}>{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: '#f0f0f0' }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: pct + '%', background: src ? src.color : '#6366f1' }} />
                    </div>
                  </div>
                )
              })}
              {(metrics ? metrics.por_fonte : []).length === 0 && (
                <p className="py-6 text-center text-sm" style={{ color: '#aaa' }}>Sem dados de fontes</p>
              )}
            </div>
          </div>
        </div>

        {/* Leads recentes + Atividades */}
        <div className="grid grid-cols-3 gap-4">

          {/* Leads recentes */}
          <div className="col-span-2 rounded-2xl p-5" style={CARD_STYLE}>
            <div className="mb-3 flex items-center gap-2">
              <BarChart2 size={15} className="text-indigo-500" strokeWidth={1.5} />
              <p className="text-[15px] font-semibold" style={{ color: '#111' }}>Leads recentes</p>
            </div>
            {recent.length === 0 ? (
              <p className="py-6 text-center text-sm" style={{ color: '#aaa' }}>Nenhum lead cadastrado ainda</p>
            ) : recent.map((lead) => (
              <div key={lead.id}
                className="flex items-center gap-3 border-b py-3 last:border-0"
                style={{ borderColor: '#f0f0f0' }}>
                <div className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ background: STATUS_COLORS[lead.status] || '#94a3b8' }} />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[13px] font-semibold" style={{ color: '#111' }}>{lead.empresa}</p>
                  <p className="truncate text-[12px]" style={{ color: '#888' }}>
                    {SEGMENT_LABELS[lead.segmento] || lead.segmento} · {lead.cidade}
                  </p>
                </div>
                <span className="shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold"
                  style={{ color: STATUS_COLORS[lead.status], background: STATUS_COLORS[lead.status] + '20' }}>
                  {STATUS_LABELS[lead.status] || lead.status}
                </span>
              </div>
            ))}
          </div>

          {/* Atividades */}
          <div className="rounded-2xl p-5" style={CARD_STYLE}>
            <div className="mb-3 flex items-center gap-2">
              <Activity size={15} className="text-indigo-500" strokeWidth={1.5} />
              <p className="text-[15px] font-semibold" style={{ color: '#111' }}>Atividades</p>
              <span className="ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{ background: '#f0f0f0', color: '#888' }}>
                {activities.total}
              </span>
            </div>
            {activities.total === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-6">
                <p className="text-sm" style={{ color: '#aaa' }}>Nenhuma atividade</p>
                <p className="text-[12px] text-center" style={{ color: '#bbb' }}>
                  Ligações, e-mails e reuniões aparecerão aqui
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {activities.por_tipo.map((a) => {
                  const label = TIPO_LABELS[a.tipo] || a.tipo
                  const pct = activities.total > 0 ? Math.round((a.count / activities.total) * 100) : 0
                  return (
                    <div key={a.tipo} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px]" style={{ color: '#777' }}>{label}</span>
                        <span className="text-[12px] font-semibold" style={{ color: '#111' }}>{a.count}</span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: '#f0f0f0' }}>
                        <div className="h-full rounded-full bg-indigo-400"
                          style={{ width: pct + '%' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
