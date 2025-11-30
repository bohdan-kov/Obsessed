import { describe, it, expect, beforeEach } from 'vitest'
import { useWorkoutBackup } from '../useWorkoutBackup'

describe('useWorkoutBackup', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should save and load backup successfully', () => {
    const { saveBackup, loadBackup } = useWorkoutBackup()

    const mockWorkout = {
      id: 'workout-123',
      userId: 'user-123',
      status: 'active',
      startedAt: new Date('2025-01-01T10:00:00Z'),
      lastSavedAt: new Date('2025-01-01T10:05:00Z'),
      exercises: [],
      totalVolume: 0,
      totalSets: 0,
    }

    saveBackup(mockWorkout, [])

    const loaded = loadBackup()
    expect(loaded).toBeTruthy()
    expect(loaded.workoutId).toBe('workout-123')
    expect(loaded.workout.id).toBe('workout-123')
    expect(loaded.workout.startedAt).toBeInstanceOf(Date)
  })

  it('should handle Timestamp serialization', () => {
    const { saveBackup, loadBackup } = useWorkoutBackup()

    const mockWorkout = {
      id: 'workout-123',
      startedAt: {
        toDate: () => new Date('2025-01-01T10:00:00Z'),
      },
      lastSavedAt: {
        toDate: () => new Date('2025-01-01T10:05:00Z'),
      },
      exercises: [
        {
          exerciseId: 'ex-1',
          sets: [
            {
              weight: 100,
              reps: 10,
              completedAt: {
                toDate: () => new Date('2025-01-01T10:02:00Z'),
              },
            },
          ],
        },
      ],
    }

    saveBackup(mockWorkout, [])

    const loaded = loadBackup()
    expect(loaded.workout.startedAt).toBeInstanceOf(Date)
    expect(loaded.workout.exercises[0].sets[0].completedAt).toBeInstanceOf(Date)
  })

  it('should clear backup', () => {
    const { saveBackup, clearBackup, hasBackup } = useWorkoutBackup()

    const mockWorkout = {
      id: 'workout-123',
      startedAt: new Date(),
    }

    saveBackup(mockWorkout, [])
    expect(hasBackup()).toBe(true)

    clearBackup()
    expect(hasBackup()).toBe(false)
  })

  it('should return null when no backup exists', () => {
    const { loadBackup } = useWorkoutBackup()

    const loaded = loadBackup()
    expect(loaded).toBeNull()
  })

  it('should handle corrupted backup gracefully', () => {
    const { loadBackup } = useWorkoutBackup()

    // Manually corrupt localStorage
    localStorage.setItem('obsessed_active_workout', 'invalid json{')

    const loaded = loadBackup()
    expect(loaded).toBeNull()
  })
})
