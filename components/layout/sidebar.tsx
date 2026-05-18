'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Kanban, BarChart2,
  Map, Settings, Zap, LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard',         icon: LayoutDashboard, label: 'Dashboard'       },
  { href: '/dashboard/leads',   icon: Users,           label: 'Leads',  badge: 47 },
  { href: '/dashboard/pipeline',icon: Kanban,          label: 'Pipeline'        },
  { href: '/dashboard/relatorios', icon: BarChart2,    label: 'Relatórios'      },
  { href: '/dashboard/mapa',    icon: Map,             label: 'Mapa'            },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="relative z-10 flex w-14 flex-col items-center py-3 gap-1.5 flex-shrink-0"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(24px)',
        borderRight: '0.5px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Logo */}
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold text-white"
        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
        LE
      </div>

      {/* Nav items */}
      {NAV_ITEMS.map(({ href, icon: Icon, label, badge }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link key={href} href={href} title={label}
            className={cn(
              'relative flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-150',
              active
                ? 'bg-indigo-500/25 text-indigo-300'
                : 'text-white/40 hover:bg-white/[0.07] hover:text-white/70'
            )}
          >
            <Icon size={16} strokeWidth={1.5} />
            {badge && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center
                rounded-full bg-red-500 text-[9px] font-medium text-white">
                {badge}
              </span>
            )}
          </Link>
        )
      })}

      <div className="my-1 w-6 border-t border-white/10" />

      <Link href="/dashboard/automacoes" title="Automações"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-white/40
          hover:bg-white/[0.07] hover:text-white/70 transition-all duration-150">
        <Zap size={16} strokeWidth={1.5} />
      </Link>

      <Link href="/dashboard/configuracoes" title="Configurações"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-white/40
          hover:bg-white/[0.07] hover:text-white/70 transition-all duration-150">
        <Settings size={16} strokeWidth={1.5} />
      </Link>

      {/* Avatar do usuário */}
      <div className="mt-auto">
        <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[11px] font-medium text-white"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
          title="Guilherme Campos">
          GC
        </div>
      </div>
    </aside>
  )
}
