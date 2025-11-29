/**
 * Test utilities for Pinia store testing
 */

/**
 * Helper to set workout store state (workouts are exposed as computed, need to access internal ref)
 * @param {Object} store - Pinia store instance
 * @param {Array} workouts - Array of workout objects
 */
export function setWorkoutStoreWorkouts(store, workouts) {
  // Access the internal reactive state
  // Since workouts is exposed as computed(() => workouts.value),
  // we need to patch the underlying ref
  store.$patch((state) => {
    // Directly modify the state
    Object.assign(state, { workouts })
  })
}

/**
 * Helper to set workout store current workout
 * @param {Object} store - Pinia store instance
 * @param {Object} workout - Workout object
 */
export function setCurrentWorkout(store, workout) {
  store.$patch((state) => {
    Object.assign(state, { currentWorkout: workout })
  })
}
