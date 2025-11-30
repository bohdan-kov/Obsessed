import { computed } from 'vue'
import { useWindowSize } from '@vueuse/core'

/**
 * Dynamic Pagination Composable
 * Calculates optimal number of items per page based on viewport height
 *
 * @param {Object} options - Configuration options
 * @param {number} options.itemHeight - Estimated height of each item in pixels
 * @param {number} options.targetScreenRatio - Target ratio of content to screen height (default: 1.5)
 * @param {number} options.minItems - Minimum items per page (default: 5)
 * @param {number} options.maxItems - Maximum items per page (default: 50)
 * @param {number} options.headerOffset - Offset for fixed headers/nav in pixels (default: 200)
 * @returns {Object} Pagination utilities
 */
export function useDynamicPagination(options = {}) {
  const {
    itemHeight = 150, // Approximate height of an exercise card with stats
    targetScreenRatio = 1.5, // Cards should fit in ~1.5x screen height
    minItems = 5,
    maxItems = 50,
    headerOffset = 200, // Space for header, search bar, filters button
  } = options

  // Get reactive window dimensions
  const { height: windowHeight } = useWindowSize()

  /**
   * Calculate optimal items per page based on current viewport height
   */
  const itemsPerPage = computed(() => {
    // Calculate available height for content
    const availableHeight = windowHeight.value - headerOffset

    // Target height for content (1.5x screen = user scrolls down ~0.5 screen)
    const targetContentHeight = availableHeight * targetScreenRatio

    // Calculate how many items fit in that target height
    const calculatedItems = Math.floor(targetContentHeight / itemHeight)

    // Clamp between min and max
    const clampedItems = Math.max(minItems, Math.min(maxItems, calculatedItems))

    return clampedItems
  })

  /**
   * Get estimated total content height for current page
   */
  const estimatedPageHeight = computed(() => {
    return itemsPerPage.value * itemHeight
  })

  /**
   * Check if content will exceed one screen
   */
  const willScroll = computed(() => {
    return estimatedPageHeight.value > (windowHeight.value - headerOffset)
  })

  return {
    itemsPerPage,
    estimatedPageHeight,
    willScroll,
    windowHeight,
  }
}
