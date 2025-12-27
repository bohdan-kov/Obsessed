# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Obsessed** is a mobile-first gym tracking application built with Vue 3, Firebase, and Tailwind CSS v4. It focuses on quick workout logging, real-time analytics, and progress tracking for gym enthusiasts.

## Development Commands

```sh
# Install dependencies
npm install

# Start development server with hot-reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint and auto-fix (uses cache)
npm run lint

# Format code with Prettier
npm run format

# Run all tests with watch mode
npm run test

# Run tests once (CI mode)
npm run test:run
```

## Agent Behavior Rules

**CRITICAL - Code Formatting:**

- **NEVER run `npm run format` or any Prettier command**
- **NEVER run formatting tools** (prettier, eslint --fix for formatting, etc.)
- Code formatting is handled exclusively by the developer through their IDE or manual execution
- Agents may run `npm run lint` for linting checks, but must NOT trigger automatic formatting
- Write clean, properly-indented code that follows existing patterns, but do not auto-format the codebase

**Rationale:** Automatic formatting by agents can create noisy commits and interfere with the developer's workflow and IDE integration.

## High-Level Architecture

### Application Entry & Initialization

1. **src/main.js** - Creates Vue app, registers Pinia, Router, and vue-i18n, imports global styles
2. **src/App.vue** - Root component that initializes Firebase auth via `authStore.initAuth()` in `onMounted` hook, renders `<RouterView>` and `<Toaster>` for notifications
3. **src/router/index.js** - Defines routes with auth guards (`requiresAuth`, `requiresGuest`, `requiresVerification`). **Critical:** Router waits for auth initialization before executing guards to prevent race conditions.

### Firebase Integration Pattern

**Three-layer architecture:**

1. **Configuration Layer** (`src/firebase/config.js`)
   - Validates all `VITE_FIREBASE_*` environment variables on initialization
   - Throws clear error if any Firebase config is missing
   - Exports initialized Firebase app instance

2. **Service Layer** (`src/firebase/auth.js`, `src/firebase/firestore.js`)
   - **auth.js**: Exports auth functions (signInWithGoogle, signInWithEmail, onAuthChange, etc.)
   - **firestore.js**: Exports Firestore utilities (fetchCollection, createDocument, updateDocument, subscribeToCollection, etc.) and COLLECTIONS constant
   - Uses modular Firebase SDK imports for tree-shaking

3. **Store Layer** (`src/stores/*.js`)
   - Pinia stores consume Firebase services
   - **authStore**: Manages authentication state with `initAuth()` that sets up Firebase auth listener
   - **workoutStore**: Manages workouts with real-time subscriptions
   - **analyticsStore**: Computes analytics from workout data (depends on workoutStore)
   - **exerciseStore**: Manages exercise library
   - **userStore**: Manages user profile data

**Important:** All Firebase real-time listeners MUST be cleaned up in `onUnmounted` hooks to prevent memory leaks.

### State Management Strategy

**Pinia Setup Stores (function syntax):**
```javascript
export const useMyStore = defineStore('myStore', () => {
  // State (refs)
  const data = ref([])

  // Getters (computed)
  const filteredData = computed(() => data.value.filter(...))

  // Actions (functions)
  async function fetchData() { ... }

  return { data, filteredData, fetchData }
})
```

**Store Dependencies:**
- **analyticsStore** depends on **workoutStore** data (reactive computations)
- **All stores** can access **authStore** for current user UID
- Use `storeToRefs()` when accessing reactive state in components

### Routing & Authentication Flow

**Route Meta Fields:**
- `requiresAuth: true` - Must be logged in
- `requiresGuest: true` - Must be logged out (login/register pages)
- `requiresVerification: true` - Must have verified email

**Navigation Guard Logic:**
1. Wait for `authStore.initializing` to become false
2. Check route meta requirements
3. Redirect to login if auth required but not authenticated
4. Redirect to dashboard if guest route but authenticated
5. Redirect to verify-email if verification required but email not verified

**Route Structure:**
- `/login`, `/register`, `/verify-email` - Auth pages (no layout)
- `/` - AppLayout wrapper with sidebar
  - `/` (Dashboard) - Main analytics dashboard
  - `/workouts` - Workout history
  - `/analytics` - Detailed analytics
  - `/settings` - User settings

### UI Architecture

