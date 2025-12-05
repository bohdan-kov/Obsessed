import { ref, computed } from 'vue'
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
} from '@/utils/dateUtils'
import {
  createTrendObject,
  generateRestDaysInsight,
  generateStreakInsight,
  generateWorkoutInsight,
  generateVolumeInsight,
  generatePRInsight,
} from '@/utils/insightUtils'

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

  // Computed analytics from workout store
  /**
   * Completed workouts (single source of truth)
   * All other computed properties use this to avoid repeated filtering
   */
  const completedWorkouts = computed(() => {
    return workoutStore.workouts.filter((w) => w.status === 'completed')
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

    // Find the most recent workout
    const sortedWorkouts = [...completedWorkouts.value].sort((a, b) => {
      const dateA = a.completedAt?.toDate
        ? a.completedAt.toDate()
        : new Date(a.completedAt)
      const dateB = b.completedAt?.toDate
        ? b.completedAt.toDate()
        : new Date(b.completedAt)
      return dateB - dateA // Most recent first
    })

    const lastWorkout = sortedWorkouts[0]
    const lastWorkoutDate = lastWorkout.completedAt?.toDate
      ? lastWorkout.completedAt.toDate()
      : new Date(lastWorkout.completedAt)

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
   * Convert a Date to a local date string (YYYY-MM-DD) without timezone conversion
   * @param {Date} date
   * @returns {string}
   */
  function toLocalDateString(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

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
   * Muscle group distribution for donut chart (period-aware)
   * Resolves muscle groups from exercise library
   * Uses periodWorkouts instead of all completedWorkouts
   * @returns {MuscleDistribution[]}
   */
  const muscleDistribution = computed(() => {
    const muscleData = {}
    let totalSetCount = 0

    periodWorkouts.value.forEach((workout) => {
        workout.exercises.forEach((exercise) => {
          // Resolve full exercise data from exercise library
          const exerciseData = exerciseStore.getExerciseById(exercise.exerciseId)
          const muscle = exerciseData?.muscleGroup || 'unknown'
          const setCount = exercise.sets.length

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
        const date = workout.startedAt?.toDate
          ? workout.startedAt.toDate()
          : new Date(workout.startedAt)

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
   * Compare current week with previous week (legacy - kept for backwards compatibility)
   * Use periodComparison instead for period-aware comparison
   * @deprecated Use periodComparison instead
   * @returns {Object} Comparison metrics
   */
  const weekComparison = computed(() => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 7)

    const prevWeekStart = new Date(weekStart)
    prevWeekStart.setDate(weekStart.getDate() - 7)

    const currentWeek = completedWorkouts.value.filter((w) => {
      const date = w.completedAt?.toDate
        ? w.completedAt.toDate()
        : new Date(w.completedAt)
      return date >= weekStart && date <= now
    })

    const previousWeek = completedWorkouts.value.filter((w) => {
      const date = w.completedAt?.toDate
        ? w.completedAt.toDate()
        : new Date(w.completedAt)
      return date >= prevWeekStart && date < weekStart
    })

    const currentVolume = currentWeek.reduce(
      (total, w) => total + calculateWorkoutVolume(w),
      0
    )
    const previousVolume = previousWeek.reduce(
      (total, w) => total + calculateWorkoutVolume(w),
      0
    )

    const volumeChange =
      previousVolume > 0
        ? ((currentVolume - previousVolume) / previousVolume) * 100
        : 0

    return {
      currentWeek: {
        workouts: currentWeek.length,
        volume: currentVolume,
        avgVolume:
          currentWeek.length > 0
            ? Math.round(currentVolume / currentWeek.length)
            : 0,
      },
      previousWeek: {
        workouts: previousWeek.length,
        volume: previousVolume,
        avgVolume:
          previousWeek.length > 0
            ? Math.round(previousVolume / previousWeek.length)
            : 0,
      },
      change: {
        workouts: currentWeek.length - previousWeek.length,
        volume: Math.round(currentVolume - previousVolume),
        volumePercentage: Math.round(volumeChange),
      },
    }
  })

  /**
   * Workout streak (consecutive days with workouts)
   */
  const currentStreak = computed(() => {
    const sortedCompletedWorkouts = [...completedWorkouts.value].sort((a, b) => {
        const dateA = a.completedAt?.toDate
          ? a.completedAt.toDate()
          : new Date(a.completedAt)
        const dateB = b.completedAt?.toDate
          ? b.completedAt.toDate()
          : new Date(b.completedAt)
        return dateB - dateA
      })

    if (sortedCompletedWorkouts.length === 0) return 0

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < sortedCompletedWorkouts.length; i++) {
      const workoutDate = sortedCompletedWorkouts[i].completedAt?.toDate
        ? sortedCompletedWorkouts[i].completedAt.toDate()
        : new Date(sortedCompletedWorkouts[i].completedAt)
      workoutDate.setHours(0, 0, 0, 0)

      const expectedDate = new Date(today)
      expectedDate.setDate(today.getDate() - streak)

      if (workoutDate.getTime() === expectedDate.getTime()) {
        streak++
      } else if (workoutDate < expectedDate) {
        break
      }
    }

    return streak
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
   * @returns {Array<{muscle: string, percent: number, color: string}>}
   */
  const muscleProgress = computed(() => {
    const muscleData = {}
    let totalVolume = 0

    // Calculate volume per muscle group in selected period
    periodWorkouts.value.forEach((workout) => {
      workout.exercises.forEach((exercise) => {
        // Resolve full exercise data from exercise library
        const exerciseData = exerciseStore.getExerciseById(exercise.exerciseId)
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
   * Average RPE (Rate of Perceived Exertion) for last 7 days
   * Calculates average from all sets with valid RPE values (1-10)
   * @returns {number} Average RPE (0 if no data, formatted to 1 decimal place)
   */
  const avgRpe = computed(() => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 7)

    // Filter workouts from last 7 days
    const recentWorkouts = completedWorkouts.value.filter((w) => {
      const date = w.completedAt?.toDate
        ? w.completedAt.toDate()
        : new Date(w.completedAt)
      return date >= weekStart && date <= now
    })

    // Extract all valid RPE values from sets
    const rpeSets = []
    recentWorkouts.forEach((workout) => {
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
   */
  const currentRange = computed(() => {
    const config = periodConfig.value

    switch (config.type) {
      case 'rolling':
        return getRollingRange(config.days)
      case 'calendarMonth':
        return getThisMonthRange()
      case 'previousCalendarMonth':
        return getLastMonthRange()
      case 'calendarYear':
        return getThisYearRange()
      case 'allTime':
        return getAllTimeRange()
      default:
        return getThisMonthRange()
    }
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
    return completedWorkouts.value.filter((w) => {
      const date = normalizeDate(w.completedAt)
      return isWithinRange(date, range.start, range.end)
    })
  })

  /**
   * Comparison workouts (replaces workoutsLastMonth)
   */
  const comparisonWorkouts = computed(() => {
    const range = comparisonRange.value
    if (!range) return []

    return completedWorkouts.value.filter((w) => {
      const date = normalizeDate(w.completedAt)
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
      const date = w.completedAt?.toDate
        ? w.completedAt.toDate()
        : new Date(w.completedAt)
      return isWithinRange(date, start, end)
    }).length
  })

  /**
   * Workouts last month (previous calendar month)
   */
  const workoutsLastMonth = computed(() => {
    const { start, end } = getLastMonthRange()
    return completedWorkouts.value.filter((w) => {
      const date = w.completedAt?.toDate
        ? w.completedAt.toDate()
        : new Date(w.completedAt)
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
   * Personal Records (PRs) tracking
   * Tracks weight PRs and rep PRs for each exercise
   */
  const exercisePRs = computed(() => {
    const prs = new Map()
    const { WEIGHT_TIER_SIZE_KG } = CONFIG.analytics.insights.pr

    // Sort workouts chronologically (oldest first) to track PRs properly
    const sortedWorkouts = [...completedWorkouts.value].sort((a, b) => {
      const dateA = a.completedAt?.toDate
        ? a.completedAt.toDate()
        : new Date(a.completedAt)
      const dateB = b.completedAt?.toDate
        ? b.completedAt.toDate()
        : new Date(b.completedAt)
      return dateA - dateB
    })

    sortedWorkouts.forEach((workout) => {
      workout.exercises?.forEach((exercise) => {
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

        exercise.sets?.forEach((set) => {
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
      console.warn(`Invalid period: ${newPeriod}, using default`)
      newPeriod = CONFIG.analytics.periods.DEFAULT_PERIOD
    }

    period.value = newPeriod

    // Persist to localStorage
    try {
      localStorage.setItem(CONFIG.storage.ANALYTICS_PERIOD, newPeriod)
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn('Failed to persist period to localStorage:', e)
      }
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
      if (import.meta.env.DEV) {
        console.warn('Failed to read period from localStorage:', e)
      }
    }

    periodInitialized.value = true
  }

  return {
    // State - return ref directly
    period,

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
    muscleDistribution,
    frequencyHeatmap,
    weekComparison, // Legacy - kept for backwards compatibility
    periodComparison, // Period-aware comparison
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

    // Actions
    setPeriod,
    initializePeriod,
  }
})
