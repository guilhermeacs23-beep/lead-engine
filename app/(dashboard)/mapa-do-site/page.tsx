'use client'
import Link from 'next/link'
import {
  LayoutDashboard, Users, Kanban, BarChart2, Map, CalendarDays,
  Rss, CheckSquare, UsersRound, FolderOpen, Settings, Zap,
  ChevronRight, Activity, Globe, Bell, Search, FileText,
  Shield, User, Palette, Database, TrendingUp, Mail,
} from 'lucide-react'

const SITE_MAP = [
  {
    category: 'CRM & Vendas',
    color: '#6366f1',
    glow: 'rgba(99,102,241,0.25)',
    items: [
      { href: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard',    desc: 'Visão geral com KPIs e insights em tempo real' },
      { href: '/leads',      icon: Users,           label: 'Leads',        desc: 'Lista completa de leads com score IA e filtros' },
      { href: '/pipeline',   icon: Kanban,          label: 'Pipeline',     desc: 'Kanban, Lista, Calendário e Mapa do funil' },
      { href: '/relatorios', icon: BarChart2,       label: 'Relatórios',   desc: 'Gráficos de evolução, segmentos e fontes' },
    ]
  },
  {
    category: 'Geolocalização',
    color: '#10b981',
    glow: 'rgba(16,185,129,0.25)',
    items: [
      { href: '/mapa',      icon: Map,        label: 'Mapa Logístico', desc: 'Leads como bolhas coloridas por etapa do funil no mapa do Brasil' },
      { href: '/calendario',icon: CalendarDays,label: 'Calendário',    desc: 'Atividades agendadas com visão mensal e detalhes por dia' },
    ]
  },
  {
    category: 'Colaboração',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.25)',
    items: [
      { href: '/feed',       icon: Rss,         label: 'Feed',         desc: 'Timeline de atividades do time com curtidas e comentários' },
      { href: '/tarefas',    icon: CheckSquare, label: 'Tarefas',      desc: 'Gestão de tarefas com status, prioridade e projetos' },
      { href: '/grupos',     icon: UsersRound,  label: 'Grupos',       desc: 'Times e projetos com membros e progresso' },
      { href: '/documentos', icon: FolderOpen,  label: 'Documentos',   desc: 'Armazenamento de DOC, XLS, PPT e PDF por pasta' },
    ]
  },
  {
    category: 'Sistema',
    color: '#94a3b8',
    glow: 'rgba(148,163,184,0.20)',
    items: [
      { href: '/configuracoes',  icon: Settings,  label: 'Configurações', desc: 'Perfil, equipe, integrações e preferências do sistema' },
      { href: '/automacoes',     icon: Zap,       label: 'Automações',    desc: 'Regras automáticas para follow-up e notificações' },
      { href: '/mapa-do-site',   icon: Globe,     label: 'Mapa do Site',  desc: 'Esta página — navegação visual do sistema' },
    ]
  },
]

const QUICK_ACTIONS = [
  { icon: Bell,    label: 'Notificações',    color: '#fbbf24' },
  { icon: Search,  label: 'Busca Global',    color: '#60a5fa' },
  { icon: Activity,label: 'Status Sistema',  color: '#34d399' },
  { icon: Shield,  label: 'Segurança',       color: '#a78bfa' },
  { icon: Database,label: 'Banco de Dados',  color: '#f472b6' },
  { icon: Mail,    label: 'E-mail',          color: '#fb923c' },
]

