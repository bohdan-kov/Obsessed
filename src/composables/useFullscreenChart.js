import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

/**
 * Composable for managing full-screen chart mode with Screen Orientation API
 *
 * Provides:
 * - Full-screen state management
 * - Landscape orientation lock with retry mechanism (graceful degradation)
 * - Keyboard shortcuts (Escape key)
 * - Auto-exit on navigation
 * - Focus management for accessibility
 * - Rapid toggle protection (debounce)
 * - Android back button support
 * - Proper cleanup on unmount
 *
 * @returns {Object} Full-screen chart controls
 * @returns {Ref<boolean>} isFullscreen - Whether full-screen mode is active
 * @returns {Ref<boolean>} isOrientationLocked - Whether orientation was successfully locked to landscape
 * @returns {Function} enterFullscreen - Activate full-screen mode and lock landscape
 * @returns {Function} exitFullscreen - Exit full-screen mode and unlock orientation
 *
 * @example
 * import { useFullscreenChart } from '@/composables/useFullscreenChart'
 *
 * const { isFullscreen, isOrientationLocked, enterFullscreen, exitFullscreen } = useFullscreenChart()
 *
 * // Show hint if orientation couldn't be locked
 * if (isFullscreen.value && !isOrientationLocked.value) {
 *   // Display rotation hint to user
 * }
 */
