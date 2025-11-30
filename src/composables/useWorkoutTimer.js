import { ref, computed, onMounted, onUnmounted, unref, watch } from 'vue'
import { CONFIG } from '@/constants/config'

// Singleton state - shared across all instances
let sharedState = null

/**
 * Composable for tracking elapsed workout time
 * Pauses when document is hidden, resumes and recalculates on visible
 *
 * Uses singleton pattern - all calls to useWorkoutTimer() share the same timer instance
 * but watches the PROVIDED startedAt ref/computed for changes
 *
 * @param {Ref<Date>|ComputedRef<Date>|null} startedAtRef - Workout start time (reactive)
 * @returns {Object} Timer state and controls
 */
export function useWorkoutTimer(startedAtRef) {
  // If shared state exists, return it (singleton pattern)
  // BUT we need to re-setup the watch with the new startedAtRef
  if (sharedState) {
    // Don't return early - we need to setup watch for the new startedAtRef
  }

  const elapsed = sharedState?.elapsed || ref(0) // Seconds elapsed
  const isRunning = sharedState?.isRunning || ref(false)
  let intervalId = sharedState?.intervalId || null
  let visibilityListenerAttached = sharedState?.visibilityListenerAttached || false

  /**
   * Calculate elapsed time from start to now
   */
  function calculateElapsed() {
    const started = unref(startedAtRef) // Use unref to get value from ref/computed

    // Defensive check - handle null, undefined, or invalid values
    if (!started) {
      return 0
    }

    try {
      let start

      // Handle Firestore Timestamp
      if (started.toDate && typeof started.toDate === 'function') {
        start = started.toDate()
      }
      // Handle Date object
      else if (started instanceof Date) {
        start = started
      }
      // Handle string (ISO)
      else if (typeof started === 'string') {
        start = new Date(started)
      }
      // Handle number (timestamp in milliseconds)
      else if (typeof started === 'number') {
        start = new Date(started)
      } else {
        return 0
      }

      // Validate date
      if (isNaN(start.getTime())) {
        return 0
      }

      const now = new Date()
      const elapsed = Math.floor((now - start) / 1000)

      // Sanity check - don't return negative values
      return elapsed >= 0 ? elapsed : 0
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error calculating elapsed time:', error)
      }
      return 0
    }
  }

  /**
   * Update elapsed time
   */
  function tick() {
    elapsed.value = calculateElapsed()
  }

  /**
   * Start the timer
   */
  function start() {
    const started = unref(startedAtRef)

    if (isRunning.value) {
      return
    }

    if (!started) {
      return
    }

    // Clear any existing interval (defensive)
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }

    isRunning.value = true
    tick() // Immediate update

    intervalId = setInterval(() => {
      tick()
    }, CONFIG.activeWorkout.TIMER_UPDATE_INTERVAL)
  }

  /**
   * Pause the timer
   */
  function pause() {
    if (!isRunning.value) return

    isRunning.value = false
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  /**
   * Reset the timer
   */
  function reset() {
    pause()
    elapsed.value = 0
  }

  /**
   * Format seconds as HH:MM:SS or MM:SS
   */
  function formatTime(seconds) {
    // Defensive check - handle NaN or negative values
    if (isNaN(seconds) || seconds < 0) {
      return '00:00'
    }

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  /**
   * Formatted elapsed time
   */
  const formattedTime = computed(() => formatTime(elapsed.value))

  /**
   * Handle visibility change (pause when hidden, resume when visible)
   */
  function handleVisibilityChange() {
    const started = unref(startedAtRef)

    // Only pause if timer is actually running
    if (document.visibilityState === 'hidden' && isRunning.value) {
      pause()
    }
    // Only start if timer is not running and we have a valid start time
    else if (document.visibilityState === 'visible' && started && !isRunning.value) {
      start()
    }
  }

  // Watch for startedAt changes and restart timer
  // Using a flag to prevent infinite loops from internal state changes
  let isWatchHandling = false

  watch(
    () => unref(startedAtRef),
    (newValue, oldValue) => {
      // Prevent re-entry during watch handling
      if (isWatchHandling) {
        return
      }

      // Compare timestamps to detect actual changes
      // This handles Date, Timestamp, string, and null values
      const getTimestamp = (val) => {
        if (!val) return null
        if (val.toDate && typeof val.toDate === 'function') return val.toDate().getTime()
        if (val instanceof Date) return val.getTime()
        if (typeof val === 'string') return new Date(val).getTime()
        if (typeof val === 'number') return val
        return null
      }

      const newTimestamp = getTimestamp(newValue)
      const oldTimestamp = getTimestamp(oldValue)

      // Only act if the timestamp actually changed
      if (newTimestamp === oldTimestamp) {
        return
      }

      isWatchHandling = true

      try {
        if (newValue && !isRunning.value) {
          start()
        } else if (!newValue && isRunning.value) {
          pause()
        }
      } finally {
        isWatchHandling = false
      }
    },
    { immediate: true },
  )

  // Only set up lifecycle hooks and create API if first time (singleton not exists)
  if (!sharedState) {
    onMounted(() => {
      // Only attach listener once (singleton pattern)
      if (!visibilityListenerAttached) {
        document.addEventListener('visibilitychange', handleVisibilityChange)
        visibilityListenerAttached = true
      }
    })

    onUnmounted(() => {
      // Don't clean up on individual unmounts - timer should persist
      // Only clean up when the app unmounts (which effectively never happens in SPA)
    })

    // Create API object
    const api = {
      elapsed,
      isRunning,
      formattedTime,
      formattedElapsedTime: formattedTime, // Alias for consistency
      start,
      pause,
      reset,
      formatTime,
    }

    // Store as singleton
    sharedState = {
      api,
      elapsed,
      isRunning,
      intervalId,
      visibilityListenerAttached,
    }
  }

  return sharedState.api
}

/**
 * Reset the singleton state (useful for testing or manual cleanup)
 */
export function resetWorkoutTimer() {
  if (sharedState) {
    if (sharedState.api.isRunning.value) {
      sharedState.api.pause()
    }
    sharedState = null
  }
}
