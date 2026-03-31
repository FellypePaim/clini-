-- Adicionar coluna slug à tabela planos (para identificação semântica)
ALTER TABLE public.planos
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Seed dos 4 planos CliniPlus
INSERT INTO public.planos (slug, nome, descricao, valor_mensal, valor_anual, max_pacientes, max_usuarios, max_ia_chamadas_mes, max_storage_gb, features, ativo)
VALUES
  (
    'starter',
    'Starter',
    'Ideal para profissional solo iniciante',
    97, 970,
    500, 1, 0, 0.5,
    '{"harmonizacao":false,"nexus":false,"relatorios":3,"whatsapp":0,"ausencias":false,"estoque":false,"dashboard_ia":false}'::jsonb,
    true
  ),
  (
    'professional',
    'Professional',
    'Solo consolidado com atendimento via WhatsApp',
    197, 1970,
    null, 2, 200, 5,
    '{"harmonizacao":true,"nexus":"basico","relatorios":8,"whatsapp":1,"ausencias":true,"estoque":"basico","dashboard_ia":true}'::jsonb,
    true
  ),
  (
    'clinic',
    'Clinic',
    'Clínica pequena ou média com equipe',
    397, 3970,
    null, 8, 1000, 20,
    '{"harmonizacao":true,"nexus":"completo","relatorios":13,"whatsapp":2,"ausencias":true,"estoque":"completo","dashboard_ia":true}'::jsonb,
    true
  ),
  (
    'enterprise',
    'Enterprise',
    'Clínica grande com recursos ilimitados',
    797, 7970,
    null, null, null, 100,
    '{"harmonizacao":true,"nexus":"completo","relatorios":13,"whatsapp":5,"ausencias":true,"estoque":"completo","dashboard_ia":true}'::jsonb,
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  valor_mensal = EXCLUDED.valor_mensal,
  valor_anual = EXCLUDED.valor_anual,
  max_pacientes = EXCLUDED.max_pacientes,
  max_usuarios = EXCLUDED.max_usuarios,
  max_ia_chamadas_mes = EXCLUDED.max_ia_chamadas_mes,
  max_storage_gb = EXCLUDED.max_storage_gb,
  features = EXCLUDED.features,
  ativo = EXCLUDED.ativo;

-- Migrar clínicas existentes: setar configuracoes.plano para 'professional' se não tiver plano definido
UPDATE public.clinicas
SET configuracoes = COALESCE(configuracoes, '{}'::jsonb) || '{"plano":"professional","status":"ativo"}'::jsonb
WHERE configuracoes->>'plano' IS NULL
  OR configuracoes->>'plano' NOT IN ('starter', 'professional', 'clinic', 'enterprise');

-- Setar status_plano para 'ativo' nas clínicas sem status
UPDATE public.clinicas
SET status_plano = 'ativo'
WHERE status_plano IS NULL;
