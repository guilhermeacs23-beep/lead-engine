'use client'
import { useState } from 'react'
import { useUIStore } from '@/store/ui-store'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { bgTheme, bgImage } = useUIStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const bgStyle = bgImage
    ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden ${!bgImage ? bgTheme : ''}`}
      style={bgStyle}
    >
      {/* Noise overlay */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }} />

      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden lg:flex h-full relative z-10">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] lg:hidden"
            onClick={() => setMobileMenuOpen(false)} />
          {/* Sidebar panel */}
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <Sidebar mobileOpen onMobileClose={() => setMobileMenuOpen(false)} />
          </div>
        </>
      )}

      <div className="relative z-10 flex flex-1 flex-col min-w-0">
        <Topbar onMobileMenuToggle={() => setMobileMenuOpen(o => !o)} />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
