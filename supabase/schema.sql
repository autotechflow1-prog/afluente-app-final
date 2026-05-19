-- =============================================================
-- Afluente Ops — SQL para executar no Supabase Studio
-- As tabelas bling_products, bling_pedidos, bling_pedido_itens
-- e marketplaces já existem. Execute apenas o que está abaixo.
-- =============================================================

-- ---------------------------------------------------------------
-- 1. Tabela de status dos produtos por marketplace
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS produto_marketplace_status (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id          uuid REFERENCES bling_products(id) ON DELETE CASCADE,
  marketplace_id      uuid REFERENCES marketplaces(id) ON DELETE CASCADE,
  upload_feito        boolean DEFAULT false,
  especificacoes      boolean DEFAULT false,
  descricao           boolean DEFAULT false,
  foto                boolean DEFAULT false,
  preco               numeric,
  observacao          text,
  atualizado_em       timestamptz DEFAULT now(),
  UNIQUE(produto_id, marketplace_id)
);

-- ---------------------------------------------------------------
-- 2. Trigger de atualização automática do atualizado_em
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pms_atualizado_em ON produto_marketplace_status;
CREATE TRIGGER trg_pms_atualizado_em
  BEFORE UPDATE ON produto_marketplace_status
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

-- ---------------------------------------------------------------
-- 3. View: resumo de vendas por canal e dia
-- ---------------------------------------------------------------
CREATE OR REPLACE VIEW vw_pedidos_por_canal AS
SELECT
  p.data_pedido,
  p.unidade_negocio_id,
  p.situacao_nome,
  COUNT(*)                                  AS total_pedidos,
  SUM(i.quantidade)                         AS total_pecas,
  SUM(p.total_pedido)                       AS receita_bruta,
  SUM(p.total_produtos)                     AS valor_produtos,
  AVG(p.total_pedido)                       AS ticket_medio,
  COUNT(DISTINCT p.contato_documento)       AS clientes_unicos
FROM bling_pedidos p
LEFT JOIN bling_pedido_itens i ON i.pedido_bling_id = p.id
GROUP BY p.data_pedido, p.unidade_negocio_id, p.situacao_nome;

-- ---------------------------------------------------------------
-- 4. View: ranking de SKUs mais vendidos
-- ---------------------------------------------------------------
CREATE OR REPLACE VIEW vw_skus_ranking AS
SELECT
  i.item_codigo                                                         AS sku,
  i.item_descricao                                                      AS nome,
  SUM(i.quantidade)                                                     AS pecas_vendidas,
  COUNT(DISTINCT p.id)                                                  AS pedidos,
  SUM(p.total_pedido)                                                   AS receita_estimada,
  COUNT(CASE WHEN p.situacao_nome ILIKE '%cancelad%' THEN 1 END)::float
    / NULLIF(COUNT(*), 0)                                               AS taxa_cancelamento
FROM bling_pedido_itens i
JOIN bling_pedidos p ON p.id = i.pedido_bling_id
GROUP BY i.item_codigo, i.item_descricao
ORDER BY receita_estimada DESC;

-- ---------------------------------------------------------------
-- 5. View: clientes com múltiplos pedidos (recompra)
-- ---------------------------------------------------------------
CREATE OR REPLACE VIEW vw_clientes_recompra AS
SELECT
  contato_documento,
  contato_nome,
  COUNT(*)          AS total_pedidos,
  SUM(total_pedido) AS ltv_total,
  MIN(data_pedido)  AS primeira_compra,
  MAX(data_pedido)  AS ultima_compra
FROM bling_pedidos
WHERE situacao_nome NOT ILIKE '%cancelad%'
  AND contato_documento IS NOT NULL
GROUP BY contato_documento, contato_nome;

-- ---------------------------------------------------------------
-- 6. RLS (Row Level Security) — habilite conforme sua política
--    Exemplo: apenas usuários autenticados lêem/escrevem
-- ---------------------------------------------------------------
-- ALTER TABLE produto_marketplace_status ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "auth_all" ON produto_marketplace_status
--   FOR ALL USING (auth.role() = 'authenticated');
