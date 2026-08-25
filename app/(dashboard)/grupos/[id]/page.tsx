'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import {
  ArrowLeft, Users, Lock, Globe, Plus, Trash2,
  CheckCircle2, Circle, Clock, AlertCircle, Flag, Calendar,
  UserPlus, X, Check,
} from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const TENANT_ID = '00000000-0000-0000-0000-000000000001'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pendente:  { label: 'Pendente',     color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', icon: Circle       },
  andamento: { label: 'Em andamento', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)',  icon: Clock        },
  concluida: { label: 'Concluída',    color: '#34d399', bg: 'rgba(52,211,153,0.15)',  icon: CheckCircle2 },
  bloqueada: { label: 'Bloqueada',    color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   icon: AlertCircle  },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  alta:  { label: 'Alta',  color: '#ef4444' },
  media: { label: 'Média', color: '#fbbf24' },
  baixa: { label: 'Baixa', color: '#34d399' },
}

interface Profile { id: string; nome: string; cor: string; cargo: string }
interface Membro  { profile_id: string; papel: string; profile: Profile }
interface Grupo {
  id: string; nome: string; descricao: string | null
  privacidade: string; cor: string; tags: string[]; criado_em: string
}
interface Tarefa {
  id: string; titulo: string; status: string; prioridade: string
  prazo?: string; responsavel_id?: string; projeto?: string
  responsavel?: Profile; created_at: string
}

