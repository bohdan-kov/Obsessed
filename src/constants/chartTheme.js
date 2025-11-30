/**
 * Chart Theme Configuration
 * Centralizes all chart-related design tokens
 */

export const CHART_COLORS = {
  // Base chart colors (from globals.css CSS variables)
  chart1: 'var(--chart-1)',
  chart2: 'var(--chart-2)',
  chart3: 'var(--chart-3)',
  chart4: 'var(--chart-4)',
  chart5: 'var(--chart-5)',
  chart6: 'var(--chart-6)',
  chart7: 'var(--chart-7)',
  chart8: 'var(--chart-8)',
}

// Theme colors for tooltips (when portaled outside .dark scope)
export const TOOLTIP_THEME_COLORS = {
  dark: {
    background: 'oklch(0.35 0 0)', // --popover
    text: 'oklch(0.985 0 0)', // --popover-foreground
    border: 'oklch(0.269 0 0)', // --border
    muted: 'oklch(0.708 0 0)', // --muted-foreground
  },
  light: {
    background: 'oklch(1 0 0)', // --popover
    text: 'oklch(0.145 0 0)', // --popover-foreground
    border: 'oklch(0.922 0 0)', // --border
    muted: 'oklch(0.556 0 0)', // --muted-foreground
  },
}

// Muscle group color mappings
export const MUSCLE_COLOR_MAP = {
  back: CHART_COLORS.chart1,
  legs: CHART_COLORS.chart2,
  chest: CHART_COLORS.chart3,
  biceps: CHART_COLORS.chart4,
  shoulders: CHART_COLORS.chart5,
  calves: CHART_COLORS.chart6,
  triceps: CHART_COLORS.chart7,
  core: CHART_COLORS.chart8,
}

/**
 * Get theme colors for current mode
 * @param {boolean} isDark - Whether dark mode is active
 * @returns {Object} Color configuration
 */
export function getTooltipColors(isDark = false) {
  return TOOLTIP_THEME_COLORS[isDark ? 'dark' : 'light']
}
