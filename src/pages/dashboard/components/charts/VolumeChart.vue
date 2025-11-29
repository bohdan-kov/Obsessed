<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const analyticsStore = useAnalyticsStore()
const { volumeByDay } = storeToRefs(analyticsStore)

// Get last 14 days
const chartData = computed(() => volumeByDay.value.slice(-14))

// Calculate max for scaling
const maxVolume = computed(() => {
  if (chartData.value.length === 0) return 1
  return Math.max(...chartData.value.map((d) => d.volume))
})

// Format date for display
function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
}

// Get bar height percentage
function getBarHeight(volume) {
  if (maxVolume.value === 0) return 0
  return (volume / maxVolume.value) * 100
}

// Format volume for tooltip
function formatVolume(volume) {
  return volume.toLocaleString('uk-UA') + ' кг'
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Обсяг навантаження</CardTitle>
      <CardDescription>
        Загальний обсяг (кг) за останні 14 днів
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div class="h-[300px] w-full">
        <!-- Chart container -->
        <div v-if="chartData.length > 0" class="h-full flex items-end justify-between gap-1">
          <div
            v-for="(day, index) in chartData"
            :key="index"
            class="flex-1 flex flex-col items-center gap-2 group"
          >
            <!-- Bar -->
            <div class="flex-1 w-full flex items-end">
              <div
                :style="{ height: `${getBarHeight(day.volume)}%` }"
                class="w-full bg-gradient-to-t from-primary to-primary/50 rounded-t-md transition-all hover:from-primary/80 hover:to-primary/40 cursor-pointer relative"
                :title="`${formatDate(day.date)}: ${formatVolume(day.volume)}`"
              >
                <!-- Tooltip on hover -->
                <div
                  class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10"
                >
                  <div class="font-medium">{{ formatDate(day.date) }}</div>
                  <div class="text-muted-foreground">{{ formatVolume(day.volume) }}</div>
                  <div v-if="day.workouts > 0" class="text-xs text-muted-foreground">
                    {{ day.workouts }} тренування
                  </div>
                </div>
              </div>
            </div>

            <!-- Date label -->
            <span class="text-xs text-muted-foreground">
              {{ new Date(day.date).getDate() }}
            </span>
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-else
          class="h-full flex flex-col items-center justify-center text-muted-foreground"
        >
          <svg
            class="w-12 h-12 mb-2 opacity-50"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p class="text-sm">Немає даних для відображення</p>
          <p class="text-xs mt-1">Почніть тренуватися для перегляду статистики</p>
        </div>
      </div>

      <!-- Legend -->
      <div class="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>Останні 14 днів</span>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded bg-gradient-to-t from-primary to-primary/50" />
          <span>Обсяг навантаження</span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
