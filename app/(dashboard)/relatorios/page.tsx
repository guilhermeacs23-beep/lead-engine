'use client'
import React, { useState } from 'react'
import { TrendingUp, TrendingDown, Download, RefreshCw, BarChart2, PieChart, Users, Target } from 'lucide-react'
import { formatCurrencyShort } from '@/lib/utils'

// ── Dados fictícios ───────────────────────────────────────────

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai']

const RECEITA_MENSAL = [
  { mes: 'Jan', pipeline: 180000, fechado: 42000, leads: 28 },
  { mes: 'Fev', pipeline: 210000, fechado: 58000, leads: 34 },
  { mes: 'Mar', pipeline: 195000, fechado: 51000, leads: 31 },
  { mes: 'Abr', pipeline: 248000, fechado: 74000, leads: 42 },
  { mes: 'Mai', pipeline: 283000, fechado: 89000, leads: 47 },
]

const FUNIL = [
  { label: 'Novo Lead',   count: 47, color: '#818cf8', pct: 100 },
  { label: 'Contactado',  count: 31, color: '#60a5fa', pct: 66  },
  { label: 'Proposta',    count: 18, color: '#fbbf24', pct: 38  },
  { label: 'Negociando',  count: 12, color: '#f472b6', pct: 26  },
  { label: 'Fechado',     count: 8,  color: '#34d399', pct: 17  },
  { label: 'Perdido',     count: 5,  color: '#ef4444', pct: 11  },
]

const SEGMENTOS = [
  { label: 'Agronegócio',   pct: 35, color: '#34d399' },
  { label: 'Varejo',        pct: 22, color: '#60a5fa' },
  { label: 'Indústria',     pct: 18, color: '#818cf8' },
  { label: 'Farmacêutico',  pct: 12, color: '#f472b6' },
  { label: 'Moda / Têxtil', pct: 8,  color: '#fbbf24' },
  { label: 'Outros',        pct: 5,  color: '#94a3b8' },
]

const FONTES = [
  { label: 'LinkedIn Sales Navigator', pct: 42, color: '#0ea5e9' },
  { label: 'Google Maps',              pct: 28, color: '#34d399' },
  { label: 'Base CNPJ',                pct: 18, color: '#f59e0b' },
  { label: 'Indicação',                pct: 12, color: '#a78bfa' },
]

const VENDEDORES = [
  { nome: 'Guilherme Campos', iniciais: 'GC', cor: '#6366f1', fechados: 8,  pipeline: 124000, conversao: 38 },
  { nome: 'Maria Ribeiro',    iniciais: 'MR', cor: '#ec4899', fechados: 6,  pipeline: 98000,  conversao: 31 },
  { nome: 'Ricardo Silva',    iniciais: 'RS', cor: '#f59e0b', fechados: 5,  pipeline: 87000,  conversao: 27 },
  { nome: 'Ana Souza',        iniciais: 'AS', cor: '#10b981', fechados: 4,  pipeline: 72000,  conversao: 22 },
  { nome: 'João Pedro',       iniciais: 'JP', cor: '#60a5fa', fechados: 3,  pipeline: 61000,  conversao: 18 },
]

// ── Componentes de gráfico ────────────────────────────────────

function AreaChart() {
  const W = 500; const H = 120; const PAD = 8
  const maxVal = Math.max(...RECEITA_MENSAL.map(d => d.pipeline))
  const pts = RECEITA_MENSAL.map((d, i) => {
    const x = PAD + (i / (RECEITA_MENSAL.length - 1)) * (W - PAD * 2)
    const y = H - PAD - ((d.pipeline / maxVal) * (H - PAD * 2))
    return { x, y, ...d }
  })
  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')
  const area     = `M${pts[0].x},${H} ` + pts.map(p => `L${p.x},${p.y}`).join(' ') + ` L${pts[pts.length-1].x},${H} Z`

  const ptsFechado = RECEITA_MENSAL.map((d, i) => {
    const x = PAD + (i / (RECEITA_MENSAL.length - 1)) * (W - PAD * 2)
    const y = H - PAD - ((d.fechado / maxVal) * (H - PAD * 2))
    return { x, y }
  })
  const polyFechado = ptsFechado.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }}>
      <defs>
        <linearGradient id="grad-pipeline" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#grad-pipeline)" />
      <polyline points={polyline} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={polyFechado} fill="none" stroke="#34d399" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#6366f1" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      ))}
    </svg>
  )
}