export default function MapaDoSitePage() {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex-shrink-0 px-8 py-6 animate-fade-in"
        style={{ borderBottom: '1px solid var(--border-glass-sm)' }}>
        <div className="flex items-end gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Globe size={16} style={{ color: '#a78bfa' }} />
              <span className="section-label">Navegação completa</span>
            </div>
            <h1 className="text-[28px] font-bold tracking-tight"
              style={{ color: 'var(--text-primary)' }}>
              Mapa do Site
            </h1>
            <p className="mt-1 text-[14px]" style={{ color: 'var(--text-tertiary)' }}>
              Visão geral de todos os módulos e funcionalidades do Lead Engine
            </p>
          </div>
          {/* Stats */}
          <div className="ml-auto flex items-center gap-3">
            {[
              { value: '4', label: 'Categorias' },
              { value: '15', label: 'Módulos' },
              { value: '100%', label: 'Disponível' },
            ].map(s => (
              <div key={s.label} className="glass-card px-4 py-3 text-center" style={{ minWidth: 80 }}>
                <p className="text-[20px] font-bold" style={{ color: '#a78bfa' }}>{s.value}</p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 p-8">
        {/* Module grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {SITE_MAP.map((section, si) => (
            <div key={section.category} className="animate-fade-in"
              style={{ animationDelay: `${si * 60}ms` }}>
              {/* Section header */}
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-2 w-2 rounded-full"
                  style={{ background: section.color, boxShadow: `0 0 8px ${section.color}` }} />
                <h2 className="text-[14px] font-bold uppercase tracking-[0.08em]"
                  style={{ color: section.color }}>
                  {section.category}
                </h2>
                <div className="flex-1 h-px" style={{ background: `${section.color}25` }} />
              </div>

              {/* Items grid */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {section.items.map((item, ii) => (
                  <Link key={item.href} href={item.href}
                    className="group relative flex items-start gap-3 rounded-2xl p-4 transition-all duration-200"
                    style={{
                      background: 'var(--glass-sm)',
                      backdropFilter: 'var(--blur-md)',
                      WebkitBackdropFilter: 'var(--blur-md)',
                      border: '1px solid var(--border-glass-sm)',
                      boxShadow: 'var(--shadow-card), var(--inner-glow-sm)',
                      animationDelay: `${(si * 4 + ii) * 40}ms`,
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.background = section.glow
                      el.style.borderColor = `${section.color}40`
                      el.style.boxShadow = `0 8px 28px rgba(0,0,0,0.28), 0 0 0 1px ${section.color}30, inset 0 1px 0 rgba(255,255,255,0.18)`
                      el.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.background = 'var(--glass-sm)'
                      el.style.borderColor = 'var(--border-glass-sm)'
                      el.style.boxShadow = 'var(--shadow-card), var(--inner-glow-sm)'
                      el.style.transform = 'translateY(0)'
                    }}
                  >
                    {/* Icon */}
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-all"
                      style={{
                        background: `${section.color}20`,
                        border: `1px solid ${section.color}35`,
                      }}>
                      <item.icon size={17} strokeWidth={1.8} style={{ color: section.color }} />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[13.5px] font-semibold"
                          style={{ color: 'var(--text-primary)' }}>
                          {item.label}
                        </p>
                        <ChevronRight size={11} strokeWidth={2}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: section.color }} />
                      </div>
                      <p className="mt-0.5 text-[11.5px] leading-relaxed"
                        style={{ color: 'var(--text-tertiary)' }}>
                        {item.desc}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="mt-8 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-2 w-2 rounded-full" style={{ background: '#60a5fa', boxShadow: '0 0 8px #60a5fa' }} />
            <h2 className="text-[14px] font-bold uppercase tracking-[0.08em]" style={{ color: '#60a5fa' }}>
              Acesso Rápido
            </h2>
            <div className="flex-1 h-px" style={{ background: 'rgba(96,165,250,0.20)' }} />
          </div>
          <div className="flex flex-wrap gap-2.5">
            {QUICK_ACTIONS.map(a => (
              <button key={a.label}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 transition-all duration-200 hover:scale-105"
                style={{
                  background: 'var(--glass-sm)',
                  backdropFilter: 'var(--blur-md)',
                  WebkitBackdropFilter: 'var(--blur-md)',
                  border: '1px solid var(--border-glass-sm)',
                  boxShadow: 'var(--shadow-card), var(--inner-glow-sm)',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = `${a.color}18`
                  el.style.borderColor = `${a.color}40`
                  el.style.boxShadow = `0 0 18px ${a.color}25, var(--inner-glow-sm)`
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'var(--glass-sm)'
                  el.style.borderColor = 'var(--border-glass-sm)'
                  el.style.boxShadow = 'var(--shadow-card), var(--inner-glow-sm)'
                }}
              >
                <a.icon size={14} strokeWidth={1.8} style={{ color: a.color }} />
                <span className="text-[12.5px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {a.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-center gap-2 py-4 animate-fade-in"
          style={{ animationDelay: '400ms', borderTop: '1px solid var(--border-glass-sm)' }}>
          <div className="flex h-6 w-6 items-center justify-center rounded-lg overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.92)' }}>
            <img src="/logo-engine.png" alt="LE" className="h-4 w-4 object-contain" />
          </div>
          <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
            Lead Engine · Transportadora EBT · Todos os módulos disponíveis
          </p>
        </div>
      </div>
    </div>
  )
}
