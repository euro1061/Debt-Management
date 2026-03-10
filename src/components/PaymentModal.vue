<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import type { Debt, Payment } from '@/types'
import { fmt } from '@/utils/format'

const props = defineProps<{
  visible: boolean
  debts: Debt[]
  preselectedDebtId: string | null
  editPayment: Payment | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: {
    debtId: string
    amount: number
    date: string
    note: string
    receiptFile: File | null
    existingReceiptUrl: string
  }): void
}>()

const selectedDebtId = ref('')
const amount = ref<number | string>('')
const date = ref(new Date().toISOString().split('T')[0])
const note = ref('')

const receiptFile = ref<File | null>(null)
const receiptPreview = ref<string>('')
const existingReceiptUrl = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const searchQuery = ref('')
const dropdownOpen = ref(false)
const searchInput = ref<HTMLInputElement | null>(null)

const isEditing = computed(() => !!props.editPayment)
const modalTitle = computed(() => isEditing.value ? 'แก้ไขการชำระ' : 'บันทึกการชำระ')
const submitText = computed(() => isEditing.value ? 'บันทึกการแก้ไข' : 'บันทึกชำระ')

watch(() => props.visible, (val) => {
  if (!val) {
    dropdownOpen.value = false
    return
  }
  errors.value = {}
  submitted.value = false
  receiptFile.value = null
  receiptPreview.value = ''

  if (props.editPayment) {
    selectedDebtId.value = props.editPayment.debt_id
    amount.value = props.editPayment.amount
    date.value = props.editPayment.date
    note.value = props.editPayment.note || ''
    existingReceiptUrl.value = props.editPayment.receipt_url || ''
  } else {
    date.value = new Date().toISOString().split('T')[0]
    note.value = ''
    existingReceiptUrl.value = ''

    if (props.preselectedDebtId) {
      selectedDebtId.value = props.preselectedDebtId
      const debt = props.debts.find(d => d.id === props.preselectedDebtId)
      amount.value = debt?.min_payment ?? ''
    } else {
      selectedDebtId.value = props.debts[0]?.id ?? ''
      amount.value = ''
    }
  }
  searchQuery.value = ''
})

