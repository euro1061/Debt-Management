import { ref, watch } from 'vue'

const STORAGE_KEY = 'df_font_size'

type FontSize = 'small' | 'medium' | 'large' | 'xlarge'

const fontSizeMap: Record<FontSize, number> = {
  small: 14,
  medium: 16,
  large: 18,
  xlarge: 20
}

const currentSize = ref<FontSize>((localStorage.getItem(STORAGE_KEY) as FontSize) || 'medium')

function applyFontSize(size: FontSize) {
  document.documentElement.style.fontSize = `${fontSizeMap[size]}px`
}

applyFontSize(currentSize.value)

watch(currentSize, (val) => {
  localStorage.setItem(STORAGE_KEY, val)
  applyFontSize(val)
})

export function useFontSize() {
  return {
    currentSize,
    fontSizeMap,
    setSize(size: FontSize) {
      currentSize.value = size
    }
  }
}
