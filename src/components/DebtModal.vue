<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Debt } from '@/types'

const props = defineProps<{
  visible: boolean
  editDebt: Debt | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: {
    name: string
    total_amount: number
    remaining: number
    interest: number
    min_payment: number
    frequency: 'monthly' | 'daily' | 'recurring_bill'
    due_day: number
    color: string
    icon: string
  }): void
}>()

const name = ref('')
const totalAmount = ref<number | string>('')
const remaining = ref<number | string>('')
const interest = ref<number | string>('')
const minPayment = ref<number | string>('')
const frequency = ref<'monthly' | 'daily' | 'recurring_bill'>('monthly')

const isRecurringBill = computed(() => frequency.value === 'recurring_bill')
const isDaily = computed(() => frequency.value === 'daily')
const dueDay = ref<number | string>('')
const selectedColor = ref('#6366f1')
const selectedIcon = ref('fas fa-credit-card')

const colors = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6'
]

const iconGroups = [
  {
    label: 'การเงิน',
    icons: [
      { class: 'fas fa-credit-card', label: 'บัตรเครดิต' },
      { class: 'fas fa-building-columns', label: 'ธนาคาร' },
      { class: 'fas fa-money-bill-wave', label: 'เงินกู้' },
      { class: 'fas fa-hand-holding-dollar', label: 'สินเชื่อ' },
      { class: 'fas fa-sack-dollar', label: 'กองทุน' },
      { class: 'fas fa-wallet', label: 'กระเป๋าเงิน' },
      { class: 'fas fa-coins', label: 'เหรียญ' },
      { class: 'fas fa-piggy-bank', label: 'ออมสิน' },
    ]
  },
  {
    label: 'ทรัพย์สิน',
    icons: [
      { class: 'fas fa-house', label: 'บ้าน' },
      { class: 'fas fa-car', label: 'รถยนต์' },
      { class: 'fas fa-motorcycle', label: 'มอเตอร์ไซค์' },
      { class: 'fas fa-mobile-screen', label: 'โทรศัพท์' },
      { class: 'fas fa-laptop', label: 'คอมพิวเตอร์' },
      { class: 'fas fa-tv', label: 'เครื่องใช้ไฟฟ้า' },
      { class: 'fas fa-couch', label: 'เฟอร์นิเจอร์' },
      { class: 'fas fa-gem', label: 'เครื่องประดับ' },
    ]
  },
  {
    label: 'บิล/ค่าใช้จ่าย',
    icons: [
      { class: 'fas fa-bolt', label: 'ค่าไฟ' },
      { class: 'fas fa-droplet', label: 'ค่าน้ำ' },
      { class: 'fas fa-wifi', label: 'อินเทอร์เน็ต' },
      { class: 'fas fa-phone', label: 'ค่าโทรศัพท์' },
      { class: 'fas fa-gas-pump', label: 'ค่าน้ำมัน' },
      { class: 'fas fa-shield-halved', label: 'ประกัน' },
      { class: 'fas fa-receipt', label: 'ค่าบริการ' },
      { class: 'fas fa-dumbbell', label: 'ฟิตเนส' },
    ]
  },
  {
    label: 'อื่นๆ',
    icons: [
      { class: 'fas fa-graduation-cap', label: 'การศึกษา' },
      { class: 'fas fa-hospital', label: 'ค่ารักษา' },
      { class: 'fas fa-store', label: 'ร้านค้า' },
      { class: 'fas fa-user-group', label: 'ยืมเพื่อน' },
      { class: 'fas fa-file-invoice-dollar', label: 'ใบแจ้งหนี้' },
      { class: 'fas fa-plane', label: 'ท่องเที่ยว' },
      { class: 'fas fa-ring', label: 'งานแต่ง' },
      { class: 'fas fa-ellipsis', label: 'อื่นๆ' },
    ]
  }
]

const modalTitle = ref('เพิ่มรายการหนี้')

watch(() => props.visible, (val) => {
  if (!val) return
  errors.value = {}
  submitted.value = false
  if (props.editDebt) {
    modalTitle.value = props.editDebt.frequency === 'recurring_bill' ? 'แก้ไขบิลรายเดือน' : 'แก้ไขรายการหนี้'
    name.value = props.editDebt.name
    totalAmount.value = props.editDebt.total_amount
    remaining.value = props.editDebt.remaining
    interest.value = props.editDebt.interest
    minPayment.value = props.editDebt.min_payment
    frequency.value = props.editDebt.frequency
    dueDay.value = props.editDebt.due_day
    selectedColor.value = props.editDebt.color || '#6366f1'
    selectedIcon.value = props.editDebt.icon || 'fas fa-credit-card'
  } else {
    modalTitle.value = 'เพิ่มรายการ'
    clearForm()
  }
})

