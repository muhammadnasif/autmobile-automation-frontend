<template>
  <div class="max-w-4xl mx-auto space-y-8">
    <!-- Header -->
    <div class="text-center">
      <div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-3xl shadow-xl shadow-brand-900/40 mb-4">
        🚗
      </div>
      <h1 class="text-2xl sm:text-3xl font-bold text-slate-100">Client Vehicle Tracking</h1>
      <p class="text-slate-400 mt-2">Track your vehicle's progress in real-time</p>
    </div>

    <!-- Error/Not Found -->
    <div v-if="!vehicle && !loading" class="card flex flex-col items-center justify-center py-16 text-center border-rose-500/20 bg-rose-500/5">
      <div class="text-5xl mb-4">🔍</div>
      <p class="font-semibold text-rose-300">Vehicle Not Found</p>
      <p class="text-sm text-slate-500 mt-1">We couldn't find a vehicle with the ID or license plate: <span class="text-white font-mono">{{ queryId }}</span></p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Vehicle card mapping heavily from VehicleTrackingView.vue -->
    <div v-if="vehicle && !loading" class="card space-y-6 overflow-hidden">
      <!-- Card header -->
      <div class="flex flex-wrap items-start justify-between gap-4 border-b border-surface-border pb-6">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-xl flex items-center justify-center text-3xl shrink-0" :class="statusGradient(vehicle.status)">🚗</div>
          <div>
            <p class="font-bold text-slate-100 font-mono tracking-widest text-2xl mb-1">{{ vehicle.licensePlate }}</p>
            <p class="text-sm text-slate-500">
              <span class="font-mono text-slate-400">{{ vehicle.id }}</span>
              · Entered: <span class="text-slate-300">{{ formatDate(vehicle.entryTime) }}</span>
            </p>
          </div>
        </div>
        <div class="flex flex-col items-end gap-2">
          <span v-if="vehicle.isNewCar" class="badge-yellow text-sm px-3 py-1">ON TEST</span>
          <span class="text-sm font-bold px-4 py-1.5 rounded-full border border-surface-border bg-surface shadow-sm" :class="statusBadgeClass(vehicle.status)">
            {{ statusLabel(vehicle.status) }}
          </span>
        </div>
      </div>

      <!-- Timeline -->
      <div class="overflow-x-auto pb-4 pt-2">
        <div class="flex items-start min-w-max gap-0 justify-center">
          <template v-for="(stage, idx) in STAGES" :key="stage.num">
            <!-- Stage node -->
            <div class="flex flex-col items-center" style="width:110px">
              <!-- Circle -->
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center font-bold text-base border-2 transition-all duration-300 relative z-10"
                :class="nodeClass(stage.num, currentStage(vehicle.status))">
                <template v-if="stage.num < currentStage(vehicle.status)">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </template>
                <template v-else-if="stage.num === currentStage(vehicle.status)">
                  <span>{{ stage.icon }}</span>
                  <span class="absolute inset-0 rounded-full animate-ping opacity-30" :class="pingClass(vehicle.status)" />
                </template>
                <template v-else>
                  <span class="text-sm font-semibold opacity-70">{{ stage.num }}</span>
                </template>
              </div>
              <!-- Labels -->
              <p class="text-center mt-3 text-[11px] font-bold tracking-wide uppercase leading-tight px-1"
                :class="stage.num <= currentStage(vehicle.status) ? 'text-slate-200' : 'text-slate-500'">{{ stage.label }}</p>
            </div>

            <!-- Connector line -->
            <div v-if="idx < STAGES.length - 1"
              class="h-1 flex-1 self-start mt-5.5 mx-0 rounded-full transition-all duration-500"
              :class="lineClass(stage.num, currentStage(vehicle.status))" style="min-width:30px; margin-top:22px" />
          </template>
        </div>
      </div>

      <!-- Info strip -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 p-4 rounded-xl bg-surface border border-surface-border">
        <div v-if="vehicle.initialGatepass" class="flex flex-col gap-1">
           <span class="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Initial Gatepass</span>
           <span class="text-sm font-bold text-slate-200 font-mono">{{ vehicle.initialGatepass }}</span>
        </div>
        <div v-if="vehicle.exitGatepass" class="flex flex-col gap-1">
           <span class="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Exit Gatepass</span>
           <span class="text-sm font-bold text-emerald-400 font-mono">{{ vehicle.exitGatepass }}</span>
        </div>
        <div v-if="vehicle.quotationAmount" class="flex flex-col gap-1">
           <span class="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Quotation / Estimate</span>
           <span class="text-sm font-bold text-slate-200 font-mono">BDT {{ Number(vehicle.quotationAmount).toLocaleString() }}</span>
        </div>
        <div v-if="vehicle.finalBillAmount" class="flex flex-col gap-1">
           <span class="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Final Approved Bill</span>
           <span class="text-sm font-bold text-emerald-400 font-mono">BDT {{ Number(vehicle.finalBillAmount).toLocaleString() }}</span>
        </div>
        <div v-if="vehicle.receiptNo" class="flex flex-col gap-1">
           <span class="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Payment Receipt</span>
           <span class="text-sm font-bold text-emerald-400 font-mono">{{ vehicle.receiptNo }}</span>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useWorkshopStore, STATUS } from '../store/workshop.js'

