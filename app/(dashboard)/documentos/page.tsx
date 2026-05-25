'use client'
import { useState } from 'react'
import {
  Plus, Search, Upload, FileText, Table2, Presentation,
  Folder, Grid3X3, List, Download, Eye, MoreHorizontal,
  Clock, Star, Trash2, Share2, ChevronRight, File,
  StickyNote
} from 'lucide-react'

const FILE_TYPES: Record<string, { color: string; bg: string; label: string; icon: any }> = {
  doc:  { color: '#2563eb', bg: '#dbeafe', label: 'DOC',  icon: FileText     },
  xls:  { color: '#16a34a', bg: '#dcfce7', label: 'XLS',  icon: Table2       },
  ppt:  { color: '#ea580c', bg: '#ffedd5', label: 'PPT',  icon: Presentation },
  pdf:  { color: '#dc2626', bg: '#fee2e2', label: 'PDF',  icon: File         },
  txt:  { color: '#6b7280', bg: '#f3f4f6', label: 'TXT',  icon: StickyNote   },
  folder:{ color: '#d97706', bg: '#fef3c7', label: 'PASTA', icon: Folder     },
}

const MOCK_DOCS = [
  { id: '1', nome: 'Proposta Comercial — Template 2025', tipo: 'doc', pasta: 'Comercial', tamanho: '245 KB', modificado: 'hoje', autor: 'GC', cor_autor: '#6366f1', starred: true  },
  { id: '2', nome: 'Tabela de Preços EBT 2026',           tipo: 'xls', pasta: 'Financeiro', tamanho: '128 KB', modificado: 'hoje', autor: 'GC', cor_autor: '#6366f1', starred: true  },
  { id: '3', nome: 'Apresentação Institucional EBT',       tipo: 'ppt', pasta: 'Marketing', tamanho: '3.2 MB', modificado: 'ontem', autor: 'RA', cor_autor: '#ec4899', starred: false },
  { id: '4', nome: 'Contrato Padrão de Serviços',          tipo: 'doc', pasta: 'Jurídico', tamanho: '89 KB', modificado: '22/05/2026', autor: 'GC', cor_autor: '#6366f1', starred: false },
  { id: '5', nome: 'Relatório Comercial Q1 2026',           tipo: 'pdf', pasta: 'Relatórios', tamanho: '512 KB', modificado: '15/05/2026', autor: 'GC', cor_autor: '#6366f1', starred: false },
  { id: '6', nome: 'Planilha de Metas — Time Comercial',   tipo: 'xls', pasta: 'Comercial', tamanho: '210 KB', modificado: '14/05/2026', autor: 'JC', cor_autor: '#10b981', starred: false },
  { id: '7', nome: 'Script de Vendas — Abordagem Inicial', tipo: 'doc', pasta: 'Comercial', tamanho: '67 KB', modificado: '10/05/2026', autor: 'RA', cor_autor: '#ec4899', starred: false },
  { id: '8', nome: 'Manual de Onboarding — Novos Clientes',tipo: 'pdf', pasta: 'Operações', tamanho: '890 KB', modificado: '02/05/2026', autor: 'GC', cor_autor: '#6366f1', starred: false },
]

const PASTAS = ['Todos', 'Comercial', 'Financeiro', 'Marketing', 'Jurídico', 'Relatórios', 'Operações']

