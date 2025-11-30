import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './authStore'
import {
  fetchDocument,
  setDocument,
  updateDocument,
  subscribeToDocument,
} from '@/firebase/firestore'
import { COLLECTIONS } from '@/firebase/firestore'
import { CONFIG } from '@/constants/config'

/**
 * @typedef {Object} UserSettings
 * @property {number} defaultRestTime - Default rest time in seconds
 * @property {'kg'|'lbs'} weightUnit - Weight unit preference
 * @property {'light'|'dark'|'system'} theme - Theme preference
 * @property {'uk'|'en'} locale - UI language preference
 * @property {boolean} notifications - Enable notifications
 * @property {boolean} autoStartTimer - Auto-start rest timer
 * @property {boolean} soundEnabled - Enable sound effects
 * @property {string[]} [favoriteExercises] - Array of favorite exercise IDs
 * @property {string[]} [recentlyUsedExercises] - Recently used exercise IDs
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
    favoriteExercises: [],
    recentlyUsedExercises: [],
  })
  const loading = ref(false)
  const error = ref(null)

  // Real-time listener cleanup
  let unsubscribeProfile = null
  let mediaQueryCleanup = null

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
      if (import.meta.env.DEV) {
        console.error('Error fetching profile:', err)
      }
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
          favoriteExercises: [],
          recentlyUsedExercises: [],
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
      if (import.meta.env.DEV) {
        console.error('Error creating profile:', err)
      }
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
      if (import.meta.env.DEV) {
        console.error('Error updating profile:', err)
      }
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

      // Update local settings immediately for instant UI feedback
      // The Firestore subscription will sync it back, ensuring consistency
      settings.value = updatedSettings

      // Apply theme if changed (for immediate visual feedback)
      if (newSettings.theme) {
        applyTheme(newSettings.theme)
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error updating settings:', err)
      }
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Toggle favorite exercise
   * @param {string} exerciseId - Exercise ID to toggle
   * @returns {Promise<void>}
   */
  async function toggleFavoriteExercise(exerciseId) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated')
    }

    const currentFavorites = settings.value.favoriteExercises || []
    const isFavorite = currentFavorites.includes(exerciseId)

    const updatedFavorites = isFavorite
      ? currentFavorites.filter((id) => id !== exerciseId)
      : [...currentFavorites, exerciseId]

    await updateSettings({ favoriteExercises: updatedFavorites })
  }

  /**
   * Add exercise to recently used
   * @param {string} exerciseId - Exercise ID
   * @returns {Promise<void>}
   */
  async function addRecentlyUsedExercise(exerciseId) {
    if (!authStore.uid) return

    const currentRecent = settings.value.recentlyUsedExercises || []

    // Remove if already exists
    const filtered = currentRecent.filter((id) => id !== exerciseId)

    // Add to beginning and keep only last 10
    const updatedRecent = [exerciseId, ...filtered].slice(0, CONFIG.exercise.MAX_RECENT_EXERCISES)

    await updateSettings({ recentlyUsedExercises: updatedRecent })
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
      if (import.meta.env.DEV) {
        console.error('Error updating stats:', err)
      }
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
        if (import.meta.env.DEV) {
          console.error('Error in profile subscription:', err)
        }
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

    // Cache to localStorage to prevent flash on next page load
    localStorage.setItem(CONFIG.storage.THEME, theme)
  }

  /**
   * Initialize theme on app load
   * CRITICAL: Call this AFTER Firestore settings are loaded to avoid race condition
   * Prioritizes: Firestore > localStorage > default
   */
  function initTheme() {
    // PRIORITY ORDER:
    // 1. Firestore settings (if available)
    // 2. localStorage cache (prevents flash)
    // 3. Default 'system'
    const firestoreTheme = settings.value?.theme
    const cachedTheme = localStorage.getItem(CONFIG.storage.THEME)
    const initialTheme = firestoreTheme || cachedTheme || 'system'

    // Apply theme immediately
    applyTheme(initialTheme)

    // Setup media query listener (always attach, conditionally execute)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleMediaChange = (e) => {
      // Only apply if user has 'system' preference
      if (settings.value.theme === 'system') {
        document.documentElement.classList.toggle('dark', e.matches)
      }
    }

    mediaQuery.addEventListener('change', handleMediaChange)

    // Store cleanup reference
    mediaQueryCleanup = () => {
      mediaQuery.removeEventListener('change', handleMediaChange)
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
    if (mediaQueryCleanup) {
      mediaQueryCleanup()
      mediaQueryCleanup = null
    }
  }

  /**
   * Clear error message
   */
  function clearError() {
    error.value = null
  }

  // Track if theme has been initialized
  let themeInitialized = false

  /**
   * Initialize userStore - sets up watchers and theme
   * Call this explicitly from App.vue onMounted
   */
  function initializeUserStore() {
    // Set up reactive watchers
    watch(
      () => authStore.userProfile,
      (newProfile) => {
        if (newProfile?.settings) {
          const oldTheme = settings.value.theme

          // Update settings from Firestore
          settings.value = {
            ...settings.value,
            ...newProfile.settings,
          }

          // Initialize theme ONCE after Firestore data loads (fixes race condition)
          if (!themeInitialized) {
            initTheme()
            themeInitialized = true
          } else if (newProfile.settings.theme && newProfile.settings.theme !== oldTheme) {
            // On subsequent updates, only apply if theme actually changed
            applyTheme(newProfile.settings.theme)
          }
        }
      },
      { immediate: true } // Run immediately to catch existing profile
    )

    // FALLBACK: If user is not authenticated or profile doesn't load,
    // initialize theme from localStorage after a short delay
    setTimeout(() => {
      if (!themeInitialized) {
        initTheme()
        themeInitialized = true
      }
    }, 500)
  }

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
    toggleFavoriteExercise,
    addRecentlyUsedExercise,
    updateStats,
    incrementWorkoutStats,
    subscribeToProfile,
    applyTheme,
    initTheme,
    initializeUserStore,
    unsubscribe,
    clearError,
  }
})
