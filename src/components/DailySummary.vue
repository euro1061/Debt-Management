<script setup lang="ts">
import { computed } from 'vue'
import type { Debt } from '@/types'
import { fmt } from '@/utils/format'

const props = defineProps<{ debts: Debt[] }>()

const today = new Date().getDate()

const dailyDebts = computed(() => props.debts.filter(d => d.frequency === 'daily'))
const monthlyDebtsDueToday = computed(() =>
  props.debts.filter(d => d.frequency === 'monthly' && (parseInt(String(d.due_day)) || 1) === today)
)

const dailyTotal = computed(() => {
  let total = dailyDebts.value.reduce((s, d) => s + Number(d.min_payment), 0)
  monthlyDebtsDueToday.value.forEach(d => { total += Number(d.min_payment) })
  return total
})
</script>

<template>
  <div class="card daily-summary-card">
    <h3><i class="fas fa-calendar-day"></i> สรุปยอดวันนี้</h3>
    <div class="daily-amount">
      <span class="daily-label">ต้องเตรียมเงินวันนี้</span>
      <span class="daily-value">{{ fmt(dailyTotal) }}</span>
    </div>
    <div class="daily-breakdown">
      <div v-for="d in dailyDebts" :key="d.id" class="daily-row">
        <span class="daily-row-name">
          <i class="fas fa-circle" :style="{ color: d.color, fontSize: '0.5rem', verticalAlign: 'middle', marginRight: '6px' }"></i>
          {{ d.name }}
        </span>
        <span class="daily-row-amount">{{ fmt(d.min_payment) }}/วัน</span>
      </div>
      <div
        v-for="d in monthlyDebtsDueToday"
        :key="d.id"
        class="daily-row"
        :style="{ borderLeft: `3px solid ${d.color}` }"
      >
        <span class="daily-row-name">
          <i class="fas fa-circle" :style="{ color: d.color, fontSize: '0.5rem', verticalAlign: 'middle', marginRight: '6px' }"></i>
          {{ d.name }}
          <span style="color:var(--danger);font-size:0.7rem"> (ครบกำหนดวันนี้)</span>
        </span>
        <span class="daily-row-amount">{{ fmt(d.min_payment) }}</span>
      </div>
      <div v-if="dailyDebts.length === 0 && monthlyDebtsDueToday.length === 0" class="empty-inline">
        <p class="opacity-60">ไม่มียอดต้องจ่ายวันนี้</p>
      </div>
    </div>
  </div>
</template>
