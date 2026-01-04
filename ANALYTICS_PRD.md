# Analytics Section - Product Requirements Document (PRD)

## Executive Summary

The Analytics page will provide gym enthusiasts with **deep, actionable insights** beyond the high-level Dashboard overview. While the Dashboard shows "what happened" (volume, frequency, muscle distribution), Analytics answers **strategic questions**:
- "Am I getting stronger?"
- "Which exercises drive my progress?"
- "Am I balancing my training?"
- "How efficient are my workouts?"

**Core Philosophy**: Every chart must help the user make a training decision. No vanity metrics.

---

## 📊 Implementation Status (Updated: 2026-01-02)

### MVP (Phase 1) - ✅ **100% COMPLETE**
- ✅ Muscle Volume Over Time (Tab 1)
- ✅ Workout Duration Trend (Tab 2)
- ✅ Volume Heatmap (Tab 3)
- ✅ Progressive Overload Tracker (Tab 3)
- ✅ Exercise Progress Table (Tab 4)

### V1.1 (Phase 2) - ⚠️ **25% COMPLETE**
- ❌ Muscle Balance Scorecard - TODO
- ❌ Duration Breakdown - BLOCKED (needs set timestamps)
- ❌ Volume by Exercise Type - TODO (needs exercise type field)
- ⚠️ Exercise PR Timeline - 90% DONE (data ready, needs UI)

### V1.2 (Phase 3) - ❌ **0% COMPLETE**
- ❌ Efficiency Score & Recommendations - TODO
- ❌ PR Celebration Animations - TODO
- ❌ Set Duration Tracking - TODO

### Utility Implementation Status
- ✅ `statsUtils.js` - COMPLETE
- ✅ `strengthUtils.js` - COMPLETE
- ❌ `recommendationUtils.js` - NOT IMPLEMENTED

**Next Priority**: Complete Exercise PR Timeline UI (2-3 days effort)

---

## 1. Background Analysis

### 1.1 What Dashboard Already Provides

To avoid redundancy, we must understand what already exists:

| Dashboard Feature | Data Shown | Time Period | User Value |
|-------------------|------------|-------------|------------|
| **Training Volume Chart** | Volume (kg) and exercise count over time | Last 30 days | Shows workout intensity trends |
| **Muscle Distribution** | Sets by muscle group (donut chart) | Current period snapshot | Shows current training balance |
| **Training Frequency** | GitHub-style heatmap | Last 12 months | Shows workout consistency |
| **Period Comparison** | Volume, workouts, avg volume comparison | Current vs previous period | Shows progress direction |
| **Quick Stats** | Total workouts, volume load, rest days, current streak | Last 30 days | At-a-glance performance |

### 1.2 Available Data (from analyticsStore + workoutStore)

**Currently Computed** (can be reused/extended):
- `totalWorkouts`
- `totalVolume`
- `totalExercises`
- `restDays`
- `currentStreak`
- `bestStreak`
- `avgWorkoutDuration`
- `avgWeightPerWorkout`
- `muscleGroupDistribution` (sets by muscle)
- `exerciseHistory` (recent exercises with sets/reps/weight)
- `volumeOverTime` (daily volume aggregation)
- `frequencyData` (contribution heatmap data)

**Needs Implementation**:
- Muscle volume trends over time (not just current distribution)
- Exercise-specific progress tracking (1RM estimation, PRs)
- Week-by-week progressive overload analysis
- Duration efficiency metrics
- Exercise type breakdown (strength/cardio/flexibility)
- Recovery patterns

### 1.3 Analytics Page Tabs (from screenshot)

1. **Muscles** - Deep dive into muscle group analytics
2. **Duration** - Workout efficiency and time analysis
3. **Volume** - Advanced volume metrics beyond Dashboard chart
4. **Exercises** - Individual exercise progress tracking

---

## 2. User Personas & Jobs-to-be-Done

### Persona 1: The Progressive Lifter
- **Name**: Богдан (our actual user!)
- **Goals**: Track strength gains, ensure progressive overload, avoid plateaus
- **Pain Points**: Can't easily see if exercises are progressing week-to-week
- **Jobs-to-be-Done**:
  - "When I'm planning next week's workout, I want to know which exercises are stalling so I can adjust my training."
  - "When I look at my analytics, I want to see if I'm actually getting stronger, not just doing more workouts."

### Persona 2: The Efficiency Optimizer
- **Goals**: Maximize results in minimum time, avoid wasted sets
- **Pain Points**: Doesn't know if workouts are getting more efficient
- **Jobs-to-be-Done**:
  - "When I review my training, I want to know which exercises give me the most bang for my buck."
  - "When I'm short on time, I want to see which muscle groups need priority."

---

## 3. Feature Specifications by Tab

## Tab 1: MUSCLES

### Feature 1.1: Muscle Volume Over Time (Line Chart)
**Priority**: HIGH | **Effort**: MEDIUM | **Version**: MVP

**User Story**:
> As a user, I want to see how my training volume for each muscle group has changed over time, so I can identify trends and ensure balanced development.

**Acceptance Criteria**:
- [x] Multi-line chart showing volume (kg) per muscle group over selected period
- [x] Each muscle group has a distinct color (matches Dashboard donut colors)
- [x] X-axis: Date (daily aggregation via `muscleVolumeByDay`)
- [x] Y-axis: Volume (kg) with locale-aware formatting
- [x] Legend shows muscle groups with toggle visibility
- [x] Hovering on any point shows tooltip: Date, Muscle Group, Volume, % of total
- [x] Responsive: Full chart on desktop, scrollable on mobile
- [x] Empty state: "No workout data for selected period"
- [x] Period selector integration

**Status**: ✅ **COMPLETE** - Component: `/src/pages/analytics/components/muscles/MuscleVolumeChart.vue`

**Data Requirements**:
```javascript
// New computed property needed in analyticsStore
muscleVolumeOverTime = computed(() => {
  // Aggregate workouts by week
  // For each week, calculate total volume per muscle group
  // Return: [{ week: 'Dec 1', back: 5000, chest: 4000, legs: 6000, ... }]
})
```

**Differentiator from Dashboard**:
- Dashboard shows current distribution (pie chart %)
- Analytics shows **trends over time** (line chart kg)

**Technical Notes**:
- Reuse muscle group logic from `getMuscleGroups` in `src/utils/muscleUtils.js`
- Use Chart.js or Recharts (already in dependencies?)
- Weekly aggregation prevents chart overload (max 52 points for 1 year)

---

### Feature 1.2: Muscle Balance Scorecard (Table)
**Priority**: MEDIUM | **Effort**: LOW | **Version**: V1.1

**User Story**:
> As a user, I want to see if my training is balanced across muscle groups compared to ideal proportions, so I can adjust my program to avoid imbalances.

**Acceptance Criteria**:
- [ ] Table with columns: Muscle Group | Current % | Ideal % | Status | Difference
- [ ] Status badge:
  - ✅ Balanced (within ±10% of ideal)
  - ⚠️ Under-trained (>10% below ideal)
  - ⚠️ Over-trained (>10% above ideal)
- [ ] Sortable by difference (default: most under-trained first)
- [ ] Color-coded status: Green/Yellow/Red
- [ ] Recommendation text: "Consider adding 2 more back exercises per week"
- [ ] Collapsible section: "Understanding Muscle Balance" (educational)

**Status**: ❌ **NOT IMPLEMENTED** - Missing component and config constants

**Data Requirements**:
```javascript
// Add to src/constants/config.js
analytics: {
  muscleBalance: {
    EXPECTED_DISTRIBUTION: {
      legs: 25,      // Largest muscle group
      back: 20,      // Pull dominance
      chest: 18,     // Push
      shoulders: 12, // Supporting
      biceps: 8,
      triceps: 8,
      core: 6,
      calves: 3
    },
    TOLERANCE: 10 // ±10%
  }
}
```

**i18n Keys**:
```json
{
  "analytics.muscles.balanceTable.title": "Muscle Balance Scorecard",
  "analytics.muscles.balanceTable.balanced": "Balanced",
  "analytics.muscles.balanceTable.underTrained": "Under-trained",
  "analytics.muscles.balanceTable.overTrained": "Over-trained",
  "analytics.muscles.balanceTable.recommendation": "Consider adding {count} more {muscle} exercises per week"
}
```

**Why Not on Dashboard**:
- Dashboard is for quick overview (donut chart)
- This requires deeper analysis and recommendations

---

### Feature 1.3: Muscle Fatigue Indicator (Heatmap)
**Priority**: LOW | **Effort**: HIGH | **Version**: Future (V2)

**User Story**:
> As a user, I want to see which muscle groups I train on which days of the week, so I can optimize my recovery and avoid overtraining.

**Acceptance Criteria**:
- [ ] 7x8 heatmap: Days of week (rows) x Muscle groups (columns)
- [ ] Color intensity: Volume trained on that day (darker = more volume)
- [ ] Clicking a cell shows list of exercises done
- [ ] Warning badge if same muscle trained <48h apart
- [ ] Recommendation: "Consider rest day or different muscle group"

**Status**: ❌ **FUTURE (V2)** - Deferred per PRD timeline

**Data Requirements**:
- Workout timestamp → Day of week mapping
- Volume per muscle per day
- Last trained date per muscle group

**Why Future**:
- Complex UX (heatmap + recommendations)
- Requires understanding of recovery science
- Lower priority than progress tracking

---

## Tab 2: DURATION

