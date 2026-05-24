'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { searchLeads } from '@/lib/supabase'
import { Search, X, Building2, MapPin, Loader2, ArrowRight } from 'lucide-react'
import { getScoreColor } from '@/lib/utils'
import { SEGMENT_LABELS, SOURCE_LABELS } from '@/lib/mock-data'

interface Props {
  open: boolean
  onClose: () => void
  onSelectLead?: (lead: any) => void
}

export function SearchModal({ open, onClose, onSelectLead }: Props) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounce = useRef<ReturnType<typeof setTimeout>>()

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80)
      setQuery('')
      setResults([])
    }
  }, [open])

  // Global Cmd+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (!open) return // parent handles opening
      }
      if (e.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    const data = await searchLeads(q)
    setResults(data)
    setLoading(false)
  }, [])

  function handleChange(v: string) {
    setQuery(v)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => doSearch(v), 280)
  }

  function handleSelect(lead: any) {
    onSelectLead?.(lead)
    onClose()
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[3px]" onClick={onClose} />

      {/* Modal */}
      <div className="fixed left-1/2 top-[18%] z-50 w-full max-w-[580px] -translate-x-1/2 rounded-2xl overflow-hidden"
        style={{ background: 'rgba(13,11,32,0.98)', border: '0.5px solid rgba(255,255,255,0.14)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(255,255,255,0.06)' }}>

        {/* Search input row */}
        <div className="flex items-center gap-3 px-4 py-3.5"
          style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
          {loading
            ? <Loader2 size={17} className="animate-spin text-indigo-400 shrink-0" />
            : <Search size={17} className="text-white/40 shrink-0" strokeWidth={2} />
          }
          <input
            ref={inputRef}
            value={query}
            onChange={e => handleChange(e.target.value)}
            placeholder="Buscar empresa, contato, cidade, CNPJ..."
            className="flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/30"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]) }}
              className="flex h-6 w-6 items-center justify-center rounded text-white/35 hover:text-white/60 transition-all">
              <X size={13} />
            </button>
          )}
          <kbd className="rounded px-1.5 py-0.5 text-[11px] text-white/30"
            style={{ border: '0.5px solid rgba(255,255,255,0.12)' }}>ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {!query && (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Search size={28} className="text-white/15" strokeWidth={1} />
              <p className="text-sm text-white/30">Busque por nome da empresa, contato ou cidade</p>
            </div>
          )}

          {query && !loading && results.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12">
              <p className="text-sm text-white/40">Nenhum resultado para <span className="text-white/60">"{query}"</span></p>
            </div>
          )}

          {results.map((lead, idx) => {
            const score  = getScoreColor(lead.score_ia)
            const seg    = SEGMENT_LABELS[lead.segmento] ?? lead.segmento
            const src    = SOURCE_LABELS[lead.fonte]
            return (
              <button key={lead.id} onClick={() => handleSelect(lead)}
                className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition-all hover:bg-white/[0.05]"
                style={{ borderBottom: idx < results.length - 1 ? '0.5px solid rgba(255,255,255,0.05)' : 'none' }}>

                {/* Avatar */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  {lead.empresa?.charAt(0)?.toUpperCase() ?? '?'}
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                  <span className="text-[14px] font-semibold text-white truncate">{lead.empresa}</span>
                  <div className="flex items-center gap-2 text-[12px] text-white/50">
                    <span>{lead.contato_nome}</span>
                    {lead.contato_cargo && <><span className="text-white/20">·</span><span>{lead.contato_cargo}</span></>}
                  </div>
                </div>

                {/* Meta */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold" style={{ color: score.color }}>{lead.score_ia}</span>
                    <div className="h-1.5 w-16 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.10)' }}>
                      <div className="h-full rounded-full" style={{ width: `${lead.score_ia}%`, background: score.color }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-white/40">
                    <MapPin size={9} strokeWidth={1.5} />
                    <span>{lead.cidade}, {lead.estado}</span>
                  </div>
                </div>

                <ArrowRight size={13} className="text-white/20 shrink-0" />
              </button>
            )
          })}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="flex items-center gap-4 px-5 py-2.5 text-[11px] text-white/30"
            style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
            <span>{results.length} resultado{results.length !== 1 ? 's' : ''}</span>
            <span className="ml-auto">↑↓ navegar · Enter selecionar</span>
          </div>
        )}
      </div>
    </>
  )
}
