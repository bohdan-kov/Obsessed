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
 * @typedef {Object} TableSettings
 * @property {Object} columns - Column visibility settings
 * @property {boolean} columns.type - Show exercise type column
 * @property {boolean} columns.status - Show status column
 * @property {boolean} columns.sets - Show sets column
 * @property {boolean} columns.reps - Show reps column
 * @property {boolean} columns.weight - Show weight column
 */

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
 * @property {TableSettings} [tableSettings] - Exercise table customization settings
 * @property {boolean} [hasCompletedOnboarding] - Whether user has completed onboarding
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

/**
 * Default table settings - all columns visible by default
 * Structure: { [tabName]: { columns: { [columnName]: boolean } } }
 */
const DEFAULT_TABLE_SETTINGS = {
  overview: {
    columns: {
      type: true,
      status: true,
      sets: true,
      reps: true,
      weight: true,
    },
  },
  history: {
    columns: {
      exercises: true,
      duration: true,
      volume: true,
      status: true,
    },
  },
  exercises: {
    columns: {
      lastPerformed: true,
      totalSets: true,
      totalVolume: true,
      timesPerformed: true,
    },
  },
}

/**
 * Migrate legacy table settings to new tab-specific structure
 * @param {Object} oldSettings - Legacy settings with flat { columns: { ... } } structure
 * @returns {Object} New settings with { overview: { columns: ... }, history: { columns: ... }, exercises: { columns: ... } } structure
 */
function migrateTableSettings(oldSettings) {
  // If oldSettings has flat structure (legacy format)
  if (oldSettings?.columns && !oldSettings.overview) {
    return {
      overview: { columns: { ...oldSettings.columns } },
      history: { columns: { ...DEFAULT_TABLE_SETTINGS.history.columns } },
      exercises: { columns: { ...DEFAULT_TABLE_SETTINGS.exercises.columns } },
    }
  }
  // Already in new format or no settings
  return oldSettings
}

/**
 * Cache table settings to localStorage for fast initial load
 * @param {TableSettings} settings - Table settings object with tab-specific structure
 *
 * Storage format: { "overview": { "columns": { ... } }, "history": { "columns": { ... } }, ... }
 * This matches the Firestore structure exactly
 */
function cacheTableSettings(settings) {
  try {
    localStorage.setItem(CONFIG.storage.TABLE_SETTINGS, JSON.stringify(settings))
  } catch (err) {
    // Silent fail - localStorage errors are non-critical
    if (import.meta.env.DEV) {
      console.error('[userStore] localStorage save failed:', err)
    }
  }
}

/**
 * Load cached table settings from localStorage
 * @returns {TableSettings|null} Cached settings object or null if not found/invalid
 *
 * Returns: { overview: { columns: { ... } }, history: { columns: { ... } }, ... } or null
 * This is used during initialization to show correct state before Firestore loads
 * Automatically migrates legacy format if detected
 */
