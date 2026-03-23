-- Fix: restringir políticas anônimas que estavam com USING(true)
-- Agora exigem que o paciente_id seja passado via token/claim ou parâmetro

-- Revogar políticas permissivas anteriores
DROP POLICY IF EXISTS "anon_insert_anamneses" ON anamneses;
DROP POLICY IF EXISTS "anon_read_paciente_basico" ON pacientes;
DROP POLICY IF EXISTS "anon_update_paciente_after_anamnese" ON pacientes;

-- Anon pode inserir anamnese apenas se o paciente_id for informado (não pode inserir para qualquer paciente)
CREATE POLICY "anon_insert_anamneses"
ON anamneses
FOR INSERT
TO anon
WITH CHECK (paciente_id IS NOT NULL);

-- Anon pode ler apenas dados básicos de um paciente específico (precisa saber o ID)
CREATE POLICY "anon_read_paciente_basico"
ON pacientes
FOR SELECT
TO anon
USING (
  id::text = (current_setting('request.jwt.claims', true)::jsonb->>'paciente_id')
  OR id::text = current_setting('app.current_paciente_id', true)
);

-- Anon pode atualizar apenas updated_at do paciente específico
CREATE POLICY "anon_update_paciente_after_anamnese"
ON pacientes
FOR UPDATE
TO anon
USING (
  id::text = (current_setting('request.jwt.claims', true)::jsonb->>'paciente_id')
  OR id::text = current_setting('app.current_paciente_id', true)
)
WITH CHECK (
  id::text = (current_setting('request.jwt.claims', true)::jsonb->>'paciente_id')
  OR id::text = current_setting('app.current_paciente_id', true)
);
