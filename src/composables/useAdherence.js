import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useScheduleStore } from '@/stores/scheduleStore'
import { getWeekId, getWeekStartDate } from '@/utils/scheduleUtils'
import { CONFIG } from '@/constants/config'

/**
 * Composable for schedule adherence tracking
 * Calculates adherence stats, streaks, and provides historical data
 */
export function useAdherence() {
  const scheduleStore = useScheduleStore()
  const { locale } = useI18n()

  /**
   * Calculate adherence for the last N weeks
   * @returns {Array} Array of adherence data points
   */
  const weeklyAdherence = computed(() => {
    const weeks = CONFIG.schedule.ADHERENCE_WEEKS_TO_TRACK
    const result = []
    const today = new Date()

    for (let i = weeks - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i * 7)
      const weekId = getWeekId(date)
      const weekStart = getWeekStartDate(weekId)

      // Get schedule from cache or use empty schedule
      const schedule = scheduleStore.scheduleCache.get(weekId) || createEmptyWeekSchedule(weekId)

      const days = Object.values(schedule.days || {})
      const planned = days.filter((d) => d.templateId).length
      const completed = days.filter((d) => d.completed).length
      const percentage = planned > 0 ? Math.round((completed / planned) * 100) : 0

      result.push({
        weekId,
        weekStart,
        weekLabel: formatWeekLabel(weekStart, locale.value),
        planned,
        completed,
        missed: planned - completed,
        percentage,
      })
    }

    return result
  })

  /**
   * Overall adherence rate for the period
   */
  const overallAdherence = computed(() => {
    const data = weeklyAdherence.value
    const totalPlanned = data.reduce((sum, w) => sum + w.planned, 0)
    const totalCompleted = data.reduce((sum, w) => sum + w.completed, 0)

    return {
      planned: totalPlanned,
      completed: totalCompleted,
      missed: totalPlanned - totalCompleted,
      percentage: totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0,
    }
  })

  /**
   * Current streak (consecutive weeks with 100% adherence)
   */
  const currentStreak = computed(() => {
    const data = weeklyAdherence.value
    let streak = 0

    // Start from most recent week and count backwards
    for (let i = data.length - 1; i >= 0; i--) {
      const week = data[i]
      // Perfect week = 100% adherence AND at least 1 workout planned
      if (week.percentage === 100 && week.planned > 0) {
        streak++
      } else {
        break
      }
    }

    return streak
  })

  /**
   * Longest streak in the period
   */
  const longestStreak = computed(() => {
    const data = weeklyAdherence.value
    let maxStreak = 0
    let currentStreakCount = 0

    data.forEach((week) => {
      if (week.percentage === 100 && week.planned > 0) {
        currentStreakCount++
        maxStreak = Math.max(maxStreak, currentStreakCount)
      } else {
        currentStreakCount = 0
      }
    })

    return maxStreak
  })

  /**
   * Average workouts per week
   */
  const averageWorkoutsPerWeek = computed(() => {
    const data = weeklyAdherence.value
    const totalCompleted = data.reduce((sum, w) => sum + w.completed, 0)
    return data.length > 0 ? (totalCompleted / data.length).toFixed(1) : 0
  })

  /**
   * Best week (highest adherence percentage)
   */
  const bestWeek = computed(() => {
    const data = weeklyAdherence.value
    if (data.length === 0) return null

    return data.reduce((best, week) => {
      if (week.planned === 0) return best
      if (!best || week.percentage > best.percentage) return week
      return best
    }, null)
  })

  /**
   * Consistency score (0-100)
   * Based on variance in weekly adherence
   * Higher = more consistent
   */
  const consistencyScore = computed(() => {
    const data = weeklyAdherence.value.filter((w) => w.planned > 0)
    if (data.length === 0) return 0

    const percentages = data.map((w) => w.percentage)
    const mean = percentages.reduce((sum, p) => sum + p, 0) / percentages.length

    // Calculate variance
    const variance =
      percentages.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / percentages.length
    const stdDev = Math.sqrt(variance)

    // Convert to 0-100 score (lower variance = higher score)
    // Max possible std dev is 50 (if half at 0%, half at 100%)
    const score = Math.max(0, 100 - stdDev * 2)

    return Math.round(score)
  })

  /**
   * Streak achievements unlocked
   */
  const achievements = computed(() => {
    const streak = currentStreak.value
    const longest = longestStreak.value
    const adherence = overallAdherence.value.percentage

    const unlocked = []

    // Streak achievements
    if (streak >= 2) unlocked.push({ id: 'on-fire', name: 'On Fire', description: '2 week streak', icon: '🔥' })
    if (streak >= 4) unlocked.push({ id: 'unstoppable', name: 'Unstoppable', description: '4 week streak', icon: '💪' })
    if (streak >= 8) unlocked.push({ id: 'legendary', name: 'Legendary', description: '8 week streak', icon: '👑' })
    if (streak >= 12) unlocked.push({ id: 'obsessed', name: 'Obsessed', description: '12 week streak', icon: '🏆' })

    // Adherence achievements
    if (adherence >= 80) unlocked.push({ id: 'consistent', name: 'Consistent', description: '80%+ adherence', icon: '✅' })
    if (adherence >= 90) unlocked.push({ id: 'dedicated', name: 'Dedicated', description: '90%+ adherence', icon: '⭐' })
    if (adherence === 100) unlocked.push({ id: 'perfect', name: 'Perfect', description: '100% adherence', icon: '💎' })

    // Longest streak achievement
    if (longest >= 4) unlocked.push({ id: 'streak-master', name: 'Streak Master', description: `Best: ${longest} weeks`, icon: '🎯' })

    return unlocked
  })

  /**
   * Get adherence trend (improving, stable, declining)
   */
  const trend = computed(() => {
    const data = weeklyAdherence.value
    if (data.length < 4) return 'stable'

    const recent = data.slice(-4) // Last 4 weeks
    const previous = data.slice(-8, -4) // 4 weeks before that

    const recentAvg = recent.reduce((sum, w) => sum + w.percentage, 0) / recent.length
    const previousAvg = previous.reduce((sum, w) => sum + w.percentage, 0) / previous.length

    const diff = recentAvg - previousAvg

    if (diff > 10) return 'improving'
    if (diff < -10) return 'declining'
    return 'stable'
  })

  return {
    // Data
    weeklyAdherence,
    overallAdherence,

    // Streaks
    currentStreak,
    longestStreak,

    // Stats
    averageWorkoutsPerWeek,
    bestWeek,
    consistencyScore,

    // Insights
    achievements,
    trend,
  }
}

/**
 * Helper: Format week label for display
 * @param {Date} weekStart - Start of week (Monday)
 * @param {string} locale - Current locale (e.g., 'uk', 'en')
 * @returns {string} Formatted label
 */
function formatWeekLabel(weekStart, locale) {
  const month = weekStart.toLocaleDateString(locale, { month: 'short' })
  const day = weekStart.getDate()
  return `${month} ${day}`
}

/**
 * Helper: Create empty week schedule
 * @param {string} weekId - Week ID
 * @returns {Object} Empty schedule object
 */
function createEmptyWeekSchedule(weekId) {
  return {
    id: weekId,
    days: {
      monday: { templateId: null, completed: false },
      tuesday: { templateId: null, completed: false },
      wednesday: { templateId: null, completed: false },
      thursday: { templateId: null, completed: false },
      friday: { templateId: null, completed: false },
      saturday: { templateId: null, completed: false },
      sunday: { templateId: null, completed: false },
    },
  }
}
