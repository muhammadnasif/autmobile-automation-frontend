<template>
  <div class="space-y-6">
    <!-- ── Header ────────────────────────────────────────────────────────── -->
    <div>
      <h1 class="section-title">Vehicle Tracking</h1>
      <p class="section-subtitle">Real-time status of every vehicle in the workshop pipeline.</p>
    </div>

    <!-- ── Stats row ─────────────────────────────────────────────────────── -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <div v-for="stat in stats" :key="stat.label"
        class="rounded-xl border p-3 cursor-pointer transition-all duration-150 select-none" :class="[
          activeFilter === stat.filter
            ? 'border-brand-500 bg-brand-500/10 ring-1 ring-brand-500/40'
            : 'border-surface-border bg-surface-card hover:border-slate-500',
        ]" @click="activeFilter = activeFilter === stat.filter ? 'all' : stat.filter">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-lg">{{ stat.icon }}</span>
          <span class="text-xl font-bold font-mono" :class="stat.countClass">{{ stat.count }}</span>
        </div>
        <p class="text-[11px] text-slate-500 font-medium leading-tight">{{ stat.label }}</p>
      </div>
    </div>

    <!-- ── Filter / Search bar ───────────────────────────────────────────── -->
    <div class="flex flex-wrap items-center gap-3">
      <input v-model="search" type="text" placeholder="Search by license plate or vehicle ID…"
        class="form-input flex-1 min-w-48" />
      <button v-if="activeFilter !== 'all' || search" class="btn-secondary btn-sm"
        @click="activeFilter = 'all'; search = ''">
        ✕ Clear filters
      </button>
      <span class="text-xs text-slate-500">{{ filteredVehicles.length }} vehicle(s)</span>
    </div>

    <!-- ── Empty state ───────────────────────────────────────────────────── -->
    <div v-if="filteredVehicles.length === 0" class="card flex flex-col items-center justify-center py-16 text-center">
      <div class="text-5xl mb-4">🔍</div>
      <p class="font-semibold text-slate-300">No vehicles found</p>
      <p class="text-sm text-slate-500 mt-1">Try adjusting your filters or log a new vehicle via the Security Guard
        view.</p>
    </div>

    <!-- ── Vehicle cards ────────────────────────────────────────────────── -->
    <div v-else class="space-y-4">
      <div v-for="vehicle in filteredVehicles" :key="vehicle.id" class="card space-y-4 overflow-hidden">
        <!-- Card header -->
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
              :class="statusGradient(vehicle.status)">🚗</div>
            <div>
              <p class="font-bold text-slate-100 font-mono tracking-widest text-lg">{{ vehicle.licensePlate }}</p>
              <p class="text-xs text-slate-500">
                {{ vehicle.id }}
                <template v-if="vehicle.assignedSupervisor"> · Supervisor: <span class="text-slate-300">{{
                  vehicle.assignedSupervisor.name }}</span></template>
                · Entered: <span class="text-slate-300">{{ formatDate(vehicle.entryTime) }}</span>
              </p>
            </div>
          </div>
          <div class="flex flex-wrap gap-2 items-center">
            <span v-if="vehicle.isNewCar" class="badge-yellow">ON TEST</span>
            <span class="text-xs font-semibold px-3 py-1 rounded-full border" :class="statusBadgeClass(vehicle.status)">
              {{ statusLabel(vehicle.status) }}
            </span>
          </div>
        </div>

        <!-- ── Timeline ─────────────────────────────────────────────────── -->
        <div class="overflow-x-auto pb-1">
          <div class="flex items-start min-w-max gap-0">
            <template v-for="(stage, idx) in STAGES" :key="stage.num">
              <!-- Stage node -->
              <div class="flex flex-col items-center" style="width:96px">
                <!-- Circle -->
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300 relative"
                  :class="nodeClass(stage.num, currentStage(vehicle.status))">
                  <!-- Completed checkmark -->
                  <template v-if="stage.num < currentStage(vehicle.status)">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </template>
                  <!-- Active stage icon (with pulse ring) -->
                  <template v-else-if="stage.num === currentStage(vehicle.status)">
                    <span>{{ stage.icon }}</span>
                    <span class="absolute inset-0 rounded-full animate-ping opacity-30"
                      :class="pingClass(vehicle.status)" />
                  </template>
                  <!-- Upcoming: show number -->
                  <template v-else>
                    <span class="text-xs">{{ stage.num }}</span>
                  </template>
                </div>
                <!-- Labels -->
                <p class="text-center mt-1.5 text-[10px] font-semibold leading-tight px-1"
                  :class="stage.num <= currentStage(vehicle.status) ? 'text-slate-200' : 'text-slate-600'">{{
                  stage.label }}</p>
                <p class="text-center text-[9px] leading-tight px-1"
                  :class="stage.num <= currentStage(vehicle.status) ? 'text-slate-400' : 'text-slate-700'">{{
                  stage.sublabel }}</p>
                <!-- Timestamp pill (if available) -->
                <div v-if="stageTimestamp(vehicle, stage.num)"
                  class="mt-1 text-[9px] text-emerald-400 font-mono text-center">
                  {{ stageTimestamp(vehicle, stage.num) }}
                </div>
              </div>

              <!-- Connector line (between nodes) -->
              <div v-if="idx < STAGES.length - 1"
                class="h-0.5 flex-1 self-start mt-5 mx-1 rounded-full transition-all duration-500"
                :class="lineClass(stage.num, currentStage(vehicle.status))" style="min-width:20px" />
            </template>
          </div>
        </div>

        <!-- Quick info strip -->
        <div class="flex flex-wrap gap-x-6 gap-y-1 pt-1 border-t border-surface-border text-xs text-slate-500">
          <span v-if="vehicle.quotationAmount">
            🧾 Quoted: <strong class="text-slate-300 font-mono">BDT {{ Number(vehicle.quotationAmount).toLocaleString()
              }}</strong>
          </span>
          <span v-if="vehicle.finalBillAmount">
            ✅ Approved: <strong class="text-emerald-400 font-mono">BDT {{
              Number(vehicle.finalBillAmount).toLocaleString()
              }}</strong>
          </span>
          <span v-if="vehicle.initialGatepass">
            📄 Initial GP: <strong class="text-slate-300 font-mono">{{ vehicle.initialGatepass }}</strong>
          </span>
          <span v-if="vehicle.exitGatepass">
            🚪 Exit GP: <strong class="text-emerald-400 font-mono">{{ vehicle.exitGatepass }}</strong>
          </span>
          <span v-if="vehicle.receiptNo">
            🧾 Receipt: <strong class="text-slate-300 font-mono">{{ vehicle.receiptNo }}</strong>
          </span>
          <span v-if="vehicle.issues?.length">
            🔧 Issues: <strong class="text-slate-300">{{ vehicle.issues.length }} item(s)</strong>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useWorkshopStore, STATUS } from '../store/workshop.js'

