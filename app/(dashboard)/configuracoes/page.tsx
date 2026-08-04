'use client'
import { useState } from 'react'
import { User, Bell, Shield, Palette, Save, Check, Plus, Trash2, Mail } from 'lucide-react'

const TABS = [
  { id: 'equipe',       label: 'Equipe',       icon: User    },
  { id: 'notificacoes', label: 'Notificações',  icon: Bell    },
  { id: 'seguranca',    label: 'Segurança',     icon: Shield  },
  { id: 'aparencia',    label: 'Aparência',     icon: Palette },
]

const MEMBER_COLORS = [
  { label: 'Índigo',    value: '#6366f1' },
  { label: 'Violeta',   value: '#8b5cf6' },
  { label: 'Rosa',      value: '#ec4899' },
  { label: 'Esmeralda', value: '#10b981' },
  { label: 'Âmbar',    value: '#f59e0b' },
  { label: 'Céu',       value: '#0ea5e9' },
]

const MOCK_TEAM = [
  { id: '1', nome: 'Guilherme Campos', email: 'guilherme.acs23@gmail.com', cargo: 'Administrador',    cor: '#6366f1', ativo: true  },
  { id: '2', nome: 'Marina Rocha',     email: 'marina@ebt.com.br',         cargo: 'Gerente Comercial',cor: '#ec4899', ativo: true  },
  { id: '3', nome: 'João Santos',      email: 'joao@ebt.com.br',           cargo: 'Vendedor',         cor: '#10b981', ativo: true  },
  { id: '4', nome: 'Ana Lima',         email: 'ana@ebt.com.br',            cargo: 'Vendedora',        cor: '#f59e0b', ativo: false },
]

const NOTIF_OPTIONS = [
  { id: 'novo_lead',     label: 'Novo lead adicionado',           desc: 'Quando um lead é importado ou criado manualmente'    },
  { id: 'etapa_mudanca', label: 'Lead muda de etapa no pipeline', desc: 'Atualização de status no Kanban ou Lista'            },
  { id: 'atividade',     label: 'Nova atividade registrada',      desc: 'Ligação, e-mail ou reunião adicionada a um lead'     },
  { id: 'meta_semanal',  label: 'Resumo semanal',                 desc: 'Relatório com métricas da semana toda segunda-feira' },
]

/* shared card style */
const CARD: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid rgba(0,0,0,0.09)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  borderRadius: 14,
  padding: '18px 20px',
}

