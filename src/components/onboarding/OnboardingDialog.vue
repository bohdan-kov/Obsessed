<script setup>
import { computed, onMounted, onUnmounted, ref, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Zap, TrendingUp, HandHeart, BarChart3 } from 'lucide-vue-next'

const { t } = useI18n()

const TRANSITION_DURATION = 600 // ms - CSS animation duration
const FOCUS_DELAY = 50 // ms - DOM update delay

const props = defineProps({
  open: {
    type: Boolean,
    required: true,
  },
  currentStep: {
    type: Number,
    required: true,
  },
  totalSteps: {
    type: Number,
    required: true,
  },
  stepKey: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['next', 'skip'])

const nextButtonRef = ref(null)
const confirmContinueButtonRef = ref(null)
const previousActiveElement = ref(null)
const previousActiveElementBeforeConfirm = ref(null)
const showConfirm = ref(false)
const isFirstMount = ref(true)
const isTransitioning = ref(false)
const isEnterTransitionActive = ref(false)
const isConfirmEnterTransitionActive = ref(false)

watch(() => props.currentStep, async (_newStep, oldStep) => {
  if (oldStep === undefined) return

  isTransitioning.value = true
  await new Promise(resolve => setTimeout(resolve, TRANSITION_DURATION))
  isTransitioning.value = false
})

const iconMap = {
  welcome: HandHeart,
  quickLog: Zap,
  dashboard: TrendingUp,
  analytics: BarChart3,
}

const currentIcon = computed(() => iconMap[props.stepKey] || Zap)
const currentTitle = computed(() => t(`onboarding.steps.${props.stepKey}.title`))
const currentDescription = computed(() => t(`onboarding.steps.${props.stepKey}.description`))
const isLastStep = computed(() => props.currentStep === props.totalSteps - 1)
const progressText = computed(() => t('onboarding.progress', {
  current: props.currentStep + 1,
  total: props.totalSteps,
}))

/**
 * Helper: Blur active element and schedule callback after DOM update
 * Prevents aria-hidden conflict by ensuring focus is removed before state changes
 * Solution from: https://github.com/shadcn-ui/ui/issues/5953
 */
function blurAndSchedule(callback) {
  document.activeElement?.blur?.()
  requestAnimationFrame(callback)
}

function handleNext() {
  blurAndSchedule(() => emit('next'))
}

function handleSkip() {
  blurAndSchedule(() => { showConfirm.value = true })
}

function confirmExit() {
  blurAndSchedule(() => {
    showConfirm.value = false
    emit('skip')
  })
}

function cancelExit() {
  blurAndSchedule(() => { showConfirm.value = false })
}

/**
 * Helper: Restore focus to element if it exists
 */
function restoreFocus(elementRef) {
  elementRef.value?.focus?.()
}

async function handleDialogEnter() {
  isEnterTransitionActive.value = false

  if (isFirstMount.value) {
    previousActiveElement.value = document.activeElement
    isFirstMount.value = false

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, FOCUS_DELAY))

    nextButtonRef.value?.$el?.focus()
  }
}

function handleDialogBeforeEnter() {
  isEnterTransitionActive.value = true
}

function handleDialogLeave() {
  restoreFocus(previousActiveElement)
  previousActiveElement.value = null
}

function handleConfirmDialogBeforeEnter() {
  isConfirmEnterTransitionActive.value = true
}

async function handleConfirmDialogEnter() {
  isConfirmEnterTransitionActive.value = false
  previousActiveElementBeforeConfirm.value = document.activeElement
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, FOCUS_DELAY))
  confirmContinueButtonRef.value?.$el?.focus()
}

function handleConfirmDialogLeave() {
  restoreFocus(previousActiveElementBeforeConfirm)
  previousActiveElementBeforeConfirm.value = null
}

function handleEscKey(event) {
  if (event.key === 'Escape' && props.open && !showConfirm.value) {
    event.preventDefault()
    handleSkip()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscKey)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscKey)
  restoreFocus(previousActiveElement)
})
</script>

