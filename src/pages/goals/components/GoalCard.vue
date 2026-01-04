<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUnits } from '@/composables/useUnits'
import { Target, Dumbbell, TrendingUp, Calendar } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ProgressRing from '@/components/goals/ProgressRing.vue'

const props = defineProps({
  goal: {
    type: Object,
    required: true,
  },
})

const router = useRouter()
const { t } = useI18n()
const { formatWeight } = useUnits()

// Status colors mapping
const statusColors = computed(() => {
  const status = props.goal.status
  if (status === 'on-track') return 'hsl(var(--success))'
  if (status === 'ahead') return 'hsl(var(--primary))'
  if (status === 'behind') return 'hsl(var(--warning))'
  if (status === 'at-risk') return 'hsl(var(--destructive))'
  return 'hsl(var(--muted))'
})

// Status badge variant
const statusVariant = computed(() => {
  const status = props.goal.status
  if (status === 'on-track' || status === 'ahead' || status === 'achieved') return 'default'
  if (status === 'behind') return 'secondary'
  if (status === 'at-risk') return 'destructive'
  return 'outline'
})

// Goal icon based on type
const goalIcon = computed(() => {
  if (props.goal.type === 'strength') return Dumbbell
  if (props.goal.type === 'volume') return TrendingUp
  return Target
})

// Format target display
const targetDisplay = computed(() => {
  if (props.goal.type === 'strength') {
    return formatWeight(props.goal.targetWeight, { precision: 0 })
  }
  if (props.goal.type === 'volume') {
    return formatWeight(props.goal.target, { precision: 0 })
  }
  return props.goal.targetCount || props.goal.targetDays || props.goal.targetWeeks
})

// Format current display
const currentDisplay = computed(() => {
  if (props.goal.type === 'strength') {
    return formatWeight(props.goal.current1RM || 0, { precision: 0 })
  }
  if (props.goal.type === 'volume') {
    return formatWeight(props.goal.currentVolume || 0, { precision: 0 })
  }
  return props.goal.currentCount || props.goal.currentStreak || 0
})

// Days remaining text
const daysRemainingText = computed(() => {
  if (!props.goal.daysRemaining) return ''
  const days = props.goal.daysRemaining
  if (days < 0) return t('goals.detail.daysRemaining', { count: 0 })
  return t('goals.detail.daysRemaining', { count: days })
})

function handleClick() {
  router.push({ name: 'GoalDetail', params: { id: props.goal.id } })
}
</script>

<template>
  <Card
    class="cursor-pointer transition-all hover:shadow-md"
    @click="handleClick"
  >
    <CardHeader class="pb-3">
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-start gap-3">
          <!-- Goal Type Icon -->
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10"
          >
            <component :is="goalIcon" class="h-5 w-5 text-primary" />
          </div>

          <!-- Goal Info -->
          <div class="flex-1">
            <CardTitle class="text-base leading-tight">
              {{ goal.exerciseName || t(`goals.types.${goal.type}`) }}
            </CardTitle>
            <p class="mt-1 text-xs text-muted-foreground">
              {{ t(`goals.types.${goal.type}`) }}
            </p>
          </div>
        </div>

        <!-- Status Badge -->
        <Badge :variant="statusVariant" class="shrink-0 text-xs">
          {{ t(`goals.status.${goal.status}`) }}
        </Badge>
      </div>
    </CardHeader>

    <CardContent class="space-y-4">
      <!-- Progress Ring -->
      <div class="flex items-center justify-center">
        <ProgressRing
          :progress="goal.progressPercent || 0"
          :size="100"
          :color="statusColors"
        />
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 gap-3 text-sm">
        <!-- Current -->
        <div class="space-y-1">
          <p class="text-xs text-muted-foreground">
            {{ t('goals.detail.current') }}
          </p>
          <p class="font-semibold">{{ currentDisplay }}</p>
        </div>

        <!-- Target -->
        <div class="space-y-1">
          <p class="text-xs text-muted-foreground">
            {{ t('goals.detail.target') }}
          </p>
          <p class="font-semibold">{{ targetDisplay }}</p>
        </div>
      </div>

      <!-- Deadline -->
      <div
        v-if="goal.deadline"
        class="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs"
      >
        <Calendar class="h-3.5 w-3.5 text-muted-foreground" />
        <span class="text-muted-foreground">{{ daysRemainingText }}</span>
      </div>
    </CardContent>
  </Card>
</template>
