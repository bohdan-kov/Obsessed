/**
 * useLocale Composable
 * Manages locale switching with sync to userStore + Firestore
 */
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/userStore'
import { setLocale as setI18nLocale, SUPPORTED_LOCALES } from '@/i18n'

export function useLocale() {
  const { locale, t } = useI18n()
  const userStore = useUserStore()

  /**
   * Current locale (reactive)
   */
  const currentLocale = computed(() => locale.value)

  /**
   * Available locales with metadata
   */
  const availableLocales = Object.entries(SUPPORTED_LOCALES).map(
    ([code, meta]) => ({
      code,
      name: meta.name,
      flag: meta.flag,
      rtl: meta.rtl,
    })
  )

  /**
   * Whether current locale is RTL
   * Future-proofing for Arabic, Hebrew, etc.
   */
  const isRTL = computed(() => {
    return SUPPORTED_LOCALES[locale.value]?.rtl || false
  })

  /**
   * Switch locale
   * Coordinates: vue-i18n -> userStore -> localStorage -> Firestore
   * Implements optimistic update with rollback on failure
   * @param {string} code - Locale code ('uk' | 'en')
   */
  async function changeLocale(code) {
    if (!SUPPORTED_LOCALES[code]) {
      return
    }

    if (code === locale.value) {
      return
    }

    const previousLocale = locale.value // Save previous state

    try {
      // Optimistic update - update vue-i18n immediately
      setI18nLocale(code)

      // Persist to Firestore
      await userStore.updateSettings({ locale: code })
    } catch (error) {
      // Revert on failure
      setI18nLocale(previousLocale)
      throw error
    }
  }

  // Sync locale when userStore settings change (from Firestore)
  watch(
    () => userStore.settings?.locale,
    (newLocale) => {
      if (newLocale && newLocale !== locale.value) {
        setI18nLocale(newLocale)
      }
    },
    { immediate: false }
  )

  return {
    currentLocale,
    availableLocales,
    isRTL,
    changeLocale,
    t,
  }
}
