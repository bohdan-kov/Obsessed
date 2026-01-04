# Goals Feature - Architecture Document

**Project**: Obsessed Gym Tracker
**Feature**: Goals Management System
**Version**: 1.0
**Last Updated**: 2026-01-03
**Status**: Architecture Design Phase

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Data Architecture](#2-data-architecture)
3. [Store Architecture](#3-store-architecture)
4. [Component Architecture](#4-component-architecture)
5. [Business Logic Layer](#5-business-logic-layer)
6. [Integration Points](#6-integration-points)
7. [Real-time Updates](#7-real-time-updates)
8. [Performance Strategy](#8-performance-strategy)
9. [State Management Flow](#9-state-management-flow)
10. [API Layer](#10-api-layer)
11. [Security & Access Control](#11-security--access-control)
12. [Testing Strategy](#12-testing-strategy)
13. [Migration & Rollout](#13-migration--rollout)
14. [Appendices](#14-appendices)

---

## 1. System Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                        │
├─────────────────────────────────────────────────────────────────┤
│  GoalsView.vue  │  GoalWizard.vue  │  GoalDetailView.vue       │
│  GoalCard.vue   │  ProgressRing.vue │ GoalProgressChart.vue    │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        State Management Layer                    │
├─────────────────────────────────────────────────────────────────┤
│                         goalsStore.js                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ State: goals[], loading, error                           │  │
│  │ Getters: activeGoals, completedGoals, goalsByType        │  │
│  │ Computed: strengthGoalProgress, volumeGoalProgress       │  │
│  │ Actions: createGoal, updateGoal, deleteGoal              │  │
│  │ Watchers: workouts → auto-update progress                │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├──────────────┬──────────────┬─────────────┐
             ▼              ▼              ▼             ▼
    ┌───────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ workoutStore  │  │authStore │  │userStore │  │exercise  │
    │               │  │          │  │          │  │Store     │
    │ (read-only)   │  │(userId)  │  │(units)   │  │(lookup)  │
    └───────┬───────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
            └───────────────┴─────────────┴─────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Business Logic Layer                      │
├─────────────────────────────────────────────────────────────────┤
│  progressCalculator.js  │  goalValidation.js  │  goalUtils.js  │
│  milestoneUtils.js      │  recommendationUtils.js              │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Service Layer                             │
├─────────────────────────────────────────────────────────────────┤
│                    Firebase Firestore Service                    │
│  src/firebase/firestore.js                                      │
│  - fetchCollection()                                             │
│  - createDocument()                                              │
│  - updateDocument()                                              │
│  - deleteDocument()                                              │
│  - subscribeToCollection()                                       │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                                │
├─────────────────────────────────────────────────────────────────┤
│                    Firestore Collection: `goals`                 │
│  - User-scoped documents                                         │
│  - Composite indexes (userId + status + type)                    │
│  - Security rules: userId-based access control                   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Design Principles

1. **Unidirectional Data Flow**: Workouts → Goals (read-only dependency)
2. **Computed Progress**: Progress calculated on-demand from workout data (not stored)
3. **Auto-tracking**: Goals update automatically when workouts are added
4. **Separation of Concerns**: Store logic ↔ Business logic ↔ Presentation
5. **Type Safety**: Discriminated union pattern for different goal types
6. **Performance First**: Memoization via computed properties, lazy loading charts

### 1.3 Technology Stack

- **State Management**: Pinia (setup/function syntax)
- **Database**: Firebase Firestore
- **Charts**: @unovis/vue (existing)
- **Date Utilities**: date-fns (existing)
- **i18n**: vue-i18n (existing)
- **Validation**: Custom validation utilities
- **Testing**: Vitest + @vue/test-utils + @pinia/testing

---

## 2. Data Architecture

### 2.1 Firestore Schema

#### Collection: `goals`

**Document Structure** (discriminated union by `type` field):

```typescript
interface BaseGoal {
  // Metadata
  id: string                          // Auto-generated
  userId: string                      // FK to users (security)
  type: 'strength' | 'volume' | 'frequency' | 'streak'
  status: 'active' | 'completed' | 'failed' | 'paused'

  // Timestamps
  createdAt: string                   // ISO 8601
  updatedAt: string                   // ISO 8601

  // Optional
  notes?: string
  milestonesReached?: number[]        // [25, 50, 75, 90]
}

interface StrengthGoal extends BaseGoal {
  type: 'strength'

  // Target
  exerciseName: string                // "Bench Press"
  targetWeight: number                // Always in kg (storage unit)
  targetWeightUnit: 'kg' | 'lbs'      // User preference

  // Baseline (snapshot at creation)
  currentWeight: number               // Initial 1RM in kg

  // Timeline
  startDate: string                   // ISO 8601 date
  deadline: string                    // ISO 8601 date

  // Completion tracking
  completedAt?: string                // ISO 8601 (when 100% reached)
}

interface VolumeGoal extends BaseGoal {
  type: 'volume'

  // Target
  volumeType: 'total' | 'exercise' | 'muscle-group'
  target: number                      // kg
  targetUnit: 'kg' | 'lbs'
  period: 'week' | 'month'

  // Scope (conditional on volumeType)
  muscleGroup?: string                // If volumeType='muscle-group'
  exerciseName?: string               // If volumeType='exercise'

  // Baseline
  currentVolume: number               // Snapshot at creation

  // Timeline
  startDate: string
  deadline?: string                   // Optional for ongoing goals

  // Achievement tracking (recurring)
  lastAchievedAt?: string             // ISO 8601
  achievementStreak: number           // Consecutive periods achieved
}

interface FrequencyGoal extends BaseGoal {
  type: 'frequency'

  // Target
  frequencyType: 'total' | 'muscle-group'
  targetCount: number                 // Workouts per period
  period: 'week' | 'month'

  // Scope
  muscleGroup?: string                // If frequencyType='muscle-group'

  // Baseline
  currentCount: number                // Snapshot at creation

  // Timeline
  startDate: string
  deadline?: string                   // Optional

  // Achievement tracking
  achievementStreak: number           // Consecutive periods
  lastAchievedAt?: string
}

interface StreakGoal extends BaseGoal {
  type: 'streak'

  // Target
  streakType: 'daily' | 'weekly'
  targetDays?: number                 // If streakType='daily'
  targetWeeks?: number                // If streakType='weekly'

  // Rest day configuration
  allowRestDays: boolean
  maxRestDaysPerWeek?: number         // If allowRestDays=true

  // Progress
  currentStreak: number               // Days or weeks
  longestStreak: number               // Historical max

  // Timeline
  startDate: string
  expectedEndDate: string             // Calculated: startDate + target
  completedAt?: string
}
```

### 2.2 Data Relationships

```
User (auth)
  │
  ├──> Workouts (1:N)
  │     └──> Exercises (1:N)
  │           └──> Sets (1:N)
  │
  └──> Goals (1:N)
        ├──> References exerciseName (String, not FK)
        └──> Computed from Workouts (read-only)

Note: Goals do NOT store foreign keys to workouts.
Progress is computed on-demand from workout data.
```

### 2.3 Firestore Indexes

**Required Composite Indexes**:

```javascript
// firebase.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "goals",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "goals",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "goals",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

**Why These Indexes**:
- Query 1: Fetch active goals: `where('userId', '==', uid).where('status', '==', 'active').orderBy('createdAt', 'desc')`
- Query 2: Fetch goals by type: `where('userId', '==', uid).where('type', '==', 'strength').orderBy('createdAt', 'desc')`
- Query 3: Fetch all user goals: `where('userId', '==', uid).orderBy('createdAt', 'desc')`

### 2.4 Data Size Estimation

**Per Goal Document**:
- Base fields: ~200 bytes
- Strength-specific: ~150 bytes
- Volume-specific: ~200 bytes
- **Average**: ~350 bytes per goal

**Per User**:
- Avg 2 goals/user × 350 bytes = **700 bytes/user**

**At Scale** (10,000 users):
- 10,000 users × 700 bytes = **7 MB total**

**Conclusion**: Storage is negligible. Focus on query optimization.

---

## 3. Store Architecture

### 3.1 goalsStore.js - Complete Structure

```javascript
// src/stores/goalsStore.js
import { defineStore } from 'pinia'
import { ref, computed, watch, nextTick } from 'vue'
import { useWorkoutStore } from './workoutStore'
import { useAuthStore } from './authStore'
import { useExerciseStore } from './exerciseStore'
import {
  fetchCollection,
  createDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  COLLECTIONS
} from '@/firebase/firestore'
import {
  calculateStrengthProgress,
  calculateVolumeProgress,
  calculateFrequencyProgress,
  calculateStreakProgress
} from '@/utils/progressCalculator'
import {
  determineGoalStatus,
  calculateExpectedProgress,
  getPeriodBoundaries
} from '@/utils/goalUtils'
import { detectMilestones } from '@/utils/milestoneUtils'
import { validateGoal } from '@/utils/goalValidation'
import { useErrorHandler } from '@/composables/useErrorHandler'

export const useGoalsStore = defineStore('goals', () => {
  // ===== Dependencies =====
  const workoutStore = useWorkoutStore()
  const authStore = useAuthStore()
  const exerciseStore = useExerciseStore()
  const { handleError } = useErrorHandler()

  // ===== State =====
  const goals = ref([])
  const loading = ref(false)
  const error = ref(null)
  let unsubscribe = null

  // ===== Getters (Basic) =====
  const activeGoals = computed(() =>
    goals.value.filter(g => g.status === 'active')
  )

  const completedGoals = computed(() =>
    goals.value.filter(g => g.status === 'completed')
  )

  const pausedGoals = computed(() =>
    goals.value.filter(g => g.status === 'paused')
  )

  const failedGoals = computed(() =>
    goals.value.filter(g => g.status === 'failed')
  )

  // ===== Getters (By Type) =====
  const strengthGoals = computed(() =>
    activeGoals.value.filter(g => g.type === 'strength')
  )

  const volumeGoals = computed(() =>
    activeGoals.value.filter(g => g.type === 'volume')
  )

  const frequencyGoals = computed(() =>
    activeGoals.value.filter(g => g.type === 'frequency')
  )

  const streakGoals = computed(() =>
    activeGoals.value.filter(g => g.type === 'streak')
  )

  // ===== Computed: Strength Goal Progress =====
  const strengthGoalProgress = computed(() => {
    const workouts = workoutStore.completedWorkouts

    return strengthGoals.value.map(goal => {
      // Calculate current progress
      const progressData = calculateStrengthProgress(goal, workouts)

      // Calculate expected progress
      const expectedProgress = calculateExpectedProgress(goal)

      // Determine status
      const now = new Date()
      const deadline = new Date(goal.deadline)
      const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))

      const status = determineGoalStatus(
        progressData.progressPercent,
        expectedProgress,
        daysRemaining
      )

      return {
        ...goal,
        ...progressData,
        expectedProgress,
        status,
        daysRemaining
      }
    })
  })

  // ===== Computed: Volume Goal Progress =====
  const volumeGoalProgress = computed(() => {
    const workouts = workoutStore.completedWorkouts

    return volumeGoals.value.map(goal => {
      // Get period boundaries
      const { start: periodStart, end: periodEnd } = getPeriodBoundaries(
        goal.period,
        new Date()
      )

      // Calculate current volume
      const progressData = calculateVolumeProgress(
        goal,
        workouts,
        periodStart,
        periodEnd
      )

      // Calculate expected progress
      const now = new Date()
      const totalDays = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24))
      const daysPassed = Math.ceil((now - periodStart) / (1000 * 60 * 60 * 24))
      const expectedProgress = (daysPassed / totalDays) * 100

      const daysRemaining = Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24))

      // Determine status
      let status = 'on-pace'
      if (progressData.progressPercent >= 100) {
        status = 'achieved'
      } else if (progressData.progressPercent > expectedProgress + 5) {
        status = 'ahead'
      } else if (progressData.progressPercent < expectedProgress - 10) {
        status = 'behind'
      }

      return {
        ...goal,
        ...progressData,
        expectedProgress,
        status,
        daysRemaining,
        periodStart,
        periodEnd
      }
    })
  })

  // ===== Computed: Frequency Goal Progress =====
  const frequencyGoalProgress = computed(() => {
    const workouts = workoutStore.completedWorkouts

    return frequencyGoals.value.map(goal => {
      const { start: periodStart, end: periodEnd } = getPeriodBoundaries(
        goal.period,
        new Date()
      )

      const progressData = calculateFrequencyProgress(
        goal,
        workouts,
        periodStart,
        periodEnd
      )

      const now = new Date()
      const totalDays = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24))
      const daysPassed = Math.ceil((now - periodStart) / (1000 * 60 * 60 * 24))
      const expectedProgress = (daysPassed / totalDays) * 100

      const daysRemaining = Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24))

      let status = 'on-pace'
      if (progressData.progressPercent >= 100) {
        status = 'achieved'
      } else if (progressData.progressPercent > expectedProgress + 5) {
        status = 'ahead'
      } else if (progressData.progressPercent < expectedProgress - 10) {
        status = 'behind'
      }

      return {
        ...goal,
        ...progressData,
        expectedProgress,
        status,
        daysRemaining,
        periodStart,
        periodEnd
      }
    })
  })

  // ===== Computed: Streak Goal Progress =====
  const streakGoalProgress = computed(() => {
    const workouts = workoutStore.completedWorkouts

    return streakGoals.value.map(goal => {
      const progressData = calculateStreakProgress(goal, workouts)

      const target = goal.streakType === 'daily' ? goal.targetDays : goal.targetWeeks
      const progressPercent = (progressData.currentStreak / target) * 100

      const status = progressPercent >= 100 ? 'completed' : 'active'

      return {
        ...goal,
        ...progressData,
        progressPercent,
        status,
        daysRemaining: target - progressData.currentStreak
      }
    })
  })

  // ===== Computed: All Goal Progress (Combined) =====
  const allGoalProgress = computed(() => {
    return [
      ...strengthGoalProgress.value,
      ...volumeGoalProgress.value,
      ...frequencyGoalProgress.value,
      ...streakGoalProgress.value
    ]
  })

  // ===== Computed: Goal Statistics =====
  const goalStats = computed(() => {
    const total = goals.value.length
    const active = activeGoals.value.length
    const completed = completedGoals.value.length
    const completionRate = total > 0 ? (completed / total) * 100 : 0

    const onTrack = allGoalProgress.value.filter(
      g => g.status === 'on-track' || g.status === 'ahead' || g.status === 'achieved'
    ).length

    return {
      total,
      active,
      completed,
      completionRate,
      onTrack,
      atRisk: allGoalProgress.value.filter(g => g.status === 'at-risk').length
    }
  })

  // ===== Actions: CRUD Operations =====

  /**
   * Fetch all goals for current user
   */
  async function fetchGoals() {
    if (!authStore.userId) {
      console.warn('fetchGoals: No authenticated user')
      return
    }

    loading.value = true
    error.value = null

    try {
      const data = await fetchCollection(COLLECTIONS.GOALS, {
        where: [['userId', '==', authStore.userId]],
        orderBy: [['createdAt', 'desc']]
      })

      goals.value = data
    } catch (err) {
      error.value = err.message
      handleError(err, 'Failed to fetch goals', { context: 'fetchGoals' })
    } finally {
      loading.value = false
    }
  }

  /**
   * Subscribe to real-time goal updates
   */
  function subscribeToGoals() {
    if (!authStore.userId) {
      console.warn('subscribeToGoals: No authenticated user')
      return
    }

    // Cleanup existing subscription
    if (unsubscribe) {
      unsubscribe()
    }

    unsubscribe = subscribeToCollection(
      COLLECTIONS.GOALS,
      {
        where: [['userId', '==', authStore.userId]],
        orderBy: [['createdAt', 'desc']]
      },
      (data) => {
        goals.value = data
      },
      (err) => {
        error.value = err.message
        handleError(err, 'Goal subscription error', { context: 'subscribeToGoals' })
      }
    )
  }

  /**
   * Create new goal
   * @param {Object} goalData - Goal data (validated before calling)
   * @returns {Promise<string>} - Document ID
   */
  async function createGoal(goalData) {
    if (!authStore.userId) {
      throw new Error('User not authenticated')
    }

    // Validate goal
    const validation = validateGoal(goalData, workoutStore.completedWorkouts)
    if (!validation.valid) {
      throw new Error(`Invalid goal: ${validation.errors.join(', ')}`)
    }

    loading.value = true
    error.value = null

    try {
      const newGoal = {
        ...goalData,
        userId: authStore.userId,
        status: 'active',
        milestonesReached: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const docId = await createDocument(COLLECTIONS.GOALS, newGoal)

      return docId
    } catch (err) {
      error.value = err.message
      handleError(err, 'Failed to create goal', { context: 'createGoal', goalData })
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update existing goal
   * @param {string} goalId
   * @param {Object} updates
   */
  async function updateGoal(goalId, updates) {
    loading.value = true
    error.value = null

    try {
      await updateDocument(COLLECTIONS.GOALS, goalId, {
        ...updates,
        updatedAt: new Date().toISOString()
      })
    } catch (err) {
      error.value = err.message
      handleError(err, 'Failed to update goal', { context: 'updateGoal', goalId, updates })
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete goal
   * @param {string} goalId
   */
  async function deleteGoal(goalId) {
    loading.value = true
    error.value = null

    try {
      await deleteDocument(COLLECTIONS.GOALS, goalId)
    } catch (err) {
      error.value = err.message
      handleError(err, 'Failed to delete goal', { context: 'deleteGoal', goalId })
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Complete goal (mark as completed)
   * @param {string} goalId
   */
  async function completeGoal(goalId) {
    await updateGoal(goalId, {
      status: 'completed',
      completedAt: new Date().toISOString()
    })
  }

  /**
   * Pause goal
   * @param {string} goalId
   */
  async function pauseGoal(goalId) {
    await updateGoal(goalId, { status: 'paused' })
  }

  /**
   * Resume paused goal
   * @param {string} goalId
   */
  async function resumeGoal(goalId) {
    await updateGoal(goalId, { status: 'active' })
  }

  /**
   * Fail goal (deadline passed without completion)
   * @param {string} goalId
   */
  async function failGoal(goalId) {
    await updateGoal(goalId, {
      status: 'failed',
      failedAt: new Date().toISOString()
    })
  }

  // ===== Actions: Progress Management =====

  /**
   * Check all active goals for milestone achievements
   * Called after workout is added
   */
  function checkMilestones() {
    allGoalProgress.value.forEach(goal => {
      // Detect newly reached milestones
      const newMilestones = detectMilestones(
        goal.progressPercent,
        goal.milestonesReached || []
      )

      if (newMilestones.length > 0) {
        // Update goal with new milestones
        updateGoal(goal.id, {
          milestonesReached: [...(goal.milestonesReached || []), ...newMilestones]
        })

        // TODO: Trigger celebration notification
        console.log(`🎉 Milestone reached for goal ${goal.id}: ${newMilestones}%`)
      }
    })
  }

  /**
   * Check for automatic goal completions
   * Called after workout is added
   */
  function checkAutoCompletions() {
    strengthGoalProgress.value.forEach(goal => {
      // Auto-complete strength goals at 100%
      if (goal.progressPercent >= 100 && goal.status === 'active') {
        completeGoal(goal.id)
        console.log(`✅ Goal auto-completed: ${goal.exerciseName} ${goal.targetWeight}kg`)
      }
    })

    // Check for deadline expirations
    allGoalProgress.value.forEach(goal => {
      if (goal.status === 'active' && goal.deadline) {
        const now = new Date()
        const deadline = new Date(goal.deadline)

        if (now > deadline && goal.progressPercent < 100) {
          failGoal(goal.id)
          console.log(`❌ Goal failed (deadline passed): ${goal.id}`)
        }
      }
    })
  }

  /**
   * Update all goal progress
   * Called when workouts change
   */
  function updateAllGoalProgress() {
    checkMilestones()
    checkAutoCompletions()
  }

  // ===== Watchers =====

  /**
   * Watch for new workouts and auto-update goal progress
   */
  watch(
    () => workoutStore.workouts.length,
    (newLength, oldLength) => {
      if (newLength > oldLength) {
        // New workout added
        nextTick(() => {
          updateAllGoalProgress()
        })
      }
    }
  )

  /**
   * Watch for auth state and subscribe/unsubscribe
   */
  watch(
    () => authStore.userId,
    (newUserId) => {
      if (newUserId) {
        subscribeToGoals()
      } else {
        cleanup()
        goals.value = []
      }
    },
    { immediate: true }
  )

  // ===== Lifecycle =====

  /**
   * Cleanup subscriptions
   */
  function cleanup() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  // ===== Return Public API =====
  return {
    // State
    goals,
    loading,
    error,

    // Getters
    activeGoals,
    completedGoals,
    pausedGoals,
    failedGoals,
    strengthGoals,
    volumeGoals,
    frequencyGoals,
    streakGoals,

    // Computed Progress
    strengthGoalProgress,
    volumeGoalProgress,
    frequencyGoalProgress,
    streakGoalProgress,
    allGoalProgress,
    goalStats,

    // Actions
    fetchGoals,
    subscribeToGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    pauseGoal,
    resumeGoal,
    failGoal,
    updateAllGoalProgress,
    checkMilestones,
    cleanup
  }
})
```

### 3.2 Store Dependencies

```
goalsStore
  │
  ├──> workoutStore (read-only)
  │     └── completedWorkouts (for progress calculation)
  │
  ├──> authStore (read-only)
  │     └── userId (for Firestore queries)
  │
  └──> exerciseStore (read-only)
        └── exercises (for exercise metadata)
```

**Important**: Goals store NEVER writes to other stores (unidirectional dependency).

---

## 4. Component Architecture

### 4.1 File Structure

```
src/
├── pages/
│   └── goals/
│       ├── GoalsView.vue                    # Main goals page (/goals route)
│       ├── GoalDetailView.vue               # Goal detail page (/goals/:id route)
│       │
│       └── components/
│           ├── GoalsHeader.vue              # Stats summary + Create button
│           ├── GoalFilters.vue              # Filter/sort controls
│           ├── GoalCardList.vue             # Grid of goal cards
│           ├── GoalCard.vue                 # Individual goal card
│           ├── EmptyGoalsState.vue          # No goals placeholder
│           │
│           ├── wizard/
│           │   ├── GoalWizard.vue           # Multi-step wizard modal
│           │   ├── GoalTypeSelector.vue     # Step 1: Choose type
│           │   ├── strength/
│           │   │   ├── ExerciseSelect.vue   # Step 2a: Choose exercise
│           │   │   ├── TargetWeightInput.vue# Step 2b: Set target
│           │   │   └── DeadlineSelect.vue   # Step 3: Set deadline
│           │   ├── volume/
│           │   │   ├── VolumeTypeSelect.vue # Step 2a: Total/Exercise/Muscle
│           │   │   ├── VolumeTargetInput.vue# Step 2b: Target volume
│           │   │   └── VolumePeriodSelect.vue# Step 2c: Week/Month
│           │   ├── frequency/
│           │   │   └── FrequencyConfig.vue  # Frequency goal config
│           │   └── GoalPreview.vue          # Final step: Review
│           │
│           ├── detail/
│           │   ├── GoalDetailHeader.vue     # Title, progress, actions
│           │   ├── GoalProgressChart.vue    # Line chart with trend
│           │   ├── GoalWorkoutHistory.vue   # Table of relevant workouts
│           │   ├── GoalPredictions.vue      # AI predictions
│           │   └── GoalMilestones.vue       # Timeline of achievements
│           │
│           └── shared/
│               ├── ProgressRing.vue         # Circular progress indicator
│               ├── StatusBadge.vue          # Goal status badge
│               ├── GoalTypeIcon.vue         # Icon for each goal type
│               └── MilestoneMarker.vue      # Milestone badge
│
└── components/
    └── goals/                               # Shared goal components
        ├── ProgressRing.vue
        ├── StatusBadge.vue
        ├── GoalTypeIcon.vue
        └── MilestoneMarker.vue
```

### 4.2 Component Hierarchy

```
GoalsView.vue
├── GoalsHeader.vue
│   ├── StatCard (total goals, active, completion rate)
│   └── Button (Create Goal → opens wizard)
│
├── GoalFilters.vue
│   ├── Select (Filter by type)
│   ├── Select (Filter by status)
│   └── Select (Sort by: date, progress, deadline)
│
├── GoalCardList.vue (grid layout)
│   └── GoalCard.vue (v-for goal in filteredGoals)
│       ├── GoalTypeIcon.vue
│       ├── ProgressRing.vue
│       ├── StatusBadge.vue
│       └── GoalActions.vue (Edit/Pause/Delete)
│
└── EmptyGoalsState.vue (v-if no goals)

GoalWizard.vue (Modal/Dialog)
├── Step 1: GoalTypeSelector.vue
├── Step 2: (conditional on type)
│   ├── ExerciseSelect.vue (strength)
│   ├── VolumeTypeSelect.vue (volume)
│   └── FrequencyConfig.vue (frequency)
├── Step 3: DeadlineSelect.vue
└── Step 4: GoalPreview.vue

GoalDetailView.vue
├── GoalDetailHeader.vue
│   ├── ProgressRing.vue (large, 200px)
│   └── StatusBadge.vue
│
├── GoalProgressChart.vue
│   └── VisXYContainer (unovis chart)
│
├── GoalPredictions.vue
│
├── GoalWorkoutHistory.vue
│   └── Table (workouts with this exercise)
│
└── GoalMilestones.vue
    └── Timeline (25%, 50%, 75%, 90%, 100%)
```

### 4.3 Key Component Props & Events

#### GoalCard.vue

```vue
<script setup>
defineProps({
  goal: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['edit', 'pause', 'delete', 'view-detail'])
</script>
```

#### GoalWizard.vue

```vue
<script setup>
const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close', 'goal-created'])
</script>
```

#### ProgressRing.vue

```vue
<script setup>
defineProps({
  progress: {
    type: Number,
    required: true,
    validator: (value) => value >= 0 && value <= 100
  },
  size: {
    type: Number,
    default: 120
  },
  color: {
    type: String,
    default: 'var(--chart-1)'
  }
})
</script>
```

---

## 5. Business Logic Layer

### 5.1 progressCalculator.js

```javascript
// src/utils/progressCalculator.js
import { calculate1RM } from './strengthUtils'
import { calculateExerciseVolume } from './volumeUtils'
import { getMuscleGroups } from './muscleUtils'
import { differenceInDays, startOfWeek, endOfWeek } from 'date-fns'

/**
 * Calculate strength goal progress
 * @param {Object} goal - Strength goal
 * @param {Array} workouts - All workouts
 * @returns {Object} { current1RM, progressPercent, progressHistory, trend }
 */
export function calculateStrengthProgress(goal, workouts) {
  const relevantWorkouts = workouts
    .filter(w => w.exercises.some(e => e.name === goal.exerciseName))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  if (!relevantWorkouts.length) {
    return {
      current1RM: goal.currentWeight || 0,
      progressPercent: 0,
      progressHistory: [],
      trend: null
    }
  }

  // Build progress history
  const progressHistory = relevantWorkouts.map(w => {
    const exercise = w.exercises.find(e => e.name === goal.exerciseName)
    const onerm = calculate1RM(exercise.sets)

    return {
      date: w.createdAt,
      value: onerm,
      sets: exercise.sets,
      maxWeight: Math.max(...exercise.sets.map(s => s.weight))
    }
  })

  const current1RM = progressHistory[progressHistory.length - 1].value
  const progressPercent = Math.min((current1RM / goal.targetWeight) * 100, 100)

  // Calculate trend (linear regression)
  const trend = calculateLinearRegression(
    progressHistory.map((p, i) => ({ x: i, y: p.value }))
  )

  return {
    current1RM,
    progressPercent,
    progressHistory,
    trend
  }
}

/**
 * Calculate volume goal progress for current period
 * @param {Object} goal - Volume goal
 * @param {Array} workouts - All workouts
 * @param {Date} periodStart
 * @param {Date} periodEnd
 * @returns {Object} { currentVolume, progressPercent }
 */
export function calculateVolumeProgress(goal, workouts, periodStart, periodEnd) {
  const periodWorkouts = workouts.filter(w => {
    const date = new Date(w.createdAt)
    return date >= periodStart && date <= periodEnd
  })

  let currentVolume = 0

  if (goal.volumeType === 'total') {
    currentVolume = periodWorkouts.reduce((sum, w) =>
      sum + w.exercises.reduce((exSum, e) =>
        exSum + calculateExerciseVolume(e), 0
      ), 0
    )
  } else if (goal.volumeType === 'exercise') {
    currentVolume = periodWorkouts.reduce((sum, w) => {
      const exercise = w.exercises.find(e => e.name === goal.exerciseName)
      return sum + (exercise ? calculateExerciseVolume(exercise) : 0)
    }, 0)
  } else if (goal.volumeType === 'muscle-group') {
    currentVolume = periodWorkouts.reduce((sum, w) => {
      const muscleVolume = w.exercises
        .filter(e => getMuscleGroups(e.name).includes(goal.muscleGroup))
        .reduce((exSum, e) => exSum + calculateExerciseVolume(e), 0)
      return sum + muscleVolume
    }, 0)
  }

  const progressPercent = (currentVolume / goal.target) * 100

  return {
    currentVolume,
    progressPercent
  }
}

/**
 * Calculate frequency goal progress for current period
 * @param {Object} goal - Frequency goal
 * @param {Array} workouts - All workouts
 * @param {Date} periodStart
 * @param {Date} periodEnd
 * @returns {Object} { currentCount, progressPercent }
 */
export function calculateFrequencyProgress(goal, workouts, periodStart, periodEnd) {
  let periodWorkouts = workouts.filter(w => {
    const date = new Date(w.createdAt)
    return date >= periodStart && date <= periodEnd
  })

  if (goal.frequencyType === 'muscle-group') {
    periodWorkouts = periodWorkouts.filter(w =>
      w.exercises.some(e => getMuscleGroups(e.name).includes(goal.muscleGroup))
    )
  }

  const currentCount = periodWorkouts.length
  const progressPercent = (currentCount / goal.targetCount) * 100

  return {
    currentCount,
    progressPercent
  }
}

/**
 * Calculate streak goal progress
 * @param {Object} goal - Streak goal
 * @param {Array} workouts - All workouts
 * @returns {Object} { currentStreak, longestStreak, progressPercent, history }
 */
export function calculateStreakProgress(goal, workouts) {
  const sortedWorkouts = workouts
    .map(w => new Date(w.createdAt))
    .sort((a, b) => b - a) // Newest first

  if (!sortedWorkouts.length) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      progressPercent: 0,
      history: []
    }
  }

  // Calculate streak based on streakType
  if (goal.streakType === 'daily') {
    const { currentStreak, longestStreak } = calculateDailyStreak(
      sortedWorkouts,
      goal.allowRestDays,
      goal.maxRestDaysPerWeek
    )

    const target = goal.targetDays
    const progressPercent = Math.min((currentStreak / target) * 100, 100)

    return {
      currentStreak,
      longestStreak,
      progressPercent,
      history: []
    }
  } else {
    // Weekly streak
    const { currentStreak, longestStreak } = calculateWeeklyStreak(sortedWorkouts)

    const target = goal.targetWeeks
    const progressPercent = Math.min((currentStreak / target) * 100, 100)

    return {
      currentStreak,
      longestStreak,
      progressPercent,
      history: []
    }
  }
}

/**
 * Calculate daily streak
 */
function calculateDailyStreak(workoutDates, allowRestDays, maxRestDaysPerWeek) {
  // Implementation similar to analyticsStore currentStreak
  // Count consecutive days with workouts, allowing rest days

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0
  let consecutiveMissedDays = 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(today.getDate() - i)

    const hadWorkout = workoutDates.some(d => {
      const workoutDate = new Date(d)
      workoutDate.setHours(0, 0, 0, 0)
      return workoutDate.getTime() === checkDate.getTime()
    })

    if (hadWorkout) {
      tempStreak++
      consecutiveMissedDays = 0
    } else {
      consecutiveMissedDays++

      if (allowRestDays && consecutiveMissedDays <= maxRestDaysPerWeek) {
        // Allow rest day
        continue
      } else {
        // Streak broken
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak
        }
        if (i === consecutiveMissedDays) {
          currentStreak = 0
        }
        tempStreak = 0
      }
    }
  }

  if (tempStreak > 0 && currentStreak === 0) {
    currentStreak = tempStreak
  }

  return { currentStreak, longestStreak }
}

/**
 * Calculate weekly streak
 */
function calculateWeeklyStreak(workoutDates) {
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0

  const today = new Date()

  for (let i = 0; i < 52; i++) {
    const weekStart = startOfWeek(new Date(today.setDate(today.getDate() - (i * 7))))
    const weekEnd = endOfWeek(weekStart)

    const hadWorkoutThisWeek = workoutDates.some(d => d >= weekStart && d <= weekEnd)

    if (hadWorkoutThisWeek) {
      tempStreak++
    } else {
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak
      }
      if (i === 0) {
        currentStreak = 0
      }
      tempStreak = 0
    }
  }

  if (tempStreak > 0 && currentStreak === 0) {
    currentStreak = tempStreak
  }

  return { currentStreak, longestStreak }
}

/**
 * Linear regression for trend line
 */
function calculateLinearRegression(points) {
  const n = points.length
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 }

  const sumX = points.reduce((sum, p) => sum + p.x, 0)
  const sumY = points.reduce((sum, p) => sum + p.y, 0)
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0)
  const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Calculate R²
  const meanY = sumY / n
  const ssTot = points.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0)
  const ssRes = points.reduce((sum, p) => {
    const predicted = intercept + slope * p.x
    return sum + Math.pow(p.y - predicted, 2)
  }, 0)
  const r2 = 1 - (ssRes / ssTot)

  return { slope, intercept, r2 }
}
```

### 5.2 goalValidation.js

```javascript
// src/utils/goalValidation.js
import { differenceInDays } from 'date-fns'
import { calculate1RM } from './strengthUtils'

/**
 * Validate goal data before creation
 * @param {Object} goalData - Goal to validate
 * @param {Array} workouts - User's workout history
 * @returns {Object} { valid: boolean, errors: string[], warnings: string[] }
 */
export function validateGoal(goalData, workouts) {
  const errors = []
  const warnings = []

  // Common validations
  if (!goalData.type) {
    errors.push('Goal type is required')
  }

  if (goalData.deadline) {
    const deadline = new Date(goalData.deadline)
    const now = new Date()

    if (deadline <= now) {
      errors.push('Deadline must be in the future')
    }
  }

  // Type-specific validations
  if (goalData.type === 'strength') {
    validateStrengthGoal(goalData, workouts, errors, warnings)
  } else if (goalData.type === 'volume') {
    validateVolumeGoal(goalData, workouts, errors, warnings)
  } else if (goalData.type === 'frequency') {
    validateFrequencyGoal(goalData, errors, warnings)
  } else if (goalData.type === 'streak') {
    validateStreakGoal(goalData, errors, warnings)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate strength goal
 */
function validateStrengthGoal(goalData, workouts, errors, warnings) {
  if (!goalData.exerciseName) {
    errors.push('Exercise name is required')
  }

  if (!goalData.targetWeight || goalData.targetWeight <= 0) {
    errors.push('Target weight must be positive')
  }

  // Check if user has workout history for this exercise
  const relevantWorkouts = workouts.filter(w =>
    w.exercises.some(e => e.name === goalData.exerciseName)
  )

  if (relevantWorkouts.length < 3) {
    warnings.push(
      `Only ${relevantWorkouts.length} workouts found for ${goalData.exerciseName}. ` +
      'Add more workouts for accurate progress tracking.'
    )
  }

  // Calculate current 1RM
  if (relevantWorkouts.length > 0) {
    const latestWorkout = relevantWorkouts[relevantWorkouts.length - 1]
    const exercise = latestWorkout.exercises.find(e => e.name === goalData.exerciseName)
    const current1RM = calculate1RM(exercise.sets)

    if (goalData.targetWeight <= current1RM) {
      errors.push(
        `Target weight (${goalData.targetWeight}kg) must be higher than ` +
        `current 1RM (${current1RM.toFixed(1)}kg)`
      )
    }

    // Check if goal is realistic
    if (goalData.deadline) {
      const daysAvailable = differenceInDays(new Date(goalData.deadline), new Date())
      const increasePercent = ((goalData.targetWeight - current1RM) / current1RM) * 100
      const weeksAvailable = daysAvailable / 7

      // Rule: +5% per month is realistic for intermediate lifters
      const realisticIncreasePercent = (weeksAvailable / 4) * 5

      if (increasePercent > realisticIncreasePercent * 1.5) {
        warnings.push(
          `Target may be ambitious. Based on typical progress, ` +
          `${(current1RM * (1 + realisticIncreasePercent / 100)).toFixed(1)}kg ` +
          `in ${weeksAvailable.toFixed(0)} weeks is more realistic.`
        )
      }
    }
  }
}

/**
 * Validate volume goal
 */
function validateVolumeGoal(goalData, workouts, errors, warnings) {
  if (!goalData.volumeType) {
    errors.push('Volume type is required (total, exercise, or muscle-group)')
  }

  if (!goalData.target || goalData.target <= 0) {
    errors.push('Target volume must be positive')
  }

  if (!goalData.period) {
    errors.push('Period is required (week or month)')
  }

  if (goalData.volumeType === 'muscle-group' && !goalData.muscleGroup) {
    errors.push('Muscle group is required for muscle-group volume goals')
  }

  if (goalData.volumeType === 'exercise' && !goalData.exerciseName) {
    errors.push('Exercise name is required for exercise volume goals')
  }

  // Check if increase is too aggressive
  if (goalData.currentVolume && goalData.target) {
    const increasePercent = ((goalData.target - goalData.currentVolume) / goalData.currentVolume) * 100

    if (increasePercent > 50) {
      warnings.push(
        `Volume increase of ${increasePercent.toFixed(0)}% may be too aggressive. ` +
        'Consider increasing by 10-15% for sustainable progress.'
      )
    }
  }
}

/**
 * Validate frequency goal
 */
function validateFrequencyGoal(goalData, errors, warnings) {
  if (!goalData.frequencyType) {
    errors.push('Frequency type is required (total or muscle-group)')
  }

  if (!goalData.targetCount || goalData.targetCount <= 0) {
    errors.push('Target count must be positive')
  }

  if (!goalData.period) {
    errors.push('Period is required (week or month)')
  }

  if (goalData.frequencyType === 'muscle-group' && !goalData.muscleGroup) {
    errors.push('Muscle group is required for muscle-group frequency goals')
  }

  // Warn about overtraining
  if (goalData.period === 'week' && goalData.targetCount > 7) {
    warnings.push(
      'Training 7+ times per week may lead to overtraining. Ensure adequate recovery.'
    )
  }
}

/**
 * Validate streak goal
 */
function validateStreakGoal(goalData, errors, warnings) {
  if (!goalData.streakType) {
    errors.push('Streak type is required (daily or weekly)')
  }

  if (goalData.streakType === 'daily' && (!goalData.targetDays || goalData.targetDays <= 0)) {
    errors.push('Target days must be positive for daily streak goals')
  }

  if (goalData.streakType === 'weekly' && (!goalData.targetWeeks || goalData.targetWeeks <= 0)) {
    errors.push('Target weeks must be positive for weekly streak goals')
  }

  if (goalData.allowRestDays && (!goalData.maxRestDaysPerWeek || goalData.maxRestDaysPerWeek < 0)) {
    errors.push('Max rest days per week must be specified when rest days are allowed')
  }
}
```

### 5.3 goalUtils.js

```javascript
// src/utils/goalUtils.js
import { differenceInDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

/**
 * Calculate expected progress percentage based on time elapsed
 * @param {Object} goal - Goal with startDate and deadline
 * @returns {number} Expected progress (0-100)
 */
export function calculateExpectedProgress(goal) {
  if (!goal.startDate || !goal.deadline) return 0

  const totalDays = differenceInDays(new Date(goal.deadline), new Date(goal.startDate))
  const daysPassed = differenceInDays(new Date(), new Date(goal.startDate))

  return Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100)
}

/**
 * Determine goal status based on progress vs expected
 * @param {number} currentProgress - Current progress percentage
 * @param {number} expectedProgress - Expected progress percentage
 * @param {number} daysRemaining - Days until deadline
 * @returns {string} Status: 'on-track' | 'ahead' | 'behind' | 'at-risk' | 'completed'
 */
export function determineGoalStatus(currentProgress, expectedProgress, daysRemaining) {
  if (currentProgress >= 100) return 'completed'
  if (daysRemaining < 14 && currentProgress < 80) return 'at-risk'
  if (currentProgress > expectedProgress + 10) return 'ahead'
  if (currentProgress < expectedProgress - 10) return 'behind'
  return 'on-track'
}

/**
 * Get period boundaries for volume/frequency goals
 * @param {'week'|'month'} period
 * @param {Date} date - Reference date (default: now)
 * @returns {Object} { start: Date, end: Date }
 */
export function getPeriodBoundaries(period, date = new Date()) {
  if (period === 'week') {
    return {
      start: startOfWeek(date, { weekStartsOn: 1 }), // Monday
      end: endOfWeek(date, { weekStartsOn: 1 })
    }
  } else if (period === 'month') {
    return {
      start: startOfMonth(date),
      end: endOfMonth(date)
    }
  }

  throw new Error(`Unknown period: ${period}`)
}

/**
 * Calculate required pace to reach goal on time
 * @param {number} current - Current value
 * @param {number} target - Target value
 * @param {number} daysRemaining - Days until deadline
 * @returns {Object} { perDay, perWeek, total }
 */
export function calculateRequiredPaceToGoal(current, target, daysRemaining) {
  const remaining = target - current
  const weeksRemaining = daysRemaining / 7

  return {
    perDay: remaining / daysRemaining,
    perWeek: remaining / weeksRemaining,
    total: remaining
  }
}

/**
 * Predict goal completion date based on linear trend
 * @param {Array} progressHistory - [{date, value}]
 * @param {number} targetValue - Target to reach
 * @returns {Date|null} Predicted completion date
 */
export function predictGoalCompletion(progressHistory, targetValue) {
  if (progressHistory.length < 2) return null

  // Calculate average days between workouts
  const daysDiffs = []
  for (let i = 1; i < progressHistory.length; i++) {
    const diff = differenceInDays(
      new Date(progressHistory[i].date),
      new Date(progressHistory[i - 1].date)
    )
    daysDiffs.push(diff)
  }
  const avgDaysBetween = daysDiffs.reduce((sum, d) => sum + d, 0) / daysDiffs.length

  // Simple linear regression
  const points = progressHistory.map((p, i) => ({ x: i, y: p.value }))
  const n = points.length
  const sumX = points.reduce((sum, p) => sum + p.x, 0)
  const sumY = points.reduce((sum, p) => sum + p.y, 0)
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0)
  const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Find when trend line crosses target
  const stepsToTarget = (targetValue - intercept) / slope

  if (stepsToTarget <= 0) return new Date() // Already achieved

  const lastDate = new Date(progressHistory[progressHistory.length - 1].date)
  const daysToTarget = stepsToTarget * avgDaysBetween

  return new Date(lastDate.getTime() + daysToTarget * 24 * 60 * 60 * 1000)
}
```

### 5.4 milestoneUtils.js

```javascript
// src/utils/milestoneUtils.js

const MILESTONE_THRESHOLDS = [25, 50, 75, 90, 100]

/**
 * Detect newly reached milestones
 * @param {number} currentProgress - Current progress percentage
 * @param {Array<number>} reachedMilestones - Already reached milestones
 * @returns {Array<number>} Newly reached milestones
 */
export function detectMilestones(currentProgress, reachedMilestones = []) {
  const newMilestones = []

  for (const threshold of MILESTONE_THRESHOLDS) {
    if (currentProgress >= threshold && !reachedMilestones.includes(threshold)) {
      newMilestones.push(threshold)
    }
  }

  return newMilestones
}

/**
 * Get celebration message for milestone
 * @param {number} milestone - Milestone percentage
 * @param {Object} goal - Goal object
 * @returns {string} Celebration message
 */
export function getMilestoneCelebrationMessage(milestone, goal) {
  const messages = {
    25: `You're 25% of the way to ${goal.exerciseName || 'your goal'}! Keep it up! 💪`,
    50: `Halfway there! ${goal.exerciseName || 'Your goal'} is within reach! 🔥`,
    75: `75% complete! You're crushing it! 🚀`,
    90: `Almost there! Just 10% more to ${goal.exerciseName || 'your goal'}! 🎯`,
    100: `🎉 GOAL ACHIEVED! ${goal.exerciseName || 'Your goal'} is complete! Congratulations! 🏆`
  }

  return messages[milestone] || `Milestone ${milestone}% reached!`
}

/**
 * Get next milestone for goal
 * @param {number} currentProgress - Current progress percentage
 * @param {Array<number>} reachedMilestones - Already reached milestones
 * @returns {number|null} Next milestone threshold
 */
export function getNextMilestone(currentProgress, reachedMilestones = []) {
  for (const threshold of MILESTONE_THRESHOLDS) {
    if (currentProgress < threshold && !reachedMilestones.includes(threshold)) {
      return threshold
    }
  }

  return null
}
```

---

## 6. Integration Points

### 6.1 Store Integration

**goalsStore → workoutStore** (read-only):
```javascript
// In goalsStore.js
import { useWorkoutStore } from './workoutStore'

const workoutStore = useWorkoutStore()

// Access workout data
const workouts = workoutStore.completedWorkouts

// Watch for new workouts
watch(
  () => workoutStore.workouts.length,
  (newLength, oldLength) => {
    if (newLength > oldLength) {
      updateAllGoalProgress()
    }
  }
)
```

**goalsStore → authStore** (read-only):
```javascript
// In goalsStore.js
import { useAuthStore } from './authStore'

const authStore = useAuthStore()

// Use userId for queries
const userId = authStore.userId

// Watch auth state
watch(
  () => authStore.userId,
  (newUserId) => {
    if (newUserId) {
      subscribeToGoals()
    } else {
      cleanup()
      goals.value = []
    }
  },
  { immediate: true }
)
```

**goalsStore → exerciseStore** (read-only):
```javascript
// In goalsStore.js (future enhancement)
import { useExerciseStore } from './exerciseStore'

const exerciseStore = useExerciseStore()

// Get exercise metadata
const exercise = exerciseStore.exercises.find(e => e.name === goalData.exerciseName)
```

### 6.2 Router Integration

**New Routes**:
```javascript
// src/router/index.js

import { routes as existingRoutes } from './existing'

export const routes = [
  ...existingRoutes,

  // Goals routes
  {
    path: '/goals',
    name: 'Goals',
    component: () => import('@/pages/goals/GoalsView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Goals'
    }
  },
  {
    path: '/goals/:id',
    name: 'GoalDetail',
    component: () => import('@/pages/goals/GoalDetailView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Goal Detail'
    },
    props: true // Pass route params as props
  }
]
```

**Navigation Integration**:
```javascript
// src/layouts/AppSidebar.vue

import { Target } from 'lucide-vue-next'
import { useGoalsStore } from '@/stores/goalsStore'
import { storeToRefs } from 'pinia'

const goalsStore = useGoalsStore()
const { activeGoals } = storeToRefs(goalsStore)

const navigationItems = [
  // ... existing items
  {
    name: 'Goals',
    route: '/goals',
    icon: Target,
    badge: computed(() => activeGoals.value.length) // Dynamic badge count
  }
]
```

### 6.3 Composables Integration

**useUnits Composable** (weight conversion):
```javascript
// In components
import { useUnits } from '@/composables/useUnits'

const { formatWeight, toStorageUnit, fromStorageUnit } = useUnits()

// Display goal target with user's preferred unit
const displayTarget = formatWeight(goal.targetWeight, { precision: 0 })

// Convert user input to kg for storage
const targetInKg = toStorageUnit(userInputWeight)
```

**useI18n Composable** (translations):
```javascript
// In components
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

// Translate goal status
const statusLabel = t(`goals.status.${goal.status}`)

// Translate goal type
const typeLabel = t(`goals.types.${goal.type}`)
```

---

## 7. Real-time Updates

### 7.1 Firestore Subscription Pattern

**Subscribe on mount**:
```javascript
// In GoalsView.vue
import { useGoalsStore } from '@/stores/goalsStore'
import { onMounted, onUnmounted } from 'vue'

const goalsStore = useGoalsStore()

onMounted(() => {
  goalsStore.subscribeToGoals()
})

onUnmounted(() => {
  goalsStore.cleanup()
})
```

**Store handles subscription**:
```javascript
// In goalsStore.js
function subscribeToGoals() {
  if (!authStore.userId) return

  unsubscribe = subscribeToCollection(
    COLLECTIONS.GOALS,
    {
      where: [['userId', '==', authStore.userId]],
      orderBy: [['createdAt', 'desc']]
    },
    (data) => {
      // Real-time updates from Firestore
      goals.value = data
    },
    (err) => {
      handleError(err, 'Goal subscription error')
    }
  )
}
```

### 7.2 Auto-update on Workout Add

**Watcher in goalsStore**:
```javascript
watch(
  () => workoutStore.workouts.length,
  (newLength, oldLength) => {
    if (newLength > oldLength) {
      // New workout added - update all goal progress
      nextTick(() => {
        updateAllGoalProgress()
      })
    }
  }
)

function updateAllGoalProgress() {
  checkMilestones()
  checkAutoCompletions()
}
```

### 7.3 Optimistic Updates

**Create goal with optimistic UI**:
```javascript
// In GoalWizard.vue
async function handleCreateGoal(goalData) {
  // Optimistic update
  const tempId = `temp-${Date.now()}`
  const tempGoal = { ...goalData, id: tempId, status: 'pending' }

  // Show in UI immediately
  goals.value.unshift(tempGoal)

  try {
    // Persist to Firestore
    const docId = await goalsStore.createGoal(goalData)

    // Replace temp with real
    const index = goals.value.findIndex(g => g.id === tempId)
    if (index !== -1) {
      goals.value.splice(index, 1)
    }
  } catch (err) {
    // Rollback on error
    const index = goals.value.findIndex(g => g.id === tempId)
    if (index !== -1) {
      goals.value.splice(index, 1)
    }

    throw err
  }
}
```

---

## 8. Performance Strategy

### 8.1 Computed Properties (Memoization)

**Why Computed**:
- Vue caches computed values
- Only recalculates when dependencies change
- Prevents expensive recalculations on every render

**Example**:
```javascript
// ✅ GOOD - Computed (memoized)
const strengthGoalProgress = computed(() => {
  return strengthGoals.value.map(goal => {
    return calculateStrengthProgress(goal, workoutStore.completedWorkouts)
  })
})

// ❌ BAD - Function (recalculates every time)
function getStrengthGoalProgress() {
  return strengthGoals.value.map(goal => {
    return calculateStrengthProgress(goal, workoutStore.completedWorkouts)
  })
}
```

### 8.2 Exercise Lookup Optimization

**Problem**: Finding exercises by name is O(n) for each goal.

**Solution**: Build a Map for O(1) lookup.

```javascript
// In progressCalculator.js
function buildExerciseMap(workouts) {
  const map = new Map()

  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      if (!map.has(exercise.name)) {
        map.set(exercise.name, [])
      }
      map.get(exercise.name).push({
        date: workout.createdAt,
        sets: exercise.sets
      })
    })
  })

  return map
}