**Component Organization:**
- `src/components/ui/` - shadcn-vue base components (Button, Card, Input, etc.)
- `src/components/` - App-specific components (QuickLogSheet, QuickLogButton)
- `src/pages/*/components/` - Page-specific components (StatCard, ChartSection, ExerciseTable)
- `src/layouts/` - Layout components (AppLayout, AppSidebar, MobileNav)

**Layout System:**
- **Desktop**: Collapsible sidebar with tooltips when collapsed
- **Mobile**: Bottom navigation bar + hamburger menu sheet
- Responsive breakpoints defined in `src/constants/config.js`

### Chart Implementation with shadcn-vue & @unovis/vue

**Technology Stack:**
- **@unovis/vue** - Data visualization library (VisLine, VisArea, VisGroupedBar, VisDonut)
- **shadcn-vue chart components** - Styling wrappers (ChartContainer, ChartTooltip, ChartCrosshair)
- **CSS variables** - Theme colors via `--chart-1` through `--chart-8` in `src/styles/globals.css`

#### Core Imports

**XY Charts (Bar/Line/Area):**
```javascript
import { VisAxis, VisGroupedBar, VisLine, VisArea, VisXYContainer } from '@unovis/vue'
import { ChartContainer, ChartCrosshair, ChartTooltip, ChartTooltipContent, componentToString } from '@/components/ui/chart'
```

**Donut/Pie Charts:**
```javascript
import { Donut } from '@unovis/ts'
import { VisDonut, VisSingleContainer } from '@unovis/vue'
```

#### Chart Structure (3 Required Parts)

**1. Data Transformation (Computed):**
```javascript
const chartData = computed(() => {
  return volumeByDay.value.map(d => ({
    date: new Date(d.date),    // X-axis: Date object
    volume: d.volume,          // Y-axis: number
  }))
})
```

**2. Chart Config (Labels & Colors):**
```javascript
const chartConfig = {
  volume: {
    label: t('common.volume'),
    color: 'var(--chart-1)',    // ALWAYS use CSS variables
  },
}
```

**3. Template:**
```vue
<ChartContainer :config="chartConfig" class="w-full">
  <div class="aspect-auto h-[300px] w-full">
    <VisXYContainer :data="chartData">
      <!-- Chart components -->
    </VisXYContainer>
  </div>
</ChartContainer>
```

#### Tooltip Configuration (CRITICAL)

**ChartCrosshair Pattern:**
- Place `<ChartTooltip />` BEFORE `<ChartCrosshair>` in template
- Use `componentToString()` to wrap `ChartTooltipContent`
- **labelFormatter** and **valueFormatter** customize display

**labelFormatter - CRITICAL DIFFERENCE:**
```javascript
// BAR CHART - receives INDEX (must look up data)
labelFormatter: (index) => {
  const dataPoint = chartData.value[Math.round(index)]
  return dataPoint?.weekLabel || ''
}

// LINE/AREA CHART - receives DATE directly
labelFormatter: (date) => {
  return new Date(date).toLocaleDateString(locale.value, {
    month: 'short', day: 'numeric'
  })
}
```

**valueFormatter - Weight Conversion:**
```javascript
const { formatWeight } = useUnits()

valueFormatter: (value, key) => {
  if (key === 'volume' || key === 'maxWeight') {
    return formatWeight(value, { precision: 0 })  // "150 kg" or "330 lbs"
  }
  return value.toLocaleString(locale.value, { maximumFractionDigits: 0 })
}
```

**Complete Example:**
```vue
<ChartTooltip />
<ChartCrosshair
  :template="componentToString(chartConfig, ChartTooltipContent, {
    indicator: 'line',
    labelFormatter: (date) => new Date(date).toLocaleDateString(locale.value, {
      month: 'short', day: 'numeric'
    }),
    valueFormatter: (value, key) => {
      if (key === 'volume') return formatWeight(value, { precision: 0 })
      return String(value)
    },
  })"
  :color="(_d, i) => {
    const colorMap = [null, chartConfig.volume.color]  // Map series index to colors
    return colorMap[i] || 'currentColor'
  }"
/>
```

#### Axis Configuration

