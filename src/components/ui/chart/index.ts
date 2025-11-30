export { default as ChartContainer } from './ChartContainer.vue'
export { default as ChartTooltip } from './ChartTooltip.vue'
export { default as ChartTooltipContent } from './ChartTooltipContent.vue'
export { default as ChartLegendContent } from './ChartLegendContent.vue'
export { default as ChartCrosshair } from './ChartCrosshair.vue'

/**
 * Chart configuration type
 * Defines the structure for chart data series configuration
 */
export interface ChartConfig {
  [key: string]: {
    label: string
    color: string
    icon?: any
  }
}

/**
 * Utility function to convert a component to a string template
 * Used by ChartCrosshair to render tooltip content
 *
 * @param config - Chart configuration object
 * @param component - Vue component to render
 * @param options - Additional options (labelFormatter, etc.)
 * @returns HTML string template for the tooltip
 */
export function componentToString(
  _config: ChartConfig,
  _component: any,
  _options: any = {}
): string {
  // This is a placeholder implementation
  // @unovis handles the actual tooltip rendering via the Crosshair component
  // The template prop accepts an HTML string or function that returns HTML

  // For now, return an empty string since @unovis will handle rendering
  // If we need custom tooltip HTML, we can implement a proper renderer here
  return ''
}
