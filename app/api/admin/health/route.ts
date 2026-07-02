import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  try {
    const [
      { count: totalUsers },
      { count: activeUsers },
      { count: totalTenants },
      { count: totalLeads },
      { count: totalClientes },
      { count: fieldLocations },
      { count: fieldStops },
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabaseAdmin.from('tenants').select('*', { count: 'exact', head: true }).eq('ativo', true),
      supabaseAdmin.from('leads').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('clientes_recap').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('field_locations').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('field_stops').select('*', { count: 'exact', head: true }),
    ])

    const { data: cats } = await supabaseAdmin
      .from('clientes_recap')
      .select('categoria')

    const distribuicao: Record<string, number> = {}
    cats?.forEach((r: { categoria: string }) => {
      distribuicao[r.categoria] = (distribuicao[r.categoria] ?? 0) + 1
    })

    const { data: lastSync } = await supabaseAdmin
      .from('clientes_recap')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      usuarios: { total: totalUsers ?? 0, ativos: activeUsers ?? 0 },
      tenants: totalTenants ?? 0,
      leads: totalLeads ?? 0,
      clientes_recap: {
        total: totalClientes ?? 0,
        distribuicao,
        ultima_sync: lastSync?.updated_at ?? null,
      },
      campo: {
        locations: fieldLocations ?? 0,
        stops: fieldStops ?? 0,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
