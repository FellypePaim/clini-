-- ═══════════════════════════════════════════════════════════════════════
-- Rename OVYVA → LYRA (tables, view, policies, JSON config, lead origins)
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Rename tables
--    Views reference tables by OID internally, so they survive the rename.
ALTER TABLE IF EXISTS public.ovyva_conversas RENAME TO lyra_conversas;
ALTER TABLE IF EXISTS public.ovyva_mensagens RENAME TO lyra_mensagens;

-- 2. Rename the view (definition stays intact — PostgreSQL resolves by OID)
ALTER VIEW IF EXISTS public.ovyva_conversas_com_preview RENAME TO lyra_conversas_com_preview;

-- 3. Rename RLS policies (policy names are cosmetic but should stay consistent)
DROP POLICY IF EXISTS "ovyva_conversas_clinica_isolamento" ON public.lyra_conversas;
CREATE POLICY "lyra_conversas_clinica_isolamento"
  ON public.lyra_conversas FOR ALL
  USING  (clinica_id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (clinica_id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "ovyva_mensagens_clinica_isolamento" ON public.lyra_mensagens;
CREATE POLICY "lyra_mensagens_clinica_isolamento"
  ON public.lyra_mensagens FOR ALL
  USING (
    conversa_id IN (
      SELECT id FROM public.lyra_conversas
      WHERE clinica_id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    conversa_id IN (
      SELECT id FROM public.lyra_conversas
      WHERE clinica_id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- 4. Migrate JSON config key: configuracoes.ovyva → configuracoes.lyra
--    Copies the value to the new key and removes the old key atomically.
UPDATE public.clinicas
SET configuracoes = (configuracoes - 'ovyva') || jsonb_build_object('lyra', configuracoes -> 'ovyva')
WHERE configuracoes ? 'ovyva';

-- 5. Migrate lead origin label: 'WhatsApp OVYVA' → 'WhatsApp LYRA'
UPDATE public.leads
SET origem = 'WhatsApp LYRA'
WHERE origem = 'WhatsApp OVYVA';
