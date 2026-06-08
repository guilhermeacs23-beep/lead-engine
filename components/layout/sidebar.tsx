'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Kanban, BarChart2,
  Map, Navigation, Settings, Zap, ChevronRight, LogOut, CalendarDays, X,
  Rss, CheckSquare, UsersRound, FolderOpen, ChevronDown, RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const NAV_ITEMS = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'    },
  { href: '/leads',      icon: Users,           label: 'Leads'        },
  { href: '/recap',      icon: RefreshCw,       label: 'Recap Clientes' },
  { href: '/pipeline',   icon: Kanban,          label: 'Pipeline'     },
  { href: '/relatorios', icon: BarChart2,       label: 'Relatórios'   },
  { href: '/mapa',       icon: Map,             label: 'Mapa'         },
  { href: '/campo',      icon: Navigation,      label: 'App de Campo' },
  { href: '/calendario', icon: CalendarDays,    label: 'Calendário'   },
]

const COLAB_ITEMS = [
  { href: '/feed',       icon: Rss,         label: 'Feed'       },
  { href: '/tarefas',    icon: CheckSquare, label: 'Tarefas'    },
  { href: '/grupos',     icon: UsersRound,  label: 'Grupos'     },
  { href: '/documentos', icon: FolderOpen,  label: 'Documentos' },
]

const BOTTOM_ITEMS = [
  { href: '/automacoes',    icon: Zap,      label: 'Automações'   },
  { href: '/configuracoes', icon: Settings, label: 'Configurações' },
]

interface Props {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ mobileOpen = false, onMobileClose }: Props) {
  const pathname   = usePathname()
  const [expanded,  setExpanded]  = useState(false)
  const [colabOpen, setColabOpen] = useState(true)

  const isExpanded = expanded || mobileOpen

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  function NavLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
    const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
    return (
      <Link href={href} onClick={onMobileClose}
        title={!isExpanded ? label : undefined}
        className={cn(
          'nav-item',
          isExpanded ? 'w-full' : 'w-10 justify-center',
          active && 'nav-item-active'
        )}
      >
        <Icon
          size={16} strokeWidth={active ? 2 : 1.6}
          style={{ flexShrink: 0, opacity: active ? 1 : 0.72 }}
        />
        {isExpanded && (
          <span className="truncate text-[13.5px]" style={{ color: active ? '#ffffff' : 'rgba(255,255,255,0.75)' }}>
            {label}
          </span>
        )}
        {/* Active pill glow line */}
        {active && isExpanded && (
          <div className="ml-auto h-1.5 w-1.5 rounded-full"
            style={{ background: '#ffffff', boxShadow: '0 0 6px rgba(255,255,255,0.7)' }} />
        )}
      </Link>
    )
  }

  return (
    <aside
      className={cn(
        'relative z-10 flex h-full flex-col py-3 gap-0.5 flex-shrink-0',
        'transition-all duration-300',
        'glass-sidebar',
        mobileOpen ? 'w-56' : isExpanded ? 'w-48' : 'w-[58px]'
      )}
    >
      {/* ── Logo + toggle ── */}
      <div className={cn(
        'mb-3 flex items-center gap-2 px-3',
        isExpanded ? 'justify-between' : 'flex-col'
      )}>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.96)',
            boxShadow: '0 2px 12px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,1)',
          }}>
          <img src="/logo-engine.png" alt="Lead Engine" className="h-6 w-6 object-contain" />
        </div>
        {isExpanded && (
          <span className="flex-1 truncate text-[13px] font-semibold"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Lead Engine
          </span>
        )}
        {mobileOpen ? (
          <button onClick={onMobileClose}
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg transition-all hover:bg-white/10"
            style={{ color: 'var(--text-tertiary)' }}>
            <X size={14} strokeWidth={2} />
          </button>
        ) : (
          <button onClick={() => setExpanded(!expanded)}
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg transition-all hover:bg-white/10"
            style={{ color: 'var(--text-tertiary)' }}
            title={expanded ? 'Recolher' : 'Expandir'}>
            <ChevronRight size={13} strokeWidth={2}
              className={cn('transition-transform duration-300', expanded && 'rotate-180')} />
          </button>
        )}
      </div>

      {/* ── Main nav ── */}
      <div className="flex flex-col gap-0.5 px-2">
        {NAV_ITEMS.map(item => <NavLink key={item.href} {...item} />)}
      </div>

      {/* ── Divider ── */}
      <div className="mx-3 my-2" style={{ height: 1, background: 'var(--border-glass-sm)' }} />

      {/* ── Colaboração ── */}
      <div className="flex flex-col gap-0.5 px-2">
        {isExpanded ? (
          <button
            onClick={() => setColabOpen(!colabOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg w-full transition-all hover:bg-white/[0.06]"
          >
            <span className="section-label flex-1 text-left">Colaboração</span>
            <ChevronDown size={10}
              style={{ color: 'var(--text-muted)' }}
              className={cn('transition-transform duration-200', !colabOpen && '-rotate-90')} />
          </button>
        ) : (
          <div className="mx-auto my-1" style={{ width: 20, height: 1, background: 'var(--border-glass-sm)' }} />
        )}

        {(colabOpen || !isExpanded) && COLAB_ITEMS.map(item => <NavLink key={item.href} {...item} />)}
      </div>

      {/* ── Divider ── */}
      <div className="mx-3 my-2" style={{ height: 1, background: 'var(--border-glass-sm)' }} />

      {/* ── Bottom items ── */}
      <div className="flex flex-col gap-0.5 px-2">
        {BOTTOM_ITEMS.map(item => <NavLink key={item.href} {...item} />)}
      </div>

      {/* ── Avatar + logout ── */}
      <div className={cn(
        'mt-auto flex items-center gap-2 px-2.5 pt-2',
        isExpanded ? 'flex-row' : 'flex-col'
      )}>
        <div
          className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-full text-[11px] font-bold text-white"
          style={{
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            boxShadow: '0 0 14px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.25)',
          }}
          title="Guilherme Campos"
        >GC</div>
        {isExpanded && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              Guilherme
            </p>
            <p className="truncate text-[10px]" style={{ color: 'var(--text-muted)' }}>Admin</p>
          </div>
        )}
        <button onClick={handleLogout} title="Sair"
          className={cn(
            'flex items-center justify-center rounded-lg transition-all hover:bg-red-500/15',
            isExpanded ? 'h-7 w-7 flex-shrink-0' : 'h-8 w-8'
          )}
          style={{ color: 'var(--text-tertiary)' }}>
          <LogOut size={14} strokeWidth={1.8} />
        </button>
      </div>
    </aside>
  )
}

