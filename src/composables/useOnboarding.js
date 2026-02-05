import { computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { CONFIG } from '@/constants/config'

export function useOnboarding() {
  const userStore = useUserStore()

  const shouldShowOnboarding = computed(() => {
    if (isOnboardingCompletedInCache()) {
      return false
    }

    const hasCompleted = userStore.settings?.hasCompletedOnboarding
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
