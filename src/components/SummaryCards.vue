<script setup lang="ts">
import { computed } from 'vue'
import type { Debt } from '@/types'
import { fmt } from '@/utils/format'
import { calculateOverallFreedomDate } from '@/utils/calculations'

const props = defineProps<{ debts: Debt[] }>()

const actualDebts = computed(() => props.debts.filter(d => d.frequency !== 'recurring_bill'))

const totalOriginal = computed(() => actualDebts.value.reduce((s, d) => s + Number(d.total_amount), 0))
const totalRemaining = computed(() => actualDebts.value.reduce((s, d) => s + Number(d.remaining), 0))
const totalPaid = computed(() => totalOriginal.value - totalRemaining.value)
const pct = computed(() => totalOriginal.value > 0 ? Math.round((totalPaid.value / totalOriginal.value) * 100) : 0)
const freedomDate = computed(() => calculateOverallFreedomDate(actualDebts.value) || '-')
</script>

<template>
  <section v-show="actualDebts.length > 0" class="summary-section">
    <div class="summary-cards">
      <div class="summary-card card-total">
        <div class="card-icon"><i class="fas fa-coins"></i></div>
        <div class="card-info">
          <span class="card-label">หนี้รวมทั้งหมด</span>
          <span class="card-value">{{ fmt(totalOriginal) }}</span>
        </div>
      </div>
      <div class="summary-card card-paid">
        <div class="card-icon"><i class="fas fa-check-circle"></i></div>
        <div class="card-info">
          <span class="card-label">ชำระแล้ว</span>
          <span class="card-value">{{ fmt(totalPaid) }}</span>
        </div>
      </div>
      <div class="summary-card card-remaining">
        <div class="card-icon"><i class="fas fa-hourglass-half"></i></div>
        <div class="card-info">
          <span class="card-label">คงเหลือ</span>
          <span class="card-value">{{ fmt(totalRemaining) }}</span>
        </div>
      </div>
      <div class="summary-card card-freedom">
        <div class="card-icon"><i class="fas fa-flag-checkered"></i></div>
        <div class="card-info">
          <span class="card-label">วันอิสรภาพ</span>
          <span class="card-value">{{ freedomDate }}</span>
        </div>
      </div>
    </div>
    <div class="overall-progress">
      <div class="progress-header">
        <span>ความคืบหน้ารวม</span>
        <span>{{ pct }}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill overall-fill" :style="{ width: pct + '%' }"></div>
      </div>
    </div>
  </section>
</template>
