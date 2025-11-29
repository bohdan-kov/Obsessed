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
  console.error('Failed to set auth persistence:', error)
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
    console.error('Google sign-in error:', error)
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
    console.error('Email sign-in error:', error)
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
    console.error('Account creation error:', error)
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
    console.error('Sign-out error:', error)
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
    console.error('Password reset error:', error)
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
    console.error('Email verification error:', error)
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
    console.error('Auth state change error:', error)
  })
}

/**
 * Get user-friendly error messages for Firebase auth errors
 * @param {string} errorCode - Firebase error code
 * @returns {string} User-friendly error message
 */
function getAuthErrorMessage(errorCode) {
  const errorMessages = {
    'auth/email-already-in-use': 'This email is already registered',
    'auth/invalid-email': 'Invalid email address',
    'auth/operation-not-allowed': 'This sign-in method is not enabled',
    'auth/weak-password': 'Password should be at least 6 characters',
    'auth/user-disabled': 'This account has been disabled',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/invalid-credential': 'Invalid email or password',
    'auth/too-many-requests':
      'Too many failed attempts. Please try again later',
    'auth/popup-closed-by-user': 'Sign-in cancelled',
    'auth/cancelled-popup-request': 'Sign-in cancelled',
    'auth/popup-blocked': 'Pop-up was blocked by your browser',
    'auth/network-request-failed': 'Network error. Please check your connection',
  }

  return errorMessages[errorCode] || 'An unexpected error occurred'
}