export function useFullscreenChart() {
  const router = useRouter()
  const isFullscreen = ref(false)
  const isOrientationLocked = ref(false)

  // Rapid toggle protection flag
  let isTransitioning = false

  // Check if router is available (may not be in test environment)
  const hasRouter = router && typeof router.beforeEach === 'function'

  /**
   * Lock screen orientation to landscape with retry logic
   * Handles timing issues and ensures lock succeeds when possible
   *
   * @param {number} maxRetries - Maximum number of retry attempts
   * @param {number} delay - Delay between retries in milliseconds
   * @returns {Promise<boolean>} Whether lock succeeded
   */
  async function lockOrientationWithRetry(maxRetries = 3, delay = 100) {
    if (!screen?.orientation?.lock) {
      if (import.meta.env.DEV) {
        console.debug('[useFullscreenChart] Screen Orientation API not available')
      }
      return false
    }

    // Check if document is visible and active (required for orientation lock)
    if (document.hidden || !document.hasFocus()) {
      if (import.meta.env.DEV) {
        console.debug('[useFullscreenChart] Document not visible/focused, deferring orientation lock')
      }
      // Wait a bit for document to become active
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await screen.orientation.lock('landscape')

        if (import.meta.env.DEV) {
          console.debug(`[useFullscreenChart] Orientation locked to landscape (attempt ${attempt}/${maxRetries})`)
        }

        return true
      } catch (err) {
        // Common errors:
        // - NotSupportedError: Device doesn't support orientation lock
        // - SecurityError: Document is not fully active or secure context required
        // - AbortError: Request was aborted (e.g., another lock request)
        // - InvalidStateError: Document is not visible

        const isLastAttempt = attempt === maxRetries
        const isFatalError = err.name === 'NotSupportedError'

        if (import.meta.env.DEV) {
          console.debug(
            `[useFullscreenChart] Orientation lock attempt ${attempt}/${maxRetries} failed:`,
            err.name,
            err.message,
            isLastAttempt ? '(final attempt)' : `(retrying in ${delay}ms)`
          )
        }

        // Don't retry on fatal errors (device doesn't support orientation lock)
        if (isFatalError) {
          if (import.meta.env.DEV) {
            console.debug('[useFullscreenChart] Device does not support orientation lock, aborting retries')
          }
          return false
        }

        // Wait before retrying (unless this was the last attempt)
        if (!isLastAttempt) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    if (import.meta.env.DEV) {
      console.warn('[useFullscreenChart] Failed to lock orientation after all retry attempts')
    }

    return false
  }

  /**
   * Enter full-screen mode and lock screen to landscape orientation
   * Uses Screen Orientation API with graceful degradation for unsupported browsers
   * Also manages focus for keyboard accessibility
   * Includes rapid toggle protection and retry logic for orientation lock
   */
  async function enterFullscreen() {
    // Prevent rapid toggling
    if (isTransitioning || isFullscreen.value) return

    isTransitioning = true
    isFullscreen.value = true

    // Wait for Vue to render the overlay (Teleport to body)
    // This ensures the fullscreen element is in the DOM before attempting orientation lock
    await nextTick()
    await nextTick() // Double nextTick for Teleport

    // Try to lock orientation to landscape with retry logic
    // Screen Orientation API support:
    // - iOS Safari 16.4+
    // - Chrome Mobile 113+
    // - Firefox Mobile 115+
    // - Samsung Internet 21+
    const lockSucceeded = await lockOrientationWithRetry()
    isOrientationLocked.value = lockSucceeded

    // Focus management for accessibility (WCAG 2.1 compliance)
    // Overlay is already rendered (we waited above), now focus the close button
    try {
      // Find and focus the close button for keyboard navigation
      // Selector targets both Ukrainian and English aria-labels
      const closeButton = document.querySelector(
        '[aria-label*="Закрити"], [aria-label*="Close"]',
      )

      if (closeButton) {
        closeButton.focus()
      } else if (import.meta.env.DEV) {
        console.debug('[useFullscreenChart] Close button not found for focus management')
      }
    } catch (err) {
      // Focus management failure shouldn't break functionality
      if (import.meta.env.DEV) {
        console.error('[useFullscreenChart] Focus management failed:', err)
      }
    }

    // Push a fake history state for Android back button support
    // When user presses back, popstate event will fire and close full-screen
    // This prevents back button from navigating away from the page
    try {
      window.history.pushState({ fullscreenChart: true }, '')
    } catch (err) {
      // History API might fail in some edge cases (e.g., iframe)
      if (import.meta.env.DEV) {
        console.debug('[useFullscreenChart] Failed to push history state:', err)
      }
    }

    // Reset transition flag after animation completes (200ms fade)
    setTimeout(() => {
      isTransitioning = false
    }, 250)
  }

  /**
   * Exit full-screen mode and unlock screen orientation
   * Includes rapid toggle protection
   */
  async function exitFullscreen() {
    // Prevent rapid toggling
    if (isTransitioning || !isFullscreen.value) return

    isTransitioning = true
    isFullscreen.value = false
    isOrientationLocked.value = false

    // Unlock orientation if it was locked
    if (screen?.orientation?.unlock) {
      try {
        screen.orientation.unlock()
      } catch (err) {
        // Fail silently - unlock failures are usually harmless
        // Common errors:
        // - InvalidStateError: No lock was set
        // - SecurityError: Document is not fully active
        if (import.meta.env.DEV) {
          console.debug('[useFullscreenChart] Screen orientation unlock failed:', err.name, err.message)
        }
      }
    }

    // Reset transition flag after animation completes (200ms fade)
    setTimeout(() => {
      isTransitioning = false
    }, 250)
  }

  /**
   * Handle Escape key press to exit full-screen
   * @param {KeyboardEvent} event - Keyboard event
   */
  function handleKeydown(event) {
    if (event.key === 'Escape' && isFullscreen.value) {
      exitFullscreen()
    }
  }

  /**
   * Handle Android back button via popstate event
   * When user opens full-screen, we push a fake history state
   * When they press back button, popstate fires and we close full-screen
   */
  function handlePopState() {
    if (isFullscreen.value) {
      exitFullscreen()
    }
  }

  /**
   * Router guard to auto-exit full-screen on navigation
   * Ensures user doesn't get stuck in full-screen when navigating away
   */
  let unwatch = null

  onMounted(() => {
    // Add Escape key listener
    document.addEventListener('keydown', handleKeydown)

    // Add popstate listener for Android back button support
    window.addEventListener('popstate', handlePopState)

    // Add router guard for auto-exit on navigation (only if router is available)
    if (hasRouter) {
      unwatch = router.beforeEach(() => {
        if (isFullscreen.value) {
          exitFullscreen()
        }
      })
    }
  })

  /**
   * Cleanup on component unmount
   * - Remove event listeners
   * - Remove router guard
   * - Unlock orientation if still locked
   */
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
    window.removeEventListener('popstate', handlePopState)

    // Remove router guard
    if (unwatch) {
      unwatch()
    }

    // Unlock orientation if component is unmounted while in full-screen
    if (isFullscreen.value && screen?.orientation?.unlock) {
      try {
        screen.orientation.unlock()
      } catch (err) {
        // Cleanup failures are logged but don't throw
        if (import.meta.env.DEV) {
          console.debug('[useFullscreenChart] Screen orientation unlock on unmount failed:', err.name, err.message)
        }
      }
    }
  })

  return {
    isFullscreen,
    isOrientationLocked,
    enterFullscreen,
    exitFullscreen,
  }
}
