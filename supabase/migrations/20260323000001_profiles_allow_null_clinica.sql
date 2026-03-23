-- Permitir que profiles.clinica_id seja NULL para funcionários pendentes de aprovação
-- Funcionários se cadastram sem clínica e aguardam o admin vincular

ALTER TABLE public.profiles ALTER COLUMN clinica_id DROP NOT NULL;

-- Policy para permitir que o próprio usuário crie seu profile durante o registro
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.profiles;
CREATE POLICY "users_insert_own_profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Policy para permitir que o usuário leia seu próprio profile (mesmo sem clínica)
DROP POLICY IF EXISTS "users_read_own_profile" ON public.profiles;
CREATE POLICY "users_read_own_profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());
