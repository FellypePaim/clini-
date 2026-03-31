-- Adaptar tabela pagamentos para HooPay
ALTER TABLE public.pagamentos
  ADD COLUMN IF NOT EXISTS hoopay_order_uuid TEXT,
  ADD COLUMN IF NOT EXISTS card_token TEXT,
  ADD COLUMN IF NOT EXISTS pix_qrcode TEXT,
  ADD COLUMN IF NOT EXISTS pix_payload TEXT,
  ADD COLUMN IF NOT EXISTS boleto_url TEXT,
  ADD COLUMN IF NOT EXISTS boleto_barcode TEXT;

-- Alterar provider default para hoopay
ALTER TABLE public.pagamentos ALTER COLUMN provider SET DEFAULT 'hoopay';

-- Remover check antigo de metodo_pagamento se existir e recriar com valores corretos
ALTER TABLE public.pagamentos DROP CONSTRAINT IF EXISTS pagamentos_metodo_pagamento_check;
ALTER TABLE public.pagamentos ADD CONSTRAINT pagamentos_metodo_pagamento_check
  CHECK (metodo_pagamento IN ('pix', 'cartao', 'boleto', 'trial', 'manual'));

-- Tabela para guardar card_token por clínica (recorrência)
CREATE TABLE IF NOT EXISTS public.clinica_card_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  card_token TEXT NOT NULL,
  ultimos_4_digitos TEXT,
  bandeira TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clinica_card_tokens_clinica_idx ON public.clinica_card_tokens(clinica_id);

ALTER TABLE public.clinica_card_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "card_tokens_clinica_select"
    ON public.clinica_card_tokens FOR SELECT TO authenticated
    USING (clinica_id = public.get_my_clinica_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "card_tokens_superadmin_all"
    ON public.clinica_card_tokens FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
