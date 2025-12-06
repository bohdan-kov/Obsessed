import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useToast } from '@/components/ui/toast/use-toast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Clear toasts before each test
    const { toasts } = useToast()
    toasts.value = []
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should add a toast with default duration for success variant', () => {
    const { toast, toasts } = useToast()

    toast({
      title: 'Success!',
      variant: 'default',
    })

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].title).toBe('Success!')
    expect(toasts.value[0].duration).toBe(4000) // Default for success
  })

  it('should add a toast with default duration for error variant', () => {
    const { toast, toasts } = useToast()

    toast({
      title: 'Error!',
      variant: 'destructive',
    })

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].title).toBe('Error!')
    expect(toasts.value[0].duration).toBe(6000) // Default for errors
  })

  it('should respect custom duration when provided', () => {
    const { toast, toasts } = useToast()

    toast({
      title: 'Custom duration',
      duration: 10000,
    })

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].duration).toBe(10000)
  })

  it('should auto-dismiss toast after duration', () => {
    const { toast, toasts } = useToast()

    toast({
      title: 'Auto dismiss',
      duration: 4000,
    })

    expect(toasts.value).toHaveLength(1)

    // Fast-forward time by 4000ms
    vi.advanceTimersByTime(4000)

    expect(toasts.value).toHaveLength(0)
  })

  it('should not auto-dismiss when duration is Infinity', () => {
    const { toast, toasts } = useToast()

    toast({
      title: 'Persistent',
      duration: Infinity,
    })

    expect(toasts.value).toHaveLength(1)

    // Fast-forward time significantly
    vi.advanceTimersByTime(100000)

    // Should still be there
    expect(toasts.value).toHaveLength(1)
  })

  it('should manually dismiss a toast', () => {
    const { toast, toasts, dismiss } = useToast()

    const result = toast({
      title: 'Dismissible',
      duration: 4000,
    })

    expect(toasts.value).toHaveLength(1)

    // Manually dismiss
    dismiss(result.id)

    expect(toasts.value).toHaveLength(0)
  })

  it('should clear timeout when manually dismissed', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
    const { toast, dismiss } = useToast()

    const result = toast({
      title: 'Manual dismiss',
      duration: 4000,
    })

    dismiss(result.id)

    expect(clearTimeoutSpy).toHaveBeenCalled()
  })

  it('should limit toasts to TOAST_LIMIT (5)', () => {
    const { toast, toasts } = useToast()

    // Add 7 toasts
    for (let i = 0; i < 7; i++) {
      toast({
        title: `Toast ${i}`,
        duration: Infinity, // Don't auto-dismiss
      })
    }

    // Should only have 5 (the limit)
    expect(toasts.value).toHaveLength(5)

    // Should have the most recent 5
    expect(toasts.value[0].title).toBe('Toast 6')
    expect(toasts.value[4].title).toBe('Toast 2')
  })

  it('should auto-dismiss multiple toasts at their respective times', () => {
    const { toast, toasts } = useToast()

    // Add toast with 2s duration
    toast({
      title: 'Fast',
      duration: 2000,
    })

    // Add toast with 5s duration
    toast({
      title: 'Slow',
      duration: 5000,
    })

    expect(toasts.value).toHaveLength(2)

    // After 2s, first toast should be gone
    vi.advanceTimersByTime(2000)
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].title).toBe('Slow')

    // After another 3s (total 5s), second toast should be gone
    vi.advanceTimersByTime(3000)
    expect(toasts.value).toHaveLength(0)
  })
})
