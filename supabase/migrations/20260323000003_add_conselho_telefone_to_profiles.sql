-- Adicionar colunas conselho e telefone na tabela profiles
-- Usadas no cadastro de profissionais e funcionários

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS conselho text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telefone text;
