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

  // Analytics Configuration
  analytics: {
    // Default time period for analytics
    DEFAULT_PERIOD: '2weeks',

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
    THEME: 'obsessed_theme',
    USER_PREFERENCES: 'obsessed_prefs',
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
