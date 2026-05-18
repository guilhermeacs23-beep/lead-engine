import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente público (browser)
export const supabase = createClient(supabaseUrl, supabaseAnon)

// Tipos do banco (expandir conforme o schema crescer)
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
