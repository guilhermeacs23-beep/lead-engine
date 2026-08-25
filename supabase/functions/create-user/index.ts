import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { email, password, cargo, nome } = await req.json()

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'email e senha são obrigatórios' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Cria o usuário com email já confirmado (sem link de convite)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { cargo: cargo || 'Vendedor', nome: nome || email.split('@')[0] },
    })

    if (error) throw error

    // Atualiza cargo, nome e ativo no profile (criado automaticamente pelo trigger)
    if (data.user) {
      await supabaseAdmin
        .from('profiles')
        .update({
          cargo: cargo || 'Vendedor',
          nome: nome || email.split('@')[0],
          ativo: true,
        })
        .eq('id', data.user.id)
    }

    return new Response(JSON.stringify({ success: true, user_id: data.user?.id, email: data.user?.email }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
