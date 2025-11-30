<script setup>
import { inject } from 'vue'

defineProps({
  labelFormatter: {
    type: Function,
    default: (v) => v,
  },
  hideLabel: {
    type: Boolean,
    default: false,
  },
  hideIndicator: {
    type: Boolean,
    default: false,
  },
})

const chartConfig = inject('chartConfig', {})
</script>

<template>
  <div class="chart-tooltip-content rounded-lg border bg-background p-2 shadow-sm">
    <slot :config="chartConfig" />
  </div>
</template>

<style scoped>
.chart-tooltip-content {
  font-size: 0.875rem;
  line-height: 1.25rem;
}
</style>
