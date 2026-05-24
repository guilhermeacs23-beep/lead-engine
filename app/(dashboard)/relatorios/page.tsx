'use client'
import React, { useState, useEffect } from 'react'
import { fetchReportData, fetchFunnelData } from '@/lib/supabase'
import { formatCurrencyShort } from '@/lib/utils'
import { TrendingUp, Download, Loader2, Target, PieChart, BarChart2, Users } from 'lucide-react'

const STATUS_LABELS: Record<string,string> = {
  novo:'Novo Lead', contactado:'Contactado', proposta:'Proposta',
  negociando:'Negociando', fechado:'Fechado', perdido:'Perdido'
}
const STATUS_COLORS: Record<string,string> = {
  novo:'#818cf8', contactado:'#60a5fa', proposta:'#fbbf24',
  negociando:'#f472b6', fechado:'#34d399', perdido:'#ef4444'
}
const SEG_LABELS: Record<string,string> = {
  agronegocio:'Agronegócio', varejo:'Varejo', industria:'Indústria',
  farmaceutico:'Farmacêutico', moda:'Moda / Têxtil', construcao:'Construção',
  alimentos:'Alimentos', logistica:'Logística', tecnologia:'Tecnologia'
}
const SRC_LABELS: Record<string,string> = {
  linkedin:'LinkedIn Sales Nav.', google:'Google Maps',
  cnpj:'Base CNPJ', indicacao:'Indicação', apollo:'Apollo.io'
}

// ── CSV export ────────────────────────────────────────────────
function downloadCSV(rows: any[], filename: string) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => {
      const v = String(r[h] ?? '').replace(/"/g, '""')
      return v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v}"` : v
    }).join(',')),
  ].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }))
  a.download = filename
  a.click()
}

// ── SVG Charts ────────────────────────────────────────────────
function AreaChart({ data }: { data: { mes: string; pipeline: number; fechado: number }[] }) {
  const W = 540, H = 160, PAD = { t: 12, r: 8, b: 28, l: 52 }
  const IW = W - PAD.l - PAD.r, IH = H - PAD.t - PAD.b
  const maxV = Math.max(...data.map(d => d.pipeline), 1)

  const px = (i: number) => PAD.l + (i / (data.length - 1)) * IW
  const py = (v: number) => PAD.t + IH - (v / maxV) * IH

  const pline = (k: 'pipeline' | 'fechado') =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'}${px(i)},${py(d[k])}`).join(' ')

  const area = (k: 'pipeline' | 'fechado') =>
    `${pline(k)} L${px(data.length - 1)},${PAD.t + IH} L${PAD.l},${PAD.t + IH} Z`

  if (data.length < 2) return (
    <div className="flex h-40 items-center justify-center text-sm text-white/30">
      Dados insuficientes para o gráfico
    </div>
  )

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <defs>
        <linearGradient id="gPipe" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="gFech" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#34d399" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Y grid */}
      {[0,.25,.5,.75,1].map(f => {
        const y = PAD.t + IH - f * IH
        return (
          <g key={f}>
            <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y}
              stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            <text x={PAD.l - 6} y={y + 4} textAnchor="end"
              fill="rgba(255,255,255,0.3)" fontSize="9">
              {formatCurrencyShort(maxV * f)}
            </text>
          </g>
        )
      })}

      {/* Areas */}
      <path d={area('pipeline')} fill="url(#gPipe)" />
      <path d={area('fechado')}  fill="url(#gFech)" />

      {/* Lines */}
      <path d={pline('pipeline')} fill="none" stroke="#6366f1" strokeWidth="1.8" />
      <path d={pline('fechado')}  fill="none" stroke="#34d399" strokeWidth="1.5" strokeDasharray="4,3" />

      {/* Dots + X labels */}
      {data.map((d, i) => (
        <g key={d.mes}>
          <circle cx={px(i)} cy={py(d.pipeline)} r="3" fill="#6366f1" />
          <circle cx={px(i)} cy={py(d.fechado)}  r="2.5" fill="#34d399" />
          <text x={px(i)} y={H - 6} textAnchor="middle"
            fill="rgba(255,255,255,0.4)" fontSize="10">{d.mes}</text>
        </g>
      ))}
    </svg>
  )
}

