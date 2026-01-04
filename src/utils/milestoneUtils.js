const MILESTONE_THRESHOLDS = [25, 50, 75, 90, 100]

/**
 * Detect newly reached milestones
 * @param {number} currentProgress - Current progress percentage
 * @param {Array<number>} reachedMilestones - Already reached milestones
 * @returns {Array<number>} Newly reached milestones
 */
export function detectMilestones(currentProgress, reachedMilestones = []) {
  const newMilestones = []

  for (const threshold of MILESTONE_THRESHOLDS) {
    if (currentProgress >= threshold && !reachedMilestones.includes(threshold)) {
      newMilestones.push(threshold)
    }
  }

  return newMilestones
}

/**
 * Get celebration message for milestone
 * @param {number} milestone - Milestone percentage
 * @param {Object} goal - Goal object
 * @returns {string} Celebration message
 */
export function getMilestoneCelebrationMessage(milestone, goal) {
  const goalName = goal.exerciseName || goal.name || 'your goal'

  const messages = {
    25: `You're 25% of the way to ${goalName}! Keep it up!`,
    50: `Halfway there! ${goalName} is within reach!`,
    75: `75% complete! You're crushing it!`,
    90: `Almost there! Just 10% more to ${goalName}!`,
    100: `GOAL ACHIEVED! ${goalName} is complete! Congratulations!`,
  }

  return messages[milestone] || `Milestone ${milestone}% reached!`
}

/**
 * Get next milestone for goal
 * @param {number} currentProgress - Current progress percentage
 * @param {Array<number>} reachedMilestones - Already reached milestones
 * @returns {number|null} Next milestone threshold
 */
export function getNextMilestone(currentProgress, reachedMilestones = []) {
  for (const threshold of MILESTONE_THRESHOLDS) {
    if (currentProgress < threshold && !reachedMilestones.includes(threshold)) {
      return threshold
    }
  }

  return null
}
