import React, { useState, useRef, useCallback } from 'react'
import { UploadCloud, File as FileIcon, Image as ImageIcon, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { StorageBucket, StorageFile } from '../../lib/storage'
import { STORAGE_LIMITS, uploadFile, deleteFile } from '../../lib/storage'
import { useToast } from '../../hooks/useToast'

interface FileUploadProps {
  bucket: StorageBucket
  clinica_id: string
  paciente_id?: string | null
  accept?: string
  maxSizeMB?: number
  multiple?: boolean
  disabled?: boolean
  label?: string
  onUploadComplete: (files: StorageFile[]) => void
  onError?: (error: string) => void
  existingFiles?: StorageFile[]
  onDeleteExisting?: (file: StorageFile) => void
}

interface UploadingFile {
  file: File
  id: string
  progress: number
  error?: string
  done: boolean
  previewUrl?: string
  storageData?: StorageFile
}

export function FileUpload({
  bucket,
  clinica_id,
  paciente_id = null,
  accept,
  maxSizeMB,
  multiple = false,
  disabled = false,
  label = 'Clique ou arraste arquivos aqui',
  onUploadComplete,
  onError,
  existingFiles = [],
  onDeleteExisting
}: FileUploadProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isDragging, setIsDragging] = useState(false)
  const [uploads, setUploads] = useState<UploadingFile[]>([])

  const limitConfig = STORAGE_LIMITS[bucket]
  const allowedTypes = accept ?? limitConfig.tipos.join(',')
  const maxBytes = (maxSizeMB || limitConfig.maxMB) * 1024 * 1024

  const validateFile = (file: File): string | null => {
    if (file.size > maxBytes) {
      return `Arquivo excede ${(maxBytes / 1024 / 1024).toFixed(0)}MB limite.`
    }
    // Basic accept string check like "image/*,application/pdf"
    if (allowedTypes && allowedTypes !== '*') {
      const match = allowedTypes.split(',').some(type => {
        const t = type.trim()
        if (t.endsWith('/*')) {
          return file.type.startsWith(t.replace('/*', ''))
        }
        return file.type === t || file.name.endsWith(t) // Super basic fallback
      })
      if (!match) return `Tipo de arquivo não permitido.`
    }
    return null
  }

  const handleFiles = async (files: FileList | File[]) => {
    if (disabled) return
    const fileArray = Array.from(files)
    if (!multiple && fileArray.length > 1) {
      fileArray.splice(1) // Only take the first one
    }

    const newUploads: UploadingFile[] = fileArray.map(f => ({
      file: f,
      id: Math.random().toString(36).substring(7),
      progress: 0,
      done: false,
      previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined
    }))

    setUploads(prev => [...prev, ...newUploads])

    const completedFiles: StorageFile[] = []

    for (const upload of newUploads) {
      const validError = validateFile(upload.file)
      if (validError) {
        setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, error: validError, done: true } : u))
        if(onError) onError(validError)
        else toast({ title: 'Erro de validação', description: validError, type: 'error' })
        continue
      }

      try {
        setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, progress: 30 } : u))
        
        // Supabase upload call
        const stored = await uploadFile(bucket, clinica_id, paciente_id, upload.file)
        
        setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, progress: 100, done: true, storageData: stored } : u))
        completedFiles.push(stored)
        toast({ title: 'Sucesso', description: `Arquivo ${upload.file.name} enviado.`, type: 'success' })
      } catch (err: any) {
        setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, error: err.message, done: true } : u))
        if(onError) onError(err.message)
        else toast({ title: 'Falha no upload', description: err.message, type: 'error' })
      }
    }

    if (completedFiles.length > 0) {
      onUploadComplete(completedFiles)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [disabled, multiple])

  const removeUpload = (id: string) => {
    setUploads(prev => {
      const u = prev.find(p => p.id === id)
      if (u?.previewUrl) URL.revokeObjectURL(u.previewUrl)
      return prev.filter(p => p.id !== id)
    })
  }

  const handleRemoveExisting = async (file: StorageFile) => {
    if (!onDeleteExisting) return
    try {
      await deleteFile(file.bucket, file.path)
      onDeleteExisting(file)
      toast({ title: 'Removido', description: 'Arquivo deletado com sucesso.', type: 'success' })
    } catch(e: any) {
      toast({ title: 'Erro', description: e.message, type: 'error' })
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* DRAG AREA */}
      <div
        className={cn(
          "relative w-full border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-4 text-center cursor-pointer overflow-hidden",
          disabled ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-200" :
          isDragging ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-green-400 hover:bg-gray-50"
        )}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true) }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false) }}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          accept={allowedTypes} 
          multiple={multiple}
          className="hidden" 
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <div className={cn(
          "p-4 rounded-full transition-colors",
          isDragging ? "bg-green-100 text-green-600" : "bg-white text-gray-400 shadow-sm border border-gray-100"
        )}>
          <UploadCloud className="w-8 h-8" />
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-gray-900">{label}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
            Max {(maxBytes / 1024 / 1024).toFixed(0)}MB • {limitConfig.tipos.map(t => t.split('/')[1]).join(', ').toUpperCase()}
          </p>
        </div>
      </div>

      {/* UPLOADS TRACKER */}
      {uploads.length > 0 && (
        <div className="space-y-3">
          {uploads.map(u => (
             <div key={u.id} className="relative p-3 bg-white border border-gray-100 rounded-xl shadow-sm flex items-center justify-between group overflow-hidden">
                {/* Progress bar BG */}
                {!u.done && (
                  <div className="absolute top-0 left-0 h-full bg-blue-50/50 transition-all duration-300" style={{ width: `${u.progress}%` }} />
                )}
                
                <div className="flex items-center gap-3 relative z-10 w-full">
                  <div className="w-10 h-10 shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center text-gray-400">
                    {u.previewUrl ? (
                      <img src={u.previewUrl} alt="preview" className="w-full h-full object-cover" />
                    ) : u.file.type.startsWith('image/') ? <ImageIcon className="w-5 h-5" /> : <FileIcon className="w-5 h-5" />}
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-xs font-bold text-gray-900 truncate">{u.file.name}</p>
                    <p className="text-[10px] text-gray-500 font-medium">{(u.file.size / 1024).toFixed(0)} KB</p>
                    
                    {u.error ? (
                      <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5"><AlertCircle className="w-3 h-3" /> {u.error}</p>
                    ) : u.done ? (
                      <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5"><CheckCircle className="w-3 h-3" /> Enviado</p>
                    ) : (
                      <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5"><Loader2 className="w-3 h-3 animate-spin" /> Enviando...</p>
                    )}
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); removeUpload(u.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors z-20"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
             </div>
          ))}
        </div>
      )}

      {/* EXISTING FILES LIST */}
      {existingFiles.length > 0 && (
        <div className="space-y-3 mt-6">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Arquivos Salvos</h4>
          {existingFiles.map(file => (
            <div key={file.id} className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm flex items-center justify-between group">
               <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 shrink-0 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                    {file.mime_type.startsWith('image/') ? <ImageIcon className="w-5 h-5" /> : <FileIcon className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                     <p className="text-xs font-bold text-gray-900 truncate" title={file.nome}>{file.nome}</p>
                     <p className="text-[10px] text-gray-500 font-medium">
                       {new Date(file.created_at).toLocaleDateString()} • {(file.tamanho_bytes / 1024).toFixed(0)} KB
                     </p>
                  </div>
               </div>
               
               {onDeleteExisting && (
                 <button 
                    onClick={() => handleRemoveExisting(file)}
                    className="p-1.5 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Excluir arquivo"
                 >
                   <X className="w-4 h-4" />
                 </button>
               )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
