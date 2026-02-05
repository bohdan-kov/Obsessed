<script setup>
import { ref, onMounted, onUnmounted, nextTick, provide, computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import { CONFIG } from '@/constants/config'
import { useOnboarding } from '@/composables/useOnboarding'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useExerciseStore } from '@/stores/exerciseStore'
import { generateMockExercises } from '@/utils/onboardingMockData'
import OnboardingDialog from './OnboardingDialog.vue'

const emit = defineEmits(['complete'])

const router = useRouter()
const { completeOnboarding } = useOnboarding()
const workoutStore = useWorkoutStore()
const analyticsStore = useAnalyticsStore()
const exerciseStore = useExerciseStore()

const STEP = {
  WELCOME: 'welcome',
  QUICK_LOG: 'quickLog',
  DASHBOARD: 'dashboard',
  ANALYTICS: 'analytics',
}

const showDialog = ref(false)
const currentStep = ref(0)
const wasCompleted = ref(false)
const onboardingQuickLogOpen = inject('onboardingQuickLogOpen', ref(false))
const onboardingActiveTab = ref(null)
provide('onboardingActiveTab', onboardingActiveTab)
const onboardingHighlight = ref(null)
provide('onboardingHighlight', onboardingHighlight)

const steps = [
  {
    step: 0,
    route: null,
    key: STEP.WELCOME,
  },
  {
    step: 1,
    route: null,
    key: STEP.QUICK_LOG,
  },
  {
    step: 2,
    route: '/',
    key: STEP.DASHBOARD,
  },
  {
    step: 3,
    route: '/analytics',
    key: STEP.ANALYTICS,
  },
]

const totalSteps = steps.length
const currentStepData = computed(() => steps[currentStep.value])

onMounted(async () => {
  await router.push('/')
  await new Promise((resolve) => setTimeout(resolve, CONFIG.onboarding.DELAY_BEFORE_SHOW))

  const mockExercises = generateMockExercises()
  exerciseStore.loadMockExercisesForOnboarding(mockExercises)
  await nextTick()

  workoutStore.loadMockWorkoutsForOnboarding()
  await nextTick()

  analyticsStore.initializePeriod()
  analyticsStore.setPeriod('last30Days')
  await nextTick()

  showDialog.value = true
})

onUnmounted(() => {
  if (!wasCompleted.value) {
    workoutStore.clearData()
    exerciseStore.loadMockExercisesForOnboarding([])
  }
})

async function handleNext() {
  if (currentStep.value < totalSteps - 1) {
    const nextStep = currentStep.value + 1

    switch (nextStep) {
      case 1:
        workoutStore.createMockActiveWorkout()
        await nextTick()
        onboardingQuickLogOpen.value = true
        break

      case 2:
        onboardingQuickLogOpen.value = false
        await router.push('/')
        await nextTick()
        break

      case 3:
        await router.push('/analytics')
        await nextTick()
        onboardingActiveTab.value = 'volume'
        break
    }

    currentStep.value = nextStep
    await new Promise((resolve) => setTimeout(resolve, CONFIG.onboarding.STEP_TRANSITION_DELAY))
  } else {
    await finishOnboarding()
  }
}

async function handleSkip() {
  await finishOnboarding()
}

async function finishOnboarding() {
  wasCompleted.value = true
  showDialog.value = false
  onboardingQuickLogOpen.value = false
  onboardingActiveTab.value = null
  onboardingHighlight.value = null

  workoutStore.clearData()
  exerciseStore.loadMockExercisesForOnboarding([])

  await completeOnboarding()
  await router.push('/')
  emit('complete')
}
</script>

<template>
  <OnboardingDialog
    :open="showDialog"
    :current-step="currentStep"
    :total-steps="totalSteps"
    :step-key="currentStepData.key"
    @next="handleNext"
    @skip="handleSkip"
  />
</template>
