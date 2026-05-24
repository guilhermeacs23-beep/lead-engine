'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Kanban, BarChart2,
  Map, Settings, Zap, ChevronRight, LogOut, CalendarDays, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const NAV_ITEMS = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'    },
  { href: '/leads',      icon: Users,           label: 'Leads'        },
  { href: '/pipeline',   icon: Kanban,          label: 'Pipeline'     },
  { href: '/relatorios', icon: BarChart2,       label: 'Relatórios'   },
  { href: '/mapa',       icon: Map,             label: 'Mapa'         },
  { href: '/calendario', icon: CalendarDays,    label: 'Calendário'   },
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
  const pathname  = usePathname()
  const [expanded, setExpanded] = useState(false)

  const w = expanded ? 'w-48' : 'w-14'

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const inner = (
    <aside
      className={cn(
        'relative z-10 flex h-full flex-col py-3 gap-1 flex-shrink-0 transition-all duration-200',
        // Mobile: always expanded when shown as overlay
        mobileOpen ? 'w-56' : w
      )}
      style={{
        background: 'rgba(12,10,30,0.98)',
        backdropFilter: 'blur(24px)',
        borderRight: '0.5px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Logo + toggle */}
      <div className={cn(
        'mb-2 flex items-center gap-2 px-3',
        (expanded || mobileOpen) ? 'justify-between' : 'flex-col'
      )}>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '8px' }}>
          <img src="/logo-engine.png" alt="Lead Engine" className="h-6 w-6 object-contain" />
        </div>
        {(expanded || mobileOpen) && (
          <span className="flex-1 truncate text-sm font-medium text-white/90">Lead Engine</span>
        )}
        {/* Desktop toggle / Mobile close */}
        {mobileOpen ? (
          <button onClick={onMobileClose}
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-white/50 hover:bg-white/10 hover:text-white/80 transition-all">
            <X size={14} strokeWidth={2} />
          </button>
        ) : (
          <button onClick={() => setExpanded(!expanded)}
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-white/50 hover:bg-white/10 hover:text-white/80 transition-all"
            title={expanded ? 'Recolher' : 'Expandir'}>
            <ChevronRight size={13} strokeWidth={2}
              className={cn('transition-transform duration-200', expanded && 'rotate-180')} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-0.5 px-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href}
              onClick={onMobileClose}
              title={(!expanded && !mobileOpen) ? label : undefined}
              className={cn(
                'relative flex items-center gap-2.5 rounded-lg px-2 py-2 transition-all duration-150',
                (expanded || mobileOpen) ? 'w-full' : 'w-10 justify-center',
                active
                  ? 'bg-indigo-500/25 text-indigo-300'
                  : 'text-white/65 hover:bg-white/[0.07] hover:text-white/90'
              )}>
              <Icon size={16} strokeWidth={1.5} className="flex-shrink-0" />
              {(expanded || mobileOpen) && <span className="truncate text-sm">{label}</span>}
            </Link>
          )
        })}
      </div>

      <div className={cn('my-1 mx-auto border-t border-white/10', (expanded || mobileOpen) ? 'w-full px-3' : 'w-6')} />

      {/* Bottom items */}
      <div className="flex flex-col gap-0.5 px-2">
        {BOTTOM_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}
            onClick={onMobileClose}
            title={(!expanded && !mobileOpen) ? label : undefined}
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-2 py-2 text-white/60 transition-all hover:bg-white/[0.07] hover:text-white/85',
              (expanded || mobileOpen) ? 'w-full' : 'w-10 justify-center'
            )}>
            <Icon size={16} strokeWidth={1.5} className="flex-shrink-0" />
            {(expanded || mobileOpen) && <span className="truncate text-sm">{label}</span>}
          </Link>
        ))}
      </div>

      {/* Avatar + logout */}
      <div className={cn(
        'mt-auto flex items-center gap-2 px-2',
        (expanded || mobileOpen) ? 'flex-row' : 'flex-col'
      )}>
        <div className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-full text-[11px] font-medium text-white"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
          title="Guilherme Campos">
          GC
        </div>
        {(expanded || mobileOpen) && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white/90">Guilherme</p>
            <p className="truncate text-[10px] text-white/55">Admin</p>
          </div>
        )}
        <button onClick={handleLogout} title="Sair"
          className={cn(
            'flex items-center justify-center rounded-lg text-white/50 transition-all hover:bg-red-500/15 hover:text-red-400',
            (expanded || mobileOpen) ? 'h-7 w-7 flex-shrink-0' : 'h-8 w-8'
          )}>
          <LogOut size={14} strokeWidth={1.8} />
        </button>
      </div>
    </aside>
  )

  return inner
}
