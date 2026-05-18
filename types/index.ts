export type LeadStatus =
  | 'novo'
  | 'contactado'
  | 'proposta'
  | 'negociando'
  | 'fechado'
  | 'perdido'

export type LeadSource = 'linkedin' | 'google' | 'cnpj' | 'indicacao' | 'apollo'

export type LeadSegment =
  | 'agronegocio'
  | 'varejo'
  | 'industria'
  | 'farmaceutico'
  | 'moda'
  | 'construcao'
  | 'alimentos'
  | 'logistica'
  | 'tecnologia'

export interface Lead {
  id: string
  empresa: string
  contato_nome: string
  contato_cargo: string
  telefone?: string
  email?: string
  cidade: string
  estado: string
  segmento: LeadSegment
  cnae?: string
  website?: string
  score_ia: number
  observacoes?: string
  status: LeadStatus
  fonte: LeadSource
  valor_estimado?: number // R$/mês
  responsavel_id?: string
  responsavel_nome?: string
  responsavel_iniciais?: string
  responsavel_cor?: string
  created_at: string
  updated_at: string
  tenant_id: string
}

export interface KanbanColumn {
  id: LeadStatus
  title: string
  color: string
  dotColor: string
  leads: Lead[]
  total: number
}

export interface User {
  id: string
  nome: string
  email: string
  iniciais: string
  cor: string
  role: 'admin' | 'vendedor' | 'gerente'
  tenant_id: string
}

export interface Tenant {
  id: string
  nome: string
  plano: 'starter' | 'pro' | 'enterprise'
  bg_theme: string
  bg_image?: string
}

export interface DashboardMetrics {
  leads_mes: number
  leads_delta: number
  valor_pipeline: number
  oportunidades: number
  fechados_mes: number
  valor_fechado: number
  taxa_conversao: number
  taxa_delta: number
}
