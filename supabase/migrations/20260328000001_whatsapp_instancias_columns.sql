-- Adicionar colunas faltantes na tabela whatsapp_instancias
ALTER TABLE public.whatsapp_instancias
  ADD COLUMN IF NOT EXISTS qr_code_base64 TEXT,
  ADD COLUMN IF NOT EXISTS status_conexao TEXT DEFAULT 'close',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS numero_conectado TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
