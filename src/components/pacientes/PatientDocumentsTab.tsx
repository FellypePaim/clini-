import React, { useState, useEffect, useCallback } from 'react'
import {
  FileText, Loader2, Image as ImageIcon, File, Upload, Search, Filter,
  Send, Calendar, FolderOpen, Plus, X, Printer, ClipboardList, CheckCircle
} from 'lucide-react'
import jsPDF from 'jspdf'
import { useAuthStore } from '../../store/authStore'
import { FileUpload } from '../ui/FileUpload'
import { FileViewer } from '../ui/FileViewer'
import type { StorageFile, StorageBucket } from '../../lib/storage'
import { listPatientFiles, getSignedUrl } from '../../lib/storage'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'
import { usePatients } from '../../hooks/usePatients'
import { cn } from '../../lib/utils'

// ─── Categorias ──────────────────────────────
const CATEGORIAS = [
  { id: 'todos', label: 'Todos', color: 'bg-gray-900 text-white', icon: FolderOpen },
  { id: 'exame', label: 'Exames', color: 'bg-blue-600 text-white', icon: FileText },
  { id: 'laudo', label: 'Laudos', color: 'bg-purple-600 text-white', icon: ClipboardList },
  { id: 'receita', label: 'Receitas', color: 'bg-cyan-600 text-white', icon: Plus },
  { id: 'atestado', label: 'Atestados', color: 'bg-orange-600 text-white', icon: CheckCircle },
  { id: 'radiografia', label: 'Radiografias', color: 'bg-cyan-600 text-white', icon: ImageIcon },
  { id: 'foto', label: 'Fotos', color: 'bg-pink-600 text-white', icon: ImageIcon },
  { id: 'outro', label: 'Outros', color: 'bg-gray-600 text-white', icon: File },
]

const CATEGORIAS_MAP: Record<string, { label: string; color: string }> = {
  exame: { label: 'Exame', color: 'bg-blue-100 text-blue-700' },
  laudo: { label: 'Laudo', color: 'bg-purple-100 text-purple-700' },
  receita: { label: 'Receita', color: 'bg-cyan-500/10 text-cyan-600' },
  atestado: { label: 'Atestado', color: 'bg-orange-100 text-orange-700' },
  radiografia: { label: 'Radiografia', color: 'bg-cyan-100 text-cyan-700' },
  foto: { label: 'Foto', color: 'bg-pink-100 text-pink-700' },
  outro: { label: 'Outro', color: 'bg-gray-100 text-gray-600' },
}

// ─── Templates ──────────────────────────────
const DOC_TEMPLATES = [
  {
    id: 'atestado', titulo: 'Atestado Médico',
    conteudo: 'Atesto para os devidos fins que o(a) paciente {{NOME}}, CPF {{CPF}}, esteve sob meus cuidados profissionais no dia {{DATA}}, necessitando de afastamento de suas atividades por _____ dia(s).\n\nCID: _________\n\n{{CIDADE}}, {{DATA}}\n\n\n_________________________\n{{PROFISSIONAL}}\n{{CONSELHO}}'
  },
  {
    id: 'declaracao', titulo: 'Declaração de Comparecimento',
    conteudo: 'Declaro para os devidos fins que o(a) paciente {{NOME}}, CPF {{CPF}}, compareceu a esta clínica no dia {{DATA}}, no horário das _____ às _____, para realização de consulta/procedimento.\n\n{{CIDADE}}, {{DATA}}\n\n\n_________________________\n{{PROFISSIONAL}}\n{{CONSELHO}}'
  },
  {
    id: 'encaminhamento', titulo: 'Encaminhamento',
    conteudo: 'Encaminho o(a) paciente {{NOME}}, CPF {{CPF}}, para avaliação com:\n\nEspecialidade: _________________________\nMotivo: _________________________\n\nHistórico relevante:\n_________________________\n\n{{CIDADE}}, {{DATA}}\n\n\n_________________________\n{{PROFISSIONAL}}\n{{CONSELHO}}'
  },
]

