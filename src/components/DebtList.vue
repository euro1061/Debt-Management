<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Debt, Payment } from '@/types'
import DebtItem from './DebtItem.vue'

const props = defineProps<{ debts: Debt[]; payments: Payment[] }>()
const emit = defineEmits<{
  (e: 'add'): void
  (e: 'edit', id: string): void
  (e: 'delete', id: string): void
  (e: 'pay', id: string): void
}>()

const activeTab = ref<'debt' | 'bill'>('debt')

const debtItems = computed(() => props.debts.filter(d => d.frequency !== 'recurring_bill'))
const billItems = computed(() => props.debts.filter(d => d.frequency === 'recurring_bill'))

const currentList = computed(() => activeTab.value === 'debt' ? debtItems.value : billItems.value)
</script>

<template>
  <section>
    <div class="section-header">
      <h2><i class="fas fa-list-check"></i> ทะเบียนหนี้</h2>
      <button class="btn-primary btn-sm" @click="emit('add')">
        <i class="fas fa-plus"></i> เพิ่มรายการ
      </button>
    </div>

    <div class="debt-tabs">
      <button
        class="debt-tab"
        :class="{ active: activeTab === 'debt' }"
        @click="activeTab = 'debt'"
      >
        <i class="fas fa-file-invoice-dollar"></i>
        หนี้สิน
        <span v-if="debtItems.length" class="debt-tab-count">{{ debtItems.length }}</span>
      </button>
      <button
        class="debt-tab"
        :class="{ active: activeTab === 'bill' }"
        @click="activeTab = 'bill'"
      >
        <i class="fas fa-receipt"></i>
        บิลรายเดือน
        <span v-if="billItems.length" class="debt-tab-count">{{ billItems.length }}</span>
      </button>
    </div>

    <div class="debt-list">
      <DebtItem
        v-for="debt in currentList"
        :key="debt.id"
        :debt="debt"
        :payments="payments"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
        @pay="emit('pay', $event)"
      />
    </div>

    <div v-if="currentList.length === 0" class="empty-state">
      <template v-if="activeTab === 'debt'">
        <i class="fas fa-piggy-bank"></i>
        <p>ยังไม่มีข้อมูลหนี้</p>
        <p class="text-sm opacity-60">กดปุ่ม "เพิ่มรายการ" เพื่อเริ่มต้น</p>
      </template>
      <template v-else>
        <i class="fas fa-receipt"></i>
        <p>ยังไม่มีบิลรายเดือน</p>
        <p class="text-sm opacity-60">เพิ่มค่าน้ำ ค่าไฟ หรือบิลอื่นๆ ที่จ่ายทุกเดือน</p>
      </template>
    </div>
  </section>
</template>

<style scoped>
.debt-tabs {
  display: flex;
  gap: 6px;
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  padding: 4px;
  margin-bottom: 16px;
}

.debt-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  border: none;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.25s;
}

.debt-tab:active {
  transform: scale(0.97);
}

.debt-tab.active {
  background: var(--bg-card);
  color: var(--text-primary);
  box-shadow: var(--shadow);
}

.debt-tab i {
  font-size: 0.85rem;
}

.debt-tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: var(--accent-light);
  color: var(--accent);
  font-size: 0.68rem;
  font-weight: 700;
}

.debt-tab.active .debt-tab-count {
  background: var(--accent);
  color: white;
}
</style>
