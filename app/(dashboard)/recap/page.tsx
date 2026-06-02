'use client'

import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  Users, TrendingUp, Phone, Mail, MapPin, Calendar,
  ChevronDown, ChevronUp, Search, X, CheckCircle,
  XCircle, Clock, Filter, ArrowUpDown, RefreshCw,
  AlertTriangle, Star, Building2, BarChart3
} from 'lucide-react'

/* ════════════════════════════════════════════════════════
   TYPES
════════════════════════════════════════════════════════ */
interface ClienteRecap {
  id: string
  nome: string
  cnpj: string | null
  cfop: string | null
  cidade: string | null
  uf: string | null
  telefone: string | null
  celular: string | null
  email: string | null
  vendedor_codigo: string | null
  ult_movimento: string | null
  dias_inativo: number | null
  score_reativacao: number
  score_recencia: number
  score_contato: number
  score_cfop: number
  score_uf: number
  categoria: 'QUENTE' | 'MORNO' | 'FRIO' | 'PERDIDO'
  status: 'pendente' | 'aprovado' | 'descartado' | 'reativado'
  observacao: string | null
  aprovado_em: string | null
  aprovado_por: string | null
}

/* ════════════════════════════════════════════════════════
   UTILS
════════════════════════════════════════════════════════ */
const CAT_CONFIG = {
  QUENTE:  { label: '🔥 Quente',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.35)' },
  MORNO:   { label: '🟡 Morno',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.35)' },
  FRIO:    { label: '🔵 Frio',    color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.35)' },
  PERDIDO: { label: '❄️ Perdido', color: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.35)' },
}

const STATUS_CONFIG = {
  pendente:   { label: 'Pendente',   color: '#f59e0b' },
  aprovado:   { label: 'Aprovado',   color: '#10b981' },
  descartado: { label: 'Descartado', color: '#6b7280' },
  reativado:  { label: 'Reativado',  color: '#6366f1' },
}

