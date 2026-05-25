'use client'
import { useState } from 'react'
import {
  Plus, Search, Filter, CheckCircle2, Circle, Clock, AlertCircle,
  ChevronDown, MoreHorizontal, Calendar, Tag, User, Kanban, List,
  TrendingUp, Zap, Star, Flag, Link2
} from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pendente:     { label: 'Pendente',      color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', icon: Circle       },
  andamento:    { label: 'Em andamento',  color: '#60a5fa', bg: 'rgba(96,165,250,0.15)',  icon: Clock        },
  concluida:    { label: 'Concluída',     color: '#34d399', bg: 'rgba(52,211,153,0.15)',  icon: CheckCircle2 },
  bloqueada:    { label: 'Bloqueada',     color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   icon: AlertCircle  },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  alta:   { label: 'Alta',   color: '#ef4444' },
  media:  { label: 'Média',  color: '#fbbf24' },
  baixa:  { label: 'Baixa',  color: '#34d399' },
}

const MOCK_TASKS = [
  { id: '1', titulo: 'Enviar proposta comercial para Transportadora Neves', status: 'andamento', prioridade: 'alta',  prazo: '26/05/2026', responsavel: 'GC', resp_color: '#6366f1', projeto: 'Comercial Q2', lead: 'Transportadora Neves', starred: true  },
  { id: '2', titulo: 'Agendar reunião de apresentação — Grupo Alfa',        status: 'pendente',  prioridade: 'alta',  prazo: '27/05/2026', responsavel: 'RA', resp_color: '#ec4899', projeto: 'Comercial Q2', lead: 'Grupo Alfa',          starred: false },
  { id: '3', titulo: 'Atualizar cadastro de clientes da região Sul',        status: 'pendente',  prioridade: 'media', prazo: '30/05/2026', responsavel: 'JC', resp_color: '#10b981', projeto: 'Operacional',  lead: null,                   starred: false },
  { id: '4', titulo: 'Preparar apresentação para feira LogisBrasil 2026',   status: 'andamento', prioridade: 'media', prazo: '10/06/2026', responsavel: 'GC', resp_color: '#6366f1', projeto: 'Marketing',    lead: null,                   starred: true  },
  { id: '5', titulo: 'Follow-up Vidro Santana — proposta em aberto',        status: 'concluida', prioridade: 'alta',  prazo: '22/05/2026', responsavel: 'RA', resp_color: '#ec4899', projeto: 'Comercial Q2', lead: 'Vidro Santana',        starred: false },
  { id: '6', titulo: 'Revisar contrato de prestação de serviços EBT',       status: 'bloqueada', prioridade: 'alta',  prazo: '20/05/2026', responsavel: 'GC', resp_color: '#6366f1', projeto: 'Jurídico',     lead: null,                   starred: false },
  { id: '7', titulo: 'Ligar para lista de leads frios — segmento vidraçaria', status: 'pendente', prioridade: 'baixa', prazo: '03/06/2026', responsavel: 'JC', resp_color: '#10b981', projeto: 'Prospecção',  lead: null,                   starred: false },
  { id: '8', titulo: 'Criar template de e-mail para follow-up automático',  status: 'andamento', prioridade: 'media', prazo: '28/05/2026', responsavel: 'GC', resp_color: '#6366f1', projeto: 'Marketing',    lead: null,                   starred: false },
  { id: '9', titulo: 'Exportar relatório Q1 e enviar para diretoria',       status: 'concluida', prioridade: 'alta',  prazo: '15/05/2026', responsavel: 'GC', resp_color: '#6366f1', projeto: 'Gestão',       lead: null,                   starred: false },
  { id: '10', titulo: 'Qualificar leads recebidos via indicação — maio',    status: 'pendente',  prioridade: 'media', prazo: '31/05/2026', responsavel: 'RA', resp_color: '#ec4899', projeto: 'Prospecção',   lead: null,                   starred: false },
]

const STATUS_TABS = ['Todas','Pendente','Em andamento','Concluída','Bloqueada']
const PROJETOS = ['Todos','Comercial Q2','Operacional','Marketing','Prospecção','Jurídico','Gestão']

