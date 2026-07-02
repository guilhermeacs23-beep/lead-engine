'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Profile {
  id: string
  nome: string
  email: string
  role: string
  status: 'pending' | 'active' | 'inactive'
  ativo: boolean
  tenant_id: string | null
  created_at: string
  tenants: { nome: string; ssw_folder: string | null } | null
}

interface Tenant {
  id: string
  nome: string
  ssw_folder: string | null
  email: string | null
  telefone: string | null
  contato: string | null
  plano: string
  ativo: boolean
  created_at: string
}

interface Health {
  usuarios: { total: number; ativos: number }
  tenants: number
  leads: number
  clientes_recap: { total: number; distribuicao: Record<string, number>; ultima_sync: string | null }
  campo: { locations: number; stops: number }
  timestamp: string
}

type Tab = 'usuarios' | 'empresas' | 'saude'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = { pending: 'Pendente', active: 'Ativo', inactive: 'Inativo' }
const STATUS_COLOR: Record<string, string> = {
  pending:  'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  active:   'bg-green-500/20  text-green-300  border-green-500/40',
  inactive: 'bg-red-500/20    text-red-300    border-red-500/40',
}

function fmt(n: number) { return n.toLocaleString('pt-BR') }
function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' })
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('usuarios')
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  // dados
  const [users, setUsers]     = useState<Profile[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [health, setHealth]   = useState<Health | null>(null)
  const [loading, setLoading] = useState(false)

  // novo tenant form
  const [showNewTenant, setShowNewTenant] = useState(false)
  const [newTenant, setNewTenant] = useState({ nome: '', ssw_folder: '', email: '', telefone: '', contato: '' })
  const [saving, setSaving] = useState(false)

  // modal vincular usuário
  const [linking, setLinking] = useState<Profile | null>(null)
  const [selectedTenant, setSelectedTenant] = useState('')

  // ─── Auth check ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'owner') { router.replace('/'); return }
      setAuthorized(true)
    }
    check()
  }, [router])

  // ─── Loaders ───────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }, [])

  const loadTenants = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/tenants')
    if (res.ok) setTenants(await res.json())
    setLoading(false)
  }, [])

  const loadHealth = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/health')
    if (res.ok) setHealth(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!authorized) return
    if (tab === 'usuarios') loadUsers()
    if (tab === 'empresas') { loadTenants(); loadUsers() }
    if (tab === 'saude')    loadHealth()
  }, [tab, authorized, loadUsers, loadTenants, loadHealth])

  // ─── Ações ─────────────────────────────────────────────────────────────────
  async function setUserStatus(user: Profile, status: 'active' | 'inactive' | 'pending') {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, status }),
    })
    loadUsers()
  }

  async function linkTenant() {
    if (!linking || !selectedTenant) return
    setSaving(true)
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: linking.id, tenant_id: selectedTenant, status: 'active' }),
    })
    setSaving(false)
    setLinking(null)
    setSelectedTenant('')
    loadUsers()
  }

  async function createTenant() {
    if (!newTenant.nome) return
    setSaving(true)
    await fetch('/api/admin/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTenant),
    })
    setSaving(false)
    setShowNewTenant(false)
    setNewTenant({ nome: '', ssw_folder: '', email: '', telefone: '', contato: '' })
    loadTenants()
  }

  async function toggleTenant(t: Tenant) {
    await fetch('/api/admin/tenants', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: t.id, ativo: !t.ativo }),
    })
    loadTenants()
  }

  // ─── Render guard ──────────────────────────────────────────────────────────
  if (authorized === null) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  // ─── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm font-bold">A</div>
          <div>
            <h1 className="text-sm font-semibold">Painel Admin</h1>
            <p className="text-xs text-white/40">Lead+ · Gestão de sistemas</p>
          </div>
        </div>
        <button onClick={() => router.push('/')} className="text-xs text-white/40 hover:text-white/70 transition-colors">
          ← Voltar ao CRM
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit mb-8">
          {(['usuarios', 'empresas', 'saude'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                tab === t ? 'bg-white text-black' : 'text-white/50 hover:text-white/80'
              }`}
            >
              {t === 'usuarios' ? 'Usuários' : t === 'empresas' ? 'Empresas' : 'Saúde'}
            </button>
          ))}
        </div>

        {/* ── Tab: Usuários ──────────────────────────────────────────────────── */}
        {tab === 'usuarios' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">Usuários</h2>
                <p className="text-xs text-white/40 mt-0.5">Gerencie acessos e ativações</p>
              </div>
              <div className="flex gap-2 text-xs text-white/50">
                <span className="px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-300">{users.filter(u => u.status === 'pending').length} pendentes</span>
                <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-300">{users.filter(u => u.status === 'active').length} ativos</span>
              </div>
            </div>

            {loading ? (
              <div className="text-white/30 text-sm">Carregando...</div>
            ) : (
              <div className="space-y-2">
                {users.map(user => (
                  <div key={user.id} className="bg-white/5 border border-white/8 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/30 to-indigo-500/30 flex items-center justify-center text-sm font-bold text-violet-300 shrink-0">
                      {user.nome?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{user.nome || '—'}</span>
                        <span className="text-xs text-white/30 bg-white/5 px-1.5 py-0.5 rounded">{user.role}</span>
                      </div>
                      <div className="text-xs text-white/40 mt-0.5">{user.email}</div>
                      <div className="text-xs text-white/30 mt-0.5">
                        Empresa: <span className="text-white/50">{user.tenants?.nome ?? <span className="text-yellow-400">sem empresa</span>}</span>
                        {user.tenants?.ssw_folder && <span className="ml-2 text-blue-400">SSW: {user.tenants.ssw_folder}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLOR[user.status]}`}>
                        {STATUS_LABEL[user.status]}
                      </span>
                      {user.status === 'pending' && (
                        <button
                          onClick={() => { setLinking(user); setSelectedTenant('') }}
                          className="text-xs px-3 py-1.5 bg-violet-500 hover:bg-violet-400 text-white rounded-lg transition-colors"
                        >
                          Ativar
                        </button>
                      )}
                      {user.status === 'active' && user.role !== 'owner' && (
                        <button
                          onClick={() => setUserStatus(user, 'inactive')}
                          className="text-xs px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                        >
                          Bloquear
                        </button>
                      )}
                      {user.status === 'inactive' && (
                        <button
                          onClick={() => setUserStatus(user, 'active')}
                          className="text-xs px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors"
                        >
                          Reativar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {users.length === 0 && <p className="text-white/30 text-sm">Nenhum usuário encontrado.</p>}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Empresas ──────────────────────────────────────────────────── */}
        {tab === 'empresas' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">Empresas</h2>
                <p className="text-xs text-white/40 mt-0.5">Clientes ativos no sistema</p>
              </div>
              <button
                onClick={() => setShowNewTenant(true)}
                className="text-sm px-4 py-2 bg-violet-500 hover:bg-violet-400 text-white rounded-xl transition-colors"
              >
                + Nova empresa
              </button>
            </div>

            {/* Form nova empresa */}
            {showNewTenant && (
              <div className="bg-white/5 border border-violet-500/30 rounded-xl p-5 mb-6">
                <h3 className="text-sm font-semibold mb-4">Nova empresa</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'nome', label: 'Nome da empresa *', placeholder: 'Transportadora XYZ' },
                    { key: 'ssw_folder', label: 'Pasta SSW', placeholder: '455' },
                    { key: 'contato', label: 'Nome do contato', placeholder: 'João Silva' },
                    { key: 'email', label: 'E-mail', placeholder: 'joao@empresa.com.br' },
                    { key: 'telefone', label: 'Telefone', placeholder: '(11) 99999-9999' },
                  ].map(f => (
                    <div key={f.key} className={f.key === 'nome' ? 'col-span-2' : ''}>
                      <label className="text-xs text-white/50 mb-1 block">{f.label}</label>
                      <input
                        value={(newTenant as Record<string, string>)[f.key]}
                        onChange={e => setNewTenant(prev => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/60"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={createTenant} disabled={saving || !newTenant.nome}
                    className="text-sm px-4 py-2 bg-violet-500 hover:bg-violet-400 disabled:opacity-40 text-white rounded-lg transition-colors">
                    {saving ? 'Salvando...' : 'Criar empresa'}
                  </button>
                  <button onClick={() => setShowNewTenant(false)} className="text-sm px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-white/30 text-sm">Carregando...</div>
            ) : (
              <div className="space-y-2">
                {tenants.map(t => (
                  <div key={t.id} className={`bg-white/5 border rounded-xl p-4 flex items-center gap-4 ${t.ativo ? 'border-white/8' : 'border-red-500/20 opacity-60'}`}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center text-lg font-bold text-blue-300 shrink-0">
                      {t.nome[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{t.nome}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.ativo ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {t.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                        {t.plano && <span className="text-xs bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded-full">{t.plano}</span>}
                      </div>
                      <div className="flex gap-4 mt-1 text-xs text-white/40">
                        {t.contato && <span>👤 {t.contato}</span>}
                        {t.email && <span>✉ {t.email}</span>}
                        {t.telefone && <span>📞 {t.telefone}</span>}
                        {t.ssw_folder && <span className="text-blue-400">📁 SSW: /{t.ssw_folder}/</span>}
                      </div>
                      <div className="text-xs text-white/25 mt-0.5">
                        Desde {fmtDate(t.created_at)} · {users.filter(u => u.tenant_id === t.id).length} usuário(s)
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => toggleTenant(t)}
                        className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                          t.ativo
                            ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300'
                            : 'bg-green-500/20 hover:bg-green-500/30 text-green-300'
                        }`}>
                        {t.ativo ? 'Suspender' : 'Reativar'}
                      </button>
                    </div>
                  </div>
                ))}
                {tenants.length === 0 && <p className="text-white/30 text-sm">Nenhuma empresa cadastrada.</p>}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Saúde ─────────────────────────────────────────────────────── */}
        {tab === 'saude' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">Saúde do sistema</h2>
                <p className="text-xs text-white/40 mt-0.5">
                  {health ? `Atualizado ${fmtDate(health.timestamp)}` : 'Lead+ · Projeto 2'}
                </p>
              </div>
              <button onClick={loadHealth} className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg transition-colors">
                ↻ Atualizar
              </button>
            </div>

            {loading && !health ? (
              <div className="text-white/30 text-sm">Carregando métricas...</div>
            ) : health ? (
              <div className="space-y-6">
                {/* Cards principais */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Usuários ativos', value: fmt(health.usuarios.ativos), sub: `${fmt(health.usuarios.total)} total`, color: 'from-green-500/20 to-green-600/10' },
                    { label: 'Empresas ativas', value: fmt(health.tenants), sub: 'tenants', color: 'from-blue-500/20 to-blue-600/10' },
                    { label: 'Leads no pipeline', value: fmt(health.leads), sub: 'ativos', color: 'from-violet-500/20 to-violet-600/10' },
                    { label: 'Clientes Recap', value: fmt(health.clientes_recap.total), sub: `sync ${fmtDate(health.clientes_recap.ultima_sync)}`, color: 'from-orange-500/20 to-orange-600/10' },
                  ].map(c => (
                    <div key={c.label} className={`bg-gradient-to-br ${c.color} border border-white/8 rounded-xl p-4`}>
                      <div className="text-2xl font-bold">{c.value}</div>
                      <div className="text-sm text-white/70 mt-0.5">{c.label}</div>
                      <div className="text-xs text-white/35 mt-1">{c.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Distribuição Recap */}
                <div className="bg-white/5 border border-white/8 rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4">Distribuição Recap por categoria</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { cat: 'QUENTE', color: 'text-red-400 bg-red-500/15' },
                      { cat: 'MORNO', color: 'text-orange-400 bg-orange-500/15' },
                      { cat: 'FRIO', color: 'text-blue-400 bg-blue-500/15' },
                      { cat: 'PERDIDO', color: 'text-white/30 bg-white/5' },
                    ].map(({ cat, color }) => {
                      const n = health.clientes_recap.distribuicao[cat] ?? 0
                      const pct = health.clientes_recap.total > 0
                        ? Math.round((n / health.clientes_recap.total) * 100) : 0
                      return (
                        <div key={cat} className={`rounded-xl p-3 ${color}`}>
                          <div className="text-lg font-bold">{fmt(n)}</div>
                          <div className="text-xs mt-0.5 opacity-80">{cat}</div>
                          <div className="text-xs opacity-50 mt-0.5">{pct}%</div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* App de Campo */}
                <div className="bg-white/5 border border-white/8 rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4">App de campo (vendedores)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold">{fmt(health.campo.locations)}</div>
                      <div className="text-xs text-white/40 mt-1">Pontos de localização</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{fmt(health.campo.stops)}</div>
                      <div className="text-xs text-white/40 mt-1">Paradas registradas</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-white/30 text-sm">Erro ao carregar métricas.</div>
            )}
          </div>
        )}
      </div>

      {/* ── Modal: Vincular tenant ──────────────────────────────────────────── */}
      {linking && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold mb-1">Ativar usuário</h3>
            <p className="text-xs text-white/40 mb-5">{linking.nome} · {linking.email}</p>

            <label className="text-xs text-white/50 mb-1.5 block">Vincular à empresa</label>
            <select
              value={selectedTenant}
              onChange={e => setSelectedTenant(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/60 mb-4"
            >
              <option value="">Selecione uma empresa...</option>
              {tenants.filter(t => t.ativo).map(t => (
                <option key={t.id} value={t.id}>{t.nome} {t.ssw_folder ? `(SSW: ${t.ssw_folder})` : ''}</option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                onClick={linkTenant}
                disabled={saving || !selectedTenant}
                className="flex-1 py-2 bg-violet-500 hover:bg-violet-400 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors"
              >
                {saving ? 'Ativando...' : 'Ativar acesso'}
              </button>
              <button onClick={() => setLinking(null)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 text-sm rounded-xl transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
