<template>
  <div class="flex flex-col items-center gap-1">
    <div class="text-xs text-muted-foreground">
      {{ t('workout.activeWorkout.timer.elapsed') }}
    </div>
    <div class="text-2xl font-bold tabular-nums">
      {{ formattedTime }}
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useActiveWorkout } from '@/composables/useActiveWorkout'

defineProps({
  startedAt: {
    type: [Date, String, Object], // Accept Timestamp objects too
    required: true,
  },
})

const { t } = useI18n()

// Use the shared timer from useActiveWorkout (singleton pattern)
const { formattedTime } = useActiveWorkout()
</script>
