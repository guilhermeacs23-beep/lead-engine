-- ============================================================
-- LEAD ENGINE — Schema completo do banco de dados
-- Cole este arquivo no SQL Editor do Supabase e execute
-- ============================================================

-- Extensões necessárias
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- busca por texto

-- ============================================================
-- TENANTS (empresas que usam o sistema)
-- ============================================================
create table if not exists tenants (
  id          uuid primary key default uuid_generate_v4(),
  nome        text not null,
  plano       text not null default 'starter' check (plano in ('starter','pro','enterprise')),
  bg_theme    text not null default 'bg-cosmos',
  bg_image    text,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Tenant padrão para desenvolvimento
insert into tenants (id, nome, plano) values
  ('00000000-0000-0000-0000-000000000001', 'Transportadora EBT', 'pro')
on conflict do nothing;

-- ============================================================
-- PROFILES (usuários vinculados ao Supabase Auth)
-- ============================================================
create table if not exists profiles (
  id          uuid primary key references auth.users on delete cascade,
  tenant_id   uuid not null references tenants(id) on delete cascade,
  nome        text not null,
  iniciais    text not null,
  cor         text not null default '#6366f1',
  role        text not null default 'vendedor' check (role in ('admin','gerente','vendedor')),
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- LEADS
-- ============================================================
create table if not exists leads (
  id               uuid primary key default uuid_generate_v4(),
  tenant_id        uuid not null references tenants(id) on delete cascade,

  -- Empresa
  empresa          text not null,
  cnpj             text,
  cnae             text,
  website          text,
  segmento         text not null,
  porte            text check (porte in ('pequena','media','grande')),

  -- Localização
  cidade           text not null,
  estado           text not null,
  cep              text,
  endereco         text,

  -- Contato
  contato_nome     text not null,
  contato_cargo    text not null,
  telefone         text,
  email            text,
  linkedin_url     text,

  -- CRM
  status           text not null default 'novo'
                   check (status in ('novo','contactado','proposta','negociando','fechado','perdido')),
  fonte            text not null
                   check (fonte in ('linkedin','google','cnpj','indicacao','apollo','manual')),
  valor_estimado   numeric(12,2),          -- R$/mês estimado de frete
  responsavel_id   uuid references profiles(id),
  observacoes      text,

  -- IA
  score_ia         integer not null default 0 check (score_ia between 0 and 100),
  ia_resumo        text,                   -- resumo da empresa gerado pela IA
  ia_abordagem     text,                   -- sugestão de abordagem gerada pela IA
  ia_produtos      text,                   -- produtos/cargas identificados pela IA
  ia_processado    boolean default false,  -- já foi processado pela IA?

  -- Controle
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Índices para performance
create index if not exists leads_tenant_id_idx    on leads(tenant_id);
create index if not exists leads_status_idx       on leads(status);
create index if not exists leads_segmento_idx     on leads(segmento);
create index if not exists leads_responsavel_idx  on leads(responsavel_id);
create index if not exists leads_empresa_trgm_idx on leads using gin(empresa gin_trgm_ops);

-- ============================================================
-- ATIVIDADES (histórico de interações)
-- ============================================================
create table if not exists atividades (
  id           uuid primary key default uuid_generate_v4(),
  lead_id      uuid not null references leads(id) on delete cascade,
  tenant_id    uuid not null references tenants(id) on delete cascade,
  autor_id     uuid references profiles(id),
  tipo         text not null check (tipo in ('nota','ligacao','email','reuniao','proposta','status')),
  descricao    text not null,
  created_at   timestamptz not null default now()
);

create index if not exists atividades_lead_id_idx on atividades(lead_id);

-- ============================================================
-- TAREFAS (follow-ups e próximas ações)
-- ============================================================
create table if not exists tarefas (
  id             uuid primary key default uuid_generate_v4(),
  lead_id        uuid not null references leads(id) on delete cascade,
  tenant_id      uuid not null references tenants(id) on delete cascade,
  responsavel_id uuid references profiles(id),
  titulo         text not null,
  prazo          timestamptz,
  concluida      boolean not null default false,
  created_at     timestamptz not null default now()
);

-- ============================================================
-- TRIGGER: atualiza updated_at automaticamente nos leads
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists leads_updated_at on leads;
create trigger leads_updated_at
  before update on leads
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (cada empresa vê só seus dados)
-- ============================================================
alter table tenants    enable row level security;
alter table profiles   enable row level security;
alter table leads      enable row level security;
alter table atividades enable row level security;
alter table tarefas    enable row level security;

-- Policies: usuário autenticado acessa apenas dados do seu tenant
create policy "tenant_isolation_leads" on leads
  for all using (
    tenant_id = (
      select tenant_id from profiles where id = auth.uid()
    )
  );

create policy "tenant_isolation_atividades" on atividades
  for all using (
    tenant_id = (
      select tenant_id from profiles where id = auth.uid()
    )
  );

create policy "tenant_isolation_tarefas" on tarefas
  for all using (
    tenant_id = (
      select tenant_id from profiles where id = auth.uid()
    )
  );

create policy "profiles_own" on profiles
  for all using (id = auth.uid());

create policy "tenants_own" on tenants
  for all using (
    id = (select tenant_id from profiles where id = auth.uid())
  );

-- ============================================================
-- DADOS MOCK para testar sem autenticação ainda
-- (remover em produção)
-- ============================================================
insert into leads (tenant_id, empresa, segmento, cidade, estado, contato_nome, contato_cargo, fonte, status, score_ia, valor_estimado, telefone, email)
values
  ('00000000-0000-0000-0000-000000000001','Agro Minas Distribuidora','agronegocio','Uberlândia','MG','Cláudia Ramos','Dir. Operações','linkedin','novo',92,42000,'(34) 99999-1234','claudia@agrominas.com.br'),
  ('00000000-0000-0000-0000-000000000001','Têxtil Catarinense SA','moda','Blumenau','SC','Roberto Faria','Gerente Compras','google','novo',74,18000,'(47) 98888-5678',null),
  ('00000000-0000-0000-0000-000000000001','Pharma Nordeste Ltda','farmaceutico','Fortaleza','CE','Luíza Ferreira','Suprimentos','cnpj','novo',81,25000,null,'luiza@pharmanordeste.com.br'),
  ('00000000-0000-0000-0000-000000000001','Cerealista Planalto','agronegocio','Rondonópolis','MT','Juliana Barros','Dir. Logística','linkedin','contactado',88,18000,'(66) 97777-9012',null),
  ('00000000-0000-0000-0000-000000000001','Varejo Sul Atacado','varejo','Porto Alegre','RS','Pedro Neto','Dir. Logística','linkedin','proposta',85,42000,'(51) 96666-3456','pedro@varejosulatacado.com.br'),
  ('00000000-0000-0000-0000-000000000001','Grupo Fashion Brasil','moda','São Paulo','SP','Beatriz Costa','CEO','indicacao','negociando',91,56000,'(11) 95555-7890','beatriz@grupofashion.com.br'),
  ('00000000-0000-0000-0000-000000000001','Farmácias Bem Estar','farmaceutico','Curitiba','PR','Isabela Moura','Logística','indicacao','fechado',82,7000,'(41) 94444-2345',null),
  ('00000000-0000-0000-0000-000000000001','Supermercados Bom Preço','varejo','Fortaleza','CE','Carlos Mendes','Dir. Logística','linkedin','fechado',75,11000,null,'carlos@bompreco.com.br')
on conflict do nothing;
