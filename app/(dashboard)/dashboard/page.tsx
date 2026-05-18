import { MOCK_METRICS, MOCK_LEADS, SOURCE_LABELS, SEGMENT_LABELS } from '@/lib/mock-data'
import { formatCurrencyShort } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

const METRICS = [
  {
    label: 'Leads este mês',
    value: MOCK_METRICS.leads_mes,
    delta: `+${MOCK_METRICS.leads_delta}% vs mês anterior`,
    up: true,
  },
  {
    label: 'Em negociação',
    value: formatCurrencyShort(MOCK_METRICS.valor_pipeline),
    delta: `+${MOCK_METRICS.oportunidades} oportunidades`,
    up: true,
  },
  {
    label: 'Fechados (mês)',
    value: MOCK_METRICS.fechados_mes,
    delta: formatCurrencyShort(MOCK_METRICS.valor_fechado) + ' convertido',
    up: true,
  },
  {
    label: 'Taxa de conversão',
    value: `${MOCK_METRICS.taxa_conversao}%`,
    delta: `${MOCK_METRICS.taxa_delta}% vs meta`,
    up: false,
  },
]

const RECENT = MOCK_LEADS.slice(0, 5)

const SOURCE_BARS = [
  { source: 'linkedin',  pct: 52 },
  { source: 'google',    pct: 28 },
  { source: 'cnpj',      pct: 13 },
  { source: 'indicacao', pct:  7 },
]

const WEEK_BARS = [40, 65, 35, 80, 55]

export default function DashboardPage() {
  return (
    <div className="flex h-full flex-col overflow-auto p-5">
      {/* Metrics */}
      <div className="mb-5 grid grid-cols-4 gap-3">
        {METRICS.map((m) => (
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
          {RECENT.map((lead) => (
            <div key={lead.id}
              className="flex items-center gap-2.5 border-b py-2.5"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ background: lead.score_ia >= 80 ? '#ef4444' : lead.score_ia >= 65 ? '#f59e0b' : '#60a5fa' }} />
              <div className="flex-1 min-w-0">
                <p className="truncate text-[12px] font-medium text-white/90">{lead.empresa}</p>
                <p className="truncate text-[10px] text-white/40">
                  {SEGMENT_LABELS[lead.segmento]} · {lead.cidade}, {lead.estado}
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
              {SOURCE_BARS.map(({ source, pct }) => {
                const src = SOURCE_LABELS[source]
                return (
                  <div key={source} className="flex items-center gap-2.5 text-[12px]">
                    <span className="w-24 text-white/50">{src?.label}</span>
                    <div className="flex-1 overflow-hidden rounded-full"
                      style={{ height: 5, background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: src?.color }} />
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

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    novo: 'Novo', contactado: 'Contactado', proposta: 'Proposta',
    negociando: 'Negociando', fechado: 'Fechado', perdido: 'Perdido',
  }
  return map[status] ?? status
}

function getStatusStyle(status: string): React.CSSProperties {
  const map: Record<string, { color: string; background: string }> = {
    novo:       { color: '#818cf8', background: 'rgba(99,102,241,0.15)'  },
    contactado: { color: '#60a5fa', background: 'rgba(59,130,246,0.15)'  },
    proposta:   { color: '#fbbf24', background: 'rgba(245,158,11,0.15)'  },
    negociando: { color: '#f472b6', background: 'rgba(236,72,153,0.15)'  },
    fechado:    { color: '#34d399', background: 'rgba(16,185,129,0.15)'  },
  }
  return map[status] ?? {}
}
