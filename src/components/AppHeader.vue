<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useSettings } from '@/composables/useSettings'

const { isDark, toggleTheme } = useTheme()
const { familyName } = useSettings()

const todayDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const themeIcon = computed(() => isDark.value ? 'fas fa-sun' : 'fas fa-moon')
</script>

<template>
  <header class="app-header">
    <div class="header-content">
      <div class="header-left">
        <h1 class="app-title">{{ familyName || 'Debt Free' }}</h1>
        <p class="app-subtitle">{{ todayDate }}</p>
      </div>
      <button class="btn-icon" @click="toggleTheme" title="สลับธีม">
        <i :class="themeIcon"></i>
      </button>
    </div>
  </header>
</template>
