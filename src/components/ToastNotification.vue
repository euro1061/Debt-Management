<script setup lang="ts">
defineProps<{ message: string; visible: boolean }>()
</script>

<template>
  <div class="toast" :class="{ hidden: !visible }">
    <i class="fas fa-check-circle"></i>
    <span>{{ message }}</span>
  </div>
</template>
