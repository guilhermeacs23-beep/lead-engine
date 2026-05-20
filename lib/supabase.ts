import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnon)

// Tenant fixo por enquanto (antes de implementar auth completo)
export const TENANT_ID = '00000000-0000-0000-0000-000000000001'

// -- Leads ----------------------------------------------------

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

  if (filters?.segmento)                      q = q.eq('segmento', filters.segmento)
  if (filters?.estado && filters.estado !== 'Todos') q = q.eq('estado', filters.estado)
  if (filters?.fontes?.length)                q = q.in('fonte', filters.fontes)
  if (filters?.query)                         q = q.ilike('empresa', `%${filters.query}%`)

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

export async function updateLeadStatus(id: string, status: string) {
  const { error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', id)
  if (error) console.error('updateLeadStatus:', error)
  return !error
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

  // Contagem por fonte
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

// -- Funil / Insights ----------------------------------------─

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

// -- Tipos do banco
export type Database = {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string
          empresa: string
          contato_nome: string
          contato_cargo: string
          telefone: string | null
          email: string | null
          cidade: string
          estado: string
          segmento: string
          cnae: string | null
          website: string | null
          score_ia: number
          observacoes: string | null
          status: string
          fonte: string
          valor_estimado: number | null
          responsavel_id: string | null
          ia_resumo: string | null
          ia_abordagem: string | null
          ia_produtos: string | null
          tenant_id: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['leads']['Insert']>
      }
    }
  }
}
