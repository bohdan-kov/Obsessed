/**
 * Composable for strength level calculations
 * Classifies exercise performance levels (novice/intermediate/advanced)
 */

import { computed, ref } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { storeToRefs } from 'pinia'

/**
 * Strength standards database
 * Based on bodyweight multipliers for main compound lifts
 * Source: Adapted from Strength Level standards
 */
const STRENGTH_STANDARDS = {
  // Bench Press standards (male)
  'bench-press': {
    male: {
      beginner: 0.5, // 0.5x bodyweight
      novice: 0.75, // 0.75x bodyweight
      intermediate: 1.25, // 1.25x bodyweight
      advanced: 1.75, // 1.75x bodyweight
      elite: 2.0, // 2.0x bodyweight
    },
    female: {
      beginner: 0.3,
      novice: 0.5,
      intermediate: 0.75,
      advanced: 1.0,
      elite: 1.25,
    },
  },
  // Squat standards
  squat: {
    male: {
      beginner: 0.75,
      novice: 1.25,
      intermediate: 1.75,
      advanced: 2.5,
      elite: 3.0,
    },
    female: {
      beginner: 0.5,
      novice: 0.75,
      intermediate: 1.25,
      advanced: 1.75,
      elite: 2.25,
    },
  },
  // Deadlift standards
  deadlift: {
    male: {
      beginner: 1.0,
      novice: 1.5,
      intermediate: 2.0,
      advanced: 2.75,
      elite: 3.5,
    },
    female: {
      beginner: 0.5,
      novice: 1.0,
      intermediate: 1.5,
      advanced: 2.0,
      elite: 2.5,
    },
  },
  // Overhead Press standards
  'overhead-press': {
    male: {
      beginner: 0.35,
      novice: 0.55,
      intermediate: 0.85,
      advanced: 1.15,
      elite: 1.5,
    },
    female: {
      beginner: 0.2,
      novice: 0.35,
      intermediate: 0.55,
      advanced: 0.75,
      elite: 1.0,
    },
  },
}

/**
 * Level order for progression tracking
 */
const LEVEL_ORDER = ['beginner', 'novice', 'intermediate', 'advanced', 'elite']

/**
 * Use strength standards composable
 * @param {Object} options - Configuration options
 * @returns {Object} Strength standard utilities
 */
