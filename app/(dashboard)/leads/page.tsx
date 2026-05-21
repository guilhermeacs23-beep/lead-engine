'use client'
import React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { fetchLeads } from '@/lib/supabase'
import { SOURCE_LABELS, SEGMENT_LABELS } from '@/lib/mock-data'
import { getScoreColor } from '@/lib/utils'
import { LeadDrawer } from '@/components/ui/lead-drawer'
import { Search, Sparkles, Plus, Filter, Loader2 } from 'lucide-react'

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

const STATES = ['Todos', 'SP', 'MG', 'SC', 'RS', 'PR', 'GO', 'CE', 'MT', 'RJ', 'BA']

const SOURCES = [
  { id: 'linkedin',  label: 'LinkedIn Sales Navigator' },
  { id: 'google',    label: 'Google Maps'              },
  { id: 'cnpj',      label: 'Base CNPJ (Receita)'      },
  { id: 'indicacao', label: 'Indicação'                },
]

export default function LeadsPage() {
  const [leads,       setLeads]       = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [segment,     setSegment]     = useState('')
  const [state,       setState]       = useState('Todos')
  const [sources,     setSources]     = useState(['linkedin', 'google', 'cnpj', 'indicacao'])
  const [query,       setQuery]       = useState('')
  const [selectedLead, setSelectedLead] = useState<any | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetchLeads({ segmento: segment, estado: state, fontes: sources, query })
    setLeads(data)
    setLoading(false)
  }, [segment, state, sources, query])

  useEffect(() => { load() }, [load])

  const toggleSource = (id: string) =>
    setSources(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])

  return (
    <div className="flex h-full flex-col overflow-auto p-5">
      <LeadDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} />

      {/* Filtros */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <SelectField label="Segmento / nicho" value={segment} onChange={setSegment}>
          {SEGMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </SelectField>
        <SelectField label="Estado / região" value={state} onChange={setState}>
          {STATES.map(s => <option key={s} value={s}>{s === 'Todos' ? 'Todos os estados' : s}</option>)}
        </SelectField>
        <SelectField label="Porte da empresa" value="" onChange={() => {}}>
          <option>Todos os portes</option>
          <option>Pequena (até 50 func.)</option>
          <option>Media (50-500)</option>
          <option>Grande (500+)</option>
        </SelectField>
      </div>

      {/* Fontes */}
      <div className="mb-4">
        <p className="mb-2 text-[13px] font-medium text-white">Fontes de busca</p>
        <div className="flex flex-wrap gap-2">
          {SOURCES.map(({ id, label }) => (
            <button key={id} onClick={() => toggleSource(id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150 ${sources.includes(id) ? 'text-white' : 'text-white/60 hover:text-white'}`}
              style={sources.includes(id)
                ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 16px rgba(99,102,241,0.3)' }
                : { background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.12)' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Barra de ação */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.10)' }}>
            <Search size={14} className="text-white/60" />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Buscar empresa..."
              className="w-44 bg-transparent text-sm text-white outline-none placeholder:text-white/40" />
          </div>
          <span className="text-sm text-white/70">
            {loading ? 'Buscando...' : `${leads.length} leads encontrados · pontuados por potencial de frete`}
          </span>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost flex items-center gap-1.5 text-sm">
            <Filter size={13} strokeWidth={1.5} />Filtros
          </button>
          <button className="btn-primary flex items-center gap-1.5 text-sm">
            <Sparkles size={13} strokeWidth={1.5} />Importar todos
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-xl" style={{ border: '0.5px solid rgba(255,255,255,0.10)' }}>
        <div className="grid items-center px-4 py-3 text-[13px] font-semibold text-white"
          style={{ gridTemplateColumns: '2fr 1.2fr 0.8fr 0.7fr 0.7fr 90px', background: 'rgba(255,255,255,0.07)', borderBottom: '0.5px solid rgba(255,255,255,0.10)' }}>
          <span>Empresa</span><span>Segmento</span><span>Cidade / UF</span><span>Potencial</span><span>Fonte</span><span></span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-base text-white/50">
            <Loader2 size={18} className="animate-spin" />Carregando leads...
          </div>
        ) : leads.length === 0 ? (
          <div className="py-12 text-center text-base text-white/50">
            Nenhum lead encontrado com esses filtros
          </div>
        ) : (
          leads.map(lead => (
            <LeadRow key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />
          ))
        )}
      </div>
    </div>
  )
}

function LeadRow({ lead, onClick }: { lead: any; onClick: () => void }) {
  const score  = getScoreColor(lead.score_ia)
  const source = SOURCE_LABELS[lead.fonte]

  return (
    <div onClick={onClick}
      className="grid cursor-pointer items-center px-4 py-3.5 text-sm transition-all hover:bg-white/[0.06]"
      style={{ gridTemplateColumns: '2fr 1.2fr 0.8fr 0.7fr 0.7fr 90px', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
      <div>
        <p className="font-semibold text-white">{lead.empresa}</p>
        <p className="mt-0.5 text-[12px] text-white/65">{lead.contato_nome} · {lead.contato_cargo}</p>
      </div>
      <span className="font-medium text-white">{SEGMENT_LABELS[lead.segmento] ?? lead.segmento}</span>
      <span className="font-medium text-white">{lead.cidade}, {lead.estado}</span>
      <div className="flex items-center gap-2">
        <div className="flex-1 overflow-hidden rounded-full" style={{ height: 5, background: 'rgba(255,255,255,0.10)' }}>
          <div className="h-full rounded-full" style={{ width: `${lead.score_ia}%`, background: score.color }} />
        </div>
        <span className="min-w-[28px] text-right text-[13px] font-bold" style={{ color: score.color }}>{lead.score_ia}</span>
      </div>
      {source ? (
        <span className="w-fit rounded-lg px-2 py-0.5 text-[12px] font-medium" style={{ color: source.color, background: source.bg }}>{source.label}</span>
      ) : (
        <span className="text-white/60">{lead.fonte}</span>
      )}
      <div className="flex justify-end">
        <button className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[13px] font-semibold text-indigo-300 transition-all hover:bg-indigo-500/15">
          <Plus size={12} strokeWidth={2} />Adicionar
        </button>
      </div>
    </div>
  )
}

function SelectField({ label, value, onChange, children }: {
  label: string; value: string; onChange: (v: string) => void; children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-1.5 text-[13px] font-medium text-white">{label}</p>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg px-3 py-2.5 text-sm text-white outline-none"
        style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.12)' }}>
        {children}
      </select>
    </div>
  )
}