function initials(nome: string) {
  return nome.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function GrupoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const [grupo,       setGrupo]       = useState<Grupo | null>(null)
  const [membros,     setMembros]     = useState<Membro[]>([])
  const [tarefas,     setTarefas]     = useState<Tarefa[]>([])
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState<'membros' | 'tarefas'>('membros')

  // Add member panel
  const [showAdd,   setShowAdd]   = useState(false)
  const [addId,     setAddId]     = useState('')
  const [addPapel,  setAddPapel]  = useState('membro')
  const [adding,    setAdding]    = useState(false)

  async function load() {
    setLoading(true)
    const [{ data: g }, { data: m }, { data: profs }] = await Promise.all([
      supabase.from('grupos').select('*').eq('id', id).single(),
      supabase.from('grupo_membros').select('profile_id, papel, profile:profiles(id,nome,cor,cargo)').eq('grupo_id', id),
      supabase.from('profiles').select('id,nome,cor,cargo').eq('ativo', true).order('nome'),
    ])
    setGrupo(g as Grupo)
    setMembros((m ?? []) as unknown as Membro[])
    setAllProfiles((profs ?? []) as Profile[])
    setLoading(false)
  }

  async function loadTarefas(membroIds: string[]) {
    if (!membroIds.length) { setTarefas([]); return }
    const { data } = await supabase
      .from('tarefas')
      .select('*')
      .in('responsavel_id', membroIds)
      .order('created_at', { ascending: false })
    const profMap: Record<string, Profile> = {}
    allProfiles.forEach(p => { profMap[p.id] = p })
    setTarefas(((data ?? []) as any[]).map(t => ({ ...t, responsavel: profMap[t.responsavel_id] })))
  }

  useEffect(() => { load() }, [id])

  useEffect(() => {
    if (!loading) {
      const ids = membros.map(m => m.profile_id)
      loadTarefas(ids)
    }
  }, [membros, loading, allProfiles])

  async function addMembro() {
    if (!addId || adding) return
    setAdding(true)
    await supabase.from('grupo_membros').insert({ grupo_id: id, profile_id: addId, papel: addPapel })
    await load()
    setShowAdd(false); setAddId(''); setAdding(false)
  }

  async function removeMembro(profileId: string) {
    if (!confirm('Remover este membro do grupo?')) return
    await supabase.from('grupo_membros').delete().eq('grupo_id', id).eq('profile_id', profileId)
    setMembros(prev => prev.filter(m => m.profile_id !== profileId))
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.4)', gap: 12 }}>
        Carregando...
      </div>
    )
  }
  if (!grupo) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Grupo não encontrado.</p>
        <button onClick={() => router.push('/grupos')} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer' }}>Voltar</button>
      </div>
    )
  }

  const membroIds = new Set(membros.map(m => m.profile_id))
  const availableToAdd = allProfiles.filter(p => !membroIds.has(p.id))

  const tarefasAtivas   = tarefas.filter(t => t.status !== 'concluida')
  const tarefasConcluidas = tarefas.filter(t => t.status === 'concluida')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0,
        background: 'rgba(255,255,255,0.04)',
      }}>
        <button onClick={() => router.push('/grupos')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.50)', fontSize: 13, padding: '4px 8px', borderRadius: 8 }}>
          <ArrowLeft size={14} /> Grupos
        </button>

        <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, background: `${grupo.cor}25`, color: grupo.cor, border: `1.5px solid ${grupo.cor}50` }}>
          {grupo.nome[0]}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0 }}>{grupo.nome}</h1>
            {grupo.privacidade === 'privado'
              ? <Lock size={11} style={{ color: 'rgba(255,255,255,0.35)' }} />
              : <Globe size={11} style={{ color: 'rgba(255,255,255,0.35)' }} />}
          </div>
          {grupo.descricao && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0, marginTop: 2 }}>{grupo.descricao}</p>
          )}
        </div>

        {grupo.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6 }}>
            {grupo.tags.map(t => (
              <span key={t} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${grupo.cor}20`, color: grupo.cor, border: `1px solid ${grupo.cor}40` }}>{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, padding: '0 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        {([
          { key: 'membros', label: `Membros (${membros.length})` },
          { key: 'tarefas', label: `Tarefas (${tarefas.length})` },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '12px 20px', fontSize: 13, fontWeight: tab === key ? 700 : 400,
            border: 'none', borderBottom: tab === key ? `2px solid ${grupo.cor}` : '2px solid transparent',
            background: 'none', cursor: 'pointer',
            color: tab === key ? '#fff' : 'rgba(255,255,255,0.45)',
            transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

        {/* ── MEMBROS ── */}
        {tab === 'membros' && (
          <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAdd(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', background: grupo.cor, color: '#fff', fontSize: 13, fontWeight: 600 }}>
                <UserPlus size={13} /> Adicionar membro
              </button>
            </div>

            {/* Add member panel */}
            {showAdd && (
              <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', border: '1px solid #e5e7eb', display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 6 }}>Membro</label>
                  <select value={addId} onChange={e => setAddId(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, color: '#111', background: '#f9fafb', cursor: 'pointer' }}>
                    <option value="">— Selecionar —</option>
                    {availableToAdd.map(p => <option key={p.id} value={p.id}>{p.nome} · {p.cargo}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 6 }}>Papel</label>
                  <select value={addPapel} onChange={e => setAddPapel(e.target.value)}
                    style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, color: '#111', background: '#f9fafb', cursor: 'pointer' }}>
                    <option value="membro">Membro</option>
                    <option value="admin">Admin</option>
                    <option value="lider">Líder</option>
                  </select>
                </div>
                <button onClick={addMembro} disabled={!addId || adding}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', cursor: !addId || adding ? 'default' : 'pointer', background: !addId || adding ? '#e5e7eb' : '#10b981', color: '#fff', fontSize: 13, fontWeight: 700 }}>
                  <Check size={13} /> {adding ? 'Adicionando…' : 'Confirmar'}
                </button>
                <button onClick={() => setShowAdd(false)}
                  style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', color: '#9ca3af', cursor: 'pointer', fontSize: 13 }}>
                  <X size={14} />
                </button>
              </div>
            )}

            {membros.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>
                Nenhum membro ainda. Adicione alguém acima.
              </div>
            ) : (
              membros.map(m => {
                const p = m.profile as Profile
                return (
                  <div key={m.profile_id} style={{
                    background: '#fff', borderRadius: 14, padding: '14px 18px',
                    display: 'flex', alignItems: 'center', gap: 14,
                    border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: p?.cor || grupo.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {initials(p?.nome || '?')}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>{p?.nome || '—'}</p>
                      <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>{p?.cargo || '—'}</p>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: m.papel === 'admin' ? 'rgba(99,102,241,0.12)' : m.papel === 'lider' ? 'rgba(245,158,11,0.12)' : '#f3f4f6', color: m.papel === 'admin' ? '#6366f1' : m.papel === 'lider' ? '#f59e0b' : '#6b7280' }}>
                      {m.papel === 'admin' ? 'Admin' : m.papel === 'lider' ? 'Líder' : 'Membro'}
                    </span>
                    <button onClick={() => removeMembro(m.profile_id)}
                      style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fef2f2'; (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; (e.currentTarget as HTMLElement).style.color = '#d1d5db' }}>
                      <Trash2 size={12} strokeWidth={1.5} />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ── TAREFAS ── */}
        {tab === 'tarefas' && (
          <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {tarefas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>
                Nenhuma tarefa atribuída aos membros deste grupo.
              </div>
            ) : (
              <>
                {tarefasAtivas.length > 0 && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>Em aberto</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {tarefasAtivas.map(t => <TarefaRow key={t.id} t={t} />)}
                    </div>
                  </div>
                )}
                {tarefasConcluidas.length > 0 && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.25)', marginBottom: 10 }}>Concluídas</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity: 0.6 }}>
                      {tarefasConcluidas.map(t => <TarefaRow key={t.id} t={t} />)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

function TarefaRow({ t }: { t: Tarefa }) {
  const scfg = STATUS_CONFIG[t.status]
  const pcfg = PRIORITY_CONFIG[t.prioridade]
  const Icon = scfg?.icon
  const prazoDate = t.prazo ? new Date(t.prazo + 'T12:00:00') : null
  const overdue   = prazoDate && prazoDate < new Date() && t.status !== 'concluida'
  const prazoStr  = prazoDate ? prazoDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—'

  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      <Icon size={15} strokeWidth={1.8} style={{ color: scfg?.color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: t.status === 'concluida' ? '#aaa' : '#111827', textDecoration: t.status === 'concluida' ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.titulo}</p>
        {t.projeto && <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>{t.projeto}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Flag size={10} style={{ color: pcfg?.color }} />
        <span style={{ fontSize: 11, color: pcfg?.color, fontWeight: 600 }}>{pcfg?.label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 50 }}>
        <Calendar size={10} style={{ color: overdue ? '#ef4444' : '#bbb' }} />
        <span style={{ fontSize: 11, color: overdue ? '#ef4444' : '#9ca3af', fontWeight: overdue ? 700 : 400 }}>{prazoStr}</span>
      </div>
      {t.responsavel && (
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: t.responsavel.cor || '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
          {t.responsavel.nome.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
        </div>
      )}
    </div>
  )
}
