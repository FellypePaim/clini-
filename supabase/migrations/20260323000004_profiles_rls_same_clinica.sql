-- Permitir que usuários leiam profiles da mesma clínica
-- Necessário para a página de profissionais e seleção de profissional na agenda

DROP POLICY IF EXISTS "users_read_same_clinica" ON public.profiles;
CREATE POLICY "users_read_same_clinica"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    clinica_id IS NOT NULL
    AND clinica_id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid())
  );
