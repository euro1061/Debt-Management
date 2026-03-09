<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Payment } from '@/types'
import { fmt } from '@/utils/format'

const props = defineProps<{ payments: Payment[] }>()

const STORAGE_KEY = 'df_monthly_goal'
const savedGoal = localStorage.getItem(STORAGE_KEY)
const goalAmount = ref<number>(savedGoal ? Number(savedGoal) : 0)
const isEditing = ref(false)
const editInput = ref<number | string>('')

const monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']

const now = new Date()
const currentMonthLabel = computed(() => `${monthNames[now.getMonth()]} ${now.getFullYear() + 543}`)

const paidThisMonth = computed(() => {
  const cm = now.getMonth()
  const cy = now.getFullYear()
  return props.payments
    .filter(p => {
      const d = new Date(p.date)
      return d.getMonth() === cm && d.getFullYear() === cy
    })
    .reduce((s, p) => s + Number(p.amount), 0)
})

const pct = computed(() => {
  if (goalAmount.value <= 0) return 0
  return Math.min(100, Math.round((paidThisMonth.value / goalAmount.value) * 100))
})

const isAchieved = computed(() => goalAmount.value > 0 && paidThisMonth.value >= goalAmount.value)

const statusColor = computed(() => {
  if (isAchieved.value) return 'var(--success)'
  if (pct.value >= 70) return 'var(--accent)'
  if (pct.value >= 40) return 'var(--warning)'
  return 'var(--danger)'
})

const goalError = ref('')
const goalSubmitted = ref(false)

function startEdit() {
  editInput.value = goalAmount.value || ''
  isEditing.value = true
  goalError.value = ''
  goalSubmitted.value = false
}

function saveGoal() {
  goalSubmitted.value = true
  const val = parseFloat(String(editInput.value))
  if (!String(editInput.value) || isNaN(val) || val <= 0) {
    goalError.value = 'กรุณากรอกยอดเป้าหมายที่มากกว่า 0'
    return
  }
  goalError.value = ''
  goalAmount.value = val
  localStorage.setItem(STORAGE_KEY, String(val))
  isEditing.value = false
}

function cancelEdit() {
  isEditing.value = false
  goalError.value = ''
  goalSubmitted.value = false
}

watch(goalAmount, (v) => {
  localStorage.setItem(STORAGE_KEY, String(v))
})
</script>

