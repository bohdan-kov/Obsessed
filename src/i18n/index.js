/**
 * vue-i18n Configuration
 * Initializes i18n with Ukrainian and English locales
 */
import { createI18n } from 'vue-i18n'
import uk from './locales/uk'
import en from './locales/en'

/**
 * Supported locales configuration
 */
export const SUPPORTED_LOCALES = {
  uk: { name: 'Українська', flag: '🇺🇦', rtl: false },
  en: { name: 'English', flag: '🇬🇧', rtl: false },
}

/**
 * Default locale
 */
export const DEFAULT_LOCALE = 'uk'

/**
 * Fallback locale (when translation missing in current locale)
 */
export const FALLBACK_LOCALE = 'uk'

/**
 * localStorage key for locale preference
 */
const LOCALE_STORAGE_KEY = 'obsessed_locale'

/**
 * Determine initial locale from localStorage or browser settings
 * Priority: localStorage > browser language > default
 * @returns {string} Locale code
 */
function getInitialLocale() {
  // 1. Check localStorage
  const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY)
  if (storedLocale && SUPPORTED_LOCALES[storedLocale]) {
    return storedLocale
  }

  // 2. Check browser language
  const browserLang = navigator.language.split('-')[0]
  if (SUPPORTED_LOCALES[browserLang]) {
    return browserLang
  }

  // 3. Fallback to default
  return DEFAULT_LOCALE
}

/**
 * Create and configure i18n instance
 * Uses Composition API mode for <script setup> compatibility
 */
const i18n = createI18n({
  legacy: false, // Use Composition API
  globalInjection: true, // Enable $t in templates
  locale: getInitialLocale(),
  fallbackLocale: FALLBACK_LOCALE,
  messages: { uk, en },
  missingWarn: import.meta.env.DEV, // Warn in dev only
  fallbackWarn: import.meta.env.DEV, // Warn in dev only
  silentTranslationWarn: !import.meta.env.DEV,
})

/**
 * Switch the active locale
 * Updates vue-i18n, localStorage, and document attributes
 * @param {string} locale - Target locale ('uk' | 'en')
 */
export function setLocale(locale) {
  if (!SUPPORTED_LOCALES[locale]) {
    if (import.meta.env.DEV) {
      console.warn(`[i18n] Unsupported locale: ${locale}`)
    }
    return
  }

  i18n.global.locale.value = locale
  localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  document.documentElement.setAttribute('lang', locale)

  // Update dir attribute for RTL support (future-proofing)
  document.documentElement.setAttribute(
    'dir',
    SUPPORTED_LOCALES[locale]?.rtl ? 'rtl' : 'ltr'
  )
}

/**
 * Get current locale
 * @returns {string} Current locale code
 */
export function getLocale() {
  return i18n.global.locale.value
}

export default i18n
