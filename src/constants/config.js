/**
 * Application Configuration Constants
 * Centralizes all magic numbers and configuration values
 */

export const CONFIG = {
  // UI Configuration
  ui: {
    // Accessibility - minimum touch target size (WCAG 2.1 Level AAA)
    TOUCH_TARGET_MIN_SIZE: 44, // px

    // Sidebar dimensions
    SIDEBAR_WIDTH: 256, // px (w-64)
    SIDEBAR_COLLAPSED_WIDTH: 64, // px (w-16)

    // Mobile breakpoints (match Tailwind defaults)
    MOBILE_BREAKPOINT: 640, // sm
    TABLET_BREAKPOINT: 768, // md
    DESKTOP_BREAKPOINT: 1024, // lg
    SIDEBAR_EXPAND_BREAKPOINT: 1224, // xl-custom - where sidebar auto-expands
  },

  // Workout Configuration
  workout: {
    DEFAULT_REST_TIME: 90, // seconds
    MIN_REST_TIME: 30, // seconds
    MAX_REST_TIME: 600, // seconds (10 minutes)

    // RPE (Rate of Perceived Exertion) scale
    RPE_MIN: 1,
    RPE_MAX: 10,

    // Set tracking
    MIN_WEIGHT: 0, // kg
    MAX_WEIGHT: 1000, // kg
    MIN_REPS: 1,
    MAX_REPS: 100,
  },

  // Personal Info Configuration
  personalInfo: {
    MIN_WEIGHT: 30, // kg - minimum valid body weight
    MAX_WEIGHT: 300, // kg - maximum valid body weight
    WEIGHT_DECIMAL_PLACES: 1, // precision for storage
  },

  // Active Workout Configuration
  activeWorkout: {
    AUTO_SAVE_DEBOUNCE: 2000, // ms - Firestore write debounce
    BACKUP_WRITE_DEBOUNCE: 500, // ms - localStorage debounce
    TIMER_UPDATE_INTERVAL: 1000, // ms - timer refresh rate
    SYNC_RETRY_DELAY: 5000, // ms - offline retry delay
    SYNC_MAX_RETRIES: 5,
    SYNC_BACKOFF_MULTIPLIER: 2,
    PENDING_QUEUE_MAX: 50,
    STALE_BACKUP_THRESHOLD: 24 * 60 * 60 * 1000, // 24 hours
    FIRESTORE_LISTENER_WAIT_MS: 100, // Wait for serverTimestamp to propagate
  },

  // Set types
  setTypes: {
    NORMAL: 'normal',
    WARMUP: 'warmup',
    DROPSET: 'dropset',
  },

  // RPE color thresholds
  rpe: {
    LOW_MAX: 4, // 1-4 = green
    MEDIUM_MAX: 7, // 5-7 = yellow
    // 8-10 = red
  },

  // Analytics Configuration
  analytics: {
    // Chart display limits
    VOLUME_CHART_DAYS: 14,
    MAX_MUSCLE_GROUPS_DISPLAY: 8,
    MAX_RECENT_WORKOUTS_DISPLAY: 10,
    MAX_EXERCISES_DISPLAY: 8,

    // Heatmap
    HEATMAP_WEEKS: 8,
    HEATMAP_HOURS_DISPLAY: [6, 9, 12, 15, 18, 21], // Which hours to show

    // SVG Chart dimensions
    DONUT_CHART: {
      CENTER_X: 100,
      CENTER_Y: 100,
      OUTER_RADIUS: 70,
      INNER_RADIUS: 45,
      VIEWBOX: '0 0 200 200',
    },

    // Insight thresholds
    insights: {
      restDays: {
        WARNING_THRESHOLD: 3, // Days before warning
        OPTIMAL_MIN: 1,
        OPTIMAL_MAX: 2,
      },
      streak: {
        EXCELLENT_THRESHOLD: 7, // Days for excellent status
        GOOD_THRESHOLD: 3, // Days for good status
      },
      workouts: {
        MONTHLY_TARGET: 12, // Target workouts per month
        WEEKLY_TARGET: 3, // Target workouts per week
      },
      volume: {
        GROWTH_TARGET_PERCENT: 5, // Target growth percentage
        DECLINE_WARNING_PERCENT: -10, // Decline warning threshold
      },
      pr: {
        WEIGHT_TIER_SIZE_KG: 2.5, // Weight tier for rep PRs (rounded to nearest 2.5kg)
        RECENT_PR_DAYS: 30, // Days to consider for "recent" PRs
      },
    },

    // Period identifiers
    periods: {
      THIS_WEEK: 'thisWeek',
      THIS_MONTH: 'thisMonth',
      LAST_7_DAYS: 'last7Days',
      LAST_30_DAYS: 'last30Days',

      // Period options for global period selector
      PERIOD_OPTIONS: [
        {
          id: 'last7Days',
          labelKey: 'dashboard.periodSelector.last7Days',
          days: 7,
          type: 'rolling',
          comparisonType: 'rolling',
        },
        {
          id: 'last14Days',
          labelKey: 'dashboard.periodSelector.last14Days',
          days: 14,
          type: 'rolling',
          comparisonType: 'rolling',
        },
        {
          id: 'last30Days',
          labelKey: 'dashboard.periodSelector.last30Days',
          days: 30,
          type: 'rolling',
          comparisonType: 'rolling',
          isDefault: true,
        },
        {
          id: 'thisMonth',
          labelKey: 'dashboard.periodSelector.thisMonth',
          type: 'calendarMonth',
          comparisonType: 'previousMonth',
        },
        {
          id: 'lastMonth',
          labelKey: 'dashboard.periodSelector.lastMonth',
          type: 'previousCalendarMonth',
          comparisonType: 'monthBeforeLast',
        },
        {
          id: 'last90Days',
          labelKey: 'dashboard.periodSelector.last90Days',
          days: 90,
          type: 'rolling',
          comparisonType: 'rolling',
        },
        {
          id: 'thisYear',
          labelKey: 'dashboard.periodSelector.thisYear',
          type: 'calendarYear',
          comparisonType: 'previousYear',
        },
        {
          id: 'allTime',
          labelKey: 'dashboard.periodSelector.allTime',
          type: 'allTime',
          comparisonType: null,
        },
      ],
      DEFAULT_PERIOD: 'last30Days',
    },
  },

  // Exercise Configuration
  exercise: {
    MAX_RECENT_EXERCISES: 10,
    MAX_CUSTOM_EXERCISES: 100,
    SEARCH_DEBOUNCE: 300, // ms
    NOTES_AUTOSAVE_DELAY: 2000, // ms - autosave delay for exercise notes
    CACHE_KEY: 'obsessed_exercises_cache',
    CACHE_TTL: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    CACHE_VERSION: '1.0',
    MAX_SECONDARY_MUSCLES: 3,
    EXERCISES_PER_PAGE: 20, // Pagination: exercises displayed per page
    ITEM_HEIGHT: 180, // px - height of ExerciseListItem card
    PAGINATION_MAX_ITEMS: 30, // Dynamic pagination max items
    PAGE_HEADER_OFFSET: 240, // px - header + filters offset for pagination
  },

  // Performance Configuration
  performance: {
    // Debounce delays
    DEBOUNCE_DELAY: 300, // ms - default for inputs
    SEARCH_DEBOUNCE: 500, // ms - for search inputs
    RESIZE_DEBOUNCE: 150, // ms - for window resize

    // Throttle delays
    SCROLL_THROTTLE: 100, // ms

    // Pagination
    FETCH_LIMIT: 50, // items per page
    INFINITE_SCROLL_THRESHOLD: 0.8, // 80% scroll position

    // Caching
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes in ms
  },

  // Firebase Configuration
  firebase: {
    // Firestore batch limits
    MAX_BATCH_SIZE: 500,
    MAX_IN_QUERY: 10, // Firestore 'in' query limit

    // Retry configuration
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // ms

    // Pagination
    DEFAULT_PAGE_SIZE: 20,
  },

  // LocalStorage Keys (prefixed to avoid conflicts)
  storage: {
    PREFIX: 'obsessed_',
    SIDEBAR_COLLAPSED: 'obsessed_sidebar_collapsed',
    RECENT_EXERCISES: 'obsessed_recent_exercises',
    LAST_WEIGHT: 'obsessed_lastWeight',
    LAST_RPE: 'obsessed_lastRpe',
    ACTIVE_WORKOUT_BACKUP: 'obsessed_active_workout',
    THEME: 'obsessed_theme',
    USER_PREFERENCES: 'obsessed_prefs',
    ANALYTICS_PERIOD: 'obsessed_analytics_period',
  },

  // Date/Time formats
  formats: {
    DATE_SHORT: 'uk-UA', // e.g., "15 січ 2024"
    DATE_LONG: 'uk-UA', // e.g., "15 січня 2024 р."
    TIME: 'HH:mm',
    DATETIME: 'HH:mm, d MMM yyyy',
  },

  // Validation regex
  validation: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^\+?[\d\s-()]+$/,
    // Only allow positive numbers with optional decimal
    WEIGHT: /^\d+(\.\d{0,2})?$/,
    REPS: /^\d+$/,
  },

  // Feature flags
  features: {
    ENABLE_SOCIAL_FEATURES: false,
    ENABLE_MEAL_TRACKING: false,
    ENABLE_SUPERSET_TRACKING: false,
    ENABLE_ADVANCED_ANALYTICS: true,
  },
}

/**
 * Get period days mapping
 * @param {string} period - Period identifier
 * @returns {number} Number of days
 */
export function getPeriodDays(period) {
  const PERIOD_DAYS = {
    week: 7,
    '2weeks': 14,
    month: 30,
    quarter: 90,
    year: 365,
  }
  return PERIOD_DAYS[period] || 14
}
