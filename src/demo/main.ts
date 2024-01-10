import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { i18n } from './i18n'
import { LiveTranslatorPlugin, TranslationMeta } from '../index'

const app = createApp(App)
app.use(i18n)

app.use(LiveTranslatorPlugin, {
  translationLink(meta: TranslationMeta) {
    return `?meta=${encodeURIComponent(JSON.stringify(meta))}`
  },
  persist: true,
  root: document.getElementById('app'),
  refreshRate: 200,
})

app.mount('#app')
