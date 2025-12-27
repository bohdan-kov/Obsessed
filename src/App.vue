<script setup>
import { onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import { useExerciseStore } from '@/stores/exerciseStore'
import { Toaster } from '@/components/ui/toast'

const authStore = useAuthStore()
const userStore = useUserStore()
const exerciseStore = useExerciseStore()

// Store unsubscribe function for cleanup
let unsubscribeAuth = null

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

// CRITICAL: Cleanup Firebase listener on unmount
onUnmounted(() => {
  if (unsubscribeAuth) {
    unsubscribeAuth()
  }
})
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <RouterView />
    <Toaster />
  </div>
</template>