<template>
  <div class="goal-card">
    <div class="goal-header">
      <div class="goal-title">
        <i class="fas fa-bullseye"></i> เป้าหมายเดือนนี้
      </div>
      <span class="goal-month">{{ currentMonthLabel }}</span>
    </div>

    <template v-if="goalAmount <= 0 && !isEditing">
      <div class="goal-empty" @click="startEdit">
        <div class="goal-empty-icon"><i class="fas fa-crosshairs"></i></div>
        <p>ตั้งเป้าหมายการชำระ</p>
        <p class="goal-empty-sub">กำหนดยอดที่ตั้งใจจะจ่ายเดือนนี้</p>
      </div>
    </template>

    <template v-else-if="isEditing">
      <div class="goal-edit">
        <label>ยอดเป้าหมายเดือนนี้ (฿) <span class="required">*</span></label>
        <input
          v-model="editInput"
          type="number"
          class="form-control"
          :class="{ 'has-error': goalSubmitted && goalError }"
          placeholder="เช่น 15,000"
          @keyup.enter="saveGoal"
          autofocus
        >
        <span v-if="goalSubmitted && goalError" class="field-error">{{ goalError }}</span>
        <div class="goal-edit-actions">
          <button class="btn-secondary btn-sm" @click="cancelEdit">ยกเลิก</button>
          <button class="btn-primary btn-sm" @click="saveGoal">บันทึก</button>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="goal-progress-ring-row">
        <div class="goal-ring-wrap">
          <svg viewBox="0 0 100 100" class="goal-ring-svg">
            <circle cx="50" cy="50" r="42" class="goal-ring-bg" />
            <circle
              cx="50" cy="50" r="42"
              class="goal-ring-fill"
              :stroke="statusColor"
              :stroke-dasharray="263.9"
              :stroke-dashoffset="263.9 - (263.9 * pct / 100)"
            />
          </svg>
          <div class="goal-ring-center">
            <span v-if="isAchieved" class="goal-ring-check"><i class="fas fa-check"></i></span>
            <template v-else>
              <span class="goal-ring-pct">{{ pct }}%</span>
            </template>
          </div>
        </div>

        <div class="goal-info">
          <div class="goal-info-row">
            <span class="goal-info-label">เป้าหมาย</span>
            <span class="goal-info-value">{{ fmt(goalAmount) }}</span>
          </div>
          <div class="goal-info-row">
            <span class="goal-info-label">ชำระแล้ว</span>
            <span class="goal-info-value" :style="{ color: statusColor }">{{ fmt(paidThisMonth) }}</span>
          </div>
          <div class="goal-info-row">
            <span class="goal-info-label">{{ isAchieved ? 'เกินเป้า' : 'คงเหลือ' }}</span>
            <span class="goal-info-value">
              {{ isAchieved ? '+' + fmt(paidThisMonth - goalAmount) : fmt(goalAmount - paidThisMonth) }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="isAchieved" class="goal-achieved">
        <i class="fas fa-party-horn"></i> ยินดีด้วย! ถึงเป้าหมายเดือนนี้แล้ว
      </div>

      <button class="goal-edit-btn" @click="startEdit">
        <i class="fas fa-pen"></i> แก้ไขเป้าหมาย
      </button>
    </template>
  </div>
</template>

<style scoped>
.required {
  color: var(--danger);
  font-weight: 600;
}

.goal-card {
  background: var(--bg-card);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow);
  margin-bottom: 16px;
}

.goal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.goal-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
}

.goal-title i {
  color: var(--accent);
  margin-right: 6px;
}

.goal-month {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--bg-primary);
  padding: 4px 10px;
  border-radius: 20px;
}

.goal-empty {
  text-align: center;
  padding: 24px 0;
  cursor: pointer;
  border: 2px dashed var(--border);
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.goal-empty:hover {
  border-color: var(--accent);
  background: var(--accent-light);
}

.goal-empty:active {
  transform: scale(0.98);
}

.goal-empty-icon {
  font-size: 1.6rem;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.goal-empty p {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0;
}

.goal-empty-sub {
  font-size: 0.72rem !important;
  font-weight: 400 !important;
  color: var(--text-muted) !important;
  margin-top: 4px !important;
}

.goal-edit {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.goal-edit label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.goal-edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.goal-progress-ring-row {
  display: flex;
  align-items: center;
  gap: 20px;
}

.goal-ring-wrap {
  position: relative;
  width: 100px;
  height: 100px;
  flex-shrink: 0;
}

.goal-ring-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.goal-ring-bg {
  fill: none;
  stroke: var(--bg-primary);
  stroke-width: 8;
}

.goal-ring-fill {
  fill: none;
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s;
}

.goal-ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.goal-ring-pct {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--text-primary);
}

.goal-ring-check {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--success);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.goal-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.goal-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.goal-info-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
}

.goal-info-value {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-primary);
}

.goal-achieved {
  margin-top: 14px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  background: var(--success-light);
  color: var(--success);
  font-size: 0.78rem;
  font-weight: 600;
  text-align: center;
}

.goal-edit-btn {
  display: block;
  width: 100%;
  margin-top: 12px;
  padding: 8px;
  border: none;
  border-radius: var(--radius-xs);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.goal-edit-btn:hover {
  background: var(--accent-light);
  color: var(--accent);
}

.goal-edit-btn i {
  margin-right: 4px;
}
</style>