**Standard X-Axis:**
```javascript
<VisAxis
  type="x"
  :x="(d) => d.date"
  :tick-line="false"
  :domain-line="false"
  :grid-line="false"          // No vertical grid lines
  :num-ticks="6"
  :tick-format="(d) => new Date(d).toLocaleDateString('uk-UA', {
    month: 'short', day: 'numeric'
  })"
/>
```

**Standard Y-Axis:**
```javascript
<VisAxis
  type="y"
  :num-ticks="5"
  :tick-line="false"
  :domain-line="false"
  :grid-line="true"           // Show horizontal grid lines for readability
  :tick-format="(value) => Math.round(value).toString()"
/>
```

**Best Practices:**
- **Grid lines:** Show horizontal (Y-axis), hide vertical (X-axis)
- **Tick count:** 3-6 for Y-axis, 5-8 for X-axis
- **Always round numbers** in tick-format for clean display
- **No rotation:** Keep labels horizontal when possible

**Dynamic Y-Domain (10% padding):**
```javascript
const yDomain = computed(() => {
  if (!chartData.value.length) return [0, 100]
  const maxValue = Math.max(...chartData.value.map(d => d.volume), 100)
  return [0, maxValue * 1.1]
})

<VisXYContainer :data="chartData" :y-domain="yDomain">
```

#### Chart Types

**Bar Chart:**
```javascript
<VisGroupedBar
  :x="(d) => d.weekIndex"     // Numeric index
  :y="(d) => d.volume"
  :color="chartConfig.volume.color"
  :rounded-corners="4"
/>
```

**Line Chart:**
```javascript
<VisLine
  :x="(d) => d.date"
  :y="(d) => d.volume"
  :color="chartConfig.volume.color"
  :line-width="2"
/>
```

**Area Chart (with gradient):**
```javascript
const svgDefs = `
  <linearGradient id="fillVolume" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stop-color="var(--color-volume)" stop-opacity="0.8" />
    <stop offset="95%" stop-color="var(--color-volume)" stop-opacity="0.1" />
  </linearGradient>
`

<VisXYContainer :svg-defs="svgDefs" ...>
  <VisArea
    :x="(d) => d.date"
    :y="(d) => d.volume"
    :color="'url(#fillVolume)'"
    :opacity="0.6"
  />
```

**Donut Chart:**
```javascript
const chartData = computed(() => {
  return muscleDistribution.value.map(m => ({
    muscle: m.muscle,
    value: m.sets,
    fill: `var(--color-${m.muscle})`,  // CSS variable per item
  }))
})

<VisSingleContainer :data="chartData">
  <VisDonut
    :value="(d) => d.value"
    :color="(d) => chartConfig[d.muscle].color"
    :arc-width="30"
    :central-label="totalValue.toString()"
  />
</VisSingleContainer>
```

#### Mobile-First Responsive Pattern

**Horizontal Scroll for Mobile:**
```javascript
const chartMinWidth = computed(() => {
  if (!isMobile.value || chartData.value.length <= 5) return 'auto'
  const minSpacing = 40  // px per data point
  return `${chartData.value.length * minSpacing}px`
})
```

```vue
<div ref="chartScrollRef" class="overflow-x-auto mobile-scroll">
  <div class="h-[300px] w-full" :style="{ minWidth: chartMinWidth }">
    <VisXYContainer ...>
  </div>
</div>

<style scoped>
.mobile-scroll {
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x;
}
</style>
```

**Auto-scroll to Latest:**
```javascript
onMounted(async () => {
  if (isMobile.value && chartScrollRef.value) {
    await nextTick()
    setTimeout(() => {
      chartScrollRef.value.scrollLeft = chartScrollRef.value.scrollWidth
    }, 100)
  }
})
```

#### i18n & Weight Units

**Always use locale-aware formatting:**
```javascript
const { t, locale } = useI18n()
const { formatWeight } = useUnits()

// Chart config labels
const chartConfig = {
  volume: { label: t('common.volume'), color: 'var(--chart-1)' }
}

// Date formatting
labelFormatter: (date) => new Date(date).toLocaleDateString(locale.value, {
  month: 'short', day: 'numeric'
})

// Weight formatting (CRITICAL: always use formatWeight)
valueFormatter: (value, key) => {
  if (key === 'volume') return formatWeight(value, { precision: 0 })
  return value.toLocaleString(locale.value)
}
```

#### Empty & Loading States

