-- Permitir que qualquer usuário autenticado crie uma clínica (durante registro de admin)
-- Após criar, o RLS normal (clinica_id match) se aplica para leitura/update

DROP POLICY IF EXISTS "authenticated_insert_clinica" ON public.clinicas;
CREATE POLICY "authenticated_insert_clinica"
  ON public.clinicas FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Permitir que o admin leia a clínica que acabou de criar (precisa do id retornado)
DROP POLICY IF EXISTS "users_read_own_clinica" ON public.clinicas;
CREATE POLICY "users_read_own_clinica"
  ON public.clinicas FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid())
  );
