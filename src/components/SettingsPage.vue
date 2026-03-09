<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useFontSize } from '@/composables/useFontSize'
import { useSettings } from '@/composables/useSettings'
import { useDebts } from '@/composables/useDebts'
import { usePayments } from '@/composables/usePayments'

const { isDark, toggleTheme } = useTheme()
const { currentSize, setSize } = useFontSize()
const { alertDays, familyName } = useSettings()
const { clearAllDebts } = useDebts()
const { clearAllPayments } = usePayments()

const fontOptions = [
  { value: 'small' as const, label: 'เล็ก', desc: '14px' },
  { value: 'medium' as const, label: 'ปกติ', desc: '16px' },
  { value: 'large' as const, label: 'ใหญ่', desc: '18px' },
  { value: 'xlarge' as const, label: 'ใหญ่มาก', desc: '20px' }
]

const alertOptions = [
  { value: 1, label: '1 วัน' },
  { value: 3, label: '3 วัน' },
  { value: 5, label: '5 วัน' },
  { value: 7, label: '7 วัน' }
]

const clearStep = ref(0)
const clearing = ref(false)

function onClearClick() {
  if (clearStep.value === 0) {
    clearStep.value = 1
    setTimeout(() => { if (clearStep.value === 1) clearStep.value = 0 }, 5000)
  } else if (clearStep.value === 1) {
    clearStep.value = 2
    setTimeout(() => { if (clearStep.value === 2) clearStep.value = 0 }, 5000)
  }
}

async function confirmClear() {
  clearing.value = true
  await clearAllPayments()
  await clearAllDebts()
  clearing.value = false
  clearStep.value = 3
}
</script>

<template>
  <div class="settings-page">
    <div class="section-header">
      <h2><i class="fas fa-gear"></i> ตั้งค่า</h2>
    </div>

    <!-- Family Name -->
    <div class="settings-card">
      <div class="settings-card-header">
        <i class="fas fa-house-chimney"></i>
        <div>
          <div class="settings-card-title">ชื่อแสดงในแอป</div>
          <div class="settings-card-desc">ตั้งชื่อครอบครัวหรือชื่อที่ต้องการแสดงที่ Header แทน "Debt Free"</div>
        </div>
      </div>
      <input
        v-model="familyName"
        type="text"
        class="form-control"
        placeholder="เช่น ครอบครัวสุขใจ"
        maxlength="30"
      >
      <div class="settings-hint">เว้นว่างจะแสดง "Debt Free" ตามปกติ</div>
    </div>

    <!-- Font Size -->
    <div class="settings-card">
      <div class="settings-card-header">
        <i class="fas fa-text-height"></i>
        <div>
          <div class="settings-card-title">ขนาดตัวอักษร</div>
          <div class="settings-card-desc">ปรับขนาดตัวอักษรให้เหมาะกับการอ่าน</div>
        </div>
      </div>

      <div class="font-size-preview">
        <span>ตัวอย่างข้อความ — Debt Free</span>
      </div>

      <div class="font-size-options">
        <button
          v-for="opt in fontOptions"
          :key="opt.value"
          class="font-size-btn"
          :class="{ active: currentSize === opt.value }"
          @click="setSize(opt.value)"
        >
          <span class="font-size-label">{{ opt.label }}</span>
          <span class="font-size-desc">{{ opt.desc }}</span>
        </button>
      </div>
    </div>

    <!-- Alert Days -->
    <div class="settings-card">
      <div class="settings-card-header">
        <i class="fas fa-bell"></i>
        <div>
          <div class="settings-card-title">แจ้งเตือนล่วงหน้า</div>
          <div class="settings-card-desc">แจ้งเตือนก่อนถึงวันครบกำหนดชำระกี่วัน</div>
        </div>
      </div>
      <div class="alert-options">
        <button
          v-for="opt in alertOptions"
          :key="opt.value"
          class="alert-btn"
          :class="{ active: alertDays === opt.value }"
          @click="alertDays = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Theme -->
    <div class="settings-card">
      <div class="settings-card-header">
        <i :class="isDark ? 'fas fa-moon' : 'fas fa-sun'"></i>
        <div>
          <div class="settings-card-title">ธีม</div>
          <div class="settings-card-desc">เลือกโหมดสว่างหรือมืด</div>
        </div>
      </div>
      <div class="theme-options">
        <button
          class="theme-btn"
          :class="{ active: !isDark }"
          @click="isDark && toggleTheme()"
        >
          <i class="fas fa-sun"></i>
          สว่าง
        </button>
        <button
          class="theme-btn"
          :class="{ active: isDark }"
          @click="!isDark && toggleTheme()"
        >
          <i class="fas fa-moon"></i>
          มืด
        </button>
      </div>
    </div>

    <!-- Clear Data -->
    <div class="settings-card settings-card-danger">
      <div class="settings-card-header">
        <i class="fas fa-trash-can"></i>
        <div>
          <div class="settings-card-title">ล้างข้อมูลทั้งหมด</div>
          <div class="settings-card-desc">ลบหนี้และประวัติการชำระทั้งหมด ไม่สามารถกู้คืนได้</div>
        </div>
      </div>

      <div v-if="clearStep === 3" class="clear-done">
        <i class="fas fa-circle-check"></i> ล้างข้อมูลเรียบร้อยแล้ว
      </div>

      <template v-else>
        <button
          v-if="clearStep === 0"
          class="btn-clear"
          @click="onClearClick"
        >
          <i class="fas fa-trash-can"></i> ล้างข้อมูลทั้งหมด
        </button>

        <div v-else-if="clearStep === 1" class="clear-confirm">
          <p class="clear-warn"><i class="fas fa-triangle-exclamation"></i> ข้อมูลจะถูกลบทั้งหมดและกู้คืนไม่ได้!</p>
          <div class="clear-actions">
            <button class="btn-secondary btn-sm" @click="clearStep = 0">ยกเลิก</button>
            <button class="btn-clear" @click="onClearClick">ยืนยันครั้งที่ 1</button>
          </div>
        </div>

        <div v-else-if="clearStep === 2" class="clear-confirm">
          <p class="clear-warn clear-warn-final"><i class="fas fa-skull-crossbones"></i> ยืนยันครั้งสุดท้าย! กดแล้วลบทันที</p>
          <div class="clear-actions">
            <button class="btn-secondary btn-sm" @click="clearStep = 0">ยกเลิก</button>
            <button class="btn-clear btn-clear-final" :disabled="clearing" @click="confirmClear">
              <i :class="clearing ? 'fas fa-spinner fa-spin' : 'fas fa-trash-can'"></i>
              {{ clearing ? 'กำลังลบ...' : 'ลบทั้งหมดเลย' }}
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- App Info -->
    <div class="settings-card">
      <div class="settings-card-header" style="margin-bottom: 0;">
        <i class="fas fa-circle-info"></i>
        <div>
          <div class="settings-card-title">เกี่ยวกับแอป</div>
          <div class="settings-card-desc">Debt Free v1.0 — ระบบจัดการหนี้ครบวงจร</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.settings-card {
  background: var(--bg-card);
  border-radius: var(--radius);
  padding: 16px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.settings-card-danger {
  border-color: #fca5a5;
}

.settings-card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.settings-card-header > i {
  font-size: 1.1rem;
  color: var(--accent);
  margin-top: 2px;
}

.settings-card-danger .settings-card-header > i {
  color: var(--danger);
}

.settings-card-title {
  font-weight: 700;
  font-size: 0.9rem;
}

.settings-card-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.settings-hint {
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-top: 6px;
}

/* Font Size Options */
.font-size-preview {
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  margin-bottom: 12px;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
}

.font-size-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.font-size-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 6px;
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-secondary);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.font-size-btn:active {
  transform: scale(0.96);
}

