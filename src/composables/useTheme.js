/**
 * useTheme Composable
 * Manages theme switching with sync to userStore + Firestore
 * Supports three modes: 'light', 'dark', 'system'
 */
import { computed, watch } from 'vue'
import { usePreferredDark } from '@vueuse/core'
import { useUserStore } from '@/stores/userStore'
import { Sun, Moon, Monitor } from 'lucide-vue-next'

export function useTheme() {
  const userStore = useUserStore()
  const prefersDark = usePreferredDark() // VueUse composable for OS detection

  /**
   * User's selected theme preference ('light' | 'dark' | 'system')
   */
  const themePreference = computed(() => userStore.settings?.theme || 'system')

  /**
   * Actual applied theme ('light' | 'dark')
   * Resolves 'system' to actual theme based on OS preference
   */
  const effectiveTheme = computed(() => {
    if (themePreference.value === 'system') {
      return prefersDark.value ? 'dark' : 'light'
    }
    return themePreference.value
  })

  /**
   * Convenience boolean for conditional rendering
   */
  const isDark = computed(() => effectiveTheme.value === 'dark')

  /**
   * Available themes for UI selection
   */
  const availableThemes = [
    {
      value: 'light',
      labelKey: 'settings.theme.light',
      descriptionKey: 'settings.theme.lightDescription',
      icon: Sun,
    },
    {
      value: 'dark',
      labelKey: 'settings.theme.dark',
      descriptionKey: 'settings.theme.darkDescription',
      icon: Moon,
    },
    {
      value: 'system',
      labelKey: 'settings.theme.system',
      descriptionKey: 'settings.theme.systemDescription',
      icon: Monitor,
    },
  ]

  /**
   * Change theme preference
   * Coordinates: applyTheme (instant visual) -> updateSettings (Firestore + localStorage)
   * @param {'light'|'dark'|'system'} theme - Theme to switch to
   */
  async function changeTheme(theme) {
    if (!['light', 'dark', 'system'].includes(theme)) {
      return
    }

    if (theme === themePreference.value) {
      return // No change needed
    }

    try {
      // Apply immediately to DOM (instant visual feedback)
      userStore.applyTheme(theme)

      // Persist to Firestore + localStorage
      await userStore.updateSettings({ theme })
    } catch (error) {
      throw error
    }
  }

  // Sync theme when userStore settings change (from Firestore)
  watch(
    () => userStore.settings?.theme,
    (newTheme) => {
      if (newTheme) {
        userStore.applyTheme(newTheme)
      }
    },
    { immediate: true }
  )

  return {
    themePreference,
    effectiveTheme,
    isDark,
    availableThemes,
    changeTheme,
  }
}