const store = useWorkshopStore()

// ── Stage definitions ─────────────────────────────────────────────────────────
const STAGES = [
  { num: 1, label: 'Entry', sublabel: 'Security Guard', icon: '🛡️' },
  { num: 2, label: 'Assigned', sublabel: 'Manager', icon: '👔' },
  { num: 3, label: 'In Execution', sublabel: 'Supervisor', icon: '🔧' },
  { num: 4, label: 'DM Review', sublabel: 'Deputy Manager', icon: '📋' },
  { num: 5, label: 'Exit Verify', sublabel: 'Supervisor', icon: '🚪' },
  { num: 6, label: 'Payment', sublabel: 'Cashier', icon: '💰' },
  { num: 7, label: 'Completed', sublabel: '', icon: '✅' },
]

// Maps status → which stage number is currently ACTIVE
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

// ── Filters / search ──────────────────────────────────────────────────────────
const search = ref('')
const activeFilter = ref('all')

const stats = computed(() => [
  {
    filter: 'all',
    label: 'Total Vehicles',
    icon: '🚗',
    count: store.vehicles.length,
    countClass: 'text-slate-200',
  },
  {
    filter: STATUS.IN_EXECUTION,
    label: 'In Execution',
    icon: '🔧',
    count: store.vehicles.filter(v => v.status === STATUS.IN_EXECUTION).length,
    countClass: 'text-brand-400',
  },
  {
    filter: STATUS.PENDING_APPROVAL,
    label: 'DM Review',
    icon: '📋',
    count: store.vehicles.filter(v => v.status === STATUS.PENDING_APPROVAL).length,
    countClass: 'text-yellow-400',
  },
  {
    filter: STATUS.AWAITING_EXIT_CONFIRMATION,
    label: 'Exit Verify',
    icon: '🚪',
    count: store.vehicles.filter(v => v.status === STATUS.AWAITING_EXIT_CONFIRMATION).length,
    countClass: 'text-amber-400',
  },
  {
    filter: STATUS.PENDING_PAYMENT,
    label: 'Pending Payment',
    icon: '💰',
    count: store.vehicles.filter(v => v.status === STATUS.PENDING_PAYMENT).length,
    countClass: 'text-orange-400',
  },
  {
    filter: STATUS.COMPLETED,
    label: 'Completed',
    icon: '✅',
    count: store.vehicles.filter(v => v.status === STATUS.COMPLETED).length,
    countClass: 'text-emerald-400',
  },
])

const filteredVehicles = computed(() => {
  let list = [...store.vehicles].reverse() // newest first
  if (activeFilter.value !== 'all') {
    list = list.filter(v => v.status === activeFilter.value)
  }
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    list = list.filter(
      v => v.licensePlate.toLowerCase().includes(q) || v.id.toLowerCase().includes(q)
    )
  }
  return list
})

// ── Styling helpers ───────────────────────────────────────────────────────────
function nodeClass(stageNum, active) {
  if (stageNum < active) return 'bg-emerald-500 border-emerald-500 text-white'
  if (stageNum === active) return 'bg-brand-600  border-brand-400  text-white shadow-lg shadow-brand-900/50'
  return 'bg-surface border-surface-border text-slate-600'
}

function pingClass(status) {
  if (status === STATUS.COMPLETED) return 'bg-emerald-400'
  return 'bg-brand-400'
}

function lineClass(stageNum, active) {
  // Line after stage stageNum
  if (stageNum < active - 1) return 'bg-emerald-500'           // fully completed segment
  if (stageNum === active - 1) return 'bg-gradient-to-r from-emerald-500 to-brand-500' // last completed → active
  return 'bg-surface-border'                                    // upcoming
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
    [STATUS.PENDING_APPROVAL]: '📋 Pending DM Approval',
    [STATUS.AWAITING_EXIT_CONFIRMATION]: '🚪 Awaiting Exit Confirmation',
    [STATUS.PENDING_PAYMENT]: '💰 Pending Payment',
    [STATUS.COMPLETED]: '✅ Completed',
  }
  return map[status] ?? status
}

// Optional micro-timestamps (shown when data is available)
function stageTimestamp(vehicle, stageNum) {
  const active = currentStage(vehicle.status)
  if (stageNum === 1) return formatTime(vehicle.entryTime)
  if (stageNum === active && vehicle.status === STATUS.COMPLETED) return 'Done'
  return null
}

function formatTime(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-PK', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
  })
}
</script>
