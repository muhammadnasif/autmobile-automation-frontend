import { defineStore } from 'pinia'
import { translations, interpolate } from '../locales/translations.js'

const STORAGE_KEY = 'app_language'
const THEME_KEY = 'app_theme'

export const useLocaleStore = defineStore('locale', {
  state: () => ({
    language: localStorage.getItem(STORAGE_KEY) || 'en',
    theme: localStorage.getItem(THEME_KEY) || 'dark',
  }),

  getters: {
    isBangla: (state) => state.language === 'bn',
    isDark: (state) => state.theme === 'dark',

    t: (state) => (key, params) => {
      const lang = state.language
      const dict = translations[lang] || translations.en
      const raw = dict[key]
      const str = raw != null ? raw : (translations.en[key] ?? key)
      return params && typeof str === 'string' ? interpolate(str, params) : str
    },

    /** Role label for sidebar/header from route meta.role */
    roleLabel: (state) => (role) => {
      if (!role) return ''
      const keyMap = {
        'Security Guard': 'role.securityGuard',
        'Manager': 'role.manager',
        'Supervisor': 'role.supervisor',
        'Deputy Manager': 'role.deputyManager',
        'Cashier': 'role.cashier',
        'Tracking': 'role.tracking',
      }
      const key = keyMap[role]
      return key ? (translations[state.language]?.[key] ?? translations.en[key] ?? role) : role
    },
  },

  actions: {
    setLanguage(lang) {
      this.language = lang === 'bn' ? 'bn' : 'en'
      localStorage.setItem(STORAGE_KEY, this.language)
    },

    toggleLanguage() {
      this.language = this.language === 'bn' ? 'en' : 'bn'
      localStorage.setItem(STORAGE_KEY, this.language)
    },

    setTheme(theme) {
      this.theme = theme === 'light' ? 'light' : 'dark'
      localStorage.setItem(THEME_KEY, this.theme)
      this.applyTheme()
    },

    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem(THEME_KEY, this.theme)
      this.applyTheme()
    },

    applyTheme() {
      const root = document.documentElement
      root.classList.remove('light-mode', 'dark-mode')
      root.classList.add(this.theme === 'dark' ? 'dark-mode' : 'light-mode')
    },
  },
})
