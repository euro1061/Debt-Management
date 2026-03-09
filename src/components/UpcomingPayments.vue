<script setup lang="ts">
import { computed } from 'vue'
import type { Debt, Payment } from '@/types'
import { fmt } from '@/utils/format'

const props = defineProps<{ debts: Debt[]; payments: Payment[] }>()

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
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  return props.debts
    .filter(d => !isPaidThisCycle(d))
    .map(d => {
      const dueDay = parseInt(String(d.due_day)) || 1
      let dueDate = new Date(currentYear, currentMonth, dueDay)
      if (dueDate < today) {
        dueDate = new Date(currentYear, currentMonth + 1, dueDay)
      }
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      let urgencyClass: string
      let urgencyText: string
      if (diffDays <= 1) {
        urgencyClass = 'upcoming-urgent'
        urgencyText = diffDays === 0 ? 'วันนี้!' : 'พรุ่งนี้!'
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
        dayStr: dueDate.getDate(),
        monthStr: monthNames[dueDate.getMonth()]
      }
    })
    .sort((a, b) => a.diffDays - b.diffDays)
})

const paidThisCycle = computed(() =>
  props.debts.filter(d => isPaidThisCycle(d))
)
</script>

<template>
  <div class="card">
    <h3><i class="fas fa-bell text-yellow-500"></i> กำหนดจ่ายที่ใกล้จะถึง</h3>

    <div class="upcoming-list">
      <div v-for="item in upcoming" :key="item.id" class="upcoming-item">
        <div class="upcoming-date" :class="item.urgencyClass">
          <span class="day">{{ item.dayStr }}</span>
          <span class="month">{{ item.monthStr }}</span>
        </div>
        <div class="upcoming-info">
          <div class="upcoming-name">{{ item.name }}</div>
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
</style>
