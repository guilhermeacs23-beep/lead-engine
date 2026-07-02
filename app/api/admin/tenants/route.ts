import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET() {
  const supabaseAdmin = getAdmin()
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = getAdmin()
  const body = await req.json()
  const { nome, ssw_folder, email, telefone, contato, plano } = body

  if (!nome) return NextResponse.json({ error: 'nome obrigatorio' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('tenants')
    .insert({ nome, ssw_folder, email, telefone, contato, plano: plano ?? 'basico', ativo: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const supabaseAdmin = getAdmin()
  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('tenants')
    .update(updates)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