const errors = ref<Record<string, string>>({})
const submitted = ref(false)

function clearForm() {
  name.value = ''
  totalAmount.value = ''
  remaining.value = ''
  interest.value = ''
  minPayment.value = ''
  frequency.value = 'monthly'
  dueDay.value = ''
  selectedColor.value = '#6366f1'
  selectedIcon.value = 'fas fa-credit-card'
  errors.value = {}
  submitted.value = false
}

function validate(): boolean {
  const e: Record<string, string> = {}
  if (!name.value.trim()) e.name = 'กรุณากรอกชื่อ'
  if (!isDaily.value) {
    const dd = parseInt(String(dueDay.value))
    if (!dd || dd < 1 || dd > 31) e.dueDay = 'กรุณาระบุวันที่ 1-31'
  }

  if (!isRecurringBill.value) {
    if (!String(totalAmount.value) || isNaN(parseFloat(String(totalAmount.value))) || parseFloat(String(totalAmount.value)) <= 0)
      e.totalAmount = 'กรุณากรอกยอดหนี้ทั้งหมด'
    if (!String(remaining.value) || isNaN(parseFloat(String(remaining.value))) || parseFloat(String(remaining.value)) < 0)
      e.remaining = 'กรุณากรอกยอดคงเหลือ'
    if (!String(interest.value) || isNaN(parseFloat(String(interest.value))) || parseFloat(String(interest.value)) < 0)
      e.interest = 'กรุณากรอกอัตราดอกเบี้ย'
    if (!String(minPayment.value) || isNaN(parseFloat(String(minPayment.value))) || parseFloat(String(minPayment.value)) <= 0)
      e.minPayment = 'กรุณากรอกยอดจ่ายขั้นต่ำ'
  }

  errors.value = e
  return Object.keys(e).length === 0
}

