<script setup lang="ts">
import { computed } from 'vue'
import type { Debt } from '@/types'
import { fmt } from '@/utils/format'
import { calculateMonthsToPayoff } from '@/utils/calculations'

const props = defineProps<{ debts: Debt[] }>()

const items = computed(() =>
  props.debts.filter(d => d.frequency !== 'recurring_bill').map(d => {
    const months = calculateMonthsToPayoff(d, 0)
    const pct = Number(d.total_amount) > 0
      ? Math.round(((Number(d.total_amount) - Number(d.remaining)) / Number(d.total_amount)) * 100)
      : 0
    const color = d.color || '#6366f1'

    let timeText: string | number
    let dateText: string
    if (months === Infinity) {
      timeText = '∞'
      dateText = 'ยอดจ่ายน้อยกว่าดอกเบี้ย'
    } else if (d.frequency === 'daily') {
      const days = Math.ceil(months * 30)
      timeText = days
      dateText = `อีก ${days} วัน จะหมดหนี้`
    } else {
      timeText = Math.ceil(months)
      dateText = `อีก ${Math.ceil(months)} เดือน จะหมดหนี้`
    }

    const targetDate = new Date()
    targetDate.setMonth(targetDate.getMonth() + Math.ceil(months))
    const targetStr = months !== Infinity
      ? targetDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
      : '-'

    const circumference = 2 * Math.PI * 26
    const dashOffset = circumference - (pct / 100) * circumference

    return {
      ...d,
      timeText,
      dateText,
      targetStr,
      pct,
      color,
      circumference,
      dashOffset,
      unitLabel: d.frequency === 'daily' ? 'วัน' : 'เดือน'
    }
  })
)
</script>

<template>
  <div class="countdown-list">
    <template v-if="debts.length === 0">
      <div class="empty-inline"><p class="opacity-60">เพิ่มรายการหนี้เพื่อดูข้อมูล</p></div>
    </template>
    <div v-for="item in items" :key="item.id" class="countdown-card">
      <div class="countdown-ring">
        <svg width="64" height="64" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="26" fill="none" stroke="var(--bg-primary)" stroke-width="5" />
          <circle
            cx="32" cy="32" r="26" fill="none"
            :stroke="item.color"
            stroke-width="5"
            :stroke-dasharray="item.circumference"
            :stroke-dashoffset="item.dashOffset"
            stroke-linecap="round"
          />
        </svg>
        <div class="countdown-ring-text">
          <span>{{ item.timeText }}</span>
          <small>{{ item.unitLabel }}</small>
        </div>
      </div>
      <div class="countdown-info">
        <div class="countdown-name">{{ item.name }}</div>
        <div class="countdown-detail">
          คงเหลือ {{ fmt(item.remaining) }} · จ่าย {{ fmt(item.min_payment) }}/{{ item.frequency === 'daily' ? 'วัน' : 'เดือน' }}
        </div>
        <div class="countdown-date">
          <i class="fas fa-flag-checkered"></i> {{ item.dateText }} ({{ item.targetStr }})
        </div>
      </div>
    </div>
  </div>
</template>
