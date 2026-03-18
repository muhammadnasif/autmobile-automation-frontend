import { defineStore } from 'pinia'

// --- Status constants ---
export const STATUS = {
  AWAITING_ASSIGNMENT: 'AwaitingAssignment',
  IN_EXECUTION: 'InExecution',
  PENDING_APPROVAL: 'PendingApproval',
  AWAITING_EXIT_CONFIRMATION: 'AwaitingExitConfirmation', // NEW: After DM approves, goes back to Supervisor
  PENDING_PAYMENT: 'PendingPayment',
  COMPLETED: 'Completed',
}

// --- Placeholder API functions (replace with real Axios/fetch calls) ---
const api = {
  logVehicle:        (payload) => Promise.resolve({ success: true, data: payload }),
  assignSupervisor:  (payload) => Promise.resolve({ success: true, data: payload }),
  createQuotation:   (payload) => Promise.resolve({ success: true, data: payload }),
  generateGatepass:  (payload) => Promise.resolve({ success: true, gatepassNo: `GP-${Date.now()}` }),
  completeWork:      (payload) => Promise.resolve({ success: true, data: payload }),
  approveBill:       (payload) => Promise.resolve({ success: true, data: payload }),
  collectPayment:    (payload) => Promise.resolve({ success: true, receiptNo: `RCP-${Date.now()}` }),
  generateExitPass:  (payload) => Promise.resolve({ success: true, exitPassNo: `EXP-${Date.now()}` }),
}

let _idCounter = 1000