export function useStrengthStandards(options = {}) {
  const { defaultGender = 'male' } = options

  const userStore = useUserStore()
  const { profile } = storeToRefs(userStore)

  // User's gender (from profile or default)
  const gender = computed(() => {
    return profile.value?.gender || defaultGender
  })

  // User's bodyweight (from profile)
  const bodyweight = computed(() => {
    return profile.value?.bodyweight || null
  })

  /**
   * Normalizes exercise name to standard ID
   * @param {string} exerciseName - Exercise name
   * @returns {string|null} Standardized exercise ID
   */
  function normalizeExerciseName(exerciseName) {
    if (!exerciseName) return null

    const name = exerciseName.toLowerCase().trim()

    // Match bench press variations
    if (name.includes('bench') && name.includes('press')) {
      return 'bench-press'
    }

    // Match squat variations
    if (name.includes('squat')) {
      return 'squat'
    }

    // Match deadlift variations
    if (name.includes('deadlift')) {
      return 'deadlift'
    }

    // Match overhead press variations
    if (name.includes('overhead') || name.includes('military') || name.includes('shoulder press')) {
      return 'overhead-press'
    }

    return null
  }

  /**
   * Gets strength standards for an exercise
   * @param {string} exerciseName - Exercise name
   * @returns {Object|null} Standards object or null
   */
  function getStandardsForExercise(exerciseName) {
    const exerciseId = normalizeExerciseName(exerciseName)
    if (!exerciseId || !STRENGTH_STANDARDS[exerciseId]) {
      return null
    }

    return STRENGTH_STANDARDS[exerciseId][gender.value] || STRENGTH_STANDARDS[exerciseId]['male']
  }

  /**
   * Calculates strength level for a given weight
   * @param {string} exerciseName - Exercise name
   * @param {number} weight - Weight lifted (in kg)
   * @returns {Object|null} Level information or null
   */
  function calculateStrengthLevel(exerciseName, weight) {
    if (!weight || !bodyweight.value) {
      return null
    }

    const standards = getStandardsForExercise(exerciseName)
    if (!standards) {
      return null
    }

    const ratio = weight / bodyweight.value

    // Determine current level
    let currentLevel = 'beginner'
    for (const level of LEVEL_ORDER) {
      if (ratio >= standards[level]) {
        currentLevel = level
      } else {
        break
      }
    }

    // Find next level
    const currentIndex = LEVEL_ORDER.indexOf(currentLevel)
    const nextLevel = currentIndex < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[currentIndex + 1] : null

    // Calculate progress to next level
    const currentThreshold = standards[currentLevel]
    const nextThreshold = nextLevel ? standards[nextLevel] : null

    let progressPercent = 0
    let remainingWeight = 0

    if (nextThreshold) {
      const rangeSize = nextThreshold - currentThreshold
      const currentProgress = ratio - currentThreshold
      progressPercent = (currentProgress / rangeSize) * 100
      remainingWeight = (nextThreshold - ratio) * bodyweight.value
    } else {
      // Already at elite level
      progressPercent = 100
    }

    return {
      currentLevel,
      nextLevel,
      ratio,
      currentThreshold,
      nextThreshold,
      progressPercent: Math.min(100, Math.max(0, progressPercent)),
      remainingWeight: Math.max(0, remainingWeight),
      bodyweight: bodyweight.value,
    }
  }

  /**
   * Checks if an exercise has strength standards available
   * @param {string} exerciseName - Exercise name
   * @returns {boolean} True if standards are available
   */
  function hasStandards(exerciseName) {
    return !!getStandardsForExercise(exerciseName)
  }

  /**
   * Gets all supported exercises with standards
   * @returns {Array<Object>} List of exercises with standards
   */
  function getSupportedExercises() {
    return Object.keys(STRENGTH_STANDARDS).map((id) => ({
      id,
      name: id
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      standards: STRENGTH_STANDARDS[id],
    }))
  }

  /**
   * Formats level name for display
   * @param {string} level - Level ID
   * @returns {string} Formatted level name
   */
  function formatLevelName(level) {
    if (!level) return ''
    return level.charAt(0).toUpperCase() + level.slice(1)
  }

  /**
   * Gets color class for strength level
   * @param {string} level - Level ID
   * @returns {string} Tailwind color class
   */
  function getLevelColor(level) {
    const colorMap = {
      beginner: 'text-gray-500',
      novice: 'text-blue-500',
      intermediate: 'text-green-500',
      advanced: 'text-purple-500',
      elite: 'text-orange-500',
    }
    return colorMap[level] || colorMap['beginner']
  }

  /**
   * Gets badge variant for strength level
   * @param {string} level - Level ID
   * @returns {string} Badge variant
   */
  function getLevelBadgeVariant(level) {
    const variantMap = {
      beginner: 'secondary',
      novice: 'default',
      intermediate: 'default',
      advanced: 'default',
      elite: 'destructive',
    }
    return variantMap[level] || 'secondary'
  }

  /**
   * Calculates weight needed for a specific level
   * @param {string} exerciseName - Exercise name
   * @param {string} targetLevel - Target strength level
   * @returns {number|null} Weight in kg or null
   */
  function getWeightForLevel(exerciseName, targetLevel) {
    if (!bodyweight.value) {
      return null
    }

    const standards = getStandardsForExercise(exerciseName)
    if (!standards || !standards[targetLevel]) {
      return null
    }

    return standards[targetLevel] * bodyweight.value
  }

  return {
    // Computed
    gender,
    bodyweight,

    // Methods
    calculateStrengthLevel,
    hasStandards,
    getSupportedExercises,
    getStandardsForExercise,
    getWeightForLevel,
    normalizeExerciseName,

    // Formatters
    formatLevelName,
    getLevelColor,
    getLevelBadgeVariant,

    // Constants
    LEVEL_ORDER,
    STRENGTH_STANDARDS,
  }
}
