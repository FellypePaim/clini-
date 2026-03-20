-- ============================================================
-- Módulo Estoque: produtos_estoque, estoque_movimentacoes,
--                 pedidos_compra, procedimento_insumos
-- ============================================================

-- ── Produtos ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.produtos_estoque (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id      uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  codigo          text,
  nome            text NOT NULL,
  categoria       text NOT NULL DEFAULT 'Geral',
  unidade         text NOT NULL DEFAULT 'Unidade',
  estoque_atual   numeric(12, 3) NOT NULL DEFAULT 0,
  estoque_minimo  numeric(12, 3) NOT NULL DEFAULT 0,
  validade        date,
  custo_unitario  numeric(12, 2) NOT NULL DEFAULT 0,
  fornecedor      text,
  localizacao     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS produtos_estoque_clinica_idx ON public.produtos_estoque (clinica_id);
CREATE INDEX IF NOT EXISTS produtos_estoque_nome_idx ON public.produtos_estoque (clinica_id, nome);

DROP TRIGGER IF EXISTS produtos_estoque_updated_at ON public.produtos_estoque;
CREATE TRIGGER produtos_estoque_updated_at
  BEFORE UPDATE ON public.produtos_estoque
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.produtos_estoque ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "produtos_estoque_isolamento" ON public.produtos_estoque;
CREATE POLICY "produtos_estoque_isolamento"
  ON public.produtos_estoque FOR ALL
  USING (clinica_id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid()));


-- ── Movimentações ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.estoque_movimentacoes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id    uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  produto_id    uuid NOT NULL REFERENCES public.produtos_estoque(id) ON DELETE CASCADE,
  produto_nome  text NOT NULL,
  tipo          text NOT NULL CHECK (tipo IN ('Entrada', 'Saída', 'Ajuste', 'Perda')),
  quantidade    numeric(12, 3) NOT NULL,
  motivo        text,
  responsavel   text,
  vinculado_a   text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS estoque_mov_clinica_idx ON public.estoque_movimentacoes (clinica_id);
CREATE INDEX IF NOT EXISTS estoque_mov_produto_idx ON public.estoque_movimentacoes (produto_id);
CREATE INDEX IF NOT EXISTS estoque_mov_data_idx ON public.estoque_movimentacoes (clinica_id, created_at DESC);

ALTER TABLE public.estoque_movimentacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "estoque_movimentacoes_isolamento" ON public.estoque_movimentacoes;
CREATE POLICY "estoque_movimentacoes_isolamento"
  ON public.estoque_movimentacoes FOR ALL
  USING (clinica_id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid()));


-- ── Pedidos de Compra ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pedidos_compra (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id     uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  produto_id     uuid NOT NULL REFERENCES public.produtos_estoque(id) ON DELETE CASCADE,
  fornecedor     text,
  quantidade     numeric(12, 3) NOT NULL,
  data_prevista  date,
  status         text NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Enviado', 'Recebido', 'Cancelado')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pedidos_compra_clinica_idx ON public.pedidos_compra (clinica_id);

DROP TRIGGER IF EXISTS pedidos_compra_updated_at ON public.pedidos_compra;
CREATE TRIGGER pedidos_compra_updated_at
  BEFORE UPDATE ON public.pedidos_compra
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.pedidos_compra ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pedidos_compra_isolamento" ON public.pedidos_compra;
CREATE POLICY "pedidos_compra_isolamento"
  ON public.pedidos_compra FOR ALL
  USING (clinica_id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid()));


-- ── Regras de Consumo por Procedimento ───────────────────────
CREATE TABLE IF NOT EXISTS public.procedimento_insumos (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id         uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  procedimento_nome  text NOT NULL,
  produto_id         uuid NOT NULL REFERENCES public.produtos_estoque(id) ON DELETE CASCADE,
  quantidade         numeric(12, 3) NOT NULL DEFAULT 1,
  ativo              boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS procedimento_insumos_clinica_idx ON public.procedimento_insumos (clinica_id);

ALTER TABLE public.procedimento_insumos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "procedimento_insumos_isolamento" ON public.procedimento_insumos;
CREATE POLICY "procedimento_insumos_isolamento"
  ON public.procedimento_insumos FOR ALL
  USING (clinica_id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid()));
