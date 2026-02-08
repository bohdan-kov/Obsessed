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
watch(
  () => authStore.uid,
  (uid) => {
    if (uid) {
      // Subscribe to active workout only
      unsubscribeActive = workoutStore.subscribeToActive()

      // Fetch custom exercises
      exerciseStore.fetchCustomExercises()
    } else {
      // Cleanup workout subscriptions
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
