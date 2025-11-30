import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useActiveWorkout } from '../useActiveWorkout'
import { createPinia, setActivePinia } from 'pinia'

// Mock Firebase
vi.mock('@/firebase/firestore', () => ({
  fetchCollection: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  subscribeToCollection: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
}))

// Mock other composables
vi.mock('../useWorkoutTimer', () => ({
  useWorkoutTimer: vi.fn(() => ({
    elapsed: { value: 0 },
    formattedTime: { value: '00:00' },
    isRunning: { value: false },
    start: vi.fn(),
    pause: vi.fn(),
    reset: vi.fn(),
  })),
}))

describe('useActiveWorkout', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should return correct state when no active workout', () => {
    const { hasActiveWorkout, totalSets, totalVolume } = useActiveWorkout()

    expect(hasActiveWorkout.value).toBe(false)
    expect(totalSets.value).toBe(0)
    expect(totalVolume.value).toBe(0)
  })

  // More tests will be added when workoutStore is fully mocked
  // For now, this validates the composable structure
})
