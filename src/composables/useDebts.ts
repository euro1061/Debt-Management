import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useDeviceId } from './useDeviceId'
import type { Debt, DebtInsert, DebtUpdate } from '@/types'

const debts = ref<Debt[]>([])
const loading = ref(false)
const deviceId = useDeviceId()

export function useDebts() {
  async function fetchDebts() {
    loading.value = true
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      debts.value = data as Debt[]
    }
    loading.value = false
  }

  async function addDebt(debt: Omit<DebtInsert, 'device_id'>) {
    const { data, error } = await supabase
      .from('debts')
      .insert({ ...debt, device_id: deviceId })
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
      .eq('device_id', deviceId)
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
      .eq('device_id', deviceId)

    if (!error) {
      debts.value = debts.value.filter(d => d.id !== id)
    }
    return { error }
  }

  async function updateDebtRemaining(id: string, remaining: number) {
    return updateDebt(id, { remaining })
  }

  return {
    debts,
    loading,
    fetchDebts,
    addDebt,
    updateDebt,
    deleteDebt,
    updateDebtRemaining
  }
}
