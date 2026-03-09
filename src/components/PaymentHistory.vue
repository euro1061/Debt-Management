<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Payment } from '@/types'
import { fmt } from '@/utils/format'

const props = defineProps<{ payments: Payment[] }>()
const emit = defineEmits<{
  (e: 'openPaymentModal'): void
  (e: 'editPayment', payment: Payment): void
  (e: 'deletePayment', payment: Payment): void
}>()

const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

const now = new Date()
const selectedMonth = ref(now.getMonth())
const selectedYear = ref(now.getFullYear())

const availableMonths = computed(() => {
  const set = new Map<string, { month: number; year: number; label: string }>()

  const currentKey = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}`
  set.set(currentKey, {
    month: selectedMonth.value,
    year: selectedYear.value,
    label: `${monthNames[selectedMonth.value]} ${selectedYear.value + 543}`
  })

  const nowKey = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`
  if (!set.has(nowKey)) {
    set.set(nowKey, {
      month: now.getMonth(),
      year: now.getFullYear(),
      label: `${monthNames[now.getMonth()]} ${now.getFullYear() + 543}`
    })
  }

  props.payments.forEach(p => {
    const d = new Date(p.date)
    const m = d.getMonth()
    const y = d.getFullYear()
    const key = `${y}-${String(m).padStart(2, '0')}`
    if (!set.has(key)) {
      set.set(key, { month: m, year: y, label: `${monthNames[m]} ${y + 543}` })
    }
  })

  return [...set.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, val]) => ({ key, ...val }))
})

const filteredPayments = computed(() =>
  props.payments.filter(p => {
    const d = new Date(p.date)
    return d.getMonth() === selectedMonth.value && d.getFullYear() === selectedYear.value
  })
)

const monthTotal = computed(() => filteredPayments.value.reduce((s, p) => s + Number(p.amount), 0))

function selectMonth(m: number, y: number) {
  selectedMonth.value = m
  selectedYear.value = y
}

function prevMonth() {
  if (selectedMonth.value === 0) {
    selectedMonth.value = 11
    selectedYear.value--
  } else {
    selectedMonth.value--
  }
}

function nextMonth() {
  if (selectedMonth.value === 11) {
    selectedMonth.value = 0
    selectedYear.value++
  } else {
    selectedMonth.value++
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}
</script>

<template>
  <div class="card">
    <div class="flex justify-between items-center mb-3">
      <h3><i class="fas fa-clock-rotate-left"></i> ประวัติการชำระ</h3>
    </div>

    <div class="month-filter">
      <button class="month-arrow" @click="prevMonth"><i class="fas fa-chevron-left"></i></button>
      <div class="month-selector">
        <button
          v-for="item in availableMonths"
          :key="item.key"
          class="month-chip"
          :class="{ active: item.month === selectedMonth && item.year === selectedYear }"
          @click="selectMonth(item.month, item.year)"
        >
          {{ item.label }}
        </button>
      </div>
      <button class="month-arrow" @click="nextMonth"><i class="fas fa-chevron-right"></i></button>
    </div>

    <div v-if="filteredPayments.length > 0" class="month-summary">
      <span>{{ monthNames[selectedMonth] }} {{ selectedYear + 543 }}</span>
      <span class="month-summary-total">{{ filteredPayments.length }} รายการ · {{ fmt(monthTotal) }}</span>
    </div>

    <div class="payment-history">
      <div v-for="p in filteredPayments" :key="p.id" class="payment-item-wrapper">
        <div class="payment-item">
          <div
            class="payment-icon"
            :style="{
              background: (p.color || 'var(--success)') + '20',
              color: p.color || 'var(--success)'
            }"
          >
            <i class="fas fa-receipt"></i>
          </div>
          <div class="payment-info">
            <div class="payment-name">{{ p.debt_name }}</div>
            <div class="payment-meta">
              <span>
                <i class="fas fa-calendar"></i>
                {{ formatDate(p.date) }}
              </span>
              <span v-if="p.note">{{ p.note }}</span>
            </div>
            <div class="payment-breakdown">
              <span>เงินต้น {{ fmt(p.principal) }}</span>
              <span>ดอกเบี้ย {{ fmt(p.interest) }}</span>
            </div>
          </div>
          <div class="payment-right">
            <div class="payment-amount">-{{ fmt(p.amount) }}</div>
            <div class="payment-actions">
              <button class="payment-action-btn edit" @click="emit('editPayment', p)" title="แก้ไข">
                <i class="fas fa-pen"></i>
              </button>
              <button class="payment-action-btn delete" @click="emit('deletePayment', p)" title="ลบ">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="filteredPayments.length === 0" class="empty-inline">
      <p class="opacity-60">ไม่มีรายการชำระในเดือนนี้</p>
    </div>
  </div>
</template>

<style scoped>
.month-filter {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
}

.month-arrow {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-xs);
  background: var(--bg-primary);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.month-arrow:hover {
  background: var(--accent-light);
  color: var(--accent);
}

.month-arrow:active {
  transform: scale(0.92);
}

.month-selector {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  flex: 1;
  padding: 2px 0;
}

.month-selector::-webkit-scrollbar {
  display: none;
}

.month-chip {
  padding: 6px 12px;
  border: none;
  border-radius: 20px;
  background: var(--bg-primary);
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 600;
  font-family: inherit;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.month-chip:active {
  transform: scale(0.95);
}

.month-chip.active {
  background: var(--accent);
  color: white;
}

.month-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--bg-primary);
  border-radius: var(--radius-xs);
  margin-bottom: 12px;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.month-summary-total {
  color: var(--accent);
}

.payment-item-wrapper {
  margin-bottom: 8px;
}

.payment-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  transition: all 0.2s;
}

.payment-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.payment-actions {
  display: flex;
  gap: 4px;
}

.payment-action-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: transparent;
}

.payment-action-btn.edit {
  color: var(--accent);
}

.payment-action-btn.edit:hover {
  background: var(--accent-light);
}

.payment-action-btn.delete {
  color: var(--danger);
}

.payment-action-btn.delete:hover {
  background: var(--danger-light);
}

.payment-action-btn:active {
  transform: scale(0.9);
}
</style>
