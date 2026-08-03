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
    glow: 'rgba(99,102,241,0.08)',
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
    glow: 'rgba(16,185,129,0.08)',
    items: [
      { href: '/mapa',       icon: Map,         label: 'Mapa Logístico', desc: 'Leads como bolhas coloridas por etapa do funil no mapa do Brasil' },
      { href: '/calendario', icon: CalendarDays, label: 'Calendário',    desc: 'Atividades agendadas com visão mensal e detalhes por dia' },
    ]
  },
  {
    category: 'Colaboração',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.08)',
    items: [
      { href: '/feed',       icon: Rss,         label: 'Feed',         desc: 'Timeline de atividades do time com curtidas e comentários' },
      { href: '/tarefas',    icon: CheckSquare, label: 'Tarefas',      desc: 'Gestão de tarefas com status, prioridade e projetos' },
      { href: '/grupos',     icon: UsersRound,  label: 'Grupos',       desc: 'Times e projetos com membros e progresso' },
      { href: '/documentos', icon: FolderOpen,  label: 'Documentos',   desc: 'Armazenamento de DOC, XLS, PPT e PDF por pasta' },
    ]
  },
  {
    category: 'Sistema',
    color: '#64748b',
    glow: 'rgba(100,116,139,0.08)',
    items: [
      { href: '/configuracoes', icon: Settings, label: 'Configurações', desc: 'Perfil, equipe, integrações e preferências do sistema' },
      { href: '/automacoes',    icon: Zap,      label: 'Automações',    desc: 'Regras automáticas para follow-up e notificações' },
      { href: '/mapa-do-site',  icon: Globe,    label: 'Mapa do Site',  desc: 'Esta página — navegação visual do sistema' },
    ]
  },
]

const QUICK_ACTIONS = [
  { icon: Bell,     label: 'Notificações',   color: '#fbbf24' },
  { icon: Search,   label: 'Busca Global',   color: '#60a5fa' },
  { icon: Activity, label: 'Status Sistema', color: '#34d399' },
  { icon: Shield,   label: 'Segurança',      color: '#a78bfa' },
  { icon: Database, label: 'Banco de Dados', color: '#f472b6' },
  { icon: Mail,     label: 'E-mail',         color: '#fb923c' },
]

const CARD_BASE = {
  background: '#ffffff',
  border: '1px solid rgba(0,0,0,0.09)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  borderRadius: 16,
  padding: 16,
  transition: 'all 0.18s ease',
}

export default function MapaDoSitePage() {
  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.10)', padding: '24px 32px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Globe size={15} style={{ color: '#a78bfa' }} />
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.45)' }}>
                Navegação completa
              </span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
              Mapa do Site
            </h1>
            <p style={{ marginTop: 4, fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>
              Visão geral de todos os módulos e funcionalidades do Lead Engine
            </p>
          </div>

          {/* Stats */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
            {[
              { value: '4',    label: 'Categorias', color: '#6366f1' },
              { value: '15',   label: 'Módulos',    color: '#10b981' },
              { value: '100%', label: 'Disponível', color: '#f59e0b' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 12, padding: '12px 20px', textAlign: 'center', minWidth: 80,
              }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: 0, marginTop: 2 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: 32 }}>

        {/* Module grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 32 }}>
          {SITE_MAP.map(section => (
            <div key={section.category}>
              {/* Section header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: section.color, boxShadow: `0 0 8px ${section.color}`,
                  flexShrink: 0,
                }} />
                <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: section.color, margin: 0 }}>
                  {section.category}
                </h2>
                <div style={{ flex: 1, height: 1, background: `${section.color}30` }} />
              </div>

              {/* Items grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {section.items.map(item => (
                  <Link key={item.href} href={item.href}
                    className="group"
                    style={{ ...CARD_BASE, display: 'flex', alignItems: 'flex-start', gap: 12, textDecoration: 'none' }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.background = section.glow
                      el.style.borderColor = `${section.color}35`
                      el.style.boxShadow = `0 6px 20px rgba(0,0,0,0.10)`
                      el.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.background = '#ffffff'
                      el.style.borderColor = 'rgba(0,0,0,0.09)'
                      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'
                      el.style.transform = 'translateY(0)'
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `${section.color}15`, border: `1px solid ${section.color}30`,
                    }}>
                      <item.icon size={16} strokeWidth={1.8} style={{ color: section.color }} />
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>
                          {item.label}
                        </p>
                        <ChevronRight size={11} strokeWidth={2} style={{ color: section.color, opacity: 0 }} className="group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p style={{ marginTop: 3, fontSize: 11.5, lineHeight: 1.5, color: '#6b7280' }}>
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
        <div style={{ marginTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#60a5fa', boxShadow: '0 0 8px #60a5fa', flexShrink: 0 }} />
            <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#60a5fa', margin: 0 }}>
              Acesso Rápido
            </h2>
            <div style={{ flex: 1, height: 1, background: 'rgba(96,165,250,0.25)' }} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {QUICK_ACTIONS.map(a => (
              <button key={a.label}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 18px', borderRadius: 12,
                  background: '#ffffff', border: '1px solid rgba(0,0,0,0.09)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                  cursor: 'pointer', transition: 'all 0.18s ease',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = `${a.color}12`
                  el.style.borderColor = `${a.color}40`
                  el.style.boxShadow = `0 4px 14px ${a.color}20`
                  el.style.transform = 'scale(1.03)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = '#ffffff'
                  el.style.borderColor = 'rgba(0,0,0,0.09)'
                  el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)'
                  el.style.transform = 'scale(1)'
                }}
              >
                <a.icon size={14} strokeWidth={1.8} style={{ color: a.color }} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#374151' }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo-lp.png" alt="LE" style={{ width: 16, height: 16, objectFit: 'contain' }} />
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
            Lead Engine · Transportadora EBT · Todos os módulos disponíveis
          </p>
        </div>
      </div>
    </div>
  )
}
