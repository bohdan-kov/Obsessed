import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ExerciseProgressRow from '@/pages/analytics/components/exercises/ExerciseProgressRow.vue'

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock ExerciseMiniChart component
vi.mock('../ExerciseMiniChart.vue', () => ({
  default: {
    name: 'ExerciseMiniChart',
    props: ['history', 'width', 'height'],
    template: '<div data-testid="exercise-mini-chart" class="exercise-mini-chart"></div>',
  },
}))

describe('ExerciseProgressRow', () => {
  const mockExercise = {
    id: 'ex1',
    name: 'Bench Press',
    estimated1RM: 133,
    bestPR: {
      weight: 120,
      reps: 5,
      date: new Date('2024-01-15'),
      estimated1RM: 140,
    },
    lastPerformed: new Date('2024-01-20'),
    trend: 'up',
    trendPercentage: 8.5,
    confidence: 85,
    status: {
      label: 'Progressing',
      color: 'green',
      icon: 'trending-up',
    },
    history: [
      { date: new Date('2024-01-01'), bestSet: { weight: 100, reps: 10 }, sets: [] },
      { date: new Date('2024-01-08'), bestSet: { weight: 105, reps: 10 }, sets: [] },
      { date: new Date('2024-01-15'), bestSet: { weight: 110, reps: 10 }, sets: [] },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render exercise name', () => {
      const wrapper = mount(ExerciseProgressRow, {
        props: { exercise: mockExercise },
      })

      expect(wrapper.text()).toContain('Bench Press')
    })

    it('should render estimated 1RM', () => {
      const wrapper = mount(ExerciseProgressRow, {
        props: { exercise: mockExercise },
      })

      expect(wrapper.text()).toContain('133')
    })

    it('should render trend icon', () => {
      const wrapper = mount(ExerciseProgressRow, {
        props: { exercise: mockExercise },
      })

      // The component uses dynamic component with TrendingUp from lucide-vue-next
      // Look for the SVG element that lucide renders
      const trendIconArea = wrapper.find('.text-green-600')
      expect(trendIconArea.exists()).toBe(true)
    })

    it('should render status badge on desktop', () => {
      const wrapper = mount(ExerciseProgressRow, {
        props: { exercise: mockExercise },
      })

      // The component uses translation key: t('analytics.exerciseProgress.statusBadge.up')
      // Since translations are mocked to return keys, we check for the key
      expect(wrapper.text()).toContain('analytics.exerciseProgress.statusBadge.up')
    })
  })

  describe('Expansion', () => {
    it('should start collapsed', () => {
      const wrapper = mount(ExerciseProgressRow, {
        props: { exercise: mockExercise },
      })

      expect(wrapper.vm.isExpanded).toBe(false)
    })

    it('should expand when row is clicked', async () => {
      const wrapper = mount(ExerciseProgressRow, {
        props: { exercise: mockExercise },
      })

      const row = wrapper.find('[data-testid="row"]').exists()
        ? wrapper.find('[data-testid="row"]')
        : wrapper.find('.grid')

      await row.trigger('click')
      expect(wrapper.vm.isExpanded).toBe(true)
    })

    it('should collapse when clicked again', async () => {
      const wrapper = mount(ExerciseProgressRow, {
        props: { exercise: mockExercise },
      })

      const row = wrapper.find('.grid')
      await row.trigger('click')
      await row.trigger('click')
      expect(wrapper.vm.isExpanded).toBe(false)
    })

    it('should rotate chevron when expanded', async () => {
      const wrapper = mount(ExerciseProgressRow, {
        props: { exercise: mockExercise },
      })

      // Find the chevron by looking for the rotate-180 parent element that contains an SVG
      const chevronContainer = wrapper.find('.transition-transform')
      expect(chevronContainer.exists()).toBe(true)
      expect(chevronContainer.classes()).not.toContain('rotate-180')

      const row = wrapper.find('.grid')
      await row.trigger('click')
      await wrapper.vm.$nextTick()

      // After expansion, chevron should have rotate-180 class
      const chevronAfter = wrapper.find('.transition-transform.rotate-180')
      expect(chevronAfter.exists()).toBe(true)
    })

    it('should show ExerciseMiniChart when expanded', async () => {
      const wrapper = mount(ExerciseProgressRow, {
        props: { exercise: mockExercise },
      })

      // Mini chart exists inline on mobile
      let miniCharts = wrapper.findAll('[data-testid="exercise-mini-chart"]')
      expect(miniCharts.length).toBeGreaterThan(0)

      const row = wrapper.find('.grid')
      await row.trigger('click')
      await wrapper.vm.$nextTick()

      // Should have larger chart in expanded section (total 2 charts)
      miniCharts = wrapper.findAll('[data-testid="exercise-mini-chart"]')
      expect(miniCharts.length).toBe(2)
    })
  })

  describe('Trend Display', () => {
    it('should show upward trend icon for progressing exercise', () => {
      const wrapper = mount(ExerciseProgressRow, {
        props: { exercise: mockExercise },
      })

      // Check for green color class which is applied to trending up icon
      const trendIcon = wrapper.find('.text-green-600')
      expect(trendIcon.exists()).toBe(true)
    })

    it('should show downward trend icon for regressing exercise', () => {
      const regressingExercise = {
        ...mockExercise,
        trend: 'down',
        trendPercentage: -5.2,
        status: { label: 'Regressing', color: 'red', icon: 'trending-down' },
      }

      const wrapper = mount(ExerciseProgressRow, {
        props: { exercise: regressingExercise },
      })

      // Check for red color class which is applied to trending down icon
      const trendIcon = wrapper.find('.text-red-600')
      expect(trendIcon.exists()).toBe(true)
    })

    it('should show flat trend icon for stalled exercise', () => {
      const stalledExercise = {
        ...mockExercise,
        trend: 'flat',
        trendPercentage: 0.5,
        status: { label: 'Stalled', color: 'yellow', icon: 'minus' },
      }

      const wrapper = mount(ExerciseProgressRow, {
        props: { exercise: stalledExercise },
      })

      // Check for gray color class which is applied to flat/minus icon
      const trendIcon = wrapper.find('.text-gray-400')
      expect(trendIcon.exists()).toBe(true)
    })

    it('should display trend percentage', () => {
      const wrapper = mount(ExerciseProgressRow, {
        props: { exercise: mockExercise },
      })

      expect(wrapper.text()).toContain('+8.5%')
    })
  })

  describe('PR Details in Expanded Section', () => {
    it('should show best PR details when expanded', async () => {
      const wrapper = mount(ExerciseProgressRow, {
        props: { exercise: mockExercise },
      })

      const row = wrapper.find('.grid')
      await row.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('120')
      expect(wrapper.text()).toContain('5')
      expect(wrapper.text()).toContain('140')
    })

    it('should show current 1RM in expanded section', async () => {
      const wrapper = mount(ExerciseProgressRow, {
        props: { exercise: mockExercise },
      })

      const row = wrapper.find('.grid')
      await row.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Current')
      expect(wrapper.text()).toContain('133')
    })

    it('should handle exercise without PR data', async () => {
      const exerciseWithoutPR = {
        ...mockExercise,
        bestPR: null,
      }

      const wrapper = mount(ExerciseProgressRow, {
        props: { exercise: exerciseWithoutPR },
      })

      const row = wrapper.find('.grid')
      await row.trigger('click')
      await wrapper.vm.$nextTick()

      // Should still show current 1RM
      expect(wrapper.text()).toContain('Current')
      expect(wrapper.text()).toContain('133')
    })
  })

  describe('Date Formatting', () => {
    it('should format lastPerformed date correctly', () => {
      const wrapper = mount(ExerciseProgressRow, {
        props: { exercise: mockExercise },
      })

      // Date should be formatted (e.g., "Jan 20, 2024")
      const text = wrapper.text()
      expect(text).toMatch(/Jan|January/)
      expect(text).toContain('2024')
    })

    it('should handle missing date', () => {
      const exerciseWithoutDate = {
        ...mockExercise,
        lastPerformed: null,
      }

      const wrapper = mount(ExerciseProgressRow, {
        props: { exercise: exerciseWithoutDate },
      })

      expect(wrapper.text()).toContain('-')
    })
  })

  describe('Status Colors', () => {
    it('should apply green color for progressing status', () => {
      const wrapper = mount(ExerciseProgressRow, {
        props: { exercise: mockExercise },
      })

      const statusBadge = wrapper.find('.bg-green-50')
      expect(statusBadge.exists()).toBe(true)
    })

    it('should apply red color for regressing status', () => {
      const regressingExercise = {
        ...mockExercise,
        trend: 'down',
        status: { label: 'Regressing', color: 'red', icon: 'trending-down' },
      }

      const wrapper = mount(ExerciseProgressRow, {
        props: { exercise: regressingExercise },
      })

      const statusBadge = wrapper.find('.bg-red-50')
      expect(statusBadge.exists()).toBe(true)
    })

    it('should apply yellow color for stalled status', () => {
      const stalledExercise = {
        ...mockExercise,
        trend: 'flat',
        status: { label: 'Stalled', color: 'yellow', icon: 'minus' },
      }

      const wrapper = mount(ExerciseProgressRow, {
        props: { exercise: stalledExercise },
      })

      const statusBadge = wrapper.find('.bg-yellow-50')
      expect(statusBadge.exists()).toBe(true)
    })
  })

  describe('Responsive Layout', () => {
    it('should show mini chart on mobile', () => {
      const wrapper = mount(ExerciseProgressRow, {
        props: { exercise: mockExercise },
      })

      // Mobile inline chart with sm:hidden
      const mobileChart = wrapper.find('.sm\\:hidden')
      expect(mobileChart.exists()).toBe(true)
    })

    it('should hide certain columns on mobile', () => {
      const wrapper = mount(ExerciseProgressRow, {
        props: { exercise: mockExercise },
      })

      // Desktop-only columns have .hidden.sm:block
      const desktopColumns = wrapper.findAll('.hidden.sm\\:block')
      expect(desktopColumns.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle exercise with insufficient data trend', () => {
      const newExercise = {
        ...mockExercise,
        trend: 'insufficient_data',
        trendPercentage: 0,
        status: { label: 'New', color: 'gray', icon: 'help-circle' },
      }

      const wrapper = mount(ExerciseProgressRow, {
        props: { exercise: newExercise },
      })

      // Component uses translation key: t('analytics.exerciseProgress.statusBadge.insufficient_data')
      expect(wrapper.text()).toContain('analytics.exerciseProgress.statusBadge.insufficient_data')
    })

    it('should handle very long exercise names', () => {
      const longNameExercise = {
        ...mockExercise,
        name: 'Barbell Bench Press with Very Long Exercise Name That Should Be Truncated',
      }

      const wrapper = mount(ExerciseProgressRow, {
        props: { exercise: longNameExercise },
      })

      // Should still render the name
      expect(wrapper.text()).toContain('Barbell Bench Press')
    })

    it('should handle empty history array', () => {
      const exerciseWithoutHistory = {
        ...mockExercise,
        history: [],
      }

      const wrapper = mount(ExerciseProgressRow, {
        props: { exercise: exerciseWithoutHistory },
      })

      // Should render without errors
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard accessible (clickable row)', async () => {
      const wrapper = mount(ExerciseProgressRow, {
        props: { exercise: mockExercise },
      })

      const row = wrapper.find('.grid')
      expect(row.attributes('class')).toContain('cursor-pointer')
    })

    it('should have proper hover states', () => {
      const wrapper = mount(ExerciseProgressRow, {
        props: { exercise: mockExercise },
      })

      const row = wrapper.find('.grid')
      expect(row.attributes('class')).toContain('hover:bg-muted/50')
    })
  })
})
