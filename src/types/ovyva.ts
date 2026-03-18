export type MessageSender = 'paciente' | 'ia' | 'humano';

export interface OvyvaMessage {
  id: string;
  texto: string;
  sender: MessageSender;
  data: string;
  isAudio?: boolean;
  audioDuration?: string;
}

export interface OvyvaConversation {
  id: string;
  contatoNome: string;
  contatoAvatar?: string;
  ultimaMensagem: string;
  horario: string;
  unreadCount: number;
  status: 'ia_respondendo' | 'aguardando_humano' | 'atendido_humano';
  pacienteId?: string; // Se vinculado a um paciente real
  intent?: string;
  isNewLead: boolean;
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
