import React from 'react'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import type { ToastType } from '../../hooks/useToast'

const TOAST_STYLES: Record<ToastType, { bg: string, border: string, icon: React.ReactNode, text: string }> = {
  success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', icon: <CheckCircle2 className="text-emerald-400" size={20} /> },
  error: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', icon: <AlertCircle className="text-red-400" size={20} /> },
  warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', icon: <AlertTriangle className="text-amber-400" size={20} /> },
  info: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', icon: <Info className="text-blue-400" size={20} /> }
}

export function ToastProvider() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => {
        const style = TOAST_STYLES[toast.type]
        return (
          <div 
            key={toast.id}
            className={`flex items-start gap-3 p-4 min-w-[300px] max-w-sm rounded-xl border shadow-lg animate-slide-up ${style.bg} ${style.border}`}
          >
            <div className="shrink-0 mt-0.5">{style.icon}</div>
            <div className="flex-1">
              <h4 className={`text-sm font-bold ${style.text}`}>{toast.title}</h4>
              {toast.description && (
                <p className={`text-xs mt-1 font-medium opacity-80 ${style.text}`}>{toast.description}</p>
              )}
            </div>
            <button 
              onClick={() => removeToast(toast.id)}
              className={`p-1 rounded-md opacity-50 hover:opacity-100 transition-opacity ${style.text}`}
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
