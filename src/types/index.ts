export interface Debt {
  id: string
  device_id: string
  name: string
  total_amount: number
  remaining: number
  interest: number
  min_payment: number
  frequency: 'monthly' | 'daily' | 'recurring_bill'
  due_day: number
  color: string
  icon: string
  sort_order: number
  created_at: string
}

export interface Payment {
  id: string
  device_id: string
  debt_id: string
  debt_name: string
  amount: number
  principal: number
  interest: number
  date: string
  note: string
  color: string
  created_at: string
}

export type DebtInsert = Omit<Debt, 'id' | 'created_at'>
export type DebtUpdate = Partial<Omit<Debt, 'id' | 'device_id' | 'created_at'>>
export type PaymentInsert = Omit<Payment, 'id' | 'created_at'>
