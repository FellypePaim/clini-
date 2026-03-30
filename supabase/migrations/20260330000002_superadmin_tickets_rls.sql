-- SuperAdmin pode ver todos os tickets e mensagens (para badge de não lidos)
DO $$ BEGIN
  CREATE POLICY "tickets_suporte_select_superadmin"
    ON public.tickets_suporte FOR SELECT
    TO authenticated
    USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "tickets_mensagens_select_superadmin"
    ON public.tickets_mensagens FOR SELECT
    TO authenticated
    USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
