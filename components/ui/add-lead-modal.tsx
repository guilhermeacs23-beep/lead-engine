'use client'
import { useState } from 'react'
import { createLead } from '@/lib/supabase'
import { X, Loader2, Building2, User, Phone, Mail, MapPin, Tag, DollarSign, Globe } from 'lucide-react'

const SEGMENTOS = [
  { value: 'agronegocio',  label: 'Agronegócio'   },
  { value: 'varejo',       label: 'Varejo'         },
  { value: 'industria',    label: 'Indústria'      },
  { value: 'farmaceutico', label: 'Farmacêutico'   },
  { value: 'moda',         label: 'Moda / Têxtil'  },
  { value: 'construcao',   label: 'Construção'     },
  { value: 'alimentos',    label: 'Alimentos'      },
  { value: 'logistica',    label: 'Logística'      },
  { value: 'tecnologia',   label: 'Tecnologia'     },
]

const FONTES = [
  { value: 'linkedin',  label: 'LinkedIn Sales Navigator' },
  { value: 'google',    label: 'Google Maps'              },
  { value: 'cnpj',      label: 'Base CNPJ (Receita)'      },
  { value: 'indicacao', label: 'Indicação'                },
  { value: 'apollo',    label: 'Apollo.io'                },
]

const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

const STATUS_OPTS = [
  { value: 'novo',       label: 'Novo Lead'   },
  { value: 'contactado', label: 'Contactado'  },
  { value: 'proposta',   label: 'Proposta'    },
  { value: 'negociando', label: 'Negociando'  },
]

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export function AddLeadModal({ open, onClose, onCreated }: Props) {
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const [form, setForm] = useState({
    empresa: '', contato_nome: '', contato_cargo: '', telefone: '',
    email: '', cidade: '', estado: 'SP', segmento: 'agronegocio',
    fonte: 'linkedin', valor_estimado: '', website: '', status: 'novo',
  })

  function set(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.empresa.trim() || !form.contato_nome.trim() || !form.cidade.trim()) {
      setError('Preencha empresa, contato e cidade.')
      return
    }
    setSaving(true)
    const ok = await createLead({
      ...form,
      valor_estimado: form.valor_estimado ? Number(form.valor_estimado) : undefined,
    })
    setSaving(false)
    if (!ok) { setError('Erro ao salvar. Tente novamente.'); return }
    setForm({ empresa: '', contato_nome: '', contato_cargo: '', telefone: '',
      email: '', cidade: '', estado: 'SP', segmento: 'agronegocio',
      fonte: 'linkedin', valor_estimado: '', website: '', status: 'novo' })
    onCreated()
    onClose()
  }

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-[480px] flex-col"
        style={{ background: 'rgba(12,10,30,0.97)', backdropFilter: 'blur(32px)',
          borderLeft: '0.5px solid rgba(255,255,255,0.12)', boxShadow: '-20px 0 60px rgba(0,0,0,0.5)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
          <div>
            <h2 className="text-[16px] font-bold text-white">Novo Lead</h2>
            <p className="text-[12px] text-white/40">Adicionar manualmente ao pipeline</p>
          </div>
          <button onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 hover:bg-white/10 hover:text-white/70 transition-all">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex flex-col gap-5 p-6">

            {/* Empresa */}
            <Section label="Empresa">
              <Field icon={<Building2 size={14} strokeWidth={1.5} />} label="Nome da empresa *">
                <input value={form.empresa} onChange={e => set('empresa', e.target.value)}
                  placeholder="Ex: Agro Minas Distribuidora" required className={input} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field icon={<Tag size={14} strokeWidth={1.5} />} label="Segmento *">
                  <select value={form.segmento} onChange={e => set('segmento', e.target.value)} className={input}>
                    {SEGMENTOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </Field>
                <Field icon={<Globe size={14} strokeWidth={1.5} />} label="Website">
                  <input value={form.website} onChange={e => set('website', e.target.value)}
                    placeholder="www.empresa.com.br" className={input} />
                </Field>
              </div>
            </Section>

            {/* Contato */}
            <Section label="Contato">
              <Field icon={<User size={14} strokeWidth={1.5} />} label="Nome do contato *">
                <input value={form.contato_nome} onChange={e => set('contato_nome', e.target.value)}
                  placeholder="Ex: Maria Silva" required className={input} />
              </Field>
              <Field icon={<User size={14} strokeWidth={1.5} />} label="Cargo">
                <input value={form.contato_cargo} onChange={e => set('contato_cargo', e.target.value)}
                  placeholder="Ex: Diretora de Logística" className={input} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field icon={<Phone size={14} strokeWidth={1.5} />} label="Telefone">
                  <input value={form.telefone} onChange={e => set('telefone', e.target.value)}
                    placeholder="(11) 99999-9999" className={input} />
                </Field>
                <Field icon={<Mail size={14} strokeWidth={1.5} />} label="E-mail">
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="contato@empresa.com" className={input} />
                </Field>
              </div>
            </Section>

            {/* Localização */}
            <Section label="Localização">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Field icon={<MapPin size={14} strokeWidth={1.5} />} label="Cidade *">
                    <input value={form.cidade} onChange={e => set('cidade', e.target.value)}
                      placeholder="Ex: São Paulo" required className={input} />
                  </Field>
                </div>
                <Field icon={<MapPin size={14} strokeWidth={1.5} />} label="UF *">
                  <select value={form.estado} onChange={e => set('estado', e.target.value)} className={input}>
                    {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </Field>
              </div>
            </Section>

            {/* Negócio */}
            <Section label="Negócio">
              <div className="grid grid-cols-2 gap-3">
                <Field icon={<DollarSign size={14} strokeWidth={1.5} />} label="Potencial mensal (R$)">
                  <input type="number" value={form.valor_estimado} onChange={e => set('valor_estimado', e.target.value)}
                    placeholder="Ex: 25000" min="0" className={input} />
                </Field>
                <Field icon={<Tag size={14} strokeWidth={1.5} />} label="Fonte">
                  <select value={form.fonte} onChange={e => set('fonte', e.target.value)} className={input}>
                    {FONTES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </Field>
              </div>
              <Field icon={<Tag size={14} strokeWidth={1.5} />} label="Etapa inicial">
                <select value={form.status} onChange={e => set('status', e.target.value)} className={input}>
                  {STATUS_OPTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
            </Section>

            {error && (
              <p className="rounded-xl px-4 py-2.5 text-sm text-red-400"
                style={{ background: 'rgba(239,68,68,0.10)', border: '0.5px solid rgba(239,68,68,0.25)' }}>
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-5 mt-auto"
            style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl py-3 text-sm font-medium text-white/60 transition-all hover:bg-white/[0.07]"
              style={{ border: '0.5px solid rgba(255,255,255,0.12)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}>
              {saving ? <><Loader2 size={14} className="animate-spin" />Salvando…</> : 'Criar Lead'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

const input = 'w-full rounded-lg px-3 py-2 text-sm text-white/85 outline-none placeholder:text-white/25 bg-transparent'

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/30">{label}</p>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-white/50">
        <span className="text-white/30">{icon}</span>{label}
      </label>
      <div className="rounded-xl px-3 py-0.5"
        style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.10)' }}>
        {children}
      </div>
    </div>
  )
}
