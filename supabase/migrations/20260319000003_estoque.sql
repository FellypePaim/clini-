-- ============================================================
-- Módulo Estoque (idempotente)
-- ============================================================

-- ── produtos_estoque ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.produtos_estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='produtos_estoque' AND column_name='clinica_id') THEN
    ALTER TABLE public.produtos_estoque ADD COLUMN clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='produtos_estoque' AND column_name='codigo') THEN
    ALTER TABLE public.produtos_estoque ADD COLUMN codigo text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='produtos_estoque' AND column_name='nome') THEN
    ALTER TABLE public.produtos_estoque ADD COLUMN nome text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='produtos_estoque' AND column_name='categoria') THEN
    ALTER TABLE public.produtos_estoque ADD COLUMN categoria text NOT NULL DEFAULT 'Geral';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='produtos_estoque' AND column_name='unidade') THEN
    ALTER TABLE public.produtos_estoque ADD COLUMN unidade text NOT NULL DEFAULT 'Unidade';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='produtos_estoque' AND column_name='estoque_atual') THEN
    ALTER TABLE public.produtos_estoque ADD COLUMN estoque_atual numeric(12,3) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='produtos_estoque' AND column_name='estoque_minimo') THEN
    ALTER TABLE public.produtos_estoque ADD COLUMN estoque_minimo numeric(12,3) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='produtos_estoque' AND column_name='validade') THEN
    ALTER TABLE public.produtos_estoque ADD COLUMN validade date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='produtos_estoque' AND column_name='custo_unitario') THEN
    ALTER TABLE public.produtos_estoque ADD COLUMN custo_unitario numeric(12,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='produtos_estoque' AND column_name='fornecedor') THEN
    ALTER TABLE public.produtos_estoque ADD COLUMN fornecedor text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='produtos_estoque' AND column_name='localizacao') THEN
    ALTER TABLE public.produtos_estoque ADD COLUMN localizacao text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='produtos_estoque' AND column_name='created_at') THEN
    ALTER TABLE public.produtos_estoque ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='produtos_estoque' AND column_name='updated_at') THEN
    ALTER TABLE public.produtos_estoque ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS produtos_estoque_clinica_idx ON public.produtos_estoque (clinica_id);
CREATE INDEX IF NOT EXISTS produtos_estoque_nome_idx ON public.produtos_estoque (clinica_id, nome);

DROP TRIGGER IF EXISTS produtos_estoque_updated_at ON public.produtos_estoque;
CREATE TRIGGER produtos_estoque_updated_at
  BEFORE UPDATE ON public.produtos_estoque
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.produtos_estoque ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "produtos_estoque_isolamento" ON public.produtos_estoque;
CREATE POLICY "produtos_estoque_isolamento" ON public.produtos_estoque FOR ALL
  USING (clinica_id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid()));


-- ── estoque_movimentacoes ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.estoque_movimentacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='estoque_movimentacoes' AND column_name='clinica_id') THEN
    ALTER TABLE public.estoque_movimentacoes ADD COLUMN clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='estoque_movimentacoes' AND column_name='produto_id') THEN
    ALTER TABLE public.estoque_movimentacoes ADD COLUMN produto_id uuid REFERENCES public.produtos_estoque(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='estoque_movimentacoes' AND column_name='produto_nome') THEN
    ALTER TABLE public.estoque_movimentacoes ADD COLUMN produto_nome text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='estoque_movimentacoes' AND column_name='tipo') THEN
    ALTER TABLE public.estoque_movimentacoes ADD COLUMN tipo text NOT NULL DEFAULT 'Entrada';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='estoque_movimentacoes' AND column_name='quantidade') THEN
    ALTER TABLE public.estoque_movimentacoes ADD COLUMN quantidade numeric(12,3) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='estoque_movimentacoes' AND column_name='motivo') THEN
    ALTER TABLE public.estoque_movimentacoes ADD COLUMN motivo text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='estoque_movimentacoes' AND column_name='responsavel') THEN
    ALTER TABLE public.estoque_movimentacoes ADD COLUMN responsavel text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='estoque_movimentacoes' AND column_name='vinculado_a') THEN
    ALTER TABLE public.estoque_movimentacoes ADD COLUMN vinculado_a text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='estoque_movimentacoes' AND column_name='created_at') THEN
    ALTER TABLE public.estoque_movimentacoes ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- Nota: coluna 'tipo' pode ser ENUM (stock_movement_type) — sem CHECK constraint adicional

