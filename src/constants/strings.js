/**
 * UI String Constants
 * Centralized location for all user-facing text
 * Prepares for future i18n integration
 */

export const STRINGS = {
  // Dashboard
  dashboard: {
    title: 'Analytics Dashboard',
    welcomeBack: 'Welcome back',
    stats: {
      totalWorkouts: 'Total Workouts',
      volumeLoad: 'Volume Load',
      restDays: 'Rest Days',
      currentStreak: 'Current Streak',
      allTime: 'All time',
      totalLifted: 'Total lifted',
      thisPeriod: 'This period',
      keepItUp: 'Keep it up!',
      vsLastWeek: 'vs last week',
      days: 'days',
    },
    tabs: {
      volume: 'Обсяг',
      muscles: "М'язи",
      frequency: 'Частота',
      progress: 'Прогрес',
    },
    charts: {
      volumeTitle: 'Обсяг навантаження',
      volumeDescription: 'Загальний обсяг (кг) за останні 14 днів',
      muscleTitle: 'Розподіл по м\'язах',
      muscleDescription: 'Топ 8 м\'язових груп за кількістю підходів',
      frequencyTitle: 'Частота тренувань',
      frequencyDescription: 'Коли ви зазвичай тренуєтесь (день тижня та час)',
      comparisonTitle: 'Тижневий прогрес',
      comparisonDescription: 'Порівняння поточного та минулого тижня',
      noData: 'Немає даних для відображення',
      noDataSubtitle: 'Почніть тренуватися для перегляду статистики',
      totalSets: 'Всього підходів',
      legend: 'Легенда',
      currentWeek: 'Поточний тиждень',
      previousWeek: 'Минулий тиждень',
      intensity: 'Інтенсивність',
      less: 'Менше',
      more: 'Більше',
    },
  },

  // Quick Log
  quickLog: {
    title: 'Log Set',
    selectExercise: 'Select an exercise',
    enterDetails: 'Enter set details',
    weight: 'Weight (kg)',
    reps: 'Reps',
    rpe: 'RPE (optional)',
    submit: 'Log Set',
    recent: 'Recent',
    allExercises: 'All Exercises',
    noExercisesFound: 'No exercises found.',
    searchPlaceholder: 'Search exercises...',
  },

  // Exercise Table
  exerciseTable: {
    overview: 'Огляд',
    history: 'Історія',
    exercises: 'Вправи',
    plans: 'Плани',
    exercise: 'Вправа',
    type: 'Тип',
    status: 'Статус',
    sets: 'Підходи',
    reps: 'Повтори',
    weight: 'Вага',
    date: 'Дата',
    duration: 'Тривалість',
    volume: 'Обсяг',
    lastPerformed: 'Останнє виконання',
    totalSets: 'Всього підходів',
    totalVolume: 'Загальний обсяг',
    timesPerformed: 'Разів виконано',
    noActiveExercises: 'Немає активних вправ',
    noActiveExercisesSubtitle: 'Додайте вправу для початку тренування',
    noWorkoutHistory: 'Немає історії тренувань',
    noExercises: 'Немає виконаних вправ',
    noPlans: 'Планів ще немає',
    noPlansSubtitle: 'Створіть план тренувань',
    addExercise: 'Додати вправу',
    customize: 'Налаштувати',
    edit: 'Редагувати',
    duplicate: 'Дублювати',
    delete: 'Видалити',
  },

  // Muscle Progress
  muscleProgress: {
    title: 'Фокус м\'язів',
    description: 'Розподіл обсягу тренувань за тиждень',
    avgBpm: 'Avg BPM',
    weight: 'Вага',
    noData: 'Немає даних про м\'язові групи',
    noDataSubtitle: 'Почніть тренування для відстеження прогресу',
  },

  // Status
  status: {
    completed: 'Done',
    inProgress: 'In Progress',
    scheduled: 'Scheduled',
  },

  // Actions
  actions: {
    save: 'Зберегти',
    cancel: 'Скасувати',
    delete: 'Видалити',
    edit: 'Редагувати',
    add: 'Додати',
    back: 'Назад',
    close: 'Закрити',
    confirm: 'Підтвердити',
  },

  // Errors
  errors: {
    general: 'Щось пішло не так',
    noWorkout: 'Немає активного тренування',
    saveFailed: 'Не вдалося зберегти',
    loadFailed: 'Не вдалося завантажити дані',
    networkError: 'Проблема з підключенням до інтернету',
    authRequired: 'Потрібна авторизація',
    invalidInput: 'Некоректні дані',
    tryAgain: 'Спробуйте ще раз',
  },

  // Success
  success: {
    saved: 'Збережено',
    deleted: 'Видалено',
    updated: 'Оновлено',
    created: 'Створено',
    setLogged: 'Підхід записано',
  },

  // Units
  units: {
    kg: 'кг',
    lbs: 'lbs',
    minutes: 'хв',
    hours: 'год',
    sets: 'sets',
    reps: 'reps',
  },
}
