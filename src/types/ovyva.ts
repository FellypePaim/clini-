export type MessageSender = 'paciente' | 'ia' | 'humano';

export interface OvyvaMessage {
  id: string;
  conteudo: string; // was texto
  remetente: MessageSender; // was sender
  created_at: string; // was data
  sessao_id?: string;
  sessao_inicio?: boolean;
  lida?: boolean;
  conversa_id?: string;
  isAudio?: boolean;
  audioDuration?: string;
}

export interface OvyvaConversation {
  id: string;
  clinica_id?: string;
  contato_telefone: string;
  contato_nome?: string | null;
  paciente_id?: string | null;
  status: 'ia_ativa' | 'aguardando_humano' | 'atendido_humano' | 'resolvido'; // Mapped from DB
  ultimo_contato?: string;
  total_mensagens?: number;
  metadata?: any;
  sessao_atual_id?: string;
  
  // From the View `ovyva_conversas_com_preview`
  ultima_mensagem?: string;
  ultima_mensagem_em?: string;
  ultimo_remetente?: MessageSender;
  mensagens_nao_lidas?: number;
  
  // Local state helper for UI
  mensagens: OvyvaMessage[];
}

export interface OvyvaConfig {
  aiName: string;
  toneOfVoice: 'formal' | 'cordial' | 'informal' | 'atenciosa';
  workingHours: {
    start: string;
    end: string;
  };
  offHoursAction: 'padrao' | 'notificar' | 'ignorar';
  availableProfessionalsIds: string[];
  enabledAppointmentTypes: string[];
  minLeadTimeHours: number;
  clinicInfo: string;
  faqs: { id: string; pergunta: string; resposta: string }[];
  templates: {
    id: string;
    trigger: string;
    content: string;
  }[];
}

export interface InteractionLog {
  id: string;
  data: string;
  contato: string;
  canal: 'whatsapp' | 'instagram' | 'webchat';
  status: 'resolvido_ia' | 'transferido_humano';
  duracao: string;
  leadGerado: boolean;
}
