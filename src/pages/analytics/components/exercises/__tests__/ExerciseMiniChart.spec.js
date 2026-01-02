import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ExerciseMiniChart from '@/pages/analytics/components/exercises/ExerciseMiniChart.vue'

describe('ExerciseMiniChart', () => {
  const mockHistory = [
    {
      date: new Date('2024-01-01'),
      bestSet: { weight: 100, reps: 10 },
      sets: [{ weight: 100, reps: 10 }],
    },
    {
      date: new Date('2024-01-08'),
      bestSet: { weight: 105, reps: 10 },
      sets: [{ weight: 105, reps: 10 }],
    },
    {
      date: new Date('2024-01-15'),
      bestSet: { weight: 110, reps: 10 },
      sets: [{ weight: 110, reps: 10 }],
    },
  ]

  describe('Rendering', () => {
    it('should render SVG element', () => {
      const wrapper = mount(ExerciseMiniChart, {
        props: { history: mockHistory },
      })

      const svg = wrapper.find('svg')
      expect(svg.exists()).toBe(true)
    })

    it('should use default dimensions', () => {
      const wrapper = mount(ExerciseMiniChart, {
        props: { history: mockHistory },
      })

      const svg = wrapper.find('svg')
      expect(svg.attributes('width')).toBe('100')
      expect(svg.attributes('height')).toBe('40')
    })

    it('should use custom dimensions', () => {
      const wrapper = mount(ExerciseMiniChart, {
        props: {
          history: mockHistory,
          width: 200,
          height: 60,
        },
      })

      const svg = wrapper.find('svg')
      expect(svg.attributes('width')).toBe('200')
      expect(svg.attributes('height')).toBe('60')
    })

    it('should render sparkline path with data', () => {
      const wrapper = mount(ExerciseMiniChart, {
        props: { history: mockHistory },
      })

      const paths = wrapper.findAll('path')
      expect(paths.length).toBeGreaterThan(0)
    })

    it('should render data point circles', () => {
      const wrapper = mount(ExerciseMiniChart, {
        props: { history: mockHistory },
      })

      const circles = wrapper.findAll('circle')
      // Should have data points + highlighted last point
      expect(circles.length).toBeGreaterThan(mockHistory.length)
    })
  })

  describe('Empty State', () => {
    it('should show "No data" when history is empty', () => {
      const wrapper = mount(ExerciseMiniChart, {
        props: { history: [] },
      })

      expect(wrapper.text()).toContain('No data')
    })

    it('should have reduced opacity when empty', () => {
      const wrapper = mount(ExerciseMiniChart, {
        props: { history: [] },
      })

      expect(wrapper.find('.exercise-mini-chart').classes()).toContain('opacity-50')
    })
  })

  describe('Trend Direction', () => {
    it('should use provided trend prop over calculated trend', () => {
      // History suggests upward trend, but we force it to "flat" via prop
      const upwardHistory = [
        { date: new Date(), bestSet: { weight: 100, reps: 10 }, sets: [] },
        { date: new Date(), bestSet: { weight: 110, reps: 10 }, sets: [] },
        { date: new Date(), bestSet: { weight: 120, reps: 10 }, sets: [] },
      ]

      const wrapper = mount(ExerciseMiniChart, {
        props: { history: upwardHistory, trend: 'flat' },
      })

      // Should use trend prop (yellow for flat), not calculated trend (green for up)
      const paths = wrapper.findAll('path')
      const sparkline = paths.find((p) => p.attributes('stroke'))
      expect(sparkline.attributes('stroke')).toBe('rgb(234, 179, 8)') // yellow-500
    })

    it('should detect upward trend when trend prop not provided (fallback)', () => {
      const upwardHistory = [
        { date: new Date(), bestSet: { weight: 100, reps: 10 }, sets: [] },
        { date: new Date(), bestSet: { weight: 110, reps: 10 }, sets: [] },
        { date: new Date(), bestSet: { weight: 120, reps: 10 }, sets: [] },
      ]

      const wrapper = mount(ExerciseMiniChart, {
        props: { history: upwardHistory },
      })

      // Should have green color for upward trend (rgb(34, 197, 94) = green-500)
      const paths = wrapper.findAll('path')
      const sparkline = paths.find((p) => p.attributes('stroke'))
      expect(sparkline.attributes('stroke')).toBe('rgb(34, 197, 94)')
    })

    it('should detect downward trend when trend prop not provided (fallback)', () => {
      const downwardHistory = [
        { date: new Date(), bestSet: { weight: 120, reps: 10 }, sets: [] },
        { date: new Date(), bestSet: { weight: 110, reps: 10 }, sets: [] },
        { date: new Date(), bestSet: { weight: 100, reps: 10 }, sets: [] },
      ]

      const wrapper = mount(ExerciseMiniChart, {
        props: { history: downwardHistory },
      })

      // Should have red color for downward trend (rgb(239, 68, 68) = red-500)
      const paths = wrapper.findAll('path')
      const sparkline = paths.find((p) => p.attributes('stroke'))
      expect(sparkline.attributes('stroke')).toBe('rgb(239, 68, 68)')
    })

    it('should detect flat trend when trend prop not provided (fallback)', () => {
      const flatHistory = [
        { date: new Date(), bestSet: { weight: 100, reps: 10 }, sets: [] },
        { date: new Date(), bestSet: { weight: 101, reps: 10 }, sets: [] },
        { date: new Date(), bestSet: { weight: 100, reps: 10 }, sets: [] },
      ]

      const wrapper = mount(ExerciseMiniChart, {
        props: { history: flatHistory },
      })

      // Should have yellow color for flat trend (rgb(234, 179, 8) = yellow-500)
      const paths = wrapper.findAll('path')
      const sparkline = paths.find((p) => p.attributes('stroke'))
      expect(sparkline.attributes('stroke')).toBe('rgb(234, 179, 8)')
    })

    it('should apply green color when trend prop is "up"', () => {
      const wrapper = mount(ExerciseMiniChart, {
        props: { history: mockHistory, trend: 'up' },
      })

      const paths = wrapper.findAll('path')
      const sparkline = paths.find((p) => p.attributes('stroke'))
      expect(sparkline.attributes('stroke')).toBe('rgb(34, 197, 94)') // green-500
    })

    it('should apply red color when trend prop is "down"', () => {
      const wrapper = mount(ExerciseMiniChart, {
        props: { history: mockHistory, trend: 'down' },
      })

      const paths = wrapper.findAll('path')
      const sparkline = paths.find((p) => p.attributes('stroke'))
      expect(sparkline.attributes('stroke')).toBe('rgb(239, 68, 68)') // red-500
    })

    it('should apply yellow color when trend prop is "flat"', () => {
      const wrapper = mount(ExerciseMiniChart, {
        props: { history: mockHistory, trend: 'flat' },
      })

      const paths = wrapper.findAll('path')
      const sparkline = paths.find((p) => p.attributes('stroke'))
      expect(sparkline.attributes('stroke')).toBe('rgb(234, 179, 8)') // yellow-500
    })

    it('should apply gray color when trend prop is "insufficient_data"', () => {
      const wrapper = mount(ExerciseMiniChart, {
        props: { history: mockHistory, trend: 'insufficient_data' },
      })

      const paths = wrapper.findAll('path')
      const sparkline = paths.find((p) => p.attributes('stroke'))
      expect(sparkline.attributes('stroke')).toBe('rgb(156, 163, 175)') // gray-400

      // Verify gradient colors
      const gradientColors = wrapper.vm.gradientColors
      expect(gradientColors.start).toBe('rgb(156, 163, 175, 0.2)')
      expect(gradientColors.end).toBe('rgb(156, 163, 175, 0)')

      // Verify fill color
      expect(wrapper.vm.fillColor).toBe('rgb(156, 163, 175)') // gray-400

      // Verify highlight fill color
      expect(wrapper.vm.highlightFillColor).toBe('rgb(107, 114, 128)') // gray-500
    })
  })

  describe('Data Calculation', () => {
    it('should calculate 1RM for each history entry', () => {
      const wrapper = mount(ExerciseMiniChart, {
        props: { history: mockHistory },
      })

      // Epley formula: 1RM = weight × (1 + reps/30)
      // For 100kg × 10 reps: 100 × (1 + 10/30) = 133.33
      // Should have calculated values in dataPoints
      expect(wrapper.vm.dataPoints.length).toBe(mockHistory.length)
    })

    it('should filter out invalid data points', () => {
      const historyWithInvalid = [
        { date: new Date(), bestSet: { weight: 100, reps: 10 }, sets: [] },
        { date: new Date(), bestSet: null, sets: [] },
        { date: new Date(), bestSet: { weight: 0, reps: 10 }, sets: [] },
        { date: new Date(), bestSet: { weight: 110, reps: 10 }, sets: [] },
      ]

      const wrapper = mount(ExerciseMiniChart, {
        props: { history: historyWithInvalid },
      })

      // Should only have valid data points
      expect(wrapper.vm.dataPoints.length).toBe(2)
    })
  })

  describe('Scaling', () => {
    it('should calculate min and max values correctly', () => {
      const wrapper = mount(ExerciseMiniChart, {
        props: { history: mockHistory },
      })

      expect(wrapper.vm.yMin).toBeGreaterThan(0)
      expect(wrapper.vm.yMax).toBeGreaterThan(wrapper.vm.yMin)
    })

    it('should add padding to min/max values', () => {
      const wrapper = mount(ExerciseMiniChart, {
        props: { history: mockHistory },
      })

      const dataPoints = wrapper.vm.dataPoints
      const actualMin = Math.min(...dataPoints)
      const actualMax = Math.max(...dataPoints)

      // yMin should be less than actual min (10% padding)
      expect(wrapper.vm.yMin).toBeLessThan(actualMin)

      // yMax should be greater than actual max (10% padding)
      expect(wrapper.vm.yMax).toBeGreaterThan(actualMax)
    })
  })

  describe('SVG Path Generation', () => {
    it('should generate valid sparkline path', () => {
      const wrapper = mount(ExerciseMiniChart, {
        props: { history: mockHistory },
      })

      const path = wrapper.vm.sparklinePath
      expect(path).toBeTruthy()
      expect(path).toContain('M') // Should start with Move command
      expect(path).toContain('L') // Should have Line commands
    })

    it('should generate circle points for each data point', () => {
      const wrapper = mount(ExerciseMiniChart, {
        props: { history: mockHistory },
      })

      const circlePoints = wrapper.vm.circlePoints
      expect(circlePoints.length).toBe(mockHistory.length)
      circlePoints.forEach((point) => {
        expect(point).toHaveProperty('x')
        expect(point).toHaveProperty('y')
        expect(point).toHaveProperty('value')
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle single data point', () => {
      const wrapper = mount(ExerciseMiniChart, {
        props: {
          history: [{ date: new Date(), bestSet: { weight: 100, reps: 10 }, sets: [] }],
        },
      })

      expect(wrapper.vm.dataPoints.length).toBe(1)
      expect(wrapper.vm.sparklinePath).toBeTruthy()
    })

    it('should handle very large values', () => {
      const largeHistory = [
        { date: new Date(), bestSet: { weight: 200, reps: 5 }, sets: [] },
        { date: new Date(), bestSet: { weight: 220, reps: 5 }, sets: [] },
        { date: new Date(), bestSet: { weight: 240, reps: 5 }, sets: [] },
      ]

      const wrapper = mount(ExerciseMiniChart, {
        props: { history: largeHistory },
      })

      expect(wrapper.vm.dataPoints.length).toBe(3)
      expect(wrapper.vm.yMax).toBeGreaterThan(200)
    })

    it('should handle high rep sets (1RM formula limit)', () => {
      const highRepHistory = [
        { date: new Date(), bestSet: { weight: 50, reps: 20 }, sets: [] },
      ]

      const wrapper = mount(ExerciseMiniChart, {
        props: { history: highRepHistory },
      })

      // calculate1RM returns null for reps > 15
      expect(wrapper.vm.dataPoints.length).toBe(0)
    })
  })

  describe('Accessibility', () => {
    it('should have title elements on data points for tooltips', () => {
      const wrapper = mount(ExerciseMiniChart, {
        props: { history: mockHistory },
      })

      const titles = wrapper.findAll('title')
      expect(titles.length).toBeGreaterThan(0)
    })
  })
})
