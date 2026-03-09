import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Debt, DebtInsert, DebtUpdate } from '@/types'

const debts = ref<Debt[]>([])
const loading = ref(false)
const FAMILY_ID = 'family'

export function useDebts() {
  async function fetchDebts() {
    loading.value = true
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .eq('device_id', FAMILY_ID)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (!error && data) {
      debts.value = data as Debt[]
    }
    loading.value = false
  }

  async function addDebt(debt: Omit<DebtInsert, 'device_id'>) {
    const maxOrder = debts.value.reduce((m, d) => Math.max(m, d.sort_order ?? 0), 0)

    const { data, error } = await supabase
      .from('debts')
      .insert({ ...debt, device_id: FAMILY_ID, sort_order: maxOrder + 1 })
      .select()
      .single()

    if (!error && data) {
      debts.value.push(data as Debt)
    }
    return { data, error }
  }

  async function updateDebt(id: string, updates: DebtUpdate) {
    const { data, error } = await supabase
      .from('debts')
      .update(updates)
      .eq('id', id)
      .eq('device_id', FAMILY_ID)
      .select()
      .single()

    if (!error && data) {
      const idx = debts.value.findIndex(d => d.id === id)
      if (idx !== -1) debts.value[idx] = data as Debt
    }
    return { data, error }
  }

  async function deleteDebt(id: string) {
    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('id', id)
      .eq('device_id', FAMILY_ID)

    if (!error) {
      debts.value = debts.value.filter(d => d.id !== id)
    }
    return { error }
  }

  async function updateDebtRemaining(id: string, remaining: number) {
    return updateDebt(id, { remaining })
  }

  async function reorderDebts(orderedIds: string[]) {
    const results = await Promise.all(
      orderedIds.map((id, index) =>
        supabase
          .from('debts')
          .update({ sort_order: index })
          .eq('id', id)
          .eq('device_id', FAMILY_ID)
          .select()
          .single()
      )
    )

    for (const { data } of results) {
      if (!data) continue
      const idx = debts.value.findIndex(d => d.id === (data as Debt).id)
      if (idx !== -1) debts.value[idx] = data as Debt
    }

    debts.value.sort((a, b) =>
      (a.sort_order ?? 0) - (b.sort_order ?? 0) || (a.created_at || '').localeCompare(b.created_at || '')
    )
  }

  async function clearAllDebts() {
    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('device_id', FAMILY_ID)

    if (!error) debts.value = []
    return { error }
  }

  return {
    debts,
    loading,
    fetchDebts,
    addDebt,
    updateDebt,
    deleteDebt,
    updateDebtRemaining,
    reorderDebts,
    clearAllDebts
  }
}
