'use client'
import { useState } from 'react'
import {
  Plus, Search, Users, Lock, Globe, Settings, MoreHorizontal,
  UserPlus, MessageSquare, CheckSquare, Calendar, ChevronRight, Star
} from 'lucide-react'

const MOCK_GRUPOS = [
  {
    id: '1', nome: 'Comercial SP', descricao: 'Time de vendas da região de São Paulo e Grande SP',
    privacidade: 'privado', membros: [
      { av: 'GC', c: '#6366f1', name: 'Guilherme' },
      { av: 'RA', c: '#ec4899', name: 'Rafael' },
      { av: 'JC', c: '#10b981', name: 'Julio' },
    ],
    criado: '13/03/2026', atualizado: 'hoje', tarefas: 12, tarefas_done: 8, projeto: true,
    tags: ['Vendas', 'SP'], cor: '#6366f1',
  },
  {
    id: '2', nome: 'Marketing & Conteúdo', descricao: 'Criação de conteúdo, campanhas e materiais de prospecção',
    privacidade: 'publico', membros: [
      { av: 'GC', c: '#6366f1', name: 'Guilherme' },
      { av: 'AP', c: '#f59e0b', name: 'Ana Paula' },
    ],
    criado: '01/04/2026', atualizado: 'ontem', tarefas: 7, tarefas_done: 3, projeto: false,
    tags: ['Marketing'], cor: '#ec4899',
  },
  {
    id: '3', nome: 'Operações & Logística', descricao: 'Suporte operacional, rotas e gestão de frotas EBT',
    privacidade: 'privado', membros: [
      { av: 'GC', c: '#6366f1', name: 'Guilherme' },
      { av: 'JC', c: '#10b981', name: 'Julio' },
    ],
    criado: '22/04/2026', atualizado: '18/05/2026', tarefas: 5, tarefas_done: 5, projeto: true,
    tags: ['Operações', 'Frotas'], cor: '#10b981',
  },
  {
    id: '4', nome: 'Expansão Região Sul', descricao: 'Projeto de expansão para PR, SC e RS — Q3 2026',
    privacidade: 'privado', membros: [
      { av: 'GC', c: '#6366f1', name: 'Guilherme' },
      { av: 'RA', c: '#ec4899', name: 'Rafael' },
    ],
    criado: '12/05/2026', atualizado: '24/05/2026', tarefas: 9, tarefas_done: 1, projeto: true,
    tags: ['Expansão', 'Sul'], cor: '#f59e0b',
  },
]

