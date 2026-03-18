import React from 'react'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import type { ToastType } from '../../hooks/useToast'

const TOAST_STYLES: Record<ToastType, { bg: string, border: string, icon: React.ReactNode, text: string }> = {
  success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: <CheckCircle2 className="text-emerald-500" size={20} /> },
  error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: <AlertCircle className="text-red-500" size={20} /> },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: <AlertTriangle className="text-amber-500" size={20} /> },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: <Info className="text-blue-500" size={20} /> }
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
