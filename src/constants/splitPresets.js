/**
 * Pre-built Workout Split Presets
 *
 * Provides ready-to-use workout templates organized by difficulty level:
 * - Beginner: Full Body 3x/week, Upper/Lower 4x/week
 * - Intermediate: Push Pull Legs 6x/week
 * - Advanced: Arnold Split 6x/week
 *
 * Each preset contains:
 * - id: Unique identifier
 * - name: Bilingual name (uk, en)
 * - description: Bilingual description (uk, en)
 * - frequency: Training days per week
 * - difficulty: 'beginner' | 'intermediate' | 'advanced'
 * - templates: Array of workout day templates with exercises
 * - schedulePattern: Array of 7 elements (Mon-Sun) indicating which template index to use (null = rest day)
 *
 * Exercise IDs reference the slugs from src/data/defaultExercises.js
 */

export const SPLIT_PRESETS = {
  beginner: [
    {
      id: 'full-body-3x',
      name: {
        en: 'Full Body 3x/week',
        uk: 'Все тіло 3р/тиждень',
      },
      description: {
        en: 'Perfect for beginners. Train all major muscle groups 3 times per week.',
        uk: 'Ідеально для початківців. Тренуйте всі основні м\'язи 3 рази на тиждень.',
      },
      frequency: 3,
      difficulty: 'beginner',
      schedulePattern: [0, null, 1, null, 2, null, null], // Mon, Wed, Fri
      templates: [
        {
          name: { en: 'Full Body A', uk: 'Все тіло A' },
          exercises: [
            { exerciseId: 'barbell-squat', sets: 3, reps: 10, restTime: 120 },
            { exerciseId: 'barbell-bench-press', sets: 3, reps: 10, restTime: 120 },
            { exerciseId: 'barbell-row', sets: 3, reps: 10, restTime: 90 },
            { exerciseId: 'overhead-press', sets: 3, reps: 8, restTime: 90 },
            { exerciseId: 'lat-pulldown', sets: 3, reps: 12, restTime: 90 },
            { exerciseId: 'plank', sets: 3, reps: 60, restTime: 60 },
          ],
        },
        {
          name: { en: 'Full Body B', uk: 'Все тіло B' },
          exercises: [
            { exerciseId: 'deadlift', sets: 3, reps: 8, restTime: 150 },
            { exerciseId: 'incline-dumbbell-press', sets: 3, reps: 10, restTime: 90 },
            { exerciseId: 'pull-ups', sets: 3, reps: 8, restTime: 120 },
            { exerciseId: 'seated-dumbbell-press', sets: 3, reps: 10, restTime: 90 },
            { exerciseId: 'leg-press', sets: 3, reps: 12, restTime: 90 },
            { exerciseId: 'bicycle-crunch', sets: 3, reps: 20, restTime: 60 },
          ],
        },
        {
          name: { en: 'Full Body C', uk: 'Все тіло C' },
          exercises: [
            { exerciseId: 'front-squat', sets: 3, reps: 10, restTime: 120 },
            { exerciseId: 'dumbbell-bench-press', sets: 3, reps: 10, restTime: 90 },
            { exerciseId: 'seated-cable-row', sets: 3, reps: 12, restTime: 90 },
            { exerciseId: 'arnold-press', sets: 3, reps: 10, restTime: 90 },
            { exerciseId: 'romanian-deadlift', sets: 3, reps: 10, restTime: 90 },
            { exerciseId: 'russian-twist', sets: 3, reps: 20, restTime: 60 },
          ],
        },
      ],
    },
    {
      id: 'upper-lower-4x',
      name: {
        en: 'Upper/Lower 4x/week',
        uk: 'Верх/Низ 4р/тиждень',
      },
      description: {
        en: 'Train upper body 2x and lower body 2x per week for balanced development.',
        uk: 'Тренуйте верхню частину 2 рази та нижню частину 2 рази на тиждень для збалансованого розвитку.',
      },
      frequency: 4,
      difficulty: 'beginner',
      schedulePattern: [0, 1, null, 2, 3, null, null], // Mon, Tue, Thu, Fri
      templates: [
        {
          name: { en: 'Upper Body A', uk: 'Верх тіла A' },
          exercises: [
            { exerciseId: 'barbell-bench-press', sets: 4, reps: 8, restTime: 120 },
            { exerciseId: 'barbell-row', sets: 4, reps: 8, restTime: 120 },
            { exerciseId: 'overhead-press', sets: 3, reps: 10, restTime: 90 },
            { exerciseId: 'lat-pulldown', sets: 3, reps: 12, restTime: 90 },
            { exerciseId: 'dumbbell-curl', sets: 3, reps: 12, restTime: 60 },
            { exerciseId: 'tricep-pushdown', sets: 3, reps: 12, restTime: 60 },
          ],
        },
        {
          name: { en: 'Lower Body A', uk: 'Низ тіла A' },
          exercises: [
            { exerciseId: 'barbell-squat', sets: 4, reps: 8, restTime: 150 },
            { exerciseId: 'romanian-deadlift', sets: 3, reps: 10, restTime: 120 },
            { exerciseId: 'leg-press', sets: 3, reps: 12, restTime: 90 },
            { exerciseId: 'leg-curl', sets: 3, reps: 12, restTime: 90 },
            { exerciseId: 'standing-calf-raise', sets: 4, reps: 15, restTime: 60 },
            { exerciseId: 'plank', sets: 3, reps: 60, restTime: 60 },
          ],
        },
        {
          name: { en: 'Upper Body B', uk: 'Верх тіла B' },
          exercises: [
            { exerciseId: 'incline-dumbbell-press', sets: 4, reps: 10, restTime: 90 },
            { exerciseId: 'pull-ups', sets: 4, reps: 8, restTime: 120 },
            { exerciseId: 'seated-dumbbell-press', sets: 3, reps: 10, restTime: 90 },
            { exerciseId: 'seated-cable-row', sets: 3, reps: 12, restTime: 90 },
            { exerciseId: 'hammer-curl', sets: 3, reps: 12, restTime: 60 },
            { exerciseId: 'overhead-dumbbell-extension', sets: 3, reps: 12, restTime: 60 },
          ],
        },
        {
          name: { en: 'Lower Body B', uk: 'Низ тіла B' },
          exercises: [
            { exerciseId: 'deadlift', sets: 3, reps: 5, restTime: 180 },
            { exerciseId: 'front-squat', sets: 3, reps: 10, restTime: 120 },
            { exerciseId: 'walking-lunges', sets: 3, reps: 12, restTime: 90 },
            { exerciseId: 'leg-extension', sets: 3, reps: 15, restTime: 90 },
            { exerciseId: 'seated-calf-raise', sets: 4, reps: 15, restTime: 60 },
            { exerciseId: 'bicycle-crunch', sets: 3, reps: 20, restTime: 60 },
          ],
        },
      ],
    },
  ],

  intermediate: [
    {
      id: 'ppl-6x',
      name: {
        en: 'Push Pull Legs',
        uk: 'Жим Тяга Ноги',
      },
      description: {
        en: 'Classic bodybuilding split. Train each muscle group twice per week with optimal volume.',
        uk: 'Класичний спліт бодібілдингу. Тренуйте кожну м\'язову групу двічі на тиждень з оптимальним об\'ємом.',
      },
      frequency: 6,
      difficulty: 'intermediate',
      schedulePattern: [0, 1, 2, 0, 1, 2, null], // PPL twice per week
      templates: [
        {
          name: { en: 'Push Day', uk: 'День жиму' },
          exercises: [
            { exerciseId: 'barbell-bench-press', sets: 4, reps: 8, restTime: 180 },
            { exerciseId: 'incline-dumbbell-press', sets: 3, reps: 10, restTime: 120 },
            { exerciseId: 'overhead-press', sets: 3, reps: 8, restTime: 120 },
            { exerciseId: 'lateral-raise', sets: 3, reps: 15, restTime: 60 },
            { exerciseId: 'tricep-pushdown', sets: 3, reps: 12, restTime: 60 },
            { exerciseId: 'overhead-dumbbell-extension', sets: 3, reps: 12, restTime: 60 },
          ],
        },
        {
          name: { en: 'Pull Day', uk: 'День тяги' },
          exercises: [
            { exerciseId: 'deadlift', sets: 3, reps: 5, restTime: 180 },
            { exerciseId: 'pull-ups', sets: 3, reps: 10, restTime: 120 },
            { exerciseId: 'barbell-row', sets: 4, reps: 8, restTime: 120 },
            { exerciseId: 'face-pull', sets: 3, reps: 15, restTime: 60 },
            { exerciseId: 'barbell-curl', sets: 3, reps: 10, restTime: 60 },
            { exerciseId: 'hammer-curl', sets: 3, reps: 12, restTime: 60 },
          ],
        },
        {
          name: { en: 'Leg Day', uk: 'День ніг' },
          exercises: [
            { exerciseId: 'barbell-squat', sets: 4, reps: 8, restTime: 180 },
            { exerciseId: 'romanian-deadlift', sets: 3, reps: 10, restTime: 120 },
            { exerciseId: 'leg-press', sets: 3, reps: 12, restTime: 120 },
            { exerciseId: 'leg-curl', sets: 3, reps: 12, restTime: 90 },
            { exerciseId: 'leg-extension', sets: 3, reps: 15, restTime: 90 },
            { exerciseId: 'standing-calf-raise', sets: 4, reps: 15, restTime: 60 },
          ],
        },
      ],
    },
  ],

  advanced: [
    {
      id: 'arnold-split',
      name: {
        en: 'Arnold Split',
        uk: 'Спліт Арнольда',
      },
      description: {
        en: 'Arnold Schwarzenegger\'s legendary 6-day split for maximum muscle growth.',
        uk: 'Легендарний 6-денний спліт Арнольда Шварценеггера для максимального росту м\'язів.',
      },
      frequency: 6,
      difficulty: 'advanced',
      schedulePattern: [0, 1, 2, 0, 1, 2, null], // Chest/Back, Shoulders/Arms, Legs - twice
      templates: [
        {
          name: { en: 'Chest & Back', uk: 'Груди та Спина' },
          exercises: [
            { exerciseId: 'barbell-bench-press', sets: 5, reps: 6, restTime: 180 },
            { exerciseId: 'barbell-row', sets: 5, reps: 6, restTime: 180 },
            { exerciseId: 'incline-dumbbell-press', sets: 4, reps: 10, restTime: 120 },
            { exerciseId: 'pull-ups', sets: 4, reps: 10, restTime: 120 },
            { exerciseId: 'dumbbell-fly', sets: 3, reps: 12, restTime: 90 },
            { exerciseId: 'seated-cable-row', sets: 3, reps: 12, restTime: 90 },
          ],
        },
        {
          name: { en: 'Shoulders & Arms', uk: 'Плечі та Руки' },
          exercises: [
            { exerciseId: 'overhead-press', sets: 4, reps: 8, restTime: 120 },
            { exerciseId: 'barbell-curl', sets: 4, reps: 10, restTime: 90 },
            { exerciseId: 'close-grip-bench-press', sets: 4, reps: 10, restTime: 90 },
            { exerciseId: 'lateral-raise', sets: 4, reps: 12, restTime: 60 },
            { exerciseId: 'preacher-curl', sets: 3, reps: 12, restTime: 60 },
            { exerciseId: 'dips', sets: 3, reps: 12, restTime: 60 },
          ],
        },
        {
          name: { en: 'Legs', uk: 'Ноги' },
          exercises: [
            { exerciseId: 'barbell-squat', sets: 5, reps: 6, restTime: 180 },
            { exerciseId: 'leg-press', sets: 4, reps: 12, restTime: 120 },
            { exerciseId: 'romanian-deadlift', sets: 4, reps: 10, restTime: 120 },
            { exerciseId: 'leg-curl', sets: 4, reps: 12, restTime: 90 },
            { exerciseId: 'leg-extension', sets: 4, reps: 15, restTime: 90 },
            { exerciseId: 'standing-calf-raise', sets: 5, reps: 20, restTime: 60 },
          ],
        },
      ],
    },
  ],
}