<template>
  <Transition name="backdrop-fade">
    <div
      v-if="open && currentStep === 0"
      class="onboarding-backdrop"
      aria-hidden="true"
      inert
    />
  </Transition>

  <Transition
    name="slide-up"
    @before-enter="handleDialogBeforeEnter"
    @after-enter="handleDialogEnter"
    @before-leave="handleDialogLeave"
  >
    <div
      v-if="open"
      :class="[
        'onboarding-dialog-container',
        currentStep === 0 ? 'onboarding-dialog-container--center' : 'onboarding-dialog-container--bottom',
      ]"
      :role="currentStep === 0 ? 'dialog' : 'region'"
      :aria-modal="currentStep === 0 ? 'true' : undefined"
      aria-labelledby="onboarding-title"
      aria-describedby="onboarding-description"
      :inert="isTransitioning || isEnterTransitionActive || showConfirm"
    >
      <div class="onboarding-dialog">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <component
              :is="currentIcon"
              class="w-5 h-5 text-primary"
              aria-hidden="true"
            />
            <span class="text-xs text-muted-foreground font-medium">
              {{ progressText }}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            class="min-h-11 px-3 text-xs"
            @mousedown.prevent
            @click="handleSkip"
          >
            {{ t('onboarding.skip') }}
          </Button>
        </div>

        <div class="space-y-2 mb-6">
          <h2 id="onboarding-title" class="text-xl font-semibold">
            {{ currentTitle }}
          </h2>
          <p id="onboarding-description" class="text-base leading-relaxed text-muted-foreground">
            {{ currentDescription }}
          </p>
        </div>

        <Button
          ref="nextButtonRef"
          class="w-full min-h-11"
          @mousedown.prevent
          @click="handleNext"
        >
          {{ isLastStep ? t('onboarding.getStarted') : t('onboarding.next') }}
        </Button>
      </div>
    </div>
  </Transition>

  <Transition name="backdrop-fade">
    <div
      v-if="showConfirm"
      class="confirm-backdrop"
      @click="cancelExit"
      aria-hidden="true"
      inert
    />
  </Transition>

  <Transition
    name="slide-up"
    @before-enter="handleConfirmDialogBeforeEnter"
    @after-enter="handleConfirmDialogEnter"
    @before-leave="handleConfirmDialogLeave"
  >
    <div
      v-if="showConfirm"
      class="confirm-dialog-container"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-description"
      :inert="isConfirmEnterTransitionActive"
    >
      <div class="confirm-dialog">
        <h3 id="confirm-title" class="text-lg font-semibold mb-2">
          {{ t('onboarding.confirmExit.title') }}
        </h3>
        <p id="confirm-description" class="text-sm text-muted-foreground mb-6">
          {{ t('onboarding.confirmExit.description') }}
        </p>

        <div class="flex gap-3">
          <Button
            variant="outline"
            class="flex-1"
            @mousedown.prevent
            @click="confirmExit"
          >
            {{ t('onboarding.confirmExit.exit') }}
          </Button>
          <Button
            ref="confirmContinueButtonRef"
            class="flex-1"
            @mousedown.prevent
            @click="cancelExit"
          >
            {{ t('onboarding.confirmExit.continue') }}
          </Button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.onboarding-backdrop {
  position: fixed;
  inset: 0;
  background: hsl(var(--background) / 0.8);
  backdrop-filter: blur(4px);
  z-index: 69;
  pointer-events: auto;
}

.backdrop-fade-enter-active {
  transition: opacity 0.3s ease-out;
}

.backdrop-fade-leave-active {
  transition: opacity 0.5s ease-out;
}

.backdrop-fade-enter-from,
.backdrop-fade-leave-to {
  opacity: 0;
}

.onboarding-dialog-container {
  position: fixed;
  z-index: 70;
  width: 90vw;
  max-width: 500px;
  pointer-events: auto;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.onboarding-dialog-container--center {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.onboarding-dialog-container--bottom {
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
}

.onboarding-dialog {
  background: hsl(var(--card) / 0.95);
  backdrop-filter: blur(8px);
  border: 1px solid hsl(var(--border));
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 10px 40px -10px hsl(var(--foreground) / 0.15),
              0 2px 8px -2px hsl(var(--foreground) / 0.1);
}

.slide-up-enter-active {
  animation: slide-up 0.3s ease-out;
}

.slide-up-leave-active {
  animation: slide-up 0.2s ease-in reverse;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 640px) {
  .onboarding-dialog-container--bottom {
    bottom: 80px;
    width: 90vw;
    max-width: none;
  }

  .onboarding-dialog {
    padding: 1.25rem;
  }
}

.confirm-backdrop {
  position: fixed;
  inset: 0;
  background: hsl(var(--background) / 0.9);
  backdrop-filter: blur(8px);
  z-index: 80;
  pointer-events: auto;
}

.confirm-dialog-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 81;
  width: 90vw;
  max-width: 400px;
  pointer-events: auto;
}

.confirm-dialog {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 20px 60px -10px hsl(var(--foreground) / 0.25),
              0 4px 12px -2px hsl(var(--foreground) / 0.15);
}

@media (prefers-reduced-motion: reduce) {
  .onboarding-dialog-container {
    transition: opacity 0.2s ease;
  }

  .backdrop-fade-enter-active,
  .backdrop-fade-leave-active {
    transition: opacity 0.2s ease;
  }

  .slide-up-enter-active,
  .slide-up-leave-active {
    animation: none;
    transition: opacity 0.1s ease;
  }
}
</style>
