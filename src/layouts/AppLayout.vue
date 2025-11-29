<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from './AppSidebar.vue'
import MobileNav from './MobileNav.vue'

const route = useRoute()

// Get page title from route meta or name
const pageTitle = computed(() => {
  return route.meta?.title || route.name || 'Obsessed'
})
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-background">
    <!-- Desktop Sidebar -->
    <AppSidebar class="hidden lg:flex" />

    <!-- Main Content Area -->
    <div class="flex flex-col flex-1 overflow-hidden">
      <!-- Mobile Header -->
      <header
        class="flex items-center justify-between h-16 px-4 border-b border-border lg:hidden"
      >
        <div class="flex items-center gap-2">
          <MobileNav />
          <h1 class="text-lg font-semibold">{{ pageTitle }}</h1>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto">
        <router-view v-slot="{ Component }">
          <transition
            name="fade"
            mode="out-in"
            enter-active-class="transition-opacity duration-200"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition-opacity duration-150"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Fade transition for route changes */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
