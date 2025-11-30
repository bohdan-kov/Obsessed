<script setup>
import { VisTooltip } from '@unovis/vue'

// Minimal tooltip wrapper using native Unovis VisTooltip
// This component is required for ChartCrosshair template content to display
// NOTE: All tooltip styling is done via inline styles in componentToString()
// because Unovis renders tooltips in a portal outside the .dark class scope
</script>

<template>
  <VisTooltip
    v-bind="$attrs"
    class="chart-tooltip"
  />
</template>

<style>
/* Reset Unovis default styles - let inline styles from componentToString handle everything */
.unovis-tooltip-container {
  padding: 0 !important;
  margin: 0 !important;
  background: transparent !important;
  border: none !important;
  /* All background, border, and color styles are applied via inline styles */
  /* This ensures dark mode works correctly even when tooltip is portaled */
}

/* Override ANY Unovis wrapper divs (they use generated CSS classes like css-135213i-tooltip) */
.unovis-tooltip-container *,
[class*="tooltip"],
[class*="css-"][class*="tooltip"],
[class*="css-135213i"],
[class*="css-wq9ok4"],
[class*="css-eec57t"] {
  padding: 0 !important;
  margin: 0 !important;
  background: transparent !important;
  border: none !important;
  border-color: transparent !important;
}

/* Ensure tooltip content wrapper doesn't add unwanted borders */
.chart-tooltip {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  margin: 0 !important;
}

/* Nuclear option: Override ALL div children inside tooltip container */
.unovis-tooltip-container > div,
.unovis-tooltip-container > div > div {
  padding: 0 !important;
  margin: 0 !important;
  background: transparent !important;
  border: none !important;
}

/* BUT allow the INNERMOST div (from componentToString) to have its inline styles */
.unovis-tooltip-container [style*="background"][style*="border-radius"] {
  /* This is the div from componentToString with inline styles */
  /* Reset the parent overrides for this specific element */
  padding: revert !important;
  background: revert !important;
  border: revert !important;
}
</style>
