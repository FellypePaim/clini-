import { useState, useCallback } from 'react'
import type { OvyvaConversation, OvyvaConfig, InteractionLog, OvyvaMessage } from '../types/ovyva'

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA: CONFIG CONTEXT
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_CONFIG: OvyvaConfig = {
  aiName: 'Sofia',
  toneOfVoice: 'cordial',
  workingHours: { start: '08:00', end: '19:00' },
  offHoursAction: 'padrao',
  availableProfessionalsIds: ['pro-001', 'pro-002', 'pro-003'],
  enabledAppointmentTypes: ['estetica', 'clinica', 'odontologia'],
  minLeadTimeHours: 2,
  clinicInfo: 'A Clínica Verde está localizada na Av. Paulista, 1000. Aceitamos Unimed e Bradesco. Realizamos botox, preenchimento e limpeza dentária.',
  faqs: [
    { id: '1', pergunta: 'Quais os valores do Botox?', resposta: 'O valor da aplicação de toxina botulínica varia dependendo da quantidade de unidades (UI) necessárias, o que é avaliado em consulta.' },
    { id: '2', pergunta: 'Aceitam convênio?', resposta: 'Sim, aceitamos Unimed, Bradesco e SulAmérica.' }
  ],
  templates: [
    { id: '1', trigger: 'Saudação', content: 'Olá {{nome_paciente}}, sou a {{ai_name}}, assistente da Clínica Verde. Como posso te ajudar hoje?' },
    { id: '2', trigger: 'Confirmação', content: 'Perfeito! Sua consulta com {{profissional}} está confirmada para {{data_consulta}} às {{hora_consulta}}.' }
  ]
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA: CONVERSATIONS (8 ativas)
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_CONVERSATIONS: OvyvaConversation[] = [
  {
    id: 'conv-1',
    contatoNome: 'Lucas Silva',
    ultimaMensagem: 'Ok, vou agendar para amanhã.',
    horario: '10:45',
    unreadCount: 0,
    status: 'ia_respondendo',
    intent: 'Agendar consulta clínica',
    isNewLead: false,
    pacienteId: 'pac-001',
    mensagens: [
      { id: 'm1', texto: 'Olá, gostaria de saber se tem horário para amanhã.', sender: 'paciente', data: '2026-03-18T10:40:00' },
      { id: 'm2', texto: 'Olá Lucas! Temos horários às 14h e 16h com a Dra. Ana Lima. Gostaria de agendar?', sender: 'ia', data: '2026-03-18T10:41:00' },
      { id: 'm3', texto: 'Ok, vou agendar para amanhã às 14h.', sender: 'paciente', data: '2026-03-18T10:45:00' }
    ]
  },
  {
    id: 'conv-2',
    contatoNome: 'Beatriz Oliveira',
    ultimaMensagem: 'Quanto custa o preenchimento de lábios?',
    horario: '11:15',
    unreadCount: 2,
    status: 'ia_respondendo',
    intent: 'Dúvida sobre valores',
    isNewLead: true,
    mensagens: [
      { id: 'm4', texto: 'Oi, vi o anúncio no Instagram.', sender: 'paciente', data: '2026-03-18T11:10:00' },
      { id: 'm5', texto: 'Quanto custa o preenchimento de lábios?', sender: 'paciente', data: '2026-03-18T11:15:00' }
    ]
  },
  {
    id: 'conv-3',
    contatoNome: 'Ricardo Mendes',
    ultimaMensagem: 'Mensagem de voz (0:15)',
    horario: '09:30',
    unreadCount: 0,
    status: 'aguardando_humano',
    intent: 'Reclamação/Suporte',
    isNewLead: false,
    pacienteId: 'pac-002',
    mensagens: [
      { id: 'm6', texto: 'Áudio enviado', sender: 'paciente', data: '2026-03-18T09:30:00', isAudio: true, audioDuration: '0:15' }
    ]
  },
  {
    id: 'conv-4',
    contatoNome: 'Marina Santos',
    ultimaMensagem: 'Pode confirmar meu horário de hoje?',
    horario: '08:00',
    unreadCount: 0,
    status: 'atendido_humano',
    isNewLead: false,
    mensagens: [
      { id: 'm7', texto: 'Bom dia!', sender: 'paciente', data: '2026-03-18T08:00:00' },
      { id: 'm8', texto: 'Bom dia Marina! Seu horário com Dr. Carlos é às 15h.', sender: 'humano', data: '2026-03-18T08:05:00' }
    ]
  },
  // Mais 4 mocks simples
  { id: 'conv-5', contatoNome: 'Felipe Dias', ultimaMensagem: 'A recepção já viu minha mensagem?', horario: 'Ontem', unreadCount: 1, status: 'aguardando_humano', isNewLead: true, mensagens: [] },
  { id: 'conv-6', contatoNome: 'Clara Nunes', ultimaMensagem: 'Obrigada, Sofia!', horario: 'Ontem', unreadCount: 0, status: 'ia_respondendo', isNewLead: false, mensagens: [] },
  { id: 'conv-7', contatoNome: 'Gustavo Lima', ultimaMensagem: 'Endereço da clínica, por favor.', horario: 'Ontem', unreadCount: 0, status: 'ia_respondendo', isNewLead: true, mensagens: [] },
  { id: 'conv-8', contatoNome: 'Helena Rocha', ultimaMensagem: 'Consulta de retorno marcada.', horario: '07:45', unreadCount: 0, status: 'ia_respondendo', isNewLead: false, mensagens: [] }
]

// ─────────────────────────────────────────────────────────────────────────────
// useOVYVA Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useOVYVA() {
  const [conversations, setConversations] = useState<OvyvaConversation[]>(INITIAL_CONVERSATIONS)
  const [config, setConfig] = useState<OvyvaConfig>(INITIAL_CONFIG)
  const [isLoading, setIsLoading] = useState(false)

  // ── Mensagens ──────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (conversationId: string, texto: string, sender: 'humano' | 'ia' = 'humano') => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 400))
    
    const newMessage: OvyvaMessage = {
      id: `msg-${Date.now()}`,
      texto,
      sender,
      data: new Date().toISOString()
    }

    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          mensagens: [...conv.mensagens, newMessage],
          ultimaMensagem: texto,
          horario: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      }
      return conv
    }))

    setIsLoading(false)
  }, [])

  // ── Assumir Atendimento ────────────────────────────────────────────────────
  const takeoverConversation = useCallback(async (conversationId: string) => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 600))
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId ? { ...conv, status: 'atendido_humano' } : conv
    ))
    setIsLoading(false)
  }, [])

  // ── Devolver para IA ───────────────────────────────────────────────────────
  const returnToAI = useCallback(async (conversationId: string) => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 600))
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId ? { ...conv, status: 'ia_respondendo' } : conv
    ))
    setIsLoading(false)
  }, [])

  // ── Processar Áudio (Stub) ─────────────────────────────────────────────────
  const processAudioMessage = useCallback(async (msgId: string) => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setIsLoading(false)
    return "Transcrição simulada: 'Oi, gostaria de desmarcar minha consulta de amanhã as 10h porque tive um imprevisto médico com meu filho.'"
  }, [])

  // ── Atualizar Configurações ────────────────────────────────────────────────
  const updateAIConfig = useCallback(async (newConfig: Partial<OvyvaConfig>) => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setConfig(prev => ({ ...prev, ...newConfig }))
    setIsLoading(false)
  }, [])

  return {
    conversations,
    config,
    isLoading,
    sendMessage,
    takeoverConversation,
    returnToAI,
    processAudioMessage,
    updateAIConfig
  }
}
