-- Fix: resolver recursão infinita na RLS de profiles
-- Usar função security definer para buscar clinica_id sem acionar RLS

CREATE OR REPLACE FUNCTION public.get_my_clinica_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT clinica_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Remover policy com recursão
DROP POLICY IF EXISTS "users_read_same_clinica" ON public.profiles;

-- Recriar sem recursão
CREATE POLICY "users_read_same_clinica"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR (clinica_id IS NOT NULL AND clinica_id = public.get_my_clinica_id())
  );

-- Remover policy duplicada (já coberta pela nova)
DROP POLICY IF EXISTS "users_read_own_profile" ON public.profiles;
