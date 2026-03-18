<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between flex-wrap gap-3">
      <div>
        <h1 class="section-title">Billing Finalization</h1>
        <p class="section-subtitle">Review completed jobs and approve final bill amounts.</p>
      </div>
      <div
        class="flex items-center gap-2 text-sm text-slate-400 bg-surface-card border border-surface-border rounded-lg px-3 py-2">
        <span class="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
        <span>{{ store.completedPendingApproval.length }} pending review</span>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="store.completedPendingApproval.length === 0"
      class="card flex flex-col items-center justify-center py-16 text-center">
      <div class="text-5xl mb-4">✅</div>
      <p class="font-semibold text-slate-300">No Jobs Pending Approval</p>
      <p class="text-sm text-slate-500 mt-1">Completed jobs marked by supervisors will appear here.</p>
    </div>

    <!-- Pending approval cards -->
    <div v-else class="space-y-4">
      <div v-for="vehicle in store.completedPendingApproval" :key="vehicle.id"
        class="card border-l-4 border-l-violet-500 space-y-5">
        <!-- Vehicle header -->
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-900 to-violet-700 flex items-center justify-center text-2xl">
              🚗
            </div>
            <div>
              <p class="font-bold text-slate-100 font-mono tracking-widest">{{ vehicle.licensePlate }}</p>
              <p class="text-xs text-slate-500">{{ vehicle.id }} · Supervisor: {{ vehicle.assignedSupervisor?.name ??
                '—' }}</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <span v-if="vehicle.isNewCar" class="badge-yellow">ON TEST</span>
            <span class="badge-purple">Pending Approval</span>
          </div>
        </div>

        <!-- Issues breakdown -->
        <div v-if="vehicle.issues?.length > 0" class="bg-surface rounded-xl overflow-hidden">
          <div class="px-4 py-2.5 border-b border-surface-border flex items-center justify-between">
            <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Reported Issues & Quotation</h3>
            <span class="badge-blue">{{ vehicle.issues.length }} items</span>
          </div>
          <table class="w-full text-sm">
            <thead>
              <tr class="text-xs text-slate-500 uppercase tracking-wide border-b border-surface-border">
                <th class="text-left px-4 py-2 font-semibold">#</th>
                <th class="text-left px-4 py-2 font-semibold">Description</th>
                <th class="text-right px-4 py-2 font-semibold">Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(issue, idx) in vehicle.issues" :key="idx" class="border-b border-surface-border/50">
                <td class="px-4 py-2.5 text-slate-500">{{ idx + 1 }}</td>
                <td class="px-4 py-2.5 text-slate-300">{{ issue.description || '—' }}</td>
                <td class="px-4 py-2.5 text-right font-mono text-slate-200">
                  BDT {{ Number(issue.estimatedCost || 0).toLocaleString() }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="bg-surface-card/50">
                <td colspan="2" class="px-4 py-3 text-right font-semibold text-slate-300 text-sm">Quoted Total</td>
                <td class="px-4 py-3 text-right font-bold text-slate-100 font-mono text-sm">
                  BDT {{ Number(vehicle.quotationAmount || 0).toLocaleString() }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- No issues -->
        <div v-else class="bg-surface rounded-xl p-4 text-sm text-slate-500 text-center">
          No issues were logged on the job card.
        </div>

        <!-- Bill adjustment form -->
        <div class="bg-surface rounded-xl p-4 space-y-4">
          <h3 class="text-sm font-semibold text-slate-200">💼 Bill Negotiation / Adjustment</h3>
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label :for="`quoted-${vehicle.id}`" class="form-label">Quoted Amount (BDT)</label>
              <input :id="`quoted-${vehicle.id}`" type="text"
                :value="`BDT ${Number(vehicle.quotationAmount || 0).toLocaleString()}`" disabled
                class="form-input opacity-50 cursor-not-allowed" />
            </div>
            <div>
              <label :for="`final-${vehicle.id}`" class="form-label">Final Approved Amount (BDT) *</label>
              <input :id="`final-${vehicle.id}`" v-model="billForms[vehicle.id]" type="number" min="0"
                class="form-input" :class="{ 'border-rose-500': billErrors[vehicle.id] }"
                placeholder="Enter negotiated amount" />
              <p v-if="billErrors[vehicle.id]" class="text-rose-400 text-xs mt-1">{{ billErrors[vehicle.id] }}</p>
            </div>
          </div>

          <!-- Adjustment indicator -->
          <div v-if="billForms[vehicle.id] && vehicle.quotationAmount" class="flex items-center gap-2 text-xs"
            :class="adjustmentClass(vehicle)">
            <span>{{ adjustmentIcon(vehicle) }}</span>
            <span>{{ adjustmentText(vehicle) }}</span>
          </div>

          <div class="flex items-center gap-2 text-xs text-slate-500">
            <span>ℹ️</span>
            <span>This amount will be sent to the cashier for payment collection.</span>
          </div>
        </div>

        <!-- Approve action -->
        <button class="btn-success w-full btn-lg" :disabled="store.loading" @click="approveBill(vehicle.id)">
          <span v-if="approvingId === vehicle.id"
            class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span v-else>✅</span>
          Approve Final Bill
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useWorkshopStore } from '../store/workshop.js'

const store = useWorkshopStore()
const billForms = reactive({})
const billErrors = reactive({})
const approvingId = ref(null)

function adjustmentClass(vehicle) {
  const diff = Number(billForms[vehicle.id]) - Number(vehicle.quotationAmount)
  if (diff < 0) return 'text-emerald-400'
  if (diff > 0) return 'text-amber-400'
  return 'text-slate-400'
}

function adjustmentIcon(vehicle) {
  const diff = Number(billForms[vehicle.id]) - Number(vehicle.quotationAmount)
  if (diff < 0) return '⬇️'
  if (diff > 0) return '⬆️'
  return '➡️'
}

function adjustmentText(vehicle) {
  const diff = Number(billForms[vehicle.id]) - Number(vehicle.quotationAmount)
  const abs = Math.abs(diff).toLocaleString()
  if (diff < 0) return `Discounted by BDT ${abs}`
  if (diff > 0) return `Increased by BDT ${abs}`
  return 'No change from quotation'
}

async function approveBill(vehicleId) {
  const amount = billForms[vehicleId]
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    billErrors[vehicleId] = 'Please enter a valid positive amount.'
    return
  }
  billErrors[vehicleId] = ''
  approvingId.value = vehicleId
  await store.approveBill(vehicleId, Number(amount))
  delete billForms[vehicleId]
  approvingId.value = null
}
</script>