export default function GruposPage() {
  const [view, setView] = useState<'grid'|'lista'>('grid')
  const [selected, setSelected] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filtered = MOCK_GRUPOS.filter(g =>
    g.nome.toLowerCase().includes(search.toLowerCase()) ||
    g.descricao.toLowerCase().includes(search.toLowerCase())
  )

  const selectedGroup = MOCK_GRUPOS.find(g => g.id === selected)

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center gap-3 px-6 py-4"
          style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
          <h1 className="text-[17px] font-bold text-white">Grupos de Trabalho</h1>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg px-3 py-1.5"
              style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.10)' }}>
              <Search size={13} className="text-white/40" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar grupo…" className="w-32 bg-transparent text-[12px] text-white/70 outline-none placeholder:text-white/30" />
            </div>
            {/* View toggle */}
            <div className="flex rounded-lg overflow-hidden" style={{ border: '0.5px solid rgba(255,255,255,0.12)' }}>
              {(['grid','lista'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className="px-3 py-1.5 text-[12px] font-medium transition-all"
                  style={{ background: view === v ? 'rgba(99,102,241,0.2)' : 'transparent', color: view === v ? '#a78bfa' : 'rgba(255,255,255,0.45)' }}>
                  {v === 'grid' ? 'Grade' : 'Lista'}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[13px] font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 16px rgba(99,102,241,0.3)' }}>
              <Plus size={14} strokeWidth={2} /> Criar
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {view === 'grid' ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map(g => {
                const donePct = g.tarefas > 0 ? Math.round((g.tarefas_done / g.tarefas) * 100) : 0
                return (
                  <div key={g.id} onClick={() => setSelected(g.id === selected ? null : g.id)}
                    className="rounded-2xl p-5 cursor-pointer transition-all hover:ring-1"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: selected === g.id ? `1.5px solid ${g.cor}` : '0.5px solid rgba(255,255,255,0.10)',
                      boxShadow: selected === g.id ? `0 0 20px ${g.cor}25` : 'none',
                    }}>
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-[14px] font-bold text-white"
                        style={{ background: `${g.cor}30`, border: `1.5px solid ${g.cor}60`, color: g.cor }}>
                        {g.nome[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] font-bold text-white truncate">{g.nome}</p>
                          {g.projeto && <Star size={10} fill="#fbbf24" style={{ color: '#fbbf24', flexShrink: 0 }} />}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {g.privacidade === 'privado'
                            ? <Lock size={9} className="text-white/35" />
                            : <Globe size={9} className="text-white/35" />}
                          <span className="text-[10px] text-white/35">{g.privacidade}</span>
                        </div>
                      </div>
                      <button className="text-white/25 hover:text-white/60 transition-all flex-shrink-0">
                        <MoreHorizontal size={15} />
                      </button>
                    </div>

                    <p className="text-[12px] text-white/50 leading-relaxed mb-4 line-clamp-2">{g.descricao}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {g.tags.map(tag => (
                        <span key={tag} className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{ background: `${g.cor}20`, color: g.cor, border: `0.5px solid ${g.cor}40` }}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Progress */}
                    <div className="mb-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-[11px] text-white/40">Progresso das tarefas</span>
                        <span className="text-[11px] font-semibold" style={{ color: g.cor }}>{donePct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${donePct}%`, background: g.cor }} />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      {/* Avatars */}
                      <div className="flex -space-x-1.5">
                        {g.membros.map((m, i) => (
                          <div key={i} className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-[rgba(12,10,30,0.98)]"
                            style={{ background: m.c }} title={m.name}>
                            {m.av}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-white/40">
                        <span className="flex items-center gap-1"><CheckSquare size={10} /> {g.tarefas_done}/{g.tarefas}</span>
                        <span>{g.atualizado}</span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* New group card */}
              <button className="flex h-40 flex-col items-center justify-center gap-3 rounded-2xl text-white/30 hover:text-white/60 transition-all"
                style={{ border: '1.5px dashed rgba(255,255,255,0.15)' }}>
                <Plus size={24} strokeWidth={1.5} />
                <span className="text-[13px]">Novo grupo</span>
              </button>
            </div>
          ) : (
            /* Lista view */
            <div className="overflow-hidden rounded-xl" style={{ border: '0.5px solid rgba(255,255,255,0.10)' }}>
              <div className="grid px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-white/30"
                style={{ gridTemplateColumns: '40px 1fr 100px 80px 120px 150px 60px', background: 'rgba(255,255,255,0.06)', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
                <div />
                <div>Nome</div>
                <div>Criado em</div>
                <div>Privacidade</div>
                <div>Última atualização</div>
                <div>Membros</div>
                <div>Função</div>
              </div>
              {filtered.map(g => (
                <div key={g.id} onClick={() => setSelected(g.id === selected ? null : g.id)}
                  className="grid cursor-pointer items-center px-4 py-3 text-sm transition-all hover:bg-white/[0.04]"
                  style={{ gridTemplateColumns: '40px 1fr 100px 80px 120px 150px 60px', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                    style={{ background: `${g.cor}30`, color: g.cor }}>
                    {g.nome[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-[13px]">{g.nome}</p>
                    <p className="text-[11px] text-white/40 truncate max-w-[280px]">{g.descricao}</p>
                  </div>
                  <span className="text-[12px] text-white/50">{g.criado}</span>
                  <div className="flex items-center gap-1 text-[12px] text-white/50">
                    {g.privacidade === 'privado' ? <Lock size={10} /> : <Globe size={10} />}
                    {g.privacidade}
                  </div>
                  <span className="text-[12px] text-white/50">{g.atualizado}</span>
                  <div className="flex -space-x-1">
                    {g.membros.map((m, i) => (
                      <div key={i} title={m.name}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-[rgba(12,10,30,0.98)]"
                        style={{ background: m.c }}>{m.av}</div>
                    ))}
                  </div>
                  <span className="rounded-md px-2 py-0.5 text-[11px] font-semibold text-indigo-300"
                    style={{ background: 'rgba(99,102,241,0.15)' }}>Admin</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selectedGroup && (
        <div className="hidden xl:flex w-72 flex-shrink-0 flex-col overflow-hidden"
          style={{ borderLeft: '0.5px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="p-4" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-[16px] font-bold mb-3"
              style={{ background: `${selectedGroup.cor}30`, color: selectedGroup.cor, border: `1.5px solid ${selectedGroup.cor}50` }}>
              {selectedGroup.nome[0]}
            </div>
            <p className="text-[15px] font-bold text-white">{selectedGroup.nome}</p>
            <p className="text-[12px] text-white/50 mt-1 leading-relaxed">{selectedGroup.descricao}</p>
          </div>
          <div className="flex flex-col gap-4 p-4 overflow-y-auto">
            {/* Quick actions */}
            {[
              { icon: MessageSquare, label: 'Mensagens', c: '#60a5fa' },
              { icon: CheckSquare,   label: `${selectedGroup.tarefas_done}/${selectedGroup.tarefas} Tarefas`, c: '#34d399' },
              { icon: Users,         label: `${selectedGroup.membros.length} Membros`, c: '#a78bfa' },
              { icon: Calendar,      label: 'Calendário', c: '#fbbf24' },
            ].map(a => (
              <button key={a.label}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-white/70 hover:bg-white/[0.06] transition-all"
                style={{ border: '0.5px solid rgba(255,255,255,0.08)' }}>
                <a.icon size={15} style={{ color: a.c }} />
                {a.label}
                <ChevronRight size={12} className="ml-auto text-white/25" />
              </button>
            ))}
            {/* Members */}
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/35">Membros</p>
              {selectedGroup.membros.map((m, i) => (
                <div key={i} className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-white/[0.04] transition-all">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: m.c }}>{m.av}</div>
                  <p className="text-[12px] text-white/75 font-medium">{m.name}</p>
                  <span className="ml-auto text-[10px] text-white/35">Membro</span>
                </div>
              ))}
              <button className="flex items-center gap-2 mt-2 text-[12px] text-indigo-400 hover:text-indigo-300 transition-all">
                <UserPlus size={13} /> Convidar membro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
