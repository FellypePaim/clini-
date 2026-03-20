-- ============================================================
-- Módulo Financeiro: tabela lancamentos (idempotente)
-- ============================================================

-- Função set_updated_at (pode já existir)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Cria tabela se não existir
CREATE TABLE IF NOT EXISTS public.lancamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Adiciona colunas faltantes com segurança
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='lancamentos' AND column_name='clinica_id') THEN
    ALTER TABLE public.lancamentos ADD COLUMN clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='lancamentos' AND column_name='paciente_id') THEN
    ALTER TABLE public.lancamentos ADD COLUMN paciente_id uuid REFERENCES public.pacientes(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='lancamentos' AND column_name='profissional_id') THEN
    ALTER TABLE public.lancamentos ADD COLUMN profissional_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='lancamentos' AND column_name='descricao') THEN
    ALTER TABLE public.lancamentos ADD COLUMN descricao text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='lancamentos' AND column_name='valor') THEN
    ALTER TABLE public.lancamentos ADD COLUMN valor numeric(12,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='lancamentos' AND column_name='tipo') THEN
    ALTER TABLE public.lancamentos ADD COLUMN tipo text NOT NULL DEFAULT 'receita';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='lancamentos' AND column_name='categoria') THEN
    ALTER TABLE public.lancamentos ADD COLUMN categoria text NOT NULL DEFAULT 'Outros';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='lancamentos' AND column_name='data_competencia') THEN
    ALTER TABLE public.lancamentos ADD COLUMN data_competencia date NOT NULL DEFAULT CURRENT_DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='lancamentos' AND column_name='status') THEN
    ALTER TABLE public.lancamentos ADD COLUMN status text NOT NULL DEFAULT 'pendente';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='lancamentos' AND column_name='convenio') THEN
    ALTER TABLE public.lancamentos ADD COLUMN convenio text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='lancamentos' AND column_name='observacoes') THEN
    ALTER TABLE public.lancamentos ADD COLUMN observacoes text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='lancamentos' AND column_name='created_at') THEN
    ALTER TABLE public.lancamentos ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='lancamentos' AND column_name='updated_at') THEN
    ALTER TABLE public.lancamentos ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- Constraints de CHECK (recria se necessário)
ALTER TABLE public.lancamentos DROP CONSTRAINT IF EXISTS lancamentos_tipo_check;
ALTER TABLE public.lancamentos ADD CONSTRAINT lancamentos_tipo_check CHECK (tipo IN ('receita', 'despesa'));

ALTER TABLE public.lancamentos DROP CONSTRAINT IF EXISTS lancamentos_status_check;
ALTER TABLE public.lancamentos ADD CONSTRAINT lancamentos_status_check CHECK (status IN ('pendente', 'pago', 'cancelado'));

-- Índices
CREATE INDEX IF NOT EXISTS lancamentos_clinica_id_idx ON public.lancamentos (clinica_id);
CREATE INDEX IF NOT EXISTS lancamentos_data_idx ON public.lancamentos (clinica_id, data_competencia DESC);
CREATE INDEX IF NOT EXISTS lancamentos_tipo_idx ON public.lancamentos (clinica_id, tipo);

-- Trigger updated_at
DROP TRIGGER IF EXISTS lancamentos_updated_at ON public.lancamentos;
CREATE TRIGGER lancamentos_updated_at
  BEFORE UPDATE ON public.lancamentos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lancamentos_clinica_isolamento" ON public.lancamentos;
CREATE POLICY "lancamentos_clinica_isolamento"
  ON public.lancamentos FOR ALL
  USING (clinica_id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid()));
