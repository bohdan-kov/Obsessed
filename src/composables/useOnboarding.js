import { computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { CONFIG } from '@/constants/config'

/**
 * Onboarding composable - Controls when to show onboarding flow
 * Protects existing users from accidentally seeing onboarding
 */
export function useOnboarding() {
  const userStore = useUserStore()

  const shouldShowOnboarding = computed(() => {
    // Check localStorage cache first (fastest)
    if (isOnboardingCompletedInCache()) {
      return false
    }

    // CRITICAL: Wait for user data to load (prevents race condition)
    if (userStore.loading) {
      return false
    }

    const hasCompleted = userStore.settings?.hasCompletedOnboarding

    // CRITICAL: undefined = existing user (no onboarding flag in their profile)
    // Treat as already completed to protect existing users
    if (hasCompleted === undefined) {
      return false
    }

    if (hasCompleted === true) {
      return false
    }

    // Safety check: only show if user has no workouts
    const workoutCount = userStore.totalWorkouts
    return hasCompleted === false && workoutCount === 0
  })

  function isOnboardingCompletedInCache() {
    try {
      const cached = localStorage.getItem(CONFIG.storage.ONBOARDING_COMPLETED)
      return cached === 'true'
    } catch {
      return false
    }
  }

  async function completeOnboarding() {
    await userStore.completeOnboarding()
  }

  return {
    shouldShowOnboarding,
    isOnboardingCompletedInCache,
    completeOnboarding,
  }
}
