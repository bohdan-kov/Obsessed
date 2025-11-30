import { ref } from 'vue'

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

const toasts = ref([])
const timeouts = new Map()

/**
 * Add a new toast notification
 * @param {Object} toast - Toast configuration
 * @param {string} toast.title - Toast title
 * @param {string} [toast.description] - Toast description
 * @param {('default'|'destructive')} [toast.variant='default'] - Toast variant
 * @param {number|Infinity} [toast.duration] - Auto-dismiss duration in ms. Defaults: 4s for success, 6s for errors. Set to Infinity to disable auto-dismiss.
 * @returns {Object} Toast control object with id, dismiss, and update methods
 */
function addToast(toast) {
  const id = genId()

  // Set default duration based on variant
  // Success/default toasts: 4 seconds
  // Destructive/error toasts: 6 seconds (user needs more time to read errors)
  const defaultDuration = toast.variant === 'destructive' ? 6000 : 4000
  const duration = toast.duration ?? defaultDuration

  const newToast = {
    id,
    ...toast,
    duration,
  }

  toasts.value = [newToast, ...toasts.value].slice(0, TOAST_LIMIT)

  // Set up auto-dismiss if duration is not Infinity
  if (duration !== Infinity && duration > 0) {
    const timeoutId = setTimeout(() => {
      dismiss(id)
    }, duration)
    timeouts.set(id, timeoutId)
  }

  return {
    id,
    dismiss: () => dismiss(id),
    update: (props) => update(id, props),
  }
}

function update(id, toast) {
  toasts.value = toasts.value.map((t) => (t.id === id ? { ...t, ...toast } : t))
}

function dismiss(id) {
  // Clear timeout if exists
  if (timeouts.has(id)) {
    clearTimeout(timeouts.get(id))
    timeouts.delete(id)
  }

  toasts.value = toasts.value.filter((t) => t.id !== id)
}

function removeToast(id) {
  dismiss(id)
}

export function useToast() {
  return {
    toasts,
    toast: addToast,
    dismiss,
  }
}