### Feature 2.1: Workout Duration Trend (Scatter + Line Chart)
**Priority**: HIGH | **Effort**: MEDIUM | **Version**: MVP

**User Story**:
> As a user, I want to see how long my workouts take over time and how duration relates to volume, so I can optimize my efficiency.

**Acceptance Criteria**:
- [x] Scatter plot: X = Date, Y = Duration (minutes)
- [x] Point size = Total volume (larger = more volume)
- [x] Color-coded by volume quartile: Low (blue), Medium (yellow), High (green)
- [x] Trend line overlay (linear regression)
- [x] Statistics panel:
  - Average duration: `88 min`
  - Shortest: `45 min (Dec 1)`
  - Longest: `125 min (Nov 24)`
  - Trend: `↓ 5 min/month` (getting faster)
- [x] Clicking point navigates to workout detail
- [x] Tooltip: Date, Duration, Volume, Exercises count

**Status**: ✅ **COMPLETE** - Component: `/src/pages/analytics/components/duration/DurationTrendChart.vue`

**Data Requirements**:
```javascript
// Already available in workoutStore
workouts.forEach(w => ({
  date: w.createdAt,
  duration: w.duration, // Already tracked
  volume: calculateTotalVolume(w),
  exerciseCount: w.exercises.length
}))
```

**New Utility**:
```javascript
// src/utils/statsUtils.js
export function calculateLinearRegression(points) {
  // Returns { slope, intercept, r2 }
  // Used for trend line
}
```

**Technical Notes**:
- Duration already tracked in workouts (timestamp difference)
- Use d3-regression or implement simple linear regression
- Mobile: Show trend line only, hide individual points (too cluttered)

---

### Feature 2.2: Duration Breakdown (Stacked Bar Chart)
**Priority**: MEDIUM | **Effort**: MEDIUM | **Version**: V1.1

**User Story**:
> As a user, I want to see which exercises take the most time in my workouts, so I can identify time sinks and optimize my routine.

**Acceptance Criteria**:
- [ ] Stacked bar chart: Top 10 exercises by time spent
- [ ] Bar segments: Rest time (gray), Working time (blue)
- [ ] X-axis: Exercise name (truncated if needed)
- [ ] Y-axis: Total time (minutes)
- [ ] Sort options: Total time / Efficiency (volume per minute)
- [ ] Efficiency metric shown: `12.5 kg/min` (volume / time)
- [ ] Clicking bar shows detailed breakdown:
  - Sets completed: 5
  - Avg set time: 45s
  - Avg rest time: 90s
  - Total time: 11 min
  - Volume generated: 500 kg
  - Efficiency grade: B (75-100 kg/min)

**Status**: ❌ **NOT IMPLEMENTED** - ⚠️ **Blocker**: Set-level timestamps not tracked (requires estimation)

**Data Requirements**:
- Need to track set timestamps (currently missing?)
- Estimate rest time if not tracked: Use `DEFAULT_REST_TIME` from config
- Calculate efficiency: `totalVolume / totalDuration`

**Implementation Challenge**:
⚠️ **Blocker**: We don't currently track set-level timestamps. Options:
1. **Estimate**: Use `setsCount * (45s working + 90s rest)` = ~2.25 min/exercise
2. **Add tracking**: Future feature to track actual set times
3. **Hybrid**: Estimate for historical data, track going forward

**Recommendation**: Start with estimation (Option 1) for MVP, add real tracking in V1.2

---

### Feature 2.3: Efficiency Score & Recommendations
**Priority**: LOW | **Effort**: HIGH | **Version**: V1.2

**User Story**:
> As a user, I want to receive personalized recommendations on how to make my workouts more efficient, so I can achieve the same results in less time.

**Acceptance Criteria**:
- [ ] Efficiency score card:
  - Overall score: `82/100` (kg/min)
  - Grade: A/B/C/D/F
  - Percentile: "Better than 68% of users" (if we have community data)
- [ ] Recommendations list (prioritized):
  1. 🎯 "Reduce rest time between sets from 120s to 90s (-15 min/workout)"
  2. 🎯 "Replace Dumbbell Curls with Barbell Curls (same volume, -5 min)"
  3. 🎯 "Superset opposing muscle groups (Push + Pull)"
- [ ] Impact estimation: "Save ~45 min/week"
- [ ] One-click "Apply Recommendation" → Updates workout plan

**Status**: ❌ **V1.2 - NOT IMPLEMENTED** - Missing `recommendationUtils.js` and component

**Data Requirements**:
```javascript
// src/constants/config.js
analytics: {
  efficiency: {
    GRADE_THRESHOLDS: {
      A: 100, // kg/min
      B: 75,
      C: 50,
      D: 25,
      F: 0
    }
  }
}
```

**Algorithm**:
```javascript
// src/utils/recommendationUtils.js
export function generateEfficiencyRecommendations(workouts) {
  const avgRestTime = calculateAvgRestTime(workouts)
  const recommendations = []

  if (avgRestTime > 90) {
    recommendations.push({
      type: 'rest_time',
      impact: (avgRestTime - 90) * sets,
      suggestion: `Reduce rest to 90s`
    })
  }

  // More rules...
  return recommendations.sort((a, b) => b.impact - a.impact)
}
```

**Why V1.2**:
- Requires sophisticated logic and user testing
- Need to validate recommendations don't harm training quality
- Lower priority than core analytics

---

## Tab 3: VOLUME

### Feature 3.1: Volume Heatmap (Calendar View)
**Priority**: HIGH | **Effort**: LOW | **Version**: MVP

**User Story**:
> As a user, I want to see my daily training volume in a visual heatmap, so I can spot patterns and ensure consistent progressive overload.

**Acceptance Criteria**:
- [x] GitHub-style contribution heatmap
- [x] Color intensity: Total volume (kg) per day
- [x] Color scale: Light blue (low) → Dark blue (high)
- [x] Tooltip: Date, Total volume, Workouts count
- [x] Legend: "Less" ← → "More" with color gradient
- [x] Clicking day navigates to workout detail
- [x] Empty state: Gray (no workout)
- [x] Period: Last 12 months

**Status**: ✅ **COMPLETE** - Component: `/src/pages/analytics/components/volume/VolumeHeatmap.vue`

**Data Requirements**:
```javascript
// Similar to frequencyData, but keyed by volume
dailyVolumeMap = computed(() => {
  const map = {}
  workouts.value.forEach(w => {
    const date = formatDate(w.createdAt, 'YYYY-MM-DD')
    map[date] = (map[date] || 0) + calculateTotalVolume(w)
  })
  return map
})
```

**Differentiator from Dashboard Frequency**:
- Dashboard Frequency: Shows **workout count** (did you train?)
- Analytics Volume Heatmap: Shows **volume intensity** (how hard did you train?)

**Technical Notes**:
- **Reuse** `src/pages/dashboard/components/charts/FrequencyChart.vue`
- Modify to accept `volumeMap` prop instead of `frequencyMap`
- Color scale based on volume percentiles (not binary yes/no)

---

### Feature 3.2: Volume by Exercise Type (Donut Chart)
**Priority**: MEDIUM | **Effort**: LOW | **Version**: V1.1

**User Story**:
> As a user, I want to see what percentage of my training volume comes from different exercise types (strength/cardio/etc.), so I can ensure I'm following a balanced program.

**Acceptance Criteria**:
- [ ] Donut chart with segments: Strength, Cardio, Flexibility, Other
- [ ] Center shows total volume with unit
- [ ] Percentages on segments
- [ ] Legend with absolute values:
  - Strength: `68,450 kg` (92%)
  - Cardio: `4,200 kg` (6%)
  - Flexibility: `1,500 kg` (2%)
- [ ] Clicking segment filters exercise list below
- [ ] Color-coded: Strength (blue), Cardio (red), Flexibility (green)

**Status**: ❌ **NOT IMPLEMENTED** - Requires `type` field in exercise data model + migration

**Data Requirements**:
```javascript
// Need to add exerciseType to exercise metadata
// Extend src/stores/exerciseStore.js
exerciseLibrary: [
  {
    id: 'bench-press',
    name: 'Bench Press',
    muscleGroups: ['chest', 'triceps'],
    type: 'strength', // NEW field
    equipment: 'barbell'
  },
  // ...
]
```

**Migration Note**:
- Existing exercises default to `type: 'strength'`
- Add type selector when creating new exercises

**Differentiator from Dashboard Muscle Distribution**:
- Dashboard: Muscle groups (where)
- Analytics: Exercise types (what)

---

### Feature 3.3: Progressive Overload Tracker (Bar Chart)
**Priority**: HIGH | **Effort**: MEDIUM | **Version**: MVP

**User Story**:
> As a user, I want to see if I'm increasing my training volume week over week, so I know if I'm actually progressing or just maintaining.

**Acceptance Criteria**:
- [x] Bar chart: X = Week number, Y = Total volume (kg)
- [x] Each bar color-coded:
  - 🟢 Green: Volume increased ≥2.5% from previous week (progressing)
  - 🟡 Yellow: Volume within ±2.5% (maintaining)
  - 🔴 Red: Volume decreased >2.5% (regressing)
- [x] Percentage change label on each bar: `+5.2%`
- [x] Statistics panel:
  - Weeks progressing: `8/12` (67%)
  - Average weekly increase: `+3.1%`
  - Status: 🟢 "On track for progressive overload"
  - Next week target: `7,890 kg`
- [x] Period selector: Last 8/12/26 weeks
- [ ] Target line overlay: Expected progression (2.5%/week) - ⚠️ Minor enhancement
- [ ] Clicking bar expands to show exercise breakdown - ⚠️ Future enhancement

