import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useWorkoutTimer } from '@/composables/useWorkoutTimer'

describe('useWorkoutTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should calculate elapsed time correctly', () => {
    const startedAt = new Date(Date.now() - 120000) // 2 minutes ago
    let elapsed

    const TestComponent = defineComponent({
      setup() {
        const timer = useWorkoutTimer(startedAt)
        elapsed = timer.elapsed
        return () => h('div')
      },
    })

    mount(TestComponent)

    expect(elapsed.value).toBe(120) // 120 seconds
  })

  it('should format time as MM:SS when less than 1 hour', () => {
    let formatTime

    const TestComponent = defineComponent({
      setup() {
        const timer = useWorkoutTimer(null)
        formatTime = timer.formatTime
        return () => h('div')
      },
    })

    mount(TestComponent)

    expect(formatTime(0)).toBe('00:00')
    expect(formatTime(59)).toBe('00:59')
    expect(formatTime(125)).toBe('02:05')
    expect(formatTime(3599)).toBe('59:59')
  })

  it('should format time as HH:MM:SS when 1 hour or more', () => {
    let formatTime

    const TestComponent = defineComponent({
      setup() {
        const timer = useWorkoutTimer(null)
        formatTime = timer.formatTime
        return () => h('div')
      },
    })

    mount(TestComponent)

    expect(formatTime(3600)).toBe('01:00:00')
    expect(formatTime(3661)).toBe('01:01:01')
    expect(formatTime(7384)).toBe('02:03:04')
  })

  it('should start and increment timer', async () => {
    const startedAt = new Date()
    let elapsed, start

    const TestComponent = defineComponent({
      setup() {
        const timer = useWorkoutTimer(startedAt)
        elapsed = timer.elapsed
        start = timer.start
        return () => h('div')
      },
    })

    mount(TestComponent)

    start()

    // Advance time by 3 seconds
    vi.advanceTimersByTime(3000)

    expect(elapsed.value).toBeGreaterThanOrEqual(3)
  })

  it('should pause timer', () => {
    const startedAt = new Date()
    let start, pause, isRunning

    const TestComponent = defineComponent({
      setup() {
        const timer = useWorkoutTimer(startedAt)
        start = timer.start
        pause = timer.pause
        isRunning = timer.isRunning
        return () => h('div')
      },
    })

    mount(TestComponent)

    start()
    expect(isRunning.value).toBe(true)

    pause()
    expect(isRunning.value).toBe(false)
  })

  it('should reset timer', () => {
    const startedAt = new Date()
    let elapsed, start, reset

    const TestComponent = defineComponent({
      setup() {
        const timer = useWorkoutTimer(startedAt)
        elapsed = timer.elapsed
        start = timer.start
        reset = timer.reset
        return () => h('div')
      },
    })

    mount(TestComponent)

    start()
    vi.advanceTimersByTime(5000)

    reset()
    expect(elapsed.value).toBe(0)
  })
})
