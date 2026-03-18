import React from 'react'
import { Link } from 'react-router-dom'
import { FileQuestion, ArrowLeft } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl p-10 border border-slate-200 shadow-xl text-center">
        <div className="w-24 h-24 bg-emerald-50 rounded-full flex flex-col items-center justify-center mx-auto mb-6">
          <FileQuestion size={48} className="text-emerald-500" />
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Página não encontrada</h1>
        <p className="text-slate-500 font-medium mb-8">
          A rota que você tentou acessar não existe ou foi movida. 
          Use o botão abaixo para retornar à tela inicial segura do Prontuário Verde.
        </p>
        
        <Link 
          to="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg transition-all hover:-translate-y-1"
        >
          <ArrowLeft size={20} />
          Voltar para o Início
        </Link>
      </div>
    </div>
  )
}
