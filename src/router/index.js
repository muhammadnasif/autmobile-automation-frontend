import { createRouter, createWebHistory } from 'vue-router'

import SecurityGuardView    from '../views/SecurityGuardView.vue'
import ManagerDashboard     from '../views/ManagerDashboard.vue'
import SupervisorDashboard  from '../views/SupervisorDashboard.vue'
import DeputyManagerView    from '../views/DeputyManagerView.vue'
import CheckoutExitView     from '../views/CheckoutExitView.vue'
import VehicleTrackingView  from '../views/VehicleTrackingView.vue'

const routes = [
  {
    path: '/',
    redirect: '/security',
  },
  {
    path: '/security',
    name: 'SecurityGuard',
    component: SecurityGuardView,
    meta: { title: 'Security Guard – Vehicle Entry', role: 'Security Guard', icon: '🛡️' },
  },
  {
    path: '/manager',
    name: 'ManagerDashboard',
    component: ManagerDashboard,
    meta: { title: 'Manager Dashboard – Job Assignment', role: 'Manager', icon: '📋' },
  },
  {
    path: '/supervisor',
    name: 'SupervisorDashboard',
    component: SupervisorDashboard,
    meta: { title: 'Supervisor Dashboard – Job Execution', role: 'Supervisor', icon: '🔧' },
  },
  {
    path: '/deputy-manager',
    name: 'DeputyManager',
    component: DeputyManagerView,
    meta: { title: 'Deputy Manager – Billing Finalization', role: 'Deputy Manager', icon: '💼' },
  },
  {
    path: '/checkout',
    name: 'Checkout',
    component: CheckoutExitView,
    meta: { title: 'Checkout & Exit', role: 'Cashier', icon: '💳' },
  },
  {
    path: '/tracking',
    name: 'VehicleTracking',
    component: VehicleTrackingView,
    meta: { title: 'Vehicle Tracking – Pipeline Overview', role: 'Tracking', icon: '📡' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.afterEach((to) => {
  document.title = `${to.meta.title ?? 'AutoWorkshop'} | AutoWorkshop MS`
})

export default router
