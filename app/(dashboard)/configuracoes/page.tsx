'use client'
import { useState, useEffect } from 'react'
import { fetchProfiles, updateProfile } from '@/lib/supabase'
import { User, Bell, Shield, Palette, Save, Loader2, Check, Plus, Trash2, Mail, Phone } from 'lucide-react'

const TABS = [
  { id: 'equipe',        label: 'Equipe',         icon: User    },
  { id: 'notificacoes',  label: 'Notificações',    icon: Bell    },
  { id: 'seguranca',     label: 'Segurança',       icon: Shield  },
  { id: 'aparencia',     label: 'Aparência',       icon: Palette },
]

const MEMBER_COLORS = [
  { label: 'Índigo',   value: '#6366f1' },
  { label: 'Violeta',  value: '#8b5cf6' },
  { label: 'Rosa',     value: '#ec4899' },
  { label: 'Esmeralda',value: '#10b981' },
  { label: 'Âmbar',   value: '#f59e0b' },
  { label: 'Céu',      value: '#0ea5e9' },
]

const MOCK_TEAM = [
  { id: '1', nome: 'Guilherme Campos', email: 'guilherme.acs23@gmail.com', cargo: 'Administrador', cor: '#6366f1', ativo: true },
  { id: '2', nome: 'Marina Rocha',     email: 'marina@ebt.com.br',         cargo: 'Gerente Comercial', cor: '#ec4899', ativo: true },
  { id: '3', nome: 'João Santos',      email: 'joao@ebt.com.br',           cargo: 'Vendedor',      cor: '#10b981', ativo: true },
  { id: '4', nome: 'Ana Lima',         email: 'ana@ebt.com.br',            cargo: 'Vendedora',     cor: '#f59e0b', ativo: false },
]

const NOTIF_OPTIONS = [
  { id: 'novo_lead',     label: 'Novo lead adicionado',           desc: 'Quando um lead é importado ou criado manualmente' },
  { id: 'etapa_mudanca', label: 'Lead muda de etapa no pipeline', desc: 'Atualização de status no Kanban ou Lista'           },
  { id: 'atividade',     label: 'Nova atividade registrada',      desc: 'Ligação, e-mail ou reunião adicionada a um lead'   },
  { id: 'meta_semanal',  label: 'Resumo semanal',                 desc: 'Relatório com métricas da semana toda segunda'      },
]

