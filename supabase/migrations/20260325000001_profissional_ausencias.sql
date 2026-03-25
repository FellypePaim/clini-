-- Tabela de ausências/folgas de profissionais
CREATE TABLE IF NOT EXISTS public.profissional_ausencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'folga',
  motivo TEXT,
  notificou_pacientes BOOLEAN NOT NULL DEFAULT FALSE,
  consultas_canceladas INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT check_datas CHECK (data_fim >= data_inicio)
);

CREATE INDEX idx_ausencias_clinica ON public.profissional_ausencias(clinica_id);
CREATE INDEX idx_ausencias_profissional ON public.profissional_ausencias(profissional_id, data_inicio, data_fim);
CREATE INDEX idx_ausencias_datas ON public.profissional_ausencias(data_inicio, data_fim);

ALTER TABLE public.profissional_ausencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ausencias_select_clinica"
  ON public.profissional_ausencias FOR SELECT
  TO authenticated
  USING (clinica_id = public.get_my_clinica_id());

CREATE POLICY "ausencias_insert_clinica"
  ON public.profissional_ausencias FOR INSERT
  TO authenticated
  WITH CHECK (clinica_id = public.get_my_clinica_id());

CREATE POLICY "ausencias_update_clinica"
  ON public.profissional_ausencias FOR UPDATE
  TO authenticated
  USING (clinica_id = public.get_my_clinica_id());

CREATE POLICY "ausencias_delete_clinica"
  ON public.profissional_ausencias FOR DELETE
  TO authenticated
  USING (clinica_id = public.get_my_clinica_id());

CREATE POLICY "ausencias_service_role"
  ON public.profissional_ausencias FOR SELECT
  TO service_role
  USING (true);
