# Workout Detail View & Navigation Bug Fix - Product Requirements Document (PRD)

**Version**: 1.0
**Date**: 2024-12-24
**Status**: Ready for Development
**Priority**: HIGH (Critical Bug + High-Value Feature)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement & Root Cause Analysis](#2-problem-statement--root-cause-analysis)
3. [User Stories](#3-user-stories)
4. [Technical Architecture](#4-technical-architecture)
5. [UX/UI Specifications](#5-uxui-specifications)
6. [Acceptance Criteria](#6-acceptance-criteria)
7. [Implementation Plan](#7-implementation-plan)
8. [Internationalization (i18n)](#8-internationalization-i18n)
9. [Edge Cases & Error Handling](#9-edge-cases--error-handling)
10. [Testing Requirements](#10-testing-requirements)
11. [Success Metrics](#11-success-metrics)
12. [Technical Debt & Future Enhancements](#12-technical-debt--future-enhancements)

---

## 1. Executive Summary

### Problem
Users clicking on the **Exercise History table** in the Analytics page experience a **navigation error** instead of viewing workout details. This is a **critical bug** that breaks a primary user flow.

### Solution
1. **Fix the navigation bug** by implementing a proper Workout Detail View page
2. **Create a dedicated Workout Detail View** that shows comprehensive workout information
3. **Ensure bi-directional navigation** (Analytics → Workout Detail → Analytics)

### Impact
- **User Experience**: Users can review individual workouts in detail, improving training analysis
- **Bug Resolution**: Fixes broken navigation from Analytics Exercise History
- **Feature Addition**: New detail view enables future features (workout editing, sharing, duplication)

### Scope
- **Phase 1 (MVP)**: Bug fix + basic detail view (read-only)
- **Phase 2 (Future)**: Workout editing, duplication, sharing

---

## 2. Problem Statement & Root Cause Analysis

### 2.1 Bug Description

**Reproduction Steps**:
1. Navigate to `/analytics`
2. Scroll to "Exercise History" table
3. Click on any exercise row
4. **Expected**: Navigate to workout detail page
5. **Actual**: Navigation error (route not found or component missing)

### 2.2 Root Cause Analysis

**Investigation Results**:

```javascript
// In AnalyticsView.vue (or ExerciseTable component)
// CURRENT CODE (BROKEN):
function handleExerciseClick(exercise) {
  router.push({
    name: 'WorkoutDetail',  // ❌ Route does not exist
    params: { id: exercise.workoutId }
  })
}
```

**Root Causes**:
1. **Missing Route**: `/workouts/:id` route not defined in `src/router/index.js`
2. **Missing Component**: `WorkoutDetailView.vue` component does not exist
3. **Inconsistent Navigation**: Analytics table assumes detail view exists

### 2.3 Why This Happened

**Analysis**:
- **Rushed MVP**: Dashboard and Analytics were built quickly, detail view was postponed
- **Assumed Existence**: Analytics table was built assuming detail view would exist
- **No Error Handling**: No fallback behavior when route doesn't exist
- **Missing UX Pattern**: No "view workout details" pattern established in the app

### 2.4 Impact Assessment

| Impact Area | Severity | User Effect |
|-------------|----------|-------------|
| **Analytics Exercise History** | HIGH | Cannot view workout details from analytics |
| **User Trust** | MEDIUM | Clicking table rows does nothing (feels broken) |
| **Future Features** | HIGH | Blocks workout editing, sharing, duplication |
| **Dashboard Quick Stats** | LOW | May have similar issue (needs verification) |

---

## 3. User Stories

### User Story 1: View Workout Details from Analytics

**As a** gym enthusiast reviewing my exercise progress in Analytics,
**I want to** click on an exercise in the Exercise History table and view the full workout details,
**So that I can** see all exercises, sets, reps, and weights from that specific workout session.

**Acceptance Criteria**:
- [ ] Clicking any row in the Exercise History table navigates to `/workouts/:id`
- [ ] Workout Detail View displays workout date, duration, total volume
- [ ] All exercises from that workout are displayed with sets, reps, weights
- [ ] Back button returns to Analytics page (preserves scroll position if possible)
- [ ] Loading state shown while fetching workout data
- [ ] Error state shown if workout not found (404) or fails to load

**Priority**: HIGH
**Effort**: MEDIUM (3-4 days)

---

### User Story 2: Navigate Between Workouts

**As a** user viewing a specific workout,
**I want to** navigate to the previous/next workout in chronological order,
**So that I can** review my workout history sequentially without returning to the list.

**Acceptance Criteria**:
- [ ] "Previous Workout" button shown if there is an earlier workout
- [ ] "Next Workout" button shown if there is a later workout
- [ ] Buttons navigate to adjacent workouts by date
- [ ] Buttons are disabled/hidden when at first/last workout
- [ ] Navigation preserves route context (e.g., `/workouts/:id?from=analytics`)

**Priority**: MEDIUM
**Effort**: LOW (1 day)

---

### User Story 3: Quick Actions on Workout

**As a** user viewing a workout detail,
**I want to** perform quick actions (share, duplicate, delete),
**So that I can** manage my workouts efficiently.

**Acceptance Criteria** (Phase 2 - Future):
- [ ] "Delete Workout" button with confirmation dialog
- [ ] "Duplicate Workout" button creates a copy with today's date
- [ ] "Share Workout" button generates shareable summary (text or image)
- [ ] Actions trigger appropriate success/error toasts
- [ ] Delete action navigates back to workout list after deletion

**Priority**: LOW (Future)
**Effort**: MEDIUM (2-3 days)

---

### User Story 4: Context-Aware Back Navigation

**As a** user who navigated to a workout detail from different sources (Analytics, Dashboard, Workouts list),
**I want the** back button to return me to the original source,
**So that I don't** lose my place in the app.

**Acceptance Criteria**:
- [ ] Back button from `/workouts/:id?from=analytics` returns to `/analytics`
- [ ] Back button from `/workouts/:id?from=dashboard` returns to `/`
- [ ] Back button from `/workouts/:id` (no context) returns to `/workouts`
- [ ] Browser back button works correctly (respects history)
- [ ] Navigation preserves previous scroll position (if feasible)

**Priority**: MEDIUM
**Effort**: LOW (1 day)

---

### User Story 5: Workout Summary Stats

**As a** user viewing a workout detail,
**I want to** see summary statistics (total volume, avg intensity, duration, muscle distribution),
**So that I can** quickly assess the workout quality without reading every exercise.

**Acceptance Criteria**:
- [ ] Summary card shows:
  - Total volume (kg)
  - Total sets
  - Total exercises
  - Workout duration
  - Muscle group distribution (donut chart or list)
- [ ] Stats are calculated correctly (reuse existing utils)
- [ ] Stats update if workout data changes (reactive)

**Priority**: HIGH
**Effort**: MEDIUM (2 days)

---

## 4. Technical Architecture

### 4.1 New Route Configuration

```javascript
// src/router/index.js

{
  path: '/workouts/:id',
  name: 'WorkoutDetail',
  component: () => import('@/pages/workouts/WorkoutDetailView.vue'),
  meta: {
    requiresAuth: true,
    title: 'Workout Details'
  },
  props: (route) => ({
    id: route.params.id,
    from: route.query.from || 'workouts' // Context for back navigation
  })
}
```

**Key Design Decisions**:
- **Dynamic Route**: `/workouts/:id` (RESTful pattern)
- **Lazy Loading**: Uses `() => import()` for code splitting
- **Query Param**: `?from=analytics` to track navigation context
- **Props Function**: Converts route params to component props

---

### 4.2 Component Structure

```
src/pages/workouts/
├── WorkoutDetailView.vue              # Main detail view
├── components/
│   ├── WorkoutHeader.vue              # Date, duration, total volume
│   ├── WorkoutSummaryStats.vue        # Stats cards (volume, sets, exercises)
│   ├── WorkoutExerciseList.vue        # List of exercises with sets
│   ├── WorkoutExerciseCard.vue        # Individual exercise card
│   ├── WorkoutMuscleDistribution.vue  # Muscle group chart/list
│   ├── WorkoutActions.vue             # Action buttons (delete, share, duplicate)
│   └── __tests__/
│       ├── WorkoutDetailView.spec.js
│       ├── WorkoutHeader.spec.js
│       ├── WorkoutSummaryStats.spec.js
│       └── WorkoutExerciseList.spec.js
```

---

### 4.3 Data Flow

```
User clicks Exercise History row
    ↓
Router navigates to /workouts/:id?from=analytics
    ↓
WorkoutDetailView.vue mounted
    ↓
Fetch workout from workoutStore (by ID)
    ↓
Compute summary stats (volume, duration, muscle distribution)
    ↓
Render WorkoutHeader, WorkoutSummaryStats, WorkoutExerciseList
    ↓
User clicks back button
    ↓
Navigate to route.query.from (e.g., /analytics)
```

**State Management**:
- **Data Source**: `workoutStore.workouts` (already loaded)
- **No Additional API Call**: If workout is in store
- **Fetch if Missing**: Call `workoutStore.fetchWorkout(id)` if not in cache

---

### 4.4 WorkoutDetailView.vue Implementation

```vue
<!-- src/pages/workouts/WorkoutDetailView.vue -->
<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useI18n } from 'vue-i18n'
import { formatDate } from '@/utils/dateUtils'
import { getMuscleGroups } from '@/utils/muscleUtils'

import WorkoutHeader from './components/WorkoutHeader.vue'
import WorkoutSummaryStats from './components/WorkoutSummaryStats.vue'
import WorkoutExerciseList from './components/WorkoutExerciseList.vue'
import WorkoutMuscleDistribution from './components/WorkoutMuscleDistribution.vue'
import WorkoutActions from './components/WorkoutActions.vue'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  from: {
    type: String,
    default: 'workouts'
  }
})

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { handleError } = useErrorHandler()

const workoutStore = useWorkoutStore()
const { workouts, loading } = storeToRefs(workoutStore)

// Find workout by ID
const workout = computed(() => {
  return workouts.value.find(w => w.id === props.id)
})

// Calculate summary stats
const summaryStats = computed(() => {
  if (!workout.value) return null

  const totalVolume = workout.value.exercises.reduce((sum, ex) => {
    return sum + ex.sets.reduce((s, set) => s + (set.weight * set.reps), 0)
  }, 0)

  const totalSets = workout.value.exercises.reduce((sum, ex) => {
    return sum + ex.sets.length
  }, 0)

  const totalExercises = workout.value.exercises.length

  return {
    totalVolume,
    totalSets,
    totalExercises,
    duration: workout.value.duration || 0
  }
})

// Muscle distribution
const muscleDistribution = computed(() => {
  if (!workout.value) return []

  const distribution = {}
  workout.value.exercises.forEach(exercise => {
    const muscles = getMuscleGroups(exercise.name) // Reuse existing util
    muscles.forEach(muscle => {
      distribution[muscle] = (distribution[muscle] || 0) + 1
    })
  })

  const totalExercises = workout.value.exercises.length
  return Object.entries(distribution)
    .map(([muscle, count]) => ({
      muscle,
      count,
      percentage: (count / totalExercises) * 100
    }))
    .sort((a, b) => b.percentage - a.percentage)
})

// Navigation
const backRoute = computed(() => {
  const routeMap = {
    'analytics': '/analytics',
    'dashboard': '/',
    'workouts': '/workouts'
  }
  return routeMap[props.from] || '/workouts'
})

function handleBack() {
  router.push(backRoute.value)
}

// Fetch workout if not in store
onMounted(async () => {
  if (!workout.value) {
    try {
      await workoutStore.fetchWorkout(props.id)
    } catch (error) {
      handleError(error, t('workout.detail.loadError'), 'WorkoutDetailView')
      // Optionally navigate back on error
      setTimeout(() => router.push(backRoute.value), 2000)
    }
  }
})

// Adjacent workout navigation
const previousWorkout = computed(() => {
  const sortedWorkouts = [...workouts.value].sort((a, b) => a.createdAt - b.createdAt)
  const index = sortedWorkouts.findIndex(w => w.id === props.id)
  return index > 0 ? sortedWorkouts[index - 1] : null
})

const nextWorkout = computed(() => {
  const sortedWorkouts = [...workouts.value].sort((a, b) => a.createdAt - b.createdAt)
  const index = sortedWorkouts.findIndex(w => w.id === props.id)
  return index < sortedWorkouts.length - 1 ? sortedWorkouts[index + 1] : null
})

function navigateToWorkout(workoutId) {
  router.push({
    name: 'WorkoutDetail',
    params: { id: workoutId },
    query: { from: props.from }
  })
}
</script>

<template>
  <div class="workout-detail-view container mx-auto px-4 py-6 max-w-4xl">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <LoadingSkeleton height="600px" />
    </div>

    <!-- Error State (Workout Not Found) -->
    <div v-else-if="!workout" class="flex flex-col items-center justify-center min-h-screen">
      <Icon name="alert-circle" class="w-16 h-16 text-destructive mb-4" />
      <h2 class="text-2xl font-bold mb-2">{{ $t('workout.detail.notFound') }}</h2>
      <p class="text-muted-foreground mb-6">{{ $t('workout.detail.notFoundDescription') }}</p>
      <Button @click="handleBack">
        <Icon name="arrow-left" class="mr-2" />
        {{ $t('common.goBack') }}
      </Button>
    </div>

    <!-- Workout Detail Content -->
    <div v-else>
      <!-- Back Button -->
      <Button variant="ghost" @click="handleBack" class="mb-4">
        <Icon name="arrow-left" class="mr-2" />
        {{ $t('common.back') }}
      </Button>

      <!-- Workout Header -->
      <WorkoutHeader
        :workout="workout"
        :stats="summaryStats"
        class="mb-6"
      />

      <!-- Summary Stats Grid -->
      <WorkoutSummaryStats
        :stats="summaryStats"
        class="mb-6"
      />

      <!-- Muscle Distribution -->
      <WorkoutMuscleDistribution
        :distribution="muscleDistribution"
        class="mb-6"
      />

      <!-- Exercise List -->
      <WorkoutExerciseList
        :exercises="workout.exercises"
        class="mb-6"
      />

      <!-- Navigation to Adjacent Workouts -->
      <div class="flex justify-between items-center mt-8">
        <Button
          v-if="previousWorkout"
          variant="outline"
          @click="navigateToWorkout(previousWorkout.id)"
        >
          <Icon name="chevron-left" class="mr-2" />
          {{ $t('workout.detail.previousWorkout') }}
        </Button>
        <div v-else></div>

        <Button
          v-if="nextWorkout"
          variant="outline"
          @click="navigateToWorkout(nextWorkout.id)"
        >
          {{ $t('workout.detail.nextWorkout') }}
          <Icon name="chevron-right" class="ml-2" />
        </Button>
      </div>
    </div>
  </div>
</template>
```

---

### 4.5 WorkoutStore Extensions

```javascript
// src/stores/workoutStore.js

// Add new action to fetch single workout (if not in cache)
async function fetchWorkout(workoutId) {
  try {
    // Check if already in store
    const existing = workouts.value.find(w => w.id === workoutId)
    if (existing) return existing

    // Fetch from Firestore
    const workout = await fetchDocument(COLLECTIONS.WORKOUTS, workoutId)
    if (workout) {
      workouts.value.push(workout) // Add to cache
      return workout
    }

    throw new Error('Workout not found')
  } catch (error) {
    console.error('Failed to fetch workout:', error)
    throw error
  }
}

// Return in store
return {
  // ... existing exports
  fetchWorkout // NEW
}
```

---

## 5. UX/UI Specifications

### 5.1 Workout Header Component

**Visual Design**:
```
┌─────────────────────────────────────────────────┐
│  Monday, December 24, 2024                      │
│  🕐 1h 23min    📊 8,450 kg    💪 7 exercises   │
└─────────────────────────────────────────────────┘
```

**Specs**:
- **Date**: Full date format (locale-aware)
- **Duration**: Hours and minutes (e.g., "1h 23min")
- **Volume**: Total volume with unit (kg/lbs)
- **Exercise Count**: Number of exercises

**Component**:
```vue
<!-- WorkoutHeader.vue -->
<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUnits } from '@/composables/useUnits'
import { formatDate, formatDuration } from '@/utils/dateUtils'
import { Card } from '@/components/ui/card'

const props = defineProps({
  workout: {
    type: Object,
    required: true
  },
  stats: {
    type: Object,
    required: true
  }
})

const { t } = useI18n()
const { formatWeight } = useUnits()

const formattedDate = computed(() => {
  return formatDate(props.workout.createdAt, 'EEEE, MMMM d, yyyy')
})
</script>

<template>
  <Card class="p-6">
    <h1 class="text-2xl font-bold mb-4">
      {{ formattedDate }}
    </h1>

    <div class="flex flex-wrap gap-6 text-sm text-muted-foreground">
      <div class="flex items-center gap-2">
        <Icon name="clock" class="w-4 h-4" />
        <span>{{ formatDuration(stats.duration) }}</span>
      </div>

      <div class="flex items-center gap-2">
        <Icon name="bar-chart" class="w-4 h-4" />
        <span>{{ formatWeight(stats.totalVolume) }}</span>
      </div>

      <div class="flex items-center gap-2">
        <Icon name="dumbbell" class="w-4 h-4" />
        <span>{{ stats.totalExercises }} {{ $t('workout.exercises', stats.totalExercises) }}</span>
      </div>
    </div>
  </Card>
</template>
```

---

### 5.2 Summary Stats Component

**Visual Design**:
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│  Total Volume│  Total Sets  │   Exercises  │   Duration   │
│   8,450 kg   │      24      │       7      │   1h 23min   │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

**Specs**:
- **Grid Layout**: 2×2 on mobile, 4×1 on desktop
- **Each Card**: Icon + Value + Label
- **Color**: Primary for icons, muted for labels

**Component**:
```vue
<!-- WorkoutSummaryStats.vue -->
<script setup>
import { useI18n } from 'vue-i18n'
import { useUnits } from '@/composables/useUnits'
import { formatDuration } from '@/utils/dateUtils'
import { Card } from '@/components/ui/card'

const props = defineProps({
  stats: {
    type: Object,
    required: true
  }
})

const { t } = useI18n()
const { formatWeight } = useUnits()
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <Card class="p-4 text-center">
      <Icon name="weight" class="w-8 h-8 mx-auto mb-2 text-primary" />
      <div class="text-2xl font-bold">{{ formatWeight(stats.totalVolume) }}</div>
      <div class="text-sm text-muted-foreground">{{ $t('workout.stats.totalVolume') }}</div>
    </Card>

    <Card class="p-4 text-center">
      <Icon name="list" class="w-8 h-8 mx-auto mb-2 text-primary" />
      <div class="text-2xl font-bold">{{ stats.totalSets }}</div>
      <div class="text-sm text-muted-foreground">{{ $t('workout.stats.totalSets') }}</div>
    </Card>

    <Card class="p-4 text-center">
      <Icon name="dumbbell" class="w-8 h-8 mx-auto mb-2 text-primary" />
      <div class="text-2xl font-bold">{{ stats.totalExercises }}</div>
      <div class="text-sm text-muted-foreground">{{ $t('workout.stats.exercises') }}</div>
    </Card>

    <Card class="p-4 text-center">
      <Icon name="clock" class="w-8 h-8 mx-auto mb-2 text-primary" />
      <div class="text-2xl font-bold">{{ formatDuration(stats.duration) }}</div>
      <div class="text-sm text-muted-foreground">{{ $t('workout.stats.duration') }}</div>
    </Card>
  </div>
</template>
```

---

### 5.3 Exercise List Component

**Visual Design**:
```
┌─────────────────────────────────────────────────┐
│  Bench Press                                    │
│  ┌─────┬────────┬────────┬────────────┐        │
│  │ Set │ Weight │  Reps  │   Volume   │        │
│  ├─────┼────────┼────────┼────────────┤        │
│  │  1  │ 100 kg │   10   │  1,000 kg  │        │
│  │  2  │ 105 kg │    8   │    840 kg  │        │
│  │  3  │ 110 kg │    6   │    660 kg  │        │
│  └─────┴────────┴────────┴────────────┘        │
│  Total: 2,500 kg                                │
└─────────────────────────────────────────────────┘
```

**Specs**:
- **Exercise Card**: One per exercise
- **Table**: Sets, weight, reps, volume per set
- **Footer**: Total volume for exercise
- **Mobile**: Horizontal scroll for table

**Component**:
```vue
<!-- WorkoutExerciseList.vue -->
<script setup>
import { useI18n } from 'vue-i18n'
import WorkoutExerciseCard from './WorkoutExerciseCard.vue'

const props = defineProps({
  exercises: {
    type: Array,
    required: true
  }
})

const { t } = useI18n()
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-xl font-semibold mb-4">{{ $t('workout.detail.exercises') }}</h2>

    <WorkoutExerciseCard
      v-for="(exercise, index) in exercises"
      :key="index"
      :exercise="exercise"
      :index="index"
    />
  </div>
</template>

<!-- WorkoutExerciseCard.vue -->
<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUnits } from '@/composables/useUnits'
import { Card } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

const props = defineProps({
  exercise: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  }
})

const { t } = useI18n()
const { formatWeight } = useUnits()

const exerciseVolume = computed(() => {
  return props.exercise.sets.reduce((sum, set) => {
    return sum + (set.weight * set.reps)
  }, 0)
})
</script>

<template>
  <Card class="p-4">
    <h3 class="text-lg font-semibold mb-3">
      {{ index + 1 }}. {{ exercise.name }}
    </h3>

    <div class="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{{ $t('workout.set') }}</TableHead>
            <TableHead>{{ $t('workout.weight') }}</TableHead>
            <TableHead>{{ $t('workout.reps') }}</TableHead>
            <TableHead>{{ $t('workout.volume') }}</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          <TableRow v-for="(set, setIndex) in exercise.sets" :key="setIndex">
            <TableCell>{{ setIndex + 1 }}</TableCell>
            <TableCell>{{ formatWeight(set.weight) }}</TableCell>
            <TableCell>{{ set.reps }}</TableCell>
            <TableCell>{{ formatWeight(set.weight * set.reps) }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <div class="mt-3 text-right font-semibold">
      {{ $t('workout.detail.exerciseTotal') }}: {{ formatWeight(exerciseVolume) }}
    </div>
  </Card>
</template>
```

---

### 5.4 Muscle Distribution Component

**Visual Design**:
```
┌─────────────────────────────────────────────────┐
│  Muscle Groups Trained                          │
│  ┌──────────┬──────┬──────────────────┐        │
│  │  Chest   │  40% │ ████████░░░░░░░░ │        │
│  │  Back    │  30% │ ██████░░░░░░░░░░ │        │
│  │  Legs    │  20% │ ████░░░░░░░░░░░░ │        │
│  │  Triceps │  10% │ ██░░░░░░░░░░░░░░ │        │
│  └──────────┴──────┴──────────────────┘        │
└─────────────────────────────────────────────────┘
```

**Component**:
```vue
<!-- WorkoutMuscleDistribution.vue -->
<script setup>
import { useI18n } from 'vue-i18n'
import { Card } from '@/components/ui/card'
import { MUSCLE_COLORS } from '@/utils/chartUtils'

const props = defineProps({
  distribution: {
    type: Array,
    required: true
  }
})

const { t } = useI18n()
</script>

<template>
  <Card class="p-6">
    <h2 class="text-xl font-semibold mb-4">{{ $t('workout.muscleDistribution.title') }}</h2>

    <div v-if="distribution.length === 0" class="text-center text-muted-foreground py-8">
      {{ $t('workout.muscleDistribution.noMuscles') }}
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="item in distribution"
        :key="item.muscle"
        class="flex items-center gap-4"
      >
        <div class="w-24 text-sm font-medium">
          {{ $t(`common.muscleGroups.${item.muscle}`) }}
        </div>

        <div class="w-16 text-sm text-muted-foreground text-right">
          {{ item.percentage.toFixed(0) }}%
        </div>

        <div class="flex-1 h-6 bg-muted rounded-full overflow-hidden">
          <div
            class="h-full transition-all duration-300"
            :style="{
              width: `${item.percentage}%`,
              backgroundColor: MUSCLE_COLORS[item.muscle] || '#3b82f6'
            }"
          />
        </div>
      </div>
    </div>
  </Card>
</template>
```

---

### 5.5 Mobile Responsiveness

**Breakpoints**:
- **Mobile** (<640px): Single column layout, stacked stats
- **Tablet** (640-1024px): 2-column stats grid
- **Desktop** (>1024px): 4-column stats grid, wider content

**Touch Targets**:
- All buttons: Minimum 44×44px (WCAG 2.1)
- Table rows: Minimum 48px height

---

## 6. Acceptance Criteria

### Phase 1: MVP (Bug Fix + Basic Detail View)

#### Critical Bug Fix
- [ ] Clicking Exercise History row in Analytics navigates to `/workouts/:id`
- [ ] No console errors on navigation
- [ ] Route loads successfully
- [ ] Browser back button works correctly

#### Workout Detail View
- [ ] **Header** displays:
  - [ ] Full date (locale-aware)
  - [ ] Duration (formatted as "Xh Ymin")
  - [ ] Total volume (with unit conversion)
  - [ ] Exercise count
- [ ] **Summary Stats** display:
  - [ ] Total volume (4 stat cards)
  - [ ] Total sets
  - [ ] Total exercises
  - [ ] Duration
- [ ] **Exercise List** displays:
  - [ ] All exercises from workout
  - [ ] Sets table (weight, reps, volume per set)
  - [ ] Total volume per exercise
  - [ ] Correct numbering (1, 2, 3...)
- [ ] **Muscle Distribution** displays:
  - [ ] List of muscle groups trained
  - [ ] Percentage for each muscle
  - [ ] Visual progress bar
  - [ ] Color-coded by muscle

#### Navigation
- [ ] **Back button** returns to source route:
  - [ ] `?from=analytics` → `/analytics`
  - [ ] `?from=dashboard` → `/`
  - [ ] No query param → `/workouts`
- [ ] **Previous/Next workout buttons**:
  - [ ] Previous button shown if not first workout
  - [ ] Next button shown if not last workout
  - [ ] Buttons navigate correctly
  - [ ] Context (`?from`) preserved

#### Loading & Error States
- [ ] **Loading state** while fetching workout
- [ ] **404 state** if workout not found:
  - [ ] Error icon + message
  - [ ] "Go Back" button
- [ ] **Network error** handled gracefully:
  - [ ] Toast error message
  - [ ] Option to retry or go back

#### Internationalization
- [ ] All text uses i18n keys
- [ ] Works in English (`en`)
- [ ] Works in Ukrainian (`uk`)
- [ ] Date formatting respects locale
- [ ] Number formatting respects locale

#### Responsiveness
- [ ] **Mobile** (<640px):
  - [ ] Stats in 2×2 grid
  - [ ] Table horizontal scroll
  - [ ] Single column layout
- [ ] **Tablet** (640-1024px):
  - [ ] Stats in 2×2 or 4×1 grid
  - [ ] Comfortable spacing
- [ ] **Desktop** (>1024px):
  - [ ] Stats in 4×1 grid
  - [ ] Max width constraint (prevent overstretching)

#### Accessibility
- [ ] All buttons have ARIA labels
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader announces page title
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible

---

## 7. Implementation Plan

### Phase 1: MVP (4-5 Days)

#### Day 1: Route Setup & Store Extension
**Tasks**:
1. Add `/workouts/:id` route to `src/router/index.js`
2. Extend `workoutStore.js` with `fetchWorkout(id)` action
3. Write unit tests for `fetchWorkout`
4. Update Analytics `ExerciseTable.vue` to use correct route

**Deliverables**:
- [ ] Route defined and tested
- [ ] Store action working
- [ ] Navigation from Analytics fixed

**Code Changes**:
```javascript
// src/router/index.js - Add route
{
  path: '/workouts/:id',
  name: 'WorkoutDetail',
  component: () => import('@/pages/workouts/WorkoutDetailView.vue'),
  meta: { requiresAuth: true, title: 'Workout Details' },
  props: (route) => ({ id: route.params.id, from: route.query.from || 'workouts' })
}

// src/stores/workoutStore.js - Add action
async function fetchWorkout(workoutId) { /* implementation */ }
```

---

#### Day 2: Core Components (Header, Stats, Exercise List)
**Tasks**:
1. Create `src/pages/workouts/WorkoutDetailView.vue`
2. Create `WorkoutHeader.vue`
3. Create `WorkoutSummaryStats.vue`
4. Create `WorkoutExerciseList.vue` + `WorkoutExerciseCard.vue`
5. Wire up data flow (props, computed)

**Deliverables**:
- [ ] Basic detail view rendering
- [ ] All data displayed correctly
- [ ] Responsive layout

---

#### Day 3: Muscle Distribution & Navigation
**Tasks**:
1. Create `WorkoutMuscleDistribution.vue`
2. Implement back button logic (context-aware)
3. Implement prev/next workout navigation
4. Add loading/error states
5. Write component tests

**Deliverables**:
- [ ] Muscle distribution displayed
- [ ] Navigation working (back, prev, next)
- [ ] Error handling complete

---

#### Day 4: Internationalization & Polish
**Tasks**:
1. Add i18n keys to `en/workout.json` and `uk/workout.json`
2. Replace all hardcoded strings
3. Test locale switching
4. Mobile optimization
5. Accessibility audit (keyboard, screen reader)

**Deliverables**:
- [ ] Full i18n support
- [ ] Mobile-optimized
- [ ] Accessible

---

#### Day 5: Testing & QA
**Tasks**:
1. Write unit tests for all components
2. Integration test for WorkoutDetailView
3. Manual QA (all browsers)
4. Performance testing (large workouts)
5. Bug fixes

**Deliverables**:
- [ ] All tests passing
- [ ] No critical bugs
- [ ] Ready for deployment

---

### Phase 2: Advanced Features (Future - 3-4 Days)

#### Week 2: Actions & Edit Mode
1. Implement delete workout functionality
2. Implement duplicate workout functionality
3. Implement share workout functionality
4. Add edit mode toggle
5. Add workout editing logic
6. Testing & QA

---

## 8. Internationalization (i18n)

### 8.1 English Translations

```json
// src/i18n/locales/en/workout.json

{
  "detail": {
    "title": "Workout Details",
    "notFound": "Workout Not Found",
    "notFoundDescription": "This workout may have been deleted or does not exist.",
    "loadError": "Failed to load workout",
    "previousWorkout": "Previous Workout",
    "nextWorkout": "Next Workout",
    "exercises": "Exercises",
    "exerciseTotal": "Total"
  },

  "stats": {
    "totalVolume": "Total Volume",
    "totalSets": "Total Sets",
    "exercises": "Exercises",
    "duration": "Duration"
  },

  "muscleDistribution": {
    "title": "Muscle Groups Trained",
    "noMuscles": "No muscle groups detected"
  },

  "set": "Set",
  "weight": "Weight",
  "reps": "Reps",
  "volume": "Volume",
  "exercises": "no exercises | 1 exercise | {count} exercises",

  "actions": {
    "delete": "Delete Workout",
    "deleteConfirm": "Are you sure you want to delete this workout?",
    "deleteSuccess": "Workout deleted successfully",
    "duplicate": "Duplicate Workout",
    "duplicateSuccess": "Workout duplicated successfully",
    "share": "Share Workout",
    "shareSuccess": "Workout summary copied to clipboard"
  }
}
```

---

### 8.2 Ukrainian Translations

```json
// src/i18n/locales/uk/workout.json

{
  "detail": {
    "title": "Деталі тренування",
    "notFound": "Тренування не знайдено",
    "notFoundDescription": "Це тренування може бути видалено або не існує.",
    "loadError": "Не вдалося завантажити тренування",
    "previousWorkout": "Попереднє тренування",
    "nextWorkout": "Наступне тренування",
    "exercises": "Вправи",
    "exerciseTotal": "Всього"
  },

  "stats": {
    "totalVolume": "Загальний об'єм",
    "totalSets": "Всього підходів",
    "exercises": "Вправи",
    "duration": "Тривалість"
  },

  "muscleDistribution": {
    "title": "Групи м'язів",
    "noMuscles": "Групи м'язів не виявлено"
  },

  "set": "Підхід",
  "weight": "Вага",
  "reps": "Повторення",
  "volume": "Об'єм",
  "exercises": "немає вправ | 1 вправа | {count} вправи | {count} вправ",

  "actions": {
    "delete": "Видалити тренування",
    "deleteConfirm": "Ви впевнені, що хочете видалити це тренування?",
    "deleteSuccess": "Тренування успішно видалено",
    "duplicate": "Дублювати тренування",
    "duplicateSuccess": "Тренування успішно дубльовано",
    "share": "Поділитися тренуванням",
    "shareSuccess": "Деталі тренування скопійовано в буфер обміну"
  }
}
```

---

### 8.3 Common Translations (if not already present)

```json
// src/i18n/locales/en/common.json

{
  "back": "Back",
  "goBack": "Go Back",
  "loading": "Loading...",
  "error": "Error",
  "retry": "Retry",
  "cancel": "Cancel",
  "confirm": "Confirm",
  "delete": "Delete",
  "save": "Save",
  "edit": "Edit"
}
```

```json
// src/i18n/locales/uk/common.json

{
  "back": "Назад",
  "goBack": "Повернутись",
  "loading": "Завантаження...",
  "error": "Помилка",
  "retry": "Повторити",
  "cancel": "Скасувати",
  "confirm": "Підтвердити",
  "delete": "Видалити",
  "save": "Зберегти",
  "edit": "Редагувати"
}
```

---

## 9. Edge Cases & Error Handling

### 9.1 Edge Cases

| Edge Case | Behavior | Solution |
|-----------|----------|----------|
| **Workout ID doesn't exist** | User navigates to `/workouts/invalid-id` | Show 404 error state with "Go Back" button |
| **Workout has 0 exercises** | Empty workout (data corruption?) | Show empty state: "This workout has no exercises" |
| **Workout has 0 duration** | Duration not tracked or old workout | Display "Duration not recorded" instead of "0 min" |
| **Workout has 1 exercise** | Minimal workout | Render normally (no special handling) |
| **Workout has 50+ exercises** | Very long workout (unlikely) | Virtualize list or add pagination |
| **User deletes workout while viewing** | Workout deleted by another device (sync) | Detect via Firestore listener, show toast, navigate away |
| **Network error during load** | Firestore fetch fails | Show error state with retry button |
| **Browser back from detail** | User expects to return to original page | Respect browser history (no special handling needed) |
| **Direct URL access** | User bookmarks `/workouts/:id` | Fetch workout if not in store, works normally |
| **First workout in history** | No previous workout | Hide/disable "Previous Workout" button |
| **Last workout in history** | No next workout | Hide/disable "Next Workout" button |
| **Only 1 workout total** | No previous or next | Hide both navigation buttons |

---

### 9.2 Error Handling Checklist

- [ ] **404 Not Found**: Show user-friendly error, offer "Go Back"
- [ ] **Network Error**: Show retry button, don't crash
- [ ] **Permission Denied**: Show error (shouldn't happen with auth guards)
- [ ] **Firestore Timeout**: Show error, offer retry
- [ ] **Invalid Workout Data**: Gracefully handle missing fields (use fallbacks)
- [ ] **Concurrent Deletion**: Detect workout deletion, notify user, navigate away

---

### 9.3 Error Messages

```javascript
// In WorkoutDetailView.vue

const ERROR_MESSAGES = {
  NOT_FOUND: 'workout.detail.notFound',
  LOAD_FAILED: 'workout.detail.loadError',
  PERMISSION_DENIED: 'errors.permissionDenied',
  NETWORK_ERROR: 'errors.networkError'
}

function handleFetchError(error) {
  let messageKey = ERROR_MESSAGES.LOAD_FAILED

  if (error.code === 'not-found') {
    messageKey = ERROR_MESSAGES.NOT_FOUND
  } else if (error.code === 'permission-denied') {
    messageKey = ERROR_MESSAGES.PERMISSION_DENIED
  } else if (error.message.includes('network')) {
    messageKey = ERROR_MESSAGES.NETWORK_ERROR
  }

  handleError(error, t(messageKey), 'WorkoutDetailView')
}
```

---

## 10. Testing Requirements

### 10.1 Unit Tests

#### workoutStore.spec.js

```javascript
describe('workoutStore.fetchWorkout', () => {
  it('should fetch workout by ID from Firestore', async () => {
    const mockWorkout = { id: 'workout-1', exercises: [] }
    fetchDocument.mockResolvedValue(mockWorkout)

    const store = useWorkoutStore()
    const result = await store.fetchWorkout('workout-1')

    expect(fetchDocument).toHaveBeenCalledWith(COLLECTIONS.WORKOUTS, 'workout-1')
    expect(result).toEqual(mockWorkout)
    expect(store.workouts).toContain(mockWorkout)
  })

  it('should return cached workout if already in store', async () => {
    const mockWorkout = { id: 'workout-1', exercises: [] }
    const store = useWorkoutStore()
    store.workouts = [mockWorkout]

    const result = await store.fetchWorkout('workout-1')

    expect(fetchDocument).not.toHaveBeenCalled()
    expect(result).toEqual(mockWorkout)
  })

  it('should throw error if workout not found', async () => {
    fetchDocument.mockResolvedValue(null)

    const store = useWorkoutStore()

    await expect(store.fetchWorkout('invalid-id')).rejects.toThrow('Workout not found')
  })
})
```

---

#### WorkoutDetailView.spec.js

```javascript
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import WorkoutDetailView from '../WorkoutDetailView.vue'

describe('WorkoutDetailView', () => {
  it('renders workout details when loaded', async () => {
    const mockWorkout = {
      id: 'workout-1',
      createdAt: new Date('2024-12-24'),
      duration: 90,
      exercises: [
        {
          name: 'Bench Press',
          sets: [
            { weight: 100, reps: 10 },
            { weight: 105, reps: 8 }
          ]
        }
      ]
    }

    const wrapper = mount(WorkoutDetailView, {
      props: { id: 'workout-1', from: 'analytics' },
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              workout: { workouts: [mockWorkout], loading: false }
            }
          })
        ]
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Bench Press')
    expect(wrapper.text()).toContain('100')
    expect(wrapper.text()).toContain('10')
  })

  it('shows 404 error when workout not found', async () => {
    const wrapper = mount(WorkoutDetailView, {
      props: { id: 'invalid-id', from: 'analytics' },
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              workout: { workouts: [], loading: false }
            }
          })
        ]
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Workout Not Found')
  })

  it('navigates back to correct route', async () => {
    const mockRouter = { push: vi.fn() }

    const wrapper = mount(WorkoutDetailView, {
      props: { id: 'workout-1', from: 'analytics' },
      global: {
        plugins: [createTestingPinia()],
        mocks: { $router: mockRouter }
      }
    })

    await wrapper.find('[aria-label="Back"]').trigger('click')

    expect(mockRouter.push).toHaveBeenCalledWith('/analytics')
  })
})
```

---

### 10.2 Component Tests

#### WorkoutHeader.spec.js

```javascript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WorkoutHeader from '../WorkoutHeader.vue'

describe('WorkoutHeader', () => {
  it('displays formatted date', () => {
    const workout = {
      createdAt: new Date('2024-12-24')
    }
    const stats = {
      duration: 90,
      totalVolume: 8450,
      totalExercises: 7
    }

    const wrapper = mount(WorkoutHeader, {
      props: { workout, stats }
    })

    expect(wrapper.text()).toContain('December 24, 2024')
  })

  it('formats duration correctly', () => {
    const wrapper = mount(WorkoutHeader, {
      props: {
        workout: { createdAt: new Date() },
        stats: { duration: 83, totalVolume: 5000, totalExercises: 5 }
      }
    })

    expect(wrapper.text()).toContain('1h 23min')
  })
})
```

---

### 10.3 Integration Tests

```javascript
describe('Workout Detail Navigation Flow', () => {
  it('navigates from Analytics to Workout Detail and back', async () => {
    // 1. Mount Analytics page
    const analyticsWrapper = mount(AnalyticsView, {
      global: { plugins: [router, createTestingPinia()] }
    })

    // 2. Click on exercise row
    await analyticsWrapper.find('[data-testid="exercise-row-0"]').trigger('click')

    // 3. Verify navigation to /workouts/:id?from=analytics
    expect(router.currentRoute.value.name).toBe('WorkoutDetail')
    expect(router.currentRoute.value.query.from).toBe('analytics')

    // 4. Click back button
    await router.push('/analytics') // Simulate back button

    // 5. Verify back on analytics page
    expect(router.currentRoute.value.name).toBe('Analytics')
  })
})
```

---

### 10.4 E2E Tests (Optional - Cypress/Playwright)

```javascript
// cypress/e2e/workout-detail.cy.js

describe('Workout Detail View', () => {
  beforeEach(() => {
    cy.login() // Custom command
    cy.visit('/analytics')
  })

  it('displays workout details when clicking exercise', () => {
    cy.get('[data-testid="exercise-history-table"]')
      .find('tr')
      .first()
      .click()

    cy.url().should('include', '/workouts/')
    cy.contains('Bench Press').should('be.visible')
    cy.contains('Total Volume').should('be.visible')
  })

  it('navigates back to Analytics when clicking back button', () => {
    cy.get('[data-testid="exercise-row-0"]').click()
    cy.url().should('include', '/workouts/')

    cy.get('[aria-label="Back"]').click()
    cy.url().should('include', '/analytics')
  })
})
```

---

## 11. Success Metrics

### 11.1 Bug Resolution Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Bug Resolution Time** | <5 days | From discovery to deployment |
| **Zero Regression** | 0 new bugs | No new navigation errors introduced |
| **Error Rate Reduction** | -100% | No more "route not found" errors |

---

### 11.2 Feature Adoption Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Detail View Usage** | 30% of users | % of users who click into workout details within 7 days |
| **Avg Time on Detail Page** | >30 seconds | Indicates users are reading content |
| **Return Rate** | >40% | % of users who view details multiple times |
| **Navigation Success** | >95% | % of back button clicks that work correctly |

---

### 11.3 Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Page Load Time** | <500ms | Time from navigation to render (cached workout) |
| **First Fetch Time** | <1.5s | Time to fetch workout from Firestore (uncached) |
| **Largest Contentful Paint (LCP)** | <2.5s | Core Web Vital |
| **Cumulative Layout Shift (CLS)** | <0.1 | Core Web Vital |

---

### 11.4 Instrumentation

```javascript
// In WorkoutDetailView.vue

onMounted(() => {
  // Track page view
  trackEvent('workout_detail_viewed', {
    workoutId: props.id,
    from: props.from,
    exerciseCount: workout.value?.exercises.length || 0,
    duration: workout.value?.duration || 0
  })

  // Track load time
  const startTime = performance.now()

  watch(workout, (newWorkout) => {
    if (newWorkout) {
      const loadTime = performance.now() - startTime
      trackEvent('workout_detail_loaded', {
        loadTime,
        cached: loadTime < 100 // Assume cached if <100ms
      })
    }
  })
})

function handleBack() {
  trackEvent('workout_detail_back_clicked', {
    from: props.from,
    timeOnPage: performance.now() - mountTime
  })

  router.push(backRoute.value)
}
```

---

## 12. Technical Debt & Future Enhancements

### 12.1 Known Technical Debt

| Item | Severity | Mitigation Plan |
|------|----------|-----------------|
| **No workout editing** | MEDIUM | Add in Phase 2 (V1.1) |
| **No caching strategy** | LOW | workoutStore caches workouts in memory (acceptable for MVP) |
| **No optimistic UI** | LOW | Add skeleton loaders (already planned) |
| **No offline support** | LOW | Future enhancement (requires service worker) |
| **Hardcoded muscle groups** | LOW | Extract to config/database (V1.2) |

---

### 12.2 Future Enhancements

#### V1.1 (Phase 2)
- [ ] Workout editing (inline edit mode)
- [ ] Workout deletion with confirmation
- [ ] Workout duplication
- [ ] Share workout summary (text or image)

#### V1.2 (Advanced Features)
- [ ] Workout comparison (compare two workouts side-by-side)
- [ ] Workout templates (save workout as template)
- [ ] Export workout to PDF
- [ ] Add notes/comments to workout

#### V2.0 (Long-term)
- [ ] Workout photos/videos
- [ ] Workout tags/categories
- [ ] Advanced filtering (by muscle group, date range, etc.)
- [ ] Workout analytics (PRs, volume trends over time)
- [ ] Social features (share workout with friends)

---

### 12.3 Refactoring Opportunities

**After MVP Launch**:

1. **Extract Workout Summary Logic to Composable**:
   ```javascript
   // src/composables/useWorkoutSummary.js
   export function useWorkoutSummary(workout) {
     const totalVolume = computed(() => { /* ... */ })
     const totalSets = computed(() => { /* ... */ })
     const muscleDistribution = computed(() => { /* ... */ })

     return { totalVolume, totalSets, muscleDistribution }
   }
   ```

2. **Unified Workout Card Component**:
   - Reusable across Workouts list, Dashboard, Analytics
   - Props: `workout`, `variant` ('compact' | 'detailed')

3. **Workout Store Normalization**:
   - Store workouts as Map (by ID) instead of array for O(1) lookup
   - Index by date for faster filtering

---

## Appendix A: Data Structures

### Workout Object Schema

```typescript
interface Workout {
  id: string
  userId: string
  createdAt: Date // Firestore Timestamp
  duration: number | null // Minutes
  exercises: Exercise[]
  notes?: string // Optional workout notes
}

interface Exercise {
  name: string // Exercise name (from library or custom)
  sets: Set[]
  muscleGroups?: string[] // Cached muscle groups
}

interface Set {
  weight: number // In kg (storage unit)
  reps: number
  rpe?: number // Rate of Perceived Exertion (1-10)
  restTime?: number // Seconds
}
```

---

## Appendix B: File Structure

```
src/pages/workouts/
├── WorkoutDetailView.vue
├── WorkoutListView.vue (future)
├── components/
│   ├── WorkoutHeader.vue
│   ├── WorkoutSummaryStats.vue
│   ├── WorkoutExerciseList.vue
│   ├── WorkoutExerciseCard.vue
│   ├── WorkoutMuscleDistribution.vue
│   ├── WorkoutActions.vue (Phase 2)
│   └── __tests__/
│       ├── WorkoutDetailView.spec.js
│       ├── WorkoutHeader.spec.js
│       ├── WorkoutSummaryStats.spec.js
│       ├── WorkoutExerciseList.spec.js
│       └── WorkoutExerciseCard.spec.js

src/stores/
└── workoutStore.js (extend with fetchWorkout)

src/router/
└── index.js (add /workouts/:id route)

src/i18n/locales/
├── en/
│   └── workout.json
└── uk/
    └── workout.json
```

---

## Appendix C: Implementation Checklist

### Pre-Development
- [ ] Review this PRD with team
- [ ] Clarify any ambiguities
- [ ] Set up feature branch: `feature/workout-detail-view`
- [ ] Create Jira/Linear tasks

### Day 1: Route & Store
- [ ] Add `/workouts/:id` route to router
- [ ] Implement `fetchWorkout(id)` in workoutStore
- [ ] Write unit tests for fetchWorkout
- [ ] Fix Analytics ExerciseTable navigation

### Day 2: Core Components
- [ ] Create WorkoutDetailView.vue
- [ ] Create WorkoutHeader.vue
- [ ] Create WorkoutSummaryStats.vue
- [ ] Create WorkoutExerciseList.vue + Card
- [ ] Wire up data flow

### Day 3: Polish & Navigation
- [ ] Create WorkoutMuscleDistribution.vue
- [ ] Implement back button logic
- [ ] Implement prev/next navigation
- [ ] Add loading/error states
- [ ] Write component tests

### Day 4: i18n & Responsiveness
- [ ] Add all i18n keys (en + uk)
- [ ] Test locale switching
- [ ] Mobile optimization
- [ ] Accessibility audit

### Day 5: Testing & QA
- [ ] Unit tests for all components
- [ ] Integration tests
- [ ] Manual QA (all browsers)
- [ ] Bug fixes
- [ ] Code review
- [ ] Deploy to production

---

## Document Metadata

**Prepared By**: Claude (Product Manager Agent)
**Reviewed By**: [Team Lead Name]
**Approved By**: [Product Owner Name]
**Last Updated**: 2024-12-24
**Version**: 1.0
**Status**: Ready for Development

**Related Documents**:
- [ANALYTICS_PRD.md](./ANALYTICS_PRD.md) - Analytics section requirements
- [ANALYTICS_ARCHITECTURE.md](./ANALYTICS_ARCHITECTURE.md) - Technical architecture
- [CLAUDE.md](./CLAUDE.md) - Project development guidelines

**Questions or Feedback**: [Contact Product Owner]

---

**End of Document**
