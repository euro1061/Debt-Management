import { ref, watch } from 'vue'

const STORAGE_KEY = 'df_theme'

const isDark = ref(localStorage.getItem(STORAGE_KEY) === 'dark')

watch(isDark, (val) => {
  document.body.classList.toggle('dark', val)
  localStorage.setItem(STORAGE_KEY, val ? 'dark' : 'light')
})

document.body.classList.toggle('dark', isDark.value)

export function useTheme() {
  function toggleTheme() {
    isDark.value = !isDark.value
  }

  return { isDark, toggleTheme }
}
