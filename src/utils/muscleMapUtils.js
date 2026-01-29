/**
 * @fileoverview Utilities for Muscle Map visualization
 * Provides mapping between app muscle groups and anatomical muscles,
 * as well as color/opacity calculations for muscle intensity visualization.
 */

import { MUSCLE_COLORS } from './chartUtils'

/**
 * Mapping of app muscle groups to anatomical muscles supported by the npm package
 * One app muscle group can map to multiple anatomical muscles (1:many relationship)
 * @type {Record<string, string[]>}
 */
export const MUSCLE_GROUP_MAPPING = {
  back: ['lats', 'traps', 'rotatorCuffs', 'lowerBack'],
  chest: ['chest'],
  legs: ['glutes', 'quads', 'hamstrings', 'adductors', 'abductors'],
  shoulders: ['frontDelts', 'sideDelts', 'rearDelts'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  core: ['abs', 'obliques'],
  calves: ['calves'],
}

/**
 * Converts analyticsStore muscle distribution data to anatomical muscle format
 * Maps app muscle groups to their corresponding anatomical muscles with calculated opacity
 *
 * @param {Array<{muscle: string, value: number, percentage: number}>} muscleDistribution - Data from analyticsStore
 * @returns {Array<{name: string, volume: number, percentage: number, appGroup: string, opacity: number, color: string}>} Anatomical muscle data
 */
export function convertToAnatomicalMuscles(muscleDistribution) {
  if (!muscleDistribution || muscleDistribution.length === 0) {
    return []
  }

  // Find max volume for opacity calculation
  const maxVolume = findMaxVolume(muscleDistribution)

  const result = []

  muscleDistribution.forEach(({ muscle, value, percentage }) => {
    const anatomicalMuscles = MUSCLE_GROUP_MAPPING[muscle]

    if (!anatomicalMuscles) {
      // Skip unknown muscle groups silently
      // (e.g., user data might contain deprecated or invalid muscle names)
      return
    }

    const opacity = calculateMuscleOpacity(value, maxVolume)
    const color = getMuscleColor(muscle)

    anatomicalMuscles.forEach((anatomicalMuscle) => {
      result.push({
        name: anatomicalMuscle,
        volume: value,
        percentage,
        appGroup: muscle, // Preserve original group for tooltips and colors
        opacity,
        color,
      })
    })
  })

  return result
}

/**
 * Calculates opacity for a muscle based on its training volume
 * Maps volume to opacity range [0.3, 1.0] so even minimal values are visible
 *
 * @param {number} volume - Training volume in kg
 * @param {number} maxVolume - Maximum volume across all muscle groups
 * @returns {number} Opacity value between 0.3 and 1.0
 */
export function calculateMuscleOpacity(volume, maxVolume) {
  if (volume === 0 || maxVolume === 0) {
    return 0.3 // Minimum opacity for visibility
  }

  // Calculate relative intensity (0-1)
  const intensity = Math.min(volume / maxVolume, 1)

  // Map to opacity range [0.3, 1.0]
  // 0.3 = minimum visible, 1.0 = maximum intensity
  const opacity = 0.3 + intensity * 0.7

  // Round to 2 decimal places for cleaner values
  return Math.round(opacity * 100) / 100
}

/**
 * Returns HEX color for a muscle group
 * Uses colors from MUSCLE_COLORS to maintain consistency with charts
 *
 * @param {string} appGroup - App muscle group name (e.g., 'chest', 'back')
 * @returns {string} HEX color code
 */
export function getMuscleColor(appGroup) {
  return MUSCLE_COLORS[appGroup] || '#6b7280' // gray-500 fallback
}

/**
 * Groups anatomical muscles by intensity level for rendering
 * Uses relative ranking: only top muscle group (with >60% of max volume) gets primary color
 * This ensures visual hierarchy based on actual training emphasis
 *
 * @param {Array<{name: string, opacity: number, volume: number, appGroup: string}>} anatomicalData - Anatomical muscle data
 * @returns {{primary: string[], secondary: string[]}} Grouped muscle names
 */
export function groupMusclesByIntensity(anatomicalData) {
  if (!anatomicalData.length) {
    return { primary: [], secondary: [] }
  }

  // Group by appGroup to calculate totals per muscle group
  const groupTotals = new Map()
  anatomicalData.forEach((muscle) => {
    const current = groupTotals.get(muscle.appGroup) || 0
    groupTotals.set(muscle.appGroup, current + muscle.volume)
  })

  // Find max volume across groups
  const maxGroupVolume = Math.max(...groupTotals.values())

  // Only groups with >60% of max volume get primary highlight (typically just the top group)
  const PRIMARY_PERCENTAGE = 0.6
  const PRIMARY_THRESHOLD = maxGroupVolume * PRIMARY_PERCENTAGE

  const primary = []
  const secondary = []

  anatomicalData.forEach((muscle) => {
    const groupVolume = groupTotals.get(muscle.appGroup)
    const isTopGroup = groupVolume >= PRIMARY_THRESHOLD

    if (isTopGroup) {
      primary.push(muscle.name)
    } else {
      secondary.push(muscle.name)
    }
  })

  return { primary, secondary }
}

/**
 * Finds the maximum volume value in muscle distribution data
 *
 * @param {Array<{value: number}>} muscleDistribution - Muscle distribution array
 * @returns {number} Maximum volume value
 */
export function findMaxVolume(muscleDistribution) {
  if (!muscleDistribution || muscleDistribution.length === 0) {
    return 0
  }

  return Math.max(...muscleDistribution.map((m) => m.value))
}
