'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import {
  Kanban, Users, CheckSquare, Map, BarChart2,
  UsersRound, Settings, ChevronRight, Zap,
} from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const QUICK_LINKS = [
  { href: '/pipeline',    icon: Kanban,      label: 'Pipeline',     desc: 'Funil de vendas',             color: '#818cf8' },
  { href: '/leads',       icon: Users,       label: 'Leads',        desc: 'Base de prospects',           color: '#60a5fa' },
  { href: '/tarefas',     icon: CheckSquare, label: 'Tarefas',      desc: 'Atividades da equipe',        color: '#34d399' },
  { href: '/relatorios',  icon: BarChart2,   label: 'Análises',     desc: 'Métricas e relatórios',       color: '#fbbf24' },
  { href: '/mapa',        icon: Map,         label: 'Mapa',         desc: 'Leads por região',            color: '#f472b6' },
  { href: '/grupos',      icon: UsersRound,  label: 'Grupos',       desc: 'Times de trabalho',           color: '#a78bfa' },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function HomePage() {
  const router = useRouter()
  const [nome, setNome] = useState('')

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('nome').eq('id', user.id).single()
      setNome(data?.nome?.split(' ')[0] || user.email?.split('@')[0] || '')
    }
    loadUser()
  }, [])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100%', overflow: 'auto', padding: '40px 24px',
    }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        {/* Logo + Nome */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, marginBottom: 16 }}>
          <img src="/logo-lp.png" alt="Lead+"
            style={{ width: 72, height: 72, objectFit: 'contain', filter: 'drop-shadow(0 4px 24px rgba(224,79,10,0.35))' }} />
          <h1 style={{
            fontSize: 64, fontWeight: 900, letterSpacing: '-2px',
            color: '#ffffff', margin: 0, lineHeight: 1,
          }}>
            Lead<span style={{ color: '#E04F0A' }}>+</span>
          </h1>
        </div>

        <p style={{
          fontSize: 18, color: 'rgba(255,255,255,0.55)', fontWeight: 400,
          letterSpacing: '0.04em', margin: 0, marginBottom: 28,
        }}>
          Inteligência que impulsiona
        </p>

        {nome && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 100, padding: '8px 20px',
          }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#E04F0A,#fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
              {nome[0]?.toUpperCase()}
            </div>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
              {greeting()}, <strong style={{ color: '#fff', fontWeight: 700 }}>{nome}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Quick access */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 14, width: '100%', maxWidth: 860,
      }}>
        {QUICK_LINKS.map(({ href, icon: Icon, label, desc, color }) => (
          <button
            key={href}
            onClick={() => router.push(href)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '18px 20px', borderRadius: 18,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.10)',
              cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'rgba(255,255,255,0.12)'
              el.style.border = `1px solid ${color}55`
              el.style.transform = 'translateY(-2px)'
              el.style.boxShadow = `0 8px 24px ${color}25`
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'rgba(255,255,255,0.07)'
              el.style.border = '1px solid rgba(255,255,255,0.10)'
              el.style.transform = 'translateY(0)'
              el.style.boxShadow = 'none'
            }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: `${color}20`, border: `1.5px solid ${color}45`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={18} strokeWidth={1.6} style={{ color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>{label}</p>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.40)', marginTop: 2 }}>{desc}</p>
            </div>
            <ChevronRight size={14} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
          </button>
        ))}
      </div>

      {/* Footer tagline */}
      <p style={{ marginTop: 48, fontSize: 11, color: 'rgba(255,255,255,0.20)', letterSpacing: '0.06em' }}>
        EBT Transportadora · Lead Engine v1.0
      </p>
    </div>
  )
}
