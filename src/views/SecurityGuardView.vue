<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <!-- Header -->
    <div>
      <h1 class="section-title">Vehicle Entry Log</h1>
      <p class="section-subtitle">Register an incoming vehicle and generate an entry proof.</p>
    </div>

    <!-- Success toast -->
    <Transition name="slide-down">
      <div v-if="successMessage" class="alert-success">
        <span class="text-2xl">✅</span>
        <div>
          <p class="font-semibold text-sm">Entry Recorded Successfully</p>
          <p class="text-xs mt-0.5 opacity-80">{{ successMessage }}</p>
        </div>
      </div>
    </Transition>

    <!-- Camera Interface -->
    <div class="card">
      <h2 class="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
        <span>📷</span> Camera Capture
      </h2>
      <div
        class="relative w-full rounded-xl overflow-hidden border border-dashed border-surface-border bg-surface flex flex-col items-center justify-center"
        style="aspect-ratio: 16/7;"
      >
        <!-- Simulated camera feed or captured image -->
        <div v-if="!capturedPhoto" class="flex flex-col items-center gap-3 text-slate-500">
          <div class="w-16 h-16 rounded-full bg-surface-card border border-surface-border flex items-center justify-center text-3xl">
            📷
          </div>
          <p class="text-sm">Camera feed inactive</p>
          <p class="text-xs text-slate-600">Click "Capture Photo" to simulate camera snap</p>
        </div>
        <div v-else class="w-full h-full flex items-center justify-center bg-surface-card">
          <div class="text-center space-y-2">
            <div class="text-4xl">🚗</div>
            <p class="text-xs text-emerald-400 font-semibold">Photo Captured</p>
            <p class="text-[10px] text-slate-500">{{ capturedPhoto }}</p>
          </div>
        </div>

        <!-- Scanning animation overlay -->
        <div v-if="isCapturing" class="absolute inset-0 flex items-center justify-center bg-black/60">
          <div class="flex flex-col items-center gap-3 text-white">
            <div class="w-12 h-12 border-4 border-brand-400 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm font-medium">Capturing…</p>
          </div>
        </div>
      </div>

      <div class="flex gap-3 mt-4">
        <button class="btn-secondary flex-1" :disabled="isCapturing" @click="capturePhoto">
          <span>📷</span> Capture Photo
        </button>
        <button
          v-if="capturedPhoto"
          class="btn-secondary"
          @click="capturedPhoto = null"
        >
          <span>🗑️</span> Retake
        </button>
      </div>
    </div>

    <!-- Entry Form -->
    <div class="card space-y-5">
      <h2 class="text-sm font-semibold text-slate-300 flex items-center gap-2">
        <span>📝</span> Vehicle Details
      </h2>

      <!-- License Plate -->
      <div>
        <label for="license-plate" class="form-label">License Plate Number *</label>
        <div class="relative">
          <input
            id="license-plate"
            v-model="form.licensePlate"
            type="text"
            class="form-input pr-10 uppercase font-mono tracking-widest"
            placeholder="e.g. ABC-1234"
            :class="{ 'border-rose-500 focus:ring-rose-500': errors.licensePlate }"
            @input="errors.licensePlate = ''"
          />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">🚘</span>
        </div>
        <p v-if="errors.licensePlate" class="text-rose-400 text-xs mt-1">{{ errors.licensePlate }}</p>
      </div>

      <!-- New Car Toggle -->
      <div class="flex items-center justify-between p-4 rounded-xl bg-surface border border-surface-border">
        <div>
          <p class="text-sm font-medium text-slate-200">New Car (ON TEST)</p>
          <p class="text-xs text-slate-500 mt-0.5">Toggle if this vehicle is here for a test / inspection</p>
        </div>
        <button
          role="switch"
          :aria-checked="form.isNewCar"
          class="relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface"
          :class="form.isNewCar ? 'bg-brand-600' : 'bg-surface-muted'"
          @click="form.isNewCar = !form.isNewCar"
        >
          <span
            class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
            :class="form.isNewCar ? 'translate-x-6' : 'translate-x-0'"
          />
        </button>
      </div>
      <div v-if="form.isNewCar" class="alert-info text-sm">
        <span>ℹ️</span>
        <span>This vehicle is marked as <strong>ON TEST</strong>. A test-entry proof will be generated.</span>
      </div>

      <!-- Remarks (optional) -->
      <div>
        <label for="remarks" class="form-label">Remarks <span class="text-slate-500 font-normal">(optional)</span></label>
        <textarea
          id="remarks"
          v-model="form.remarks"
          rows="2"
          class="form-input resize-none"
          placeholder="Any initial observations about the vehicle…"
        />
      </div>
    </div>

    <!-- Action -->
    <button
      id="generate-entry-proof-btn"
      class="btn-primary btn-lg w-full"
      :disabled="store.loading"
      @click="submitEntry"
    >
      <span v-if="store.loading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      <span v-else>🖨️</span>
      Generate Entry Proof
    </button>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useWorkshopStore } from '../store/workshop.js'

const store = useWorkshopStore()

const form = reactive({
  licensePlate: '',
  isNewCar: false,
  remarks: '',
})

const errors = reactive({ licensePlate: '' })
const capturedPhoto = ref(null)
const isCapturing = ref(false)
const successMessage = ref('')

function validate() {
  let valid = true
  if (!form.licensePlate.trim()) {
    errors.licensePlate = 'License plate number is required.'
    valid = false
  }
  return valid
}

async function capturePhoto() {
  isCapturing.value = true
  // Simulate camera capture delay
  await new Promise((r) => setTimeout(r, 1200))
  capturedPhoto.value = `CAM_${Date.now()}.jpg`
  isCapturing.value = false
}

async function submitEntry() {
  if (!validate()) return
  const vehicle = await store.logVehicle({
    licensePlate: form.licensePlate.trim().toUpperCase(),
    isNewCar: form.isNewCar,
    photo: capturedPhoto.value,
  })
  successMessage.value = `Vehicle ${vehicle.licensePlate} logged with ID ${vehicle.id}. Entry proof ready.`
  // Reset form
  form.licensePlate = ''
  form.isNewCar = false
  form.remarks = ''
  capturedPhoto.value = null
  // Auto-clear message
  setTimeout(() => (successMessage.value = ''), 6000)
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
