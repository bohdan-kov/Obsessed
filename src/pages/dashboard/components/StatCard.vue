<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-vue-next'

const { t } = useI18n()

const props = defineProps({
  /**
   * Card title
   */
  title: {
    type: String,
    required: true,
  },
  /**
   * Main metric value to display
   */
  value: {
    type: [String, Number],
    required: true,
  },
  /**
   * Trend object with value and direction
   * @type {{ value: string, direction: 'up'|'down'|'neutral' } | null}
   */
  trend: {
    type: Object,
    default: null,
    validator: (v) => {
      if (v === null) return true
      return (
        v.value !== undefined &&
        v.direction !== undefined &&
        ['up', 'down', 'neutral'].includes(v.direction)
      )
    },
  },
  /**
   * Period label (e.g., "This month", "Last 7 days")
   */
  periodLabel: {
    type: String,
    default: '',
  },
  /**
   * Insight object with text key and status
   * @type {{ textKey: string, status: 'good'|'warning'|'neutral' } | null}
   */
  insight: {
    type: Object,
    default: null,
    validator: (v) => {
      if (v === null) return true
      return (
        v.textKey !== undefined &&
        v.status !== undefined &&
        ['good', 'warning', 'neutral'].includes(v.status)
      )
    },
  },
  /**
   * Card variant
   */
  variant: {
    type: String,
    default: 'default',
    validator: (v) => ['default', 'warning'].includes(v),
  },
})

// Card styling based on variant
const cardClass = computed(() => {
  if (props.variant === 'warning') {
    return 'border-[rgba(234,179,8,0.2)]'
  }
  return ''
})

// Trend indicator color inline style based on direction
const trendStyle = computed(() => {
  if (!props.trend) return {}

  switch (props.trend.direction) {
    case 'up':
      return { color: '#22c55e' }
    case 'down':
      return { color: '#eab308' }
    default:
      return {}
  }
})

// Trend indicator class for neutral state
const trendClass = computed(() => {
  if (!props.trend || props.trend.direction !== 'neutral') return ''
  return 'text-muted-foreground'
})

// Insight text color - always gray per mockup design
// The insight text itself conveys the meaning, not the color
const insightStyle = computed(() => {
  return { color: '#a1a1aa' }
})

// ARIA label for trend indicator
const trendAriaLabel = computed(() => {
  if (!props.trend) return ''

  const direction = props.trend.direction === 'up' ? 'increased' : 'decreased'
  return `Trend: ${direction} by ${props.trend.value}`
})

// ARIA label for insight
const insightAriaLabel = computed(() => {
  if (!props.insight) return ''

  const statusText = props.insight.status === 'warning' ? 'Warning: ' : ''
  return `${statusText}${t(props.insight.textKey)}`
})

// Display value with fallback for invalid numbers
const displayValue = computed(() => {
  const val = props.value

  // Handle NaN or invalid numbers
  if (typeof val === 'number' && isNaN(val)) {
    return '0'
  }

  // Handle null/undefined
  if (val == null) {
    return '0'
  }

  return val
})
</script>

<template>
  <Card :class="cardClass">
    <CardHeader class="pb-2">
      <div class="flex items-center justify-between">
        <!-- Title -->
        <h3 class="text-sm font-medium text-muted-foreground">
          {{ title }}
        </h3>

        <!-- Trend Indicator -->
        <div
          v-if="trend && trend.direction !== 'neutral'"
          class="flex items-center gap-1 text-xs font-medium"
          :class="trendClass"
          :style="trendStyle"
          role="status"
          :aria-label="trendAriaLabel"
        >
          <TrendingUp v-if="trend.direction === 'up'" class="h-3 w-3" aria-hidden="true" />
          <TrendingDown v-else class="h-3 w-3" aria-hidden="true" />
          <span>{{ trend.value }}</span>
        </div>
      </div>
    </CardHeader>

    <CardContent>
      <!-- Main Value -->
      <div class="text-3xl font-bold font-mono tracking-tight">
        {{ displayValue }}
      </div>

      <!-- Footer: Period Label + Insight -->
      <div v-if="periodLabel || insight" class="flex justify-between items-center mt-2 text-xs gap-2">
        <!-- Period Label -->
        <span v-if="periodLabel" style="color: #52525b">
          {{ periodLabel }}
        </span>

        <!-- Insight Text -->
        <span
          v-if="insight"
          :style="insightStyle"
          class="font-medium"
          role="status"
          :aria-live="insight.status === 'warning' ? 'polite' : 'off'"
          :aria-label="insightAriaLabel"
        >
          {{ t(insight.textKey) }}
        </span>
      </div>
    </CardContent>
  </Card>
</template>
