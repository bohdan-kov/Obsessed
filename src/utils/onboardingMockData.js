export function generateMockExercises() {
  return [
    {
      id: 'bench-press',
      name: { uk: 'Жим лежачи', en: 'Bench Press' },
      muscleGroup: 'chest',
      secondaryMuscles: ['triceps'],
      category: 'compound',
      equipment: 'barbell',
      isCustom: false,
    },
    {
      id: 'incline-dumbbell-press',
      name: { uk: 'Жим гантелей на похилій лаві', en: 'Incline Dumbbell Press' },
      muscleGroup: 'chest',
      secondaryMuscles: ['shoulders'],
      category: 'compound',
      equipment: 'dumbbells',
      isCustom: false,
    },
    {
      id: 'chest-flyes',
      name: { uk: 'Розведення гантелей', en: 'Chest Flyes' },
      muscleGroup: 'chest',
      secondaryMuscles: [],
      category: 'isolation',
      equipment: 'dumbbells',
      isCustom: false,
    },
    {
      id: 'triceps-dips',
      name: { uk: 'Віджимання на брусах', en: 'Triceps Dips' },
      muscleGroup: 'triceps',
      secondaryMuscles: ['chest'],
      category: 'compound',
      equipment: 'bodyweight',
      isCustom: false,
    },
    {
      id: 'deadlift',
      name: { uk: 'Станова тяга', en: 'Deadlift' },
      muscleGroup: 'back',
      secondaryMuscles: ['legs'],
      category: 'compound',
      equipment: 'barbell',
      isCustom: false,
    },
    {
      id: 'barbell-rows',
      name: { uk: 'Тяга штанги в нахилі', en: 'Barbell Rows' },
      muscleGroup: 'back',
      secondaryMuscles: ['biceps'],
      category: 'compound',
      equipment: 'barbell',
      isCustom: false,
    },
    {
      id: 'lat-pulldown',
      name: { uk: 'Тяга верхнього блоку', en: 'Lat Pulldown' },
      muscleGroup: 'back',
      secondaryMuscles: ['biceps'],
      category: 'compound',
      equipment: 'cable',
      isCustom: false,
    },
    {
      id: 'barbell-curl',
      name: { uk: 'Згинання рук зі штангою', en: 'Barbell Curl' },
      muscleGroup: 'biceps',
      secondaryMuscles: [],
      category: 'isolation',
      equipment: 'barbell',
      isCustom: false,
    },
    {
      id: 'squat',
      name: { uk: 'Присідання', en: 'Squat' },
      muscleGroup: 'legs',
      secondaryMuscles: ['glutes'],
      category: 'compound',
      equipment: 'barbell',
      isCustom: false,
    },
    {
      id: 'leg-press',
      name: { uk: 'Жим ногами', en: 'Leg Press' },
      muscleGroup: 'legs',
      secondaryMuscles: ['glutes'],
      category: 'compound',
      equipment: 'machine',
      isCustom: false,
    },
    {
      id: 'leg-curl',
      name: { uk: 'Згинання ніг', en: 'Leg Curl' },
      muscleGroup: 'hamstrings',
      secondaryMuscles: [],
      category: 'isolation',
      equipment: 'machine',
      isCustom: false,
    },
    {
      id: 'calf-raises',
      name: { uk: 'Підйоми на носки', en: 'Calf Raises' },
      muscleGroup: 'calves',
      secondaryMuscles: [],
      category: 'isolation',
      equipment: 'machine',
      isCustom: false,
    },
    {
      id: 'overhead-press',
      name: { uk: 'Жим штанги стоячи', en: 'Overhead Press' },
      muscleGroup: 'shoulders',
      secondaryMuscles: ['triceps'],
      category: 'compound',
      equipment: 'barbell',
      isCustom: false,
    },
    {
      id: 'lateral-raises',
      name: { uk: 'Розведення гантелей в сторони', en: 'Lateral Raises' },
      muscleGroup: 'shoulders',
      secondaryMuscles: [],
      category: 'isolation',
      equipment: 'dumbbells',
      isCustom: false,
    },
    {
      id: 'face-pulls',
      name: { uk: 'Тяга канату до обличчя', en: 'Face Pulls' },
      muscleGroup: 'shoulders',
      secondaryMuscles: ['back'],
      category: 'isolation',
      equipment: 'cable',
      isCustom: false,
    },
    {
      id: 'plank',
      name: { uk: 'Планка', en: 'Plank' },
      muscleGroup: 'core',
      secondaryMuscles: [],
      category: 'isometric',
      equipment: 'bodyweight',
      isCustom: false,
    },
    {
      id: 'russian-twists',
      name: { uk: 'Російські скручування', en: 'Russian Twists' },
      muscleGroup: 'core',
      secondaryMuscles: [],
      category: 'isolation',
      equipment: 'bodyweight',
      isCustom: false,
    },
  ]
}