**Status**: ✅ **COMPLETE** - Component: `/src/pages/analytics/components/volume/ProgressiveOverloadChart.vue`

**Data Requirements**:
```javascript
// New computed in analyticsStore
weeklyVolumeProgression = computed(() => {
  const weeks = groupWorkoutsByWeek(workouts.value)
  return weeks.map((week, i) => {
    const prevWeek = weeks[i - 1]
    const change = prevWeek ? (week.volume - prevWeek.volume) / prevWeek.volume * 100 : 0
    return {
      weekNumber: week.weekNumber,
      weekStart: week.startDate,
      volume: week.volume,
      change,
      status: change >= 2.5 ? 'progressing' : change <= -2.5 ? 'regressing' : 'maintaining'
    }
  })
})
```

**New Utility**:
```javascript
// src/utils/dateUtils.js
export function getWeekNumber(date) {
  // ISO week number (1-52)
}

export function groupWorkoutsByWeek(workouts) {
  // Group workouts by week, sum volume
}
```

**Constants**:
```javascript
// src/constants/config.js
analytics: {
  progressiveOverload: {
    TARGET_WEEKLY_INCREASE: 2.5, // %
    STALL_THRESHOLD: 2.5, // %
    MIN_WEEKS_FOR_TREND: 4
  }
}
```

**Why Critical for Analytics**:
- Progressive overload is THE #1 principle of strength training
- Dashboard Period Comparison only shows current vs previous (too coarse)
- This shows week-by-week trends

---

## Tab 4: EXERCISES

### Feature 4.1: Exercise Progress Table
**Priority**: HIGH | **Effort**: HIGH | **Version**: MVP

**User Story**:
> As a user, I want to see all my exercises with their estimated 1RM, PRs, and progress trends, so I can identify which exercises are progressing and which are stalling.

**Acceptance Criteria**:
- [x] Table with columns:
  - Exercise name (sortable alphabetically)
  - Estimated 1RM (sortable, calculated via Epley formula)
  - Best PR (weight × reps)
  - Last performed (date)
  - Trend (↑ Progressing / → Stalled / ↓ Regressing)
  - Status badge (color-coded)
- [x] Default sort: Trend descending (stalling exercises first)
- [x] Filtering:
  - By status (All/Progressing/Stalled/Regressing)
  - Search by exercise name
- [x] Expandable rows: Clicking row shows mini progress chart (last 10 workouts)
- [x] Empty state: "No exercises tracked yet"
- [ ] By muscle group filtering - ⚠️ Minor enhancement
- [ ] Pagination: 20 exercises per page (if >20) - ⚠️ Not needed yet
- [ ] Export to CSV button (top right) - ⚠️ Future enhancement

**Status**: ✅ **COMPLETE** - Components:
- `/src/pages/analytics/components/exercises/ExerciseProgressTable.vue`
- `/src/pages/analytics/components/exercises/ExerciseProgressRow.vue`
- `/src/pages/analytics/components/exercises/ExerciseMiniChart.vue`

**Data Requirements**:
```javascript
// New computed in analyticsStore
exerciseProgressTable = computed(() => {
  const exerciseMap = new Map()

  workouts.value.forEach(workout => {
    workout.exercises.forEach(exercise => {
      const history = exerciseMap.get(exercise.name) || []
      history.push({
        date: workout.createdAt,
        sets: exercise.sets,
        bestSet: findBestSet(exercise.sets) // Highest weight × reps
      })
      exerciseMap.set(exercise.name, history)
    })
  })

  return Array.from(exerciseMap.entries()).map(([name, history]) => {
    const sorted = history.sort((a, b) => b.date - a.date)
    const lastPerformed = sorted[0]
    const estimated1RM = calculate1RM(lastPerformed.bestSet)
    const trend = calculateTrend(history) // Uses linear regression

    return {
      name,
      estimated1RM,
      bestPR: findBestPR(history),
      lastPerformed: lastPerformed.date,
      trend: trend.direction, // 'up', 'flat', 'down'
      trendPercentage: trend.percentage,
      status: getProgressStatus(trend),
      history: sorted.slice(0, 10) // Last 10 for chart
    }
  })
})
```

**1RM Calculation (Epley Formula)**:
```javascript
// src/utils/strengthUtils.js
export function calculate1RM(weight, reps) {
  if (reps === 1) return weight
  if (reps > 15) return null // Formula unreliable >15 reps
  return weight * (1 + reps / 30)
}

// Example:
calculate1RM(100, 5) // 116.67 kg (estimated 1RM)
calculate1RM(100, 1) // 100 kg (actual 1RM)
```

**Trend Calculation**:
```javascript
export function calculateTrend(history) {
  if (history.length < 4) return { direction: 'insufficient_data', percentage: 0 }

  const points = history.map((h, i) => ({
    x: i,
    y: calculate1RM(h.bestSet.weight, h.bestSet.reps)
  }))

  const regression = calculateLinearRegression(points)
  const percentageChange = (regression.slope / points[0].y) * 100

  return {
    direction: percentageChange > 2.5 ? 'up' : percentageChange < -2.5 ? 'down' : 'flat',
    percentage: percentageChange,
    r2: regression.r2 // Confidence indicator
  }
}
```

**Status Badge Logic**:
```javascript
function getProgressStatus(trend) {
  if (trend.direction === 'up') return { label: 'Progressing', color: 'green' }
  if (trend.direction === 'down') return { label: 'Regressing', color: 'red' }
  if (trend.direction === 'flat') return { label: 'Stalled', color: 'yellow' }
  return { label: 'New', color: 'gray' }
}
```

**i18n Keys**:
```json
{
  "analytics.exercises.table.columns.exercise": "Exercise",
  "analytics.exercises.table.columns.estimated1rm": "Est. 1RM",
  "analytics.exercises.table.columns.bestPR": "Best PR",
  "analytics.exercises.table.columns.lastPerformed": "Last Done",
  "analytics.exercises.table.columns.trend": "Trend",
  "analytics.exercises.table.status.progressing": "Progressing",
  "analytics.exercises.table.status.stalled": "Stalled",
  "analytics.exercises.table.status.regressing": "Regressing",
  "analytics.exercises.table.status.new": "New Exercise"
}
```

**Technical Notes**:
- Reuse Table components from shadcn-vue (Table, TableBody, TableCell, etc.)
- Mini chart: Use Sparkline component (lightweight)
- Export CSV: Use `downloadCSV` utility function
- Mobile: Hide "Last Performed" column, show only Exercise + 1RM + Status

---

### Feature 4.2: Exercise PR Timeline
**Priority**: MEDIUM | **Effort**: MEDIUM | **Version**: V1.1

**User Story**:
> As a user, I want to see a timeline of all my personal records, so I can celebrate my achievements and stay motivated.

**Acceptance Criteria**:
- [ ] Vertical timeline showing all PRs in chronological order (newest first)
- [ ] Each PR entry shows:
  - Date
  - Exercise name
  - PR type: 💪 Weight PR / 🔢 Rep PR / 🏆 Volume PR
  - Previous best → New best (with +% increase)
  - Celebration emoji or badge
- [ ] Filtering:
  - By PR type
  - By exercise
  - By date range
- [ ] Empty state: "No PRs yet. Keep training! 💪"
- [ ] Sharing: "Share your PR" button (generates image for social media)

**Status**: ⚠️ **90% COMPLETE** - Data ready (`allPRs` computed at line 1568), needs UI component (~2-3 days)

**Data Requirements**:
```javascript
// Extend exerciseProgressTable logic
function findAllPRs(exerciseHistory) {
  const prs = []
  let maxWeight = 0
  let maxReps = 0
  let maxVolume = 0

  exerciseHistory.forEach(workout => {
    workout.exercises.forEach(exercise => {
      const { weight, reps } = findBestSet(exercise.sets)
      const volume = calculateExerciseVolume(exercise)

      // Weight PR
      if (weight > maxWeight) {
        prs.push({
          date: workout.createdAt,
          exercise: exercise.name,
          type: 'weight',
          previous: maxWeight,
          new: weight,
          increase: ((weight - maxWeight) / maxWeight * 100) || 0
        })
        maxWeight = weight
      }

      // Rep PR (at same weight)
      if (weight === maxWeight && reps > maxReps) {
        prs.push({ type: 'rep', ... })
        maxReps = reps
      }

      // Volume PR
      if (volume > maxVolume) {
        prs.push({ type: 'volume', ... })
        maxVolume = volume
      }
    })
  })

  return prs.sort((a, b) => b.date - a.date)
}
```

**UI Component**:
```vue
<!-- PRTimeline.vue -->
<template>
  <div class="relative border-l-2 border-primary/20 pl-8">
    <div v-for="pr in prs" :key="pr.id" class="mb-8 relative">
      <div class="absolute -left-10 bg-primary rounded-full p-2">
        <Icon :name="prIcon(pr.type)" />
      </div>

      <div class="bg-card p-4 rounded-lg border">
        <div class="flex justify-between">
          <span class="font-semibold">{{ pr.exercise }}</span>
          <Badge :variant="prBadgeVariant(pr.type)">
            {{ t(`analytics.exercises.prTypes.${pr.type}`) }}
          </Badge>
        </div>

        <div class="mt-2 text-sm text-muted-foreground">
          {{ formatDate(pr.date) }}
        </div>

        <div class="mt-2 text-lg">
          <span class="text-muted-foreground">{{ pr.previous }} kg</span>
          <Icon name="arrow-right" class="inline mx-2" />
          <span class="font-bold text-primary">{{ pr.new }} kg</span>
          <span class="ml-2 text-green-500">+{{ pr.increase.toFixed(1) }}%</span>
        </div>

        <Button variant="ghost" size="sm" class="mt-2">
          <Icon name="share" /> Share PR
        </Button>
      </div>
    </div>
  </div>
</template>
```

