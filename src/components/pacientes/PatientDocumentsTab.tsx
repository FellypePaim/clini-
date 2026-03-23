import React, { useState, useEffect, useCallback } from 'react'
import { FileText, Loader2, Image as ImageIcon, File, Upload, Search, Filter } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { FileUpload } from '../ui/FileUpload'
import { FileViewer } from '../ui/FileViewer'
import type { StorageFile } from '../../lib/storage'
import { listPatientFiles } from '../../lib/storage'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'
import { cn } from '../../lib/utils'

interface PatientDocumentsTabProps {
  pacienteId: string
}

function getFileIcon(mime: string) {
  if (mime?.startsWith('image/')) return <ImageIcon className="w-5 h-5" />
  if (mime?.includes('pdf')) return <FileText className="w-5 h-5" />
  return <File className="w-5 h-5" />
}

function getFileIconBg(mime: string) {
  if (mime?.startsWith('image/')) return 'bg-purple-50 text-purple-500 group-hover:bg-purple-100'
  if (mime?.includes('pdf')) return 'bg-red-50 text-red-500 group-hover:bg-red-100'
  return 'bg-blue-50 text-blue-500 group-hover:bg-blue-100'
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  const parts = dateStr.split('T')[0].split('-')
  if (parts.length < 3) return dateStr
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function formatSize(bytes: number) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function PatientDocumentsTab({ pacienteId }: PatientDocumentsTabProps) {
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId
  const { toast } = useToast()

  const [files, setFiles] = useState<StorageFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewingFile, setViewingFile] = useState<StorageFile | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'todos' | 'imagem' | 'pdf' | 'outro'>('todos')

  const loadFiles = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await listPatientFiles('pacientes-documentos', clinicaId || '', pacienteId)
      const exames = await listPatientFiles('pacientes-exames', clinicaId || '', pacienteId)
      setFiles([...data, ...exames].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')))
    } catch (e: any) {
      toast({ title: 'Erro ao carregar arquivos', description: e.message, type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, pacienteId, toast])

  useEffect(() => {
    if (!clinicaId || !pacienteId) return
    loadFiles()
  }, [clinicaId, pacienteId, loadFiles])

  const handleUploadComplete = async (newFiles: StorageFile[]) => {
    setFiles(prev => [...newFiles, ...prev])

    for (const f of newFiles) {
      await supabase.from('documentos_paciente').insert({
        paciente_id: pacienteId,
        nome: f.nome,
        tipo: f.mime_type?.startsWith('image/') ? 'foto' : f.mime_type?.includes('pdf') ? 'exame' : 'documento',
        tamanho_bytes: f.tamanho_bytes,
        mime_type: f.mime_type,
        arquivo_url: f.url,
        storage_path: f.path,
        uploaded_by: user?.id,
      })
    }
    toast({ title: 'Upload concluído', description: `${newFiles.length} arquivo(s) enviado(s).`, type: 'success' })
  }

  // Filtros
  const filtered = files.filter(f => {
    const matchSearch = !search || f.nome.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'todos'
      || (filter === 'imagem' && f.mime_type?.startsWith('image/'))
      || (filter === 'pdf' && f.mime_type?.includes('pdf'))
      || (filter === 'outro' && !f.mime_type?.startsWith('image/') && !f.mime_type?.includes('pdf'))
    return matchSearch && matchFilter
  })

  const imageCount = files.filter(f => f.mime_type?.startsWith('image/')).length
  const pdfCount = files.filter(f => f.mime_type?.includes('pdf')).length

  return (
    <div className="space-y-5">
      {/* Upload */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Upload className="w-4 h-4 text-green-600" /> Enviar Documentos
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">PDFs, imagens e exames</p>
          </div>
          <span className="text-xs font-medium text-gray-400">
            {files.length} arquivo{files.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="p-6">
          {clinicaId && (
            <FileUpload
              bucket="pacientes-exames"
              clinica_id={clinicaId}
              paciente_id={pacienteId}
              label="Arraste PDFs, imagens ou exames aqui"
              onUploadComplete={handleUploadComplete}
            />
          )}
        </div>
      </div>

      {/* Filtros e busca */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('todos')}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                filter === 'todos' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300')}
            >
              Todos ({files.length})
            </button>
            {imageCount > 0 && (
              <button
                onClick={() => setFilter('imagem')}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                  filter === 'imagem' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300')}
              >
                Imagens ({imageCount})
              </button>
            )}
            {pdfCount > 0 && (
              <button
                onClick={() => setFilter('pdf')}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                  filter === 'pdf' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300')}
              >
                PDFs ({pdfCount})
              </button>
            )}
          </div>
          {files.length > 3 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar arquivo..."
                className="pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 w-48"
              />
            </div>
          )}
        </div>

        {/* Lista de arquivos */}
        <div className="p-5">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-7 h-7 animate-spin text-green-500" />
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(file => (
                <div
                  key={file.id}
                  onClick={() => setViewingFile(file)}
                  className="group cursor-pointer bg-gray-50/50 hover:bg-white rounded-xl p-4 border border-gray-100 hover:border-green-200 hover:shadow-md transition-all flex items-center gap-3"
                >
                  <div className={cn('w-11 h-11 shrink-0 rounded-xl flex items-center justify-center transition-colors', getFileIconBg(file.mime_type))}>
                    {getFileIcon(file.mime_type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-gray-900 truncate group-hover:text-green-700 transition-colors">{file.nome}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400">{formatSize(file.tamanho_bytes)}</span>
                      <span className="text-gray-200">·</span>
                      <span className="text-[10px] text-gray-400">{formatDate(file.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : files.length > 0 ? (
            <div className="py-12 text-center">
              <Filter className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Nenhum arquivo corresponde ao filtro</p>
            </div>
          ) : (
            <div className="py-16 text-center flex flex-col items-center gap-3">
              <FileText className="w-12 h-12 text-gray-100" />
              <p className="text-sm text-gray-400 font-medium">Nenhum documento enviado</p>
              <p className="text-xs text-gray-300">Envie exames, laudos ou fotos usando o upload acima</p>
            </div>
          )}
        </div>
      </div>

      {/* Viewer */}
      {viewingFile && (
        <FileViewer
          file={viewingFile}
          onClose={() => setViewingFile(null)}
          onDelete={(f) => {
            setFiles(prev => prev.filter(x => x.id !== f.id))
            supabase.from('documentos_paciente').delete().eq('storage_path', f.path).then(() => { }).catch(() => { })
          }}
          isAdmin={true}
        />
      )}
    </div>
  )
}
