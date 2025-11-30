<script setup>
import { onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import { Toaster } from '@/components/ui/toast'

const authStore = useAuthStore()
const userStore = useUserStore()

// Store unsubscribe function for cleanup
let unsubscribeAuth = null

// Initialize auth on app mount
onMounted(() => {
  unsubscribeAuth = authStore.initAuth()
  userStore.initializeUserStore()
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
