import { useState, useEffect, useCallback } from 'react'
import { FileText, Download, Loader2, DollarSign, CreditCard, Banknote, Building2 } from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../hooks/useToast'
import { cn } from '../../lib/utils'

function fmtMoney(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }

const FORMAS_LABEL: Record<string, string> = {
  pix: 'PIX', dinheiro: 'Dinheiro', credito: 'Cartão Crédito',
  debito: 'Cartão Débito', convenio: 'Convênio', '': 'Não informado',
}

export function FiscalReport() {
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId
  const { toast } = useToast()

  const pad = (n: number) => String(n).padStart(2, '0')
  const now = new Date()
  const [mesAno, setMesAno] = useState(`${now.getFullYear()}-${pad(now.getMonth() + 1)}`)
  const [dados, setDados] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!clinicaId) return
    setLoading(true)
    const [ano, mes] = mesAno.split('-')
    const inicio = `${ano}-${mes}-01`
    const fimDate = new Date(parseInt(ano), parseInt(mes), 0)
    const fim = `${ano}-${mes}-${pad(fimDate.getDate())}`

    const { data: lancamentos } = await supabase
      .from('lancamentos')
      .select('*')
      .eq('clinica_id', clinicaId)
      .gte('data_competencia', inicio)
      .lte('data_competencia', fim)

    const items = lancamentos || []
    const receitas = items.filter((l: any) => l.tipo === 'receita')
    const despesas = items.filter((l: any) => l.tipo === 'despesa')
    const receitasPagas = receitas.filter((l: any) => l.status === 'pago')

    // Agrupar por forma de pagamento
    const porForma: Record<string, number> = {}
    receitasPagas.forEach((l: any) => {
      const forma = l.forma_pagamento || ''
      porForma[forma] = (porForma[forma] || 0) + (l.valor || 0)
    })

    // Agrupar por categoria
    const porCategoria: Record<string, number> = {}
    receitasPagas.forEach((l: any) => {
      const cat = l.categoria || 'outros'
      porCategoria[cat] = (porCategoria[cat] || 0) + (l.valor || 0)
    })

    const totalReceitas = receitas.reduce((s: number, l: any) => s + (l.valor || 0), 0)
    const totalReceitasPagas = receitasPagas.reduce((s: number, l: any) => s + (l.valor || 0), 0)
    const totalDespesas = despesas.reduce((s: number, l: any) => s + (l.valor || 0), 0)
    const totalPendente = totalReceitas - totalReceitasPagas

    // Estimativas fiscais
    const issEstimado = totalReceitasPagas * 0.05 // 5% ISS
    const irpjEstimado = totalReceitasPagas * 0.048 // 4.8% IRPJ (lucro presumido 32% * 15%)
    const csllEstimado = totalReceitasPagas * 0.0288 // 2.88% CSLL (lucro presumido 32% * 9%)
    const pisEstimado = totalReceitasPagas * 0.0065 // 0.65% PIS
    const cofinsEstimado = totalReceitasPagas * 0.03 // 3% COFINS

    setDados({
      totalReceitas, totalReceitasPagas, totalDespesas, totalPendente,
      porForma, porCategoria,
      impostos: { iss: issEstimado, irpj: irpjEstimado, csll: csllEstimado, pis: pisEstimado, cofins: cofinsEstimado },
      totalImpostos: issEstimado + irpjEstimado + csllEstimado + pisEstimado + cofinsEstimado,
      lucroLiquido: totalReceitasPagas - totalDespesas - (issEstimado + irpjEstimado + csllEstimado + pisEstimado + cofinsEstimado),
      periodo: { inicio, fim },
    })
    setLoading(false)
  }, [clinicaId, mesAno])

  useEffect(() => { load() }, [load])

  const handleExportPDF = () => {
    if (!dados) return
    const pdf = new jsPDF('p', 'mm', 'a4')
    const w = pdf.internal.pageSize.getWidth()
    const m = 15
    let y = 15

    pdf.setFillColor(22, 163, 74)
    pdf.rect(0, 0, w, 2, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(14)
    pdf.setTextColor(17, 24, 39)
    pdf.text('Relatório Fiscal', m, y + 7)
    pdf.setFontSize(9)
    pdf.setTextColor(156, 163, 175)
    pdf.text(`${user?.clinicaNome || 'Clínica'} — Competência: ${mesAno}`, m, y + 13)
    y += 22
    pdf.setDrawColor(22, 163, 74)
    pdf.line(m, y, w - m, y)
    y += 8

    // Resumo
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(17, 24, 39)
    pdf.text('RESUMO FINANCEIRO', m, y)
    y += 6
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(75, 85, 99)
    pdf.text(`Receita Bruta: ${fmtMoney(dados.totalReceitas)}`, m, y); y += 5
    pdf.text(`Receita Recebida: ${fmtMoney(dados.totalReceitasPagas)}`, m, y); y += 5
    pdf.text(`Despesas: ${fmtMoney(dados.totalDespesas)}`, m, y); y += 5
    pdf.text(`Pendente: ${fmtMoney(dados.totalPendente)}`, m, y); y += 8

    // Por forma
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(17, 24, 39)
    pdf.text('RECEITA POR FORMA DE PAGAMENTO', m, y); y += 6
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(75, 85, 99)
    Object.entries(dados.porForma).forEach(([forma, valor]) => {
      pdf.text(`${FORMAS_LABEL[forma] || forma}: ${fmtMoney(valor as number)}`, m, y); y += 5
    })
    y += 4

    // Impostos
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(17, 24, 39)
    pdf.text('ESTIMATIVA DE IMPOSTOS (Lucro Presumido)', m, y); y += 6
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(75, 85, 99)
    pdf.text(`ISS (5%): ${fmtMoney(dados.impostos.iss)}`, m, y); y += 5
    pdf.text(`IRPJ (4.8%): ${fmtMoney(dados.impostos.irpj)}`, m, y); y += 5
    pdf.text(`CSLL (2.88%): ${fmtMoney(dados.impostos.csll)}`, m, y); y += 5
    pdf.text(`PIS (0.65%): ${fmtMoney(dados.impostos.pis)}`, m, y); y += 5
    pdf.text(`COFINS (3%): ${fmtMoney(dados.impostos.cofins)}`, m, y); y += 5
    pdf.setFont('helvetica', 'bold')
    pdf.text(`Total Impostos: ${fmtMoney(dados.totalImpostos)}`, m, y); y += 5
    pdf.text(`Lucro Líquido Estimado: ${fmtMoney(dados.lucroLiquido)}`, m, y); y += 8

    pdf.setFontSize(7)
    pdf.setTextColor(180, 180, 180)
    pdf.text('* Valores estimados para Lucro Presumido — consulte seu contador para cálculos oficiais.', m, y)
    pdf.text('Gerado pelo sistema Prontuário Verde', w / 2, 285, { align: 'center' })

    pdf.save(`relatorio_fiscal_${mesAno}.pdf`)
    toast({ title: 'PDF exportado', type: 'success' })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatório Fiscal</h1>
          <p className="text-sm text-gray-500">Resumo para DARF/RPA — Lucro Presumido</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="month" value={mesAno} onChange={e => setMesAno(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-cyan-500/20" />
          <button onClick={handleExportPDF} disabled={!dados}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
            <Download className="w-4 h-4" /> Exportar PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>
      ) : dados ? (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-xs text-gray-400">Receita Bruta</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{fmtMoney(dados.totalReceitas)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-xs text-gray-400">Recebido</p>
              <p className="text-xl font-bold text-cyan-500 mt-1">{fmtMoney(dados.totalReceitasPagas)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-xs text-gray-400">Despesas</p>
              <p className="text-xl font-bold text-red-600 mt-1">{fmtMoney(dados.totalDespesas)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-xs text-gray-400">Lucro Líquido Est.</p>
              <p className={cn("text-xl font-bold mt-1", dados.lucroLiquido >= 0 ? "text-cyan-500" : "text-red-600")}>{fmtMoney(dados.lucroLiquido)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Por forma de pagamento */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Receita por Forma de Pagamento
              </h3>
              <div className="space-y-3">
                {Object.entries(dados.porForma).map(([forma, valor]) => {
                  const pct = dados.totalReceitasPagas > 0 ? ((valor as number) / dados.totalReceitasPagas) * 100 : 0
                  return (
                    <div key={forma}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{FORMAS_LABEL[forma] || forma}</span>
                        <span className="font-bold text-gray-900">{fmtMoney(valor as number)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
                {Object.keys(dados.porForma).length === 0 && <p className="text-sm text-gray-400 italic">Nenhum recebimento no período.</p>}
              </div>
            </div>

            {/* Estimativa de impostos */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Estimativa de Impostos (Lucro Presumido)
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'ISS (5%)', valor: dados.impostos.iss },
                  { label: 'IRPJ (4.8%)', valor: dados.impostos.irpj },
                  { label: 'CSLL (2.88%)', valor: dados.impostos.csll },
                  { label: 'PIS (0.65%)', valor: dados.impostos.pis },
                  { label: 'COFINS (3%)', valor: dados.impostos.cofins },
                ].map(imp => (
                  <div key={imp.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-600">{imp.label}</span>
                    <span className="text-sm font-semibold text-gray-900">{fmtMoney(imp.valor)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="text-sm font-bold text-gray-900">Total Impostos</span>
                  <span className="text-base font-bold text-red-600">{fmtMoney(dados.totalImpostos)}</span>
                </div>
              </div>

              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                * Valores estimados para regime de Lucro Presumido (base 32% para serviços de saúde). Consulte seu contador para cálculos oficiais.
              </div>
            </div>
          </div>

          {/* Por categoria */}
          {Object.keys(dados.porCategoria).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Receita por Categoria
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(dados.porCategoria).map(([cat, valor]) => (
                  <div key={cat} className="p-3 bg-gray-50 rounded-xl text-center">
                    <p className="text-xs text-gray-400 capitalize">{cat}</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">{fmtMoney(valor as number)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