function formatCNPJ(cnpj: string | null) {
  if (!cnpj) return '—'
  const d = cnpj.replace(/\D/g, '')
  if (d.length === 14)
    return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`
  return cnpj
}

function formatPhone(s: string | null) {
  if (!s) return null
  const d = s.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return s
}

function diasLabel(dias: number | null) {
  if (!dias) return '—'
  if (dias < 30)  return `${dias}d`
  if (dias < 365) return `${Math.round(dias/30)}m`
  return `${(dias/365).toFixed(1)}a`
}

function ScoreBadge({ score, categoria }: { score: number; categoria: keyof typeof CAT_CONFIG }) {
  const cfg = CAT_CONFIG[categoria]
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 48, height: 48, borderRadius: 12,
      background: cfg.bg, border: `1.5px solid ${cfg.border}`,
      fontWeight: 700, fontSize: 16, color: cfg.color,
      boxShadow: `0 0 12px ${cfg.bg}`,
      flexShrink: 0,
    }}>
      {score}
    </div>
  )
}

function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
        <span>{label}</span>
        <span style={{ color: 'white', fontWeight: 600 }}>{value}/{max}</span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          width: `${(value/max)*100}%`, height: '100%',
          background: color, borderRadius: 3,
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   DETAIL DRAWER
════════════════════════════════════════════════════════ */
function DetailDrawer({
  cliente, onClose, onApprove, onDiscard, loading
}: {
  cliente: ClienteRecap | null
  onClose: () => void
  onApprove: (id: string) => void
  onDiscard: (id: string) => void
  loading: string | null
}) {
  if (!cliente) return null
  const cfg = CAT_CONFIG[cliente.categoria]

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40, backdropFilter: 'blur(2px)' }}
      />
      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
        background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(40px)',
        borderLeft: '1px solid rgba(255,255,255,0.10)',
        zIndex: 41, overflowY: 'auto', padding: 28,
        display: 'flex', flexDirection: 'column', gap: 24,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <ScoreBadge score={cliente.score_reativacao} categoria={cliente.categoria} />
              <div>
                <span style={{
                  padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
                }}>
                  {cfg.label}
                </span>
              </div>
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'white', margin: 0, lineHeight: 1.3 }}>
              {cliente.nome}
            </h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', margin: '4px 0 0' }}>
              {formatCNPJ(cliente.cnpj)}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.50)', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Score Breakdown */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.45)', marginBottom: 12 }}>Score de Reativação</p>
          <ScoreBar label="Recência"    value={cliente.score_recencia}  max={50} color="#6366f1" />
          <ScoreBar label="Contato"     value={cliente.score_contato}   max={25} color="#10b981" />
          <ScoreBar label="Tipo CFOP"   value={cliente.score_cfop}      max={15} color="#f59e0b" />
          <ScoreBar label="UF Priority" value={cliente.score_uf}        max={10} color="#3b82f6" />
        </div>

        {/* Atividade */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.45)', marginBottom: 12 }}>Atividade</p>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1, textAlign: 'center', padding: '12px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: cfg.color }}>{diasLabel(cliente.dias_inativo)}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Inativo há</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '12px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>
                {cliente.ult_movimento ? new Date(cliente.ult_movimento).toLocaleDateString('pt-BR') : '—'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Último mov.</div>
            </div>
          </div>
        </div>

        {/* Localização */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.45)', marginBottom: 12 }}>Localização</p>
          <InfoRow icon={<MapPin size={14} />} label="Cidade" value={`${cliente.cidade || '—'} / ${cliente.uf || '—'}`} />
          <InfoRow icon={<Building2 size={14} />} label="CFOP" value={cliente.cfop || '—'} />
          {cliente.vendedor_codigo && (
            <InfoRow icon={<Users size={14} />} label="Vendedor" value={`Cód. ${cliente.vendedor_codigo}`} />
          )}
        </div>

        {/* Contato */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.45)', marginBottom: 12 }}>Contato</p>
          {cliente.email ? (
            <InfoRow icon={<Mail size={14} />} label="E-mail" value={cliente.email} />
          ) : (
            <InfoRow icon={<Mail size={14} />} label="E-mail" value="Não cadastrado" muted />
          )}
          {(cliente.telefone || cliente.celular) ? (
            <InfoRow icon={<Phone size={14} />} label="Fone" value={formatPhone(cliente.telefone || cliente.celular) || '—'} />
          ) : (
            <InfoRow icon={<Phone size={14} />} label="Fone" value="Não cadastrado" muted />
          )}
        </div>

        {/* Status */}
        {cliente.status !== 'pendente' && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span style={{ fontSize: 12, color: STATUS_CONFIG[cliente.status].color, fontWeight: 600 }}>
              {STATUS_CONFIG[cliente.status].label}
              {cliente.aprovado_em && ` em ${new Date(cliente.aprovado_em).toLocaleDateString('pt-BR')}`}
            </span>
          </div>
        )}

        {/* Ações */}
        {cliente.status === 'pendente' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
            <button
              onClick={() => onApprove(cliente.id)}
              disabled={loading === cliente.id}
              style={{
                padding: '14px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: loading === cliente.id ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.85)',
                color: 'white', fontWeight: 700, fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
              }}
            >
              <CheckCircle size={16} />
              {loading === cliente.id ? 'Aprovando...' : 'Aprovar → Pipeline'}
            </button>
            <button
              onClick={() => onDiscard(cliente.id)}
              disabled={loading === cliente.id}
              style={{
                padding: '12px 20px', borderRadius: 12, cursor: 'pointer',
                background: 'transparent', color: 'rgba(255,255,255,0.4)',
                border: '1px solid rgba(255,255,255,0.12)', fontWeight: 600, fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
              }}
            >
              <XCircle size={15} />
              Descartar
            </button>
          </div>
        )}
      </div>
    </>
  )
}

function InfoRow({ icon, label, value, muted }: { icon: React.ReactNode; label: string; value: string; muted?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', flexShrink: 0, width: 60 }}>{label}</span>
      <span style={{ fontSize: 12, color: muted ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.85)', wordBreak: 'break-all' }}>{value}</span>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════ */
export default function RecapClientesPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [clientes, setClientes]       = useState<ClienteRecap[]>([])
  const [loading, setLoading]         = useState(true)
  const [actionLoading, setActLoad]   = useState<string | null>(null)
  const [selected, setSelected]       = useState<ClienteRecap | null>(null)
  const [search, setSearch]           = useState('')
  const [filterUF, setFilterUF]       = useState<string>('TODOS')
  const [filterCat, setFilterCat]     = useState<string>('TODOS')
  const [filterStatus, setFilterStatus] = useState<string>('pendente')
  const [sortBy, setSortBy]           = useState<'score' | 'dias' | 'nome'>('score')
  const [sortDir, setSortDir]         = useState<'desc' | 'asc'>('desc')
  const [page, setPage]               = useState(0)
  const PER_PAGE = 50

  /* ── Fetch ── */
  const fetchData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('clientes_recap')
      .select('*')
      .order('score_reativacao', { ascending: false })
    if (!error && data) setClientes(data as ClienteRecap[])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  /* ── KPIs ── */
  const kpis = useMemo(() => {
    const all     = clientes
    const targets = all.filter(c => c.dias_inativo && c.dias_inativo >= 91 && c.dias_inativo <= 365)
    return {
      total:      all.length,
      targets:    targets.length,
      quentes:    all.filter(c => c.categoria === 'QUENTE').length,
      mornos:     all.filter(c => c.categoria === 'MORNO').length,
      comEmail:   all.filter(c => c.email).length,
      aprovados:  all.filter(c => c.status === 'aprovado').length,
      pendentes:  all.filter(c => c.status === 'pendente').length,
    }
  }, [clientes])

  /* ── Filter + Sort ── */
  const filtered = useMemo(() => {
    let list = [...clientes]
    if (filterStatus !== 'TODOS') list = list.filter(c => c.status === filterStatus)
    if (filterUF !== 'TODOS')     list = list.filter(c => c.uf === filterUF)
    if (filterCat !== 'TODOS')    list = list.filter(c => c.categoria === filterCat)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.nome.toLowerCase().includes(q) ||
        (c.cnpj || '').includes(q) ||
        (c.cidade || '').toLowerCase().includes(q)
      )
    }
    list.sort((a, b) => {
      let va: number | string = 0, vb: number | string = 0
      if (sortBy === 'score') { va = a.score_reativacao; vb = b.score_reativacao }
      if (sortBy === 'dias')  { va = a.dias_inativo || 0; vb = b.dias_inativo || 0 }
      if (sortBy === 'nome')  { va = a.nome; vb = b.nome }
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va)
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number)
    })
    return list
  }, [clientes, filterStatus, filterUF, filterCat, search, sortBy, sortDir])

  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const ufs = useMemo(() => ['TODOS', ...Array.from(new Set(clientes.map(c => c.uf).filter(Boolean))).sort()], [clientes])

  /* ── Actions ── */
  const handleApprove = async (id: string) => {
    setActLoad(id)
    const cliente = clientes.find(c => c.id === id)
    if (!cliente) return

    // 1. Create lead in pipeline
    const { data: lead } = await supabase.from('leads').insert({
      tenant_id:      '00000000-0000-0000-0000-000000000001',
      nome_empresa:   cliente.nome,
      responsavel:    cliente.nome,
      email:          cliente.email || '',
      telefone:       cliente.telefone || cliente.celular || '',
      etapa:          'qualificacao',
      prioridade:     cliente.categoria === 'QUENTE' ? 'alta' : cliente.categoria === 'MORNO' ? 'media' : 'baixa',
      valor_estimado: 0,
      origem:         'recap_clientes',
      observacoes:    `Reativação — Inativo há ${cliente.dias_inativo} dias. Score: ${cliente.score_reativacao}/100`,
    }).select().single()

    // 2. Update recap status
    await supabase.from('clientes_recap').update({
      status:          'aprovado',
      aprovado_em:     new Date().toISOString(),
      pipeline_lead_id: lead?.id || null,
    }).eq('id', id)

    setClientes(prev => prev.map(c => c.id === id ? { ...c, status: 'aprovado', aprovado_em: new Date().toISOString() } : c))
    setSelected(null)
    setActLoad(null)
  }

  const handleDiscard = async (id: string) => {
    setActLoad(id)
    await supabase.from('clientes_recap').update({ status: 'descartado' }).eq('id', id)
    setClientes(prev => prev.map(c => c.id === id ? { ...c, status: 'descartado' } : c))
    setSelected(null)
    setActLoad(null)
  }

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('desc') }
  }

  /* ── Render ── */
  const glass = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <RefreshCw size={32} style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: 'rgba(255,255,255,0.50)' }}>Carregando base de clientes...</p>
    </div>
  )

  if (clientes.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 20, textAlign: 'center' }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Users size={32} style={{ color: '#6366f1' }} />
      </div>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white', margin: '0 0 8px' }}>Base ainda não importada</h2>
        <p style={{ color: 'rgba(255,255,255,0.40)', maxWidth: 400 }}>
          Execute o script <strong style={{ color: 'white' }}>import_clientes_recap.py</strong> com suas credenciais do Supabase para importar a base do SSW.
        </p>
      </div>
    </div>
  )

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'white', margin: 0 }}>Recap de Clientes</h1>
          <p style={{ color: 'rgba(255,255,255,0.40)', margin: '4px 0 0', fontSize: 14 }}>
            {kpis.total.toLocaleString('pt-BR')} clientes · {kpis.targets.toLocaleString('pt-BR')} alvos de reativação
          </p>
        </div>
        <button
          onClick={fetchData}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total na Base',    value: kpis.total.toLocaleString('pt-BR'),    icon: <Users size={18} />,      color: '#6366f1' },
          { label: '🔥 Quentes',       value: kpis.quentes.toLocaleString('pt-BR'),  icon: <TrendingUp size={18} />, color: '#ef4444' },
          { label: '🟡 Mornos',        value: kpis.mornos.toLocaleString('pt-BR'),   icon: <BarChart3 size={18} />,  color: '#f59e0b' },
          { label: 'Com Contato',      value: `${Math.round(kpis.comEmail/kpis.total*100)}%`, icon: <Mail size={18} />, color: '#10b981' },
          { label: 'Aprovados',        value: kpis.aprovados.toLocaleString('pt-BR'), icon: <CheckCircle size={18} />, color: '#10b981' },
        ].map(k => (
          <div key={k.label} style={{ ...glass, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ color: k.color }}>{k.icon}</div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.label}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'white' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div style={{ ...glass, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Buscar por nome, CNPJ ou cidade..."
            style={{ width: '100%', padding: '9px 12px 9px 34px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {[
          { label: 'Status', value: filterStatus, set: setFilterStatus, opts: [['TODOS','Todos os status'],['pendente','Pendentes'],['aprovado','Aprovados'],['descartado','Descartados']] },
          { label: 'Categoria', value: filterCat, set: setFilterCat, opts: [['TODOS','Todas'],['QUENTE','🔥 Quente'],['MORNO','🟡 Morno'],['FRIO','🔵 Frio'],['PERDIDO','❄️ Perdido']] },
          { label: 'UF', value: filterUF, set: setFilterUF, opts: ufs.map(u => [u, u === 'TODOS' ? 'Todos os estados' : u]) },
        ].map(f => (
          <select
            key={f.label}
            value={f.value}
            onChange={e => { f.set(e.target.value); setPage(0) }}
            style={{ padding: '9px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, color: 'white', fontSize: 13, cursor: 'pointer', minWidth: 150 }}
          >
            {f.opts.map(([val, lbl]) => (
              <option key={val} value={val} style={{ background: '#0f0c1a' }}>{lbl}</option>
            ))}
          </select>
        ))}

        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
          {filtered.length.toLocaleString('pt-BR')} resultado{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Tabela ── */}
      <div style={{ ...glass, overflow: 'hidden' }}>
        {/* Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr 140px 90px 90px 100px 110px', gap: 0, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
          {[
            { key: 'score', label: 'Score' },
            { key: 'nome',  label: 'Cliente' },
            { key: null,    label: 'CNPJ' },
            { key: null,    label: 'UF' },
            { key: 'dias',  label: 'Inativo' },
            { key: null,    label: 'Contato' },
            { key: null,    label: 'Status' },
          ].map((col, i) => (
            <div
              key={i}
              onClick={col.key ? () => toggleSort(col.key as typeof sortBy) : undefined}
              style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'rgba(255,255,255,0.30)', cursor: col.key ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 4, userSelect: 'none' }}
            >
              {col.label}
              {col.key && sortBy === col.key && (
                sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />
              )}
            </div>
          ))}
        </div>

        {/* Rows */}
        {paginated.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
            Nenhum cliente encontrado com os filtros atuais
          </div>
        ) : (
          paginated.map((c, idx) => {
            const cfg = CAT_CONFIG[c.categoria]
            const scfg = STATUS_CONFIG[c.status]
            return (
              <div
                key={c.id}
                onClick={() => setSelected(c)}
                style={{
                  display: 'grid', gridTemplateColumns: '56px 1fr 140px 90px 90px 100px 110px',
                  gap: 0, padding: '14px 20px',
                  borderBottom: idx < paginated.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  cursor: 'pointer', transition: 'background 0.15s',
                  background: selected?.id === c.id ? 'rgba(99,102,241,0.06)' : 'transparent',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = selected?.id === c.id ? 'rgba(99,102,241,0.06)' : 'transparent')}
              >
                {/* Score */}
                <div><ScoreBadge score={c.score_reativacao} categoria={c.categoria} /></div>

                {/* Nome */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nome}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{c.cidade || '—'}</span>
                </div>

                {/* CNPJ */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                    {c.cnpj ? c.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') : '—'}
                  </span>
                </div>

                {/* UF */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.08)', fontSize: 12, fontWeight: 700, color: 'white' }}>
                    {c.uf || '—'}
                  </span>
                </div>

                {/* Dias inativo */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>
                    {diasLabel(c.dias_inativo)}
                  </span>
                </div>

                {/* Contato icons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mail size={14} style={{ color: c.email ? '#10b981' : 'rgba(255,255,255,0.15)' }} title={c.email || 'Sem e-mail'} />
                  <Phone size={14} style={{ color: (c.telefone || c.celular) ? '#10b981' : 'rgba(255,255,255,0.15)' }} title={c.telefone || c.celular || 'Sem telefone'} />
                </div>

                {/* Status */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, color: scfg.color, background: `${scfg.color}18`, border: `1px solid ${scfg.color}40` }}>
                    {scfg.label}
                  </span>
                </div>
              </div>
            )
          })
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              Página {page + 1} de {totalPages} · {filtered.length.toLocaleString('pt-BR')} registros
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: page === 0 ? 'rgba(255,255,255,0.2)' : 'white', cursor: page === 0 ? 'default' : 'pointer', fontSize: 12 }}>
                ← Anterior
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: page === totalPages - 1 ? 'rgba(255,255,255,0.2)' : 'white', cursor: page === totalPages - 1 ? 'default' : 'pointer', fontSize: 12 }}>
                Próxima →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail Drawer ── */}
      <DetailDrawer
        cliente={selected}
        onClose={() => setSelected(null)}
        onApprove={handleApprove}
        onDiscard={handleDiscard}
        loading={actionLoading}
      />

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
