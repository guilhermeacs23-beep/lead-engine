'use client'
import { useState, useEffect, useRef } from 'react'
import {
  Plus, Search, CheckCircle2, Circle, Clock, AlertCircle,
  ChevronDown, MoreHorizontal, Calendar, Tag, Star, Flag, Link2,
  X, Trash2, Check, Loader2,
} from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const TENANT_ID = '00000000-0000-0000-0000-000000000001'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pendente:  { label: 'Pendente',     color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', icon: Circle       },
  andamento: { label: 'Em andamento', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)',  icon: Clock        },
  concluida: { label: 'Concluída',    color: '#34d399', bg: 'rgba(52,211,153,0.15)',  icon: CheckCircle2 },
  bloqueada: { label: 'Bloqueada',    color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   icon: AlertCircle  },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  alta:  { label: 'Alta',  color: '#ef4444' },
  media: { label: 'Média', color: '#fbbf24' },
  baixa: { label: 'Baixa', color: '#34d399' },
}

const STATUS_TABS = ['Todas','Pendente','Em andamento','Concluída','Bloqueada']

interface Profile { id: string; nome: string; cor: string; cargo: string }
interface Tarefa {
  id: string; titulo: string; descricao?: string
  status: string; prioridade: string; prazo?: string
  responsavel_id?: string; responsavel?: Profile
  projeto?: string; lead_id?: string; starred: boolean
  created_at: string
}

