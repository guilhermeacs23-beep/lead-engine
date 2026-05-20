'use client'
import React from 'react'
import { usePathname } from 'next/navigation'
import { Search, Globe, Plus } from 'lucide-react'
import { BgPanel } from '@/components/ui/bg-panel'
import { useUIStore } from '@/store/ui-store'

const PAGE_TITLES: Record<string, { title: string; action: string }> = {
  '/dashboard':            { title: 'Dashboard',        action: '+ Novo Lead'      },
  '/dashboard/leads':      { title: 'Gerador de Leads', action: 'Buscar Leads'     },
  '/dashboard/pipeline':   { title: 'Pipeline Kanban',  action: '+ Nova Oportunidade' },
  '/dashboard/relatorios': { title: 'Relatórios',       action: 'Exportar'         },
  '/dashboard/mapa':       { title: 'Mapa Logístico',   action: 'Filtrar Região'   },
}

const TABS = [
  { href: '/dashboard/leads',   label: 'Leads'    },
  { href: '/dashboard/pipeline',label: 'Pipeline' },
  { href: '/dashboard',         label: 'Análises' },
  { href: '/dashboard/mapa',    label: 'Mapa'     },
]

export function Topbar() {
  const pathname = usePathname()
  const { toggleBgPanel } = useUIStore()
  const page = PAGE_TITLES[pathname] ?? { title: 'Lead Engine', action: '+ Criar' }

  return (
    <div className="relative">
      <header
        className="flex h-[52px] items-center gap-2.5 px-5"
        style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: '0.5px solid rgba(255,255,255,0.10)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        <span className="mr-1 text-sm font-medium text-white/90">Lead Engine</span>

        {/* Tabs */}
        <nav className="flex items-center gap-0.5">
          {TABS.map(({ href, label }) => (
            <a key={href} href={href}
              className={`rounded-lg px-2.5 py-1.5 text-xs transition-all duration-150
                ${pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                  ? 'bg-white/10 font-medium text-white/95'
                  : 'text-white/45 hover:bg-white/[0.07] hover:text-white/75'}`}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Search */}
        <div className="mx-2 flex flex-1 items-center gap-2 rounded-lg px-3 py-1.5"
          style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.10)' }}>
          <Search size={13} className="text-white/35" strokeWidth={2} />
          <span className="text-xs text-white/30">Buscar leads, empresas, CNPJ...</span>
          <span className="ml-auto rounded px-1.5 py-0.5 text-[10px] text-white/25"
            style={{ border: '0.5px solid rgba(255,255,255,0.12)' }}>⌘K</span>
        </div>

        {/* Avatares */}
        <div className="flex items-center">
          {[
            { i: 'GC', g: '#6366f1,#8b5cf6' },
            { i: 'MR', g: '#ec4899,#f472b6' },
            { i: 'JS', g: '#10b981,#34d399' },
          ].map(({ i, g }, idx) => (
            <div key={i}
              className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-medium text-white"
              style={{
                background: `linear-gradient(135deg,${g})`,
                border: '1.5px solid rgba(255,255,255,0.15)',
                marginLeft: idx > 0 ? '-6px' : 0,
              }}>
              {i}
            </div>
          ))}
          <div className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] text-white/50 ml-[-6px]"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.15)' }}>
            +2
          </div>
        </div>

        {/* Fundo button */}
        <button onClick={toggleBgPanel}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-white/55 transition-all hover:bg-white/10 hover:text-white/80"
          style={{ border: '0.5px solid rgba(255,255,255,0.12)' }}>
          <Globe size={12} strokeWidth={1.5} />
          Fundo
        </button>

        {/* CTA */}
        <button className="btn-primary flex items-center gap-1.5 text-xs">
          <Plus size={13} strokeWidth={2} />
          {page.action}
        </button>
      </header>

      <BgPanel />
    </div>
  )
}
