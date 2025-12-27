import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick, ref, computed } from 'vue'

// Create mock refs for exercise store (used with storeToRefs)
const mockRecentExercises = ref([
  { id: 'ex-1', name: 'Bench Press', muscleGroups: ['Chest'] },
  { id: 'ex-2', name: 'Squat', muscleGroups: ['Legs'] },
])
const mockAllExercises = ref([
  { id: 'ex-1', name: 'Bench Press', muscleGroups: ['Chest'], category: 'compound' },
  { id: 'ex-2', name: 'Squat', muscleGroups: ['Legs'], category: 'compound' },
  { id: 'ex-3', name: 'Deadlift', muscleGroups: ['Back'], category: 'compound' },
])
const mockAddToRecent = vi.fn()

// Mock workout store state
const mockWorkoutStore = {
  activeWorkout: null,
  startWorkout: vi.fn().mockResolvedValue('new-workout-id'),
  addExercise: vi.fn().mockResolvedValue(),
  addSet: vi.fn().mockResolvedValue(),
}

// Mock localStorage before importing the component
const mockLocalStorageData = {}
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: vi.fn((key) => mockLocalStorageData[key] || null),
    setItem: vi.fn((key, value) => {
      mockLocalStorageData[key] = value
    }),
    removeItem: vi.fn((key) => {
      delete mockLocalStorageData[key]
    }),
    clear: vi.fn(() => {
      Object.keys(mockLocalStorageData).forEach((key) => delete mockLocalStorageData[key])
    }),
  },
  writable: true,
})

// Mock the stores completely BEFORE importing
vi.mock('@/stores/workoutStore', () => ({
  useWorkoutStore: vi.fn(() => mockWorkoutStore),
}))

vi.mock('@/stores/exerciseStore', () => ({
  useExerciseStore: vi.fn(() => ({
    recentExercises: mockRecentExercises,
    allExercises: mockAllExercises,
    addToRecent: mockAddToRecent,
    getExerciseDisplayName: vi.fn((exercise) => exercise?.name || ''),
    getExerciseDescription: vi.fn((exercise) => exercise?.description || ''),
  })),
}))

// Now import the component
import QuickLogSheet from '@/components/QuickLogSheet.vue'

// Mock lucide-vue-next icons
vi.mock('lucide-vue-next', () => ({
  ChevronLeft: {
    name: 'ChevronLeft',
    template: '<svg data-testid="chevron-left-icon"></svg>',
  },
  Check: {
    name: 'Check',
    template: '<svg data-testid="check-icon"></svg>',
  },
  Loader2: {
    name: 'Loader2',
    template: '<svg data-testid="loader-icon" class="animate-spin"></svg>',
  },
}))

// Mock Sheet UI components
vi.mock('@/components/ui/sheet', () => ({
  Sheet: {
    name: 'Sheet',
    props: ['open'],
    emits: ['update:open'],
    template: `<div v-if="open" data-testid="sheet"><slot /></div>`,
    setup(props, { emit }) {
      return {
        emitClose: () => emit('update:open', false),
      }
    },
  },
  SheetContent: {
    name: 'SheetContent',
    template: '<div class="sheet-content"><slot /></div>',
  },
  SheetHeader: {
    name: 'SheetHeader',
    template: '<div class="sheet-header"><slot /></div>',
  },
  SheetTitle: {
    name: 'SheetTitle',
    template: '<h2 class="sheet-title"><slot /></h2>',
  },
  SheetDescription: {
    name: 'SheetDescription',
    template: '<p class="sheet-description"><slot /></p>',
  },
  SheetFooter: {
    name: 'SheetFooter',
    template: '<div class="sheet-footer"><slot /></div>',
  },
}))

// Mock Button component
vi.mock('@/components/ui/button', () => ({
  Button: {
    name: 'Button',
    props: ['variant', 'size', 'disabled'],
    emits: ['click'],
    template:
      '<button :disabled="disabled" :data-variant="variant" :data-size="size" @click="$emit(\'click\')"><slot /></button>',
  },
}))

