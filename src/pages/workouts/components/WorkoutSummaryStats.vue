<script setup>
import { useI18n } from 'vue-i18n'
import { useUnits } from '@/composables/useUnits'
import { Weight, ListOrdered, Dumbbell, Clock } from 'lucide-vue-next'
import { Card } from '@/components/ui/card'

const props = defineProps({
  stats: {
    type: Object,
    required: true,
  },
})

const { t } = useI18n()
const { formatWeight } = useUnits()

function formatDuration(seconds) {
  if (!seconds) return t('workout.history.card.durationUnknown')

  const totalMinutes = Math.floor(seconds / 60)
  if (totalMinutes < 1) return t('workout.history.card.durationLessThanMinute')

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0) {
    return t('workout.history.card.duration', { hours, minutes })
  }
  return t('workout.history.card.durationMinutes', { minutes })
}
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
    <Card class="p-4 text-center">
      <Weight class="w-8 h-8 mx-auto mb-2 text-primary" />
      <div class="text-xl sm:text-2xl font-bold">{{ formatWeight(stats.totalVolume, { precision: 0, compact: 'auto' }) }}</div>
      <div class="text-xs sm:text-sm text-muted-foreground">
        {{ t('workout.stats.totalVolume') }}
      </div>
    </Card>

    <Card class="p-4 text-center">
      <ListOrdered class="w-8 h-8 mx-auto mb-2 text-primary" />
      <div class="text-xl sm:text-2xl font-bold">{{ stats.totalSets }}</div>
      <div class="text-xs sm:text-sm text-muted-foreground">
        {{ t('workout.stats.totalSets') }}
      </div>
    </Card>

    <Card class="p-4 text-center">
      <Dumbbell class="w-8 h-8 mx-auto mb-2 text-primary" />
      <div class="text-xl sm:text-2xl font-bold">{{ stats.totalExercises }}</div>
      <div class="text-xs sm:text-sm text-muted-foreground">
        {{ t('workout.stats.exercises') }}
      </div>
    </Card>

    <Card class="p-4 text-center">
      <Clock class="w-8 h-8 mx-auto mb-2 text-primary" />
      <div class="text-xl sm:text-2xl font-bold">{{ formatDuration(stats.duration) }}</div>
      <div class="text-xs sm:text-sm text-muted-foreground">
        {{ t('workout.stats.duration') }}
      </div>
    </Card>
  </div>
</template>
