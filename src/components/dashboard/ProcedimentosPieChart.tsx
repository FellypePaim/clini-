import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { mockProcedimentos } from '../../data/mockData'

interface TooltipProps {
  active?: boolean
  payload?: { name: string; value: number; payload: { cor: string } }[]
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0]
    return (
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-lg shadow-gray-100/50">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.payload.cor }} />
          <p className="text-xs font-semibold text-gray-800">{item.name}</p>
        </div>
        <p className="text-lg font-bold text-gray-900">{item.value}%</p>
      </div>
    )
  }
  return null
}

export function ProcedimentosPieChart() {
  const total = mockProcedimentos.reduce((acc, p) => acc + p.valor, 0)

  return (
    <article className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Distribuição por Procedimento</h3>
        <p className="text-xs text-gray-400 mt-0.5">Últimas 4 semanas · {total} procedimentos</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Pizza */}
        <div className="flex-shrink-0">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie
                data={mockProcedimentos}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={72}
                paddingAngle={2}
                dataKey="valor"
                nameKey="nome"
              >
                {mockProcedimentos.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.cor} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legenda customizada */}
        <div className="flex-1 space-y-2.5">
          {mockProcedimentos.map((proc) => (
            <div key={proc.nome} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: proc.cor }} />
                <span className="text-xs text-gray-600">{proc.nome}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 rounded-full bg-gray-100 w-16 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${proc.valor}%`, background: proc.cor }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700 w-8 text-right">
                  {proc.valor}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}
