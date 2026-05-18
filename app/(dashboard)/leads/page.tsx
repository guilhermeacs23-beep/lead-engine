'use client'
import { useState } from 'react'
import { MOCK_LEADS, SOURCE_LABELS, SEGMENT_LABELS } from '@/lib/mock-data'
import { getScoreColor, formatCurrencyShort } from '@/lib/utils'
import { Lead } from '@/types'
import { Search, Sparkles, Plus, Filter } from 'lucide-react'

const SEGMENTS = [
  { value: '', label: 'Todos os segmentos' },
  { value: 'agronegocio',  label: 'Agronegócio'   },
  { value: 'varejo',       label: 'Varejo'         },
  { value: 'industria',    label: 'Indústria'      },
  { value: 'farmaceutico', label: 'Farmacêutico'   },
  { value: 'moda',         label: 'Moda / Têxtil'  },
  { value: 'construcao',   label: 'Construção'     },
  { value: 'alimentos',    label: 'Alimentos'      },
]

const STATES = ['Todos', 'SP', 'MG', 'SC', 'RS', 'PR', 'GO', 'CE', 'MT']

const SOURCES = [
  { id: 'linkedin',  label: 'LinkedIn Sales Navigator' },
  { id: 'google',    label: 'Google Maps'              },
  { id: 'cnpj',      label: 'Base CNPJ (Receita)'     },
  { id: 'indicacao', label: 'Indicação'                },
]

export default function LeadsPage() {
  const [segment, setSegment] = useState('')
  const [state,   setState]   = useState('Todos')
  const [sources, setSources] = useState(['linkedin', 'google', 'cnpj'])
  const [query,   setQuery]   = useState('')

  const toggleSource = (id: string) =>
    setSources((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])

  const filtered = MOCK_LEADS.filter((l) => {
    if (segment && l.segmento !== segment)          return false
    if (state !== 'Todos' && l.estado !== state)   return false
    if (!sources.includes(l.fonte))                return false
    if (query && !l.empresa.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  return (
    <div className="flex h-full flex-col overflow-auto p-5">
      {/* Filters */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <SelectField label="Segmento / nicho" value={segment} onChange={setSegment}>
          {SEGMENTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </SelectField>
        <SelectField label="Estado / região" value={state} onChange={setState}>
          {STATES.map((s) => <option key={s} value={s}>{s === 'Todos' ? 'Todos os estados' : s}</option>)}
        </SelectField>
        <SelectField label="Porte da empresa" value="" onChange={() => {}}>
          <option>Todos os portes</option>
          <option>Pequena (até 50 func.)</option>
          <option>Média (50–500)</option>
          <option>Grande (500+)</option>
        </SelectField>
      </div>

      {/* Source pills */}
      <div className="mb-4">
        <p className="mb-2 text-[11px] text-white/40">Fontes de busca</p>
        <div className="flex flex-wrap gap-2">
          {SOURCES.map(({ id, label }) => (
            <button key={id} onClick={() => toggleSource(id)}
              className={`rounded-full px-3.5 py-1.5 text-xs transition-all duration-150
                ${sources.includes(id)
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/60'}`}
              style={sources.includes(id)
                ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 16px rgba(99,102,241,0.3)' }
                : { background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.12)' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Header da tabela */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg px-3 py-1.5"
            style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.10)' }}>
            <Search size={13} className="text-white/35" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar empresa..."
              className="bg-transparent text-xs text-white/80 outline-none placeholder:text-white/30 w-40"
            />
          </div>
          <span className="text-xs text-white/40">
            {filtered.length} leads encontrados · pontuados por potencial de frete
          </span>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost flex items-center gap-1.5 text-xs">
            <Filter size={12} strokeWidth={1.5} />
            Filtros
          </button>
          <button className="btn-primary flex items-center gap-1.5 text-xs">
            <Sparkles size={12} strokeWidth={1.5} />
            Importar todos
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-xl" style={{ border: '0.5px solid rgba(255,255,255,0.10)' }}>
        {/* Head */}
        <div className="grid items-center px-4 py-2.5 text-[11px] font-medium text-white/40"
          style={{
            gridTemplateColumns: '2fr 1.2fr 0.8fr 0.7fr 0.7fr 90px',
            background: 'rgba(255,255,255,0.05)',
            borderBottom: '0.5px solid rgba(255,255,255,0.08)',
          }}>
          <span>Empresa</span>
          <span>Segmento</span>
          <span>Cidade / UF</span>
          <span>Potencial</span>
          <span>Fonte</span>
          <span></span>
        </div>

        {/* Rows */}
        {filtered.map((lead) => (
          <LeadRow key={lead.id} lead={lead} />
        ))}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-white/30">
            Nenhum lead encontrado com esses filtros
          </div>
        )}
      </div>
    </div>
  )
}

function LeadRow({ lead }: { lead: Lead }) {
  const score  = getScoreColor(lead.score_ia)
  const source = SOURCE_LABELS[lead.fonte]

  return (
    <div className="grid items-center px-4 py-3 text-xs transition-all hover:bg-white/[0.04] cursor-pointer"
      style={{
        gridTemplateColumns: '2fr 1.2fr 0.8fr 0.7fr 0.7fr 90px',
        borderBottom: '0.5px solid rgba(255,255,255,0.06)',
      }}>
      <div>
        <p className="font-medium text-white/90">{lead.empresa}</p>
        <p className="mt-0.5 text-[10px] text-white/40">{lead.contato_nome} · {lead.contato_cargo}</p>
      </div>
      <span className="text-white/55">{SEGMENT_LABELS[lead.segmento]}</span>
      <span className="text-white/55">{lead.cidade}, {lead.estado}</span>
      <div className="flex items-center gap-2">
        <div className="flex-1 overflow-hidden rounded-full" style={{ height: 4, background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full" style={{ width: `${lead.score_ia}%`, background: score.color }} />
        </div>
        <span className="text-[11px] font-medium" style={{ color: score.color, minWidth: 26 }}>{lead.score_ia}</span>
      </div>
      {source && (
        <span className="w-fit rounded-lg px-2 py-0.5 text-[10px]"
          style={{ color: source.color, background: source.bg }}>
          {source.label}
        </span>
      )}
      <div className="flex justify-end">
        <button className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium text-indigo-400 transition-all hover:bg-indigo-500/15">
          <Plus size={11} strokeWidth={2} />
          Adicionar
        </button>
      </div>
    </div>
  )
}

function SelectField({
  label, value, onChange, children
}: {
  label: string
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] text-white/40">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg px-3 py-2 text-xs text-white/80 outline-none appearance-none"
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: '0.5px solid rgba(255,255,255,0.12)',
        }}
      >
        {children}
      </select>
    </div>
  )
}
