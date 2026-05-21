'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Kanban, BarChart2,
  Map, Settings, Zap, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'           },
  { href: '/leads',      icon: Users,           label: 'Leads',   badge: 47  },
  { href: '/pipeline',   icon: Kanban,          label: 'Pipeline'            },
  { href: '/relatorios', icon: BarChart2,       label: 'Relatórios'          },
  { href: '/mapa',       icon: Map,             label: 'Mapa'                },
]

const BOTTOM_ITEMS = [
  { href: '/automacoes',    icon: Zap,      label: 'Automações'   },
  { href: '/configuracoes', icon: Settings, label: 'Configurações' },
]

export function Sidebar() {
  const pathname  = usePathname()
  const [expanded, setExpanded] = useState(false)

  const w = expanded ? 'w-48' : 'w-14'

  return (
    <aside
      className={cn(
        'relative z-10 flex flex-col py-3 gap-1 flex-shrink-0 transition-all duration-200',
        w
      )}
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(24px)',
        borderRight: '0.5px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Logo + toggle */}
      <div className={cn(
        'mb-2 flex items-center gap-2 px-3',
        expanded ? 'justify-between' : 'flex-col'
      )}>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.10)' }}>
          <img
            src="/logo-engine.png"
            alt="Lead Engine"
            className="h-6 w-6 object-contain"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>
        {expanded && (
          <span className="flex-1 truncate text-sm font-medium text-white/80">Lead Engine</span>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-white/30 transition-all hover:bg-white/10 hover:text-white/60"
          title={expanded ? 'Recolher menu' : 'Expandir menu'}
        >
          <ChevronRight
            size={13}
            strokeWidth={2}
            className={cn('transition-transform duration-200', expanded && 'rotate-180')}
          />
        </button>
      </div>

      {/* Nav items principais */}
      <div className="flex flex-col gap-0.5 px-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label, badge }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} title={!expanded ? label : undefined}
              className={cn(
                'relative flex items-center gap-2.5 rounded-lg px-2 py-2 transition-all duration-150',
                expanded ? 'w-full' : 'w-10 justify-center',
                active
                  ? 'bg-indigo-500/25 text-indigo-300'
                  : 'text-white/40 hover:bg-white/[0.07] hover:text-white/70'
              )}
            >
              <Icon size={16} strokeWidth={1.5} className="flex-shrink-0" />
              {expanded && (
                <span className="truncate text-sm">{label}</span>
              )}
              {badge && (
                <span className={cn(
                  'flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 text-[9px] font-medium text-white px-1',
                  !expanded && 'absolute -right-0.5 -top-0.5'
                )}>
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Divider */}
      <div className={cn('my-1 mx-auto border-t border-white/10', expanded ? 'w-full px-3' : 'w-6')} />

      {/* Bottom items */}
      <div className="flex flex-col gap-0.5 px-2">
        {BOTTOM_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} title={!expanded ? label : undefined}
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-2 py-2 text-white/35 transition-all hover:bg-white/[0.07] hover:text-white/60',
              expanded ? 'w-full' : 'w-10 justify-center'
            )}
          >
            <Icon size={16} strokeWidth={1.5} className="flex-shrink-0" />
            {expanded && <span className="truncate text-sm">{label}</span>}
          </Link>
        ))}
      </div>

      {/* Avatar no rodapé */}
      <div className={cn(
        'mt-auto flex items-center gap-2.5 px-3',
        expanded ? 'flex-row' : 'justify-center'
      )}>
        <div className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-full text-[11px] font-medium text-white"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
          title="Guilherme Campos">
          GC
        </div>
        {expanded && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white