'use client'
import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Search, Globe, Plus, Bell, X, Clock, Sparkles, Menu, CalendarDays } from 'lucide-react'
import { BgPanel } from '@/components/ui/bg-panel'
import { SearchModal } from '@/components/ui/search-modal'
import { AddLeadModal } from '@/components/ui/add-lead-modal'
import { LeadDrawer } from '@/components/ui/lead-drawer'
import { fetchNotifications, type Notification } from '@/lib/supabase'
import { useUIStore } from '@/store/ui-store'

const TABS = [
  { href: '/leads',      label: 'Leads'      },
  { href: '/pipeline',   label: 'Pipeline'   },
  { href: '/dashboard',  label: 'Análises'   },
  { href: '/mapa',       label: 'Mapa'       },
  { href: '/calendario', label: 'Calendário' },
]

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  if (m < 1)  return 'agora'
  if (m < 60) return `${m}min atrás`
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

interface Props {
  onMobileMenuToggle?: () => void
}

export function Topbar({ onMobileMenuToggle }: Props) {
  const pathname = usePathname()
  const { toggleBgPanel } = useUIStore()

  const [searchOpen,   setSearchOpen]   = useState(false)
  const [addLeadOpen,  setAddLeadOpen]  = useState(false)
  const [selectedLead, setSelectedLead] = useState<any | null>(null)
  const [bellOpen,     setBellOpen]     = useState(false)
  const [notifs,       setNotifs]       = useState<Notification[]>([])
  const [notifTotal,   setNotifTotal]   = useState(0)
  const bellRef = useRef<HTMLDivElement>(null)

  // Cmd+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(o => !o) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Close bell on outside click
  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
    }
    if (bellOpen) document.addEventListener('mousedown', onOut)
    return () => document.removeEventListener('mousedown', onOut)
  }, [bellOpen])

  useEffect(() => {
    if (!bellOpen) return
    fetchNotifications().then(({ items, total }) => { setNotifs(items); setNotifTotal(total) })
  }, [bellOpen])

  useEffect(() => {
    fetchNotifications().then(({ total }) => setNotifTotal(total))
    const iv = setInterval(() => fetchNotifications().then(({ total }) => setNotifTotal(total)), 60_000)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="relative">
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)}
        onSelectLead={lead => { setSelectedLead(lead); setSearchOpen(false) }} />
      <AddLeadModal open={addLeadOpen} onClose={() => setAddLeadOpen(false)} onCreated={() => {}} />
      <LeadDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} />

      <header className="flex h-[52px] items-center gap-2 px-3 sm:px-5"
        style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: '0.5px solid rgba(255,255,255,0.10)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.04)',
        }}>

        {/* Hamburger — mobile only */}
        <button onClick={onMobileMenuToggle}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-all lg:hidden">
          <Menu size={17} strokeWidth={1.5} />
        </button>

        <span className="mr-1 hidden text-sm font-medium text-white/90 lg:block">Lead Engine</span>

        {/* Tabs — hidden on small screens */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {TABS.map(({ href, label }) => (
            <a key={href} href={href}
              className={`rounded-lg px-2.5 py-1.5 text-xs transition-all duration-150
                ${pathname === href || (href !== '/dashboard' && href !== '/' && pathname.startsWith(href))
                  ? 'bg-white/10 font-medium text-white'
                  : 'text-white/70 hover:bg-white/[0.07] hover:text-white/95'}`}>
              {label}
            </a>
          ))}
        </nav>

        {/* Search bar */}
        <button onClick={() => setSearchOpen(true)}
          className="mx-1 flex flex-1 items-center gap-2 rounded-lg px-3 py-1.5 text-left transition-all hover:bg-white/[0.09] sm:mx-2"
          style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.10)' }}>
          <Search size={13} className="text-white/55 shrink-0" strokeWidth={2} />
          <span className="flex-1 truncate text-xs text-white/50 hidden sm:block">Buscar leads, empresas, CNPJ...</span>
          <span className="text-xs text-white/50 sm:hidden">Buscar...</span>
          <span className="hidden rounded px-1.5 py-0.5 text-[10px] text-white/45 sm:block"
            style={{ border: '0.5px solid rgba(255,255,255,0.12)' }}>⌘K</span>
        </button>

        {/* Avatares — hidden on small screens */}
        <div className="hidden items-center sm:flex">
          {[
            { i: 'GC', g: '#6366f1,#8b5cf6' },
            { i: 'MR', g: '#ec4899,#f472b6' },
            { i: 'JS', g: '#10b981,#34d399' },
          ].map(({ i, g }, idx) => (
            <div key={i}
              className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-medium text-white"
              style={{ background: `linear-gradient(135deg,${g})`, border: '1.5px solid rgba(255,255,255,0.15)', marginLeft: idx > 0 ? '-6px' : 0 }}>
              {i}
            </div>
          ))}
          <div className="ml-[-6px] flex h-6 w-6 items-center justify-center rounded-full text-[9px] text-white/50"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.15)' }}>+2</div>
        </div>

        {/* Bell */}
        <div ref={bellRef} className="relative">
          <button onClick={() => setBellOpen(o => !o)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-all hover:bg-white/10 hover:text-white"
            style={{ border: bellOpen ? '0.5px solid rgba(99,102,241,0.4)' : '0.5px solid transparent' }}>
            <Bell size={15} strokeWidth={1.5} />
            {notifTotal > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {notifTotal > 9 ? '9+' : notifTotal}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-10 z-50 w-80 overflow-hidden rounded-xl"
              style={{ background: 'rgba(13,11,32,0.98)', border: '0.5px solid rgba(255,255,255,0.14)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', backdropFilter: 'blur(24px)' }}>
              <div className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
                <p className="text-[14px] font-semibold text-white">Notificações</p>
                <button onClick={() => setBellOpen(false)} className="text-white/30 hover:text-white/60 transition-all">
                  <X size={14} />
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifs.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <Bell size={24} className="text-white/15" strokeWidth={1} />
                    <p className="text-sm text-white/35">Tudo em dia!</p>
                    <p className="text-[12px] text-white/20">Novos leads e follow-ups aparecerão aqui</p>
                  </div>
                ) : (
                  <>
                    {notifs.filter(n => n.tipo === 'novo_lead').length > 0 && (
                      <div>
                        <p className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-white/25">Novos leads (24h)</p>
                        {notifs.filter(n => n.tipo === 'novo_lead').map(n => (
                          <div key={n.id} className="flex items-start gap-3 px-4 py-3 transition-all hover:bg-white/[0.04]"
                            style={{ borderBottom: '0.5px solid rgba(255,255,255,0.05)' }}>
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                              <Sparkles size={12} strokeWidth={1.5} className="text-white" />
                            </div>
                            <div className="flex flex-1 flex-col gap-0.5">
                              <p className="text-[13px] font-semibold text-white">{n.empresa}</p>
                              <p className="text-[11px] text-white/45">{n.descricao}</p>
                            </div>
                            <span className="shrink-0 text-[10px] text-white/25">{timeAgo(n.created_at)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {notifs.filter(n => n.tipo === 'follow_up').length > 0 && (
                      <div>
                        <p className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-white/25">Follow-ups atrasados</p>
                        {notifs.filter(n => n.tipo === 'follow_up').map(n => (
                          <div key={n.id} className="flex items-start gap-3 px-4 py-3 transition-all hover:bg-white/[0.04]"
                            style={{ borderBottom: '0.5px solid rgba(255,255,255,0.05)' }}>
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                              style={{ background: 'rgba(251,191,36,0.12)' }}>
                              <Clock size={12} strokeWidth={1.5} className="text-yellow-400" />
                            </div>
                            <div className="flex flex-1 flex-col gap-0.5">
                              <p className="text-[13px] font-semibold text-white">{n.empresa}</p>
                              <p className="text-[11px] text-white/45">{n.descricao}</p>
                            </div>
                            <span className="shrink-0 text-[10px] text-white/25">{timeAgo(n.created_at)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="px-4 py-2.5 text-[11px] text-white/25" style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
                Atualizado automaticamente a cada minuto
              </div>
            </div>
          )}
        </div>

        {/* Fundo — hidden on xs */}
        <button onClick={toggleBgPanel}
          className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-white/75 transition-all hover:bg-white/10 hover:text-white/95 sm:flex"
          style={{ border: '0.5px solid rgba(255,255,255,0.12)' }}>
          <Globe size={12} strokeWidth={1.5} />
          <span className="hidden md:block">Fundo</span>
        </button>

        {/* Novo Lead CTA */}
        <button onClick={() => setAddLeadOpen(true)}
          className="btn-primary flex shrink-0 items-center gap-1.5 text-xs">
          <Plus size={13} strokeWidth={2} />
          <span className="hidden sm:block">Novo Lead</span>
          <span className="sm:hidden">+</span>
        </button>
      </header>

      <BgPanel />
    </div>
  )
}
