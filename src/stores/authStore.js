import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
  signInWithGoogle,
  signInWithEmail,
  createAccount,
  signOut as firebaseSignOut,
  onAuthChange,
  resetPassword,
  sendVerificationEmail,
} from '@/firebase/auth'
import {
  fetchDocument,
  setDocument,
  subscribeToDocument,
} from '@/firebase/firestore'
import { COLLECTIONS } from '@/firebase/firestore'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const userProfile = ref(null)
  const loading = ref(true)
  const error = ref(null)
  const initializing = ref(true)

  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const isEmailVerified = computed(() => user.value?.emailVerified ?? false)
  const uid = computed(() => user.value?.uid ?? null)
  const displayName = computed(
    () => userProfile.value?.displayName || user.value?.displayName || ''
  )
  const email = computed(() => user.value?.email || '')
  const photoURL = computed(
    () => userProfile.value?.photoURL || user.value?.photoURL || ''
  )

  // Firestore subscription cleanup
  let unsubscribeProfile = null

  /**
   * Initialize auth state listener
   * Call this in App.vue or main.js
   */
  function initAuth() {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      loading.value = true

      if (firebaseUser) {
        user.value = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
        }

        // CRITICAL FIX: Set initializing to false IMMEDIATELY after user is set
        // Don't wait for Firestore profile loading - that can happen in background
        loading.value = false
        initializing.value = false

        // Subscribe to user profile from Firestore (in background, don't block)
        subscribeToUserProfile(firebaseUser.uid).catch(() => {
          // Profile subscription error - will retry on next auth state change
        })
      } else {
        user.value = null
        userProfile.value = null

        // Cleanup profile subscription
        if (unsubscribeProfile) {
          unsubscribeProfile()
          unsubscribeProfile = null
        }

        loading.value = false
        initializing.value = false
      }
    })

    return unsubscribe
  }

  /**
   * Subscribe to user profile changes in Firestore
   */
  async function subscribeToUserProfile(userId) {
    // Clean up existing subscription
    if (unsubscribeProfile) {
      unsubscribeProfile()
    }

    // Try to fetch the profile first
    const profile = await fetchDocument(COLLECTIONS.USERS, userId)

    if (!profile) {
      // Create initial profile if it doesn't exist
      await createUserProfile(userId)
    } else {
      userProfile.value = profile

      // CRITICAL FIX: Ensure existing users have a public community profile
      if (!profile.profile || !profile.profile.displayName) {
        await ensurePublicProfile(userId, profile)
      }
    }

    // Subscribe to real-time updates
    unsubscribeProfile = subscribeToDocument(
      COLLECTIONS.USERS,
      userId,
      (profileData) => {
        userProfile.value = profileData
      },
      () => {
        // Profile subscription error - silent fail, profile already loaded
      }
    )
  }

  /**
   * Ensure user has a public community profile (for existing users)
   * This fixes the "Anonymous" bug by adding the profile object to existing users
   */
  async function ensurePublicProfile(userId, existingProfile) {
    try {
      const updates = {
        profile: {
          displayName:
            existingProfile.displayName ||
            user.value?.displayName ||
            'Gym Enthusiast',
          bio: existingProfile.bio || '',
          photoURL: existingProfile.photoURL || user.value?.photoURL || '',
          privacyMode: 'public',
          followerCount: 0,
          followingCount: 0,
          createdAt: new Date().toISOString(),
        },
      }

      await setDocument(COLLECTIONS.USERS, userId, updates, { merge: true })
      if (import.meta.env.DEV) {
        console.log('[authStore] Created public profile for existing user:', userId)
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[authStore] Failed to create public profile:', err)
      }
    }
  }

  /**
   * Create initial user profile in Firestore
   * IMPORTANT: Keep settings structure in sync with userStore
   * CRITICAL: Creates both private settings AND public community profile
   */
  async function createUserProfile(userId) {
    const profileData = {
      // Top-level fields for backward compatibility
      displayName: user.value?.displayName || '',
      email: user.value?.email || '',
      photoURL: user.value?.photoURL || '',

      // Public community profile (used by feedStore and communityStore)
      profile: {
        displayName: user.value?.displayName || 'Gym Enthusiast',
        bio: '',
        photoURL: user.value?.photoURL || '',
        privacyMode: 'public', // Default to public for community features
        followerCount: 0,
        followingCount: 0,
        createdAt: new Date().toISOString(),
      },

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

    try {
      await setDocument(COLLECTIONS.USERS, userId, profileData)
      userProfile.value = profileData
    } catch {
      // Profile creation failed - will retry on next auth state change
    }
  }

  /**
   * Sign in with Google OAuth
   */
  async function handleSignInWithGoogle() {
    loading.value = true
    error.value = null

    try {
      const result = await signInWithGoogle()
      // Auth state listener will handle the rest
      return result
    } catch (err) {
      error.value = err.message
      // Re-throw with error context for component-level error handling
      const enhancedError = new Error(err.message)
      enhancedError.code = err.code
      enhancedError.context = 'authStore.handleSignInWithGoogle'
      throw enhancedError
    } finally {
      loading.value = false
    }
  }

  /**
   * Sign in with email and password
   */
  async function handleSignInWithEmail(email, password) {
    loading.value = true
    error.value = null

    try {
      const result = await signInWithEmail(email, password)
      return result
    } catch (err) {
      error.value = err.message
      // Re-throw with error context for component-level error handling
      const enhancedError = new Error(err.message)
      enhancedError.code = err.code
      enhancedError.context = 'authStore.handleSignInWithEmail'
      throw enhancedError
    } finally {
      loading.value = false
    }
  }

  /**
   * Sign up with email and password
   */
  async function signUp(email, password, name) {
    loading.value = true
    error.value = null

    try {
      const result = await createAccount(email, password, name)
      // Profile will be created by auth state listener
      return result
    } catch (err) {
      error.value = err.message
      // Re-throw with error context for component-level error handling
      const enhancedError = new Error(err.message)
      enhancedError.code = err.code
      enhancedError.context = 'authStore.signUp'
      throw enhancedError
    } finally {
      loading.value = false
    }
  }

  /**
   * Sign out current user
   */
  async function signOut() {
    loading.value = true
    error.value = null

    try {
      // Import workoutStore dynamically to avoid circular dependency
      const { useWorkoutStore } = await import('./workoutStore')
      const workoutStore = useWorkoutStore()

      // Clear workout data and unsubscribe from real-time updates
      workoutStore.clearData()

      await firebaseSignOut()
      user.value = null
      userProfile.value = null

      if (unsubscribeProfile) {
        unsubscribeProfile()
        unsubscribeProfile = null
      }
    } catch (err) {
      error.value = err.message
      // Re-throw with error context for component-level error handling
      const enhancedError = new Error(err.message)
      enhancedError.code = err.code
      enhancedError.context = 'authStore.signOut'
      throw enhancedError
    } finally {
      loading.value = false
    }
  }

  /**
   * Send password reset email
   */
  async function sendPasswordReset(email) {
    loading.value = true
    error.value = null

    try {
      await resetPassword(email)
    } catch (err) {
      error.value = err.message
      // Re-throw with error context for component-level error handling
      const enhancedError = new Error(err.message)
      enhancedError.code = err.code
      enhancedError.context = 'authStore.sendPasswordReset'
      throw enhancedError
    } finally {
      loading.value = false
    }
  }

  /**
   * Send email verification to current user
   */
  async function sendEmailVerification() {
    loading.value = true
    error.value = null

    try {
      await sendVerificationEmail()
    } catch (err) {
      error.value = err.message
      // Re-throw with error context for component-level error handling
      const enhancedError = new Error(err.message)
      enhancedError.code = err.code
      enhancedError.context = 'authStore.sendEmailVerification'
      throw enhancedError
    } finally {
      loading.value = false
    }
  }

  /**
   * Update user profile in Firestore
   */
  async function updateProfile(updates) {
    if (!uid.value) {
      const err = new Error('No user is currently signed in')
      err.context = 'authStore.updateProfile'
      throw err
    }

    loading.value = true
    error.value = null

    try {
      await setDocument(COLLECTIONS.USERS, uid.value, updates, { merge: true })
      // Real-time listener will update userProfile.value
    } catch (err) {
      error.value = err.message
      // Re-throw with error context for component-level error handling
      const enhancedError = new Error(err.message)
      enhancedError.code = err.code
      enhancedError.context = 'authStore.updateProfile'
      throw enhancedError
    } finally {
      loading.value = false
    }
  }

  /**
   * Clear error message
   */
  function clearError() {
    error.value = null
  }

  return {
    // State (return refs directly, not wrapped in computed)
    user,
    userProfile,
    loading,
    error,
    initializing,

    // Getters
    isAuthenticated,
    isEmailVerified,
    uid,
    displayName,
    email,
    photoURL,

    // Actions
    initAuth,
    handleSignInWithGoogle,
    handleSignInWithEmail,
    signUp,
    signOut,
    sendPasswordReset,
    sendEmailVerification,
    updateProfile,
    clearError,
  }
})
