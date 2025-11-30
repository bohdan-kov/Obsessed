import { describe, it, expect } from 'vitest'
import { componentToString } from '../index'

describe('componentToString', () => {
  it('should generate HTML tooltip for data with multiple fields', () => {
    // Mock chart config
    const chartConfig = {
      volume: {
        label: 'Volume (kg)',
        color: 'var(--chart-1)',
      },
      workouts: {
        label: 'Workouts',
        color: 'var(--chart-2)',
      },
    }

    // Mock data point
    const datum = {
      date: new Date('2024-01-15'),
      volume: 12450,
      workouts: 2,
    }

    // Create template function
    const templateFn = componentToString(chartConfig, null, {
      labelFormatter: (d) => {
        return new Date(d).toLocaleDateString('uk-UA', {
          day: 'numeric',
          month: 'short',
        })
      },
    })

    // Call template function with data
    const html = templateFn(datum)

    // Verify HTML contains expected elements
    expect(html).toContain('15 січ.') // Date label
    expect(html).toContain('Volume (kg)') // Volume label
    expect(html).toContain('12') // Volume value (formatted with thousands separator)
    expect(html).toContain('450')
    expect(html).toContain('Workouts') // Workouts label
    expect(html).toContain('2') // Workouts count
  })

  it('should handle empty data gracefully', () => {
    const chartConfig = {
      volume: {
        label: 'Volume',
        color: 'var(--chart-1)',
      },
    }

    const templateFn = componentToString(chartConfig, null)
    const html = templateFn(null)

    expect(html).toBe('')
  })

  it('should skip date field in tooltip content', () => {
    const chartConfig = {
      date: {
        label: 'Date',
        color: 'var(--chart-0)',
      },
      volume: {
        label: 'Volume',
        color: 'var(--chart-1)',
      },
    }

    const datum = {
      date: new Date('2024-01-15'),
      volume: 100,
    }

    const templateFn = componentToString(chartConfig, null)
    const html = templateFn(datum)

    // Should show volume but not date in the content area
    expect(html).toContain('Volume')
    expect(html).toContain('100')
    // Date should only appear in the label header, not as a field
    const contentMatches = html.match(/Volume/g)
    expect(contentMatches.length).toBe(1) // Only in field, not in header
  })

  it('should use custom value formatter', () => {
    const chartConfig = {
      volume: {
        label: 'Volume',
        color: 'var(--chart-1)',
      },
    }

    const datum = {
      date: new Date('2024-01-15'),
      volume: 12450.5,
    }

    const templateFn = componentToString(chartConfig, null, {
      valueFormatter: (value) => `${value.toFixed(2)} kg`,
    })

    const html = templateFn(datum)

    expect(html).toContain('12450.50 kg')
  })

  it('should only show fields that exist in chartConfig', () => {
    const chartConfig = {
      volume: {
        label: 'Volume',
        color: 'var(--chart-1)',
      },
    }

    const datum = {
      date: new Date('2024-01-15'),
      volume: 100,
      workouts: 2, // This field is NOT in chartConfig
      exercises: 5, // This field is NOT in chartConfig
    }

    const templateFn = componentToString(chartConfig, null)
    const html = templateFn(datum)

    // Should only show volume
    expect(html).toContain('Volume')
    expect(html).toContain('100')
    expect(html).not.toContain('workouts')
    expect(html).not.toContain('exercises')
  })

  it('should handle fields that exist in chartConfig but not in data', () => {
    const chartConfig = {
      volume: {
        label: 'Volume',
        color: 'var(--chart-1)',
      },
      workouts: {
        label: 'Workouts',
        color: 'var(--chart-2)',
      },
      sets: {
        label: 'Sets',
        color: 'var(--chart-3)',
      },
    }

    const datum = {
      date: new Date('2024-01-15'),
      volume: 100,
      // workouts and sets are missing
    }

    const templateFn = componentToString(chartConfig, null)
    const html = templateFn(datum)

    // Should only show volume (exists in both config and data)
    expect(html).toContain('Volume')
    expect(html).toContain('100')
    expect(html).not.toContain('Workouts')
    expect(html).not.toContain('Sets')
  })
})
