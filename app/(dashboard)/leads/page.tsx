'use client'
import React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { fetchLeads } from '@/lib/supabase'
import { SOURCE_LABELS, SEGMENT_LABELS } from '@/lib/mock-data'
import { getScoreColor } from '@/lib/utils'
import { LeadDrawer } from '@/components/ui/lead-drawer'
import { AddLeadModal } from '@/components/ui/add-lead-modal'
import { Search, Plus, Filter, Loader2, MapPin, ChevronRight } from 'lucide-react'

const SEGMENTS = [
  { value: '', label: 'Todos os segmentos' },
  { value: 'agronegocio',  label: 'Agronegócio'  },
  { value: 'varejo',       label: 'Varejo'        },
  { value: 'industria',    label: 'Indústria'     },
  { value: 'farmaceutico', label: 'Farmacêutico'  },
  { value: 'moda',         label: 'Moda / Têxtil' },
  { value: 'construcao',   label: 'Construção'    },
  { value: 'alimentos',    label: 'Alimentos'     },
]
const STATES = ['Todos','SP','MG','SC','RS','PR','GO','CE','MT','RJ','BA']
const SOURCES = [
  { id: 'linkedin',  label: 'LinkedIn' },
  { id: 'google',    label: 'Google'   },
  { id: 'cnpj',      label: 'CNPJ'     },
  { id: 'indicacao', label: 'Indicação'},
]

