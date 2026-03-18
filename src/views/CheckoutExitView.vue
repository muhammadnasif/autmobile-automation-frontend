<template>
  <div class="space-y-8">
    <!-- ── Page Header ───────────────────────────────────────────────────── -->
    <div class="flex items-start justify-between flex-wrap gap-3">
      <div>
        <h1 class="section-title">Checkout &amp; Exit</h1>
        <p class="section-subtitle">Issue gatepasses, collect payments, and release vehicles.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <div
          class="flex items-center gap-2 text-sm text-slate-400 bg-surface-card border border-surface-border rounded-lg px-3 py-2">
          <span class="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
          <span>{{ store.activeVehicles.length }} active (pre-approval)</span>
        </div>
        <div
          class="flex items-center gap-2 text-sm text-slate-400 bg-surface-card border border-surface-border rounded-lg px-3 py-2">
          <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>{{ store.pendingPayment.length }} pending payment</span>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════
         SITUATION 1 — Initial Gatepass (before Deputy Manager approval)
         Active vehicles: InExecution | PendingApproval
         ══════════════════════════════════════════════════════════════════════ -->
    <section>
      <div class="flex items-center gap-3 mb-4">
        <div class="flex-1 h-px bg-surface-border" />
        <span class="text-xs font-bold text-brand-400 uppercase tracking-widest px-2 shrink-0">
          📄 Situation 1 — Initial Gatepass (Pre-Approval)
        </span>
        <div class="flex-1 h-px bg-surface-border" />
      </div>
      <p class="text-xs text-slate-500 -mt-2 mb-4">
        Generate or download the <strong class="text-slate-300">Initial Gatepass</strong> for any vehicle that is
        currently being worked on. Available to both Cashier and Supervisor before the Deputy Manager approves the final
        bill.
      </p>

      <!-- Empty -->
      <div v-if="store.activeVehicles.length === 0"
        class="card flex flex-col items-center justify-center py-10 text-center">
        <div class="text-4xl mb-3">🛠️</div>
        <p class="font-semibold text-slate-300 text-sm">No Active Vehicles</p>
        <p class="text-xs text-slate-500 mt-1">Vehicles assigned to supervisors and currently in progress will appear
          here.</p>
      </div>

      <!-- Active vehicle list -->
      <div v-else class="space-y-3">
        <div v-for="vehicle in store.activeVehicles" :key="vehicle.id"
          class="card-sm flex flex-wrap items-center justify-between gap-4 border-l-4 border-l-brand-500">
          <!-- Left: vehicle info -->
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-800 to-brand-600 flex items-center justify-center text-xl shrink-0">
              🚗
            </div>
            <div class="min-w-0">
              <p class="font-bold text-slate-100 font-mono tracking-widest text-sm">{{ vehicle.licensePlate }}</p>
              <p class="text-xs text-slate-500 truncate">
                {{ vehicle.id }} &middot;
                Supervisor: {{ vehicle.assignedSupervisor?.name ?? '—' }} &middot;
                Entry: {{ formatTime(vehicle.entryTime) }}
              </p>
            </div>
          </div>

          <!-- Centre: status badges + quotation pill -->
          <div class="flex flex-wrap gap-2 items-center">
            <span v-if="vehicle.isNewCar" class="badge-yellow">ON TEST</span>
            <span v-if="vehicle.status === 'InExecution'" class="badge-blue">In Execution</span>
            <span v-else class="badge-purple">Pending DM Approval</span>
            <span v-if="vehicle.quotationAmount" class="badge-gray">
              Quoted: BDT {{ Number(vehicle.quotationAmount).toLocaleString() }}
            </span>
          </div>

          <!-- Right: gatepass actions -->
          <div class="flex gap-2 shrink-0">
            <button class="btn-secondary btn-sm" :disabled="generatingInitial === vehicle.id"
              @click="generateInitialGatepass(vehicle.id)">
              <span v-if="generatingInitial === vehicle.id"
                class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span v-else>📄</span>
              {{ vehicle.initialGatepass ? `GP: ${vehicle.initialGatepass.slice(-8)}` : 'Generate Initial Gatepass' }}
            </button>
            <button v-if="vehicle.initialGatepass" class="btn-primary btn-sm"
              @click="downloadGatepass(vehicle, 'initial')">
              <span>⬇️</span> Download
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════════════════
         PAYMENT COLLECTION — Pending Payment (approved by Deputy Manager)
         ══════════════════════════════════════════════════════════════════════ -->
    <section>
      <div class="flex items-center gap-3 mb-4">
        <div class="flex-1 h-px bg-surface-border" />
        <span class="text-xs font-bold text-amber-400 uppercase tracking-widest px-2 shrink-0">
          💰 Payment Collection
        </span>
        <div class="flex-1 h-px bg-surface-border" />
      </div>

      <div v-if="store.pendingPayment.length === 0"
        class="card flex flex-col items-center justify-center py-10 text-center">
        <div class="text-4xl mb-3">🏁</div>
        <p class="font-semibold text-slate-300 text-sm">No Vehicles Awaiting Payment</p>
        <p class="text-xs text-slate-500 mt-1">Bills approved by the Deputy Manager will appear here.</p>
      </div>

      <div v-else class="grid gap-5 md:grid-cols-2">
        <div v-for="vehicle in store.pendingPayment" :key="vehicle.id"
          class="card border border-amber-500/20 bg-gradient-to-br from-surface-card to-amber-950/10 space-y-5">
          <!-- Vehicle header -->
          <div class="flex items-start justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-900 to-amber-700 flex items-center justify-center text-2xl shadow-lg shadow-amber-900/40">
                🚗
              </div>
              <div>
                <p class="font-bold text-slate-100 font-mono tracking-widest">{{ vehicle.licensePlate }}</p>
                <p class="text-xs text-slate-500">{{ vehicle.id }}</p>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <span v-if="vehicle.isNewCar" class="badge-yellow">ON TEST</span>
              <span class="badge-yellow">Pending Payment</span>
            </div>
          </div>

          <!-- Bill summary -->
          <div class="rounded-xl overflow-hidden border border-amber-500/20">
            <div class="bg-amber-900/20 px-4 py-2.5 border-b border-amber-500/20">
              <h3 class="text-xs font-semibold text-amber-300 uppercase tracking-wide">Bill Summary</h3>
            </div>
            <div class="divide-y divide-surface-border">
              <div class="flex justify-between items-center px-4 py-3">
                <span class="text-sm text-slate-400">Supervisor</span>
                <span class="text-sm font-medium text-slate-200">{{ vehicle.assignedSupervisor?.name ?? '—' }}</span>
              </div>
              <div class="flex justify-between items-center px-4 py-3">
                <span class="text-sm text-slate-400">Total Issues</span>
                <span class="text-sm font-medium text-slate-200">{{ vehicle.issues?.length ?? 0 }} item(s)</span>
              </div>
              <div class="flex justify-between items-center px-4 py-3">
                <span class="text-sm text-slate-400">Quoted Amount</span>
                <span class="text-sm font-mono text-slate-300">
                  BDT {{ Number(vehicle.quotationAmount || 0).toLocaleString() }}
                </span>
              </div>
              <div class="flex justify-between items-center px-4 py-3 bg-amber-900/10">
                <span class="text-sm font-semibold text-amber-200">Final Approved Bill</span>
                <span class="text-lg font-bold font-mono text-amber-300">
                  BDT {{ Number(vehicle.finalBillAmount || 0).toLocaleString() }}
                </span>
              </div>
            </div>
          </div>

          <!-- Initial Gatepass row -->
          <div class="flex items-center justify-between gap-2 bg-surface rounded-lg px-3 py-2">
            <div class="flex items-center gap-2 text-xs text-slate-400">
              <span>📄</span>
              <span v-if="vehicle.initialGatepass">
                Initial GP: <strong class="text-slate-200">{{ vehicle.initialGatepass }}</strong>
              </span>
              <span v-else class="text-slate-500 italic">No initial gatepass yet</span>
            </div>
            <div class="flex gap-2">
              <button v-if="!vehicle.initialGatepass" class="btn-secondary btn-sm"
                :disabled="generatingInitial === vehicle.id" @click="generateInitialGatepass(vehicle.id)">
                <span v-if="generatingInitial === vehicle.id"
                  class="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span v-else>📄</span> Generate
              </button>
              <button v-if="vehicle.initialGatepass" class="btn-secondary btn-sm"
                @click="downloadGatepass(vehicle, 'initial')">
                <span>⬇️</span> Download
              </button>
            </div>
          </div>

          <!-- Payment method -->
          <div>
            <label :for="`payment-method-${vehicle.id}`" class="form-label">Payment Method</label>
            <select :id="`payment-method-${vehicle.id}`" v-model="paymentMethods[vehicle.id]" class="form-select">
              <option value="cash">💵 Cash</option>
              <option value="card">💳 Card / POS</option>
              <option value="transfer">🏦 Bank Transfer</option>
              <option value="online">📱 Online Payment</option>
            </select>
          </div>

          <!-- Confirmation checkbox -->
          <label class="flex items-start gap-3 cursor-pointer group">
            <div class="relative mt-0.5">
              <input :id="`confirm-${vehicle.id}`" v-model="confirmations[vehicle.id]" type="checkbox"
                class="sr-only" />
              <div class="w-5 h-5 rounded border-2 transition-colors flex items-center justify-center"
                :class="confirmations[vehicle.id] ? 'bg-emerald-600 border-emerald-600' : 'border-surface-muted group-hover:border-slate-400'">
                <svg v-if="confirmations[vehicle.id]" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <span class="text-sm text-slate-300 leading-snug">
              I confirm that <strong class="text-slate-100">BDT {{ Number(vehicle.finalBillAmount || 0).toLocaleString()
                }}</strong> has been collected from the customer for vehicle <strong class="text-slate-100 font-mono">{{
                  vehicle.licensePlate }}</strong>.
            </span>
          </label>

          <!-- Collect payment -->
          <button class="btn-success w-full btn-lg"
            :disabled="!confirmations[vehicle.id] || store.loading || processingId === vehicle.id"
            @click="collectPayment(vehicle.id)">
            <span v-if="processingId === vehicle.id"
              class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span v-else>💰</span>
            Payment Received
          </button>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════════════════
         SITUATION 2 — Exit Gatepass (after payment received)
         Completed vehicles — Cashier generates & downloads Exit Gatepass
         ══════════════════════════════════════════════════════════════════════ -->
    <section v-if="recentlyCompleted.length > 0">
      <div class="flex items-center gap-3 mb-4">
        <div class="flex-1 h-px bg-surface-border" />
        <span class="text-xs font-bold text-emerald-400 uppercase tracking-widest px-2 shrink-0">
          🚪 Situation 2 — Exit Gatepass (Post-Payment)
        </span>
        <div class="flex-1 h-px bg-surface-border" />
      </div>
      <p class="text-xs text-slate-500 -mt-2 mb-4">
        Generate and download the <strong class="text-slate-300">Exit Gatepass</strong> for vehicles whose bills have
        been fully paid. The Cashier can issue this directly to the client.
      </p>

      <div class="space-y-3">
        <div v-for="v in recentlyCompleted" :key="v.id"
          class="card-sm border-l-4 border-l-emerald-500 flex flex-wrap items-center justify-between gap-4">
          <!-- Left: vehicle info -->
          <div class="flex items-center gap-3 min-w-0">
            <span class="text-2xl">✅</span>
            <div class="min-w-0">
              <p class="font-bold text-slate-100 font-mono tracking-widest text-sm">{{ v.licensePlate }}</p>
              <p class="text-xs text-slate-500 truncate">
                Receipt: {{ v.receiptNo }} &middot;
                Final Bill: <span class="font-bold text-emerald-400 font-mono">BDT {{ Number(v.finalBillAmount ||
                  0).toLocaleString() }}</span>
              </p>
            </div>
          </div>

          <!-- Right: exit gatepass actions (Exit GP generated by Supervisor, Cashier downloads) -->
          <div class="flex flex-wrap gap-2 items-center shrink-0">
            <span class="badge-green">Paid</span>
            <span v-if="v.exitGatepass" class="text-xs text-slate-400 font-mono hidden sm:inline">{{ v.exitGatepass
              }}</span>
            <!-- Download if Supervisor already generated it -->
            <button v-if="v.exitGatepass" class="btn-success btn-sm" @click="downloadGatepass(v, 'exit')">
              <span>⬇️</span> Download Exit Pass
            </button>
            <!-- Fallback: generate if Supervisor somehow missed it -->
            <button v-else class="btn-secondary btn-sm" :disabled="generatingExit === v.id"
              @click="generateExitGatepass(v.id)">
              <span v-if="generatingExit === v.id"
                class="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span v-else>🚪</span>
              Generate Exit Pass
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useWorkshopStore } from '../store/workshop.js'
import { useGatepass } from '../composables/useGatepass.js'

const store = useWorkshopStore()
const { downloadGatepass } = useGatepass()

const paymentMethods = reactive({})
const confirmations = reactive({})
const processingId = ref(null)
const generatingInitial = ref(null)
const generatingExit = ref(null)

const recentlyCompleted = computed(() => store.exitReadyVehicles)

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

// ── Situation 1: Generate Initial Gatepass (pre-approval) ────────────────
async function generateInitialGatepass(vehicleId) {
  generatingInitial.value = vehicleId
  await store.generateInitialGatepass(vehicleId)
  generatingInitial.value = null
}

// ── Payment Collection ────────────────────────────────────────────────────
async function collectPayment(vehicleId) {
  if (!confirmations[vehicleId]) return
  processingId.value = vehicleId
  await store.collectPayment(vehicleId)
  delete confirmations[vehicleId]
  delete paymentMethods[vehicleId]
  processingId.value = null
}

// ── Situation 2: Generate Exit Gatepass (post-payment) ───────────────────
async function generateExitGatepass(vehicleId) {
  generatingExit.value = vehicleId
  await store.generateExitGatepass(vehicleId)
  generatingExit.value = null
}
</script>
