export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      anamneses: {
        Row: {
          alergias: string | null
          created_at: string | null
          dados_extras: Json | null
          habitos: Json | null
          historico_familiar: string | null
          historico_medico: string | null
          id: string
          medicamentos_uso: string | null
          paciente_id: string
          preenchido_em: string | null
          queixa_principal: string | null
          token_expira_em: string | null
          token_link: string | null
          updated_at: string | null
        }
        Insert: {
          alergias?: string | null
          created_at?: string | null
          dados_extras?: Json | null
          habitos?: Json | null
          historico_familiar?: string | null
          historico_medico?: string | null
          id?: string
          medicamentos_uso?: string | null
          paciente_id: string
          preenchido_em?: string | null
          queixa_principal?: string | null
          token_expira_em?: string | null
          token_link?: string | null
          updated_at?: string | null
        }
        Update: {
          alergias?: string | null
          created_at?: string | null
          dados_extras?: Json | null
          habitos?: Json | null
          historico_familiar?: string | null
          historico_medico?: string | null
          id?: string
          medicamentos_uso?: string | null
          paciente_id?: string
          preenchido_em?: string | null
          queixa_principal?: string | null
          token_expira_em?: string | null
          token_link?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anamneses_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      campanhas: {
        Row: {
          agendado_para: string | null
          clinica_id: string
          created_at: string | null
          criado_por: string | null
          enviado_em: string | null
          filtros: Json | null
          id: string
          mensagem: string
          nome: string
          status: string | null
          total_destinatarios: number | null
          total_enviados: number | null
          total_respondidos: number | null
        }
        Insert: {
          agendado_para?: string | null
          clinica_id: string
          created_at?: string | null
          criado_por?: string | null
          enviado_em?: string | null
          filtros?: Json | null
          id?: string
          mensagem: string
          nome: string
          status?: string | null
          total_destinatarios?: number | null
          total_enviados?: number | null
          total_respondidos?: number | null
        }
        Update: {
          agendado_para?: string | null
          clinica_id?: string
          created_at?: string | null
          criado_por?: string | null
          enviado_em?: string | null
          filtros?: Json | null
          id?: string
          mensagem?: string
          nome?: string
          status?: string | null
          total_destinatarios?: number | null
          total_enviados?: number | null
          total_respondidos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campanhas_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanhas_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinicas: {
        Row: {
          cnpj: string | null
          configuracoes: Json | null
          created_at: string | null
          crm_cro: string | null
          email: string | null
          endereco: Json | null
          especialidades: string[] | null
          horario_funcionamento: Json | null
          id: string
          logo_url: string | null
          nome: string
          site: string | null
          telefone: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          cnpj?: string | null
          configuracoes?: Json | null
          created_at?: string | null
          crm_cro?: string | null
          email?: string | null
          endereco?: Json | null
          especialidades?: string[] | null
          horario_funcionamento?: Json | null
          id?: string
          logo_url?: string | null
          nome: string
          site?: string | null
          telefone?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          cnpj?: string | null
          configuracoes?: Json | null
          created_at?: string | null
          crm_cro?: string | null
          email?: string | null
          endereco?: Json | null
          especialidades?: string[] | null
          horario_funcionamento?: Json | null
          id?: string
          logo_url?: string | null
          nome?: string
          site?: string | null
          telefone?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      consultas: {
        Row: {
          agendado_por: string | null
          clinica_id: string
          confirmado_via: string | null
          convenio: string | null
          created_at: string | null
          data_hora_fim: string
          data_hora_inicio: string
          id: string
          observacoes: string | null
          paciente_id: string
          procedimento_id: string | null
          profissional_id: string
          recorrencia_config: Json | null
          recorrencia_pai_id: string | null
          recorrente: boolean | null
          status: Database["public"]["Enums"]["appointment_status"] | null
          updated_at: string | null
          valor: number | null
        }
        Insert: {
          agendado_por?: string | null
          clinica_id: string
          confirmado_via?: string | null
          convenio?: string | null
          created_at?: string | null
          data_hora_fim: string
          data_hora_inicio: string
          id?: string
          observacoes?: string | null
          paciente_id: string
          procedimento_id?: string | null
          profissional_id: string
          recorrencia_config?: Json | null
          recorrencia_pai_id?: string | null
          recorrente?: boolean | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          updated_at?: string | null
          valor?: number | null
        }
        Update: {
          agendado_por?: string | null
          clinica_id?: string
          confirmado_via?: string | null
          convenio?: string | null
          created_at?: string | null
          data_hora_fim?: string
          data_hora_inicio?: string
          id?: string
          observacoes?: string | null
          paciente_id?: string
          procedimento_id?: string | null
          profissional_id?: string
          recorrencia_config?: Json | null
          recorrencia_pai_id?: string | null
          recorrente?: boolean | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          updated_at?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "consultas_agendado_por_fkey"
            columns: ["agendado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultas_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultas_procedimento_id_fkey"
            columns: ["procedimento_id"]
            isOneToOne: false
            referencedRelation: "procedimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultas_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultas_recorrencia_pai_id_fkey"
            columns: ["recorrencia_pai_id"]
            isOneToOne: false
            referencedRelation: "consultas"
            referencedColumns: ["id"]
          },
        ]
      }
      convenios: {
        Row: {
          ativo: boolean | null
          clinica_id: string
          codigo: string | null
          created_at: string | null
          id: string
          nome: string
          tabela_precos: Json | null
        }
        Insert: {
          ativo?: boolean | null
          clinica_id: string
          codigo?: string | null
          created_at?: string | null
          id?: string
          nome: string
          tabela_precos?: Json | null
        }
        Update: {
          ativo?: boolean | null
          clinica_id?: string
          codigo?: string | null
          created_at?: string | null
          id?: string
          nome?: string
          tabela_precos?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "convenios_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_paciente: {
        Row: {
          arquivo_url: string
          created_at: string | null
          id: string
          mime_type: string | null
          nome: string
          paciente_id: string
          tamanho_bytes: number | null
          tipo: string | null
          uploaded_by: string | null
        }
        Insert: {
          arquivo_url: string
          created_at?: string | null
          id?: string
          mime_type?: string | null
          nome: string
          paciente_id: string
          tamanho_bytes?: number | null
          tipo?: string | null
          uploaded_by?: string | null
        }
        Update: {
          arquivo_url?: string
          created_at?: string | null
          id?: string
          mime_type?: string | null
          nome?: string
          paciente_id?: string
          tamanho_bytes?: number | null
          tipo?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_paciente_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_paciente_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_movimentacoes: {
        Row: {
          clinica_id: string
          consulta_id: string | null
          created_at: string | null
          estoque_anterior: number | null
          estoque_posterior: number | null
          id: string
          motivo: string | null
          procedimento_id: string | null
          produto_id: string
          quantidade: number
          tipo: Database["public"]["Enums"]["stock_movement_type"]
          usuario_id: string | null
        }
        Insert: {
          clinica_id: string
          consulta_id?: string | null
          created_at?: string | null
          estoque_anterior?: number | null
          estoque_posterior?: number | null
          id?: string
          motivo?: string | null
          procedimento_id?: string | null
          produto_id: string
          quantidade: number
          tipo: Database["public"]["Enums"]["stock_movement_type"]
          usuario_id?: string | null
        }
        Update: {
          clinica_id?: string
          consulta_id?: string | null
          created_at?: string | null
          estoque_anterior?: number | null
          estoque_posterior?: number | null
          id?: string
          motivo?: string | null
          procedimento_id?: string | null
          produto_id?: string
          quantidade?: number
          tipo?: Database["public"]["Enums"]["stock_movement_type"]
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_movimentacoes_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_consulta_id_fkey"
            columns: ["consulta_id"]
            isOneToOne: false
            referencedRelation: "consultas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_procedimento_id_fkey"
            columns: ["procedimento_id"]
            isOneToOne: false
            referencedRelation: "procedimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_estoque"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evolucoes: {
        Row: {
          cid10_codigo: string | null
          cid10_descricao: string | null
          consulta_id: string
          created_at: string | null
          dados_extras: Json | null
          id: string
          paciente_id: string
          profissional_id: string
          resumo_ia: string | null
          texto_clinico: string | null
          transcricao_audio: string | null
          updated_at: string | null
        }
        Insert: {
          cid10_codigo?: string | null
          cid10_descricao?: string | null
          consulta_id: string
          created_at?: string | null
          dados_extras?: Json | null
          id?: string
          paciente_id: string
          profissional_id: string
          resumo_ia?: string | null
          texto_clinico?: string | null
          transcricao_audio?: string | null
          updated_at?: string | null
        }
        Update: {
          cid10_codigo?: string | null
          cid10_descricao?: string | null
          consulta_id?: string
          created_at?: string | null
          dados_extras?: Json | null
          id?: string
          paciente_id?: string
          profissional_id?: string
          resumo_ia?: string | null
          texto_clinico?: string | null
          transcricao_audio?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evolucoes_consulta_id_fkey"
            columns: ["consulta_id"]
            isOneToOne: false
            referencedRelation: "consultas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evolucoes_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evolucoes_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      harmonizacoes: {
        Row: {
          consulta_id: string | null
          created_at: string | null
          id: string
          mapeamento: Json
          observacoes_gerais: string | null
          paciente_id: string
          profissional_id: string
        }
        Insert: {
          consulta_id?: string | null
          created_at?: string | null
          id?: string
          mapeamento: Json
          observacoes_gerais?: string | null
          paciente_id: string
          profissional_id: string
        }
        Update: {
          consulta_id?: string | null
          created_at?: string | null
          id?: string
          mapeamento?: Json
          observacoes_gerais?: string | null
          paciente_id?: string
          profissional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "harmonizacoes_consulta_id_fkey"
            columns: ["consulta_id"]
            isOneToOne: false
            referencedRelation: "consultas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "harmonizacoes_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "harmonizacoes_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos: {
        Row: {
          categoria: string | null
          clinica_id: string
          consulta_id: string | null
          convenio: string | null
          created_at: string | null
          descricao: string
          forma_pagamento: string | null
          id: string
          observacoes: string | null
          orcamento_id: string | null
          paciente_id: string | null
          pago_em: string | null
          profissional_id: string | null
          status: Database["public"]["Enums"]["financial_status"] | null
          tipo: string
          updated_at: string | null
          valor: number
          vencimento: string
        }
        Insert: {
          categoria?: string | null
          clinica_id: string
          consulta_id?: string | null
          convenio?: string | null
          created_at?: string | null
          descricao: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          orcamento_id?: string | null
          paciente_id?: string | null
          pago_em?: string | null
          profissional_id?: string | null
          status?: Database["public"]["Enums"]["financial_status"] | null
          tipo: string
          updated_at?: string | null
          valor: number
          vencimento: string
        }
        Update: {
          categoria?: string | null
          clinica_id?: string
          consulta_id?: string | null
          convenio?: string | null
          created_at?: string | null
          descricao?: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          orcamento_id?: string | null
          paciente_id?: string | null
          pago_em?: string | null
          profissional_id?: string | null
          status?: Database["public"]["Enums"]["financial_status"] | null
          tipo?: string
          updated_at?: string | null
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_consulta_id_fkey"
            columns: ["consulta_id"]
            isOneToOne: false
            referencedRelation: "consultas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          clinica_id: string
          conversa_id: string | null
          created_at: string | null
          email: string | null
          estagio: Database["public"]["Enums"]["crm_stage"] | null
          id: string
          nome: string
          observacoes: string | null
          origem: string | null
          paciente_id: string | null
          procedimento_interesse: string | null
          responsavel_id: string | null
          telefone: string | null
          ultimo_contato: string | null
          updated_at: string | null
          valor_estimado: number | null
        }
        Insert: {
          clinica_id: string
          conversa_id?: string | null
          created_at?: string | null
          email?: string | null
          estagio?: Database["public"]["Enums"]["crm_stage"] | null
          id?: string
          nome: string
          observacoes?: string | null
          origem?: string | null
          paciente_id?: string | null
          procedimento_interesse?: string | null
          responsavel_id?: string | null
          telefone?: string | null
          ultimo_contato?: string | null
          updated_at?: string | null
          valor_estimado?: number | null
        }
        Update: {
          clinica_id?: string
          conversa_id?: string | null
          created_at?: string | null
          email?: string | null
          estagio?: Database["public"]["Enums"]["crm_stage"] | null
          id?: string
          nome?: string
          observacoes?: string | null
          origem?: string | null
          paciente_id?: string | null
          procedimento_interesse?: string | null
          responsavel_id?: string | null
          telefone?: string | null
          ultimo_contato?: string | null
          updated_at?: string | null
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "ovyva_conversas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_historico: {
        Row: {
          anotacao: string | null
          created_at: string | null
          estagio_anterior: Database["public"]["Enums"]["crm_stage"] | null
          estagio_novo: Database["public"]["Enums"]["crm_stage"] | null
          id: string
          lead_id: string
          usuario_id: string | null
        }
        Insert: {
          anotacao?: string | null
          created_at?: string | null
          estagio_anterior?: Database["public"]["Enums"]["crm_stage"] | null
          estagio_novo?: Database["public"]["Enums"]["crm_stage"] | null
          id?: string
          lead_id: string
          usuario_id?: string | null
        }
        Update: {
          anotacao?: string | null
          created_at?: string | null
          estagio_anterior?: Database["public"]["Enums"]["crm_stage"] | null
          estagio_novo?: Database["public"]["Enums"]["crm_stage"] | null
          id?: string
          lead_id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_historico_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_historico_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          aprovado_em: string | null
          clinica_id: string
          condicoes_pagamento: Json | null
          created_at: string | null
          desconto_geral: number | null
          enviado_whatsapp: boolean | null
          id: string
          itens: Json
          numero: number
          paciente_id: string
          profissional_id: string | null
          status: string | null
          subtotal: number
          total: number
          updated_at: string | null
          validade: string | null
        }
        Insert: {
          aprovado_em?: string | null
          clinica_id: string
          condicoes_pagamento?: Json | null
          created_at?: string | null
          desconto_geral?: number | null
          enviado_whatsapp?: boolean | null
          id?: string
          itens: Json
          numero?: number
          paciente_id: string
          profissional_id?: string | null
          status?: string | null
          subtotal: number
          total: number
          updated_at?: string | null
          validade?: string | null
        }
        Update: {
          aprovado_em?: string | null
          clinica_id?: string
          condicoes_pagamento?: Json | null
          created_at?: string | null
          desconto_geral?: number | null
          enviado_whatsapp?: boolean | null
          id?: string
          itens?: Json
          numero?: number
          paciente_id?: string
          profissional_id?: string | null
          status?: string | null
          subtotal?: number
          total?: number
          updated_at?: string | null
          validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ovyva_conversas: {
        Row: {
          atendente_id: string | null
          canal: string | null
          clinica_id: string
          contato_nome: string | null
          contato_telefone: string
          created_at: string | null
          id: string
          intencao_detectada: string | null
          paciente_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          atendente_id?: string | null
          canal?: string | null
          clinica_id: string
          contato_nome?: string | null
          contato_telefone: string
          created_at?: string | null
          id?: string
          intencao_detectada?: string | null
          paciente_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          atendente_id?: string | null
          canal?: string | null
          clinica_id?: string
          contato_nome?: string | null
          contato_telefone?: string
          created_at?: string | null
          id?: string
          intencao_detectada?: string | null
          paciente_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ovyva_conversas_atendente_id_fkey"
            columns: ["atendente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ovyva_conversas_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ovyva_conversas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      ovyva_mensagens: {
        Row: {
          audio_url: string | null
          conteudo: string | null
          conversa_id: string
          created_at: string | null
          id: string
          lida: boolean | null
          metadata: Json | null
          remetente: string
          tipo: string | null
          transcricao: string | null
        }
        Insert: {
          audio_url?: string | null
          conteudo?: string | null
          conversa_id: string
          created_at?: string | null
          id?: string
          lida?: boolean | null
          metadata?: Json | null
          remetente: string
          tipo?: string | null
          transcricao?: string | null
        }
        Update: {
          audio_url?: string | null
          conteudo?: string | null
          conversa_id?: string
          created_at?: string | null
          id?: string
          lida?: boolean | null
          metadata?: Json | null
          remetente?: string
          tipo?: string | null
          transcricao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ovyva_mensagens_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "ovyva_conversas"
            referencedColumns: ["id"]
          },
        ]
      }
      pacientes: {
        Row: {
          ativo: boolean | null
          clinica_id: string
          como_conheceu: string | null
          convenio: string | null
          cpf: string | null
          created_at: string | null
          data_nascimento: string | null
          email: string | null
          endereco: Json | null
          genero: string | null
          id: string
          nome_completo: string
          numero_convenio: string | null
          observacoes: string | null
          profissional_responsavel_id: string | null
          telefone: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          ativo?: boolean | null
          clinica_id: string
          como_conheceu?: string | null
          convenio?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: Json | null
          genero?: string | null
          id?: string
          nome_completo: string
          numero_convenio?: string | null
          observacoes?: string | null
          profissional_responsavel_id?: string | null
          telefone?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          ativo?: boolean | null
          clinica_id?: string
          como_conheceu?: string | null
          convenio?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: Json | null
          genero?: string | null
          id?: string
          nome_completo?: string
          numero_convenio?: string | null
          observacoes?: string | null
          profissional_responsavel_id?: string | null
          telefone?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pacientes_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacientes_profissional_responsavel_id_fkey"
            columns: ["profissional_responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prescricoes: {
        Row: {
          assinado_em: string | null
          consulta_id: string | null
          created_at: string | null
          enviado_whatsapp: boolean | null
          id: string
          itens: Json
          paciente_id: string
          pdf_url: string | null
          profissional_id: string
          qr_code_token: string | null
          validade_dias: number | null
        }
        Insert: {
          assinado_em?: string | null
          consulta_id?: string | null
          created_at?: string | null
          enviado_whatsapp?: boolean | null
          id?: string
          itens: Json
          paciente_id: string
          pdf_url?: string | null
          profissional_id: string
          qr_code_token?: string | null
          validade_dias?: number | null
        }
        Update: {
          assinado_em?: string | null
          consulta_id?: string | null
          created_at?: string | null
          enviado_whatsapp?: boolean | null
          id?: string
          itens?: Json
          paciente_id?: string
          pdf_url?: string | null
          profissional_id?: string
          qr_code_token?: string | null
          validade_dias?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prescricoes_consulta_id_fkey"
            columns: ["consulta_id"]
            isOneToOne: false
            referencedRelation: "consultas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescricoes_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescricoes_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      procedimento_insumos: {
        Row: {
          baixa_automatica: boolean | null
          id: string
          procedimento_id: string
          produto_id: string
          quantidade: number
        }
        Insert: {
          baixa_automatica?: boolean | null
          id?: string
          procedimento_id: string
          produto_id: string
          quantidade: number
        }
        Update: {
          baixa_automatica?: boolean | null
          id?: string
          procedimento_id?: string
          produto_id?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "procedimento_insumos_procedimento_id_fkey"
            columns: ["procedimento_id"]
            isOneToOne: false
            referencedRelation: "procedimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedimento_insumos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_estoque"
            referencedColumns: ["id"]
          },
        ]
      }
      procedimentos: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          clinica_id: string
          codigo_tuss: string | null
          created_at: string | null
          descricao: string | null
          duracao_minutos: number | null
          id: string
          nome: string
          valor_particular: number | null
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          clinica_id: string
          codigo_tuss?: string | null
          created_at?: string | null
          descricao?: string | null
          duracao_minutos?: number | null
          id?: string
          nome: string
          valor_particular?: number | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          clinica_id?: string
          codigo_tuss?: string | null
          created_at?: string | null
          descricao?: string | null
          duracao_minutos?: number | null
          id?: string
          nome?: string
          valor_particular?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "procedimentos_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos_estoque: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          clinica_id: string
          codigo: string | null
          created_at: string | null
          custo_unitario: number | null
          estoque_atual: number | null
          estoque_minimo: number | null
          fornecedor_preferencial: string | null
          id: string
          localizacao: string | null
          nome: string
          unidade: string | null
          updated_at: string | null
          validade: string | null
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          clinica_id: string
          codigo?: string | null
          created_at?: string | null
          custo_unitario?: number | null
          estoque_atual?: number | null
          estoque_minimo?: number | null
          fornecedor_preferencial?: string | null
          id?: string
          localizacao?: string | null
          nome: string
          unidade?: string | null
          updated_at?: string | null
          validade?: string | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          clinica_id?: string
          codigo?: string | null
          created_at?: string | null
          custo_unitario?: number | null
          estoque_atual?: number | null
          estoque_minimo?: number | null
          fornecedor_preferencial?: string | null
          id?: string
          localizacao?: string | null
          nome?: string
          unidade?: string | null
          updated_at?: string | null
          validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_estoque_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean | null
          avatar_url: string | null
          clinica_id: string | null
          cor_agenda: string | null
          created_at: string | null
          duracao_padrao_consulta: number | null
          email: string
          especialidade: string | null
          id: string
          nome_completo: string
          registro_profissional: string | null
          role: Database["public"]["Enums"]["user_role"]
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          avatar_url?: string | null
          clinica_id?: string | null
          cor_agenda?: string | null
          created_at?: string | null
          duracao_padrao_consulta?: number | null
          email: string
          especialidade?: string | null
          id: string
          nome_completo: string
          registro_profissional?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          avatar_url?: string | null
          clinica_id?: string | null
          cor_agenda?: string | null
          created_at?: string | null
          duracao_padrao_consulta?: number | null
          email?: string
          especialidade?: string | null
          id?: string
          nome_completo?: string
          registro_profissional?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      termos_consentimento: {
        Row: {
          assinado_em: string | null
          assinatura_url: string | null
          clinica_id: string
          conteudo: string | null
          created_at: string | null
          id: string
          ip_assinatura: string | null
          paciente_id: string
          tipo: string
          titulo: string | null
          token_link: string | null
        }
        Insert: {
          assinado_em?: string | null
          assinatura_url?: string | null
          clinica_id: string
          conteudo?: string | null
          created_at?: string | null
          id?: string
          ip_assinatura?: string | null
          paciente_id: string
          tipo: string
          titulo?: string | null
          token_link?: string | null
        }
        Update: {
          assinado_em?: string | null
          assinatura_url?: string | null
          clinica_id?: string
          conteudo?: string | null
          created_at?: string | null
          id?: string
          ip_assinatura?: string | null
          paciente_id?: string
          tipo?: string
          titulo?: string | null
          token_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "termos_consentimento_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "termos_consentimento_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_clinica_id: { Args: never; Returns: string }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      appointment_status:
        | "agendado"
        | "confirmado"
        | "em_atendimento"
        | "finalizado"
        | "cancelado"
        | "faltou"
      crm_stage:
        | "perguntou_valor"
        | "demonstrou_interesse"
        | "quase_fechando"
        | "agendado"
        | "perdido"
      financial_status:
        | "pendente"
        | "pago"
        | "vencido"
        | "cancelado"
        | "estornado"
      stock_movement_type: "entrada" | "saida" | "ajuste"
      user_role: "admin" | "profissional" | "recepcao"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      appointment_status: [
        "agendado",
        "confirmado",
        "em_atendimento",
        "finalizado",
        "cancelado",
        "faltou",
      ],
      crm_stage: [
        "perguntou_valor",
        "demonstrou_interesse",
        "quase_fechando",
        "agendado",
        "perdido",
      ],
      financial_status: [
        "pendente",
        "pago",
        "vencido",
        "cancelado",
        "estornado",
      ],
      stock_movement_type: ["entrada", "saida", "ajuste"],
      user_role: ["admin", "profissional", "recepcao"],
    },
  },
} as const