function initials(nome: string) {
  return nome.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function TarefasPage() {
  const [tasks,        setTasks]        = useState<Tarefa[]>([])
  const [profiles,     setProfiles]     = useState<Profile[]>([])
  const [loading,      setLoading]      = useState(true)
  const [statusFilter, setStatusFilter] = useState('Todas')
  const [search,       setSearch]       = useState('')
  const [currentUser,  setCurrentUser]  = useState<Profile | null>(null)

  // Modal nova tarefa
  const [showModal,    setShowModal]    = useState(false)
  const [mTitulo,      setMTitulo]      = useState('')
  const [mDesc,        setMDesc]        = useState('')
  const [mStatus,      setMStatus]      = useState('pendente')
  const [mPrio,        setMPrio]        = useState('media')
  const [mPrazo,       setMPrazo]       = useState('')
  const [mResp,        setMResp]        = useState('')
  const [mProjeto,     setMProjeto]     = useState('')
  const [saving,       setSaving]       = useState(false)

  // Context menu
  const [menuTask,     setMenuTask]     = useState<string | null>(null)
  const [menuPos,      setMenuPos]      = useState({ x: 0, y: 0 })
  const menuRef = useRef<HTMLDivElement>(null)

  // Fechar menu ao clicar fora
  useEffect(() => {
    function close(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuTask(null)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  async function load() {
    setLoading(true)
    const [{ data: profs }, { data: tars }, { data: { user } }] = await Promise.all([
      supabase.from('profiles').select('id,nome,cor,cargo').eq('ativo', true).order('nome'),
      supabase.from('tarefas').select('*').eq('tenant_id', TENANT_ID).order('created_at', { ascending: false }),
      supabase.auth.getUser(),
    ])
    const profList = (profs || []) as Profile[]
    setProfiles(profList)
    if (user) {
      const me = profList.find(p => p.id === user.id)
      if (me) { setCurrentUser(me); setMResp(me.id) }
    }
    const tarefasList = (tars || []).map((t: any) => ({
      ...t,
      responsavel: profList.find(p => p.id === t.responsavel_id),
    })) as Tarefa[]
    setTasks(tarefasList)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = tasks.filter(t => {
    const sOk = statusFilter === 'Todas' || STATUS_CONFIG[t.status]?.label === statusFilter
    const qOk = !search || t.titulo.toLowerCase().includes(search.toLowerCase())
    return sOk && qOk
  })

  const stats = {
    total:   tasks.length,
    done:    tasks.filter(t => t.status === 'concluida').length,
    hoje:    tasks.filter(t => t.prazo === new Date().toISOString().slice(0, 10)).length,
    blocked: tasks.filter(t => t.status === 'bloqueada').length,
  }

  async function handleCreate() {
    if (!mTitulo.trim() || saving) return
    setSaving(true)
    const { data, error } = await supabase.from('tarefas').insert({
      tenant_id: TENANT_ID,
      titulo: mTitulo.trim(),
      descricao: mDesc || null,
      status: mStatus,
      prioridade: mPrio,
      prazo: mPrazo || null,
      responsavel_id: mResp || null,
      projeto: mProjeto || null,
      criado_por: currentUser?.id || null,
    }).select().single()
    if (!error && data) {
      const prof = profiles.find(p => p.id === (data as any).responsavel_id)
      setTasks(prev => [{ ...(data as any), responsavel: prof }, ...prev])
      setShowModal(false)
      setMTitulo(''); setMDesc(''); setMStatus('pendente'); setMPrio('media')
      setMPrazo(''); setMProjeto('')
      if (currentUser) setMResp(currentUser.id)
    }
    setSaving(false)
  }

  async function handleStatusChange(id: string, newStatus: string) {
    setMenuTask(null)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
    await supabase.from('tarefas').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id)
  }

  async function handleDelete(id: string) {
    setMenuTask(null)
    setTasks(prev => prev.filter(t => t.id !== id))
    await supabase.from('tarefas').delete().eq('id', id)
  }

  function openMenu(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setMenuPos({ x: rect.left - 160, y: rect.bottom + 4 })
    setMenuTask(id)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* Top bar */}
      <div className="flex flex-shrink-0 items-center gap-3 px-6 py-4"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.07)', background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(12px)' }}>
        <div>
          <h1 className="text-[17px] font-bold" style={{ color: '#111827' }}>Tarefas & Projetos</h1>
          <p className="text-[11px]" style={{ color: '#6b7280' }}>
            {stats.total} tarefa{stats.total !== 1 ? 's' : ''} · {stats.done} concluída{stats.done !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg px-3 py-1.5"
            style={{ background: '#f3f4f6', border: '1px solid #e5e7eb' }}>
            <Search size={13} style={{ color: '#9ca3af' }} />
            <input
              placeholder="Buscar tarefa…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-36 bg-transparent text-[12px] outline-none"
              style={{ color: '#111827' }}
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 16px rgba(99,102,241,0.3)' }}>
            <Plus size={14} strokeWidth={2} /> Nova Tarefa
          </button>
        </div>
      </div>

      {/* KPI strip + filtros */}
      <div className="flex flex-shrink-0 items-center gap-6 px-6 py-3"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.07)', background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(12px)' }}>
        {[
          { label: 'Total',     value: stats.total,   color: '#6366f1' },
          { label: 'Concluídas',value: stats.done,    color: '#10b981' },
          { label: 'Para hoje', value: stats.hoje,    color: '#f59e0b' },
          { label: 'Bloqueadas',value: stats.blocked, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="text-[20px] font-bold" style={{ color: s.color }}>{s.value}</span>
            <span className="text-[12px]" style={{ color: '#6b7280' }}>{s.label}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {STATUS_TABS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="rounded-full px-3 py-1 text-[12px] font-medium transition-all"
              style={{
                background: statusFilter === s ? '#6366f1' : '#f3f4f6',
                color: statusFilter === s ? '#fff' : '#374151',
                border: statusFilter === s ? '1px solid #6366f1' : '1px solid #e5e7eb',
              }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Table header */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid items-center px-6 py-2 text-[11px] font-semibold uppercase tracking-wider sticky top-0 z-10"
          style={{
            gridTemplateColumns: '32px 1fr 130px 90px 110px 130px 110px 40px',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid rgba(0,0,0,0.07)',
            color: '#9ca3af',
          }}>
          <div /><div>Tarefa</div><div>Status</div><div>Prioridade</div>
          <div>Prazo</div><div>Responsável</div><div>Projeto</div><div />
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-sm" style={{ color: '#9ca3af' }}>
            <Loader2 size={18} className="animate-spin" /> Carregando…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm" style={{ color: '#9ca3af' }}>
            <CheckCircle2 size={32} strokeWidth={1.2} />
            <p>Nenhuma tarefa encontrada.</p>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
              style={{ background: '#6366f1' }}>
              <Plus size={13} /> Nova Tarefa
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1 p-3">
            {filtered.map(task => {
              const scfg = STATUS_CONFIG[task.status]
              const pcfg = PRIORITY_CONFIG[task.prioridade]
              const Icon = scfg?.icon
              const done = task.status === 'concluida'
              const resp = task.responsavel
              const prazoDate = task.prazo ? new Date(task.prazo + 'T12:00:00') : null
              const prazoStr = prazoDate
                ? prazoDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
                : '—'
              const overdue = prazoDate && prazoDate < new Date() && !done

              return (
                <div key={task.id}
                  className="group grid items-center px-4 py-3 rounded-xl transition-all hover:shadow-sm"
                  style={{
                    gridTemplateColumns: '32px 1fr 130px 90px 110px 130px 110px 40px',
                    background: '#fff',
                    border: '1px solid #e5e5e5',
                    opacity: done ? 0.65 : 1,
                  }}>

                  {/* Toggle concluída */}
                  <button onClick={() => handleStatusChange(task.id, done ? 'pendente' : 'concluida')}
                    className="transition-all hover:scale-110 flex-shrink-0">
                    <Icon size={16} strokeWidth={1.8} style={{ color: scfg?.color }} />
                  </button>

                  {/* Título */}
                  <div className="flex items-center gap-2 pr-4 min-w-0">
                    {task.starred && <Star size={11} strokeWidth={2} fill="#fbbf24" style={{ color: '#fbbf24', flexShrink: 0 }} />}
                    <p className={`text-[13px] font-medium leading-snug truncate ${done ? 'line-through' : ''}`}
                      style={{ color: done ? '#aaa' : '#111' }}>
                      {task.titulo}
                    </p>
                    {task.projeto && (
                      <span className="rounded px-1.5 py-0.5 text-[10px] flex-shrink-0"
                        style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                        {task.projeto}
                      </span>
                    )}
                  </div>

                  {/* Status — clicável */}
                  <div className="relative">
                    <span className="w-fit rounded-md px-2 py-0.5 text-[11px] font-semibold cursor-pointer"
                      style={{ color: scfg?.color, background: scfg?.bg }}>
                      {scfg?.label}
                    </span>
                  </div>

                  {/* Prioridade */}
                  <div className="flex items-center gap-1">
                    <Flag size={11} strokeWidth={2} style={{ color: pcfg?.color }} />
                    <span className="text-[12px] font-medium" style={{ color: pcfg?.color }}>{pcfg?.label}</span>
                  </div>

                  {/* Prazo */}
                  <div className="flex items-center gap-1">
                    <Calendar size={11} style={{ color: overdue ? '#ef4444' : '#bbb' }} />
                    <span className="text-[12px]" style={{ color: overdue ? '#ef4444' : '#777', fontWeight: overdue ? 600 : 400 }}>
                      {prazoStr}
                    </span>
                  </div>

                  {/* Responsável */}
                  <div className="flex items-center gap-1.5">
                    {resp ? (
                      <>
                        <div className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white flex-shrink-0"
                          style={{ background: resp.cor || '#6366f1' }}>
                          {initials(resp.nome)}
                        </div>
                        <span className="text-[11px] truncate" style={{ color: '#888' }}>{resp.nome.split(' ')[0]}</span>
                      </>
                    ) : (
                      <span className="text-[11px]" style={{ color: '#ccc' }}>—</span>
                    )}
                  </div>

                  {/* Projeto */}
                  <span className="truncate text-[11px]" style={{ color: '#aaa' }}>{task.projeto || '—'}</span>

                  {/* Menu "..." */}
                  <button
                    onClick={e => openMenu(e, task.id)}
                    className="opacity-0 group-hover:opacity-100 transition-all flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100"
                    style={{ color: '#bbb' }}>
                    <MoreHorizontal size={15} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Context Menu ── */}
      {menuTask && (
        <div ref={menuRef}
          className="fixed z-[200] rounded-xl overflow-hidden py-1"
          style={{
            top: menuPos.y, left: menuPos.x, width: 200,
            background: 'rgba(12,10,35,0.98)',
            border: '0.5px solid rgba(255,255,255,0.14)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          }}>
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Mudar status
          </p>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <button key={key}
              onClick={() => handleStatusChange(menuTask, key)}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-[12px] transition-all hover:bg-white/[0.07]"
              style={{ color: cfg.color }}>
              <cfg.icon size={12} strokeWidth={1.8} />
              {cfg.label}
            </button>
          ))}
          <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)', margin: '4px 0' }} />
          <button
            onClick={() => handleStatusChange(menuTask, 'concluida')}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-[12px] transition-all hover:bg-white/[0.07]"
            style={{ color: '#34d399' }}>
            <Check size={12} strokeWidth={2} /> Resolver tarefa
          </button>
          <button
            onClick={() => handleDelete(menuTask)}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-[12px] transition-all hover:bg-red-500/10"
            style={{ color: '#ef4444' }}>
            <Trash2 size={12} strokeWidth={1.8} /> Apagar tarefa
          </button>
        </div>
      )}

      {/* ── Modal Nova Tarefa ── */}
      {showModal && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="fixed left-1/2 top-1/2 z-[110] w-full max-w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-2xl overflow-hidden"
            style={{ background: '#fff', boxShadow: '0 32px 80px rgba(0,0,0,0.35)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid #f0f0f0' }}>
              <h2 className="text-[16px] font-bold" style={{ color: '#111827' }}>Nova Tarefa</h2>
              <button onClick={() => setShowModal(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all">
                <X size={15} />
              </button>
            </div>

            <div className="flex flex-col gap-4 px-6 py-5">
              {/* Título */}
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold" style={{ color: '#374151' }}>Título *</label>
                <input
                  autoFocus
                  value={mTitulo}
                  onChange={e => setMTitulo(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder="Ex: Ligar para cliente Transportadora Neves"
                  className="w-full rounded-xl px-3.5 py-2.5 text-[13px] outline-none"
                  style={{ background: '#f8f9fa', border: '1.5px solid #e5e7eb', color: '#111827' }}
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold" style={{ color: '#374151' }}>Descrição</label>
                <textarea
                  value={mDesc}
                  onChange={e => setMDesc(e.target.value)}
                  placeholder="Detalhes da tarefa (opcional)…"
                  rows={2}
                  className="w-full resize-none rounded-xl px-3.5 py-2.5 text-[13px] outline-none"
                  style={{ background: '#f8f9fa', border: '1.5px solid #e5e7eb', color: '#111827' }}
                />
              </div>

              {/* Responsável + Prazo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold" style={{ color: '#374151' }}>Responsável</label>
                  <select
                    value={mResp}
                    onChange={e => setMResp(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
                    style={{ background: '#f8f9fa', border: '1.5px solid #e5e7eb', color: '#111827' }}>
                    <option value="">— Sem responsável —</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold" style={{ color: '#374151' }}>Data / Prazo</label>
                  <input
                    type="date"
                    value={mPrazo}
                    onChange={e => setMPrazo(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
                    style={{ background: '#f8f9fa', border: '1.5px solid #e5e7eb', color: '#111827' }}
                  />
                </div>
              </div>

              {/* Status + Prioridade + Projeto */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold" style={{ color: '#374151' }}>Status</label>
                  <select value={mStatus} onChange={e => setMStatus(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
                    style={{ background: '#f8f9fa', border: '1.5px solid #e5e7eb', color: '#111827' }}>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold" style={{ color: '#374151' }}>Prioridade</label>
                  <select value={mPrio} onChange={e => setMPrio(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
                    style={{ background: '#f8f9fa', border: '1.5px solid #e5e7eb', color: '#111827' }}>
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold" style={{ color: '#374151' }}>Projeto</label>
                  <input
                    value={mProjeto}
                    onChange={e => setMProjeto(e.target.value)}
                    placeholder="Ex: Comercial Q2"
                    className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
                    style={{ background: '#f8f9fa', border: '1.5px solid #e5e7eb', color: '#111827' }}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4"
              style={{ borderTop: '1px solid #f0f0f0' }}>
              <button onClick={() => setShowModal(false)}
                className="rounded-xl px-4 py-2 text-[13px] font-medium transition-all hover:bg-gray-100"
                style={{ color: '#6b7280' }}>
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={!mTitulo.trim() || saving}
                className="flex items-center gap-2 rounded-xl px-5 py-2 text-[13px] font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={2} />}
                {saving ? 'Salvando…' : 'Criar Tarefa'}
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
