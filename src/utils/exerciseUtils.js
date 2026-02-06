/**
 * Exercise-related utility functions
 * Centralizes exercise name extraction and formatting logic
 */

/**
 * Get localized exercise name from various input formats
 * Handles both string names and translation objects with locale keys
 *
 * @param {string|Object} exerciseName - Exercise name (string) or translation object
 * @param {string} locale - Current locale ('uk' or 'en')
 * @returns {string} - Localized exercise name, or empty string if invalid
 *
 * @example
 * // String format (already localized)
 * getLocalizedExerciseName('Bench Press', 'en') // => 'Bench Press'
 *
 * // Object format (multilingual)
 * getLocalizedExerciseName({ uk: 'Жим лежачи', en: 'Bench Press' }, 'uk') // => 'Жим лежачи'
 * getLocalizedExerciseName({ uk: 'Жим лежачи', en: 'Bench Press' }, 'en') // => 'Bench Press'
 *
 * // Fallback order: requested locale -> en -> uk -> empty string
 * getLocalizedExerciseName({ uk: 'Жим лежачи' }, 'en') // => 'Жим лежачи' (fallback to uk)
 */
export function getLocalizedExerciseName(exerciseName, locale) {
  if (!exerciseName) return ''

  // If it's already a string, return it directly
  if (typeof exerciseName === 'string') {
    return exerciseName
  }

  // If it's an object with translations, extract the appropriate locale
  if (typeof exerciseName === 'object' && exerciseName !== null) {
    // Priority: requested locale -> 'en' -> 'uk' -> first available value -> empty string
    return (
      exerciseName[locale] ||
      exerciseName.en ||
      exerciseName.uk ||
      Object.values(exerciseName)[0] ||
      ''
    )
  }

  return ''
}