**Empty State:**
```vue
<CardContent v-if="chartData.length">
  <!-- Chart -->
</CardContent>
<CardContent v-else>
  <div class="flex flex-col items-center justify-center py-12 text-muted-foreground">
    <TrendingUp class="w-12 h-12 mb-2 opacity-50" />
    <p class="text-sm">{{ t('analytics.emptyStates.noData') }}</p>
  </div>
</CardContent>
```

#### Key Takeaways

**CRITICAL - DO:**
- ✅ **BAR CHARTS:** Use index lookup in `labelFormatter: (index) => chartData[Math.round(index)]?.label`
- ✅ **LINE CHARTS:** Use date directly in `labelFormatter: (date) => new Date(date).toLocaleDateString()`
- ✅ **WEIGHTS:** Always call `formatWeight()` for volume/maxWeight values
- ✅ **COLORS:** Use `var(--chart-N)` CSS variables, never hardcoded hex
- ✅ **LOCALE:** Use `locale.value` from `useI18n()` for all date/number formatting
- ✅ Place `<ChartTooltip />` before `<ChartCrosshair>`
- ✅ Use `computed()` for data transformations
- ✅ Add empty states for no data
- ✅ Implement horizontal scroll for mobile with many data points
- ✅ Test on 375px-428px mobile viewports

**CRITICAL - DON'T:**
- ❌ **Don't use `d.label` in bar chart labelFormatter** - you'll get undefined (use index lookup!)
- ❌ Don't forget `formatWeight()` for weight values
- ❌ Don't use hardcoded colors (breaks dark mode)
- ❌ Don't use hardcoded locale strings
- ❌ Don't forget `:color` mapping on `ChartCrosshair`
- ❌ Don't forget `componentToString()` wrapper

### Grid/Heatmap Animation Pattern

**When to Use:**
- Heatmap visualizations (GitHub contribution-style grids)
- Calendar-based views (workout frequency, activity tracking)
- Grid-based data visualizations with many cells (20+ elements)
- Any component with a 2D grid layout that benefits from staggered entrance

**Animation Philosophy:**
- **Fast & snappy**: Entrance animations complete in ~320ms total (300ms + 14ms stagger)
- **Ultra-fast stagger**: 2-14ms per cell (imperceptible individually, beautiful collectively)
- **Polished hover**: 200ms transitions with scale and shadow effects
- **Accessibility-first**: Full `prefers-reduced-motion` support

**Reference Implementation:** `/src/pages/analytics/components/volume/VolumeHeatmap.vue`

#### Animation Structure

**1. Container Entrance (300ms)**
Add the `heatmap-entrance` class to the main heatmap container:

```vue
<template>
  <div class="contribution-heatmap heatmap-entrance">
    <!-- Grid content -->
  </div>
</template>
```

```css
/* Entrance animation - 300ms fade-in with subtle translateY */
.heatmap-entrance {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**2. Cell Stagger Animation (2-14ms delays)**

**CRITICAL:** This is what makes the animation feel polished and premium.

```css
/* Day Cells with stagger entrance */
.day-cell {
  /* Base styles */
  width: var(--cell-size);
  height: var(--cell-size);
  aspect-ratio: 1 / 1;
  border-radius: 0.125rem;
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;

  /* Cell entrance animation with backwards fill */
  animation: cellFadeIn 0.3s ease-out backwards;
}

/* Ultra-fast stagger: 2ms increments capped at 14ms */
.day-cell:nth-child(1) { animation-delay: 0ms; }
.day-cell:nth-child(2) { animation-delay: 2ms; }
.day-cell:nth-child(3) { animation-delay: 4ms; }
.day-cell:nth-child(4) { animation-delay: 6ms; }
.day-cell:nth-child(5) { animation-delay: 8ms; }
.day-cell:nth-child(6) { animation-delay: 10ms; }
.day-cell:nth-child(7) { animation-delay: 12ms; }
.day-cell:nth-child(n+8) { animation-delay: 14ms; } /* Cap at 14ms for remaining cells */

@keyframes cellFadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

**Why 2-14ms stagger works:**
- **Imperceptible individually**: 2ms is below human perception threshold
- **Beautiful collectively**: Creates a smooth cascade effect across the grid
- **Performance-friendly**: Minimal animation overhead, 60fps-ready
- **Column-major order**: Grid fills top-to-bottom, left-to-right (CSS Grid `grid-auto-flow: column`)
- **Capped at 14ms**: Prevents overly long delays for large grids

