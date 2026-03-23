-- Tabela de sinais vitais registrados por consulta
CREATE TABLE IF NOT EXISTS public.sinais_vitais (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  consulta_id uuid REFERENCES public.consultas(id) ON DELETE SET NULL,
  profissional_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

  pressao_sistolica integer,    -- mmHg
  pressao_diastolica integer,   -- mmHg
  frequencia_cardiaca integer,  -- bpm
  saturacao_o2 integer,         -- %
  temperatura numeric(4,1),     -- °C
  peso numeric(5,1),            -- kg
  altura numeric(4,1),          -- cm
  imc numeric(4,1),             -- calculado
  escala_dor integer,           -- 0-10
  observacoes text,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sinais_vitais_paciente ON public.sinais_vitais(paciente_id, created_at DESC);

ALTER TABLE public.sinais_vitais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sinais_vitais_clinica_isolamento"
  ON public.sinais_vitais FOR ALL
  TO authenticated
  USING (clinica_id = public.get_my_clinica_id())
  WITH CHECK (clinica_id = public.get_my_clinica_id());

-- Adicionar campo de condições estruturadas no paciente
ALTER TABLE public.pacientes ADD COLUMN IF NOT EXISTS condicoes_medicas jsonb DEFAULT '[]'::jsonb;
