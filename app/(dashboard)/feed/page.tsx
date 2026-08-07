'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Heart, MessageCircle, Share2, Zap, TrendingUp, CheckCircle2, UserPlus, AlertCircle, RefreshCw, Plus, Users, Bell } from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const TYPE_ICONS: Record<string, { icon: any; color: string; bg: string }> = {
  venda:     { icon: Zap,          color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
  meta:      { icon: TrendingUp,   color: '#6366f1', bg: 'rgba(99,102,241,0.12)'  },
  tarefa:    { icon: CheckCircle2, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  membro:    { icon: UserPlus,     color: '#3b82f6', bg: 'rgba(59,130,246,0.12)'  },
  alerta:    { icon: AlertCircle,  color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
  default:   { icon: Bell,         color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min atrás`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h atrás`
  return `${Math.floor(hrs / 24)}d atrás`
}

interface FeedItem {
  id: string
  tipo: string
  user_nome: string
  user_avatar: string
  user_cor: string
  conteudo: string
  highlight: string | null
  highlight_cor: string | null
  sub: string | null
  likes_count: number
  comments_count: number
  criado_em: string
  liked?: boolean
}

interface Profile {
  id: string; nome: string; cargo: string; cor: string
}

export default function FeedPage() {
  const [items,     setItems]     = useState<FeedItem[]>([])
  const [profiles,  setProfiles]  = useState<Profile[]>([])
  const [myId,      setMyId]      = useState<string | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState<string>('todos')

  async function loadAll() {
    setLoading(true)
    const { data: prof } = await supabase.from('profiles').select('id,nome,cargo,cor').eq('ativo', true)
    const allProfiles = (prof || []) as Profile[]
    setProfiles(allProfiles)
    // determine current user — first profile (simplified, no auth.getUser needed)
    const myProfile = allProfiles[0] || null
    setMyId(myProfile?.id || null)

    const { data: feedData } = await supabase.from('feed_items').select('*').order('criado_em', { ascending: false })
    const feedItems = (feedData || []) as FeedItem[]

    if (myProfile) {
      // fetch liked items
      const { data: likes } = await supabase.from('feed_likes').select('item_id').eq('profile_id', myProfile.id)
      const likedSet = new Set((likes || []).map((l: any) => l.item_id))
      setItems(feedItems.map(i => ({ ...i, liked: likedSet.has(i.id) })))
    } else {
      setItems(feedItems)
    }
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  async function toggleLike(item: FeedItem) {
    if (!myId) return
    const wasLiked = item.liked
    // optimistic
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, liked: !wasLiked, likes_count: i.likes_count + (wasLiked ? -1 : 1) } : i))
    if (wasLiked) {
      await supabase.from('feed_likes').delete().eq('item_id', item.id).eq('profile_id', myId)
      await supabase.from('feed_items').update({ likes_count: item.likes_count - 1 }).eq('id', item.id)
    } else {
      await supabase.from('feed_likes').insert({ item_id: item.id, profile_id: myId })
      await supabase.from('feed_items').update({ likes_count: item.likes_count + 1 }).eq('id', item.id)
    }
  }

  const FILTER_TYPES = [
    { key:'todos',  label:'Todos' },
    { key:'venda',  label:'Vendas' },
    { key:'meta',   label:'Metas' },
    { key:'tarefa', label:'Tarefas' },
    { key:'membro', label:'Equipe' },
  ]

  const filtered = filter === 'todos' ? items : items.filter(i => i.tipo === filter)

  const stats = {
    vendas:  items.filter(i => i.tipo === 'venda').length,
    metas:   items.filter(i => i.tipo === 'meta').length,
    membros: profiles.length,
  }

  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden' }}>
      {/* Feed */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 24px', borderBottom:'1px solid rgba(255,255,255,0.08)', flexShrink:0 }}>
          <h1 style={{ fontSize:17, fontWeight:700, color:'#fff', margin:0 }}>Feed da Equipe</h1>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
            <button onClick={loadAll} style={{ padding:'6px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,0.12)', background:'transparent', color:'rgba(255,255,255,0.50)', cursor:'pointer', display:'flex', alignItems:'center' }}>
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:8, padding:'10px 24px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
          {FILTER_TYPES.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{ padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:500, border:'none', cursor:'pointer', background: filter===f.key ? 'rgba(99,102,241,0.20)' : 'rgba(255,255,255,0.06)', color: filter===f.key ? '#a78bfa' : 'rgba(255,255,255,0.50)', outline: filter===f.key ? '1px solid rgba(99,102,241,0.40)' : 'none' }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Items */}
        <div style={{ flex:1, padding:'16px 24px', display:'flex', flexDirection:'column', gap:12 }}>
          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, gap:10, color:'rgba(255,255,255,0.40)' }}>
              <RefreshCw size={18} style={{ animation:'spin 1s linear infinite' }} /> Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:200, gap:12 }}>
              <p style={{ color:'rgba(255,255,255,0.30)', fontSize:15 }}>Nenhuma atividade.</p>
            </div>
          ) : filtered.map(item => {
            const cfg = TYPE_ICONS[item.tipo] || TYPE_ICONS['default']
            const Icon = cfg.icon
            return (
              <div key={item.id} style={{ background:'#ffffff', border:'1px solid rgba(0,0,0,0.09)', borderRadius:14, padding:'16px 18px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', transition:'box-shadow 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow='0 4px 16px rgba(0,0,0,0.10)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow='0 2px 8px rgba(0,0,0,0.06)'}>
                {/* Top row */}
                <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
                  {/* Avatar */}
                  <div style={{ width:38, height:38, borderRadius:12, flexShrink:0, background: item.user_cor || '#6366f1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#fff' }}>
                    {item.user_nome.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'#111827' }}>{item.user_nome}</span>
                      <div style={{ display:'flex', alignItems:'center', gap:5, background:cfg.bg, borderRadius:20, padding:'2px 9px' }}>
                        <Icon size={10} style={{ color:cfg.color }} />
                        <span style={{ fontSize:10, fontWeight:600, color:cfg.color, textTransform:'capitalize' }}>{item.tipo}</span>
                      </div>
                      <span style={{ marginLeft:'auto', fontSize:11, color:'#9ca3af' }}>{timeAgo(item.criado_em)}</span>
                    </div>
                    <p style={{ margin:'4px 0 0', fontSize:13, color:'#374151', lineHeight:1.5 }}>{item.conteudo}</p>
                  </div>
                </div>

                {/* Highlight */}
                {item.highlight && (
                  <div style={{ marginBottom:12, padding:'10px 14px', borderRadius:10, background: item.highlight_cor ? `${item.highlight_cor}10` : 'rgba(99,102,241,0.08)', border: `1px solid ${item.highlight_cor || '#6366f1'}25`, display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:3, height:24, borderRadius:4, background: item.highlight_cor || '#6366f1', flexShrink:0 }} />
                    <p style={{ margin:0, fontSize:13, fontWeight:700, color: item.highlight_cor || '#a78bfa' }}>{item.highlight}</p>
                  </div>
                )}

                {/* Sub */}
                {item.sub && (
                  <p style={{ margin:'0 0 10px', fontSize:12, color:'#9ca3af', paddingLeft:50 }}>{item.sub}</p>
                )}

                {/* Actions */}
                <div style={{ display:'flex', alignItems:'center', gap:16, paddingTop:10, borderTop:'1px solid rgba(0,0,0,0.06)' }}>
                  <button onClick={() => toggleLike(item)} style={{ display:'flex', alignItems:'center', gap:6, border:'none', background:'none', cursor:'pointer', color: item.liked ? '#ec4899' : '#9ca3af', fontSize:12, fontWeight:500, transition:'color 0.15s', padding:0 }}>
                    <Heart size={14} fill={item.liked ? '#ec4899' : 'none'} /> {item.likes_count}
                  </button>
                  <button style={{ display:'flex', alignItems:'center', gap:6, border:'none', background:'none', cursor:'default', color:'#9ca3af', fontSize:12, padding:0 }}>
                    <MessageCircle size={14} /> {item.comments_count}
                  </button>
                  <button style={{ display:'flex', alignItems:'center', gap:6, border:'none', background:'none', cursor:'pointer', color:'#d1d5db', fontSize:12, padding:0, marginLeft:'auto', transition:'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='#6b7280'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='#d1d5db'}>
                    <Share2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sidebar */}
      <div style={{ width:240, flexShrink:0, borderLeft:'1px solid rgba(0,0,0,0.07)', overflowY:'auto', display:'flex', flexDirection:'column', gap:0, background:'rgba(255,255,255,0.70)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)' }}>
        {/* Stats */}
        <div style={{ padding:'16px 16px 0' }}>
          <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'#9ca3af', margin:'0 0 10px' }}>Resumo</p>
          {[
            { label:'Vendas registradas', value: stats.vendas,  color:'#10b981' },
            { label:'Metas conquistadas', value: stats.metas,   color:'#6366f1' },
            { label:'Membros ativos',     value: stats.membros, color:'#f59e0b' },
          ].map(s => (
            <div key={s.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize:12, color:'#6b7280' }}>{s.label}</span>
              <span style={{ fontSize:15, fontWeight:800, color:s.color }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Team */}
        <div style={{ padding:'16px' }}>
          <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'#9ca3af', margin:'0 0 10px', display:'flex', alignItems:'center', gap:5 }}>
            <Users size={10} /> Equipe
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {profiles.map(p => (
              <div key={p.id} style={{ display:'flex', alignItems:'center', gap:9 }}>
                <div style={{ width:30, height:30, borderRadius:9, background: p.cor || '#6366f1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>
                  {p.nome.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex:1, overflow:'hidden' }}>
                  <p style={{ fontSize:12, fontWeight:600, color:'#111827', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.nome}</p>
                  <p style={{ fontSize:10, color:'#6b7280', margin:0 }}>{p.cargo || 'Vendedor'}</p>
                </div>
                <div style={{ width:7, height:7, borderRadius:'50%', background:'#10b981', flexShrink:0 }} />
              </div>
            ))}
            {profiles.length === 0 && <p style={{ fontSize:12, color:'#9ca3af' }}>Nenhum membro.</p>}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
