import type { Debt } from '@/types'

export function calculateMonthsToPayoff(debt: Debt, extraPayment: number): number {
  const balance = Number(debt.remaining)
  const rate = Number(debt.interest) / 100
  let payment = Number(debt.min_payment) + Number(extraPayment)

  if (debt.frequency === 'daily') {
    payment = payment * 30
  }

  const monthlyRate = rate / 12

  if (monthlyRate === 0) {
    return payment > 0 ? balance / payment : Infinity
  }

  const monthlyInterest = balance * monthlyRate
  if (payment <= monthlyInterest) return Infinity

  const months = -Math.log(1 - (balance * monthlyRate) / payment) / Math.log(1 + monthlyRate)
  return isNaN(months) || months < 0 ? Infinity : months
}

export function calculateOverallFreedomDate(debts: Debt[]): string | null {
  if (debts.length === 0) return null
  let maxMonths = 0
  debts.forEach(d => {
    const months = calculateMonthsToPayoff(d, 0)
    if (months > maxMonths) maxMonths = months
  })
  if (maxMonths === Infinity || maxMonths <= 0) return 'ไม่สามารถคำนวณ'
  const target = new Date()
  target.setMonth(target.getMonth() + Math.ceil(maxMonths))
  return target.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' })
}
