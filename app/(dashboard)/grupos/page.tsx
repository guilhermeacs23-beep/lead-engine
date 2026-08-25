'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  Plus, Search, Lock, Globe, Star, Trash2, X, Check,
  Send, Users, ChevronRight, CheckSquare, MoreHorizontal,
  UserPlus, RefreshCw,
} from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CORES = ['#6366f1','#ec4899','#10b981','#f59e0b','#3b82f6','#8b5cf6','#ef4444','#14b8a6']

interface Profile  { id: string; nome: string; cor: string; cargo: string }
interface Membro   { profile_id: string; papel: string; profile: Profile }
interface Mensagem { id: string; grupo_id: string; profile_id: string; texto: string; tipo: string; created_at: string; profile?: Profile }
interface Grupo    {
  id: string; nome: string; descricao: string | null; privacidade: string
  cor: string; projeto: boolean; tags: string[]; criado_em: string
  membros?: { profile_id: string }[]
  lastMsg?: Mensagem | null
}

function initials(nome: string) {
  return nome.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 86400000 && d.getDate() === now.getDate())
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (diff < 7 * 86400000)
    return d.toLocaleDateString('pt-BR', { weekday: 'short' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function fmtFull(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function GruposPage() {
  const [grupos,      setGrupos]      = useState<Grupo[]>([])
  const [selected,    setSelected]    = useState<Grupo | null>(null)
  const [mensagens,   setMensagens]   = useState<Mensagem[]>([])
  const [membros,     setMembros]     = useState<Membro[]>([])
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [search,      setSearch]      = useState('')
  const [input,       setInput]       = useState('')
  const [sending,     setSending]     = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState<'chat' | 'membros' | 'tarefas'>('chat')

  // Create group modal
  const [showModal, setShowModal]   = useState(false)
  const [fNome,     setFNome]       = useState('')
  const [fDesc,     setFDesc]       = useState('')
  const [fPriv,     setFPriv]       = useState('privado')
  const [fCor,      setFCor]        = useState('#6366f1')
  const [saving,    setSaving]      = useState(false)

  // Add member panel
  const [showAddMembro, setShowAddMembro] = useState(false)
  const [addMId,        setAddMId]        = useState('')
  const [addPapel,      setAddPapel]      = useState('membro')
  const [addingM,       setAddingM]       = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLTextAreaElement>(null)
  const channelRef     = useRef<any>(null)

  /* ── Load current user ── */
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('id,nome,cor,cargo').eq('id', user.id).single()
      if (data) setCurrentUser(data as Profile)
      const { data: profs } = await supabase.from('profiles').select('id,nome,cor,cargo').eq('ativo', true).order('nome')
      setAllProfiles((profs ?? []) as Profile[])
    }
    loadUser()
  }, [])

  /* ── Load groups ── */
  async function loadGrupos() {
    setLoading(true)
    const { data } = await supabase
      .from('grupos')
      .select('*, membros:grupo_membros(profile_id)')
      .order('criado_em', { ascending: false })
    const list = (data ?? []) as Grupo[]
    // fetch last message for each group
    await Promise.all(list.map(async (g) => {
      const { data: msgs } = await supabase
        .from('grupo_mensagens')
        .select('id,texto,created_at,profile_id')
        .eq('grupo_id', g.id)
        .order('created_at', { ascending: false })
        .limit(1)
      g.lastMsg = msgs?.[0] as Mensagem ?? null
    }))
    setGrupos(list)
    setLoading(false)
  }

  useEffect(() => { loadGrupos() }, [])

  /* ── Select group → load messages + membros ── */
  async function selectGroup(g: Grupo) {
    setSelected(g)
    setTab('chat')
    setMensagens([])

    // Load messages
    const profMap: Record<string,Profile> = {}
    allProfiles.forEach(p => { profMap[p.id] = p })

    const { data: msgs } = await supabase
      .from('grupo_mensagens')
      .select('*')
      .eq('grupo_id', g.id)
      .order('created_at', { ascending: true })
    setMensagens(((msgs ?? []) as Mensagem[]).map(m => ({ ...m, profile: profMap[m.profile_id] })))

    // Load membros
    const { data: mbs } = await supabase
      .from('grupo_membros')
      .select('profile_id, papel, profile:profiles(id,nome,cor,cargo)')
      .eq('grupo_id', g.id)
    setMembros((mbs ?? []) as unknown as Membro[])

    // Subscribe realtime
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    channelRef.current = supabase
      .channel(`grupo-${g.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'grupo_mensagens', filter: `grupo_id=eq.${g.id}` },
        (payload) => {
          const nm = payload.new as Mensagem
          setMensagens(prev => {
            if (prev.find(m => m.id === nm.id)) return prev
            return [...prev, { ...nm, profile: profMap[nm.profile_id] }]
          })
        }
      )
      .subscribe()
  }

  /* ── Scroll to bottom ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  /* ── Send message ── */
  async function sendMessage() {
    if (!input.trim() || !selected || !currentUser || sending) return
    setSending(true)
    const texto = input.trim()
    setInput('')
    await supabase.from('grupo_mensagens').insert({
      grupo_id: selected.id, profile_id: currentUser.id, texto,
    })
    // reload last msg for group in list
    setGrupos(prev => prev.map(g => g.id === selected.id ? { ...g, lastMsg: { id: '', grupo_id: selected.id, profile_id: currentUser.id, texto, tipo: 'texto', created_at: new Date().toISOString() } } : g))
    setSending(false)
    inputRef.current?.focus()
  }

  /* ── Create group ── */
  async function criarGrupo() {
    if (!fNome.trim() || !currentUser) return
    setSaving(true)
    const { data: grupo } = await supabase.from('grupos').insert({
      nome: fNome.trim(), descricao: fDesc.trim() || null,
      privacidade: fPriv, cor: fCor, projeto: false, tags: [],
      criado_por: currentUser.id,
    }).select().single()
    if (grupo) {
      await supabase.from('grupo_membros').insert({ grupo_id: grupo.id, profile_id: currentUser.id, papel: 'admin' })
    }
    setSaving(false); setShowModal(false); setFNome(''); setFDesc('')
    await loadGrupos()
  }

  /* ── Delete group ── */
  async function deletarGrupo(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Remover este grupo e todas as mensagens?')) return
    await supabase.from('grupos').delete().eq('id', id)
    setGrupos(prev => prev.filter(g => g.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  /* ── Add member ── */
  async function addMembro() {
    if (!addMId || addingM || !selected) return
    setAddingM(true)
    await supabase.from('grupo_membros').insert({ grupo_id: selected.id, profile_id: addMId, papel: addPapel })
    const prof = allProfiles.find(p => p.id === addMId)
    if (prof) setMembros(prev => [...prev, { profile_id: addMId, papel: addPapel, profile: prof }])
    setAddMId(''); setShowAddMembro(false); setAddingM(false)
  }

  /* ── Remove member ── */
  async function removeMembro(profileId: string) {
    if (!selected || !confirm('Remover membro?')) return
    await supabase.from('grupo_membros').delete().eq('grupo_id', selected.id).eq('profile_id', profileId)
    setMembros(prev => prev.filter(m => m.profile_id !== profileId))
  }

  const filtered = grupos.filter(g =>
    g.nome.toLowerCase().includes(search.toLowerCase()) ||
    (g.descricao || '').toLowerCase().includes(search.toLowerCase())
  )

  const membroIds = new Set(membros.map(m => m.profile_id))
  const available = allProfiles.filter(p => !membroIds.has(p.id))

  /* ─────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ═══ LEFT PANEL — group list ═══ */}
      <div style={{
        width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: 'rgba(255,255,255,0.06)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Grupos</span>
            <button onClick={() => setShowModal(true)}
              style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={14} strokeWidth={2.5} />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '7px 12px' }}>
            <Search size={12} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar grupo…"
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: 'rgba(255,255,255,0.70)', width: '100%' }} />
          </div>
        </div>

        {/* Group list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, color: 'rgba(255,255,255,0.30)', gap: 8, fontSize: 12 }}>
              <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.30)', fontSize: 13 }}>
              {search ? 'Nenhum resultado.' : 'Nenhum grupo ainda.'}
            </div>
          ) : filtered.map(g => {
            const isActive = selected?.id === g.id
            return (
              <div key={g.id} onClick={() => selectGroup(g)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                  borderLeft: isActive ? `3px solid ${g.cor}` : '3px solid transparent',
                  transition: 'all 0.12s',
                  position: 'relative',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                {/* Avatar */}
                <div style={{ width: 42, height: 42, borderRadius: 13, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, background: `${g.cor}25`, color: g.cor, border: `1.5px solid ${g.cor}50` }}>
                  {g.nome[0]}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.nome}</span>
                    {g.lastMsg && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.30)', flexShrink: 0 }}>{fmtTime(g.lastMsg.created_at)}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    {g.privacidade === 'privado' ? <Lock size={9} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} /> : <Globe size={9} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />}
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {g.lastMsg ? g.lastMsg.texto : (g.descricao || `${g.membros?.length ?? 0} membro${(g.membros?.length ?? 0) !== 1 ? 's' : ''}`)}
                    </span>
                  </div>
                </div>

                {/* Delete on hover */}
                <button onClick={e => deletarGrupo(g.id, e)}
                  style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.20)', flexShrink: 0, transition: 'all 0.12s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.12)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.20)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  title="Remover grupo">
                  <Trash2 size={11} />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══ RIGHT PANEL ═══ */}
      {!selected ? (

        /* Empty state */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(99,102,241,0.12)', border: '1.5px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={32} strokeWidth={1.3} style={{ color: '#818cf8' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>
              Lead<span style={{ color: '#E04F0A' }}>+</span>
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)', margin: '6px 0 0' }}>
              Selecione um grupo para começar a conversar
            </p>
          </div>
          <button onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 12, border: 'none', background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={14} /> Criar grupo
          </button>
        </div>

      ) : (

        /* Chat area */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Chat header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)', flexShrink: 0,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, background: `${selected.cor}25`, color: selected.cor, border: `1.5px solid ${selected.cor}50`, flexShrink: 0 }}>
              {selected.nome[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{selected.nome}</span>
                {selected.privacidade === 'privado' ? <Lock size={10} style={{ color: 'rgba(255,255,255,0.30)' }} /> : <Globe size={10} style={{ color: 'rgba(255,255,255,0.30)' }} />}
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)' }}>
                {membros.length} membro{membros.length !== 1 ? 's' : ''}
                {selected.descricao ? ` · ${selected.descricao}` : ''}
              </span>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 3 }}>
              {([
                { key: 'chat',    icon: Send,       label: 'Chat'    },
                { key: 'membros', icon: Users,      label: 'Membros' },
                { key: 'tarefas', icon: CheckSquare,label: 'Tarefas' },
              ] as const).map(({ key, icon: Icon, label }) => (
                <button key={key} onClick={() => setTab(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: tab === key ? 700 : 400,
                    background: tab === key ? 'rgba(255,255,255,0.12)' : 'transparent',
                    color: tab === key ? '#fff' : 'rgba(255,255,255,0.45)',
                  }}>
                  <Icon size={12} /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── TAB: CHAT ── */}
          {tab === 'chat' && (
            <>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {mensagens.length === 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 10, color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
                    <Send size={28} strokeWidth={1.2} />
                    Nenhuma mensagem ainda. Seja o primeiro a escrever!
                  </div>
                )}

                {mensagens.map((m, i) => {
                  const isMe = m.profile_id === currentUser?.id
                  const prev = mensagens[i - 1]
                  const sameAuthor = prev?.profile_id === m.profile_id && (new Date(m.created_at).getTime() - new Date(prev.created_at).getTime()) < 5 * 60000
                  const prof = m.profile

                  return (
                    <div key={m.id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginTop: sameAuthor ? 2 : 12 }}>
                      {/* Avatar */}
                      {!isMe && (
                        sameAuthor ? <div style={{ width: 32, flexShrink: 0 }} /> : (
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: prof?.cor || '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                            {initials(prof?.nome || '?')}
                          </div>
                        )
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '65%' }}>
                        {!sameAuthor && !isMe && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: prof?.cor || '#818cf8', marginBottom: 3, marginLeft: 4 }}>
                            {prof?.nome || '—'}
                          </span>
                        )}
                        <div style={{
                          padding: '9px 13px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          background: isMe ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.10)',
                          color: '#fff', fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word',
                          boxShadow: isMe ? '0 2px 12px rgba(99,102,241,0.35)' : '0 1px 4px rgba(0,0,0,0.15)',
                        }}>
                          {m.texto}
                        </div>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 3, marginLeft: 4, marginRight: 4 }}>
                          {fmtFull(m.created_at)}
                        </span>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0, background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '10px 14px' }}>
                  {/* Current user avatar */}
                  {currentUser && (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: currentUser.cor || '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {initials(currentUser.nome)}
                    </div>
                  )}
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                    placeholder="Escreva uma mensagem… (Enter para enviar)"
                    rows={1}
                    style={{
                      flex: 1, background: 'transparent', border: 'none', outline: 'none',
                      fontSize: 13, color: '#fff', resize: 'none', lineHeight: 1.5,
                      maxHeight: 120, overflowY: 'auto',
                    }}
                    onInput={e => {
                      const el = e.currentTarget
                      el.style.height = 'auto'
                      el.style.height = Math.min(el.scrollHeight, 120) + 'px'
                    }}
                  />
                  <button onClick={sendMessage} disabled={!input.trim() || sending}
                    style={{
                      width: 34, height: 34, borderRadius: 10, border: 'none', flexShrink: 0,
                      background: input.trim() ? '#6366f1' : 'rgba(255,255,255,0.10)',
                      color: input.trim() ? '#fff' : 'rgba(255,255,255,0.25)',
                      cursor: input.trim() ? 'pointer' : 'default',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                    <Send size={14} strokeWidth={1.8} style={{ transform: 'rotate(45deg)' }} />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── TAB: MEMBROS ── */}
          {tab === 'membros' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button onClick={() => setShowAddMembro(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', background: selected.cor, color: '#fff', fontSize: 13, fontWeight: 600 }}>
                  <UserPlus size={13} /> Adicionar
                </button>
              </div>

              {showAddMembro && (
                <div style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', border: '1px solid #e5e7eb', display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
                  <div style={{ flex: '1 1 180px' }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 6 }}>Membro</label>
                    <select value={addMId} onChange={e => setAddMId(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, cursor: 'pointer', background: '#f9fafb', color: '#111' }}>
                      <option value="">— Selecionar —</option>
                      {available.map(p => <option key={p.id} value={p.id}>{p.nome} · {p.cargo}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 6 }}>Papel</label>
                    <select value={addPapel} onChange={e => setAddPapel(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, cursor: 'pointer', background: '#f9fafb', color: '#111' }}>
                      <option value="membro">Membro</option>
                      <option value="lider">Líder</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button onClick={addMembro} disabled={!addMId || addingM}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: !addMId || addingM ? 'default' : 'pointer', background: !addMId || addingM ? '#e5e7eb' : '#10b981', color: '#fff', fontSize: 13, fontWeight: 700 }}>
                    <Check size={13} /> {addingM ? 'Adicionando…' : 'Confirmar'}
                  </button>
                  <button onClick={() => setShowAddMembro(false)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', color: '#9ca3af', cursor: 'pointer' }}><X size={14} /></button>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 560 }}>
                {membros.map(m => {
                  const p = m.profile
                  return (
                    <div key={m.profile_id} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(255,255,255,0.10)' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: p?.cor || selected.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {initials(p?.nome || '?')}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>{p?.nome}</p>
                        <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.40)' }}>{p?.cargo}</p>
                      </div>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: m.papel === 'admin' ? 'rgba(99,102,241,0.20)' : m.papel === 'lider' ? 'rgba(245,158,11,0.20)' : 'rgba(255,255,255,0.10)', color: m.papel === 'admin' ? '#a78bfa' : m.papel === 'lider' ? '#fbbf24' : 'rgba(255,255,255,0.55)' }}>
                        {m.papel === 'admin' ? 'Admin' : m.papel === 'lider' ? 'Líder' : 'Membro'}
                      </span>
                      <button onClick={() => removeMembro(m.profile_id)}
                        style={{ width: 26, height: 26, borderRadius: 8, border: '1px solid rgba(255,255,255,0.10)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.25)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.12)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.25)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── TAB: TAREFAS ── */}
          {tab === 'tarefas' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.30)' }}>
                <CheckSquare size={32} strokeWidth={1.2} style={{ marginBottom: 12 }} />
                <p style={{ fontSize: 14, margin: 0 }}>Vá para a aba <strong style={{ color: 'rgba(255,255,255,0.55)' }}>Tarefas</strong> no menu lateral<br />e filtre por responsável do grupo.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ CREATE GROUP MODAL ═══ */}
      {showModal && (
        <>
          <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.60)', zIndex: 60, backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 20, padding: 28, width: 420, maxWidth: '92vw', zIndex: 61, boxShadow: '0 24px 64px rgba(0,0,0,0.30)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#111827', margin: 0 }}>Novo Grupo</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Nome *</label>
                <input value={fNome} onChange={e => setFNome(e.target.value)} placeholder="Ex: Comercial SP"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && criarGrupo()}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.12)', fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Descrição</label>
                <textarea value={fDesc} onChange={e => setFDesc(e.target.value)} rows={2} placeholder="Objetivo do grupo…"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.12)', fontSize: 13, color: '#111827', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Cor</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {CORES.map(c => <button key={c} onClick={() => setFCor(c)} style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', cursor: 'pointer', background: c, outline: fCor === c ? `3px solid ${c}` : 'none', outlineOffset: 2 }} />)}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Privacidade</label>
                  <select value={fPriv} onChange={e => setFPriv(e.target.value)} style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.12)', fontSize: 13, cursor: 'pointer', background: '#fff', color: '#374151' }}>
                    <option value="privado">Privado</option>
                    <option value="publico">Público</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', background: '#f9fafb', color: '#6b7280', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>Cancelar</button>
              <button onClick={criarGrupo} disabled={saving || !fNome.trim()} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: saving || !fNome.trim() ? 'rgba(99,102,241,0.4)' : '#6366f1', color: '#fff', fontWeight: 700, cursor: saving || !fNome.trim() ? 'default' : 'pointer', fontSize: 14 }}>
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
