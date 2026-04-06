import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { crossTabSyncPlugin } from './store/sync-plugin.js'
import router from './router/index.js'
import App from './App.vue'
import './style.css'

const pinia = createPinia()
pinia.use(crossTabSyncPlugin)

const app = createApp(App)
app.use(pinia)
app.use(router)
app.mount('#app')
