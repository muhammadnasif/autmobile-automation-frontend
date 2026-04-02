<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between flex-wrap gap-3">
      <div>
        <h1 class="section-title">{{ locale.t('deputy.title') }}</h1>
        <p class="section-subtitle">{{ locale.t('deputy.subtitle') }}</p>
      </div>
      <div
        class="flex items-center gap-2 text-sm text-slate-400 bg-surface-card border border-surface-border rounded-lg px-3 py-2">
        <span class="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
        <span>{{ locale.t('deputy.pendingReview', { count: store.completedPendingApproval.length }) }}</span>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="store.completedPendingApproval.length === 0"
      class="card flex flex-col items-center justify-center py-16 text-center">
      <div class="text-5xl mb-4">✅</div>
      <p class="font-semibold text-slate-300">{{ locale.t('deputy.noJobsPending') }}</p>
      <p class="text-sm text-slate-500 mt-1">{{ locale.t('deputy.completedJobsAppear') }}</p>
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
              <p class="text-xs text-slate-500">{{ vehicle.id }} · {{ locale.t('manager.supervisor') }}: {{ vehicle.assignedSupervisor?.name ??
                '—' }}</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <span v-if="vehicle.isNewCar" class="badge-yellow">{{ locale.t('manager.onTest') }}</span>
            <span class="badge-purple">{{ locale.t('status.pendingApproval') }}</span>
          </div>
        </div>

        <!-- Issues breakdown -->
        <div v-if="vehicle.issues?.length > 0" class="bg-surface rounded-xl overflow-hidden">
          <div class="px-4 py-2.5 border-b border-surface-border flex items-center justify-between">
            <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wide">{{ locale.t('deputy.reportedIssuesQuotation') }}</h3>
            <span class="badge-blue">{{ vehicle.issues.length }} {{ locale.t('deputy.items') }}</span>
          </div>
          <table class="w-full text-sm">
            <thead>
              <tr class="text-xs text-slate-500 uppercase tracking-wide border-b border-surface-border">
                <th class="text-left px-4 py-2 font-semibold">{{ locale.t('deputy.hash') }}</th>
                <th class="text-left px-4 py-2 font-semibold">{{ locale.t('deputy.description') }}</th>
                <th class="text-right px-4 py-2 font-semibold">{{ locale.t('deputy.estCost') }}</th>
                <th class="text-right px-4 py-2 font-semibold">Final Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(issue, idx) in vehicle.issues" :key="idx" class="border-b border-surface-border/50">
                <td class="px-4 py-2.5 text-slate-500">{{ idx + 1 }}</td>
                <td class="px-4 py-2.5 text-slate-300">{{ issue.description || '—' }}</td>
                <td class="px-4 py-2.5 text-right font-mono text-slate-400">
                  {{ Number(issue.estimatedCost || 0).toLocaleString() }}
                </td>
                <td class="px-4 py-2.5 text-right w-32">
                  <input v-if="itemForms[vehicle.id]" v-model="itemForms[vehicle.id][idx]" type="number" min="0" class="form-input text-right py-1 px-2 text-sm text-emerald-400 font-mono focus:ring-1 focus:ring-emerald-500" />
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="bg-surface-card/50">
                <td colspan="2" class="px-4 py-3 text-right font-semibold text-slate-300 text-sm">{{ locale.t('deputy.quotedTotal') }}</td>
                <td class="px-4 py-3 text-right font-bold text-slate-500 font-mono text-sm">
                  {{ Number(vehicle.quotationAmount || 0).toLocaleString() }}
                </td>
                <td class="px-4 py-3 text-right font-bold text-emerald-400 font-mono text-sm">
                  {{ Number(itemTotals[vehicle.id] || 0).toLocaleString() }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- No issues -->
        <div v-else class="bg-surface rounded-xl p-4 text-sm text-slate-500 text-center">
          {{ locale.t('deputy.noIssuesLogged') }}
        </div>

        <!-- Bill adjustment form -->
        <div class="bg-surface rounded-xl p-4 space-y-4">
          <h3 class="text-sm font-semibold text-slate-200">💼 {{ locale.t('deputy.billNegotiation') }}</h3>
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label :for="`quoted-${vehicle.id}`" class="form-label">{{ locale.t('deputy.quotedAmountBdt') }}</label>
              <input :id="`quoted-${vehicle.id}`" type="text"
                :value="`BDT ${Number(vehicle.quotationAmount || 0).toLocaleString()}`" disabled
                class="form-input opacity-50 cursor-not-allowed" />
            </div>
            <div>
              <label :for="`final-${vehicle.id}`" class="form-label">{{ locale.t('deputy.finalApprovedAmount') }}</label>
              <input :id="`final-${vehicle.id}`" v-model="billForms[vehicle.id]" type="number" min="0"
                class="form-input" :class="{ 'border-rose-500': billErrors[vehicle.id] }"
                :placeholder="locale.t('deputy.enterNegotiated')" />
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
            <span>{{ locale.t('deputy.amountSentToCashier') }}</span>
          </div>
        </div>

        <!-- Approve action -->
        <button class="btn-success w-full btn-lg" :disabled="store.loading" @click="approveBill(vehicle.id)">
          <span v-if="approvingId === vehicle.id"
            class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span v-else>✅</span>
          {{ locale.t('deputy.approveFinalBill') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch, computed } from 'vue'
import { useWorkshopStore } from '../store/workshop.js'
import { useLocaleStore } from '../store/locale.js'

const store = useWorkshopStore()
const locale = useLocaleStore()
const billForms = reactive({})
const itemForms = reactive({})
const billErrors = reactive({})
const approvingId = ref(null)

const itemTotals = computed(() => {
  const totals = {}
  store.completedPendingApproval.forEach(v => {
    let sum = 0
    if (itemForms[v.id]) {
      sum = Object.values(itemForms[v.id]).reduce((acc, val) => acc + Number(val || 0), 0)
    }
    totals[v.id] = sum
  })
  return totals
})

watch(() => store.completedPendingApproval, (jobs) => {
  jobs.forEach(v => {
    if (!itemForms[v.id]) {
      itemForms[v.id] = {}
      v.issues?.forEach((issue, idx) => {
        itemForms[v.id][idx] = issue.estimatedCost
      })
    }
    if (billForms[v.id] === undefined) {
      billForms[v.id] = v.quotationAmount || 0
    }
  })
}, { immediate: true })

watch(itemTotals, (totals) => {
  Object.keys(totals).forEach(id => {
    billForms[id] = totals[id]
  })
}, { deep: true })

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
  if (diff < 0) return locale.t('deputy.discountedBy', { amount: abs })
  if (diff > 0) return locale.t('deputy.increasedBy', { amount: abs })
  return locale.t('deputy.noChange')
}

async function approveBill(vehicleId) {
  const amount = billForms[vehicleId]
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    billErrors[vehicleId] = locale.t('deputy.validAmountRequired')
    return
  }
  billErrors[vehicleId] = ''
  approvingId.value = vehicleId
  
  // optionally, attach final line item costs to the vehicle object here
  const v = store.vehicleById(vehicleId)
  if (v && v.issues && itemForms[vehicleId]) {
    v.issues.forEach((issue, idx) => {
      issue.finalCost = Number(itemForms[vehicleId][idx] || 0)
    })
  }

  await store.approveBill(vehicleId, Number(amount))
  delete billForms[vehicleId]
  approvingId.value = null
}
</script>
