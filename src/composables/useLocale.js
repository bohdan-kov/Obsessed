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
   * @param {string} code - Locale code ('uk' | 'en')
   */
  async function changeLocale(code) {
    if (!SUPPORTED_LOCALES[code]) {
      console.warn(`[useLocale] Unsupported locale: ${code}`)
      return
    }

    if (code === locale.value) {
      return
    }

    try {
      // Update vue-i18n (UI updates immediately)
      setI18nLocale(code)

      // Update userStore (handles localStorage + Firestore sync)
      await userStore.updateSettings({ locale: code })
    } catch (error) {
      console.error('[useLocale] Failed to change locale:', error)
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
