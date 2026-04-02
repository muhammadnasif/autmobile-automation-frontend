<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="section-title">{{ locale.t('supervisor.title') }}</h1>
        <p class="section-subtitle">{{ locale.t('supervisor.subtitle') }}</p>
      </div>
      <div class="flex items-center gap-3">
        <label for="sup-selector" class="text-sm text-slate-400 shrink-0">{{ locale.t('supervisor.actingAs') }}</label>
        <select id="sup-selector" v-model="activeSupervisorId" class="form-select w-48">
          <option v-for="s in store.supervisors" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>
    </div>

    <!-- Notification Banner -->
    <Transition name="slide-down">
      <div v-if="newNotifications.length > 0" class="alert-info">
        <span class="text-xl animate-bounce">🔔</span>
        <div class="flex-1">
          <p class="font-semibold text-sm">{{ locale.t('supervisor.newJobsAssigned', { count: newNotifications.length }) }}</p>
          <ul class="mt-1 space-y-0.5">
            <li v-for="n in newNotifications" :key="n.id" class="text-xs opacity-80">
              {{ n.message }}
            </li>
          </ul>
        </div>
        <button class="text-xs underline opacity-70 hover:opacity-100 shrink-0" @click="markRead">
          {{ locale.t('supervisor.dismiss') }}
        </button>
      </div>
    </Transition>

    <!-- ══ SECTION 1: Active Jobs (InExecution) ══════════════════════════════════ -->
    <div>
      <h2 class="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">{{ locale.t('supervisor.activeJobs') }}</h2>

      <div v-if="activeJobs.length === 0" class="card flex flex-col items-center justify-center py-12 text-center">
        <div class="text-4xl mb-3">🛠️</div>
        <p class="font-semibold text-slate-300">{{ locale.t('supervisor.noActiveJobs') }}</p>
        <p class="text-sm text-slate-500 mt-1">{{ locale.t('supervisor.jobsWillAppear') }}</p>
      </div>

      <div v-else class="space-y-4">
        <div v-for="vehicle in activeJobs" :key="vehicle.id" class="card border-l-4 border-l-brand-500 space-y-5">
          <!-- Vehicle summary -->
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-800 to-brand-600 flex items-center justify-center text-2xl">
                🚗
              </div>
              <div>
                <p class="font-bold text-slate-100 font-mono tracking-widest">{{ vehicle.licensePlate }}</p>
                <p class="text-xs text-slate-500">{{ vehicle.id }} · {{ locale.t('manager.entry') }}: {{ formatTime(vehicle.entryTime) }}</p>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <span v-if="vehicle.isNewCar" class="badge-yellow">{{ locale.t('manager.onTest') }}</span>
              <span class="badge-blue">{{ locale.t('status.inExecution') }}</span>
              <span v-if="vehicle.initialGatepass" class="badge-green">{{ locale.t('supervisor.gatepassIssued') }}</span>
            </div>
          </div>

          <!-- Quotation / Issues form -->
          <div class="bg-surface rounded-xl p-4 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-slate-200">📋 {{ locale.t('supervisor.jobCardQuotation') }}</h3>
              <div class="flex gap-2">
                <button class="btn-secondary btn-sm" @click="openProductModal(vehicle.id)">
                  <span>🛒</span> Add Product
                </button>
                <button class="btn-secondary btn-sm" @click="addIssue(vehicle.id)">
                  <span>➕</span> {{ locale.t('supervisor.addIssue') }}
                </button>
              </div>
            </div>

            <div v-if="jobForms[vehicle.id]?.issues.length === 0"
              class="text-center py-6 text-slate-500 text-sm border border-dashed border-surface-border rounded-lg">
              {{ locale.t('supervisor.noIssuesYet') }}
            </div>
            <div v-else class="space-y-2">
              <div v-for="(issue, idx) in jobForms[vehicle.id]?.issues" :key="idx" class="flex gap-2 items-start">
                <div class="flex-1 grid sm:grid-cols-3 gap-2">
                  <input v-model="issue.description" type="text" :placeholder="locale.t('supervisor.issueDescription', { n: idx + 1 })"
                    class="form-input sm:col-span-2" />
                  <input v-model="issue.estimatedCost" type="number" :placeholder="locale.t('supervisor.estCost')" class="form-input"
                    min="0" />
                </div>
                <button class="btn-danger btn-sm mt-0.5 shrink-0" @click="removeIssue(vehicle.id, idx)">🗑️</button>
              </div>
            </div>

            <!-- Totals & Submit -->
            <div v-if="jobForms[vehicle.id]?.issues.length > 0"
              class="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div class="text-sm text-slate-400">
                {{ locale.t('supervisor.estimatedTotal') }}
                <span class="text-slate-100 font-bold ml-1">BDT {{ estimatedTotal(vehicle.id).toLocaleString() }}</span>
              </div>
              <button class="btn-primary btn-sm" @click="saveQuotation(vehicle.id)">
                <span v-if="savingQuotation === vehicle.id"
                  class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span v-else>💾</span>
                {{ locale.t('supervisor.saveQuotation') }}
              </button>
            </div>

            <div v-if="vehicle.quotationAmount > 0" class="flex items-center gap-2 text-emerald-400 text-xs">
              <span>✅</span>
              <span>{{ locale.t('supervisor.quotationSaved', { amount: Number(vehicle.quotationAmount).toLocaleString() }) }}</span>
            </div>
          </div>

          <!-- Action row -->
          <div class="flex flex-wrap gap-3 pt-1">
            <button class="btn-secondary flex-1" :disabled="store.loading" @click="generateGatepass(vehicle.id)">
              <span>📄</span>
              {{ vehicle.initialGatepass ? locale.t('supervisor.gatepassLabel', { no: vehicle.initialGatepass }) : locale.t('supervisor.generateInitialGatepass') }}
            </button>
            <button v-if="vehicle.initialGatepass" class="btn-primary btn-sm shrink-0"
              @click="downloadGatepass(vehicle, 'initial')">
              <span>⬇️</span> {{ locale.t('supervisor.download') }}
            </button>
            <button class="btn-warning flex-1" :disabled="store.loading" @click="markCompleted(vehicle.id)">
              <span>✔️</span>
              {{ locale.t('supervisor.markWorkCompleted') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ SECTION 2: Exit Confirmation (AwaitingExitConfirmation) ══════════════ -->
    <div v-if="exitConfirmJobs.length > 0">
      <div class="flex items-center gap-3 mb-4">
        <div class="flex-1 h-px bg-surface-border" />
        <span class="text-xs font-bold text-amber-400 uppercase tracking-widest px-2 shrink-0">
          📋 {{ locale.t('supervisor.dmApprovedConfirm') }}
        </span>
        <div class="flex-1 h-px bg-surface-border" />
      </div>
      <p class="text-xs text-slate-500 -mt-2 mb-4">
        {{ locale.t('supervisor.dmApprovedHint') }}
      </p>

      <div class="space-y-4">
        <div v-for="vehicle in exitConfirmJobs" :key="vehicle.id" class="card border-l-4 border-l-amber-400 space-y-4">
          <!-- Vehicle header -->
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-900 to-amber-700 flex items-center justify-center text-2xl">
                🚗
              </div>
              <div>
                <p class="font-bold text-slate-100 font-mono tracking-widest">{{ vehicle.licensePlate }}</p>
                <p class="text-xs text-slate-500">{{ vehicle.id }} · {{ locale.t('manager.entry') }}: {{ formatTime(vehicle.entryTime) }}</p>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <span v-if="vehicle.isNewCar" class="badge-yellow">{{ locale.t('manager.onTest') }}</span>
              <span
                class="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {{ locale.t('supervisor.dmApproved') }}
              </span>
            </div>
          </div>

          <!-- Bill summary -->
          <div class="rounded-xl overflow-hidden border border-amber-500/20">
            <div class="bg-amber-900/20 px-4 py-2.5 border-b border-amber-500/20">
              <h3 class="text-xs font-semibold text-amber-300 uppercase tracking-wide">{{ locale.t('supervisor.approvedBillSummary') }}</h3>
            </div>
            <div class="divide-y divide-surface-border">
              <div class="flex justify-between items-center px-4 py-2.5">
                <span class="text-sm text-slate-400">{{ locale.t('supervisor.quotedAmount') }}</span>
                <span class="text-sm font-mono text-slate-300">BDT {{ Number(vehicle.quotationAmount ||
                  0).toLocaleString() }}</span>
              </div>
              <div class="flex justify-between items-center px-4 py-3 bg-amber-900/10">
                <span class="text-sm font-semibold text-amber-200">{{ locale.t('supervisor.finalApprovedBill') }}</span>
                <span class="text-lg font-bold font-mono text-amber-300">
                  BDT {{ Number(vehicle.finalBillAmount || 0).toLocaleString() }}
                </span>
              </div>
            </div>
          </div>

          <!-- Exit gatepass + release actions -->
          <div class="flex flex-wrap gap-3 pt-1">
            <button class="btn-secondary flex-1" :disabled="store.loading" @click="generateExitPass(vehicle.id)">
              <span>🚪</span>
              {{ vehicle.exitGatepass ? locale.t('supervisor.exitPassLabel', { no: vehicle.exitGatepass }) : locale.t('supervisor.generateExitGatepass') }}
            </button>
            <button v-if="vehicle.exitGatepass" class="btn-primary btn-sm shrink-0"
              @click="downloadGatepass(vehicle, 'exit')">
              <span>⬇️</span> {{ locale.t('supervisor.download') }}
            </button>
            <button class="btn-success flex-1" :disabled="store.loading || !vehicle.exitGatepass"
              :title="!vehicle.exitGatepass ? locale.t('supervisor.generateExitFirst') : ''"
              @click="releaseToPayment(vehicle.id)">
              <span>💰</span>
              {{ locale.t('supervisor.releaseToCashier') }}
            </button>
          </div>
          <p v-if="!vehicle.exitGatepass" class="text-xs text-slate-500 text-center -mt-1">
            ⚠️ {{ locale.t('supervisor.generateExitFirst') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Product Selection Modal -->
    <div v-if="productModal.show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left">
      <div class="card w-full max-w-md bg-surface border border-surface-border shadow-2xl space-y-4">
        <h3 class="text-lg font-bold text-slate-100">Add Product to Job</h3>
        
        <!-- Product Select -->
        <div>
          <label class="form-label">Select Product from Inventory</label>
          <select v-model="productModal.productId" class="form-select w-full">
            <option value="">-- Select Product --</option>
            <option v-for="item in inStockInventory" :key="item.id" :value="item.id">
              {{ item.name }} (Stock: {{ item.quantity }})
            </option>
          </select>
        </div>
        
        <!-- Product Details & Pricing -->
        <div v-if="selectedProductForModal" class="p-3 bg-surface-card rounded-lg border border-surface-border space-y-3">
          <div class="flex justify-between items-center text-sm">
            <span class="text-slate-400">Available Stock:</span>
            <span class="font-bold font-mono text-brand-400">{{ selectedProductForModal.quantity }}</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-slate-400">Buying Price (Unit):</span>
            <span class="font-bold font-mono text-amber-400">BDT {{ selectedProductForModal.buyingPrice.toLocaleString() }}</span>
          </div>
          
          <div class="pt-2 border-t border-surface-border grid grid-cols-2 gap-3">
            <div>
              <label class="form-label text-xs">Quantity</label>
              <input v-model="productModal.quantity" type="number" min="1" :max="selectedProductForModal.quantity" class="form-input form-sm w-full" />
            </div>
            <div>
              <label class="form-label text-xs">Selling Price (Unit)</label>
              <input v-model="productModal.sellingPrice" type="number" :min="selectedProductForModal.buyingPrice" class="form-input form-sm w-full" />
            </div>
          </div>
          <div v-if="productModal.sellingPrice < selectedProductForModal.buyingPrice" class="text-xs text-rose-400 mt-1">
            Selling price is lower than buying price!
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-2">
          <button class="btn-secondary flex-1" @click="closeProductModal" :disabled="addingProduct">Cancel</button>
          <button class="btn-primary flex-1" :disabled="!isProductModalValid || addingProduct" @click="confirmAddProduct">
            <span v-if="addingProduct" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Add to Quotation
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useWorkshopStore } from '../store/workshop.js'
import { useGatepass } from '../composables/useGatepass.js'
import { useLocaleStore } from '../store/locale.js'

const store = useWorkshopStore()
const locale = useLocaleStore()
const { downloadGatepass } = useGatepass()

// For demo: pick which supervisor we are
const activeSupervisorId = ref(store.supervisors[0]?.id ?? '')

// Per-vehicle job form state (issues list)
const jobForms = reactive({})

const activeJobs = computed(() =>
  store.activeJobsForSupervisor(activeSupervisorId.value)
)

const exitConfirmJobs = computed(() =>
  store.exitConfirmJobsForSupervisor(activeSupervisorId.value)
)

const newNotifications = computed(() =>
  store.notifications.filter(
    (n) => n.supervisorId === activeSupervisorId.value && !n.read
  )
)

const inStockInventory = computed(() => store.inventory.filter(i => i.quantity > 0))

// Modal state
const productModal = reactive({
  show: false,
  vehicleId: null,
  productId: '',
  quantity: 1,
  sellingPrice: 0
})

const selectedProductForModal = computed(() => {
  if (!productModal.productId) return null
  return store.inventory.find(i => i.id === productModal.productId)
})

watch(() => productModal.productId, (newId) => {
  const p = store.inventory.find(i => i.id === newId)
  if (p) {
    productModal.sellingPrice = p.buyingPrice ? Math.round(p.buyingPrice * 1.15) : 0 // Suggest 15% markup
    productModal.quantity = 1
  }
})

const isProductModalValid = computed(() => {
  const p = selectedProductForModal.value
  if (!p) return false
  const q = Number(productModal.quantity)
  const sp = Number(productModal.sellingPrice)
  return q > 0 && q <= p.quantity && sp > 0
})

const addingProduct = ref(false)

function openProductModal(vehicleId) {
  productModal.vehicleId = vehicleId
  productModal.productId = ''
  productModal.quantity = 1
  productModal.sellingPrice = 0
  productModal.show = true
}

function closeProductModal() {
  productModal.show = false
  productModal.vehicleId = null
}

async function confirmAddProduct() {
  if (!isProductModalValid.value) return
  addingProduct.value = true
  
  const p = selectedProductForModal.value
  const q = Number(productModal.quantity)
  const sp = Number(productModal.sellingPrice)
  
  // Issue from store
  await store.issueInventoryItem(p.id, q)
  
  // Add to job forms
  if (!jobForms[productModal.vehicleId]) {
    jobForms[productModal.vehicleId] = { issues: [] }
  }
  
  jobForms[productModal.vehicleId].issues.push({
    description: `Product: ${p.name} (x${q})`,
    estimatedCost: sp * q,
    productId: p.id,
    quantity: q,
    unitPrice: sp
  })
  
  addingProduct.value = false
  closeProductModal()
}

// Init form state for any new active jobs
watch(
  activeJobs,
  (jobs) => {
    jobs.forEach((v) => {
      if (!jobForms[v.id]) {
        jobForms[v.id] = {
          issues: v.issues?.length
            ? v.issues.map((i) => ({ ...i }))
            : [],
        }
      }
    })
  },
  { immediate: true }
)

function addIssue(vehicleId) {
  if (!jobForms[vehicleId]) jobForms[vehicleId] = { issues: [] }
  jobForms[vehicleId].issues.push({ description: '', estimatedCost: '' })
}

function removeIssue(vehicleId, idx) {
  jobForms[vehicleId].issues.splice(idx, 1)
}

function estimatedTotal(vehicleId) {
  return (jobForms[vehicleId]?.issues ?? []).reduce(
    (sum, i) => sum + (parseFloat(i.estimatedCost) || 0),
    0
  )
}

const savingQuotation = ref(null)

async function saveQuotation(vehicleId) {
  savingQuotation.value = vehicleId
  const issues = jobForms[vehicleId]?.issues ?? []
  const total = estimatedTotal(vehicleId)
  await store.createQuotation(vehicleId, issues, total)
  savingQuotation.value = null
}

async function generateGatepass(vehicleId) {
  await store.generateInitialGatepass(vehicleId)
}

async function markCompleted(vehicleId) {
  await store.markWorkCompleted(vehicleId)
}

async function generateExitPass(vehicleId) {
  await store.generateExitGatepass(vehicleId)
}

async function releaseToPayment(vehicleId) {
  await store.releaseToPayment(vehicleId)
}

function markRead() {
  store.markNotificationsRead(activeSupervisorId.value)
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
