<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import type { Debt, Payment } from '@/types'
import DebtItem from './DebtItem.vue'

const props = defineProps<{ debts: Debt[]; payments: Payment[] }>()
const emit = defineEmits<{
  (e: 'add'): void
  (e: 'edit', id: string): void
  (e: 'delete', id: string): void
  (e: 'pay', id: string): void
  (e: 'detail', id: string): void
  (e: 'reorder', ids: string[]): void
}>()

const activeTab = ref<'debt' | 'bill'>('debt')
const reorderMode = ref(false)

const debtItems = computed(() => props.debts.filter(d => d.frequency !== 'recurring_bill'))
const billItems = computed(() => props.debts.filter(d => d.frequency === 'recurring_bill'))

const localDebtOrder = ref<Debt[]>([])
const localBillOrder = ref<Debt[]>([])

watch(debtItems, list => { localDebtOrder.value = [...list] }, { immediate: true })
watch(billItems, list => { localBillOrder.value = [...list] }, { immediate: true })

const currentList = computed(() =>
  activeTab.value === 'debt' ? localDebtOrder.value : localBillOrder.value
)

function getActiveListRef() {
  return activeTab.value === 'debt' ? localDebtOrder : localBillOrder
}

function toggleReorderMode() {
  reorderMode.value = !reorderMode.value
}

// --- Drag state ---
const listEl = ref<HTMLElement | null>(null)
const draggingIdx = ref<number | null>(null)
let dragFromHandle = false

function moveItem(from: number, to: number) {
  if (from === to) return
  const listRef = getActiveListRef()
  const list = [...listRef.value]
  const [item] = list.splice(from, 1)
  list.splice(to, 0, item)
  listRef.value = list
  draggingIdx.value = to
}

function commitOrder() {
  const listRef = getActiveListRef()
  emit('reorder', listRef.value.map(d => d.id))
  draggingIdx.value = null
}

// --- Desktop HTML5 Drag ---
function onHandleMouseDown() {
  dragFromHandle = true
}

function onDragStart(e: DragEvent, idx: number) {
  if (!reorderMode.value || !dragFromHandle) {
    e.preventDefault()
    dragFromHandle = false
    return
  }
  dragFromHandle = false
  draggingIdx.value = idx
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '')
  }
}

function onDragEnter(idx: number) {
  if (draggingIdx.value !== null && draggingIdx.value !== idx) {
    moveItem(draggingIdx.value, idx)
  }
}

function onDragEnd() {
  if (draggingIdx.value !== null) commitOrder()
}

// --- Mobile Touch Drag ---
function onTouchStart(e: TouchEvent, idx: number) {
  if (!reorderMode.value) return
  draggingIdx.value = idx
  document.addEventListener('touchmove', onTouchMove, { passive: false })
  document.addEventListener('touchend', onTouchEnd)
}

function onTouchMove(e: TouchEvent) {
  if (draggingIdx.value === null || !listEl.value) return
  e.preventDefault()

  const touch = e.touches[0]
  const wrappers = listEl.value.querySelectorAll('.debt-drag-wrapper')

  for (let i = 0; i < wrappers.length; i++) {
    const rect = wrappers[i].getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    if (touch.clientY < midY) {
      if (i !== draggingIdx.value) moveItem(draggingIdx.value, i)
      return
    }
  }
  const lastIdx = wrappers.length - 1
  if (draggingIdx.value !== lastIdx) moveItem(draggingIdx.value, lastIdx)
}

function onTouchEnd() {
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onTouchEnd)
  if (draggingIdx.value !== null) commitOrder()
}

onUnmounted(() => {
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onTouchEnd)
})
</script>

<template>
  <section>
    <div class="section-header">
      <h2><i class="fas fa-list-check"></i> ทะเบียนหนี้</h2>
      <div class="section-header-actions">
        <button
          v-if="currentList.length > 1"
          class="btn-reorder"
          :class="{ active: reorderMode }"
          @click="toggleReorderMode"
        >
          <i class="fas fa-arrows-up-down"></i>
          {{ reorderMode ? 'เสร็จสิ้น' : 'จัดเรียง' }}
        </button>
        <button class="btn-primary btn-sm" @click="emit('add')">
          <i class="fas fa-plus"></i> เพิ่มรายการ
        </button>
      </div>
    </div>

    <div class="debt-tabs">
      <button
        class="debt-tab"
        :class="{ active: activeTab === 'debt' }"
        @click="activeTab = 'debt'; reorderMode = false"
      >
        <i class="fas fa-file-invoice-dollar"></i>
        หนี้สิน
        <span v-if="debtItems.length" class="debt-tab-count">{{ debtItems.length }}</span>
      </button>
      <button
        class="debt-tab"
        :class="{ active: activeTab === 'bill' }"
        @click="activeTab = 'bill'; reorderMode = false"
      >
        <i class="fas fa-receipt"></i>
        บิลรายเดือน
        <span v-if="billItems.length" class="debt-tab-count">{{ billItems.length }}</span>
      </button>
    </div>

    <div ref="listEl" class="debt-list" :class="{ 'reorder-active': reorderMode }">
      <div
        v-for="(debt, idx) in currentList"
        :key="debt.id"
        class="debt-drag-wrapper"
        :class="{ 'is-dragging': draggingIdx === idx }"
        :draggable="reorderMode"
        @dragstart="onDragStart($event, idx)"
        @dragenter="onDragEnter(idx)"
        @dragover.prevent
        @dragend="onDragEnd"
      >
        <div
          v-if="reorderMode"
          class="drag-handle"
          @mousedown="onHandleMouseDown"
          @touchstart.prevent="onTouchStart($event, idx)"
        >
          <i class="fas fa-grip-vertical"></i>
        </div>
        <DebtItem
          :debt="debt"
          :payments="payments"
          @edit="emit('edit', $event)"
          @delete="emit('delete', $event)"
          @pay="emit('pay', $event)"
          @detail="emit('detail', $event)"
        />
      </div>
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
.section-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-reorder {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reorder:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.btn-reorder.active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

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

.debt-drag-wrapper {
  display: flex;
  align-items: stretch;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.debt-drag-wrapper :deep(.debt-item) {
  flex: 1;
  min-width: 0;
}

.debt-drag-wrapper.is-dragging {
  opacity: 0.5;
  transform: scale(0.97);
}

.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  flex-shrink: 0;
  cursor: grab;
  color: var(--accent);
  font-size: 1rem;
  touch-action: none;
  user-select: none;
  opacity: 0.7;
  transition: opacity 0.2s, color 0.2s;
}

.drag-handle:hover {
  opacity: 1;
}

.drag-handle:active {
  cursor: grabbing;
}

.reorder-active .debt-drag-wrapper :deep(.debt-item) {
  border-color: var(--accent);
  border-style: dashed;
}
</style>
