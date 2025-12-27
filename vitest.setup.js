/**
 * Vitest Setup File
 * Runs before all test files
 */
import { vi } from 'vitest'
import { config } from '@vue/test-utils'
import { ref, computed } from 'vue'

// Mock vue-router globally to prevent "injection Symbol(router) not found" warnings
// Components using useRouter() will receive this mock unless overridden in individual tests
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    currentRoute: ref({
      path: '/',
      query: {},
      params: {},
      name: 'Home',
      fullPath: '/',
      matched: [],
      meta: {},
    }),
  }),
  useRoute: () => ({
    path: '/',
    query: {},
    params: {},
    name: 'Home',
    fullPath: '/',
    matched: [],
    meta: {},
  }),
  RouterLink: {
    template: '<a><slot /></a>',
  },
  RouterView: {
    template: '<div><slot /></div>',
  },
}))

// Mock vue-i18n globally
config.global.mocks = {
  $t: (key) => key, // Simple mock that returns the key
  t: (key) => key,
}

// Mock i18n composable
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
    locale: ref('uk'),
  }),
  createI18n: vi.fn(),
}))

// Mock useUnits composable
// IMPORTANT: Use Vue's ref() to ensure proper reactivity unwrapping in templates
vi.mock('@/composables/useUnits', () => ({
  useUnits: () => ({
    weightUnit: ref('kg'),
    unitLabel: computed(() => 'kg'),
    availableWeightUnits: [
      { value: 'kg', label: 'Kilograms', name: 'Kilograms' },
      { value: 'lbs', label: 'Pounds', name: 'Pounds' },
    ],
    convertWeight: (value) => value,
    formatWeight: (value, options = {}) => {
      if (options.showUnit === false) return String(value)
      return `${value} kg`
    },
    toStorageUnit: (value) => value,
    fromStorageUnit: (value) => value,
    changeWeightUnit: vi.fn(),
  }),
}))

// Mock useLocale composable
vi.mock('@/composables/useLocale', () => ({
  useLocale: () => ({
    currentLocale: ref('uk'),
    availableLocales: [
      { code: 'uk', name: 'Українська', flag: '🇺🇦' },
      { code: 'en', name: 'English', flag: '🇬🇧' },
    ],
    isRTL: ref(false),
    changeLocale: vi.fn(),
    t: (key) => key,
  }),
}))

// Mock useTheme composable
vi.mock('@/composables/useTheme', () => ({
  useTheme: () => ({
    themePreference: ref('system'),
    effectiveTheme: ref('light'),
    isDark: ref(false),
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

// Mock ResizeObserver for @unovis/vue charts
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback
    this.observationTargets = []
  }
  observe(target) {
    if (!this.observationTargets.includes(target)) {
      this.observationTargets.push(target)
    }
    // Simulate immediate callback with mock entry
    this.callback(
      [
        {
          target,
          contentRect: {
            width: 800,
            height: 600,
            top: 0,
            left: 0,
            right: 800,
            bottom: 600,
          },
          borderBoxSize: [{ inlineSize: 800, blockSize: 600 }],
          contentBoxSize: [{ inlineSize: 800, blockSize: 600 }],
          devicePixelContentBoxSize: [{ inlineSize: 800, blockSize: 600 }],
        },
      ],
      this,
    )
  }
  unobserve(target) {
    this.observationTargets = this.observationTargets.filter((t) => t !== target)
  }
  disconnect() {
    this.observationTargets = []
  }
}

// Mock SVG element methods for @unovis/vue charts
// jsdom doesn't fully support SVG DOM methods like getBBox()
if (typeof SVGElement !== 'undefined') {
  SVGElement.prototype.getBBox = vi.fn(() => ({
    x: 0,
    y: 0,
    width: 100,
    height: 20,
  }))

  SVGElement.prototype.getComputedTextLength = vi.fn(() => 100)

  SVGElement.prototype.getBoundingClientRect = vi.fn(() => ({
    x: 0,
    y: 0,
    width: 100,
    height: 20,
    top: 0,
    right: 100,
    bottom: 20,
    left: 0,
  }))
}
