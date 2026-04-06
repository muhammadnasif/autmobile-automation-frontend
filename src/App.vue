<template>
  <div v-if="!isPublicRoute" class="flex h-screen overflow-hidden">
    <!-- Sidebar -->
    <aside class="w-64 shrink-0 bg-surface-card border-r border-surface-border flex flex-col">
      <!-- Logo -->
      <div class="px-5 py-5 border-b border-surface-border">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand-900/40">
            🚗
          </div>
          <div>
            <h1 class="font-bold text-slate-100 text-sm leading-tight">{{ locale.t('app.brand') }}</h1>
            <p class="text-[10px] text-slate-500 font-medium uppercase tracking-wide">{{ locale.t('app.managementSystem') }}</p>
          </div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <!-- Role-based dashboards -->
        <p class="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">
          {{ locale.t('app.dashboards') }}
        </p>
        <RouterLink
          v-for="route in roleDashboards"
          :key="route.name"
          :to="route.path"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative"
          :class="isActive(route.path)
            ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'"
        >
          <span class="text-base w-6 text-center">{{ route.meta?.icon }}</span>
          <div class="flex-1 min-w-0">
            <span class="block truncate">{{ locale.roleLabel(route.meta?.role) }}</span>
          </div>
          <!-- notification dot -->
          <span
            v-if="route.name === 'SupervisorDashboard' && unreadCount > 0"
            class="min-w-[18px] h-[18px] px-1 bg-brand-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
          >
            {{ unreadCount }}
          </span>
          <span
            v-if="isActive(route.path)"
            class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-500 rounded-r-full"
          />
        </RouterLink>

        <!-- Tools separator -->
        <div class="pt-3 pb-1">
          <p class="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3">
            {{ locale.t('app.tools') }}
          </p>
        </div>
        <RouterLink
          v-for="route in toolRoutes"
          :key="route.name"
          :to="route.path"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative"
          :class="isActive(route.path)
            ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'"
        >
          <span class="text-base w-6 text-center">{{ route.meta?.icon }}</span>
          <div class="flex-1 min-w-0">
            <span class="block truncate">{{ locale.roleLabel(route.meta?.role) }}</span>
          </div>
          <span
            v-if="isActive(route.path)"
            class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-500 rounded-r-full"
          />
        </RouterLink>
      </nav>

      <!-- Footer -->
      <div class="px-5 py-4 border-t border-surface-border">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
            A
          </div>
          <div class="text-xs">
            <p class="text-slate-300 font-medium">{{ locale.t('app.adminDemo') }}</p>
            <p class="text-slate-500">{{ locale.t('app.allRolesActive') }}</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- Topbar -->
      <header class="shrink-0 h-14 bg-surface-card border-b border-surface-border px-6 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-lg">{{ currentRoute?.meta?.icon }}</span>
          <h2 class="font-semibold text-slate-200 text-sm">
            {{ locale.roleLabel(currentRoute?.meta?.role) }}
          </h2>
          <span class="text-slate-600 text-sm">/</span>
          <span class="text-slate-400 text-sm">
            {{ pageSubtitle }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <!-- Language toggle -->
          <button
            class="btn-secondary btn-sm flex items-center gap-1.5"
            type="button"
            @click="locale.toggleLanguage()"
          >
            <span class="text-xs">
              {{ locale.isBangla ? locale.t('app.english') : locale.t('app.bangla') }}
            </span>
          </button>
          <!-- Theme toggle -->
          <button
            class="btn-secondary btn-sm flex items-center gap-1.5"
            type="button"
            @click="locale.toggleTheme()"
          >
            <span class="text-base" v-if="locale.isDark">🌙</span>
            <span class="text-base" v-else>☀️</span>
            <span class="text-xs">
              {{ locale.isDark ? (locale.isBangla ? locale.t('app.darkBn') : locale.t('app.dark')) : (locale.isBangla ? locale.t('app.lightBn') : locale.t('app.light')) }}
            </span>
          </button>
          <!-- Demo pill -->
          <div class="flex items-center gap-1.5 text-xs text-slate-500 bg-surface rounded-full px-3 py-1 border border-surface-border">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            {{ locale.t('app.liveDemoMode') }}
          </div>
        </div>
      </header>

      <div v-if="!isPublicRoute" class="flex-1 overflow-y-auto p-6">
        <RouterView />
      </div>
    </main>
  </div>
  <div v-else class="h-screen w-screen overflow-y-auto bg-surface p-4 sm:p-6 lg:p-8">
    <RouterView />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { RouterView, RouterLink, useRoute, useRouter } from 'vue-router'
import { useWorkshopStore } from './store/workshop.js'
import { useLocaleStore } from './store/locale.js'

const store = useWorkshopStore()
const locale = useLocaleStore()
const route = useRoute()
const router = useRouter()

const TITLE_KEYS = {
  'Vehicle Entry': 'title.vehicleEntry',
  'Job Assignment': 'title.jobAssignment',
  'Job Execution': 'title.jobExecution',
  'Billing Finalization': 'title.billingFinalization',
  'Checkout & Exit': 'title.checkoutExit',
  'Pipeline Overview': 'title.pipelineOverview',
}
const pageSubtitle = computed(() => {
  const title = currentRoute.value?.meta?.title
  const part = title?.split('–')[1]?.trim()
  if (!part) return ''
  const key = TITLE_KEYS[part]
  return key ? locale.t(key) : part
})

onMounted(() => {
  locale.applyTheme()
})

// Role-based dashboards (shown under "Dashboards" section)
const TOOL_NAMES = ['VehicleTracking', 'StoreKeeper']
const roleDashboards = computed(() =>
  router.getRoutes().filter((r) => r.meta?.role && !TOOL_NAMES.includes(r.name))
)
// Utility / tool routes (shown under "Tools" section)
const toolRoutes = computed(() =>
  router.getRoutes().filter((r) => TOOL_NAMES.includes(r.name))
)

const currentRoute = computed(() => route)
const isPublicRoute = computed(() => route.meta?.public === true)

const isActive = (path) => route.path === path

const unreadCount = computed(() => store.unreadNotifications.length)

function confirmReset() {
  if (window.confirm('Are you sure you want to reset all data to the initial state? This action cannot be undone.')) {
    store.resetAll()
  }
}
</script>
