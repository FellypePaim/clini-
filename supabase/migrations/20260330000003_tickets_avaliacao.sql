-- Adicionar coluna de avaliação ao ticket
ALTER TABLE public.tickets_suporte
  ADD COLUMN IF NOT EXISTS avaliacao INTEGER CHECK (avaliacao >= 1 AND avaliacao <= 5),
  ADD COLUMN IF NOT EXISTS avaliacao_comentario TEXT;
