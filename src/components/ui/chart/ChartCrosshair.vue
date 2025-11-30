<script setup>
import { VisCrosshair } from '@unovis/vue'
import { inject } from 'vue'

const props = defineProps({
  template: {
    type: Function,
    default: undefined,
  },
  color: {
    type: [String, Function],
    default: undefined,
  },
})

// Inject chartConfig to access colors for each series
const chartConfig = inject('chartConfig', {})

// Create a color function that returns the appropriate color for each data series
const colorFunction = (d, i) => {
  // If a specific color prop is provided, use it (allows per-chart customization)
  if (props.color) {
    return typeof props.color === 'function' ? props.color(d, i) : props.color
  }

  // Fallback: Extract data fields from the datum and match to chartConfig
  // The datum 'd' contains all data points: { date, volume, exercises, ... }
  // We filter to get only numeric fields (excluding x-axis fields like 'date' or 'x')
  const dataFields = Object.keys(d || {}).filter(
    key => key !== 'date' && key !== 'x' && typeof d[key] === 'number'
  )

  // Try to match the index to the corresponding data field
  // This works when the series index corresponds to the order of data fields
  if (dataFields.length > 0 && i < dataFields.length) {
    const fieldName = dataFields[i]
    const color = chartConfig[fieldName]?.color

    if (color) {
      return color
    }
  }

  // Final fallback: use chartConfig keys in order
  // NOTE: This may not work correctly for charts with VisArea + VisLine
  // because VisArea takes an index but doesn't show in crosshair
  const keys = Object.keys(chartConfig)
  if (keys.length > 0 && i < keys.length) {
    return chartConfig[keys[i]]?.color || 'currentColor'
  }

  return 'currentColor'
}
</script>

<template>
  <VisCrosshair :template="template" :color="colorFunction" />
</template>