**3. Legend Delayed Entrance (150ms delay)**

The legend appears slightly after the heatmap for a polished, layered effect:

```css
.legend {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-end;
  padding-top: 0.75rem;
  border-top: 1px solid hsl(var(--border));
  margin-top: 0.5rem;

  /* Delayed entrance: Appears 150ms after heatmap starts */
  animation: fadeIn 0.3s ease-out 0.15s backwards;
}
```

#### Hover & Interaction Effects

**Cell Hover (200ms transition):**

```css
.day-cell:hover,
.day-cell:focus {
  transform: scale(1.2);
  outline: none;
  box-shadow: 0 0 0 2px hsl(var(--primary) / 0.3),
              0 4px 8px -2px hsl(var(--primary) / 0.2);
  z-index: 10;
  border-color: hsl(var(--primary) / 0.4);
}
```

**"Today" Cell Pulse Animation:**

```css
.day-cell.is-today {
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 1px hsl(var(--primary)),
              0 0 12px -2px hsl(var(--primary) / 0.5);
  animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse-ring {
  0%, 100% {
    box-shadow: 0 0 0 1px hsl(var(--primary)),
                0 0 12px -2px hsl(var(--primary) / 0.5);
  }
  50% {
    box-shadow: 0 0 0 1px hsl(var(--primary)),
                0 0 16px -2px hsl(var(--primary) / 0.7);
  }
}
```

**Legend Cell Hover:**

```css
.legend-cell {
  width: var(--cell-size);
  height: var(--cell-size);
  aspect-ratio: 1 / 1;
  border-radius: 0.125rem;
  border: 1px solid hsl(var(--border) / 0.3);
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.legend-cell:hover {
  transform: scale(1.15);
  border-color: hsl(var(--border));
  box-shadow: 0 2px 4px -1px hsl(var(--primary) / 0.15);
}
```

#### Mobile-Specific Enhancements

**Larger touch feedback on mobile:**

```css
@media (max-width: 768px) {
  .contribution-heatmap {
    --cell-size: 0.625rem; /* 10px - Mobile size */
  }

  .day-cell:hover,
  .day-cell:focus {
    transform: scale(1.3); /* Larger touch target feedback */
  }
}
```

#### Accessibility: prefers-reduced-motion

**CRITICAL:** Always respect user motion preferences.

```css
@media (prefers-reduced-motion: reduce) {
  /* Disable entrance animations */
  .heatmap-entrance,
  .day-cell,
  .legend {
    animation: none !important;
  }

  /* Disable transitions but keep basic interactivity */
  .day-cell,
  .legend-cell {
    transition: opacity 100ms ease;
  }

  .day-cell.is-today {
    animation: none;
  }

  /* Keep only essential hover feedback */
  .day-cell:hover,
  .day-cell:focus {
    transform: none;
    opacity: 0.8;
  }
}
```

#### Complete Example

**Template:**
```vue
<template>
  <div v-if="isEmpty" class="empty-state">
    <Calendar class="w-12 h-12 mb-2 opacity-50" />
    <p class="text-sm">No data available</p>
  </div>

  <div v-else class="contribution-heatmap heatmap-entrance">
    <!-- Grid container -->
    <div class="weeks-grid" :style="gridColumnsStyle">
      <div
        v-for="(cell, index) in gridData"
        :key="index"
        :class="['day-cell', cell.colorClass, { 'is-today': cell.isToday }]"
        @mouseenter="handleCellHover(cell, $event)"
        @mouseleave="handleCellLeave"
      />
    </div>

    <!-- Legend -->
    <div class="legend">
      <span class="text-xs text-muted-foreground">Less</span>
      <div class="legend-colors">
        <div v-for="level in [0, 1, 2, 3]" :key="level" :class="['legend-cell', getColorClass(level)]" />
      </div>
      <span class="text-xs text-muted-foreground">More</span>
    </div>
  </div>
</template>
```