**Celebration Features** (V1.2):
- Confetti animation on new PR (using canvas-confetti library)
- Push notification: "🎉 New PR! Bench Press: 120 kg"
- PR streak tracking: "5 PRs this month!"

---

### Feature 4.3: Exercise Strength Standards
**Priority**: LOW | **Effort**: HIGH | **Version**: Future (V2)

**User Story**:
> As a user, I want to see how my lifts compare to strength standards (beginner/intermediate/advanced), so I can gauge my progress objectively.

**Acceptance Criteria**:
- [ ] For each exercise, show strength standard classification:
  - Beginner
  - Novice
  - Intermediate
  - Advanced
  - Elite
- [ ] Based on bodyweight ratio (e.g., Bench Press 1.5x bodyweight = Intermediate)
- [ ] Progress bar showing current level and distance to next level
- [ ] Separate standards for male/female (if user provides gender)
- [ ] Standards for main compound lifts: Squat, Bench, Deadlift, OHP
- [ ] Disclaimer: "Standards are approximate. Focus on your own progress."

**Status**: ❌ **FUTURE (V2)** - Requires bodyweight tracking (not implemented)

**Data Requirements**:
```javascript
// src/constants/strengthStandards.js
export const STRENGTH_STANDARDS = {
  'bench-press': {
    male: {
      beginner: 0.5,    // x bodyweight
      novice: 0.75,
      intermediate: 1.25,
      advanced: 1.75,
      elite: 2.0
    },
    female: {
      beginner: 0.3,
      novice: 0.5,
      intermediate: 0.75,
      advanced: 1.0,
      elite: 1.25
    }
  },
  // ... other exercises
}
```

**Why Future**:
- Requires user bodyweight tracking (not currently implemented)
- Requires gender field (optional, sensitive)
- Lower priority than core progress tracking
- Risk of demotivation if user sees "beginner" label

---

## 4. Implementation Phases

### Phase 1: MVP (Sprint 1-2) - 3 weeks ✅ **COMPLETE**
**Goal**: Ship 5 core analytics features (1-2 per tab) to validate user engagement

**Features**:
1. ✅ **DONE** - Muscle Volume Over Time (Tab 1)
2. ✅ **DONE** - Workout Duration Trend (Tab 2)
3. ✅ **DONE** - Volume Heatmap (Tab 3)
4. ✅ **DONE** - Progressive Overload Tracker (Tab 3)
5. ✅ **DONE** - Exercise Progress Table (Tab 4)

**Success Metrics**:
- 40% of users visit Analytics page within 7 days
- Avg time on page >90 seconds
- Exercise Progress Table most interacted feature

**Technical Debt Accepted**:
- Duration breakdown uses estimated times (not real tracking)
- No export functionality yet
- No PR timeline yet

---

### Phase 2: V1.1 (Sprint 3-4) - 2 weeks ⚠️ **IN PROGRESS**
**Goal**: Add depth to each tab, improve UX based on MVP feedback

**Features**:
1. ❌ **TODO** - Muscle Balance Scorecard (Tab 1)
2. ❌ **BLOCKED** - Duration Breakdown (Tab 2) - Requires set-level timestamps
3. ❌ **TODO** - Volume by Exercise Type (Tab 3) - Requires exercise `type` field
4. ⚠️ **90% DONE** - Exercise PR Timeline (Tab 4) - Data ready, needs UI (~2-3 days)

**Improvements**:
- Add export to CSV for all tables
- Add period selector to all charts
- Mobile UX polish (responsive charts)
- Loading states and error handling
- Empty state illustrations

**Success Metrics**:
- Retention: 60% of MVP users return to Analytics
- Feature adoption: 30% use Muscle Balance, 50% use PR Timeline

---

### Phase 3: V1.2 (Sprint 5) - 1 week ❌ **NOT STARTED**
**Goal**: Add smart recommendations and efficiency features

**Features**:
1. ❌ **TODO** - Efficiency Score & Recommendations (Tab 2) - Needs `recommendationUtils.js`
2. ❌ **TODO** - PR Celebration Animations (Tab 4)
3. ❌ **TODO** - Real-time set duration tracking (foundation for better Duration analytics)

**Technical Improvements**:
- Add set-level timestamps to workout data model
- Implement recommendation engine
- Add unit tests for 1RM calculations and trend algorithms

---

### Phase 4: V2 (Future) - 3+ months
**Goal**: Advanced features based on user requests and analytics trends

**Potential Features**:
1. 🔮 Muscle Fatigue Indicator
2. 🔮 Exercise Strength Standards
3. 🔮 Social sharing of analytics
4. 🔮 Custom analytics (user-defined metrics)
5. 🔮 AI workout recommendations based on analytics
6. 🔮 Community benchmarking (compare to similar users)

**Prerequisites**:
- Large user base for benchmarking
- User bodyweight tracking
- Enhanced data collection (sleep, nutrition if integrated)

---

## 5. Technical Implementation

### 5.1 New Computed Properties in analyticsStore

```javascript
// src/stores/analyticsStore.js

export const useAnalyticsStore = defineStore('analytics', () => {
  // ... existing state and getters

  // TAB 1: MUSCLES
  const muscleVolumeOverTime = computed(() => {
    if (!workouts.value.length) return []

    const weeklyData = new Map()

    workouts.value.forEach(workout => {
      const weekStart = startOfWeek(workout.createdAt)
      const weekKey = formatDate(weekStart, 'YYYY-MM-DD')

      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, {
          week: formatDate(weekStart, 'MMM D'),
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

    return Array.from(weeklyData.values()).sort((a, b) => a.weekStart - b.weekStart)
  })

  // TAB 2: DURATION
  const durationTrendData = computed(() => {
    return workouts.value
      .map(w => ({
        date: w.createdAt,
        duration: w.duration || 0,
        volume: calculateTotalVolume(w),
        exerciseCount: w.exercises.length
      }))
      .sort((a, b) => a.date - b.date)
  })

  const avgWorkoutDuration = computed(() => {
    if (!workouts.value.length) return 0
    const totalDuration = workouts.value.reduce((sum, w) => sum + (w.duration || 0), 0)
    return Math.round(totalDuration / workouts.value.length)
  })

  // TAB 3: VOLUME
  const dailyVolumeMap = computed(() => {
    const map = {}
    workouts.value.forEach(w => {
      const date = formatDate(w.createdAt, 'YYYY-MM-DD')
      map[date] = (map[date] || 0) + calculateTotalVolume(w)
    })
    return map
  })

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

      return {
        ...week,
        change,
        status: change >= 2.5 ? 'progressing' : change <= -2.5 ? 'regressing' : 'maintaining'
      }
    })
  })

  // TAB 4: EXERCISES
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
      const estimated1RM = calculate1RM(recent.bestSet.weight, recent.bestSet.reps)
      const trend = calculateTrend(sorted)
      const bestPR = findBestPR(history)

      return {
        name,
        estimated1RM,
        bestPR,
        lastPerformed: recent.date,
        trend: trend.direction,
        trendPercentage: trend.percentage,
        status: getProgressStatus(trend),
        history: sorted.slice(0, 10)
      }
    })
  })

  const allPRs = computed(() => {
    const prs = []

    // Similar to exerciseProgressTable but tracks PRs
    // Implementation details in Feature 4.2 section

    return prs.sort((a, b) => b.date - a.date)
  })

  return {
    // ... existing exports
    muscleVolumeOverTime,
    durationTrendData,
    avgWorkoutDuration,
    dailyVolumeMap,
    weeklyVolumeProgression,
    exerciseProgressTable,
    allPRs
  }
})
```

### 5.2 New Utility Files

#### src/utils/statsUtils.js ✅ **IMPLEMENTED**
```javascript
/**
 * Statistical utilities for analytics calculations
 */

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

  // R-squared (coefficient of determination)
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
  return (index / sorted.length) * 100
}
```

#### src/utils/strengthUtils.js ✅ **IMPLEMENTED**
```javascript
import { STRENGTH_STANDARDS } from '@/constants/strengthStandards'

/**
 * Calculates estimated 1 Rep Max using Epley formula
 * @param {number} weight - Weight lifted
 * @param {number} reps - Repetitions performed
 * @returns {number|null} Estimated 1RM or null if reps > 15
 */
export function calculate1RM(weight, reps) {
  if (reps === 1) return weight
  if (reps > 15) return null // Formula unreliable beyond 15 reps

  // Epley formula: 1RM = weight × (1 + reps/30)
  return weight * (1 + reps / 30)
}

/**
 * Finds the best set (highest weight × reps product)
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
    confidence: regression.r2 // 0-1, higher = more confident
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
 * Finds best PR from exercise history
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
 * Gets strength standard classification
 */
export function getStrengthStandard(exerciseId, weight, bodyweight, gender = 'male') {
  const standards = STRENGTH_STANDARDS[exerciseId]
  if (!standards || !bodyweight) return null

  const ratio = weight / bodyweight
  const levels = standards[gender]

  if (ratio >= levels.elite) return 'elite'
  if (ratio >= levels.advanced) return 'advanced'
  if (ratio >= levels.intermediate) return 'intermediate'
  if (ratio >= levels.novice) return 'novice'
  return 'beginner'
}
```

