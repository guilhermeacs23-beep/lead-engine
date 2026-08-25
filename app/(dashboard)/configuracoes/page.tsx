'use client'
import React, { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { User, Bell, Shield, Palette, Save, Check, Plus, Trash2, Mail, RefreshCw, Eye, EyeOff, Copy, Lock, KeyRound } from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const TABS = [
  { id: 'equipe',       label: 'Equipe',       icon: User    },
  { id: 'notificacoes', label: 'Notificações',  icon: Bell    },
  { id: 'seguranca',    label: 'Segurança',     icon: Shield  },
  { id: 'aparencia',    label: 'Aparência',     icon: Palette },
]

const MEMBER_COLORS = [
  { label: 'Índigo',    value: '#6366f1' },
  { label: 'Violeta',   value: '#8b5cf6' },
  { label: 'Rosa',      value: '#ec4899' },
  { label: 'Esmeralda', value: '#10b981' },
  { label: 'Âmbar',    value: '#f59e0b' },
  { label: 'Céu',       value: '#0ea5e9' },
]

const NOTIF_OPTIONS = [
  { id: 'novo_lead',     label: 'Novo lead adicionado',           desc: 'Quando um lead é importado ou criado manualmente'    },
  { id: 'etapa_mudanca', label: 'Lead muda de etapa no pipeline', desc: 'Atualização de status no Kanban ou Lista'            },
  { id: 'atividade',     label: 'Nova atividade registrada',      desc: 'Ligação, e-mail ou reunião adicionada a um lead'     },
  { id: 'meta_semanal',  label: 'Resumo semanal',                 desc: 'Relatório com métricas da semana toda segunda-feira' },
]

const CARD: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid rgba(0,0,0,0.09)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  borderRadius: 14,
  padding: '18px 20px',
}

interface Profile {
  id: string
  nome: string
  email: string | null
  cargo: string | null
  cor: string | null
  ativo: boolean
  role: string
  isPending?: false
}
interface Invite {
  id: string
  email: string
  cargo: string
  cor: string
  status: string
  isPending: true
}
type Member = Profile | Invite

