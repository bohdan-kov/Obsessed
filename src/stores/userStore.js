import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './authStore'
import {
  fetchDocument,
  setDocument,
  updateDocument,
  subscribeToDocument,
} from '@/firebase/firestore'
import { COLLECTIONS } from '@/firebase/firestore'

/**
 * @typedef {Object} UserSettings
 * @property {number} defaultRestTime - Default rest time in seconds
 * @property {'kg'|'lbs'} weightUnit - Weight unit preference
 * @property {'light'|'dark'|'system'} theme - Theme preference
 * @property {'uk'|'en'} locale - UI language preference
 * @property {boolean} notifications - Enable notifications
 * @property {boolean} autoStartTimer - Auto-start rest timer
 * @property {boolean} soundEnabled - Enable sound effects
 */

/**
 * @typedef {Object} UserStats
 * @property {number} totalWorkouts - Total completed workouts
 * @property {number} totalSets - Total sets completed
 * @property {number} totalVolume - Total volume lifted (kg)
 * @property {number} totalDuration - Total workout time (seconds)
 * @property {Date} [lastWorkout] - Last workout date
 * @property {number} currentStreak - Current workout streak
 * @property {number} longestStreak - Longest workout streak
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} id - User ID
 * @property {string} displayName - Display name
 * @property {string} email - Email address
 * @property {string} [photoURL] - Profile photo URL
 * @property {Date} createdAt - Account creation date
 * @property {UserSettings} settings - User settings
 * @property {UserStats} stats - User statistics
 * @property {string} [bio] - User bio
 * @property {Object} [personalInfo] - Personal information
 * @property {number} [personalInfo.age] - Age
 * @property {number} [personalInfo.weight] - Body weight
 * @property {number} [personalInfo.height] - Height in cm
 * @property {string} [personalInfo.gender] - Gender
 */

