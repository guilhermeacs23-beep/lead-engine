'use client'
import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Search, Globe, Plus, Bell, X, Clock, Sparkles } from 'lucide-react'
import { BackgroundGallery } from '@/components/ui/background-gallery'
import { SearchModal } from '@/components/ui/search-modal'
import { AddLeadModal } from '@/components/ui/add-lead-modal'
import { LeadDrawer } from '@/components/ui/lead-drawer'
import { fetchNotifications, type Notification } from '@/lib/supabase'

const TABS = [
  { href: '/leads',      label: 'Leads'      },
  { href: '/pipeline',   label: 'Pipeline'   },
  { href: '/dashboard',  label: 'Análises'   },
  { href: '/mapa',       label: 'Mapa'       },
  { href: '/calendario', label: 'Calendário' },
]

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  if (m < 1)  return 'agora'
  if (m < 60) return `${m}min atrás`
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

export function Topbar() {
  const pathname = usePathname()

  const [searchOpen,    setSearchOpen]    = useState(false)
  const [addLeadOpen,   setAddLeadOpen]   = useState(false)
  const [bgGalleryOpen, setBgGalleryOpen] = useState(false)
  const [selectedLead,  setSelectedLead]  = useState<any | null>(null)
  const [bellOpen,      setBellOpen]      = useState(false)
  const [notifs,        setNotifs]        = useState<Notification[]>([])
  const [notifTotal,    setNotifTotal]    = useState(0)
  const bellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(o => !o) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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
      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectLead={lead => { setSelectedLead(lead); setSearchOpen(false) }}
      />
      <AddLeadModal open={addLeadOpen} onClose={() => setAddLeadOpen(false)} onCreated={() => {}} />
      <LeadDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} />

      {/* Background Gallery Modal */}
      <BackgroundGallery open={bgGalleryOpen} onClose={() => setBgGalleryOpen(false)} />

      <header className="glass-topbar flex h-[52px] items-center gap-2 px-3 sm:px-5">

        {/* Brand — desktop only */}
        <span className="mr-1 hidden text-sm font-medium text-white/90 lg:block">Lead Engine</span>

        {/* Tabs — desktop only */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {TABS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className={`rounded-lg px-2.5 py-1.5 text-xs transition-all
                ${pathname === href || (href !== '/dashboard' && href !== '/' && pathname.startsWith(href))
                  ? 'bg-white/10 font-medium text-white'
                  : 'text-white/70 hover:bg-white/[0.07] hover:text-white/95'}`}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Mobile: current page title */}
        <span className="text-sm font-semibold text-white lg:hidden">
          {TABS.find(t => pathname.startsWith(t.href))?.label ?? 'Lead Engine'}
        </span>

        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="mx-2 flex flex-1 items-center gap-2 rounded-xl px-3 py-2 text-left transition-all hover:bg-white/[0.09]"
          style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.10)' }}
        >
          <Search size={14} className="text-white/50 shrink-0" strokeWidth={2} />
          <span className="flex-1 text-xs text-white/40">Buscar...</span>
          <span
            className="hidden rounded px-1.5 py-0.5 text-[10px] text-white/35 sm:block"
            style={{ border: '0.5px solid rgba(255,255,255,0.10)' }}
          >
            ⌘K
          </span>
        </button>

        {/* Bell */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => setBellOpen(o => !o)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-white/55 transition-all hover:bg-white/10 hover:text-white"
          >
            <Bell size={17} strokeWidth={1.5} />
            {notifTotal > 0 && (
              <span
                className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
              >
                {notifTotal > 9 ? '9+' : notifTotal}
              </span>
            )}
          </button>

          {bellOpen && (
            <div
              className="absolute right-0 top-11 z-50 w-80 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl"
              style={{
                background: 'rgba(13,11,32,0.98)',
                border: '0.5px solid rgba(255,255,255,0.14)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
                backdropFilter: 'blur(24px)',
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}
              >
                <p className="text-[14px] font-semibold text-white">Notificações</p>
                <button onClick={() => setBellOpen(false)} className="text-white/30 hover:text-white/60">
                  <X size={14} />
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifs.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <Bell size={24} className="text-white/15" strokeWidth={1} />
                    <p className="text-sm text-white/35">Tudo em dia!</p>
                  </div>
                ) : notifs.map(n => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.04]"
                    style={{ borderBottom: '0.5px solid rgba(255,255,255,0.05)' }}
                  >
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: n.tipo === 'novo_lead'
                          ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                          : 'rgba(251,191,36,0.12)',
                      }}
                    >
                      {n.tipo === 'novo_lead'
                        ? <Sparkles size={12} strokeWidth={1.5} className="text-white" />
                        : <Clock size={12} strokeWidth={1.5} className="text-yellow-400" />}
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                      <p className="truncate text-[13px] font-semibold text-white">{n.empresa}</p>
                      <p className="text-[11px] text-white/45">{n.descricao}</p>
                    </div>
                    <span className="shrink-0 text-[10px] text-white/25">{timeAgo(n.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fundo — opens Background Gallery */}
        <button
          onClick={() => setBgGalleryOpen(true)}
          className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-white/70 transition-all hover:bg-white/10 lg:flex"
          style={{ border: '0.5px solid rgba(255,255,255,0.12)' }}
        >
          <Globe size={12} strokeWidth={1.5} />
          Fundo
        </button>

        <button
          onClick={() => setAddLeadOpen(true)}
          className="hidden btn-primary items-center gap-1.5 text-xs lg:flex"
        >
          <Plus size={13} strokeWidth={2} />Novo Lead
        </button>
      </header>
    </div>
  )
}
