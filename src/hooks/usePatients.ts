import { useState, useCallback } from 'react'
import { PATIENTS_MOCK, PATIENT_APPOINTMENTS_MOCK, PATIENT_DOCUMENTS_MOCK, PATIENT_FINANCIAL_MOCK } from '../data/patientMockData'
import type { Patient, Appointment, PatientDocument, PatientFinancial } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// usePatients — Hook principal para gestão de pacientes
// ─────────────────────────────────────────────────────────────────────────────

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>(PATIENTS_MOCK)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── STUB: Buscar lista de pacientes ────────────────────────────────────────
  const getPatients = useCallback(async () => {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    setIsLoading(false)
    return PATIENTS_MOCK
  }, [])

  // ── STUB: Buscar paciente por ID ───────────────────────────────────────────
  const getPatientById = useCallback(async (id: string) => {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    const patient = PATIENTS_MOCK.find(p => p.id === id)
    setIsLoading(false)
    return patient || null
  }, [])

  // ── STUB: Buscar histórico de consultas ───────────────────────────────────
  const getPatientHistory = useCallback(async (id: string): Promise<Appointment[]> => {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 300))
    setIsLoading(false)
    return PATIENT_APPOINTMENTS_MOCK[id] || []
  }, [])

  // ── STUB: Buscar documentos do paciente ──────────────────────────────────
  const getPatientDocuments = useCallback(async (id: string): Promise<PatientDocument[]> => {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 300))
    setIsLoading(false)
    return PATIENT_DOCUMENTS_MOCK[id] || []
  }, [])

  // ── STUB: Buscar financeiro do paciente ──────────────────────────────────
  const getPatientFinancial = useCallback(async (id: string): Promise<PatientFinancial[]> => {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 300))
    setIsLoading(false)
    return PATIENT_FINANCIAL_MOCK[id] || []
  }, [])

  // ── STUB: Criar novo paciente ─────────────────────────────────────────────
  const createPatient = useCallback(async (data: Partial<Patient>) => {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    const novo: Patient = {
      ...(data as Patient),
      id: `pac-${Date.now()}`,
      ativo: true,
      criadoEm: new Date().toISOString().split('T')[0],
      totalConsultas: 0
    }
    setPatients(prev => [novo, ...prev])
    setIsLoading(false)
    return novo
  }, [])

  // ── STUB: Atualizar paciente ──────────────────────────────────────────────
  const updatePatient = useCallback(async (id: string, data: Partial<Patient>) => {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 500))
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
    setIsLoading(false)
  }, [])

  // ── STUB: Gerar link de anamnese ──────────────────────────────────────────
  const sendAnamnesisLink = useCallback(async (patientId: string) => {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    const token = Math.random().toString(36).substring(2, 15)
    setIsLoading(false)
    return `http://localhost:5173/anamnese/${token}?pid=${patientId}`
  }, [])

  return {
    patients,
    isLoading,
    error,
    getPatients,
    getPatientById,
    getPatientHistory,
    getPatientDocuments,
    getPatientFinancial,
    createPatient,
    updatePatient,
    sendAnamnesisLink
  }
}
