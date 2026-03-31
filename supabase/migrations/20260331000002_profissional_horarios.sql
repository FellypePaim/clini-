-- Horários de trabalho por profissional
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS horario_inicio TIME DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS horario_fim TIME DEFAULT '18:00',
  ADD COLUMN IF NOT EXISTS dias_atendimento INTEGER[] DEFAULT '{1,2,3,4,5}';
-- dias_atendimento: 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab

COMMENT ON COLUMN public.profiles.horario_inicio IS 'Hora inicio expediente do profissional';
COMMENT ON COLUMN public.profiles.horario_fim IS 'Hora fim expediente do profissional';
COMMENT ON COLUMN public.profiles.dias_atendimento IS 'Dias da semana que atende: 0=Dom 1=Seg 2=Ter 3=Qua 4=Qui 5=Sex 6=Sab';
