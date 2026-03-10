<script setup lang="ts">
import { computed } from 'vue'
import type { Debt, Payment } from '@/types'
import { fmt, fmtNum } from '@/utils/format'
import { calculateMonthsToPayoff } from '@/utils/calculations'

const props = defineProps<{
  visible: boolean
  debt: Debt | null
  payments: Payment[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const isRecurringBill = computed(() => props.debt?.frequency === 'recurring_bill')

const paid = computed(() => {
  if (!props.debt) return 0
  return Number(props.debt.total_amount) - Number(props.debt.remaining)
})

const pct = computed(() => {
  if (!props.debt || Number(props.debt.total_amount) <= 0) return 0
  return Math.round((paid.value / Number(props.debt.total_amount)) * 100)
})

const color = computed(() => props.debt?.color || '#6366f1')

const circumference = 2 * Math.PI * 54
const dashOffset = computed(() => circumference - (pct.value / 100) * circumference)

const payoffInfo = computed(() => {
  if (!props.debt || isRecurringBill.value) return null
  const months = calculateMonthsToPayoff(props.debt, 0)

  if (months === Infinity) {
    return { text: 'ไม่สามารถคำนวณได้', date: '-', months: Infinity }
  }

  const ceil = Math.ceil(months)
  const target = new Date()
  target.setMonth(target.getMonth() + ceil)
  const dateStr = target.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })

  if (props.debt.frequency === 'daily') {
    const days = Math.ceil(months * 30)
    return { text: `อีก ${days} วัน`, date: dateStr, months }
  }
  return { text: `อีก ${ceil} เดือน`, date: dateStr, months }
})

