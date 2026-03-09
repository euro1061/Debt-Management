<script setup lang="ts">
import { computed } from 'vue'
import type { Debt, Payment } from '@/types'
import { fmt } from '@/utils/format'

const props = defineProps<{ debts: Debt[]; payments: Payment[] }>()
const emit = defineEmits<{
  (e: 'pay', debtId: string): void
}>()

const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

function isPaidThisCycle(debt: Debt): boolean {
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  const dueDay = parseInt(String(debt.due_day)) || 1

  let cycleStart: Date
  let cycleEnd: Date

  if (today.getDate() > dueDay) {
    cycleStart = new Date(currentYear, currentMonth, dueDay)
    cycleEnd = new Date(currentYear, currentMonth + 1, dueDay - 1)
  } else {
    cycleStart = new Date(currentYear, currentMonth - 1, dueDay)
    cycleEnd = new Date(currentYear, currentMonth, dueDay - 1)
  }

  cycleStart.setHours(0, 0, 0, 0)
  cycleEnd.setHours(23, 59, 59, 999)

  return props.payments.some(p => {
    if (p.debt_id !== debt.id) return false
    const payDate = new Date(p.date)
    return payDate >= cycleStart && payDate <= cycleEnd
  })
}

const upcoming = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  return props.debts
    .filter(d => d.frequency !== 'daily' && !isPaidThisCycle(d))
    .map(d => {
      const dueDay = parseInt(String(d.due_day)) || 1
      const dueDate = new Date(currentYear, currentMonth, dueDay)
      dueDate.setHours(0, 0, 0, 0)

      const diffMs = dueDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

      let urgencyClass: string
      let urgencyText: string

      if (diffDays < 0) {
        urgencyClass = 'upcoming-overdue'
        urgencyText = `เลยกำหนด ${Math.abs(diffDays)} วัน`
      } else if (diffDays === 0) {
        urgencyClass = 'upcoming-urgent'
        urgencyText = 'วันนี้!'
      } else if (diffDays === 1) {
        urgencyClass = 'upcoming-urgent'
        urgencyText = 'พรุ่งนี้!'
      } else if (diffDays <= 3) {
        urgencyClass = 'upcoming-soon'
        urgencyText = `อีก ${diffDays} วัน`
      } else {
        urgencyClass = 'upcoming-normal'
        urgencyText = `อีก ${diffDays} วัน`
      }

      return {
        ...d,
        dueDate,
        diffDays,
        urgencyClass,
        urgencyText,
        isOverdue: diffDays < 0,
        dayStr: dueDate.getDate(),
        monthStr: monthNames[dueDate.getMonth()]
      }
    })
    .sort((a, b) => a.diffDays - b.diffDays)
})

const paidThisCycle = computed(() =>
  props.debts.filter(d => d.frequency !== 'daily' && isPaidThisCycle(d))
)

const dailyDebts = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return props.debts
    .filter(d => d.frequency === 'daily')
    .map(d => {
      const paidToday = props.payments.some(p => {
        if (p.debt_id !== d.id) return false
        const payDate = new Date(p.date)
        payDate.setHours(0, 0, 0, 0)
        return payDate.getTime() === today.getTime()
      })
      const todayPayment = paidToday
        ? props.payments.find(p => {
            if (p.debt_id !== d.id) return false
            const payDate = new Date(p.date)
            payDate.setHours(0, 0, 0, 0)
            return payDate.getTime() === today.getTime()
          })
        : null
      return { ...d, paidToday, todayPayment }
    })
})
</script>

