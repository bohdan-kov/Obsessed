<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { estimateDuration } from '@/utils/templateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import MuscleGroupBadges from '@/pages/schedule/components/shared/MuscleGroupBadges.vue'
import { Play, MoreVertical, Eye, Edit, Copy, Trash2, ArrowRight, Dumbbell, Clock } from 'lucide-vue-next'

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
    relativeTime =
      locale.value === 'uk'
        ? `${minutes} ${minutes === 1 ? 'хвилину' : 'хвилин'} тому`
        : `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    relativeTime =
      locale.value === 'uk'
        ? `${hours} ${hours === 1 ? 'годину' : 'годин'} тому`
        : `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    relativeTime =
      locale.value === 'uk'
        ? `${days} ${days === 1 ? 'день' : 'днів'} тому`
        : `${days} ${days === 1 ? 'day' : 'days'} ago`
  } else if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800)
    relativeTime =
      locale.value === 'uk'
        ? `${weeks} ${weeks === 1 ? 'тиждень' : 'тижнів'} тому`
        : `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
  } else {
    const months = Math.floor(diffInSeconds / 2592000)
    relativeTime =
      locale.value === 'uk'
        ? `${months} ${months === 1 ? 'місяць' : 'місяців'} тому`
        : `${months} ${months === 1 ? 'month' : 'months'} ago`
  }

  return t('plans.list.lastUsed', { date: relativeTime })
})

// Extract muscle groups from exercises
const muscleGroups = computed(() => {
  if (!props.plan.exercises || props.plan.exercises.length === 0) {
    return []
  }
  const groups = new Set()
  props.plan.exercises.forEach(exercise => {
    if (exercise.muscleGroup) {
      groups.add(exercise.muscleGroup)
    }
  })
  return Array.from(groups)
})

// Calculate estimated duration using the same logic as templates
const estimatedDurationValue = computed(() => {
  return estimateDuration(props.plan.exercises || [])
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

  // Workout Plans page actions - full CRUD
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
  <Card class="group hover:shadow-lg transition-all duration-200">
    <CardHeader class="pb-3">
      <div class="flex items-start justify-between">
        <div class="flex-1 min-w-0 mr-2">
          <CardTitle class="text-lg line-clamp-1 mb-1">
            {{ plan.name }}
          </CardTitle>
          <p class="text-xs text-muted-foreground">
            {{ lastUsedText }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <Badge v-if="plan.usageCount > 0" variant="secondary" class="shrink-0">
            {{ plan.usageCount }}x
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8"
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
      </div>
    </CardHeader>

    <CardContent class="space-y-4">
      <!-- Muscle Groups -->
      <MuscleGroupBadges :muscle-groups="muscleGroups" :max="3" />

      <!-- Plan Stats -->
      <div class="flex items-center gap-4 text-sm text-muted-foreground">
        <div class="flex items-center gap-1">
          <Dumbbell class="w-4 h-4" />
          <span>{{ plan.exercises.length }}</span>
        </div>
        <div class="flex items-center gap-1">
          <Clock class="w-4 h-4" />
          <span>~{{ estimatedDurationValue }} {{ t('common.min') }}</span>
        </div>
      </div>

      <!-- Footer - horizontal layout with Start button -->
      <div class="flex items-center justify-between gap-3 pt-2 border-t">
        <!-- Last used text - takes natural width, doesn't shrink -->
        <p class="text-xs text-muted-foreground shrink-0">
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
