-- ============================================================
-- Módulo Prescrições Digitais: tabela prescricoes
-- ============================================================

CREATE TABLE IF NOT EXISTS public.prescricoes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id        uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  paciente_id       uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  profissional_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  conteudo          text NOT NULL,
  assinatura_hash   text NOT NULL,
  status            text NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'cancelada')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS prescricoes_clinica_id_idx ON public.prescricoes (clinica_id);
CREATE INDEX IF NOT EXISTS prescricoes_paciente_idx ON public.prescricoes (clinica_id, paciente_id);
CREATE INDEX IF NOT EXISTS prescricoes_data_idx ON public.prescricoes (clinica_id, created_at DESC);

-- Trigger updated_at
DROP TRIGGER IF EXISTS prescricoes_updated_at ON public.prescricoes;
CREATE TRIGGER prescricoes_updated_at
  BEFORE UPDATE ON public.prescricoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.prescricoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prescricoes_clinica_isolamento" ON public.prescricoes;
CREATE POLICY "prescricoes_clinica_isolamento"
  ON public.prescricoes
  FOR ALL
  USING (
    clinica_id IN (
      SELECT clinica_id FROM public.profiles WHERE id = auth.uid()
    )
  );
