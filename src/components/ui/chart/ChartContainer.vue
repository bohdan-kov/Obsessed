<script setup>
import { provide, computed } from 'vue'

const props = defineProps({
  config: {
    type: Object,
    required: true,
  },
  cursor: {
    type: Boolean,
    default: true,
  },
})

// Provide config to child components
provide('chartConfig', props.config)

// Create CSS variables for chart colors
const chartStyles = computed(() => {
  const styles = {}
  Object.entries(props.config).forEach(([key, value]) => {
    if (value.color) {
      styles[`--color-${key}`] = value.color
    }
  })
  return styles
})
</script>

<template>
  <div
    class="chart-container"
    :style="chartStyles"
    :class="[$attrs.class, { 'cursor-pointer': cursor }]"
  >
    <slot />
  </div>
</template>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
}
</style>
