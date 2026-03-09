<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Debt } from '@/types'
import { fmt } from '@/utils/format'

const props = defineProps<{ debts: Debt[] }>()

const currentStrategy = ref<'avalanche' | 'snowball'>('avalanche')

const sorted = computed(() => {
  const active = props.debts.filter(d => Number(d.remaining) > 0 && d.frequency !== 'recurring_bill')
  if (currentStrategy.value === 'avalanche') {
    return [...active].sort((a, b) => Number(b.interest) - Number(a.interest))
  }
  return [...active].sort((a, b) => Number(a.remaining) - Number(b.remaining))
})

const noteHtml = computed(() => {
  if (currentStrategy.value === 'avalanche') {
    return '<i class="fas fa-info-circle"></i> <strong>Avalanche:</strong> จ่ายหนี้ดอกเบี้ยแพงที่สุดก่อน ประหยัดดอกเบี้ยรวมมากที่สุด แต่ต้องใจเย็นรอนานกว่า'
  }
  return '<i class="fas fa-info-circle"></i> <strong>Snowball:</strong> จ่ายหนี้ยอดน้อยที่สุดก่อน ปิดได้เร็วสร้างกำลังใจ แม้จะเสียดอกเบี้ยรวมมากกว่าเล็กน้อย'
})

function detailText(d: Debt) {
  if (currentStrategy.value === 'avalanche') {
    return `ดอกเบี้ย ${d.interest}%/ปี · คงเหลือ ${fmt(d.remaining)}`
  }
  return `คงเหลือ ${fmt(d.remaining)} · ดอกเบี้ย ${d.interest}%/ปี`
}

function rankClass(i: number) {
  if (i < 3) return `strategy-rank-${i + 1}`
  return ''
}
</script>

<template>
  <div class="card">
    <h3><i class="fas fa-chess"></i> กลยุทธ์ปิดหนี้</h3>
    <div class="strategy-tabs">
      <button
        class="strategy-tab"
        :class="{ active: currentStrategy === 'avalanche' }"
        @click="currentStrategy = 'avalanche'"
      >
        <i class="fas fa-mountain"></i> Avalanche
        <span class="strategy-desc">ดอกเบี้ยแพงก่อน</span>
      </button>
      <button
        class="strategy-tab"
        :class="{ active: currentStrategy === 'snowball' }"
        @click="currentStrategy = 'snowball'"
      >
        <i class="fas fa-snowflake"></i> Snowball
        <span class="strategy-desc">ยอดน้อยก่อน</span>
      </button>
    </div>

    <div class="strategy-list">
      <template v-if="debts.length === 0">
        <div class="empty-inline"><p class="opacity-60">เพิ่มหนี้เพื่อดูคำแนะนำ</p></div>
      </template>
      <div v-for="(d, i) in sorted" :key="d.id" class="strategy-item">
        <div
          class="strategy-rank"
          :class="rankClass(i)"
          :style="i >= 3 ? { background: 'var(--bg-primary)', color: 'var(--text-secondary)' } : {}"
        >
          {{ i + 1 }}
        </div>
        <div class="strategy-item-info">
          <div class="strategy-item-name">{{ d.name }}</div>
          <div class="strategy-item-detail">{{ detailText(d) }}</div>
        </div>
      </div>
    </div>

    <div class="strategy-note" v-html="noteHtml"></div>
  </div>
</template>
