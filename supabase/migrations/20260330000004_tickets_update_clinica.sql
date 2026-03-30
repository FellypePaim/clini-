-- Clínica pode atualizar seus próprios tickets (reabrir, avaliar)
DO $$ BEGIN
  CREATE POLICY "tickets_suporte_update_clinica"
    ON public.tickets_suporte FOR UPDATE
    TO authenticated
    USING (clinica_id = public.get_my_clinica_id())
    WITH CHECK (clinica_id = public.get_my_clinica_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
