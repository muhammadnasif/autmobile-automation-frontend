<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="section-title">Store Keeper Dashboard</h1>
        <p class="section-subtitle">Manage inventory, record incoming goods, and issue products.</p>
      </div>
      <div class="flex gap-2">
        <button class="btn-primary" @click="openModal('new')">
          <span>➕</span> Add New Product
        </button>
      </div>
    </div>

    <!-- Inventory Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="card bg-surface flex items-center gap-4 py-4 !px-5">
        <div class="w-12 h-12 rounded-xl bg-brand-500/20 text-brand-300 flex items-center justify-center text-2xl">
          📦
        </div>
        <div>
          <p class="text-[11px] text-slate-500 font-semibold uppercase tracking-widest">Total Items</p>
          <p class="text-2xl font-bold text-slate-100 font-mono">{{ store.inventory.length }}</p>
        </div>
      </div>
      <div class="card bg-surface flex items-center gap-4 py-4 !px-5">
        <div class="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-2xl">
          ⚠️
        </div>
        <div>
          <p class="text-[11px] text-slate-500 font-semibold uppercase tracking-widest">Low Stock</p>
          <p class="text-2xl font-bold text-amber-400 font-mono">
            {{ store.inventory.filter(i => i.quantity < 10).length }}
          </p>
        </div>
      </div>
      <div class="card bg-surface flex items-center gap-4 py-4 !px-5">
        <div class="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-2xl">
          💰
        </div>
        <div>
          <p class="text-[11px] text-slate-500 font-semibold uppercase tracking-widest">Inventory Value</p>
          <p class="text-xl font-bold text-emerald-400 font-mono">
            BDT {{ totalValue.toLocaleString() }}
          </p>
        </div>
      </div>
    </div>

    <!-- Inventory Table -->
    <div class="card p-0 overflow-hidden">
      <div class="p-4 border-b border-surface-border flex items-center justify-between">
        <h2 class="text-sm font-semibold text-slate-200">Current Inventory</h2>
        <input v-model="search" type="text" placeholder="Search products..." class="form-input text-sm w-48 py-1.5" />
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-card border-b border-surface-border text-xs text-slate-400 uppercase tracking-wider">
              <th class="px-4 py-3 text-left font-medium">ID</th>
              <th class="px-4 py-3 text-left font-medium">Name</th>
              <th class="px-4 py-3 text-right font-medium">Buying Price</th>
              <th class="px-4 py-3 text-right font-medium">Quantity</th>
              <th class="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-border">
            <tr v-if="filteredInventory.length === 0" class="hover:bg-surface-card/30 transition-colors">
               <td colspan="5" class="px-4 py-8 text-center text-slate-500">No items found.</td>
            </tr>
            <tr v-for="item in filteredInventory" :key="item.id" class="hover:bg-surface-card/50 transition-colors">
              <td class="px-4 py-3 text-slate-400 font-mono text-xs">{{ item.id }}</td>
              <td class="px-4 py-3 text-slate-200 font-medium">{{ item.name }}</td>
              <td class="px-4 py-3 text-right text-emerald-400 font-mono">BDT {{ item.buyingPrice.toLocaleString() }}</td>
              <td class="px-4 py-3 text-right">
                <span class="font-mono" :class="item.quantity < 10 ? 'text-amber-400 font-bold' : 'text-slate-300'">
                  {{ item.quantity }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-center gap-2">
                   <button class="btn-secondary btn-sm" @click="openModal('add', item)" title="Receive Stock">
                     <span>⬇️</span> IN
                   </button>
                   <button class="btn-warning btn-sm" @click="openModal('issue', item)" title="Issue Stock" :disabled="item.quantity <= 0">
                     <span>⬆️</span> OUT
                   </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Action Modal -->
    <div v-if="modal.show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="card w-full max-w-md bg-surface border border-surface-border shadow-2xl">
        <h3 class="text-lg font-bold text-slate-100 mb-4">
          {{ modal.type === 'new' ? 'Add New Product' : (modal.type === 'add' ? 'Receive Stock IN' : 'Issue Stock OUT') }}
        </h3>
        
        <div class="space-y-4">
          <div v-if="modal.type === 'new'">
            <label class="form-label">Product Name</label>
            <input v-model="form.name" type="text" class="form-input" placeholder="e.g. Air Filter" />
          </div>
          <div v-else class="p-3 bg-surface-card rounded-lg border border-surface-border mb-2 text-sm">
             <p class="text-slate-400">Product: <strong class="text-slate-200">{{ modal.item.name }}</strong></p>
             <p class="text-slate-400">Current Stock: <strong class="font-mono text-brand-300">{{ modal.item.quantity }}</strong></p>
          </div>

          <div v-if="modal.type === 'new'">
            <label class="form-label">Buying Price (BDT)</label>
            <input v-model="form.buyingPrice" type="number" min="0" class="form-input" placeholder="0" />
          </div>

          <div>
            <label class="form-label">Quantity {{ modal.type === 'issue' ? 'to Issue' : 'to Add' }}</label>
            <input v-model="form.quantity" type="number" min="1" class="form-input" placeholder="1" />
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button class="btn-secondary flex-1" @click="closeModal" :disabled="store.loading">Cancel</button>
          <button 
            class="btn-primary flex-1" 
            @click="submitModal" 
            :disabled="store.loading || !isValid"
          >
            <span v-if="store.loading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
             Confirm
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useWorkshopStore } from '../store/workshop.js'

const store = useWorkshopStore()
const search = ref('')

const showAddModal = ref(false)
const modal = reactive({
  show: false,
  type: 'new', // new, add, issue
  item: null
})

const form = reactive({
  name: '',
  buyingPrice: '',
  quantity: ''
})

const filteredInventory = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return store.inventory
  return store.inventory.filter(i => 
    i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q)
  )
})

const totalValue = computed(() => {
  return store.inventory.reduce((sum, item) => sum + (item.quantity * item.buyingPrice), 0)
})

const isValid = computed(() => {
  if (modal.type === 'new') {
    return form.name.trim() !== '' && Number(form.quantity) > 0 && Number(form.buyingPrice) > 0
  }
  return Number(form.quantity) > 0 && (modal.type !== 'issue' || Number(form.quantity) <= modal.item.quantity)
})

function openModal(type, item = null) {
  modal.type = type
  modal.item = item
  form.name = ''
  form.buyingPrice = ''
  form.quantity = ''
  modal.show = true
}

// Intercept Add New Product button click above
const realShowAddModal = computed({
  get() { return modal.show && modal.type === 'new' },
  set(val) { if(val) openModal('new') }
})

// Override standard open logic for Add New
const showModalForNew = () => openModal('new')

function closeModal() {
  modal.show = false
  modal.item = null
}

async function submitModal() {
  if (!isValid.value) return

  if (modal.type === 'new') {
    await store.addInventoryItem({
      name: form.name,
      quantity: form.quantity,
      buyingPrice: form.buyingPrice
    })
  } else if (modal.type === 'add') {
    await store.updateInventoryItemQuantity(modal.item.id, form.quantity)
  } else if (modal.type === 'issue') {
    await store.issueInventoryItem(modal.item.id, form.quantity)
  }

  closeModal()
}
</script>
