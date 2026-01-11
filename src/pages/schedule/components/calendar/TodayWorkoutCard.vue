<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSchedule } from '@/composables/useSchedule'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import QuickStartButton from '../shared/QuickStartButton.vue'
import MuscleGroupBadges from '../shared/MuscleGroupBadges.vue'
import { Calendar, Dumbbell } from 'lucide-vue-next'

const emit = defineEmits(['quick-start'])

const { t } = useI18n()
const { todaysWorkout } = useSchedule()

const hasWorkoutToday = computed(() => todaysWorkout.value?.templateId)

function handleQuickStart() {
  if (!todaysWorkout.value?.templateId) return
  emit('quick-start', todaysWorkout.value.templateId)
}
</script>

<template>
  <Card v-if="hasWorkoutToday" class="bg-primary/5 border-primary/20">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Dumbbell class="w-5 h-5" />
        {{ t('schedule.todaysWorkout.title') }}
      </CardTitle>
    </CardHeader>
    <CardContent class="flex items-center justify-between flex-col sm:flex-row gap-4">
      <div class="w-full sm:w-auto">
        <p class="font-semibold text-lg mb-2">{{ todaysWorkout.templateName }}</p>
        <MuscleGroupBadges :muscle-groups="todaysWorkout.muscleGroups" />
      </div>
      <QuickStartButton
        :template-id="todaysWorkout.templateId"
        size="lg"
        @click="handleQuickStart"
      />
    </CardContent>
  </Card>

  <Card v-else class="bg-muted/30">
    <CardContent class="flex items-center justify-center py-8">
      <div class="text-center">
        <Calendar class="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
        <p class="text-muted-foreground">{{ t('schedule.todaysWorkout.noWorkout') }}</p>
      </div>
    </CardContent>
  </Card>
</template>
