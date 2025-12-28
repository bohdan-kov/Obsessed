/**
 * Vitest Setup File
 * Runs before all test files
 */
import { vi } from 'vitest'
import { config } from '@vue/test-utils'
import { ref, computed } from 'vue'

// Suppress Vue lifecycle warnings in composable tests
// When testing composables directly (outside of components), Vue warns about
// onMounted/onUnmounted being called without an active component instance.
// This is expected behavior in tests and doesn't affect functionality.
const originalWarn = console.warn
console.warn = (...args) => {
  const msg = args[0]
  if (typeof msg === 'string') {
    // Suppress lifecycle injection warnings
    if (
      msg.includes('onMounted is called when there is no active component instance') ||
      msg.includes('onUnmounted is called when there is no active component instance')
    ) {
      return // Skip these warnings
    }
  }
  // Pass through all other warnings
  originalWarn(...args)
}

// Mock Firebase configuration globally
// This prevents Firebase validation errors in CI/CD environments
vi.mock('@/firebase/config', () => ({
  default: {}, // Mock Firebase app instance
}))

// Mock Firebase auth functions
vi.mock('@/firebase/auth', () => ({
  signInWithGoogle: vi.fn(),
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  signOutUser: vi.fn(),
  onAuthChange: vi.fn(() => vi.fn()), // Returns unsubscribe function
  sendVerificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  updateUserPassword: vi.fn(),
  reauthenticateUser: vi.fn(),
  deleteUserAccount: vi.fn(),
}))

// Mock Firebase Firestore functions
vi.mock('@/firebase/firestore', () => ({
  fetchCollection: vi.fn(),
  fetchDocument: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
  subscribeToCollection: vi.fn(() => vi.fn()), // Returns unsubscribe function
  subscribeToDocument: vi.fn(() => vi.fn()), // Returns unsubscribe function
  batchWrite: vi.fn(),
  COLLECTIONS: {
    USERS: 'users',
    WORKOUTS: 'workouts',
    EXERCISES: 'exercises',
    USER_EXERCISES: 'userExercises',
  },
}))

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
globalThis.ResizeObserver = class ResizeObserver {
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

// Mock localStorage for jsdom compatibility
// jsdom's localStorage implementation has issues with clear() method
const localStorageMock = (() => {
  let store = {}

  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index) => {
      const keys = Object.keys(store)
      return keys[index] || null
    }),
  }
})()

globalThis.localStorage = localStorageMock

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
