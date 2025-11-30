import { useToast } from '@/components/ui/toast/use-toast'
import { useI18n } from 'vue-i18n'

/**
 * Centralized error handling composable
 * Provides consistent error logging and user feedback
 * Supports both i18n keys and plain text messages
 */
export function useErrorHandler() {
  const { toast } = useToast()
  const { t } = useI18n()

  /**
   * Resolve message - either translate i18n key or return plain text
   * @param {string} message - Message or i18n key
   * @param {Object} options - Options object
   * @param {boolean} options.isI18nKey - Whether message is an i18n key
   * @param {Object} options.i18nParams - Parameters for i18n interpolation
   * @returns {string} Resolved message
   */
  function resolveMessage(message, options = {}) {
    const { isI18nKey = false, i18nParams = {} } = options
    if (isI18nKey) {
      return t(message, i18nParams)
    }
    return message
  }

  /**
   * Handle an error with logging and user notification
   * @param {Error} error - The error object
   * @param {string} userMessage - User-friendly error message or i18n key
   * @param {Object} options - Options object
   * @param {boolean} options.isI18nKey - Whether userMessage is an i18n key
   * @param {Object} options.i18nParams - Parameters for i18n interpolation
   * @param {Object} options.context - Additional context for debugging
   */
  function handleError(error, userMessage, options = {}) {
    const {
      isI18nKey = false,
      i18nParams = {},
      context = {},
      ...restOptions
    } = options

    // Log for debugging (only in development)
    if (import.meta.env.DEV) {
      console.error('[ERROR]', context, error)
    }

    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // In production, integrate with error tracking:
    // if (import.meta.env.PROD) {
    //   Sentry.captureException(error, { extra: context })
    // }

    // Resolve message
    const resolvedMessage = userMessage
      ? resolveMessage(userMessage, { isI18nKey, i18nParams })
      : t('errors.general')

    // Show user-friendly message
    toast({
      title: t('common.error'),
      description: resolvedMessage,
      variant: 'destructive',
      ...restOptions,
    })

    return error
  }

  /**
   * Handle a warning (less severe than error)
   * @param {string} message - Warning message or i18n key
   * @param {Object} options - Options object
   */
  function handleWarning(message, options = {}) {
    const { isI18nKey = false, i18nParams = {}, context = {} } = options

    if (import.meta.env.DEV) {
      console.warn('[WARN]', message, context)
    }

    const resolvedMessage = resolveMessage(message, { isI18nKey, i18nParams })

    toast({
      title: t('common.warning'),
      description: resolvedMessage,
      variant: 'default',
    })
  }

  /**
   * Show a success message to the user
   * @param {string} message - Success message or i18n key
   * @param {Object} options - Options object
   */
  function showSuccess(message, options = {}) {
    const { isI18nKey = false, i18nParams = {} } = options
    const resolvedMessage = resolveMessage(message, { isI18nKey, i18nParams })

    toast({
      title: t('common.success.title'),
      description: resolvedMessage,
      variant: 'default',
    })
  }

  return {
    handleError,
    handleWarning,
    showSuccess,
  }
}
