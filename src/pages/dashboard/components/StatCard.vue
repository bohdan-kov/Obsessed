<script setup>
import { computed } from 'vue'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-vue-next'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number],
    required: true,
  },
  change: {
    type: String,
    default: null,
  },
  trend: {
    type: String,
    default: null,
    validator: (v) => v === null || ['up', 'down'].includes(v),
  },
  subtitle: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  warning: {
    type: Boolean,
    default: false,
  },
})

const trendColor = computed(() => {
  if (!props.trend) return ''
  return props.trend === 'up' ? 'text-green-500' : 'text-yellow-500'
})

const cardClass = computed(() => {
  return props.warning ? 'border-yellow-500/20' : ''
})
</script>

<template>
  <Card :class="cardClass">
    <CardHeader class="pb-2">
      <div class="flex items-center justify-between">
        <CardTitle class="text-sm font-medium text-muted-foreground">
          {{ title }}
        </CardTitle>
        <div
          v-if="change && trend"
          class="flex items-center gap-1 text-xs font-medium"
          :class="trendColor"
        >
          <TrendingUp v-if="trend === 'up'" class="h-3 w-3" />
          <TrendingDown v-else class="h-3 w-3" />
          {{ change }}
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div class="text-3xl font-bold font-mono tracking-tight">
        {{ value }}
      </div>
      <div v-if="subtitle || description" class="flex justify-between mt-2 text-xs">
        <span v-if="subtitle" class="text-muted-foreground">{{ subtitle }}</span>
        <span v-if="description" class="text-muted-foreground/80">{{ description }}</span>
      </div>
    </CardContent>
  </Card>
</template>
