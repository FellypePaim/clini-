import { useState, useEffect, useCallback } from 'react'
import {
  Heart, Activity, AlertTriangle,
  Save, Loader2, TrendingUp, ClipboardList, CheckCircle, Trash2, Edit3
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { cn } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../hooks/useToast'

const CONDICOES_COMUNS = [
  { id: 'diabetes', label: 'Diabetes', cor: 'red' },
  { id: 'hipertensao', label: 'Hipertensão', cor: 'red' },
  { id: 'cardiopatia', label: 'Cardiopatia', cor: 'red' },
  { id: 'asma', label: 'Asma/Bronquite', cor: 'orange' },
  { id: 'tireoide', label: 'Tireoide', cor: 'orange' },
  { id: 'hepatite', label: 'Hepatite', cor: 'orange' },
  { id: 'hiv', label: 'HIV/AIDS', cor: 'red' },
  { id: 'renal', label: 'Doença Renal', cor: 'orange' },
  { id: 'epilepsia', label: 'Epilepsia', cor: 'purple' },
  { id: 'depressao', label: 'Depressão/Ansiedade', cor: 'blue' },
  { id: 'gestante', label: 'Gestante', cor: 'pink' },
  { id: 'lactante', label: 'Lactante', cor: 'pink' },
  { id: 'anticoagulante', label: 'Uso de Anticoagulante', cor: 'red' },
  { id: 'fumante', label: 'Tabagista', cor: 'gray' },
  { id: 'etilista', label: 'Etilista', cor: 'gray' },
]

const DOR_CORES = ['#22c55e','#22c55e','#84cc16','#eab308','#eab308','#f97316','#f97316','#ef4444','#ef4444','#dc2626','#991b1b']

interface SinaisVitais {
  pressao_sistolica: string
  pressao_diastolica: string
  frequencia_cardiaca: string
  saturacao_o2: string
  temperatura: string
  peso: string
  altura: string
  escala_dor: number
  observacoes: string
}

const sinaisVazio: SinaisVitais = {
  pressao_sistolica: '', pressao_diastolica: '', frequencia_cardiaca: '',
  saturacao_o2: '', temperatura: '', peso: '', altura: '',
  escala_dor: 0, observacoes: ''
}

interface Props {
  pacienteId: string
  patient: any
  onUpdatePatient: (id: string, data: any) => Promise<void>
}

export function PatientAnamnese({ pacienteId, patient, onUpdatePatient }: Props) {
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId
  const { toast } = useToast()

  const [sinais, setSinais] = useState<SinaisVitais>(sinaisVazio)
  const [savingSinais, setSavingSinais] = useState(false)
  const [historySinais, setHistorySinais] = useState<any[]>([])
  const [condicoes, setCondicoes] = useState<string[]>(patient?.condicoes_medicas || [])
  const [savingCondicoes, setSavingCondicoes] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Carregar histórico de sinais vitais
  const loadSinais = useCallback(async () => {
    if (!pacienteId) return
    const { data } = await supabase
      .from('sinais_vitais')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('created_at', { ascending: false })
      .limit(20)
    setHistorySinais(data || [])
  }, [pacienteId])

  useEffect(() => { loadSinais() }, [loadSinais])

  useEffect(() => {
    setCondicoes(patient?.condicoes_medicas || [])
  }, [patient?.condicoes_medicas])

  const calcIMC = () => {
    const p = parseFloat(sinais.peso)
    const a = parseFloat(sinais.altura) / 100
    if (p > 0 && a > 0) return (p / (a * a)).toFixed(1)
    return null
  }

  const handleSaveSinais = async () => {
    if (!clinicaId || !pacienteId) return
    setSavingSinais(true)
    try {
      const imc = calcIMC()
      const { error } = await supabase.from('sinais_vitais').insert({
        clinica_id: clinicaId,
        paciente_id: pacienteId,
        profissional_id: user?.id,
        pressao_sistolica: sinais.pressao_sistolica ? parseInt(sinais.pressao_sistolica) : null,
        pressao_diastolica: sinais.pressao_diastolica ? parseInt(sinais.pressao_diastolica) : null,
        frequencia_cardiaca: sinais.frequencia_cardiaca ? parseInt(sinais.frequencia_cardiaca) : null,
        saturacao_o2: sinais.saturacao_o2 ? parseInt(sinais.saturacao_o2) : null,
        temperatura: sinais.temperatura ? parseFloat(sinais.temperatura) : null,
        peso: sinais.peso ? parseFloat(sinais.peso) : null,
        altura: sinais.altura ? parseFloat(sinais.altura) : null,
        imc: imc ? parseFloat(imc) : null,
        escala_dor: sinais.escala_dor,
        observacoes: sinais.observacoes || null,
      } as any)
      if (error) throw error
      toast({ title: 'Sinais vitais registrados', type: 'success' })
      setSinais(sinaisVazio)
      await loadSinais()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
    } finally {
      setSavingSinais(false)
    }
  }

  const handleDeleteSinais = async (id: string) => {
    if (!confirm('Excluir este registro de sinais vitais?')) return
    try {
      await supabase.from('sinais_vitais').delete().eq('id', id)
      toast({ title: 'Removido', type: 'success' })
      await loadSinais()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
    }
  }

  const handleEditSinais = (record: any) => {
    setEditingId(record.id)
    setSinais({
      pressao_sistolica: record.pressao_sistolica?.toString() || '',
      pressao_diastolica: record.pressao_diastolica?.toString() || '',
      frequencia_cardiaca: record.frequencia_cardiaca?.toString() || '',
      saturacao_o2: record.saturacao_o2?.toString() || '',
      temperatura: record.temperatura?.toString() || '',
      peso: record.peso?.toString() || '',
      altura: record.altura?.toString() || '',
      escala_dor: record.escala_dor ?? 0,
      observacoes: record.observacoes || '',
    })
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSaveSinaisEdited = async () => {
    if (!editingId) return
    setSavingSinais(true)
    try {
      const imc = calcIMC()
      const { error } = await supabase.from('sinais_vitais').update({
        pressao_sistolica: sinais.pressao_sistolica ? parseInt(sinais.pressao_sistolica) : null,
        pressao_diastolica: sinais.pressao_diastolica ? parseInt(sinais.pressao_diastolica) : null,
        frequencia_cardiaca: sinais.frequencia_cardiaca ? parseInt(sinais.frequencia_cardiaca) : null,
        saturacao_o2: sinais.saturacao_o2 ? parseInt(sinais.saturacao_o2) : null,
        temperatura: sinais.temperatura ? parseFloat(sinais.temperatura) : null,
        peso: sinais.peso ? parseFloat(sinais.peso) : null,
        altura: sinais.altura ? parseFloat(sinais.altura) : null,
        imc: imc ? parseFloat(imc) : null,
        escala_dor: sinais.escala_dor,
        observacoes: sinais.observacoes || null,
      } as any).eq('id', editingId)
      if (error) throw error
      toast({ title: 'Atualizado', type: 'success' })
      setSinais(sinaisVazio)
      setEditingId(null)
      await loadSinais()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
    } finally {
      setSavingSinais(false)
    }
  }

  const toggleCondicao = (id: string) => {
    setCondicoes(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  const handleSaveCondicoes = async () => {
    if (!pacienteId) return
    setSavingCondicoes(true)
    try {
      await onUpdatePatient(pacienteId, { condicoes_medicas: condicoes } as any)
      toast({ title: 'Condições salvas', type: 'success' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
    } finally {
      setSavingCondicoes(false)
    }
  }

  // Alergias do paciente
  const alergias = patient?.alergias?.length ? patient.alergias : []
  const condicoesAtivas = CONDICOES_COMUNS.filter(c => condicoes.includes(c.id))
  const temAlertas = alergias.length > 0 || condicoesAtivas.some(c => c.cor === 'red')

  // Dados para gráfico
  const chartData = [...historySinais].reverse().map((s: any) => ({
    data: (s.created_at as string).split('T')[0].split('-').slice(1).join('/'),
    peso: s.peso,
    pas: s.pressao_sistolica,
    pad: s.pressao_diastolica,
    fc: s.frequencia_cardiaca,
  })).filter(d => d.peso || d.pas)

  const imc = calcIMC()

  return (
    <div className="space-y-5">
      {/* Alertas */}
      {temAlertas && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800">Atenção — Alertas do Paciente</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {alergias.map((a: string) => (
                <span key={a} className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md text-xs font-semibold">Alergia: {a}</span>
              ))}
              {condicoesAtivas.filter(c => c.cor === 'red').map(c => (
                <span key={c.id} className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md text-xs font-semibold">{c.label}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sinais Vitais - Registro Atual */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-bold text-gray-900">Sinais Vitais</h3>
            <span className="text-xs text-gray-400">— {editingId ? 'editando registro' : 'registrar agora'}</span>
          </div>
          <div className="flex items-center gap-2">
            {editingId && (
              <button onClick={() => { setEditingId(null); setSinais(sinaisVazio) }} className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700">
                Cancelar
              </button>
            )}
            <button
              onClick={editingId ? handleSaveSinaisEdited : handleSaveSinais}
              disabled={savingSinais}
              className={cn("flex items-center gap-1.5 px-4 py-2 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50",
                editingId ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700")}
            >
              {savingSinais ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {editingId ? 'Atualizar' : 'Registrar'}
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            {/* PA */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Pressão Arterial</label>
              <div className="flex items-center gap-1">
                <input type="number" placeholder="120" value={sinais.pressao_sistolica} onChange={e => setSinais(s => ({ ...s, pressao_sistolica: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm text-center outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400" />
                <span className="text-gray-300 font-bold">/</span>
                <input type="number" placeholder="80" value={sinais.pressao_diastolica} onChange={e => setSinais(s => ({ ...s, pressao_diastolica: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm text-center outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400" />
              </div>
              <p className="text-[9px] text-gray-300 mt-1 text-center">mmHg</p>
            </div>
            {/* FC */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Freq. Cardíaca</label>
              <input type="number" placeholder="72" value={sinais.frequencia_cardiaca} onChange={e => setSinais(s => ({ ...s, frequencia_cardiaca: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm text-center outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400" />
              <p className="text-[9px] text-gray-300 mt-1 text-center">bpm</p>
            </div>
            {/* SpO2 */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Saturação O₂</label>
              <input type="number" placeholder="98" value={sinais.saturacao_o2} onChange={e => setSinais(s => ({ ...s, saturacao_o2: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm text-center outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
              <p className="text-[9px] text-gray-300 mt-1 text-center">%</p>
            </div>
            {/* Temp */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Temperatura</label>
              <input type="number" step="0.1" placeholder="36.5" value={sinais.temperatura} onChange={e => setSinais(s => ({ ...s, temperatura: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm text-center outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400" />
              <p className="text-[9px] text-gray-300 mt-1 text-center">°C</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            {/* Peso */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Peso</label>
              <input type="number" step="0.1" placeholder="70.0" value={sinais.peso} onChange={e => setSinais(s => ({ ...s, peso: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm text-center outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400" />
              <p className="text-[9px] text-gray-300 mt-1 text-center">kg</p>
            </div>
            {/* Altura */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Altura</label>
              <input type="number" placeholder="170" value={sinais.altura} onChange={e => setSinais(s => ({ ...s, altura: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm text-center outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400" />
              <p className="text-[9px] text-gray-300 mt-1 text-center">cm</p>
            </div>
            {/* IMC calculado */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">IMC</label>
              <div className={cn(
                "w-full rounded-lg py-2 px-3 text-sm text-center font-bold border",
                imc ? (parseFloat(imc) < 18.5 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : parseFloat(imc) < 25 ? 'bg-green-50 text-green-700 border-green-200' : parseFloat(imc) < 30 ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-red-50 text-red-700 border-red-200') : 'bg-gray-50 text-gray-300 border-gray-200'
              )}>
                {imc || '—'}
              </div>
              <p className="text-[9px] text-gray-300 mt-1 text-center">
                {imc ? (parseFloat(imc) < 18.5 ? 'Abaixo' : parseFloat(imc) < 25 ? 'Normal' : parseFloat(imc) < 30 ? 'Sobrepeso' : 'Obesidade') : 'kg/m²'}
              </p>
            </div>
            {/* Observações */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Obs.</label>
              <input type="text" placeholder="Notas..." value={sinais.observacoes} onChange={e => setSinais(s => ({ ...s, observacoes: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-gray-500/20" />
            </div>
          </div>

          {/* Escala de Dor */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Escala de Dor (0 = sem dor — 10 = pior dor)</label>
            <div className="flex items-center gap-1">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setSinais(s => ({ ...s, escala_dor: i }))}
                  className={cn(
                    "flex-1 h-9 rounded-lg text-xs font-bold transition-all border-2",
                    sinais.escala_dor === i ? "scale-110 shadow-md" : "opacity-50 hover:opacity-80"
                  )}
                  style={{
                    backgroundColor: sinais.escala_dor === i ? DOR_CORES[i] + '20' : '#f9fafb',
                    borderColor: sinais.escala_dor === i ? DOR_CORES[i] : '#e5e7eb',
                    color: sinais.escala_dor === i ? DOR_CORES[i] : '#9ca3af',
                  }}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Condições Médicas Estruturadas */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-gray-900">Condições Médicas</h3>
            <span className="text-xs text-gray-400">— marque as relevantes</span>
          </div>
          <button
            onClick={handleSaveCondicoes}
            disabled={savingCondicoes}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {savingCondicoes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Salvar
          </button>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-2">
            {CONDICOES_COMUNS.map(c => {
              const active = condicoes.includes(c.id)
              const colorMap: Record<string, string> = {
                red: active ? 'bg-red-100 text-red-700 border-red-200' : '',
                orange: active ? 'bg-orange-100 text-orange-700 border-orange-200' : '',
                purple: active ? 'bg-purple-100 text-purple-700 border-purple-200' : '',
                blue: active ? 'bg-blue-100 text-blue-700 border-blue-200' : '',
                pink: active ? 'bg-pink-100 text-pink-700 border-pink-200' : '',
                gray: active ? 'bg-gray-200 text-gray-700 border-gray-300' : '',
              }
              return (
                <button
                  key={c.id}
                  onClick={() => toggleCondicao(c.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                    active ? colorMap[c.cor] : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                  )}
                >
                  {active && <CheckCircle className="w-3 h-3 inline mr-1" />}
                  {c.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Gráfico de Evolução */}
      {chartData.length >= 2 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <h3 className="text-sm font-bold text-gray-900">Evolução dos Sinais Vitais</h3>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <XAxis dataKey="data" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                {chartData.some(d => d.peso) && <Line type="monotone" dataKey="peso" name="Peso (kg)" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />}
                {chartData.some(d => d.pas) && <Line type="monotone" dataKey="pas" name="PA Sist." stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />}
                {chartData.some(d => d.fc) && <Line type="monotone" dataKey="fc" name="FC (bpm)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Histórico de registros */}
      {historySinais.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Histórico de Sinais Vitais</h3>
            <span className="text-xs text-gray-400">{historySinais.length} registro{historySinais.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="text-left py-3 px-4">Data</th>
                  <th className="py-3 px-3">PA</th>
                  <th className="py-3 px-3">FC</th>
                  <th className="py-3 px-3">SpO₂</th>
                  <th className="py-3 px-3">Temp</th>
                  <th className="py-3 px-3">Peso</th>
                  <th className="py-3 px-3">IMC</th>
                  <th className="py-3 px-3">Dor</th>
                  <th className="py-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {historySinais.slice(0, 10).map((s: any) => {
                  const dp = (s.created_at as string).split('T')[0].split('-')
                  return (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50 group">
                      <td className="py-2.5 px-4 font-semibold text-gray-700">{dp[2]}/{dp[1]}</td>
                      <td className="py-2.5 px-3 text-center">{s.pressao_sistolica && s.pressao_diastolica ? `${s.pressao_sistolica}/${s.pressao_diastolica}` : '—'}</td>
                      <td className="py-2.5 px-3 text-center">{s.frequencia_cardiaca || '—'}</td>
                      <td className="py-2.5 px-3 text-center">{s.saturacao_o2 ? `${s.saturacao_o2}%` : '—'}</td>
                      <td className="py-2.5 px-3 text-center">{s.temperatura ? `${s.temperatura}°` : '—'}</td>
                      <td className="py-2.5 px-3 text-center">{s.peso ? `${s.peso}kg` : '—'}</td>
                      <td className="py-2.5 px-3 text-center font-semibold">{s.imc || '—'}</td>
                      <td className="py-2.5 px-3 text-center">
                        {s.escala_dor != null ? (
                          <span className="font-bold" style={{ color: DOR_CORES[s.escala_dor] || '#999' }}>{s.escala_dor}</span>
                        ) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditSinais(s)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteSinais(s.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
