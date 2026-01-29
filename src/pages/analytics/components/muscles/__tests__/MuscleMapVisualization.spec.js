import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref, computed } from 'vue'

// Mock the HumanMuscleAnatomy component from npm package
vi.mock('@lucawahlen/vue-human-muscle-anatomy', () => ({
  HumanMuscleAnatomy: {
    name: 'HumanMuscleAnatomy',
    template: '<div data-testid="human-anatomy">Muscle Anatomy Mock</div>',
    props: [
      'gender',
      'defaultMuscleColor',
      'backgroundColor',
      'primaryHighlightColor',
      'secondaryHighlightColor',
      'primaryOpacity',
      'secondaryOpacity',
      'selectedPrimaryMuscleGroups',
      'selectedSecondaryMuscleGroups',
    ],
  },
}))

// Mock Card components
vi.mock('@/components/ui/card', () => ({
  Card: {
    name: 'Card',
    props: ['class'],
    template: '<div class="card"><slot /></div>',
  },
  CardContent: {
    name: 'CardContent',
    props: ['class'],
    template: '<div class="card-content"><slot /></div>',
  },
  CardDescription: {
    name: 'CardDescription',
    template: '<div class="card-description"><slot /></div>',
  },
  CardHeader: {
    name: 'CardHeader',
    props: ['class'],
    template: '<div class="card-header"><slot /></div>',
  },
  CardTitle: {
    name: 'CardTitle',
    template: '<div class="card-title"><slot /></div>',
  },
}))

// Mock muscleMapUtils with proper implementation
vi.mock('@/utils/muscleMapUtils', () => ({
  convertToAnatomicalMuscles: vi.fn((data) =>
    data.map((d) => ({ muscle: d.muscle, volume: d.value }))
  ),
  groupMusclesByIntensity: vi.fn((data) => ({
    primary: data.slice(0, Math.ceil(data.length / 2)).map((d) => d.muscle),
    secondary: data.slice(Math.ceil(data.length / 2)).map((d) => d.muscle),
  })),
  findMaxVolume: vi.fn((data) => {
    if (!data || data.length === 0) return 0
    return Math.max(...data.map((d) => d.value))
  }),
}))

// Module-level mock refs that can be modified per test
let mockMuscleDistributionByVolume
let mockWorkoutLoadingValue
let mockUserProfileValue

// Mock stores with refs that storeToRefs can destructure
vi.mock('@/stores/analyticsStore', () => ({
  useAnalyticsStore: () => ({
    muscleDistributionByVolume: mockMuscleDistributionByVolume,
  }),
}))

// For stores accessed directly (not via storeToRefs), Pinia normally returns refs
// that get automatically unwrapped in templates. Our mocks return refs directly.
vi.mock('@/stores/workoutStore', () => ({
  useWorkoutStore: () => ({
    get loading() {
      return mockWorkoutLoadingValue.value
    },
  }),
}))

vi.mock('@/stores/userStore', () => ({
  useUserStore: () => ({
    get profile() {
      return mockUserProfileValue.value
    },
  }),
}))

import MuscleMapVisualization from '../MuscleMapVisualization.vue'

