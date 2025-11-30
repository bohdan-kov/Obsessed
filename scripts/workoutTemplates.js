/**
 * Workout Templates for Test Data Generation
 *
 * Provides realistic workout templates with varied exercises, sets, and progression patterns
 * Used by seedWorkouts.js to generate test data for Firebase Firestore
 *
 * Template Structure:
 * - name: Workout name
 * - exercises: Array of exercise configurations
 *   - exerciseSlug: Exercise identifier (matches defaultExercises.slug)
 *   - sets: Number of sets
 *   - repRange: [min, max] reps per set
 *   - weightProgression: Weight increment pattern (kg)
 * - duration: Average duration in minutes
 * - notes: Optional workout notes
 */

/**
 * Workout template definitions
 * Each template represents a different workout type with specific exercises
 */
export const workoutTemplates = [
  // ==================== PUSH DAY ====================
  {
    name: 'Push Day',
    exercises: [
      {
        exerciseSlug: 'barbell-bench-press',
        sets: 4,
        repRange: [6, 10],
        baseWeight: 60, // Starting weight in kg
        weightProgression: 2.5, // Weight increment per workout
      },
      {
        exerciseSlug: 'incline-dumbbell-press',
        sets: 3,
        repRange: [8, 12],
        baseWeight: 20,
        weightProgression: 2,
      },
      {
        exerciseSlug: 'overhead-press',
        sets: 4,
        repRange: [6, 10],
        baseWeight: 40,
        weightProgression: 2.5,
      },
      {
        exerciseSlug: 'lateral-raise',
        sets: 3,
        repRange: [12, 15],
        baseWeight: 8,
        weightProgression: 1,
      },
      {
        exerciseSlug: 'tricep-pushdown',
        sets: 3,
        repRange: [10, 15],
        baseWeight: 25,
        weightProgression: 2.5,
      },
    ],
    duration: 75, // minutes
    notes: 'Focus on progressive overload and controlled tempo',
  },

  // ==================== PULL DAY ====================
  {
    name: 'Pull Day',
    exercises: [
      {
        exerciseSlug: 'deadlift',
        sets: 4,
        repRange: [5, 8],
        baseWeight: 80,
        weightProgression: 5,
      },
      {
        exerciseSlug: 'pull-ups',
        sets: 4,
        repRange: [6, 10],
        baseWeight: 0, // Bodyweight
        weightProgression: 0,
      },
      {
        exerciseSlug: 'barbell-row',
        sets: 4,
        repRange: [8, 12],
        baseWeight: 50,
        weightProgression: 2.5,
      },
      {
        exerciseSlug: 'lat-pulldown',
        sets: 3,
        repRange: [10, 12],
        baseWeight: 40,
        weightProgression: 2.5,
      },
      {
        exerciseSlug: 'face-pull',
        sets: 3,
        repRange: [12, 15],
        baseWeight: 15,
        weightProgression: 2.5,
      },
      {
        exerciseSlug: 'barbell-curl',
        sets: 3,
        repRange: [10, 12],
        baseWeight: 25,
        weightProgression: 2.5,
      },
    ],
    duration: 80,
    notes: 'Engage lats and focus on mind-muscle connection',
  },

  // ==================== LEG DAY ====================
  {
    name: 'Leg Day',
    exercises: [
      {
        exerciseSlug: 'barbell-squat',
        sets: 4,
        repRange: [6, 10],
        baseWeight: 70,
        weightProgression: 5,
      },
      {
        exerciseSlug: 'leg-press',
        sets: 4,
        repRange: [10, 12],
        baseWeight: 120,
        weightProgression: 10,
      },
      {
        exerciseSlug: 'romanian-deadlift',
        sets: 3,
        repRange: [8, 12],
        baseWeight: 60,
        weightProgression: 5,
      },
      {
        exerciseSlug: 'leg-extension',
        sets: 3,
        repRange: [12, 15],
        baseWeight: 40,
        weightProgression: 5,
      },
      {
        exerciseSlug: 'leg-curl',
        sets: 3,
        repRange: [12, 15],
        baseWeight: 35,
        weightProgression: 5,
      },
      {
        exerciseSlug: 'standing-calf-raise',
        sets: 4,
        repRange: [15, 20],
        baseWeight: 50,
        weightProgression: 5,
      },
    ],
    duration: 85,
    notes: 'Progressive overload on squats, focus on depth',
  },

  // ==================== FULL BODY A ====================
  {
    name: 'Full Body A',
    exercises: [
      {
        exerciseSlug: 'barbell-squat',
        sets: 3,
        repRange: [8, 10],
        baseWeight: 65,
        weightProgression: 5,
      },
      {
        exerciseSlug: 'barbell-bench-press',
        sets: 3,
        repRange: [8, 10],
        baseWeight: 55,
        weightProgression: 2.5,
      },
      {
        exerciseSlug: 'barbell-row',
        sets: 3,
        repRange: [8, 10],
        baseWeight: 45,
        weightProgression: 2.5,
      },
      {
        exerciseSlug: 'overhead-press',
        sets: 3,
        repRange: [8, 10],
        baseWeight: 35,
        weightProgression: 2.5,
      },
      {
        exerciseSlug: 'plank',
        sets: 3,
        repRange: [30, 60], // seconds
        baseWeight: 0,
        weightProgression: 0,
      },
    ],
    duration: 60,
    notes: 'Compound movements for overall strength',
  },

  // ==================== FULL BODY B ====================
  {
    name: 'Full Body B',
    exercises: [
      {
        exerciseSlug: 'deadlift',
        sets: 3,
        repRange: [6, 8],
        baseWeight: 75,
        weightProgression: 5,
      },
      {
        exerciseSlug: 'incline-dumbbell-press',
        sets: 3,
        repRange: [8, 12],
        baseWeight: 18,
        weightProgression: 2,
      },
      {
        exerciseSlug: 'pull-ups',
        sets: 3,
        repRange: [6, 10],
        baseWeight: 0,
        weightProgression: 0,
      },
      {
        exerciseSlug: 'leg-press',
        sets: 3,
        repRange: [10, 12],
        baseWeight: 100,
        weightProgression: 10,
      },
      {
        exerciseSlug: 'hanging-leg-raise',
        sets: 3,
        repRange: [10, 15],
        baseWeight: 0,
        weightProgression: 0,
      },
    ],
    duration: 60,
    notes: 'Focus on form and controlled negatives',
  },

  // ==================== UPPER BODY ====================
  {
    name: 'Upper Body',
    exercises: [
      {
        exerciseSlug: 'barbell-bench-press',
        sets: 4,
        repRange: [8, 10],
        baseWeight: 60,
        weightProgression: 2.5,
      },
      {
        exerciseSlug: 'barbell-row',
        sets: 4,
        repRange: [8, 10],
        baseWeight: 50,
        weightProgression: 2.5,
      },
      {
        exerciseSlug: 'seated-dumbbell-press',
        sets: 3,
        repRange: [10, 12],
        baseWeight: 15,
        weightProgression: 2,
      },
      {
        exerciseSlug: 'lat-pulldown',
        sets: 3,
        repRange: [10, 12],
        baseWeight: 40,
        weightProgression: 2.5,
      },
      {
        exerciseSlug: 'dumbbell-curl',
        sets: 3,
        repRange: [10, 12],
        baseWeight: 12,
        weightProgression: 1,
      },
      {
        exerciseSlug: 'tricep-pushdown',
        sets: 3,
        repRange: [10, 12],
        baseWeight: 22,
        weightProgression: 2.5,
      },
    ],
    duration: 70,
    notes: 'Balanced upper body development',
  },

  // ==================== CHEST & BACK ====================
  {
    name: 'Chest & Back',
    exercises: [
      {
        exerciseSlug: 'barbell-bench-press',
        sets: 4,
        repRange: [6, 10],
        baseWeight: 62,
        weightProgression: 2.5,
      },
      {
        exerciseSlug: 'deadlift',
        sets: 3,
        repRange: [5, 8],
        baseWeight: 85,
        weightProgression: 5,
      },
      {
        exerciseSlug: 'incline-dumbbell-press',
        sets: 3,
        repRange: [8, 12],
        baseWeight: 20,
        weightProgression: 2,
      },
      {
        exerciseSlug: 'pull-ups',
        sets: 3,
        repRange: [6, 10],
        baseWeight: 0,
        weightProgression: 0,
      },
      {
        exerciseSlug: 'cable-crossover',
        sets: 3,
        repRange: [12, 15],
        baseWeight: 10,
        weightProgression: 2.5,
      },
      {
        exerciseSlug: 'seated-cable-row',
        sets: 3,
        repRange: [10, 12],
        baseWeight: 35,
        weightProgression: 2.5,
      },
    ],
    duration: 75,
    notes: 'Antagonistic muscle pairing for efficiency',
  },
]

/**
 * Helper function to get random template
 * @returns {Object} Random workout template
 */
export function getRandomTemplate() {
  return workoutTemplates[Math.floor(Math.random() * workoutTemplates.length)]
}

/**
 * Helper function to calculate progressive weight
 * @param {number} baseWeight - Starting weight
 * @param {number} progression - Weight increment per workout
 * @param {number} workoutNumber - Which workout in the series (0-indexed)
 * @returns {number} Calculated weight
 */
export function calculateProgressiveWeight(baseWeight, progression, workoutNumber) {
  return baseWeight + progression * workoutNumber
}

/**
 * Generate random reps within a range
 * @param {Array} repRange - [min, max] reps
 * @returns {number} Random reps
 */
export function getRandomReps(repRange) {
  const [min, max] = repRange
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Generate random RPE (Rate of Perceived Exertion)
 * @returns {number} RPE value between 6-9
 */
export function getRandomRPE() {
  return Math.floor(Math.random() * 4) + 6 // Random between 6-9
}