export function calculateStrengthProgress(goal, workouts) {
  const exerciseMap = buildExerciseMap(workouts)
  const relevantExercises = exerciseMap.get(goal.exerciseName) || []

  // O(1) lookup instead of O(n) filter
  // ...
}
```

### 8.3 Chart Data Downsampling

**Problem**: Rendering 100+ data points slows charts.

**Solution**: Downsample to max 50 points for charts.

```javascript
// In GoalProgressChart.vue
const chartData = computed(() => {
  const fullHistory = goalProgress.value.progressHistory

  if (fullHistory.length <= 50) {
    return fullHistory
  }

  // Downsample
  const step = Math.ceil(fullHistory.length / 50)
  return fullHistory.filter((_, i) => i % step === 0)
})
```

### 8.4 Lazy Loading & Code Splitting

**Route-level code splitting**:
```javascript
// Routes already use dynamic imports
{
  path: '/goals',
  component: () => import('@/pages/goals/GoalsView.vue') // Lazy loaded
}
```

**Component-level lazy loading**:
```vue
<script setup>
// Heavy chart component - lazy load
const GoalProgressChart = defineAsyncComponent(() =>
  import('./components/detail/GoalProgressChart.vue')
)
</script>

<template>
  <Suspense>
    <template #default>
      <GoalProgressChart :goal="goal" />
    </template>
    <template #fallback>
      <div>Loading chart...</div>
    </template>
  </Suspense>
