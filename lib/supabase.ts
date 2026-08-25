import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(supabaseUrl, supabaseAnon)

export const TENANT_ID = '00000000-0000-0000-0000-000000000001'

// ── Leads ────────────────────────────────────────────────────

export async function fetchLeads(filters?: {
  segmento?: string
  estado?:   string
  fontes?:   string[]
  query?:    string
}) {
  let q = supabase
    .from('leads')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('score_ia', { ascending: false })

  if (filters?.segmento)                           q = q.eq('segmento', filters.segmento)
  if (filters?.estado && filters.estado !== 'Todos') q = q.eq('estado', filters.estado)
  if (filters?.fontes?.length)                     q = q.in('fonte', filters.fontes)
  if (filters?.query)                              q = q.ilike('empresa', `%${filters.query}%`)

  const { data, error } = await q
  if (error) { console.error('fetchLeads:', error); return [] }
  return data ?? []
}

export async function fetchLeadsByStatus() {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })

  if (error) { console.error('fetchLeadsByStatus:', error); return [] }
  return data ?? []
}

export async function updateLeadStatus(id: string, newStatus: string, oldStatus?: string): Promise<boolean> {
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('leads')
    .update({ status: newStatus, etapa_em: now })
    .eq('id', id)
  if (error) { console.error('updateLeadStatus:', error); return false }

  // Grava histórico de movimentação
  await supabase.from('pipeline_historico').insert({
    lead_id:    id,
    etapa_de:   oldStatus || null,
    etapa_para: newStatus,
    criado_em:  now,
  })

  return true
}

export async function saveLeadNotes(id: string, observacoes: string): Promise<boolean> {
  const { error } = await supabase
    .from('leads')
    .update({ observacoes })
    .eq('id', id)
  if (error) { console.error('saveLeadNotes:', error); return false }
  return true
}

export async function fetchDashboardMetrics() {
  const { data, error } = await supabase
    .from('leads')
    .select('status, valor_estimado, score_ia, created_at, fonte')
    .eq('tenant_id', TENANT_ID)

  if (error || !data) return null

  const now       = new Date()
  const mesAtual  = data.filter(l => new Date(l.created_at).getMonth() === now.getMonth())
  const fechados  = data.filter(l => l.status === 'fechado')
  const pipeline  = data.filter(l => !['fechado', 'perdido'].includes(l.status))
  const conversao = data.length > 0 ? (fechados.length / data.length) * 100 : 0

  const fonteCounts: Record<string, number> = {}
  data.forEach(l => { fonteCounts[l.fonte] = (fonteCounts[l.fonte] ?? 0) + 1 })
  const total = data.length || 1
  const por_fonte = Object.entries(fonteCounts).map(([fonte, n]) => ({
    fonte,
    pct: Math.round((n / total) * 100),
  }))

  return {
    leads_mes:      mesAtual.length,
    leads_delta:    18,
    valor_pipeline: pipeline.reduce((s, l) => s + (l.valor_estimado ?? 0), 0),
    oportunidades:  pipeline.length,
    fechados_mes:   fechados.length,
    valor_fechado:  fechados.reduce((s, l) => s + (l.valor_estimado ?? 0), 0),
    taxa_conversao: Math.round(conversao * 10) / 10,
    taxa_delta:     -1.2,
    por_fonte,
  }
}

// ── Funil ─────────────────────────────────────────────────────

const FUNNEL_STEPS = ['novo', 'contactado', 'proposta', 'negociando', 'fechado'] as const

export async function fetchFunnelData() {
  const { data, error } = await supabase
    .from('leads')
    .select('status, valor_estimado')
    .eq('tenant_id', TENANT_ID)

  if (error || !data) return []

  const counts: Record<string, { count: number; valor: number }> = {}
  FUNNEL_STEPS.forEach(s => { counts[s] = { count: 0, valor: 0 } })

  data.forEach(l => {
    if (counts[l.status]) {
      counts[l.status].count++
      counts[l.status].valor += l.valor_estimado ?? 0
    }
  })

  return FUNNEL_STEPS.map((step, i) => {
    const curr = counts[step].count
    const prev = i > 0 ? counts[FUNNEL_STEPS[i - 1]].count : curr
    const pct  = prev > 0 ? Math.round((curr / prev) * 100) : 0
    return {
      step,
      count: curr,
      valor: counts[step].valor,
      pct_conversao: i === 0 ? 100 : pct,
    }
  })
}