**Styles:**
```css
/* CSS Variables for responsive cell sizing */
.contribution-heatmap {
  --cell-size: 0.875rem; /* 14px - Desktop */
  --cell-gap: 0.125rem;  /* 2px */
}

/* Container entrance */
.heatmap-entrance {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Grid cells with stagger */
.day-cell {
  width: var(--cell-size);
  height: var(--cell-size);
  aspect-ratio: 1 / 1;
  border-radius: 0.125rem;
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
  animation: cellFadeIn 0.3s ease-out backwards;
}

.day-cell:nth-child(1) { animation-delay: 0ms; }
.day-cell:nth-child(2) { animation-delay: 2ms; }
.day-cell:nth-child(3) { animation-delay: 4ms; }
.day-cell:nth-child(4) { animation-delay: 6ms; }
.day-cell:nth-child(5) { animation-delay: 8ms; }
.day-cell:nth-child(6) { animation-delay: 10ms; }
.day-cell:nth-child(7) { animation-delay: 12ms; }
.day-cell:nth-child(n+8) { animation-delay: 14ms; }

@keyframes cellFadeIn {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

.day-cell:hover,
.day-cell:focus {
  transform: scale(1.2);
  outline: none;
  box-shadow: 0 0 0 2px hsl(var(--primary) / 0.3),
              0 4px 8px -2px hsl(var(--primary) / 0.2);
  z-index: 10;
  border-color: hsl(var(--primary) / 0.4);
}

.legend {
  animation: fadeIn 0.3s ease-out 0.15s backwards;
}

/* Mobile */
@media (max-width: 768px) {
  .contribution-heatmap { --cell-size: 0.625rem; }
  .day-cell:hover, .day-cell:focus { transform: scale(1.3); }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .heatmap-entrance, .day-cell, .legend { animation: none !important; }
  .day-cell, .legend-cell { transition: opacity 100ms ease; }
  .day-cell:hover, .day-cell:focus { transform: none; opacity: 0.8; }
}
```

#### Performance Notes

**Why This Pattern is Fast:**
- **CSS-only animations**: No JavaScript event loop overhead
- **GPU-accelerated**: `transform` and `opacity` use compositor thread
- **Minimal reflows**: No layout-affecting properties animated
- **Backwards fill mode**: Prevents FOUC (Flash of Unstyled Content)
- **Capped stagger**: 14ms max delay prevents excessive animation queue

**Grid Layout Considerations:**
- Works best with CSS Grid `grid-auto-flow: column` (column-major order)
- Stagger delays assume 7-row grids (weekly calendar pattern)
- For different grid sizes, adjust `nth-child` selectors accordingly

**Browser Performance:**
- Tested on 365-cell grids (52 weeks × 7 days)
- 60fps on modern mobile devices
- Graceful degradation on older devices via `prefers-reduced-motion`

#### Key Takeaways

**DO:**
- ✅ Use 300ms for container entrance with `ease-out`
- ✅ Use 2-14ms stagger increments for cell animations
- ✅ Cap stagger delays at 14ms for cells beyond the 7th
- ✅ Use 200ms `cubic-bezier(0.4, 0, 0.2, 1)` for hover transitions
- ✅ Add 150ms delay to legend entrance
- ✅ Implement `prefers-reduced-motion` support
- ✅ Use `animation-fill-mode: backwards` to prevent FOUC
- ✅ Use `transform: scale()` and `opacity` for GPU acceleration
- ✅ Increase hover scale on mobile (1.3x vs 1.2x desktop)

**DON'T:**
- ❌ Don't use stagger delays > 20ms (feels sluggish)
- ❌ Don't animate layout-affecting properties (`width`, `height`, `margin`)
- ❌ Don't forget `z-index: 10` on hover (prevents clipping)
- ❌ Don't skip `prefers-reduced-motion` media query
- ❌ Don't use linear easing (feels robotic)
- ❌ Don't animate more than 500 cells without virtualization

### Internationalization (i18n)

**Technology:** vue-i18n with Composition API mode

**Locales Structure:**
- `src/i18n/locales/uk/` - Ukrainian translations (default)
- `src/i18n/locales/en/` - English translations
- Each locale has namespaced JSON files: `common.json`, `dashboard.json`, `workout.json`, `settings.json`, `auth.json`, `errors.json`
- Locale modules combine these in `index.js` (e.g., `src/i18n/locales/uk/index.js`)

