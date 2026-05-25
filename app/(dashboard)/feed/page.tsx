'use client'
import { useState } from 'react'
import {
  Users, Plus, TrendingUp, CheckCircle2, MessageSquare,
  FileText, UserPlus, Star, Bell, Filter, Search, Heart, Share2, MoreHorizontal
} from 'lucide-react'

const FEED_ITEMS = [
  {
    id: '1', type: 'lead_novo', user: 'Guilherme Campos', avatar: 'GC', avatarColor: '#6366f1',
    time: 'há 5 min',
    content: 'Adicionou um novo lead',
    highlight: 'Transportadora Neves Ltda',
    sub: 'Score IA: 87 · Segmento: Carga Pesada · São Paulo, SP',
    actions: { likes: 2, comments: 0 },
  },
  {
    id: '2', type: 'pipeline_move', user: 'Rafael Arrecife', avatar: 'RA', avatarColor: '#ec4899',
    time: 'há 23 min',
    content: 'Moveu negócio para etapa',
    highlight: 'Proposta → Negociando',
    sub: 'Cliente: Logística Total S.A · Valor: R$ 12.500/mês',
    actions: { likes: 3, comments: 1 },
  },
  {
    id: '3', type: 'task_done', user: 'Julio Campos', avatar: 'JC', avatarColor: '#10b981',
    time: 'há 1 hora',
    content: 'Concluiu a tarefa',
    highlight: 'Enviar proposta comercial para Vidro Santana',
    sub: 'Projeto: Comercial Q2 · Prioridade: Alta',
    actions: { likes: 5, comments: 2 },
  },
  {
    id: '4', type: 'doc', user: 'Guilherme Campos', avatar: 'GC', avatarColor: '#6366f1',
    time: 'há 2 horas',
    content: 'Criou documento',
    highlight: 'Proposta Comercial — Template 2025.docx',
    sub: 'Pasta: Documentos · Tamanho: 245 KB',
    actions: { likes: 1, comments: 0 },
  },
  {
    id: '5', type: 'member', user: 'Sistema', avatar: 'LE', avatarColor: '#f59e0b',
    time: 'há 3 horas',
    content: 'Novo membro adicionado ao grupo',
    highlight: 'Ana Paula Silva — Grupo: Comercial SP',
    sub: 'Função: Vendedora · Nível de acesso: Membro',
    actions: { likes: 0, comments: 0 },
  },
  {
    id: '6', type: 'lead_novo', user: 'Rafael Arrecife', avatar: 'RA', avatarColor: '#ec4899',
    time: 'ontem',
    content: 'Adicionou um novo lead',
    highlight: 'Distribuidora Paulista de Vidros',
    sub: 'Score IA: 74 · Segmento: Vidraçaria · Campinas, SP',
    actions: { likes: 1, comments: 3 },
  },
  {
    id: '7', type: 'pipeline_move', user: 'Julio Campos', avatar: 'JC', avatarColor: '#10b981',
    time: 'ontem',
    content: 'Fechou negócio',
    highlight: 'Grupo Alfa Transportes — R$ 8.200/mês',
    sub: 'Parabéns! Negócio fechado após 14 dias no funil.',
    actions: { likes: 12, comments: 4 },
    highlight_color: '#34d399',
  },
  {
    id: '8', type: 'task_done', user: 'Guilherme Campos', avatar: 'GC', avatarColor: '#6366f1',
    time: 'há 2 dias',
    content: 'Criou projeto',
    highlight: 'Expansão Região Sul — Q3 2026',
    sub: '5 tarefas criadas · Prazo: 30/08/2026',
    actions: { likes: 3, comments: 1 },
  },
]

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  lead_novo:      { icon: UserPlus,      color: '#818cf8', bg: 'rgba(129,140,248,0.15)' },
  pipeline_move:  { icon: TrendingUp,    color: '#fbbf24', bg: 'rgba(251,191,36,0.15)'  },
  task_done:      { icon: CheckCircle2,  color: '#34d399', bg: 'rgba(52,211,153,0.15)'  },
  doc:            { icon: FileText,      color: '#60a5fa', bg: 'rgba(96,165,250,0.15)'  },
  member:         { icon: Users,         color: '#f472b6', bg: 'rgba(244,114,182,0.15)' },
}

const FILTERS = ['Todos','Leads','Pipeline','Tarefas','Documentos','Membros']

