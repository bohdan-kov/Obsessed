import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useWorkoutStore } from './workoutStore'
import { useExerciseStore } from './exerciseStore'

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

  // State
  const period = ref('2weeks') // 'week', '2weeks', 'month', 'quarter'

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
   * Volume by day for bar chart
   * @returns {VolumeDataPoint[]}
   */
  const volumeByDay = computed(() => {
    const dailyData = {}
    const periodDays = getPeriodDays(period.value)
    const now = new Date()

    // Initialize all days with 0
    for (let i = 0; i < periodDays; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      dailyData[dateStr] = { volume: 0, workouts: 0, exercises: 0 }
    }

    // Fill in actual data
    completedWorkouts.value.forEach((workout) => {
      const date = workout.completedAt?.toDate
        ? workout.completedAt.toDate()
        : new Date(workout.completedAt)
      const dateStr = date.toISOString().split('T')[0]

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
   * Muscle group distribution for donut chart
   * Resolves muscle groups from exercise library
   * @returns {MuscleDistribution[]}
   */
  const muscleDistribution = computed(() => {
    const muscleData = {}
    let totalSetCount = 0

    completedWorkouts.value.forEach((workout) => {
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
   * Frequency heatmap data
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

    completedWorkouts.value.forEach((workout) => {
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
   * Compare current week with previous week
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
   * Muscle progress by week
   * Resolves muscle groups from exercise library
   * @returns {Array<{muscle: string, percent: number, color: string}>}
   */
  const muscleProgress = computed(() => {
    const muscleData = {}
    let totalVolume = 0

    // Calculate volume per muscle group in current week
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 7)

    completedWorkouts.value
      .filter((w) => {
        const date = w.completedAt?.toDate
          ? w.completedAt.toDate()
          : new Date(w.completedAt)
        return date >= weekStart && date <= now
      })
      .forEach((workout) => {
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
   * Quick stats
   * @returns {Object} Quick stats for muscle progress card
   */
  const quickStats = computed(() => {
    // Calculate average BPM from recent workouts (placeholder)
    // In real implementation, this would come from workout data
    const avgBpm = 0 // TODO: Implement BPM tracking

    // Get latest weight from user profile or workouts
    // In real implementation, this would come from userStore
    const weight = 0 // TODO: Implement weight tracking

    return {
      avgBpm,
      weight,
    }
  })

  // Helper functions
  /**
   * Get number of days for a period
   * @param {'week'|'2weeks'|'month'|'quarter'} periodType
   * @returns {number}
   */
  function getPeriodDays(periodType) {
    switch (periodType) {
      case 'week':
        return 7
      case '2weeks':
        return 14
      case 'month':
        return 30
      case 'quarter':
        return 90
      default:
        return 14
    }
  }

  /**
   * Set analytics period
   * @param {'week'|'2weeks'|'month'|'quarter'} newPeriod
   */
  function setPeriod(newPeriod) {
    period.value = newPeriod
    // Trigger workout refetch with new period
    workoutStore.fetchWorkouts(
      newPeriod === '2weeks' ? 'month' : newPeriod
    )
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
    weekComparison,
    muscleProgress,
    quickStats,

    // Actions
    setPeriod,
  }
})