**i18n Configuration (`src/i18n/index.js`):**
- **Initial locale detection**: localStorage > browser language > default ('uk')
- **Composition API mode**: `legacy: false` for `<script setup>` compatibility
- **Global injection enabled**: `$t` available in templates
- **RTL-ready**: Future-proofed with `dir` attribute support
- **Development warnings**: Missing translation warnings only in dev mode

**Usage Pattern:**
```javascript
// In components
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()

// Or use the useLocale composable
import { useLocale } from '@/composables/useLocale'
const { t, currentLocale, changeLocale } = useLocale()
```

**Important:**
- All new UI text MUST use i18n translations (no hardcoded strings)
- Translation keys follow namespace pattern: `namespace.section.key` (e.g., `dashboard.stats.totalWorkouts`)
- When adding features, update BOTH `uk/` and `en/` locale files
- The old `src/constants/strings.js` file is deprecated and will be removed

### Constants & Configuration

**src/constants/config.js** - All magic numbers and configuration:
- UI constants (touch target sizes, breakpoints, sidebar dimensions)
- Workout constants (RPE scale, weight limits, default rest time)
- Analytics constants (chart display limits, default periods)
- Performance constants (debounce delays, cache duration)
- Firebase constants (batch sizes, retry config)
- localStorage keys (prefixed with `obsessed_`)
- Feature flags

### Composables Pattern

**src/composables/useErrorHandler.js** - Centralized error handling:
- `handleError(error, userMessage, context)` - Logs errors in dev, shows toast to user
- Environment-aware (console.error only in development)
- Prepared for production error tracking (Sentry/LogRocket integration point)

**src/composables/useLocale.js** - Locale management:
- `currentLocale` - Reactive current locale code
- `availableLocales` - List of supported locales with metadata (name, flag, RTL)
- `isRTL` - Whether current locale is RTL (future-proof for Arabic/Hebrew)
- `changeLocale(code)` - Switch locale (updates vue-i18n → userStore → localStorage → Firestore)
- **Automatic sync**: Watches userStore settings and updates locale when changed from Firestore
- **Coordination flow**: UI updates immediately via vue-i18n, then persists to userStore (localStorage + Firestore)

**src/composables/useUnits.js** - Weight unit conversion and formatting:
- `weightUnit` - Current weight unit from user settings ('kg' | 'lbs')
- `unitLabel` - Localized unit label from i18n
- `availableWeightUnits` - List of supported weight units
- `convertWeight(value, options)` - Convert between units with configurable precision
- `formatWeight(value, options)` - Format weight with locale-aware number formatting and unit label
- `toStorageUnit(value)` - Convert from display unit to storage unit (kg) for database saves
- `fromStorageUnit(value)` - Convert from storage unit (kg) to display unit for UI rendering
- `changeWeightUnit(unit)` - Update user's weight unit preference
- **Storage convention**: All weights stored in kg in Firestore, converted to user's preferred unit for display
- **Locale-aware formatting**: Uses `Intl.NumberFormat` with current locale for proper decimal/thousands separators

**src/composables/useAuth.js** - Auth utilities for components

**src/composables/useFirestore.js** - Firestore helpers

### Testing Architecture

**Technology:** Vitest with jsdom environment, @vue/test-utils, @pinia/testing

**Global Test Setup (`vitest.setup.js`):**
- **vue-i18n mocking**: `$t` and `t` functions mocked globally to return translation keys
- **useUnits mocking**: Global mock with kg defaults and pass-through conversion functions
- **useLocale mocking**: Global mock with 'uk' default and available locales
- **Automatic setup**: Runs before all test files via Vitest `setupFiles` config
- **Why global mocks?**: i18n and unit composables are used across nearly all components, mocking globally reduces test boilerplate

**Test Organization:**
- Store tests: `src/stores/__tests__/*.spec.js` (authStore, workoutStore, analyticsStore)
- Component tests: `src/pages/*/components/__tests__/*.spec.js` and `src/components/__tests__/*.spec.js`

**Critical Testing Patterns:**

1. **Mock Firebase before imports:**
```javascript
// BEFORE importing stores
vi.mock('@/firebase/firestore', () => ({
  fetchCollection: vi.fn(),
  createDocument: vi.fn(),
  // ... all exports including those used by authStore
}))
```

2. **Never assign to computed properties directly:**
```javascript
// ❌ WRONG
store.workouts = [mockData]

// ✅ CORRECT - use mocked Firebase action
fetchCollection.mockResolvedValue([mockData])
await store.fetchWorkouts()
```

