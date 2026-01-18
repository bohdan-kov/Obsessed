import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// Unmock useUnits to test the real implementation
vi.unmock('@/composables/useUnits')

// Mock vue-i18n with proper unit label translations
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => {
      // Return proper translations for unit labels
      if (key === 'common.units.kg') return 'kg'
      if (key === 'common.units.lbs') return 'lbs'
      return key
    },
    locale: { value: 'uk' },
  }),
  createI18n: vi.fn(),
}))

import { useUnits } from '@/composables/useUnits'
import { useUserStore } from '@/stores/userStore'
import { useAuthStore } from '@/stores/authStore'

// Mock Firebase modules
vi.mock('@/firebase/firestore', () => ({
  fetchCollection: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  subscribeToCollection: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
  fetchDocument: vi.fn(),
  setDocument: vi.fn(),
  subscribeToDocument: vi.fn(),
  COLLECTIONS: {
    USERS: 'users',
    WORKOUTS: 'workouts',
  },
}))

vi.mock('@/firebase/auth', () => ({
  onAuthChange: vi.fn(() => vi.fn()),
  signOut: vi.fn(),
}))

vi.mock('@/composables/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleError: vi.fn(),
  }),
}))

describe('useUnits - formatWeight with compact mode', () => {
  let userStore
  let authStore

  beforeEach(() => {
    setActivePinia(createPinia())
    userStore = useUserStore()
    authStore = useAuthStore()

    // Set authenticated user
    authStore.$patch({
      user: { uid: 'test-user-123', email: 'test@test.com', emailVerified: true },
      initializing: false,
      loading: false,
    })

    // Set default user settings
    userStore.$patch({
      settings: {
        weightUnit: 'kg',
        language: 'uk',
      },
    })
  })

  describe('compact: false (default)', () => {
    it('formats small values normally with thousand separators', () => {
      const { formatWeight } = useUnits()

      expect(formatWeight(500, { compact: false })).toBe('500 kg')
      expect(formatWeight(9999, { compact: false })).toMatch(/9[,\s]?999 kg/)
    })

    it('formats large values with full numbers', () => {
      const { formatWeight } = useUnits()

      const result = formatWeight(150000, { compact: false })
      // Should contain the full number (with locale separators)
      expect(result).toMatch(/150/)
      expect(result).toContain('kg')
      // Should not contain compact suffixes (check for 'k' followed by space)
      expect(result).not.toMatch(/\dk\s/)
      expect(result).not.toContain('M')
    })

    it('formats very large values with full numbers', () => {
      const { formatWeight } = useUnits()

      const result = formatWeight(1500000, { compact: false })
      expect(result).toMatch(/1[,\s]?500[,\s]?000/)
      expect(result).toContain('kg')
      expect(result).not.toContain('M')
    })
  })

  describe('compact: true', () => {
    it('formats small values normally (< 10k)', () => {
      const { formatWeight } = useUnits()

      expect(formatWeight(500, { compact: true })).toBe('500 kg')
      expect(formatWeight(9999, { compact: true })).toMatch(/9[,\s]?999 kg/)
    })

    it('formats thousands with k suffix (≥ 10k)', () => {
      const { formatWeight } = useUnits()

      expect(formatWeight(10000, { compact: true })).toBe('10.0k kg')
      expect(formatWeight(150000, { compact: true })).toBe('150.0k kg')
      expect(formatWeight(999999, { compact: true })).toBe('1000.0k kg')
    })

    it('formats millions with M suffix (≥ 1M)', () => {
      const { formatWeight } = useUnits()

      expect(formatWeight(1000000, { compact: true })).toBe('1.0M kg')
      expect(formatWeight(1500000, { compact: true })).toBe('1.5M kg')
      expect(formatWeight(10000000, { compact: true })).toBe('10.0M kg')
    })

    it('respects precision parameter', () => {
      const { formatWeight } = useUnits()

      expect(formatWeight(150000, { compact: true, precision: 0 })).toBe('150k kg')
      expect(formatWeight(150000, { compact: true, precision: 1 })).toBe('150.0k kg')
      expect(formatWeight(1500000, { compact: true, precision: 2 })).toBe('1.50M kg')
    })

    it('works without unit label', () => {
      const { formatWeight } = useUnits()

      expect(formatWeight(150000, { compact: true, showUnit: false })).toBe('150.0k')
      expect(formatWeight(1500000, { compact: true, showUnit: false })).toBe('1.5M')
    })
  })

  describe('compact: "auto"', () => {
    it('uses normal format for values < 10k', () => {
      const { formatWeight } = useUnits()

      expect(formatWeight(500, { compact: 'auto' })).toBe('500 kg')
      expect(formatWeight(9999, { compact: 'auto' })).toMatch(/9[,\s]?999 kg/)
    })

    it('uses compact format for values ≥ 10k', () => {
      const { formatWeight } = useUnits()

      expect(formatWeight(10000, { compact: 'auto' })).toBe('10.0k kg')
      expect(formatWeight(150000, { compact: 'auto' })).toBe('150.0k kg')
      expect(formatWeight(1500000, { compact: 'auto' })).toBe('1.5M kg')
    })

    it('threshold is exactly 10,000', () => {
      const { formatWeight } = useUnits()

      // Just below threshold - normal format
      expect(formatWeight(9999, { compact: 'auto' })).toMatch(/9[,\s]?999 kg/)

      // At threshold - compact format
      expect(formatWeight(10000, { compact: 'auto' })).toBe('10.0k kg')
    })
  })

  describe('edge cases', () => {
    it('handles zero correctly', () => {
      const { formatWeight } = useUnits()

      expect(formatWeight(0, { compact: true })).toBe('0 kg')
      expect(formatWeight(0, { compact: 'auto' })).toBe('0 kg')
    })

    it('handles negative values (after validation)', () => {
      const { formatWeight } = useUnits()

      // convertWeight returns null for negative values
      expect(formatWeight(-150000, { compact: true })).toBe('—')
    })

    it('handles null and undefined', () => {
      const { formatWeight } = useUnits()

      expect(formatWeight(null, { compact: true })).toBe('—')
      expect(formatWeight(undefined, { compact: true })).toBe('—')
    })

    it('handles NaN', () => {
      const { formatWeight } = useUnits()

      expect(formatWeight(NaN, { compact: true })).toBe('—')
    })
  })

  describe('unit conversion with compact mode', () => {
    it('compact formatting works with unit conversion', () => {
      const { formatWeight, convertWeight } = useUnits()

      // Test that compact formatting applies AFTER conversion
      // Regardless of which unit, the compact logic should work

      // Large kg value should be compact
      expect(formatWeight(100000, { compact: true })).toMatch(/\d+\.?\d*k kg/)

      // convertWeight should return a number that can be formatted compactly
      const converted = convertWeight(100000, { from: 'kg', to: 'kg', precision: 2 })
      expect(converted).toBe(100000)
    })

    it('precision parameter works with converted values', () => {
      const { formatWeight } = useUnits()

      // Test different precision levels with compact notation
      expect(formatWeight(150000, { compact: true, precision: 0 })).toBe('150k kg')
      expect(formatWeight(150000, { compact: true, precision: 1 })).toBe('150.0k kg')
      expect(formatWeight(150000, { compact: true, precision: 2 })).toBe('150.00k kg')
    })
  })

  describe('integration with real use cases', () => {
    it('stat card format (compact auto)', () => {
      const { formatWeight } = useUnits()

      // Typical stat card volumes
      expect(formatWeight(150000, { precision: 0, compact: 'auto' })).toBe('150k kg')
      // With precision: 0, 1.5M rounds to 2M
      expect(formatWeight(1500000, { precision: 0, compact: 'auto' })).toBe('2M kg')
    })

    it('chart Y-axis format (compact auto, no unit)', () => {
      const { formatWeight } = useUnits()

      expect(formatWeight(150000, { precision: 0, showUnit: false, compact: 'auto' })).toBe('150k')
      // With precision: 0, 1.5M rounds to 2M
      expect(formatWeight(1500000, { precision: 0, showUnit: false, compact: 'auto' })).toBe('2M')
    })

    it('chart tooltip format (full precision, no compact)', () => {
      const { formatWeight } = useUnits()

      const result = formatWeight(150000, { precision: 0, compact: false })
      expect(result).toMatch(/150[,\s]?000 kg/)
      // Should not contain compact suffix 'k' followed by space
      expect(result).not.toMatch(/\dk\s/)
    })

    it('badge format (always compact)', () => {
      const { formatWeight } = useUnits()

      expect(formatWeight(150000, { precision: 0, compact: true })).toBe('150k kg')
      expect(formatWeight(9500, { precision: 1, compact: true })).toMatch(/9[,\s]?500 kg/)
    })

    it('table format (compact auto)', () => {
      const { formatWeight } = useUnits()

      expect(formatWeight(9500, { compact: 'auto' })).toMatch(/9[,\s]?500 kg/)
      expect(formatWeight(150000, { compact: 'auto' })).toBe('150.0k kg')
    })
  })

  describe('precision with compact notation', () => {
    it('precision affects compact suffix decimal places', () => {
      const { formatWeight } = useUnits()

      // Thousands
      expect(formatWeight(150000, { compact: true, precision: 0 })).toBe('150k kg')
      expect(formatWeight(150000, { compact: true, precision: 1 })).toBe('150.0k kg')
      expect(formatWeight(150500, { compact: true, precision: 1 })).toBe('150.5k kg')

      // Millions
      expect(formatWeight(1500000, { compact: true, precision: 0 })).toBe('2M kg')
      expect(formatWeight(1500000, { compact: true, precision: 1 })).toBe('1.5M kg')
      expect(formatWeight(1500000, { compact: true, precision: 2 })).toBe('1.50M kg')
    })
  })
})