<template>
  <div class="card">
    <h3><i class="fas fa-bell text-yellow-500"></i> กำหนดจ่ายที่ใกล้จะถึง</h3>

    <!-- Daily debts section -->
    <div v-if="dailyDebts.length > 0" class="daily-section">
      <div class="daily-divider">
        <span><i class="fas fa-rotate"></i> รายจ่ายรายวัน — วันนี้</span>
      </div>
      <div class="upcoming-list">
        <div
          v-for="d in dailyDebts"
          :key="d.id"
          class="upcoming-item upcoming-item-clickable"
          :class="{ 'daily-paid': d.paidToday }"
          @click="!d.paidToday && emit('pay', d.id)"
        >
          <div class="upcoming-date" :class="d.paidToday ? 'upcoming-paid' : 'upcoming-urgent'">
            <i :class="d.paidToday ? 'fas fa-circle-check' : 'fas fa-clock'" style="font-size: 1.1rem;"></i>
          </div>
          <div class="upcoming-info">
            <div class="upcoming-name" :class="{ 'paid-name': d.paidToday }">{{ d.name }}</div>
            <div class="upcoming-amount">
              <template v-if="d.paidToday && d.todayPayment">
                จ่ายแล้ว {{ fmt(d.todayPayment.amount) }}
              </template>
              <template v-else>
                ขั้นต่ำ {{ fmt(d.min_payment) }}/วัน
              </template>
            </div>
          </div>
          <span v-if="d.paidToday" class="upcoming-paid-badge">
            <i class="fas fa-check"></i> จ่ายแล้ว
          </span>
          <span v-else class="upcoming-days upcoming-urgent">ยังไม่จ่าย</span>
        </div>
      </div>
    </div>

    <div v-if="upcoming.length > 0" class="monthly-divider">
      <span><i class="fas fa-calendar-days"></i> รายเดือน</span>
    </div>

    <div class="upcoming-list">
      <div
        v-for="item in upcoming"
        :key="item.id"
        class="upcoming-item upcoming-item-clickable"
        :class="{ 'overdue-item': item.isOverdue }"
        @click="emit('pay', item.id)"
      >
        <div class="upcoming-date" :class="item.urgencyClass">
          <span class="day">{{ item.dayStr }}</span>
          <span class="month">{{ item.monthStr }}</span>
        </div>
        <div class="upcoming-info">
          <div class="upcoming-name">
            {{ item.name }}
            <span v-if="item.isOverdue" class="overdue-label">
              <i class="fas fa-triangle-exclamation"></i> ยังไม่ได้จ่าย
            </span>
          </div>
          <div class="upcoming-amount">ขั้นต่ำ {{ fmt(item.min_payment) }}</div>
        </div>
        <span class="upcoming-days" :class="item.urgencyClass">{{ item.urgencyText }}</span>
      </div>
    </div>

    <div v-if="paidThisCycle.length > 0" class="paid-section">
      <div class="paid-divider">
        <span><i class="fas fa-circle-check"></i> จ่ายแล้วรอบนี้</span>
      </div>
      <div class="upcoming-list">
        <div v-for="d in paidThisCycle" :key="d.id" class="upcoming-item paid-item">
          <div class="upcoming-date upcoming-paid">
            <span class="day">{{ d.due_day }}</span>
            <span class="month">{{ monthNames[new Date().getMonth()] }}</span>
          </div>
          <div class="upcoming-info">
            <div class="upcoming-name paid-name">{{ d.name }}</div>
            <div class="upcoming-amount">ขั้นต่ำ {{ fmt(d.min_payment) }}</div>
          </div>
          <span class="upcoming-paid-badge">
            <i class="fas fa-check"></i> จ่ายแล้ว
          </span>
        </div>
      </div>
    </div>

    <div v-if="debts.length === 0" class="empty-inline">
      <p class="opacity-60">ไม่มีรายการที่ใกล้ครบกำหนด</p>
    </div>

    <div v-else-if="upcoming.length === 0 && paidThisCycle.length > 0" class="all-paid-message">
      <i class="fas fa-party-horn"></i>
      <span>จ่ายครบทุกรายการในรอบนี้แล้ว!</span>
    </div>
  </div>
</template>

<style scoped>
.paid-section {
  margin-top: 14px;
}

.paid-divider {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--success);
}

.paid-divider::before,
.paid-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

.paid-item {
  opacity: 0.6;
}

.upcoming-paid {
  background: var(--success-light);
  color: var(--success);
}

.paid-name {
  text-decoration: line-through;
  text-decoration-color: var(--success);
}

.upcoming-paid-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 99px;
  white-space: nowrap;
  background: var(--success-light);
  color: var(--success);
}

.all-paid-message {
  text-align: center;
  padding: 16px 12px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--success);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* Daily section */
.daily-section {
  margin-bottom: 16px;
}

.daily-divider {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--accent);
}

.daily-divider::before,
.daily-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

.daily-paid {
  opacity: 0.6;
  cursor: default !important;
}

.monthly-divider {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #3b82f6;
}

.monthly-divider::before,
.monthly-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

.upcoming-item-clickable {
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.upcoming-item-clickable:active {
  transform: scale(0.98);
}

/* Overdue styles */
.overdue-item {
  background: rgba(239, 68, 68, 0.04);
  border-radius: var(--radius-sm);
  padding: 8px;
}

.upcoming-overdue {
  background: #fef2f2;
  color: #dc2626;
}

.upcoming-days.upcoming-overdue {
  background: #fef2f2;
  color: #dc2626;
  font-weight: 700;
}

.overdue-label {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: 4px;
  font-size: 0.65rem;
  font-weight: 600;
  color: #dc2626;
  vertical-align: middle;
}
</style>
