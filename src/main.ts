import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import { useFontSize } from './composables/useFontSize'

useFontSize()

createApp(App).mount('#app')
