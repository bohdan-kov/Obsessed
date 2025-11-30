import { createRouter, createWebHistory } from 'vue-router'
import { watch } from 'vue'
import { useAuthStore } from '@/stores/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Auth routes (no layout)
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/pages/auth/LoginView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/pages/auth/RegisterView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/verify-email',
      name: 'VerifyEmail',
      component: () => import('@/pages/auth/VerifyEmailView.vue'),
      meta: { requiresAuth: true },
    },

    // App routes (with layout)
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { requiresAuth: true, requiresVerification: true },
      children: [
        {
          path: '',
          name: 'Dashboard',
          component: () => import('@/pages/dashboard/DashboardView.vue'),
          meta: { title: 'Dashboard' },
        },
        {
          path: 'workouts',
          name: 'Workouts',
          component: () => import('@/pages/workouts/WorkoutsView.vue'),
          meta: { title: 'Workouts' },
        },
        {
          path: 'exercises',
          name: 'Exercises',
          component: () => import('@/pages/exercises/ExercisesView.vue'),
          meta: { title: 'Exercises' },
        },
        {
          path: 'exercises/:id',
          name: 'ExerciseDetail',
          component: () => import('@/pages/exercises/ExerciseDetailView.vue'),
          meta: { title: 'Exercise Detail' },
          props: true,
        },
        {
          path: 'analytics',
          name: 'Analytics',
          component: () => import('@/pages/analytics/AnalyticsView.vue'),
          meta: { title: 'Analytics' },
        },
        {
          path: 'settings',
          name: 'Settings',
          component: () => import('@/pages/settings/SettingsView.vue'),
          meta: { title: 'Settings' },
        },
      ],
    },
  ],
})

/**
 * Global navigation guard
 * Handles authentication and email verification checks
 */
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // Wait for auth to initialize
  // CRITICAL: This prevents race condition on page refresh
  if (authStore.initializing) {
    // Wait for auth state to be determined
    await new Promise((resolve) => {
      const unwatch = watch(
        () => authStore.initializing,
        (isInitializing) => {
          if (!isInitializing) {
            unwatch()
            resolve()
          }
        },
        { immediate: true } // Check current value immediately
      )
    })
  }

  const requiresAuth = to.meta.requiresAuth
  const requiresGuest = to.meta.requiresGuest
  const requiresVerification = to.meta.requiresVerification

  // Guest-only routes (login, register)
  if (requiresGuest && authStore.isAuthenticated) {
    return next({ name: 'Dashboard' })
  }

  // Protected routes
  if (requiresAuth && !authStore.isAuthenticated) {
    return next({
      name: 'Login',
      query: { redirect: to.fullPath },
    })
  }

  // Email verification required
  if (
    requiresVerification &&
    authStore.isAuthenticated &&
    !authStore.isEmailVerified
  ) {
    return next({ name: 'VerifyEmail' })
  }

  // Allow navigation
  next()
})

export default router
