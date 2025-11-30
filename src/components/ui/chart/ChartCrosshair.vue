<script setup>
import { inject } from 'vue'

defineProps({
  template: {
    type: String,
    default: '',
  },
  color: {
    type: [String, Function],
    default: 'currentColor',
  },
})

// Access chart config from context
const chartConfig = inject('chartConfig', {})
</script>

<template>
  <!-- The actual crosshair rendering is handled by @unovis -->
  <!-- This component is just a wrapper for API consistency -->
  <slot :config="chartConfig" />
</template>
