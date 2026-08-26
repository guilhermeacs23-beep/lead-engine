'use client'
import React from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchLeads } from '@/lib/supabase'
import { SOURCE_LABELS, SEGMENT_LABELS } from '@/lib/mock-data'
import { getScoreColor } from '@/lib/utils'
import { LeadDrawer } from '@/components/ui/lead-drawer'
import {
  Search, Plus, Filter, Loader2,
  Upload, X, CheckCircle2, AlertCircle, ArrowLeft,
  FileSpreadsheet,
} from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const TENANT_ID = '00000000-0000-0000-0000-000000000001'

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
  { id: 'ebt',       label: 'EBT Sistema'              },
]

// ─── EBT CSV parsing ──────────────────────────────────────────────────────────

const SEGMENTO_MAP: Record<string, string> = {
  'AGRONEGOCIO': 'agronegocio', 'AGRONEGOCIOS': 'agronegocio', 'AGRO': 'agronegocio',
  'VAREJO': 'varejo',
  'INDUSTRIA': 'industria', 'INDUSTRIAL': 'industria', 'INDUSTRIAS': 'industria',
  'FARMACEUTICO': 'farmaceutico', 'FARMÁCIA': 'farmaceutico', 'FARMACIA': 'farmaceutico',
  'MODA': 'moda', 'TEXTIL': 'moda', 'TÊXTIL': 'moda',
  'CONSTRUCAO': 'construcao', 'CONSTRUÇÃO': 'construcao',
  'ALIMENTOS': 'alimentos',
  'LOGISTICA': 'logistica', 'LOGÍSTICA': 'logistica',
  'TECNOLOGIA': 'tecnologia',
}

function parseBrDate(s: string): string | null {
  const t = s?.trim()
  if (!t || t === '00/00/0000') return null
  const p = t.split('/')
  if (p.length === 3 && p[2]?.length === 4)
    return `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`
  return null
}

function parseEBTContent(content: string): any[] {
  const lines = content.split('\n')
  // line 0 = meta, line 1 = meta, line 2 = headers, line 3+ = data
  const rows: any[] = []
  for (let i = 3; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    const col = line.split(';')
    const empresa = col[1]?.trim()
    if (!empresa) continue

    const endParts = [
      col[5]?.trim(),
      col[6]?.trim() ? `nº ${col[6].trim()}` : '',
      col[7]?.trim(),
      col[8]?.trim(),
      col[9]?.trim() ? `CEP ${col[9].trim()}` : '',
    ].filter(Boolean)

    rows.push({
      empresa,
      cnpj:           col[2]?.trim()  || null,
      curva_abc:      col[3]?.trim()  || null,
      endereco:       endParts.join(', ') || null,
      telefone:       col[11]?.trim() || col[12]?.trim() || null,
      cidade:         col[13]?.trim() || null,
      estado:         col[14]?.trim() || null,
      latitude:       parseFloat(col[15]?.replace(',', '.')) || null,
      longitude:      parseFloat(col[16]?.replace(',', '.')) || null,
      ult_movimento:  parseBrDate(col[45] ?? ''),
      segmento:       SEGMENTO_MAP[(col[54] ?? '').trim().toUpperCase()] ?? null,
      website:        col[67]?.trim() || null,
      email:          col[74]?.trim() || null,
      fonte:          'ebt',
      status:         'novo',
      tenant_id:      TENANT_ID,
    })
  }
  return rows
}

// ─── Import Modal ─────────────────────────────────────────────────────────────

type ImportStep = 'pick' | 'preview' | 'importing' | 'done'

