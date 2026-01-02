<script setup>
import { X } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

/**
 * FullscreenChartOverlay - Full-screen modal overlay for charts
 *
 * Features:
 * - Vue Teleport to body for clean DOM structure
 * - Fixed overlay with dark background
 * - Close button (top-left, 44x44px touch target)
 * - Fade transition (200ms ease-out)
 * - iOS safe area support (notch, home indicator)
 * - ARIA attributes for accessibility
 * - Slot for chart content
 *
 * @example
 * <FullscreenChartOverlay
 *   :is-open="isFullscreen"
 *   :title="t('analytics.muscles.volumeOverTime.title')"
 *   @close="exitFullscreen"
 * >
 *   <ChartContainer>...</ChartContainer>
 * </FullscreenChartOverlay>
 */

defineProps({
  /**
   * Controls overlay visibility
   * @type {Boolean}
   * @required
   */
  isOpen: {
    type: Boolean,
    required: true,
  },
  /**
   * Chart title displayed in header
   * @type {String}
   * @optional
   */
  title: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close'])

const { t } = useI18n()

/**
 * Handle close button click
 */
function handleClose() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 bg-background flex flex-col"
        role="dialog"
        aria-modal="true"
        :aria-label="t('charts.fullscreen.active')"
      >
        <!-- Header: Close button + Title + Spacer -->
        <div
          class="flex items-center justify-between px-4 py-3 border-b border-border"
          style="
            padding-left: max(env(safe-area-inset-left, 1rem), 1rem);
            padding-right: max(env(safe-area-inset-right, 1rem), 1rem);
          "
        >
          <!-- Close button (top-left, 44x44px touch target) -->
          <button
            type="button"
            @click="handleClose"
            class="inline-flex items-center justify-center w-11 h-11 rounded-md hover:bg-muted transition-colors touch-manipulation shrink-0"
            :aria-label="t('charts.fullscreen.close')"
          >
            <X class="w-5 h-5" />
          </button>

          <!-- Chart title (centered) -->
          <h2
            v-if="title"
            class="text-base font-semibold text-foreground flex-1 text-center px-2"
          >
            {{ title }}
          </h2>

          <!-- Spacer for symmetry (same width as close button) -->
          <div class="w-11 shrink-0" />
        </div>

        <!-- Chart content area -->
        <div
          class="flex-1 overflow-hidden flex flex-col"
          style="
            padding-bottom: max(env(safe-area-inset-bottom, 0.5rem), 0.5rem);
            padding-left: max(env(safe-area-inset-left, 0.5rem), 0.5rem);
            padding-right: max(env(safe-area-inset-right, 0.5rem), 0.5rem);
          "
        >
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/**
 * Ensure smooth touch scrolling on iOS
 * and prevent overscroll bounce on full-screen overlay
 */
.overflow-auto {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

/**
 * CSS custom property for header height
 * Useful for calculations if needed
 */
:root {
  --fullscreen-header-height: 60px;
}
</style>