export async function fetchActivitiesStats() {
  const { data, error } = await supabase
    .from('atividades')
    .select('tipo, created_at')
    .eq('tenant_id', TENANT_ID)

  if (error || !data) return { total: 0, por_tipo: [] }

  const tipos: Record<string, number> = {}
  data.forEach(a => { tipos[a.tipo] = (tipos[a.tipo] ?? 0) + 1 })

  const TIPO_COLORS: Record<string, string> = {
    ligacao:  '#60a5fa',
    email:    '#34d399',
    reuniao:  '#fbbf24',
    nota:     '#a78bfa',
    proposta: '#f472b6',
    status:   '#94a3b8',
  }

  const por_tipo = Object.entries(tipos).map(([tipo, count]) => ({
    tipo,
    count,
    color: TIPO_COLORS[tipo] ?? '#94a3b8',
  }))

  return { total: data.length, por_tipo }
}

// ── Atividades ────────────────────────────────────────────────

export interface Activity {
  id: string
  lead_id: string
  tenant_id: string
  autor_id: string | null
  autor_nome?: string | null
  tipo: 'nota' | 'ligacao' | 'email' | 'reuniao' | 'proposta' | 'status'
  descricao: string
  created_at: string
}

export async function fetchActivities(leadId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('atividades')
    .select('*, profiles(nome)')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })

  if (error) { console.error('fetchActivities:', error); return [] }

  return (data ?? []).map((a: any) => ({
    ...a,
    autor_nome: a.profiles?.nome ?? null,
  }))
}

export async function addActivity(
  leadId: string,
  tipo: Activity['tipo'],
  descricao: string,
  autorId?: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('atividades')
    .insert({
      lead_id:   leadId,
      tenant_id: TENANT_ID,
      tipo,
      descricao,
      autor_id:  autorId ?? null,
    })
  if (error) { console.error('addActivity:', error); return false }
  return true
}

// ── Atividades do calendário ──────────────────────────────────

export async function fetchCalendarActivities(year: number, month: number): Promise<Activity[]> {
  const start = new Date(year, month - 1, 1).toISOString()
  const end   = new Date(year, month, 1).toISOString()
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .gte('created_at', start)
    .lt('created_at', end)
    .order('created_at', { ascending: true })
  if (error) { console.error('fetchCalendarActivities:', error); return [] }
  return (data || []) as Activity[]
}

// ── Criar lead manualmente ────────────────────────────────────

export async function createLead(data: {
  empresa: string
  contato_nome: string
  contato_cargo: string
  telefone?: string
  email?: string
  cidade: string
  estado: string
  segmento: string
  fonte: string
  valor_estimado?: number
  website?: string
  status?: string
}): Promise<boolean> {
  const { error } = await supabase
    .from('leads')
    .insert({
      ...data,
      tenant_id:  TENANT_ID,
      status:     data.status ?? 'novo',
      score_ia:   70,
    })
  if (error) { console.error('createLead:', error); return false }
  return true
}

// ── Busca global ──────────────────────────────────────────────

export async function searchLeads(query: string) {
  if (!query.trim()) return []
  const { data, error } = await supabase
    .from('leads')
    .select('id, empresa, contato_nome, cidade, estado, status, score_ia, valor_estimado')
    .eq('tenant_id', TENANT_ID)
    .or(`empresa.ilike.%${query}%,contato_nome.ilike.%${query}%,cidade.ilike.%${query}%`)
    .limit(8)
  if (error) { console.error('searchLeads:', error); return [] }
  return data ?? []
}

// ── Perfis da equipe ─────────────────────────────────────────

export async function fetchProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('created_at')
  if (error) { console.error('fetchProfiles:', error); return [] }
  return data ?? []
}

export async function updateProfile(id: string, fields: { nome?: string; cor?: string }) {
  const { error } = await supabase.from('profiles').update(fields).eq('id', id)
  return !error
}

// ── Pipeline histórico ────────────────────────────────────────

export interface PipelineHistory {
  id: string
  lead_id: string
  etapa_de: string | null
  etapa_para: string
  criado_em: string
}

export async function fetchPipelineHistory(leadId: string): Promise<PipelineHistory[]> {
  const { data, error } = await supabase
    .from('pipeline_historico')
    .select('*')
    .eq('lead_id', leadId)
    .order('criado_em', { ascending: true })
  if (error) { console.error('fetchPipelineHistory:', error); return [] }
  return (data || []) as PipelineHistory[]
}

export async function updateLeadResponsavel(leadId: string, responsavelId: string | null): Promise<boolean> {
  const { error } = await supabase
    .from('leads')
    .update({ responsavel_id: responsavelId })
    .eq('id', leadId)
  if (error) { console.error('updateLeadResponsavel:', error); return false }
  return true
}
