<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Activity class="h-5 w-5" />
        {{ t('exercises.history.title') }}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <!-- No data state -->
      <div
        v-if="!stats.hasData.value"
        class="py-8 text-center text-muted-foreground"
      >
        <LineChart class="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p class="mb-1">{{ t('exercises.history.noData') }}</p>
        <p class="text-sm">{{ t('exercises.history.startTracking') }}</p>
      </div>

      <!-- Progress chart -->
      <div v-else class="space-y-4">
        <!-- Chart placeholder - lazy load Chart.js when needed -->
        <div class="h-[300px] bg-muted/30 rounded-lg flex items-center justify-center">
          <p class="text-sm text-muted-foreground">
            {{ t('exercises.history.chart') }}
          </p>
          <!-- TODO: Integrate Chart.js in Phase 7 for visual progress chart -->
        </div>

        <!-- Session list -->
        <div class="space-y-2">
          <h4 class="text-sm font-semibold">{{ t('workout.recentSessions') }}</h4>
          <div class="space-y-2">
            <div
              v-for="(session, index) in stats.progressData.value"
              :key="index"
              class="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm"
            >
              <div>
                <div class="font-medium">{{ formatDate(session.date) }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ session.sets }} {{ t('workout.sets') }}
                </div>
              </div>
              <div class="text-right">
                <div class="font-semibold">{{ formatWeight(session.maxWeight) }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ formatWeight(session.volume) }} {{ t('workout.volume') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { Activity, LineChart } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useExerciseStats } from '@/composables/useExerciseStats'
import { useUnits } from '@/composables/useUnits'
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
const { formatWeight } = useUnits()

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
