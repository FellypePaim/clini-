export type LeadStage = 'Perguntou Valor' | 'Demonstrou Interesse' | 'Quase Fechando' | 'Agendado' | 'Perdido';

export type LeadOrigin = 'WhatsApp LYRA' | 'Manual' | 'Indicação' | 'Instagram';

export interface LeadInteraction {
  id: string;
  type: 'note' | 'stage_change' | 'message' | 'appointment' | 'system';
  content: string;
  date: string;
  author?: string;
}

export interface Lead {
  id: string;
  name: string;
  avatar?: string;
  origin: LeadOrigin;
  procedure: string;
  estimatedValue: number;
  stage: LeadStage;
  createdAt: string;
  updatedAt: string;
  lastContactAt: string;
  phone: string;
  email?: string;
  notes?: string;
  lyraId?: string; // Link to LYRA conversation if exists
  interactions: LeadInteraction[];
}

export type CampaignStatus = 'Rascunho' | 'Agendada' | 'Enviada';

export interface CampaignMetrics {
  sent: number;
  delivered: number;
  responded: number;
}

export interface Campaign {
  id: string;
  title: string;
  status: CampaignStatus;
  scheduledAt?: string;
  sentAt?: string;
  targetAudience: string;
  message: string;
  metrics?: CampaignMetrics;
}
