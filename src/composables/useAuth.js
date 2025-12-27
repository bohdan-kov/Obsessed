import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'

/**
 * Composable for easy access to authentication state and methods
 * Provides a convenient wrapper around the auth store
 *
 * @example
 * const { user, isAuthenticated, signOut } = useAuth()
 *
 * @returns {Object} Auth state and methods
 */
export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()

  /**
   * Sign out and redirect to login
   */
  async function logout() {
    try {
      await authStore.signOut()
      router.push({ name: 'Login' })
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[useAuth] Logout error:', error)
      }
      throw error
    }
  }

  /**
   * Sign in with email and password
   * @param {string} email
   * @param {string} password
   * @param {string} redirectTo - Optional redirect path
   */
  async function login(email, password, redirectTo = '/') {
    try {
      await authStore.handleSignInWithEmail(email, password)
      router.push(redirectTo)
    } catch (error) {
      throw error
    }
  }

  /**
   * Sign in with Google
   * @param {string} redirectTo - Optional redirect path
   */
  async function loginWithGoogle(redirectTo = '/') {
    try {
      await authStore.handleSignInWithGoogle()
      router.push(redirectTo)
    } catch (error) {
      throw error
    }
  }

  /**
   * Sign up with email and password
   * @param {string} email
   * @param {string} password
   * @param {string} name
   */
  async function register(email, password, name) {
    try {
      await authStore.signUp(email, password, name)
      router.push({ name: 'VerifyEmail' })
    } catch (error) {
      throw error
    }
  }

  /**
   * Send password reset email
   * @param {string} email
   */
  async function forgotPassword(email) {
    try {
      await authStore.sendPasswordReset(email)
    } catch (error) {
      throw error
    }
  }

  /**
   * Send email verification
   */
  async function verifyEmail() {
    try {
      await authStore.sendEmailVerification()
    } catch (error) {
      throw error
    }
  }

  /**
   * Update user profile
   * @param {Object} updates
   */
  async function updateUserProfile(updates) {
    try {
      await authStore.updateProfile(updates)
    } catch (error) {
      throw error
    }
  }

  /**
   * Check if user has a specific role
   * @param {string} role
   * @returns {boolean}
   */
  function hasRole(role) {
    return authStore.userProfile?.roles?.includes(role) ?? false
  }

  /**
   * Require authentication (useful in composables/components)
   * Redirects to login if not authenticated
   */
  function requireAuth() {
    if (!authStore.isAuthenticated) {
      router.push({
        name: 'Login',
        query: { redirect: router.currentRoute.value.fullPath },
      })
      return false
    }
    return true
  }

  return {
    // State (computed refs)
    user: computed(() => authStore.user),
    userProfile: computed(() => authStore.userProfile),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    isEmailVerified: computed(() => authStore.isEmailVerified),
    loading: computed(() => authStore.loading),
    error: computed(() => authStore.error),
    initializing: computed(() => authStore.initializing),
    uid: computed(() => authStore.uid),
    displayName: computed(() => authStore.displayName),
    email: computed(() => authStore.email),
    photoURL: computed(() => authStore.photoURL),

    // Methods
    login,
    loginWithGoogle,
    register,
    logout,
    forgotPassword,
    verifyEmail,
    updateUserProfile,
    hasRole,
    requireAuth,
    clearError: authStore.clearError,
  }
}
