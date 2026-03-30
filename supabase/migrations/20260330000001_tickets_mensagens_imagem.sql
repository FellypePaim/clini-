-- Adicionar coluna imagem_url à tabela tickets_mensagens
ALTER TABLE public.tickets_mensagens
  ADD COLUMN IF NOT EXISTS imagem_url TEXT;