export default function FeedPage() {
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set())

  const filtered = FEED_ITEMS.filter(item => {
    if (activeFilter === 'Todos') return true
    if (activeFilter === 'Leads') return item.type === 'lead_novo'
    if (activeFilter === 'Pipeline') return item.type === 'pipeline_move'
    if (activeFilter === 'Tarefas') return item.type === 'task_done'
    if (activeFilter === 'Documentos') return item.type === 'doc'
    if (activeFilter === 'Membros') return item.type === 'member'
    return true
  })

  function toggleLike(id: string) {
    setLikedItems(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main feed */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center gap-3 px-6 py-4"
          style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
          <h1 className="text-[17px] font-bold text-white">Feed</h1>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg px-3 py-1.5"
              style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.10)' }}>
              <Search size={13} className="text-white/40" />
              <input placeholder="Buscar no feed…" className="w-32 bg-transparent text-[12px] text-white/70 outline-none placeholder:text-white/30" />
            </div>
            <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <Plus size={13} strokeWidth={2} /> Nova publicação
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-shrink-0 items-center gap-2 px-6 py-3"
          style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
          <Filter size={13} className="text-white/35" />
          {FILTERS.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className="rounded-full px-3 py-1 text-[12px] font-medium transition-all"
              style={{
                background: activeFilter === f ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
                color: activeFilter === f ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                border: activeFilter === f ? '0.5px solid rgba(99,102,241,0.4)' : '0.5px solid transparent',
              }}>
              {f}
            </button>
          ))}
        </div>

        {/* Feed items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
          {filtered.map((item) => {
            const cfg = TYPE_CONFIG[item.type]
            const Icon = cfg?.icon
            const liked = likedItems.has(item.id)
            return (
              <div key={item.id} className="rounded-2xl p-4 transition-all hover:ring-1 hover:ring-white/10"
                style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
                <div className="flex gap-3">
                  {/* Avatar */}
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: item.avatarColor }}>
                    {item.avatar}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Top row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-semibold text-white">{item.user}</span>
                      <span className="text-[12px] text-white/45">{item.content}</span>
                      {/* Type badge */}
                      <div className="flex items-center gap-1 rounded-md px-1.5 py-0.5"
                        style={{ background: cfg?.bg, color: cfg?.color }}>
                        {Icon && <Icon size={9} strokeWidth={2} />}
                        <span className="text-[10px] font-semibold uppercase tracking-wide">{item.type.replace('_',' ')}</span>
                      </div>
                      <span className="ml-auto text-[11px] text-white/30 flex-shrink-0">{item.time}</span>
                    </div>

                    {/* Highlight */}
                    <p className="mt-1.5 text-[14px] font-semibold"
                      style={{ color: item.highlight_color ?? '#fff' }}>
                      {item.highlight}
                    </p>
                    <p className="mt-0.5 text-[12px] text-white/50">{item.sub}</p>

                    {/* Actions */}
                    <div className="mt-3 flex items-center gap-4 pt-2"
                      style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
                      <button onClick={() => toggleLike(item.id)}
                        className="flex items-center gap-1.5 text-[12px] transition-all"
                        style={{ color: liked ? '#f472b6' : 'rgba(255,255,255,0.35)' }}>
                        <Heart size={13} strokeWidth={2} fill={liked ? '#f472b6' : 'none'} />
                        {item.actions.likes + (liked ? 1 : 0)}
                      </button>
                      <button className="flex items-center gap-1.5 text-[12px] text-white/35 hover:text-white/60 transition-all">
                        <MessageSquare size={13} strokeWidth={2} />
                        {item.actions.comments}
                      </button>
                      <button className="flex items-center gap-1.5 text-[12px] text-white/35 hover:text-white/60 transition-all">
                        <Share2 size={13} strokeWidth={2} /> Compartilhar
                      </button>
                      <button className="ml-auto text-white/25 hover:text-white/50 transition-all">
                        <MoreHorizontal size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right sidebar */}
      <div className="hidden xl:flex w-64 flex-shrink-0 flex-col gap-4 overflow-y-auto p-4"
        style={{ borderLeft: '0.5px solid rgba(255,255,255,0.08)' }}>
        {/* Online team */}
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">Time online</p>
          {[
            { name: 'Guilherme Campos', role: 'Admin', av: 'GC', c: '#6366f1', online: true },
            { name: 'Rafael Arrecife',  role: 'Vendas', av: 'RA', c: '#ec4899', online: true },
            { name: 'Julio Campos',     role: 'Vendas', av: 'JC', c: '#10b981', online: false },
            { name: 'Ana Paula Silva',  role: 'Comercial', av: 'AP', c: '#f59e0b', online: false },
          ].map(m => (
            <div key={m.name} className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-white/[0.04] transition-all">
              <div className="relative">
                <div className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: m.c }}>{m.av}</div>
                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[rgba(12,10,30,0.98)]"
                  style={{ background: m.online ? '#34d399' : '#475569' }} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-white/80">{m.name}</p>
                <p className="text-[10px] text-white/40">{m.role}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)' }} className="pt-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">Notificações</p>
          {[
            { text: '2 leads aguardando follow-up', color: '#fbbf24' },
            { text: '1 proposta vencem hoje', color: '#f472b6' },
            { text: 'Reunião com Vidro Santana amanhã 09h', color: '#60a5fa' },
          ].map((n, i) => (
            <div key={i} className="mb-2 flex items-start gap-2 rounded-lg p-2.5"
              style={{ background: `${n.color}12`, border: `0.5px solid ${n.color}30` }}>
              <Bell size={11} style={{ color: n.color, flexShrink: 0, marginTop: 1 }} />
              <p className="text-[11px] leading-snug text-white/70">{n.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