</template>
```

### 8.5 Virtual Scrolling (Future)

**If user has 50+ goals**:
```vue
<script setup>
import { useVirtualList } from '@vueuse/core'

const { list, containerProps, wrapperProps } = useVirtualList(
  goals,
  { itemHeight: 200 }
)
</script>

<template>
  <div v-bind="containerProps" class="goals-container">
    <div v-bind="wrapperProps">
      <GoalCard
        v-for="{ data: goal, index } in list"
        :key="goal.id"
        :goal="goal"
      />
    </div>
  </div>
</template>
```

---

## 9. State Management Flow

### 9.1 Create Goal Flow

```
User (GoalWizard)
  │
  ├──> Step 1: Select Type (strength)
  ├──> Step 2: Enter Exercise Name
  ├──> Step 3: Enter Target Weight
  ├──> Step 4: Select Deadline
  └──> Step 5: Review & Submit
        │
        ▼
  goalsStore.createGoal(goalData)
        │
        ├──> validateGoal(goalData, workouts)
        │     └──> Returns { valid, errors, warnings }
        │
        ├──> If valid:
        │     │
        │     ├──> Add userId, status, timestamps
        │     │
        │     └──> createDocument(COLLECTIONS.GOALS, newGoal)
        │           │
        │           └──> Firestore
        │                 │
        │                 └──> onSnapshot() listener
        │                       │
        │                       └──> Update goals.value
        │                             │
        │                             └──> UI re-renders (new goal appears)
        │
        └──> If invalid:
              └──> Throw error → Display validation errors in wizard
