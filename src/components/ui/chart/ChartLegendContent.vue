<script setup>
import { inject, computed } from 'vue'

const props = defineProps({
  align: {
    type: String,
    default: 'center',
    validator: (value) => ['start', 'center', 'end'].includes(value),
  },
  orientation: {
    type: String,
    default: 'horizontal',
    validator: (value) => ['horizontal', 'vertical'].includes(value),
  },
  verticalAlign: {
    type: String,
    default: 'bottom',
    validator: (value) => ['top', 'bottom'].includes(value),
  },
})

const chartConfig = inject('chartConfig', {})

const legendItems = computed(() => {
  return Object.entries(chartConfig).map(([key, value]) => ({
    key,
    label: value.label || key,
    color: value.color || 'currentColor',
  }))
})

const alignClass = computed(() => {
  const alignments = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
  }
  return alignments[props.align] || 'justify-center'
})

const orientationClass = computed(() => {
  return props.orientation === 'vertical' ? 'flex-col' : 'flex-row'
})

const verticalAlignClass = computed(() => {
  return props.verticalAlign === 'top' ? 'mt-4' : 'mb-4'
})
</script>

<template>
  <div
    class="chart-legend flex gap-4 flex-wrap"
    :class="[alignClass, orientationClass, verticalAlignClass]"
  >
    <div
      v-for="item in legendItems"
      :key="item.key"
      class="legend-item flex items-center gap-2 text-sm"
    >
      <span
        class="legend-indicator inline-block h-3 w-3 rounded-sm"
        :style="{ backgroundColor: item.color }"
      />
      <span class="legend-label text-muted-foreground">{{ item.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.chart-legend {
  padding: 0.5rem 0;
}
</style>