const route = useRoute()
const store = useWorkshopStore()

const queryId = computed(() => route.params.id || '')
const vehicle = ref(null)
const loading = ref(true)

const STAGES = [
  { num: 1, label: 'Entry', icon: '🛡️' },
  { num: 2, label: 'Assigned', icon: '👔' },
  { num: 3, label: 'In Execution', icon: '🔧' },
  { num: 4, label: 'Review', icon: '📋' },
  { num: 5, label: 'Exit Verify', icon: '🚪' },
  { num: 6, label: 'Payment', icon: '💰' },
  { num: 7, label: 'Completed', icon: '✅' },
]

const STATUS_TO_STAGE = {
  [STATUS.AWAITING_ASSIGNMENT]: 2,
  [STATUS.IN_EXECUTION]: 3,
  [STATUS.PENDING_APPROVAL]: 4,
  [STATUS.AWAITING_EXIT_CONFIRMATION]: 5,
  [STATUS.PENDING_PAYMENT]: 6,
  [STATUS.COMPLETED]: 7,
}

function currentStage(status) {
  return STATUS_TO_STAGE[status] ?? 1
}

onMounted(() => {
  // Simulate fetch
  setTimeout(() => {
    const q = queryId.value.trim().toLowerCase()
    const found = store.vehicles.find(v => v.id.toLowerCase() === q || v.licensePlate.toLowerCase() === q)
    vehicle.value = found || null
    loading.value = false
  }, 600)
})

function nodeClass(stageNum, active) {
  if (stageNum < active) return 'bg-emerald-500 border-emerald-500 text-white'
  if (stageNum === active) return 'bg-brand-600 border-brand-400 text-white shadow-lg shadow-brand-900/50'
  return 'bg-surface border-surface-border text-slate-600'
}

function pingClass(status) {
  if (status === STATUS.COMPLETED) return 'bg-emerald-400'
  return 'bg-brand-400'
}

function lineClass(stageNum, active) {
  if (stageNum < active - 1) return 'bg-emerald-500' // fully completed
  if (stageNum === active - 1) return 'bg-gradient-to-r from-emerald-500 to-brand-500' // last completed to active
  return 'bg-surface-border' // upcoming
}

function statusGradient(status) {
  const map = {
    [STATUS.AWAITING_ASSIGNMENT]: 'bg-gradient-to-br from-slate-800 to-slate-600',
    [STATUS.IN_EXECUTION]: 'bg-gradient-to-br from-brand-800 to-brand-600',
    [STATUS.PENDING_APPROVAL]: 'bg-gradient-to-br from-yellow-900 to-yellow-700',
    [STATUS.AWAITING_EXIT_CONFIRMATION]: 'bg-gradient-to-br from-amber-900 to-amber-700',
    [STATUS.PENDING_PAYMENT]: 'bg-gradient-to-br from-orange-900 to-orange-700',
    [STATUS.COMPLETED]: 'bg-gradient-to-br from-emerald-900 to-emerald-700',
  }
  return map[status] ?? 'bg-surface'
}

function statusBadgeClass(status) {
  const map = {
    [STATUS.AWAITING_ASSIGNMENT]: 'bg-slate-700/40 text-slate-300 border-slate-600',
    [STATUS.IN_EXECUTION]: 'bg-brand-500/20 text-brand-300 border-brand-500/40',
    [STATUS.PENDING_APPROVAL]: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    [STATUS.AWAITING_EXIT_CONFIRMATION]: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    [STATUS.PENDING_PAYMENT]: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    [STATUS.COMPLETED]: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  }
  return map[status] ?? ''
}

function statusLabel(status) {
  const map = {
    [STATUS.AWAITING_ASSIGNMENT]: '⏳ Awaiting Assignment',
    [STATUS.IN_EXECUTION]: '🔧 In Execution',
    [STATUS.PENDING_APPROVAL]: '📋 Pending DM Review',
    [STATUS.AWAITING_EXIT_CONFIRMATION]: '🚪 Awaiting Exit Verify',
    [STATUS.PENDING_PAYMENT]: '💰 Pending Payment',
    [STATUS.COMPLETED]: '✅ Completed',
  }
  return map[status] ?? status
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
  })
}
</script>