```

### 9.2 Auto-update Progress Flow

```
User logs workout
  │
  └──> workoutStore.createWorkout(workoutData)
        │
        └──> Firestore writes workout
              │
              └──> workoutStore.workouts updates (reactive)
                    │
                    └──> Triggers watcher in goalsStore
                          │
                          watch(() => workoutStore.workouts.length)
                          │
                          └──> updateAllGoalProgress()
                                │
                                ├──> checkMilestones()
                                │     │
                                │     ├──> Calculate new progress
                                │     ├──> Detect milestones [25, 50, 75, 90, 100]
                                │     ├──> If new milestone reached:
                                │     │     │
                                │     │     └──> updateGoal(goalId, { milestonesReached })
                                │     │           │
                                │     │           └──> Firestore update
                                │     │                 │
                                │     │                 └──> UI shows celebration 🎉
                                │     │
                                │     └──> Return
                                │
                                └──> checkAutoCompletions()
                                      │
                                      ├──> If strength goal at 100%:
                                      │     │
                                      │     └──> completeGoal(goalId)
                                      │           │
                                      │           └──> Firestore update { status: 'completed' }
                                      │                 │
                                      │                 └──> UI shows completed badge
                                      │
                                      └──> If deadline passed & progress <100%:
                                            │
                                            └──> failGoal(goalId)
                                                  │
                                                  └──> Firestore update { status: 'failed' }