function DonutChart() {
  const R = 52; const CX = 70; const CY = 70; const stroke = 22
  const circumference = 2 * Math.PI * R
  let offset = 0
  return (
    <svg viewBox="0 0 140 140" style={{ width: 140, height: 140, flexShrink: 0 }}>
      {SEGMENTOS.map((s, i) => {
        const dash   = (s.pct / 100) * circumference
        const gap    = circumference - dash
        const rotate = (offset / 100) * 360 - 90
        offset += s.pct
        return (
          <circle key={i} cx={CX} cy={CY} r={R}
            fill="none" stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={0}
            transform={`rotate(${rotate} ${CX} ${CY})`}
            style={{ transition: 'all 0.5s' }}
          />
        )
      })}
      <text x={CX} y={CY - 6} textAnchor="middle" fill="white" fontSize="16" fontWeight="700">47</text>
      <text x={CX} y={CY + 10} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9">leads</text>
    </svg>
  )
}

// ── Página ────────────────────────────────────────────────────

export default function RelatoriosPage() {
  const [periodo, setPeriodo] = useState('mai')

  const totalPipeline  = RECEITA_MENSAL.reduce((s, d) => s + d.pipeline, 0)
  const totalFechado   = RECEITA_MENSAL.reduce((s, d) => s + d.fechado, 0)
  const totalLeads     = RECEITA_MENSAL.reduce((s, d) => s + d.leads, 0)
  const taxaConversao  = Math.round((FUNIL.find(f => f.label === 'Fechado')!.count / FUNIL[0].count) * 100)

  return (
    <div className="flex h-full flex-col overflow-auto">

      {/* Topbar */}
      <div className="flex flex-shrink-0 items-center justify-between px-6 py-4"
        style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
        <div>
          <h1 className="text-[18px] font-bold text-white">Relatórios</h1>
          <p className="text-[13px] text-white/45">Dados fictícios · Janeiro – Maio 2026</p>
        </div>
        <div className="flex items-center gap-2">
          {['jan','fev','mar','abr','mai'].map(m => (
            <button key={m} onClick={() => setPeriodo(m)}
              className="rounded-lg px-3 py-1.5 text-[12px] font-medium capitalize transition-all"
              style={periodo === m
                ? { background: 'rgba(99,102,241,0.25)', color: '#a78bfa', border: '0.5px solid rgba(139,92,246,0.4)' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
              {m}
            </button>
          ))}
          <button className="ml-2 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-white/60 transition-all hover:bg-white/[0.07]"
            style={{ border: '0.5px solid rgba(255,255,255,0.10)' }}>
            <Download size={12} strokeWidth={1.5} />Exportar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 flex flex-col gap-5">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total de leads', value: totalLeads, suffix: '', up: true,  delta: '+18% vs mês anterior', icon: Users },
            { label: 'Pipeline total', value: formatCurrencyShort(totalPipeline), suffix: '', up: true,  delta: 'acumulado Jan–Mai', icon: Target },
            { label: 'Receita fechada', value: formatCurrencyShort(totalFechado), suffix: '', up: true, delta: '+22% vs trimestre anterior', icon: TrendingUp },
            { label: 'Taxa de conversão', value: `${taxaConversao}%`, suffix: '', up: false, delta: '-3pp vs meta 20%', icon: BarChart2 },
          ].map((k) => (
            <div key={k.label} className="rounded-xl p-5"
              style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.09)' }}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[13px] font-medium text-white/60">{k.label}</p>
                <k.icon size={15} strokeWidth={1.5} className="text-white/25" />
              </div>
              <p className="text-3xl font-bold text-white">{k.value}</p>
              <p className={`mt-1.5 flex items-center gap-1 text-[12px] font-medium ${k.up ? 'text-emerald-400' : 'text-amber-400'}`}>
                {k.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {k.delta}
              </p>
            </div>
          ))}
        </div>

        {/* Receita mensal + Funil */}
        <div className="grid grid-cols-5 gap-4">

          {/* Receita mensal — área */}
          <div className="col-span-3 rounded-xl p-5"
            style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.09)' }}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-white">Receita do pipeline</p>
                <p className="text-[12px] text-white/40">Jan – Mai 2026</p>
              </div>
              <div className="flex items-center gap-4 text-[12px]">
                <span className="flex items-center gap-1.5 text-white/60">
                  <span className="inline-block h-2 w-4 rounded-full bg-indigo-400" />Pipeline
                </span>
                <span className="flex items-center gap-1.5 text-white/60">
                  <span className="inline-block h-px w-4 border-b-2 border-dashed border-emerald-400" />Fechado
                </span>
              </div>
            </div>
            <AreaChart />
            {/* Eixo X */}
            <div className="mt-1 flex justify-between px-2">
              {RECEITA_MENSAL.map(d => (
                <span key={d.mes} className="text-[11px] text-white/30">{d.mes}</span>
              ))}
            </div>
            {/* Valores */}
            <div className="mt-3 grid grid-cols-5 gap-2">
              {RECEITA_MENSAL.map(d => (
                <div key={d.mes} className="rounded-lg px-2 py-1.5 text-center"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-[11px] font-bold text-indigo-300">{formatCurrencyShort(d.pipeline)}</p>
                  <p className="text-[10px] text-emerald-400">{formatCurrencyShort(d.fechado)}</p>
                  <p className="text-[10px] text-white/30">{d.leads} leads</p>
                </div>
              ))}
            </div>
          </div>

          {/* Funil de conversão */}
          <div className="col-span-2 rounded-xl p-5"
            style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.09)' }}>
            <p className="mb-4 text-[15px] font-semibold text-white">Funil de conversão</p>
            <div className="flex flex-col gap-3">
              {FUNIL.map((f, i) => (
                <div key={f.label}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[12px] font-medium text-white">{f.label}</span>
                    <span className="text-[12px] font-bold" style={{ color: f.color }}>{f.count}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full"
                    style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${f.pct}%`, background: f.color }} />
                  </div>
                  {i < FUNIL.length - 1 && (
                    <p className="mt-0.5 text-right text-[10px] text-white/25">
                      {Math.round((FUNIL[i+1].count / f.count) * 100)}% avançam
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Segmentos + Fontes + Vendedores */}
        <div className="grid grid-cols-3 gap-4">

          {/* Por segmento — donut */}
          <div className="rounded-xl p-5"
            style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.09)' }}>
            <p className="mb-4 text-[15px] font-semibold text-white">Leads por segmento</p>
            <div className="flex items-center gap-4">
              <DonutChart />
              <div className="flex flex-col gap-2 flex-1">
                {SEGMENTOS.map(s => (
                  <div key={s.label} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: s.color }} />
                      <span className="text-[11px] text-white/70">{s.label}</span>
                    </div>
                    <span className="text-[12px] font-bold text-white">{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Por fonte */}
          <div className="rounded-xl p-5"
            style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.09)' }}>
            <p className="mb-4 text-[15px] font-semibold text-white">Fontes de captação</p>
            <div className="flex flex-col gap-4">
              {FONTES.map(f => (
                <div key={f.label}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[13px] font-medium text-white">{f.label}</span>
                    <span className="text-[13px] font-bold" style={{ color: f.color }}>{f.pct}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full"
                    style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${f.pct}%`, background: f.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top vendedores */}
          <div className="rounded-xl p-5"
            style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.09)' }}>
            <p className="mb-4 text-[15px] font-semibold text-white">Performance por vendedor</p>
            <div className="flex flex-col gap-3">
              {VENDEDORES.map((v, i) => (
                <div key={v.nome} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.07)' }}>
                  {/* Posição */}
                  <span className="w-4 flex-shrink-0 text-center text-[11px] font-bold text-white/30">
                    {i + 1}
                  </span>
                  {/* Avatar */}
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: v.cor }}>
                    {v.iniciais}
                  </div>
                  {/* Nome + pipeline */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[12px] font-semibold text-white">{v.nome}</p>
                    <p className="text-[10px] text-white/40">{formatCurrencyShort(v.pipeline)} pipeline</p>
                  </div>
                  {/* Fechados */}
                  <div className="text-right">
                    <p className="text-[13px] font-bold text-emerald-400">{v.fechados}</p>
                    <p className="text-[10px] text-white/35">fechados</p>
                  </div>
                  {/* Conversão */}
                  <div className="text-right">
                    <p className="text-[12px] font-bold text-white">{v.conversao}%</p>
                    <p className="text-[10px] text-white/35">conv.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
