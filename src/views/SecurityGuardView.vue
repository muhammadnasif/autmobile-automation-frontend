<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <!-- Header -->
    <div>
      <h1 class="section-title">{{ locale.t('security.title') }}</h1>
      <p class="section-subtitle">{{ locale.t('security.subtitle') }}</p>
    </div>

    <!-- Success toast -->
    <Transition name="slide-down">
      <div v-if="successMessage" class="alert-success">
        <span class="text-2xl">✅</span>
        <div>
          <p class="font-semibold text-sm">{{ locale.t('security.entryRecorded') }}</p>
          <p class="text-xs mt-0.5 opacity-80">{{ successMessage }}</p>
        </div>
      </div>
    </Transition>

    <!-- Camera Interface -->
    <div class="card">
      <h2 class="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
        <span>📷</span> {{ locale.t('security.cameraCapture') }}
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
          <p class="text-sm">{{ locale.t('security.cameraInactive') }}</p>
          <p class="text-xs text-slate-600">{{ locale.t('security.clickCapture') }}</p>
        </div>
        <div v-else class="w-full h-full flex items-center justify-center bg-surface-card">
          <div class="text-center space-y-2">
            <div class="text-4xl">🚗</div>
            <p class="text-xs text-emerald-400 font-semibold">{{ locale.t('security.photoCaptured') }}</p>
            <p class="text-[10px] text-slate-500">{{ capturedPhoto }}</p>
          </div>
        </div>

        <!-- Scanning animation overlay -->
        <div v-if="isCapturing" class="absolute inset-0 flex items-center justify-center bg-black/60">
          <div class="flex flex-col items-center gap-3 text-white">
            <div class="w-12 h-12 border-4 border-brand-400 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm font-medium">{{ locale.t('security.capturing') }}</p>
          </div>
        </div>
      </div>

      <div class="flex gap-3 mt-4">
        <button class="btn-secondary flex-1" :disabled="isCapturing" @click="capturePhoto">
          <span>📷</span> {{ locale.t('security.capturePhoto') }}
        </button>
        <button
          v-if="capturedPhoto"
          class="btn-secondary"
          @click="capturedPhoto = null"
        >
          <span>🗑️</span> {{ locale.t('security.retake') }}
        </button>
      </div>
    </div>

    <!-- Entry Form -->
    <div class="card space-y-5">
      <h2 class="text-sm font-semibold text-slate-300 flex items-center gap-2">
        <span>📝</span> {{ locale.t('security.vehicleDetails') }}
      </h2>

      <!-- License Plate -->
      <div>
        <label for="license-plate" class="form-label">{{ locale.t('security.licensePlate') }}</label>
        <div class="relative">
          <input
            id="license-plate"
            v-model="form.licensePlate"
            type="text"
            class="form-input pr-10 uppercase font-mono tracking-widest"
            :placeholder="locale.t('security.licensePlaceholder')"
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
          <p class="text-sm font-medium text-slate-200">{{ locale.t('security.newCar') }}</p>
          <p class="text-xs text-slate-500 mt-0.5">{{ locale.t('security.newCarHint') }}</p>
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
        <span>{{ locale.t('security.onTestNote') }}</span>
      </div>

      <!-- Remarks (optional) -->
      <div>
        <label for="remarks" class="form-label">{{ locale.t('security.remarks') }} <span class="text-slate-500 font-normal">{{ locale.t('security.remarksOptional') }}</span></label>
        <textarea
          id="remarks"
          v-model="form.remarks"
          rows="2"
          class="form-input resize-none"
          :placeholder="locale.t('security.remarksPlaceholder')"
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
      {{ locale.t('security.generateEntryProof') }}
    </button>

    <!-- ══ SECTION: Active Gatepasses (Departures/Tests) ══ -->
    <div class="pt-6 border-t border-surface-border">
      <h2 class="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-4">
        <span>📄</span> Pending Gatepasses
      </h2>
      <div v-if="store.activeGatepassVehicles.length === 0" class="card py-8 text-center text-slate-500 text-sm">
        No pending gatepasses to verify.
      </div>
      <div v-else class="space-y-4">
        <div v-for="vehicle in store.activeGatepassVehicles" :key="vehicle.id" class="card border-l-4 border-l-brand-500 flex flex-col gap-3">
          <div class="flex items-start justify-between">
            <div>
              <p class="font-bold text-slate-100 font-mono tracking-widest">{{ vehicle.licensePlate }}</p>
              <p class="text-xs text-slate-500">{{ vehicle.id }}</p>
            </div>
            <div class="flex flex-col gap-1 items-end">
              <span v-if="vehicle.initialGatepass" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Initial: {{ vehicle.initialGatepass }}
              </span>
              <span v-if="vehicle.exitGatepass" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Exit: {{ vehicle.exitGatepass }}
              </span>
            </div>
          </div>
          <button class="btn-primary btn-sm w-full" @click="store.verifyGatepass(vehicle.id)" :disabled="store.loading">
            <span>✅</span> Verify Gatepass & Clear
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useWorkshopStore } from '../store/workshop.js'
import { useLocaleStore } from '../store/locale.js'

const store = useWorkshopStore()
const locale = useLocaleStore()

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
    errors.licensePlate = locale.t('security.licenseRequired')
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
  successMessage.value = locale.t('security.entrySuccessMessage', { plate: vehicle.licensePlate, id: vehicle.id })
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