/**
 * Get all presets across all difficulty levels
 * @returns {Array} Array of all preset objects
 */
export function getAllPresets() {
  return [
    ...SPLIT_PRESETS.beginner,
    ...SPLIT_PRESETS.intermediate,
    ...SPLIT_PRESETS.advanced,
  ]
}

/**
 * Get presets by difficulty level
 * @param {'beginner' | 'intermediate' | 'advanced'} difficulty
 * @returns {Array} Array of presets for the given difficulty
 */
export function getPresetsByDifficulty(difficulty) {
  return SPLIT_PRESETS[difficulty] || []
}

/**
 * Get a specific preset by ID
 * @param {string} presetId
 * @returns {Object|null} Preset object or null if not found
 */
export function getPresetById(presetId) {
  const allPresets = getAllPresets()
  return allPresets.find((preset) => preset.id === presetId) || null
}

/**
 * Get difficulty level for a preset ID
 * @param {string} presetId
 * @returns {'beginner' | 'intermediate' | 'advanced' | null}
 */
export function getPresetDifficulty(presetId) {
  for (const [difficulty, presets] of Object.entries(SPLIT_PRESETS)) {
    if (presets.some((preset) => preset.id === presetId)) {
      return difficulty
    }
  }
  return null
}

/**
 * Get localized preset name
 * @param {Object} preset - Preset object
 * @param {string} locale - 'uk' or 'en'
 * @returns {string} Localized name
 */
export function getPresetName(preset, locale = 'uk') {
  return preset.name[locale] || preset.name.en || preset.name.uk || ''
}

/**
 * Get localized preset description
 * @param {Object} preset - Preset object
 * @param {string} locale - 'uk' or 'en'
 * @returns {string} Localized description
 */
export function getPresetDescription(preset, locale = 'uk') {
  return (
    preset.description[locale] ||
    preset.description.en ||
    preset.description.uk ||
    ''
  )
}

/**
 * Get localized template name
 * @param {Object} template - Template object
 * @param {string} locale - 'uk' or 'en'
 * @returns {string} Localized template name
 */
export function getTemplateName(template, locale = 'uk') {
  return template.name[locale] || template.name.en || template.name.uk || ''
}
