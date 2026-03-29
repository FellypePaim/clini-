import React, { useState, useEffect } from 'react'
import { X, ExternalLink, Download, Trash, Loader2, Image as ImageIcon, FileText } from 'lucide-react'
import type { StorageFile } from '../../lib/storage'
import { getSignedUrl, deleteFile } from '../../lib/storage'
import { useToast } from '../../hooks/useToast'
import { cn } from '../../lib/utils'

interface FileViewerProps {
  file: StorageFile | null
  onClose: () => void
  onDelete?: (file: StorageFile) => void
  isAdmin?: boolean
}

export function FileViewer({ file, onClose, onDelete, isAdmin = true }: FileViewerProps) {
  const { toast } = useToast()
  
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch signed URL right when opening
  useEffect(() => {
    if (!file) return
    setIsLoading(true)
    setError(null)
    
    getSignedUrl(file.bucket, file.path)
      .then(url => setSignedUrl(url))
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [file])

  if (!file) return null

  const isImage = file.mime_type.startsWith('image/')
  const isPDF = file.mime_type === 'application/pdf'
  const isSupportedPreview = isImage || isPDF

  const handleDownload = () => {
    if (!signedUrl) return
    const a = document.createElement('a')
    a.href = signedUrl
    a.download = file.nome
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleDelete = async () => {
    if (confirm(`Tem certeza que deseja excluir o arquivo "${file.nome}" permanentemente?`)) {
      setIsDeleting(true)
      try {
        await deleteFile(file.bucket, file.path)
        if (onDelete) onDelete(file)
        toast({ title: 'Sucesso', description: 'Arquivo excluído permanentemente.', type: 'success' })
        onClose()
      } catch(e: any) {
        toast({ title: 'Erro ao excluir', description: e.message, type: 'error' })
      } finally {
        setIsDeleting(false)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-opacity">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      <div className={cn(
        "relative flex flex-col w-full max-w-5xl max-h-[90vh] bg-[var(--color-bg-card)] rounded-3xl shadow-2xl overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95",
        !isSupportedPreview && "max-w-md"
      )}>
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-card)]/50 backdrop-blur-xl">
          <div className="flex items-center gap-3 w-full pr-4">
            <div className="p-2 bg-cyan-500/5 rounded-xl text-cyan-500">
              {isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
               <h3 className="text-sm font-black text-[var(--color-text-primary)] truncate" title={file.nome}>{file.nome}</h3>
               <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-bold mt-0.5">
                 {new Date(file.created_at).toLocaleDateString()} • {(file.tamanho_bytes / 1024).toFixed(0)} KB • {file.mime_type}
               </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {signedUrl && (
              <>
                <button
                  onClick={handleDownload}
                  className="p-2 text-[var(--color-text-muted)] hover:text-cyan-500 hover:bg-cyan-500/5 rounded-full transition-colors group"
                  title="Fazer Download"
                >
                  <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
                <a
                  href={signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-[var(--color-text-muted)] hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors group"
                  title="Abrir em Nova Guia"
                >
                  <ExternalLink className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
              </>
            )}

            {isAdmin && (
              <div className="h-5 w-px bg-gray-200 mx-1"></div>
            )}
            {isAdmin && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                title="Deletar Arquivo"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash className="w-5 h-5" />}
              </button>
            )}
            
            <button
              onClick={onClose}
              className="p-2 ml-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card-hover)] rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-auto bg-[var(--color-bg-deep)] flex flex-col items-center justify-center p-4 min-h-[300px] relative">
          
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--color-bg-card)]/80 backdrop-blur-sm gap-3">
              <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
              <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Carregando Mídia Segura...</p>
            </div>
          )}

          {error && !isLoading && (
             <div className="text-center p-6 bg-[var(--color-bg-card)] rounded-2xl shadow-sm border border-red-100 w-full max-w-sm">
                <p className="text-red-600 font-bold uppercase tracking-widest text-[10px] mb-2">Erro de Acesso</p>
                <p className="text-sm text-[var(--color-text-secondary)]">{error}</p>
             </div>
          )}

          {signedUrl && !isLoading && (
            <>
              {isImage ? (
                <div className="w-full h-full flex items-center justify-center p-4 relative group">
                  <img 
                    src={signedUrl} 
                    alt={file.nome} 
                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm"
                  />
                  <a href={signedUrl} target="_blank" className="absolute bottom-6 p-3 bg-black/50 backdrop-blur-md rounded-full text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110">
                     <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              ) : isPDF ? (
                <iframe 
                  src={signedUrl}
                  className="w-full h-full min-h-[70vh] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]"
                  title={file.nome}
                />
              ) : (
                <div className="text-center p-8 bg-[var(--color-bg-card)] rounded-2xl shadow-sm border border-[var(--color-border)]">
                  <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-10 h-10" />
                  </div>
                  <h4 className="text-base font-black text-[var(--color-text-primary)] mb-2">Visualização não suportada</h4>
                  <p className="text-sm text-[var(--color-text-muted)] mb-6">Este tipo de arquivo não pode ser visualizado diretamente no navegador.</p>
                  
                  <button 
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-white rounded-xl font-bold hover:bg-cyan-600 transition-colors shadow-sm"
                  >
                    <Download className="w-5 h-5" />
                    Fazer Download do Arquivo
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  )
}