export function createMockActiveWorkout(userId) {
  const now = new Date()
  const mockExercises = generateMockExercises()
  const getExercise = (id) => mockExercises.find((ex) => ex.id === id)
  const getMuscleGroups = (id) => {
    const exercise = getExercise(id)
    return exercise ? [exercise.muscleGroup, ...(exercise.secondaryMuscles || [])] : []
  }

  return {
    id: 'mock-active',
    userId: userId || 'onboarding-user',
    status: 'active',
    startedAt: new Date(now.getTime() - 1200000),
    completedAt: null,
    duration: 0,
    totalVolume: 3180,
    totalSets: 9,
    exercises: [
      {
        exerciseId: 'bench-press',
        exerciseName:
          getExercise('bench-press')?.name || {
            uk: 'Жим лежачи',
            en: 'Bench Press',
          },
        muscleGroups: getMuscleGroups('bench-press'),
        order: 0,
        sets: [
          { weight: 80, reps: 8, type: 'normal', completedAt: new Date(now.getTime() - 1000000) },
          { weight: 80, reps: 8, type: 'normal', completedAt: new Date(now.getTime() - 800000) },
          { weight: 80, reps: 7, type: 'normal', completedAt: new Date(now.getTime() - 600000) },
          { weight: 75, reps: 9, type: 'normal', completedAt: new Date(now.getTime() - 400000) },
        ],
      },
      {
        exerciseId: 'incline-dumbbell-press',
        exerciseName:
          getExercise('incline-dumbbell-press')?.name || {
            uk: 'Жим гантелей на похилій лаві',
            en: 'Incline Dumbbell Press',
          },
        muscleGroups: getMuscleGroups('incline-dumbbell-press'),
        order: 1,
        sets: [
          { weight: 30, reps: 10, type: 'normal', completedAt: new Date(now.getTime() - 240000) },
          { weight: 30, reps: 9, type: 'normal', completedAt: new Date(now.getTime() - 120000) },
        ],
      },
      {
        exerciseId: 'chest-flyes',
        exerciseName:
          getExercise('chest-flyes')?.name || {
            uk: 'Розведення гантелей',
            en: 'Chest Flyes',
          },
        muscleGroups: getMuscleGroups('chest-flyes'),
        order: 2,
        sets: [
          { weight: 20, reps: 12, type: 'normal', completedAt: new Date(now.getTime() - 60000) },
          { weight: 20, reps: 11, type: 'normal', completedAt: new Date(now.getTime() - 15000) },
        ],
      },
      {
        exerciseId: 'triceps-dips',
        exerciseName:
          getExercise('triceps-dips')?.name || {
            uk: 'Віджимання на брусах',
            en: 'Triceps Dips',
          },
        muscleGroups: getMuscleGroups('triceps-dips'),
        order: 3,
        sets: [],
      },
    ],
  }
}

