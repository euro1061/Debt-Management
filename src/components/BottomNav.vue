<script setup lang="ts">
defineProps<{ activeTab: string }>()
const emit = defineEmits<{ (e: 'switch', tab: string): void }>()

const tabs = [
  { id: 'dashboard', icon: 'fas fa-chart-line', label: 'ภาพรวม' },
  { id: 'calculator', icon: 'fas fa-calculator', label: 'คำนวณ' },
  { id: 'calendar', icon: 'fas fa-wallet', label: 'การชำระ' },
  { id: 'insights', icon: 'fas fa-lightbulb', label: 'วิเคราะห์' },
  { id: 'settings', icon: 'fas fa-gear', label: 'ตั้งค่า' }
]
</script>

<template>
  <nav class="bottom-nav">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="nav-item"
      :class="{ active: activeTab === tab.id }"
      @click="emit('switch', tab.id)"
    >
      <i :class="tab.icon"></i>
      <span>{{ tab.label }}</span>
    </button>
  </nav>
</template>
