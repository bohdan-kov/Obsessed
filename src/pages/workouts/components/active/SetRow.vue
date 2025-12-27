<template>
  <div class="flex items-center gap-3 rounded-lg border p-3">
    <!-- Set Number -->
    <div
      class="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold"
    >
      {{ setNumber }}
    </div>

    <!-- Set Details -->
    <div class="flex-1">
      <div class="flex items-center gap-2">
        <span class="font-medium">{{ formattedWeight }} × {{ set.reps }}</span>

        <!-- Type Badge (if not normal) -->
        <Badge v-if="set.type !== 'normal'" variant="secondary" class="text-xs">
          {{ t(`workout.activeWorkout.set.types.${set.type}`) }}
        </Badge>

        <!-- RPE Badge -->
        <Badge v-if="set.rpe" :class="rpeBadgeClass" class="text-xs">
          RPE {{ set.rpe }}
        </Badge>
      </div>

      <!-- Timestamp -->
      <div class="text-xs text-muted-foreground">
        {{ formattedTime }}
      </div>
    </div>

    <!-- Delete Button -->
    <Button
      variant="ghost"
      size="icon"
      class="h-11 w-11 text-destructive"
      @click="$emit('delete')"
    >
      <Trash2 class="h-5 w-5" />
    </Button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUnits } from '@/composables/useUnits'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-vue-next'
import { CONFIG } from '@/constants/config'

const props = defineProps({
  set: {
    type: Object,
    required: true,
  },
  setNumber: {
    type: Number,
    required: true,
  },
})

defineEmits(['delete'])

const { t } = useI18n()
const { formatWeight } = useUnits()

// Format weight with user's preferred unit
const formattedWeight = computed(() => {
  return formatWeight(props.set.weight)
})

// RPE badge color based on value
const rpeBadgeClass = computed(() => {
  if (!props.set.rpe) return ''

  if (props.set.rpe <= CONFIG.rpe.LOW_MAX) {
    return 'bg-green-500 text-white'
  } else if (props.set.rpe <= CONFIG.rpe.MEDIUM_MAX) {
    return 'bg-yellow-500 text-white'
  } else {
    return 'bg-red-500 text-white'
  }
})

// Format timestamp
const formattedTime = computed(() => {
  const completedAt = props.set.completedAt

  // Handle missing timestamp
  if (!completedAt) return ''

  try {
    let date

    // Handle Firestore Timestamp object
    if (completedAt.toDate && typeof completedAt.toDate === 'function') {
      date = completedAt.toDate()
    }
    // Handle Date object
    else if (completedAt instanceof Date) {
      date = completedAt
    }
    // Handle ISO string
    else if (typeof completedAt === 'string') {
      date = new Date(completedAt)
    }
    // Handle unknown format
    else {
      if (import.meta.env.DEV) {
        console.warn('[SetRow] Unknown timestamp format:', completedAt)
      }
      return ''
    }

    // Validate date
    if (isNaN(date.getTime())) {
      if (import.meta.env.DEV) {
        console.warn('[SetRow] Invalid date:', completedAt)
      }
      return ''
    }

    return new Intl.DateTimeFormat('default', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[SetRow] Error formatting time:', error, completedAt)
    }
    return ''
  }
})
</script>