const debtPayments = computed(() => {
  if (!props.debt) return []
  return props.payments
    .filter(p => p.debt_id === props.debt!.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

const totalPaidFromPayments = computed(() =>
  debtPayments.value.reduce((s, p) => s + Number(p.amount), 0)
)

const totalPrincipalPaid = computed(() =>
  debtPayments.value.reduce((s, p) => s + Number(p.principal), 0)
)

const totalInterestPaid = computed(() =>
  debtPayments.value.reduce((s, p) => s + Number(p.interest), 0)
)

const thisMonthPayment = computed(() => {
  if (!props.debt) return null
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

  return debtPayments.value.find(p => {
    const payDate = new Date(p.date)
    return payDate >= cycleStart && payDate <= cycleEnd
  }) || null
})

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}

const todayStr = computed(() =>
  new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
)
</script>

<template>
  <Teleport to="body">
    <Transition name="detail-fade">
      <div v-if="visible && debt" class="detail-overlay" @click.self="emit('close')">
        <Transition name="detail-slide" appear>
          <div v-if="visible && debt" class="detail-modal">
            <!-- Header -->
            <div class="detail-header" :style="{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }">
              <button class="detail-close" @click="emit('close')">
                <i class="fas fa-xmark"></i>
              </button>
              <div class="detail-header-content">
                <div class="detail-icon-large">
                  <i :class="debt.icon || 'fas fa-credit-card'"></i>
                </div>
                <h2 class="detail-title">{{ debt.name }}</h2>
                <span class="detail-badge">
                  {{ isRecurringBill ? 'บิลรายเดือน' : debt.frequency === 'daily' ? 'รายวัน' : 'รายเดือน' }}
                </span>
              </div>
            </div>

            <div class="detail-body">
              <!-- Progress Ring (normal debt only) -->
              <template v-if="!isRecurringBill">
                <div class="detail-progress-section">
                  <div class="detail-ring">
                    <svg width="128" height="128" viewBox="0 0 128 128">
                      <circle cx="64" cy="64" r="54" fill="none" stroke="var(--bg-primary)" stroke-width="8" />
                      <circle
                        cx="64" cy="64" r="54" fill="none"
                        :stroke="color"
                        stroke-width="8"
                        :stroke-dasharray="circumference"
                        :stroke-dashoffset="dashOffset"
                        stroke-linecap="round"
                        class="detail-ring-progress"
                      />
                    </svg>
                    <div class="detail-ring-text">
                      <span class="detail-ring-pct">{{ pct }}%</span>
                      <span class="detail-ring-label">ชำระแล้ว</span>
                    </div>
                  </div>

                  <div class="detail-amounts">
                    <div class="detail-amount-row">
                      <span class="detail-amount-label">ยอดรวมทั้งหมด</span>
                      <span class="detail-amount-value">{{ fmt(debt.total_amount) }}</span>
                    </div>
                    <div class="detail-amount-row highlight-success">
                      <span class="detail-amount-label"><i class="fas fa-check-circle"></i> ชำระแล้ว</span>
                      <span class="detail-amount-value">{{ fmt(paid) }}</span>
                    </div>
                    <div class="detail-amount-row highlight-warning">
                      <span class="detail-amount-label"><i class="fas fa-hourglass-half"></i> คงเหลือ</span>
                      <span class="detail-amount-value">{{ fmt(debt.remaining) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Progress Bar -->
                <div class="detail-bar-section">
                  <div class="detail-bar-track">
                    <div class="detail-bar-fill" :style="{ width: pct + '%', background: color }"></div>
                  </div>
                  <div class="detail-bar-labels">
                    <span>{{ fmt(0) }}</span>
                    <span>{{ fmt(debt.total_amount) }}</span>
                  </div>
                </div>
              </template>

              <!-- Bill Status (recurring bill) -->
              <template v-if="isRecurringBill">
                <div class="detail-bill-section">
                  <div class="detail-bill-status" :class="thisMonthPayment ? 'bill-ok' : 'bill-pending'">
                    <i :class="thisMonthPayment ? 'fas fa-circle-check' : 'fas fa-clock'"></i>
                    <div>
                      <div class="detail-bill-status-label">
                        {{ thisMonthPayment ? 'จ่ายแล้วเดือนนี้' : 'ยังไม่จ่ายเดือนนี้' }}
                      </div>
                      <div v-if="thisMonthPayment" class="detail-bill-status-amount">
                        {{ fmt(thisMonthPayment.amount) }}
                        · {{ formatDate(thisMonthPayment.date) }}
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Info Grid -->
              <div class="detail-info-grid">
                <div class="detail-info-card">
                  <i class="fas fa-percent" :style="{ color }"></i>
                  <span class="detail-info-value">{{ debt.interest }}%</span>
                  <span class="detail-info-label">ดอกเบี้ย/ปี</span>
                </div>
                <div class="detail-info-card">
                  <i class="fas fa-wallet" :style="{ color }"></i>
                  <span class="detail-info-value">{{ fmtNum(debt.min_payment) }}</span>
                  <span class="detail-info-label">จ่ายขั้นต่ำ/{{ debt.frequency === 'daily' ? 'วัน' : 'เดือน' }}</span>
                </div>
                <div class="detail-info-card">
                  <i class="fas fa-calendar-day" :style="{ color }"></i>
                  <span class="detail-info-value">{{ debt.due_day || '-' }}</span>
                  <span class="detail-info-label">วันกำหนดจ่าย</span>
                </div>
                <div v-if="!isRecurringBill" class="detail-info-card">
                  <i class="fas fa-receipt" :style="{ color }"></i>
                  <span class="detail-info-value">{{ debtPayments.length }}</span>
                  <span class="detail-info-label">จำนวนรายการจ่าย</span>
                </div>
              </div>

              <!-- Payoff Estimate (normal debt only) -->
              <div v-if="payoffInfo && !isRecurringBill" class="detail-payoff">
                <div class="detail-payoff-icon" :style="{ background: color + '18', color }">
                  <i class="fas fa-flag-checkered"></i>
                </div>
                <div class="detail-payoff-info">
                  <span class="detail-payoff-title">คาดว่าปลดหนี้</span>
                  <span class="detail-payoff-text">{{ payoffInfo.text }}</span>
                  <span class="detail-payoff-date">{{ payoffInfo.date }}</span>
                </div>
              </div>

              <!-- Payment Breakdown (normal debt only) -->
              <div v-if="!isRecurringBill && debtPayments.length > 0" class="detail-breakdown">
                <h4><i class="fas fa-chart-pie"></i> สรุปยอดชำระ</h4>
                <div class="detail-breakdown-grid">
                  <div class="detail-breakdown-item">
                    <span class="breakdown-dot" style="background: var(--success)"></span>
                    <span class="breakdown-label">เงินต้นรวม</span>
                    <span class="breakdown-value">{{ fmt(totalPrincipalPaid) }}</span>
                  </div>
                  <div class="detail-breakdown-item">
                    <span class="breakdown-dot" style="background: var(--danger)"></span>
                    <span class="breakdown-label">ดอกเบี้ยรวม</span>
                    <span class="breakdown-value">{{ fmt(totalInterestPaid) }}</span>
                  </div>
                  <div class="detail-breakdown-item total">
                    <span class="breakdown-dot" :style="{ background: color }"></span>
                    <span class="breakdown-label">ยอดชำระรวม</span>
                    <span class="breakdown-value">{{ fmt(totalPaidFromPayments) }}</span>
                  </div>
                </div>
              </div>

              <!-- Recent Payments -->
              <div v-if="debtPayments.length > 0" class="detail-history">
                <h4>
                  <i class="fas fa-clock-rotate-left"></i>
                  ประวัติการชำระ
                  <span class="detail-history-count">{{ debtPayments.length }}</span>
                </h4>
                <div class="detail-history-list">
                  <div v-for="p in debtPayments.slice(0, 10)" :key="p.id" class="detail-history-item">
                    <div class="detail-history-date-col">
                      <span class="detail-history-day">{{ new Date(p.date).getDate() }}</span>
                      <span class="detail-history-month">
                        {{ new Date(p.date).toLocaleDateString('th-TH', { month: 'short' }) }}
                      </span>
                    </div>
                    <div class="detail-history-info">
                      <span class="detail-history-amount">-{{ fmt(p.amount) }}</span>
                      <span v-if="!isRecurringBill" class="detail-history-split">
                        เงินต้น {{ fmt(p.principal) }} · ดอกเบี้ย {{ fmt(p.interest) }}
                      </span>
                      <span v-if="p.note" class="detail-history-note">{{ p.note }}</span>
                    </div>
                  </div>
                  <div v-if="debtPayments.length > 10" class="detail-history-more">
                    และอีก {{ debtPayments.length - 10 }} รายการ
                  </div>
                </div>
              </div>

              <!-- Footer watermark -->
              <div class="detail-footer">
                <span>Debt Free Dashboard</span>
                <span>{{ todayStr }}</span>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.detail-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  z-index: 120;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
}

.detail-modal {
  background: var(--bg-card);
  width: 100%;
  max-width: 600px;
  max-height: 95vh;
  overflow-y: auto;
  border-radius: 20px 20px 0 0;
  position: relative;
}

@media (min-width: 640px) {
  .detail-overlay {
    align-items: center;
    padding: 20px;
  }
  .detail-modal {
    border-radius: 20px;
    max-height: 90vh;
  }
}

/* Header */
.detail-header {
  padding: 28px 20px 24px;
  color: white;
  position: relative;
  overflow: hidden;
}

.detail-header::after {
  content: '';
  position: absolute;
  bottom: -30px;
  left: -10%;
  right: -10%;
  height: 60px;
  background: var(--bg-card);
  border-radius: 50% 50% 0 0;
}

.detail-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  transition: all 0.2s;
}

.detail-close:active {
  transform: scale(0.9);
  background: rgba(255, 255, 255, 0.3);
}

.detail-header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.detail-icon-large {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.detail-title {
  font-size: 1.3rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.detail-badge {
  font-size: 0.7rem;
  padding: 4px 12px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.2);
  font-weight: 600;
}

/* Body */
.detail-body {
  padding: 0 20px 24px;
  position: relative;
}

/* Progress Section */
.detail-progress-section {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px 0 20px;
}

.detail-ring {
  position: relative;
  width: 128px;
  height: 128px;
  flex-shrink: 0;
}

.detail-ring svg {
  transform: rotate(-90deg);
}

.detail-ring-progress {
  transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.detail-ring-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.detail-ring-pct {
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1;
}

.detail-ring-label {
  font-size: 0.68rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.detail-amounts {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-amount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-radius: var(--radius-xs);
  background: var(--bg-primary);
  font-size: 0.8rem;
}

.detail-amount-row.highlight-success {
  background: var(--success-light);
}

.detail-amount-row.highlight-warning {
  background: var(--warning-light);
}

.detail-amount-label {
  color: var(--text-secondary);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.highlight-success .detail-amount-label i { color: var(--success); }
.highlight-warning .detail-amount-label i { color: var(--warning); }

.detail-amount-value {
  font-weight: 700;
  color: var(--text-primary);
}

/* Progress Bar */
.detail-bar-section {
  margin-bottom: 20px;
}

.detail-bar-track {
  height: 12px;
  background: var(--bg-primary);
  border-radius: 99px;
  overflow: hidden;
}

.detail-bar-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.detail-bar-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.68rem;
  color: var(--text-muted);
  margin-top: 4px;
}

/* Bill Section */
.detail-bill-section {
  padding: 12px 0 20px;
}

.detail-bill-status {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: var(--radius-sm);
  font-size: 1.4rem;
}

.detail-bill-status.bill-ok {
  background: var(--success-light);
  color: var(--success);
}

.detail-bill-status.bill-pending {
  background: var(--warning-light);
  color: var(--warning);
}

.detail-bill-status-label {
  font-size: 0.9rem;
  font-weight: 700;
}

.detail-bill-status-amount {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-top: 2px;
}

/* Info Grid */
.detail-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 20px;
}

.detail-info-card {
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
}

.detail-info-card i {
  font-size: 1.1rem;
  margin-bottom: 2px;
}

.detail-info-value {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-primary);
}

.detail-info-label {
  font-size: 0.68rem;
  color: var(--text-muted);
  font-weight: 500;
}

/* Payoff */
.detail-payoff {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  margin-bottom: 20px;
  border: 1px dashed var(--border);
}

.detail-payoff-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.detail-payoff-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.detail-payoff-title {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: 500;
}

.detail-payoff-text {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary);
}

.detail-payoff-date {
  font-size: 0.78rem;
  color: var(--text-secondary);
  font-weight: 500;
}

/* Breakdown */
.detail-breakdown {
  margin-bottom: 20px;
}

.detail-breakdown h4 {
  font-size: 0.88rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.detail-breakdown h4 i {
  color: var(--accent);
  font-size: 0.85rem;
}

.detail-breakdown-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-breakdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--bg-primary);
  border-radius: var(--radius-xs);
  font-size: 0.82rem;
}

.detail-breakdown-item.total {
  background: var(--accent-light);
  font-weight: 700;
}

.breakdown-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}