// Mock Input component
vi.mock('@/components/ui/input', () => ({
  Input: {
    name: 'Input',
    props: ['modelValue', 'type', 'inputmode', 'placeholder', 'id', 'min', 'max'],
    emits: ['update:modelValue'],
    template:
      '<input :id="id" :type="type" :value="modelValue" :placeholder="placeholder" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
}))

// Mock Label component - use props for the "for" attribute
vi.mock('@/components/ui/label', () => ({
  Label: {
    name: 'Label',
    props: ['for', 'htmlFor'],
    template: '<label :for="$props.for || $props.htmlFor"><slot /></label>',
  },
}))

// Mock Command components
vi.mock('@/components/ui/command', () => ({
  Command: {
    name: 'Command',
    template: '<div class="command"><slot /></div>',
  },
  CommandInput: {
    name: 'CommandInput',
    props: ['placeholder'],
    template: '<input class="command-input" :placeholder="placeholder" data-testid="search-input" />',
  },
  CommandList: {
    name: 'CommandList',
    template: '<div class="command-list"><slot /></div>',
  },
  CommandEmpty: {
    name: 'CommandEmpty',
    template: '<div class="command-empty"><slot /></div>',
  },
  CommandGroup: {
    name: 'CommandGroup',
    props: ['heading'],
    template: '<div class="command-group" :data-heading="heading"><slot /></div>',
  },
  CommandItem: {
    name: 'CommandItem',
    props: ['value'],
    emits: ['select'],
    template: '<div class="command-item" :data-value="value" @click="$emit(\'select\')"><slot /></div>',
  },
}))

// Import the mocked stores
import { useWorkoutStore } from '@/stores/workoutStore'
import { useExerciseStore } from '@/stores/exerciseStore'

describe('QuickLogSheet', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // Reset localStorage mock data
    Object.keys(mockLocalStorageData).forEach((key) => delete mockLocalStorageData[key])

    // Reset workout store state
    mockWorkoutStore.activeWorkout = null
    mockWorkoutStore.startWorkout = vi.fn().mockResolvedValue('new-workout-id')
    mockWorkoutStore.addExercise = vi.fn().mockResolvedValue()
    mockWorkoutStore.addSet = vi.fn().mockResolvedValue()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * Factory function to create wrapper with common setup
   */
  function createWrapper(options = {}) {
    return mount(QuickLogSheet, {
      props: {
        open: true,
        ...options.props,
      },
      global: {
        stubs: {
          teleport: true,
        },
        ...options.global,
      },
      ...options,
    })
  }

  describe('initial render', () => {
    it('should render when open prop is true', () => {
      const wrapper = createWrapper({ props: { open: true } })
      expect(wrapper.find('[data-testid="sheet"]').exists()).toBe(true)
    })

    it('should not render when open prop is false', () => {
      const wrapper = createWrapper({ props: { open: false } })
      expect(wrapper.find('[data-testid="sheet"]').exists()).toBe(false)
    })

    it('should start on exercise selection step', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.sheet-title').text()).toBe('workout.quickLog.title')
      expect(wrapper.find('.sheet-description').text()).toBe('workout.quickLog.selectExercise')
    })

    it('should render search input for exercises', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('[data-testid="search-input"]').exists()).toBe(true)
    })

    it('should render command component for exercise selection', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.command').exists()).toBe(true)
    })
  })

  describe('recent exercises display', () => {
    it('should display recent exercises group when available', () => {
      const wrapper = createWrapper()
      const recentGroup = wrapper.find('[data-heading="workout.quickLog.recent"]')
      expect(recentGroup.exists()).toBe(true)
    })

    it('should display all exercises group', () => {
      const wrapper = createWrapper()
      const allGroup = wrapper.find('[data-heading="workout.quickLog.allExercises"]')
      expect(allGroup.exists()).toBe(true)
    })

    it('should render exercise items', () => {
      const wrapper = createWrapper()
      const exerciseItems = wrapper.findAll('.command-item')
      expect(exerciseItems.length).toBeGreaterThan(0)
    })
  })

  describe('exercise selection flow', () => {
    it('should navigate to details step when exercise is selected', async () => {
      const wrapper = createWrapper()

      const exerciseItem = wrapper.find('.command-item')
      await exerciseItem.trigger('click')
      await nextTick()

      expect(wrapper.find('.sheet-description').text()).toBe('workout.quickLog.enterDetails')
    })

    it('should show selected exercise name in title when on details step', async () => {
      const wrapper = createWrapper()

      const exerciseItem = wrapper.find('.command-item')
      await exerciseItem.trigger('click')
      await nextTick()

      expect(wrapper.find('.sheet-title').exists()).toBe(true)
    })

    it('should show back button on details step', async () => {
      const wrapper = createWrapper()

      const exerciseItem = wrapper.find('.command-item')
      await exerciseItem.trigger('click')
      await nextTick()

      expect(wrapper.find('[data-testid="chevron-left-icon"]').exists()).toBe(true)
    })

    it('should navigate back to exercise selection when back button clicked', async () => {
      const wrapper = createWrapper()

      // Go to details step
      const exerciseItem = wrapper.find('.command-item')
      await exerciseItem.trigger('click')
      await nextTick()

      // Click back button
      const backButton = wrapper.find('button[data-variant="ghost"]')
      await backButton.trigger('click')
      await nextTick()

      // Should be back on exercise step
      expect(wrapper.find('.sheet-title').text()).toBe('workout.quickLog.title')
    })
  })

  describe('form inputs on details step', () => {
    async function goToDetailsStep(wrapper) {
      const exerciseItem = wrapper.find('.command-item')
      await exerciseItem.trigger('click')
      await nextTick()
    }

    it('should render weight input', async () => {
      const wrapper = createWrapper()
      await goToDetailsStep(wrapper)

      const weightInput = wrapper.find('#weight')
      expect(weightInput.exists()).toBe(true)
    })

    it('should render reps input', async () => {
      const wrapper = createWrapper()
      await goToDetailsStep(wrapper)

      const repsInput = wrapper.find('#reps')
      expect(repsInput.exists()).toBe(true)
    })

    it('should render RPE input', async () => {
      const wrapper = createWrapper()
      await goToDetailsStep(wrapper)

      const rpeInput = wrapper.find('#rpe')
      expect(rpeInput.exists()).toBe(true)
    })

    it('should update weight value on input', async () => {
      const wrapper = createWrapper()
      await goToDetailsStep(wrapper)

      const weightInput = wrapper.find('#weight')
      await weightInput.setValue('100')

      expect(weightInput.element.value).toBe('100')
    })

    it('should update reps value on input', async () => {
      const wrapper = createWrapper()
      await goToDetailsStep(wrapper)

      const repsInput = wrapper.find('#reps')
      await repsInput.setValue('10')

      expect(repsInput.element.value).toBe('10')
    })

    it('should update RPE value on input', async () => {
      const wrapper = createWrapper()
      await goToDetailsStep(wrapper)

      const rpeInput = wrapper.find('#rpe')
      await rpeInput.setValue('8')

      expect(rpeInput.element.value).toBe('8')
    })
  })

  describe('form validation', () => {
    async function goToDetailsStep(wrapper) {
      const exerciseItem = wrapper.find('.command-item')
      await exerciseItem.trigger('click')
      await nextTick()
    }

    it('should disable submit button when form is incomplete', async () => {
      const wrapper = createWrapper()
      await goToDetailsStep(wrapper)

      const submitButton = wrapper.find('.sheet-footer button')
      expect(submitButton.attributes('disabled')).toBeDefined()
    })

    it('should disable submit button when only weight is filled', async () => {
      const wrapper = createWrapper()
      await goToDetailsStep(wrapper)

      const weightInput = wrapper.find('#weight')
      await weightInput.setValue('100')
      await nextTick()

      const submitButton = wrapper.find('.sheet-footer button')
      expect(submitButton.attributes('disabled')).toBeDefined()
    })

    it('should disable submit button when only reps is filled', async () => {
      const wrapper = createWrapper()
      await goToDetailsStep(wrapper)

      const repsInput = wrapper.find('#reps')
      await repsInput.setValue('10')
      await nextTick()

      const submitButton = wrapper.find('.sheet-footer button')
      expect(submitButton.attributes('disabled')).toBeDefined()
    })

    it('should enable submit button when weight and reps are filled', async () => {
      const wrapper = createWrapper()
      await goToDetailsStep(wrapper)

      const weightInput = wrapper.find('#weight')
      const repsInput = wrapper.find('#reps')

      await weightInput.setValue('100')
      await repsInput.setValue('10')
      await nextTick()

      const submitButton = wrapper.find('.sheet-footer button')
      expect(submitButton.attributes('disabled')).toBeUndefined()
    })

    it('should not require RPE for form validity', async () => {
      const wrapper = createWrapper()
      await goToDetailsStep(wrapper)

      const weightInput = wrapper.find('#weight')
      const repsInput = wrapper.find('#reps')

      await weightInput.setValue('100')
      await repsInput.setValue('10')
      // RPE left empty
      await nextTick()

      const submitButton = wrapper.find('.sheet-footer button')
      expect(submitButton.attributes('disabled')).toBeUndefined()
    })
  })

  describe('localStorage for last weight', () => {
    async function goToDetailsStep(wrapper) {
      const exerciseItem = wrapper.find('.command-item')
      await exerciseItem.trigger('click')
      await nextTick()
    }

    it('should pre-fill weight from localStorage', async () => {
      mockLocalStorageData['obsessed_lastWeight'] = '80'

      const wrapper = createWrapper()
      await goToDetailsStep(wrapper)
      await nextTick()

      const weightInput = wrapper.find('#weight')
      expect(weightInput.element.value).toBe('80')
    })

    it('should start with empty weight if no localStorage value', async () => {
      const wrapper = createWrapper()
      await goToDetailsStep(wrapper)

      const weightInput = wrapper.find('#weight')
      expect(weightInput.element.value).toBe('')
    })
  })

  describe('submit behavior', () => {
    async function setupForSubmit(wrapper) {
      const exerciseItem = wrapper.find('.command-item')
      await exerciseItem.trigger('click')
      await nextTick()

      const weightInput = wrapper.find('#weight')
      const repsInput = wrapper.find('#reps')

      await weightInput.setValue('100')
      await repsInput.setValue('10')
      await nextTick()
    }

    it('should call workoutStore.startWorkout if no active workout', async () => {
      // Mock startWorkout to set activeWorkout after being called
      mockWorkoutStore.startWorkout = vi.fn().mockImplementation(async () => {
        mockWorkoutStore.activeWorkout = {
          id: 'new-workout-id',
          exercises: [],
        }
        return 'new-workout-id'
      })

      const wrapper = createWrapper()

      await setupForSubmit(wrapper)

      const submitButton = wrapper.find('.sheet-footer button')
      await submitButton.trigger('click')
      await flushPromises()

      expect(mockWorkoutStore.startWorkout).toHaveBeenCalled()
    })

    it('should emit update:open with false after successful submit', async () => {
      // Setup store with active workout
      mockWorkoutStore.activeWorkout = {
        id: 'workout-1',
        exercises: [{ exerciseId: 'ex-1', sets: [] }],
      }

      const wrapper = createWrapper()

      await setupForSubmit(wrapper)

      const submitButton = wrapper.find('.sheet-footer button')
      await submitButton.trigger('click')
      await flushPromises()

      expect(wrapper.emitted('update:open')).toBeTruthy()
      expect(wrapper.emitted('update:open')[0]).toEqual([false])
    })

    it('should save weight to localStorage after successful submit', async () => {
      mockWorkoutStore.activeWorkout = {
        id: 'workout-1',
        exercises: [{ exerciseId: 'ex-1', sets: [] }],
      }

      const wrapper = createWrapper()

      await setupForSubmit(wrapper)

      const submitButton = wrapper.find('.sheet-footer button')
      await submitButton.trigger('click')
      await flushPromises()

      expect(localStorage.setItem).toHaveBeenCalledWith('obsessed_lastWeight', '100')
    })

    it('should call exerciseStore.addToRecent after successful submit', async () => {
      mockWorkoutStore.activeWorkout = {
        id: 'workout-1',
        exercises: [{ exerciseId: 'ex-1', sets: [] }],
      }

      const wrapper = createWrapper()

      await setupForSubmit(wrapper)

      const submitButton = wrapper.find('.sheet-footer button')
      await submitButton.trigger('click')
      await flushPromises()

      expect(mockAddToRecent).toHaveBeenCalled()
    })
  })

  describe('loading state', () => {
    async function setupForSubmit(wrapper) {
      const exerciseItem = wrapper.find('.command-item')
      await exerciseItem.trigger('click')
      await nextTick()

      const weightInput = wrapper.find('#weight')
      const repsInput = wrapper.find('#reps')

      await weightInput.setValue('100')
      await repsInput.setValue('10')
      await nextTick()
    }

    it('should show loader icon during save', async () => {
      let resolveAddSet
      const addSetPromise = new Promise((resolve) => {
        resolveAddSet = resolve
      })

      mockWorkoutStore.activeWorkout = {
        id: 'workout-1',
        exercises: [{ exerciseId: 'ex-1', sets: [] }],
      }
      mockWorkoutStore.addSet = vi.fn().mockReturnValue(addSetPromise)

      const wrapper = createWrapper()

      await setupForSubmit(wrapper)

      const submitButton = wrapper.find('.sheet-footer button')
      submitButton.trigger('click')
      await nextTick()

      // Should show loader
      expect(wrapper.find('[data-testid="loader-icon"]').exists()).toBe(true)

      // Resolve the promise
      resolveAddSet()
      await flushPromises()
    })

    it('should disable submit button during save', async () => {
      let resolveAddSet
      const addSetPromise = new Promise((resolve) => {
        resolveAddSet = resolve
      })

      mockWorkoutStore.activeWorkout = {
        id: 'workout-1',
        exercises: [{ exerciseId: 'ex-1', sets: [] }],
      }
      mockWorkoutStore.addSet = vi.fn().mockReturnValue(addSetPromise)

      const wrapper = createWrapper()

      await setupForSubmit(wrapper)

      const submitButton = wrapper.find('.sheet-footer button')
      submitButton.trigger('click')
      await nextTick()

      // Button should be disabled
      expect(submitButton.attributes('disabled')).toBeDefined()

      resolveAddSet()
      await flushPromises()
    })
  })

  describe('error handling', () => {
    async function setupForSubmit(wrapper) {
      const exerciseItem = wrapper.find('.command-item')
      await exerciseItem.trigger('click')
      await nextTick()

      const weightInput = wrapper.find('#weight')
      const repsInput = wrapper.find('#reps')

      await weightInput.setValue('100')
      await repsInput.setValue('10')
      await nextTick()
    }

    it('should handle error when addSet fails', async () => {
      mockWorkoutStore.activeWorkout = {
        id: 'workout-1',
        exercises: [{ exerciseId: 'ex-1', sets: [] }],
      }
      mockWorkoutStore.addSet = vi.fn().mockRejectedValue(new Error('Network error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const wrapper = createWrapper()

      await setupForSubmit(wrapper)

      const submitButton = wrapper.find('.sheet-footer button')
      await submitButton.trigger('click')
      await flushPromises()

      expect(consoleSpy).toHaveBeenCalledWith('[QuickLogSheet] Failed to save set:', expect.any(Error))

      consoleSpy.mockRestore()
    })

    it('should reset saving state after error', async () => {
      mockWorkoutStore.activeWorkout = {
        id: 'workout-1',
        exercises: [{ exerciseId: 'ex-1', sets: [] }],
      }
      mockWorkoutStore.addSet = vi.fn().mockRejectedValue(new Error('Network error'))
      vi.spyOn(console, 'error').mockImplementation(() => {})

      const wrapper = createWrapper()

      await setupForSubmit(wrapper)

      const submitButton = wrapper.find('.sheet-footer button')
      await submitButton.trigger('click')
      await flushPromises()

      // Button should no longer show loading
      expect(wrapper.find('[data-testid="loader-icon"]').exists()).toBe(false)
    })
  })

  describe('addExercise integration', () => {
    async function goToDetailsStep(wrapper) {
      const exerciseItem = wrapper.find('.command-item')
      await exerciseItem.trigger('click')
      await nextTick()
    }

    it('should add exercise to workout if not already present', async () => {
      mockWorkoutStore.activeWorkout = {
        id: 'workout-1',
        exercises: [], // No exercises yet
      }

      const wrapper = createWrapper()

      await goToDetailsStep(wrapper)

      const weightInput = wrapper.find('#weight')
      const repsInput = wrapper.find('#reps')
      await weightInput.setValue('100')
      await repsInput.setValue('10')
      await nextTick()

      const submitButton = wrapper.find('.sheet-footer button')
      await submitButton.trigger('click')
      await flushPromises()

      expect(mockWorkoutStore.addExercise).toHaveBeenCalled()
    })

    it('should not add exercise if already in workout', async () => {
      mockWorkoutStore.activeWorkout = {
        id: 'workout-1',
        exercises: [
          {
            exerciseId: 'ex-1', // Same as selected exercise
            exerciseName: 'Bench Press',
            sets: [],
          },
        ],
      }

      const wrapper = createWrapper()

      await goToDetailsStep(wrapper)

      const weightInput = wrapper.find('#weight')
      const repsInput = wrapper.find('#reps')
      await weightInput.setValue('100')
      await repsInput.setValue('10')
      await nextTick()

      const submitButton = wrapper.find('.sheet-footer button')
      await submitButton.trigger('click')
      await flushPromises()

      // addExercise should not be called since exercise is already in workout
      expect(mockWorkoutStore.addExercise).not.toHaveBeenCalled()
    })
  })

  describe('RPE handling', () => {
    async function goToDetailsStep(wrapper) {
      const exerciseItem = wrapper.find('.command-item')
      await exerciseItem.trigger('click')
      await nextTick()
    }

    it('should pass null RPE when not provided', async () => {
      mockWorkoutStore.activeWorkout = {
        id: 'workout-1',
        exercises: [{ exerciseId: 'ex-1', sets: [] }],
      }

      const wrapper = createWrapper()

      await goToDetailsStep(wrapper)

      const weightInput = wrapper.find('#weight')
      const repsInput = wrapper.find('#reps')
      await weightInput.setValue('100')
      await repsInput.setValue('10')
      // RPE left empty
      await nextTick()

      const submitButton = wrapper.find('.sheet-footer button')
      await submitButton.trigger('click')
      await flushPromises()

      expect(mockWorkoutStore.addSet).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          rpe: null,
        })
      )
    })

    it('should pass integer RPE when provided', async () => {
      mockWorkoutStore.activeWorkout = {
        id: 'workout-1',
        exercises: [{ exerciseId: 'ex-1', sets: [] }],
      }

      const wrapper = createWrapper()

      await goToDetailsStep(wrapper)

      const weightInput = wrapper.find('#weight')
      const repsInput = wrapper.find('#reps')
      const rpeInput = wrapper.find('#rpe')

      await weightInput.setValue('100')
      await repsInput.setValue('10')
      await rpeInput.setValue('8')
      await nextTick()

      const submitButton = wrapper.find('.sheet-footer button')
      await submitButton.trigger('click')
      await flushPromises()

      expect(mockWorkoutStore.addSet).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          rpe: 8,
        })
      )
    })
  })

  describe('accessibility', () => {
    it('should have labeled inputs', async () => {
      const wrapper = createWrapper()

      // Go to details step
      const exerciseItem = wrapper.find('.command-item')
      await exerciseItem.trigger('click')
      await nextTick()

      const weightLabel = wrapper.find('label[for="weight"]')
      const repsLabel = wrapper.find('label[for="reps"]')
      const rpeLabel = wrapper.find('label[for="rpe"]')

      expect(weightLabel.exists()).toBe(true)
      expect(repsLabel.exists()).toBe(true)
      expect(rpeLabel.exists()).toBe(true)
    })

    it('should have proper input types', async () => {
      const wrapper = createWrapper()

      const exerciseItem = wrapper.find('.command-item')
      await exerciseItem.trigger('click')
      await nextTick()

      const weightInput = wrapper.find('#weight')
      const repsInput = wrapper.find('#reps')
      const rpeInput = wrapper.find('#rpe')

      expect(weightInput.attributes('type')).toBe('number')
      expect(repsInput.attributes('type')).toBe('number')
      expect(rpeInput.attributes('type')).toBe('number')
    })
  })
})
