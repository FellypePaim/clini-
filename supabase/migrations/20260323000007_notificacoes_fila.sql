-- Fila de notificações para processamento pelo cron
CREATE TABLE IF NOT EXISTS public.notificacoes_fila (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  tipo text NOT NULL, -- 'confirmacao', 'lembrete', 'pos_consulta', 'aniversario', 'cobranca'
  canal text NOT NULL DEFAULT 'whatsapp', -- 'whatsapp', 'sistema'
  destinatario_telefone text,
  destinatario_nome text,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE SET NULL,
  consulta_id uuid,
  mensagem text NOT NULL,
  status text NOT NULL DEFAULT 'pendente', -- 'pendente', 'enviado', 'erro'
  erro_msg text,
  agendar_para timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  enviado_em timestamptz
);

CREATE INDEX IF NOT EXISTS idx_notif_fila_status ON public.notificacoes_fila(status, agendar_para);
CREATE INDEX IF NOT EXISTS idx_notif_fila_clinica ON public.notificacoes_fila(clinica_id);

ALTER TABLE public.notificacoes_fila ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_fila_clinica_isolamento"
  ON public.notificacoes_fila FOR ALL
  TO authenticated
  USING (clinica_id = public.get_my_clinica_id())
  WITH CHECK (clinica_id = public.get_my_clinica_id());

-- Trigger: ao criar consulta com status agendado/confirmado/pendente → enfileirar confirmação
CREATE OR REPLACE FUNCTION public.enfileirar_confirmacao_consulta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_config jsonb;
  v_paciente record;
  v_clinica_nome text;
BEGIN
  -- Só enfileira em INSERT ou se status mudou para agendado/confirmado
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    IF NEW.status IN ('agendado', 'confirmado', 'pendente') THEN

      -- Buscar config da clínica
      SELECT configuracoes INTO v_config FROM public.clinicas WHERE id = NEW.clinica_id;

      -- Verificar se confirmação está habilitada
      IF COALESCE((v_config->'notificacoes'->>'whatsapp_confirmacao')::boolean, true) THEN

        -- Buscar dados do paciente
        IF NEW.paciente_id IS NOT NULL THEN
          SELECT nome_completo, telefone INTO v_paciente
          FROM public.pacientes WHERE id = NEW.paciente_id;
        END IF;

        SELECT nome INTO v_clinica_nome FROM public.clinicas WHERE id = NEW.clinica_id;

        IF v_paciente.telefone IS NOT NULL THEN
          INSERT INTO public.notificacoes_fila (
            clinica_id, tipo, canal, destinatario_telefone, destinatario_nome,
            paciente_id, consulta_id, mensagem, agendar_para
          ) VALUES (
            NEW.clinica_id,
            'confirmacao',
            'whatsapp',
            v_paciente.telefone,
            v_paciente.nome_completo,
            NEW.paciente_id,
            NEW.id,
            format('Olá %s! Sua consulta na %s foi confirmada para %s às %s. Qualquer dúvida, responda esta mensagem.',
              COALESCE(v_paciente.nome_completo, 'paciente'),
              COALESCE(v_clinica_nome, 'clínica'),
              to_char(NEW.data_hora_inicio AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY'),
              to_char(NEW.data_hora_inicio AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI')
            ),
            now()
          );
        END IF;
      END IF;

      -- Enfileirar lembrete para X horas antes
      IF COALESCE((v_config->'notificacoes'->>'whatsapp_lembrete')::boolean, true) THEN
        IF v_paciente.telefone IS NOT NULL AND NEW.data_hora_inicio IS NOT NULL THEN
          DECLARE
            v_horas int := COALESCE((v_config->'notificacoes'->>'whatsapp_lembrete_horas')::int, 24);
          BEGIN
            INSERT INTO public.notificacoes_fila (
              clinica_id, tipo, canal, destinatario_telefone, destinatario_nome,
              paciente_id, consulta_id, mensagem, agendar_para
            ) VALUES (
              NEW.clinica_id,
              'lembrete',
              'whatsapp',
              v_paciente.telefone,
              v_paciente.nome_completo,
              NEW.paciente_id,
              NEW.id,
              format('Lembrete: sua consulta na %s é amanhã, %s às %s. Contamos com sua presença!',
                COALESCE(v_clinica_nome, 'clínica'),
                to_char(NEW.data_hora_inicio AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY'),
                to_char(NEW.data_hora_inicio AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI')
              ),
              NEW.data_hora_inicio - (v_horas || ' hours')::interval
            );
          END;
        END IF;
      END IF;
    END IF;

    -- Pós-consulta: ao marcar como concluido
    IF NEW.status = 'concluido' AND (TG_OP = 'INSERT' OR OLD.status != 'concluido') THEN
      SELECT configuracoes INTO v_config FROM public.clinicas WHERE id = NEW.clinica_id;

      IF COALESCE((v_config->'notificacoes'->>'whatsapp_pos_consulta')::boolean, false) THEN
        IF NEW.paciente_id IS NOT NULL THEN
          SELECT nome_completo, telefone INTO v_paciente
          FROM public.pacientes WHERE id = NEW.paciente_id;

          SELECT nome INTO v_clinica_nome FROM public.clinicas WHERE id = NEW.clinica_id;

          IF v_paciente.telefone IS NOT NULL THEN
            INSERT INTO public.notificacoes_fila (
              clinica_id, tipo, canal, destinatario_telefone, destinatario_nome,
              paciente_id, consulta_id, mensagem, agendar_para
            ) VALUES (
              NEW.clinica_id,
              'pos_consulta',
              'whatsapp',
              v_paciente.telefone,
              v_paciente.nome_completo,
              NEW.paciente_id,
              NEW.id,
              format('Olá %s! Como foi seu atendimento na %s hoje? Sua opinião é muito importante para nós. Responda de 1 a 5 (5 = excelente).',
                COALESCE(v_paciente.nome_completo, 'paciente'),
                COALESCE(v_clinica_nome, 'clínica')
              ),
              now() + interval '2 hours'
            );
          END IF;
        END IF;
      END IF;
    END IF;

    -- Cancelamento: remover lembretes pendentes
    IF NEW.status = 'cancelado' AND (TG_OP = 'UPDATE' AND OLD.status != 'cancelado') THEN
      DELETE FROM public.notificacoes_fila
      WHERE consulta_id = NEW.id AND status = 'pendente' AND tipo IN ('lembrete', 'confirmacao');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_consulta_notificacao ON public.consultas;
CREATE TRIGGER trg_consulta_notificacao
  AFTER INSERT OR UPDATE ON public.consultas
  FOR EACH ROW
  EXECUTE FUNCTION public.enfileirar_confirmacao_consulta();