export default function ConfiguracoesPage() {
  const [tab,     setTab]     = useState('equipe')
  const [team,    setTeam]    = useState(MOCK_TEAM)
  const [saved,   setSaved]   = useState<string | null>(null)
  const [notifs,  setNotifs]  = useState<Record<string, boolean>>({
    novo_lead: true, etapa_mudanca: true, atividade: false, meta_semanal: true,
  })

  function toggleNotif(id: string) {
    setNotifs(n => ({ ...n, [id]: !n[id] }))
  }

  function showSaved(msg: string) {
    setSaved(msg)
    setTimeout(() => setSaved(null), 2500)
  }

  function saveNotifs() {
    showSaved('Preferências de notificação salvas!')
  }

  return (
    <div className="flex h-full overflow-hidden">

      {/* Sidebar */}
      <div className="flex w-52 shrink-0 flex-col gap-1 border-r p-4"
        style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
        <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-white/25">Configurações</p>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all text-left ${
              tab === id
                ? 'bg-white/10 font-medium text-white'
                : 'text-white/55 hover:bg-white/[0.06] hover:text-white/80'
            }`}>
            <Icon size={14} strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-auto p-7">

        {/* Toast */}
        {saved && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white"
            style={{ background: 'rgba(16,185,129,0.15)', border: '0.5px solid rgba(16,185,129,0.4)', backdropFilter: 'blur(12px)' }}>
            <Check size={14} className="text-emerald-400" />
            {saved}
          </div>
        )}

        {/* EQUIPE */}
        {tab === 'equipe' && (
          <div className="flex flex-col gap-6 max-w-2xl">
            <div>
              <h2 className="text-[18px] font-bold text-white">Equipe</h2>
              <p className="mt-1 text-sm text-white/40">Gerencie os membros que têm acesso ao Lead Engine</p>
            </div>

            {/* Invite */}
            <div className="rounded-xl p-5" style={{ background: 'rgba(99,102,241,0.08)', border: '0.5px solid rgba(99,102,241,0.25)' }}>
              <p className="mb-3 text-sm font-semibold text-white">Convidar novo membro</p>
              <div className="flex gap-3">
                <div className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2.5"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.10)' }}>
                  <Mail size={14} className="text-white/35" strokeWidth={1.5} />
                  <input placeholder="email@empresa.com.br"
                    className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25" />
                </div>
                <button className="btn-primary flex items-center gap-1.5 text-xs px-4">
                  <Plus size={12} strokeWidth={2} />Convidar
                </button>
              </div>
            </div>

            {/* Members list */}
            <div className="flex flex-col gap-2">
              {team.map(member => (
                <div key={member.id}
                  className="flex items-center gap-4 rounded-xl px-5 py-4"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)' }}>

                  {/* Avatar */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
                    style={{ background: member.cor }}>
                    {member.nome.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-white">{member.nome}</span>
                      {!member.ativo && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-medium text-yellow-400"
                          style={{ background: 'rgba(245,158,11,0.10)' }}>Pendente</span>
                      )}
                    </div>
                    <span className="text-[12px] text-white/45">{member.email}</span>
                  </div>

                  {/* Cargo badge */}
                  <span className="rounded-lg px-2.5 py-1 text-[12px] font-medium text-white/60"
                    style={{ background: 'rgba(255,255,255,0.07)' }}>
                    {member.cargo}
                  </span>

                  {/* Color picker */}
                  <div className="flex items-center gap-1">
                    {MEMBER_COLORS.map(c => (
                      <button key={c.value}
                        onClick={() => setTeam(t => t.map(m => m.id === member.id ? { ...m, cor: c.value } : m))}
                        className="h-4 w-4 rounded-full transition-all hover:scale-110"
                        style={{ background: c.value, outline: member.cor === c.value ? `2px solid ${c.value}` : 'none', outlineOffset: 2 }}
                        title={c.label} />
                    ))}
                  </div>

                  <button className="flex h-7 w-7 items-center justify-center rounded-lg text-white/20 hover:bg-red-500/10 hover:text-red-400 transition-all">
                    <Trash2 size={13} strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>

            <p className="text-[12px] text-white/25">
              {team.filter(m => m.ativo).length} membros ativos · {team.filter(m => !m.ativo).length} pendentes
            </p>
          </div>
        )}

        {/* NOTIFICAÇÕES */}
        {tab === 'notificacoes' && (
          <div className="flex flex-col gap-6 max-w-lg">
            <div>
              <h2 className="text-[18px] font-bold text-white">Notificações</h2>
              <p className="mt-1 text-sm text-white/40">Escolha quais alertas receber por e-mail</p>
            </div>

            <div className="flex flex-col gap-3">
              {NOTIF_OPTIONS.map(({ id, label, desc }) => (
                <div key={id}
                  className="flex items-start gap-4 rounded-xl px-5 py-4 cursor-pointer transition-all hover:bg-white/[0.03]"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)' }}
                  onClick={() => toggleNotif(id)}>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-[14px] font-semibold text-white">{label}</span>
                    <span className="text-[12px] text-white/40">{desc}</span>
                  </div>
                  {/* Toggle */}
                  <div className="relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-all duration-200"
                    style={{ background: notifs[id] ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.12)' }}>
                    <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200"
                      style={{ left: notifs[id] ? '17px' : '2px' }} />
                  </div>
                </div>
              ))}
            </div>

            <button onClick={saveNotifs}
              className="btn-primary flex items-center gap-2 self-start text-sm">
              <Save size={13} strokeWidth={1.5} />Salvar preferências
            </button>
          </div>
        )}

        {/* SEGURANÇA */}
        {tab === 'seguranca' && (
          <div className="flex flex-col gap-6 max-w-lg">
            <div>
              <h2 className="text-[18px] font-bold text-white">Segurança</h2>
              <p className="mt-1 text-sm text-white/40">Gerencie sua senha e sessões ativas</p>
            </div>

            <div className="rounded-xl p-6 flex flex-col gap-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
              <p className="text-[14px] font-semibold text-white">Alterar senha</p>
              {['Senha atual', 'Nova senha', 'Confirmar nova senha'].map(label => (
                <div key={label}>
                  <label className="mb-1.5 block text-[12px] font-medium text-white/45">{label}</label>
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.10)' }}>
                    <Shield size={13} className="text-white/30" strokeWidth={1.5} />
                    <input type="password" placeholder="••••••••"
                      className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/20" />
                  </div>
                </div>
              ))}
              <button onClick={() => showSaved('Senha alterada com sucesso!')}
                className="btn-primary flex items-center gap-2 self-start text-sm">
                <Save size={13} strokeWidth={1.5} />Atualizar senha
              </button>
            </div>

            <div className="rounded-xl p-5"
              style={{ background: 'rgba(239,68,68,0.05)', border: '0.5px solid rgba(239,68,68,0.15)' }}>
              <p className="text-[14px] font-semibold text-white mb-1">Encerrar todas as sessões</p>
              <p className="text-[12px] text-white/40 mb-3">Desconecta todos os dispositivos exceto o atual</p>
              <button className="rounded-lg px-4 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/10"
                style={{ border: '0.5px solid rgba(239,68,68,0.25)' }}>
                Encerrar sessões remotas
              </button>
            </div>
          </div>
        )}

        {/* APARÊNCIA */}
        {tab === 'aparencia' && (
          <div className="flex flex-col gap-6 max-w-lg">
            <div>
              <h2 className="text-[18px] font-bold text-white">Aparência</h2>
              <p className="mt-1 text-sm text-white/40">Personalize o visual da interface</p>
            </div>

            <div className="rounded-xl p-6"
              style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
              <p className="mb-4 text-[14px] font-semibold text-white">Fundo / tema visual</p>
              <p className="text-sm text-white/40">
                Acesse o painel de fundos clicando no botão <span className="text-white/60 font-medium">Fundo</span> na barra superior.
                Você pode escolher entre gradientes, meshes e fundos animados.
              </p>
            </div>

            <div className="rounded-xl p-6"
              style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
              <p className="mb-4 text-[14px] font-semibold text-white">Idioma e região</p>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Idioma', value: 'Português (Brasil)' },
                  { label: 'Fuso horário', value: 'America/Sao_Paulo (UTC-3)' },
                  { label: 'Moeda', value: 'BRL — Real Brasileiro' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[13px] text-white/50">{label}</span>
                    <span className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-white"
                      style={{ background: 'rgba(255,255,255,0.07)' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