const debtOptions = computed(() =>
  props.debts.map(d => ({
    value: d.id,
    label: d.frequency === 'recurring_bill'
      ? `${d.name} (บิลรายเดือน)`
      : `${d.name} (${fmt(d.remaining)})`,
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

const selectedLabel = computed(() => {
  const opt = debtOptions.value.find(o => o.value === selectedDebtId.value)
  return opt?.label || 'เลือกรายการ'
})

const selectedOption = computed(() => debtOptions.value.find(o => o.value === selectedDebtId.value))

function openDropdown() {
  if (isEditing.value) return
  dropdownOpen.value = true
  searchQuery.value = ''
  nextTick(() => searchInput.value?.focus())
}

function selectOption(id: string) {
  selectedDebtId.value = id
  dropdownOpen.value = false
  searchQuery.value = ''
}

const errors = ref<Record<string, string>>({})
const submitted = ref(false)

function validate(): boolean {
  const e: Record<string, string> = {}
  if (!selectedDebtId.value) e.debt = 'กรุณาเลือกรายการหนี้'
  const a = parseFloat(String(amount.value))
  if (!String(amount.value) || isNaN(a) || a <= 0) e.amount = 'กรุณากรอกจำนวนเงินที่มากกว่า 0'
  if (!date.value) e.date = 'กรุณาเลือกวันที่ชำระ'
  errors.value = e
  return Object.keys(e).length === 0
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    return
  }

  receiptFile.value = file
  existingReceiptUrl.value = ''
  const reader = new FileReader()
  reader.onload = () => { receiptPreview.value = reader.result as string }
  reader.readAsDataURL(file)
}

function removeReceipt() {
  receiptFile.value = null
  receiptPreview.value = ''
  existingReceiptUrl.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

function handleSave() {
  submitted.value = true
  if (!validate()) return

  emit('save', {
    debtId: selectedDebtId.value,
    amount: parseFloat(String(amount.value)),
    date: date.value,
    note: note.value.trim(),
    receiptFile: receiptFile.value,
    existingReceiptUrl: existingReceiptUrl.value
  })
}
</script>

<template>
  <div v-if="visible" class="modal-overlay" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3>{{ modalTitle }}</h3>
        <button class="btn-icon" @click="emit('close')"><i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>เลือกรายการหนี้ <span class="required">*</span></label>
          <div class="searchable-select" :class="{ disabled: isEditing, 'has-error': submitted && errors.debt }">
            <button class="ss-trigger" :class="{ 'has-error': submitted && errors.debt }" @click="openDropdown" :disabled="isEditing">
              <div v-if="selectedOption" class="ss-selected">
                <div class="ss-icon" :style="{ background: selectedOption.color + '18', color: selectedOption.color }">
                  <i :class="selectedOption.icon"></i>
                </div>
                <span class="ss-label">{{ selectedOption.label }}</span>
              </div>
              <span v-else class="ss-placeholder">เลือกรายการ</span>
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
          <span v-if="submitted && errors.debt" class="field-error">{{ errors.debt }}</span>
        </div>
        <div class="form-group">
          <label>จำนวนเงินที่ชำระ (฿) <span class="required">*</span></label>
          <input v-model="amount" type="number" class="form-control" :class="{ 'has-error': submitted && errors.amount }" placeholder="5,000">
          <span v-if="submitted && errors.amount" class="field-error">{{ errors.amount }}</span>
        </div>
        <div class="form-group">
          <label>วันที่ชำระ <span class="required">*</span></label>
          <input v-model="date" type="date" class="form-control" :class="{ 'has-error': submitted && errors.date }">
          <span v-if="submitted && errors.date" class="field-error">{{ errors.date }}</span>
        </div>
        <div class="form-group">
          <label>หมายเหตุ (ถ้ามี)</label>
          <input v-model="note" type="text" class="form-control" placeholder="เช่น จ่ายขั้นต่ำ, โปะเพิ่ม">
        </div>

        <div class="form-group">
          <label>แนบสลิป / ใบเสร็จ</label>
          <!-- Existing receipt from edit -->
          <div v-if="existingReceiptUrl" class="receipt-preview">
            <img :src="existingReceiptUrl" alt="สลิป" class="receipt-thumb">
            <button class="receipt-remove" @click="removeReceipt" type="button">
              <i class="fas fa-xmark"></i>
            </button>
          </div>
          <!-- New file preview -->
          <div v-else-if="receiptPreview" class="receipt-preview">
            <img :src="receiptPreview" alt="สลิป" class="receipt-thumb">
            <button class="receipt-remove" @click="removeReceipt" type="button">
              <i class="fas fa-xmark"></i>
            </button>
          </div>
          <!-- Upload button -->
          <div v-else class="receipt-upload" @click="fileInput?.click()">
            <i class="fas fa-camera"></i>
            <span>เลือกรูปภาพ</span>
          </div>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onFileChange"
          >
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" @click="emit('close')">ยกเลิก</button>
        <button class="btn-primary" @click="handleSave">
          <i :class="isEditing ? 'fas fa-check' : 'fas fa-plus'"></i>
          {{ submitText }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.required {
  color: var(--danger);
  font-weight: 600;
}

.ss-trigger.has-error {
  border-color: var(--danger);
}

.searchable-select {
  position: relative;
}

.searchable-select.disabled {
  opacity: 0.6;
  pointer-events: none;
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

.receipt-upload {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  border: 2px dashed var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.receipt-upload:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-light);
}

.receipt-upload:active {
  transform: scale(0.98);
}

.receipt-upload i {
  font-size: 1.1rem;
}

.receipt-preview {
  position: relative;
  display: inline-block;
}

.receipt-thumb {
  width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-primary);
}

.receipt-remove {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.receipt-remove:hover {
  background: var(--danger);
}

.hidden {
  display: none;
}
</style>
