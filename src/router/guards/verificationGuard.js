/**
 * Email Verification Guard
 * Ensures user has verified their email
 */

export function verificationGuard(to, from, next, authStore) {
  if (!authStore.isEmailVerified) {
    next({ name: 'VerifyEmail' })
    return false
  }
  return true
}
