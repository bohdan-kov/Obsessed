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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const analyticsStore = useAnalyticsStore()
const { frequencyHeatmap } = storeToRefs(analyticsStore)

// Days of week labels
const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

// Convert heatmap object to array format for rendering
const heatmapData = computed(() => {
  const days = Object.keys(frequencyHeatmap.value)
  if (days.length === 0) return []

  // Get max value for normalization
  const maxValue = Math.max(
    ...days.map((day) => Math.max(...frequencyHeatmap.value[day]))
  )

  return days.map((day, dayIndex) => ({
    day,
    dayLabel: daysOfWeek[dayIndex] || day.slice(0, 2),
    hours: frequencyHeatmap.value[day].map((count, hour) => ({
      hour,
      count,
      level: getLevel(count, maxValue),
      tooltip: `${day} ${hour}:00 - ${count} тренувань`,
    })),
  }))
})

// Calculate intensity level (0-5)
function getLevel(count, maxValue) {
  if (count === 0) return 0
  if (maxValue === 0) return 0

  const percentage = (count / maxValue) * 100

  if (percentage <= 20) return 1
  if (percentage <= 40) return 2
  if (percentage <= 60) return 3
  if (percentage <= 80) return 4
  return 5
}

// Get color based on level
function getColor(level) {
  const colors = [
    'bg-muted/30', // 0 - no workout
    'bg-primary/20', // 1 - very light
    'bg-primary/40', // 2 - light
    'bg-primary/60', // 3 - medium
    'bg-primary/80', // 4 - high
    'bg-primary', // 5 - very high
  ]
  return colors[level] || colors[0]
}

// Hours to display (simplified, showing 6 AM to 10 PM)
const displayHours = [6, 9, 12, 15, 18, 21]
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Частота тренувань</CardTitle>
      <CardDescription>
        Коли ви зазвичай тренуєтесь (день тижня та час)
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div v-if="heatmapData.length > 0" class="space-y-4">
        <TooltipProvider>
          <!-- Heatmap grid -->
          <div class="space-y-1">
            <div
              v-for="(dayData, dayIndex) in heatmapData"
              :key="dayIndex"
              class="flex items-center gap-2"
            >
              <!-- Day label -->
              <div class="w-8 text-xs text-muted-foreground font-medium">
                {{ dayData.dayLabel }}
              </div>

              <!-- Hour cells -->
              <div class="flex gap-1 flex-1">
                <Tooltip
                  v-for="hourData in dayData.hours.filter((h) =>
                    displayHours.includes(h.hour)
                  )"
                  :key="hourData.hour"
                >
                  <TooltipTrigger as-child>
                    <div
                      :class="[
                        'w-full h-8 rounded-sm cursor-pointer transition-all hover:scale-110 hover:ring-2 hover:ring-primary/50',
                        getColor(hourData.level),
                      ]"
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p class="font-medium">{{ dayData.day }}</p>
                    <p class="text-sm">
                      {{ hourData.hour }}:00 - {{ hourData.hour + 1 }}:00
                    </p>
                    <p class="text-xs text-muted-foreground">
                      {{ hourData.count }}
                      {{ hourData.count === 1 ? 'тренування' : 'тренувань' }}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          <!-- Hour labels -->
          <div class="flex items-center gap-2">
            <div class="w-8" />
            <div class="flex gap-1 flex-1 justify-between text-xs text-muted-foreground">
              <span v-for="hour in displayHours" :key="hour">
                {{ hour }}:00
              </span>
            </div>
          </div>
        </TooltipProvider>

        <!-- Legend -->
        <div class="flex items-center justify-between pt-4 border-t">
          <span class="text-xs text-muted-foreground">Інтенсивність</span>
          <div class="flex items-center gap-2">
            <span class="text-xs text-muted-foreground">Менше</span>
            <div class="flex gap-1">
              <div
                v-for="level in 6"
                :key="level"
                :class="['w-3 h-3 rounded-sm', getColor(level - 1)]"
              />
            </div>
            <span class="text-xs text-muted-foreground">Більше</span>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-else
        class="h-[300px] flex flex-col items-center justify-center text-muted-foreground"
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
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p class="text-sm">Немає даних про частоту тренувань</p>
        <p class="text-xs mt-1">Продовжуйте тренуватися для перегляду патернів</p>
      </div>
    </CardContent>
  </Card>
</template>
