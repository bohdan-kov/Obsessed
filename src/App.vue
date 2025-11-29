<script setup>
import { onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { Toaster } from '@/components/ui/toast'

const authStore = useAuthStore()

// Store unsubscribe function for cleanup
let unsubscribeAuth = null

// Initialize auth on app mount
onMounted(() => {
  unsubscribeAuth = authStore.initAuth()
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
