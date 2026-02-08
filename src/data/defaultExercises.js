/**
 * Default Exercise Library Seed Data
 *
 * Comprehensive collection of popular gym exercises with bilingual support (Ukrainian & English)
 * All exercises follow the data model defined in technical specifications
 *
 * Data Model:
 * - name: { uk: "Ukrainian name", en: "English name" }
 * - slug: "url-friendly-id" (unique identifier)
 * - muscleGroup: Primary muscle group targeted
 * - secondaryMuscles: Array of secondary muscle groups (max 3, optional)
 * - equipment: Equipment type required
 * - type: "compound" or "isolation"
 * - isDefault: true (all seed exercises are default)
 * - createdBy: null (null for default exercises)
 * - description: { uk: "...", en: "..." } (optional)
 * - deleted: false
 */

export const defaultExercises = [
  // ==================== CHEST EXERCISES ====================
  {
    name: { uk: 'Жим штанги лежачи', en: 'Barbell Bench Press' },
    slug: 'barbell-bench-press',
    muscleGroup: 'chest',
    secondaryMuscles: ['triceps', 'shoulders'],
    equipment: 'barbell',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    description: {
      uk: 'Базова вправа для розвитку грудних м\'язів, трицепсів та передніх дельт',
      en: 'Foundational exercise for chest, triceps, and front deltoid development'
    },
    deleted: false
  },
  {
    name: { uk: 'Жим штанги на похилій лаві', en: 'Incline Barbell Press' },
    slug: 'incline-barbell-press',
    muscleGroup: 'chest',
    secondaryMuscles: ['shoulders', 'triceps'],
    equipment: 'barbell',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    description: {
      uk: 'Акцент на верхню частину грудних м\'язів',
      en: 'Targets upper chest muscles'
    },
    deleted: false
  },
  {
    name: { uk: 'Жим гантелей лежачи', en: 'Dumbbell Bench Press' },
    slug: 'dumbbell-bench-press',
    muscleGroup: 'chest',
    secondaryMuscles: ['triceps', 'shoulders'],
    equipment: 'dumbbell',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Жим гантелей на похилій лаві', en: 'Incline Dumbbell Press' },
    slug: 'incline-dumbbell-press',
    muscleGroup: 'chest',
    secondaryMuscles: ['shoulders', 'triceps'],
    equipment: 'dumbbell',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Розведення гантелей лежачи', en: 'Dumbbell Fly' },
    slug: 'dumbbell-fly',
    muscleGroup: 'chest',
    secondaryMuscles: ['shoulders'],
    equipment: 'dumbbell',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Віджимання від підлоги', en: 'Push-ups' },
    slug: 'push-ups',
    muscleGroup: 'chest',
    secondaryMuscles: ['triceps', 'shoulders'],
    equipment: 'bodyweight',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Зведення рук в кросовері', en: 'Cable Crossover' },
    slug: 'cable-crossover',
    muscleGroup: 'chest',
    secondaryMuscles: ['shoulders'],
    equipment: 'cable',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Жим на похилій лаві головою вниз', en: 'Decline Bench Press' },
    slug: 'decline-bench-press',
    muscleGroup: 'chest',
    secondaryMuscles: ['triceps'],
    equipment: 'barbell',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    deleted: false
  },

  // ==================== BACK EXERCISES ====================
  {
    name: { uk: 'Станова тяга', en: 'Deadlift' },
    slug: 'deadlift',
    muscleGroup: 'back',
    secondaryMuscles: ['legs', 'core'],
    equipment: 'barbell',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    description: {
      uk: 'Базова багатосуглобова вправа для всього тіла',
      en: 'Fundamental compound movement for full body development'
    },
    deleted: false
  },
  {
    name: { uk: 'Підтягування', en: 'Pull-ups' },
    slug: 'pull-ups',
    muscleGroup: 'back',
    secondaryMuscles: ['biceps', 'shoulders'],
    equipment: 'bodyweight',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Тяга штанги в нахилі', en: 'Barbell Row' },
    slug: 'barbell-row',
    muscleGroup: 'back',
    secondaryMuscles: ['biceps', 'shoulders'],
    equipment: 'barbell',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Тяга верхнього блоку', en: 'Lat Pulldown' },
    slug: 'lat-pulldown',
    muscleGroup: 'back',
    secondaryMuscles: ['biceps', 'shoulders'],
    equipment: 'cable',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Тяга горизонтального блоку', en: 'Seated Cable Row' },
    slug: 'seated-cable-row',
    muscleGroup: 'back',
    secondaryMuscles: ['biceps', 'shoulders'],
    equipment: 'cable',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Тяга гантелі в нахилі', en: 'Dumbbell Row' },
    slug: 'dumbbell-row',
    muscleGroup: 'back',
    secondaryMuscles: ['biceps', 'shoulders'],
    equipment: 'dumbbell',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Тяга на задні дельти', en: 'Face Pull' },
    slug: 'face-pull',
    muscleGroup: 'back',
    secondaryMuscles: ['shoulders'],
    equipment: 'cable',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Тяга Т-грифа', en: 'T-Bar Row' },
    slug: 't-bar-row',
    muscleGroup: 'back',
    secondaryMuscles: ['biceps', 'shoulders'],
    equipment: 'barbell',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Гіперекстензія', en: 'Hyperextension' },
    slug: 'hyperextension',
    muscleGroup: 'back',
    secondaryMuscles: ['glutes'],
    equipment: 'machine',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    description: {
      uk: 'Вправа для зміцнення нижньої частини спини та сідниць',
      en: 'Exercise for strengthening lower back and glutes'
    },
    deleted: false
  },

  // ==================== SHOULDER EXERCISES ====================
  {
    name: { uk: 'Жим штанги стоячи', en: 'Overhead Press' },
    slug: 'overhead-press',
    muscleGroup: 'shoulders',
    secondaryMuscles: ['triceps', 'core'],
    equipment: 'barbell',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Жим гантелей сидячи', en: 'Seated Dumbbell Press' },
    slug: 'seated-dumbbell-press',
    muscleGroup: 'shoulders',
    secondaryMuscles: ['triceps'],
    equipment: 'dumbbell',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Махи гантелями в сторони', en: 'Lateral Raise' },
    slug: 'lateral-raise',
    muscleGroup: 'shoulders',
    secondaryMuscles: [],
    equipment: 'dumbbell',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Махи гантелями вперед', en: 'Front Raise' },
    slug: 'front-raise',
    muscleGroup: 'shoulders',
    secondaryMuscles: [],
    equipment: 'dumbbell',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Махи в нахилі на задні дельти', en: 'Rear Delt Fly' },
    slug: 'rear-delt-fly',
    muscleGroup: 'shoulders',
    secondaryMuscles: ['back'],
    equipment: 'dumbbell',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Жим Арнольда', en: 'Arnold Press' },
    slug: 'arnold-press',
    muscleGroup: 'shoulders',
    secondaryMuscles: ['triceps'],
    equipment: 'dumbbell',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Тяга штанги до підборіддя', en: 'Upright Row' },
    slug: 'upright-row',
    muscleGroup: 'shoulders',
    secondaryMuscles: ['biceps'],
    equipment: 'barbell',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    deleted: false
  },

  // ==================== BICEPS EXERCISES ====================
  {
    name: { uk: 'Згинання рук зі штангою стоячи', en: 'Barbell Curl' },
    slug: 'barbell-curl',
    muscleGroup: 'biceps',
    secondaryMuscles: [],
    equipment: 'barbell',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Згинання рук з гантелями', en: 'Dumbbell Curl' },
    slug: 'dumbbell-curl',
    muscleGroup: 'biceps',
    secondaryMuscles: [],
    equipment: 'dumbbell',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Молот', en: 'Hammer Curl' },
    slug: 'hammer-curl',
    muscleGroup: 'biceps',
    secondaryMuscles: [],
    equipment: 'dumbbell',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Згинання на лаві Скотта', en: 'Preacher Curl' },
    slug: 'preacher-curl',
    muscleGroup: 'biceps',
    secondaryMuscles: [],
    equipment: 'barbell',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Концентроване згинання', en: 'Concentration Curl' },
    slug: 'concentration-curl',
    muscleGroup: 'biceps',
    secondaryMuscles: [],
    equipment: 'dumbbell',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Згинання на блоці', en: 'Cable Curl' },
    slug: 'cable-curl',
    muscleGroup: 'biceps',
    secondaryMuscles: [],
    equipment: 'cable',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },

  // ==================== TRICEPS EXERCISES ====================
  {
    name: { uk: 'Розгинання рук на блоці', en: 'Tricep Pushdown' },
    slug: 'tricep-pushdown',
    muscleGroup: 'triceps',
    secondaryMuscles: [],
    equipment: 'cable',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Французький жим лежачи', en: 'Skull Crushers' },
    slug: 'skull-crushers',
    muscleGroup: 'triceps',
    secondaryMuscles: [],
    equipment: 'barbell',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Розгинання руки з гантеллю', en: 'Overhead Dumbbell Extension' },
    slug: 'overhead-dumbbell-extension',
    muscleGroup: 'triceps',
    secondaryMuscles: [],
    equipment: 'dumbbell',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Віджимання на брусах', en: 'Dips' },
    slug: 'dips',
    muscleGroup: 'triceps',
    secondaryMuscles: ['chest', 'shoulders'],
    equipment: 'bodyweight',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Жим лежачи вузьким хватом', en: 'Close-Grip Bench Press' },
    slug: 'close-grip-bench-press',
    muscleGroup: 'triceps',
    secondaryMuscles: ['chest', 'shoulders'],
    equipment: 'barbell',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Розгинання руки в нахилі', en: 'Tricep Kickback' },
    slug: 'tricep-kickback',
    muscleGroup: 'triceps',
    secondaryMuscles: [],
    equipment: 'dumbbell',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },

  // ==================== LEG EXERCISES (Quads) ====================
  {
    name: { uk: 'Присідання зі штангою', en: 'Barbell Squat' },
    slug: 'barbell-squat',
    muscleGroup: 'legs',
    secondaryMuscles: ['core'],
    equipment: 'barbell',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    description: {
      uk: 'Базова вправа для розвитку ніг та всього тіла',
      en: 'Fundamental exercise for leg and full body development'
    },
    deleted: false
  },
  {
    name: { uk: 'Жим ногами', en: 'Leg Press' },
    slug: 'leg-press',
    muscleGroup: 'legs',
    secondaryMuscles: [],
    equipment: 'machine',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Розгинання ніг', en: 'Leg Extension' },
    slug: 'leg-extension',
    muscleGroup: 'legs',
    secondaryMuscles: [],
    equipment: 'machine',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Фронтальні присідання', en: 'Front Squat' },
    slug: 'front-squat',
    muscleGroup: 'legs',
    secondaryMuscles: ['core'],
    equipment: 'barbell',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Болгарські випади', en: 'Bulgarian Split Squat' },
    slug: 'bulgarian-split-squat',
    muscleGroup: 'legs',
    secondaryMuscles: ['core'],
    equipment: 'dumbbell',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Випади з гантелями', en: 'Walking Lunges' },
    slug: 'walking-lunges',
    muscleGroup: 'legs',
    secondaryMuscles: ['core'],
    equipment: 'dumbbell',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    deleted: false
  },

  // ==================== LEG EXERCISES (Hamstrings) ====================
  {
    name: { uk: 'Румунська тяга', en: 'Romanian Deadlift' },
    slug: 'romanian-deadlift',
    muscleGroup: 'legs',
    secondaryMuscles: ['back', 'core'],
    equipment: 'barbell',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Згинання ніг лежачи', en: 'Leg Curl' },
    slug: 'leg-curl',
    muscleGroup: 'legs',
    secondaryMuscles: [],
    equipment: 'machine',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Доброго ранку', en: 'Good Morning' },
    slug: 'good-morning',
    muscleGroup: 'legs',
    secondaryMuscles: ['back', 'core'],
    equipment: 'barbell',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Нордичські згинання', en: 'Nordic Curl' },
    slug: 'nordic-curl',
    muscleGroup: 'legs',
    secondaryMuscles: [],
    equipment: 'bodyweight',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },

  // ==================== LEG EXERCISES (Glutes) ====================
  {
    name: { uk: 'Ягодичний місток зі штангою', en: 'Barbell Hip Thrust' },
    slug: 'barbell-hip-thrust',
    muscleGroup: 'legs',
    secondaryMuscles: ['core'],
    equipment: 'barbell',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Ягодичний місток', en: 'Glute Bridge' },
    slug: 'glute-bridge',
    muscleGroup: 'legs',
    secondaryMuscles: ['core'],
    equipment: 'bodyweight',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Відведення ноги на блоці', en: 'Cable Kickback' },
    slug: 'cable-kickback',
    muscleGroup: 'legs',
    secondaryMuscles: [],
    equipment: 'cable',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },

  // ==================== CALF EXERCISES ====================
  {
    name: { uk: 'Підйом на носки стоячи', en: 'Standing Calf Raise' },
    slug: 'standing-calf-raise',
    muscleGroup: 'calves',
    secondaryMuscles: [],
    equipment: 'machine',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Підйом на носки сидячи', en: 'Seated Calf Raise' },
    slug: 'seated-calf-raise',
    muscleGroup: 'calves',
    secondaryMuscles: [],
    equipment: 'machine',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Підйом на носки в нахилі', en: 'Donkey Calf Raise' },
    slug: 'donkey-calf-raise',
    muscleGroup: 'calves',
    secondaryMuscles: [],
    equipment: 'machine',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },

  // ==================== CORE EXERCISES ====================
  {
    name: { uk: 'Планка', en: 'Plank' },
    slug: 'plank',
    muscleGroup: 'core',
    secondaryMuscles: ['shoulders'],
    equipment: 'bodyweight',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Скручування на блоці', en: 'Cable Crunch' },
    slug: 'cable-crunch',
    muscleGroup: 'core',
    secondaryMuscles: [],
    equipment: 'cable',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Підйом ніг в висі', en: 'Hanging Leg Raise' },
    slug: 'hanging-leg-raise',
    muscleGroup: 'core',
    secondaryMuscles: [],
    equipment: 'bodyweight',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Російські скручування', en: 'Russian Twist' },
    slug: 'russian-twist',
    muscleGroup: 'core',
    secondaryMuscles: [],
    equipment: 'bodyweight',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Колесо для преса', en: 'Ab Wheel Rollout' },
    slug: 'ab-wheel-rollout',
    muscleGroup: 'core',
    secondaryMuscles: ['shoulders', 'back'],
    equipment: 'other',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Велосипед', en: 'Bicycle Crunch' },
    slug: 'bicycle-crunch',
    muscleGroup: 'core',
    secondaryMuscles: [],
    equipment: 'bodyweight',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Підйом ніг лежачи', en: 'Lying Leg Raise' },
    slug: 'lying-leg-raise',
    muscleGroup: 'core',
    secondaryMuscles: [],
    equipment: 'bodyweight',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Бокова планка', en: 'Side Plank' },
    slug: 'side-plank',
    muscleGroup: 'core',
    secondaryMuscles: [],
    equipment: 'bodyweight',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },

  // ==================== ADDITIONAL POPULAR EXERCISES ====================
  {
    name: { uk: 'Пек-дек', en: 'Pec Deck Fly' },
    slug: 'pec-deck-fly',
    muscleGroup: 'chest',
    secondaryMuscles: [],
    equipment: 'machine',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Тяга гантелі одною рукою', en: 'Single Arm Dumbbell Row' },
    slug: 'single-arm-dumbbell-row',
    muscleGroup: 'back',
    secondaryMuscles: ['biceps', 'core'],
    equipment: 'dumbbell',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Шраги зі штангою', en: 'Barbell Shrug' },
    slug: 'barbell-shrug',
    muscleGroup: 'back',
    secondaryMuscles: [],
    equipment: 'barbell',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Махи гантелями на задні дельти стоячи', en: 'Reverse Fly' },
    slug: 'reverse-fly',
    muscleGroup: 'shoulders',
    secondaryMuscles: ['back'],
    equipment: 'dumbbell',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Жим в Смітті', en: 'Smith Machine Press' },
    slug: 'smith-machine-press',
    muscleGroup: 'chest',
    secondaryMuscles: ['triceps', 'shoulders'],
    equipment: 'machine',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Гак-присідання', en: 'Hack Squat' },
    slug: 'hack-squat',
    muscleGroup: 'legs',
    secondaryMuscles: [],
    equipment: 'machine',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Згинання Зоттмана', en: 'Zottman Curl' },
    slug: 'zottman-curl',
    muscleGroup: 'biceps',
    secondaryMuscles: [],
    equipment: 'dumbbell',
    type: 'isolation',
    isDefault: true,
    createdBy: null,
    deleted: false
  },
  {
    name: { uk: 'Підтягування зворотним хватом', en: 'Chin-ups' },
    slug: 'chin-ups',
    muscleGroup: 'back',
    secondaryMuscles: ['biceps'],
    equipment: 'bodyweight',
    type: 'compound',
    isDefault: true,
    createdBy: null,
    deleted: false
  }
]

/**
 * Exercise Statistics Summary:
 *
 * Total Exercises: 69
 *
 * By Muscle Group:
 * - Chest: 9 exercises
 * - Back: 11 exercises
 * - Shoulders: 8 exercises
 * - Biceps: 7 exercises
 * - Triceps: 6 exercises
 * - Legs: 14 exercises (quads, hamstrings, glutes)
 * - Calves: 3 exercises
 * - Core: 8 exercises
 *
 * By Equipment:
 * - Barbell: 18 exercises
 * - Dumbbell: 19 exercises
 * - Cable: 8 exercises
 * - Machine: 10 exercises
 * - Bodyweight: 13 exercises
 * - Other: 1 exercise
 *
 * By Type:
 * - Compound: 35 exercises
 * - Isolation: 34 exercises
 */