export default function TarefasPage() {
  const [statusFilter, setStatusFilter] = useState('Todas')
  const [projetoFilter, setProjetoFilter] = useState('Todos')
  const [tasks, setTasks] = useState(MOCK_TASKS)
  const [viewMode, setViewMode] = useState<'lista'|'kanban'>('lista')
  const [showProjetoDrop, setShowProjetoDrop] = useState(false)

  const filtered = tasks.filter(t => {
    const sOk = statusFilter === 'Todas' ||
      STATUS_CONFIG[t.status]?.label === statusFilter
    const pOk = projetoFilter === 'Todos' || t.projeto === projetoFilter
    return sOk && pOk
  })

  function toggleStatus(id: string) {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      const next = t.status === 'concluida' ? 'pendente' : 'concluida'
      return { ...t, status: next }
    }))
  }

  const stats = {
    total:    tasks.length,
    done:     tasks.filter(t => t.status === 'concluida').length,
    today:    tasks.filter(t => t.prazo === '26/05/2026').length,
    blocked:  tasks.filter(t => t.status === 'bloqueada').length,
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex flex-shrink-0 items-center gap-3 px-6 py-4"
        style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
        <div>
          <h1 className="text-[17px] font-bold text-white">Tarefas & Projetos</h1>
          <p className="text-[11px] text-white/40">Minhas Tarefas · Todas as funções</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden" style={{ border: '0.5px solid rgba(255,255,255,0.12)' }}>
            {(['lista','kanban'] as const).map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium transition-all"
                style={{ background: viewMode === v ? 'rgba(99,102,241,0.2)' : 'transparent', color: viewMode === v ? '#a78bfa' : 'rgba(255,255,255,0.45)' }}>
                {v === 'lista' ? <List size={13} /> : <Kanban size={13} />}
                {v === 'lista' ? 'Lista' : 'Kanban'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-lg px-3 py-1.5"
            style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.10)' }}>
            <Search size={13} className="text-white/40" />
            <input placeholder="Buscar tarefa…" className="w-32 bg-transparent text-[12px] text-white/70 outline-none placeholder:text-white/30" />
          </div>
          <button className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[13px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 16px rgba(99,102,241,0.3)' }}>
            <Plus size={14} strokeWidth={2} /> Criar
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="flex flex-shrink-0 items-center gap-6 px-6 py-3"
        style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
        {[
          { label: 'Total', value: stats.total, color: '#94a3b8' },
          { label: 'Concluídas', value: stats.done, color: '#34d399' },
          { label: 'Para hoje', value: stats.today, color: '#fbbf24' },
          { label: 'Bloqueadas', value: stats.blocked, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="text-[20px] font-bold" style={{ color: s.color }}>{s.value}</span>
            <span className="text-[12px] text-white/45">{s.label}</span>
          </div>
        ))}

        <div className="ml-auto flex items-center gap-2">
          {/* Status filters */}
          {STATUS_TABS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="rounded-full px-3 py-1 text-[12px] font-medium transition-all"
              style={{
                background: statusFilter === s ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
                color: statusFilter === s ? '#a78bfa' : 'rgba(255,255,255,0.45)',
                border: statusFilter === s ? '0.5px solid rgba(99,102,241,0.4)' : '0.5px solid transparent',
              }}>{s}</button>
          ))}

          {/* Projeto filter */}
          <div className="relative">
            <button onClick={() => setShowProjetoDrop(!showProjetoDrop)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] text-white/50 transition-all hover:bg-white/[0.07]"
              style={{ border: '0.5px solid rgba(255,255,255,0.12)' }}>
              <Tag size={11} /> {projetoFilter} <ChevronDown size={11} />
            </button>
            {showProjetoDrop && (
              <div className="absolute right-0 top-full mt-1 z-50 min-w-[150px] rounded-xl overflow-hidden"
                style={{ background: 'rgba(12,10,35,0.98)', border: '0.5px solid rgba(255,255,255,0.14)', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
                {PROJETOS.map(p => (
                  <button key={p} onClick={() => { setProjetoFilter(p); setShowProjetoDrop(false) }}
                    className="flex w-full items-center px-3 py-2 text-[12px] text-white/65 hover:bg-white/[0.07] hover:text-white transition-all"
                    style={{ background: projetoFilter === p ? 'rgba(99,102,241,0.15)' : 'transparent' }}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="grid items-center px-6 py-2 text-[11px] font-semibold uppercase tracking-wider text-white/30 sticky top-0 z-10"
          style={{
            gridTemplateColumns: '32px 1fr 120px 90px 90px 110px 110px 40px',
            background: 'rgba(12,10,30,0.97)',
            borderBottom: '0.5px solid rgba(255,255,255,0.06)',
          }}>
          <div />
          <div>Tarefa</div>
          <div>Status</div>
          <div>Prioridade</div>
          <div>Prazo</div>
          <div>Responsável</div>
          <div>Projeto</div>
          <div />
        </div>

        <div className="flex flex-col">
          {filtered.map((task) => {
            const scfg = STATUS_CONFIG[task.status]
            const pcfg = PRIORITY_CONFIG[task.prioridade]
            const Icon = scfg?.icon
            const done = task.status === 'concluida'
            return (
              <div key={task.id}
                className="group grid items-center px-6 py-3 transition-all hover:bg-white/[0.04] cursor-pointer"
                style={{
                  gridTemplateColumns: '32px 1fr 120px 90px 90px 110px 110px 40px',
                  borderBottom: '0.5px solid rgba(255,255,255,0.05)',
                  opacity: done ? 0.7 : 1,
                }}>
                {/* Check */}
                <button onClick={() => toggleStatus(task.id)} className="transition-all hover:scale-110">
                  <Icon size={16} strokeWidth={1.8} style={{ color: scfg?.color }} />
                </button>

                {/* Title */}
                <div className="flex items-center gap-2 pr-4">
                  {task.starred && <Star size={11} strokeWidth={2} fill="#fbbf24" style={{ color: '#fbbf24', flexShrink: 0 }} />}
                  <p className={`text-[13px] font-medium text-white leading-snug ${done ? 'line-through text-white/40' : ''}`}>
                    {task.titulo}
                  </p>
                  {task.lead && (
                    <span className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px]"
                      style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', flexShrink: 0 }}>
                      <Link2 size={9} /> {task.lead}
                    </span>
                  )}
                </div>

                {/* Status */}
                <span className="w-fit rounded-md px-2 py-0.5 text-[11px] font-semibold"
                  style={{ color: scfg?.color, background: scfg?.bg }}>
                  {scfg?.label}
                </span>

                {/* Priority */}
                <div className="flex items-center gap-1">
                  <Flag size={11} strokeWidth={2} style={{ color: pcfg?.color }} />
                  <span className="text-[12px] font-medium" style={{ color: pcfg?.color }}>{pcfg?.label}</span>
                </div>

                {/* Prazo */}
                <div className="flex items-center gap-1">
                  <Calendar size={11} className="text-white/30" />
                  <span className="text-[12px] text-white/55">{task.prazo}</span>
                </div>

                {/* Responsável */}
                <div className="flex items-center gap-1.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{ background: task.resp_color }}>{task.responsavel}</div>
                  <span className="text-[11px] text-white/50">{task.responsavel === 'GC' ? 'Guilherme' : task.responsavel === 'RA' ? 'Rafael' : 'Julio'}</span>
                </div>

                {/* Projeto */}
                <span className="truncate text-[11px] text-white/40">{task.projeto}</span>

                {/* More */}
                <button className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-white/60 transition-all">
                  <MoreHorizontal size={15} />
                </button>
              </div>
            )
          })}
        </div>

        {/* Add task row */}
        <button className="flex w-full items-center gap-2 px-6 py-3 text-[13px] text-white/30 hover:text-white/60 hover:bg-white/[0.03] transition-all"
          style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
          <Plus size={14} strokeWidth={2} /> Adicionar tarefa
        </button>
      </div>
    </div>
  )
}
