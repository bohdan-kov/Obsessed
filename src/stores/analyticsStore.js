import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { useWorkoutStore } from './workoutStore'
import { useExerciseStore } from './exerciseStore'
import { useUserStore } from './userStore'
import { CONFIG } from '@/constants/config'
import {
  getThisMonthRange,
  getLastMonthRange,
  isWithinRange,
  getRollingRange,
  getComparisonRollingRange,
  getThisYearRange,
  getLastYearRange,
  getMonthBeforeLastRange,
  getAllTimeRange,
  normalizeDate,
  toLocalDateString,
} from '@/utils/dateUtils'
import {
  calculateCurrentStreak,
} from '@/utils/streakUtils'
import {
  createTrendObject,
  generateRestDaysInsight,
  generateStreakInsight,
  generateWorkoutInsight,
  generateVolumeInsight,
  generatePRInsight,
} from '@/utils/insightUtils'
import {
  calculate1RM,
  findBestSet,
  calculateTrend,
  getProgressStatus,
  findBestPR,
} from '@/utils/strengthUtils'

/**
 * @typedef {Object} VolumeDataPoint
 * @property {string} date - Date string
 * @property {number} volume - Total volume in kg
 * @property {number} workouts - Number of workouts
 * @property {number} exercises - Number of exercises
 */

/**
 * @typedef {Object} MuscleDistribution
 * @property {string} muscle - Muscle group name
 * @property {number} sets - Number of sets
 * @property {number} percentage - Percentage of total sets
 */

