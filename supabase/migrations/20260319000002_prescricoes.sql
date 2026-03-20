-- ============================================================
-- Módulo Prescrições Digitais: tabela prescricoes (idempotente)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.prescricoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='prescricoes' AND column_name='clinica_id') THEN
    ALTER TABLE public.prescricoes ADD COLUMN clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='prescricoes' AND column_name='paciente_id') THEN
    ALTER TABLE public.prescricoes ADD COLUMN paciente_id uuid REFERENCES public.pacientes(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='prescricoes' AND column_name='profissional_id') THEN
    ALTER TABLE public.prescricoes ADD COLUMN profissional_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='prescricoes' AND column_name='conteudo') THEN
    ALTER TABLE public.prescricoes ADD COLUMN conteudo text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='prescricoes' AND column_name='assinatura_hash') THEN
    ALTER TABLE public.prescricoes ADD COLUMN assinatura_hash text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='prescricoes' AND column_name='status') THEN
    ALTER TABLE public.prescricoes ADD COLUMN status text NOT NULL DEFAULT 'ativa';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='prescricoes' AND column_name='created_at') THEN
    ALTER TABLE public.prescricoes ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='prescricoes' AND column_name='updated_at') THEN
    ALTER TABLE public.prescricoes ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

ALTER TABLE public.prescricoes DROP CONSTRAINT IF EXISTS prescricoes_status_check;
ALTER TABLE public.prescricoes ADD CONSTRAINT prescricoes_status_check CHECK (status IN ('ativa', 'cancelada'));

CREATE INDEX IF NOT EXISTS prescricoes_clinica_id_idx ON public.prescricoes (clinica_id);
CREATE INDEX IF NOT EXISTS prescricoes_paciente_idx ON public.prescricoes (clinica_id, paciente_id);
CREATE INDEX IF NOT EXISTS prescricoes_data_idx ON public.prescricoes (clinica_id, created_at DESC);

DROP TRIGGER IF EXISTS prescricoes_updated_at ON public.prescricoes;
CREATE TRIGGER prescricoes_updated_at
  BEFORE UPDATE ON public.prescricoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.prescricoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prescricoes_clinica_isolamento" ON public.prescricoes;
CREATE POLICY "prescricoes_clinica_isolamento"
  ON public.prescricoes FOR ALL
  USING (clinica_id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid()));
