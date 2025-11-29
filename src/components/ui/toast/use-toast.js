import { ref } from 'vue'

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

const toasts = ref([])

function addToast(toast) {
  const id = genId()
  const newToast = {
    id,
    ...toast,
  }

  toasts.value = [newToast, ...toasts.value].slice(0, TOAST_LIMIT)

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
