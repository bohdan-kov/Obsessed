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
    return onAuthChange(async (firebaseUser) => {
      loading.value = true

      if (firebaseUser) {
        user.value = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
        }

        // Subscribe to user profile from Firestore
        await subscribeToUserProfile(firebaseUser.uid)
      } else {
        user.value = null
        userProfile.value = null

        // Cleanup profile subscription
        if (unsubscribeProfile) {
          unsubscribeProfile()
          unsubscribeProfile = null
        }
      }

      loading.value = false
      initializing.value = false
    })
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
    }

    // Subscribe to real-time updates
    unsubscribeProfile = subscribeToDocument(
      COLLECTIONS.USERS,
      userId,
      (profileData) => {
        userProfile.value = profileData
      },
      (err) => {
        console.error('Error subscribing to user profile:', err)
      }
    )
  }

  /**
   * Create initial user profile in Firestore
   */
  async function createUserProfile(userId) {
    const profileData = {
      displayName: user.value?.displayName || '',
      email: user.value?.email || '',
      photoURL: user.value?.photoURL || '',
      settings: {
        units: 'metric', // metric or imperial
        theme: 'system', // light, dark, system
        notifications: true,
      },
      stats: {
        totalWorkouts: 0,
        totalSets: 0,
        totalVolume: 0,
      },
    }

    try {
      await setDocument(COLLECTIONS.USERS, userId, profileData)
      userProfile.value = profileData
    } catch (err) {
      console.error('Error creating user profile:', err)
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
      throw err
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
      throw err
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
      throw err
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
      await firebaseSignOut()
      user.value = null
      userProfile.value = null

      if (unsubscribeProfile) {
        unsubscribeProfile()
        unsubscribeProfile = null
      }
    } catch (err) {
      error.value = err.message
      throw err
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
      throw err
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
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update user profile in Firestore
   */
  async function updateProfile(updates) {
    if (!uid.value) {
      throw new Error('No user is currently signed in')
    }

    loading.value = true
    error.value = null

    try {
      await setDocument(COLLECTIONS.USERS, uid.value, updates, { merge: true })
      // Real-time listener will update userProfile.value
    } catch (err) {
      error.value = err.message
      throw err
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
    // State
    user: computed(() => user.value),
    userProfile: computed(() => userProfile.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    initializing: computed(() => initializing.value),

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
