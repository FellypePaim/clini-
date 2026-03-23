-- Fix: remover 'pendente' do trigger (não é valor válido do enum appointment_status)
-- Usar 'finalizado' em vez de 'concluido' para pós-consulta

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
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    IF NEW.status IN ('agendado', 'confirmado') THEN
      SELECT configuracoes INTO v_config FROM public.clinicas WHERE id = NEW.clinica_id;

      IF COALESCE((v_config->'notificacoes'->>'whatsapp_confirmacao')::boolean, true) THEN
        IF NEW.paciente_id IS NOT NULL THEN
          SELECT nome_completo, telefone INTO v_paciente FROM public.pacientes WHERE id = NEW.paciente_id;
        END IF;
        SELECT nome INTO v_clinica_nome FROM public.clinicas WHERE id = NEW.clinica_id;

        IF v_paciente.telefone IS NOT NULL THEN
          INSERT INTO public.notificacoes_fila (clinica_id, tipo, canal, destinatario_telefone, destinatario_nome, paciente_id, consulta_id, mensagem, agendar_para)
          VALUES (NEW.clinica_id, 'confirmacao', 'whatsapp', v_paciente.telefone, v_paciente.nome_completo, NEW.paciente_id, NEW.id,
            format('Olá %s! Sua consulta na %s foi confirmada para %s às %s.',
              COALESCE(v_paciente.nome_completo, 'paciente'), COALESCE(v_clinica_nome, 'clínica'),
              to_char(NEW.data_hora_inicio AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY'),
              to_char(NEW.data_hora_inicio AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI')), now());
        END IF;
      END IF;

      IF COALESCE((v_config->'notificacoes'->>'whatsapp_lembrete')::boolean, true) THEN
        IF v_paciente.telefone IS NOT NULL AND NEW.data_hora_inicio IS NOT NULL THEN
          DECLARE
            v_horas int := COALESCE((v_config->'notificacoes'->>'whatsapp_lembrete_horas')::int, 24);
          BEGIN
            INSERT INTO public.notificacoes_fila (clinica_id, tipo, canal, destinatario_telefone, destinatario_nome, paciente_id, consulta_id, mensagem, agendar_para)
            VALUES (NEW.clinica_id, 'lembrete', 'whatsapp', v_paciente.telefone, v_paciente.nome_completo, NEW.paciente_id, NEW.id,
              format('Lembrete: sua consulta na %s é amanhã, %s às %s.',
                COALESCE(v_clinica_nome, 'clínica'),
                to_char(NEW.data_hora_inicio AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY'),
                to_char(NEW.data_hora_inicio AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI')),
              NEW.data_hora_inicio - (v_horas || ' hours')::interval);
          END;
        END IF;
      END IF;
    END IF;

    -- Pós-consulta: ao finalizar
    IF NEW.status = 'finalizado' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'finalizado') THEN
      SELECT configuracoes INTO v_config FROM public.clinicas WHERE id = NEW.clinica_id;
      IF COALESCE((v_config->'notificacoes'->>'whatsapp_pos_consulta')::boolean, false) THEN
        IF NEW.paciente_id IS NOT NULL THEN
          SELECT nome_completo, telefone INTO v_paciente FROM public.pacientes WHERE id = NEW.paciente_id;
          SELECT nome INTO v_clinica_nome FROM public.clinicas WHERE id = NEW.clinica_id;
          IF v_paciente.telefone IS NOT NULL THEN
            INSERT INTO public.notificacoes_fila (clinica_id, tipo, canal, destinatario_telefone, destinatario_nome, paciente_id, consulta_id, mensagem, agendar_para)
            VALUES (NEW.clinica_id, 'pos_consulta', 'whatsapp', v_paciente.telefone, v_paciente.nome_completo, NEW.paciente_id, NEW.id,
              format('Olá %s! Como foi seu atendimento na %s? Responda de 1 a 5.',
                COALESCE(v_paciente.nome_completo, 'paciente'), COALESCE(v_clinica_nome, 'clínica')),
              now() + interval '2 hours');
          END IF;
        END IF;
      END IF;
    END IF;

    -- Cancelamento: remover lembretes
    IF NEW.status = 'cancelado' AND (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM 'cancelado') THEN
      DELETE FROM public.notificacoes_fila WHERE consulta_id = NEW.id AND status = 'pendente' AND tipo IN ('lembrete', 'confirmacao');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
