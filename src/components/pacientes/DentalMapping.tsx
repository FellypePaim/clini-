import { useState, useEffect } from 'react'
import {
  Save, Trash2, History, ChevronDown, Activity, Info, X,
  AlertTriangle, CheckCircle, FileText, Search, Sparkles, Edit3,
  Printer, DollarSign, GitCompare
} from 'lucide-react'
import jsPDF from 'jspdf'
import { cn } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../hooks/useToast'

// ─── Configuração dos Dentes (Notação FDI) ─────────────────────────
const QUADRANTS = [
  { label: 'Superior Direito', teeth: [18,17,16,15,14,13,12,11] },
  { label: 'Superior Esquerdo', teeth: [21,22,23,24,25,26,27,28] },
  { label: 'Inferior Esquerdo', teeth: [31,32,33,34,35,36,37,38] },
  { label: 'Inferior Direito', teeth: [48,47,46,45,44,43,42,41] },
]

const TOOTH_TYPES: Record<number, string> = {
  11:'IC', 12:'IL', 13:'C', 14:'1PM', 15:'2PM', 16:'1M', 17:'2M', 18:'3M',
  21:'IC', 22:'IL', 23:'C', 24:'1PM', 25:'2PM', 26:'1M', 27:'2M', 28:'3M',
  31:'IC', 32:'IL', 33:'C', 34:'1PM', 35:'2PM', 36:'1M', 37:'2M', 38:'3M',
  41:'IC', 42:'IL', 43:'C', 44:'1PM', 45:'2PM', 46:'1M', 47:'2M', 48:'3M',
}

type ToothCondition =
  | 'higido'
  | 'carie'
  | 'restauracao'
  | 'extracao'
  | 'ausente'
  | 'implante'
  | 'endodontia'
  | 'protese'
  | 'fratura'
  | 'selante'

const CONDITIONS: { value: ToothCondition; label: string; color: string; icon: string }[] = [
  { value: 'higido',       label: 'Hígido',            color: '#16a34a', icon: '✓' },
  { value: 'carie',        label: 'Cárie',             color: '#dc2626', icon: '●' },
  { value: 'restauracao',  label: 'Restauração',       color: '#2563eb', icon: '■' },
  { value: 'extracao',     label: 'Extração Indicada', color: '#f97316', icon: '✕' },
  { value: 'ausente',      label: 'Ausente',           color: '#9ca3af', icon: '—' },
  { value: 'implante',     label: 'Implante',          color: '#8b5cf6', icon: '▲' },
  { value: 'endodontia',   label: 'Endodontia',       color: '#ec4899', icon: '◆' },
  { value: 'protese',      label: 'Prótese',           color: '#14b8a6', icon: '◎' },
  { value: 'fratura',      label: 'Fratura',           color: '#eab308', icon: '⚡' },
  { value: 'selante',      label: 'Selante',           color: '#06b6d4', icon: '◐' },
]

interface ToothData {
  tooth: number
  condition: ToothCondition
  faces?: string[]       // M, D, V, L, O
  observacao?: string
  procedimento_planejado?: string
  status_tratamento?: 'pendente' | 'em_andamento' | 'concluido'
  profissional_cor?: string
}

interface PeriodontalData {
  tooth: number
  profundidade: number[]  // vestibular, lingual (mm)
  sangramento: boolean
  mobilidade: number      // 0, 1, 2, 3
  recessao: number
}

interface DentalMappingProps {
  pacienteId: string
}

