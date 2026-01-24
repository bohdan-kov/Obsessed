import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth'
import { app } from './config'
import i18n from '@/i18n'

/**
 * Firebase Auth instance
 */
export const auth = getAuth(app)

/**
 * Google Auth Provider instance
 */
export const googleProvider = new GoogleAuthProvider()

// Configure Google provider to always prompt for account selection
googleProvider.setCustomParameters({
  prompt: 'select_account',
})

/**
 * Enable local persistence for auth state
 * This keeps users logged in across browser sessions
 */
setPersistence(auth, browserLocalPersistence).catch((error) => {
  if (import.meta.env.DEV) {
    console.error('[firebase/auth] Failed to set auth persistence:', error)
  }
})

/**
 * Sign in with Google popup
 * @returns {Promise<UserCredential>}
 * @throws {Error} If sign-in fails
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    return result
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[firebase/auth] Google sign-in error:', error)
    }
    throw new Error(getAuthErrorMessage(error.code))
  }
}

/**
 * Sign in with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<UserCredential>}
 * @throws {Error} If sign-in fails
 */
export async function signInWithEmail(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password)
    return result
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[firebase/auth] Email sign-in error:', error)
    }
    throw new Error(getAuthErrorMessage(error.code))
  }
}

/**
 * Create new user with email and password
 * @param {string} email
 * @param {string} password
 * @param {string} displayName - Optional display name
 * @returns {Promise<UserCredential>}
 * @throws {Error} If account creation fails
 */
export async function createAccount(email, password, displayName = null) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password)

    // Update profile with display name if provided
    if (displayName && result.user) {
      await updateProfile(result.user, { displayName })
    }

    // Send email verification
    if (result.user) {
      await sendEmailVerification(result.user)
    }

    return result
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[firebase/auth] Account creation error:', error)
    }
    throw new Error(getAuthErrorMessage(error.code))
  }
}

/**
 * Sign out current user
 * @returns {Promise<void>}
 * @throws {Error} If sign-out fails
 */
export async function signOut() {
  try {
    await firebaseSignOut(auth)
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[firebase/auth] Sign-out error:', error)
    }
    throw new Error('Failed to sign out. Please try again.')
  }
}

/**
 * Send password reset email
 * @param {string} email
 * @returns {Promise<void>}
 * @throws {Error} If email send fails
 */
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[firebase/auth] Password reset error:', error)
    }
    throw new Error(getAuthErrorMessage(error.code))
  }
}

/**
 * Send email verification to current user
 * @returns {Promise<void>}
 * @throws {Error} If no user is signed in or email send fails
 */
export async function sendVerificationEmail() {
  const user = auth.currentUser
  if (!user) {
    throw new Error('No user is currently signed in')
  }

  try {
    await sendEmailVerification(user)
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[firebase/auth] Email verification error:', error)
    }
    throw new Error('Failed to send verification email. Please try again.')
  }
}

/**
 * Subscribe to auth state changes
 * @param {Function} callback - Called with user object or null
 * @returns {Function} Unsubscribe function
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback, (error) => {
    if (import.meta.env.DEV) {
      console.error('[firebase/auth] Auth state change error:', error)
    }
  })
}

/**
 * Get user-friendly error messages for Firebase auth errors
 * Uses i18n for internationalization
 * @param {string} errorCode - Firebase error code
 * @returns {string} User-friendly error message
 */
function getAuthErrorMessage(errorCode) {
  const { t } = i18n.global

  const errorKeyMap = {
    'auth/email-already-in-use': 'errors.auth.emailInUse',
    'auth/invalid-email': 'errors.auth.invalidEmail',
    'auth/operation-not-allowed': 'errors.auth.operationNotAllowed',
    'auth/weak-password': 'errors.auth.weakPassword',
    'auth/user-disabled': 'errors.auth.userDisabled',
    'auth/user-not-found': 'errors.auth.userNotFound',
    'auth/wrong-password': 'errors.auth.wrongPassword',
    'auth/invalid-credential': 'errors.auth.invalidCredential',
    'auth/too-many-requests': 'errors.auth.tooManyRequests',
    'auth/popup-closed-by-user': 'errors.auth.popupClosedByUser',
    'auth/cancelled-popup-request': 'errors.auth.cancelledPopupRequest',
    'auth/popup-blocked': 'errors.auth.popupBlocked',
    'auth/network-request-failed': 'errors.auth.networkRequestFailed',
  }

  const i18nKey = errorKeyMap[errorCode]
  return i18nKey ? t(i18nKey) : t('errors.auth.unexpected')
}