function DonutChart({ segments }: { segments: { label: string; pct: number; color: string }[] }) {
  const R = 52, CX = 68, CY = 68, CIRC = 2 * Math.PI * R
  let offset = 0
  return (
    <svg viewBox="0 0 136 136" width="136" height="136">
      {segments.map(s => {
        const dash = (s.pct / 100) * CIRC
        const gap  = CIRC - dash
        const el = (
          <circle key={s.label} cx={CX} cy={CY} r={R}
            fill="none" stroke={s.color} strokeWidth="22"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            transform="rotate(-90, 68, 68)" />
        )
        offset += dash
        return el
      })}
      <circle cx={CX} cy={CY} r={R - 14} fill="rgba(12,10,30,0.95)" />
    </svg>
  )
}

// ── Page ──────────────────────────────────────────────────────
export default function RelatoriosPage() {
  const [report, setReport] = useState<any>(null)
  const [funnel, setFunnel] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [r, f] = await Promise.all([fetchReportData(), fetchFunnelData()])
      setReport(r)
      setFunnel(f)
      setLoading(false)
    }
    load()
  }, [])

  function exportLeadsCSV() {
    if (!report?.rawLeads?.length) return
    const rows = report.rawLeads.map((l: any) => ({
      Empresa:     l.empresa,
      Contato:     l.contato_nome,
      Cargo:       l.contato_cargo,
      Segmento:    SEG_LABELS[l.segmento] ?? l.segmento,
      Cidade:      l.cidade,
      Estado:      l.estado,
      Status:      STATUS_LABELS[l.status] ?? l.status,
      Fonte:       SRC_LABELS[l.fonte] ?? l.fonte,
      Valor_R$:    l.valor_estimado ?? 0,
      Score:       l.score_ia,
      Criado_em:   l.created_at?.slice(0, 10),
    }))
    downloadCSV(rows, `leads-${new Date().toISOString().slice(0,10)}.csv`)
  }

  function exportMonthlyCSV() {
    if (!report?.months?.length) return
    const rows = report.months.map((m: any) => ({
      Mês:      m.mes,
      Leads:    m.leads,
      Pipeline: m.pipeline,
      Fechado:  m.fechado,
    }))
    downloadCSV(rows, `relatorio-mensal-${new Date().toISOString().slice(0,10)}.csv`)
  }

  if (loading) return (
    <div className="flex h-full items-center justify-center gap-2 text-base text-white/50">
      <Loader2 size={20} className="animate-spin" />Carregando relatórios…
    </div>
  )

  if (!report) return (
    <div className="flex h-full items-center justify-center text-sm text-white/40">
      Nenhum dado disponível ainda.
    </div>
  )

  const maxFunnel = Math.max(...funnel.map(f => f.count), 1)

  const KPI_CARDS = [
    { label: 'Total de leads',   value: report.total_leads,                   delta: `+${report.leads_mes} este mês`        },
    { label: 'Pipeline total',   value: formatCurrencyShort(report.valor_pipeline), delta: 'valor estimado em aberto'        },
    { label: 'Receita fechada',  value: formatCurrencyShort(report.valor_fechado),  delta: `${report.fechados_mes} fechamentos` },
    { label: 'Conversão',        value: `${report.taxa_conversao}%`,           delta: 'leads → fechado'                     },
  ]

  return (
    <div className="flex h-full flex-col overflow-auto p-5 gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold text-white">Relatórios</h1>
          <p className="text-[13px] text-white/40">{report.total_leads} leads no banco · dados em tempo real</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportMonthlyCSV}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-all hover:bg-white/[0.08] hover:text-white"
            style={{ border: '0.5px solid rgba(255,255,255,0.12)' }}>
            <Download size={13} strokeWidth={1.5} />CSV Mensal
          </button>
          <button onClick={exportLeadsCSV}
            className="btn-primary flex items-center gap-1.5 text-sm">
            <Download size={13} strokeWidth={1.5} />Exportar Leads
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {KPI_CARDS.map(c => (
          <div key={c.label} className="rounded-xl p-5"
            style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.10)' }}>
            <p className="mb-2 text-[13px] font-medium text-white">{c.label}</p>
            <p className="text-3xl font-semibold text-white">{c.value}</p>
            <p className="mt-1.5 flex items-center gap-1 text-[13px] font-medium text-emerald-400">
              <TrendingUp size={13} />{c.delta}
            </p>
          </div>
        ))}
      </div>

      {/* Row 2: Area chart + Funnel */}
      <div className="grid grid-cols-5 gap-4">

        {/* Area chart */}
        <div className="col-span-3 rounded-xl p-5"
          style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.10)' }}>
          <div className="mb-4 flex items-center gap-2">
            <BarChart2 size={15} className="text-indigo-400" strokeWidth={1.5} />
            <p className="text-[15px] font-semibold text-white">Evolução mensal</p>
            <div className="ml-auto flex items-center gap-4 text-[12px]">
              <span className="flex items-center gap-1.5 text-white/55">
                <span className="inline-block h-2 w-4 rounded-full bg-indigo-500" />Pipeline
              </span>
              <span className="flex items-center gap-1.5 text-white/55">
                <span className="inline-block h-px w-4 border-t border-dashed border-emerald-400" />Fechado
              </span>
            </div>
          </div>
          <AreaChart data={report.months} />
        </div>

        {/* Funnel */}
        <div className="col-span-2 rounded-xl p-5"
          style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.10)' }}>
          <div className="mb-4 flex items-center gap-2">
            <Target size={15} className="text-indigo-400" strokeWidth={1.5} />
            <p className="text-[15px] font-semibold text-white">Funil</p>
          </div>
          {funnel.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/40">Nenhum lead no pipeline</p>
          ) : (
            <div className="flex flex-col gap-2">
              {funnel.map(step => {
                const color = STATUS_COLORS[step.step] ?? '#6366f1'
                const barW  = maxFunnel > 0 ? Math.max(4, Math.round((step.count / maxFunnel) * 100)) : 4
                return (
                  <div key={step.step} className="flex items-center gap-3">
                    <span className="w-20 text-right text-[12px] font-medium text-white">
                      {STATUS_LABELS[step.step]}
                    </span>
                    <div className="flex flex-1 items-center gap-2">
                      <div className="h-5 overflow-hidden rounded-md" style={{ width: `${barW}%`, background: `${color}CC`, minWidth: 8 }}>
                        <div className="h-full opacity-30"
                          style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.2), transparent)' }} />
                      </div>
                      <span className="text-[12px] font-bold text-white">{step.count}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Donut + Fontes */}
      <div className="grid grid-cols-2 gap-4">

        {/* Segmentos */}
        <div className="rounded-xl p-5"
          style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.10)' }}>
          <div className="mb-4 flex items-center gap-2">
            <PieChart size={15} className="text-indigo-400" strokeWidth={1.5} />
            <p className="text-[15px] font-semibold text-white">Segmentos</p>
          </div>
          {report.segmentos.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/40">Sem dados</p>
          ) : (
            <div className="flex items-center gap-5">
              <DonutChart segments={report.segmentos} />
              <div className="flex flex-1 flex-col gap-2">
                {report.segmentos.map((s: any) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="flex-1 text-[12px] text-white">{SEG_LABELS[s.label] ?? s.label}</span>
                    <span className="text-[12px] font-semibold text-white">{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fontes */}
        <div className="rounded-xl p-5"
          style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.10)' }}>
          <div className="mb-4 flex items-center gap-2">
            <Users size={15} className="text-indigo-400" strokeWidth={1.5} />
            <p className="text-[15px] font-semibold text-white">Fontes de aquisição</p>
          </div>
          {report.fontes.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/40">Sem dados</p>
          ) : (
            <div className="flex flex-col gap-3">
              {report.fontes.map((f: any) => (
                <div key={f.fonte} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-white">{SRC_LABELS[f.fonte] ?? f.fonte}</span>
                    <span className="text-[13px] font-semibold text-white">{f.pct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full"
                    style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${f.pct}%`, background: f.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