export default function ConfiguracoesPage() {
  const [tab,          setTab]         = useState('equipe')
  const [members,      setMembers]     = useState<Member[]>([])
  const [loadingTeam,  setLoadingTeam] = useState(true)
  const [saved,        setSaved]       = useState<string | null>(null)
  const [savedError,   setSavedError]  = useState<string | null>(null)

  // Cadastro novo usuário
  const [newNome,      setNewNome]     = useState('')
  const [newEmail,     setNewEmail]    = useState('')
  const [newCargo,     setNewCargo]    = useState('Vendedor')
  const [newSenha,     setNewSenha]    = useState('')
  const [showSenha,    setShowSenha]   = useState(false)
  const [creating,     setCreating]    = useState(false)
  const [createdCreds, setCreatedCreds] = useState<{email:string; senha:string; nome:string} | null>(null)

  // Reset senha de membro existente
  const [resetMemberId, setResetMemberId] = useState<string | null>(null)
  const [resetSenha,    setResetSenha]    = useState('')
  const [resetting,     setResetting]     = useState(false)

  // Segurança — troca de senha
  const [senhaAtual,   setSenhaAtual]  = useState('')
  const [senhaNova,    setSenhaNova]   = useState('')
  const [senhaConf,    setSenhaConf]   = useState('')
  const [trocando,     setTrocando]    = useState(false)

  const [notifs, setNotifs] = useState<Record<string, boolean>>({
    novo_lead: true, etapa_mudanca: true, atividade: false, meta_semanal: true,
  })

  function showSaved(msg: string) { setSaved(msg); setTimeout(() => setSaved(null), 3500) }
  function showError(msg: string) { setSavedError(msg); setTimeout(() => setSavedError(null), 4000) }

  function gerarSenha() {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    let s = upper[Math.floor(Math.random()*upper.length)]
    for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random()*chars.length)]
    s += Math.floor(10 + Math.random()*89)
    setNewSenha(s)
    setShowSenha(true)
  }

  async function handleCreateUser() {
    if (!newEmail.trim() || !newSenha.trim()) return
    setCreating(true)
    setCreatedCreds(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
        body: JSON.stringify({ email: newEmail.trim().toLowerCase(), password: newSenha, cargo: newCargo, nome: newNome.trim() || undefined }),
      })
      const json = await res.json()
      if (json.error) {
        const msg = json.error?.toLowerCase() || ''
        if (msg.includes('already been registered') || msg.includes('already registered')) {
          showError('Este e-mail já está cadastrado. Use outro e-mail ou redefina a senha pelo botão 🔑 na lista.')
        } else {
          showError(`Erro: ${json.error}`)
        }
        setCreating(false)
        return
      }
      setCreatedCreds({ email: newEmail.trim().toLowerCase(), senha: newSenha, nome: newNome.trim() || newEmail.split('@')[0] })
      setNewNome(''); setNewEmail(''); setNewSenha(''); setShowSenha(false)
      await loadTeam()
      showSaved(`✓ Acesso criado para ${json.email}`)
    } catch {
      showError('Erro ao criar usuário. Tente novamente.')
    }
    setCreating(false)
  }

  async function handleTrocarSenha() {
    if (!senhaNova || senhaNova !== senhaConf) { showError('Senhas não coincidem.'); return }
    if (senhaNova.length < 6) { showError('Senha deve ter no mínimo 6 caracteres.'); return }
    setTrocando(true)
    // Re-autentica com a senha atual para verificar
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) { showError('Sessão inválida.'); setTrocando(false); return }
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email, password: senhaAtual })
    if (signInErr) { showError('Senha atual incorreta.'); setTrocando(false); return }
    const { error } = await supabase.auth.updateUser({ password: senhaNova })
    if (error) { showError(`Erro: ${error.message}`); setTrocando(false); return }
    setSenhaAtual(''); setSenhaNova(''); setSenhaConf('')
    showSaved('✓ Senha alterada com sucesso!')
    setTrocando(false)
  }

  /* ── Load team ── */
  async function loadTeam() {
    setLoadingTeam(true)
    const [{ data: profiles }, { data: invites }] = await Promise.all([
      supabase.from('profiles').select('id, nome, email, cargo, cor, ativo, role').eq('ativo', true).order('nome'),
      supabase.from('team_invites').select('id, email, cargo, cor, status').eq('status', 'pendente'),
    ])
    const list: Member[] = [
      ...(profiles || []).map(p => ({ ...p, isPending: false as const })),
      ...(invites  || []).map(i => ({ ...i, isPending: true  as const })),
    ]
    setMembers(list)
    setLoadingTeam(false)
  }

  useEffect(() => { loadTeam() }, [])

  /* ── Delete real (remove do Auth) ── */
  async function deleteMember(member: Member) {
    if (!confirm(`Remover ${member.isPending ? member.email : (member as Profile).nome}? O acesso será revogado.`)) return
    if (member.isPending) {
      await supabase.from('team_invites').delete().eq('id', member.id)
    } else {
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
        body: JSON.stringify({ action: 'delete', user_id: member.id }),
      })
    }
    setMembers(prev => prev.filter(m => m.id !== member.id))
    showSaved('Membro removido e acesso revogado.')
  }

  /* ── Reset senha de membro ── */
  async function handleResetSenha(userId: string) {
    if (!resetSenha.trim() || resetSenha.length < 6) { showError('Senha deve ter ao menos 6 caracteres.'); return }
    setResetting(true)
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      body: JSON.stringify({ action: 'reset_password', user_id: userId, password: resetSenha }),
    })
    const json = await res.json()
    if (json.error) { showError(`Erro: ${json.error}`) } else { showSaved('✓ Senha alterada com sucesso!') }
    setResetMemberId(null); setResetSenha(''); setResetting(false)
  }

  /* ── Update color ── */
  async function updateColor(member: Member, cor: string) {
    if (member.isPending) {
      await supabase.from('team_invites').update({ cor }).eq('id', member.id)
    } else {
      await supabase.from('profiles').update({ cor }).eq('id', member.id)
    }
    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, cor } : m))
  }

  /* ── Update cargo ── */
  async function updateCargo(member: Member, cargo: string) {
    if (member.isPending) {
      await supabase.from('team_invites').update({ cargo }).eq('id', member.id)
    } else {
      await supabase.from('profiles').update({ cargo }).eq('id', member.id)
    }
    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, cargo } : m))
    showSaved('Cargo atualizado.')
  }

  /* ── Invite ── */
  async function handleInvite() {
    if (!inviteEmail.trim()) return
    setInviting(true)
    const email = inviteEmail.trim().toLowerCase()

    // 1. Salva convite na tabela
    const { error } = await supabase.from('team_invites').insert({
      email, cargo: inviteCargo, cor: '#6366f1', status: 'pendente',
    })
    if (error) {
      if (error.code === '23505') showSaved('Este e-mail já foi convidado.')
      else showSaved('Erro ao convidar. Tente novamente.')
      setInviting(false)
      return
    }

    // 2. Dispara e-mail de convite via Edge Function
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/invite-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
        body: JSON.stringify({ email, cargo: inviteCargo }),
      })
      const json = await res.json()
      if (json.error) showSaved(`Convite salvo, mas e-mail falhou: ${json.error}`)
      else showSaved(`✓ Convite enviado para ${email}`)
    } catch {
      showSaved(`Convite salvo, mas e-mail não pôde ser enviado.`)
    }

  }

  const activeCount  = members.filter(m => !m.isPending).length
  const pendingCount = members.filter(m => m.isPending).length

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Left sidebar ── */}
      <div style={{
        width: 208, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4,
        padding: 16,
        borderRight: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(255,255,255,0.10)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <p style={{ marginBottom: 10, paddingLeft: 8, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.45)' }}>
          Configurações
        </p>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 10, border: 'none',
            cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: tab === id ? 600 : 400,
            background: tab === id ? 'rgba(255,255,255,0.15)' : 'transparent',
            color: tab === id ? '#ffffff' : 'rgba(255,255,255,0.55)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (tab !== id) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)' }}
          onMouseLeave={e => { if (tab !== id) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <Icon size={14} strokeWidth={1.6} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Toasts */}
        {saved && (
          <div style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(16,185,129,0.92)', borderRadius: 12, padding: '12px 20px',
            fontSize: 13, fontWeight: 600, color: '#ffffff',
            boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
          }}>
            <Check size={14} /> {saved}
          </div>
        )}
        {savedError && (
          <div style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(239,68,68,0.92)', borderRadius: 12, padding: '12px 20px',
            fontSize: 13, fontWeight: 600, color: '#ffffff',
            boxShadow: '0 8px 24px rgba(239,68,68,0.35)',
          }}>
            {savedError}
          </div>
        )}

        {/* ────────── EQUIPE ────────── */}
        {tab === 'equipe' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 700 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', margin: 0 }}>Equipe</h2>
                <p style={{ marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                  Gerencie os membros que têm acesso ao Lead Engine
                </p>
              </div>
              <button onClick={loadTeam} style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 12px', color: 'rgba(255,255,255,0.70)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <RefreshCw size={12} /> Atualizar
              </button>
            </div>

            {/* Cadastrar novo usuário */}
            <div style={{ ...CARD, background: '#f0f0ff', border: '1px solid rgba(99,102,241,0.20)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>Cadastrar acesso para vendedor</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('https://lead-engine-red-eight.vercel.app/login')
                    showSaved('✓ Link copiado!')
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.30)', background: 'rgba(99,102,241,0.08)', color: '#6366f1', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  <Copy size={12} /> Copiar link de acesso
                </button>
              </div>
              <p style={{ marginBottom: 14, fontSize: 12, color: '#6b7280' }}>
                Crie o acesso abaixo, copie as credenciais e envie para o vendedor.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                {/* Nome */}
                <div style={{ flex: '1 1 180px', display: 'flex', alignItems: 'center', gap: 8, background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10, padding: '10px 14px' }}>
                  <User size={14} style={{ color: '#9ca3af', flexShrink: 0 }} strokeWidth={1.5} />
                  <input
                    value={newNome}
                    onChange={e => setNewNome(e.target.value)}
                    placeholder="Nome completo"
                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#111827', background: 'transparent' }}
                  />
                </div>
                {/* Email */}
                <div style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: 8, background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10, padding: '10px 14px' }}>
                  <Mail size={14} style={{ color: '#9ca3af', flexShrink: 0 }} strokeWidth={1.5} />
                  <input
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="email@empresa.com.br"
                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#111827', background: 'transparent' }}
                  />
                </div>
                {/* Cargo */}
                <select
                  value={newCargo}
                  onChange={e => setNewCargo(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', background: '#ffffff', fontSize: 13, color: '#374151', cursor: 'pointer' }}
                >
                  {['Vendedor','Supervisor','Analista','Gerente Comercial','Administrador'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              {/* Senha temporária */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10, padding: '10px 14px' }}>
                  <Lock size={14} style={{ color: '#9ca3af', flexShrink: 0 }} strokeWidth={1.5} />
                  <input
                    type={showSenha ? 'text' : 'password'}
                    value={newSenha}
                    onChange={e => setNewSenha(e.target.value)}
                    placeholder="Senha temporária"
                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#111827', background: 'transparent', fontFamily: showSenha ? 'inherit' : 'monospace' }}
                  />
                  <button onClick={() => setShowSenha(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                    {showSenha ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <button onClick={gerarSenha} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', background: '#ffffff', fontSize: 12, color: '#6366f1', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Gerar senha
                </button>
                <button onClick={handleCreateUser} disabled={creating || !newEmail.trim() || !newSenha.trim()} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
                  borderRadius: 10, border: 'none', cursor: creating ? 'default' : 'pointer',
                  background: (creating || !newEmail.trim() || !newSenha.trim()) ? 'rgba(99,102,241,0.4)' : '#6366f1',
                  color: '#ffffff', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
                }}>
                  <Plus size={13} strokeWidth={2} /> {creating ? 'Criando...' : 'Criar acesso'}
                </button>
              </div>

              {/* Credenciais criadas — caixa para copiar */}
              {createdCreds && (
                <div style={{ background: '#f0fdf4', border: '1px solid rgba(16,185,129,0.30)', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#065f46' }}>✓ Acesso criado!</p>
                    <button
                      onClick={() => {
                        const msg =
`Olá! Seu acesso ao Lead+ foi criado. 🚀

🔗 Link: https://lead-engine-red-eight.vercel.app/login
📧 E-mail: ${createdCreds.email}
🔑 Senha: ${createdCreds.senha}

Acesse o link acima e faça login com essas credenciais.
Depois vá em Configurações → Segurança para alterar sua senha.`
                        navigator.clipboard.writeText(msg)
                        showSaved('✓ Mensagem copiada! Cole no WhatsApp ou e-mail.')
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: '#10b981', color: '#ffffff', fontSize: 12, fontWeight: 700,
                      }}
                    >
                      <Copy size={12} /> Copiar tudo para WhatsApp
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {[
                      { label: '🔗 Link',   value: 'https://lead-engine-red-eight.vercel.app/login' },
                      { label: '📧 E-mail', value: createdCreds.email },
                      { label: '🔑 Senha',  value: createdCreds.senha },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 70, fontSize: 11, fontWeight: 600, color: '#6b7280', flexShrink: 0 }}>{label}</span>
                        <code style={{ flex: 1, fontSize: 12, color: '#111827', background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 6, padding: '4px 8px' }}>{value}</code>
                        <button
                          onClick={() => navigator.clipboard.writeText(value)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                          title="Copiar"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Members list */}
            {loadingTeam ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12, color: 'rgba(255,255,255,0.40)' }}>
                <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Carregando equipe...
              </div>
            ) : members.length === 0 ? (
              <div style={{ ...CARD, textAlign: 'center', padding: 32, color: '#9ca3af' }}>
                Nenhum membro ainda. Convide alguém acima.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {members.map(member => {
                  const nome  = member.isPending ? member.email.split('@')[0] : (member as Profile).nome
                  const email = member.isPending ? member.email : ((member as Profile).email || '—')
                  const cargo = member.cargo || 'Vendedor'
                  const cor   = member.cor   || '#6366f1'

                  return (
                    <React.Fragment key={member.id}>
                    <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 14 }}>
                      {/* Avatar */}
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: cor, color: '#ffffff', fontSize: 14, fontWeight: 700,
                      }}>
                        {nome.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {member.isPending ? email : nome}
                          </span>
                          {member.isPending && (
                            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'rgba(245,158,11,0.12)', color: '#d97706', border: '1px solid rgba(245,158,11,0.25)', whiteSpace: 'nowrap' }}>
                              Pendente
                            </span>
                          )}
                        </div>
                        {!member.isPending && (
                          <span style={{ fontSize: 12, color: '#6b7280' }}>{email}</span>
                        )}
                      </div>

                      {/* Cargo — editável */}
                      <select
                        value={cargo}
                        onChange={e => updateCargo(member, e.target.value)}
                        style={{ padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#f3f4f6', color: '#374151', border: '1px solid rgba(0,0,0,0.08)', cursor: 'pointer', flexShrink: 0 }}
                      >
                        {['Vendedor','Supervisor','Analista','Gerente Comercial','Administrador'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>

                      {/* Color picker */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                        {MEMBER_COLORS.map(c => (
                          <button key={c.value}
                            onClick={() => updateColor(member, c.value)}
                            style={{
                              width: 16, height: 16, borderRadius: '50%', border: 'none', cursor: 'pointer',
                              background: c.value,
                              outline: cor === c.value ? `2.5px solid ${c.value}` : 'none',
                              outlineOffset: 2, transition: 'transform 0.15s',
                            }}
                            title={c.label}
                          />
                        ))}
                      </div>

                      {/* Reset senha (só para membros reais, não pendentes) */}
                      {!member.isPending && (
                        <button
                          onClick={() => { setResetMemberId(resetMemberId === member.id ? null : member.id); setResetSenha('') }}
                          style={{
                            width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(0,0,0,0.09)',
                            background: resetMemberId === member.id ? '#eff6ff' : '#fff',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: resetMemberId === member.id ? '#3b82f6' : '#9ca3af',
                            transition: 'all 0.15s', flexShrink: 0,
                          }}
                          title="Redefinir senha"
                        >
                          <KeyRound size={13} strokeWidth={1.5} />
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => deleteMember(member)}
                        style={{
                          width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(0,0,0,0.09)',
                          background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#9ca3af', transition: 'all 0.15s', flexShrink: 0,
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fef2f2'; (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff';    (e.currentTarget as HTMLElement).style.color = '#9ca3af' }}
                        title="Remover membro"
                      >
                        <Trash2 size={13} strokeWidth={1.5} />
                      </button>
                    </div>

                    {/* Painel inline reset senha */}
                    {resetMemberId === member.id && (
                      <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', paddingTop: 10, borderTop: '1px solid #f0f0f0' }}>
                        <Lock size={13} style={{ color: '#9ca3af', flexShrink: 0 }} strokeWidth={1.5} />
                        <input
                          type="password"
                          value={resetSenha}
                          onChange={e => setResetSenha(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleResetSenha(member.id)}
                          placeholder="Nova senha (mín. 6 caracteres)"
                          style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 12px', fontSize: 13, color: '#111827', outline: 'none', background: '#f9fafb' }}
                        />
                        <button
                          onClick={() => handleResetSenha(member.id)}
                          disabled={resetting}
                          style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          {resetting ? 'Salvando…' : 'Salvar senha'}
                        </button>
                        <button onClick={() => { setResetMemberId(null); setResetSenha('') }}
                          style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#9ca3af', fontSize: 12, cursor: 'pointer' }}>
                          Cancelar
                        </button>
                      </div>
                    )}
                    </React.Fragment>
                  )
                })}
              </div>
            )}

            {!loadingTeam && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                {activeCount} membro{activeCount !== 1 ? 's' : ''} ativo{activeCount !== 1 ? 's' : ''}
                {pendingCount > 0 && ` · ${pendingCount} convite${pendingCount !== 1 ? 's' : ''} pendente${pendingCount !== 1 ? 's' : ''}`}
              </p>
            )}
          </div>
        )}

        {/* ────────── NOTIFICAÇÕES ────────── */}
        {tab === 'notificacoes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 560 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', margin: 0 }}>Notificações</h2>
              <p style={{ marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Escolha quais alertas receber por e-mail</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {NOTIF_OPTIONS.map(({ id, label, desc }) => (
                <div key={id} onClick={() => setNotifs(n => ({ ...n, [id]: !n[id] }))}
                  style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>{label}</p>
                    <p style={{ fontSize: 12, color: '#6b7280', margin: '3px 0 0' }}>{desc}</p>
                  </div>
                  <div style={{ position: 'relative', width: 38, height: 22, borderRadius: 11, flexShrink: 0, transition: 'background 0.2s', background: notifs[id] ? '#6366f1' : '#d1d5db' }}>
                    <div style={{ position: 'absolute', top: 3, width: 16, height: 16, borderRadius: '50%', background: '#ffffff', boxShadow: '0 1px 4px rgba(0,0,0,0.20)', transition: 'left 0.2s', left: notifs[id] ? '19px' : '3px' }} />
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => showSaved('Preferências de notificação salvas!')} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px',
              borderRadius: 10, border: 'none', cursor: 'pointer',
              background: '#6366f1', color: '#ffffff', fontSize: 13, fontWeight: 700, alignSelf: 'flex-start',
            }}>
              <Save size={13} strokeWidth={1.5} /> Salvar preferências
            </button>
          </div>
        )}

        {/* ────────── SEGURANÇA ────────── */}
        {tab === 'seguranca' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 560 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', margin: 0 }}>Segurança</h2>
              <p style={{ marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Gerencie sua senha e sessões ativas</p>
            </div>
            <div style={CARD}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Alterar senha</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Senha atual',          value: senhaAtual, set: setSenhaAtual },
                  { label: 'Nova senha',            value: senhaNova,  set: setSenhaNova },
                  { label: 'Confirmar nova senha',  value: senhaConf,  set: setSenhaConf },
                ].map(({ label, value, set }) => (
                  <div key={label}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f9fafb', border: '1px solid rgba(0,0,0,0.10)', borderRadius: 10, padding: '10px 14px' }}>
                      <Shield size={13} style={{ color: '#9ca3af' }} strokeWidth={1.5} />
                      <input type="password" placeholder="••••••••" value={value}
                        onChange={e => set(e.target.value)}
                        style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#111827', background: 'transparent' }} />
                    </div>
                  </div>
                ))}
              </div>
              {senhaNova && senhaConf && senhaNova !== senhaConf && (
                <p style={{ marginTop: 8, fontSize: 12, color: '#ef4444' }}>As senhas não coincidem.</p>
              )}
              <button
                onClick={handleTrocarSenha}
                disabled={trocando || !senhaAtual || !senhaNova || senhaNova !== senhaConf}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                  borderRadius: 10, border: 'none', cursor: trocando ? 'default' : 'pointer', marginTop: 16,
                  background: (trocando || !senhaAtual || !senhaNova || senhaNova !== senhaConf) ? 'rgba(99,102,241,0.4)' : '#6366f1',
                  color: '#ffffff', fontSize: 13, fontWeight: 700,
                }}>
                {trocando ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} strokeWidth={1.5} />}
                {trocando ? 'Alterando...' : 'Atualizar senha'}
              </button>
            </div>
            <div style={{ ...CARD, background: '#fff5f5', border: '1px solid rgba(239,68,68,0.18)' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Encerrar todas as sessões</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 14px' }}>Desconecta todos os dispositivos exceto o atual</p>
              <button style={{ padding: '9px 16px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.25)', background: '#ffffff', color: '#ef4444', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Encerrar sessões remotas
              </button>
            </div>
          </div>
        )}

        {/* ────────── APARÊNCIA ────────── */}
        {tab === 'aparencia' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 560 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', margin: 0 }}>Aparência</h2>
              <p style={{ marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Personalize o visual da interface</p>
            </div>
            <div style={CARD}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 10px' }}>Fundo / tema visual</p>
              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
                Acesse o painel de fundos clicando no botão <strong style={{ color: '#374151' }}>Fundo</strong> na barra superior. Você pode escolher entre gradientes, meshes e fundos animados.
              </p>
            </div>
            <div style={CARD}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 14px' }}>Idioma e região</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Idioma', value: 'Português (Brasil)' },
                  { label: 'Fuso horário', value: 'America/Sao_Paulo (UTC-3)' },
                  { label: 'Moeda', value: 'BRL — Real Brasileiro' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>{label}</span>
                    <span style={{ padding: '5px 12px', borderRadius: 8, background: '#f3f4f6', border: '1px solid rgba(0,0,0,0.08)', fontSize: 13, fontWeight: 600, color: '#111827' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Mapa do Site ── */}
        <a href="/mapa-do-site" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderRadius: 14, padding: '14px 18px', textDecoration: 'none', marginTop: 8,
          background: '#ffffff', border: '1px solid rgba(0,0,0,0.09)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)', transition: 'all 0.18s',
          maxWidth: 700,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Mapa do Site</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>Visão geral de todos os módulos e navegação completa</p>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </a>

      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
