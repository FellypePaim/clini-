-- Permitir que admins da clínica atualizem os dados da própria clínica
CREATE POLICY "clinica_update_own"
  ON public.clinicas FOR UPDATE
  TO authenticated
  USING (
    id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid())
  );