```

### 9.3 Goal Detail View Flow

```
User clicks goal card
  │
  └──> Navigate to /goals/:id
        │
        └──> GoalDetailView.vue loads
              │
              ├──> Get goal from route params
              │     │
              │     └──> const goalId = route.params.id
              │
              ├──> Find goal in goalsStore
              │     │
              │     └──> const goal = allGoalProgress.value.find(g => g.id === goalId)
              │
              ├──> Compute detailed data
              │     │
              │     ├──> progressHistory (all workouts with this exercise)
              │     ├──> trend (linear regression)
              │     ├──> prediction (when will goal complete?)
              │     └──> requiredPace (how much per week to stay on track?)
              │
              └──> Render components
                    │
                    ├──> GoalDetailHeader (title, progress ring, status)
                    ├──> GoalProgressChart (line chart with trend + projection)
                    ├──> GoalPredictions ("At current pace, you'll reach on...")
                    ├──> GoalWorkoutHistory (table of workouts)
                    └──> GoalMilestones (timeline 25% → 50% → 75% → 90% → 100%)
```

---

## 10. API Layer

### 10.1 Firebase Operations

**All Firebase operations use existing service layer**:
```javascript
// src/firebase/firestore.js (existing)
export async function fetchCollection(collectionName, options) { /* ... */ }
export async function createDocument(collectionName, data) { /* ... */ }
export async function updateDocument(collectionName, docId, data) { /* ... */ }
export async function deleteDocument(collectionName, docId) { /* ... */ }
export function subscribeToCollection(collectionName, options, onUpdate, onError) { /* ... */ }