function handleSave() {
  submitted.value = true
  if (!validate()) return

  const n = name.value.trim()

  if (isRecurringBill.value) {
    const fixedAmount = parseFloat(String(minPayment.value)) || 0
    emit('save', {
      name: n,
      total_amount: 0,
      remaining: 0,
      interest: 0,
      min_payment: fixedAmount,
      frequency: 'recurring_bill',
      due_day: parseInt(String(dueDay.value)) || 1,
      color: selectedColor.value,
      icon: selectedIcon.value
    })
    return
  }

  emit('save', {
    name: n,
    total_amount: parseFloat(String(totalAmount.value)),
    remaining: parseFloat(String(remaining.value)),
    interest: parseFloat(String(interest.value)),
    min_payment: parseFloat(String(minPayment.value)),
    frequency: frequency.value,
    due_day: isDaily.value ? 0 : (parseInt(String(dueDay.value)) || 1),
    color: selectedColor.value,
    icon: selectedIcon.value
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
          <label>ประเภท</label>
          <select v-model="frequency" class="form-control">
            <option value="monthly">หนี้ - รายเดือน</option>
            <option value="daily">หนี้ - รายวัน</option>
            <option value="recurring_bill">บิลรายเดือน</option>
          </select>
        </div>

        <div class="form-group">
          <label>{{ isRecurringBill ? 'ชื่อบิล' : 'ชื่อเจ้าหนี้ / รายการ' }} <span class="required">*</span></label>
          <input v-model="name" type="text" class="form-control" :class="{ 'has-error': submitted && errors.name }" :placeholder="isRecurringBill ? 'เช่น ค่าไฟฟ้า, ค่าน้ำประปา' : 'เช่น บัตรเครดิต SCB'">
          <span v-if="submitted && errors.name" class="field-error">{{ errors.name }}</span>
        </div>

        <template v-if="isRecurringBill">
          <div class="form-group">
            <label>ยอดคงที่ต่อเดือน (฿) <span class="optional-label">— ไม่บังคับ</span></label>
            <input v-model="minPayment" type="number" class="form-control" placeholder="เว้นว่างถ้ายอดไม่คงที่ เช่น ค่าน้ำ ค่าไฟ">
            <span class="field-hint">ถ้ากรอก ระบบจะเติมยอดให้อัตโนมัติตอนบันทึกชำระ</span>
          </div>
        </template>

        <template v-if="!isRecurringBill">
          <div class="form-row">
            <div class="form-group">
              <label>ยอดหนี้ทั้งหมด (฿) <span class="required">*</span></label>
              <input v-model="totalAmount" type="number" class="form-control" :class="{ 'has-error': submitted && errors.totalAmount }" placeholder="100,000">
              <span v-if="submitted && errors.totalAmount" class="field-error">{{ errors.totalAmount }}</span>
            </div>
            <div class="form-group">
              <label>ยอดคงเหลือ (฿) <span class="required">*</span></label>
              <input v-model="remaining" type="number" class="form-control" :class="{ 'has-error': submitted && errors.remaining }" placeholder="80,000">
              <span v-if="submitted && errors.remaining" class="field-error">{{ errors.remaining }}</span>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>อัตราดอกเบี้ย (%/ปี) <span class="required">*</span></label>
              <input v-model="interest" type="number" class="form-control" :class="{ 'has-error': submitted && errors.interest }" placeholder="15" step="0.01">
              <span v-if="submitted && errors.interest" class="field-error">{{ errors.interest }}</span>
            </div>
            <div class="form-group">
              <label>ยอดจ่ายขั้นต่ำ (฿) <span class="required">*</span></label>
              <input v-model="minPayment" type="number" class="form-control" :class="{ 'has-error': submitted && errors.minPayment }" placeholder="3,000">
              <span v-if="submitted && errors.minPayment" class="field-error">{{ errors.minPayment }}</span>
            </div>
          </div>
        </template>

        <div v-if="!isDaily" class="form-group">
          <label>วันที่ครบกำหนด <span class="required">*</span></label>
          <input v-model="dueDay" type="number" class="form-control" :class="{ 'has-error': submitted && errors.dueDay }" placeholder="25" min="1" max="31">
          <span v-if="submitted && errors.dueDay" class="field-error">{{ errors.dueDay }}</span>
        </div>

        <!-- Icon Picker -->
        <div class="form-group">
          <label>ไอคอน</label>
          <div class="icon-preview">
            <div class="icon-preview-circle" :style="{ background: selectedColor + '20', color: selectedColor }">
              <i :class="selectedIcon"></i>
            </div>
            <span class="icon-preview-label">{{ iconGroups.flatMap(g => g.icons).find(i => i.class === selectedIcon)?.label || 'เลือกไอคอน' }}</span>
          </div>
          <div class="icon-picker">
            <div v-for="group in iconGroups" :key="group.label" class="icon-group">
              <span class="icon-group-label">{{ group.label }}</span>
              <div class="icon-grid">
                <button
                  v-for="ic in group.icons"
                  :key="ic.class"
                  class="icon-option"
                  :class="{ active: selectedIcon === ic.class }"
                  :style="selectedIcon === ic.class ? { background: selectedColor + '18', borderColor: selectedColor, color: selectedColor } : {}"
                  :title="ic.label"
                  @click="selectedIcon = ic.class"
                >
                  <i :class="ic.class"></i>
                  <span>{{ ic.label }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Color Picker -->
        <div class="form-group">
          <label>สี (เลือกเพื่อจำแนก)</label>
          <div class="color-picker">
            <button
              v-for="c in colors"
              :key="c"
              class="color-dot"
              :class="{ active: selectedColor === c }"
              :style="{ background: c }"
              @click="selectedColor = c"
            ></button>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" @click="emit('close')">ยกเลิก</button>
        <button class="btn-primary" @click="handleSave">บันทึก</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.required {
  color: var(--danger);
  font-weight: 600;
}

.optional-label {
  font-weight: 400;
  font-size: 0.7rem;
  color: var(--text-muted);
}

.field-hint {
  display: block;
  margin-top: 4px;
  font-size: 0.68rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.icon-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 10px 14px;
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
}

.icon-preview-circle {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
  transition: all 0.25s;
}

.icon-preview-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.icon-picker {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.icon-group-label {
  display: block;
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.icon-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px;
  border-radius: var(--radius-xs);
  border: 2px solid transparent;
  background: var(--bg-primary);
  color: var(--text-secondary);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.icon-option i {
  font-size: 1.1rem;
}

.icon-option span {
  font-size: 0.6rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.icon-option:active {
  transform: scale(0.94);
}

.icon-option.active {
  border-color: var(--accent);
  font-weight: 700;
}
</style>
