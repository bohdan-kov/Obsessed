// App constants

export const APP_NAME = 'Obsessed'
export const APP_VERSION = '1.0.0'

// Weight units
export const WEIGHT_UNITS = {
  KG: 'kg',
  LB: 'lb'
}

// Muscle groups
export const MUSCLE_GROUPS = [
  { id: 'chest', name: 'Chest', color: '#ef4444' },
  { id: 'back', name: 'Back', color: '#f97316' },
  { id: 'legs', name: 'Legs', color: '#eab308' },
  { id: 'shoulders', name: 'Shoulders', color: '#22c55e' },
  { id: 'biceps', name: 'Biceps', color: '#3b82f6' },
  { id: 'triceps', name: 'Triceps', color: '#8b5cf6' },
  { id: 'core', name: 'Core', color: '#ec4899' },
  { id: 'calves', name: 'Calves', color: '#06b6d4' }
]

// Exercise categories
export const EXERCISE_CATEGORIES = {
  STRENGTH: 'strength',
  CARDIO: 'cardio',
  FLEXIBILITY: 'flexibility'
}

// Set types
export const SET_TYPES = {
  NORMAL: 'normal',
  WARMUP: 'warmup',
  DROPSET: 'dropset',
  SUPERSET: 'superset',
  REST_PAUSE: 'rest-pause',
  AMRAP: 'amrap'
}

// Equipment types for exercises
export const EQUIPMENT_TYPES = [
  'barbell',
  'dumbbell',
  'cable',
  'machine',
  'bodyweight',
  'bands',
  'kettlebell',
  'other'
]

// Exercise types
export const EXERCISE_TYPES = [
  'compound',
  'isolation'
]

// Sort options for exercise library
export const EXERCISE_SORT_OPTIONS = [
  { value: 'alphabetical', labelKey: 'exercises.sort.alphabetical' },
  { value: 'muscleGroup', labelKey: 'exercises.sort.muscleGroup' },
  { value: 'recent', labelKey: 'exercises.sort.recent' },
  { value: 'frequent', labelKey: 'exercises.sort.frequent' }
]
