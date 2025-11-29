import { useToast } from '@/components/ui/toast/use-toast'

/**
 * Centralized error handling composable
 * Provides consistent error logging and user feedback
 */
export function useErrorHandler() {
  const { toast } = useToast()

  /**
   * Handle an error with logging and user notification
   * @param {Error} error - The error object
   * @param {string} userMessage - User-friendly error message
   * @param {Object} context - Additional context for debugging
   */
  function handleError(error, userMessage = 'Щось пішло не так', context = {}) {
    // Log for debugging (only in development)
    if (import.meta.env.DEV) {
      console.error('[ERROR]', context, error)
    }

    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // In production, integrate with error tracking:
    // if (import.meta.env.PROD) {
    //   Sentry.captureException(error, { extra: context })
    // }

    // Show user-friendly message
    toast({
      title: 'Помилка',
      description: userMessage,
      variant: 'destructive',
    })

    return error
  }

  /**
   * Handle a warning (less severe than error)
   * @param {string} message - Warning message
   * @param {Object} context - Additional context
   */
  function handleWarning(message, context = {}) {
    if (import.meta.env.DEV) {
      console.warn('[WARN]', message, context)
    }

    toast({
      title: 'Увага',
      description: message,
      variant: 'default',
    })
  }

  /**
   * Show a success message to the user
   * @param {string} message - Success message
   */
  function showSuccess(message) {
    toast({
      title: 'Успішно',
      description: message,
      variant: 'default',
    })
  }

  return {
    handleError,
    handleWarning,
    showSuccess,
  }
}
