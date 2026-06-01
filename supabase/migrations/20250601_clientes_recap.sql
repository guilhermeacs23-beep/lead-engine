-- ═══════════════════════════════════════════════════════════
--  LEAD ENGINE — Módulo Recap de Clientes
--  Migration: tabela clientes_recap
--  Execute no Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.clientes_recap (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID        NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,

  -- Identificação
  nome             TEXT        NOT NULL,
  cnpj             TEXT,
  cfop             TEXT,

  -- Localização
  endereco         TEXT,
  numero           TEXT,
  bairro           TEXT,
  cep              TEXT,
  cidade           TEXT,
  uf               TEXT,
  latitude         NUMERIC(10,7),
  longitude        NUMERIC(10,7),

  -- Contato
  telefone         TEXT,
  celular          TEXT,
  email            TEXT,

  -- Comercial
  vendedor_codigo  TEXT,
  classificacao    TEXT,
  cnae             TEXT,

  -- Atividade
  ult_movimento    DATE,
  dias_inativo     INTEGER,

  -- Score breakdown (0–100 total)
  score_reativacao INTEGER     NOT NULL DEFAULT 0,
  score_recencia   INTEGER     NOT NULL DEFAULT 0,   -- 0-50
  score_contato    INTEGER     NOT NULL DEFAULT 0,   -- 0-25
  score_cfop       INTEGER     NOT NULL DEFAULT 0,   -- 0-15
  score_uf         INTEGER     NOT NULL DEFAULT 0,   -- 0-10

  -- Categoria calculada
  categoria        TEXT        CHECK (categoria IN ('QUENTE','MORNO','FRIO','PERDIDO')),

  -- Status no pipeline de aprovação
  status           TEXT        NOT NULL DEFAULT 'pendente'
                               CHECK (status IN ('pendente','aprovado','descartado','reativado')),
  aprovado_em      TIMESTAMPTZ,
  aprovado_por     TEXT,
  pipeline_lead_id UUID,       -- FK para leads quando aprovado
  observacao       TEXT,

  -- Metadata
  importado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (tenant_id, cnpj)
);

-- ── Índices ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_recap_tenant   ON public.clientes_recap (tenant_id);
CREATE INDEX IF NOT EXISTS idx_recap_uf       ON public.clientes_recap (uf);
CREATE INDEX IF NOT EXISTS idx_recap_score    ON public.clientes_recap (score_reativacao DESC);
CREATE INDEX IF NOT EXISTS idx_recap_status   ON public.clientes_recap (status);
CREATE INDEX IF NOT EXISTS idx_recap_categoria ON public.clientes_recap (categoria);
CREATE INDEX IF NOT EXISTS idx_recap_dias     ON public.clientes_recap (dias_inativo);
CREATE INDEX IF NOT EXISTS idx_recap_nome     ON public.clientes_recap USING gin(to_tsvector('portuguese', nome));

-- ── RLS ──────────────────────────────────────────────────
ALTER TABLE public.clientes_recap ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_recap" ON public.clientes_recap;
CREATE POLICY "tenant_isolation_recap" ON public.clientes_recap
  USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- ── Trigger updated_at ───────────────────────────────────
CREATE OR REPLACE FUNCTION update_clientes_recap_ts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recap_updated_at ON public.clientes_recap;
CREATE TRIGGER trg_recap_updated_at
  BEFORE UPDATE ON public.clientes_recap
  FOR EACH ROW EXECUTE FUNCTION update_clientes_recap_ts();

-- ── View: resumo por UF ──────────────────────────────────
CREATE OR REPLACE VIEW public.recap_resumo_uf AS
SELECT
  uf,
  COUNT(*)                                         AS total,
  COUNT(*) FILTER (WHERE categoria = 'QUENTE')     AS quentes,
  COUNT(*) FILTER (WHERE categoria = 'MORNO')      AS mornos,
  COUNT(*) FILTER (WHERE categoria = 'FRIO')       AS frios,
  COUNT(*) FILTER (WHERE status = 'aprovado')      AS aprovados,
  ROUND(AVG(score_reativacao))                     AS score_medio,
  COUNT(*) FILTER (WHERE email IS NOT NULL AND email != '') AS com_email
FROM public.clientes_recap
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
GROUP BY uf
ORDER BY quentes DESC, total DESC;