export const useAnalyticsStore = defineStore('analytics', () => {
  const workoutStore = useWorkoutStore()
  const exerciseStore = useExerciseStore()
  const userStore = useUserStore()

  // State
  const period = ref(CONFIG.analytics.periods.DEFAULT_PERIOD)
  const periodInitialized = ref(false)

  /**
   * Loading state - derived from workoutStore
   * Analytics data depends on workouts being loaded
   */
  const loading = computed(() => workoutStore.loading)

  /**
   * Create a Map of exercises by ID for O(1) lookups
   * This prevents N+1 query problem when resolving exercise data in loops
   */
  const exerciseMap = computed(() => {
    const map = new Map()
    exerciseStore.exercises.forEach((exercise) => {
      map.set(exercise.id, exercise)
    })
    return map
  })

  // Computed analytics from workout store
  /**
   * Completed workouts (single source of truth)
   * All other computed properties use this to avoid repeated filtering
   */
  const completedWorkouts = computed(() => {
    if (!workoutStore.workouts || !Array.isArray(workoutStore.workouts)) {
      return []
    }
    const completed = workoutStore.workouts.filter((w) => w.status === 'completed')
    return completed
  })

  /**
   * First workout date (earliest completedAt date)
   * Used for "All time" analytics to avoid showing empty periods before user's first workout
   * CRITICAL: Returns null if workouts haven't loaded yet, which causes getAllTimeRange
   * to fallback to 1 year ago. Components should use v-if="!loading" to wait for data.
   * @returns {Date|null} Date of first workout or null if no workouts
   */
  const firstWorkoutDate = computed(() => {
    if (!completedWorkouts.value.length) return null

    const dates = completedWorkouts.value
      .filter((w) => w.completedAt) // Filter out workouts without completedAt
      .map((w) => normalizeDate(w.completedAt))
      .filter((date) => !isNaN(date.getTime())) // Filter out invalid dates

    if (dates.length === 0) return null

    return new Date(Math.min(...dates))
  })

  /**
   * Total number of workouts in selected period
   */
  const totalWorkouts = computed(() => {
    return completedWorkouts.value.length
  })

  /**
   * Calculate total volume for a workout
   * Fallback calculation if totalVolume field is missing
   * @param {Object} workout
   * @returns {number}
   */
  function calculateWorkoutVolume(workout) {
    // Use stored totalVolume if available
    if (workout.totalVolume != null && workout.totalVolume > 0) {
      return workout.totalVolume
    }

    // Fallback: Calculate from exercises and sets
    if (!workout.exercises || workout.exercises.length === 0) {
      return 0
    }

    return workout.exercises.reduce((total, exercise) => {
      if (!exercise.sets || exercise.sets.length === 0) {
        return total
      }

      return total + exercise.sets.reduce((exTotal, set) => {
        return exTotal + (set.weight || 0) * (set.reps || 0)
      }, 0)
    }, 0)
  }

  /**
   * Total volume load (weight × reps × sets)
   */
  const volumeLoad = computed(() => {
    return completedWorkouts.value.reduce(
      (total, workout) => total + calculateWorkoutVolume(workout),
      0
    )
  })

  /**
   * Average volume per workout
   */
  const avgVolumePerWorkout = computed(() => {
    if (totalWorkouts.value === 0) return 0
    return Math.round(volumeLoad.value / totalWorkouts.value)
  })

  /**
   * Total number of sets completed
   */
  const totalSets = computed(() => {
    return completedWorkouts.value.reduce((total, workout) => {
      return (
        total +
        workout.exercises.reduce((exTotal, exercise) => {
          return exTotal + exercise.sets.length
        }, 0)
      )
    }, 0)
  })

  /**
   * Calculate rest days (days since last workout)
   * Returns 0 if worked out today, positive number for days since last workout
   */
  const restDays = computed(() => {
    if (completedWorkouts.value.length === 0) return 0

    // Find the most recent workout with valid completedAt
    const sortedWorkouts = [...completedWorkouts.value]
      .filter((w) => {
        // Filter out workouts with invalid completedAt dates
        if (!w.completedAt) return false
        const date = normalizeDate(w.completedAt)
        return !isNaN(date.getTime())
      })
      .sort((a, b) => {
        const dateA = normalizeDate(a.completedAt)
        const dateB = normalizeDate(b.completedAt)
        return dateB - dateA // Most recent first
      })

    // If no valid workouts after filtering, return 0
    if (sortedWorkouts.length === 0) return 0

    const lastWorkout = sortedWorkouts[0]
    const lastWorkoutDate = normalizeDate(lastWorkout.completedAt)

    // Calculate days difference from today
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Start of today
    const workoutDay = new Date(lastWorkoutDate)
    workoutDay.setHours(0, 0, 0, 0) // Start of workout day

    const diffTime = today - workoutDay
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    return Math.max(0, diffDays) // Ensure non-negative
  })

  /**
   * Count of personal records (PRs)
   * This would be calculated from historical data
   * For now, returns 0 (placeholder)
   */
  const prRecords = computed(() => {
    // TODO: Implement PR tracking logic
    // Compare current workout sets with historical data
    return 0
  })

  /**
   * Volume by day for bar chart (period-aware)
   * Uses currentRange to filter workouts based on selected period
   * @returns {VolumeDataPoint[]}
   */
  const volumeByDay = computed(() => {
    const dailyData = {}
    const range = currentRange.value

    // Initialize all days in the current range with 0
    const currentDate = new Date(range.start)
    while (currentDate <= range.end) {
      const dateStr = toLocalDateString(currentDate)
      dailyData[dateStr] = { volume: 0, workouts: 0, exercises: 0 }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Fill in actual data from period workouts
    periodWorkouts.value.forEach((workout) => {
      const date = normalizeDate(workout.completedAt)
      const dateStr = toLocalDateString(date)

      const volume = calculateWorkoutVolume(workout)
      const exerciseCount = workout.exercises?.length || 0

      if (dailyData[dateStr]) {
        dailyData[dateStr].volume += volume
        dailyData[dateStr].workouts += 1
        dailyData[dateStr].exercises += exerciseCount
      }
    })

    // Convert to array and sort by date
    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        volume: data.volume,
        workouts: data.workouts,
        exercises: data.exercises,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  })

  /**
   * Daily workout counts for contribution heatmap
   * Returns map of 'YYYY-MM-DD' -> workout count
   */
  const dailyWorkoutCounts = computed(() => {
    const counts = {}

    periodWorkouts.value.forEach((workout) => {
      const dateStr = toLocalDateString(workout.completedAt)
      counts[dateStr] = (counts[dateStr] || 0) + 1
    })

    return counts
  })

  /**
   * Daily volume map for VolumeHeatmap component
   * Returns map of 'YYYY-MM-DD' -> volume in kg
   */
  const dailyVolumeMap = computed(() => {
    const volumeMap = {}

    volumeByDay.value.forEach((day) => {
      volumeMap[day.date] = day.volume
    })

    return volumeMap
  })

  /**
   * Muscle group distribution for donut chart (period-aware)
   * Resolves muscle groups from exercise library
   * Uses periodWorkouts instead of all completedWorkouts
   * Optimized with O(1) exercise lookups using exerciseMap
   * @returns {MuscleDistribution[]}
   */
  const muscleDistribution = computed(() => {
    const muscleData = {}
    let totalSetCount = 0
    const exMap = exerciseMap.value

    periodWorkouts.value.forEach((workout) => {
      // Guard: Skip workouts without exercises array
      if (!workout.exercises || !Array.isArray(workout.exercises)) return

      workout.exercises.forEach((exercise) => {
        // O(1) lookup using Map instead of repeated function calls
        const exerciseData = exMap.get(exercise.exerciseId)
        // Early exit: Skip if exercise not found in library
        if (!exerciseData || !exerciseData.muscleGroup) return

        const muscle = exerciseData.muscleGroup
        const setCount = exercise.sets?.length ?? 0

        if (!muscleData[muscle]) {
          muscleData[muscle] = 0
        }

        muscleData[muscle] += setCount
        totalSetCount += setCount
      })
    })

    // Convert to array with percentages
    return Object.entries(muscleData)
      .map(([muscle, sets]) => ({
        muscle,
        sets,
        percentage: totalSetCount > 0 ? (sets / totalSetCount) * 100 : 0,
      }))
      .sort((a, b) => b.sets - a.sets)
  })

  /**
   * Muscle group distribution by volume (period-aware)
   * Resolves muscle groups from exercise library
   * Uses periodWorkouts and calculates total volume (weight × reps) per muscle
   * Returns unified shape: { muscle, value, percentage }
   * Optimized with O(1) exercise lookups using exerciseMap
   * @returns {Array<{muscle: string, value: number, percentage: number}>}
   */
  const muscleDistributionByVolume = computed(() => {
    const muscleData = {}
    let totalVolume = 0
    const exMap = exerciseMap.value

    periodWorkouts.value.forEach((workout) => {
      // Guard: Skip workouts without exercises array
      if (!workout.exercises || !Array.isArray(workout.exercises)) return

      workout.exercises.forEach((exercise) => {
        // O(1) lookup using Map instead of repeated function calls
        const exerciseData = exMap.get(exercise.exerciseId)
        // Early exit: Skip if exercise not found in library
        if (!exerciseData || !exerciseData.muscleGroup) return

        const muscle = exerciseData.muscleGroup

        // Calculate volume for this exercise (defensive against missing values)
        const exerciseVolume = exercise.sets?.reduce(
          (sum, set) => sum + (set.weight || 0) * (set.reps || 0),
          0
        ) ?? 0

        if (!muscleData[muscle]) {
          muscleData[muscle] = 0
        }

        muscleData[muscle] += exerciseVolume
        totalVolume += exerciseVolume
      })
    })

    // Convert to array with percentages (unified shape)
    return Object.entries(muscleData)
      .map(([muscle, value]) => ({
        muscle,
        value,
        percentage: totalVolume > 0 ? (value / totalVolume) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
  })

  /**
   * Muscle volume by day for MuscleVolumeChart (daily aggregation)
   * Generates daily data points for the selected period range with muscle volume breakdown
   * Similar to volumeByDay but tracks volume per muscle group instead of total volume
   * @returns {Array} Array of objects with date and volume per muscle group
   */
  const muscleVolumeByDay = computed(() => {
    const range = currentRange.value
    const exMap = exerciseMap.value
    const dailyData = {}

    // All muscle groups to track
    const MUSCLES = ['back', 'chest', 'legs', 'shoulders', 'biceps', 'triceps', 'core', 'calves']

    // Helper to initialize muscle volumes
    const createEmptyMuscles = () => {
      const muscleVolumes = {}
      MUSCLES.forEach((muscle) => {
        muscleVolumes[muscle] = 0
      })
      return muscleVolumes
    }

    // Step 1: Initialize all days in the current range with 0 values
    const currentDate = new Date(range.start)
    while (currentDate <= range.end) {
      const dateStr = toLocalDateString(currentDate)
      dailyData[dateStr] = createEmptyMuscles()
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Step 2: Populate days with actual workout data
    periodWorkouts.value.forEach((workout) => {
      // Guard: Skip workouts without exercises or completedAt
      if (!workout.exercises || !Array.isArray(workout.exercises) || !workout.completedAt) return

      const workoutDate = normalizeDate(workout.completedAt)
      const dateStr = toLocalDateString(workoutDate)

      // Only process if date is in our range
      if (!dailyData[dateStr]) return

      // Aggregate volume by muscle group for this workout
      workout.exercises.forEach((exercise) => {
        const exerciseData = exMap.get(exercise.exerciseId)
        if (!exerciseData || !exerciseData.muscleGroup) return

        const muscle = exerciseData.muscleGroup
        if (!MUSCLES.includes(muscle)) return

        const exerciseVolume = exercise.sets?.reduce(
          (sum, set) => sum + (set.weight || 0) * (set.reps || 0),
          0
        ) ?? 0

        dailyData[dateStr][muscle] += exerciseVolume
      })
    })

    // Step 3: Convert to array and sort by date
    const result = Object.entries(dailyData)
      .map(([date, muscles]) => ({
        date, // YYYY-MM-DD format string
        ...muscles, // Spread muscle volumes (back, chest, legs, etc.)
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))

    return result
  })

  // REMOVED: muscleVolumeOverTime (deprecated - was replaced by muscleVolumeByDay)

  /**
   * Weekly volume progression (for ProgressiveOverloadChart)
   * Groups workouts by week and calculates total volume with change percentage
   * @returns {Array} Array of weekly volume data with status
   */
  const weeklyVolumeProgression = computed(() => {
    if (!periodWorkouts.value.length) return []

    const weeklyData = new Map() // Map<weekKey, { weekStart: Date, volume: number }>

    periodWorkouts.value.forEach((workout) => {
      // Guard: Skip workouts without completedAt
      if (!workout.completedAt) return

      const workoutDate = workout.completedAt?.toDate
        ? workout.completedAt.toDate()
        : new Date(workout.completedAt)

      // Guard: Skip workouts with invalid dates
      if (isNaN(workoutDate.getTime())) return

      // Get Monday of the week for this workout (ISO week)
      const weekStart = new Date(workoutDate)
      const day = weekStart.getDay()
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
      weekStart.setDate(diff)
      weekStart.setHours(0, 0, 0, 0)

      const weekKey = weekStart.toISOString().split('T')[0]

      // Initialize week data if not exists
      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, {
          weekStart,
          volume: 0,
        })
      }

      const weekData = weeklyData.get(weekKey)
      weekData.volume += calculateWorkoutVolume(workout)
    })

    // Convert Map to array and sort by week start date
    const sortedWeeks = Array.from(weeklyData.entries())
      .sort(([, a], [, b]) => a.weekStart - b.weekStart)
      .map(([weekKey, data], index, array) => {
        // Calculate change from previous week
        let change = 0
        let status = 'maintaining'

        if (index > 0) {
          const previousVolume = array[index - 1][1].volume
          if (previousVolume > 0) {
            change = ((data.volume - previousVolume) / previousVolume) * 100

            // Determine status based on change
            if (change >= 5) {
              status = 'progressing'
            } else if (change <= -5) {
              status = 'regressing'
            } else {
              status = 'maintaining'
            }
          }
        }

        const weekNumber = index + 1
        const weekLabel = `Week ${weekNumber}` // Will be localized in the component

        return {
          week: weekLabel,
          weekStart: data.weekStart,
          volume: data.volume,
          change,
          status,
        }
      })

    return sortedWeeks
  })

  /**
   * Progressive overload statistics (for ProgressiveOverloadChart)
   * Analyzes weekly volume progression to determine overall training progress
   * @returns {Object|null} Progressive overload stats or null if insufficient data
   */
  const progressiveOverloadStats = computed(() => {
    const weeks = weeklyVolumeProgression.value

    // Need at least 2 weeks to calculate stats
    if (weeks.length < 2) return null

    // Count weeks with progression (positive change >= 5%)
    const weeksProgressing = weeks.filter((w) => w.status === 'progressing').length
    const totalWeeks = weeks.length - 1 // Subtract 1 because first week has no change

    // Calculate progress rate
    const progressRate = totalWeeks > 0 ? (weeksProgressing / totalWeeks) * 100 : 0

    // Calculate average increase across all weeks (excluding first)
    const increases = weeks.slice(1).map((w) => w.change)
    const avgIncrease = increases.length > 0
      ? increases.reduce((sum, change) => sum + change, 0) / increases.length
      : 0

    // Determine overall status
    let overallStatus = 'maintaining'
    if (progressRate >= 50 && avgIncrease >= 5) {
      overallStatus = 'on_track'
    } else if (avgIncrease <= -5) {
      overallStatus = 'regressing'
    }

    // Calculate next week target (5% increase from latest week)
    const latestVolume = weeks[weeks.length - 1].volume
    const nextWeekTarget = Math.round(latestVolume * 1.05)

    return {
      weeksProgressing,
      totalWeeks,
      progressRate,
      avgIncrease,
      overallStatus,
      nextWeekTarget,
    }
  })

  /**
   * Duration trend data (for DurationTrendChart)
   * Returns workout data with duration, volume, and exercise count
   * @returns {Array} Array of workout data points sorted by date
   */
  const durationTrendData = computed(() => {
    if (!periodWorkouts.value.length) return []

    return periodWorkouts.value
      .filter((workout) => {
        // Only include workouts with duration AND valid completedAt dates
        if (!workout.completedAt || !workout.duration) return false

        // Validate that completedAt can be converted to a valid date
        const date = normalizeDate(workout.completedAt)
        return !isNaN(date.getTime())
      })
      .map((workout) => {
        const workoutDate = normalizeDate(workout.completedAt)
        const volume = calculateWorkoutVolume(workout)
        const exerciseCount = workout.exercises?.length || 0

        return {
          date: workoutDate,
          duration: Math.round(workout.duration),
          volume,
          exerciseCount,
          id: workout.id,
        }
      })
      .sort((a, b) => a.date - b.date) // Sort chronologically
  })

  /**
   * Duration statistics (for DurationTrendChart stats display)
   * Calculates average, shortest, longest, and trend for workout durations
   * @returns {Object|null} Duration stats or null if no data
   */
  const durationStats = computed(() => {
    // Filter workouts with valid duration AND valid completedAt dates
    const workoutsWithDuration = periodWorkouts.value.filter((workout) => {
      if (!workout.duration || workout.duration <= 0) return false
      if (!workout.completedAt) return false

      // Validate that completedAt can be converted to a valid date
      const date = normalizeDate(workout.completedAt)
      return !isNaN(date.getTime())
    })

    if (!workoutsWithDuration.length) return null

    // Calculate average (rounded to whole number)
    const totalDuration = workoutsWithDuration.reduce((sum, w) => sum + w.duration, 0)
    const average = Math.round(totalDuration / workoutsWithDuration.length)

    // Find shortest and longest (rounded to whole numbers)
    const sorted = [...workoutsWithDuration].sort((a, b) => a.duration - b.duration)
    const shortest = {
      value: Math.round(sorted[0].duration),
      date: normalizeDate(sorted[0].completedAt),
    }
    const longest = {
      value: Math.round(sorted[sorted.length - 1].duration),
      date: normalizeDate(sorted[sorted.length - 1].completedAt),
    }

    // Calculate trend (comparing first half vs second half)
    const trend = calculateTrend(
      workoutsWithDuration.map((w) => w.duration),
      5 // Threshold percentage for stable
    )

    return {
      average,
      shortest,
      longest,
      trend,
    }
  })

  /**
   * Frequency heatmap data (period-aware)
   * Uses periodWorkouts instead of all completedWorkouts
   * @returns {Object} Heatmap data by day of week and hour
   */
  const frequencyHeatmap = computed(() => {
    const heatmap = {}

    // Initialize 7 days × 24 hours
    const daysOfWeek = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ]

    daysOfWeek.forEach((day) => {
      heatmap[day] = Array(24).fill(0)
    })

    periodWorkouts.value.forEach((workout) => {
      // Guard: Skip workouts without startedAt timestamp
      if (!workout.startedAt) return

      const date = workout.startedAt?.toDate
        ? workout.startedAt.toDate()
        : new Date(workout.startedAt)

      // Guard: Skip workouts with invalid dates
      if (isNaN(date.getTime())) return

      const dayOfWeek = daysOfWeek[date.getDay() === 0 ? 6 : date.getDay() - 1]
      const hour = date.getHours()

      if (heatmap[dayOfWeek]) {
        heatmap[dayOfWeek][hour]++
      }
    })

    return heatmap
  })

  /**
   * Compare current period with previous period (period-aware)
   * Replaces weekComparison with dynamic period-based comparison
   * Uses periodWorkouts and comparisonWorkouts
   * @returns {Object} Comparison metrics
   */
  const periodComparison = computed(() => {
    const currentPeriodWorkouts = periodWorkouts.value
    const previousPeriodWorkouts = comparisonWorkouts.value

    const currentVolume = currentPeriodWorkouts.reduce(
      (total, w) => total + calculateWorkoutVolume(w),
      0
    )
    const previousVolume = previousPeriodWorkouts.reduce(
      (total, w) => total + calculateWorkoutVolume(w),
      0
    )

    const volumeChange =
      previousVolume > 0
        ? ((currentVolume - previousVolume) / previousVolume) * 100
        : 0

    return {
      currentPeriod: {
        workouts: currentPeriodWorkouts.length,
        volume: currentVolume,
        avgVolume:
          currentPeriodWorkouts.length > 0
            ? Math.round(currentVolume / currentPeriodWorkouts.length)
            : 0,
      },
      previousPeriod: {
        workouts: previousPeriodWorkouts.length,
        volume: previousVolume,
        avgVolume:
          previousPeriodWorkouts.length > 0
            ? Math.round(previousVolume / previousPeriodWorkouts.length)
            : 0,
      },
      change: {
        workouts: currentPeriodWorkouts.length - previousPeriodWorkouts.length,
        volume: Math.round(currentVolume - previousVolume),
        volumePercentage: Math.round(volumeChange),
      },
    }
  })


  /**
   * Workout streak (consecutive days with workouts)
   * Uses calculateCurrentStreak utility for reusable streak logic
   */
  const currentStreak = computed(() => {
    return calculateCurrentStreak(completedWorkouts.value, 'completedAt')
  })

  /**
   * Best workout (highest volume)
   */
  const bestWorkout = computed(() => {
    return completedWorkouts.value.reduce((best, current) => {
        const currentVol = calculateWorkoutVolume(current)
        const bestVol = best ? calculateWorkoutVolume(best) : 0
        if (!best || currentVol > bestVol) {
          return current
        }
        return best
      }, null)
  })

  /**
   * Muscle progress by period (period-aware)
   * Resolves muscle groups from exercise library
   * Uses periodWorkouts instead of filtering by week
   * Optimized with O(1) exercise lookups using exerciseMap
   * @returns {Array<{muscle: string, percent: number, color: string}>}
   */
  const muscleProgress = computed(() => {
    const muscleData = {}
    let totalVolume = 0
    const exMap = exerciseMap.value

    // Calculate volume per muscle group in selected period
    periodWorkouts.value.forEach((workout) => {
      workout.exercises.forEach((exercise) => {
        // O(1) lookup using Map instead of repeated function calls
        const exerciseData = exMap.get(exercise.exerciseId)
        const muscle = exerciseData?.muscleGroup || 'unknown'
        const exerciseVolume = exercise.sets.reduce(
          (sum, set) => sum + set.weight * set.reps,
          0
        )

        if (!muscleData[muscle]) {
          muscleData[muscle] = 0
        }

        muscleData[muscle] += exerciseVolume
        totalVolume += exerciseVolume
      })
    })

    // Map to colors (using muscle group IDs from exercise library)
    const muscleColors = {
      chest: 'bg-red-500',
      back: 'bg-orange-500',
      legs: 'bg-yellow-500',
      shoulders: 'bg-green-500',
      biceps: 'bg-blue-500',
      triceps: 'bg-cyan-500',
      core: 'bg-purple-500',
      calves: 'bg-pink-500',
      unknown: 'bg-gray-500',
    }

    // Convert to array with percentages
    return Object.entries(muscleData)
      .map(([muscle, volume]) => ({
        muscle,
        percent: totalVolume > 0 ? Math.round((volume / totalVolume) * 100) : 0,
        color: muscleColors[muscle] || 'bg-gray-500',
      }))
      .sort((a, b) => b.percent - a.percent)
  })

  /**
   * Average RPE (Rate of Perceived Exertion) for selected period
   * Period-aware: Uses periodWorkouts instead of fixed 7-day window
   * Calculates average from all sets with valid RPE values (1-10)
   * @returns {number} Average RPE (0 if no data, formatted to 1 decimal place)
   */
  const avgRpe = computed(() => {
    // Extract all valid RPE values from sets in current period
    const rpeSets = []
    periodWorkouts.value.forEach((workout) => {
      workout.exercises?.forEach((exercise) => {
        exercise.sets?.forEach((set) => {
          if (
            set.rpe >= CONFIG.workout.RPE_MIN &&
            set.rpe <= CONFIG.workout.RPE_MAX
          ) {
            rpeSets.push(set.rpe)
          }
        })
      })
    })

    if (rpeSets.length === 0) return 0

    const sum = rpeSets.reduce((total, rpe) => total + rpe, 0)
    return Number((sum / rpeSets.length).toFixed(1))
  })

  /**
   * Quick stats
   * @returns {Object} Quick stats for muscle progress card
   */
  const quickStats = computed(() => {
    return {
      avgRpe: avgRpe.value,
      weight: userStore.currentWeight, // Reactive reference to userStore
    }
  })

  // ========================================
  // Period-aware computeds (new architecture)
  // ========================================

  /**
   * Period configuration
   */
  const periodConfig = computed(() => {
    const options = CONFIG.analytics.periods.PERIOD_OPTIONS
    return (
      options.find((opt) => opt.id === period.value) ||
      options.find((opt) => opt.isDefault)
    )
  })

  /**
   * Current period range
   * CRITICAL: For 'allTime' period, this computed depends on firstWorkoutDate
   * which requires workouts to be loaded. Components should check loading state
   * before rendering data to avoid showing empty state on initial load.
   */
  const currentRange = computed(() => {
    const config = periodConfig.value

    let range
    switch (config.type) {
      case 'rolling':
        range = getRollingRange(config.days)
        break
      case 'calendarMonth':
        range = getThisMonthRange()
        break
      case 'previousCalendarMonth':
        range = getLastMonthRange()
        break
      case 'calendarYear':
        range = getThisYearRange()
        break
      case 'allTime':
        // Pass firstWorkoutDate to start range from user's first workout
        // If workouts haven't loaded yet, firstWorkoutDate will be null
        // and getAllTimeRange will fallback to 1 year ago (which is fine as a temp value)
        // Once workouts load, this computed will reactively update
        range = getAllTimeRange(firstWorkoutDate.value)
        break
      default:
        range = getThisMonthRange()
    }

    return range
  })

  /**
   * Comparison period range
   */
  const comparisonRange = computed(() => {
    const config = periodConfig.value
    if (!config.comparisonType) return null

    switch (config.comparisonType) {
      case 'rolling':
        return getComparisonRollingRange(config.days)
      case 'previousMonth':
        return getLastMonthRange()
      case 'monthBeforeLast':
        return getMonthBeforeLastRange()
      case 'previousYear':
        return getLastYearRange()
      default:
        return null
    }
  })

  /**
   * Check if trend should be shown
   */
  const hasTrend = computed(() => comparisonRange.value !== null)

  /**
   * Period workouts (replaces workoutsThisMonth)
   */
  const periodWorkouts = computed(() => {
    const range = currentRange.value

    const filtered = completedWorkouts.value.filter((w) => {
      if (!w.completedAt) {
        return false
      }

      const date = normalizeDate(w.completedAt)

      // Skip workouts with invalid dates
      if (isNaN(date.getTime())) {
        return false
      }

      return isWithinRange(date, range.start, range.end)
    })

    return filtered
  })

  /**
   * Comparison workouts (replaces workoutsLastMonth)
   */
  const comparisonWorkouts = computed(() => {
    const range = comparisonRange.value
    if (!range) return []

    return completedWorkouts.value.filter((w) => {
      if (!w.completedAt) return false
      const date = normalizeDate(w.completedAt)
      if (isNaN(date.getTime())) return false
      return isWithinRange(date, range.start, range.end)
    })
  })

  /**
   * Period volume (replaces volumeThisMonth)
   */
  const periodVolume = computed(() => {
    return periodWorkouts.value.reduce((sum, workout) => {
      return sum + calculateWorkoutVolume(workout)
    }, 0)
  })

  /**
   * Comparison volume (replaces volumeLastMonth)
   */
  const comparisonVolume = computed(() => {
    return comparisonWorkouts.value.reduce((sum, workout) => {
      return sum + calculateWorkoutVolume(workout)
    }, 0)
  })

  /**
   * Dynamic period label for stat cards
   */
  const periodLabel = computed(() => {
    return `dashboard.stats.periods.${periodConfig.value.id}`
  })

  // ========================================
  // Legacy month-based computeds (kept for backwards compatibility)
  // ========================================

  /**
   * Workouts this month (current calendar month)
   */
  const workoutsThisMonth = computed(() => {
    const { start, end } = getThisMonthRange()
    return completedWorkouts.value.filter((w) => {
      const date = normalizeDate(w.completedAt)
      return isWithinRange(date, start, end)
    }).length
  })

  /**
   * Workouts last month (previous calendar month)
   */
  const workoutsLastMonth = computed(() => {
    const { start, end } = getLastMonthRange()
    return completedWorkouts.value.filter((w) => {
      const date = normalizeDate(w.completedAt)
      return isWithinRange(date, start, end)
    }).length
  })

  /**
   * Workout count trend (period-aware)
   */
  const workoutsTrend = computed(() => {
    if (!hasTrend.value) return null

    const current = periodWorkouts.value.length
    const previous = comparisonWorkouts.value.length

    return createTrendObject(current, previous, 'percentage')
  })

  /**
   * Volume this month (current calendar month)
   */
  const volumeThisMonth = computed(() => {
    const { start, end } = getThisMonthRange()
    return completedWorkouts.value
      .filter((w) => {
        const date = w.completedAt?.toDate
          ? w.completedAt.toDate()
          : new Date(w.completedAt)
        return isWithinRange(date, start, end)
      })
      .reduce((total, workout) => total + calculateWorkoutVolume(workout), 0)
  })

  /**
   * Volume last month (previous calendar month)
   */
  const volumeLastMonth = computed(() => {
    const { start, end } = getLastMonthRange()
    return completedWorkouts.value
      .filter((w) => {
        const date = w.completedAt?.toDate
          ? w.completedAt.toDate()
          : new Date(w.completedAt)
        return isWithinRange(date, start, end)
      })
      .reduce((total, workout) => total + calculateWorkoutVolume(workout), 0)
  })

  /**
   * Volume trend (period-aware)
   */
  const volumeTrend = computed(() => {
    if (!hasTrend.value) return null

    return createTrendObject(
      periodVolume.value,
      comparisonVolume.value,
      'percentage'
    )
  })

  /**
   * Rest days insight
   */
  const restDaysInsight = computed(() => {
    return generateRestDaysInsight(
      restDays.value,
      CONFIG.analytics.insights.restDays
    )
  })

  /**
   * Streak insight
   */
  const streakInsight = computed(() => {
    return generateStreakInsight(
      currentStreak.value,
      CONFIG.analytics.insights.streak
    )
  })

  /**
   * Workouts insight (monthly target)
   */
  const workoutsInsight = computed(() => {
    return generateWorkoutInsight(
      workoutsThisMonth.value,
      CONFIG.analytics.insights.workouts.MONTHLY_TARGET,
      workoutsTrend.value
    )
  })

  /**
   * Volume insight
   */
  const volumeInsight = computed(() => {
    return generateVolumeInsight(
      volumeTrend.value,
      CONFIG.analytics.insights.volume
    )
  })

  /**
   * Longest workout streak (all-time)
   * Returns the longest consecutive days with at least one workout
   * @returns {{ days: number, startDate: string|null, endDate: string|null }}
   */
  const longestStreak = computed(() => {
    if (completedWorkouts.value.length === 0) {
      return { days: 0, startDate: null, endDate: null }
    }

    // Extract unique workout dates and deduplicate via Set
    const uniqueDates = new Set()
    completedWorkouts.value.forEach((workout) => {
      const date = normalizeDate(workout.completedAt)
      const dateStr = toLocalDateString(date)
      uniqueDates.add(dateStr)
    })

    // Convert to sorted array (ascending chronological order)
    const sortedDates = Array.from(uniqueDates).sort()

    if (sortedDates.length === 1) {
      return { days: 1, startDate: sortedDates[0], endDate: sortedDates[0] }
    }

    // Track longest and current streaks
    let longestStreakDays = 1
    let longestStreakStart = sortedDates[0]
    let longestStreakEnd = sortedDates[0]

    let currentStreakDays = 1
    let currentStreakStart = sortedDates[0]
    let currentStreakEnd = sortedDates[0]

    // Iterate through sorted dates to find streaks
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1])
      const currDate = new Date(sortedDates[i])

      // Calculate difference in days
      const diffTime = currDate - prevDate
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        // Consecutive day - extend current streak
        currentStreakDays++
        currentStreakEnd = sortedDates[i]
      } else {
        // Streak broken - check if current was longest
        if (currentStreakDays > longestStreakDays) {
          longestStreakDays = currentStreakDays
          longestStreakStart = currentStreakStart
          longestStreakEnd = currentStreakEnd
        }

        // Reset current streak
        currentStreakDays = 1
        currentStreakStart = sortedDates[i]
        currentStreakEnd = sortedDates[i]
      }
    }

    // Final check - current streak might be the longest
    if (currentStreakDays > longestStreakDays) {
      longestStreakDays = currentStreakDays
      longestStreakStart = currentStreakStart
      longestStreakEnd = currentStreakEnd
    }

    return {
      days: longestStreakDays,
      startDate: longestStreakStart,
      endDate: longestStreakEnd,
    }
  })

  /**
   * Most active day of week (period-aware)
   * Returns the day of week with most workouts in current period
   * @returns {{ dayIndex: number, dayKey: string, count: number }|null}
   */
  const mostActiveDay = computed(() => {
    if (periodWorkouts.value.length === 0) {
      return null
    }

    // Initialize day counts (0 = Sunday, 6 = Saturday)
    const dayCount = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }

    // Count workouts by day of week
    periodWorkouts.value.forEach((workout) => {
      const date = normalizeDate(workout.completedAt)
      const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
      dayCount[dayOfWeek]++
    })

    // Find day with maximum count
    let maxCount = 0
    let maxDayIndex = 0

    for (let dayIndex = 0; dayIndex <= 6; dayIndex++) {
      if (dayCount[dayIndex] > maxCount) {
        maxCount = dayCount[dayIndex]
        maxDayIndex = dayIndex
      } else if (dayCount[dayIndex] === maxCount && dayIndex > 0 && dayIndex < maxDayIndex) {
        // Tie: prefer earlier weekday (Monday = 1 over Tuesday = 2)
        maxDayIndex = dayIndex
      }
    }

    // Map dayIndex to dayKey for i18n
    const dayKeyMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
    const dayKey = dayKeyMap[maxDayIndex]

    return {
      dayIndex: maxDayIndex,
      dayKey,
      count: maxCount,
    }
  })

  /**
   * Average workouts per week (period-aware)
   * Calculates average based on selected period
   * @returns {number}
   */
  const averageWorkoutsPerWeek = computed(() => {
    const totalWorkouts = periodWorkouts.value.length
    if (totalWorkouts === 0) return 0

    const range = currentRange.value
    const diffMs = range.end - range.start
    const weeks = Math.max(diffMs / (7 * 24 * 60 * 60 * 1000), 1)

    const average = totalWorkouts / weeks
    return Number(average.toFixed(1))
  })

  /**
   * Personal Records (PRs) tracking
   * Tracks weight PRs and rep PRs for each exercise
   */
  const exercisePRs = computed(() => {
    const prs = new Map()
    const { WEIGHT_TIER_SIZE_KG } = CONFIG.analytics.insights.pr

    // Reverse workouts to chronological order (oldest first) to track PRs properly
    // completedWorkouts is already sorted descending by startedAt, so we just reverse
    const sortedWorkouts = [...completedWorkouts.value].reverse()

    sortedWorkouts.forEach((workout) => {
      // Guard: Skip workouts without exercises array
      if (!workout.exercises || !Array.isArray(workout.exercises)) return

      workout.exercises.forEach((exercise) => {
        // Guard: Skip exercises without valid ID
        if (!exercise.exerciseId) return

        const exerciseId = exercise.exerciseId

        // Initialize exercise PR tracking if not exists
        if (!prs.has(exerciseId)) {
          prs.set(exerciseId, {
            exerciseId,
            exerciseName: exercise.exerciseName,
            weightPR: { weight: 0, reps: 0, date: null },
            repPRs: new Map(), // Map of weight tier -> { reps, date }
            prCount: 0,
          })
        }

        const exercisePR = prs.get(exerciseId)

        // Guard: Skip exercises without sets array
        if (!exercise.sets || !Array.isArray(exercise.sets)) return

        exercise.sets.forEach((set) => {
          const weight = set.weight || 0
          const reps = set.reps || 0

          // Weight PR: Highest weight lifted for any reps
          if (weight > exercisePR.weightPR.weight) {
            exercisePR.weightPR = {
              weight,
              reps,
              date: workout.completedAt,
            }
            exercisePR.prCount++
          }

          // Rep PR: Highest reps at a given weight tier
          const weightTier =
            Math.round(weight / WEIGHT_TIER_SIZE_KG) * WEIGHT_TIER_SIZE_KG
          const currentRepPR = exercisePR.repPRs.get(weightTier)

          if (!currentRepPR || reps > currentRepPR.reps) {
            exercisePR.repPRs.set(weightTier, {
              reps,
              date: workout.completedAt,
            })
            exercisePR.prCount++
          }
        })
      })
    })

    return prs
  })

  /**
   * Total PR count (all-time)
   */
  const prCount = computed(() => {
    let total = 0
    exercisePRs.value.forEach((exercisePR) => {
      total += exercisePR.prCount
    })
    return total
  })

  /**
   * PR count this month
   */
  const prCountThisMonth = computed(() => {
    const { start, end } = getThisMonthRange()
    let count = 0

    exercisePRs.value.forEach((exercisePR) => {
      // Check weight PR date
      if (exercisePR.weightPR.date) {
        const prDate = exercisePR.weightPR.date.toDate
          ? exercisePR.weightPR.date.toDate()
          : new Date(exercisePR.weightPR.date)
        if (isWithinRange(prDate, start, end)) {
          count++
        }
      }

      // Check rep PR dates
      exercisePR.repPRs.forEach((repPR) => {
        if (repPR.date) {
          const prDate = repPR.date.toDate
            ? repPR.date.toDate()
            : new Date(repPR.date)
          if (isWithinRange(prDate, start, end)) {
            count++
          }
        }
      })
    })

    return count
  })

  /**
   * PR insight
   */
  const prInsight = computed(() => {
    return generatePRInsight(prCountThisMonth.value, prCount.value)
  })

  // Helper functions

  /**
   * Set the analytics period
   * @param {string} newPeriod - Period ID (e.g., 'last30Days')
   */
  function setPeriod(newPeriod) {
    const validPeriod = CONFIG.analytics.periods.PERIOD_OPTIONS.find(
      (p) => p.id === newPeriod
    )
    if (!validPeriod) {
      newPeriod = CONFIG.analytics.periods.DEFAULT_PERIOD
    }

    period.value = newPeriod

    // Persist to localStorage
    try {
      localStorage.setItem(CONFIG.storage.ANALYTICS_PERIOD, newPeriod)
    } catch (e) {
      // Silently fail in production
    }
  }

  /**
   * Initialize period from localStorage
   */
  function initializePeriod() {
    if (periodInitialized.value) return

    try {
      const stored = localStorage.getItem(CONFIG.storage.ANALYTICS_PERIOD)

      if (stored) {
        const isValid = CONFIG.analytics.periods.PERIOD_OPTIONS.some(
          (p) => p.id === stored
        )
        if (isValid) {
          period.value = stored
        } else {
          localStorage.removeItem(CONFIG.storage.ANALYTICS_PERIOD)
        }
      }
    } catch (e) {
      // Silently fail in production
    }

    periodInitialized.value = true
  }

  /**
   * Exercise Progress Table (Feature 4.1)
   * Aggregates exercise data across all completed workouts
   * Calculates 1RM, trends, and progress status for each exercise
   * @returns {Array<{id: string, name: string, estimated1RM: number, bestPR: object, lastPerformed: Date, trend: object, trendPercentage: number, status: object, history: Array}>}
   */
  const exerciseProgressTable = computed(() => {
    if (completedWorkouts.value.length === 0) return []

    // Group exercises by exerciseId
    const exerciseGroups = new Map()
    const exMap = exerciseMap.value

    // Sort workouts chronologically (oldest first) for proper history tracking
    const sortedWorkouts = [...completedWorkouts.value]
      .filter((w) => w.completedAt)
      .sort((a, b) => {
        const dateA = normalizeDate(a.completedAt)
        const dateB = normalizeDate(b.completedAt)
        return dateA - dateB
      })

    // Build exercise history
    sortedWorkouts.forEach((workout) => {
      if (!workout.exercises || !Array.isArray(workout.exercises)) return

      workout.exercises.forEach((exercise) => {
        if (!exercise.exerciseId) return

        const exerciseId = exercise.exerciseId
        const exerciseName = exercise.exerciseName || 'Unknown Exercise'

        // Initialize exercise group if not exists
        if (!exerciseGroups.has(exerciseId)) {
          exerciseGroups.set(exerciseId, {
            id: exerciseId,
            name: exerciseName,
            history: [],
          })
        }

        const group = exerciseGroups.get(exerciseId)

        // Find best set in this workout
        const bestSet = findBestSet(exercise.sets)
        if (!bestSet) return

        // Add to history
        group.history.push({
          date: normalizeDate(workout.completedAt),
          workoutId: workout.id,
          sets: exercise.sets,
          bestSet,
        })
      })
    })

    // Calculate metrics for each exercise
    const progressTable = []

    exerciseGroups.forEach((group) => {
      if (group.history.length === 0) return

      // Get most recent entry
      const lastEntry = group.history[group.history.length - 1]
      const estimated1RM = calculate1RM(lastEntry.bestSet.weight, lastEntry.bestSet.reps) || 0

      // Find best PR
      const bestPREntry = findBestPR(group.history)
      const bestPR = bestPREntry
        ? {
            weight: bestPREntry.bestSet.weight,
            reps: bestPREntry.bestSet.reps,
            date: bestPREntry.date,
            estimated1RM: calculate1RM(bestPREntry.bestSet.weight, bestPREntry.bestSet.reps),
          }
        : null

      // Calculate trend (need at least 4 workouts for reliable trend)
      const trend = calculateTrend(group.history)
      const status = getProgressStatus(trend)

      progressTable.push({
        id: group.id,
        name: group.name,
        estimated1RM: Math.round(estimated1RM),
        bestPR,
        lastPerformed: lastEntry.date,
        lastWorkoutId: lastEntry.workoutId,
        trend: trend.direction,
        trendPercentage: Math.round(trend.percentage * 10) / 10, // 1 decimal place
        confidence: Math.round(trend.confidence * 100), // 0-100%
        status,
        history: group.history.slice(-10), // Last 10 workouts for mini chart
      })
    })

    // Sort by most recently performed (descending)
    return progressTable.sort((a, b) => b.lastPerformed - a.lastPerformed)
  })

  /**
   * All PRs (Personal Records) across all exercises
   * Returns chronologically sorted list of PRs for PR Timeline (Feature 4.2)
   * @returns {Array<{id: string, exerciseName: string, type: string, weight: number, reps: number, date: Date, estimated1RM: number}>}
   */
  const allPRs = computed(() => {
    if (completedWorkouts.value.length === 0) return []

    const prs = []
    const exerciseMaxes = new Map() // Track current max for each exercise

    // Sort workouts chronologically (oldest first) to detect PRs properly
    const sortedWorkouts = [...completedWorkouts.value]
      .filter((w) => w.completedAt)
      .sort((a, b) => {
        const dateA = normalizeDate(a.completedAt)
        const dateB = normalizeDate(b.completedAt)
        return dateA - dateB
      })

    sortedWorkouts.forEach((workout) => {
      if (!workout.exercises || !Array.isArray(workout.exercises)) return

      workout.exercises.forEach((exercise) => {
        if (!exercise.exerciseId || !exercise.sets) return

        const exerciseId = exercise.exerciseId
        const exerciseName = exercise.exerciseName || 'Unknown Exercise'

        // Find best set in this workout
        const bestSet = findBestSet(exercise.sets)
        if (!bestSet || !bestSet.weight || !bestSet.reps) return

        const current1RM = calculate1RM(bestSet.weight, bestSet.reps)
        if (!current1RM) return

        const currentMax = exerciseMaxes.get(exerciseId) || 0

        // Check if this is a new PR
        if (current1RM > currentMax) {
          exerciseMaxes.set(exerciseId, current1RM)

          prs.push({
            id: `${exerciseId}-${workout.id}`,
            exerciseId,
            exerciseName,
            type: 'weight', // Can extend to 'reps' or 'volume' PRs later
            weight: bestSet.weight,
            reps: bestSet.reps,
            date: normalizeDate(workout.completedAt),
            estimated1RM: Math.round(current1RM),
            improvement: currentMax > 0 ? Math.round(current1RM - currentMax) : 0,
          })
        }
      })
    })

    // Return in reverse chronological order (most recent first)
    return prs.reverse()
  })

  return {
    // State - return ref directly
    period,
    loading,

    // Basic metrics
    totalWorkouts,
    volumeLoad,
    avgVolumePerWorkout,
    totalSets,
    restDays,
    prRecords,
    currentStreak,
    bestWorkout,

    // Chart data
    volumeByDay,
    dailyWorkoutCounts,
    dailyVolumeMap,
    muscleDistribution,
    muscleDistributionByVolume,
    muscleVolumeByDay,
    weeklyVolumeProgression,
    progressiveOverloadStats,
    durationTrendData,
    durationStats,
    frequencyHeatmap,
    periodComparison, // Period-aware comparison (replaces deprecated weekComparison)
    muscleProgress,
    avgRpe,
    quickStats,

    // Period-aware data (new architecture)
    periodConfig,
    currentRange,
    comparisonRange,
    hasTrend,
    periodWorkouts,
    comparisonWorkouts,
    periodVolume,
    comparisonVolume,
    periodLabel,

    // Trend data (legacy - now uses period-aware data)
    workoutsThisMonth,
    workoutsLastMonth,
    workoutsTrend,
    volumeThisMonth,
    volumeLastMonth,
    volumeTrend,

    // Insights
    restDaysInsight,
    streakInsight,
    workoutsInsight,
    volumeInsight,
    prInsight,

    // PR tracking
    exercisePRs,
    prCount,
    prCountThisMonth,

    // Quick Stats Strip
    longestStreak,
    mostActiveDay,
    averageWorkoutsPerWeek,

    // Exercise Progress (Tab 4)
    exerciseProgressTable,
    allPRs,

    // Actions
    setPeriod,
    initializePeriod,
  }
})