describe('MuscleMapVisualization', () => {
  const mockMuscleDistribution = [
    { muscle: 'chest', value: 1500, percentage: 30 },
    { muscle: 'back', value: 2000, percentage: 40 },
    { muscle: 'legs', value: 1000, percentage: 20 },
    { muscle: 'shoulders', value: 500, percentage: 10 },
  ]

  beforeEach(() => {
    // Reset all mock refs before each test with default values
    mockMuscleDistributionByVolume = ref([])
    mockWorkoutLoadingValue = ref(false)
    mockUserProfileValue = ref(null)
  })

  function createWrapper(options = {}) {
    const pinia = createPinia()
    setActivePinia(pinia)

    // Apply custom options to mock refs
    if (options.muscleDistribution !== undefined) {
      mockMuscleDistributionByVolume.value = options.muscleDistribution
    }
    if (options.loading !== undefined) {
      mockWorkoutLoadingValue.value = options.loading
    }
    if (options.userProfile !== undefined) {
      mockUserProfileValue.value = options.userProfile
    }

    return mount(MuscleMapVisualization, {
      global: {
        plugins: [pinia],
        stubs: {
          Teleport: true,
        },
      },
    })
  }

  describe('Loading State', () => {
    it('should show loading spinner when loading is true', () => {
      const wrapper = createWrapper({ loading: true })
      const spinner = wrapper.find('.animate-spin')
      expect(spinner.exists()).toBe(true)
    })

    it('should not show content when loading', () => {
      const wrapper = createWrapper({ loading: true, muscleDistribution: mockMuscleDistribution })
      const anatomy = wrapper.find('[data-testid="human-anatomy"]')
      expect(anatomy.exists()).toBe(false)
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no muscle distribution data', () => {
      const wrapper = createWrapper({ muscleDistribution: [] })
      const emptyText = wrapper.text()
      expect(emptyText).toContain('analytics.muscles.map.emptyState')
    })

    it('should show User icon in empty state', () => {
      const wrapper = createWrapper({ muscleDistribution: [] })
      // Check for lucide-vue-next User icon - it renders as SVG with specific class
      const userIcon = wrapper.find('svg.lucide-user')
      expect(userIcon.exists()).toBe(true)
    })

    it('should not show anatomy when no data', () => {
      const wrapper = createWrapper({ muscleDistribution: [] })
      const anatomy = wrapper.find('[data-testid="human-anatomy"]')
      expect(anatomy.exists()).toBe(false)
    })
  })

  describe('Muscle Map Rendering', () => {
    it('should render the component', () => {
      const wrapper = createWrapper({ muscleDistribution: mockMuscleDistribution })
      expect(wrapper.exists()).toBe(true)
    })

    it('should show card title', () => {
      const wrapper = createWrapper({ muscleDistribution: mockMuscleDistribution })
      const title = wrapper.text()
      expect(title).toContain('analytics.muscles.map.title')
    })

    it('should show card description', () => {
      const wrapper = createWrapper({ muscleDistribution: mockMuscleDistribution })
      const description = wrapper.text()
      expect(description).toContain('analytics.muscles.map.description')
    })

    it('should render HumanAnatomy component when data exists', () => {
      const wrapper = createWrapper({ muscleDistribution: mockMuscleDistribution })
      const anatomy = wrapper.find('[data-testid="human-anatomy"]')
      expect(anatomy.exists()).toBe(true)
    })

    it('should render legend', () => {
      const wrapper = createWrapper({ muscleDistribution: mockMuscleDistribution })
      const legend = wrapper.find('.muscle-map-legend')
      expect(legend.exists()).toBe(true)
    })

    it('should show legend labels', () => {
      const wrapper = createWrapper({ muscleDistribution: mockMuscleDistribution })
      const text = wrapper.text()
      expect(text).toContain('analytics.muscles.map.legend.low')
      expect(text).toContain('analytics.muscles.map.legend.high')
      expect(text).toContain('analytics.muscles.map.legend.title')
    })

    it('should render 6 legend color cells', () => {
      const wrapper = createWrapper({ muscleDistribution: mockMuscleDistribution })
      const legendCells = wrapper.findAll('.legend-cell')
      expect(legendCells).toHaveLength(6)
    })

    it('should apply entrance animation class', () => {
      const wrapper = createWrapper({ muscleDistribution: mockMuscleDistribution })
      const container = wrapper.find('.muscle-map-entrance')
      expect(container.exists()).toBe(true)
    })
  })

  describe('Data Transformation', () => {
    it('should convert app muscle groups to anatomical muscles', () => {
      const wrapper = createWrapper({ muscleDistribution: mockMuscleDistribution })
      // Component should process the data and show max volume
      const text = wrapper.text()
      // Max volume is 2000 kg (back) - should be shown in legend
      expect(text).toContain('2000')
    })

    it('should calculate max volume correctly', () => {
      const wrapper = createWrapper({ muscleDistribution: mockMuscleDistribution })
      const text = wrapper.text()
      // Back has highest volume: 2000 kg
      expect(text).toContain('2000')
    })
  })

  describe('Props Passed to HumanAnatomy', () => {
    it('should pass default male gender when no user profile', () => {
      const wrapper = createWrapper({ muscleDistribution: mockMuscleDistribution })
      const anatomy = wrapper.findComponent({ name: 'HumanMuscleAnatomy' })
      expect(anatomy.props('gender')).toBe('male')
    })

    it('should pass female gender when user profile has female gender', () => {
      const wrapper = createWrapper({
        muscleDistribution: mockMuscleDistribution,
        userProfile: {
          personalInfo: {
            gender: 'female',
          },
        },
      })
      const anatomy = wrapper.findComponent({ name: 'HumanMuscleAnatomy' })
      expect(anatomy.props('gender')).toBe('female')
    })

    it('should default to male gender for other/prefer-not-to-say options', () => {
      const wrapperOther = createWrapper({
        muscleDistribution: mockMuscleDistribution,
        userProfile: {
          personalInfo: {
            gender: 'other',
          },
        },
      })
      const anatomyOther = wrapperOther.findComponent({ name: 'HumanMuscleAnatomy' })
      expect(anatomyOther.props('gender')).toBe('male')

      const wrapperPrefer = createWrapper({
        muscleDistribution: mockMuscleDistribution,
        userProfile: {
          personalInfo: {
            gender: 'prefer-not-to-say',
          },
        },
      })
      const anatomyPrefer = wrapperPrefer.findComponent({ name: 'HumanMuscleAnatomy' })
      expect(anatomyPrefer.props('gender')).toBe('male')
    })

    it('should pass opacity props', () => {
      const wrapper = createWrapper({ muscleDistribution: mockMuscleDistribution })
      const anatomy = wrapper.findComponent({ name: 'HumanMuscleAnatomy' })
      // Component sets primaryOpacity to 0.9
      expect(anatomy.props('primaryOpacity')).toBe(0.9)
    })

    it('should pass muscle groups arrays', () => {
      const wrapper = createWrapper({ muscleDistribution: mockMuscleDistribution })
      const anatomy = wrapper.findComponent({ name: 'HumanMuscleAnatomy' })
      // Component passes selectedPrimaryMuscleGroups (as allMuscles)
      const primaryMuscles = anatomy.props('selectedPrimaryMuscleGroups')
      expect(Array.isArray(primaryMuscles)).toBe(true)
      expect(primaryMuscles.length).toBeGreaterThan(0)
    })
  })

  describe('Responsive Behavior', () => {
    it('should apply responsive wrapper class', () => {
      const wrapper = createWrapper({ muscleDistribution: mockMuscleDistribution })
      const mapWrapper = wrapper.find('.muscle-map-wrapper')
      expect(mapWrapper.exists()).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle single muscle group', () => {
      const singleMuscle = [{ muscle: 'chest', value: 1000, percentage: 100 }]
      const wrapper = createWrapper({ muscleDistribution: singleMuscle })
      const anatomy = wrapper.find('[data-testid="human-anatomy"]')
      expect(anatomy.exists()).toBe(true)
    })

    it('should handle very small volumes', () => {
      const smallVolumes = [
        { muscle: 'chest', value: 10, percentage: 50 },
        { muscle: 'back', value: 10, percentage: 50 },
      ]
      const wrapper = createWrapper({ muscleDistribution: smallVolumes })
      const anatomy = wrapper.find('[data-testid="human-anatomy"]')
      expect(anatomy.exists()).toBe(true)
    })

    it('should handle very large volumes', () => {
      const largeVolumes = [
        { muscle: 'chest', value: 50000, percentage: 50 },
        { muscle: 'back', value: 50000, percentage: 50 },
      ]
      const wrapper = createWrapper({ muscleDistribution: largeVolumes })
      const text = wrapper.text()
      expect(text).toContain('50000') // Should show max volume
    })
  })
})
