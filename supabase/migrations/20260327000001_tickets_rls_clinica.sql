-- =====================================================
-- RLS policies para tickets_suporte e tickets_mensagens
-- Permite que usuários da clínica gerenciem seus tickets
-- =====================================================

-- Habilitar RLS (idempotente)
ALTER TABLE public.tickets_suporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets_mensagens ENABLE ROW LEVEL SECURITY;

-- ─── tickets_suporte ─────────────────────────────────

-- Clínica pode ver seus próprios tickets
CREATE POLICY "tickets_suporte_select_clinica"
  ON public.tickets_suporte FOR SELECT
  TO authenticated
  USING (clinica_id = public.get_my_clinica_id());

-- Clínica pode criar tickets vinculados a ela
CREATE POLICY "tickets_suporte_insert_clinica"
  ON public.tickets_suporte FOR INSERT
  TO authenticated
  WITH CHECK (clinica_id = public.get_my_clinica_id());

-- ─── tickets_mensagens ───────────────────────────────

-- Usuários podem ver mensagens dos tickets da sua clínica
CREATE POLICY "tickets_mensagens_select_clinica"
  ON public.tickets_mensagens FOR SELECT
  TO authenticated
  USING (
    ticket_id IN (
      SELECT id FROM public.tickets_suporte
      WHERE clinica_id = public.get_my_clinica_id()
    )
  );

-- Usuários podem enviar mensagens nos tickets da sua clínica
CREATE POLICY "tickets_mensagens_insert_clinica"
  ON public.tickets_mensagens FOR INSERT
  TO authenticated
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM public.tickets_suporte
      WHERE clinica_id = public.get_my_clinica_id()
    )
    AND autor_id = auth.uid()
  );