.font-size-btn.active {
  border-color: var(--accent);
  background: var(--accent-light);
  color: var(--accent);
}

.font-size-label {
  font-weight: 700;
  font-size: 0.82rem;
}

.font-size-desc {
  font-size: 0.65rem;
  opacity: 0.7;
}

/* Alert Options */
.alert-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.alert-btn {
  padding: 10px 8px;
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.alert-btn:active {
  transform: scale(0.96);
}

.alert-btn.active {
  border-color: var(--accent);
  background: var(--accent-light);
  color: var(--accent);
}

/* Theme Options */
.theme-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.theme-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-btn:active {
  transform: scale(0.97);
}

.theme-btn.active {
  border-color: var(--accent);
  background: var(--accent-light);
  color: var(--accent);
}

/* Clear Data */
.btn-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 10px;
  border: 1px solid var(--danger);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--danger);
  font-size: 0.82rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear:hover {
  background: var(--danger-light);
}

.btn-clear:active {
  transform: scale(0.98);
}

.btn-clear-final {
  background: var(--danger);
  color: white;
  border-color: var(--danger);
}

.btn-clear-final:hover {
  background: #dc2626;
}

.btn-clear:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.clear-confirm {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.clear-warn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--warning);
  padding: 8px 10px;
  background: var(--warning-light);
  border-radius: var(--radius-xs);
}

.clear-warn-final {
  color: var(--danger);
  background: var(--danger-light);
}

.clear-actions {
  display: flex;
  gap: 8px;
}

.clear-actions .btn-secondary {
  flex: 1;
}

.clear-actions .btn-clear {
  flex: 2;
}

.clear-done {
  text-align: center;
  padding: 12px;
  color: var(--success);
  font-weight: 600;
  font-size: 0.85rem;
}

.clear-done i {
  margin-right: 4px;
}
</style>
