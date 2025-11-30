import { getTooltipColors } from '@/constants/chartTheme'

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
 * Generate tooltip styles with theme colors
 */
function getTooltipStyles(colors: any, isDark: boolean): string {
  const shadow = isDark
    ? '0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.3)'
    : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'

  return `
    background: ${colors.background};
    border: 1px solid ${colors.border};
    border-radius: 8px;
    padding: 12px;
    color: ${colors.text};
    font-size: 14px;
    box-shadow: ${shadow};
    margin: 0;
  `.trim().replace(/\s+/g, ' ')
}

/**
 * Generate tooltip header HTML
 */
function generateTooltipHeader(label: string, colors: any): string {
  return `
    <div style="
      font-weight: 500;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid ${colors.border};
    ">${label}</div>
  `
}

/**
 * Generate tooltip body with data fields
 */
function generateTooltipBody(fields: any[], colors: any): string {
  return fields.map(field => `
    <div style="display: flex; align-items: center; gap: 8px;">
      <div style="
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: ${field.color};
      "></div>
      <span style="color: ${colors.muted}; flex: 1;">
        ${field.label}:
      </span>
      <span style="font-weight: 600;">
        ${field.value}
      </span>
    </div>
  `).join('')
}

/**
 * Extract fields from datum
 */
function extractFields(datum: any, config: any, options: any): any[] {
  const fields: any[] = []

  Object.entries(config).forEach(([key, value]: [string, any]) => {
    // Check if this field exists in the datum (skip date/x field)
    if (key in datum && key !== 'date' && key !== 'x') {
      const fieldValue = datum[key]
      const formattedValue = options.valueFormatter
        ? options.valueFormatter(fieldValue, key)
        : typeof fieldValue === 'number'
          ? fieldValue.toLocaleString('uk-UA')
          : String(fieldValue)

      const fieldLabel = options.nameFormatter
        ? options.nameFormatter(value.label)
        : value.label

      fields.push({
        label: fieldLabel,
        value: formattedValue,
        color: value.color,
      })
    }
  })

  return fields
}

/**
 * Format label for tooltip
 */
function formatLabel(datum: any, labelFormatter?: (value: any) => string): string {
  const xValue = datum.date || datum.x || Object.values(datum)[0]
  return labelFormatter ? labelFormatter(xValue) : String(xValue)
}

/**
 * Generate complete tooltip HTML
 */
function generateTooltipHTML(
  colors: any,
  isDark: boolean,
  label: string,
  fields: any[]
): string {
  return `
    <div data-tooltip-content="true" style="${getTooltipStyles(colors, isDark)}">
      ${generateTooltipHeader(label, colors)}
      <div style="display: flex; flex-direction: column; gap: 6px;">
        ${generateTooltipBody(fields, colors)}
      </div>
    </div>
  `.trim()
}

/**
 * Utility function to convert a component to a string template
 * Used by ChartCrosshair to render tooltip content
 *
 * @param config - Chart configuration object
 * @param component - Vue component to render (ChartTooltipContent)
 * @param options - Additional options (labelFormatter, nameFormatter, etc.)
 * @returns Function that generates HTML string template for the tooltip
 */
export function componentToString(
  config: ChartConfig,
  _component: any,
  options: {
    labelFormatter?: (datum: any) => string
    nameFormatter?: (name: string) => string
    valueFormatter?: (value: any, key?: string) => string
  } = {}
): (datum: any) => string {
  return (datum: any) => {
    if (!datum) return ''

    // Get theme colors based on current mode
    const isDark = document.documentElement.classList.contains('dark')
    const colors = getTooltipColors(isDark)

    // Format label
    const label = formatLabel(datum, options.labelFormatter)

    // Extract data fields
    const fields = extractFields(datum, config, options)

    // Generate HTML
    return generateTooltipHTML(colors, isDark, label, fields)
  }
}
