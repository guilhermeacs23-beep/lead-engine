'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { AddLeadModal } from '@/components/ui/add-lead-modal'
import { BackgroundProvider } from '@/components/providers/background-provider'
import { BackgroundGallery } from '@/components/ui/background-gallery'
import { useBackgroundStore } from '@/store/background-store'
import {
  Users, Kanban, LayoutDashboard, Settings, Plus,
} from 'lucide-react'

const BOTTOM_TABS = [
  { href: '/leads',         icon: Users,           label: 'Leads'    },
  { href: '/pipeline',      icon: Kanban,          label: 'Pipeline' },
  { href: '/dashboard',     icon: LayoutDashboard, label: 'Análises' },
  { href: '/configuracoes', icon: Settings,        label: 'Config'   },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const { galleryOpen, setGalleryOpen } = useBackgroundStore()
  const [addLeadOpen, setAddLeadOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-screen overflow-hidden">

      {/* ── Ambient Background Layer (z-0, fixed) ── */}
      <BackgroundProvider />

      {/* ── Noise grain overlay ─────────────────── */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Desktop sidebar ─────────────────────── */}
      <div className="hidden lg:flex h-full relative z-10 flex-shrink-0">
        <Sidebar />
      </div>

      {/* ── Main content area ───────────────────── */}
      <div className="relative z-10 flex flex-1 flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto pb-16 lg:pb-0">
            {children}
          </div>
        </main>
      </div>

      {/* ── Mobile bottom navigation ────────────── */}
      <nav
        className="fixed bottom-0 inset-x-0 z-30 flex h-16 items-center lg:hidden"
        style={{
          background: 'rgba(10,8,28,0.97)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderTop: '0.5px solid rgba(255,255,255,0.10)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
        }}
      >
        {/* Left 2 tabs */}
        {BOTTOM_TABS.slice(0, 2).map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <a key={href} href={href} className="flex flex-1 flex-col items-center gap-1 py-2 transition-all">
              <Icon
                size={20}
                strokeWidth={active ? 2 : 1.5}
                style={{ color: active ? '#818cf8' : 'rgba(255,255,255,0.40)' }}
              />
              <span
                className="text-[10px] font-medium"
                style={{ color: active ? '#818cf8' : 'rgba(255,255,255,0.35)' }}
              >
                {label}
              </span>
            </a>
          )
        })}

        {/* Center ADD button */}
        <div className="flex flex-1 items-center justify-center">
          <button
            onClick={() => setAddLeadOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              boxShadow: '0 0 24px rgba(99,102,241,0.5)',
            }}
          >
            <Plus size={22} strokeWidth={2} className="text-white" />
          </button>
        </div>

        {/* Right 2 tabs */}
        {BOTTOM_TABS.slice(2).map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <a key={href} href={href} className="flex flex-1 flex-col items-center gap-1 py-2 transition-all">
              <Icon
                size={20}
                strokeWidth={active ? 2 : 1.5}
                style={{ color: active ? '#818cf8' : 'rgba(255,255,255,0.40)' }}
              />
              <span
                className="text-[10px] font-medium"
                style={{ color: active ? '#818cf8' : 'rgba(255,255,255,0.35)' }}
              >
                {label}
              </span>
            </a>
          )
        })}
      </nav>

      {/* Background Gallery — rendered at root so position:fixed is not broken by backdrop-filter */}
      <BackgroundGallery open={galleryOpen} onClose={() => setGalleryOpen(false)} />

      <AddLeadModal open={addLeadOpen} onClose={() => setAddLeadOpen(false)} onCreated={() => {}} />
    </div>
  )
}
