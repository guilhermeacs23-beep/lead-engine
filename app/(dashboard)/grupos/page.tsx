'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Plus, Search, Users, Lock, Globe, Star, Trash2, RefreshCw, X } from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CORES = ['#6366f1','#ec4899','#10b981','#f59e0b','#3b82f6','#8b5cf6','#ef4444','#14b8a6']

interface Grupo {
  id: string; nome: string; descricao: string | null; privacidade: string
  cor: string; projeto: boolean; tags: string[]; criado_em: string
  membros?: { profile_id: string }[]
}

export default function GruposPage() {
  const [view,      setView]      = useState<'grid'|'lista'>('grid')
  const [grupos,    setGrupos]    = useState<Grupo[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [fNome,     setFNome]     = useState('')
  const [fDesc,     setFDesc]     = useState('')
  const [fPriv,     setFPriv]     = useState('privado')
  const [fCor,      setFCor]      = useState('#6366f1')
  const [fProjeto,  setFProjeto]  = useState(false)
  const [fTagInput, setFTagInput] = useState('')
  const [fTags,     setFTags]     = useState<string[]>([])

  async function loadGrupos() {
    setLoading(true)
    const { data } = await supabase.from('grupos')
      .select('*, membros:grupo_membros(profile_id)')
      .order('criado_em', { ascending: false })
    setGrupos((data as Grupo[]) || [])
    setLoading(false)
  }

  useEffect(() => { loadGrupos() }, [])

  async function criarGrupo() {
    if (!fNome.trim()) return
    setSaving(true)
    const { data: profile } = await supabase.from('profiles').select('id').limit(1).single()
    const { data: grupo } = await supabase.from('grupos').insert({
      nome: fNome.trim(), descricao: fDesc.trim() || null,
      privacidade: fPriv, cor: fCor, projeto: fProjeto, tags: fTags,
      criado_por: profile?.id || null,
    }).select().single()
    if (grupo && profile) {
      await supabase.from('grupo_membros').insert({ grupo_id: grupo.id, profile_id: profile.id, papel: 'admin' })
    }
    setSaving(false); setShowModal(false); resetForm(); loadGrupos()
  }

  async function deletarGrupo(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Remover este grupo?')) return
    await supabase.from('grupos').delete().eq('id', id)
    setGrupos(prev => prev.filter(g => g.id !== id))
  }

  function resetForm() {
    setFNome(''); setFDesc(''); setFPriv('privado'); setFCor('#6366f1'); setFProjeto(false); setFTags([])
  }
  function addTag() {
    const t = fTagInput.trim()
    if (t && !fTags.includes(t)) setFTags(prev => [...prev, t])
    setFTagInput('')
  }

  const filtered = grupos.filter(g =>
    g.nome.toLowerCase().includes(search.toLowerCase()) ||
    (g.descricao || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 24px', borderBottom:'1px solid rgba(255,255,255,0.08)', flexShrink:0 }}>
        <h1 style={{ fontSize:17, fontWeight:700, color:'#fff', margin:0 }}>Grupos de Trabalho</h1>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:8, padding:'6px 12px' }}>
            <Search size={13} style={{ color:'rgba(255,255,255,0.40)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar grupo…"
              style={{ background:'transparent', border:'none', outline:'none', fontSize:12, color:'rgba(255,255,255,0.70)', width:120 }} />
          </div>
          <div style={{ display:'flex', borderRadius:8, overflow:'hidden', border:'1px solid rgba(255,255,255,0.12)' }}>
            {(['grid','lista'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding:'6px 12px', fontSize:12, border:'none', cursor:'pointer', background: view===v ? 'rgba(99,102,241,0.25)' : 'transparent', color: view===v ? '#a78bfa' : 'rgba(255,255,255,0.45)', fontWeight: view===v ? 600 : 400 }}>
                {v === 'grid' ? 'Grade' : 'Lista'}
              </button>
            ))}
          </div>
          <button onClick={loadGrupos} style={{ padding:'6px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,0.12)', background:'transparent', color:'rgba(255,255,255,0.50)', cursor:'pointer' }}>
            <RefreshCw size={13} />
          </button>
          <button onClick={() => setShowModal(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:8, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', fontSize:13, fontWeight:600, boxShadow:'0 0 16px rgba(99,102,241,0.30)' }}>
            <Plus size={14} strokeWidth={2} /> Criar
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex:1, overflowY:'auto', padding:24 }}>
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, gap:12, color:'rgba(255,255,255,0.40)' }}>
            <RefreshCw size={20} style={{ animation:'spin 1s linear infinite' }} /> Carregando...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:200, gap:16 }}>
            <Users size={32} style={{ color:'rgba(255,255,255,0.20)' }} />
            <p style={{ color:'rgba(255,255,255,0.40)', fontSize:15 }}>{search ? 'Nenhum grupo encontrado.' : 'Nenhum grupo criado ainda.'}</p>
            {!search && <button onClick={() => setShowModal(true)} style={{ padding:'9px 20px', borderRadius:10, border:'none', background:'#6366f1', color:'#fff', fontWeight:600, cursor:'pointer', fontSize:13 }}>Criar primeiro grupo</button>}
          </div>
        ) : view === 'grid' ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16 }}>
            {filtered.map(g => (
              <div key={g.id} style={{ background:'#fff', border:'1px solid #e5e5e5', borderRadius:20, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', transition:'all 0.15s', position:'relative' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow='0 6px 20px rgba(0,0,0,0.12)'; (e.currentTarget as HTMLElement).style.transform='translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow='0 1px 4px rgba(0,0,0,0.06)'; (e.currentTarget as HTMLElement).style.transform='translateY(0)' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
                  <div style={{ width:40, height:40, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, flexShrink:0, background:`${g.cor}20`, color:g.cor, border:`1.5px solid ${g.cor}50` }}>
                    {g.nome[0]}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <p style={{ fontSize:14, fontWeight:700, color:'#111', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{g.nome}</p>
                      {g.projeto && <Star size={10} fill="#fbbf24" style={{ color:'#fbbf24', flexShrink:0 }} />}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:2 }}>
                      {g.privacidade === 'privado' ? <Lock size={9} style={{ color:'#bbb' }} /> : <Globe size={9} style={{ color:'#bbb' }} />}
                      <span style={{ fontSize:10, color:'#bbb' }}>{g.privacidade}</span>
                    </div>
                  </div>
                  <button onClick={e => deletarGrupo(g.id, e)} style={{ background:'none', border:'none', cursor:'pointer', color:'#ddd', padding:4, borderRadius:6 }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='#ef4444'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='#ddd'}>
                    <Trash2 size={13} />
                  </button>
                </div>
                {g.descricao && <p style={{ fontSize:12, color:'#888', lineHeight:1.5, marginBottom:12, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{g.descricao}</p>}
                {g.tags.length > 0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
                    {g.tags.map(t => <span key={t} style={{ padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:600, background:`${g.cor}18`, color:g.cor, border:`1px solid ${g.cor}35` }}>{t}</span>)}
                  </div>
                )}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
                  <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#aaa' }}><Users size={11} /> {g.membros?.length ?? 0} membro{(g.membros?.length ?? 0) !== 1 ? 's' : ''}</span>
                  <span style={{ fontSize:10, color:'#bbb' }}>{new Date(g.criado_em).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            ))}
            <button onClick={() => setShowModal(true)} style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, height:160, borderRadius:20, border:'1.5px dashed rgba(255,255,255,0.18)', background:'transparent', cursor:'pointer', color:'rgba(255,255,255,0.30)', fontSize:13, transition:'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.60)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.35)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.30)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.18)' }}>
              <Plus size={22} strokeWidth={1.5} /> Novo grupo
            </button>
          </div>
        ) : (
          <div style={{ background:'#fff', border:'1px solid #e5e5e5', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'grid', gridTemplateColumns:'40px 1fr 100px 90px 130px 40px', padding:'10px 16px', background:'#f7f7f7', borderBottom:'1px solid #eee', fontSize:11, fontWeight:700, textTransform:'uppercase', color:'#aaa', letterSpacing:'0.06em' }}>
              <div /><div>Nome</div><div>Criado em</div><div>Privacidade</div><div>Tags</div><div />
            </div>
            {filtered.map(g => (
              <div key={g.id} style={{ display:'grid', gridTemplateColumns:'40px 1fr 100px 90px 130px 40px', padding:'12px 16px', borderBottom:'1px solid #f0f0f0', alignItems:'center' }}>
                <div style={{ width:28, height:28, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, background:`${g.cor}20`, color:g.cor }}>{g.nome[0]}</div>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:'#111', margin:0 }}>{g.nome}</p>
                  <p style={{ fontSize:11, color:'#888', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:280 }}>{g.descricao}</p>
                </div>
                <span style={{ fontSize:12, color:'#888' }}>{new Date(g.criado_em).toLocaleDateString('pt-BR')}</span>
                <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#888' }}>
                  {g.privacidade === 'privado' ? <Lock size={10} /> : <Globe size={10} />} {g.privacidade}
                </div>
                <div style={{ display:'flex', gap:4 }}>{g.tags.slice(0,2).map(t => <span key={t} style={{ padding:'1px 7px', borderRadius:10, fontSize:10, background:`${g.cor}18`, color:g.cor }}>{t}</span>)}</div>
                <button onClick={e => deletarGrupo(g.id, e)} style={{ background:'none', border:'none', cursor:'pointer', color:'#ddd', padding:4 }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='#ef4444'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='#ddd'}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <>
          <div onClick={() => { setShowModal(false); resetForm() }} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:60, backdropFilter:'blur(4px)' }} />
          <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:'#fff', borderRadius:20, padding:32, width:480, maxWidth:'92vw', zIndex:61, boxShadow:'0 24px 64px rgba(0,0,0,0.25)', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
              <h3 style={{ fontSize:18, fontWeight:700, color:'#111827', margin:0 }}>Novo Grupo</h3>
              <button onClick={() => { setShowModal(false); resetForm() }} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af' }}><X size={18} /></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:6 }}>Nome *</label>
                <input value={fNome} onChange={e => setFNome(e.target.value)} placeholder="Ex: Comercial SP"
                  style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px solid rgba(0,0,0,0.12)', fontSize:14, color:'#111827', outline:'none', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:6 }}>Descrição</label>
                <textarea value={fDesc} onChange={e => setFDesc(e.target.value)} rows={2} placeholder="O que esse grupo faz?"
                  style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px solid rgba(0,0,0,0.12)', fontSize:13, color:'#111827', outline:'none', resize:'none', boxSizing:'border-box' }} />
              </div>
              <div style={{ display:'flex', gap:12 }}>
                <div style={{ flex:1 }}>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:8 }}>Cor</label>
                  <div style={{ display:'flex', gap:6 }}>
                    {CORES.map(c => <button key={c} onClick={() => setFCor(c)} style={{ width:24, height:24, borderRadius:'50%', border:'none', cursor:'pointer', background:c, outline: fCor===c ? `3px solid ${c}` : 'none', outlineOffset:2 }} />)}
                  </div>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:6 }}>Privacidade</label>
                  <select value={fPriv} onChange={e => setFPriv(e.target.value)} style={{ padding:'9px 12px', borderRadius:10, border:'1.5px solid rgba(0,0,0,0.12)', fontSize:13, color:'#374151', cursor:'pointer', background:'#fff' }}>
                    <option value="privado">Privado</option>
                    <option value="publico">Público</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:6 }}>Tags</label>
                <div style={{ display:'flex', gap:8 }}>
                  <input value={fTagInput} onChange={e => setFTagInput(e.target.value)} onKeyDown={e => e.key==='Enter' && (e.preventDefault(), addTag())} placeholder="Ex: Vendas → Enter"
                    style={{ flex:1, padding:'8px 12px', borderRadius:8, border:'1.5px solid rgba(0,0,0,0.12)', fontSize:13, color:'#111827', outline:'none' }} />
                  <button onClick={addTag} style={{ padding:'8px 14px', borderRadius:8, border:'none', background:'#f3f4f6', color:'#374151', fontWeight:600, cursor:'pointer', fontSize:13 }}>+</button>
                </div>
                {fTags.length > 0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
                    {fTags.map(t => <span key={t} onClick={() => setFTags(prev => prev.filter(x => x!==t))} style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:`${fCor}18`, color:fCor, cursor:'pointer', border:`1px solid ${fCor}35` }}>{t} ×</span>)}
                  </div>
                )}
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
                <input type="checkbox" checked={fProjeto} onChange={e => setFProjeto(e.target.checked)} style={{ width:16, height:16, accentColor:'#6366f1' }} />
                <span style={{ fontSize:13, color:'#374151' }}>Marcar como projeto</span>
                <Star size={12} fill={fProjeto ? '#fbbf24' : 'none'} style={{ color: fProjeto ? '#fbbf24' : '#d1d5db' }} />
              </label>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:24 }}>
              <button onClick={() => { setShowModal(false); resetForm() }} style={{ flex:1, padding:'12px', borderRadius:10, border:'1px solid rgba(0,0,0,0.12)', background:'#f9fafb', color:'#6b7280', fontWeight:600, cursor:'pointer', fontSize:14 }}>Cancelar</button>
              <button onClick={criarGrupo} disabled={saving || !fNome.trim()} style={{ flex:2, padding:'12px', borderRadius:10, border:'none', background: saving||!fNome.trim() ? 'rgba(99,102,241,0.4)' : '#6366f1', color:'#fff', fontWeight:700, cursor: saving||!fNome.trim() ? 'default' : 'pointer', fontSize:14 }}>
                {saving ? 'Criando...' : 'Criar grupo'}
              </button>
            </div>
          </div>
        </>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
