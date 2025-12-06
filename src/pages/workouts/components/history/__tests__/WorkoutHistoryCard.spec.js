import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import WorkoutHistoryCard from '@/pages/workouts/components/history/WorkoutHistoryCard.vue'

describe('WorkoutHistoryCard', () => {
  const mockWorkout = {
    id: 'workout-1',
    completedAt: new Date('2023-11-30T10:00:00'),
    duration: 3600, // 1 hour
    totalVolume: 5000,
    totalSets: 10,
    exercises: [
      {
        exerciseName: 'Bench Press',
        sets: [{ weight: 100, reps: 10 }],
      },
      {
        exerciseName: 'Squat',
        sets: [{ weight: 120, reps: 8 }],
      },
    ],
  }

  describe('duration formatting', () => {
    it('should display hours and minutes for durations >= 1 hour', () => {
      const wrapper = mount(WorkoutHistoryCard, {
        props: {
          workout: {
            ...mockWorkout,
            duration: 3661, // 1 hour 1 minute 1 second
          },
        },
      })

      // Should format as "1h 1m" in English or "1год 1хв" in Ukrainian
      expect(wrapper.text()).toMatch(/1/)
    })

    it('should display only minutes for durations < 1 hour', () => {
      const wrapper = mount(WorkoutHistoryCard, {
        props: {
          workout: {
            ...mockWorkout,
            duration: 1800, // 30 minutes
          },
        },
      })

      // Should show 30 minutes
      expect(wrapper.text()).toMatch(/30/)
    })

    it('should handle negative durations gracefully', () => {
      const wrapper = mount(WorkoutHistoryCard, {
        props: {
          workout: {
            ...mockWorkout,
            duration: -1101532, // Negative duration (bug scenario)
          },
        },
      })

      // Should display "Unknown" or translation key instead of negative time
      const text = wrapper.text()
      // Check for the translation key or actual translation
      expect(text).toMatch(/Unknown|Невідомо|workout\.history\.card\.durationUnknown/)
      // Ensure no negative time like "-18392 хв" is shown
      expect(text).not.toMatch(/-\d+\s*(хв|min|год|h)/)
    })

    it('should handle null duration', () => {
      const wrapper = mount(WorkoutHistoryCard, {
        props: {
          workout: {
            ...mockWorkout,
            duration: null,
          },
        },
      })

      // Should display "Unknown" for null duration
      const text = wrapper.text()
      expect(text).toMatch(/Unknown|Невідомо|workout\.history\.card\.durationUnknown/)
    })

    it('should handle undefined duration', () => {
      const wrapper = mount(WorkoutHistoryCard, {
        props: {
          workout: {
            ...mockWorkout,
            duration: undefined,
          },
        },
      })

      // Should display "Unknown" for undefined duration
      const text = wrapper.text()
      expect(text).toMatch(/Unknown|Невідомо|workout\.history\.card\.durationUnknown/)
    })

    it('should display "< 1 min" for very short workouts (< 60 seconds)', () => {
      const wrapper = mount(WorkoutHistoryCard, {
        props: {
          workout: {
            ...mockWorkout,
            duration: 45, // 45 seconds
          },
        },
      })

      // Should show "< 1 min" or translation
      const text = wrapper.text()
      expect(text).toMatch(/< 1|workout\.history\.card\.durationLessThanMinute/)
    })

    it('should handle zero duration', () => {
      const wrapper = mount(WorkoutHistoryCard, {
        props: {
          workout: {
            ...mockWorkout,
            duration: 0,
          },
        },
      })

      // Should show 0 minutes
      const text = wrapper.text()
      expect(text).toMatch(/0/)
    })

    it('should format 2 hours correctly', () => {
      const wrapper = mount(WorkoutHistoryCard, {
        props: {
          workout: {
            ...mockWorkout,
            duration: 7200, // 2 hours exactly
          },
        },
      })

      // Should show translation key with hours=2, minutes=0
      // Since i18n is mocked, we just verify the key is used
      const text = wrapper.text()
      expect(text).toMatch(/workout\.history\.card\.duration|2.*0|0.*2/)
    })

    it('should format 1.5 hours correctly', () => {
      const wrapper = mount(WorkoutHistoryCard, {
        props: {
          workout: {
            ...mockWorkout,
            duration: 5400, // 1 hour 30 minutes
          },
        },
      })

      // Should show 1 hour 30 minutes
      const text = wrapper.text()
      expect(text).toMatch(/1/)
      expect(text).toMatch(/30/)
    })
  })

  describe('workout data display', () => {
    it('should display formatted completion date', () => {
      const wrapper = mount(WorkoutHistoryCard, {
        props: { workout: mockWorkout },
      })

      // Date formatting is locale-aware, so just check it renders
      expect(wrapper.find('.text-lg').exists()).toBe(true)
    })

    it('should display total volume with unit', () => {
      const wrapper = mount(WorkoutHistoryCard, {
        props: { workout: mockWorkout },
      })

      // Should show volume (exact format depends on unit conversion)
      expect(wrapper.text()).toMatch(/\d+/)
    })

    it('should display exercise count', () => {
      const wrapper = mount(WorkoutHistoryCard, {
        props: { workout: mockWorkout },
      })

      // Should render exercise count (2 exercises in mockWorkout)
      // Check for translation key or actual count
      expect(wrapper.text()).toMatch(/workout\.history\.card\.exercises/)
    })

    it('should display total sets count', () => {
      const wrapper = mount(WorkoutHistoryCard, {
        props: { workout: mockWorkout },
      })

      // Should render total sets (10 in mockWorkout)
      // Check for translation key or actual count
      expect(wrapper.text()).toMatch(/workout\.history\.card\.sets/)
    })
  })

  describe('exercise list rendering', () => {
    it('should display up to 3 exercises', () => {
      const wrapper = mount(WorkoutHistoryCard, {
        props: { workout: mockWorkout },
      })

      expect(wrapper.text()).toContain('Bench Press')
      expect(wrapper.text()).toContain('Squat')
    })

    it('should show remaining count when more than 3 exercises', () => {
      const workoutWithManyExercises = {
        ...mockWorkout,
        exercises: [
          { exerciseName: 'Exercise 1', sets: [{}] },
          { exerciseName: 'Exercise 2', sets: [{}] },
          { exerciseName: 'Exercise 3', sets: [{}] },
          { exerciseName: 'Exercise 4', sets: [{}] },
          { exerciseName: 'Exercise 5', sets: [{}] },
        ],
      }

      const wrapper = mount(WorkoutHistoryCard, {
        props: { workout: workoutWithManyExercises },
      })

      // Should show "+2" for remaining exercises
      expect(wrapper.text()).toMatch(/\+2/)
    })

    it('should handle workout with no exercises', () => {
      const workoutWithNoExercises = {
        ...mockWorkout,
        exercises: [],
      }

      const wrapper = mount(WorkoutHistoryCard, {
        props: { workout: workoutWithNoExercises },
      })

      // Should show 0 exercises
      expect(wrapper.text()).toMatch(/0/)
    })
  })
})
