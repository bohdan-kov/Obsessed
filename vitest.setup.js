/**
 * Vitest Setup File
 * Runs before all test files
 */
import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Mock vue-i18n globally
config.global.mocks = {
  $t: (key) => key, // Simple mock that returns the key
  t: (key) => key,
}

// Mock i18n composable
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
    locale: { value: 'uk' },
  }),
  createI18n: vi.fn(),
}))

// Mock useUnits composable
vi.mock('@/composables/useUnits', () => ({
  useUnits: () => ({
    weightUnit: { value: 'kg' },
    unitLabel: { value: 'kg' },
    availableWeightUnits: [
      { value: 'kg', label: 'Kilograms', name: 'Kilograms' },
      { value: 'lbs', label: 'Pounds', name: 'Pounds' },
    ],
    convertWeight: (value) => value,
    formatWeight: (value) => `${value} kg`,
    toStorageUnit: (value) => value,
    fromStorageUnit: (value) => value,
    changeWeightUnit: vi.fn(),
  }),
}))

// Mock useLocale composable
vi.mock('@/composables/useLocale', () => ({
  useLocale: () => ({
    currentLocale: { value: 'uk' },
    availableLocales: [
      { code: 'uk', name: 'Українська', flag: '🇺🇦' },
      { code: 'en', name: 'English', flag: '🇬🇧' },
    ],
    isRTL: { value: false },
    changeLocale: vi.fn(),
    t: (key) => key,
  }),
}))

// Mock useTheme composable
vi.mock('@/composables/useTheme', () => ({
  useTheme: () => ({
    themePreference: { value: 'system' },
    effectiveTheme: { value: 'light' },
    isDark: { value: false },
    availableThemes: [
      {
        value: 'light',
        labelKey: 'settings.theme.light',
        descriptionKey: 'settings.theme.lightDescription',
        icon: 'Sun',
      },
      {
        value: 'dark',
        labelKey: 'settings.theme.dark',
        descriptionKey: 'settings.theme.darkDescription',
        icon: 'Moon',
      },
      {
        value: 'system',
        labelKey: 'settings.theme.system',
        descriptionKey: 'settings.theme.systemDescription',
        icon: 'Monitor',
      },
    ],
    changeTheme: vi.fn(),
  }),
}))
