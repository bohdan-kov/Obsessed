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
      <div v-else class="space-y-6">
        <!-- Weight progression chart -->
        <div class="pb-8 sm:pb-6 md:pb-0">
          <ExerciseProgressChart :data="stats.progressData.value" />
        </div>

        <!-- Recent sessions with scroll -->
        <div class="space-y-4 mt-24 sm:mt-16 md:mt-6">
          <h4 class="text-sm font-semibold">{{ t('workout.session.recentSessions') }}</h4>

          <!-- Scroll container wrapper -->
          <div class="relative">
            <!-- Scrollable session list -->
            <div
              role="region"
              :aria-label="t('workout.session.recentSessions')"
              aria-describedby="session-count"
              tabindex="0"
              class="max-h-[320px] sm:max-h-[400px] overflow-y-auto
                     scrollbar-thin scrollbar-thumb-muted-foreground/30
                     scrollbar-track-transparent rounded-lg
                     focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none
                     pr-2 space-y-2"
            >
              <!-- Screen reader session count -->
              <span id="session-count" class="sr-only">
                {{ t('exercises.history.sessionCount', { count: stats.progressData.value.length }) }}
              </span>

              <!-- Session cards -->
              <div
                v-for="(session, index) in stats.progressData.value"
                :key="index"
                class="rounded-lg border bg-card p-3 text-card-foreground"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Calendar class="h-4 w-4 text-muted-foreground" />
                    <span class="text-sm text-muted-foreground">
                      {{ formatDate(session.date) }}
                    </span>
                  </div>
                  <div class="text-right">
                    <div class="text-lg font-semibold">{{ formatWeight(session.maxWeight) }}</div>
                    <div class="text-xs text-muted-foreground">
                      {{ t('workout.session.sets', { count: session.sets }) }} •
                      {{ t('workout.session.volume') }}: {{ formatWeight(session.volume) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Fade indicator (only show when more than 4 sessions) -->
            <div
              v-if="stats.progressData.value.length > 4"
              class="absolute bottom-0 left-0 right-0 h-10
                     bg-gradient-to-t from-background/60 to-transparent
                     pointer-events-none rounded-b-lg"
            />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { Activity, LineChart, Calendar } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useExerciseStats } from '@/composables/useExerciseStats'
import { useUnits } from '@/composables/useUnits'
import { useI18n } from 'vue-i18n'
import ExerciseProgressChart from './charts/ExerciseProgressChart.vue'

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
