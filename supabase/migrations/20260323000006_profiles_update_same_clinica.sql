-- Permitir que admins atualizem profiles da mesma clínica
DROP POLICY IF EXISTS "users_update_same_clinica" ON public.profiles;
CREATE POLICY "users_update_same_clinica"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    OR (clinica_id IS NOT NULL AND clinica_id = public.get_my_clinica_id())
  )
  WITH CHECK (
    id = auth.uid()
    OR (clinica_id IS NOT NULL AND clinica_id = public.get_my_clinica_id())
  );