export default function DocumentosPage() {
  const [view, setView] = useState<'grade'|'lista'>('grade')
  const [pastaFilter, setPastaFilter] = useState('Todos')
  const [search, setSearch] = useState('')
  const [showNewMenu, setShowNewMenu] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [starred, setStarred] = useState<Set<string>>(new Set(MOCK_DOCS.filter(d => d.starred).map(d => d.id)))

  const filtered = MOCK_DOCS.filter(d =>
    (pastaFilter === 'Todos' || d.pasta === pastaFilter) &&
    d.nome.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex flex-shrink-0 items-center gap-3 px-6 py-4"
        style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
        <h1 className="text-[17px] font-bold text-white">Documentos</h1>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg px-3 py-1.5"
            style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.10)' }}>
            <Search size={13} className="text-white/40" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar documento…" className="w-36 bg-transparent text-[12px] text-white/70 outline-none placeholder:text-white/30" />
          </div>
          {/* View toggle */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: '0.5px solid rgba(255,255,255,0.12)' }}>
            {([['grade', Grid3X3],['lista', List]] as const).map(([v, Icon]) => (
              <button key={v} onClick={() => setView(v as any)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 transition-all"
                style={{ background: view === v ? 'rgba(99,102,241,0.2)' : 'transparent', color: view === v ? '#a78bfa' : 'rgba(255,255,255,0.45)' }}>
                <Icon size={13} />
              </button>
            ))}
          </div>
          {/* Upload */}
          <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] text-white/60 transition-all hover:bg-white/[0.07]"
            style={{ border: '0.5px solid rgba(255,255,255,0.14)' }}>
            <Upload size={13} strokeWidth={2} /> Upload
          </button>
          {/* New doc */}
          <div className="relative">
            <button onClick={() => setShowNewMenu(!showNewMenu)}
              className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[13px] font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 16px rgba(99,102,241,0.3)' }}>
              <Plus size={14} strokeWidth={2} /> Novo documento
            </button>
            {showNewMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 rounded-xl overflow-hidden"
                style={{ background: 'rgba(12,10,35,0.98)', border: '0.5px solid rgba(255,255,255,0.14)', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', minWidth: 160 }}>
                {[
                  { tipo: 'doc', label: 'Documento', sub: 'Word / Google Docs' },
                  { tipo: 'xls', label: 'Planilha',  sub: 'Excel / Google Sheets' },
                  { tipo: 'ppt', label: 'Apresentação', sub: 'PowerPoint / Slides' },
                ].map(opt => {
                  const cfg = FILE_TYPES[opt.tipo]
                  const Icon = cfg.icon
                  return (
                    <button key={opt.tipo} onClick={() => setShowNewMenu(false)}
                      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/[0.06] transition-all">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg text-[9px] font-black"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        <Icon size={16} />
                      </div>
                      <div className="text-left">
                        <p className="text-[13px] font-semibold text-white">{opt.label}</p>
                        <p className="text-[10px] text-white/40">{opt.sub}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pasta chips */}
      <div className="flex flex-shrink-0 items-center gap-2 px-6 py-3 overflow-x-auto"
        style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
        {PASTAS.map(p => (
          <button key={p} onClick={() => setPastaFilter(p)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium transition-all flex-shrink-0"
            style={{
              background: pastaFilter === p ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
              color: pastaFilter === p ? '#a78bfa' : 'rgba(255,255,255,0.5)',
              border: pastaFilter === p ? '0.5px solid rgba(99,102,241,0.4)' : '0.5px solid transparent',
            }}>
            {p !== 'Todos' && <Folder size={10} />}
            {p}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
        {view === 'grade' ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map(doc => {
              const cfg = FILE_TYPES[doc.tipo]
              const Icon = cfg.icon
              const isStar = starred.has(doc.id)
              return (
                <div key={doc.id}
                  onMouseEnter={() => setHoveredId(doc.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="group relative rounded-2xl p-4 cursor-pointer transition-all hover:ring-1 hover:ring-white/15"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.09)' }}>
                  {/* Star */}
                  <button
                    onClick={() => setStarred(prev => { const n = new Set(prev); n.has(doc.id) ? n.delete(doc.id) : n.add(doc.id); return n })}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all"
                    style={{ color: isStar ? '#fbbf24' : 'rgba(255,255,255,0.3)' }}>
                    <Star size={13} fill={isStar ? '#fbbf24' : 'none'} />
                  </button>

                  {/* Icon */}
                  <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-xl mb-3"
                    style={{ background: cfg.bg }}>
                    <Icon size={26} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex justify-center mb-1">
                    <span className="rounded px-1.5 py-0.5 text-[9px] font-black"
                      style={{ background: cfg.color, color: '#fff' }}>{cfg.label}</span>
                  </div>

                  <p className="text-center text-[12px] font-semibold text-white leading-snug mb-1 line-clamp-2">{doc.nome}</p>
                  <p className="text-center text-[10px] text-white/35">{doc.pasta} · {doc.tamanho}</p>
                  <p className="text-center text-[10px] text-white/30 mt-0.5">{doc.modificado}</p>

                  {/* Hover actions */}
                  {hoveredId === doc.id && (
                    <div className="absolute inset-x-3 bottom-3 flex items-center justify-center gap-2 rounded-lg py-1"
                      style={{ background: 'rgba(12,10,30,0.92)', border: '0.5px solid rgba(255,255,255,0.12)' }}>
                      {[Eye, Download, Share2].map((Ic, i) => (
                        <button key={i} className="p-1 text-white/50 hover:text-white transition-all">
                          <Ic size={12} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          /* Lista view */
          <div className="overflow-hidden rounded-xl" style={{ border: '0.5px solid rgba(255,255,255,0.10)' }}>
            <div className="grid px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-white/30"
              style={{ gridTemplateColumns: '48px 1fr 110px 90px 90px 90px 40px', background: 'rgba(255,255,255,0.06)', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
              <div />
              <div>Nome do arquivo</div>
              <div>Pasta</div>
              <div>Tamanho</div>
              <div>Modificado</div>
              <div>Autor</div>
              <div />
            </div>
            {filtered.map(doc => {
              const cfg = FILE_TYPES[doc.tipo]
              const Icon = cfg.icon
              const isStar = starred.has(doc.id)
              return (
                <div key={doc.id}
                  className="group grid cursor-pointer items-center px-4 py-3 transition-all hover:bg-white/[0.04]"
                  style={{ gridTemplateColumns: '48px 1fr 110px 90px 90px 90px 40px', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ background: cfg.bg }}>
                    <Icon size={16} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex items-center gap-2 pr-4">
                    {isStar && <Star size={10} fill="#fbbf24" style={{ color: '#fbbf24', flexShrink: 0 }} />}
                    <p className="text-[13px] font-semibold text-white truncate">{doc.nome}</p>
                    <span className="rounded px-1.5 py-0.5 text-[9px] font-black flex-shrink-0"
                      style={{ background: cfg.color, color: '#fff' }}>{cfg.label}</span>
                  </div>
                  <span className="flex items-center gap-1 text-[12px] text-white/50">
                    <Folder size={11} className="text-white/30" /> {doc.pasta}
                  </span>
                  <span className="text-[12px] text-white/50">{doc.tamanho}</span>
                  <div className="flex items-center gap-1 text-[12px] text-white/50">
                    <Clock size={10} /> {doc.modificado}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white"
                      style={{ background: doc.cor_autor }}>{doc.autor}</div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button className="p-1 text-white/30 hover:text-white/70"><Eye size={13} /></button>
                    <button className="p-1 text-white/30 hover:text-white/70"><Download size={13} /></button>
                    <button className="p-1 text-white/30 hover:text-red-400"><Trash2 size={13} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <FileText size={28} strokeWidth={1.2} className="text-indigo-400" />
            </div>
            <p className="text-[16px] font-semibold text-white/60">Nenhum documento encontrado</p>
            <p className="text-[13px] text-white/35">Crie novos documentos ou faça upload de arquivos</p>
          </div>
        )}
      </div>
    </div>
  )
}
