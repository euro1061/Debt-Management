<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { Debt } from '@/types'
import { fmt } from '@/utils/format'
import { calculateMonthsToPayoff } from '@/utils/calculations'

const props = defineProps<{ debts: Debt[] }>()

const selectedDebtId = ref('')
const extraAmount = ref<number | string>('')

const searchQuery = ref('')
const dropdownOpen = ref(false)
const searchInput = ref<HTMLInputElement | null>(null)

const debtOptions = computed(() =>
  props.debts.filter(d => d.frequency !== 'recurring_bill').map(d => ({
    value: d.id,
    label: `${d.name} (${fmt(d.remaining)})`,
    name: d.name,
    icon: d.icon || 'fas fa-credit-card',
    color: d.color || '#6366f1'
  }))
)

const filteredOptions = computed(() => {
  if (!searchQuery.value.trim()) return debtOptions.value
  const q = searchQuery.value.trim().toLowerCase()
  return debtOptions.value.filter(o => o.name.toLowerCase().includes(q) || o.label.toLowerCase().includes(q))
})

const selectedOption = computed(() => debtOptions.value.find(o => o.value === selectedDebtId.value))

function openDropdown() {
  dropdownOpen.value = true
  searchQuery.value = ''
  nextTick(() => searchInput.value?.focus())
}

function selectOption(id: string) {
  selectedDebtId.value = id
  dropdownOpen.value = false
  searchQuery.value = ''
}

const selectedDebt = computed(() => props.debts.find(d => d.id === selectedDebtId.value))

const result = computed(() => {
  const d = selectedDebt.value
  const extra = parseFloat(String(extraAmount.value)) || 0
  if (!d || extra <= 0) return null

  const monthsBefore = calculateMonthsToPayoff(d, 0)
  const monthsAfter = calculateMonthsToPayoff(d, extra)

  const unit = d.frequency === 'daily' ? 'วัน' : 'เดือน'
  const multiplier = d.frequency === 'daily' ? 30 : 1

  const before = monthsBefore === Infinity ? '∞' : Math.ceil(monthsBefore * multiplier) + ' ' + unit
  const after = monthsAfter === Infinity ? '∞' : Math.ceil(monthsAfter * multiplier) + ' ' + unit

  let savingHtml = 'ปรับยอดให้มากขึ้นเพื่อดูผลลัพธ์'
  if (monthsBefore !== Infinity && monthsAfter !== Infinity) {
    const saved = Math.ceil(monthsBefore * multiplier) - Math.ceil(monthsAfter * multiplier)
    savingHtml = `หมดหนี้เร็วขึ้น ${saved} ${unit}!`
  }

  return { before, after, savingHtml, hasSaving: monthsBefore !== Infinity && monthsAfter !== Infinity }
})
</script>

<template>
  <div class="card whatif-card">
    <h3><i class="fas fa-wand-magic-sparkles"></i> จำลองสถานการณ์ (What-If)</h3>
    <p class="text-sm opacity-70 mb-4">ลองดูว่าถ้าโปะเพิ่ม จะหมดหนี้เร็วขึ้นแค่ไหน</p>

    <div class="form-group">
      <label>เลือกรายการหนี้</label>
      <div class="searchable-select">
        <button class="ss-trigger" @click="openDropdown">
          <div v-if="selectedOption" class="ss-selected">
            <div class="ss-icon" :style="{ background: selectedOption.color + '18', color: selectedOption.color }">
              <i :class="selectedOption.icon"></i>
            </div>
            <span class="ss-label">{{ selectedOption.label }}</span>
          </div>
          <span v-else class="ss-placeholder">-- เลือก --</span>
          <i class="fas fa-chevron-down ss-arrow"></i>
        </button>

        <div v-if="dropdownOpen" class="ss-dropdown">
          <div class="ss-search-wrap">
            <i class="fas fa-search ss-search-icon"></i>
            <input
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              class="ss-search"
              placeholder="พิมพ์ชื่อเพื่อค้นหา..."
              @keydown.esc="dropdownOpen = false"
            >
          </div>
          <div class="ss-options">
            <button
              v-for="opt in filteredOptions"
              :key="opt.value"
              class="ss-option"
              :class="{ active: selectedDebtId === opt.value }"
              @click="selectOption(opt.value)"
            >
              <div class="ss-icon" :style="{ background: opt.color + '18', color: opt.color }">
                <i :class="opt.icon"></i>
              </div>
              <span>{{ opt.label }}</span>
              <i v-if="selectedDebtId === opt.value" class="fas fa-check ss-check"></i>
            </button>
            <div v-if="filteredOptions.length === 0" class="ss-empty">
              ไม่พบรายการที่ค้นหา
            </div>
          </div>
        </div>
        <div v-if="dropdownOpen" class="ss-backdrop" @click="dropdownOpen = false"></div>
      </div>
    </div>
    <div class="form-group">
      <label>จำนวนเงินที่จะโปะเพิ่ม (฿)</label>
      <input v-model="extraAmount" type="number" class="form-control" placeholder="0">
    </div>

    <div v-if="result" class="whatif-result">
      <div class="whatif-comparison">
        <div class="whatif-before">
          <span class="whatif-label">แผนปกติ</span>
          <span class="whatif-value">{{ result.before }}</span>
        </div>
        <div class="whatif-arrow"><i class="fas fa-arrow-right"></i></div>
        <div class="whatif-after">
          <span class="whatif-label">โปะเพิ่ม</span>
          <span class="whatif-value">{{ result.after }}</span>
        </div>
      </div>
      <div class="whatif-saving">
        <template v-if="result.hasSaving">
          <i class="fas fa-rocket"></i> <strong>{{ result.savingHtml }}</strong>
        </template>
        <template v-else>{{ result.savingHtml }}</template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.searchable-select {
  position: relative;
}

.ss-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  background: var(--bg-primary);
  font-family: inherit;
  font-size: 0.85rem;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
}

.ss-trigger:hover {
  border-color: var(--accent);
}

.ss-selected {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.ss-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.ss-placeholder {
  color: var(--text-muted);
}

.ss-arrow {
  font-size: 0.7rem;
  color: var(--text-muted);
  flex-shrink: 0;
  margin-left: 8px;
}

.ss-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.ss-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99;
}

.ss-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-lg);
  z-index: 100;
  overflow: hidden;
}

.ss-search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
}

.ss-search-icon {
  color: var(--text-muted);
  font-size: 0.8rem;
  flex-shrink: 0;
}

.ss-search {
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 0.82rem;
  color: var(--text-primary);
  width: 100%;
}

.ss-search::placeholder {
  color: var(--text-muted);
}

.ss-options {
  max-height: 200px;
  overflow-y: auto;
  padding: 4px;
}

.ss-option {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: none;
  border-radius: var(--radius-xs);
  background: transparent;
  font-family: inherit;
  font-size: 0.8rem;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}

.ss-option:hover {
  background: var(--bg-primary);
}

.ss-option.active {
  background: var(--accent-light);
  color: var(--accent);
  font-weight: 600;
}

.ss-check {
  margin-left: auto;
  font-size: 0.7rem;
  color: var(--accent);
}

.ss-empty {
  padding: 16px;
  text-align: center;
  font-size: 0.78rem;
  color: var(--text-muted);
}
</style>
