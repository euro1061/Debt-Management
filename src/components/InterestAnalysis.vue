<script setup lang="ts">
import { computed } from 'vue'
import type { Debt, Payment } from '@/types'

const props = defineProps<{ debts: Debt[]; payments: Payment[] }>()

const rows = computed(() => {
  const debtPayments: Record<string, { principal: number; interest: number }> = {}
  props.payments.forEach(p => {
    if (!debtPayments[p.debt_id]) debtPayments[p.debt_id] = { principal: 0, interest: 0 }
    debtPayments[p.debt_id].principal += Number(p.principal)
    debtPayments[p.debt_id].interest += Number(p.interest)
  })

  return props.debts.filter(d => d.frequency !== 'recurring_bill').map(d => {
    const dp = debtPayments[d.id] || { principal: 0, interest: 0 }
    const total = dp.principal + dp.interest

    if (total === 0) {
      const monthlyRate = (Number(d.interest) / 100) / 12
      const estInterest = Number(d.total_amount) * monthlyRate
      const estTotal = Number(d.min_payment)
      const estIntPct = estTotal > 0 ? Math.round((Math.max(0, estInterest) / estTotal) * 100) : 0
      return {
        id: d.id,
        name: d.name,
        principalPct: 100 - estIntPct,
        interestPct: estIntPct
      }
    }

    const interestPct = total > 0 ? Math.round((dp.interest / total) * 100) : 0
    return {
      id: d.id,
      name: d.name,
      principalPct: 100 - interestPct,
      interestPct
    }
  })
})
</script>

<template>
  <div class="card">
    <h3><i class="fas fa-chart-pie"></i> สัดส่วนดอกเบี้ยที่จ่ายไป</h3>
    <div class="interest-analysis">
      <template v-if="debts.length === 0">
        <div class="empty-inline"><p class="opacity-60">เพิ่มหนี้เพื่อดูการวิเคราะห์</p></div>
      </template>
      <div v-for="row in rows" :key="row.id" class="interest-row">
        <span class="interest-name">{{ row.name }}</span>
        <div class="interest-bar-track">
          <div class="interest-bar-principal" :style="{ width: row.principalPct + '%' }"></div>
          <div class="interest-bar-interest" :style="{ width: row.interestPct + '%' }"></div>
        </div>
        <span class="interest-pct">{{ row.interestPct }}%</span>
      </div>
      <div v-if="debts.length > 0" class="interest-legend">
        <span class="legend-principal">เงินต้น</span>
        <span class="legend-interest">ดอกเบี้ย</span>
      </div>
    </div>
  </div>
</template>
