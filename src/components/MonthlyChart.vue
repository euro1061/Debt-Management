<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Payment } from '@/types'
import { fmt } from '@/utils/format'

const props = defineProps<{ payments: Payment[] }>()

const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

type RangeOption = 6 | 12 | 0
const selectedRange = ref<RangeOption>(6)
const rangeOptions: { value: RangeOption; label: string }[] = [
  { value: 6, label: '6 เดือน' },
  { value: 12, label: '12 เดือน' },
  { value: 0, label: 'ทั้งหมด' }
]

const allGrouped = computed(() => {
  const grouped: Record<string, { principal: number; interest: number; total: number; label: string; sortKey: string }> = {}

  props.payments.forEach(p => {
    const d = new Date(p.date)
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
    if (!grouped[key]) {
      grouped[key] = {
        principal: 0,
        interest: 0,
        total: 0,
        label: `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`,
        sortKey: key
      }
    }
    grouped[key].principal += Number(p.principal)
    grouped[key].interest += Number(p.interest)
    grouped[key].total += Number(p.amount)
  })

  return Object.values(grouped).sort((a, b) => a.sortKey.localeCompare(b.sortKey))
})

const chartData = computed(() => {
  if (selectedRange.value === 0) return allGrouped.value
  return allGrouped.value.slice(-selectedRange.value)
})

const maxTotal = computed(() => {
  const m = Math.max(...chartData.value.map(d => d.total), 1)
  return m * 1.1
})

const rangePayments = computed(() => {
  if (selectedRange.value === 0) return props.payments
  const now = new Date()
  const cutoff = new Date(now.getFullYear(), now.getMonth() - selectedRange.value, 1)
  return props.payments.filter(p => new Date(p.date) >= cutoff)
})

const totalInRange = computed(() => rangePayments.value.reduce((s, p) => s + Number(p.amount), 0))
const totalPrincipalInRange = computed(() => rangePayments.value.reduce((s, p) => s + Number(p.principal), 0))
const totalInterestInRange = computed(() => rangePayments.value.reduce((s, p) => s + Number(p.interest), 0))
</script>

<template>
  <div class="chart-card">
    <div class="chart-header">
      <div class="chart-title">
        <i class="fas fa-chart-bar"></i> สรุปยอดชำระรายเดือน
      </div>
      <div class="range-filter">
        <button
          v-for="opt in rangeOptions"
          :key="opt.value"
          class="range-chip"
          :class="{ active: selectedRange === opt.value }"
          @click="selectedRange = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <div v-if="chartData.length === 0" class="chart-empty">
      <i class="fas fa-chart-column"></i>
      <p>ยังไม่มีข้อมูลการชำระ</p>
    </div>

    <template v-else>
      <div class="chart-summary-row">
        <div class="chart-summary-item">
          <span class="chart-summary-label">ชำระรวม{{ selectedRange === 0 ? 'ทั้งหมด' : ' ' + selectedRange + ' เดือน' }}</span>
          <span class="chart-summary-value">{{ fmt(totalInRange) }}</span>
        </div>
        <div class="chart-summary-item">
          <div class="chart-legend-dot principal-dot"></div>
          <span class="chart-summary-label">เงินต้น</span>
          <span class="chart-summary-value sm">{{ fmt(totalPrincipalInRange) }}</span>
        </div>
        <div class="chart-summary-item">
          <div class="chart-legend-dot interest-dot"></div>
          <span class="chart-summary-label">ดอกเบี้ย</span>
          <span class="chart-summary-value sm">{{ fmt(totalInterestInRange) }}</span>
        </div>
      </div>

      <div class="chart-area">
        <div class="chart-bars">
          <div v-for="item in chartData" :key="item.sortKey" class="chart-bar-group">
            <div class="chart-bar-tooltip">{{ fmt(item.total) }}</div>
            <div class="chart-bar-stack" :style="{ height: (item.total / maxTotal) * 100 + '%' }">
              <div
                class="chart-bar-segment interest-bar"
                :style="{ height: item.total > 0 ? (item.interest / item.total) * 100 + '%' : '0%' }"
              ></div>
              <div
                class="chart-bar-segment principal-bar"
                :style="{ height: item.total > 0 ? (item.principal / item.total) * 100 + '%' : '0%' }"
              ></div>
            </div>
            <span class="chart-bar-label">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.chart-card {
  background: var(--bg-card);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow);
  margin-bottom: 16px;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 10px;
  flex-wrap: wrap;
}

.chart-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
}

.chart-title i {
  color: var(--accent);
  margin-right: 6px;
}

.range-filter {
  display: flex;
  gap: 4px;
  background: var(--bg-primary);
  border-radius: 20px;
  padding: 3px;
}

.range-chip {
  padding: 4px 10px;
  border: none;
  border-radius: 16px;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.65rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.range-chip:active {
  transform: scale(0.95);
}

.range-chip.active {
  background: var(--accent);
  color: white;
  box-shadow: 0 1px 4px rgba(99, 102, 241, 0.3);
}

.chart-empty {
  text-align: center;
  padding: 30px 0;
  color: var(--text-muted);
}

.chart-empty i {
  font-size: 2rem;
  margin-bottom: 10px;
  display: block;
}

.chart-empty p {
  font-size: 0.82rem;
}

.chart-summary-row {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.chart-summary-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.chart-summary-item:first-child {
  flex-basis: 100%;
}

.chart-summary-label {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: 500;
}

.chart-summary-value {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
}

.chart-summary-value.sm {
  font-size: 0.8rem;
}

.chart-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}

.principal-dot {
  background: var(--accent);
}

.interest-dot {
  background: #f59e0b;
}

.chart-area {
  height: 180px;
  display: flex;
  align-items: flex-end;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  width: 100%;
  height: 100%;
}

.chart-bar-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
  position: relative;
  min-width: 0;
}

.chart-bar-tooltip {
  font-size: 0.6rem;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 4px;
  white-space: nowrap;
}

.chart-bar-stack {
  width: 100%;
  max-width: 44px;
  border-radius: 6px 6px 2px 2px;
  overflow: hidden;
  display: flex;
  flex-direction: column-reverse;
  min-height: 4px;
  transition: height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.chart-bar-segment {
  width: 100%;
  transition: height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.principal-bar {
  background: var(--accent);
}

.interest-bar {
  background: #f59e0b;
}

.chart-bar-label {
  font-size: 0.62rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-top: 6px;
  white-space: nowrap;
}
</style>