function loadCachedTableSettings() {
  try {
    const cached = localStorage.getItem(CONFIG.storage.TABLE_SETTINGS)
    if (!cached) return null

    const parsed = JSON.parse(cached)
    // Migrate if legacy format detected
    return migrateTableSettings(parsed)
  } catch (err) {
    // Silent fail - localStorage errors are non-critical
    if (import.meta.env.DEV) {
      console.error('[userStore] localStorage read failed:', err)
    }
    return null
  }
}

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
    tableSettings: DEFAULT_TABLE_SETTINGS,
    hasCompletedOnboarding: undefined, // undefined = not set (for existing users), false = show onboarding, true = completed
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

  /**
   * Table settings with default fallback
   *
   * Returns the full tableSettings object with tab-specific structure:
   * { overview: { columns: { ... } }, history: { columns: { ... } }, exercises: { columns: { ... } } }
   * - If user has custom settings, returns those (merged with defaults by watcher)
   * - If no settings exist yet, returns DEFAULT_TABLE_SETTINGS (all tabs with all columns visible)
   *
   * Note: The watcher already handles merging Firestore data with defaults,
   * so this computed just returns what's in settings.value.tableSettings
   */
  const tableSettings = computed(() => {
    return settings.value?.tableSettings || DEFAULT_TABLE_SETTINGS
  })

  /**
   * User's current body weight in kg (storage unit)
   * Returns null if never set, allowing UI to show placeholder
   */
  const currentWeight = computed(() => {
    return profile.value?.personalInfo?.weight ?? null
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
        console.error('[userStore] Error fetching profile:', err)
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
          tableSettings: DEFAULT_TABLE_SETTINGS,
          hasCompletedOnboarding: false, // New users should see onboarding
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
        console.error('[userStore] Error creating profile:', err)
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

      // Update local state with deep merge for nested objects
      if (profile.value) {
        // Deep merge personalInfo if it exists in updates
        if (updates.personalInfo) {
          profile.value = {
            ...profile.value,
            ...updates,
            personalInfo: {
              ...profile.value.personalInfo,
              ...updates.personalInfo,
            },
          }
        } else {
          // Shallow merge for other updates
          profile.value = {
            ...profile.value,
            ...updates,
          }
        }
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[userStore] Error updating profile:', err)
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
        console.error('[userStore] Error updating settings:', err)
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
        console.error('[userStore] Error updating stats:', err)
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
   * Update user's body weight
   * @param {number} weightInKg - Weight in kg (storage unit)
   * @returns {Promise<void>}
   * @throws {Error} If validation fails or user not authenticated
   */
  async function updateWeight(weightInKg) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated')
    }

    if (typeof weightInKg !== 'number' || isNaN(weightInKg)) {
      throw new Error('Weight must be a valid number')
    }

    if (
      weightInKg < CONFIG.personalInfo.MIN_WEIGHT ||
      weightInKg > CONFIG.personalInfo.MAX_WEIGHT
    ) {
      throw new Error(
        `Weight must be between ${CONFIG.personalInfo.MIN_WEIGHT} and ${CONFIG.personalInfo.MAX_WEIGHT} kg`
      )
    }

    // Round to 1 decimal place
    const roundedWeight = Math.round(weightInKg * 10) / 10

    const currentPersonalInfo = profile.value?.personalInfo || {}

    await updateProfile({
      personalInfo: {
        ...currentPersonalInfo,
        weight: roundedWeight,
      },
    })
  }

  /**
   * Update table column visibility settings for a specific tab
   * @param {string} tab - Tab name ('overview', 'history', or 'exercises')
   * @param {Object} columnSettings - Column visibility settings (flat object: { type: true, status: false, ... })
   * @returns {Promise<void>}
   */
  async function updateTableSettings(tab, columnSettings) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated')
    }

    // Validate tab parameter
    if (!['overview', 'history', 'exercises'].includes(tab)) {
      throw new Error('Invalid tab: must be overview, history, or exercises')
    }

    // Get current settings for the specific tab
    const currentTabSettings = settings.value?.tableSettings?.[tab]?.columns || DEFAULT_TABLE_SETTINGS[tab].columns

    // CRITICAL: User input overrides defaults AND existing values
    // Order: defaults → existing → user input (rightmost wins)
    const updatedTableSettings = {
      ...settings.value.tableSettings, // Preserve other tabs
      [tab]: {
        columns: {
          ...DEFAULT_TABLE_SETTINGS[tab].columns, // Ensure all columns have a value
          ...currentTabSettings,                  // Preserve existing user settings
          ...columnSettings,                      // Apply new user input (HIGHEST PRIORITY)
        },
      },
    }

    // Update local state immediately for optimistic UI
    const previousSettings = { ...settings.value }
    settings.value = {
      ...settings.value,
      tableSettings: updatedTableSettings
    }

    try {
      // Save to Firestore
      await updateDocument(COLLECTIONS.USERS, authStore.uid, {
        settings: settings.value,
      })

      // Cache to localStorage after successful Firestore write
      cacheTableSettings(updatedTableSettings)
    } catch (err) {
      // Revert local state on error
      settings.value = previousSettings

      if (import.meta.env.DEV) {
        console.error('[userStore] Error updating table settings:', err)
      }
      throw err
    }
  }

  /**
   * Reset table settings to defaults
   * @returns {Promise<void>}
   */
  async function resetTableSettings() {
    await updateSettings({ tableSettings: DEFAULT_TABLE_SETTINGS })
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
          console.error('[userStore] Error in profile subscription:', err)
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

  /**
   * Complete onboarding flow
   * Sets hasCompletedOnboarding to true in Firestore and localStorage
   * @returns {Promise<void>}
   */
  async function completeOnboarding() {
    try {
      // Update Firestore (optimistic UI - update local state first)
      settings.value.hasCompletedOnboarding = true

      // Cache to localStorage immediately
      localStorage.setItem(CONFIG.storage.ONBOARDING_COMPLETED, 'true')

      // Attempt Firestore update
      if (authStore.uid) {
        await updateSettings({ hasCompletedOnboarding: true })
      }
    } catch (error) {
      // Silent fail - user experience is not blocked
      // Firestore write will be retried on next app launch if offline
      if (import.meta.env.DEV) {
        console.error('[userStore] Failed to save onboarding completion:', error)
      }
    }
  }

  // Track if theme has been initialized
  let themeInitialized = false

  /**
   * Initialize userStore - sets up watchers and theme
   * Call this explicitly from App.vue onMounted
   *
   * TABLE SETTINGS DATA FLOW:
   * ========================
   * 1. INITIAL LOAD (this function):
   *    - Check localStorage cache for tableSettings
   *    - If found, load immediately (prevents flash of wrong state)
   *    - Set up watcher for authStore.userProfile
   *
   * 2. FIRESTORE SYNC (watcher below):
   *    - When Firestore data arrives, merge it with DEFAULT_TABLE_SETTINGS
   *    - CRITICAL: Firestore data OVERRIDES defaults (not the other way around!)
   *    - Cache the merged result to localStorage
   *
   * 3. USER UPDATES (updateTableSettings action):
   *    - User clicks toggle in TableSettingsSheet
   *    - Component calls updateTableSettings({ type: false, ... })
   *    - Store merges with defaults and saves to Firestore
   *    - Store caches to localStorage
   *    - Firestore listener fires → watcher merges → updates settings.value
   *
   * MERGE ORDER (CRITICAL):
   * - In watcher: defaults → Firestore data (Firestore wins)
   * - In updateTableSettings: defaults → existing → user input (user input wins)
   * - This ensures user data always takes precedence over defaults
   */
  function initializeUserStore() {
    // Try localStorage first for fast initial render of table settings
    const cachedSettings = loadCachedTableSettings()
    if (cachedSettings) {
      settings.value.tableSettings = cachedSettings
    }

    // Set up reactive watchers
    watch(
      () => authStore.userProfile,
      async (newProfile) => {
        // Sync full profile from authStore (single source of truth)
        if (newProfile) {
          profile.value = newProfile

          // Update settings if available
          if (newProfile.settings) {
            const oldTheme = settings.value.theme

            // DEEP MERGE: Preserve nested objects like tableSettings
            // CRITICAL: Firestore data (user settings) must override defaults, not the other way around!
            // Order matters: defaults FIRST, then Firestore data (so Firestore wins)

            // Migrate legacy tableSettings if needed
            let migratedTableSettings = newProfile.settings.tableSettings
            if (migratedTableSettings) {
              migratedTableSettings = migrateTableSettings(migratedTableSettings)
            }

            settings.value = {
              ...settings.value,
              ...newProfile.settings,
              // Deep merge tableSettings - FIRESTORE DATA OVERRIDES DEFAULTS
              tableSettings: migratedTableSettings
                ? {
                    // Merge each tab's settings
                    overview: {
                      columns: {
                        ...DEFAULT_TABLE_SETTINGS.overview.columns,
                        ...(migratedTableSettings.overview?.columns || {}),
                      },
                    },
                    history: {
                      columns: {
                        ...DEFAULT_TABLE_SETTINGS.history.columns,
                        ...(migratedTableSettings.history?.columns || {}),
                      },
                    },
                    exercises: {
                      columns: {
                        ...DEFAULT_TABLE_SETTINGS.exercises.columns,
                        ...(migratedTableSettings.exercises?.columns || {}),
                      },
                    },
                  }
                : DEFAULT_TABLE_SETTINGS, // If no tableSettings in Firestore, use defaults
            }


            // Update cache with Firestore data (source of truth)
            if (migratedTableSettings) {
              cacheTableSettings(settings.value.tableSettings)

              // If migration occurred, save migrated settings back to Firestore
              if (newProfile.settings.tableSettings !== migratedTableSettings) {
                try {
                  await updateDocument(COLLECTIONS.USERS, authStore.uid, {
                    settings: {
                      ...newProfile.settings,
                      tableSettings: settings.value.tableSettings,
                    },
                  })
                } catch (err) {
                  // Silent fail - migration is not critical
                  if (import.meta.env.DEV) {
                    console.error('[userStore] Failed to save migrated settings:', err)
                  }
                }
              }
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
    currentWeight,
    tableSettings,

    // Actions
    fetchProfile,
    createProfile,
    updateProfile,
    updateSettings,
    toggleFavoriteExercise,
    addRecentlyUsedExercise,
    updateStats,
    incrementWorkoutStats,
    updateWeight,
    updateTableSettings,
    resetTableSettings,
    subscribeToProfile,
    applyTheme,
    initTheme,
    initializeUserStore,
    unsubscribe,
    clearError,
    completeOnboarding,
  }
})