.breakdown-label {
  flex: 1;
  color: var(--text-secondary);
}

.detail-breakdown-item.total .breakdown-label {
  color: var(--text-primary);
}

.breakdown-value {
  font-weight: 700;
  color: var(--text-primary);
}

/* History */
.detail-history {
  margin-bottom: 20px;
}

.detail-history h4 {
  font-size: 0.88rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.detail-history h4 i {
  color: var(--accent);
  font-size: 0.85rem;
}

.detail-history-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  border-radius: 11px;
  background: var(--accent-light);
  color: var(--accent);
  font-size: 0.7rem;
  font-weight: 700;
}

.detail-history-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--bg-primary);
  border-radius: var(--radius-xs);
}

.detail-history-date-col {
  width: 42px;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.detail-history-day {
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1;
  color: var(--text-primary);
}

.detail-history-month {
  font-size: 0.62rem;
  color: var(--text-muted);
  font-weight: 500;
}

.detail-history-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.detail-history-amount {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--success);
}

.detail-history-split {
  font-size: 0.68rem;
  color: var(--text-muted);
}

.detail-history-note {
  font-size: 0.68rem;
  color: var(--text-secondary);
  font-style: italic;
}

.detail-history-more {
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-muted);
  padding: 8px;
}

/* Footer */
.detail-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0 4px;
  border-top: 1px solid var(--border);
  font-size: 0.68rem;
  color: var(--text-muted);
  font-weight: 500;
}

/* Transitions */
.detail-fade-enter-active { transition: opacity 0.25s ease; }
.detail-fade-leave-active { transition: opacity 0.2s ease; }
.detail-fade-enter-from,
.detail-fade-leave-to { opacity: 0; }

.detail-slide-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.detail-slide-leave-active {
  transition: all 0.2s ease;
}
.detail-slide-enter-from {
  opacity: 0;
  transform: translateY(60px) scale(0.96);
}
.detail-slide-leave-to {
  opacity: 0;
  transform: translateY(40px);
}
</style>
