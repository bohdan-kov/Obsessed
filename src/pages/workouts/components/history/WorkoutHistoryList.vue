<template>
  <div class="space-y-4">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>

    <!-- Empty State -->
    <Card v-else-if="workouts.length === 0">
      <CardContent class="flex flex-col items-center justify-center p-12">
        <Calendar class="mb-4 h-12 w-12 text-muted-foreground" />
        <p class="text-center text-muted-foreground">
          {{ t('workout.history.empty') }}
        </p>
        <p class="text-center text-sm text-muted-foreground">
          {{ t('workout.history.emptyHint') }}
        </p>
      </CardContent>
    </Card>

    <!-- Workout List -->
    <div v-else class="space-y-3">
      <WorkoutHistoryCard
        v-for="workout in workouts"
        :key="workout.id"
        :workout="workout"
      />
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar } from 'lucide-vue-next'
import WorkoutHistoryCard from './WorkoutHistoryCard.vue'

defineProps({
  workouts: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const { t } = useI18n()
</script>
