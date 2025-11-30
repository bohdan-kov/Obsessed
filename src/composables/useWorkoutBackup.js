import { CONFIG } from '@/constants/config'

const STORAGE_KEY = CONFIG.storage.ACTIVE_WORKOUT_BACKUP
const SCHEMA_VERSION = 1

/**
 * Composable for localStorage backup of active workout
 * Handles Firestore Timestamp ↔ ISO8601 conversion
 *
 * @returns {Object} Backup operations
 */
export function useWorkoutBackup() {
  /**
   * Save workout to localStorage
   *
   * @param {Object} workout - Workout object
   * @param {Array} pendingChanges - Queue of unsynced changes
   */
  function saveBackup(workout, pendingChanges = []) {
    if (!workout) {
      clearBackup()
      return
    }

    // Validation: Ensure workout has required fields
    if (!workout.id || !workout.startedAt) {
      return
    }

    try {
      const backup = {
        version: SCHEMA_VERSION,
        workoutId: workout.id,
        localUpdatedAt: new Date().toISOString(),
        firestoreSyncedAt: workout.lastSavedAt
          ? workout.lastSavedAt.toDate
            ? workout.lastSavedAt.toDate().toISOString()
            : new Date(workout.lastSavedAt).toISOString()
          : null,
        workout: serializeWorkout(workout),
        pendingChanges,
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(backup))
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to save workout backup:', error)
      }
      // Continue - backup is nice-to-have, not critical
    }
  }

  /**
   * Load workout from localStorage
   *
   * @returns {Object|null} Backup data or null
   */
  function loadBackup() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null

      const backup = JSON.parse(raw)

      // Schema migration if needed
      if (backup.version !== SCHEMA_VERSION) {
        clearBackup()
        return null
      }

      return {
        ...backup,
        workout: deserializeWorkout(backup.workout),
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to load workout backup:', error)
      }
      return null
    }
  }

  /**
   * Clear workout backup from localStorage
   */
  function clearBackup() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to clear workout backup:', error)
      }
    }
  }

  /**
   * Check if backup exists
   *
   * @returns {boolean}
   */
  function hasBackup() {
    try {
      return !!localStorage.getItem(STORAGE_KEY)
    } catch {
      return false
    }
  }

  /**
   * Helper to safely convert timestamp to ISO string
   *
   * @param {*} value - Timestamp value (Firestore Timestamp, Date, string, or null)
   * @returns {string|null} ISO8601 string or null
   */
  function toISOString(value) {
    if (!value) return null

    try {
      // Handle Firestore Timestamp
      if (value.toDate && typeof value.toDate === 'function') {
        return value.toDate().toISOString()
      }

      // Handle Date object
      if (value instanceof Date) {
        return value.toISOString()
      }

      // Handle ISO string
      if (typeof value === 'string') {
        return new Date(value).toISOString()
      }

      return null
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to convert timestamp to ISO:', error, value)
      }
      return null
    }
  }

  /**
   * Convert Firestore Timestamps to ISO8601 strings for JSON serialization
   *
   * @param {Object} workout - Workout object
   * @returns {Object} Serialized workout
   */
  function serializeWorkout(workout) {
    return {
      ...workout,
      startedAt: toISOString(workout.startedAt),
      completedAt: toISOString(workout.completedAt),
      lastSavedAt: toISOString(workout.lastSavedAt),
      exercises: workout.exercises?.map((exercise) => ({
        ...exercise,
        sets: exercise.sets?.map((set) => ({
          ...set,
          completedAt: toISOString(set.completedAt),
        })),
      })),
    }
  }

  /**
   * Convert ISO8601 strings back to Date objects
   *
   * @param {Object} data - Serialized workout
   * @returns {Object} Deserialized workout
   */
  function deserializeWorkout(data) {
    return {
      ...data,
      startedAt: data.startedAt ? new Date(data.startedAt) : null,
      completedAt: data.completedAt ? new Date(data.completedAt) : null,
      lastSavedAt: data.lastSavedAt ? new Date(data.lastSavedAt) : null,
      exercises: data.exercises?.map((exercise) => ({
        ...exercise,
        sets: exercise.sets?.map((set) => ({
          ...set,
          completedAt: set.completedAt ? new Date(set.completedAt) : null,
        })),
      })),
    }
  }

  return {
    saveBackup,
    loadBackup,
    clearBackup,
    hasBackup,
  }
}