export const COLLECTIONS = {
  WORKOUTS: 'workouts',
  USERS: 'users',
  GOALS: 'goals' // NEW
}
```

**No direct Firestore calls in components or stores** - always use service layer.

### 10.2 Error Handling Strategy

**Error Categories**:
1. **Validation errors** - Caught in wizard, shown to user
2. **Network errors** - Retry logic, offline support
3. **Permission errors** - Security rules violations
4. **Unknown errors** - Logged for debugging

**Error Handling in Store**:
```javascript
// In goalsStore.js
async function createGoal(goalData) {
  try {
    const docId = await createDocument(COLLECTIONS.GOALS, newGoal)
    return docId
  } catch (err) {
    // Categorize error
    if (err.code === 'permission-denied') {
      handleError(err, 'Permission denied. Please check your account.', { category: 'permission' })
    } else if (err.code === 'unavailable') {
      handleError(err, 'Network error. Please check your connection.', { category: 'network' })
    } else {
      handleError(err, 'Failed to create goal. Please try again.', { category: 'unknown' })
    }

    throw err // Re-throw for component to handle
  }
}
```

**Error Display in Components**:
```vue
<script setup>
import { ref } from 'vue'
import { useGoalsStore } from '@/stores/goalsStore'
import { useToast } from '@/components/ui/toast/use-toast'