#### src/utils/recommendationUtils.js ❌ **NOT IMPLEMENTED**
```javascript
import { ANALYTICS_CONFIG } from '@/constants/config'

/**
 * Generates efficiency recommendations
 */
export function generateEfficiencyRecommendations(workouts) {
  const recommendations = []

  // Analyze average rest time
  const avgRestTime = estimateAvgRestTime(workouts)
  if (avgRestTime > 90) {
    const timeSaved = (avgRestTime - 90) * estimateTotalSets(workouts) / 60
    recommendations.push({
      type: 'rest_time',
      priority: 'high',
      impact: timeSaved,
      title: 'Reduce rest time between sets',
      description: `Your average rest time is ${avgRestTime}s. Reducing to 90s could save ${Math.round(timeSaved)} min per workout.`,
      action: 'Update rest timer in settings'
    })
  }

  // Analyze workout duration vs volume
  const efficiency = calculateEfficiency(workouts)
  if (efficiency.score < 50) {
    recommendations.push({
      type: 'duration',
      priority: 'medium',
      impact: 15,
      title: 'Improve workout efficiency',
      description: `Your efficiency score is ${efficiency.score}/100. Consider supersetting exercises or reducing transition time.`,
      action: 'Learn about supersets'
    })
  }

  // Analyze exercise selection
  const inefficientExercises = findInefficientExercises(workouts)
  if (inefficientExercises.length > 0) {
    recommendations.push({
      type: 'exercise_selection',
      priority: 'low',
      impact: 10,
      title: 'Optimize exercise selection',
      description: `${inefficientExercises[0]} takes long with low volume. Consider alternatives.`,
      action: 'Browse exercise library'
    })
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })
}

function estimateAvgRestTime(workouts) {
  // Estimate based on workout duration and sets
  // Assumes 45s per set working time
  const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0)
  const totalSets = workouts.reduce((sum, w) =>
    sum + w.exercises.reduce((s, e) => s + e.sets.length, 0), 0)

  if (totalSets === 0) return 90 // default

  const workingTime = totalSets * 45 / 60 // minutes
  const restTime = (totalDuration - workingTime) / totalSets * 60 // seconds per set

  return Math.max(0, Math.round(restTime))
}

function estimateTotalSets(workouts) {
  return workouts.reduce((sum, w) =>
    sum + w.exercises.reduce((s, e) => s + e.sets.length, 0), 0)
}

function calculateEfficiency(workouts) {
  const totalVolume = workouts.reduce((sum, w) =>
    sum + calculateTotalVolume(w), 0)
  const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0)

  if (totalDuration === 0) return { score: 0, grade: 'F' }

  const kgPerMin = totalVolume / totalDuration
  const { GRADE_THRESHOLDS } = ANALYTICS_CONFIG.efficiency

  let grade = 'F'
  if (kgPerMin >= GRADE_THRESHOLDS.A) grade = 'A'
  else if (kgPerMin >= GRADE_THRESHOLDS.B) grade = 'B'
  else if (kgPerMin >= GRADE_THRESHOLDS.C) grade = 'C'
  else if (kgPerMin >= GRADE_THRESHOLDS.D) grade = 'D'

  return {
    score: Math.round(kgPerMin),
    grade,
    kgPerMin
  }
}

function findInefficientExercises(workouts) {
  // Placeholder - needs more sophisticated logic
  return []
}
```

### 5.3 New Components

```
src/pages/analytics/
├── AnalyticsView.vue                    # Main analytics page with tabs
├── components/
│   ├── muscles/
│   │   ├── MuscleVolumeChart.vue        # Line chart (Feature 1.1)
│   │   ├── MuscleBalanceTable.vue       # Balance scorecard (Feature 1.2)
│   │   └── MuscleFatigueHeatmap.vue     # Future (Feature 1.3)
│   ├── duration/
│   │   ├── DurationTrendChart.vue       # Scatter + line (Feature 2.1)
│   │   ├── DurationBreakdown.vue        # Stacked bar (Feature 2.2)
│   │   └── EfficiencyScoreCard.vue      # Score + recommendations (Feature 2.3)
│   ├── volume/
│   │   ├── VolumeHeatmap.vue            # Reuse FrequencyChart (Feature 3.1)
│   │   ├── VolumeByTypeChart.vue        # Donut chart (Feature 3.2)
│   │   └── ProgressiveOverloadChart.vue # Bar chart (Feature 3.3)
│   └── exercises/
│       ├── ExerciseProgressTable.vue    # Main table (Feature 4.1)
│       ├── ExerciseProgressRow.vue      # Expandable row component
│       ├── PRTimeline.vue               # Timeline (Feature 4.2)
│       └── StrengthStandardsCard.vue    # Future (Feature 4.3)
```

### 5.4 Config Updates

```javascript
// src/constants/config.js

export const ANALYTICS_CONFIG = {
  muscleBalance: {
    EXPECTED_DISTRIBUTION: {
      legs: 25,      // Largest muscle group
      back: 20,      // Pull dominance
      chest: 18,     // Push
      shoulders: 12, // Supporting
      biceps: 8,
      triceps: 8,
      core: 6,
      calves: 3
    },
    TOLERANCE: 10 // ±10% acceptable variance
  },

  efficiency: {
    GRADE_THRESHOLDS: {
      A: 100, // kg/min
      B: 75,
      C: 50,
      D: 25,
      F: 0
    }
  },

  progressiveOverload: {
    TARGET_WEEKLY_INCREASE: 2.5, // %
    STALL_THRESHOLD: 2.5, // %
    REGRESSION_THRESHOLD: -2.5, // %
    MIN_WEEKS_FOR_TREND: 4
  },

  charts: {
    MAX_DATA_POINTS: 52, // Weekly aggregation for 1 year
    MOBILE_BREAKPOINT: 768,
    COLORS: {
      progressing: '#10b981', // green-500
      maintaining: '#f59e0b', // amber-500
      regressing: '#ef4444'   // red-500
    }
  }
}
```

### 5.5 i18n Updates

```json
// src/i18n/locales/en/analytics.json
{
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
      "legend": "Toggle muscle groups",
      "tooltip": "{date}: {volume} kg ({percentage}% of total)",
      "emptyState": "No workout data for selected period"
    },
    "balanceTable": {
      "title": "Muscle Balance Scorecard",
      "description": "How balanced is your training?",
      "columns": {
        "muscleGroup": "Muscle Group",
        "current": "Current %",
        "ideal": "Ideal %",
        "status": "Status",
        "difference": "Difference"
      },
      "status": {
        "balanced": "Balanced",
        "underTrained": "Under-trained",
        "overTrained": "Over-trained"
      },
      "recommendation": "Consider adding {count} more {muscle} exercises per week"
    }
  },

  "duration": {
    "trendChart": {
      "title": "Workout Duration Trend",
      "description": "How long are your workouts?",
      "stats": {
        "average": "Average",
        "shortest": "Shortest",
        "longest": "Longest",
        "trend": "Trend"
      },
      "tooltip": "{date}: {duration} min, {volume} kg, {exercises} exercises"
    },
    "breakdown": {
      "title": "Duration Breakdown",
      "description": "Which exercises take the most time?",
      "sortBy": "Sort by",
      "sortOptions": {
        "time": "Total time",
        "efficiency": "Efficiency"
      },
      "efficiency": "{value} kg/min"
    },
    "efficiencyScore": {
      "title": "Efficiency Score",
      "description": "How efficient are your workouts?",
      "score": "{score}/100",
      "grade": "Grade: {grade}",
      "recommendations": "Recommendations",
      "impact": "Save ~{minutes} min/week"
    }
  },

  "volume": {
    "heatmap": {
      "title": "Volume Heatmap",
      "description": "Daily training volume intensity",
      "tooltip": "{date}: {volume} kg, {workouts} workouts, Top: {topExercise}",
      "legend": {
        "less": "Less",
        "more": "More"
      }
    },
    "byType": {
      "title": "Volume by Exercise Type",
      "description": "How is your volume distributed?",
      "types": {
        "strength": "Strength",
        "cardio": "Cardio",
        "flexibility": "Flexibility",
        "other": "Other"
      }
    },
    "progressiveOverload": {
      "title": "Progressive Overload Tracker",
      "description": "Are you increasing volume week-by-week?",
      "stats": {
        "weeksProgressing": "Weeks progressing",
        "avgIncrease": "Avg weekly increase",
        "status": "Status",
        "nextTarget": "Next week target"
      },
      "statusLabels": {
        "onTrack": "On track for progressive overload",
        "maintaining": "Maintaining current volume",
        "regressing": "Volume decreasing"
      },
      "changeLabel": "{change}%"
    }
  },

  "exercises": {
    "progressTable": {
      "title": "Exercise Progress",
      "description": "Track your strength gains",
      "columns": {
        "exercise": "Exercise",
        "estimated1rm": "Est. 1RM",
        "bestPR": "Best PR",
        "lastPerformed": "Last Done",
        "trend": "Trend",
        "status": "Status"
      },
      "status": {
        "progressing": "Progressing",
        "stalled": "Stalled",
        "regressing": "Regressing",
        "new": "New Exercise",
        "insufficientData": "Need more data"
      },
      "filters": {
        "all": "All exercises",
        "progressing": "Progressing only",
        "stalled": "Stalled only",
        "search": "Search exercises..."
      },
      "export": "Export to CSV",
      "emptyState": "No exercises tracked yet"
    },
    "prTimeline": {
      "title": "Personal Records Timeline",
      "description": "Celebrate your achievements",
      "prTypes": {
        "weight": "Weight PR",
        "rep": "Rep PR",
        "volume": "Volume PR"
      },
      "previous": "Previous",
      "new": "New",
      "share": "Share PR",
      "emptyState": "No PRs yet. Keep training! 💪"
    },
    "strengthStandards": {
      "title": "Strength Standards",
      "description": "How do you compare?",
      "levels": {
        "beginner": "Beginner",
        "novice": "Novice",
        "intermediate": "Intermediate",
        "advanced": "Advanced",
        "elite": "Elite"
      },
      "disclaimer": "Standards are approximate. Focus on your own progress.",
      "nextLevel": "Next level: {weight} kg"
    }
  },

  "periodSelector": {
    "last7days": "Last 7 days",
    "last30days": "Last 30 days",
    "last90days": "Last 90 days",
    "allTime": "All time",
    "custom": "Custom range"
  },

  "emptyStates": {
    "noData": "No data available for selected period",
    "noWorkouts": "Start tracking workouts to see analytics",
    "comingSoon": "Analytics and charts coming soon..."
  }
}
```

