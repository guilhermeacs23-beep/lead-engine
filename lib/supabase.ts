import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnon)

// Tenant fixo por enquanto (antes de implementar auth completo)
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

  if (filters?.segmento)                      q = q.eq('segmento', filters.segmento)
  if (filters?.estado && filters.estado !== 'Todos') q = q.eq('estado', filters.estado)
  if (filters?.fontes?.length)                q = q.in('fonte', filters.fontes)
  if (filters?.query)                         q = q.ilike('empresa', `%${filters.query}%`)

  const { data, error } = await q
  if (error) { con