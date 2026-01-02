<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Play, MoreVertical, Eye, Edit, Copy, Trash2, ArrowRight } from 'lucide-vue-next'

const { t, locale } = useI18n()
const router = useRouter()

const props = defineProps({
  plan: {
    type: Object,
    required: true,
  },
  variant: {
    type: String,
    default: 'full',
    validator: (v) => ['full', 'simple'].includes(v),
  },
})

const emit = defineEmits(['start', 'view', 'edit', 'duplicate', 'delete'])

// Format last used date using relative time
const lastUsedText = computed(() => {
  if (!props.plan.lastUsedAt) {
    return t('plans.list.neverUsed')
  }

  // Handle Firebase serverTimestamp placeholder
  // These are temporary objects that get replaced with actual timestamps after Firestore writes
  if (
    props.plan.lastUsedAt &&
    typeof props.plan.lastUsedAt === 'object' &&
    '_methodName' in props.plan.lastUsedAt &&
    props.plan.lastUsedAt._methodName === 'serverTimestamp'
  ) {
    return t('plans.list.neverUsed') // Return placeholder until timestamp is resolved
  }

  // Handle Firebase Timestamp or regular Date
  let date
  try {
    if (props.plan.lastUsedAt.toDate && typeof props.plan.lastUsedAt.toDate === 'function') {
      date = props.plan.lastUsedAt.toDate()
    } else if (props.plan.lastUsedAt instanceof Date) {
      date = props.plan.lastUsedAt
    } else {
      date = new Date(props.plan.lastUsedAt)
    }

    // Validate the date is valid
    if (isNaN(date.getTime())) {
      if (import.meta.env.DEV) {
        console.warn('[PlanCard] Invalid lastUsedAt date:', props.plan.lastUsedAt)
      }
      return t('plans.list.neverUsed')
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[PlanCard] Error parsing lastUsedAt date:', error, props.plan.lastUsedAt)
    }
    return t('plans.list.neverUsed')
  }

  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)

  // Handle edge case where date is in the future (shouldn't happen, but be defensive)
  if (diffInSeconds < 0) {
    if (import.meta.env.DEV) {
      console.warn('[PlanCard] lastUsedAt is in the future:', props.plan.lastUsedAt)
    }
    return t('plans.list.neverUsed')
  }

  // Format relative time based on how long ago
  let relativeTime = ''
  if (diffInSeconds < 60) {
    relativeTime = locale.value === 'uk' ? 'щойно' : 'just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    relativeTime = locale.value === 'uk'
      ? `${minutes} ${minutes === 1 ? 'хвилину' : 'хвилин'} тому`
      : `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    relativeTime = locale.value === 'uk'
      ? `${hours} ${hours === 1 ? 'годину' : 'годин'} тому`
      : `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    relativeTime = locale.value === 'uk'
      ? `${days} ${days === 1 ? 'день' : 'днів'} тому`
      : `${days} ${days === 1 ? 'day' : 'days'} ago`
  } else if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800)
    relativeTime = locale.value === 'uk'
      ? `${weeks} ${weeks === 1 ? 'тиждень' : 'тижнів'} тому`
      : `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
  } else {
    const months = Math.floor(diffInSeconds / 2592000)
    relativeTime = locale.value === 'uk'
      ? `${months} ${months === 1 ? 'місяць' : 'місяців'} тому`
      : `${months} ${months === 1 ? 'month' : 'months'} ago`
  }

  return t('plans.list.lastUsed', { date: relativeTime })
})

// Exercise count text
const exerciseCountText = computed(() => {
  const count = props.plan.exercises?.length || 0
  if (count === 1) {
    return t('plans.list.exerciseCountOne')
  }
  return t('plans.list.exerciseCount', { count })
})

// Get first 3 exercise names for preview
const exercisePreview = computed(() => {
  if (!props.plan.exercises || props.plan.exercises.length === 0) {
    return []
  }
  return props.plan.exercises.slice(0, 3).map((ex) => ex.exerciseName)
})

const moreExercisesCount = computed(() => {
  const total = props.plan.exercises?.length || 0
  return total > 3 ? total - 3 : 0
})

// Dropdown actions based on variant
const dropdownActions = computed(() => {
  if (props.variant === 'simple') {
    // Dashboard actions - simplified for gym context
    return [
      {
        label: t('plans.card.viewDetails'),
        icon: Eye,
        onClick: () => emit('view', props.plan.id),
      },
      {
        label: t('plans.card.goToWorkouts'),
        icon: ArrowRight,
        onClick: () => router.push(`/workout-plans?highlight=${props.plan.id}`),
      },
    ]
  }

  // Workouts page actions - full CRUD
  return [
    {
      label: t('plans.card.viewDetails'),
      icon: Eye,
      onClick: () => emit('view', props.plan.id),
    },
    {
      label: t('plans.card.edit'),
      icon: Edit,
      onClick: () => emit('edit', props.plan.id),
    },
    {
      label: t('plans.card.duplicate'),
      icon: Copy,
      onClick: () => emit('duplicate', props.plan.id),
    },
    {
      label: t('plans.card.delete'),
      icon: Trash2,
      onClick: () => emit('delete', props.plan.id),
      isDestructive: true,
    },
  ]
})
</script>

<template>
  <Card class="hover:border-primary/50 transition-colors">
    <CardHeader class="pb-3">
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <CardTitle class="text-lg truncate">
            {{ plan.name }}
          </CardTitle>
          <p v-if="plan.description" class="text-sm text-muted-foreground mt-1 line-clamp-2">
            {{ plan.description }}
          </p>
        </div>

        <!-- Actions Dropdown -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8 -mr-2"
              :aria-label="t('plans.card.moreActions')"
            >
              <MoreVertical class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              v-for="(action, index) in dropdownActions"
              :key="index"
              @click="action.onClick"
              :class="{ 'text-destructive': action.isDestructive }"
            >
              <component :is="action.icon" class="mr-2 h-4 w-4" />
              {{ action.label }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardHeader>

    <CardContent class="space-y-4">
      <!-- Exercise Preview -->
      <div class="space-y-1">
        <p class="text-xs text-muted-foreground font-medium">
          {{ exerciseCountText }}
        </p>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="(exercise, index) in exercisePreview"
            :key="index"
            class="text-xs bg-muted px-2 py-1 rounded"
          >
            {{ exercise }}
          </span>
          <span v-if="moreExercisesCount > 0" class="text-xs text-muted-foreground px-2 py-1">
            +{{ moreExercisesCount }}
          </span>
        </div>
      </div>

      <!-- Footer - horizontal layout with flex sizing -->
      <div class="flex items-center justify-between gap-3 pt-2 border-t">
        <!-- Last used text - takes natural width, doesn't shrink -->
        <p class="text-xs text-muted-foreground flex-shrink-0">
          {{ lastUsedText }}
        </p>

        <!-- Start Workout button - icon only with tooltip -->
        <TooltipProvider :delay-duration="300">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                @click="emit('start', plan.id)"
                variant="ghost"
                size="icon"
                class="h-11 w-11 shrink-0"
                :aria-label="t('plans.card.startWorkoutWithPlan', { planName: plan.name })"
              >
                <Play class="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{{ t('plans.card.startWorkout') }}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </CardContent>
  </Card>
</template>
