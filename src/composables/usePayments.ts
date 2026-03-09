import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useDeviceId } from './useDeviceId'
import type { Payment, PaymentInsert } from '@/types'

const payments = ref<Payment[]>([])
const loading = ref(false)
const deviceId = useDeviceId()

export function usePayments() {
  async function fetchPayments() {
    loading.value = true
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      payments.value = data as Payment[]
    }
    loading.value = false
  }

  async function addPayment(payment: Omit<PaymentInsert, 'device_id'>) {
    const { data, error } = await supabase
      .from('payments')
      .insert({ ...payment, device_id: deviceId })
      .select()
      .single()

    if (!error && data) {
      payments.value.unshift(data as Payment)
    }
    return { data, error }
  }

  async function updatePayment(id: string, updates: Partial<Pick<Payment, 'debt_id' | 'debt_name' | 'amount' | 'principal' | 'interest' | 'date' | 'note' | 'color'>>) {
    const { data, error } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', id)
      .eq('device_id', deviceId)
      .select()
      .single()

    if (!error && data) {
      const idx = payments.value.findIndex(p => p.id === id)
      if (idx !== -1) payments.value[idx] = data as Payment
    }
    return { data, error }
  }

  async function deletePayment(id: string) {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id)
      .eq('device_id', deviceId)

    if (!error) {
      payments.value = payments.value.filter(p => p.id !== id)
    }
    return { error }
  }

  return {
    payments,
    loading,
    fetchPayments,
    addPayment,
    updatePayment,
    deletePayment
  }
}