export default function ConfiguracoesPage() {
  const [tab,    setTab]    = useState('equipe')
  const [team,   setTeam]   = useState(MOCK_TEAM)
  const [saved,  setSaved]  = useState<string | null>(null)
  const [notifs, setNotifs] = useState<Record<string, boolean>>({
    novo_lead: true, etapa_mudanca: true, atividade: false, meta_semanal: true,
  })
  const [inviteEmail, setInviteEmail] = useState('')

  function toggleNotif(id: string) { setNotifs(n => ({ ...n, [id]: !n[id] })) }
  function showSaved(msg: string)   { setSaved(msg); setTimeout(() => setSaved(null), 2500) }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Left sidebar ── */}
      <div style={{
        width: 208, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4,
        padding: 16,
        borderRight: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(255,255,255,0.10)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <p style={{ marginBottom: 10, paddingLeft: 8, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.45)' }}>
          Configurações
        </p>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 10, border: 'none',
            cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: tab === id ? 600 : 400,
            background: tab === id ? 'rgba(255,255,255,0.15)' : 'transparent',
            color: tab === id ? '#ffffff' : 'rgba(255,255,255,0.55)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (tab !== id) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)' }}
          onMouseLeave={e => { if (tab !== id) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <Icon size={14} strokeWidth={1.6} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Toast */}
        {saved && (
          <div style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(16,185,129,0.90)', borderRadius: 12, padding: '12px 20px',
            fontSize: 13, fontWeight: 600, color: '#ffffff',
            boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
          }}>
            <Check size={14} /> {saved}
          </div>
        )}

        {/* ────────── EQUIPE ────────── */}
        {tab === 'equipe' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 680 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', margin: 0 }}>Equipe</h2>
              <p style={{ marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                Gerencie os membros que têm acesso ao Lead Engine
              </p>
            </div>

            {/* Invite */}
            <div style={{ ...CARD, background: '#f0f0ff', border: '1px solid rgba(99,102,241,0.20)' }}>
              <p style={{ marginBottom: 12, fontSize: 13, fontWeight: 700, color: '#111827' }}>Convidar novo membro</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10, padding: '10px 14px' }}>
                  <Mail size={14} style={{ color: '#9ca3af', flexShrink: 0 }} strokeWidth={1.5} />
                  <input
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="email@empresa.com.br"
                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#111827', background: 'transparent' }}
                  />
                </div>
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
                  borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: '#6366f1', color: '#ffffff', fontSize: 13, fontWeight: 700,
                }}>
                  <Plus size={13} strokeWidth={2} /> Convidar
                </button>
              </div>
            </div>

            {/* Members */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {team.map(member => (
                <div key={member.id} style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 14 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: member.cor, color: '#ffffff', fontSize: 14, fontWeight: 700,
                  }}>
                    {member.nome.charAt(0)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{member.nome}</span>
                      {!member.ativo && (
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'rgba(245,158,11,0.12)', color: '#d97706', border: '1px solid rgba(245,158,11,0.25)' }}>
                          Pendente
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{member.email}</span>
                  </div>

                  {/* Cargo */}
                  <span style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#f3f4f6', color: '#374151', border: '1px solid rgba(0,0,0,0.08)', whiteSpace: 'nowrap' }}>
                    {member.cargo}
                  </span>

                  {/* Color picker */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {MEMBER_COLORS.map(c => (
                      <button key={c.value}
                        onClick={() => setTeam(t => t.map(m => m.id === member.id ? { ...m, cor: c.value } : m))}
                        style={{
                          width: 16, height: 16, borderRadius: '50%', border: 'none', cursor: 'pointer',
                          background: c.value,
                          outline: member.cor === c.value ? `2.5px solid ${c.value}` : 'none',
                          outlineOffset: 2,
                          transition: 'transform 0.15s',
                        }}
                        title={c.label}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => setTeam(t => t.filter(m => m.id !== member.id))}
                    style={{
                      width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(0,0,0,0.09)',
                      background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#9ca3af', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fef2f2'; (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; (e.currentTarget as HTMLElement).style.color = '#9ca3af' }}
                  >
                    <Trash2 size={13} strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
              {team.filter(m => m.ativo).length} membros ativos · {team.filter(m => !m.ativo).length} pendentes
            </p>
          </div>
        )}

        {/* ────────── NOTIFICAÇÕES ────────── */}
        {tab === 'notificacoes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 560 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', margin: 0 }}>Notificações</h2>
              <p style={{ marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Escolha quais alertas receber por e-mail</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {NOTIF_OPTIONS.map(({ id, label, desc }) => (
                <div key={id} onClick={() => toggleNotif(id)} style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>{label}</p>
                    <p style={{ fontSize: 12, color: '#6b7280', margin: '3px 0 0' }}>{desc}</p>
                  </div>
                  {/* Toggle */}
                  <div style={{ position: 'relative', width: 38, height: 22, borderRadius: 11, flexShrink: 0, transition: 'background 0.2s', background: notifs[id] ? '#6366f1' : '#d1d5db' }}>
                    <div style={{ position: 'absolute', top: 3, width: 16, height: 16, borderRadius: '50%', background: '#ffffff', boxShadow: '0 1px 4px rgba(0,0,0,0.20)', transition: 'left 0.2s', left: notifs[id] ? '19px' : '3px' }} />
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => showSaved('Preferências de notificação salvas!')} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px',
              borderRadius: 10, border: 'none', cursor: 'pointer',
              background: '#6366f1', color: '#ffffff', fontSize: 13, fontWeight: 700, alignSelf: 'flex-start',
            }}>
              <Save size={13} strokeWidth={1.5} /> Salvar preferências
            </button>
          </div>
        )}

        {/* ────────── SEGURANÇA ────────── */}
        {tab === 'seguranca' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 560 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', margin: 0 }}>Segurança</h2>
              <p style={{ marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Gerencie sua senha e sessões ativas</p>
            </div>

            <div style={CARD}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Alterar senha</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Senha atual', 'Nova senha', 'Confirmar nova senha'].map(label => (
                  <div key={label}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f9fafb', border: '1px solid rgba(0,0,0,0.10)', borderRadius: 10, padding: '10px 14px' }}>
                      <Shield size={13} style={{ color: '#9ca3af' }} strokeWidth={1.5} />
                      <input type="password" placeholder="••••••••"
                        style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#111827', background: 'transparent' }} />
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => showSaved('Senha alterada com sucesso!')} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                borderRadius: 10, border: 'none', cursor: 'pointer', marginTop: 16,
                background: '#6366f1', color: '#ffffff', fontSize: 13, fontWeight: 700,
              }}>
                <Save size={13} strokeWidth={1.5} /> Atualizar senha
              </button>
            </div>

            <div style={{ ...CARD, background: '#fff5f5', border: '1px solid rgba(239,68,68,0.18)' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Encerrar todas as sessões</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 14px' }}>Desconecta todos os dispositivos exceto o atual</p>
              <button style={{ padding: '9px 16px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.25)', background: '#ffffff', color: '#ef4444', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Encerrar sessões remotas
              </button>
            </div>
          </div>
        )}

        {/* ────────── APARÊNCIA ────────── */}
        {tab === 'aparencia' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 560 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', margin: 0 }}>Aparência</h2>
              <p style={{ marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Personalize o visual da interface</p>
            </div>

            <div style={CARD}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 10px' }}>Fundo / tema visual</p>
              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
                Acesse o painel de fundos clicando no botão <strong style={{ color: '#374151' }}>Fundo</strong> na barra superior.
                Você pode escolher entre gradientes, meshes e fundos animados.
              </p>
            </div>

            <div style={CARD}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 14px' }}>Idioma e região</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Idioma', value: 'Português (Brasil)' },
                  { label: 'Fuso horário', value: 'America/Sao_Paulo (UTC-3)' },
                  { label: 'Moeda', value: 'BRL — Real Brasileiro' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>{label}</span>
                    <span style={{ padding: '5px 12px', borderRadius: 8, background: '#f3f4f6', border: '1px solid rgba(0,0,0,0.08)', fontSize: 13, fontWeight: 600, color: '#111827' }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Mapa do Site card ── */}
        <a href="/mapa-do-site" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderRadius: 14, padding: '14px 18px', textDecoration: 'none', marginTop: 8,
          background: '#ffffff', border: '1px solid rgba(0,0,0,0.09)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)', transition: 'all 0.18s',
          maxWidth: 680,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Mapa do Site</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>Visão geral de todos os módulos e navegação completa</p>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </a>

      </div>
    </div>
  )
}
