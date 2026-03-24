-- Tabela ai_usage_logs — rastreia cada chamada à IA (ai-gateway)
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  modelo TEXT,
  tokens_entrada INTEGER DEFAULT 0,
  tokens_saida INTEGER DEFAULT 0,
  custo_estimado NUMERIC(10, 6) DEFAULT 0,
  duracao_ms INTEGER DEFAULT 0,
  sucesso BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para queries frequentes
CREATE INDEX idx_ai_usage_logs_clinica ON ai_usage_logs(clinica_id);
CREATE INDEX idx_ai_usage_logs_created ON ai_usage_logs(created_at DESC);

-- RLS
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- service_role (edge functions) pode inserir
CREATE POLICY "service_role_insert_ai_logs"
  ON ai_usage_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Usuários autenticados leem logs da própria clínica
CREATE POLICY "authenticated_select_ai_logs"
  ON ai_usage_logs FOR SELECT
  TO authenticated
  USING (clinica_id = get_my_clinica_id());

-- service_role lê tudo (superadmin-actions)
CREATE POLICY "service_role_select_ai_logs"
  ON ai_usage_logs FOR SELECT
  TO service_role
  USING (true);