const goalsStore = useGoalsStore()
const { toast } = useToast()
const loading = ref(false)

async function handleSubmit(goalData) {
  loading.value = true

  try {
    await goalsStore.createGoal(goalData)

    toast({
      title: 'Goal created!',
      description: 'Your goal has been successfully created.',
      variant: 'success'
    })

    emit('close')
  } catch (err) {
    toast({
      title: 'Error',
      description: err.message,
      variant: 'destructive'
    })
  } finally {
    loading.value = false
  }
}
</script>
```

---

## 11. Security & Access Control

### 11.1 Firestore Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Goals collection
    match /goals/{goalId} {
      // Users can only read their own goals
      allow read: if request.auth != null
                  && resource.data.userId == request.auth.uid;

      // Users can only create goals for themselves
      allow create: if request.auth != null
                    && request.resource.data.userId == request.auth.uid
                    && request.resource.data.keys().hasAll([
                      'userId', 'type', 'status', 'createdAt', 'updatedAt'
                    ]);

      // Users can only update their own goals
      allow update: if request.auth != null
                    && resource.data.userId == request.auth.uid
                    && request.resource.data.userId == request.auth.uid; // Prevent userId change

      // Users can only delete their own goals
      allow delete: if request.auth != null
                    && resource.data.userId == request.auth.uid;
    }
  }
}
```

### 11.2 Client-side Access Control

**Store automatically filters by userId**:
```javascript
// In goalsStore.js
async function fetchGoals() {
  const data = await fetchCollection(COLLECTIONS.GOALS, {
    where: [['userId', '==', authStore.userId]] // Automatic user filtering
  })

  goals.value = data
}
```

**No manual userId checks needed in components** - store handles it.

---

## 12. Testing Strategy

### 12.1 Store Unit Tests

```javascript
// src/stores/__tests__/goalsStore.spec.js
import { setActivePinia, createPinia } from 'pinia'
import { useGoalsStore } from '@/stores/goalsStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useAuthStore } from '@/stores/authStore'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock Firebase
vi.mock('@/firebase/firestore', () => ({
  fetchCollection: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
  subscribeToCollection: vi.fn(),
  COLLECTIONS: { GOALS: 'goals', WORKOUTS: 'workouts' }
}))

// Mock auth
vi.mock('@/firebase/auth', () => ({
  onAuthChange: vi.fn()
}))

describe('goalsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Strength Goal Progress', () => {
    it('should calculate 1RM and progress correctly', () => {
      const goalsStore = useGoalsStore()
      const workoutStore = useWorkoutStore()

      // Setup mock data
      goalsStore.goals = [{
        id: 'goal1',
        type: 'strength',
        exerciseName: 'Bench Press',
        targetWeight: 100,
        currentWeight: 80,
        startDate: '2026-01-01',
        deadline: '2026-04-01',
        status: 'active'
      }]

      workoutStore.workouts = [{
        createdAt: '2026-01-15',
        exercises: [{
          name: 'Bench Press',
          sets: [
            { weight: 85, reps: 5 },
            { weight: 85, reps: 5 },
            { weight: 85, reps: 4 }
          ]
        }]
      }]

      // Calculate progress
      const progress = goalsStore.strengthGoalProgress

      expect(progress).toHaveLength(1)
      expect(progress[0].current1RM).toBeGreaterThan(80)
      expect(progress[0].current1RM).toBeLessThan(100)
      expect(progress[0].progressPercent).toBeGreaterThan(0)
      expect(progress[0].progressPercent).toBeLessThan(100)
    })

    it('should detect "on-track" status correctly', () => {
      // Test status logic
      const goalsStore = useGoalsStore()

      goalsStore.goals = [{
        id: 'goal1',
        type: 'strength',
        exerciseName: 'Bench Press',
        targetWeight: 100,
        currentWeight: 80,
        startDate: '2026-01-01',
        deadline: '2026-04-01',
        status: 'active'
      }]

      const progress = goalsStore.strengthGoalProgress[0]

      expect(['on-track', 'ahead', 'behind', 'at-risk']).toContain(progress.status)
    })

    it('should auto-complete goal at 100%', async () => {
      const goalsStore = useGoalsStore()
      const workoutStore = useWorkoutStore()

      goalsStore.goals = [{
        id: 'goal1',
        type: 'strength',
        exerciseName: 'Bench Press',
        targetWeight: 100,
        currentWeight: 95,
        startDate: '2026-01-01',
        deadline: '2026-04-01',
        status: 'active'
      }]

      // Add workout that achieves goal
      workoutStore.workouts.push({
        createdAt: '2026-02-01',
        exercises: [{
          name: 'Bench Press',
          sets: [
            { weight: 100, reps: 3 },
            { weight: 100, reps: 2 },
            { weight: 100, reps: 1 }
          ]
        }]
      })

      // Trigger watcher (manual call for testing)
      goalsStore.updateAllGoalProgress()

      // Assert goal completed
      expect(goalsStore.goals[0].status).toBe('completed')
    })
  })

  describe('Volume Goal Progress', () => {
    it('should calculate weekly volume correctly', () => {
      // Test volume aggregation
    })

    it('should reset progress at period boundaries', () => {
      // Test weekly/monthly reset
    })
  })

  describe('Goal Validation', () => {
    it('should reject goal with target < current', async () => {
      const goalsStore = useGoalsStore()

      const invalidGoal = {
        type: 'strength',
        exerciseName: 'Bench Press',
        targetWeight: 80, // Less than current
        currentWeight: 90,
        deadline: '2026-04-01'
      }

      await expect(goalsStore.createGoal(invalidGoal)).rejects.toThrow()
    })

    it('should warn on unrealistic goals', () => {
      // Test warning logic
    })
  })
})
```

