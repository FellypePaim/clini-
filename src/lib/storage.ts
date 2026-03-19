import { supabase } from './supabase'

export type StorageBucket =
  | 'clinica-assets'
  | 'pacientes-documentos'
  | 'pacientes-exames'
  | 'pacientes-fotos'
  | 'prontuario-termos'
  | 'prontuario-receitas'
  | 'harmonizacao-mapas'
  | 'anamnese-assets'

export interface StorageFile {
  id: string
  nome: string
  url: string
  url_publica?: string
  tamanho_bytes: number
  mime_type: string
  bucket: StorageBucket
  path: string
  created_at: string
}

export const STORAGE_LIMITS = {
  'pacientes-exames':      { maxMB: 20, tipos: ['application/pdf', 'image/jpeg', 'image/png'] },
  'pacientes-fotos':       { maxMB: 10, tipos: ['image/jpeg', 'image/png', 'image/webp'] },
  'pacientes-documentos':  { maxMB: 10, tipos: ['application/pdf', 'image/jpeg', 'image/png'] },
  'prontuario-termos':     { maxMB: 5,  tipos: ['application/pdf', 'image/png'] },
  'prontuario-receitas':   { maxMB: 5,  tipos: ['application/pdf'] },
  'harmonizacao-mapas':    { maxMB: 5,  tipos: ['image/png', 'image/jpeg'] },
  'clinica-assets':        { maxMB: 2,  tipos: ['image/jpeg', 'image/png', 'image/svg+xml'] },
  'anamnese-assets':       { maxMB: 10, tipos: ['application/pdf', 'image/jpeg', 'image/png'] },
} as const

// Upload principal
export async function uploadFile(
  bucket: StorageBucket,
  clinica_id: string,
  paciente_id: string | null,
  file: File,
  onProgress?: (percent: number) => void
): Promise<StorageFile> {
  const limit = STORAGE_LIMITS[bucket]
  if (file.size > limit.maxMB * 1024 * 1024) {
    throw new Error(`O arquivo excede o tamanho máximo permitido de ${limit.maxMB}MB.`)
  }

  if ((limit.tipos as readonly string[]) && !(limit.tipos as readonly string[]).includes(file.type)) {
    throw new Error(`Tipo de arquivo não permitido (${file.type}). Use: ${limit.tipos.join(', ')}`)
  }

  const timestamp = Date.now()
  const nomeSeguro = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
  const path = paciente_id
    ? `${clinica_id}/${paciente_id}/${timestamp}_${nomeSeguro}`
    : `${clinica_id}/${timestamp}_${nomeSeguro}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw new Error(`Erro no upload: ${error.message}`)

  // Gerar URL base (Para público vira link real, para privado será "assinada:")
  const url = getFileUrl(bucket, path)

  return {
    id: data?.id ?? path,
    nome: file.name,
    url,
    tamanho_bytes: file.size,
    mime_type: file.type,
    bucket,
    path,
    created_at: new Date().toISOString(),
  }
}

// Obter a URL "Rascunho" ou Publica
export function getFileUrl(bucket: StorageBucket, path: string): string {
  if (bucket === 'clinica-assets') {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }
  return `signed:${bucket}:${path}`
}

// Gerar URL Assinada Real de 1 hora
export async function getSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn = 3600
): Promise<string> {
  if (bucket === 'clinica-assets') {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error) throw new Error(`Erro ao gerar URL assinada: ${error.message}`)
  return data.signedUrl
}

// Listar arquivos no bucket de um paciente
export async function listPatientFiles(
  bucket: StorageBucket,
  clinica_id: string,
  paciente_id: string
): Promise<StorageFile[]> {
  const prefix = `${clinica_id}/${paciente_id}/`
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(prefix, { sortBy: { column: 'created_at', order: 'desc' } })

  if (error) throw new Error(`Erro ao listar arquivos: ${error.message}`)

  const files = await Promise.all(
    (data ?? []).filter(f => f.name !== '.emptyFolderPlaceholder').map(async (f) => {
      const path = `${prefix}${f.name}`
      const url = await getSignedUrl(bucket, path)
      return {
        id: f.id ?? path,
        nome: f.name.replace(/^\d+_/, ''),
        url,
        tamanho_bytes: f.metadata?.size ?? 0,
        mime_type: f.metadata?.mimetype ?? 'application/octet-stream',
        bucket,
        path,
        created_at: f.created_at ?? new Date().toISOString(),
      }
    })
  )

  return files
}

// Deletar do Storage
export async function deleteFile(
  bucket: StorageBucket,
  path: string
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw new Error(`Erro ao deletar arquivo do storage: ${error.message}`)
}

export const StorageHelpers = {
  uploadExame: (clinica_id: string, paciente_id: string, file: File) => uploadFile('pacientes-exames', clinica_id, paciente_id, file),
  uploadFoto: (clinica_id: string, paciente_id: string, file: File) => uploadFile('pacientes-fotos', clinica_id, paciente_id, file),
  uploadDocumento: (clinica_id: string, paciente_id: string, file: File) => uploadFile('pacientes-documentos', clinica_id, paciente_id, file),
  uploadTermo: (clinica_id: string, paciente_id: string, file: File) => uploadFile('prontuario-termos', clinica_id, paciente_id, file),
  uploadReceita: (clinica_id: string, paciente_id: string, file: File) => uploadFile('prontuario-receitas', clinica_id, paciente_id, file),
  uploadLogo: (clinica_id: string, file: File) => uploadFile('clinica-assets', clinica_id, null, file),
  uploadMapaHarmonizacao: (clinica_id: string, paciente_id: string, file: File) => uploadFile('harmonizacao-mapas', clinica_id, paciente_id, file),
}
