<script setup>
import { computed, ref, provide, onMounted, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { useWindowSize } from '@vueuse/core'
import { CONFIG } from '@/constants/config'
import { useOnboarding } from '@/composables/useOnboarding'
import { useWorkoutStore } from '@/stores/workoutStore'
import AppSidebar from './AppSidebar.vue'
import MobileNav from './MobileNav.vue'
import QuickLogSheet from '@/components/QuickLogSheet.vue'

// Lazy-load onboarding component (only loads when needed)
const OnboardingFlow = defineAsyncComponent(() => import('@/components/onboarding/OnboardingFlow.vue'))

const route = useRoute()
const { width } = useWindowSize()
const { shouldShowOnboarding } = useOnboarding()
const workoutStore = useWorkoutStore()

// Page metadata for mobile header (provided to child components via usePageMeta)
const pageMeta = ref({ title: '', description: '' })
provide('pageMeta', pageMeta)

// Fallback page title from route meta or name (used if pageMeta is not set)
const pageTitle = computed(() => {
  return pageMeta.value.title || route.meta?.title || route.name || 'Obsessed'
})

// Responsive breakpoint logic
// Mobile: < 768px - Only mobile nav
// Tablet: 768px - 1223px - Sidebar collapsed
// Desktop: >= 1224px - Sidebar expanded
const isMobile = computed(() => width.value < CONFIG.ui.TABLET_BREAKPOINT)
const isTablet = computed(() =>
  width.value >= CONFIG.ui.TABLET_BREAKPOINT &&
  width.value < CONFIG.ui.SIDEBAR_EXPAND_BREAKPOINT
)

// Control what shows where
const showSidebar = computed(() => !isMobile.value) // Show sidebar on tablet and desktop
const showMobileNav = computed(() => isMobile.value) // Show mobile nav only on mobile
const sidebarCollapsed = computed(() => isTablet.value) // Auto-collapse on tablet

// QuickLog control for onboarding (provided to AppSidebar)
const onboardingQuickLogOpen = ref(false)
provide('onboardingQuickLogOpen', onboardingQuickLogOpen)

// Handle onboarding completion (clears mock data and fetches real data)
async function handleOnboardingComplete() {
  // Clear mock workout data
  workoutStore.clearData()

  // Fetch real workout data from Firestore
  try {
    await workoutStore.ensureDataLoaded({ force: true, subscribe: true })
  } catch (error) {
    // Silent fail - data will be loaded on next navigation or refresh
  }
}
</script>

<template>
  <div class="flex h-screen-safe overflow-hidden bg-background">
    <!-- Desktop/Tablet Sidebar - Hidden on mobile, visible on tablet (collapsed) and desktop (expanded) -->
    <AppSidebar v-if="showSidebar" :force-collapsed="sidebarCollapsed" class="hidden md:flex" />

    <!-- Main Content Area -->
    <div class="flex flex-col flex-1 overflow-hidden">
      <!-- Mobile Header - Only visible on mobile -->
      <header
        v-if="showMobileNav"
        :class="[
          'flex items-center px-4 border-b border-border md:hidden',
          pageMeta.description ? 'h-20' : 'h-16'
        ]"
      >
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <MobileNav />
          <div class="flex-1 min-w-0">
            <h1 class="text-lg font-semibold truncate">{{ pageTitle }}</h1>
            <p v-if="pageMeta.description" class="text-xs text-muted-foreground truncate">
              {{ pageMeta.description }}
            </p>
          </div>
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

    <!-- Quick Log Sheet (global - works on all devices) -->
    <QuickLogSheet v-model:open="onboardingQuickLogOpen" />

    <!-- Onboarding Flow (overlay on top of everything) -->
    <OnboardingFlow
      v-if="shouldShowOnboarding"
      @complete="handleOnboardingComplete"
    />
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