// ─── Helpers ──────────────────────────────
interface DocFile extends StorageFile {
  categoria?: string
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

function fmtDate(dateStr: string) {
  if (!dateStr) return '—'
  const p = dateStr.split('T')[0].split('-')
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : dateStr
}

function fmtSize(bytes: number) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function resolveUrl(url: string): Promise<string> {
  if (!url) return ''
  if (url.startsWith('signed:')) {
    const parts = url.split(':')
    return await getSignedUrl(parts[1] as StorageBucket, parts.slice(2).join(':'))
  }
  return url
}

// ─── Componente Principal ──────────────────────────────
export function PatientDocumentsTab({ pacienteId }: { pacienteId: string }) {
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId
  const { toast } = useToast()
  const { getPatientById } = usePatients()

  const [files, setFiles] = useState<DocFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewingFile, setViewingFile] = useState<StorageFile | null>(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('todos')
  const [dateFilter, setDateFilter] = useState<'todos' | 'hoje' | 'semana' | 'mes'>('todos')
  const [uploadCategoria, setUploadCategoria] = useState('exame')
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState<typeof DOC_TEMPLATES[0] | null>(null)
  const [templateContent, setTemplateContent] = useState('')
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({})

  // Carregar arquivos
  const loadFiles = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await listPatientFiles('pacientes-documentos', clinicaId || '', pacienteId)
      const exames = await listPatientFiles('pacientes-exames', clinicaId || '', pacienteId)

      // Buscar categorias do banco
      const { data: dbDocs } = await supabase
        .from('documentos_paciente')
        .select('storage_path, tipo')
        .eq('paciente_id', pacienteId)
      const catMap = new Map((dbDocs || []).map((d: any) => [d.storage_path, d.tipo]))

      const merged = [...data, ...exames].map(f => ({
        ...f,
        categoria: catMap.get(f.path) || (f.mime_type?.startsWith('image/') ? 'foto' : 'exame'),
      })).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))

      setFiles(merged)

      // Gerar previews para imagens
      const previews: Record<string, string> = {}
      for (const f of merged.filter(f => f.mime_type?.startsWith('image/')).slice(0, 12)) {
        try {
          previews[f.id] = await resolveUrl(f.url)
        } catch { /* ignore */ }
      }
      setPreviewUrls(previews)
    } catch (e: any) {
      toast({ title: 'Erro ao carregar arquivos', description: e.message, type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, pacienteId, toast])

  useEffect(() => {
    if (clinicaId && pacienteId) loadFiles()
  }, [clinicaId, pacienteId, loadFiles])

  const handleUploadComplete = async (newFiles: StorageFile[]) => {
    setFiles(prev => [...newFiles.map(f => ({ ...f, categoria: uploadCategoria })), ...prev])
    for (const f of newFiles) {
      await supabase.from('documentos_paciente').insert({
        paciente_id: pacienteId,
        nome: f.nome,
        tipo: uploadCategoria,
        tamanho_bytes: f.tamanho_bytes,
        mime_type: f.mime_type,
        arquivo_url: f.url,
        storage_path: f.path,
        uploaded_by: user?.id,
      })
    }
    toast({ title: 'Upload concluído', description: `${newFiles.length} arquivo(s) em "${CATEGORIAS_MAP[uploadCategoria]?.label || uploadCategoria}".`, type: 'success' })
  }

  // Enviar documento via WhatsApp
  const handleSendWhatsApp = async (file: DocFile) => {
    try {
      const paciente = await getPatientById(pacienteId)
      if (!paciente?.contato?.telefone) {
        toast({ title: 'Aviso', description: 'Paciente sem telefone cadastrado.', type: 'warning' })
        return
      }
      const url = await resolveUrl(file.url)
      await supabase.functions.invoke('whatsapp-send', {
        body: {
          numero: paciente.contato.telefone,
          texto: `Olá ${paciente.nome.split(' ')[0]}, segue o documento "${file.nome}" da ${user?.clinicaNome || 'clínica'}.\n\n${url}`,
          tipo: 'texto',
          clinica_id: clinicaId,
        },
      })
      toast({ title: 'Enviado!', description: `Documento enviado para ${paciente.contato.telefone}.`, type: 'success' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
    }
  }

  // Gerar template preenchido
  const openTemplate = async (tpl: typeof DOC_TEMPLATES[0]) => {
    const paciente = await getPatientById(pacienteId)
    const dp = new Date().toISOString().split('T')[0].split('-')
    const hoje = `${dp[2]}/${dp[1]}/${dp[0]}`
    const content = tpl.conteudo
      .replace(/\{\{NOME\}\}/g, paciente?.nome || '________________________')
      .replace(/\{\{CPF\}\}/g, paciente?.cpf || '___.___.___-__')
      .replace(/\{\{DATA\}\}/g, hoje)
      .replace(/\{\{CIDADE\}\}/g, paciente?.endereco?.cidade || '________________')
      .replace(/\{\{PROFISSIONAL\}\}/g, user?.nome || '________________________')
      .replace(/\{\{CONSELHO\}\}/g, user?.crm || 'CRM/CRO ________')
    setActiveTemplate(tpl)
    setTemplateContent(content)
    setShowTemplateModal(true)
  }

  const handlePrintTemplate = () => {
    if (!activeTemplate) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><title>${activeTemplate.titulo}</title><style>
      @page { margin: 25mm 20mm; }
      body { font-family: Georgia, serif; margin: 0; color: #111; font-size: 13px; line-height: 2; white-space: pre-line; }
      .header { border-bottom: 2px solid #16a34a; padding-bottom: 10px; margin-bottom: 30px; }
      .header h1 { font-size: 18px; margin: 0; }
      .header small { color: #999; font-size: 9px; text-transform: uppercase; letter-spacing: 2px; }
      .titulo { text-align: center; font-size: 15px; text-transform: uppercase; letter-spacing: 3px; font-weight: bold; margin-bottom: 30px; }
      .footer { margin-top: 50px; text-align: center; font-size: 8px; color: #bbb; }
    </style></head><body>
      <div class="header"><h1>${user?.clinicaNome || 'Prontuário Verde'}</h1><small>Sistema de Gestão Clínica</small></div>
      <div class="titulo">${activeTemplate.titulo}</div>
      ${templateContent}
      <div class="footer">Gerado pelo sistema Prontuário Verde</div>
    </body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 600)
  }

  // Filtros
  const now = new Date()
  const filtered = files.filter(f => {
    if (search && !f.nome.toLowerCase().includes(search.toLowerCase())) return false
    if (catFilter !== 'todos' && f.categoria !== catFilter) return false
    if (dateFilter !== 'todos') {
      const fileDate = f.created_at?.split('T')[0] || ''
      const pad = (n: number) => String(n).padStart(2, '0')
      const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
      if (dateFilter === 'hoje' && fileDate !== todayStr) return false
      if (dateFilter === 'semana') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const weekStr = `${weekAgo.getFullYear()}-${pad(weekAgo.getMonth() + 1)}-${pad(weekAgo.getDate())}`
        if (fileDate < weekStr) return false
      }
      if (dateFilter === 'mes') {
        const mesStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`
        if (fileDate < mesStr) return false
      }
    }
    return true
  })

  return (
    <div className="space-y-5">
      {/* Upload com categoria */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-cyan-500" />
            <h3 className="text-sm font-bold text-gray-900">Enviar Documentos</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 font-medium">Categoria:</span>
            <select
              value={uploadCategoria}
              onChange={e => setUploadCategoria(e.target.value)}
              className="text-xs font-semibold border border-gray-200 rounded-lg px-2 py-1 bg-white outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              {CATEGORIAS.filter(c => c.id !== 'todos').map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="p-5">
          {clinicaId && (
            <FileUpload bucket="pacientes-exames" clinica_id={clinicaId} paciente_id={pacienteId}
              label="Arraste arquivos aqui (PDFs, imagens, radiografias)" onUploadComplete={handleUploadComplete} />
          )}
        </div>
      </div>

      {/* Templates */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-bold text-gray-900">Gerar Documento</h3>
        </div>
        <div className="p-5 flex flex-wrap gap-2">
          {DOC_TEMPLATES.map(tpl => (
            <button
              key={tpl.id}
              onClick={() => openTemplate(tpl)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 border border-gray-200 hover:border-blue-200 rounded-lg transition-all"
            >
              <FileText className="w-3.5 h-3.5" /> {tpl.titulo}
            </button>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          {/* Categorias */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {CATEGORIAS.map(c => {
              const count = c.id === 'todos' ? files.length : files.filter(f => f.categoria === c.id).length
              if (c.id !== 'todos' && count === 0) return null
              return (
                <button key={c.id} onClick={() => setCatFilter(c.id)}
                  className={cn('px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all',
                    catFilter === c.id ? c.color + ' border-transparent' : 'bg-white text-gray-500 border-gray-200')}>
                  {c.label} ({count})
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            {/* Filtro data */}
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value as any)}
              className="text-[10px] font-semibold border border-gray-200 rounded-lg px-2 py-1.5 bg-white outline-none">
              <option value="todos">Todas as datas</option>
              <option value="hoje">Hoje</option>
              <option value="semana">Última semana</option>
              <option value="mes">Este mês</option>
            </select>

            {/* Busca */}
            {files.length > 3 && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
                  className="pl-7 pr-3 py-1.5 text-[10px] border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-cyan-500/20 w-36" />
              </div>
            )}
          </div>
        </div>

        {/* Grid de arquivos */}
        <div className="p-5">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-cyan-500" /></div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(file => {
                const cat = CATEGORIAS_MAP[file.categoria || 'outro'] || CATEGORIAS_MAP.outro
                const isImage = file.mime_type?.startsWith('image/')
                const preview = previewUrls[file.id]
                return (
                  <div key={file.id} className="group cursor-pointer bg-gray-50/50 hover:bg-white rounded-xl border border-gray-100 hover:border-cyan-500/20 hover:shadow-md transition-all overflow-hidden">
                    {/* Preview de imagem */}
                    {isImage && preview ? (
                      <div className="h-28 bg-gray-100 overflow-hidden" onClick={() => setViewingFile(file)}>
                        <img src={preview} alt={file.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    ) : null}

                    <div className="p-3 flex items-center gap-3" onClick={() => setViewingFile(file)}>
                      {!isImage || !preview ? (
                        <div className={cn('w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-colors', getFileIconBg(file.mime_type))}>
                          {getFileIcon(file.mime_type)}
                        </div>
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-semibold text-gray-900 truncate group-hover:text-cyan-600 transition-colors">{file.nome}</h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={cn('px-1.5 py-0.5 rounded text-[8px] font-semibold', cat.color)}>{cat.label}</span>
                          <span className="text-[9px] text-gray-300">{fmtSize(file.tamanho_bytes)}</span>
                          <span className="text-[9px] text-gray-300">{fmtDate(file.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="px-3 pb-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); handleSendWhatsApp(file) }}
                        className="flex items-center gap-1 px-2 py-1 text-[9px] font-semibold text-cyan-500 hover:bg-cyan-500/5 rounded transition-colors">
                        <Send className="w-3 h-3" /> WhatsApp
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : files.length > 0 ? (
            <div className="py-12 text-center">
              <Filter className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Nenhum arquivo corresponde aos filtros</p>
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
        <FileViewer file={viewingFile} onClose={() => setViewingFile(null)}
          onDelete={(f) => {
            setFiles(prev => prev.filter(x => x.id !== f.id))
            supabase.from('documentos_paciente').delete().eq('storage_path', f.path).then(() => { }).catch(() => { })
          }} isAdmin={true} />
      )}

      {/* Modal Template */}
      {showTemplateModal && activeTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowTemplateModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col animate-fade-in">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{activeTemplate.titulo}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Revise e imprima</p>
              </div>
              <button onClick={() => setShowTemplateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <textarea
                value={templateContent}
                onChange={e => setTemplateContent(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 leading-relaxed outline-none focus:ring-2 focus:ring-blue-500/20 resize-none min-h-[300px] font-mono"
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0">
              <button onClick={() => setShowTemplateModal(false)} className="px-4 py-2 text-sm font-medium text-gray-500">Cancelar</button>
              <button onClick={handlePrintTemplate}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
                <Printer className="w-4 h-4" /> Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