export const useWorkshopStore = defineStore('workshop', {
  state: () => ({
    vehicles: [
      // Seed demo data for testing the workflow
      {
        id: 'V-0001',
        licensePlate: 'ABC-1234',
        isNewCar: false,
        status: STATUS.AWAITING_ASSIGNMENT,
        assignedSupervisor: null,
        photo: null,
        issues: [],
        quotationAmount: null,
        finalBillAmount: null,
        initialGatepass: null,
        exitGatepass: null,
        receiptNo: null,
        entryTime: new Date().toISOString(),
      },
    ],
    supervisors: [
      { id: 'S-01', name: 'Ahmed Raza' },
      { id: 'S-02', name: 'Bilal Hassan' },
      { id: 'S-03', name: 'Kamran Iqbal' },
    ],
    notifications: [], // { id, vehicleId, message, read }
    loading: false,
    error: null,
  }),

  getters: {
    awaitingVehicles: (state) =>
      state.vehicles.filter((v) => v.status === STATUS.AWAITING_ASSIGNMENT),

    activeJobsForSupervisor: (state) => (supervisorId) =>
      state.vehicles.filter(
        (v) =>
          v.assignedSupervisor?.id === supervisorId &&
          [STATUS.IN_EXECUTION].includes(v.status)
      ),

    completedPendingApproval: (state) =>
      state.vehicles.filter((v) => v.status === STATUS.PENDING_APPROVAL),

    pendingPayment: (state) =>
      state.vehicles.filter((v) => v.status === STATUS.PENDING_PAYMENT),

    unreadNotifications: (state) =>
      state.notifications.filter((n) => !n.read),

    vehicleById: (state) => (id) =>
      state.vehicles.find((v) => v.id === id),

    exitReadyVehicles: (state) =>
      state.vehicles.filter((v) => v.status === STATUS.COMPLETED),

    // Vehicles that are active but NOT yet released to Cashier — Cashier can generate Initial Gatepass for these
    activeVehicles: (state) =>
      state.vehicles.filter((v) =>
        [STATUS.IN_EXECUTION, STATUS.PENDING_APPROVAL, STATUS.AWAITING_EXIT_CONFIRMATION].includes(v.status)
      ),

    // Jobs that DM has approved, waiting for Supervisor to confirm exit & generate exit gatepass
    exitConfirmJobsForSupervisor: (state) => (supervisorId) =>
      state.vehicles.filter(
        (v) =>
          v.assignedSupervisor?.id === supervisorId &&
          v.status === STATUS.AWAITING_EXIT_CONFIRMATION
      ),
  },

  actions: {
    // ── Security Guard ──────────────────────────────────────────────────────
    async logVehicle({ licensePlate, isNewCar, photo }) {
      this.loading = true
      try {
        const id = `V-${++_idCounter}`
        const vehicle = {
          id,
          licensePlate,
          isNewCar,
          photo,
          status: STATUS.AWAITING_ASSIGNMENT,
          assignedSupervisor: null,
          issues: [],
          quotationAmount: null,
          finalBillAmount: null,
          initialGatepass: null,
          exitGatepass: null,
          receiptNo: null,
          entryTime: new Date().toISOString(),
        }
        await api.logVehicle(vehicle)
        this.vehicles.push(vehicle)
        return vehicle
      } finally {
        this.loading = false
      }
    },

    // ── Manager ──────────────────────────────────────────────────────────────
    async assignSupervisor(vehicleId, supervisor) {
      this.loading = true
      try {
        await api.assignSupervisor({ vehicleId, supervisorId: supervisor.id })
        const v = this._findVehicle(vehicleId)
        v.assignedSupervisor = supervisor
        v.status = STATUS.IN_EXECUTION
        // Push notification for supervisor
        this.notifications.push({
          id: `N-${Date.now()}`,
          vehicleId,
          supervisorId: supervisor.id,
          message: `New job assigned: Vehicle ${v.licensePlate}`,
          read: false,
        })
      } finally {
        this.loading = false
      }
    },

    // ── Supervisor ───────────────────────────────────────────────────────────
    async createQuotation(vehicleId, issues, quotationAmount) {
      this.loading = true
      try {
        await api.createQuotation({ vehicleId, issues, quotationAmount })
        const v = this._findVehicle(vehicleId)
        v.issues = issues
        v.quotationAmount = quotationAmount
      } finally {
        this.loading = false
      }
    },

    async generateInitialGatepass(vehicleId) {
      this.loading = true
      try {
        const res = await api.generateGatepass({ vehicleId, type: 'initial' })
        const v = this._findVehicle(vehicleId)
        v.initialGatepass = res.gatepassNo
        return res.gatepassNo
      } finally {
        this.loading = false
      }
    },

    async markWorkCompleted(vehicleId) {
      this.loading = true
      try {
        await api.completeWork({ vehicleId })
        const v = this._findVehicle(vehicleId)
        v.status = STATUS.PENDING_APPROVAL
      } finally {
        this.loading = false
      }
    },

    async generateExitGatepass(vehicleId) {
      this.loading = true
      try {
        const res = await api.generateExitPass({ vehicleId })
        const v = this._findVehicle(vehicleId)
        v.exitGatepass = res.exitPassNo
        return res.exitPassNo
      } finally {
        this.loading = false
      }
    },

    // ── Deputy Manager ───────────────────────────────────────────────────────
    async approveBill(vehicleId, finalAmount) {
      this.loading = true
      try {
        await api.approveBill({ vehicleId, finalAmount })
        const v = this._findVehicle(vehicleId)
        v.finalBillAmount = finalAmount
        // Goes back to Supervisor for exit confirmation (not directly to Cashier)
        v.status = STATUS.AWAITING_EXIT_CONFIRMATION
      } finally {
        this.loading = false
      }
    },

    // ── Cashier / Checkout ───────────────────────────────────────────────────
    // Supervisor: generate exit gatepass then release vehicle to Cashier for payment
    async releaseToPayment(vehicleId) {
      this.loading = true
      try {
        const v = this._findVehicle(vehicleId)
        v.status = STATUS.PENDING_PAYMENT
      } finally {
        this.loading = false
      }
    },
    async collectPayment(vehicleId) {
      this.loading = true
      try {
        const res = await api.collectPayment({ vehicleId })
        const v = this._findVehicle(vehicleId)
        v.receiptNo = res.receiptNo
        v.status = STATUS.COMPLETED
        return res.receiptNo
      } finally {
        this.loading = false
      }
    },

    // ── Misc ─────────────────────────────────────────────────────────────────
    markNotificationsRead(supervisorId) {
      this.notifications
        .filter((n) => n.supervisorId === supervisorId && !n.read)
        .forEach((n) => (n.read = true))
    },

    _findVehicle(id) {
      const v = this.vehicles.find((v) => v.id === id)
      if (!v) throw new Error(`Vehicle ${id} not found`)
      return v
    },
  },
})