```json
// src/i18n/locales/uk/analytics.json
{
  "title": "Аналітика",
  "tabs": {
    "muscles": "М'язи",
    "duration": "Тривалість",
    "volume": "Об'єм",
    "exercises": "Вправи"
  },

  "muscles": {
    "volumeOverTime": {
      "title": "Об'єм тренувань по м'язах",
      "description": "Об'єм тренувань по групах м'язів з часом",
      "legend": "Перемикати групи м'язів",
      "tooltip": "{date}: {volume} кг ({percentage}% від загального)",
      "emptyState": "Немає даних тренувань за вибраний період"
    },
    "balanceTable": {
      "title": "Баланс м'язових груп",
      "description": "Наскільки збалансовані ваші тренування?",
      "columns": {
        "muscleGroup": "Група м'язів",
        "current": "Поточний %",
        "ideal": "Ідеальний %",
        "status": "Статус",
        "difference": "Різниця"
      },
      "status": {
        "balanced": "Збалансовано",
        "underTrained": "Недотреновано",
        "overTrained": "Перетреновано"
      },
      "recommendation": "Розгляньте додавання {count} вправ на {muscle} на тиждень"
    }
  },

  "duration": {
    "trendChart": {
      "title": "Тривалість тренувань",
      "description": "Скільки часу тривають ваші тренування?",
      "stats": {
        "average": "Середня",
        "shortest": "Найкоротша",
        "longest": "Найдовша",
        "trend": "Тренд"
      },
      "tooltip": "{date}: {duration} хв, {volume} кг, {exercises} вправ"
    },
    "breakdown": {
      "title": "Розподіл тривалості",
      "description": "Які вправи займають найбільше часу?",
      "sortBy": "Сортувати за",
      "sortOptions": {
        "time": "Загальний час",
        "efficiency": "Ефективність"
      },
      "efficiency": "{value} кг/хв"
    },
    "efficiencyScore": {
      "title": "Оцінка ефективності",
      "description": "Наскільки ефективні ваші тренування?",
      "score": "{score}/100",
      "grade": "Оцінка: {grade}",
      "recommendations": "Рекомендації",
      "impact": "Заощаджуйте ~{minutes} хв/тиждень"
    }
  },

  "volume": {
    "heatmap": {
      "title": "Теплова карта об'єму",
      "description": "Інтенсивність щоденного об'єму тренувань",
      "tooltip": "{date}: {volume} кг, {workouts} тренувань, Топ: {topExercise}",
      "legend": {
        "less": "Менше",
        "more": "Більше"
      }
    },
    "byType": {
      "title": "Об'єм за типом вправ",
      "description": "Як розподілений ваш об'єм?",
      "types": {
        "strength": "Силові",
        "cardio": "Кардіо",
        "flexibility": "Гнучкість",
        "other": "Інше"
      }
    },
    "progressiveOverload": {
      "title": "Прогресивне навантаження",
      "description": "Чи збільшуєте ви об'єм тиждень за тижнем?",
      "stats": {
        "weeksProgressing": "Тижнів прогресу",
        "avgIncrease": "Середнє збільшення",
        "status": "Статус",
        "nextTarget": "Ціль на наступний тиждень"
      },
      "statusLabels": {
        "onTrack": "На шляху до прогресу",
        "maintaining": "Підтримка поточного об'єму",
        "regressing": "Об'єм зменшується"
      },
      "changeLabel": "{change}%"
    }
  },

  "exercises": {
    "progressTable": {
      "title": "Прогрес вправ",
      "description": "Відстежуйте свої силові досягнення",
      "columns": {
        "exercise": "Вправа",
        "estimated1rm": "Розрах. 1ПМ",
        "bestPR": "Кращий результат",
        "lastPerformed": "Останнє виконання",
        "trend": "Тренд",
        "status": "Статус"
      },
      "status": {
        "progressing": "Прогресує",
        "stalled": "Застій",
        "regressing": "Регрес",
        "new": "Нова вправа",
        "insufficientData": "Потрібно більше даних"
      },
      "filters": {
        "all": "Всі вправи",
        "progressing": "Тільки з прогресом",
        "stalled": "Тільки застій",
        "search": "Пошук вправ..."
      },
      "export": "Експорт у CSV",
      "emptyState": "Ще немає відстежуваних вправ"
    },
    "prTimeline": {
      "title": "Хронологія особистих рекордів",
      "description": "Святкуйте свої досягнення",
      "prTypes": {
        "weight": "Рекорд ваги",
        "rep": "Рекорд повторень",
        "volume": "Рекорд об'єму"
      },
      "previous": "Попередній",
      "new": "Новий",
      "share": "Поділитися рекордом",
      "emptyState": "Поки немає рекордів. Продовжуйте тренуватися! 💪"
    },
    "strengthStandards": {
      "title": "Стандарти сили",
      "description": "Як ви порівнюєтесь?",
      "levels": {
        "beginner": "Початківець",
        "novice": "Новачок",
        "intermediate": "Середній",
        "advanced": "Просунутий",
        "elite": "Еліта"
      },
      "disclaimer": "Стандарти приблизні. Зосередьтесь на власному прогресі.",
      "nextLevel": "Наступний рівень: {weight} кг"
    }
  },

  "periodSelector": {
    "last7days": "Останні 7 днів",
    "last30days": "Останні 30 днів",
    "last90days": "Останні 90 днів",
    "allTime": "Весь час",
    "custom": "Власний діапазон"
  },

  "emptyStates": {
    "noData": "Немає даних за вибраний період",
    "noWorkouts": "Почніть відстежувати тренування для перегляду аналітики",
    "comingSoon": "Аналітика та графіки скоро з'являться..."
  }
}
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

**Priority: HIGH** - Test calculations and utilities

```javascript
// src/utils/__tests__/strengthUtils.spec.js
import { describe, it, expect } from 'vitest'
import { calculate1RM, calculateTrend, findBestSet } from '../strengthUtils'

describe('strengthUtils', () => {
  describe('calculate1RM', () => {
    it('should return weight for 1 rep', () => {
      expect(calculate1RM(100, 1)).toBe(100)
    })

    it('should calculate 1RM using Epley formula', () => {
      expect(calculate1RM(100, 5)).toBeCloseTo(116.67, 1)
      expect(calculate1RM(80, 10)).toBeCloseTo(106.67, 1)
    })

    it('should return null for >15 reps', () => {
      expect(calculate1RM(50, 20)).toBeNull()
    })
  })

  describe('calculateTrend', () => {
    it('should return insufficient_data for <4 workouts', () => {
      const history = [
        { bestSet: { weight: 100, reps: 5 } },
        { bestSet: { weight: 102, reps: 5 } }
      ]

      const trend = calculateTrend(history)
      expect(trend.direction).toBe('insufficient_data')
    })

    it('should detect progressing trend', () => {
      const history = [
        { bestSet: { weight: 100, reps: 5 } },
        { bestSet: { weight: 105, reps: 5 } },
        { bestSet: { weight: 110, reps: 5 } },
        { bestSet: { weight: 115, reps: 5 } }
      ]

      const trend = calculateTrend(history)
      expect(trend.direction).toBe('up')
      expect(trend.percentage).toBeGreaterThan(2.5)
    })

    it('should detect stalled trend', () => {
      const history = Array(5).fill({ bestSet: { weight: 100, reps: 5 } })

      const trend = calculateTrend(history)
      expect(trend.direction).toBe('flat')
    })
  })

  describe('findBestSet', () => {
    it('should find set with highest weight × reps', () => {
      const sets = [
        { weight: 100, reps: 5 },  // 500
        { weight: 80, reps: 10 },  // 800 ← best
        { weight: 120, reps: 3 }   // 360
      ]

      const best = findBestSet(sets)
      expect(best).toEqual({ weight: 80, reps: 10 })
    })
  })
})
```

```javascript
// src/utils/__tests__/statsUtils.spec.js
import { describe, it, expect } from 'vitest'
import { calculateLinearRegression, calculateStandardDeviation } from '../statsUtils'

