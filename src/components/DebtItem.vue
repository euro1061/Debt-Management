<script setup lang="ts">
import type { Debt, Payment } from '@/types'
import { fmt } from '@/utils/format'
import { computed } from 'vue'

const props = defineProps<{
  debt: Debt
  payments: Payment[]
}>()
const emit = defineEmits<{
  (e: 'edit', id: string): void
  (e: 'delete', id: string): void
  (e: 'pay', id: string): void
  (e: 'detail', id: string): void
}>()

const isRecurringBill = computed(() => props.debt.frequency === 'recurring_bill')

const paid = computed(() => Number(props.debt.total_amount) - Number(props.debt.remaining))
const pct = computed(() =>
  Number(props.debt.total_amount) > 0
    ? Math.round((paid.value / Number(props.debt.total_amount)) * 100)
    : 0
)

const freqLabel = computed(() => {
  if (isRecurringBill.value) return 'บิลรายเดือน'
  return props.debt.frequency === 'daily' ? 'รายวัน' : 'รายเดือน'
})

const badgeClass = computed(() => {
  if (isRecurringBill.value) return 'badge-bill'
  return props.debt.frequency === 'daily' ? 'badge-daily' : 'badge-monthly'
})

const thisMonthPayment = computed(() => {
  if (!isRecurringBill.value) return null

  const today = new Date()
  const dueDay = parseInt(String(props.debt.due_day)) || 1
  const cm = today.getMonth()
  const cy = today.getFullYear()

  let cycleStart: Date
  let cycleEnd: Date
  if (today.getDate() > dueDay) {
    cycleStart = new Date(cy, cm, dueDay)
    cycleEnd = new Date(cy, cm + 1, dueDay - 1)
  } else {
    cycleStart = new Date(cy, cm - 1, dueDay)
    cycleEnd = new Date(cy, cm, dueDay - 1)
  }
  cycleStart.setHours(0, 0, 0, 0)
  cycleEnd.setHours(23, 59, 59, 999)

  return props.payments.find(p => {
    if (p.debt_id !== props.debt.id) return false
    const payDate = new Date(p.date)
    return payDate >= cycleStart && payDate <= cycleEnd
  }) || null
})

const isPaidThisMonth = computed(() => !!thisMonthPayment.value)
</script>

<template>
  <div class="debt-item" :style="{ '--item-color': debt.color || '#6366f1' } as any">
    <div class="debt-item-header">
      <div class="debt-item-title">
        <div
          class="debt-item-icon"
          :style="{ background: (debt.color || '#6366f1') + '18', color: debt.color || '#6366f1' }"
        >
          <i :class="debt.icon || 'fas fa-credit-card'"></i>
        </div>
        <span class="debt-item-name">{{ debt.name }}</span>
      </div>
      <span class="debt-item-badge" :class="badgeClass">{{ freqLabel }}</span>
    </div>

    <!-- Recurring Bill layout -->
    <template v-if="isRecurringBill">
      <div class="bill-status" :class="isPaidThisMonth ? 'bill-paid' : 'bill-unpaid'">
        <div class="bill-status-icon">
          <i :class="isPaidThisMonth ? 'fas fa-circle-check' : 'fas fa-clock'"></i>
        </div>
        <div class="bill-status-info">
          <span class="bill-status-label">{{ isPaidThisMonth ? 'จ่ายแล้วเดือนนี้' : 'ยังไม่จ่ายเดือนนี้' }}</span>
          <span v-if="isPaidThisMonth && thisMonthPayment" class="bill-status-amount">
            {{ fmt(thisMonthPayment.amount) }}
            <span class="bill-status-date">
              · {{ new Date(thisMonthPayment.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) }}
            </span>
          </span>
          <span v-else class="bill-status-due">
            {{ Number(debt.min_payment) > 0 ? fmt(debt.min_payment) + '/เดือน · ' : '' }}กำหนดจ่ายทุกวันที่ {{ debt.due_day || '-' }}
          </span>
        </div>
      </div>
    </template>

    <!-- Normal debt layout -->
    <template v-else>
      <div class="debt-item-details">
        <span class="debt-detail-label">ยอดคงเหลือ</span>
        <span class="debt-detail-value">{{ fmt(debt.remaining) }}</span>
        <span class="debt-detail-label">ดอกเบี้ย</span>
        <span class="debt-detail-value">{{ debt.interest }}% /ปี</span>
        <span class="debt-detail-label">จ่ายขั้นต่ำ</span>
        <span class="debt-detail-value">{{ fmt(debt.min_payment) }}/{{ debt.frequency === 'daily' ? 'วัน' : 'เดือน' }}</span>
        <span class="debt-detail-label">กำหนดจ่าย</span>
        <span class="debt-detail-value">ทุกวันที่ {{ debt.due_day || '-' }}</span>
      </div>
      <div class="debt-item-progress">
        <div class="debt-progress-header">
          <span>ชำระแล้ว {{ fmt(paid) }}</span>
          <span>{{ pct }}%</span>
        </div>
        <div class="debt-progress-track">
          <div class="debt-progress-fill" :style="{ width: pct + '%', background: debt.color || '#6366f1' }"></div>
        </div>
      </div>
    </template>

    <div class="debt-item-actions">
      <button class="btn-danger-sm" @click="emit('delete', debt.id)" title="ลบ">
        <i class="fas fa-trash"></i>
      </button>
      <button class="btn-danger-sm" style="color:var(--accent)" @click="emit('edit', debt.id)" title="แก้ไข">
        <i class="fas fa-pen"></i>
      </button>
      <button class="btn-detail-sm" @click="emit('detail', debt.id)" title="ดูรายละเอียด">
        <i class="fas fa-expand"></i>
      </button>
      <button class="btn-primary btn-sm" @click="emit('pay', debt.id)">
        <i class="fas fa-money-bill-wave"></i>
        {{ isRecurringBill ? 'บันทึกบิล' : 'ชำระ' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.debt-item::before {
  background: v-bind('debt.color || "#6366f1"');
}

.debt-item-title {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.debt-item-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  flex-shrink: 0;
}

.bill-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  margin-bottom: 10px;
}

.bill-paid {
  background: var(--success-light);
}

.bill-unpaid {
  background: var(--warning-light);
}

.bill-status-icon {
  font-size: 1.3rem;
  flex-shrink: 0;
}

.bill-paid .bill-status-icon {
  color: var(--success);
}

.bill-unpaid .bill-status-icon {
  color: var(--warning);
}

.bill-status-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bill-status-label {
  font-size: 0.82rem;
  font-weight: 700;
}

.bill-paid .bill-status-label {
  color: var(--success);
}

.bill-unpaid .bill-status-label {
  color: var(--warning);
}

.bill-status-amount {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
}

.bill-status-date {
  font-weight: 400;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.bill-status-due {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.btn-detail-sm {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.btn-detail-sm:hover {
  background: var(--accent-light);
  color: var(--accent);
}
</style>
