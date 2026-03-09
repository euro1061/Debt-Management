<script setup lang="ts">
defineProps<{
  visible: boolean
  title?: string
  message?: string
  detail?: string
  confirmText?: string
  cancelText?: string
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div v-if="visible" class="confirm-overlay" @click.self="emit('cancel')">
        <Transition name="confirm-pop" appear>
          <div v-if="visible" class="confirm-modal">
            <div class="confirm-icon-wrapper">
              <div class="confirm-icon-bg">
                <i class="fas fa-trash-can"></i>
              </div>
            </div>

            <h3 class="confirm-title">{{ title || 'ยืนยันการลบ' }}</h3>

            <p class="confirm-message">{{ message || 'คุณต้องการลบรายการนี้ใช่หรือไม่?' }}</p>

            <p v-if="detail" class="confirm-detail">
              <i class="fas fa-quote-left"></i> {{ detail }}
            </p>

            <p class="confirm-warning">
              <i class="fas fa-circle-exclamation"></i>
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>

            <div class="confirm-actions">
              <button class="confirm-btn-cancel" @click="emit('cancel')">
                <i class="fas fa-xmark"></i> {{ cancelText || 'ยกเลิก' }}
              </button>
              <button class="confirm-btn-delete" @click="emit('confirm')">
                <i class="fas fa-trash"></i> {{ confirmText || 'ลบรายการ' }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  z-index: 150;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.confirm-modal {
  background: var(--bg-card);
  border-radius: var(--radius);
  padding: 32px 24px 24px;
  width: 100%;
  max-width: 360px;
  text-align: center;
  box-shadow: var(--shadow-lg), 0 0 0 1px var(--border);
}

.confirm-icon-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 18px;
}

.confirm-icon-bg {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--danger-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: var(--danger);
  animation: iconPulse 2s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.2); }
  50% { transform: scale(1.05); box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); }
}

.confirm-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.confirm-message {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 12px;
}

.confirm-detail {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-light);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.confirm-detail i {
  font-size: 0.7rem;
  opacity: 0.5;
}

.confirm-warning {
  font-size: 0.72rem;
  color: var(--danger);
  opacity: 0.8;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
}

.confirm-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.confirm-btn-cancel,
.confirm-btn-delete {
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
  border: none;
}

.confirm-btn-cancel {
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.confirm-btn-cancel:active {
  transform: scale(0.96);
}

.confirm-btn-delete {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

.confirm-btn-delete:active {
  transform: scale(0.96);
  opacity: 0.9;
}

/* Transitions */
.confirm-fade-enter-active {
  transition: opacity 0.2s ease;
}
.confirm-fade-leave-active {
  transition: opacity 0.15s ease;
}
.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}

.confirm-pop-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.confirm-pop-leave-active {
  transition: all 0.15s ease;
}
.confirm-pop-enter-from {
  opacity: 0;
  transform: scale(0.85) translateY(20px);
}
.confirm-pop-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
