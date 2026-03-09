import { ref, watch } from 'vue'

const ALERT_DAYS_KEY = 'df_alert_days'
const FAMILY_NAME_KEY = 'df_family_name'

const alertDays = ref<number>(parseInt(localStorage.getItem(ALERT_DAYS_KEY) || '3'))
const familyName = ref<string>(localStorage.getItem(FAMILY_NAME_KEY) || '')

watch(alertDays, val => localStorage.setItem(ALERT_DAYS_KEY, String(val)))
watch(familyName, val => localStorage.setItem(FAMILY_NAME_KEY, val))

export function useSettings() {
  return { alertDays, familyName }
}
