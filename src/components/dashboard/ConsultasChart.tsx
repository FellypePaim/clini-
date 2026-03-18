import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { mockConsultasPorSemana } from '../../data/mockData'
import { TrendingUp } from 'lucide-react'

interface TooltipProps {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-lg shadow-gray-100/50">
        <p className="text-xs text-gray-500 mb-1">Semana de {label}</p>
        <p className="text-lg font-bold text-gray-900">
          {payload[0].value}{' '}
          <span className="text-sm font-normal text-gray-500">consultas</span>
        </p>
      </div>
    )
  }
  return null
}

export function ConsultasChart() {
  const total = mockConsultasPorSemana.reduce((acc, d) => acc + d.consultas, 0)
  const lastWeek = mockConsultasPorSemana[mockConsultasPorSemana.length - 1].consultas
  const prevWeek = mockConsultasPorSemana[mockConsultasPorSemana.length - 2].consultas
  const variacao = (((lastWeek - prevWeek) / prevWeek) * 100).toFixed(1)

  return (
    <article className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Consultas por Semana</h3>
          <p className="text-xs text-gray-400 mt-0.5">Últimas 4 semanas</p>
        </div>
        <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-1.5 rounded-lg">
          <TrendingUp className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">+{variacao}%</span>
        </div>
      </div>

      {/* Métrica rápida */}
      <div className="flex items-baseline gap-2 mb-5">
        <span className="text-3xl font-bold text-gray-900">{total}</span>
        <span className="text-sm text-gray-400">consultas no período</span>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={mockConsultasPorSemana} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis
            dataKey="semana"
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E5E7EB', strokeWidth: 1 }} />
          <Line
            type="monotone"
            dataKey="consultas"
            stroke="#16A34A"
            strokeWidth={2.5}
            dot={{ fill: '#16A34A', strokeWidth: 2, r: 4, stroke: '#fff' }}
            activeDot={{ r: 6, stroke: '#16A34A', strokeWidth: 2, fill: '#fff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </article>
  )
}