3. **Set auth state properly:**
```javascript
function setAuthUser(userId = 'test-user-id') {
  onAuthChange.mockImplementation((callback) => {
    callback(userId ? { uid: userId, email: 'test@test.com' } : null)
    return vi.fn() // unsubscribe function
  })
  const authStore = useAuthStore()
  authStore.initAuth()
}
```

4. **Component testing with Pinia:**
```javascript
mount(Component, {
  global: {
    plugins: [
      createTestingPinia({
        initialState: { storeName: { ... } }
      })
    ]
  }
})
```

5. **i18n in tests (already globally mocked):**
- `$t('key')` and `t('key')` return the key itself for easy assertions
- Locale is always 'uk' by default in tests
- No need to mock i18n in individual test files unless overriding behavior

## Styling System

- **Tailwind CSS v4**: Uses new `@import "tailwindcss"` syntax and `@theme inline` directives in `src/styles/globals.css`
- **PostCSS**: Configured with `@tailwindcss/postcss` plugin (NOT the old `tailwindcss` plugin)
- **Design tokens**: CSS variables using OKLCH color space for better color manipulation
- **Dark mode**: Class-based strategy (`darkMode: ["class"]`)
- **Animations**: tw-animate-css library for additional animations
- **Path alias**: `@` → `src/` directory (configured in `vite.config.js`)

## shadcn-vue Integration

- **Configuration**: `components.json` defines component structure and aliases
- **Style**: "new-york" variant
- **Base color**: neutral with CSS variables enabled
- **Icon library**: lucide-vue-next
- **Component location**: UI components go in `src/components/ui/`
- **Utils location**: Utility functions in `src/lib/utils`
- **Adding components**: Use `npx shadcn-vue add @shadcn/[component-name]`
- **Toast system**: Custom implementation in `src/components/ui/toast/` (use-toast.js, Toast.vue, Toaster.vue)

## Key Dependencies

- **Vue ecosystem**: vue@3.5.25, vue-router@4.6.3, pinia@3.0.4, vue-i18n@9.14.5
- **Firebase**: firebase@12.6.0 (modular SDK with tree-shaking)
- **UI components**: reka-ui@2.6.0 (headless), lucide-vue-next (icons), vue-sonner@2.0.9
- **Styling utilities**: class-variance-authority, clsx, tailwind-merge
- **VueUse**: @vueuse/core@14.1.0 for Vue composition utilities
- **Form validation**: vee-validate@4.15.1, @vee-validate/zod@4.15.1, zod@3.25.76
- **Testing**: vitest@4.0.14, @vue/test-utils@2.4.6, @pinia/testing@1.0.3, jsdom@27.2.0

## Configuration Files

- **Node version**: Requires Node.js ^20.19.0 or >=22.12.0
- **Environment**: `.env.local` required with all `VITE_FIREBASE_*` variables (see src/firebase/config.js for validation)
- **Vite**: Vue plugin and Vue DevTools enabled
- **ESLint**: Flat config with Vue essential rules and Prettier skip formatting
- **PostCSS**: Uses `@tailwindcss/postcss` (v4) not the legacy `tailwindcss` plugin
- **Tailwind**: Class-based dark mode, content scanning includes all Vue/JS/TS files
- **Vitest**: Configured in `vitest.config.js` with jsdom environment, `@` path alias, and global setup file (`vitest.setup.js`)

## Code Style

- Vue 3 Composition API with `<script setup>` syntax (avoid Options API)
- Pinia stores use the function/setup syntax: `defineStore(() => { ... })`
- Prettier formatting is configured (see `.prettierrc.json`)
- **i18n-first approach**: All UI text must use vue-i18n translations (no hardcoded strings)
- **Bilingual support**: Ukrainian (default) and English locales with proper fallbacks
- Translation keys use namespace pattern: `namespace.section.key`
- All magic numbers go in `src/constants/config.js`
- **Weight storage convention**: Always store weights in kg in Firestore, use `useUnits` composable for display conversion
- JSDoc comments for complex functions
- ARIA labels for accessibility (screen readers)
- Minimum 44x44px touch targets (WCAG 2.1)
- Always cleanup Firebase subscriptions in `onUnmounted` hooks
