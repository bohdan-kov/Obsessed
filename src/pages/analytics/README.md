# Analytics Module

The Analytics module provides comprehensive workout insights through interactive charts and visualizations. Built with Vue 3 Composition API, Pinia state management, and custom SVG charts optimized for mobile-first usage.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Component Hierarchy](#component-hierarchy)
- [Data Flow](#data-flow)
- [Adding New Analytics Charts](#adding-new-analytics-charts)
- [Testing Guidelines](#testing-guidelines)
- [Performance Considerations](#performance-considerations)
- [i18n Guidelines](#i18n-guidelines)
- [Accessibility Features](#accessibility-features)

## Architecture Overview

The Analytics module follows a clean, layered architecture:

```
┌─────────────────────────────────────────┐
│         AnalyticsView.vue               │
│  (Main page with tabs and period)       │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼────┐      ┌────▼────────┐
│ Tabs   │      │ Period      │
│ Router │      │ Selector    │
└───┬────┘      └────┬────────┘
    │                │
    │         ┌──────▼──────────┐
    │         │ useAnalytics    │
    │         │ Period          │
    │         │ (composable)    │
    │         └──────┬──────────┘
    │                │
    └────────┬───────┘
             │
    ┌────────▼─────────────────────┐
    │   Tab-specific Components    │
    │  (Muscle, Duration, Volume)  │
    └────────┬─────────────────────┘
             │
    ┌────────▼─────────────────────┐
    │      BaseChart.vue           │
    │  (Wrapper with states)       │
    └────────┬─────────────────────┘
             │
    ┌────────▼─────────────────────┐
    │    analyticsStore            │
    │  (Pinia computed properties) │
    └────────┬─────────────────────┘
             │
    ┌────────▼─────────────────────┐
    │      workoutStore            │
    │  (Source workout data)       │
    └──────────────────────────────┘
```

### Key Architectural Decisions

1. **Separation of Concerns**: View layer (components), state layer (Pinia), and business logic (utils) are cleanly separated.

2. **Reactive Computations**: All analytics are computed properties in `analyticsStore`, ensuring automatic updates when workout data changes.

3. **URL State Management**: Tab and period selections are synced with URL query parameters for deep linking and state persistence.

4. **Composable Pattern**: Reusable logic (period filtering, heatmap grid) is extracted into composables.

5. **Mobile-First SVG**: Charts use responsive SVG with horizontal scrolling on mobile for optimal touch interaction.

## Component Hierarchy

### Main Components

#### `AnalyticsView.vue`

- **Purpose**: Root analytics page with tabbed navigation
- **Responsibilities**:
  - Tab state management with URL sync
  - Global period selector
  - Tab validation and routing
- **Props**: None (uses router)
- **State**: `activeTab`, `selectedPeriod`

### Shared Components

#### `BaseChart.vue`

- **Purpose**: Reusable chart wrapper with states
- **Responsibilities**:
  - Loading state (shows skeleton)
  - Empty state (shows EmptyState component)
  - Error state (shows error message)
  - Chart header and actions slot
- **Props**:
  - `title`: Chart title
  - `description`: Chart description
  - `data`: Chart data (Array or Object)
  - `loading`: Loading state
  - `error`: Error message
  - `emptyTitle`, `emptyDescription`, `emptyIcon`: Empty state customization
  - `height`: Chart height (default: 400px)
  - `skeletonType`: Skeleton type (chart, table, card)

#### `PeriodSelector.vue`

- **Purpose**: Period selection dropdown
- **Responsibilities**:
  - Display period options
  - Emit period changes
  - Show period icon
- **Props**:
  - `modelValue`: Current period
- **Emits**:
  - `update:modelValue`: Period changed

#### `LoadingSkeleton.vue`

- **Purpose**: Animated loading placeholder
- **Responsibilities**:
  - Match actual content structure
  - Pulse animation
- **Props**:
  - `type`: Skeleton type (chart, table, card)
  - `height`: Skeleton height

#### `EmptyState.vue`

- **Purpose**: Empty data state display
- **Responsibilities**:
  - Show icon and message
  - Provide call-to-action
- **Props**:
  - `title`, `description`, `icon`

### Tab Components

#### `MuscleVolumeChart.vue`

- **Purpose**: Multi-line chart showing volume per muscle over time
- **Data Source**: `analyticsStore.muscleVolumeOverTime`
- **Features**:
  - Toggle muscle visibility
  - Interactive legend
  - Responsive axes
  - Tooltips on data points

#### `DurationTrendChart.vue`

- **Purpose**: Scatter plot showing workout duration trends
- **Data Source**: `analyticsStore.durationTrendData`, `analyticsStore.durationStats`
- **Features**:
  - Volume-based point coloring
  - Trend line
  - Stats panel (avg, shortest, longest, trend)
  - Click to navigate to workout

#### `VolumeHeatmap.vue`

- **Purpose**: GitHub-style contribution heatmap for daily volume
- **Data Source**: `analyticsStore.dailyVolumeMap`
- **Composable**: `useContributionHeatmap` for grid layout
- **Features**:
  - Intensity-based color coding
  - Month and weekday labels
  - Tooltips with volume
  - Legend

#### `ProgressiveOverloadChart.vue`

- **Purpose**: Bar chart showing weekly volume progression
- **Data Source**: `analyticsStore.weeklyVolumeProgression`, `analyticsStore.progressiveOverloadStats`
- **Features**:
  - Color-coded bars (progressing, maintaining, regressing)
  - Percentage change labels
  - Stats panel (progress rate, avg increase, status)
  - Thresholds (±2.5%)

## Data Flow

### Store Dependencies

```
workoutStore.workouts (source)
         │
         ├─► analyticsStore.muscleVolumeOverTime (computed)
         │   └─► MuscleVolumeChart
         │
         ├─► analyticsStore.durationTrendData (computed)
         │   └─► DurationTrendChart
         │
         ├─► analyticsStore.dailyVolumeMap (computed)
         │   └─► VolumeHeatmap
         │
         └─► analyticsStore.weeklyVolumeProgression (computed)
             └─► ProgressiveOverloadChart
```

### Period Filtering

1. User selects period in `PeriodSelector`
2. `useAnalyticsPeriod` updates `selectedPeriod` ref
3. URL query parameter `?period=...` is updated via router
4. `selectedPeriod` is passed as prop to chart components
5. Charts use `analyticsStore` getters which filter by period internally
6. Computed properties in `analyticsStore` re-calculate automatically

### Reactivity Chain

```
User action → Period change → URL update → Prop update →
Store computation → Component re-render → Chart update
```

## Adding New Analytics Charts

### Step-by-Step Guide

#### 1. Add Computed Property to analyticsStore

```javascript
// src/stores/analyticsStore.js
export const useAnalyticsStore = defineStore('analytics', () => {
  // ... existing code ...

  /**
   * New analytics data
   * @returns {Array} Computed analytics data
   */
  const myNewAnalytic = computed(() => {
    if (!filteredWorkouts.value.length) return []

    // Process workouts
    return filteredWorkouts.value.map((workout) => ({
      // ... your data transformation
    }))
  })

  return {
    // ... existing returns ...
    myNewAnalytic,
  }
})
```

#### 2. Create Utility Function (if needed)

```javascript
// src/utils/analyticsUtils.js (create if doesn't exist)

/**
 * Calculate my new metric
 * @param {Array} workouts - Array of workouts
 * @returns {Object} Calculated metrics
 */
export function calculateMyMetric(workouts) {
  // ... calculation logic
}
```

#### 3. Create Chart Component

```vue
<!-- src/pages/analytics/components/[category]/MyNewChart.vue -->
<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import BaseChart from '../shared/BaseChart.vue'

const { t } = useI18n()
const analyticsStore = useAnalyticsStore()
const { myNewAnalytic, loading } = storeToRefs(analyticsStore)

// Chart-specific logic
const chartData = computed(() => {
  // Transform store data if needed
  return myNewAnalytic.value
})
</script>

<template>
  <BaseChart
    :title="t('analytics.myNew.title')"
    :description="t('analytics.myNew.description')"
    :data="chartData"
    :loading="loading"
    :empty-title="t('analytics.myNew.emptyState')"
    empty-icon="bar-chart"
  >
    <template #default>
      <!-- Your SVG chart here -->
      <svg viewBox="0 0 800 400" class="w-full h-auto">
        <!-- ... -->
      </svg>
    </template>
  </BaseChart>
</template>
```

#### 4. Add i18n Translations

```json
// src/i18n/locales/en/analytics.json
{
  "myNew": {
    "title": "My New Chart",
    "description": "Description of what this chart shows",
    "emptyState": "No data available"
  }
}
```

```json
// src/i18n/locales/uk/analytics.json
{
  "myNew": {
    "title": "Мій Новий Графік",
    "description": "Опис того, що показує цей графік",
    "emptyState": "Дані відсутні"
  }
}
```

#### 5. Add to AnalyticsView

```vue
<!-- src/pages/analytics/AnalyticsView.vue -->
<script setup>
// ... existing imports ...
import MyNewChart from './components/[category]/MyNewChart.vue'

// Add to tabs array
const tabs = [
  // ... existing tabs ...
  {
    value: 'mynew',
    label: t('analytics.tabs.mynew'),
    icon: BarChart, // Import from lucide-vue-next
  },
]
</script>

<template>
  <!-- ... existing tabs ... -->

  <!-- Add new tab content -->
  <TabsContent value="mynew" class="tab-content mt-6 space-y-6">
    <MyNewChart :period="selectedPeriod" />
  </TabsContent>
</template>
```

#### 6. Create Tests

```javascript
// src/pages/analytics/components/[category]/__tests__/MyNewChart.spec.js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import MyNewChart from '../MyNewChart.vue'

describe('MyNewChart', () => {
  function createWrapper(initialState = {}) {
    return mount(MyNewChart, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              analytics: {
                myNewAnalytic: [],
                loading: false,
                ...initialState,
              },
            },
          }),
        ],
      },
    })
  }

  it('should render chart with data', () => {
    const wrapper = createWrapper({
      myNewAnalytic: [
        {
          /* test data */
        },
      ],
    })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('should show empty state when no data', () => {
    const wrapper = createWrapper({ myNewAnalytic: [] })
    // BaseChart handles empty state
    expect(wrapper.find('.base-chart').exists()).toBe(true)
  })

  // Add more tests...
})
```

## Testing Guidelines

### Test Organization

```
src/pages/analytics/
├── __tests__/
│   ├── AnalyticsView.spec.js          # Main view tests
│   ├── AnalyticsIntegration.spec.js   # End-to-end flow tests
│   ├── AnalyticsEdgeCases.spec.js     # Edge cases and boundary conditions
│   └── AnalyticsPerformance.spec.js   # Performance benchmarks
└── components/
    ├── shared/__tests__/
    │   ├── BaseChart.spec.js
    │   ├── PeriodSelector.spec.js
    │   ├── EmptyState.spec.js
    │   └── LoadingSkeleton.spec.js
    └── [category]/__tests__/
        └── [Component].spec.js
```

### Test Coverage Requirements

Each chart component should have tests for:

1. **Rendering**
   - Renders with data
   - Renders empty state
   - Renders loading state
   - Renders error state

2. **Data Processing**
   - Handles large datasets (100+ workouts)
   - Handles edge cases (single workout, no data, invalid data)
   - Correctly transforms store data

3. **Interactivity**
   - Tooltips display correctly
   - Click handlers work
   - Toggle controls update chart

4. **Accessibility**
   - Has proper ARIA labels
   - SVG has role="img"
   - Keyboard navigation works

5. **Responsive**
   - Works on mobile viewports
   - Scrolling works on overflow
   - Labels adjust for screen size

### Testing Patterns

#### Mock Pinia Store

```javascript
import { createTestingPinia } from '@pinia/testing'

const wrapper = mount(Component, {
  global: {
    plugins: [
      createTestingPinia({
        stubActions: false,
        initialState: {
          analytics: {
            someData: mockData,
            loading: false,
          },
        },
      }),
    ],
  },
})
```

#### Mock Composables

```javascript
vi.mock('@/composables/useContributionHeatmap', () => ({
  useContributionHeatmap: vi.fn(() => ({
    gridData: mockGridData,
    monthLabels: mockMonthLabels,
    weekdayLabels: mockWeekdayLabels,
  })),
}))
```

#### Test Computed Properties

```javascript
it('should compute chart data correctly', () => {
  const { wrapper, pinia } = createWrapper()
  const analyticsStore = useAnalyticsStore(pinia)

  // Access computed property
  const data = analyticsStore.myAnalytic

  expect(data).toHaveLength(expectedLength)
  expect(data[0]).toMatchObject(expectedShape)
})
```

## Performance Considerations

### Optimization Strategies

1. **Computed Properties Caching**
   - Pinia computed properties are automatically cached
   - Only re-compute when dependencies change
   - Avoid unnecessary array transformations

2. **SVG Rendering**
   - Use `<defs>` for repeated SVG elements (gradients, patterns)
   - Minimize DOM nodes (combine paths when possible)
   - Use `v-memo` for static elements in loops

3. **Data Limiting**
   - Limit chart data points displayed (e.g., max 52 weeks for line charts)
   - Use pagination or windowing for large datasets
   - Pre-calculate min/max values instead of computing per render

4. **Debouncing**
   - Debounce window resize handlers
   - Throttle scroll events if needed
   - Use `watchEffect` with proper cleanup

5. **Lazy Loading**
   - Charts are code-split by tab (only load when tab is active)
   - Use dynamic imports for heavy chart libraries if needed

### Performance Metrics

Target performance metrics (on mid-range mobile device):

- **Initial Render**: < 1000ms for 100 workouts
- **Tab Switch**: < 300ms
- **Period Change**: < 500ms (includes data re-computation)
- **Memory**: < 50MB for 365 workouts

### Monitoring Performance

```javascript
// Performance test example
it('should render efficiently with 100 workouts', () => {
  const startTime = performance.now()

  const wrapper = mount(ChartComponent, {
    // ... setup with 100 workouts
  })

  const endTime = performance.now()
  const renderTime = endTime - startTime

  expect(renderTime).toBeLessThan(1000) // < 1 second
})
```

## i18n Guidelines

### Translation Key Naming

Follow this pattern for analytics translations:

```
analytics.{tab}.{chart}.{section}.{key}
```

Examples:

- `analytics.muscles.volumeOverTime.title`
- `analytics.duration.trend.stats.average`
- `analytics.volume.heatmap.legend.more`

### Required Translations

Every chart must have:

1. **Title**: Main chart title
2. **Description**: Brief explanation
3. **Empty State**: Message when no data
4. **Axis Labels**: X and Y axis labels (if applicable)
5. **Legend**: Legend item labels
6. **Tooltips**: Tooltip text patterns
7. **Stats**: Stats panel labels

### Translation File Structure

```json
{
  "analytics": {
    "title": "Analytics",
    "tabs": {
      "muscles": "Muscles",
      "duration": "Duration",
      "volume": "Volume",
      "exercises": "Exercises"
    },
    "muscles": {
      "volumeOverTime": {
        "title": "Muscle Volume Over Time",
        "description": "Weekly volume per muscle group",
        "emptyState": "No muscle data available"
      }
    },
    "emptyStates": {
      "noData": "No data available",
      "noWorkouts": "Start logging workouts to see analytics"
    }
  }
}
```

### Using Translations

```vue
<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <BaseChart
    :title="t('analytics.muscles.volumeOverTime.title')"
    :description="t('analytics.muscles.volumeOverTime.description')"
  >
    <!-- Chart content -->
  </BaseChart>
</template>
```

## Accessibility Features

### WCAG 2.1 AA Compliance

All analytics charts are designed to meet WCAG 2.1 AA standards:

1. **Color Contrast**
   - Text: Minimum 4.5:1 ratio
   - UI elements: Minimum 3:1 ratio
   - Color is not the only indicator (use patterns, labels)

2. **Touch Targets**
   - Minimum 44x44px for interactive elements
   - Adequate spacing between clickable areas
   - Legend buttons are touch-friendly

3. **Keyboard Navigation**
   - All interactive elements are keyboard accessible
   - Tab order is logical
   - Focus indicators are visible

4. **Screen Readers**
   - SVG charts have `role="img"`
   - Descriptive `aria-label` on SVG elements
   - Tooltips accessible via `<title>` elements
   - Stats panels use semantic HTML

### Accessibility Checklist

- [ ] Chart has descriptive `aria-label`
- [ ] SVG has `role="img"`
- [ ] Data points have `<title>` for tooltips
- [ ] Icons have `aria-hidden="true"`
- [ ] Interactive elements have `aria-label`
- [ ] Toggle buttons have `aria-pressed` state
- [ ] Color contrast ratios meet WCAG AA
- [ ] Touch targets are minimum 44x44px
- [ ] Keyboard navigation works
- [ ] Focus indicators are visible

### Testing Accessibility

```javascript
describe('Accessibility', () => {
  it('should have aria-label on SVG', () => {
    const wrapper = createWrapper()
    const svg = wrapper.find('svg')
    expect(svg.attributes('aria-label')).toBeTruthy()
  })

  it('should have role="img" on SVG', () => {
    const wrapper = createWrapper()
    const svg = wrapper.find('svg')
    expect(svg.attributes('role')).toBe('img')
  })

  it('should have aria-hidden on decorative icons', () => {
    const wrapper = createWrapper()
    const icon = wrapper.find('svg[aria-hidden]')
    expect(icon.exists()).toBe(true)
  })
})
```

## Mobile-First Design

### Responsive Breakpoints

```css
/* Mobile: < 640px (default) */
/* Tablet: >= 640px (sm:) */
/* Desktop: >= 768px (md:) */
/* Large Desktop: >= 1024px (lg:) */
```

### Mobile Optimizations

1. **Horizontal Scrolling**
   - Charts use `overflow-x-auto` on mobile
   - Minimum chart width ensures readability
   - Smooth scrolling with `-webkit-overflow-scrolling: touch`

2. **Responsive Text**
   - Smaller font sizes on mobile
   - Hide less important labels on small screens
   - Abbreviate text where appropriate

3. **Touch Gestures**
   - Large touch targets (44x44px minimum)
   - Adequate spacing between elements
   - Visual feedback on touch

4. **Layout Adjustments**
   - Stats panels stack vertically on mobile
   - Legend buttons wrap to multiple rows
   - Tabs display 2x2 grid on mobile, 1x4 on desktop

### Testing Responsive Behavior

```javascript
it('should have responsive SVG classes', () => {
  const wrapper = createWrapper()
  const svg = wrapper.find('svg')

  expect(svg.classes()).toContain('w-full')
  expect(svg.classes()).toContain('min-w-[600px]')
})

it('should have overflow container for mobile', () => {
  const wrapper = createWrapper()
  const container = wrapper.find('.overflow-x-auto')
  expect(container.exists()).toBe(true)
})
```

## Troubleshooting

### Common Issues

**Issue: Charts not updating when workout data changes**

- **Cause**: Not using `storeToRefs()` to destructure store state
- **Solution**: Use `storeToRefs()` for reactive state

```javascript
// ❌ Wrong
const { muscleVolumeData } = analyticsStore

// ✅ Correct
const { muscleVolumeData } = storeToRefs(analyticsStore)
```

**Issue: Empty state not showing**

- **Cause**: `data` prop is `null` or `undefined` instead of empty array
- **Solution**: Ensure store returns empty array, not null

```javascript
// In analyticsStore
const myData = computed(() => {
  if (!filteredWorkouts.value.length) return [] // Not null
  // ... process data
})
```

**Issue: Performance degradation with large datasets**

- **Cause**: Computing expensive operations on every render
- **Solution**: Move computations to store computed properties

**Issue: SVG not rendering on mobile**

- **Cause**: Missing `viewBox` attribute or incorrect dimensions
- **Solution**: Always use `viewBox` and responsive classes

```vue
<svg viewBox="0 0 800 400" class="w-full h-auto">
  <!-- ... -->
</svg>
```

## Best Practices

1. **Always use BaseChart wrapper** for consistent loading/empty/error states
2. **Leverage Pinia computed properties** for data transformations
3. **Use `storeToRefs()` for reactivity** when destructuring store state
4. **Test with realistic datasets** (100+ workouts)
5. **Validate edge cases** (no data, single workout, extreme values)
6. **Follow mobile-first approach** (design for 375px width first)
7. **Ensure accessibility** (ARIA labels, keyboard nav, screen readers)
8. **Internationalize all text** (use `t()` function, never hardcode)
9. **Document complex logic** with JSDoc comments
10. **Profile performance** regularly with large datasets

## Resources

- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [vue-i18n Guide](https://vue-i18n.intlify.dev/)
- [SVG Accessibility](https://www.w3.org/TR/svg-aam-1.0/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Mobile-First CSS](https://web.dev/mobile-first-css/)

---

**Last Updated**: 2024-01-15
**Maintained By**: Development Team
**Questions?**: See project CLAUDE.md or create an issue
