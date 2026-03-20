-- ============================================================
-- Módulo Financeiro: tabela lancamentos
-- ============================================================

CREATE TABLE IF NOT EXISTS public.lancamentos (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id        uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  paciente_id       uuid REFERENCES public.pacientes(id) ON DELETE SET NULL,
  profissional_id   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  descricao         text NOT NULL,
  valor             numeric(12, 2) NOT NULL DEFAULT 0,
  tipo              text NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  categoria         text NOT NULL DEFAULT 'Outros',
  data_competencia  date NOT NULL,
  status            text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
  convenio          text,
  observacoes       text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS lancamentos_clinica_id_idx ON public.lancamentos (clinica_id);
CREATE INDEX IF NOT EXISTS lancamentos_data_idx ON public.lancamentos (clinica_id, data_competencia DESC);
CREATE INDEX IF NOT EXISTS lancamentos_tipo_idx ON public.lancamentos (clinica_id, tipo);

-- Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lancamentos_updated_at ON public.lancamentos;
CREATE TRIGGER lancamentos_updated_at
  BEFORE UPDATE ON public.lancamentos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lancamentos_clinica_isolamento" ON public.lancamentos;
CREATE POLICY "lancamentos_clinica_isolamento"
  ON public.lancamentos
  FOR ALL
  USING (
    clinica_id IN (
      SELECT clinica_id FROM public.profiles WHERE id = auth.uid()
    )
  );
