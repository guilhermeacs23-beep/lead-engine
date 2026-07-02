import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET() {
  const supabaseAdmin = getAdmin()
  const { data: users, error } = await supabaseAdmin
    .from('profiles')
    .select('*, tenants(nome, ssw_folder)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(users)
}

export async function PATCH(req: NextRequest) {
  const supabaseAdmin = getAdmin()
  const body = await req.json()
  const { id, status, tenant_id, role } = body

  if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (status !== undefined) {
    updates.status = status
    updates.ativo = status === 'active'
  }
  if (tenant_id !== undefined) updates.tenant_id = tenant_id
  if (role !== undefined) updates.role = role

  const { error } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