export const useUserStore = defineStore('user', () => {
  const authStore = useAuthStore()

  // State
  const profile = ref(null)
  const settings = ref({
    defaultRestTime: 90,
    weightUnit: 'kg',
    theme: 'system',
    locale: 'uk',
    notifications: true,
    autoStartTimer: true,
    soundEnabled: true,
  })
  const loading = ref(false)
  const error = ref(null)

  // Real-time listener cleanup
  let unsubscribeProfile = null

  // Getters
  /**
   * User's display name
   */
  const displayName = computed(() => {
    return profile.value?.displayName || authStore.displayName || 'User'
  })

  /**
   * User's email
   */
  const email = computed(() => {
    return profile.value?.email || authStore.email || ''
  })

  /**
   * User's photo URL
   */
  const photoURL = computed(() => {
    return profile.value?.photoURL || authStore.photoURL || ''
  })

  /**
   * User's total workouts
   */
  const totalWorkouts = computed(() => {
    return profile.value?.stats?.totalWorkouts || 0
  })

  /**
   * User's total volume lifted
   */
  const totalVolume = computed(() => {
    return profile.value?.stats?.totalVolume || 0
  })

  /**
   * User's current streak
   */
  const currentStreak = computed(() => {
    return profile.value?.stats?.currentStreak || 0
  })

  /**
   * Check if profile is complete
   */
  const isProfileComplete = computed(() => {
    if (!profile.value) return false
    return !!(
      profile.value.displayName &&
      profile.value.email &&
      profile.value.settings
    )
  })

  // Actions
  /**
   * Fetch user profile from Firestore
   * @returns {Promise<void>}
   */
  async function fetchProfile() {
    if (!authStore.uid) {
      throw new Error('User must be authenticated')
    }

    loading.value = true
    error.value = null

    try {
      const userProfile = await fetchDocument(COLLECTIONS.USERS, authStore.uid)

      if (userProfile) {
        profile.value = userProfile
        settings.value = userProfile.settings || settings.value
      } else {
        // Profile doesn't exist, create it
        await createProfile({
          displayName: authStore.displayName || '',
          email: authStore.email || '',
          photoURL: authStore.photoURL || '',
        })
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create user profile
   * Called after signup or when profile doesn't exist
   * @param {Object} userData - User data
   * @param {string} userData.displayName - Display name
   * @param {string} userData.email - Email
   * @param {string} [userData.photoURL] - Photo URL
   * @returns {Promise<void>}
   */
  async function createProfile(userData) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated')
    }

    loading.value = true
    error.value = null

    try {
      const profileData = {
        displayName: userData.displayName || '',
        email: userData.email || '',
        photoURL: userData.photoURL || '',
        settings: {
          defaultRestTime: 90,
          weightUnit: 'kg',
          theme: 'system',
          locale: 'uk',
          notifications: true,
          autoStartTimer: true,
          soundEnabled: true,
        },
        stats: {
          totalWorkouts: 0,
          totalSets: 0,
          totalVolume: 0,
          totalDuration: 0,
          currentStreak: 0,
          longestStreak: 0,
        },
      }

      await setDocument(COLLECTIONS.USERS, authStore.uid, profileData)

      profile.value = {
        id: authStore.uid,
        ...profileData,
      }

      settings.value = profileData.settings
    } catch (err) {
      console.error('Error creating profile:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update user profile
   * @param {Object} updates - Profile updates
   * @returns {Promise<void>}
   */
  async function updateProfile(updates) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated')
    }

    loading.value = true
    error.value = null

    try {
      await updateDocument(COLLECTIONS.USERS, authStore.uid, updates)

      // Update local state
      if (profile.value) {
        profile.value = {
          ...profile.value,
          ...updates,
        }
      }
    } catch (err) {
      console.error('Error updating profile:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update user settings
   * @param {Partial<UserSettings>} newSettings - Settings to update
   * @returns {Promise<void>}
   */
  async function updateSettings(newSettings) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated')
    }

    loading.value = true
    error.value = null

    try {
      const updatedSettings = {
        ...settings.value,
        ...newSettings,
      }

      await updateDocument(COLLECTIONS.USERS, authStore.uid, {
        settings: updatedSettings,
      })

      settings.value = updatedSettings

      // Apply theme if changed
      if (newSettings.theme) {
        applyTheme(newSettings.theme)
      }
    } catch (err) {
      console.error('Error updating settings:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update user statistics
   * @param {Partial<UserStats>} stats - Stats to update
   * @returns {Promise<void>}
   */
  async function updateStats(stats) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated')
    }

    loading.value = true
    error.value = null

    try {
      const currentStats = profile.value?.stats || {}
      const updatedStats = {
        ...currentStats,
        ...stats,
      }

      await updateDocument(COLLECTIONS.USERS, authStore.uid, {
        stats: updatedStats,
      })

      if (profile.value) {
        profile.value.stats = updatedStats
      }
    } catch (err) {
      console.error('Error updating stats:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Increment workout counter
   * Called after completing a workout
   * @param {Object} workoutData - Workout data
   * @param {number} workoutData.volume - Workout volume
   * @param {number} workoutData.duration - Workout duration
   * @param {number} workoutData.sets - Number of sets
   * @returns {Promise<void>}
   */
  async function incrementWorkoutStats(workoutData) {
    const currentStats = profile.value?.stats || {}

    const updatedStats = {
      totalWorkouts: (currentStats.totalWorkouts || 0) + 1,
      totalSets: (currentStats.totalSets || 0) + workoutData.sets,
      totalVolume: (currentStats.totalVolume || 0) + workoutData.volume,
      totalDuration: (currentStats.totalDuration || 0) + workoutData.duration,
      lastWorkout: new Date(),
    }

    await updateStats(updatedStats)
  }

  /**
   * Subscribe to profile real-time updates
   * @returns {Function|null} Unsubscribe function
   */
  function subscribeToProfile() {
    if (!authStore.uid) return null

    // Cleanup existing subscription
    if (unsubscribeProfile) {
      unsubscribeProfile()
    }

    unsubscribeProfile = subscribeToDocument(
      COLLECTIONS.USERS,
      authStore.uid,
      (profileData) => {
        if (profileData) {
          profile.value = profileData
          settings.value = profileData.settings || settings.value
        }
      },
      (err) => {
        console.error('Error in profile subscription:', err)
        error.value = err.message
      }
    )

    return unsubscribeProfile
  }

  /**
   * Apply theme to document
   * @param {'light'|'dark'|'system'} theme
   */
  function applyTheme(theme) {
    const root = document.documentElement

    if (theme === 'system') {
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches
      root.classList.toggle('dark', prefersDark)
    } else {
      root.classList.toggle('dark', theme === 'dark')
    }
  }

  /**
   * Initialize theme on app load
   */
  function initTheme() {
    applyTheme(settings.value.theme)

    // Listen for system theme changes
    if (settings.value.theme === 'system') {
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', (e) => {
          if (settings.value.theme === 'system') {
            document.documentElement.classList.toggle('dark', e.matches)
          }
        })
    }
  }

  /**
   * Cleanup subscriptions
   */
  function unsubscribe() {
    if (unsubscribeProfile) {
      unsubscribeProfile()
      unsubscribeProfile = null
    }
  }

  /**
   * Clear error message
   */
  function clearError() {
    error.value = null
  }

  // Initialize theme
  initTheme()

  return {
    // State
    profile: computed(() => profile.value),
    settings: computed(() => settings.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),

    // Getters
    displayName,
    email,
    photoURL,
    totalWorkouts,
    totalVolume,
    currentStreak,
    isProfileComplete,

    // Actions
    fetchProfile,
    createProfile,
    updateProfile,
    updateSettings,
    updateStats,
    incrementWorkoutStats,
    subscribeToProfile,
    applyTheme,
    initTheme,
    unsubscribe,
    clearError,
  }
})
