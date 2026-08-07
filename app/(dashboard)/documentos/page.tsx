'use client'
import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Plus, Search, Upload, FileText, Table2, Presentation, Folder, Grid3X3, List, Download, Eye, Trash2, Star, RefreshCw, X, File, StickyNote } from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const FILE_TYPES: Record<string, { color: string; bg: string; label: string; icon: any }> = {
  doc:  { color:'#2563eb', bg:'#dbeafe', label:'DOC',  icon: FileText     },
  docx: { color:'#2563eb', bg:'#dbeafe', label:'DOCX', icon: FileText     },
  xls:  { color:'#16a34a', bg:'#dcfce7', label:'XLS',  icon: Table2       },
  xlsx: { color:'#16a34a', bg:'#dcfce7', label:'XLSX', icon: Table2       },
  ppt:  { color:'#ea580c', bg:'#ffedd5', label:'PPT',  icon: Presentation },
  pptx: { color:'#ea580c', bg:'#ffedd5', label:'PPTX', icon: Presentation },
  pdf:  { color:'#dc2626', bg:'#fee2e2', label:'PDF',  icon: File         },
  txt:  { color:'#6b7280', bg:'#f3f4f6', label:'TXT',  icon: StickyNote   },
}

const PASTAS = ['Todos','Comercial','Financeiro','Marketing','Jurídico','Relatórios','Operações','Geral']

function ext(nome: string) { return nome.split('.').pop()?.toLowerCase() || 'doc' }
function fmtSize(bytes: number) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024*1024) return `${(bytes/1024).toFixed(0)} KB`
  return `${(bytes/1024/1024).toFixed(1)} MB`
}

interface Doc {
  id: string; nome: string; tipo: string; pasta: string
  storage_path: string | null; url: string | null
  tamanho: number; starred: boolean
  criado_em: string; modificado_em: string
  autor_id: string | null
}