describe('statsUtils', () => {
  describe('calculateLinearRegression', () => {
    it('should calculate correct slope and intercept', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 1, y: 2 },
        { x: 2, y: 4 },
        { x: 3, y: 6 }
      ]

      const result = calculateLinearRegression(points)
      expect(result.slope).toBeCloseTo(2, 1)
      expect(result.intercept).toBeCloseTo(0, 1)
      expect(result.r2).toBeCloseTo(1, 1) // Perfect fit
    })

    it('should handle noisy data', () => {
      const points = [
        { x: 0, y: 1 },
        { x: 1, y: 3 },
        { x: 2, y: 5 },
        { x: 3, y: 6 }
      ]

      const result = calculateLinearRegression(points)
      expect(result.slope).toBeGreaterThan(0)
      expect(result.r2).toBeLessThan(1)
      expect(result.r2).toBeGreaterThan(0.8)
    })
  })

  describe('calculateStandardDeviation', () => {
    it('should calculate std dev correctly', () => {
      const values = [2, 4, 4, 4, 5, 5, 7, 9]
      const stdDev = calculateStandardDeviation(values)
      expect(stdDev).toBeCloseTo(2, 1)
    })
  })
})
```

### 6.2 Store Tests

```javascript
// src/stores/__tests__/analyticsStore.spec.js (extended)
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAnalyticsStore } from '../analyticsStore'
import { useWorkoutStore } from '../workoutStore'

// Mock Firebase
vi.mock('@/firebase/firestore', () => ({
  fetchCollection: vi.fn(),
  subscribeToCollection: vi.fn()
}))

describe('analyticsStore - New Analytics Features', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('muscleVolumeOverTime', () => {
    it('should aggregate volume by muscle group per week', () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      // Mock workouts
      workoutStore.workouts = [
        {
          createdAt: new Date('2024-01-01'),
          exercises: [
            {
              name: 'Bench Press',
              sets: [{ weight: 100, reps: 10 }]
            }
          ]
        },
        {
          createdAt: new Date('2024-01-03'),
          exercises: [
            {
              name: 'Bench Press',
              sets: [{ weight: 105, reps: 10 }]
            }
          ]
        }
      ]

      const result = analyticsStore.muscleVolumeOverTime

      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('week')
      expect(result[0]).toHaveProperty('chest')
      expect(result[0].chest).toBeGreaterThan(0)
    })
  })

  describe('weeklyVolumeProgression', () => {
    it('should calculate week-by-week changes', () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      workoutStore.workouts = [
        // Week 1
        {
          createdAt: new Date('2024-01-01'),
          exercises: [{ name: 'Squat', sets: [{ weight: 100, reps: 10 }] }]
        },
        // Week 2 (volume increase)
        {
          createdAt: new Date('2024-01-08'),
          exercises: [{ name: 'Squat', sets: [{ weight: 110, reps: 10 }] }]
        }
      ]

      const result = analyticsStore.weeklyVolumeProgression

      expect(result.length).toBe(2)
      expect(result[1].status).toBe('progressing')
      expect(result[1].change).toBeGreaterThan(0)
    })
  })

  describe('exerciseProgressTable', () => {
    it('should calculate 1RM and trends for exercises', () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      workoutStore.workouts = [
        {
          createdAt: new Date('2024-01-01'),
          exercises: [{ name: 'Deadlift', sets: [{ weight: 100, reps: 5 }] }]
        },
        {
          createdAt: new Date('2024-01-08'),
          exercises: [{ name: 'Deadlift', sets: [{ weight: 105, reps: 5 }] }]
        },
        {
          createdAt: new Date('2024-01-15'),
          exercises: [{ name: 'Deadlift', sets: [{ weight: 110, reps: 5 }] }]
        },
        {
          createdAt: new Date('2024-01-22'),
          exercises: [{ name: 'Deadlift', sets: [{ weight: 115, reps: 5 }] }]
        }
      ]

      const result = analyticsStore.exerciseProgressTable

      expect(result.length).toBe(1)
      expect(result[0].name).toBe('Deadlift')
      expect(result[0].estimated1RM).toBeGreaterThan(115)
      expect(result[0].trend).toBe('up')
      expect(result[0].status.label).toBe('Progressing')
    })
  })
})
```

### 6.3 Component Tests

```javascript
// src/pages/analytics/components/__tests__/ExerciseProgressTable.spec.js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import ExerciseProgressTable from '../exercises/ExerciseProgressTable.vue'

describe('ExerciseProgressTable', () => {
  it('should render exercise rows', () => {
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
                    bestPR: { weight: 100, reps: 5, date: new Date() },
                    lastPerformed: new Date(),
                    trend: 'up',
                    trendPercentage: 5,
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
    expect(wrapper.text()).toContain('Progressing')
  })

  it('should show empty state when no exercises', () => {
    const wrapper = mount(ExerciseProgressTable, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              analytics: { exerciseProgressTable: [] }
            }
          })
        ]
      }
    })

    expect(wrapper.text()).toContain('No exercises tracked yet')
  })
})
```

---

## 7. Performance Considerations

### 7.1 Data Aggregation

**Challenge**: Large datasets (100+ workouts with 500+ exercises) can slow down computed properties.

**Solutions**:
1. **Weekly aggregation** for time-series data (max 52 points for 1 year)
2. **Memoization** of expensive calculations (1RM, linear regression)
3. **Lazy loading** of chart components (Vue's `defineAsyncComponent`)
4. **Virtualization** for long tables (>50 exercises)

```javascript
// Example: Memoized 1RM calculation
const e1rmCache = new Map()

function calculate1RMMemoized(weight, reps) {
  const key = `${weight}-${reps}`
  if (e1rmCache.has(key)) return e1rmCache.get(key)

  const result = calculate1RM(weight, reps)
  e1rmCache.set(key, result)
  return result
}
```

### 7.2 Chart Rendering

**Recommendations**:
- Use **Recharts** (already familiar from Dashboard) for consistency
- Implement **responsive** prop to hide less critical data on mobile
- Add **loading skeletons** during data computation
- Debounce period selector changes (500ms)

### 7.3 Mobile Optimization

- Hide less critical columns on mobile (e.g., "Last Performed")
- Use horizontal scroll for wide tables
- Simplify charts (e.g., show trend line only, hide individual points)
- Implement "Show More" pagination (20 items per page)

---

## 8. Success Metrics & KPIs

### 8.1 Adoption Metrics

**Primary**:
- **Analytics page visits**: Target 60% of active users within 30 days of launch
- **Return visits**: Target 40% of visitors return within 7 days
- **Time on page**: Target >2 minutes average (indicates engagement)

**Secondary**:
- **Tab popularity**: Which tab gets most clicks?
- **Period selector usage**: Do users explore different time ranges?
- **Export usage**: Do users export data?

### 8.2 Feature-Specific Metrics

**Exercise Progress Table**:
- % of users who expand rows (indicates detail interest)
- % of users who sort/filter (indicates active analysis)

**Progressive Overload Chart**:
- % of users in "progressing" vs "stalled" status
- Avg weeks progressing per user (health indicator)

**PR Timeline**:
- Avg PRs per user per month (gamification metric)
- Share button clicks (social validation)

### 8.3 Behavior Change Metrics

**Ultimate Goal**: Does Analytics lead to better training outcomes?

- **Training consistency**: Do Analytics users have higher workout frequency?
- **Progressive overload adherence**: Do users increase volume after seeing "stalled" status?
- **Muscle balance**: Do users add under-trained muscle groups after seeing scorecard?

**Instrumentation**:
```javascript
// Example analytics event
trackEvent('analytics_feature_viewed', {
  feature: 'exercise_progress_table',
  tab: 'exercises',
  period: 'last_30_days'
})

