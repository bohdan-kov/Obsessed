<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUnits } from '@/composables/useUnits'
import { Clock, BarChart3, Dumbbell } from 'lucide-vue-next'
import { Card } from '@/components/ui/card'

const props = defineProps({
  workout: {
    type: Object,
    required: true,
  },
  stats: {
    type: Object,
    required: true,
  },
})

const { t, locale } = useI18n()
const { formatWeight } = useUnits()

const formattedDate = computed(() => {
  const date = props.workout.startedAt?.toDate
    ? props.workout.startedAt.toDate()
    : new Date(props.workout.startedAt)

  return new Intl.DateTimeFormat(locale.value, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
})

const formattedDuration = computed(() => {
  if (!props.stats.duration) return t('workout.history.card.durationUnknown')

  const totalMinutes = Math.floor(props.stats.duration / 60)
  if (totalMinutes < 1) return t('workout.history.card.durationLessThanMinute')

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0) {
    return t('workout.history.card.duration', { hours, minutes })
  }
  return t('workout.history.card.durationMinutes', { minutes })
})
</script>

<template>
  <Card class="p-4 sm:p-6">
    <h1 class="text-2xl sm:text-3xl font-bold mb-4">
      {{ formattedDate }}
    </h1>

    <div class="flex flex-wrap gap-4 sm:gap-6 text-sm text-muted-foreground">
      <div class="flex items-center gap-2">
        <Clock class="w-4 h-4 shrink-0" />
        <span>{{ formattedDuration }}</span>
      </div>

      <div class="flex items-center gap-2">
        <BarChart3 class="w-4 h-4 shrink-0" />
        <span>{{ formatWeight(stats.totalVolume) }}</span>
      </div>

      <div class="flex items-center gap-2">
        <Dumbbell class="w-4 h-4 shrink-0" />
        <span>{{ stats.totalExercises }} {{ t('workout.stats.exercises') }}</span>
      </div>
    </div>
  </Card>
</template>
