# Gestão de Ausências de Profissionais — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow clinic admins to mark professional day-offs/absences, warn about conflicting appointments, optionally notify patients via WhatsApp, and block those slots in the agenda and OVYVA.

**Architecture:** New `profissional_ausencias` table with RLS. New `useAusencias` hook for CRUD + conflict detection. Modal in ProfissionaisPage for managing absences with conflict resolution (auto-notify/manual/skip). Visual blocking in DayView/WeekView. OVYVA ai-gateway queries absences before suggesting slots.

**Tech Stack:** Supabase (PostgreSQL + RLS), React 19, TypeScript, Tailwind CSS, Lucide icons, jsPDF (n/a here)

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `supabase/migrations/20260325000001_profissional_ausencias.sql` | Create | Table + RLS + indices |
| `src/hooks/useAusencias.ts` | Create | CRUD, conflict check, notify patients |
| `src/pages/Configuracoes/ProfissionaisPage.tsx` | Modify | Add "Folgas" button per row + AusenciasModal |
| `src/components/configuracoes/AusenciasModal.tsx` | Create | Full absence management modal (list + create + conflict) |
| `src/components/agenda/DayView.tsx` | Modify | Show absence blocking overlay |
| `src/components/agenda/WeekView.tsx` | Modify | Show absence blocking overlay |
| `src/hooks/useAgenda.ts` | Modify | Load absences alongside appointments |
| `supabase/functions/ai-gateway/index.ts` | Modify | Query absences in OVYVA context |
| `src/lib/database.types.ts` | Regenerate | After migration push |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260325000001_profissional_ausencias.sql`

- [ ] **Step 1: Create migration file**

```sql
-- Tabela de ausências/folgas de profissionais
CREATE TABLE IF NOT EXISTS public.profissional_ausencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'folga', -- folga, atestado, ferias, outro
  motivo TEXT,
  notificou_pacientes BOOLEAN NOT NULL DEFAULT FALSE,
  consultas_canceladas INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),

  CONSTRAINT check_datas CHECK (data_fim >= data_inicio)
);

-- Índices
CREATE INDEX idx_ausencias_clinica ON public.profissional_ausencias(clinica_id);
CREATE INDEX idx_ausencias_profissional ON public.profissional_ausencias(profissional_id, data_inicio, data_fim);
CREATE INDEX idx_ausencias_datas ON public.profissional_ausencias(data_inicio, data_fim);

-- RLS
ALTER TABLE public.profissional_ausencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ausencias_select_clinica"
  ON public.profissional_ausencias FOR SELECT
  TO authenticated
  USING (clinica_id = public.get_my_clinica_id());

CREATE POLICY "ausencias_insert_clinica"
  ON public.profissional_ausencias FOR INSERT
  TO authenticated
  WITH CHECK (clinica_id = public.get_my_clinica_id());

CREATE POLICY "ausencias_update_clinica"
  ON public.profissional_ausencias FOR UPDATE
  TO authenticated
  USING (clinica_id = public.get_my_clinica_id());

CREATE POLICY "ausencias_delete_clinica"
  ON public.profissional_ausencias FOR DELETE
  TO authenticated
  USING (clinica_id = public.get_my_clinica_id());

-- service_role full access (para ai-gateway)
CREATE POLICY "ausencias_service_role"
  ON public.profissional_ausencias FOR SELECT
  TO service_role
  USING (true);
```

- [ ] **Step 2: Push migration to Supabase**

Run: `npx supabase db push --linked`
Expected: "Applying migration 20260325000001_profissional_ausencias.sql... Finished"

- [ ] **Step 3: Regenerate database types**

Run: `npx supabase gen types typescript --project-id mddbbwbwmwcvecbnfmqg 2>/dev/null > src/lib/database.types.ts`
Verify: `grep 'profissional_ausencias' src/lib/database.types.ts` returns matches

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260325000001_profissional_ausencias.sql src/lib/database.types.ts
git commit -m "feat: migration profissional_ausencias — tabela + RLS + índices"
```

---

## Task 2: useAusencias Hook

**Files:**
- Create: `src/hooks/useAusencias.ts`

- [ ] **Step 1: Create the hook with CRUD + conflict detection + notification**