export default function DocumentosPage() {
  const [view,         setView]        = useState<'grade'|'lista'>('grade')
  const [docs,         setDocs]        = useState<Doc[]>([])
  const [loading,      setLoading]     = useState(true)
  const [pastaFilter,  setPastaFilter] = useState('Todos')
  const [search,       setSearch]      = useState('')
  const [uploading,    setUploading]   = useState(false)
  const [showPastaModal, setShowPastaModal] = useState<string | null>(null) // docId being moved
  const [hoveredId,    setHoveredId]   = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)

  async function loadDocs() {
    setLoading(true)
    const { data } = await supabase.from('documentos').select('*').order('modificado_em', { ascending: false })
    setDocs((data as Doc[]) || [])
    setLoading(false)
  }

  useEffect(() => { loadDocs() }, [])

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const tipo = ext(file.name)
      const path = `documentos/${Date.now()}_${file.name}`
      const { error: upErr } = await supabase.storage.from('documentos').upload(path, file)
      if (upErr) { console.error('Upload error:', upErr); continue }
      const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(path)
      const { data: profile } = await supabase.from('profiles').select('id').limit(1).single()
      await supabase.from('documentos').insert({
        nome: file.name, tipo, pasta: 'Geral',
        storage_path: path, url: urlData.publicUrl,
        tamanho: file.size, autor_id: profile?.id || null,
      })
    }
    setUploading(false)
    loadDocs()
  }

  async function toggleStar(doc: Doc, e: React.MouseEvent) {
    e.stopPropagation()
    await supabase.from('documentos').update({ starred: !doc.starred }).eq('id', doc.id)
    setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, starred: !d.starred } : d))
  }

  async function deleteDoc(doc: Doc, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Remover "${doc.nome}"?`)) return
    if (doc.storage_path) await supabase.storage.from('documentos').remove([doc.storage_path])
    await supabase.from('documentos').delete().eq('id', doc.id)
    setDocs(prev => prev.filter(d => d.id !== doc.id))
  }

  async function downloadDoc(doc: Doc, e: React.MouseEvent) {
    e.stopPropagation()
    if (!doc.url) { alert('Arquivo sem URL de download.'); return }
    const a = document.createElement('a'); a.href = doc.url; a.download = doc.nome; a.target = '_blank'; a.click()
  }

  async function viewDoc(doc: Doc, e: React.MouseEvent) {
    e.stopPropagation()
    if (!doc.url) { alert('Arquivo sem URL.'); return }
    window.open(doc.url, '_blank')
  }

  async function changePasta(docId: string, pasta: string) {
    await supabase.from('documentos').update({ pasta }).eq('id', docId)
    setDocs(prev => prev.map(d => d.id === docId ? { ...d, pasta } : d))
    setShowPastaModal(null)
  }

  const filtered = docs.filter(d =>
    (pastaFilter === 'Todos' || d.pasta === pastaFilter) &&
    d.nome.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      {/* Hidden file inputs */}
      <input ref={uploadInputRef} type="file" multiple style={{ display:'none' }} onChange={e => handleUpload(e.target.files)} />

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 24px', borderBottom:'1px solid rgba(255,255,255,0.08)', flexShrink:0 }}>
        <h1 style={{ fontSize:17, fontWeight:700, color:'#fff', margin:0 }}>Documentos</h1>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:8, padding:'6px 12px' }}>
            <Search size={13} style={{ color:'rgba(255,255,255,0.40)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar documento…"
              style={{ background:'transparent', border:'none', outline:'none', fontSize:12, color:'rgba(255,255,255,0.70)', width:140 }} />
          </div>
          <div style={{ display:'flex', borderRadius:8, overflow:'hidden', border:'1px solid rgba(255,255,255,0.12)' }}>
            {([['grade', Grid3X3],['lista', List]] as const).map(([v, Icon]) => (
              <button key={v} onClick={() => setView(v as any)} style={{ padding:'6px 10px', border:'none', cursor:'pointer', background: view===v ? 'rgba(99,102,241,0.25)' : 'transparent', color: view===v ? '#a78bfa' : 'rgba(255,255,255,0.45)', display:'flex', alignItems:'center' }}>
                <Icon size={13} />
              </button>
            ))}
          </div>
          <button onClick={loadDocs} style={{ padding:'6px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,0.12)', background:'transparent', color:'rgba(255,255,255,0.50)', cursor:'pointer', display:'flex', alignItems:'center' }}>
            <RefreshCw size={13} />
          </button>
          <button onClick={() => uploadInputRef.current?.click()} disabled={uploading} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'1px solid rgba(255,255,255,0.14)', background:'transparent', color: uploading ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.70)', cursor: uploading ? 'default' : 'pointer', fontSize:12, fontWeight:500 }}>
            <Upload size={13} strokeWidth={2} /> {uploading ? 'Enviando...' : 'Upload'}
          </button>
        </div>
      </div>

      {/* Pasta tabs */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 24px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0, overflowX:'auto' }}>
        {PASTAS.map(p => (
          <button key={p} onClick={() => setPastaFilter(p)} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20, fontSize:12, fontWeight:500, border:'none', cursor:'pointer', whiteSpace:'nowrap', background: pastaFilter===p ? 'rgba(99,102,241,0.20)' : 'rgba(255,255,255,0.06)', color: pastaFilter===p ? '#a78bfa' : 'rgba(255,255,255,0.50)', outline: pastaFilter===p ? '1px solid rgba(99,102,241,0.40)' : 'none' }}>
            {p !== 'Todos' && <Folder size={10} />} {p}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:'auto', padding:24 }} onClick={() => setShowPastaModal(null)}>
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, gap:12, color:'rgba(255,255,255,0.40)' }}>
            <RefreshCw size={20} style={{ animation:'spin 1s linear infinite' }} /> Carregando...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:200, gap:16 }}>
            <div style={{ width:56, height:56, borderRadius:16, background:'rgba(99,102,241,0.10)', border:'1px solid rgba(99,102,241,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <FileText size={24} style={{ color:'#6366f1' }} />
            </div>
            <p style={{ color:'rgba(255,255,255,0.40)', fontSize:15 }}>{search ? 'Nenhum documento encontrado.' : 'Nenhum arquivo ainda.'}</p>
            <button onClick={() => uploadInputRef.current?.click()} style={{ padding:'9px 20px', borderRadius:10, border:'none', background:'#6366f1', color:'#fff', fontWeight:600, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
              <Upload size={14} /> Fazer upload
            </button>
          </div>
        ) : view === 'grade' ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:14 }}>
            {filtered.map(doc => {
              const tipo = ext(doc.nome)
              const cfg = FILE_TYPES[tipo] || FILE_TYPES['doc']
              const Icon = cfg.icon
              const isStar = doc.starred
              return (
                <div key={doc.id} onMouseEnter={() => setHoveredId(doc.id)} onMouseLeave={() => setHoveredId(null)}
                  style={{ background:'#fff', border:'1px solid #e5e5e5', borderRadius:18, padding:'16px 14px', cursor:'default', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', position:'relative', transition:'box-shadow 0.15s' }}>
                  <button onClick={e => toggleStar(doc, e)} style={{ position:'absolute', top:10, right:10, background:'none', border:'none', cursor:'pointer', opacity: hoveredId===doc.id || isStar ? 1 : 0, transition:'opacity 0.15s', color: isStar ? '#fbbf24' : '#bbb', padding:2 }}>
                    <Star size={13} fill={isStar ? '#fbbf24' : 'none'} />
                  </button>
                  <div style={{ display:'flex', width:52, height:52, margin:'0 auto 10px', alignItems:'center', justifyContent:'center', borderRadius:12, background:cfg.bg }}>
                    <Icon size={24} style={{ color:cfg.color }} />
                  </div>
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:6 }}>
                    <span style={{ borderRadius:4, padding:'1px 6px', fontSize:9, fontWeight:800, background:cfg.color, color:'#fff' }}>{cfg.label}</span>
                  </div>
                  <p style={{ textAlign:'center', fontSize:12, fontWeight:600, color:'#111', lineHeight:1.4, margin:'0 0 4px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{doc.nome}</p>
                  <p style={{ textAlign:'center', fontSize:10, color:'#aaa', margin:0 }}>{doc.pasta} · {fmtSize(doc.tamanho)}</p>
                  <p style={{ textAlign:'center', fontSize:10, color:'#bbb', margin:'2px 0 0' }}>{new Date(doc.modificado_em).toLocaleDateString('pt-BR')}</p>
                  {hoveredId === doc.id && (
                    <div style={{ position:'absolute', insetInline:'10px', bottom:10, display:'flex', alignItems:'center', justifyContent:'center', gap:4, background:'rgba(255,255,255,0.96)', border:'1px solid #e5e5e5', borderRadius:10, padding:'6px 8px', boxShadow:'0 2px 8px rgba(0,0,0,0.10)' }}>
                      <button onClick={e => viewDoc(doc, e)} title="Visualizar" style={{ background:'none', border:'none', cursor:'pointer', color:'#6366f1', padding:4 }}><Eye size={13} /></button>
                      <button onClick={e => downloadDoc(doc, e)} title="Download" style={{ background:'none', border:'none', cursor:'pointer', color:'#10b981', padding:4 }}><Download size={13} /></button>
                      <button onClick={e => deleteDoc(doc, e)} title="Excluir" style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', padding:4 }}><Trash2 size={13} /></button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ background:'#fff', border:'1px solid #e5e5e5', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display:'grid', gridTemplateColumns:'44px 1fr 110px 90px 90px 80px', padding:'10px 16px', background:'#f7f7f7', borderBottom:'1px solid #e5e5e5', fontSize:11, fontWeight:700, textTransform:'uppercase', color:'#aaa', letterSpacing:'0.06em' }}>
              <div /><div>Nome</div><div>Pasta</div><div>Tamanho</div><div>Modificado</div><div>Ações</div>
            </div>
            {filtered.map(doc => {
              const tipo = ext(doc.nome)
              const cfg = FILE_TYPES[tipo] || FILE_TYPES['doc']
              const Icon = cfg.icon
              const isStar = doc.starred
              return (
                <div key={doc.id} style={{ display:'grid', gridTemplateColumns:'44px 1fr 110px 90px 90px 80px', padding:'11px 16px', borderBottom:'1px solid #f0f0f0', alignItems:'center' }}>
                  <div style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background:cfg.bg }}><Icon size={16} style={{ color:cfg.color }} /></div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, paddingRight:12 }}>
                    {isStar && <Star size={10} fill="#fbbf24" style={{ color:'#fbbf24', flexShrink:0 }} />}
                    <p style={{ fontSize:13, fontWeight:600, color:'#111', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{doc.nome}</p>
                    <span style={{ borderRadius:4, padding:'1px 5px', fontSize:9, fontWeight:800, background:cfg.color, color:'#fff', flexShrink:0 }}>{cfg.label}</span>
                  </div>
                  <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#888' }}><Folder size={11} style={{ color:'#bbb' }} /> {doc.pasta}</span>
                  <span style={{ fontSize:12, color:'#888' }}>{fmtSize(doc.tamanho)}</span>
                  <span style={{ fontSize:12, color:'#888' }}>{new Date(doc.modificado_em).toLocaleDateString('pt-BR')}</span>
                  <div style={{ display:'flex', gap:2 }}>
                    <button onClick={e => viewDoc(doc, e)} title="Visualizar" style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:4, borderRadius:6 }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='#6366f1'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='#9ca3af'}><Eye size={13} /></button>
                    <button onClick={e => downloadDoc(doc, e)} title="Download" style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:4, borderRadius:6 }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='#10b981'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='#9ca3af'}><Download size={13} /></button>
                    <button onClick={e => deleteDoc(doc, e)} title="Excluir" style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:4, borderRadius:6 }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='#ef4444'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='#9ca3af'}><Trash2 size={13} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