export function generateMockWorkouts(userId) {
  const today = new Date()
  const mockExercises = generateMockExercises()
  const getExercise = (id) => mockExercises.find((ex) => ex.id === id)
  const getMuscleGroups = (id) => {
    const exercise = getExercise(id)
    return exercise ? [exercise.muscleGroup, ...(exercise.secondaryMuscles || [])] : []
  }

  return [
    {
      id: 'mock-1',
      userId: userId || 'onboarding-user',
      status: 'completed',
      startedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
      completedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000 + 4200000),
      duration: 4200,
      totalVolume: 5600,
      totalSets: 16,
      exercises: [
        {
          exerciseId: 'bench-press',
          exerciseName:
            getExercise('bench-press')?.name || {
              uk: 'Жим лежачи',
              en: 'Bench Press',
            },
          muscleGroups: getMuscleGroups('bench-press'),
          order: 0,
          sets: [
            { weight: 80, reps: 8, type: 'normal', completedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000 + 600000) },
            { weight: 85, reps: 6, type: 'normal', completedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000 + 1200000) },
            { weight: 85, reps: 6, type: 'normal', completedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000 + 1800000) },
            { weight: 80, reps: 8, type: 'normal', completedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000 + 2400000) },
          ],
        },
        {
          exerciseId: 'incline-dumbbell-press',
          exerciseName:
            getExercise('incline-dumbbell-press')?.name || {
              uk: 'Жим гантелей на похилій лаві',
              en: 'Incline Dumbbell Press',
            },
          muscleGroups: getMuscleGroups('incline-dumbbell-press'),
          order: 1,
          sets: [
            { weight: 30, reps: 10, type: 'normal', completedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000 + 3000000) },
            { weight: 32, reps: 8, type: 'normal', completedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000 + 3400000) },
            { weight: 32, reps: 8, type: 'normal', completedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000 + 3800000) },
          ],
        },
        {
          exerciseId: 'triceps-dips',
          exerciseName:
            getExercise('triceps-dips')?.name || {
              uk: 'Віджимання на брусах',
              en: 'Triceps Dips',
            },
          muscleGroups: getMuscleGroups('triceps-dips'),
          order: 2,
          sets: [
            { weight: 0, reps: 12, type: 'normal', completedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000 + 4000000) },
            { weight: 0, reps: 10, type: 'normal', completedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000 + 4100000) },
            { weight: 0, reps: 10, type: 'normal', completedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000 + 4200000) },
          ],
        },
      ],
    },
    {
      id: 'mock-2',
      userId: userId || 'onboarding-user',
      status: 'completed',
      startedAt: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000),
      completedAt: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000 + 4500000),
      duration: 4500,
      totalVolume: 6200,
      totalSets: 18,
      exercises: [
        {
          exerciseId: 'deadlift',
          exerciseName:
            getExercise('deadlift')?.name || {
              uk: 'Станова тяга',
              en: 'Deadlift',
            },
          muscleGroups: getMuscleGroups('deadlift'),
          order: 0,
          sets: [
            { weight: 120, reps: 5, type: 'normal', completedAt: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000 + 600000) },
            { weight: 130, reps: 3, type: 'normal', completedAt: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000 + 1200000) },
            { weight: 130, reps: 3, type: 'normal', completedAt: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000 + 1800000) },
          ],
        },
        {
          exerciseId: 'pull-ups',
          exerciseName:
            getExercise('pull-ups')?.name || {
              uk: 'Підтягування',
              en: 'Pull-ups',
            },
          muscleGroups: getMuscleGroups('pull-ups'),
          order: 1,
          sets: [
            { weight: 0, reps: 10, type: 'normal', completedAt: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000 + 2400000) },
            { weight: 0, reps: 8, type: 'normal', completedAt: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000 + 2800000) },
            { weight: 0, reps: 8, type: 'normal', completedAt: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000 + 3200000) },
          ],
        },
        {
          exerciseId: 'barbell-rows',
          exerciseName:
            getExercise('barbell-rows')?.name || {
              uk: 'Тяга штанги в нахилі',
              en: 'Barbell Rows',
            },
          muscleGroups: getMuscleGroups('barbell-rows'),
          order: 2,
          sets: [
            { weight: 70, reps: 8, type: 'normal', completedAt: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000 + 3600000) },
            { weight: 70, reps: 8, type: 'normal', completedAt: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000 + 3900000) },
            { weight: 70, reps: 8, type: 'normal', completedAt: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000 + 4200000) },
          ],
        },
        {
          exerciseId: 'bicep-curls',
          exerciseName:
            getExercise('barbell-curl')?.name || {
              uk: 'Згинання рук зі штангою',
              en: 'Barbell Curl',
            },
          muscleGroups: getMuscleGroups('barbell-curl'),
          order: 3,
          sets: [
            { weight: 15, reps: 12, type: 'normal', completedAt: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000 + 4300000) },
            { weight: 17, reps: 10, type: 'normal', completedAt: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000 + 4400000) },
            { weight: 17, reps: 10, type: 'normal', completedAt: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000 + 4500000) },
          ],
        },
      ],
    },
    {
      id: 'mock-3',
      userId: userId || 'onboarding-user',
      status: 'completed',
      startedAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
      completedAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000 + 5100000),
      duration: 5100,
      totalVolume: 7800,
      totalSets: 20,
      exercises: [
        {
          exerciseId: 'squat',
          exerciseName:
            getExercise('squat')?.name || {
              uk: 'Присідання',
              en: 'Squat',
            },
          muscleGroups: getMuscleGroups('squat'),
          order: 0,
          sets: [
            { weight: 100, reps: 8, type: 'normal', completedAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000 + 600000) },
            { weight: 110, reps: 6, type: 'normal', completedAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000 + 1200000) },
            { weight: 110, reps: 6, type: 'normal', completedAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000 + 1800000) },
            { weight: 100, reps: 8, type: 'normal', completedAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000 + 2400000) },
          ],
        },
        {
          exerciseId: 'leg-press',
          exerciseName:
            getExercise('leg-press')?.name || {
              uk: 'Жим ногами',
              en: 'Leg Press',
            },
          muscleGroups: getMuscleGroups('leg-press'),
          order: 1,
          sets: [
            { weight: 150, reps: 10, type: 'normal', completedAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000 + 3000000) },
            { weight: 150, reps: 10, type: 'normal', completedAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000 + 3400000) },
            { weight: 150, reps: 10, type: 'normal', completedAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000 + 3800000) },
          ],
        },
        {
          exerciseId: 'leg-curls',
          exerciseName:
            getExercise('leg-curl')?.name || {
              uk: 'Згинання ніг',
              en: 'Leg Curl',
            },
          muscleGroups: getMuscleGroups('leg-curl'),
          order: 2,
          sets: [
            { weight: 50, reps: 12, type: 'normal', completedAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000 + 4200000) },
            { weight: 50, reps: 12, type: 'normal', completedAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000 + 4500000) },
            { weight: 50, reps: 12, type: 'normal', completedAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000 + 4800000) },
          ],
        },
        {
          exerciseId: 'calf-raises',
          exerciseName:
            getExercise('calf-raises')?.name || {
              uk: 'Підйоми на носки',
              en: 'Calf Raises',
            },
          muscleGroups: getMuscleGroups('calf-raises'),
          order: 3,
          sets: [
            { weight: 80, reps: 15, type: 'normal', completedAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000 + 4900000) },
            { weight: 80, reps: 15, type: 'normal', completedAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000 + 5000000) },
            { weight: 80, reps: 15, type: 'normal', completedAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000 + 5050000) },
            { weight: 80, reps: 15, type: 'normal', completedAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000 + 5100000) },
          ],
        },
      ],
    },
    {
      id: 'mock-4',
      userId: userId || 'onboarding-user',
      status: 'completed',
      startedAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
      completedAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000 + 3600000),
      duration: 3600,
      totalVolume: 3400,
      totalSets: 16,
      exercises: [
        {
          exerciseId: 'overhead-press',
          exerciseName:
            getExercise('overhead-press')?.name || {
              uk: 'Жим штанги стоячи',
              en: 'Overhead Press',
            },
          muscleGroups: getMuscleGroups('overhead-press'),
          order: 0,
          sets: [
            { weight: 50, reps: 8, type: 'normal', completedAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000 + 600000) },
            { weight: 55, reps: 6, type: 'normal', completedAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000 + 1200000) },
            { weight: 55, reps: 6, type: 'normal', completedAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000 + 1800000) },
            { weight: 50, reps: 8, type: 'normal', completedAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000 + 2400000) },
          ],
        },
        {
          exerciseId: 'lateral-raises',
          exerciseName:
            getExercise('lateral-raises')?.name || {
              uk: 'Розведення гантелей в сторони',
              en: 'Lateral Raises',
            },
          muscleGroups: getMuscleGroups('lateral-raises'),
          order: 1,
          sets: [
            { weight: 12, reps: 15, type: 'normal', completedAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000 + 3000000) },
            { weight: 12, reps: 15, type: 'normal', completedAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000 + 3600000) },
            { weight: 12, reps: 15, type: 'normal', completedAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000 + 4200000) },
          ],
        },
        {
          exerciseId: 'face-pulls',
          exerciseName:
            getExercise('face-pulls')?.name || {
              uk: 'Тяга канату до обличчя',
              en: 'Face Pulls',
            },
          muscleGroups: getMuscleGroups('face-pulls'),
          order: 2,
          sets: [
            { weight: 30, reps: 15, type: 'normal', completedAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000 + 4800000) },
            { weight: 30, reps: 15, type: 'normal', completedAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000 + 5400000) },
            { weight: 30, reps: 15, type: 'normal', completedAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000 + 6000000) },
          ],
        },
        {
          exerciseId: 'planks',
          exerciseName:
            getExercise('plank')?.name || {
              uk: 'Планка',
              en: 'Plank',
            },
          muscleGroups: getMuscleGroups('plank'),
          order: 3,
          sets: [
            { weight: 0, reps: 60, type: 'normal', completedAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000 + 6600000) },
            { weight: 0, reps: 60, type: 'normal', completedAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000 + 7200000) },
          ],
        },
      ],
    },
    {
      id: 'mock-5',
      userId: userId || 'onboarding-user',
      status: 'completed',
      startedAt: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000),
      completedAt: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000 + 4000000),
      duration: 4000,
      totalVolume: 5200,
      totalSets: 14,
      exercises: [
        {
          exerciseId: 'bench-press',
          exerciseName: 'Bench Press',
          muscleGroups: ['chest', 'triceps'],
          order: 0,
          sets: [
            { weight: 75, reps: 8, type: 'normal', completedAt: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000 + 600000) },
            { weight: 80, reps: 6, type: 'normal', completedAt: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000 + 1200000) },
            { weight: 80, reps: 6, type: 'normal', completedAt: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000 + 1800000) },
          ],
        },
        {
          exerciseId: 'cable-rows',
          exerciseName:
            getExercise('cable-rows')?.name || {
              uk: 'Тяга на блоці',
              en: 'Cable Rows',
            },
          muscleGroups: getMuscleGroups('cable-rows'),
          order: 1,
          sets: [
            { weight: 60, reps: 10, type: 'normal', completedAt: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000 + 2400000) },
            { weight: 60, reps: 10, type: 'normal', completedAt: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000 + 3000000) },
            { weight: 60, reps: 10, type: 'normal', completedAt: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000 + 3600000) },
          ],
        },
        {
          exerciseId: 'chest-flyes',
          exerciseName:
            getExercise('chest-flyes')?.name || {
              uk: 'Розведення гантелей',
              en: 'Chest Flyes',
            },
          muscleGroups: getMuscleGroups('chest-flyes'),
          order: 2,
          sets: [
            { weight: 20, reps: 12, type: 'normal', completedAt: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000 + 4200000) },
            { weight: 20, reps: 12, type: 'normal', completedAt: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000 + 4800000) },
          ],
        },
        {
          exerciseId: 'lat-pulldowns',
          exerciseName:
            getExercise('lat-pulldown')?.name || {
              uk: 'Тяга верхнього блоку',
              en: 'Lat Pulldown',
            },
          muscleGroups: getMuscleGroups('lat-pulldown'),
          order: 3,
          sets: [
            { weight: 55, reps: 10, type: 'normal', completedAt: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000 + 5400000) },
            { weight: 55, reps: 10, type: 'normal', completedAt: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000 + 6000000) },
            { weight: 55, reps: 10, type: 'normal', completedAt: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000 + 6600000) },
          ],
        },
      ],
    },
    {
      id: 'mock-6',
      userId: userId || 'onboarding-user',
      status: 'completed',
      startedAt: new Date(today.getTime() - 18 * 24 * 60 * 60 * 1000),
      completedAt: new Date(today.getTime() - 18 * 24 * 60 * 60 * 1000 + 4200000),
      duration: 4200,
      totalVolume: 6500,
      totalSets: 17,
      exercises: [
        {
          exerciseId: 'squat',
          exerciseName:
            getExercise('squat')?.name || {
              uk: 'Присідання',
              en: 'Squat',
            },
          muscleGroups: getMuscleGroups('squat'),
          order: 0,
          sets: [
            { weight: 95, reps: 8, type: 'normal', completedAt: new Date(today.getTime() - 18 * 24 * 60 * 60 * 1000 + 600000) },
            { weight: 100, reps: 6, type: 'normal', completedAt: new Date(today.getTime() - 18 * 24 * 60 * 60 * 1000 + 1200000) },
            { weight: 100, reps: 6, type: 'normal', completedAt: new Date(today.getTime() - 18 * 24 * 60 * 60 * 1000 + 1800000) },
            { weight: 95, reps: 8, type: 'normal', completedAt: new Date(today.getTime() - 18 * 24 * 60 * 60 * 1000 + 2400000) },
          ],
        },
        {
          exerciseId: 'lunges',
          exerciseName:
            getExercise('lunges')?.name || {
              uk: 'Випади',
              en: 'Lunges',
            },
          muscleGroups: getMuscleGroups('lunges'),
          order: 1,
          sets: [
            { weight: 20, reps: 12, type: 'normal', completedAt: new Date(today.getTime() - 18 * 24 * 60 * 60 * 1000 + 3000000) },
            { weight: 20, reps: 12, type: 'normal', completedAt: new Date(today.getTime() - 18 * 24 * 60 * 60 * 1000 + 3600000) },
            { weight: 20, reps: 12, type: 'normal', completedAt: new Date(today.getTime() - 18 * 24 * 60 * 60 * 1000 + 4200000) },
          ],
        },
        {
          exerciseId: 'russian-twists',
          exerciseName:
            getExercise('russian-twists')?.name || {
              uk: 'Російські скручування',
              en: 'Russian Twists',
            },
          muscleGroups: getMuscleGroups('russian-twists'),
          order: 2,
          sets: [
            { weight: 10, reps: 30, type: 'normal', completedAt: new Date(today.getTime() - 18 * 24 * 60 * 60 * 1000 + 4800000) },
            { weight: 10, reps: 30, type: 'normal', completedAt: new Date(today.getTime() - 18 * 24 * 60 * 60 * 1000 + 5400000) },
            { weight: 10, reps: 30, type: 'normal', completedAt: new Date(today.getTime() - 18 * 24 * 60 * 60 * 1000 + 6000000) },
          ],
        },
        {
          exerciseId: 'leg-raises',
          exerciseName:
            getExercise('leg-raises')?.name || {
              uk: 'Підйоми ніг',
              en: 'Leg Raises',
            },
          muscleGroups: getMuscleGroups('leg-raises'),
          order: 3,
          sets: [
            { weight: 0, reps: 15, type: 'normal', completedAt: new Date(today.getTime() - 18 * 24 * 60 * 60 * 1000 + 6600000) },
            { weight: 0, reps: 15, type: 'normal', completedAt: new Date(today.getTime() - 18 * 24 * 60 * 60 * 1000 + 7200000) },
            { weight: 0, reps: 15, type: 'normal', completedAt: new Date(today.getTime() - 18 * 24 * 60 * 60 * 1000 + 7800000) },
          ],
        },
      ],
    },
    {
      id: 'mock-7',
      userId: userId || 'onboarding-user',
      status: 'completed',
      startedAt: new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000),
      completedAt: new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000 + 3300000),
      duration: 3300,
      totalVolume: 2800,
      totalSets: 14,
      exercises: [
        {
          exerciseId: 'barbell-curls',
          exerciseName:
            getExercise('barbell-curl')?.name || {
              uk: 'Згинання рук зі штангою',
              en: 'Barbell Curl',
            },
          muscleGroups: getMuscleGroups('barbell-curl'),
          order: 0,
          sets: [
            { weight: 30, reps: 10, type: 'normal', completedAt: new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000 + 600000) },
            { weight: 32, reps: 8, type: 'normal', completedAt: new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000 + 1200000) },
            { weight: 32, reps: 8, type: 'normal', completedAt: new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000 + 1800000) },
          ],
        },
        {
          exerciseId: 'triceps-extensions',
          exerciseName:
            getExercise('triceps-extensions')?.name || {
              uk: 'Розгинання рук',
              en: 'Triceps Extensions',
            },
          muscleGroups: getMuscleGroups('triceps-extensions'),
          order: 1,
          sets: [
            { weight: 25, reps: 12, type: 'normal', completedAt: new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000 + 2400000) },
            { weight: 27, reps: 10, type: 'normal', completedAt: new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000 + 3000000) },
            { weight: 27, reps: 10, type: 'normal', completedAt: new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000 + 3600000) },
          ],
        },
        {
          exerciseId: 'hammer-curls',
          exerciseName:
            getExercise('hammer-curls')?.name || {
              uk: 'Молотки',
              en: 'Hammer Curls',
            },
          muscleGroups: getMuscleGroups('hammer-curls'),
          order: 2,
          sets: [
            { weight: 15, reps: 12, type: 'normal', completedAt: new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000 + 4200000) },
            { weight: 15, reps: 12, type: 'normal', completedAt: new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000 + 4800000) },
          ],
        },
        {
          exerciseId: 'triceps-dips',
          exerciseName: 'Triceps Dips',
          muscleGroups: ['triceps'],
          order: 3,
          sets: [
            { weight: 0, reps: 15, type: 'normal', completedAt: new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000 + 5400000) },
            { weight: 0, reps: 12, type: 'normal', completedAt: new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000 + 6000000) },
            { weight: 0, reps: 12, type: 'normal', completedAt: new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000 + 6600000) },
          ],
        },
      ],
    },
    {
      id: 'mock-8',
      userId: userId || 'onboarding-user',
      status: 'completed',
      startedAt: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000),
      completedAt: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000 + 5400000),
      duration: 5400,
      totalVolume: 7200,
      totalSets: 20,
      exercises: [
        {
          exerciseId: 'deadlift',
          exerciseName:
            getExercise('deadlift')?.name || {
              uk: 'Станова тяга',
              en: 'Deadlift',
            },
          muscleGroups: getMuscleGroups('deadlift'),
          order: 0,
          sets: [
            { weight: 115, reps: 5, type: 'normal', completedAt: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000 + 600000) },
            { weight: 120, reps: 3, type: 'normal', completedAt: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000 + 1200000) },
            { weight: 120, reps: 3, type: 'normal', completedAt: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000 + 1800000) },
          ],
        },
        {
          exerciseId: 'bench-press',
          exerciseName: 'Bench Press',
          muscleGroups: ['chest', 'triceps'],
          order: 1,
          sets: [
            { weight: 75, reps: 8, type: 'normal', completedAt: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000 + 2400000) },
            { weight: 75, reps: 8, type: 'normal', completedAt: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000 + 3000000) },
            { weight: 75, reps: 8, type: 'normal', completedAt: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000 + 3600000) },
          ],
        },
        {
          exerciseId: 'squat',
          exerciseName:
            getExercise('squat')?.name || {
              uk: 'Присідання',
              en: 'Squat',
            },
          muscleGroups: getMuscleGroups('squat'),
          order: 2,
          sets: [
            { weight: 90, reps: 8, type: 'normal', completedAt: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000 + 4200000) },
            { weight: 90, reps: 8, type: 'normal', completedAt: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000 + 4800000) },
            { weight: 90, reps: 8, type: 'normal', completedAt: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000 + 5400000) },
          ],
        },
        {
          exerciseId: 'overhead-press',
          exerciseName:
            getExercise('overhead-press')?.name || {
              uk: 'Жим штанги стоячи',
              en: 'Overhead Press',
            },
          muscleGroups: getMuscleGroups('overhead-press'),
          order: 3,
          sets: [
            { weight: 45, reps: 10, type: 'normal', completedAt: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000 + 6000000) },
            { weight: 45, reps: 10, type: 'normal', completedAt: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000 + 6600000) },
            { weight: 45, reps: 10, type: 'normal', completedAt: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000 + 7200000) },
          ],
        },
        {
          exerciseId: 'pull-ups',
          exerciseName:
            getExercise('pull-ups')?.name || {
              uk: 'Підтягування',
              en: 'Pull-ups',
            },
          muscleGroups: getMuscleGroups('pull-ups'),
          order: 4,
          sets: [
            { weight: 0, reps: 8, type: 'normal', completedAt: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000 + 7800000) },
            { weight: 0, reps: 8, type: 'normal', completedAt: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000 + 8400000) },
          ],
        },
        {
          exerciseId: 'planks',
          exerciseName:
            getExercise('plank')?.name || {
              uk: 'Планка',
              en: 'Plank',
            },
          muscleGroups: getMuscleGroups('plank'),
          order: 5,
          sets: [
            { weight: 0, reps: 60, type: 'normal', completedAt: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000 + 9000000) },
            { weight: 0, reps: 60, type: 'normal', completedAt: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000 + 9600000) },
            { weight: 0, reps: 60, type: 'normal', completedAt: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000 + 10200000) },
          ],
        },
      ],
    },
  ]
}
