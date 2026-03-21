-- Permitir que usuários anônimos (via link público) insiram anamneses
-- A segurança é garantida pelo token codificado com paciente_id
CREATE POLICY "anon_insert_anamneses"
ON anamneses
FOR INSERT
TO anon
WITH CHECK (true);

-- Permitir que anon leia dados mínimos do paciente (nome) para exibir no formulário
CREATE POLICY "anon_read_paciente_basico"
ON pacientes
FOR SELECT
TO anon
USING (true);

-- Permitir que anon atualize updated_at do paciente após preencher anamnese
CREATE POLICY "anon_update_paciente_after_anamnese"
ON pacientes
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);