CREATE INDEX IF NOT EXISTS estoque_mov_clinica_idx ON public.estoque_movimentacoes (clinica_id);
CREATE INDEX IF NOT EXISTS estoque_mov_produto_idx ON public.estoque_movimentacoes (produto_id);
CREATE INDEX IF NOT EXISTS estoque_mov_data_idx ON public.estoque_movimentacoes (clinica_id, created_at DESC);

ALTER TABLE public.estoque_movimentacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "estoque_movimentacoes_isolamento" ON public.estoque_movimentacoes;
CREATE POLICY "estoque_movimentacoes_isolamento" ON public.estoque_movimentacoes FOR ALL
  USING (clinica_id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid()));


-- ── pedidos_compra ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pedidos_compra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pedidos_compra' AND column_name='clinica_id') THEN
    ALTER TABLE public.pedidos_compra ADD COLUMN clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pedidos_compra' AND column_name='produto_id') THEN
    ALTER TABLE public.pedidos_compra ADD COLUMN produto_id uuid REFERENCES public.produtos_estoque(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pedidos_compra' AND column_name='fornecedor') THEN
    ALTER TABLE public.pedidos_compra ADD COLUMN fornecedor text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pedidos_compra' AND column_name='quantidade') THEN
    ALTER TABLE public.pedidos_compra ADD COLUMN quantidade numeric(12,3) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pedidos_compra' AND column_name='data_prevista') THEN
    ALTER TABLE public.pedidos_compra ADD COLUMN data_prevista date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pedidos_compra' AND column_name='status') THEN
    ALTER TABLE public.pedidos_compra ADD COLUMN status text NOT NULL DEFAULT 'Pendente';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pedidos_compra' AND column_name='created_at') THEN
    ALTER TABLE public.pedidos_compra ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pedidos_compra' AND column_name='updated_at') THEN
    ALTER TABLE public.pedidos_compra ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS pedidos_compra_clinica_idx ON public.pedidos_compra (clinica_id);

DROP TRIGGER IF EXISTS pedidos_compra_updated_at ON public.pedidos_compra;
CREATE TRIGGER pedidos_compra_updated_at
  BEFORE UPDATE ON public.pedidos_compra
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.pedidos_compra ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pedidos_compra_isolamento" ON public.pedidos_compra;
CREATE POLICY "pedidos_compra_isolamento" ON public.pedidos_compra FOR ALL
  USING (clinica_id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid()));


-- ── procedimento_insumos ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.procedimento_insumos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='procedimento_insumos' AND column_name='clinica_id') THEN
    ALTER TABLE public.procedimento_insumos ADD COLUMN clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='procedimento_insumos' AND column_name='procedimento_nome') THEN
    ALTER TABLE public.procedimento_insumos ADD COLUMN procedimento_nome text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='procedimento_insumos' AND column_name='produto_id') THEN
    ALTER TABLE public.procedimento_insumos ADD COLUMN produto_id uuid REFERENCES public.produtos_estoque(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='procedimento_insumos' AND column_name='quantidade') THEN
    ALTER TABLE public.procedimento_insumos ADD COLUMN quantidade numeric(12,3) NOT NULL DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='procedimento_insumos' AND column_name='ativo') THEN
    ALTER TABLE public.procedimento_insumos ADD COLUMN ativo boolean NOT NULL DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='procedimento_insumos' AND column_name='created_at') THEN
    ALTER TABLE public.procedimento_insumos ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS procedimento_insumos_clinica_idx ON public.procedimento_insumos (clinica_id);

ALTER TABLE public.procedimento_insumos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "procedimento_insumos_isolamento" ON public.procedimento_insumos;
CREATE POLICY "procedimento_insumos_isolamento" ON public.procedimento_insumos FOR ALL
  USING (clinica_id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid()));
