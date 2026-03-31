-- Tabela de pagamentos (preparação para integração com gateway)
CREATE TABLE IF NOT EXISTS public.pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID REFERENCES public.clinicas(id) ON DELETE CASCADE,
  plano_slug TEXT, -- slug do plano: starter, professional, clinic, enterprise
  provider TEXT NOT NULL DEFAULT 'mercadopago',
  provider_payment_id TEXT,
  provider_subscription_id TEXT,
  valor NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'aprovado', 'cancelado', 'expirado', 'reembolsado')),
  periodo_inicio TIMESTAMPTZ,
  periodo_fim TIMESTAMPTZ,
  metodo_pagamento TEXT
    CHECK (metodo_pagamento IN ('pix', 'cartao', 'boleto', 'trial', 'manual')),
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS pagamentos_clinica_id_idx ON public.pagamentos(clinica_id);
CREATE INDEX IF NOT EXISTS pagamentos_status_idx ON public.pagamentos(status);
CREATE INDEX IF NOT EXISTS pagamentos_created_at_idx ON public.pagamentos(created_at);

-- RLS
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

-- SuperAdmin vê tudo
DO $$ BEGIN
  CREATE POLICY "pagamentos_superadmin_all"
    ON public.pagamentos FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'superadmin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Clínica vê apenas seus próprios pagamentos
DO $$ BEGIN
  CREATE POLICY "pagamentos_clinica_select"
    ON public.pagamentos FOR SELECT
    TO authenticated
    USING (clinica_id = public.get_my_clinica_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
