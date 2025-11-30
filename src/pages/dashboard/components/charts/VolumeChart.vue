<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ChartConfig } from '@/components/ui/chart'
import { VisArea, VisAxis, VisLine, VisXYContainer } from '@unovis/vue'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartCrosshair,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  componentToString,
} from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useWorkoutStore } from '@/stores/workoutStore'

const { t } = useI18n()
const workoutStore = useWorkoutStore()

// Chart data from completed workouts
const chartData = computed(() => {
  const days = getLastNDays(daysToSubtract.value)

  // Guard against undefined completedWorkouts
  const completedWorkouts = workoutStore.completedWorkouts || []

  return days.map(date => {
    const dayWorkouts = completedWorkouts.filter(w => {
      const workoutDate = new Date(w.completedAt).toDateString()
      return workoutDate === date.toDateString()
    })

    const volume = dayWorkouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0)
    const exercises = dayWorkouts.reduce((sum, w) => sum + (w.exercises?.length || 0), 0)

    return {
      date,
      volume,
      exercises: exercises * 100, // Scale for visibility
    }
  })
})

type Data = typeof chartData.value[number]

const chartConfig = {
  volume: {
    label: t('dashboard.volumeChart.volume'),
    color: 'var(--chart-1)', // Primary color
  },
  exercises: {
    label: t('dashboard.volumeChart.exercises'),
    color: 'var(--chart-2)', // Secondary color
  },
} satisfies ChartConfig

const svgDefs = `
  <linearGradient id="fillVolume" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stop-color="var(--color-volume)" stop-opacity="0.8" />
    <stop offset="95%" stop-color="var(--color-volume)" stop-opacity="0.1" />
  </linearGradient>
  <linearGradient id="fillExercises" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stop-color="var(--color-exercises)" stop-opacity="0.8" />
    <stop offset="95%" stop-color="var(--color-exercises)" stop-opacity="0.1" />
  </linearGradient>
`

// Time range selector
const timeRange = ref('14d')

const daysToSubtract = computed(() => {
  if (timeRange.value === '7d') return 7
  if (timeRange.value === '30d') return 30
  return 14
})

// Y domain - dynamic based on max values
const yDomain = computed(() => {
  const maxVolume = Math.max(...chartData.value.map(d => d.volume), 100)
  const maxExercises = Math.max(...chartData.value.map(d => d.exercises), 100)
  return [0, Math.max(maxVolume, maxExercises) * 1.1]
})

// Helper to get last N days
function getLastNDays(n: number): Date[] {
  const days: Date[] = []
  const today = new Date()

  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    days.push(date)
  }

  return days
}
</script>

<template>
  <Card class="pt-0">
    <CardHeader class="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
      <div class="grid flex-1 gap-1">
        <CardTitle>{{ t('dashboard.volumeChart.title') }}</CardTitle>
        <CardDescription>
          {{ t('dashboard.volumeChart.subtitle', { days: daysToSubtract }) }}
        </CardDescription>
      </div>
      <Select v-model="timeRange">
        <SelectTrigger
          class="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
          aria-label="Select a value"
        >
          <SelectValue :placeholder="t('dashboard.volumeChart.days', { count: 14 })" />
        </SelectTrigger>
        <SelectContent class="rounded-xl">
          <SelectItem value="7d" class="rounded-lg">
            {{ t('dashboard.volumeChart.days', { count: 7 }) }}
          </SelectItem>
          <SelectItem value="14d" class="rounded-lg">
            {{ t('dashboard.volumeChart.days', { count: 14 }) }}
          </SelectItem>
          <SelectItem value="30d" class="rounded-lg">
            {{ t('dashboard.volumeChart.days', { count: 30 }) }}
          </SelectItem>
        </SelectContent>
      </Select>
    </CardHeader>

    <CardContent class="px-2 pt-4 sm:px-6 sm:pt-6 pb-4">
      <ChartContainer :config="chartConfig" class="aspect-auto h-[250px] w-full" :cursor="false">
        <VisXYContainer
          :data="chartData"
          :svg-defs="svgDefs"
          :margin="{ left: -40 }"
          :y-domain="yDomain"
        >
          <VisArea
            :x="(d: Data) => d.date"
            :y="[(d: Data) => d.exercises, (d: Data) => d.volume]"
            :color="(d: Data, i: number) => ['url(#fillExercises)', 'url(#fillVolume)'][i]"
            :opacity="0.6"
          />
          <VisLine
            :x="(d: Data) => d.date"
            :y="[(d: Data) => d.exercises, (d: Data) => d.volume]"
            :color="(d: Data, i: number) => [chartConfig.exercises.color, chartConfig.volume.color][i]"
            :line-width="1"
          />
          <VisAxis
            type="x"
            :x="(d: Data) => d.date"
            :tick-line="false"
            :domain-line="false"
            :grid-line="false"
            :num-ticks="6"
            :tick-format="(d: number) => {
              const date = new Date(d)
              return date.toLocaleDateString('uk-UA', {
                month: 'short',
                day: 'numeric',
              })
            }"
          />
          <VisAxis
            type="y"
            :num-ticks="3"
            :tick-line="false"
            :domain-line="false"
          />
          <ChartTooltip />
          <ChartCrosshair
            :template="componentToString(chartConfig, ChartTooltipContent, {
              labelFormatter: (d) => {
                return new Date(d).toLocaleDateString('uk-UA', {
                  month: 'short',
                  day: 'numeric',
                })
              },
            })"
            :color="(d: Data, i: number) => [chartConfig.exercises.color, chartConfig.volume.color][i % 2]"
          />
        </VisXYContainer>

        <ChartLegendContent />
      </ChartContainer>
    </CardContent>
  </Card>
</template>
