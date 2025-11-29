/**
 * Auth Guard
 * Protects routes that require authentication
 */

export function authGuard(to, from, next, authStore) {
  if (!authStore.isAuthenticated) {
    next({
      name: 'Login',
      query: { redirect: to.fullPath }
    })
    return false
  }

  // If authenticated and trying to access auth pages
  if (to.meta.redirectIfAuth) {
    next({ name: 'Dashboard' })
    return false
  }

  return true
}
