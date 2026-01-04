<script setup>
import { onMounted, onUnmounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import { useExerciseStore } from '@/stores/exerciseStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import { Toaster } from '@/components/ui/toast'

const authStore = useAuthStore()
const userStore = useUserStore()
const exerciseStore = useExerciseStore()
const workoutStore = useWorkoutStore()

// Store unsubscribe function for cleanup
let unsubscribeAuth = null
let unsubscribeWorkouts = null
let unsubscribeActive = null

// Initialize auth on app mount
onMounted(async () => {
  unsubscribeAuth = authStore.initAuth()
  userStore.initializeUserStore()

  // Load default exercises (local data, no auth required)
  try {
    await exerciseStore.fetchExercises()
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[App] Failed to load default exercises:', error)
    }
  }
})

// Watch for authentication and initialize workout store
// CRITICAL: Goals, Analytics, and Dashboard all depend on workout data
watch(
  () => authStore.uid,
  (uid) => {
    if (uid) {
      // User authenticated - subscribe to workouts
      if (import.meta.env.DEV) {
        console.log('[App] User authenticated, initializing workout store')
      }

      // Subscribe to all workouts (last year by default for goals/analytics)
      unsubscribeWorkouts = workoutStore.subscribeToWorkouts('year')

      // Subscribe to active workout (for quick log)
      unsubscribeActive = workoutStore.subscribeToActive()

      // Fetch custom exercises
      exerciseStore.fetchCustomExercises()
    } else {
      // User logged out - cleanup subscriptions
      if (import.meta.env.DEV) {
        console.log('[App] User logged out, cleaning up workout store')
      }

      // Cleanup workout subscriptions
      if (unsubscribeWorkouts) {
        unsubscribeWorkouts()
        unsubscribeWorkouts = null
      }

      if (unsubscribeActive) {
        unsubscribeActive()
        unsubscribeActive = null
      }

      // Clear workout data
      workoutStore.clearData()
    }
  },
  { immediate: true }
)

// CRITICAL: Cleanup Firebase listener on unmount
onUnmounted(() => {
  if (unsubscribeAuth) {
    unsubscribeAuth()
  }

  if (unsubscribeWorkouts) {
    unsubscribeWorkouts()
  }

  if (unsubscribeActive) {
    unsubscribeActive()
  }
})
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <RouterView />
    <Toaster />
  </div>
</template>
