<script setup>
import { computed, ref, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMediaQuery } from '@vueuse/core'
import { useAdherence } from '@/composables/useAdherence'
import { VisAxis, VisGroupedBar, VisXYContainer, VisTooltip } from '@unovis/vue'
import {
  ChartContainer,
  ChartCrosshair,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  componentToString,
} from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-vue-next'

const { t, locale } = useI18n()
const { weeklyAdherence } = useAdherence()

const chartScrollRef = ref(null)
const isMobile = useMediaQuery('(max-width: 768px)')

// Transform data for chart
const chartData = computed(() => {
  return weeklyAdherence.value.map((week, index) => ({
    weekIndex: index,
    weekLabel: week.weekLabel,
    completed: week.completed,
    missed: week.missed,
    total: week.planned,
    percentage: week.percentage,
  }))
})

// Chart configuration with colors
const chartConfig = {
  completed: {
    label: t('schedule.adherence.completed'),
    color: 'var(--chart-1)', // Primary green
  },
  missed: {
    label: t('schedule.adherence.missed'),
    color: 'var(--chart-5)', // Red/destructive
  },
}

// Y-axis domain with 10% padding
const yDomain = computed(() => {
  if (!chartData.value.length) return [0, 10]
  const maxValue = Math.max(...chartData.value.map((d) => d.total), 7)
  return [0, Math.ceil(maxValue * 1.1)]
})

// Mobile horizontal scroll
const chartMinWidth = computed(() => {
  if (!isMobile.value || chartData.value.length <= 6) return 'auto'
  const minSpacing = 60 // px per bar group
  return `${chartData.value.length * minSpacing}px`
})

// Color mapping function for crosshair dots
// Index mapping: 0 = crosshair line, 1 = first series (completed), 2 = second series (missed)
function getCrosshairColor(_d, i) {
  if (i === 0) return 'hsl(var(--border))' // Crosshair line color
  if (i === 1) return chartConfig.completed.color // Blue dot
  if (i === 2) return chartConfig.missed.color // Red dot
  return 'currentColor'
}

// Auto-scroll to latest on mount (mobile)
onMounted(async () => {
  if (isMobile.value && chartScrollRef.value) {
    await nextTick()
    setTimeout(() => {
      chartScrollRef.value.scrollLeft = chartScrollRef.value.scrollWidth
    }, 100)
  }
})
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <TrendingUp class="w-5 h-5" />
        {{ t('schedule.adherence.weeklyProgress') }}
      </CardTitle>
    </CardHeader>

    <CardContent>
      <div v-if="chartData.length > 0">
        <ChartContainer :config="chartConfig" class="w-full">
          <div class="chart-scroll-wrapper" :class="{ 'mobile-scroll': isMobile && chartMinWidth !== 'auto' }">
            <div ref="chartScrollRef">
              <div class="aspect-auto h-[300px] w-full" :style="{ minWidth: chartMinWidth }">
                <VisXYContainer
                  :data="chartData"
                  :y-domain="yDomain"
                  :padding="{ top: 10, right: 10, bottom: 40, left: 40 }"
                >
                  <!-- X-Axis -->
                  <VisAxis
                    type="x"
                    :x="(d) => d.weekIndex"
                    :tick-line="false"
                    :domain-line="false"
                    :grid-line="false"
                    :num-ticks="chartData.length"
                    :tick-format="(index) => {
                      const dataPoint = chartData[Math.round(index)]
                      return dataPoint?.weekLabel || ''
                    }"
                  />

                  <!-- Y-Axis -->
                  <VisAxis
                    type="y"
                    :num-ticks="5"
                    :tick-line="false"
                    :domain-line="false"
                    :grid-line="false"
                    :tick-format="(value) => Math.round(value).toString()"
                  />

                  <!-- Stacked Bars: Completed + Missed -->
                  <VisGroupedBar
                    :x="(d) => d.weekIndex"
                    :y="[(d) => d.completed, (d) => d.missed]"
                    :color="[chartConfig.completed.color, chartConfig.missed.color]"
                    :rounded-corners="4"
                    :bar-padding="0.3"
                    :group-padding="0.1"
                  />

                  <!-- Tooltip -->
                  <ChartTooltip />
                  <ChartCrosshair
                    :template="componentToString(chartConfig, ChartTooltipContent, {
                      indicator: 'line',
                      labelFormatter: (index) => {
                        const dataPoint = chartData[Math.round(index)]
                        return dataPoint?.weekLabel || ''
                      },
                      valueFormatter: (value, key) => {
                        if (typeof value !== 'number') return String(value)

                        // Форматування з locale-aware розділювачами
                        const formatted = value.toLocaleString(locale.value, {
                          maximumFractionDigits: 0
                        })
                        return `${formatted} ${t('schedule.adherence.workouts')}`
                      },
                    })"
                    :color="getCrosshairColor"
                  />
                </VisXYContainer>
              </div>
            </div>

            <!-- Градієнтний overlay для індикації прокрутки -->
            <div
              v-if="isMobile && chartMinWidth !== 'auto'"
              class="scroll-gradient"
            />
          </div>

          <!-- Legend -->
          <ChartLegendContent class="mt-4 pt-4 border-t justify-center" />
        </ChartContainer>
      </div>

      <!-- Empty State -->
      <div v-else class="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <TrendingUp class="w-12 h-12 mb-2 opacity-50" />
        <p class="text-sm">{{ t('schedule.adherence.noData') }}</p>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
/* Chart scroll wrapper */
.chart-scroll-wrapper {
  position: relative;
  width: 100%;
}

/* Mobile scroll mode */
.chart-scroll-wrapper.mobile-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  /* Hide scrollbar but keep functionality */
  scrollbar-width: none;
  -ms-overflow-style: none;
  /* Smooth touch scrolling on iOS/Android */
  -webkit-overflow-scrolling: touch;
  /* Allow horizontal pan */
  touch-action: pan-x;
}

.chart-scroll-wrapper.mobile-scroll::-webkit-scrollbar {
  display: none;
}

/* Gradient overlay to indicate scrollability */
.scroll-gradient {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 60px;
  background: linear-gradient(
    to left,
    hsl(var(--background)) 0%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 10;
}

/* Ensure gradient doesn't show on desktop */
@media (min-width: 768px) {
  .scroll-gradient {
    display: none;
  }
}
</style>