function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [step,         setStep]         = useState<ImportStep>('pick')
  const [rows,         setRows]         = useState<any[]>([])
  const [dragOver,     setDragOver]     = useState(false)
  const [responsavel,  setResponsavel]  = useState('')
  const [profiles,     setProfiles]     = useState<any[]>([])
  const [progress,     setProgress]     = useState(0)
  const [imported,     setImported]     = useState(0)
  const [errMsg,       setErrMsg]       = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.from('profiles').select('id,nome').eq('ativo', true).order('nome')
      .then(({ data }) => setProfiles(data ?? []))
  }, [])

  function readFile(file: File) {
    const reader = new FileReader()
    reader.onload = e => {
      const content = e.target?.result as string
      const parsed = parseEBTContent(content)
      if (parsed.length === 0) {
        setErrMsg('Nenhum lead encontrado no arquivo. Verifique se é um export EBT válido.')
        return
      }
      setRows(parsed)
      setStep('preview')
    }
    reader.readAsText(file, 'iso-8859-1')
  }

  function handleFile(file: File) {
    if (!file) return
    readFile(file)
  }

  async function doImport() {
    setStep('importing')
    setProgress(0)
    const payload = rows.map(r => ({
      ...r,
      responsavel_id: responsavel || null,
    }))
    const BATCH = 50
    let done = 0
    for (let i = 0; i < payload.length; i += BATCH) {
      const chunk = payload.slice(i, i + BATCH)
      const { error } = await supabase.from('leads').insert(chunk)
      if (error) {
        setErrMsg(`Erro ao importar lote ${Math.floor(i / BATCH) + 1}: ${error.message}`)
        setStep('done')
        return
      }
      done += chunk.length
      setImported(done)
      setProgress(Math.round((done / payload.length) * 100))
    }
    setImported(done)
    setStep('done')
  }

  const PREVIEW_COLS = [
    { key: 'empresa',     label: 'Empresa'       },
    { key: 'cnpj',        label: 'CNPJ'          },
    { key: 'cidade',      label: 'Cidade'        },
    { key: 'estado',      label: 'UF'            },
    { key: 'segmento',    label: 'Segmento'      },
    { key: 'curva_abc',   label: 'Curva ABC'     },
    { key: 'telefone',    label: 'Telefone'      },
    { key: 'ult_movimento', label: 'Últ. Mov.'   },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#ffffff', borderRadius: 20, width: '100%',
        maxWidth: step === 'preview' ? 900 : 520,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid #f0f0f0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {step === 'preview' && (
              <button onClick={() => setStep('pick')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', lineHeight: 0 }}>
                <ArrowLeft size={18} />
              </button>
            )}
            <FileSpreadsheet size={20} strokeWidth={1.6} style={{ color: '#16a34a' }} />
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111' }}>
                {step === 'pick' ? 'Importar leads do EBT Sistema'
                  : step === 'preview' ? `Preview — ${rows.length} leads encontrados`
                  : step === 'importing' ? 'Importando...'
                  : errMsg ? 'Erro na importação' : 'Importação concluída'}
              </p>
              {step === 'pick' && (
                <p style={{ margin: 0, fontSize: 12, color: '#888' }}>Arquivo .sswweb ou .csv exportado do sistema EBT</p>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', lineHeight: 0, padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>

          {/* STEP: pick */}
          {step === 'pick' && (
            <div>
              {errMsg && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#dc2626', fontSize: 13 }}>
                  <AlertCircle size={14} /> {errMsg}
                </div>
              )}
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
                style={{
                  border: `2px dashed ${dragOver ? '#16a34a' : '#d1d5db'}`,
                  borderRadius: 14, padding: '48px 24px', textAlign: 'center',
                  cursor: 'pointer', background: dragOver ? '#f0fdf4' : '#fafafa',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: '#f0fdf4', border: '1.5px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Upload size={24} strokeWidth={1.5} style={{ color: '#16a34a' }} />
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111' }}>Clique ou arraste o arquivo aqui</p>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: '#888' }}>Formatos aceitos: .sswweb · .csv</p>
                <input ref={fileRef} type="file" accept=".sswweb,.csv,.txt" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
              </div>

              <div style={{ marginTop: 16, padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Colunas que serão importadas</p>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                  Empresa · CNPJ · Curva ABC · Endereço · Telefone · Cidade · UF · Latitude · Longitude · Último movimento · Segmento · Site · E-mail
                </p>
              </div>
            </div>
          )}

          {/* STEP: preview */}
          {step === 'preview' && (
            <div>
              {/* Assign responsavel */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>Atribuir a:</span>
                <select value={responsavel} onChange={e => setResponsavel(e.target.value)}
                  style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, color: '#111', background: '#fff', outline: 'none' }}>
                  <option value="">— Sem responsável (distribuir depois) —</option>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>

              {/* Preview table */}
              <div style={{ overflow: 'auto', borderRadius: 10, border: '1px solid #e5e7eb', maxHeight: 380 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', position: 'sticky', top: 0 }}>
                      {PREVIEW_COLS.map(c => (
                        <th key={c.key} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 15).map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        {PREVIEW_COLS.map(c => (
                          <td key={c.key} style={{ padding: '6px 10px', color: '#374151', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {row[c.key] ?? <span style={{ color: '#d1d5db' }}>—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 15 && (
                <p style={{ margin: '8px 0 0', fontSize: 12, color: '#888', textAlign: 'center' }}>
                  Mostrando 15 de {rows.length} registros
                </p>
              )}
            </div>
          )}

          {/* STEP: importing */}
          {step === 'importing' && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <Loader2 size={36} strokeWidth={1.5} style={{ color: '#16a34a', animation: 'spin 1s linear infinite', marginBottom: 16 }} />
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111' }}>Importando leads...</p>
              <p style={{ margin: '6px 0 16px', fontSize: 13, color: '#888' }}>{imported} de {rows.length}</p>
              <div style={{ width: '100%', height: 8, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#16a34a', borderRadius: 99, transition: 'width 0.3s', width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* STEP: done */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              {errMsg ? (
                <>
                  <AlertCircle size={40} strokeWidth={1.5} style={{ color: '#dc2626', marginBottom: 14 }} />
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111' }}>Erro durante a importação</p>
                  <p style={{ margin: '8px auto 0', fontSize: 13, color: '#888', maxWidth: 360 }}>{errMsg}</p>
                </>
              ) : (
                <>
                  <CheckCircle2 size={40} strokeWidth={1.5} style={{ color: '#16a34a', marginBottom: 14 }} />
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111' }}>Importação concluída!</p>
                  <p style={{ margin: '6px 0 0', fontSize: 13, color: '#888' }}>
                    <strong style={{ color: '#16a34a' }}>{imported} leads</strong> adicionados com sucesso
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {(step === 'preview' || step === 'done') && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid #f0f0f0' }}>
            {step === 'preview' && (
              <>
                <button onClick={() => setStep('pick')} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#374151' }}>
                  Voltar
                </button>
                <button onClick={doImport} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#16a34a', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#fff' }}>
                  Importar {rows.length} leads
                </button>
              </>
            )}
            {step === 'done' && (
              <button onClick={() => { onClose(); onDone() }} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#111', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#fff' }}>
                Fechar
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [leads,        setLeads]        = useState<any[]>([])
  const [loading,      setLoading]      = useState(true)
  const [segment,      setSegment]      = useState('')
  const [state,        setState]        = useState('Todos')
  const [sources,      setSources]      = useState(['linkedin', 'google', 'cnpj', 'indicacao', 'ebt'])
  const [query,        setQuery]        = useState('')
  const [selectedLead, setSelectedLead] = useState<any | null>(null)
  const [showImport,   setShowImport]   = useState(false)
  const [isAdmin,      setIsAdmin]      = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetchLeads({ segmento: segment, estado: state, fontes: sources, query })
    setLeads(data)
    setLoading(false)
  }, [segment, state, sources, query])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('cargo').eq('id', user.id).single()
      setIsAdmin(data?.cargo === 'Administrador')
    }
    checkAdmin()
  }, [])

  const toggleSource = (id: string) =>
    setSources(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])

  return (
    <div className="flex h-full flex-col overflow-hidden p-5">
      <LeadDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} />

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onDone={load}
        />
      )}

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
              className="rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150"
              style={sources.includes(id)
                ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', boxShadow: '0 0 16px rgba(99,102,241,0.3)' }
                : { background: '#ffffff', color: '#374151', border: '1px solid #e5e7eb' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Barra de ação */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
            <Search size={14} style={{ color: '#9ca3af' }} />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Buscar empresa..."
              className="w-44 bg-transparent text-sm outline-none placeholder:text-gray-400"
              style={{ color: '#111827' }} />
          </div>
          <span className="text-sm text-white/70">
            {loading ? 'Buscando...' : `${leads.length} leads encontrados · pontuados por potencial de frete`}
          </span>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost flex items-center gap-1.5 text-sm">
            <Filter size={13} strokeWidth={1.5} />Filtros
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', boxShadow: '0 4px 14px rgba(22,163,74,0.3)' }}>
              <Upload size={13} strokeWidth={2} />Importar EBT
            </button>
          )}
        </div>
      </div>

      {/* Tabela — flex-1 + overflow-y-auto para scroll dedicado */}
      <div className="flex-1 overflow-y-auto rounded-xl" style={{ border: '1px solid #e5e7eb', background: '#ffffff', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', minHeight: 0 }}>
        <div className="grid items-center px-4 py-3 text-[13px] font-semibold"
          style={{ gridTemplateColumns: '2fr 1.2fr 0.8fr 0.7fr 0.7fr 90px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#374151', position: 'sticky', top: 0, zIndex: 10 }}>
          <span>Empresa</span><span>Segmento</span><span>Cidade / UF</span><span>Potencial</span><span>Fonte</span><span></span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-base" style={{ color: '#9ca3af' }}>
            <Loader2 size={18} className="animate-spin" />Carregando leads...
          </div>
        ) : leads.length === 0 ? (
          <div className="py-12 text-center text-base" style={{ color: '#9ca3af' }}>
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
  const [added, setAdded] = useState(lead.em_pipeline ?? false)

  async function handleAddToPipeline(e: React.MouseEvent) {
    e.stopPropagation()
    if (added) return
    setAdded(true)
    const { createBrowserClient } = await import('@supabase/ssr')
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    await sb.from('leads').update({ em_pipeline: true, status: 'novo' }).eq('id', lead.id)
  }

  return (
    <div onClick={onClick}
      className="grid cursor-pointer items-center px-4 py-3.5 text-sm transition-all"
      style={{
        gridTemplateColumns: '2fr 1.2fr 0.8fr 0.7fr 0.7fr 90px',
        borderBottom: '1px solid #f3f4f6',
        background: '#ffffff',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
      onMouseLeave={e => (e.currentTarget.style.background = '#ffffff')}
    >
      <div>
        <p className="font-semibold" style={{ color: '#111827' }}>{lead.empresa}</p>
        <p className="mt-0.5 text-[12px]" style={{ color: '#6b7280' }}>{lead.contato_nome} · {lead.contato_cargo}</p>
      </div>
      <span className="font-medium" style={{ color: '#374151' }}>{SEGMENT_LABELS[lead.segmento] ?? lead.segmento}</span>
      <span className="font-medium" style={{ color: '#374151' }}>{lead.cidade}, {lead.estado}</span>
      <div className="flex items-center gap-2">
        <div className="flex-1 overflow-hidden rounded-full" style={{ height: 5, background: '#e5e7eb' }}>
          <div className="h-full rounded-full" style={{ width: `${lead.score_ia}%`, background: score.color }} />
        </div>
        <span className="min-w-[28px] text-right text-[13px] font-bold" style={{ color: score.color }}>{lead.score_ia}</span>
      </div>
      {source ? (
        <span className="w-fit rounded-lg px-2 py-0.5 text-[12px] font-medium" style={{ color: source.color, background: source.bg }}>{source.label}</span>
      ) : (
        <span style={{ color: '#9ca3af', fontSize: 12 }}>{lead.fonte}</span>
      )}
      <div className="flex justify-end">
        <button
          onClick={handleAddToPipeline}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[13px] font-semibold transition-all"
          style={{ color: added ? '#16a34a' : '#6366f1' }}
          onMouseEnter={e => !added && (e.currentTarget.style.background = 'rgba(99,102,241,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          {added
            ? <><CheckCircle2 size={12} strokeWidth={2} />No pipeline</>
            : <><Plus size={12} strokeWidth={2} />Adicionar</>}
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
        className="w-full appearance-none rounded-lg px-3 py-2.5 text-sm outline-none"
        style={{ background: '#ffffff', border: '1px solid #e5e7eb', color: '#111827' }}>
        {children}
      </select>
    </div>
  )
}
