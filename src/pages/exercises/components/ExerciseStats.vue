<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <TrendingUp class="h-5 w-5" />
        {{ t('exercises.stats.title') }}
      </CardTitle>
      <CardDescription>
        {{ t('exercises.stats.description') }}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <!-- No data state -->
      <div
        v-if="!stats.hasData.value"
        class="py-8 text-center text-muted-foreground"
      >
        <BarChart3 class="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>{{ t('exercises.stats.noData') }}</p>
      </div>

      <!-- Stats grid -->
      <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <!-- Personal Record -->
        <div class="space-y-1">
          <div class="text-xs text-muted-foreground uppercase tracking-wider">
            {{ t('exercises.stats.personalRecord') }}
          </div>
          <div class="text-2xl font-bold">
            {{ stats.personalRecord.value?.formatted || t('exercises.stats.noData') }}
          </div>
          <div v-if="stats.personalRecord.value" class="text-xs text-muted-foreground">
            {{ t('workout.session.reps', { count: stats.personalRecord.value.reps }) }} •
            {{ formatDate(stats.personalRecord.value.date) }}
          </div>
        </div>

        <!-- Estimated 1RM -->
        <div class="space-y-1">
          <div class="text-xs text-muted-foreground uppercase tracking-wider">
            {{ t('exercises.stats.estimated1RM') }}
          </div>
          <div class="text-2xl font-bold">
            {{ stats.estimated1RM.value?.formatted || t('exercises.stats.noData') }}
          </div>
          <div v-if="stats.estimated1RM.value" class="text-xs text-muted-foreground">
            {{ t('common.based') }} {{ stats.estimated1RM.value.basedOn.weight }} x
            {{ stats.estimated1RM.value.basedOn.reps }}
          </div>
        </div>

        <!-- Total Volume -->
        <div class="space-y-1">
          <div class="text-xs text-muted-foreground uppercase tracking-wider">
            {{ t('exercises.stats.totalVolume') }}
          </div>
          <div class="text-2xl font-bold">
            {{ stats.totalVolume.value?.formatted || t('exercises.stats.noData') }}
          </div>
        </div>

        <!-- Times Performed -->
        <div class="space-y-1">
          <div class="text-xs text-muted-foreground uppercase tracking-wider">
            {{ t('exercises.stats.timesPerformed') }}
          </div>
          <div class="text-2xl font-bold">
            {{ stats.timesPerformed.value }}
          </div>
          <div class="text-xs text-muted-foreground">
            {{ t('workout.session.sets', { count: stats.totalSets.value }) }}
          </div>
        </div>

        <!-- Average Weight -->
        <div class="space-y-1">
          <div class="text-xs text-muted-foreground uppercase tracking-wider">
            {{ t('exercises.stats.averageWeight') }}
          </div>
          <div class="text-2xl font-bold">
            {{ stats.averageWeight.value?.formatted || t('exercises.stats.noData') }}
          </div>
        </div>

        <!-- Average Reps -->
        <div class="space-y-1">
          <div class="text-xs text-muted-foreground uppercase tracking-wider">
            {{ t('exercises.stats.averageReps') }}
          </div>
          <div class="text-2xl font-bold">
            {{ stats.averageReps.value || t('exercises.stats.noData') }}
          </div>
          <div v-if="stats.averageRPE.value" class="text-xs text-muted-foreground">
            RPE ~{{ stats.averageRPE.value }}
          </div>
        </div>

        <!-- Last Performed -->
        <div class="space-y-1 col-span-2 md:col-span-3">
          <div class="text-xs text-muted-foreground uppercase tracking-wider">
            {{ t('exercises.stats.lastPerformed') }}
          </div>
          <div class="text-lg font-semibold">
            {{
              stats.lastPerformed.value
                ? formatDate(stats.lastPerformed.value)
                : t('exercises.stats.never')
            }}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { TrendingUp, BarChart3 } from 'lucide-vue-next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useExerciseStats } from '@/composables/useExerciseStats'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  /**
   * Exercise ID
   */
  exerciseId: {
    type: String,
    required: true,
  },
})

const { t, d } = useI18n()

// Get stats for this exercise
const stats = useExerciseStats(props.exerciseId)

/**
 * Format date for display
 */
function formatDate(date) {
  if (!date) return ''

  const dateObj = date instanceof Date ? date : new Date(date)

  return d(dateObj, 'short')
}
</script>
