CREATE OR REPLACE FUNCTION public.insert_prescricao(
  p_clinica_id uuid,
  p_paciente_id uuid,
  p_profissional_id uuid,
  p_itens jsonb,
  p_conteudo text,
  p_assinatura_hash text,
  p_qr_code_token text,
  p_status text DEFAULT 'ativa',
  p_validade_dias int DEFAULT 180
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.prescricoes (
    clinica_id, paciente_id, profissional_id, itens, conteudo,
    assinatura_hash, qr_code_token, status, validade_dias, updated_at
  ) VALUES (
    p_clinica_id, p_paciente_id, p_profissional_id, p_itens, p_conteudo,
    p_assinatura_hash, p_qr_code_token, p_status, p_validade_dias, now()
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
