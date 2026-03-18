<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <h1 class="section-title">Job Assignment</h1>
        <p class="section-subtitle">Assign incoming vehicles to supervisors.</p>
      </div>
      <div class="flex items-center gap-2 text-sm text-slate-400 bg-surface-card border border-surface-border rounded-lg px-3 py-2">
        <span class="pulse-dot" />
        <span>{{ store.awaitingVehicles.length }} vehicle(s) waiting</span>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="store.awaitingVehicles.length === 0" class="card flex flex-col items-center justify-center py-16 text-center">
      <div class="text-5xl mb-4">🎉</div>
      <p class="font-semibold text-slate-300">No Vehicles Awaiting Assignment</p>
      <p class="text-sm text-slate-500 mt-1">All vehicles have been assigned. Check back soon.</p>
    </div>

    <!-- Vehicle grid -->
    <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="vehicle in store.awaitingVehicles"
        :key="vehicle.id"
        class="card-sm flex flex-col gap-4 hover:border-slate-600 transition-colors"
      >
        <!-- Vehicle info -->
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-xl">
              🚗
            </div>
            <div>
              <p class="font-bold text-slate-100 font-mono tracking-widest text-sm">{{ vehicle.licensePlate }}</p>
              <p class="text-xs text-slate-500">ID: {{ vehicle.id }}</p>
            </div>
          </div>
          <span v-if="vehicle.isNewCar" class="badge-yellow shrink-0">ON TEST</span>
          <span v-else class="badge-blue shrink-0">Standard</span>
        </div>

        <!-- Meta -->
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="bg-surface rounded-lg p-2.5">
            <p class="text-slate-500 mb-0.5">Entry Time</p>
            <p class="text-slate-200 font-medium">{{ formatTime(vehicle.entryTime) }}</p>
          </div>
          <div class="bg-surface rounded-lg p-2.5">
            <p class="text-slate-500 mb-0.5">Photo</p>
            <p class="text-slate-200 font-medium">{{ vehicle.photo ? '✅ Captured' : '❌ None' }}</p>
          </div>
        </div>

        <!-- Assign form -->
        <div>
          <label :for="`supervisor-${vehicle.id}`" class="form-label">Assign Supervisor</label>
          <select
            :id="`supervisor-${vehicle.id}`"
            v-model="selectedSupervisors[vehicle.id]"
            class="form-select"
          >
            <option value="" disabled>— Select a supervisor —</option>
            <option
              v-for="sup in store.supervisors"
              :key="sup.id"
              :value="sup.id"
            >
              {{ sup.name }}
            </option>
          </select>
        </div>

        <button
          class="btn-primary w-full"
          :disabled="!selectedSupervisors[vehicle.id] || store.loading"
          @click="assign(vehicle.id)"
        >
          <span v-if="store.loading && assigningId === vehicle.id" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span v-else>👤</span>
          Assign &amp; Dispatch
        </button>
      </div>
    </div>

    <!-- All vehicles table (overview) -->
    <div class="card">
      <h2 class="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
        <span>📊</span> All Vehicles Overview
      </h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-surface-border text-xs text-slate-500 uppercase tracking-wide">
              <th class="text-left py-2 px-3 font-semibold">ID</th>
              <th class="text-left py-2 px-3 font-semibold">Plate</th>
              <th class="text-left py-2 px-3 font-semibold">Supervisor</th>
              <th class="text-left py-2 px-3 font-semibold">Status</th>
              <th class="text-left py-2 px-3 font-semibold">Entry</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="v in store.vehicles"
              :key="v.id"
              class="border-b border-surface-border/50 hover:bg-white/[0.02] transition-colors"
            >
              <td class="py-3 px-3 text-slate-400 font-mono text-xs">{{ v.id }}</td>
              <td class="py-3 px-3 font-mono font-bold text-slate-200 tracking-widest">{{ v.licensePlate }}</td>
              <td class="py-3 px-3 text-slate-300">{{ v.assignedSupervisor?.name ?? '—' }}</td>
              <td class="py-3 px-3">
                <span :class="statusBadge(v.status)">{{ v.status }}</span>
              </td>
              <td class="py-3 px-3 text-slate-500">{{ formatTime(v.entryTime) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useWorkshopStore } from '../store/workshop.js'

const store = useWorkshopStore()
const selectedSupervisors = reactive({})
const assigningId = ref(null)

async function assign(vehicleId) {
  const supId = selectedSupervisors[vehicleId]
  if (!supId) return
  const supervisor = store.supervisors.find((s) => s.id === supId)
  assigningId.value = vehicleId
  await store.assignSupervisor(vehicleId, supervisor)
  delete selectedSupervisors[vehicleId]
  assigningId.value = null
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

const STATUS_BADGE_MAP = {
  AwaitingAssignment: 'badge-yellow',
  InExecution:        'badge-blue',
  PendingApproval:    'badge-purple',
  PendingPayment:     'badge-warning',
  Completed:          'badge-green',
}
function statusBadge(status) {
  return STATUS_BADGE_MAP[status] ?? 'badge-gray'
}
</script>
