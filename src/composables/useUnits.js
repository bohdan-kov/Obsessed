/**
 * useUnits Composable
 * Provides weight unit conversion and formatting utilities
 * Reactive to user's weightUnit preference
 */
import { computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useI18n } from 'vue-i18n'

// Conversion constants
const KG_TO_LBS = 2.20462
const LBS_TO_KG = 0.453592

export function useUnits() {
  const userStore = useUserStore()
  const { t, locale } = useI18n()

  /**
   * Current weight unit from user settings
   */
  const weightUnit = computed(() => userStore.settings?.weightUnit || 'kg')

  /**
   * Localized unit label
   */
  const unitLabel = computed(() => {
    return t(`common.units.${weightUnit.value}`)
  })

  /**
   * Available weight units
   */
  const availableWeightUnits = [
    {
      value: 'kg',
      label: 'Kilograms',
      labelKey: 'common.units.kg',
      name: 'Кілограми / Kilograms'
    },
    {
      value: 'lbs',
      label: 'Pounds',
      labelKey: 'common.units.lbs',
      name: 'Фунти / Pounds'
    },
  ]

  /**
   * Round to specified precision
   * @param {number} value
   * @param {number} precision
   * @returns {number}
   */
  function roundToPrecision(value, precision) {
    const factor = Math.pow(10, precision)
    return Math.round(value * factor) / factor
  }

  /**
   * Convert weight between units
   * @param {number|null|undefined} value - Weight value
   * @param {Object} options - Conversion options
   * @param {'kg'|'lbs'} [options.from='kg'] - Source unit
   * @param {'kg'|'lbs'} [options.to] - Target unit (defaults to user preference)
   * @param {number} [options.precision=1] - Decimal places
   * @returns {number|null}
   */
  function convertWeight(value, options = {}) {
    // Handle edge cases
    if (value === null || value === undefined) return null
    if (typeof value !== 'number' || isNaN(value)) return null
    if (value === 0) return 0
    if (value < 0) return null // Negative weights invalid

    const from = options.from || 'kg'
    const to = options.to || weightUnit.value
    const precision = options.precision ?? 1

    // Same unit, no conversion needed
    if (from === to) {
      return roundToPrecision(value, precision)
    }

    // Convert
    let result
    if (from === 'kg' && to === 'lbs') {
      result = value * KG_TO_LBS
    } else if (from === 'lbs' && to === 'kg') {
      result = value * LBS_TO_KG
    } else {
      return null // Invalid unit combination
    }

    return roundToPrecision(result, precision)
  }

  /**
   * Format large numbers with compact notation (k/M suffixes)
   * @param {number} value - Number to format
   * @param {string} locale - Locale for number formatting
   * @param {number} precision - Decimal places for compact notation
   * @returns {string}
   */
  function formatCompact(value, locale, precision = 1) {
    const absValue = Math.abs(value)

    if (absValue >= 1_000_000) {
      // Millions: 1,500,000 → "1.5M"
      const millions = value / 1_000_000
      return `${millions.toFixed(precision)}M`
    } else if (absValue >= 10_000) {
      // Thousands: 150,000 → "150k"
      const thousands = value / 1_000
      return `${thousands.toFixed(precision)}k`
    }

    // Small values: normal format with separators
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: precision
    }).format(value)
  }

  /**
   * Format weight with unit label
   * @param {number|null|undefined} value - Weight in storage unit (kg)
   * @param {Object} options - Format options
   * @param {number} [options.precision=1] - Decimal places
   * @param {boolean} [options.showUnit=true] - Include unit label
   * @param {'kg'|'lbs'} [options.from='kg'] - Source unit
   * @param {boolean|'auto'} [options.compact=false] - Use compact notation (k/M suffixes). 'auto' activates at ≥10k
   * @returns {string}
   */
  function formatWeight(value, options = {}) {
    const precision = options.precision ?? 1
    const showUnit = options.showUnit ?? true
    const from = options.from || 'kg'
    const compact = options.compact ?? false

    // Handle edge cases
    if (value === null || value === undefined) return '—'
    if (typeof value !== 'number' || isNaN(value)) return '—'

    // Convert to display unit WITHOUT precision rounding yet
    // We need the full value to determine if compact formatting applies
    const converted = convertWeight(value, {
      from,
      to: weightUnit.value,
      precision: 2, // Use higher precision for conversion, format later
    })

    if (converted === null) return '—'

    // Choose format based on compact option
    let formatted
    if (compact === true || (compact === 'auto' && Math.abs(converted) >= 10_000)) {
      formatted = formatCompact(converted, locale.value, precision)
    } else {
      // Standard format with locale-aware number formatting
      formatted = new Intl.NumberFormat(locale.value, {
        minimumFractionDigits: 0,
        maximumFractionDigits: precision,
      }).format(converted)
    }

    return showUnit ? `${formatted} ${unitLabel.value}` : formatted
  }

  /**
   * Convert from display unit to storage unit (kg)
   * Use when saving user input to database
   * @param {number} value - Weight in user's display unit
   * @param {'kg'|'lbs'} [fromUnit] - Override source unit
   * @returns {number|null}
   */
  function toStorageUnit(value, fromUnit) {
    const from = fromUnit || weightUnit.value
    return convertWeight(value, { from, to: 'kg', precision: 2 })
  }

  /**
   * Convert from storage unit (kg) to display unit
   * Use when displaying stored data
   * @param {number} value - Weight in kg (storage unit)
   * @returns {number|null}
   */
  function fromStorageUnit(value) {
    return convertWeight(value, { from: 'kg', to: weightUnit.value })
  }

  /**
   * Change weight unit preference
   * @param {'kg'|'lbs'} unit - New weight unit
   */
  async function changeWeightUnit(unit) {
    if (!['kg', 'lbs'].includes(unit)) {
      return
    }

    try {
      await userStore.updateSettings({ weightUnit: unit })
    } catch (error) {
      throw error
    }
  }

  return {
    weightUnit,
    unitLabel,
    availableWeightUnits,
    convertWeight,
    formatWeight,
    toStorageUnit,
    fromStorageUnit,
    changeWeightUnit,
  }
}