export function DentalMapping({ pacienteId }: DentalMappingProps) {
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId
  const { toast } = useToast()

  const [toothMap, setToothMap] = useState<Record<number, ToothData>>({})
  const [perioMap, setPerioMap] = useState<Record<number, PeriodontalData>>({})
  const [activeTooth, setActiveTooth] = useState<number | null>(null)
  const [activeCondition, setActiveCondition] = useState<ToothCondition>('carie')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sessions, setSessions] = useState<any[]>([])
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'odontograma' | 'periodontal' | 'plano'>('odontograma')
  const [planoTexto, setPlanoTexto] = useState('')
  const [observacoesGerais, setObservacoesGerais] = useState('')

  // Comparação de sessões
  const [compareMode, setCompareMode] = useState(false)
  const [compareSessionA, setCompareSessionA] = useState<string | null>(null)
  const [compareSessionB, setCompareSessionB] = useState<string | null>(null)

  // Profissionais para cor
  const [profissionais, setProfissionais] = useState<{ id: string; nome: string; cor: string }[]>([])

  // IA Plano de Tratamento
  const [showIAModal, setShowIAModal] = useState(false)
  const [iaGenerating, setIaGenerating] = useState(false)
  const [iaForm, setIaForm] = useState({
    queixaPrincipal: '',
    urgencia: 'moderada',
    orcamentoLimitado: false,
    historicoPaciente: '',
    preferencias: '',
  })
  const [iaResult, setIaResult] = useState<string | null>(null)

  // Carregar profissionais da clínica
  useEffect(() => {
    if (!clinicaId) return
    supabase.from('profiles').select('id, nome_completo, cor_agenda')
      .eq('clinica_id', clinicaId).eq('ativo', true)
      .then(({ data }) => {
        setProfissionais((data || []).map((p: any) => ({
          id: p.id, nome: p.nome_completo, cor: p.cor_agenda || '#3b82f6'
        })))
      })
  }, [clinicaId])

  // Carregar sessões anteriores
  useEffect(() => {
    if (!pacienteId) return
    supabase
      .from('harmonizacoes')
      .select('*, profiles:profissional_id(nome_completo)')
      .eq('paciente_id', pacienteId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const dental = (data || []).filter((s: any) => s.mapeamento?.tipo === 'odontograma')
        setSessions(dental)
      })
  }, [pacienteId])

  const handleToothClick = (tooth: number) => {
    setActiveTooth(tooth)
  }

  const updateToothData = (tooth: number, data: Partial<ToothData>) => {
    setToothMap(prev => ({
      ...prev,
      [tooth]: { ...prev[tooth], tooth, condition: prev[tooth]?.condition || 'higido', ...data }
    }))
  }

  const updatePerio = (tooth: number, data: Partial<PeriodontalData>) => {
    setPerioMap(prev => ({
      ...prev,
      [tooth]: { ...prev[tooth], tooth, profundidade: prev[tooth]?.profundidade || [0,0], sangramento: false, mobilidade: 0, recessao: 0, ...data }
    }))
  }

  const removeTooth = (tooth: number) => {
    setToothMap(prev => {
      const next = { ...prev }
      delete next[tooth]
      return next
    })
    setActiveTooth(null)
  }

  const getConditionColor = (tooth: number) => {
    const data = toothMap[tooth]
    if (!data) return '#e5e7eb'
    return CONDITIONS.find(c => c.value === data.condition)?.color || '#e5e7eb'
  }

  const registeredCount = Object.keys(toothMap).length
  const carieCount = Object.values(toothMap).filter(t => t.condition === 'carie').length
  const ausentes = Object.values(toothMap).filter(t => t.condition === 'ausente' || t.condition === 'extracao').length
  const tratConcluidos = Object.values(toothMap).filter(t => t.status_tratamento === 'concluido').length
  const tratPendentes = Object.values(toothMap).filter(t => t.condition !== 'higido' && t.condition !== 'ausente' && t.status_tratamento !== 'concluido').length

  // ── Imprimir Odontograma como PDF ──
  const handlePrintPDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4')
    const w = pdf.internal.pageSize.getWidth()
    const m = 15
    let y = 15

    // Header
    pdf.setFillColor(22, 163, 74)
    pdf.rect(0, 0, w, 2, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(16)
    pdf.setTextColor(17, 24, 39)
    pdf.text('Odontograma', m, y + 6)
    pdf.setFontSize(9)
    pdf.setTextColor(156, 163, 175)
    const dp = new Date().toISOString().split('T')[0].split('-')
    pdf.text(`Data: ${dp[2]}/${dp[1]}/${dp[0]}  |  Paciente ID: ${pacienteId.substring(0, 8)}`, m, y + 12)
    y += 20

    // Legenda
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(120, 120, 120)
    pdf.text('LEGENDA:', m, y)
    y += 4
    CONDITIONS.forEach((c, i) => {
      const col = i % 5
      const row = Math.floor(i / 5)
      const cx = m + col * 36
      const cy = y + row * 5
      const rgb = hexToRgb(c.color)
      pdf.setFillColor(rgb.r, rgb.g, rgb.b)
      pdf.circle(cx + 1.5, cy + 1, 1.5, 'F')
      pdf.setTextColor(60, 60, 60)
      pdf.text(c.label, cx + 5, cy + 1.5)
    })
    y += 12

    // Separator
    pdf.setDrawColor(229, 231, 235)
    pdf.line(m, y, w - m, y)
    y += 6

    // Dentes registrados
    const teeth = Object.values(toothMap).sort((a, b) => a.tooth - b.tooth)
    if (teeth.length === 0) {
      pdf.setFontSize(10)
      pdf.setTextColor(150, 150, 150)
      pdf.text('Nenhum dente registrado.', m, y + 5)
    } else {
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(100, 100, 100)
      pdf.text('DENTE', m, y)
      pdf.text('CONDIÇÃO', m + 18, y)
      pdf.text('FACES', m + 55, y)
      pdf.text('PROCEDIMENTO', m + 75, y)
      pdf.text('STATUS', m + 130, y)
      y += 2
      pdf.setDrawColor(229, 231, 235)
      pdf.line(m, y, w - m, y)
      y += 4

      pdf.setFont('helvetica', 'normal')
      teeth.forEach(t => {
        if (y > 275) { pdf.addPage(); y = 15 }
        const cfg = CONDITIONS.find(c => c.value === t.condition)
        const rgb = hexToRgb(cfg?.color || '#666')
        pdf.setFillColor(rgb.r, rgb.g, rgb.b)
        pdf.circle(m + 2, y - 0.5, 1.5, 'F')
        pdf.setTextColor(17, 24, 39)
        pdf.setFont('helvetica', 'bold')
        pdf.text(String(t.tooth), m + 6, y)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(60, 60, 60)
        pdf.text(cfg?.label || '—', m + 18, y)
        pdf.text(t.faces?.join(',') || '—', m + 55, y)
        pdf.text(t.procedimento_planejado || '—', m + 75, y)
        const st = t.status_tratamento === 'concluido' ? 'Concluído' : t.status_tratamento === 'em_andamento' ? 'Em andamento' : 'Pendente'
        pdf.text(st, m + 130, y)
        y += 5
      })
    }

    // Plano de tratamento
    if (planoTexto) {
      y += 6
      if (y > 250) { pdf.addPage(); y = 15 }
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(9)
      pdf.setTextColor(17, 24, 39)
      pdf.text('PLANO DE TRATAMENTO', m, y)
      y += 5
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.setTextColor(75, 85, 99)
      const lines = pdf.splitTextToSize(planoTexto, w - m * 2)
      for (const line of lines) {
        if (y > 280) { pdf.addPage(); y = 15 }
        pdf.text(line, m, y)
        y += 4
      }
    }

    // Footer
    pdf.setFontSize(6)
    pdf.setTextColor(180, 180, 180)
    pdf.text('Gerado pelo sistema Prontuário Verde', w / 2, 290, { align: 'center' })

    pdf.save(`odontograma_${pacienteId.substring(0, 8)}.pdf`)
    toast({ title: 'PDF gerado', type: 'success' })
  }

  // ── Gerar Orçamento do Plano de Tratamento ──
  const handleGerarOrcamento = async () => {
    if (!clinicaId || !pacienteId) return
    const teethComTratamento = Object.values(toothMap).filter(t => t.condition !== 'higido' && t.condition !== 'ausente')
    if (teethComTratamento.length === 0) {
      toast({ title: 'Aviso', description: 'Nenhum dente com tratamento para gerar orçamento.', type: 'warning' })
      return
    }

    try {
      // Buscar procedimentos da clínica para preços
      const { data: procs } = await supabase.from('procedimentos').select('nome, valor_particular').eq('clinica_id', clinicaId).eq('ativo', true)
      const procMap = new Map((procs || []).map((p: any) => [p.nome.toLowerCase(), p.valor_particular || 0]))

      const itens = teethComTratamento.map(t => {
        const procNome = t.procedimento_planejado || CONDITIONS.find(c => c.value === t.condition)?.label || 'Procedimento'
        const preco = procMap.get(procNome.toLowerCase()) || 0
        return {
          descricao: `Dente ${t.tooth} — ${procNome}${t.faces?.length ? ` (${t.faces.join(',')})` : ''}`,
          valor: preco,
          quantidade: 1,
        }
      })

      const total = itens.reduce((s, i) => s + i.valor, 0)

      const { data: orc, error } = await supabase.from('orcamentos').insert({
        clinica_id: clinicaId,
        paciente_id: pacienteId,
        itens,
        subtotal: total,
        total,
        status: 'pendente',
      } as any).select('id').single()

      if (error) throw error

      // Criar lançamento vinculado
      await supabase.from('lancamentos').insert({
        clinica_id: clinicaId,
        paciente_id: pacienteId,
        orcamento_id: orc.id,
        tipo: 'receita',
        descricao: `Orçamento odontológico — ${itens.length} procedimento(s)`,
        valor: total,
        status: 'pendente',
        categoria: 'procedimento',
        vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      } as any)

      toast({ title: 'Orçamento gerado!', description: `${itens.length} itens — R$ ${total.toFixed(2)}. Veja na aba Financeiro.`, type: 'success' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
    }
  }

  // ── Dados de comparação ──
  const getSessionData = (sessionId: string | null) => {
    if (!sessionId) return null
    const s = sessions.find((s: any) => s.id === sessionId)
    if (!s) return null
    const map = s.mapeamento && typeof s.mapeamento === 'object' ? s.mapeamento : {}
    return { dentes: map.dentes || {}, profissional: (s.profiles as any)?.nome_completo || '?', data: (s.created_at as string).split('T')[0] }
  }

  const reloadSessions = async () => {
    const { data } = await supabase
      .from('harmonizacoes')
      .select('*, profiles:profissional_id(nome_completo)')
      .eq('paciente_id', pacienteId)
      .order('created_at', { ascending: false })
    setSessions((data || []).filter((s: any) => s.mapeamento?.tipo === 'odontograma'))
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Excluir esta avaliação odontológica?')) return
    try {
      await supabase.from('harmonizacoes').delete().eq('id', sessionId)
      await reloadSessions()
      toast({ title: 'Sucesso', description: 'Avaliação removida.', type: 'success' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
    }
  }

  const handleLoadSession = (session: any) => {
    const map = session.mapeamento && typeof session.mapeamento === 'object' ? session.mapeamento : {}
    if (map.dentes) setToothMap(map.dentes)
    if (map.periodontal) setPerioMap(map.periodontal)
    if (map.plano_tratamento) setPlanoTexto(map.plano_tratamento)
    if (map.observacoes) setObservacoesGerais(map.observacoes)
    toast({ title: 'Carregado', description: 'Avaliação carregada para edição.', type: 'success' })
  }

  const handleGenerateAIPlan = async () => {
    if (!clinicaId) return
    setIaGenerating(true)
    setIaResult(null)
    try {
      const dentesResumo = Object.values(toothMap)
        .filter(t => t.condition !== 'higido')
        .map(t => `Dente ${t.tooth}: ${t.condition}${t.faces?.length ? ` (faces: ${t.faces.join(',')})` : ''}${t.procedimento_planejado ? ` → ${t.procedimento_planejado}` : ''}`)
        .join('\n') || 'Nenhum dente registrado no odontograma.'

      const perResumo = Object.values(perioMap)
        .filter(p => p.sangramento || p.mobilidade > 0 || (p.profundidade[0] > 3 || p.profundidade[1] > 3))
        .map(p => `Dente ${p.tooth}: prof. V=${p.profundidade[0]}mm L=${p.profundidade[1]}mm${p.sangramento ? ' SANGRAMENTO' : ''} mob=${p.mobilidade} rec=${p.recessao}mm`)
        .join('\n') || 'Sem dados periodontais relevantes.'

      const prompt = `INSTRUÇÃO: Você é um cirurgião-dentista especialista em planejamento de tratamento odontológico no Brasil.
Gere um PLANO DE TRATAMENTO COMPLETO e detalhado com base nos dados abaixo.

QUEIXA PRINCIPAL DO PACIENTE:
"${iaForm.queixaPrincipal || 'Não informada'}"

NÍVEL DE URGÊNCIA: ${iaForm.urgencia}
ORÇAMENTO LIMITADO: ${iaForm.orcamentoLimitado ? 'Sim, priorizar custo-benefício' : 'Não'}

HISTÓRICO DO PACIENTE:
${iaForm.historicoPaciente || 'Sem histórico relevante informado.'}

PREFERÊNCIAS DO PROFISSIONAL:
${iaForm.preferencias || 'Nenhuma preferência específica.'}

ODONTOGRAMA ATUAL:
${dentesResumo}

DADOS PERIODONTAIS:
${perResumo}

Responda APENAS com JSON válido:
{
  "queixa_principal": "resumo em 1-2 frases",
  "diagnostico": "PLANO DE TRATAMENTO COMPLETO formatado assim:\\n\\n**FASE 1 - URGÊNCIA**\\n1. Procedimento...\\n2. Procedimento...\\n\\n**FASE 2 - RESTAURADOR**\\n1. ...\\n\\n**FASE 3 - REABILITAÇÃO**\\n1. ...\\n\\n**MANUTENÇÃO**\\n- Retornos a cada X meses\\n- Profilaxia semestral\\n\\n**PRAZO ESTIMADO:** X meses\\n**SESSÕES ESTIMADAS:** X sessões\\n**PRIORIDADE:** Alta/Média/Baixa"
}`

      const { data, error } = await supabase.functions.invoke('ai-gateway', {
        body: { action: 'generate_summary', payload: { texto_clinico: prompt }, clinica_id: clinicaId }
      })
      if (error) throw error

      const resumo = data?.resumo || data?.data?.resumo
      if (resumo?.diagnostico) {
        setIaResult(resumo.diagnostico)
        toast({ title: 'Plano gerado', description: 'Revise e salve se estiver de acordo.', type: 'success' })
      } else {
        throw new Error('Resposta vazia da IA')
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Falha ao gerar plano.', type: 'error' })
    } finally {
      setIaGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!clinicaId) return
    setIsSubmitting(true)
    try {
      const mapeamento = {
        tipo: 'odontograma',
        dentes: toothMap,
        periodontal: perioMap,
        plano_tratamento: planoTexto,
        observacoes: observacoesGerais,
      }

      await supabase.from('harmonizacoes').insert({
        clinica_id: clinicaId,
        paciente_id: pacienteId,
        profissional_id: user?.id || null,
        mapeamento: JSON.parse(JSON.stringify(mapeamento)),
        observacoes_gerais: observacoesGerais || null,
      } as any)

      await reloadSessions()

      toast({ title: 'Sucesso', description: 'Odontograma salvo com sucesso.', type: 'success' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* KPIs + Ações */}
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KpiCard label="Registrados" value={registeredCount} total={32} color="blue" />
          <KpiCard label="Cáries" value={carieCount} color="red" />
          <KpiCard label="Ausentes" value={ausentes} color="orange" />
          <KpiCard label="Concluídos" value={tratConcluidos} color="green" />
          <KpiCard label="Pendentes" value={tratPendentes} color="yellow" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handlePrintPDF} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
            <Printer className="w-3.5 h-3.5" /> Imprimir PDF
          </button>
          <button onClick={handleGerarOrcamento} disabled={registeredCount === 0} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-600 bg-cyan-500/5 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/10 transition-colors disabled:opacity-40">
            <DollarSign className="w-3.5 h-3.5" /> Gerar Orçamento
          </button>
          <button onClick={() => { setCompareMode(!compareMode); setCompareSessionA(null); setCompareSessionB(null) }} className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border rounded-lg transition-colors", compareMode ? "text-blue-700 bg-blue-50 border-blue-200" : "text-gray-600 bg-white border-gray-200 hover:border-gray-300")}>
            <GitCompare className="w-3.5 h-3.5" /> {compareMode ? 'Sair da Comparação' : 'Comparar Sessões'}
          </button>
        </div>
      </div>

      {/* Comparação de Sessões */}
      {compareMode && sessions.length >= 2 && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 space-y-4">
          <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-2">
            <GitCompare className="w-4 h-4" /> Comparar Sessões
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Sessão A (anterior)</label>
              <select value={compareSessionA || ''} onChange={e => setCompareSessionA(e.target.value || null)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-xs outline-none">
                <option value="">Selecionar...</option>
                {sessions.map((s: any, i: number) => {
                  const dp = (s.created_at as string).split('T')[0].split('-')
                  return <option key={s.id} value={s.id}>#{sessions.length - i} — {dp[2]}/{dp[1]}/{dp[0]}</option>
                })}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Sessão B (recente)</label>
              <select value={compareSessionB || ''} onChange={e => setCompareSessionB(e.target.value || null)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-xs outline-none">
                <option value="">Selecionar...</option>
                {sessions.map((s: any, i: number) => {
                  const dp = (s.created_at as string).split('T')[0].split('-')
                  return <option key={s.id} value={s.id}>#{sessions.length - i} — {dp[2]}/{dp[1]}/{dp[0]}</option>
                })}
              </select>
            </div>
          </div>

          {compareSessionA && compareSessionB && (() => {
            const a = getSessionData(compareSessionA)
            const b = getSessionData(compareSessionB)
            if (!a || !b) return null

            const allTeeth = new Set([...Object.keys(a.dentes), ...Object.keys(b.dentes)])
            const changes: { tooth: string; antes: string; depois: string }[] = []
            allTeeth.forEach(t => {
              const condA = (a.dentes[t] as any)?.condition || '—'
              const condB = (b.dentes[t] as any)?.condition || '—'
              if (condA !== condB) changes.push({ tooth: t, antes: condA, depois: condB })
            })

            return (
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Sessão A: <b>{Object.keys(a.dentes).length} dentes</b> por {a.profissional}</span>
                  <span>→</span>
                  <span>Sessão B: <b>{Object.keys(b.dentes).length} dentes</b> por {b.profissional}</span>
                </div>
                {changes.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{changes.length} mudança{changes.length > 1 ? 's' : ''} detectada{changes.length > 1 ? 's' : ''}</p>
                    {changes.map(c => {
                      const cfgA = CONDITIONS.find(x => x.value === c.antes)
                      const cfgB = CONDITIONS.find(x => x.value === c.depois)
                      return (
                        <div key={c.tooth} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg text-xs">
                          <span className="font-bold text-gray-900 w-12">Dente {c.tooth}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: `${cfgA?.color || '#999'}20`, color: cfgA?.color || '#999' }}>{cfgA?.label || c.antes}</span>
                          <span className="text-gray-300">→</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: `${cfgB?.color || '#999'}20`, color: cfgB?.color || '#999' }}>{cfgB?.label || c.depois}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Nenhuma mudança detectada entre as sessões.</p>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-xl border border-gray-100">
        {([
          { key: 'odontograma', label: 'Odontograma', icon: <Search className="w-4 h-4" /> },
          { key: 'periodontal', label: 'Periodontal', icon: <Activity className="w-4 h-4" /> },
          { key: 'plano', label: 'Plano de Tratamento', icon: <FileText className="w-4 h-4" /> },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              'flex-1 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all',
              activeTab === t.key ? 'bg-white text-blue-700 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Odontograma Tab */}
      {activeTab === 'odontograma' && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Mapa Dental */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Odontograma Interativo</h3>
              <button
                onClick={handleSave}
                disabled={isSubmitting || registeredCount === 0}
                className="btn-primary py-2 px-5 text-xs flex items-center gap-2"
              >
                {isSubmitting ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar
              </button>
            </div>

            {/* Legenda de condições */}
            <div className="flex flex-wrap gap-2 mb-6 p-3 bg-gray-50 rounded-xl">
              {CONDITIONS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setActiveCondition(c.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all",
                    activeCondition === c.value
                      ? 'bg-white shadow-sm scale-105'
                      : 'opacity-60 hover:opacity-100'
                  )}
                  style={activeCondition === c.value ? { borderColor: c.color, color: c.color } : { borderColor: '#e5e7eb', color: '#6b7280' }}
                >
                  <span style={{ color: c.color }}>{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>

            {/* Arcadas */}
            <div className="space-y-6">
              {/* Superior */}
              <div className="space-y-2">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Arcada Superior</p>
                <div className="flex justify-center gap-1">
                  {QUADRANTS[0].teeth.map(t => (
                    <ToothButton key={t} tooth={t} color={getConditionColor(t)} isActive={activeTooth === t} data={toothMap[t]} onClick={() => { handleToothClick(t); applyConditionTo(t) }} />
                  ))}
                  <div className="w-px bg-gray-200 mx-1" />
                  {QUADRANTS[1].teeth.map(t => (
                    <ToothButton key={t} tooth={t} color={getConditionColor(t)} isActive={activeTooth === t} data={toothMap[t]} onClick={() => { handleToothClick(t); applyConditionTo(t) }} />
                  ))}
                </div>
              </div>
              {/* Inferior */}
              <div className="space-y-2">
                <div className="flex justify-center gap-1">
                  {QUADRANTS[3].teeth.map(t => (
                    <ToothButton key={t} tooth={t} color={getConditionColor(t)} isActive={activeTooth === t} data={toothMap[t]} onClick={() => { handleToothClick(t); applyConditionTo(t) }} />
                  ))}
                  <div className="w-px bg-gray-200 mx-1" />
                  {QUADRANTS[2].teeth.map(t => (
                    <ToothButton key={t} tooth={t} color={getConditionColor(t)} isActive={activeTooth === t} data={toothMap[t]} onClick={() => { handleToothClick(t); applyConditionTo(t) }} />
                  ))}
                </div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Arcada Inferior</p>
              </div>
            </div>

            {/* Observações */}
            <div className="mt-6">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Observações Gerais</label>
              <textarea
                value={observacoesGerais}
                onChange={(e) => setObservacoesGerais(e.target.value)}
                placeholder="Observações clínicas, notas sobre oclusão, ATM, etc..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 resize-none min-h-[60px] transition-all"
                rows={2}
              />
            </div>
          </div>

          {/* Painel Lateral - Detalhes do Dente Selecionado */}
          <div className="w-full lg:w-80 space-y-4">
            {activeTooth ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <div>
                    <h4 className="text-lg font-black text-gray-900">Dente {activeTooth}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{TOOTH_TYPES[activeTooth] || ''} · Quadrante {Math.floor(activeTooth / 10)}</p>
                  </div>
                  <button onClick={() => setActiveTooth(null)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Condição */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Condição</label>
                    <select
                      value={toothMap[activeTooth]?.condition || 'higido'}
                      onChange={(e) => updateToothData(activeTooth, { condition: e.target.value as ToothCondition })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm font-bold outline-none"
                    >
                      {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                    </select>
                  </div>

                  {/* Faces afetadas */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Faces Afetadas</label>
                    <div className="flex gap-1.5">
                      {['M','D','V','L','O'].map(face => {
                        const isSelected = toothMap[activeTooth]?.faces?.includes(face)
                        return (
                          <button
                            key={face}
                            onClick={() => {
                              const current = toothMap[activeTooth]?.faces || []
                              const next = isSelected ? current.filter(f => f !== face) : [...current, face]
                              updateToothData(activeTooth, { faces: next })
                            }}
                            className={cn(
                              "w-10 h-10 rounded-xl text-xs font-black border-2 transition-all",
                              isSelected ? "bg-blue-600 text-white border-blue-600" : "bg-gray-50 text-gray-400 border-gray-200 hover:border-blue-300"
                            )}
                          >
                            {face}
                          </button>
                        )
                      })}
                    </div>
                    <p className="text-[9px] text-gray-300 mt-1">M=Mesial D=Distal V=Vestibular L=Lingual O=Oclusal</p>
                  </div>

                  {/* Procedimento planejado */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Procedimento Planejado</label>
                    <input
                      value={toothMap[activeTooth]?.procedimento_planejado || ''}
                      onChange={(e) => updateToothData(activeTooth, { procedimento_planejado: e.target.value })}
                      placeholder="Ex: Restauração classe II em resina"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs outline-none"
                    />
                  </div>

                  {/* Observação */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Observação</label>
                    <textarea
                      value={toothMap[activeTooth]?.observacao || ''}
                      onChange={(e) => updateToothData(activeTooth, { observacao: e.target.value })}
                      placeholder="Notas sobre este dente..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs outline-none resize-none min-h-[60px]"
                    />
                  </div>

                  {/* Status do tratamento */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Status do Tratamento</label>
                    <div className="flex gap-1">
                      {([
                        { v: 'pendente', l: 'Pendente', c: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                        { v: 'em_andamento', l: 'Em andamento', c: 'bg-blue-100 text-blue-700 border-blue-200' },
                        { v: 'concluido', l: 'Concluído', c: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
                      ] as const).map(st => (
                        <button
                          key={st.v}
                          onClick={() => updateToothData(activeTooth, { status_tratamento: st.v })}
                          className={cn(
                            "flex-1 py-1.5 rounded-lg text-[9px] font-bold border transition-all",
                            toothMap[activeTooth]?.status_tratamento === st.v ? st.c : "bg-gray-50 text-gray-400 border-gray-200"
                          )}
                        >
                          {st.l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Profissional responsável */}
                  {profissionais.length > 0 && (
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Profissional</label>
                      <div className="flex flex-wrap gap-1">
                        {profissionais.map(p => (
                          <button
                            key={p.id}
                            onClick={() => updateToothData(activeTooth, { profissional_cor: p.cor })}
                            className={cn(
                              "flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold border transition-all",
                              toothMap[activeTooth]?.profissional_cor === p.cor ? "border-2 shadow-sm" : "border-gray-200 opacity-60"
                            )}
                            style={toothMap[activeTooth]?.profissional_cor === p.cor ? { borderColor: p.cor, color: p.cor } : {}}
                          >
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.cor }} />
                            {p.nome.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {toothMap[activeTooth] && (
                    <button onClick={() => removeTooth(activeTooth)} className="w-full py-2 text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 flex items-center justify-center gap-2">
                      <Trash2 className="w-3.5 h-3.5" /> Remover Registro
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <Info className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                <p className="text-xs font-bold text-gray-400">Selecione uma condição na legenda e clique em um dente</p>
              </div>
            )}

            {/* Resumo rápido */}
            {registeredCount > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Resumo</h4>
                <div className="space-y-1.5">
                  {CONDITIONS.filter(c => Object.values(toothMap).some(t => t.condition === c.value)).map(c => {
                    const count = Object.values(toothMap).filter(t => t.condition === c.value).length
                    return (
                      <div key={c.value} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2">
                          <span style={{ color: c.color }}>{c.icon}</span>
                          <span className="text-gray-600 font-medium">{c.label}</span>
                        </span>
                        <span className="font-black" style={{ color: c.color }}>{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Periodontal Tab */}
      {activeTab === 'periodontal' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <div className="mb-6">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Avaliação Periodontal</h3>
            <p className="text-xs text-gray-400 mt-1">Profundidade de sondagem, sangramento, mobilidade e recessão</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="text-left py-3 px-2">Dente</th>
                  <th className="py-3 px-2">Prof. V (mm)</th>
                  <th className="py-3 px-2">Prof. L (mm)</th>
                  <th className="py-3 px-2">Sangramento</th>
                  <th className="py-3 px-2">Mobilidade</th>
                  <th className="py-3 px-2">Recessão (mm)</th>
                </tr>
              </thead>
              <tbody>
                {[...QUADRANTS[0].teeth, ...QUADRANTS[1].teeth, 0, ...QUADRANTS[3].teeth, ...QUADRANTS[2].teeth].map((t, i) => {
                  if (t === 0) return (
                    <tr key={`sep-${i}`} className="h-2 bg-gray-100">
                      <td colSpan={6} className="text-[9px] text-gray-400 font-bold text-center uppercase tracking-widest py-1">Arcada Inferior</td>
                    </tr>
                  )
                  return (
                  <tr key={t} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-2 px-2 font-black text-gray-700">{t}</td>
                    <td className="py-2 px-2"><input type="number" min={0} max={15} className="w-14 bg-gray-50 border border-gray-200 rounded-lg py-1 px-2 text-center outline-none" value={perioMap[t]?.profundidade?.[0] || ''} onChange={(e) => updatePerio(t, { profundidade: [parseInt(e.target.value) || 0, perioMap[t]?.profundidade?.[1] || 0] })} /></td>
                    <td className="py-2 px-2"><input type="number" min={0} max={15} className="w-14 bg-gray-50 border border-gray-200 rounded-lg py-1 px-2 text-center outline-none" value={perioMap[t]?.profundidade?.[1] || ''} onChange={(e) => updatePerio(t, { profundidade: [perioMap[t]?.profundidade?.[0] || 0, parseInt(e.target.value) || 0] })} /></td>
                    <td className="py-2 px-2 text-center">
                      <button onClick={() => updatePerio(t, { sangramento: !perioMap[t]?.sangramento })} className={cn("w-6 h-6 rounded-full border-2 transition-all mx-auto", perioMap[t]?.sangramento ? "bg-red-500 border-red-500" : "bg-white border-gray-200")} />
                    </td>
                    <td className="py-2 px-2">
                      <select className="bg-gray-50 border border-gray-200 rounded-lg py-1 px-2 outline-none" value={perioMap[t]?.mobilidade || 0} onChange={(e) => updatePerio(t, { mobilidade: parseInt(e.target.value) })}>
                        {[0,1,2,3].map(v => <option key={v} value={v}>Grau {v}</option>)}
                      </select>
                    </td>
                    <td className="py-2 px-2"><input type="number" min={0} max={15} className="w-14 bg-gray-50 border border-gray-200 rounded-lg py-1 px-2 text-center outline-none" value={perioMap[t]?.recessao || ''} onChange={(e) => updatePerio(t, { recessao: parseInt(e.target.value) || 0 })} /></td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> = Sangramento</span>
              <span>V = Vestibular · L = Lingual</span>
            </div>
            <button onClick={handleSave} disabled={isSubmitting} className="btn-primary py-2 px-5 text-xs flex items-center gap-2">
              {isSubmitting ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar Periodontal
            </button>
          </div>
        </div>
      )}

      {/* Plano de Tratamento Tab */}
      {activeTab === 'plano' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Plano de Tratamento</h3>
              <p className="text-xs text-gray-400 mt-1">Defina as etapas e prioridades do tratamento</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowIAModal(true)}
                className="py-2 px-5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20"
              >
                <Sparkles className="w-4 h-4" /> Gerar com IA
              </button>
              <button onClick={handleSave} disabled={isSubmitting} className="btn-primary py-2 px-5 text-xs flex items-center gap-2">
                {isSubmitting ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar Plano
              </button>
            </div>
          </div>

          {/* Procedimentos detectados automaticamente */}
          {registeredCount > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" /> Procedimentos Sugeridos (do Odontograma)
              </h4>
              <div className="space-y-2">
                {Object.values(toothMap).filter(t => t.condition !== 'higido' && t.condition !== 'ausente').map(t => (
                  <div key={t.tooth} className="flex items-center justify-between text-xs bg-white rounded-lg p-2.5 border border-blue-100">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-gray-900">Dente {t.tooth}</span>
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold" style={{ backgroundColor: `${CONDITIONS.find(c => c.value === t.condition)?.color}15`, color: CONDITIONS.find(c => c.value === t.condition)?.color }}>
                        {CONDITIONS.find(c => c.value === t.condition)?.label}
                      </span>
                    </div>
                    <span className="text-gray-500 font-medium">{t.procedimento_planejado || t.faces?.join(',') || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <textarea
            value={planoTexto}
            onChange={(e) => setPlanoTexto(e.target.value)}
            placeholder={"1. Urgência: Restauração do dente 36 (cárie extensa)\n2. Tratamento endodôntico dente 46\n3. Exodontia do 38 (terceiro molar incluso)\n4. Profilaxia e raspagem\n5. Moldagem para prótese parcial\n\nPrazo estimado: 3 meses\nRetorno: 15 dias após cada procedimento"}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 resize-none min-h-[250px] transition-all"
            rows={12}
          />
        </div>
      )}

      {/* Histórico de Sessões — Visual Interativo */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-blue-950 rounded-2xl p-6 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <History className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest">Histórico Odontológico</h3>
                <p className="text-[10px] text-gray-500 font-medium mt-0.5">{sessions.length} avaliação(ões) registrada(s)</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {sessions.length > 0 ? sessions.map((s: any, sIdx: number) => {
              const map = s.mapeamento && typeof s.mapeamento === 'object' ? s.mapeamento : {}
              const dentesObj = map.dentes || {}
              const dentesArr = Object.values(dentesObj) as any[]
              const dentesCount = dentesArr.length
              const isOpen = expandedSession === s.id

              // Mini stats por condição
              const condStats: Record<string, number> = {}
              dentesArr.forEach((d: any) => { condStats[d.condition] = (condStats[d.condition] || 0) + 1 })

              return (
                <div key={s.id} className={cn("rounded-2xl border transition-all duration-300 overflow-hidden", isOpen ? "border-blue-500/30 bg-white/[0.03]" : "border-white/5 hover:border-white/10 bg-white/[0.02]")}>
                  {/* Header */}
                  <div className="p-5 flex items-start justify-between">
                    <div className="flex items-start gap-4 cursor-pointer flex-1" onClick={() => setExpandedSession(isOpen ? null : s.id)}>
                      {/* Número da sessão */}
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/20 shrink-0">
                        {sessions.length - sIdx}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black">{(() => { const p = (s.created_at as string).split('T')[0].split('-'); return `${p[2]}/${p[1]}/${p[0]}` })()}</p>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">{(s.profiles as any)?.nome_completo || 'Profissional'}</p>

                        {/* Mini badges de condições */}
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {Object.entries(condStats).map(([cond, count]) => {
                            const cfg = CONDITIONS.find(c => c.value === cond)
                            if (!cfg) return null
                            return (
                              <span key={cond} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold" style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}>
                                {cfg.icon} {count} {cfg.label}
                              </span>
                            )
                          })}
                          {dentesCount === 0 && <span className="text-[10px] text-gray-600">Sem dentes registrados</span>}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleLoadSession(s)} className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all" title="Editar">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteSession(s.id)} className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setExpandedSession(isOpen ? null : s.id)} className="p-2 text-gray-500 hover:text-white rounded-lg transition-all">
                        <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isOpen && "rotate-180")} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isOpen && (
                    <div className="px-5 pb-5 animate-fade-in space-y-4">
                      {/* Mini Odontograma Visual */}
                      {dentesCount > 0 && (
                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">Mapa Dental</p>
                          <div className="flex flex-wrap gap-1 justify-center">
                            {[...Array(32)].map((_, i) => {
                              const toothNum = i < 8 ? 18 - i : i < 16 ? 21 + (i - 8) : i < 24 ? 38 - (i - 16) : 41 + (i - 24)
                              const d = dentesObj[toothNum]
                              const cfg = d ? CONDITIONS.find(c => c.value === d.condition) : null
                              return (
                                <div
                                  key={toothNum}
                                  className={cn("w-6 h-7 rounded text-[8px] font-bold flex items-center justify-center border", i === 8 || i === 24 ? 'ml-2' : '')}
                                  style={cfg ? { backgroundColor: `${cfg.color}25`, borderColor: `${cfg.color}50`, color: cfg.color } : { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)', color: '#4b5563' }}
                                  title={d ? `${toothNum}: ${d.condition}` : `${toothNum}`}
                                >
                                  {d ? cfg?.icon : toothNum}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Detalhes por dente */}
                      {dentesCount > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {dentesArr.map((d: any) => {
                            const cfg = CONDITIONS.find(c => c.value === d.condition)
                            return (
                              <div key={d.tooth} className="flex items-center gap-3 p-2.5 bg-white/5 rounded-lg border border-white/5 text-xs">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ backgroundColor: `${cfg?.color || '#666'}20`, color: cfg?.color || '#666' }}>
                                  {d.tooth}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold" style={{ color: cfg?.color }}>{cfg?.label}</span>
                                    {d.faces?.length > 0 && <span className="text-gray-500">({d.faces.join(',')})</span>}
                                  </div>
                                  {d.procedimento_planejado && <p className="text-gray-400 text-[10px] truncate">{d.procedimento_planejado}</p>}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Plano e observações */}
                      {map.plano_tratamento && (
                        <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
                          <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><FileText className="w-3 h-3" /> Plano de Tratamento</p>
                          <p className="text-xs text-gray-300 whitespace-pre-line leading-relaxed">{map.plano_tratamento}</p>
                        </div>
                      )}
                      {map.observacoes && (
                        <p className="text-xs text-gray-500 italic px-1">{map.observacoes}</p>
                      )}
                    </div>
                  )}
                </div>
              )
            }) : (
              <div className="py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-700" />
                </div>
                <p className="text-xs font-black text-gray-600 uppercase tracking-widest">Nenhuma avaliação anterior</p>
                <p className="text-[10px] text-gray-700 mt-1">Preencha o odontograma acima e salve</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal IA - Gerar Plano de Tratamento */}
      {showIAModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl animate-fade-in" onClick={() => setShowIAModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-in">
            <div className="bg-purple-600 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6" />
                <div>
                  <h3 className="text-lg font-black">Plano de Tratamento com IA</h3>
                  <p className="text-xs text-purple-200">Responda as perguntas e a IA gera o plano</p>
                </div>
              </div>
              <button onClick={() => setShowIAModal(false)} className="p-2 hover:bg-white/10 rounded-xl"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Queixa principal do paciente</label>
                <input value={iaForm.queixaPrincipal} onChange={(e) => setIaForm(p => ({ ...p, queixaPrincipal: e.target.value }))} placeholder="Ex: Dor no dente 36, sangramento gengival..." className="input-base text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Nível de urgência</label>
                <div className="flex gap-2">
                  {['baixa', 'moderada', 'alta', 'emergência'].map(u => (
                    <button key={u} onClick={() => setIaForm(p => ({ ...p, urgencia: u }))} className={cn("flex-1 py-2 rounded-xl text-xs font-bold border transition-all capitalize", iaForm.urgencia === u ? "bg-purple-600 text-white border-purple-600" : "bg-gray-50 text-gray-500 border-gray-200")}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Histórico relevante do paciente</label>
                <textarea value={iaForm.historicoPaciente} onChange={(e) => setIaForm(p => ({ ...p, historicoPaciente: e.target.value }))} placeholder="Ex: Diabético, usa anticoagulante, alergia a penicilina..." className="input-base text-sm min-h-[60px] resize-none" rows={2} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Preferências do profissional</label>
                <textarea value={iaForm.preferencias} onChange={(e) => setIaForm(p => ({ ...p, preferencias: e.target.value }))} placeholder="Ex: Priorizar estética, usar resina flow, evitar amalgama..." className="input-base text-sm min-h-[60px] resize-none" rows={2} />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-xs font-bold text-gray-600">Paciente com orçamento limitado?</span>
                <button onClick={() => setIaForm(p => ({ ...p, orcamentoLimitado: !p.orcamentoLimitado }))} className={cn("w-10 h-6 rounded-full p-1 transition-all", iaForm.orcamentoLimitado ? "bg-purple-500" : "bg-gray-200")}>
                  <div className={cn("w-4 h-4 rounded-full bg-white shadow-sm transition-transform", iaForm.orcamentoLimitado ? "translate-x-4" : "translate-x-0")} />
                </button>
              </div>

              {registeredCount > 0 && (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-600 font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  {registeredCount} dente(s) do odontograma serão incluídos automaticamente na análise
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowIAModal(false)} className="flex-1 btn-secondary">Cancelar</button>
              <button
                onClick={handleGenerateAIPlan}
                disabled={iaGenerating}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-purple-600/20"
              >
                {iaGenerating ? <><Activity className="w-4 h-4 animate-spin" /> Gerando...</> : <><Sparkles className="w-4 h-4" /> Gerar Plano</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resultado do Plano IA */}
      {iaResult && (
        <div className="bg-purple-50 rounded-2xl border border-purple-100 p-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-purple-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Plano Gerado pela IA
            </h4>
            <span className="text-[9px] font-bold text-purple-400 bg-purple-100 px-2 py-1 rounded-lg">Gemini</span>
          </div>
          <div className="bg-white rounded-xl border border-purple-100 p-5 max-h-64 overflow-y-auto custom-scrollbar">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{iaResult}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setPlanoTexto(iaResult); setIaResult(null); setShowIAModal(false); toast({ title: 'Aplicado', description: 'Plano inserido. Clique em Salvar Plano para gravar.', type: 'success' }) }}
              className="flex-1 py-3 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/10"
            >
              <CheckCircle className="w-4 h-4" /> Usar este Plano
            </button>
            <button onClick={() => setIaResult(null)} className="py-3 px-4 bg-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">
              Descartar
            </button>
          </div>
        </div>
      )}
    </div>
  )

  function applyConditionTo(tooth: number) {
    setToothMap(prev => ({
      ...prev,
      [tooth]: { ...prev[tooth], tooth, condition: activeCondition }
    }))
  }
}

// ─── Sub-componentes ─────────────────────────────────────────────────

function ToothButton({ tooth, color, isActive, data, onClick }: { tooth: number; color: string; isActive: boolean; data?: ToothData; onClick: () => void }) {
  const condIcon = data ? CONDITIONS.find(c => c.value === data.condition)?.icon : ''
  const statusColor = data?.status_tratamento === 'concluido' ? '#22c55e' : data?.status_tratamento === 'em_andamento' ? '#3b82f6' : undefined
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-9 h-12 rounded-lg flex flex-col items-center justify-center text-[10px] font-black border-2 transition-all hover:scale-110 active:scale-95 relative",
        isActive ? "ring-2 ring-blue-400 ring-offset-2 scale-110" : ""
      )}
      style={{ borderColor: color, backgroundColor: `${color}15`, color: data ? color : '#9ca3af' }}
      title={`Dente ${tooth} - ${TOOTH_TYPES[tooth] || ''}`}
    >
      <span>{tooth}</span>
      {condIcon && <span className="text-[8px] leading-none">{condIcon}</span>}
      {/* Indicador de profissional (borda inferior colorida) */}
      {data?.profissional_cor && (
        <div className="absolute bottom-0 left-1 right-1 h-1 rounded-b" style={{ backgroundColor: data.profissional_cor }} />
      )}
      {/* Indicador de status (dot no canto) */}
      {statusColor && (
        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ backgroundColor: statusColor }} />
      )}
    </button>
  )
}

function KpiCard({ label, value, total, color }: { label: string; value: string | number; total?: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  }
  return (
    <div className={cn("p-4 rounded-2xl border", colors[color])}>
      <p className="text-2xl font-black">{value}{total ? <span className="text-sm opacity-50">/{total}</span> : null}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60">{label}</p>
    </div>
  )
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) || 0
  const g = parseInt(hex.slice(3, 5), 16) || 0
  const b = parseInt(hex.slice(5, 7), 16) || 0
  return { r, g, b }
}