export default function LeadsPage() {
  const [leads,        setLeads]        = useState<any[]>([])
  const [loading,      setLoading]      = useState(true)
  const [segment,      setSegment]      = useState('')
  const [state,        setState]        = useState('Todos')
  const [sources,      setSources]      = useState(['linkedin','google','cnpj','indicacao'])
  const [query,        setQuery]        = useState('')
  const [selectedLead, setSelectedLead] = useState<any | null>(null)
  const [addOpen,      setAddOpen]      = useState(false)
  const [showFilters,  setShowFilters]  = useState(false)

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
    <div className="flex h-full flex-col overflow-auto p-3 gap-0">
      <LeadDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} />
      <AddLeadModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={load} />

      <div style={{ background: '#ffffff', borderRadius: 14, boxShadow: '0 2px 16px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Search + filter bar */}
      <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-3"
        style={{ background: '#f8f9fc', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <div className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5"
          style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)' }}>
          <Search size={14} className="text-white/50 shrink-0" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar empresa..."
            className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400" />
        </div>
        <button onClick={() => setShowFilters(f => !f)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all"
          style={{
            background: showFilters ? 'rgba(99,102,241,0.10)' : 'rgba(0,0,0,0.04)',
            border: showFilters ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(0,0,0,0.10)',
            color: showFilters ? '#6366f1' : 'rgba(0,0,0,0.45)',
          }}>
          <Filter size={15} strokeWidth={1.5} />
        </button>
        {/* Desktop add button */}
        <button onClick={() => setAddOpen(true)}
          className="hidden btn-primary items-center gap-1.5 text-sm lg:flex">
          <Plus size={13} strokeWidth={2} />Adicionar
        </button>
      </div>

      {/* Collapsible filters */}
      {showFilters && (
        <div className="flex flex-col gap-3 px-4 py-3"
          style={{ background: '#f4f5f8', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-[11px] font-medium text-gray-500">Segmento</p>
              <select value={segment} onChange={e => setSegment(e.target.value)}
                className="w-full appearance-none rounded-lg px-3 py-2 text-sm text-gray-800 outline-none"
                style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)' }}>
                {SEGMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-medium text-gray-500">Estado</p>
              <select value={state} onChange={e => setState(e.target.value)}
                className="w-full appearance-none rounded-lg px-3 py-2 text-sm text-gray-800 outline-none"
                style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)' }}>
                {STATES.map(s => <option key={s} value={s}>{s === 'Todos' ? 'Todos os estados' : s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-[11px] font-medium text-gray-500">Fontes</p>
            <div className="flex flex-wrap gap-2">
              {SOURCES.map(({ id, label }) => (
                <button key={id} onClick={() => toggleSource(id)}
                  className="rounded-full px-3 py-1 text-[12px] font-medium transition-all"
                  style={sources.includes(id)
                    ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }
                    : { background: '#f0f1f5', color: 'rgba(26,24,37,0.55)', border: '1px solid rgba(0,0,0,0.10)' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Count */}
      <div className="px-4 py-2.5">
        <p className="text-[12px] text-gray-400">
          {loading ? 'Buscando…' : `${leads.length} leads · pontuados por potencial`}
        </p>
      </div>

      {/* ── MOBILE: card list ── */}
      <div className="flex flex-col gap-2 px-4 pb-2 lg:hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
            <Loader2 size={18} className="animate-spin" />Carregando…
          </div>
        ) : leads.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">Nenhum lead encontrado</div>
        ) : leads.map(lead => {
          const score  = getScoreColor(lead.score_ia)
          const source = SOURCE_LABELS[lead.fonte]
          return (
            <button key={lead.id} onClick={() => setSelectedLead(lead)}
              className="flex w-full items-center gap-3 rounded-xl p-4 text-left transition-all active:scale-[0.99]"
              style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.09)' }}>

              {/* Score ring */}
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
                <svg className="absolute inset-0" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="19" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="3" />
                  <circle cx="22" cy="22" r="19" fill="none" stroke={score.color} strokeWidth="3"
                    strokeDasharray={`${(lead.score_ia / 100) * 119.4} 119.4`}
                    strokeLinecap="round" transform="rotate(-90 22 22)" />
                </svg>
                <span className="text-[13px] font-bold" style={{ color: score.color }}>{lead.score_ia}</span>
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                <p className="truncate text-[14px] font-semibold text-gray-900">{lead.empresa}</p>
                <p className="truncate text-[12px] text-gray-500">{lead.contato_nome} · {lead.contato_cargo}</p>
                <div className="mt-1 flex items-center gap-2">
                  {source && (
                    <span className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                      style={{ color: source.color, background: source.bg }}>{source.label}</span>
                  )}
                  <span className="flex items-center gap-1 text-[11px] text-gray-400">
                    <MapPin size={9} strokeWidth={1.5} />{lead.cidade}, {lead.estado}
                  </span>
                </div>
              </div>

              <ChevronRight size={14} className="shrink-0 text-gray-300" />
            </button>
          )
        })}
      </div>

      {/* ── DESKTOP: table ── */}
      <div className="hidden lg:block overflow-hidden"
        style={{ border: 'none' }}>
        <div className="grid items-center px-4 py-3 text-[13px] font-semibold text-gray-600"
          style={{ gridTemplateColumns: '2fr 1.2fr 0.8fr 0.7fr 0.7fr 90px', background: '#f4f5f8', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <span>Empresa</span><span>Segmento</span><span>Cidade / UF</span><span>Potencial</span><span>Fonte</span><span></span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
            <Loader2 size={18} className="animate-spin" />Carregando leads…
          </div>
        ) : leads.length === 0 ? (
          <div className="py-12 text-center text-gray-400">Nenhum lead encontrado</div>
        ) : leads.map(lead => {
          const score  = getScoreColor(lead.score_ia)
          const source = SOURCE_LABELS[lead.fonte]
          return (
            <div key={lead.id} onClick={() => setSelectedLead(lead)}
              className="grid cursor-pointer items-center px-4 py-3.5 text-sm transition-all hover:bg-gray-50"
              style={{ gridTemplateColumns: '2fr 1.2fr 0.8fr 0.7fr 0.7fr 90px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <div>
                <p className="font-semibold text-gray-900">{lead.empresa}</p>
                <p className="mt-0.5 text-[12px] text-gray-500">{lead.contato_nome} · {lead.contato_cargo}</p>
              </div>
              <span className="font-medium text-gray-700">{SEGMENT_LABELS[lead.segmento] ?? lead.segmento}</span>
              <span className="font-medium text-gray-700">{lead.cidade}, {lead.estado}</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 overflow-hidden rounded-full" style={{ height: 5, background: 'rgba(0,0,0,0.08)' }}>
                  <div className="h-full rounded-full" style={{ width: `${lead.score_ia}%`, background: score.color }} />
                </div>
                <span className="min-w-[28px] text-right text-[13px] font-bold" style={{ color: score.color }}>{lead.score_ia}</span>
              </div>
              {source
                ? <span className="w-fit rounded-lg px-2 py-0.5 text-[12px] font-medium" style={{ color: source.color, background: source.bg }}>{source.label}</span>
                : <span className="text-gray-500">{lead.fonte}</span>
              }
              <div className="flex justify-end">
                <button className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[13px] font-semibold text-indigo-600 hover:bg-indigo-50">
                  <Plus size={12} strokeWidth={2} />Adicionar
                </button>
              </div>
            </div>
          )
        })}
      </div>
      </div>
    </div>
  )
}
