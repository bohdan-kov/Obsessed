<template>
  <Card class="mb-4">
    <CardContent class="p-4">
      <!-- Timer -->
      <div class="mb-4">
        <WorkoutTimer v-if="startedAt" :started-at="startedAt" />
      </div>

      <!-- Summary Stats -->
      <div class="mb-4">
        <WorkoutSummaryStats :exercises="exercises" />
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-2">
        <Button
          variant="outline"
          class="h-11 flex-1"
          @click="$emit('cancel')"
        >
          {{ t('workout.activeWorkout.cancelWorkout') }}
        </Button>

        <Button
          class="h-11 flex-1"
          :disabled="!canFinish"
          @click="$emit('finish')"
        >
          {{ t('workout.activeWorkout.finishWorkout') }}
        </Button>
      </div>

      <!-- Sync Status (Optional) -->
      <div v-if="syncStatus" class="mt-2 text-center text-xs text-muted-foreground">
        {{ getSyncStatusText(syncStatus) }}
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import WorkoutTimer from './WorkoutTimer.vue'
import WorkoutSummaryStats from './WorkoutSummaryStats.vue'

const props = defineProps({
  startedAt: {
    type: [Date, String, Object], // Accept Timestamp objects too
    default: null,
  },
  exercises: {
    type: Array,
    default: () => [],
  },
  syncStatus: {
    type: String,
    default: null,
  },
})

defineEmits(['finish', 'cancel'])

const { t } = useI18n()

// Can finish if at least one set has been logged
const canFinish = computed(() => {
  return props.exercises.some((exercise) => exercise.sets?.length > 0)
})

// Get sync status text
function getSyncStatusText(status) {
  switch (status) {
    case 'syncing':
      return t('workout.activeWorkout.status.syncing')
    case 'offline':
      return t('workout.activeWorkout.status.offline')
    default:
      return ''
  }
}
</script>