### 12.2 Utility Unit Tests

```javascript
// src/utils/__tests__/progressCalculator.spec.js
import { calculateStrengthProgress, calculateVolumeProgress } from '@/utils/progressCalculator'
import { describe, it, expect } from 'vitest'

describe('progressCalculator', () => {
  describe('calculateStrengthProgress', () => {
    it('should return zero progress with no workouts', () => {
      const goal = {
        exerciseName: 'Bench Press',
        targetWeight: 100,
        currentWeight: 80
      }

      const result = calculateStrengthProgress(goal, [])

      expect(result.current1RM).toBe(80)
      expect(result.progressPercent).toBe(0)
      expect(result.progressHistory).toEqual([])
    })

    it('should calculate progress from multiple workouts', () => {
      const goal = {
        exerciseName: 'Bench Press',
        targetWeight: 100,
        currentWeight: 80
      }

      const workouts = [
        {
          createdAt: '2026-01-01',
          exercises: [{ name: 'Bench Press', sets: [{ weight: 80, reps: 5 }] }]
        },
        {
          createdAt: '2026-01-08',
          exercises: [{ name: 'Bench Press', sets: [{ weight: 85, reps: 5 }] }]
        },
        {
          createdAt: '2026-01-15',
          exercises: [{ name: 'Bench Press', sets: [{ weight: 90, reps: 5 }] }]
        }
      ]

      const result = calculateStrengthProgress(goal, workouts)

      expect(result.progressHistory).toHaveLength(3)
      expect(result.current1RM).toBeGreaterThan(80)
      expect(result.progressPercent).toBeGreaterThan(0)
      expect(result.trend).toBeDefined()
      expect(result.trend.slope).toBeGreaterThan(0) // Positive trend
    })
  })
})
```

### 12.3 Component Integration Tests

```javascript
// src/pages/goals/components/__tests__/GoalCard.spec.js
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import GoalCard from '../GoalCard.vue'

describe('GoalCard', () => {
  it('should render strength goal correctly', () => {
    const wrapper = mount(GoalCard, {
      props: {
        goal: {
          id: 'goal1',
          type: 'strength',
          exerciseName: 'Bench Press',
          targetWeight: 100,
          current1RM: 85,
          progressPercent: 85,
          status: 'on-track',
          daysRemaining: 30
        }
      },
      global: {
        plugins: [createTestingPinia()]
      }
    })

    expect(wrapper.text()).toContain('Bench Press')
    expect(wrapper.text()).toContain('100')
    expect(wrapper.text()).toContain('85%')
  })

  it('should emit view-detail when clicked', async () => {
    const wrapper = mount(GoalCard, {
      props: {
        goal: {
          id: 'goal1',
          type: 'strength',
          exerciseName: 'Bench Press',
          targetWeight: 100,
          progressPercent: 50,
          status: 'on-track'
        }
      },
      global: {
        plugins: [createTestingPinia()]
      }
    })

    await wrapper.trigger('click')

    expect(wrapper.emitted('view-detail')).toBeTruthy()
    expect(wrapper.emitted('view-detail')[0]).toEqual(['goal1'])
  })
})
```

---

## 13. Migration & Rollout

### 13.1 Implementation Phases

**Phase 1: Foundation (Week 1)**
- ✅ Create Firestore `goals` collection
- ✅ Implement goalsStore.js skeleton
- ✅ Add COLLECTIONS.GOALS constant
- ✅ Write utility files (goalUtils, progressCalculator, goalValidation)
- ✅ Add unit tests for utilities

**Phase 2: Strength Goals (Week 2)**
- ✅ Implement strength goal creation wizard
- ✅ Implement strengthGoalProgress computed property
- ✅ Create GoalCard component
- ✅ Create GoalsView page
- ✅ Add /goals route
- ✅ Test strength goal creation + progress tracking

**Phase 3: Volume Goals (Week 3)**
- ✅ Implement volume goal creation wizard
- ✅ Implement volumeGoalProgress computed property
- ✅ Test volume goal tracking
- ✅ Add volume-specific UI elements

**Phase 4: Goal Detail View (Week 4)**
- ✅ Create GoalDetailView page
- ✅ Implement GoalProgressChart component
- ✅ Add trend line + predictions
- ✅ Test detail view navigation

**Phase 5: Polish & Testing (Week 5)**
- ✅ Add milestone celebrations
- ✅ Implement auto-completion logic
- ✅ Add empty states
- ✅ E2E testing with Playwright
- ✅ Performance testing
- ✅ Beta rollout to 10-20 users

### 13.2 Feature Flag

**Enable gradual rollout**:
```javascript
// src/constants/config.js
export const FEATURE_FLAGS = {
  GOALS_ENABLED: import.meta.env.VITE_GOALS_ENABLED === 'true'
}

// In AppSidebar.vue
import { FEATURE_FLAGS } from '@/constants/config'

const navigationItems = computed(() => [
  // ... existing items
  ...(FEATURE_FLAGS.GOALS_ENABLED ? [{
    name: 'Goals',
    route: '/goals',
    icon: Target
  }] : [])
])
```

**Environment Variables**:
```bash
# .env.local
VITE_GOALS_ENABLED=true  # Enable for beta users
```

---

## 14. Appendices

### A. Firestore Collection Example

```json
{
  "goals": {
    "goal-abc123": {
      "userId": "user-xyz789",
      "type": "strength",
      "status": "active",
      "exerciseName": "Bench Press",
      "targetWeight": 100,
      "targetWeightUnit": "kg",
      "currentWeight": 80,
      "startDate": "2026-01-02",
      "deadline": "2026-04-02",
      "notes": "Summer goal!",
      "milestonesReached": [25, 50],
      "createdAt": "2026-01-02T10:00:00Z",
      "updatedAt": "2026-01-20T14:30:00Z"
    },
    "goal-def456": {
      "userId": "user-xyz789",
      "type": "volume",
      "status": "active",
      "volumeType": "muscle-group",
      "muscleGroup": "chest",
      "target": 10000,
      "targetUnit": "kg",
      "period": "week",
      "currentVolume": 8500,
      "startDate": "2026-01-02",
      "achievementStreak": 3,
      "lastAchievedAt": "2026-01-27T23:59:00Z",
      "createdAt": "2026-01-02T11:00:00Z",
      "updatedAt": "2026-01-27T23:59:00Z"
    }
  }
}
```

### B. i18n Keys

```json
{
  "goals": {
    "title": "Цілі",
    "createGoal": "Створити ціль",
    "noGoals": "У вас ще немає цілей",
    "types": {
      "strength": "Сила",
      "volume": "Об'єм",
      "frequency": "Частота",
      "streak": "Стрік"
    },
    "status": {
      "active": "Активна",
      "completed": "Досягнута",
      "on-track": "По плану",
      "ahead": "Попереду",
      "behind": "Відстаєте",
      "at-risk": "Під загрозою"
    }
  }
}
```

### C. Color Palette

```css
/* Goal status colors */
--goal-on-track: hsl(var(--success));
--goal-ahead: hsl(var(--primary));
--goal-behind: hsl(var(--warning));
--goal-at-risk: hsl(var(--destructive));
--goal-completed: hsl(var(--success));

/* Goal type colors (for icons) */
--goal-strength: hsl(var(--chart-1));
--goal-volume: hsl(var(--chart-2));
--goal-frequency: hsl(var(--chart-3));
--goal-streak: hsl(var(--chart-4));
```

---

## Conclusion

This architecture document provides a complete blueprint for implementing the Goals feature in the Obsessed gym tracking app. The design follows all existing project patterns (Pinia setup stores, Firebase service layer, Vue 3 Composition API) while introducing new capabilities for goal tracking and progress management.

**Key Architectural Decisions**:
1. **Progress is computed, not stored** - Ensures data accuracy, leverages Vue's reactivity
2. **Unidirectional dependencies** - Goals read from workouts, never write
3. **Type-safe discriminated unions** - Single `goals` collection with `type` field
4. **Service layer abstraction** - All Firebase ops through firestore.js
5. **Memoization via computed** - Performance optimization built-in

**Next Steps**:
1. Review this architecture with team
2. Create implementation tasks (see Migration & Rollout section)
3. Begin Phase 1: Foundation
4. Iterative development following 5-week plan

---

**Document Status**: ✅ Architecture Design Complete
**Implementation Status**: ❌ Not Started
**Ready for Development**: ✅ Yes
