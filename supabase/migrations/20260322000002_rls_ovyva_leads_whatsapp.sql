-- RLS para tabelas de OVYVA, leads e WhatsApp
-- Garante isolamento multi-tenant por clinica_id

-- ═══════════════════════════════════════════════════════
-- OVYVA_CONVERSAS
-- ═══════════════════════════════════════════════════════
ALTER TABLE IF EXISTS public.ovyva_conversas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ovyva_conversas_clinica_isolamento" ON public.ovyva_conversas;
CREATE POLICY "ovyva_conversas_clinica_isolamento"
  ON public.ovyva_conversas FOR ALL
  USING (clinica_id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (clinica_id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid()));

-- ═══════════════════════════════════════════════════════
-- OVYVA_MENSAGENS
-- ═══════════════════════════════════════════════════════
ALTER TABLE IF EXISTS public.ovyva_mensagens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ovyva_mensagens_clinica_isolamento" ON public.ovyva_mensagens;
CREATE POLICY "ovyva_mensagens_clinica_isolamento"
  ON public.ovyva_mensagens FOR ALL
  USING (
    conversa_id IN (
      SELECT id FROM public.ovyva_conversas
      WHERE clinica_id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    conversa_id IN (
      SELECT id FROM public.ovyva_conversas
      WHERE clinica_id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- ═══════════════════════════════════════════════════════
-- LEADS
-- ═══════════════════════════════════════════════════════
ALTER TABLE IF EXISTS public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads_clinica_isolamento" ON public.leads;
CREATE POLICY "leads_clinica_isolamento"
  ON public.leads FOR ALL
  USING (clinica_id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (clinica_id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid()));

-- ═══════════════════════════════════════════════════════
-- WHATSAPP_INSTANCIAS
-- ═══════════════════════════════════════════════════════
ALTER TABLE IF EXISTS public.whatsapp_instancias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "whatsapp_instancias_clinica_isolamento" ON public.whatsapp_instancias;
CREATE POLICY "whatsapp_instancias_clinica_isolamento"
  ON public.whatsapp_instancias FOR ALL
  USING (clinica_id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (clinica_id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid()));
