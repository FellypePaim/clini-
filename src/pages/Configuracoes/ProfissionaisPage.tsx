import React, { useState } from 'react'
import { Plus, Edit2, ShieldAlert, Check, X, UserCog, BriefcaseMedical } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../hooks/useToast'

interface Profissional {
  id: string
  nome: string
  especialidade: string
  conselho: string
  ativo: boolean
  cor: string
  role: 'Administrador' | 'Profissional' | 'Recepção'
}

const MOCK_PROFISSIONAIS: Profissional[] = [
  { id: '1', nome: 'Dr. Carlos Souza', especialidade: 'Clínica Geral / Implantodontia', conselho: 'CRO-SP 12345', ativo: true, cor: 'bg-indigo-500', role: 'Administrador' },
  { id: '2', nome: 'Dra. Ana Silva', especialidade: 'Harmonização Orofacial', conselho: 'CRO-SP 54321', ativo: true, cor: 'bg-emerald-500', role: 'Profissional' },
  { id: '3', nome: 'Dra. Luiza Ramos', especialidade: 'Odontopediatria', conselho: 'CRO-SP 98765', ativo: false, cor: 'bg-amber-500', role: 'Profissional' },
  { id: '4', nome: 'Mariana Recepcionista', especialidade: 'Atendimento', conselho: '-', ativo: true, cor: 'bg-slate-500', role: 'Recepção' },
]

export function ProfissionaisPage() {
  const [profissionais, setProfissionais] = useState(MOCK_PROFISSIONAIS)
  const { toast } = useToast()

  const toggleStatus = (id: string, current: boolean) => {
    setProfissionais(prev => prev.map(p => p.id === id ? { ...p, ativo: !current } : p))
    toast({ title: 'Status Atualizado', description: 'O acesso do profissional foi alterado.', type: 'info' })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
             <BriefcaseMedical className="text-indigo-600" />
             Quadro Médico e Equipe
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Gerencie os doutores, recepcionistas e seus níveis de acesso.</p>
        </div>
        <button 
          onClick={() => toast({ title: 'Novo Profissional', description: 'Modal de cadastro será aberto na Versão Final.', type: 'info' })}
          className="flex items-center gap-2 px-5 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors"
        >
          <Plus size={18}/> Cadastrar Colaborador
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-white border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <th className="px-6 py-4">Profissional</th>
              <th className="px-6 py-4">Conselho</th>
              <th className="px-6 py-4">Nível de Acesso</th>
              <th className="px-6 py-4 text-center">Cor Agenda</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm font-medium">
            {profissionais.map((prof) => (
              <tr key={prof.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0 border-2 border-white shadow-sm font-bold text-slate-600">
                      {prof.nome.substring(0,2)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{prof.nome}</h3>
                      <span className="text-xs text-slate-500">{prof.especialidade}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500">{prof.conselho}</td>
                <td className="px-6 py-4">
                  <Badge className={`border-none tracking-widest uppercase text-[10px] ${
                    prof.role === 'Administrador' ? 'bg-indigo-100 text-indigo-700' :
                    prof.role === 'Recepção' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {prof.role}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className={`w-6 h-6 rounded-md mx-auto shadow-sm ${prof.cor}`} />
                </td>
                <td className="px-6 py-4 text-center">
                  <button 
                    onClick={() => toggleStatus(prof.id, prof.ativo)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-widest border transition-colors ${
                      prof.ativo ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200' 
                               : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200'
                    }`}
                  >
                     {prof.ativo ? <Check size={14} /> : <X size={14} />}
                     {prof.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar Permissões"><UserCog size={18} /></button>
                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar Perfil"><Edit2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