trackEvent('analytics_action_taken', {
  action: 'sorted_by_stalled',
  result: 'user_started_workout_with_stalled_exercise'
})
```

---

## 9. Risk Mitigation

### 9.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Chart performance** with >365 data points | Medium | High | Weekly aggregation, max 52 points per year |
| **Inaccurate 1RM** calculations | High | Medium | Show disclaimer, cap at 15 reps, allow manual override |
| **Missing duration data** for old workouts | High | Low | Estimate using avg duration, show "estimated" badge |
| **Browser compatibility** (Safari date issues) | Low | Medium | Use date-fns for all date operations |

### 9.2 Product Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Users overwhelmed** by too many charts | Medium | High | Progressive disclosure: MVP → V1.1 → V1.2 |
| **Analytics don't drive behavior change** | Medium | High | Add actionable recommendations, not just data |
| **Users prefer simpler Dashboard** | Low | Medium | Keep Dashboard as default, Analytics as power feature |
| **1RM/strength standards demotivate beginners** | Medium | Medium | Emphasize personal progress over standards, hide standards by default |

### 9.3 Data Privacy Risks

| Risk | Mitigation |
|------|------------|
| **Sensitive PR data** (might reveal physical capabilities) | All data stored in user's Firestore, never shared publicly |
| **Bodyweight data** (if added for strength standards) | Optional field, clearly marked as private |
| **Community benchmarking** (if added) | Opt-in only, anonymized aggregates |

---

## 10. Future Enhancements (V3+)

### 10.1 AI-Powered Insights

**Concept**: Use simple ML models to provide predictive analytics

Examples:
- "Based on your trend, you'll hit 100kg bench press by March 15"
- "Your squat is progressing faster than your deadlift. Consider balancing."
- "You train chest 2x/week but back 1x/week. Risk of imbalance."

**Tech**: Client-side TensorFlow.js for simple linear predictions

### 10.2 Social Features

**Leaderboards**:
- Top PRs in your gym (if group feature added)
- Community strength standards (opt-in)

**Challenges**:
- "Complete 50 PRs this quarter"
- "Achieve 90% balanced training"

### 10.3 Integration with Wearables

**Concept**: Import data from Apple Health / Google Fit

Benefits:
- Accurate workout duration (auto-tracked)
- Heart rate data for volume load calculations
- Sleep/recovery data for fatigue analysis

**Priority**: Low (requires significant integration work)

### 10.4 Export & Reporting

**PDF Reports**:
- Monthly analytics summary with charts
- Progress report to share with coach

**API Access**:
- Allow users to export raw data via JSON API
- Enable third-party integrations (Excel, Google Sheets)

---

## 11. Rollout Plan

### Phase 0: Pre-Launch (1 week before MVP)
- [ ] Create `ANALYTICS_PRD.md` (this document)
- [ ] Review with team/stakeholders
- [ ] Update project board with MVP tasks
- [ ] Create technical design document (if needed)

### Phase 1: MVP Development (Sprint 1-2, 3 weeks)
- [ ] Week 1: Setup analytics route, tabs, period selector
- [ ] Week 1: Implement muscleVolumeOverTime computed
- [ ] Week 1: Build MuscleVolumeChart component
- [ ] Week 2: Implement weeklyVolumeProgression computed
- [ ] Week 2: Build ProgressiveOverloadChart component
- [ ] Week 2: Build VolumeHeatmap (reuse FrequencyChart)
- [ ] Week 2: Implement durationTrendData computed
- [ ] Week 2: Build DurationTrendChart component
- [ ] Week 3: Implement exerciseProgressTable computed
- [ ] Week 3: Build ExerciseProgressTable component
- [ ] Week 3: Add all i18n keys (en + uk)
- [ ] Week 3: Write unit tests for utils
- [ ] Week 3: QA testing + bug fixes

### Phase 2: MVP Launch (1 day)
- [ ] Deploy to production
- [ ] Monitor error logs
- [ ] Track adoption metrics (Analytics page visits)
- [ ] Collect user feedback

### Phase 3: Post-Launch Monitoring (1 week)
- [ ] Daily check of success metrics
- [ ] Fix critical bugs
- [ ] Gather feature requests
- [ ] Plan V1.1 features based on feedback

### Phase 4: V1.1 Development (Sprint 3-4, 2 weeks)
- [ ] Based on MVP learnings and user feedback
- [ ] See Phase 2 in Implementation Phases section

---

## 12. Open Questions

1. **Bodyweight tracking**: Do we add this feature now or later? (Needed for strength standards)
   - **Recommendation**: Later (V2). Focus on relative progress first.

2. **Set duration tracking**: Should we start tracking timestamps for each set?
   - **Recommendation**: Add in V1.2. Estimate for MVP, track going forward.

3. **Exercise type taxonomy**: How do we classify exercises (strength/cardio/flexibility)?
   - **Recommendation**: Add `type` field to exercise library, default to 'strength' for existing.

4. **Community features**: Do we want public leaderboards or keep everything private?
   - **Recommendation**: Private for MVP/V1, opt-in community features in V2.

5. **Chart library**: Recharts vs Chart.js vs D3?
   - **Recommendation**: Recharts (already used in Dashboard, React-based but works in Vue).

6. **Mobile-first vs Desktop-first**: Which experience to prioritize?
   - **Recommendation**: Mobile-first for quick stats, Desktop for detailed analysis.

---

## 13. Appendix

### A. Formula Reference

**Epley 1RM Formula**:
```
1RM = weight × (1 + reps / 30)
```

**Linear Regression**:
```
slope = (n·Σxy - Σx·Σy) / (n·Σx² - (Σx)²)
intercept = (Σy - slope·Σx) / n
```

**R-squared (Coefficient of Determination)**:
```
R² = 1 - (SS_res / SS_tot)
where:
  SS_res = Σ(y - ŷ)²  (residual sum of squares)
  SS_tot = Σ(y - ȳ)²  (total sum of squares)
```

**Progressive Overload Status**:
```
if change ≥ 2.5%: status = 'progressing'
else if change ≤ -2.5%: status = 'regressing'
else: status = 'maintaining'
```

### B. Date Utilities

**ISO Week Number** (ISO 8601):
```javascript
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}
```

**Start of Week** (Monday-based):
```javascript
function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when Sunday
  return new Date(d.setDate(diff))
}
```

### C. Color Palette

**Muscle Group Colors** (match Dashboard donut):
```javascript
const MUSCLE_COLORS = {
  back: '#3b82f6',      // blue-500
  chest: '#f97316',     // orange-500
  legs: '#10b981',      // green-500
  biceps: '#a855f7',    // purple-500
  shoulders: '#ec4899', // pink-500
  triceps: '#14b8a6',   // teal-500
  calves: '#8b5cf6',    // violet-500
  core: '#06b6d4'       // cyan-500
}
```

**Status Colors**:
```javascript
const STATUS_COLORS = {
  progressing: '#10b981', // green-500
  maintaining: '#f59e0b', // amber-500
  regressing: '#ef4444',  // red-500
  balanced: '#10b981',
  underTrained: '#f59e0b',
  overTrained: '#ef4444'
}
```

### D. Dependencies Review

**No new dependencies needed** (all available in current stack):
- Charts: Recharts (already used)
- Date utilities: date-fns (already used)
- Tables: shadcn-vue Table components (already installed)
- Icons: lucide-vue-next (already used)
- Animations: tw-animate-css (already installed)

**Optional future dependencies**:
- `canvas-confetti` for PR celebrations (V1.2)
- `jspdf` for PDF export (V2)
- `papaparse` for CSV export enhancement (V1.1)

### E. File Size Estimation

**Code additions** (estimated):
- New computed properties: ~500 lines
- New utility files: ~400 lines
- New components: ~1200 lines
- i18n keys: ~300 lines
- Tests: ~800 lines

**Total**: ~3200 lines of new code for MVP

---

## 14. Conclusion

This PRD defines a comprehensive, phased approach to building the Analytics section for Obsessed. By focusing on **actionable insights** rather than vanity metrics, we ensure users get real value that improves their training.

**Key Takeaways**:
1. **Avoid Dashboard duplication** - Analytics provides depth, Dashboard provides overview
2. **Progressive disclosure** - MVP → V1.1 → V1.2 → V2 prevents overwhelming users
3. **Mobile-first execution** - Optimize for gym use case (quick insights on phone)
4. **Behavior-driven features** - Every chart should help users make a training decision
5. **Data-driven iteration** - Track adoption metrics to guide V1.1+ priorities

**Next Steps**:
1. Review this PRD with stakeholders
2. Break down MVP into Jira/Linear tasks
3. Assign Sprint 1 tasks to development team
4. Begin implementation with Tab 3 (Volume) as it has highest priority features

**Questions?** Contact Product Owner or leave comments in this document.

---

**Document Version**: 1.1
**Last Updated**: 2026-01-02
**Author**: Claude (Product Owner Agent)
**Status**: ✅ MVP Complete | ⚠️ V1.1 In Progress

---

## 15. Recommended Next Steps (2026-01-02)

### Immediate Priority (Next Sprint)

**1. Complete Exercise PR Timeline UI** (Effort: 2-3 days)
- Data is 100% ready in `analyticsStore.allPRs` (line 1568)
- Need to create `PRTimeline.vue` component
- Implement filtering by PR type, exercise, date range
- Add celebration UI and share functionality
- **Impact**: HIGH - Users love celebrating PRs, high engagement feature

**2. Muscle Balance Scorecard** (Effort: 3-4 days)
- Add `ANALYTICS_CONFIG.muscleBalance` constants
- Create `MuscleBalanceTable.vue` component
- Implement status badges and recommendations
- Add i18n translations
- **Impact**: MEDIUM - Helps users identify training imbalances

**3. Volume by Exercise Type** (Effort: 2-3 days total)
- Add `type` field to exercise data model
- Create migration for existing exercises (default to 'strength')
- Create `VolumeByTypeChart.vue` donut chart component
- **Impact**: MEDIUM - Useful for users with mixed training programs

### Backlog (V1.2+)

**4. Duration Breakdown** (Effort: 4-5 days)
- **BLOCKED**: Requires set-level timestamp tracking
- Option 1: Estimate using `DEFAULT_REST_TIME` (quick, less accurate)
- Option 2: Add timestamp tracking to workout model (architectural change)
- **Recommendation**: Defer until V1.2, implement timestamp tracking first

**5. Efficiency Score & Recommendations** (Effort: 1 week)
- Implement `recommendationUtils.js`
- Create efficiency scoring algorithm
- Build recommendation engine
- Add `EfficiencyScoreCard.vue` component
- **Impact**: HIGH - Actionable insights drive behavior change

### Technical Debt to Address

1. **Set-level timestamp tracking** - Needed for accurate duration analytics
2. **Export to CSV functionality** - User-requested feature
3. **Unit tests for analytics computeds** - Ensure calculation accuracy
4. **Performance optimization** - Cache expensive computations for large datasets

### Questions for Stakeholders

1. **Priority**: Should we focus on completing V1.1 features OR polish MVP based on user feedback?
2. **Exercise Type Migration**: Approve strategy for adding `type` field to existing exercises?
3. **Bodyweight Tracking**: Is this needed for V2 strength standards feature?
4. **Community Features**: Interest in leaderboards or social sharing in future versions?

### Success Metrics to Track

- Analytics page visit rate (target: 60% of active users)
- Feature engagement (which charts get most interaction?)
- User retention (do Analytics users return more often?)
- PR Timeline shares (social validation indicator)
