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
    it('should detect upward trend', () => {
      const upwardHistory = [
        { date: new Date(), bestSet: { weight: 100, reps: 10 }, sets: [] },
        { date: new Date(), bestSet: { weight: 110, reps: 10 }, sets: [] },
        { date: new Date(), bestSet: { weight: 120, reps: 10 }, sets: [] },
      ]

      const wrapper = mount(ExerciseMiniChart, {
        props: { history: upwardHistory },
      })

      // Should have green color for upward trend
      const paths = wrapper.findAll('path')
      const hasGreenStroke = paths.some((p) => p.classes().includes('stroke-green-500'))
      expect(hasGreenStroke).toBe(true)
    })

    it('should detect downward trend', () => {
      const downwardHistory = [
        { date: new Date(), bestSet: { weight: 120, reps: 10 }, sets: [] },
        { date: new Date(), bestSet: { weight: 110, reps: 10 }, sets: [] },
        { date: new Date(), bestSet: { weight: 100, reps: 10 }, sets: [] },
      ]

      const wrapper = mount(ExerciseMiniChart, {
        props: { history: downwardHistory },
      })

      // Should have red color for downward trend
      const paths = wrapper.findAll('path')
      const hasRedStroke = paths.some((p) => p.classes().includes('stroke-red-500'))
      expect(hasRedStroke).toBe(true)
    })

    it('should detect flat trend', () => {
      const flatHistory = [
        { date: new Date(), bestSet: { weight: 100, reps: 10 }, sets: [] },
        { date: new Date(), bestSet: { weight: 101, reps: 10 }, sets: [] },
        { date: new Date(), bestSet: { weight: 100, reps: 10 }, sets: [] },
      ]

      const wrapper = mount(ExerciseMiniChart, {
        props: { history: flatHistory },
      })

      // Should have gray color for flat trend
      const paths = wrapper.findAll('path')
      const hasGrayStroke = paths.some((p) => p.classes().includes('stroke-gray-400'))
      expect(hasGrayStroke).toBe(true)
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
