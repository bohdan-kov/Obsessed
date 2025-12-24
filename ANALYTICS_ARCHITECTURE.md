# Analytics Section - Technical Architecture

**Version**: 1.0
**Date**: 2024-12-14
**Related Documents**:
- [ANALYTICS_PRD.md](./ANALYTICS_PRD.md) - Product Requirements
- [CLAUDE.md](./CLAUDE.md) - Project Guidelines

---

## Table of Contents

1. [Folder Structure](#1-folder-structure)
2. [Component Architecture](#2-component-architecture)
3. [State Management (Pinia Store)](#3-state-management-pinia-store)
4. [Data Flow Patterns](#4-data-flow-patterns)
5. [Composables Strategy](#5-composables-strategy)
6. [Utility Functions Organization](#6-utility-functions-organization)
7. [Chart Component Patterns](#7-chart-component-patterns)
8. [i18n Integration](#8-i18n-integration)
9. [Route Configuration](#9-route-configuration)
10. [Phase-by-Phase Implementation](#10-phase-by-phase-implementation)
11. [Code Reuse Strategy](#11-code-reuse-strategy)
12. [Testing Architecture](#12-testing-architecture)
13. [Performance Architecture](#13-performance-architecture)
14. [Mobile Responsiveness Strategy](#14-mobile-responsiveness-strategy)
15. [Implementation Checklist](#15-implementation-checklist)

---

## 1. Folder Structure

### Complete Directory Layout

```
src/pages/analytics/
├── AnalyticsView.vue                      # Main analytics page with tabs
├── components/
│   ├── shared/
│   │   ├── BaseChart.vue                  # Abstract chart wrapper with loading/empty states
│   │   ├── PeriodSelector.vue             # Reusable period selector (7/30/90 days, All time)
│   │   ├── EmptyState.vue                 # Consistent empty state component
│   │   ├── LoadingSkeleton.vue            # Loading skeleton for charts/tables
│   │   └── __tests__/
│   │       ├── BaseChart.spec.js
│   │       ├── PeriodSelector.spec.js
│   │       └── EmptyState.spec.js
│   │
│   ├── muscles/
│   │   ├── MuscleVolumeChart.vue          # Line chart - Feature 1.1 (MVP)
│   │   ├── MuscleBalanceTable.vue         # Balance scorecard - Feature 1.2 (V1.1)
│   │   ├── MuscleFatigueHeatmap.vue       # Future - Feature 1.3 (V2)
│   │   └── __tests__/
│   │       ├── MuscleVolumeChart.spec.js
│   │       └── MuscleBalanceTable.spec.js
│   │
│   ├── duration/
│   │   ├── DurationTrendChart.vue         # Scatter + line - Feature 2.1 (MVP)
│   │   ├── DurationBreakdown.vue          # Stacked bar - Feature 2.2 (V1.1)
│   │   ├── EfficiencyScoreCard.vue        # Score card - Feature 2.3 (V1.2)
│   │   └── __tests__/
│   │       ├── DurationTrendChart.spec.js
│   │       ├── DurationBreakdown.spec.js
│   │       └── EfficiencyScoreCard.spec.js
│   │
│   ├── volume/
│   │   ├── VolumeHeatmap.vue              # Calendar heatmap - Feature 3.1 (MVP)
│   │   ├── VolumeByTypeChart.vue          # Donut chart - Feature 3.2 (V1.1)
│   │   ├── ProgressiveOverloadChart.vue   # Bar chart - Feature 3.3 (MVP)
│   │   └── __tests__/
│   │       ├── VolumeHeatmap.spec.js
│   │       ├── VolumeByTypeChart.spec.js
│   │       └── ProgressiveOverloadChart.spec.js
│   │
│   └── exercises/
│       ├── ExerciseProgressTable.vue      # Main table - Feature 4.1 (MVP)
│       ├── ExerciseProgressRow.vue        # Expandable row - Feature 4.1 (MVP)
│       ├── ExerciseMiniChart.vue          # Sparkline for expanded rows
│       ├── PRTimeline.vue                 # Timeline - Feature 4.2 (V1.1)
│       ├── PRTimelineItem.vue             # Timeline item component
│       ├── StrengthStandardsCard.vue      # Future - Feature 4.3 (V2)
│       └── __tests__/
│           ├── ExerciseProgressTable.spec.js
│           ├── ExerciseProgressRow.spec.js
│           ├── PRTimeline.spec.js
│           └── PRTimelineItem.spec.js
│
└── __tests__/
    └── AnalyticsView.spec.js

src/composables/
├── useAnalyticsCharts.js                  # Chart configuration helpers
├── useProgressiveOverload.js              # Progressive overload calculations
├── useExerciseProgress.js                 # Exercise progress/1RM calculations
├── useVolumeHeatmap.js                    # Volume heatmap data transformation
├── useMuscleBalance.js                    # Muscle balance calculations
└── __tests__/
    ├── useAnalyticsCharts.spec.js
    ├── useProgressiveOverload.spec.js
    ├── useExerciseProgress.spec.js
    ├── useVolumeHeatmap.spec.js
    └── useMuscleBalance.spec.js

src/utils/
├── statsUtils.js                          # Statistical calculations (regression, std dev)
├── strengthUtils.js                       # 1RM, trend, PR calculations
├── chartUtils.js                          # Chart helpers (colors, transformers)
├── dateUtils.js                           # (extend existing) Week number, grouping
└── __tests__/
    ├── statsUtils.spec.js
    ├── strengthUtils.spec.js
    ├── chartUtils.spec.js
    └── dateUtils.spec.js (extend existing)

src/constants/
└── config.js                              # (extend) Add ANALYTICS_CONFIG

src/i18n/locales/
├── en/
│   └── analytics.json                     # English translations
└── uk/
    └── analytics.json                     # Ukrainian translations
```

### Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Page components | `[Name]View.vue` | `AnalyticsView.vue` |
| Feature components | `[Feature][Type].vue` | `MuscleVolumeChart.vue` |
| Shared components | `[Purpose].vue` | `PeriodSelector.vue` |
| Composables | `use[Feature].js` | `useExerciseProgress.js` |
| Utilities | `[domain]Utils.js` | `strengthUtils.js` |
| Tests | `[Component].spec.js` | `ExerciseProgressTable.spec.js` |

---

## 2. Component Architecture

### Component Hierarchy

```
AnalyticsView.vue
├── Tabs (shadcn-vue)
│   ├── TabsList
│   │   ├── TabsTrigger (Muscles)
│   │   ├── TabsTrigger (Duration)
│   │   ├── TabsTrigger (Volume)
│   │   └── TabsTrigger (Exercises)
│   │
│   └── TabsContent (for each tab)
│       ├── PeriodSelector (shared)
│       │
│       ├── [Muscles Tab]
│       │   ├── MuscleVolumeChart
│       │   │   └── BaseChart
│       │   └── MuscleBalanceTable (V1.1)
│       │
│       ├── [Duration Tab]
│       │   ├── DurationTrendChart
│       │   │   └── BaseChart
│       │   ├── DurationBreakdown (V1.1)
│       │   │   └── BaseChart
│       │   └── EfficiencyScoreCard (V1.2)
│       │
│       ├── [Volume Tab]
│       │   ├── VolumeHeatmap
│       │   │   └── FrequencyChart (reused from Dashboard)
│       │   ├── VolumeByTypeChart (V1.1)
│       │   │   └── BaseChart
│       │   └── ProgressiveOverloadChart
│       │       └── BaseChart
│       │
│       └── [Exercises Tab]
│           ├── ExerciseProgressTable
│           │   └── ExerciseProgressRow (multiple)
│           │       └── ExerciseMiniChart (when expanded)
│           └── PRTimeline (V1.1)
│               └── PRTimelineItem (multiple)
```

### Major Component Contracts

#### AnalyticsView.vue

```vue
<script setup>
import { ref, computed } from 'vue'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const analyticsStore = useAnalyticsStore()

// Tab state (can sync with URL query param)
const activeTab = ref('muscles') // 'muscles' | 'duration' | 'volume' | 'exercises'

// Period state (shared across all tabs)
const selectedPeriod = ref('last_30_days') // '7d' | '30d' | '90d' | 'all'

// Computed filtered data based on period
const periodData = computed(() => {
  return analyticsStore.getDataForPeriod(selectedPeriod.value)
})
</script>

<template>
  <div class="analytics-view p-4 md:p-6">
    <header class="mb-6">
      <h1 class="text-3xl font-bold">{{ $t('analytics.title') }}</h1>
    </header>

    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="mb-6">
        <TabsTrigger value="muscles">
          <Icon name="target" class="mr-2" />
          {{ $t('analytics.tabs.muscles') }}
        </TabsTrigger>
        <TabsTrigger value="duration">
          <Icon name="clock" class="mr-2" />
          {{ $t('analytics.tabs.duration') }}
        </TabsTrigger>
        <TabsTrigger value="volume">
          <Icon name="bar-chart" class="mr-2" />
          {{ $t('analytics.tabs.volume') }}
        </TabsTrigger>
        <TabsTrigger value="exercises">
          <Icon name="dumbbell" class="mr-2" />
          {{ $t('analytics.tabs.exercises') }}
        </TabsTrigger>
      </TabsList>

      <PeriodSelector v-model="selectedPeriod" class="mb-6" />

      <TabsContent value="muscles">
        <MuscleVolumeChart :period="selectedPeriod" />
        <MuscleBalanceTable v-if="isV1_1OrLater" :period="selectedPeriod" />
      </TabsContent>

      <!-- Other tabs... -->
    </Tabs>
  </div>
</template>
```

**Props**: None (root component)
**Emits**: None
**Key State**:
- `activeTab`: Current tab ('muscles' | 'duration' | 'volume' | 'exercises')
- `selectedPeriod`: Time range filter ('7d' | '30d' | '90d' | 'all')

---

#### ExerciseProgressTable.vue

```typescript
interface Props {
  period?: string // '7d' | '30d' | '90d' | 'all' (default: '30d')
}

interface Emits {
  'exercise-click': (exerciseName: string) => void
}

interface ExerciseProgressRow {
  name: string
  estimated1RM: number | null
  bestPR: {
    weight: number
    reps: number
    date: Date
  }
  lastPerformed: Date
  trend: 'up' | 'down' | 'flat' | 'insufficient_data'
  trendPercentage: number
  status: {
    label: string
    color: 'green' | 'red' | 'yellow' | 'gray'
    icon: string
  }
  history: Array<{
    date: Date
    sets: Array<{ weight: number, reps: number }>
  }>
}
```

**Usage**:
```vue
<ExerciseProgressTable
  :period="selectedPeriod"
  @exercise-click="navigateToExercise"
/>
```

---

#### ProgressiveOverloadChart.vue

```typescript
interface Props {
  period?: string // Default: 'last_30_days'
  showTargetLine?: boolean // Default: true
  colorScheme?: 'default' | 'colorblind' // Default: 'default'
}

interface WeeklyVolumeData {
  weekNumber: number
  weekStart: Date
  volume: number
  change: number // Percentage change from previous week
  status: 'progressing' | 'maintaining' | 'regressing'
}
```

**Usage**:
```vue
<ProgressiveOverloadChart
  :period="selectedPeriod"
  :show-target-line="true"
/>
```

---

#### MuscleVolumeChart.vue

```typescript
interface Props {
  period?: string // Default: '30d'
  muscleGroups?: string[] // If provided, show only these muscles
  showLegend?: boolean // Default: true
}

interface MuscleVolumeDataPoint {
  week: string // 'Dec 1', 'Dec 8', etc.
  weekStart: Date
  back: number
  chest: number
  legs: number
  shoulders: number
  biceps: number
  triceps: number
  core: number
  calves: number
}
```

---

### Shared vs Page-Specific Components

| Component | Type | Reason |
|-----------|------|--------|
| `BaseChart.vue` | Shared | Used by all chart components |
| `PeriodSelector.vue` | Shared | Used across all tabs |
| `EmptyState.vue` | Shared | Consistent empty state UX |
| `LoadingSkeleton.vue` | Shared | Consistent loading UX |
| `ExerciseProgressTable.vue` | Page-specific | Only used in Exercises tab |
| `MuscleVolumeChart.vue` | Page-specific | Only used in Muscles tab |
| `ProgressiveOverloadChart.vue` | Page-specific | Only used in Volume tab |

---

## 3. State Management (Pinia Store)

### Store Dependency Chain

```
authStore (uid, user)
    ↓
workoutStore (workouts[], fetchWorkouts)
    ↓
analyticsStore (computed analytics from workouts)
```

**Key Pattern**: `analyticsStore` does NOT store raw workouts. It imports `workoutStore` and computes analytics from `workouts.value`.

---

### Extended analyticsStore.js

```javascript
// src/stores/analyticsStore.js
import { defineStore, storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useWorkoutStore } from './workoutStore'
import { useAuthStore } from './authStore'
import {
  calculate1RM,
  calculateTrend,
  findBestSet,
  findBestPR,
  getProgressStatus
} from '@/utils/strengthUtils'
import {
  calculateLinearRegression,
  calculateStandardDeviation
} from '@/utils/statsUtils'
import {
  getWeekNumber,
  startOfWeek,
  groupWorkoutsByWeek,
  formatWeekLabel
} from '@/utils/dateUtils'
import { ANALYTICS_CONFIG } from '@/constants/config'

export const useAnalyticsStore = defineStore('analytics', () => {
  // Import workout data from workoutStore
  const workoutStore = useWorkoutStore()
  const { workouts } = storeToRefs(workoutStore)

  // ============================================================
  // EXISTING COMPUTED PROPERTIES (already implemented)
  // ============================================================

  const totalWorkouts = computed(() => workouts.value.length)

  const totalVolume = computed(() => {
    return workouts.value.reduce((sum, w) => sum + calculateTotalVolume(w), 0)
  })

  // ... other existing properties ...

  // ============================================================
  // NEW COMPUTED PROPERTIES FOR ANALYTICS
  // ============================================================

  // ──────────────────────────────────────────────────────────
  // TAB 1: MUSCLES
  // ──────────────────────────────────────────────────────────

  /**
   * Muscle volume aggregated by week
   * Used by: MuscleVolumeChart (Feature 1.1)
   */
  const muscleVolumeOverTime = computed(() => {
    if (!workouts.value.length) return []

    const weeklyData = new Map()

    workouts.value.forEach(workout => {
      const weekStart = startOfWeek(workout.createdAt)
      const weekKey = formatDate(weekStart, 'YYYY-MM-DD')

      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, {
          week: formatWeekLabel(weekStart),
          weekStart,
          back: 0,
          chest: 0,
          legs: 0,
          shoulders: 0,
          biceps: 0,
          triceps: 0,
          core: 0,
          calves: 0
        })
      }

      const weekData = weeklyData.get(weekKey)

      workout.exercises.forEach(exercise => {
        const muscleGroups = getMuscleGroups(exercise.name)
        const volume = calculateExerciseVolume(exercise)

        muscleGroups.forEach(muscle => {
          if (weekData[muscle] !== undefined) {
            weekData[muscle] += volume
          }
        })
      })
    })

    return Array.from(weeklyData.values())
      .sort((a, b) => a.weekStart - b.weekStart)
  })

  /**
   * Muscle balance scorecard data
   * Used by: MuscleBalanceTable (Feature 1.2)
   */
  const muscleBalance = computed(() => {
    const distribution = muscleGroupDistribution.value // Reuse existing
    const { EXPECTED_DISTRIBUTION, TOLERANCE } = ANALYTICS_CONFIG.muscleBalance

    return Object.entries(distribution).map(([muscle, percentage]) => {
      const expected = EXPECTED_DISTRIBUTION[muscle] || 0
      const difference = percentage - expected

      let status
      if (Math.abs(difference) <= TOLERANCE) {
        status = 'balanced'
      } else if (difference < 0) {
        status = 'under_trained'
      } else {
        status = 'over_trained'
      }

      return {
        muscle,
        current: percentage,
        expected,
        difference,
        status
      }
    }).sort((a, b) => a.difference - b.difference) // Most under-trained first
  })

  // ──────────────────────────────────────────────────────────
  // TAB 2: DURATION
  // ──────────────────────────────────────────────────────────

  /**
   * Workout duration trend data
   * Used by: DurationTrendChart (Feature 2.1)
   */
  const durationTrendData = computed(() => {
    return workouts.value
      .map(w => ({
        date: w.createdAt,
        duration: w.duration || 0,
        volume: calculateTotalVolume(w),
        exerciseCount: w.exercises.length,
        id: w.id
      }))
      .filter(d => d.duration > 0) // Exclude workouts without duration
      .sort((a, b) => a.date - b.date)
  })

  /**
   * Duration statistics
   * Used by: DurationTrendChart stats panel
   */
  const durationStats = computed(() => {
    const data = durationTrendData.value
    if (!data.length) return null

    const durations = data.map(d => d.duration)
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length

    const shortest = data.reduce((min, d) => d.duration < min.duration ? d : min)
    const longest = data.reduce((max, d) => d.duration > max.duration ? d : max)

    // Calculate trend (using linear regression)
    const points = data.map((d, i) => ({ x: i, y: d.duration }))
    const regression = calculateLinearRegression(points)

    // Convert slope to minutes/month (assuming ~4 workouts/week)
    const slopePerMonth = regression.slope * 16 // ~16 workouts/month

    return {
      average: Math.round(avgDuration),
      shortest: {
        value: shortest.duration,
        date: shortest.date
      },
      longest: {
        value: longest.duration,
        date: longest.date
      },
      trend: {
        direction: slopePerMonth > 1 ? 'increasing' : slopePerMonth < -1 ? 'decreasing' : 'stable',
        value: Math.round(Math.abs(slopePerMonth))
      }
    }
  })

  // ──────────────────────────────────────────────────────────
  // TAB 3: VOLUME
  // ──────────────────────────────────────────────────────────

  /**
   * Daily volume map (for heatmap)
   * Used by: VolumeHeatmap (Feature 3.1)
   */
  const dailyVolumeMap = computed(() => {
    const map = {}
    workouts.value.forEach(w => {
      const date = formatDate(w.createdAt, 'YYYY-MM-DD')
      map[date] = (map[date] || 0) + calculateTotalVolume(w)
    })
    return map
  })

  /**
   * Weekly volume progression with status
   * Used by: ProgressiveOverloadChart (Feature 3.3)
   */
  const weeklyVolumeProgression = computed(() => {
    if (!workouts.value.length) return []

    const weeklyVolumes = new Map()

    workouts.value.forEach(workout => {
      const weekStart = startOfWeek(workout.createdAt)
      const weekKey = formatDate(weekStart, 'YYYY-MM-DD')
      const weekNumber = getWeekNumber(workout.createdAt)

      if (!weeklyVolumes.has(weekKey)) {
        weeklyVolumes.set(weekKey, {
          weekNumber,
          weekStart,
          weekLabel: formatWeekLabel(weekStart),
          volume: 0,
          workouts: 0
        })
      }

      const week = weeklyVolumes.get(weekKey)
      week.volume += calculateTotalVolume(workout)
      week.workouts++
    })

    const sorted = Array.from(weeklyVolumes.values())
      .sort((a, b) => a.weekStart - b.weekStart)

    return sorted.map((week, i) => {
      const prevWeek = sorted[i - 1]
      const change = prevWeek
        ? ((week.volume - prevWeek.volume) / prevWeek.volume) * 100
        : 0

      const { TARGET_WEEKLY_INCREASE, STALL_THRESHOLD } = ANALYTICS_CONFIG.progressiveOverload

      let status
      if (change >= TARGET_WEEKLY_INCREASE) {
        status = 'progressing'
      } else if (change <= -STALL_THRESHOLD) {
        status = 'regressing'
      } else {
        status = 'maintaining'
      }

      return {
        ...week,
        change,
        status
      }
    })
  })

  /**
   * Progressive overload statistics
   * Used by: ProgressiveOverloadChart stats panel
   */
  const progressiveOverloadStats = computed(() => {
    const data = weeklyVolumeProgression.value
    if (data.length < 2) return null

    const weeksProgressing = data.filter(w => w.status === 'progressing').length
    const totalWeeks = data.length - 1 // Exclude first week (no comparison)

    const avgIncrease = data
      .slice(1) // Skip first week
      .reduce((sum, w) => sum + w.change, 0) / totalWeeks

    const lastWeek = data[data.length - 1]
    const { TARGET_WEEKLY_INCREASE } = ANALYTICS_CONFIG.progressiveOverload
    const nextWeekTarget = Math.round(lastWeek.volume * (1 + TARGET_WEEKLY_INCREASE / 100))

    let overallStatus
    if (avgIncrease >= TARGET_WEEKLY_INCREASE) {
      overallStatus = 'on_track'
    } else if (avgIncrease >= 0) {
      overallStatus = 'maintaining'
    } else {
      overallStatus = 'regressing'
    }

    return {
      weeksProgressing,
      totalWeeks,
      progressRate: (weeksProgressing / totalWeeks) * 100,
      avgIncrease,
      overallStatus,
      nextWeekTarget
    }
  })

  // ──────────────────────────────────────────────────────────
  // TAB 4: EXERCISES
  // ──────────────────────────────────────────────────────────

  /**
   * Exercise progress table data
   * Used by: ExerciseProgressTable (Feature 4.1)
   */
  const exerciseProgressTable = computed(() => {
    const exerciseMap = new Map()

    workouts.value.forEach(workout => {
      workout.exercises.forEach(exercise => {
        if (!exerciseMap.has(exercise.name)) {
          exerciseMap.set(exercise.name, [])
        }

        exerciseMap.get(exercise.name).push({
          date: workout.createdAt,
          sets: exercise.sets,
          bestSet: findBestSet(exercise.sets),
          volume: calculateExerciseVolume(exercise)
        })
      })
    })

    return Array.from(exerciseMap.entries()).map(([name, history]) => {
      const sorted = history.sort((a, b) => b.date - a.date)
      const recent = sorted[0]
      const estimated1RM = recent.bestSet
        ? calculate1RM(recent.bestSet.weight, recent.bestSet.reps)
        : null
      const trend = calculateTrend(sorted)
      const bestPR = findBestPR(history)

      return {
        name,
        estimated1RM,
        bestPR: bestPR ? {
          weight: bestPR.bestSet.weight,
          reps: bestPR.bestSet.reps,
          date: bestPR.date
        } : null,
        lastPerformed: recent.date,
        trend: trend.direction,
        trendPercentage: trend.percentage,
        trendConfidence: trend.confidence,
        status: getProgressStatus(trend),
        history: sorted.slice(0, 10) // Last 10 for mini chart
      }
    })
  })

  /**
   * All personal records
   * Used by: PRTimeline (Feature 4.2)
   */
  const allPRs = computed(() => {
    const prs = []
    const exerciseBests = new Map() // Track best for each exercise

    // Sort workouts chronologically
    const sortedWorkouts = [...workouts.value].sort((a, b) => a.createdAt - b.createdAt)

    sortedWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        const exerciseName = exercise.name
        const bestSet = findBestSet(exercise.sets)
        if (!bestSet) return

        const { weight, reps } = bestSet
        const volume = calculateExerciseVolume(exercise)
        const estimated1RM = calculate1RM(weight, reps)

        // Initialize tracking for this exercise
        if (!exerciseBests.has(exerciseName)) {
          exerciseBests.set(exerciseName, {
            maxWeight: 0,
            maxReps: 0,
            maxVolume: 0,
            max1RM: 0
          })
        }

        const bests = exerciseBests.get(exerciseName)

        // Check for Weight PR
        if (weight > bests.maxWeight) {
          prs.push({
            id: `${workout.id}-${exerciseName}-weight`,
            date: workout.createdAt,
            exercise: exerciseName,
            type: 'weight',
            previous: bests.maxWeight,
            new: weight,
            reps,
            increase: bests.maxWeight > 0
              ? ((weight - bests.maxWeight) / bests.maxWeight * 100)
              : 0
          })
          bests.maxWeight = weight
        }

        // Check for Rep PR (at same or higher weight)
        if (weight >= bests.maxWeight && reps > bests.maxReps) {
          prs.push({
            id: `${workout.id}-${exerciseName}-rep`,
            date: workout.createdAt,
            exercise: exerciseName,
            type: 'rep',
            previous: bests.maxReps,
            new: reps,
            weight,
            increase: bests.maxReps > 0
              ? ((reps - bests.maxReps) / bests.maxReps * 100)
              : 0
          })
          bests.maxReps = reps
        }

        // Check for Volume PR
        if (volume > bests.maxVolume) {
          prs.push({
            id: `${workout.id}-${exerciseName}-volume`,
            date: workout.createdAt,
            exercise: exerciseName,
            type: 'volume',
            previous: bests.maxVolume,
            new: volume,
            increase: bests.maxVolume > 0
              ? ((volume - bests.maxVolume) / bests.maxVolume * 100)
              : 0
          })
          bests.maxVolume = volume
        }

        // Check for 1RM PR
        if (estimated1RM && estimated1RM > bests.max1RM) {
          prs.push({
            id: `${workout.id}-${exerciseName}-1rm`,
            date: workout.createdAt,
            exercise: exerciseName,
            type: '1rm',
            previous: bests.max1RM,
            new: estimated1RM,
            weight,
            reps,
            increase: bests.max1RM > 0
              ? ((estimated1RM - bests.max1RM) / bests.max1RM * 100)
              : 0
          })
          bests.max1RM = estimated1RM
        }
      })
    })

    return prs.sort((a, b) => b.date - a.date) // Newest first
  })

  // ============================================================
  // PERIOD FILTERING
  // ============================================================

  /**
   * Filter data by period
   * @param {string} period - '7d' | '30d' | '90d' | 'all'
   * @returns {object} Filtered computed properties
   */
  function getDataForPeriod(period) {
    const now = new Date()
    let startDate

    switch (period) {
      case '7d':
        startDate = subDays(now, 7)
        break
      case '30d':
        startDate = subDays(now, 30)
        break
      case '90d':
        startDate = subDays(now, 90)
        break
      case 'all':
      default:
        startDate = null
    }

    // Filter workouts
    const filteredWorkouts = startDate
      ? workouts.value.filter(w => w.createdAt >= startDate)
      : workouts.value

    // Note: In practice, you'd recompute all computeds with filtered workouts
    // For simplicity, we'll return the full computed values
    // A more performant approach: create separate "filtered" computeds

    return {
      muscleVolumeOverTime: muscleVolumeOverTime.value, // TODO: filter
      weeklyVolumeProgression: weeklyVolumeProgression.value, // TODO: filter
      exerciseProgressTable: exerciseProgressTable.value, // TODO: filter
      // ... etc
    }
  }

  return {
    // Existing exports
    totalWorkouts,
    totalVolume,
    // ... other existing ...

    // New exports
    muscleVolumeOverTime,
    muscleBalance,
    durationTrendData,
    durationStats,
    dailyVolumeMap,
    weeklyVolumeProgression,
    progressiveOverloadStats,
    exerciseProgressTable,
    allPRs,

    // Methods
    getDataForPeriod
  }
})
```

---

### Performance Optimizations

**Memoization Strategy**:

```javascript
// Cache expensive calculations
const e1rmCache = new Map()

function calculate1RMMemoized(weight, reps) {
  const key = `${weight}-${reps}`
  if (e1rmCache.has(key)) return e1rmCache.get(key)

  const result = calculate1RM(weight, reps)
  e1rmCache.set(key, result)

  // Limit cache size
  if (e1rmCache.size > 1000) {
    const firstKey = e1rmCache.keys().next().value
    e1rmCache.delete(firstKey)
  }

  return result
}
```

**Cache Invalidation**:
- Clear cache when workouts change
- Implement in `workoutStore.addWorkout()`, `workoutStore.deleteWorkout()`

---

## 4. Data Flow Patterns

### Reactive Data Flow

```
Firebase Firestore
    ↓
workoutStore.workouts (ref)
    ↓
analyticsStore.muscleVolumeOverTime (computed)
    ↓
useAnalyticsCharts.muscleVolumeChartData (computed)
    ↓
MuscleVolumeChart.vue (component)
    ↓
BaseChart.vue (render)
```

**Key Principle**: Data flows ONE WAY (top to bottom). Components never mutate store state directly.

---

### Period Selector State Management

**Approach**: Centralized in `AnalyticsView.vue`, passed down as prop.

```vue
<!-- AnalyticsView.vue -->
<script setup>
const selectedPeriod = ref('30d')

// Optionally sync with URL query param
watch(selectedPeriod, (newPeriod) => {
  router.replace({ query: { period: newPeriod } })
})

onMounted(() => {
  const urlPeriod = route.query.period
  if (urlPeriod && ['7d', '30d', '90d', 'all'].includes(urlPeriod)) {
    selectedPeriod.value = urlPeriod
  }
})
</script>

<template>
  <PeriodSelector v-model="selectedPeriod" />

  <MuscleVolumeChart :period="selectedPeriod" />
  <ProgressiveOverloadChart :period="selectedPeriod" />
</template>
```

**Alternative**: Store period in `analyticsStore` (simpler but less flexible).

---

### Filter/Sort State Management

**For ExerciseProgressTable**:

```vue
<script setup>
const searchQuery = ref('')
const sortBy = ref('trend') // 'name' | 'estimated1rm' | 'trend' | 'lastPerformed'
const sortOrder = ref('desc') // 'asc' | 'desc'
const statusFilter = ref('all') // 'all' | 'progressing' | 'stalled' | 'regressing'

const filteredExercises = computed(() => {
  let result = exerciseProgressTable.value

  // Filter by search query
  if (searchQuery.value) {
    result = result.filter(ex =>
      ex.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  // Filter by status
  if (statusFilter.value !== 'all') {
    result = result.filter(ex => ex.status.label === statusFilter.value)
  }

  // Sort
  result = [...result].sort((a, b) => {
    const aVal = a[sortBy.value]
    const bVal = b[sortBy.value]

    if (sortOrder.value === 'asc') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })

  return result
})
</script>
```

**Pattern**: Keep filter/sort state LOCAL to component (not in store) unless needed globally.

---

### Loading/Error States

```vue
<script setup>
import { computed } from 'vue'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useWorkoutStore } from '@/stores/workoutStore'

const analyticsStore = useAnalyticsStore()
const workoutStore = useWorkoutStore()

const isLoading = computed(() => workoutStore.loading)
const hasError = computed(() => workoutStore.error)
const data = computed(() => analyticsStore.muscleVolumeOverTime)
const isEmpty = computed(() => !isLoading.value && data.value.length === 0)
</script>

<template>
  <div>
    <LoadingSkeleton v-if="isLoading" />

    <EmptyState
      v-else-if="isEmpty"
      :title="$t('analytics.emptyStates.noData')"
      :description="$t('analytics.emptyStates.noWorkouts')"
    />

    <ErrorState
      v-else-if="hasError"
      :error="hasError"
    />

    <MuscleVolumeChart
      v-else
      :data="data"
    />
  </div>
</template>
```

---

## 5. Composables Strategy

### When to Use Composables vs Store Getters

| Use Composable When... | Use Store Getter When... |
|------------------------|--------------------------|
| Logic is component-specific (e.g., chart formatting) | Data is shared across many components |
| Needs local reactive state | Pure computation from store state |
| Transforms data for ONE component | Computation is expensive (benefit from caching) |
| Uses lifecycle hooks (onMounted, onUnmounted) | Data should be globally accessible |

---

### New Composables

#### useAnalyticsCharts.js

**Purpose**: Chart configuration and data transformation helpers.

```javascript
// src/composables/useAnalyticsCharts.js
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { MUSCLE_COLORS, STATUS_COLORS } from '@/utils/chartUtils'

export function useAnalyticsCharts() {
  const { t } = useI18n()

  /**
   * Transform muscle volume data for chart library
   */
  function transformMuscleVolumeData(rawData) {
    // Transform from:
    // [{ week: 'Dec 1', back: 5000, chest: 4000, ... }]
    // To chart-friendly format with series

    const muscles = ['back', 'chest', 'legs', 'shoulders', 'biceps', 'triceps', 'core', 'calves']

    const series = muscles.map(muscle => ({
      name: t(`common.muscleGroups.${muscle}`),
      color: MUSCLE_COLORS[muscle],
      data: rawData.map(week => ({
        x: week.week,
        y: week[muscle]
      }))
    }))

    return { series, categories: rawData.map(w => w.week) }
  }

  /**
   * Get responsive chart options based on screen size
   */
  function getResponsiveChartOptions(type = 'line') {
    const isMobile = window.innerWidth < 768

    return {
      chart: {
        height: isMobile ? 250 : 400,
        toolbar: { show: !isMobile }
      },
      legend: {
        show: !isMobile,
        position: isMobile ? 'bottom' : 'top'
      },
      stroke: {
        width: isMobile ? 2 : 3
      }
    }
  }

  /**
   * Format tooltip for charts
   */
  function formatChartTooltip(value, context) {
    const { seriesName, dataPointIndex, w } = context
    const date = w.config.xaxis.categories[dataPointIndex]

    return `
      <div class="chart-tooltip">
        <div class="font-semibold">${seriesName}</div>
        <div class="text-sm text-muted-foreground">${date}</div>
        <div class="text-lg font-bold">${value} kg</div>
      </div>
    `
  }

  return {
    transformMuscleVolumeData,
    getResponsiveChartOptions,
    formatChartTooltip
  }
}
```

---

#### useProgressiveOverload.js

**Purpose**: Progressive overload calculations and status determination.

```javascript
// src/composables/useProgressiveOverload.js
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { ANALYTICS_CONFIG } from '@/constants/config'

export function useProgressiveOverload(period = '30d') {
  const analyticsStore = useAnalyticsStore()
  const { weeklyVolumeProgression, progressiveOverloadStats } = storeToRefs(analyticsStore)

  const chartData = computed(() => {
    const data = weeklyVolumeProgression.value

    return data.map(week => ({
      week: week.weekLabel,
      volume: week.volume,
      change: week.change,
      status: week.status,
      color: STATUS_COLORS[week.status]
    }))
  })

  const targetLine = computed(() => {
    const data = weeklyVolumeProgression.value
    if (!data.length) return []

    const { TARGET_WEEKLY_INCREASE } = ANALYTICS_CONFIG.progressiveOverload
    let currentTarget = data[0].volume

    return data.map(week => {
      currentTarget *= (1 + TARGET_WEEKLY_INCREASE / 100)
      return {
        week: week.weekLabel,
        target: Math.round(currentTarget)
      }
    })
  })

  const statusSummary = computed(() => {
    const stats = progressiveOverloadStats.value
    if (!stats) return null

    return {
      overall: stats.overallStatus,
      message: getStatusMessage(stats.overallStatus, stats.avgIncrease),
      progressRate: `${stats.weeksProgressing}/${stats.totalWeeks}`,
      nextTarget: stats.nextWeekTarget
    }
  })

  function getStatusMessage(status, avgIncrease) {
    switch (status) {
      case 'on_track':
        return `Avg +${avgIncrease.toFixed(1)}%/week - Great progress!`
      case 'maintaining':
        return `Avg ${avgIncrease.toFixed(1)}%/week - Maintaining volume`
      case 'regressing':
        return `Avg ${avgIncrease.toFixed(1)}%/week - Consider increasing volume`
      default:
        return ''
    }
  }

  return {
    chartData,
    targetLine,
    statusSummary
  }
}
```

---

#### useExerciseProgress.js

**Purpose**: Exercise-specific progress calculations.

```javascript
// src/composables/useExerciseProgress.js
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAnalyticsStore } from '@/stores/analyticsStore'

export function useExerciseProgress(filters = {}) {
  const analyticsStore = useAnalyticsStore()
  const { exerciseProgressTable } = storeToRefs(analyticsStore)

  const filteredExercises = computed(() => {
    let result = exerciseProgressTable.value

    // Filter by search query
    if (filters.search) {
      result = result.filter(ex =>
        ex.name.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    // Filter by muscle group
    if (filters.muscleGroup) {
      result = result.filter(ex => {
        const muscles = getMuscleGroups(ex.name)
        return muscles.includes(filters.muscleGroup)
      })
    }

    // Filter by status
    if (filters.status && filters.status !== 'all') {
      result = result.filter(ex => ex.status.label === filters.status)
    }

    return result
  })

  const sortedExercises = computed(() => {
    const { sortBy = 'trend', sortOrder = 'desc' } = filters

    return [...filteredExercises.value].sort((a, b) => {
      let aVal, bVal

      switch (sortBy) {
        case 'name':
          aVal = a.name
          bVal = b.name
          break
        case 'estimated1rm':
          aVal = a.estimated1RM || 0
          bVal = b.estimated1RM || 0
          break
        case 'trend':
          aVal = a.trendPercentage
          bVal = b.trendPercentage
          break
        case 'lastPerformed':
          aVal = a.lastPerformed.getTime()
          bVal = b.lastPerformed.getTime()
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
  })

  const progressSummary = computed(() => {
    const total = exerciseProgressTable.value.length
    const progressing = exerciseProgressTable.value.filter(ex => ex.status.label === 'Progressing').length
    const stalled = exerciseProgressTable.value.filter(ex => ex.status.label === 'Stalled').length
    const regressing = exerciseProgressTable.value.filter(ex => ex.status.label === 'Regressing').length

    return {
      total,
      progressing,
      stalled,
      regressing,
      progressRate: total > 0 ? (progressing / total * 100) : 0
    }
  })

  return {
    exercises: sortedExercises,
    summary: progressSummary
  }
}
```

---

## 6. Utility Functions Organization

### statsUtils.js

```javascript
// src/utils/statsUtils.js

/**
 * Calculates linear regression for trend lines
 * @param {Array<{x: number, y: number}>} points
 * @returns {{slope: number, intercept: number, r2: number}}
 */
export function calculateLinearRegression(points) {
  const n = points.length
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 }

  const sumX = points.reduce((sum, p) => sum + p.x, 0)
  const sumY = points.reduce((sum, p) => sum + p.y, 0)
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0)
  const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0)
  const sumY2 = points.reduce((sum, p) => sum + p.y * p.y, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // R-squared
  const yMean = sumY / n
  const ssTotal = points.reduce((sum, p) => sum + Math.pow(p.y - yMean, 2), 0)
  const ssResidual = points.reduce((sum, p) => {
    const predicted = slope * p.x + intercept
    return sum + Math.pow(p.y - predicted, 2)
  }, 0)
  const r2 = 1 - (ssResidual / ssTotal)

  return { slope, intercept, r2 }
}

/**
 * Calculates standard deviation
 */
export function calculateStandardDeviation(values) {
  const n = values.length
  if (n === 0) return 0

  const mean = values.reduce((sum, v) => sum + v, 0) / n
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n
  return Math.sqrt(variance)
}

/**
 * Calculates percentile rank
 */
export function calculatePercentile(value, dataset) {
  const sorted = [...dataset].sort((a, b) => a - b)
  const index = sorted.findIndex(v => v >= value)
  if (index === -1) return 100
  return (index / sorted.length) * 100
}

/**
 * Calculates moving average
 */
export function calculateMovingAverage(data, windowSize = 3) {
  if (data.length < windowSize) return data

  const result = []
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2))
    const end = Math.min(data.length, start + windowSize)
    const window = data.slice(start, end)
    const avg = window.reduce((sum, val) => sum + val, 0) / window.length
    result.push(avg)
  }
  return result
}

/**
 * Detects outliers using IQR method
 */
export function detectOutliers(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const q1Index = Math.floor(sorted.length * 0.25)
  const q3Index = Math.floor(sorted.length * 0.75)

  const q1 = sorted[q1Index]
  const q3 = sorted[q3Index]
  const iqr = q3 - q1

  const lowerBound = q1 - 1.5 * iqr
  const upperBound = q3 + 1.5 * iqr

  return values.map((val, idx) => ({
    value: val,
    index: idx,
    isOutlier: val < lowerBound || val > upperBound
  }))
}
```

---

### strengthUtils.js

```javascript
// src/utils/strengthUtils.js
import { calculateLinearRegression } from './statsUtils'

/**
 * Calculates estimated 1 Rep Max using Epley formula
 */
export function calculate1RM(weight, reps) {
  if (reps === 1) return weight
  if (reps > 15) return null // Unreliable beyond 15 reps

  return weight * (1 + reps / 30)
}

/**
 * Finds best set (highest weight × reps product)
 */
export function findBestSet(sets) {
  if (!sets || sets.length === 0) return null

  return sets.reduce((best, set) => {
    const score = set.weight * set.reps
    const bestScore = best.weight * best.reps
    return score > bestScore ? set : best
  })
}

/**
 * Calculates trend for exercise progression
 */
export function calculateTrend(history) {
  if (history.length < 4) {
    return { direction: 'insufficient_data', percentage: 0, confidence: 0 }
  }

  const points = history.map((h, i) => {
    const e1rm = calculate1RM(h.bestSet.weight, h.bestSet.reps)
    return { x: i, y: e1rm || 0 }
  }).filter(p => p.y > 0)

  if (points.length < 4) {
    return { direction: 'insufficient_data', percentage: 0, confidence: 0 }
  }

  const regression = calculateLinearRegression(points)
  const avgValue = points.reduce((sum, p) => sum + p.y, 0) / points.length
  const percentageChange = (regression.slope / avgValue) * 100

  return {
    direction: percentageChange > 2.5 ? 'up' : percentageChange < -2.5 ? 'down' : 'flat',
    percentage: percentageChange,
    confidence: regression.r2
  }
}

/**
 * Gets progress status from trend
 */
export function getProgressStatus(trend) {
  const statusMap = {
    'up': { label: 'Progressing', color: 'green', icon: 'trending-up' },
    'down': { label: 'Regressing', color: 'red', icon: 'trending-down' },
    'flat': { label: 'Stalled', color: 'yellow', icon: 'minus' },
    'insufficient_data': { label: 'New', color: 'gray', icon: 'help-circle' }
  }

  return statusMap[trend.direction] || statusMap.insufficient_data
}

/**
 * Finds best PR from history
 */
export function findBestPR(history) {
  if (!history || history.length === 0) return null

  return history.reduce((best, entry) => {
    const current1RM = calculate1RM(entry.bestSet.weight, entry.bestSet.reps)
    const best1RM = best ? calculate1RM(best.bestSet.weight, best.bestSet.reps) : 0

    return current1RM > best1RM ? entry : best
  }, null)
}

/**
 * Calculates volume for an exercise
 */
export function calculateExerciseVolume(exercise) {
  return exercise.sets.reduce((sum, set) => sum + (set.weight * set.reps), 0)
}
```

---

### dateUtils.js (Extensions)

```javascript
// src/utils/dateUtils.js (extend existing)

/**
 * Gets ISO week number (1-52)
 */
export function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

/**
 * Gets start of week (Monday)
 */
export function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

/**
 * Groups workouts by week
 */
export function groupWorkoutsByWeek(workouts) {
  const weekMap = new Map()

  workouts.forEach(workout => {
    const weekStart = startOfWeek(workout.createdAt)
    const weekKey = formatDate(weekStart, 'YYYY-MM-DD')

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, {
        weekNumber: getWeekNumber(workout.createdAt),
        startDate: weekStart,
        workouts: []
      })
    }

    weekMap.get(weekKey).workouts.push(workout)
  })

  return Array.from(weekMap.values())
}

/**
 * Formats week label for charts
 */
export function formatWeekLabel(weekStart) {
  // Returns "Dec 1" or "1 груд" depending on locale
  const month = formatDate(weekStart, 'MMM')
  const day = weekStart.getDate()
  return `${month} ${day}`
}
```

---

### chartUtils.js (NEW)

```javascript
// src/utils/chartUtils.js

/**
 * Color palettes for charts
 */
export const MUSCLE_COLORS = {
  back: '#3b82f6',      // blue-500
  chest: '#f97316',     // orange-500
  legs: '#10b981',      // green-500
  biceps: '#a855f7',    // purple-500
  shoulders: '#ec4899', // pink-500
  triceps: '#14b8a6',   // teal-500
  calves: '#8b5cf6',    // violet-500
  core: '#06b6d4'       // cyan-500
}

export const STATUS_COLORS = {
  progressing: '#10b981',  // green-500
  maintaining: '#f59e0b',  // amber-500
  regressing: '#ef4444',   // red-500
  balanced: '#10b981',
  under_trained: '#f59e0b',
  over_trained: '#ef4444'
}

/**
 * Transform data for area charts
 */
export function transformToAreaData(data, xKey, yKeys) {
  return {
    labels: data.map(d => d[xKey]),
    datasets: yKeys.map(key => ({
      label: key,
      data: data.map(d => d[key]),
      fill: true,
      tension: 0.4
    }))
  }
}

/**
 * Get responsive chart configuration
 */
export function getResponsiveConfig(type = 'line') {
  const isMobile = window.innerWidth < 768

  const baseConfig = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: isMobile ? 1.5 : 2,
    plugins: {
      legend: {
        display: !isMobile,
        position: 'top'
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false
      }
    }
  }

  if (type === 'line') {
    baseConfig.elements = {
      line: {
        borderWidth: isMobile ? 2 : 3
      },
      point: {
        radius: isMobile ? 2 : 4
      }
    }
  }

  return baseConfig
}

/**
 * Format large numbers for chart axes
 */
export function formatAxisValue(value) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toString()
}
```

---

## 7. Chart Component Patterns

### Chart Library Recommendation

Based on the existing codebase (Dashboard uses native SVG rendering), **continue with native SVG** for consistency.

**Alternative**: If you want a dedicated library, use **Chart.js** (simpler) or **Recharts** (more features).

---

### Abstract BaseChart.vue

```vue
<!-- src/pages/analytics/components/shared/BaseChart.vue -->
<script setup>
import { computed } from 'vue'
import LoadingSkeleton from './LoadingSkeleton.vue'
import EmptyState from './EmptyState.vue'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  emptyTitle: {
    type: String,
    default: 'No data available'
  },
  emptyDescription: {
    type: String,
    default: 'Start tracking workouts to see analytics'
  },
  height: {
    type: String,
    default: '400px'
  }
})

const isEmpty = computed(() => !props.loading && props.data.length === 0)
const hasError = computed(() => !props.loading && props.error)
const showChart = computed(() => !props.loading && !isEmpty.value && !hasError.value)
</script>

<template>
  <div class="base-chart" :style="{ height }">
    <!-- Loading State -->
    <LoadingSkeleton v-if="loading" :height="height" />

    <!-- Empty State -->
    <EmptyState
      v-else-if="isEmpty"
      :title="emptyTitle"
      :description="emptyDescription"
    />

    <!-- Error State -->
    <div
      v-else-if="hasError"
      class="flex items-center justify-center h-full"
    >
      <div class="text-center">
        <Icon name="alert-triangle" class="w-12 h-12 text-destructive mb-4" />
        <p class="text-sm text-muted-foreground">{{ error }}</p>
      </div>
    </div>

    <!-- Chart Content -->
    <div v-else-if="showChart" class="h-full">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.base-chart {
  position: relative;
  width: 100%;
}
</style>
```

---

### Example: MuscleVolumeChart.vue

```vue
<!-- src/pages/analytics/components/muscles/MuscleVolumeChart.vue -->
<script setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useAnalyticsCharts } from '@/composables/useAnalyticsCharts'
import BaseChart from '../shared/BaseChart.vue'
import { MUSCLE_COLORS } from '@/utils/chartUtils'

const props = defineProps({
  period: {
    type: String,
    default: '30d'
  }
})

const analyticsStore = useAnalyticsStore()
const { muscleVolumeOverTime } = storeToRefs(analyticsStore)
const { transformMuscleVolumeData } = useAnalyticsCharts()

const visibleMuscles = ref(new Set(['back', 'chest', 'legs', 'shoulders']))

const chartData = computed(() => {
  return transformMuscleVolumeData(muscleVolumeOverTime.value)
})

const filteredSeries = computed(() => {
  return chartData.value.series.filter(s =>
    visibleMuscles.value.has(s.name.toLowerCase())
  )
})

function toggleMuscle(muscle) {
  if (visibleMuscles.value.has(muscle)) {
    visibleMuscles.value.delete(muscle)
  } else {
    visibleMuscles.value.add(muscle)
  }
}
</script>

<template>
  <div class="muscle-volume-chart">
    <div class="mb-4">
      <h3 class="text-lg font-semibold">
        {{ $t('analytics.muscles.volumeOverTime.title') }}
      </h3>
      <p class="text-sm text-muted-foreground">
        {{ $t('analytics.muscles.volumeOverTime.description') }}
      </p>
    </div>

    <!-- Legend with toggle -->
    <div class="flex flex-wrap gap-2 mb-4">
      <button
        v-for="muscle in ['back', 'chest', 'legs', 'shoulders', 'biceps', 'triceps', 'core', 'calves']"
        :key="muscle"
        @click="toggleMuscle(muscle)"
        class="px-3 py-1 text-sm rounded-full border transition"
        :class="visibleMuscles.has(muscle) ? 'border-primary bg-primary/10' : 'border-muted'"
      >
        <span
          class="inline-block w-3 h-3 rounded-full mr-2"
          :style="{ backgroundColor: MUSCLE_COLORS[muscle] }"
        />
        {{ $t(`common.muscleGroups.${muscle}`) }}
      </button>
    </div>

    <BaseChart
      :data="muscleVolumeOverTime"
      :empty-title="$t('analytics.muscles.volumeOverTime.emptyState')"
      height="400px"
    >
      <!-- Native SVG chart implementation -->
      <svg class="w-full h-full" viewBox="0 0 800 400">
        <!-- Render lines for each visible muscle -->
        <!-- Implementation details... -->
      </svg>
    </BaseChart>
  </div>
</template>
```

---

## 8. i18n Integration

### Translation Key Structure

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
        "description": "Training volume by muscle group over time",
        "emptyState": "No workout data for selected period"
      },
      "balanceTable": {
        "title": "Muscle Balance Scorecard",
        "columns": {
          "muscleGroup": "Muscle Group",
          "current": "Current %",
          "expected": "Expected %",
          "status": "Status"
        },
        "status": {
          "balanced": "Balanced",
          "underTrained": "Under-trained",
          "overTrained": "Over-trained"
        }
      }
    },

    "duration": {
      "trendChart": {
        "title": "Workout Duration Trend",
        "stats": {
          "average": "Average",
          "shortest": "Shortest",
          "longest": "Longest"
        }
      }
    },

    "volume": {
      "progressiveOverload": {
        "title": "Progressive Overload Tracker",
        "statusLabels": {
          "onTrack": "On track",
          "maintaining": "Maintaining",
          "regressing": "Regressing"
        }
      }
    },

    "exercises": {
      "progressTable": {
        "title": "Exercise Progress",
        "columns": {
          "exercise": "Exercise",
          "estimated1rm": "Est. 1RM",
          "bestPR": "Best PR",
          "trend": "Trend",
          "status": "Status"
        },
        "status": {
          "progressing": "Progressing",
          "stalled": "Stalled",
          "regressing": "Regressing"
        }
      }
    },

    "periodSelector": {
      "last7days": "Last 7 days",
      "last30days": "Last 30 days",
      "last90days": "Last 90 days",
      "allTime": "All time"
    }
  }
}
```

### Dynamic Translation Patterns

**Pluralization**:
```javascript
// In component
const message = computed(() => {
  return t('analytics.exercises.count', workoutCount.value, {
    count: workoutCount.value
  })
})

// In translation file
{
  "analytics": {
    "exercises": {
      "count": "no exercises | 1 exercise | {count} exercises"
    }
  }
}
```

**Interpolation**:
```vue
<template>
  <p>
    {{ $t('analytics.muscles.balanceTable.recommendation', {
      count: 2,
      muscle: 'back'
    }) }}
  </p>
</template>

<!-- Translation -->
{
  "recommendation": "Consider adding {count} more {muscle} exercises per week"
}
```

---

## 9. Route Configuration

### Current Route (No Changes Needed)

```javascript
// src/router/index.js (already exists)

{
  path: '/analytics',
  name: 'Analytics',
  component: () => import('@/pages/analytics/AnalyticsView.vue'),
  meta: {
    requiresAuth: true,
    title: 'Analytics'
  }
}
```

### Tab State Management

**Option 1: URL Query Params (Recommended)**

```javascript
// In AnalyticsView.vue
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const activeTab = ref(route.query.tab || 'muscles')

watch(activeTab, (newTab) => {
  router.replace({
    query: { ...route.query, tab: newTab }
  })
})
```

**Benefit**: Shareable URLs (e.g., `/analytics?tab=exercises&period=90d`)

**Option 2: Local State Only**

```javascript
const activeTab = ref('muscles') // Not synced with URL
```

**Benefit**: Simpler, no URL pollution

---

### Deep Linking to Specific Exercise

```javascript
// Future feature: Navigate to exercises tab with specific exercise highlighted

{
  path: '/analytics',
  name: 'Analytics',
  component: () => import('@/pages/analytics/AnalyticsView.vue'),
  meta: { requiresAuth: true }
}

// Usage:
router.push({
  name: 'Analytics',
  query: {
    tab: 'exercises',
    exercise: 'Bench Press'
  }
})
```

---

## 10. Phase-by-Phase Implementation

### MVP Phase (Weeks 1-3)

#### Week 1: Foundation

**Day 1-2: Utilities & Config**
1. Create `src/utils/statsUtils.js` (linear regression, std dev)
2. Create `src/utils/strengthUtils.js` (1RM, trend, PR)
3. Extend `src/utils/dateUtils.js` (week number, grouping)
4. Create `src/utils/chartUtils.js` (colors, formatters)
5. Add `ANALYTICS_CONFIG` to `src/constants/config.js`
6. Write unit tests for all utilities

**Day 3-4: Store Extensions**
1. Add new computed properties to `analyticsStore.js`:
   - `muscleVolumeOverTime`
   - `durationTrendData`
   - `dailyVolumeMap`
   - `weeklyVolumeProgression`
   - `exerciseProgressTable`
2. Write store tests

**Day 5: Composables**
1. Create `src/composables/useAnalyticsCharts.js`
2. Create `src/composables/useProgressiveOverload.js`
3. Create `src/composables/useExerciseProgress.js`
4. Write composable tests

**Parallel Work**: i18n translations (both en + uk)

---

#### Week 2: Components & Charts

**Day 1: Shared Components**
1. `src/pages/analytics/components/shared/BaseChart.vue`
2. `src/pages/analytics/components/shared/PeriodSelector.vue`
3. `src/pages/analytics/components/shared/EmptyState.vue`
4. `src/pages/analytics/components/shared/LoadingSkeleton.vue`

**Day 2-3: Tab Components (All 4 Tabs)**
1. **Muscles**: `MuscleVolumeChart.vue`
2. **Duration**: `DurationTrendChart.vue`
3. **Volume**: `VolumeHeatmap.vue` (reuse `FrequencyChart`)
4. **Volume**: `ProgressiveOverloadChart.vue`

**Day 4: Main View**
1. `AnalyticsView.vue` (with tabs, period selector)
2. Wire up all MVP charts

**Day 5: Testing**
1. Component tests for shared components
2. Component tests for chart components
3. Integration test for `AnalyticsView.vue`

---

#### Week 3: Exercises Tab & QA

**Day 1-2: Exercise Progress Table**
1. `ExerciseProgressTable.vue` (main table)
2. `ExerciseProgressRow.vue` (expandable row)
3. `ExerciseMiniChart.vue` (sparkline for history)
4. Implement sorting, filtering, search

**Day 3: Polish & Responsiveness**
1. Mobile optimization for all charts
2. Loading states
3. Empty states
4. Error handling

**Day 4-5: QA & Bug Fixes**
1. Cross-browser testing
2. Performance testing (large datasets)
3. Accessibility audit
4. Bug fixes

---

### V1.1 Phase (Weeks 4-5)

**Week 4**:
- `MuscleBalanceTable.vue`
- `DurationBreakdown.vue`
- `VolumeByTypeChart.vue`

**Week 5**:
- `PRTimeline.vue`
- `PRTimelineItem.vue`
- Export to CSV functionality

---

### V1.2 Phase (Week 6)

**Week 6**:
- `EfficiencyScoreCard.vue`
- Efficiency recommendations logic
- PR celebration animations

---

### Implementation Order & Dependencies

```
Week 1: Foundation (can be parallelized)
├── statsUtils.js ──────────────────┐
├── strengthUtils.js ───────────────┤
├── dateUtils.js extensions ────────┤
├── chartUtils.js ──────────────────┤
├── config.js updates ──────────────┤──> Week 2: Store
├── i18n translations (en + uk) ────┘
│
└──> analyticsStore.js extensions ──┐
     (depends on utils)              │──> Week 2: Composables
                                     │
Week 2: Composables                  │
├── useAnalyticsCharts.js ──────────┤
├── useProgressiveOverload.js ──────┤──> Week 2: Components
├── useExerciseProgress.js ─────────┘
│
└──> Shared components ─────────────┐
     ├── BaseChart.vue              │
     ├── PeriodSelector.vue         │──> Week 2: Tab Components
     └── EmptyState.vue             │
                                    │
Week 2: Tab Components              │
├── MuscleVolumeChart.vue ──────────┤
├── DurationTrendChart.vue ─────────┤
├── VolumeHeatmap.vue ──────────────┤──> Week 2: Main View
├── ProgressiveOverloadChart.vue ───┘
│
└──> AnalyticsView.vue ─────────────┐
                                    │──> Week 3: Exercises Tab
Week 3: Exercises Tab               │
├── ExerciseProgressTable.vue ──────┤
├── ExerciseProgressRow.vue ────────┤──> Week 3: QA
└── ExerciseMiniChart.vue ──────────┘
```

---

### Stub Strategy for Future Phases

**V1.1 Components** (not built in MVP):

```vue
<!-- MuscleBalanceTable.vue (stub) -->
<template>
  <div class="p-8 text-center text-muted-foreground">
    <Icon name="construction" class="w-12 h-12 mx-auto mb-4" />
    <p>{{ $t('analytics.comingSoon') }}</p>
  </div>
</template>
```

**Feature Flags** (in `config.js`):

```javascript
export const FEATURE_FLAGS = {
  ANALYTICS_MUSCLE_BALANCE: false,  // V1.1
  ANALYTICS_DURATION_BREAKDOWN: false,  // V1.1
  ANALYTICS_PR_TIMELINE: false,  // V1.1
  ANALYTICS_EFFICIENCY_SCORE: false,  // V1.2
  ANALYTICS_STRENGTH_STANDARDS: false  // V2
}
```

**Usage in Components**:

```vue
<MuscleBalanceTable v-if="FEATURE_FLAGS.ANALYTICS_MUSCLE_BALANCE" />
```

---

## 11. Code Reuse Strategy

### Dashboard → Analytics Reuse

| Dashboard Component | Analytics Component | Reuse Strategy |
|---------------------|---------------------|----------------|
| `FrequencyChart.vue` | `VolumeHeatmap.vue` | **Extend with volume data** - Pass `volumeMap` prop instead of `frequencyMap`, adjust color scale |
| `ExerciseTable.vue` | `ExerciseProgressTable.vue` | **Borrow table structure** - Reuse shadcn-vue Table components, similar row layout |
| `StatCard.vue` | (various stat displays) | **Direct reuse** - Import and use for statistics panels |
| Period selector logic | `PeriodSelector.vue` | **Extract pattern** - Similar dropdown/button group pattern |

---

### Shared Chart Configuration

```javascript
// src/composables/useAnalyticsCharts.js

export const DEFAULT_CHART_CONFIG = {
  responsive: true,
  maintainAspectRatio: true,
  aspectRatio: 2,
  plugins: {
    legend: {
      display: true,
      position: 'top'
    },
    tooltip: {
      enabled: true,
      mode: 'index',
      intersect: false
    }
  }
}

export const MOBILE_CHART_CONFIG = {
  ...DEFAULT_CHART_CONFIG,
  aspectRatio: 1.5,
  plugins: {
    ...DEFAULT_CHART_CONFIG.plugins,
    legend: {
      display: false
    }
  }
}
```

---

### Common Table Patterns

**From ExerciseTable** (Dashboard):

```vue
<!-- Pattern to reuse -->
<Table>
  <TableHeader>
    <TableRow>
      <TableHead @click="sortBy('name')" class="cursor-pointer">
        Exercise
        <Icon v-if="sortColumn === 'name'" :name="sortIcon" />
      </TableHead>
      <!-- More columns -->
    </TableRow>
  </TableHeader>

  <TableBody>
    <TableRow v-for="item in sortedItems" :key="item.id">
      <TableCell>{{ item.name }}</TableCell>
      <!-- More cells -->
    </TableRow>
  </TableBody>
</Table>
```

**Apply to ExerciseProgressTable**:

```vue
<Table>
  <TableHeader>
    <TableRow>
      <TableHead @click="handleSort('name')">
        {{ $t('analytics.exercises.progressTable.columns.exercise') }}
      </TableHead>
      <TableHead @click="handleSort('estimated1rm')">
        {{ $t('analytics.exercises.progressTable.columns.estimated1rm') }}
      </TableHead>
      <!-- More columns -->
    </TableRow>
  </TableHeader>

  <TableBody>
    <ExerciseProgressRow
      v-for="exercise in exercises"
      :key="exercise.name"
      :exercise="exercise"
    />
  </TableBody>
</Table>
```

---

## 12. Testing Architecture

### Test File Organization

```
src/pages/analytics/components/
├── shared/
│   └── __tests__/
│       ├── BaseChart.spec.js
│       ├── PeriodSelector.spec.js
│       └── EmptyState.spec.js
├── muscles/
│   └── __tests__/
│       ├── MuscleVolumeChart.spec.js
│       └── MuscleBalanceTable.spec.js
├── exercises/
│   └── __tests__/
│       ├── ExerciseProgressTable.spec.js
│       └── ExerciseProgressRow.spec.js
└── ...

src/composables/
└── __tests__/
    ├── useAnalyticsCharts.spec.js
    ├── useProgressiveOverload.spec.js
    └── useExerciseProgress.spec.js

src/utils/
└── __tests__/
    ├── statsUtils.spec.js
    ├── strengthUtils.spec.js
    └── chartUtils.spec.js
```

---

### Mock Strategies

#### Mocking Firebase & Stores

```javascript
// In component tests
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import ExerciseProgressTable from '../ExerciseProgressTable.vue'

describe('ExerciseProgressTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders exercise rows', () => {
    const wrapper = mount(ExerciseProgressTable, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              analytics: {
                exerciseProgressTable: [
                  {
                    name: 'Bench Press',
                    estimated1RM: 120,
                    trend: 'up',
                    status: { label: 'Progressing', color: 'green' }
                  }
                ]
              }
            }
          })
        ]
      }
    })

    expect(wrapper.text()).toContain('Bench Press')
    expect(wrapper.text()).toContain('120')
  })
})
```

---

### Shared Test Utilities

```javascript
// src/test/utils/mockGenerators.js

export function generateMockWorkout(overrides = {}) {
  return {
    id: 'workout-1',
    userId: 'user-1',
    createdAt: new Date('2024-01-01'),
    duration: 60,
    exercises: [
      {
        name: 'Bench Press',
        sets: [
          { weight: 100, reps: 10 },
          { weight: 105, reps: 8 }
        ]
      }
    ],
    ...overrides
  }
}

export function generateMockExerciseProgress(overrides = {}) {
  return {
    name: 'Squat',
    estimated1RM: 150,
    bestPR: { weight: 140, reps: 5, date: new Date() },
    lastPerformed: new Date(),
    trend: 'up',
    trendPercentage: 5,
    status: { label: 'Progressing', color: 'green' },
    history: [],
    ...overrides
  }
}
```

**Usage**:

```javascript
import { generateMockWorkout } from '@/test/utils/mockGenerators'

const mockWorkouts = [
  generateMockWorkout({ createdAt: new Date('2024-01-01') }),
  generateMockWorkout({ createdAt: new Date('2024-01-08') })
]
```

---

### Component Testing Patterns

**Snapshot Testing**:

```javascript
it('matches snapshot', () => {
  const wrapper = mount(MuscleVolumeChart, {
    props: { period: '30d' },
    global: {
      plugins: [createTestingPinia()]
    }
  })

  expect(wrapper.html()).toMatchSnapshot()
})
```

**Interaction Testing**:

```javascript
it('toggles muscle visibility on legend click', async () => {
  const wrapper = mount(MuscleVolumeChart)

  const backButton = wrapper.find('[data-muscle="back"]')
  expect(backButton.classes()).toContain('border-primary')

  await backButton.trigger('click')

  expect(backButton.classes()).not.toContain('border-primary')
  // Verify chart data updated
})
```

---

## 13. Performance Architecture

### Memoization Locations

#### 1. Store Level (analyticsStore)

```javascript
// Memoize expensive calculations
const e1rmCache = new Map()

const exerciseProgressTable = computed(() => {
  const exerciseMap = new Map()

  workouts.value.forEach(workout => {
    workout.exercises.forEach(exercise => {
      // ... process exercise

      const cacheKey = `${exercise.name}-${exercise.sets.length}`

      if (!e1rmCache.has(cacheKey)) {
        const e1rm = calculate1RM(bestSet.weight, bestSet.reps)
        e1rmCache.set(cacheKey, e1rm)
      }

      const estimated1RM = e1rmCache.get(cacheKey)
      // ... rest of logic
    })
  })

  return Array.from(exerciseMap.values())
})
```

**Cache Invalidation**:

```javascript
// In workoutStore
function addWorkout(workout) {
  workouts.value.push(workout)

  // Clear analytics cache
  if (window.__analyticsCache) {
    window.__analyticsCache.clear()
  }
}
```

---

#### 2. Component Level

```vue
<script setup>
import { computed, ref } from 'vue'
import { useMemoize } from '@vueuse/core'

const expensiveComputation = useMemoize((data) => {
  // Expensive data transformation
  return transformData(data)
})

const chartData = computed(() => expensiveComputation(rawData.value))
</script>
```

---

### Weekly vs Daily Aggregation

**Decision Matrix**:

| Data Range | Aggregation | Max Points | Reason |
|------------|-------------|-----------|---------|
| Last 7 days | Daily | 7 | Granular detail needed |
| Last 30 days | Daily | 30 | Still manageable |
| Last 90 days | Weekly | ~13 | Reduce visual clutter |
| All time (1 year) | Weekly | ~52 | Prevent performance issues |

**Implementation**:

```javascript
const muscleVolumeOverTime = computed(() => {
  const workoutsInPeriod = filterWorkoutsByPeriod(workouts.value, selectedPeriod.value)

  // Use weekly aggregation for periods >60 days
  const shouldAggregateWeekly = workoutsInPeriod.length > 60 || selectedPeriod.value === 'all'

  if (shouldAggregateWeekly) {
    return aggregateByWeek(workoutsInPeriod)
  } else {
    return aggregateByDay(workoutsInPeriod)
  }
})
```

---

### Lazy Loading Patterns

#### Tab-Level Lazy Loading

```vue
<!-- AnalyticsView.vue -->
<script setup>
import { defineAsyncComponent } from 'vue'

const MuscleVolumeChart = defineAsyncComponent(() =>
  import('./components/muscles/MuscleVolumeChart.vue')
)

const ExerciseProgressTable = defineAsyncComponent(() =>
  import('./components/exercises/ExerciseProgressTable.vue')
)
</script>

<template>
  <TabsContent value="muscles">
    <Suspense>
      <template #default>
        <MuscleVolumeChart :period="selectedPeriod" />
      </template>
      <template #fallback>
        <LoadingSkeleton height="400px" />
      </template>
    </Suspense>
  </TabsContent>
</template>
```

---

#### Chart Library Lazy Loading

```javascript
// Only load chart library when needed
let chartLibrary = null

async function loadChartLibrary() {
  if (!chartLibrary) {
    chartLibrary = await import('chart.js')
  }
  return chartLibrary
}

// In component
onMounted(async () => {
  const Chart = await loadChartLibrary()
  // Render chart
})
```

---

### Virtualization for Large Tables

```vue
<!-- ExerciseProgressTable.vue -->
<script setup>
import { useVirtualList } from '@vueuse/core'

const { list, containerProps, wrapperProps } = useVirtualList(
  exercises, // Array of exercises
  {
    itemHeight: 72, // Height of each row
    overscan: 5 // Render 5 extra items above/below
  }
)
</script>

<template>
  <div v-bind="containerProps" style="height: 600px; overflow-y: auto;">
    <div v-bind="wrapperProps">
      <ExerciseProgressRow
        v-for="{ data, index } in list"
        :key="index"
        :exercise="data"
      />
    </div>
  </div>
</template>
```

**When to Use**:
- Exercise Progress Table has >50 exercises
- PR Timeline has >100 PRs

---

## 14. Mobile Responsiveness Strategy

### Breakpoint Strategy

```javascript
// src/constants/config.js

export const UI_CONFIG = {
  breakpoints: {
    mobile: 640,   // sm
    tablet: 768,   // md
    desktop: 1024  // lg
  }
}
```

**Usage in Components**:

```vue
<script setup>
import { useBreakpoints } from '@vueuse/core'

const breakpoints = useBreakpoints({
  mobile: 640,
  tablet: 768,
  desktop: 1024
})

const isMobile = breakpoints.smaller('tablet')
</script>
```

---

### Responsive Behavior by Component

| Component | Mobile (<768px) | Desktop (≥768px) |
|-----------|-----------------|------------------|
| **AnalyticsView** | Tabs as scrollable list | Tabs as horizontal buttons |
| **PeriodSelector** | Dropdown select | Button group |
| **MuscleVolumeChart** | Hide legend, simplified tooltip | Full legend, detailed tooltip |
| **ExerciseProgressTable** | Hide "Last Performed" column | Show all columns |
| **ProgressiveOverloadChart** | Show bars only (no labels) | Show bars + percentage labels |
| **PRTimeline** | Compact timeline (smaller icons) | Full timeline with images |

---

### Example: Responsive Chart

```vue
<script setup>
import { useBreakpoints } from '@vueuse/core'

const breakpoints = useBreakpoints({ mobile: 768 })
const isMobile = breakpoints.smaller('mobile')

const chartHeight = computed(() => isMobile.value ? '250px' : '400px')
const showLegend = computed(() => !isMobile.value)
const pointRadius = computed(() => isMobile.value ? 2 : 4)
</script>

<template>
  <BaseChart :height="chartHeight">
    <svg class="w-full h-full" :viewBox="viewBox">
      <!-- Chart rendering with responsive values -->
    </svg>

    <div v-if="showLegend" class="legend">
      <!-- Legend items -->
    </div>
  </BaseChart>
</template>
```

---

### Touch Interaction Patterns

**For Charts**:

```vue
<script setup>
import { useSwipe } from '@vueuse/core'

const chartRef = ref()

const { isSwiping, direction } = useSwipe(chartRef, {
  onSwipe() {
    // Navigate to next/previous period on swipe
    if (direction.value === 'left') {
      goToNextPeriod()
    } else if (direction.value === 'right') {
      goToPreviousPeriod()
    }
  }
})
</script>

<template>
  <div ref="chartRef" class="touch-pan-y">
    <MuscleVolumeChart />
  </div>
</template>
```

---

### Example: Responsive Table

```vue
<!-- ExerciseProgressTable.vue -->
<template>
  <div class="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Exercise</TableHead>
          <TableHead>1RM</TableHead>
          <TableHead class="hidden md:table-cell">Last Done</TableHead>
          <TableHead>Trend</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        <TableRow v-for="ex in exercises" :key="ex.name">
          <TableCell>{{ ex.name }}</TableCell>
          <TableCell>{{ ex.estimated1RM }} kg</TableCell>
          <TableCell class="hidden md:table-cell">
            {{ formatDate(ex.lastPerformed) }}
          </TableCell>
          <TableCell>
            <Icon :name="trendIcon(ex.trend)" />
          </TableCell>
          <TableCell>
            <Badge :variant="ex.status.color">
              {{ ex.status.label }}
            </Badge>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>

<style scoped>
/* Horizontal scroll on mobile */
@media (max-width: 768px) {
  .overflow-x-auto {
    overflow-x: scroll;
    -webkit-overflow-scrolling: touch;
  }
}
</style>
```

---

## 15. Implementation Checklist

### Pre-Implementation Checklist

- [ ] Review ANALYTICS_PRD.md thoroughly
- [ ] Review this architecture document
- [ ] Set up project board (Jira/Linear/GitHub Projects)
- [ ] Create Sprint 1 tasks (MVP Week 1)
- [ ] Assign developers to tasks
- [ ] Set up testing environment
- [ ] Create feature branch: `feature/analytics-mvp`

---

### MVP Implementation Checklist

**Week 1: Foundation**
- [ ] Create `statsUtils.js` with tests
- [ ] Create `strengthUtils.js` with tests
- [ ] Extend `dateUtils.js` with tests
- [ ] Create `chartUtils.js` with tests
- [ ] Add `ANALYTICS_CONFIG` to `config.js`
- [ ] Add `en/analytics.json` translations
- [ ] Add `uk/analytics.json` translations
- [ ] Extend `analyticsStore.js` with new computeds
- [ ] Write store tests for new computeds
- [ ] Create composables (useAnalyticsCharts, useProgressiveOverload, useExerciseProgress)
- [ ] Write composable tests

**Week 2: Components**
- [ ] Create `BaseChart.vue` with tests
- [ ] Create `PeriodSelector.vue` with tests
- [ ] Create `EmptyState.vue` with tests
- [ ] Create `LoadingSkeleton.vue` with tests
- [ ] Create `MuscleVolumeChart.vue` with tests
- [ ] Create `DurationTrendChart.vue` with tests
- [ ] Create `VolumeHeatmap.vue` (reuse FrequencyChart) with tests
- [ ] Create `ProgressiveOverloadChart.vue` with tests
- [ ] Create `AnalyticsView.vue` with tabs
- [ ] Wire up all MVP charts in AnalyticsView
- [ ] Test tab navigation
- [ ] Test period selector integration

**Week 3: Exercises Tab & QA**
- [ ] Create `ExerciseProgressTable.vue` with tests
- [ ] Create `ExerciseProgressRow.vue` with tests
- [ ] Create `ExerciseMiniChart.vue` with tests
- [ ] Implement sorting functionality
- [ ] Implement filtering functionality
- [ ] Implement search functionality
- [ ] Mobile optimization for all components
- [ ] Add loading states
- [ ] Add empty states
- [ ] Add error handling
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Performance testing with large datasets (100+ workouts)
- [ ] Accessibility audit (keyboard navigation, screen readers)
- [ ] Bug fixes
- [ ] Code review
- [ ] Merge to main
- [ ] Deploy to production

---

### Post-MVP Checklist

- [ ] Monitor analytics adoption metrics (% of users visiting)
- [ ] Collect user feedback
- [ ] Identify bugs in production
- [ ] Plan V1.1 features based on feedback
- [ ] Create V1.1 sprint tasks

---

## Conclusion

This architecture document provides a comprehensive blueprint for implementing the Analytics section of the Obsessed app. By following this structure, the development team can build a robust, performant, and user-friendly analytics experience that scales from MVP to V2 and beyond.

**Key Principles to Remember**:
1. **Follow existing patterns** from CLAUDE.md (Vue 3 Composition API, Pinia setup stores, i18n-first)
2. **Reuse code** where possible (Dashboard components, utilities)
3. **Test thoroughly** at every layer (utils, stores, composables, components)
4. **Optimize for mobile** (responsive charts, touch interactions)
5. **Plan for the future** (feature flags, extensible architecture)

**Next Steps**:
1. Review this document with the team
2. Ask questions and clarify any ambiguities
3. Set up Sprint 1 tasks
4. Begin Week 1 implementation

Good luck with the implementation! 🚀
