import React, { useState, useEffect } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { FileUpload } from '../ui/FileUpload'
import { FileViewer } from '../ui/FileViewer'
import type { StorageFile } from '../../lib/storage'
import { listPatientFiles, deleteFile } from '../../lib/storage'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'

interface PatientDocumentsTabProps {
  pacienteId: string
}

export function PatientDocumentsTab({ pacienteId }: PatientDocumentsTabProps) {
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId
  const { toast } = useToast()

  const [files, setFiles] = useState<StorageFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewingFile, setViewingFile] = useState<StorageFile | null>(null)

  useEffect(() => {
    if (!clinicaId || !pacienteId) return
    loadFiles()
  }, [clinicaId, pacienteId])

  const loadFiles = async () => {
    try {
      setIsLoading(true)
      const data = await listPatientFiles('pacientes-documentos', clinicaId || '', pacienteId)
      const exames = await listPatientFiles('pacientes-exames', clinicaId || '', pacienteId)
      // Merge all buckets
      setFiles([...data, ...exames].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
    } catch (e: any) {
      toast({ title: 'Erro ao carregar arquivos', description: e.message, type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUploadComplete = async (newFiles: StorageFile[]) => {
    setFiles(prev => [...newFiles, ...prev])
    
    // Salvar referencia no banco
    for (const f of newFiles) {
       await supabase.from('documentos_paciente').insert({
         paciente_id: pacienteId,
         nome: f.nome,
         tipo: 'exame',
         tamanho_bytes: f.tamanho_bytes,
         mime_type: f.mime_type,
         arquivo_url: f.url,
         storage_path: f.path,
         uploaded_by: user?.id
       })
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Documentos e Exames</h3>
            <p className="text-sm text-gray-400">Upload e visualização rápida de mídia segura</p>
          </div>
        </div>

        {clinicaId && (
          <FileUpload 
            bucket="pacientes-exames" 
            clinica_id={clinicaId}
            paciente_id={pacienteId}
            label="Arraste arquivos (PDF/Imagens) de Exames ou clique aqui"
            onUploadComplete={handleUploadComplete}
          />
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-widest border-b border-gray-100 pb-2">Arquivos Salvos</h3>
        
        {isLoading ? (
          <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-green-500" /></div>
        ) : files.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map(file => (
              <div 
                key={file.id} 
                onClick={() => setViewingFile(file)}
                className="group cursor-pointer bg-gray-50/50 hover:bg-white rounded-2xl p-4 border border-gray-100 hover:border-green-200 hover:shadow-xl hover:shadow-green-500/5 transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 shrink-0 rounded-xl bg-white flex items-center justify-center text-gray-400 group-hover:text-green-500 group-hover:bg-green-50 transition-colors shadow-sm">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1 pr-2">
                  <h4 className="text-xs font-bold text-gray-900 truncate">{file.nome}</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">{(file.tamanho_bytes / 1024).toFixed(0)} KB</p>
                  <p className="text-[9px] text-gray-400 mt-1">{new Date(file.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <FileText className="w-12 h-12 text-gray-100" />
            <p className="text-gray-400 text-sm">Nenhum documento ou exame encontrado.</p>
          </div>
        )}
      </div>

      {viewingFile && (
        <FileViewer 
          file={viewingFile} 
          onClose={() => setViewingFile(null)} 
          onDelete={(f) => {
             setFiles(prev => prev.filter(x => x.id !== f.id))
             // Sync DB removal handled manually here or inside component? Component already calls deleteFile.
             supabase.from('documentos_paciente').delete().eq('storage_path', f.path).then()
          }}
          isAdmin={true}
        />
      )}
    </div>
  )
}