```typescript
import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useToast } from './useToast'

export interface Ausencia {
  id: string
  profissional_id: string
  clinica_id: string
  data_inicio: string
  data_fim: string
  tipo: 'folga' | 'atestado' | 'ferias' | 'outro'
  motivo: string | null
  notificou_pacientes: boolean
  consultas_canceladas: number
  created_at: string
}

export interface ConsultaConflito {
  id: string
  paciente_nome: string
  paciente_telefone: string | null
  data_hora_inicio: string
  procedimento: string | null
  status: string
}

export function useAusencias() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const clinicaId = user?.clinicaId

  const [ausencias, setAusencias] = useState<Ausencia[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load all absences for a professional
  const loadAusencias = useCallback(async (profissionalId: string) => {
    if (!clinicaId) return
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('profissional_ausencias')
        .select('*')
        .eq('clinica_id', clinicaId)
        .eq('profissional_id', profissionalId)
        .order('data_inicio', { ascending: false })

      if (error) throw error
      setAusencias((data ?? []) as Ausencia[])
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, toast])

  // Load absences for ALL professionals in a date range (for agenda view)
  const loadAusenciasByRange = useCallback(async (startDate: string, endDate: string): Promise<Ausencia[]> => {
    if (!clinicaId) return []
    try {
      const { data, error } = await supabase
        .from('profissional_ausencias')
        .select('*')
        .eq('clinica_id', clinicaId)
        .lte('data_inicio', endDate)
        .gte('data_fim', startDate)

      if (error) throw error
      return (data ?? []) as Ausencia[]
    } catch {
      return []
    }
  }, [clinicaId])

  // Check conflicting appointments for a date range + professional
  const checkConflitos = useCallback(async (
    profissionalId: string,
    dataInicio: string,
    dataFim: string
  ): Promise<ConsultaConflito[]> => {
    if (!clinicaId) return []
    try {
      const { data, error } = await supabase
        .from('consultas')
        .select('id, data_hora_inicio, status, observacoes, pacientes(nome_completo, telefone, whatsapp), procedimentos(nome)')
        .eq('clinica_id', clinicaId)
        .eq('profissional_id', profissionalId)
        .gte('data_hora_inicio', `${dataInicio}T00:00:00`)
        .lte('data_hora_inicio', `${dataFim}T23:59:59`)
        .in('status', ['agendado', 'confirmado'])

      if (error) throw error

      return (data ?? []).map((c: any) => ({
        id: c.id,
        paciente_nome: c.pacientes?.nome_completo ?? '—',
        paciente_telefone: c.pacientes?.whatsapp || c.pacientes?.telefone || null,
        data_hora_inicio: c.data_hora_inicio,
        procedimento: c.procedimentos?.nome ?? null,
        status: c.status,
      }))
    } catch {
      return []
    }
  }, [clinicaId])

  // Create absence
  const createAusencia = useCallback(async (data: {
    profissional_id: string
    data_inicio: string
    data_fim: string
    tipo: string
    motivo?: string
  }) => {
    if (!clinicaId) return null
    try {
      const { data: ret, error } = await supabase
        .from('profissional_ausencias')
        .insert({
          clinica_id: clinicaId,
          profissional_id: data.profissional_id,
          data_inicio: data.data_inicio,
          data_fim: data.data_fim,
          tipo: data.tipo,
          motivo: data.motivo || null,
          created_by: user?.id,
        })
        .select()
        .single()

      if (error) throw error
      setAusencias(prev => [ret as Ausencia, ...prev])
      toast({ title: 'Ausência registrada', description: 'Folga adicionada ao calendário.', type: 'success' })
      return ret as Ausencia
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
      return null
    }
  }, [clinicaId, user?.id, toast])

  // Delete absence
  const deleteAusencia = useCallback(async (id: string) => {
    if (!clinicaId) return
    try {
      const { error } = await supabase
        .from('profissional_ausencias')
        .delete()
        .eq('id', id)
        .eq('clinica_id', clinicaId)

      if (error) throw error
      setAusencias(prev => prev.filter(a => a.id !== id))
      toast({ title: 'Removida', description: 'Ausência removida.', type: 'info' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
    }
  }, [clinicaId, toast])

  // Cancel conflicting appointments + optionally notify patients
  const cancelarConsultasConflitantes = useCallback(async (
    consultas: ConsultaConflito[],
    ausenciaId: string,
    notificar: boolean,
    mensagemCustom?: string
  ) => {
    if (!clinicaId) return
    const clinicaNome = user?.clinicaNome ?? 'Clínica'
    let canceladas = 0

    for (const consulta of consultas) {
      // Cancel the appointment
      await supabase.from('consultas').update({
        status: 'cancelado',
        observacoes: '[CANCELADO - AUSÊNCIA DO PROFISSIONAL] Profissional indisponível nesta data.',
      }).eq('id', consulta.id)

      canceladas++

      // Notify patient via WhatsApp queue
      if (notificar && consulta.paciente_telefone) {
        const dataFormatada = new Date(consulta.data_hora_inicio).toLocaleDateString('pt-BR')
        const horaFormatada = new Date(consulta.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        const mensagem = mensagemCustom ||
          `Olá ${consulta.paciente_nome}! Informamos que sua consulta na ${clinicaNome} do dia ${dataFormatada} às ${horaFormatada} precisou ser cancelada pois o profissional estará ausente. Entre em contato para reagendar. Pedimos desculpas pelo inconveniente.`

        await supabase.from('notificacoes_fila').insert({
          clinica_id: clinicaId,
          tipo: 'cancelamento_ausencia',
          canal: 'whatsapp',
          destinatario_telefone: consulta.paciente_telefone,
          destinatario_nome: consulta.paciente_nome,
          paciente_id: null,
          consulta_id: consulta.id,
          mensagem,
          agendar_para: new Date().toISOString(),
        })
      }
    }

    // Update absence record
    await supabase.from('profissional_ausencias').update({
      notificou_pacientes: notificar,
      consultas_canceladas: canceladas,
    }).eq('id', ausenciaId)

    toast({
      title: `${canceladas} consulta${canceladas > 1 ? 's' : ''} cancelada${canceladas > 1 ? 's' : ''}`,
      description: notificar ? 'Pacientes serão notificados via WhatsApp.' : 'Consultas canceladas sem notificação.',
      type: 'success',
    })
  }, [clinicaId, user?.clinicaNome, toast])

  return {
    ausencias, isLoading,
    loadAusencias, loadAusenciasByRange,
    checkConflitos, createAusencia, deleteAusencia,
    cancelarConsultasConflitantes,
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npx vite build 2>&1 | tail -3`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAusencias.ts
git commit -m "feat: useAusencias hook — CRUD, conflitos, notificação WhatsApp"
```

---

## Task 3: AusenciasModal Component

**Files:**
- Create: `src/components/configuracoes/AusenciasModal.tsx`

- [ ] **Step 1: Create the modal with 3 views (list / create / conflict resolution)**

The modal has 3 internal states:
1. **list** — shows existing absences for the professional + "Nova Ausência" button
2. **create** — form with date range, tipo, motivo
3. **conflict** — warning with patient list + 3 action buttons

Key UI elements:
- List view: table with data_inicio, data_fim, tipo, motivo, badge notificou_pacientes, delete button
- Create view: date inputs, select tipo (folga/atestado/férias/outro), textarea motivo, "Verificar e Criar" button
- Conflict view: alert banner "X pacientes agendados neste período", patient list (nome, telefone, data/hora, procedimento), 3 buttons:
  - "Cancelar e Notificar" (green) — cancels + enqueues WhatsApp
  - "Cancelar sem Notificar" (amber) — cancels only
  - "Apenas Marcar Folga" (gray) — creates absence without touching appointments

Props: `{ profissional: { id, nome_completo }, onClose: () => void }`

Full implementation code should follow the modal patterns established in the codebase:
- `fixed inset-0 z-50 bg-black/40 backdrop-blur-sm`
- `bg-white rounded-2xl shadow-xl w-full max-w-lg`
- Header with icon + title + X button
- Content area with state-driven rendering
- Action buttons at bottom

- [ ] **Step 2: Verify build**

Run: `npx vite build 2>&1 | tail -3`

- [ ] **Step 3: Commit**

```bash
git add src/components/configuracoes/AusenciasModal.tsx
git commit -m "feat: AusenciasModal — lista, criação e resolução de conflitos"
```

---

## Task 4: Integrate AusenciasModal in ProfissionaisPage

**Files:**
- Modify: `src/pages/Configuracoes/ProfissionaisPage.tsx`

- [ ] **Step 1: Add "Folgas" button in table row actions + modal state**

Changes needed:
1. Import `AusenciasModal` and `CalendarOff` icon
2. Add state: `const [ausenciaProf, setAusenciaProf] = useState<Profissional | null>(null)`
3. Add button next to Edit in the actions column:
```tsx
<button onClick={() => setAusenciaProf(prof)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Folgas e Ausências">
  <CalendarOff size={16} />
</button>
```
4. Render modal at bottom:
```tsx
{ausenciaProf && (
  <AusenciasModal
    profissional={ausenciaProf}
    onClose={() => setAusenciaProf(null)}
  />
)}
```

- [ ] **Step 2: Verify build and test in browser**

Run: `npx vite build 2>&1 | tail -3`

- [ ] **Step 3: Commit**

```bash
git add src/pages/Configuracoes/ProfissionaisPage.tsx
git commit -m "feat: botão Folgas na tabela de profissionais + modal integrado"
```

---

## Task 5: Agenda Visual Blocking (DayView + WeekView)

**Files:**
- Modify: `src/hooks/useAgenda.ts` — add absences loading
- Modify: `src/components/agenda/DayView.tsx` — render absence overlay
- Modify: `src/components/agenda/WeekView.tsx` — render absence overlay

- [ ] **Step 1: Add absence loading to useAgenda**

In `useAgenda.ts`:
1. Add state: `const [ausencias, setAusencias] = useState<Ausencia[]>([])`
2. Import and use `loadAusenciasByRange` from useAusencias (or inline the query)
3. When appointments load for a date range, also load absences for that range
4. Return `ausencias` from the hook

- [ ] **Step 2: Add absence prop to DayView and WeekView**

Add to both components' props:
```typescript
ausencias?: Array<{ profissional_id: string; data_inicio: string; data_fim: string; tipo: string; profissional_nome?: string }>
```

- [ ] **Step 3: Render blocking overlay in DayView**

In DayView, after rendering appointments, add:
```tsx
{/* Absence overlay — full-day block */}
{ausencias?.filter(a => {
  const dateStr = date.toISOString().split('T')[0]
  return a.data_inicio <= dateStr && a.data_fim >= dateStr
}).map(a => (
  <div key={a.profissional_id + a.data_inicio}
    className="absolute inset-x-0 top-0 bottom-0 bg-slate-100/60 border-2 border-dashed border-slate-300 rounded-lg z-5 flex items-start justify-center pt-4 pointer-events-none">
    <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
      Ausência — {a.tipo}
    </span>
  </div>
))}
```

- [ ] **Step 4: Render blocking overlay in WeekView**

Similar to DayView but per-column, checking each day of the week against absences.

- [ ] **Step 5: Verify build**

Run: `npx vite build 2>&1 | tail -3`

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useAgenda.ts src/components/agenda/DayView.tsx src/components/agenda/WeekView.tsx
git commit -m "feat: agenda — bloqueio visual de ausências no DayView e WeekView"
```

---

## Task 6: OVYVA Integration (ai-gateway)

**Files:**
- Modify: `supabase/functions/ai-gateway/index.ts`

- [ ] **Step 1: Add absence query in OVYVA handler**

In the `Promise.all` block (line ~339), add a 4th query:

```typescript
supabase
  .from("profissional_ausencias")
  .select("profissional_id, data_inicio, data_fim")
  .eq("clinica_id", clinica_id)
  .gte("data_fim", new Date().toISOString().split('T')[0])
```

- [ ] **Step 2: Include absences in system prompt context**

After the existing agenda formatting, add:

```typescript
const ausenciasData = ausenciasRes.data || []
const ausenciasFormatadas = ausenciasData.map((a: any) =>
  `- Profissional ${a.profissional_id} ausente de ${a.data_inicio} a ${a.data_fim}`
).join('\n')
```

Add to system prompt:
```
${ausenciasFormatadas ? `\n\nPROFISSIONAIS AUSENTES (não agende nesses dias):\n${ausenciasFormatadas}` : ''}
```

- [ ] **Step 3: Deploy edge function**

Run: `npx supabase functions deploy ai-gateway --project-ref mddbbwbwmwcvecbnfmqg`

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/ai-gateway/index.ts
git commit -m "feat: OVYVA — consulta ausências antes de sugerir horários"
```

---

## Task 7: Final Integration + CONTEXTO_PROJETO.md Update

- [ ] **Step 1: Build and verify zero errors**

Run: `npx vite build 2>&1 | tail -5`

- [ ] **Step 2: Test in browser**

Navigate to `/configuracoes/profissionais`, click Folgas button, create absence, verify conflict modal, check agenda blocking.

- [ ] **Step 3: Update CONTEXTO_PROJETO.md**

Add to fases: `- Fase 19: ✅ Gestão de Ausências de Profissionais (25/03/2026)`
Add to próximos passos or features list.

- [ ] **Step 4: Final commit and push**

```bash
git add -A
git commit -m "feat: gestão de ausências — migration, hook, modal, agenda, OVYVA"
git push origin main
```
