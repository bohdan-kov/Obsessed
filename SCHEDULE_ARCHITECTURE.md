# Schedule Section - Technical Architecture

**Version**: 1.0
**Date**: 2026-01-10
**Related Documents**:
- [SCHEDULE_PRD.md](./SCHEDULE_PRD.md) - Product Requirements
- [CLAUDE.md](./CLAUDE.md) - Project Guidelines
- [ANALYTICS_ARCHITECTURE.md](./ANALYTICS_ARCHITECTURE.md) - Reference Pattern

---

## Table of Contents

1. [Module Overview](#1-module-overview)
2. [Data Architecture](#2-data-architecture)
3. [Store Architecture](#3-store-architecture)
4. [Component Architecture](#4-component-architecture)
5. [Composables Strategy](#5-composables-strategy)
6. [Utility Functions Organization](#6-utility-functions-organization)
7. [i18n Integration](#7-i18n-integration)
8. [Route Configuration](#8-route-configuration)
9. [Implementation Phases](#9-implementation-phases)
10. [Code Reuse Strategy](#10-code-reuse-strategy)
11. [Testing Architecture](#11-testing-architecture)
12. [Performance Considerations](#12-performance-considerations)
13. [Mobile Responsiveness Strategy](#13-mobile-responsiveness-strategy)
14. [Success Metrics](#14-success-metrics)
15. [Implementation Checklist](#15-implementation-checklist)

---

## 1. Module Overview

### Purpose

The Schedule module transforms Obsessed from a **reactive tracking tool** into a **proactive training companion**. It answers strategic planning questions:
- "What should I train today?"
- "Am I following my program consistently?"
- "How do I quickly start my planned workout?"
- "Is my training split balanced?"

### Core Philosophy

**Reduce friction between planning and execution.** Every tap saved is a PR gained. The gym is not a place for complex UI - workouts should start in <30 seconds.

### Module Boundaries

**IN SCOPE**:
- Workout template CRUD (create, edit, delete, duplicate)
- Pre-built split presets (PPL, Upper/Lower, Bro Split, Full Body)
- Weekly schedule calendar (7-day view with day-by-day assignments)
- Template assignment to days (drag-drop desktop, tap mobile)
- Quick Start (1-tap workout launch with pre-loaded exercises/weights)
- Adherence tracking (completion %, streak)
- Rest day intelligence (muscle recovery warnings)

**OUT OF SCOPE (for MVP)**:
- Workout reminders/notifications (V1.2)
- Adaptive rescheduling (V1.2)
- Template sharing/community library (V2)
- Periodization support (macrocycles/mesocycles) (V2)

### Differentiation from Existing Features

| Feature | Dashboard | Analytics | **Schedule** |
|---------|-----------|-----------|--------------|
| **Time Focus** | Past (what happened) | Past (trends) | **Future (what to do)** |
| **Primary Question** | "How did I do?" | "Am I progressing?" | **"What should I train today?"** |
| **Data Type** | Completed workouts | Historical analysis | **Planned workouts** |
| **User Action** | View stats | Analyze trends | **Start workout** |
| **Value Prop** | Motivation | Insights | **Efficiency (save time)** |

---

## 2. Data Architecture

### Firestore Collections

#### workoutTemplates Collection

```
users/{userId}/workoutTemplates/{templateId}
```

```typescript
interface WorkoutTemplate {
  id: string                    // Auto-generated UUID
  name: string                  // "Push Day A", "Legs Heavy"
  description: string           // Optional user notes
  exercises: TemplateExercise[]
  muscleGroups: string[]        // Auto-computed from exercises
  estimatedDuration: number     // Minutes (auto-calculated)
  createdAt: Timestamp
  updatedAt: Timestamp
  lastUsedAt: Timestamp | null
  usageCount: number            // Incremented on Quick Start
  sourcePresetId: string | null // e.g., "ppl-6x" if from preset
}

interface TemplateExercise {
  exerciseId: string            // Reference to exercise in exerciseStore
  exerciseName: string          // Denormalized for quick display
  sets: number                  // Target sets
  reps: number                  // Target reps
  targetWeight: number | null   // Optional target weight (kg)
  restTime: number              // Seconds between sets
  notes: string                 // Optional exercise notes
}
```

**Example Document**:

```json
{
  "id": "template-abc123",
  "name": "Push Day A",
  "description": "Chest, shoulders, triceps focus",
  "exercises": [
    {
      "exerciseId": "bench-press",
      "exerciseName": "Bench Press",
      "sets": 4,
      "reps": 8,
      "targetWeight": 100,
      "restTime": 120,
      "notes": "Focus on form, pause at bottom"
    },
    {
      "exerciseId": "incline-dumbbell-press",
      "exerciseName": "Incline Dumbbell Press",
      "sets": 3,
      "reps": 10,
      "targetWeight": null,
      "restTime": 90,
      "notes": ""
    }
  ],
  "muscleGroups": ["chest", "shoulders", "triceps"],
  "estimatedDuration": 75,
  "createdAt": "2026-01-10T10:00:00Z",
  "updatedAt": "2026-01-10T10:00:00Z",
  "lastUsedAt": "2026-01-10T18:30:00Z",
  "usageCount": 5,
  "sourcePresetId": "ppl-6x"
}
```

---

#### schedules Collection

```
users/{userId}/schedules/{weekId}
```

**Week ID Format**: ISO 8601 week format `YYYY-Www` (e.g., `2026-W02`)

```typescript
interface WeeklySchedule {
  id: string                    // ISO week: "2026-W02"
  userId: string
  weekStart: Timestamp          // Monday 00:00:00
  days: {
    monday: DaySchedule
    tuesday: DaySchedule
    wednesday: DaySchedule
    thursday: DaySchedule
    friday: DaySchedule
    saturday: DaySchedule
    sunday: DaySchedule
  }
  createdAt: Timestamp
  updatedAt: Timestamp
}

interface DaySchedule {
  templateId: string | null     // Reference to workoutTemplates
  templateName: string | null   // Denormalized for quick display
  muscleGroups: string[]        // Denormalized from template
  completed: boolean            // True if workout logged today
  workoutId: string | null      // Reference to completed workout
}
```

**Example Document**:

```json
{
  "id": "2026-W02",
  "userId": "user-xyz",
  "weekStart": "2026-01-06T00:00:00Z",
  "days": {
    "monday": {
      "templateId": "template-push-a",
      "templateName": "Push Day A",
      "muscleGroups": ["chest", "shoulders", "triceps"],
      "completed": true,
      "workoutId": "workout-123"
    },
    "tuesday": {
      "templateId": "template-pull-a",
      "templateName": "Pull Day A",
      "muscleGroups": ["back", "biceps"],
      "completed": false,
      "workoutId": null
    },
    "wednesday": {
      "templateId": null,
      "templateName": null,
      "muscleGroups": [],
      "completed": false,
      "workoutId": null
    }
  },
  "createdAt": "2026-01-06T08:00:00Z",
  "updatedAt": "2026-01-10T19:00:00Z"
}
```

---

#### Modified workouts Collection

Extend existing workout model to link to templates:

```typescript
interface Workout {
  // ... existing fields (id, userId, createdAt, duration, exercises, etc.)

  // NEW FIELDS
  templateId: string | null     // Link to template (if started from template)
  templateName: string | null   // Denormalized for display
}
```

**Migration Note**: These are optional fields added to existing workouts. Old workouts without `templateId` will have `null`.

---

### Data Denormalization Strategy

**Why Denormalize?**
- **Offline support**: Schedule displays template names without fetching full template
- **Performance**: Reduce Firestore reads (no need to fetch template for every day)
- **Data integrity**: If template is deleted, schedule still shows original name

**What is Denormalized?**
1. `templateName` in `DaySchedule` (from `workoutTemplates.name`)
2. `muscleGroups` in `DaySchedule` (from `workoutTemplates.muscleGroups`)
3. `exerciseName` in `TemplateExercise` (from `exercises` collection)

**Update Strategy**:
- When template is edited: Update denormalized data in FUTURE schedules only
- Past schedules remain unchanged (historical accuracy)

---

### Data Consistency Rules

1. **Template Deletion**:
   - Soft delete: Add `deleted: true` field to template
   - Schedule shows "(Deleted)" in UI but keeps `templateId`
   - Alternative: Hard delete template but keep denormalized name in schedule

2. **Workout Completion Sync**:
   - When workout is saved in `workoutStore`:
     - Update `schedules/{weekId}.days.{dayName}.completed = true`
     - Update `schedules/{weekId}.days.{dayName}.workoutId = workoutId`
   - This sync happens in `workoutStore.saveWorkout()` action

3. **Template Usage Tracking**:
   - Increment `usageCount` when Quick Start is used
   - Update `lastUsedAt` timestamp
   - This happens in `scheduleStore.startWorkoutFromTemplate()` action

---

## 3. Store Architecture

### scheduleStore.js

**Location**: `src/stores/scheduleStore.js`

**Pattern**: Pinia setup store (function syntax) following CLAUDE.md guidelines

```javascript
// src/stores/scheduleStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchCollection,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument
} from '@/firebase/firestore'
import { useAuthStore } from './authStore'
import { useWorkoutStore } from './workoutStore'
import { useExerciseStore } from './exerciseStore'

export const useScheduleStore = defineStore('schedule', () => {
  const authStore = useAuthStore()
  const workoutStore = useWorkoutStore()
  const exerciseStore = useExerciseStore()

  // ============================================================
  // STATE
  // ============================================================

  const templates = ref([])               // All user's workout templates
  const currentSchedule = ref(null)       // Current week's schedule
  const scheduleCache = ref(new Map())    // Cache for schedules by weekId
  const loading = ref(false)
  const error = ref(null)

  // ============================================================
  // COMPUTED PROPERTIES
  // ============================================================

  /**
   * Templates grouped by primary muscle group
   */
  const templatesByMuscle = computed(() => {
    const groups = {}
    templates.value.forEach(t => {
      const primary = t.muscleGroups[0] || 'other'
      if (!groups[primary]) groups[primary] = []
      groups[primary].push(t)
    })
    return groups
  })

  /**
   * Templates sorted by usage (most used first)
   */
  const templatesByUsage = computed(() => {
    return [...templates.value].sort((a, b) => b.usageCount - a.usageCount)
  })

  /**
   * Templates sorted by last used (most recent first)
   */
  const recentTemplates = computed(() => {
    return [...templates.value]
      .filter(t => t.lastUsedAt)
      .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
      .slice(0, 5)
  })

  /**
   * Today's scheduled workout
   */
  const todaysWorkout = computed(() => {
    if (!currentSchedule.value) return null
    const today = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' })
    return currentSchedule.value.days[today]
  })

  /**
   * Current week adherence stats
   */
  const weekAdherence = computed(() => {
    if (!currentSchedule.value) return { completed: 0, planned: 0, percentage: 0 }

    const days = Object.values(currentSchedule.value.days)
    const planned = days.filter(d => d.templateId).length
    const completed = days.filter(d => d.completed).length

    return {
      completed,
      planned,
      percentage: planned > 0 ? Math.round((completed / planned) * 100) : 0
    }
  })

  // ============================================================
  // TEMPLATE ACTIONS
  // ============================================================

  /**
   * Fetch all workout templates for current user
   */
  async function fetchTemplates() {
    loading.value = true
    error.value = null
    try {
      const path = `users/${authStore.currentUser.uid}/workoutTemplates`
      templates.value = await fetchCollection(path)
      return templates.value
    } catch (err) {
      error.value = err.message
      console.error('Failed to fetch templates:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create new workout template
   */
  async function createTemplate(templateData) {
    loading.value = true
    error.value = null
    try {
      const path = `users/${authStore.currentUser.uid}/workoutTemplates`

      // Compute muscle groups from exercises
      const muscleGroups = computeMuscleGroups(templateData.exercises)

      // Estimate duration (exercises * 2.5 min average)
      const estimatedDuration = Math.round(templateData.exercises.length * 2.5)

      const newTemplate = {
        ...templateData,
        muscleGroups,
        estimatedDuration,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
        usageCount: 0
      }

      const docId = await createDocument(path, newTemplate)
      await fetchTemplates() // Refresh list
      return docId
    } catch (err) {
      error.value = err.message
      console.error('Failed to create template:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update existing template
   */
  async function updateTemplate(templateId, updates) {
    loading.value = true
    error.value = null
    try {
      const path = `users/${authStore.currentUser.uid}/workoutTemplates/${templateId}`

      // Recompute muscle groups if exercises changed
      if (updates.exercises) {
        updates.muscleGroups = computeMuscleGroups(updates.exercises)
        updates.estimatedDuration = Math.round(updates.exercises.length * 2.5)
      }

      await updateDocument(path, { ...updates, updatedAt: new Date() })
      await fetchTemplates()
    } catch (err) {
      error.value = err.message
      console.error('Failed to update template:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete template (soft delete or hard delete)
   */
  async function deleteTemplate(templateId) {
    loading.value = true
    error.value = null
    try {
      const path = `users/${authStore.currentUser.uid}/workoutTemplates/${templateId}`

      // Option 1: Soft delete (recommended)
      // await updateDocument(path, { deleted: true })

      // Option 2: Hard delete
      await deleteDocument(path)

      templates.value = templates.value.filter(t => t.id !== templateId)
    } catch (err) {
      error.value = err.message
      console.error('Failed to delete template:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Duplicate template
   */
  async function duplicateTemplate(templateId) {
    const original = templates.value.find(t => t.id === templateId)
    if (!original) throw new Error('Template not found')

    const duplicate = {
      name: `${original.name} (Copy)`,
      description: original.description,
      exercises: [...original.exercises],
      sourcePresetId: null // Clear preset reference for duplicates
    }

    return await createTemplate(duplicate)
  }

  // ============================================================
  // SCHEDULE ACTIONS
  // ============================================================

  /**
   * Fetch schedule for a given week
   */
  async function fetchScheduleForWeek(weekId) {
    loading.value = true
    error.value = null
    try {
      // Check cache first
      if (scheduleCache.value.has(weekId)) {
        currentSchedule.value = scheduleCache.value.get(weekId)
        loading.value = false
        return currentSchedule.value
      }

      const path = `users/${authStore.currentUser.uid}/schedules/${weekId}`
      let schedule = await getDocument(path)

      if (!schedule) {
        // Create empty schedule for this week
        schedule = await createEmptySchedule(weekId)
      }

      currentSchedule.value = schedule
      scheduleCache.value.set(weekId, schedule)

      return schedule
    } catch (err) {
      error.value = err.message
      console.error('Failed to fetch schedule:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create empty schedule for a week
   */
  async function createEmptySchedule(weekId) {
    const weekStart = getWeekStartDate(weekId)
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

    const emptySchedule = {
      id: weekId,
      userId: authStore.currentUser.uid,
      weekStart,
      days: {},
      createdAt: new Date(),
      updatedAt: new Date()
    }

    days.forEach(day => {
      emptySchedule.days[day] = {
        templateId: null,
        templateName: null,
        muscleGroups: [],
        completed: false,
        workoutId: null
      }
    })

    const path = `users/${authStore.currentUser.uid}/schedules/${weekId}`
    await createDocument(path, emptySchedule)

    return emptySchedule
  }

  /**
   * Assign template to a specific day
   */
  async function assignTemplateToDay(weekId, dayName, templateId) {
    loading.value = true
    error.value = null
    try {
      const template = templates.value.find(t => t.id === templateId)
      if (!template) throw new Error('Template not found')

      const path = `users/${authStore.currentUser.uid}/schedules/${weekId}`

      await updateDocument(path, {
        [`days.${dayName}`]: {
          templateId: template.id,
          templateName: template.name,
          muscleGroups: template.muscleGroups,
          completed: false,
          workoutId: null
        },
        updatedAt: new Date()
      })

      // Invalidate cache for this week
      scheduleCache.value.delete(weekId)

      // Refresh current schedule
      await fetchScheduleForWeek(weekId)
    } catch (err) {
      error.value = err.message
      console.error('Failed to assign template:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Remove template from day (make it a rest day)
   */
  async function removeTemplateFromDay(weekId, dayName) {
    await assignTemplateToDay(weekId, dayName, null)
  }

  /**
   * Mark day as completed (called after workout is saved)
   */
  async function markDayCompleted(weekId, dayName, workoutId) {
    try {
      const path = `users/${authStore.currentUser.uid}/schedules/${weekId}`

      await updateDocument(path, {
        [`days.${dayName}.completed`]: true,
        [`days.${dayName}.workoutId`]: workoutId,
        updatedAt: new Date()
      })

      // Invalidate cache
      scheduleCache.value.delete(weekId)
    } catch (err) {
      console.error('Failed to mark day completed:', err)
      throw err
    }
  }

  /**
   * Batch assign template to multiple days
   */
  async function assignTemplateToMultipleDays(weekId, dayNames, templateId) {
    loading.value = true
    error.value = null
    try {
      const template = templates.value.find(t => t.id === templateId)
      if (!template) throw new Error('Template not found')

      const path = `users/${authStore.currentUser.uid}/schedules/${weekId}`
      const updates = { updatedAt: new Date() }

      dayNames.forEach(dayName => {
        updates[`days.${dayName}`] = {
          templateId: template.id,
          templateName: template.name,
          muscleGroups: template.muscleGroups,
          completed: false,
          workoutId: null
        }
      })

      await updateDocument(path, updates)

      scheduleCache.value.delete(weekId)
      await fetchScheduleForWeek(weekId)
    } catch (err) {
      error.value = err.message
      console.error('Failed to assign template to multiple days:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================================
  // PRESET ACTIONS
  // ============================================================

  /**
   * Create templates from a preset split
   */
  async function createTemplatesFromPreset(preset) {
    loading.value = true
    error.value = null
    try {
      const templateIds = []

      for (const presetTemplate of preset.templates) {
        const templateData = {
          name: presetTemplate.name,
          description: presetTemplate.description || '',
          exercises: presetTemplate.exercises.map(ex => ({
            exerciseId: ex.exerciseId,
            exerciseName: exerciseStore.getExerciseById(ex.exerciseId)?.name || ex.exerciseId,
            sets: ex.sets,
            reps: ex.reps,
            targetWeight: ex.targetWeight || null,
            restTime: ex.restTime,
            notes: ex.notes || ''
          })),
          sourcePresetId: preset.id
        }

        const templateId = await createTemplate(templateData)
        templateIds.push(templateId)
      }

      return templateIds
    } catch (err) {
      error.value = err.message
      console.error('Failed to create templates from preset:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================================
  // QUICK START ACTION (CRITICAL FEATURE)
  // ============================================================

  /**
   * Start workout from template (pre-load exercises with last weights)
   */
  async function startWorkoutFromTemplate(templateId) {
    loading.value = true
    error.value = null
    try {
      const template = templates.value.find(t => t.id === templateId)
      if (!template) throw new Error('Template not found')

      // Fetch last weights for each exercise from workout history
      const exercisesWithWeights = await Promise.all(
        template.exercises.map(async (exercise) => {
          const lastWeight = await getLastWeightForExercise(exercise.exerciseId)

          return {
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            sets: Array(exercise.sets).fill(null).map(() => ({
              reps: exercise.reps,
              weight: lastWeight || exercise.targetWeight || null,
              completed: false
            })),
            notes: exercise.notes,
            restTime: exercise.restTime,
            lastWeight // For display ("Last: 100 kg")
          }
        })
      )

      // Create new workout via workoutStore
      await workoutStore.startWorkout({
        templateId: template.id,
        templateName: template.name,
        exercises: exercisesWithWeights
      })

      // Update template usage stats
      await updateTemplate(templateId, {
        lastUsedAt: new Date(),
        usageCount: template.usageCount + 1
      })

      return true
    } catch (err) {
      error.value = err.message
      console.error('Failed to start workout from template:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get last logged weight for an exercise
   */
  async function getLastWeightForExercise(exerciseId) {
    const recentWorkouts = workoutStore.workouts
      .slice(0, 10) // Last 10 workouts
      .flatMap(w => w.exercises)
      .filter(e => e.exerciseId === exerciseId)

    if (recentWorkouts.length === 0) return null

    const lastExercise = recentWorkouts[0]
    const weights = lastExercise.sets.map(s => s.weight).filter(Boolean)

    return weights.length > 0 ? Math.max(...weights) : null
  }

  // ============================================================
  // UTILITY FUNCTIONS
  // ============================================================

  /**
   * Get ISO week ID (e.g., "2026-W02")
   */
  function getWeekId(date = new Date()) {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + 4 - (d.getDay() || 7))
    const yearStart = new Date(d.getFullYear(), 0, 1)
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
    return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`
  }

  /**
   * Get week start date (Monday 00:00:00) from week ID
   */
  function getWeekStartDate(weekId) {
    const [year, week] = weekId.split('-W').map(Number)
    const jan4 = new Date(year, 0, 4)
    const monday = new Date(jan4)
    monday.setDate(jan4.getDate() - jan4.getDay() + 1 + (week - 1) * 7)
    monday.setHours(0, 0, 0, 0)
    return monday
  }

  /**
   * Compute muscle groups from exercises
   */
  function computeMuscleGroups(exercises) {
    const muscles = new Set()
    exercises.forEach(exercise => {
      const exerciseData = exerciseStore.getExerciseById(exercise.exerciseId)
      if (exerciseData && exerciseData.muscleGroups) {
        exerciseData.muscleGroups.forEach(m => muscles.add(m))
      }
    })
    return Array.from(muscles)
  }

  // ============================================================
  // EXPORTS
  // ============================================================

  return {
    // State
    templates,
    currentSchedule,
    loading,
    error,

    // Computed
    templatesByMuscle,
    templatesByUsage,
    recentTemplates,
    todaysWorkout,
    weekAdherence,

    // Template Actions
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,

    // Schedule Actions
    fetchScheduleForWeek,
    createEmptySchedule,
    assignTemplateToDay,
    removeTemplateFromDay,
    markDayCompleted,
    assignTemplateToMultipleDays,

    // Preset Actions
    createTemplatesFromPreset,

    // Quick Start
    startWorkoutFromTemplate,

    // Utilities
    getWeekId,
    getWeekStartDate
  }
})
```

---

### Integration with workoutStore.js

**Modify** `src/stores/workoutStore.js`:

```javascript
// Add to workoutStore.js

async function saveWorkout(workout) {
  // ... existing save logic ...

  // NEW: Sync with schedule if workout was from template
  if (workout.templateId) {
    const scheduleStore = useScheduleStore()
    const weekId = scheduleStore.getWeekId(workout.createdAt)
    const dayName = new Date(workout.createdAt).toLocaleDateString('en-US', { weekday: 'lowercase' })

    await scheduleStore.markDayCompleted(weekId, dayName, workout.id)
  }
}
```

---

## 4. Component Architecture

### Folder Structure

```
src/pages/schedule/
├── SchedulePage.vue                       # Main page with tabs
├── components/
│   ├── shared/
│   │   ├── QuickStartButton.vue           # Prominent quick start CTA
│   │   ├── MuscleGroupBadges.vue          # Muscle group pills
│   │   ├── StatusBadge.vue                # Completed/Planned/Missed badges
│   │   └── __tests__/
│   │       ├── QuickStartButton.spec.js
│   │       ├── MuscleGroupBadges.spec.js
│   │       └── StatusBadge.spec.js
│   │
│   ├── templates/
│   │   ├── TemplateList.vue               # Grid of template cards
│   │   ├── TemplateCard.vue               # Single template card
│   │   ├── TemplateFormSheet.vue          # Create/Edit template sheet
│   │   ├── ExerciseSelector.vue           # Exercise picker (reuse from workouts)
│   │   └── __tests__/
│   │       ├── TemplateList.spec.js
│   │       ├── TemplateCard.spec.js
│   │       └── TemplateFormSheet.spec.js
│   │
│   ├── calendar/
│   │   ├── WeeklyCalendar.vue             # 7-day calendar grid
│   │   ├── DayCard.vue                    # Single day cell
│   │   ├── DayDetailSheet.vue             # Day detail modal
│   │   ├── TodayWorkoutCard.vue           # Prominent today's workout CTA
│   │   ├── WeekNavigator.vue              # Previous/This/Next week buttons
│   │   └── __tests__/
│   │       ├── WeeklyCalendar.spec.js
│   │       ├── DayCard.spec.js
│   │       ├── DayDetailSheet.spec.js
│   │       └── TodayWorkoutCard.spec.js
│   │
│   ├── presets/
│   │   ├── PresetLibrary.vue              # Preset browser sheet
│   │   ├── PresetCard.vue                 # Single preset card
│   │   └── __tests__/
│   │       ├── PresetLibrary.spec.js
│   │       └── PresetCard.spec.js
│   │
│   └── adherence/
│       ├── AdherenceStatsCard.vue         # V1.1: Stats summary
│       ├── AdherenceChart.vue             # V1.1: 12-week bar chart
│       ├── AchievementBadges.vue          # V1.1: Gamification badges
│       ├── RecoveryWarningBadge.vue       # V1.1: Warning indicator
│       ├── MuscleRecoveryTimeline.vue     # V1.1: Recovery status table
│       └── __tests__/
│           └── AdherenceStatsCard.spec.js

src/components/
└── TemplatePickerSheet.vue                # Reusable template picker (for Quick Log button)

src/constants/
└── splitPresets.js                        # Pre-built split definitions
```

---

### Component Hierarchy

```
SchedulePage.vue
├── Tabs (shadcn-vue)
│   ├── TabsList
│   │   ├── TabsTrigger (Calendar)
│   │   ├── TabsTrigger (Templates)
│   │   └── TabsTrigger (Adherence) [V1.1]
│   │
│   └── TabsContent (for each tab)
│       │
│       ├── [Calendar Tab]
│       │   ├── TodayWorkoutCard
│       │   │   └── QuickStartButton
│       │   ├── WeekNavigator
│       │   └── WeeklyCalendar
│       │       └── DayCard (x7)
│       │           └── MuscleGroupBadges
│       │           └── StatusBadge
│       │
│       ├── [Templates Tab]
│       │   ├── Button (Create Template) → TemplateFormSheet
│       │   ├── Button (Browse Presets) → PresetLibrary
│       │   └── TemplateList
│       │       └── TemplateCard (multiple)
│       │           ├── QuickStartButton
│       │           ├── MuscleGroupBadges
│       │           └── DropdownMenu (Edit/Delete)
│       │
│       └── [Adherence Tab] [V1.1]
│           ├── AdherenceStatsCard
│           ├── AdherenceChart
│           └── AchievementBadges
```

---

### Major Component Contracts

#### SchedulePage.vue

```typescript
// No props (root component)
// No emits

interface State {
  activeTab: 'calendar' | 'templates' | 'adherence'  // Can sync with URL query
}
```

---

#### TemplateCard.vue

```typescript
interface Props {
  template: WorkoutTemplate
  showQuickStart?: boolean    // Default: true
  showActions?: boolean       // Default: true (edit/delete menu)
}

interface Emits {
  'quick-start': (templateId: string) => void
  'edit': (templateId: string) => void
  'delete': (templateId: string) => void
  'duplicate': (templateId: string) => void
}
```

**Usage**:
```vue
<TemplateCard
  :template="template"
  @quick-start="handleQuickStart"
  @edit="openEditSheet"
  @delete="confirmDelete"
/>
```

---

#### WeeklyCalendar.vue

```typescript
interface Props {
  weekId: string              // "2026-W02"
  schedule: WeeklySchedule
  editable?: boolean          // Default: true (allow drag-drop)
}

interface Emits {
  'day-click': (dayName: string) => void
  'assign-template': (dayName: string, templateId: string) => void
}
```

**Usage**:
```vue
<WeeklyCalendar
  :week-id="currentWeekId"
  :schedule="currentSchedule"
  @day-click="openDayDetail"
  @assign-template="handleAssignTemplate"
/>
```

---

#### DayCard.vue

```typescript
interface Props {
  dayName: string             // "monday"
  dayData: DaySchedule
  isToday?: boolean
  isPast?: boolean
}

interface Emits {
  'click': () => void
  'quick-start': () => void
}
```

---

#### TemplateFormSheet.vue

```typescript
interface Props {
  open: boolean
  templateId?: string         // If editing existing template
}

interface Emits {
  'close': () => void
  'save': (template: WorkoutTemplate) => void
}

interface FormData {
  name: string
  description: string
  exercises: TemplateExercise[]
}

interface Validation {
  nameRequired: boolean
  exercisesRequired: boolean
  setsPositive: boolean
  repsPositive: boolean
}
```

---

#### PresetLibrary.vue

```typescript
interface Props {
  open: boolean
}

interface Emits {
  'close': () => void
  'select-preset': (presetId: string) => void
}
```

---

## 5. Composables Strategy

### New Composables

#### useSchedule.js

**Location**: `src/composables/useSchedule.js`

```javascript
// src/composables/useSchedule.js
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useScheduleStore } from '@/stores/scheduleStore'

export function useSchedule() {
  const scheduleStore = useScheduleStore()
  const { currentSchedule, todaysWorkout, weekAdherence } = storeToRefs(scheduleStore)

  const currentWeekId = computed(() => {
    return scheduleStore.getWeekId(new Date())
  })

  const isDayInPast = (dayName) => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' })
    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    return dayOrder.indexOf(dayName) < dayOrder.indexOf(today)
  }

  const getDayStatus = (dayData, isPast) => {
    if (dayData.completed) return 'completed'
    if (!dayData.templateId) return 'rest'
    if (isPast) return 'missed'
    return 'planned'
  }

  return {
    currentWeekId,
    currentSchedule,
    todaysWorkout,
    weekAdherence,
    isDayInPast,
    getDayStatus
  }
}
```

---

#### useWorkoutTemplates.js

**Location**: `src/composables/useWorkoutTemplates.js`

```javascript
// src/composables/useWorkoutTemplates.js
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useI18n } from 'vue-i18n'

export function useWorkoutTemplates(filters = {}) {
  const scheduleStore = useScheduleStore()
  const { templates } = storeToRefs(scheduleStore)
  const { t } = useI18n()

  const searchQuery = ref(filters.search || '')
  const muscleFilter = ref(filters.muscle || 'all')
  const sortBy = ref(filters.sortBy || 'usage') // 'usage' | 'name' | 'recent'

  const filteredTemplates = computed(() => {
    let result = templates.value

    // Filter by search query
    if (searchQuery.value) {
      result = result.filter(t =>
        t.name.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    }

    // Filter by muscle group
    if (muscleFilter.value !== 'all') {
      result = result.filter(t =>
        t.muscleGroups.includes(muscleFilter.value)
      )
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy.value) {
        case 'usage':
          return b.usageCount - a.usageCount
        case 'name':
          return a.name.localeCompare(b.name)
        case 'recent':
          return (b.lastUsedAt || 0) - (a.lastUsedAt || 0)
        default:
          return 0
      }
    })

    return result
  })

  const templateSummary = computed(() => {
    return {
      total: templates.value.length,
      byMuscle: scheduleStore.templatesByMuscle
    }
  })

  return {
    templates: filteredTemplates,
    summary: templateSummary,
    searchQuery,
    muscleFilter,
    sortBy
  }
}
```

---

#### useWeekNavigation.js

**Location**: `src/composables/useWeekNavigation.js`

```javascript
// src/composables/useWeekNavigation.js
import { ref, computed } from 'vue'
import { useScheduleStore } from '@/stores/scheduleStore'

export function useWeekNavigation() {
  const scheduleStore = useScheduleStore()

  const currentWeekOffset = ref(0) // 0 = this week, -1 = last week, +1 = next week

  const currentWeekId = computed(() => {
    const date = new Date()
    date.setDate(date.getDate() + currentWeekOffset.value * 7)
    return scheduleStore.getWeekId(date)
  })

  const weekLabel = computed(() => {
    if (currentWeekOffset.value === 0) return 'This Week'
    if (currentWeekOffset.value === -1) return 'Last Week'
    if (currentWeekOffset.value === 1) return 'Next Week'

    const date = new Date()
    date.setDate(date.getDate() + currentWeekOffset.value * 7)
    const weekStart = scheduleStore.getWeekStartDate(currentWeekId.value)
    return `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  })

  const canGoBack = computed(() => true) // No limit on past weeks
  const canGoForward = computed(() => currentWeekOffset.value < 4) // Max 4 weeks ahead

  function goToPreviousWeek() {
    currentWeekOffset.value--
    loadWeek()
  }

  function goToNextWeek() {
    if (canGoForward.value) {
      currentWeekOffset.value++
      loadWeek()
    }
  }

  function goToThisWeek() {
    currentWeekOffset.value = 0
    loadWeek()
  }

  async function loadWeek() {
    await scheduleStore.fetchScheduleForWeek(currentWeekId.value)
  }

  return {
    currentWeekId,
    weekLabel,
    currentWeekOffset,
    canGoBack,
    canGoForward,
    goToPreviousWeek,
    goToNextWeek,
    goToThisWeek,
    loadWeek
  }
}
```

---

## 6. Utility Functions Organization

### templateUtils.js

**Location**: `src/utils/templateUtils.js`

```javascript
// src/utils/templateUtils.js

/**
 * Validate template data
 */
export function validateTemplate(template) {
  const errors = []

  if (!template.name || template.name.trim().length === 0) {
    errors.push('Template name is required')
  }

  if (template.name && template.name.length > 50) {
    errors.push('Template name must be less than 50 characters')
  }

  if (!template.exercises || template.exercises.length === 0) {
    errors.push('At least one exercise is required')
  }

  template.exercises?.forEach((exercise, index) => {
    if (exercise.sets <= 0) {
      errors.push(`Exercise ${index + 1}: Sets must be positive`)
    }
    if (exercise.reps <= 0) {
      errors.push(`Exercise ${index + 1}: Reps must be positive`)
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Compute muscle groups from exercises
 */
export function computeMuscleGroupsFromExercises(exercises, exerciseStore) {
  const muscles = new Set()

  exercises.forEach(exercise => {
    const exerciseData = exerciseStore.getExerciseById(exercise.exerciseId)
    if (exerciseData && exerciseData.muscleGroups) {
      exerciseData.muscleGroups.forEach(m => muscles.add(m))
    }
  })

  return Array.from(muscles)
}

/**
 * Estimate workout duration
 */
export function estimateDuration(exercises) {
  // Average: 2.5 minutes per exercise (including warm-up, rest, sets)
  // Compound exercises take longer, isolation exercises shorter

  const baseTime = exercises.length * 2.5

  // Add extra time for high set count
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0)
  const setBonus = totalSets > 20 ? (totalSets - 20) * 0.5 : 0

  return Math.round(baseTime + setBonus)
}

/**
 * Format template for display
 */
export function formatTemplateForDisplay(template) {
  return {
    ...template,
    displayName: template.name,
    displayDuration: `${template.estimatedDuration} min`,
    displayExercises: `${template.exercises.length} exercises`,
    displayMuscles: template.muscleGroups.join(', ')
  }
}
```

---

### scheduleUtils.js

**Location**: `src/utils/scheduleUtils.js`

```javascript
// src/utils/scheduleUtils.js

/**
 * Get ISO week ID (e.g., "2026-W02")
 */
export function getWeekId(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

/**
 * Get week start date (Monday 00:00:00) from week ID
 */
export function getWeekStartDate(weekId) {
  const [year, week] = weekId.split('-W').map(Number)
  const jan4 = new Date(year, 0, 4)
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - jan4.getDay() + 1 + (week - 1) * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
}

/**
 * Get all days of a week with dates
 */
export function getWeekDays(weekId) {
  const weekStart = getWeekStartDate(weekId)
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  return days.map((dayName, index) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + index)

    return {
      name: dayName,
      date,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayOfMonth: date.getDate()
    }
  })
}

/**
 * Check if a day is today
 */
export function isToday(dayName) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' })
  return dayName === today
}

/**
 * Check if a day is in the past
 */
export function isDayInPast(dayName, weekId) {
  const today = new Date()
  const currentWeekId = getWeekId(today)

  // If different week, compare week IDs
  if (weekId !== currentWeekId) {
    return weekId < currentWeekId
  }

  // Same week, compare day order
  const todayName = today.toLocaleDateString('en-US', { weekday: 'lowercase' })
  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  return dayOrder.indexOf(dayName) < dayOrder.indexOf(todayName)
}

/**
 * Format week label for display
 */
export function formatWeekLabel(weekId) {
  const weekStart = getWeekStartDate(weekId)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' })
  const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' })

  if (startMonth === endMonth) {
    return `${startMonth} ${weekStart.getDate()}-${weekEnd.getDate()}`
  } else {
    return `${startMonth} ${weekStart.getDate()} - ${endMonth} ${weekEnd.getDate()}`
  }
}
```

---

### splitPresets.js

**Location**: `src/constants/splitPresets.js`

```javascript
// src/constants/splitPresets.js

export const SPLIT_PRESETS = {
  beginner: [
    {
      id: 'full-body-3x',
      name: {
        en: 'Full Body 3x/week',
        uk: 'Все тіло 3р/тиждень'
      },
      description: {
        en: 'Perfect for beginners. Train all muscles 3 times per week.',
        uk: 'Ідеально для початківців. Тренуйте все тіло 3 рази на тиждень.'
      },
      frequency: 3,
      difficulty: 'beginner',
      templates: [
        {
          name: { en: 'Full Body A', uk: 'Все тіло A' },
          exercises: [
            { exerciseId: 'squat', sets: 3, reps: 10, restTime: 120 },
            { exerciseId: 'bench-press', sets: 3, reps: 10, restTime: 120 },
            { exerciseId: 'barbell-row', sets: 3, reps: 10, restTime: 90 },
            { exerciseId: 'overhead-press', sets: 3, reps: 8, restTime: 90 },
            { exerciseId: 'lat-pulldown', sets: 3, reps: 12, restTime: 90 },
            { exerciseId: 'plank', sets: 3, reps: 60, restTime: 60 }
          ]
        },
        {
          name: { en: 'Full Body B', uk: 'Все тіло B' },
          exercises: [
            { exerciseId: 'deadlift', sets: 3, reps: 8, restTime: 150 },
            { exerciseId: 'incline-dumbbell-press', sets: 3, reps: 10, restTime: 90 },
            { exerciseId: 'pull-up', sets: 3, reps: 8, restTime: 120 },
            { exerciseId: 'dumbbell-shoulder-press', sets: 3, reps: 10, restTime: 90 },
            { exerciseId: 'leg-press', sets: 3, reps: 12, restTime: 90 },
            { exerciseId: 'bicycle-crunch', sets: 3, reps: 20, restTime: 60 }
          ]
        },
        {
          name: { en: 'Full Body C', uk: 'Все тіло C' },
          exercises: [
            { exerciseId: 'front-squat', sets: 3, reps: 10, restTime: 120 },
            { exerciseId: 'dumbbell-bench-press', sets: 3, reps: 10, restTime: 90 },
            { exerciseId: 'cable-row', sets: 3, reps: 12, restTime: 90 },
            { exerciseId: 'arnold-press', sets: 3, reps: 10, restTime: 90 },
            { exerciseId: 'romanian-deadlift', sets: 3, reps: 10, restTime: 90 },
            { exerciseId: 'russian-twist', sets: 3, reps: 20, restTime: 60 }
          ]
        }
      ]
    },
    {
      id: 'upper-lower-4x',
      name: {
        en: 'Upper/Lower 4x/week',
        uk: 'Верх/Низ 4р/тиждень'
      },
      description: {
        en: 'Train upper body 2x and lower body 2x per week.',
        uk: 'Тренуйте верх 2 рази та низ 2 рази на тиждень.'
      },
      frequency: 4,
      difficulty: 'beginner',
      templates: [
        {
          name: { en: 'Upper Body A', uk: 'Верх A' },
          exercises: [
            { exerciseId: 'bench-press', sets: 4, reps: 8, restTime: 120 },
            { exerciseId: 'barbell-row', sets: 4, reps: 8, restTime: 120 },
            { exerciseId: 'overhead-press', sets: 3, reps: 10, restTime: 90 },
            { exerciseId: 'lat-pulldown', sets: 3, reps: 12, restTime: 90 },
            { exerciseId: 'dumbbell-curl', sets: 3, reps: 12, restTime: 60 },
            { exerciseId: 'tricep-pushdown', sets: 3, reps: 12, restTime: 60 }
          ]
        },
        {
          name: { en: 'Lower Body A', uk: 'Низ A' },
          exercises: [
            { exerciseId: 'squat', sets: 4, reps: 8, restTime: 150 },
            { exerciseId: 'romanian-deadlift', sets: 3, reps: 10, restTime: 120 },
            { exerciseId: 'leg-press', sets: 3, reps: 12, restTime: 90 },
            { exerciseId: 'leg-curl', sets: 3, reps: 12, restTime: 90 },
            { exerciseId: 'calf-raise', sets: 4, reps: 15, restTime: 60 },
            { exerciseId: 'plank', sets: 3, reps: 60, restTime: 60 }
          ]
        },
        {
          name: { en: 'Upper Body B', uk: 'Верх B' },
          exercises: [
            { exerciseId: 'incline-dumbbell-press', sets: 4, reps: 10, restTime: 90 },
            { exerciseId: 'pull-up', sets: 4, reps: 8, restTime: 120 },
            { exerciseId: 'dumbbell-shoulder-press', sets: 3, reps: 10, restTime: 90 },
            { exerciseId: 'cable-row', sets: 3, reps: 12, restTime: 90 },
            { exerciseId: 'hammer-curl', sets: 3, reps: 12, restTime: 60 },
            { exerciseId: 'overhead-tricep-extension', sets: 3, reps: 12, restTime: 60 }
          ]
        },
        {
          name: { en: 'Lower Body B', uk: 'Низ B' },
          exercises: [
            { exerciseId: 'deadlift', sets: 3, reps: 5, restTime: 180 },
            { exerciseId: 'front-squat', sets: 3, reps: 10, restTime: 120 },
            { exerciseId: 'walking-lunge', sets: 3, reps: 12, restTime: 90 },
            { exerciseId: 'leg-extension', sets: 3, reps: 15, restTime: 90 },
            { exerciseId: 'seated-calf-raise', sets: 4, reps: 15, restTime: 60 },
            { exerciseId: 'bicycle-crunch', sets: 3, reps: 20, restTime: 60 }
          ]
        }
      ]
    }
  ],

  intermediate: [
    {
      id: 'ppl-6x',
      name: {
        en: 'Push Pull Legs',
        uk: 'Жим Тяга Ноги'
      },
      description: {
        en: 'Classic bodybuilding split. Train each muscle 2x per week.',
        uk: 'Класичний спліт бодібілдингу. Тренуйте кожен м\'яз 2р/тиждень.'
      },
      frequency: 6,
      difficulty: 'intermediate',
      templates: [
        {
          name: { en: 'Push Day', uk: 'День жиму' },
          exercises: [
            { exerciseId: 'bench-press', sets: 4, reps: 8, restTime: 180 },
            { exerciseId: 'incline-dumbbell-press', sets: 3, reps: 10, restTime: 120 },
            { exerciseId: 'overhead-press', sets: 3, reps: 8, restTime: 120 },
            { exerciseId: 'lateral-raise', sets: 3, reps: 15, restTime: 60 },
            { exerciseId: 'tricep-pushdown', sets: 3, reps: 12, restTime: 60 },
            { exerciseId: 'overhead-tricep-extension', sets: 3, reps: 12, restTime: 60 }
          ]
        },
        {
          name: { en: 'Pull Day', uk: 'День тяги' },
          exercises: [
            { exerciseId: 'deadlift', sets: 3, reps: 5, restTime: 180 },
            { exerciseId: 'pull-up', sets: 3, reps: 10, restTime: 120 },
            { exerciseId: 'barbell-row', sets: 4, reps: 8, restTime: 120 },
            { exerciseId: 'face-pull', sets: 3, reps: 15, restTime: 60 },
            { exerciseId: 'barbell-curl', sets: 3, reps: 10, restTime: 60 },
            { exerciseId: 'hammer-curl', sets: 3, reps: 12, restTime: 60 }
          ]
        },
        {
          name: { en: 'Leg Day', uk: 'День ніг' },
          exercises: [
            { exerciseId: 'squat', sets: 4, reps: 8, restTime: 180 },
            { exerciseId: 'romanian-deadlift', sets: 3, reps: 10, restTime: 120 },
            { exerciseId: 'leg-press', sets: 3, reps: 12, restTime: 120 },
            { exerciseId: 'leg-curl', sets: 3, reps: 12, restTime: 90 },
            { exerciseId: 'leg-extension', sets: 3, reps: 15, restTime: 90 },
            { exerciseId: 'calf-raise', sets: 4, reps: 15, restTime: 60 }
          ]
        }
      ]
    }
  ],

  advanced: [
    {
      id: 'arnold-split',
      name: {
        en: 'Arnold Split',
        uk: 'Спліт Арнольда'
      },
      description: {
        en: 'Arnold Schwarzenegger\'s classic 6-day split.',
        uk: 'Класичний 6-денний спліт Арнольда Шварценеггера.'
      },
      frequency: 6,
      difficulty: 'advanced',
      templates: [
        {
          name: { en: 'Chest & Back', uk: 'Груди та Спина' },
          exercises: [
            { exerciseId: 'bench-press', sets: 5, reps: 6, restTime: 180 },
            { exerciseId: 'barbell-row', sets: 5, reps: 6, restTime: 180 },
            { exerciseId: 'incline-dumbbell-press', sets: 4, reps: 10, restTime: 120 },
            { exerciseId: 'pull-up', sets: 4, reps: 10, restTime: 120 },
            { exerciseId: 'dumbbell-flye', sets: 3, reps: 12, restTime: 90 },
            { exerciseId: 'cable-row', sets: 3, reps: 12, restTime: 90 }
          ]
        },
        {
          name: { en: 'Shoulders & Arms', uk: 'Плечі та Руки' },
          exercises: [
            { exerciseId: 'overhead-press', sets: 4, reps: 8, restTime: 120 },
            { exerciseId: 'barbell-curl', sets: 4, reps: 10, restTime: 90 },
            { exerciseId: 'close-grip-bench', sets: 4, reps: 10, restTime: 90 },
            { exerciseId: 'lateral-raise', sets: 4, reps: 12, restTime: 60 },
            { exerciseId: 'preacher-curl', sets: 3, reps: 12, restTime: 60 },
            { exerciseId: 'tricep-dip', sets: 3, reps: 12, restTime: 60 }
          ]
        },
        {
          name: { en: 'Legs', uk: 'Ноги' },
          exercises: [
            { exerciseId: 'squat', sets: 5, reps: 6, restTime: 180 },
            { exerciseId: 'leg-press', sets: 4, reps: 12, restTime: 120 },
            { exerciseId: 'romanian-deadlift', sets: 4, reps: 10, restTime: 120 },
            { exerciseId: 'leg-curl', sets: 4, reps: 12, restTime: 90 },
            { exerciseId: 'leg-extension', sets: 4, reps: 15, restTime: 90 },
            { exerciseId: 'calf-raise', sets: 5, reps: 20, restTime: 60 }
          ]
        }
      ]
    }
  ]
}
```

---

## 7. i18n Integration

### Translation Key Structure

```json
{
  "schedule": {
    "title": "Schedule",

    "tabs": {
      "calendar": "Calendar",
      "templates": "Templates",
      "adherence": "Adherence"
    },

    "templates": {
      "title": "Workout Templates",
      "create": "Create Template",
      "empty": "You haven't created any templates yet",
      "emptyDescription": "Templates let you quickly start workouts with pre-loaded exercises",
      "name": "Template Name",
      "description": "Description (optional)",
      "exercises": "Exercises",
      "addExercise": "Add Exercise",
      "estimatedDuration": "Estimated Duration",
      "lastUsed": "Last used",
      "usageCount": "{count} times used",
      "delete": "Delete Template",
      "deleteConfirm": "Are you sure you want to delete this template?",
      "duplicate": "Duplicate Template",
      "edit": "Edit Template",
      "validation": {
        "nameRequired": "Template name is required",
        "exercisesRequired": "Add at least one exercise",
        "setsPositive": "Sets must be positive",
        "repsPositive": "Reps must be positive"
      }
    },

    "presets": {
      "title": "Workout Split Presets",
      "browse": "Browse Presets",
      "beginner": "Beginner",
      "intermediate": "Intermediate",
      "advanced": "Advanced",
      "frequency": "{count} days/week",
      "useThisSplit": "Use This Split",
      "templatesCreated": "{count} templates created",
      "difficulty": {
        "beginner": "Beginner",
        "intermediate": "Intermediate",
        "advanced": "Advanced"
      }
    },

    "quickStart": {
      "button": "Quick Start",
      "started": "Workout started from {templateName}",
      "fromTemplate": "Start from Template",
      "selectTemplate": "Select a template",
      "lastWeight": "Last: {weight}",
      "noHistory": "No previous data"
    },

    "calendar": {
      "title": "Weekly Schedule",
      "today": "Today",
      "thisWeek": "This Week",
      "previousWeek": "Previous Week",
      "nextWeek": "Next Week",
      "planned": "Planned",
      "completed": "Completed",
      "missed": "Missed",
      "restDay": "Rest Day",
      "noTemplate": "No workout planned",
      "empty": "Assign templates to days to build your schedule",
      "todayWorkout": "Today's Workout",
      "changeTemplate": "Change Template",
      "markRestDay": "Mark as Rest Day",
      "days": {
        "monday": "Monday",
        "tuesday": "Tuesday",
        "wednesday": "Wednesday",
        "thursday": "Thursday",
        "friday": "Friday",
        "saturday": "Saturday",
        "sunday": "Sunday"
      }
    },

    "assign": {
      "dragToAssign": "Drag to calendar to assign",
      "tapToAssign": "Tap to assign to a day",
      "replaceConfirm": "This day already has a template. Replace?",
      "pastDayConfirm": "This day has passed. Assign anyway?",
      "applyToMultiple": "Apply to Multiple Days",
      "selectDays": "Select days",
      "assigned": "Template assigned to {dayName}",
      "undo": "Undo"
    },

    "adherence": {
      "title": "Schedule Adherence",
      "thisWeek": "This Week",
      "currentStreak": "Current Streak",
      "bestStreak": "Best Streak",
      "monthlyRate": "Monthly Rate",
      "excellent": "Excellent",
      "good": "Good",
      "needsWork": "Needs Work",
      "achievements": "Achievements",
      "perfectWeek": "Perfect Week",
      "onFire": "On Fire",
      "consistent": "Consistent",
      "dedicated": "Dedicated"
    },

    "recovery": {
      "title": "Muscle Recovery",
      "lastTrained": "Last trained",
      "status": {
        "recovered": "Recovered",
        "recovering": "Recovering",
        "fatigued": "Fatigued"
      },
      "warning": {
        "consecutive": "{muscle} trained on consecutive days",
        "noRest": "No rest days scheduled"
      },
      "suggestion": {
        "addRest": "Consider adding a rest day",
        "swap": "Consider swapping {day1} and {day2}"
      },
      "override": "I know what I'm doing",
      "settings": "Enable recovery warnings"
    }
  }
}
```

---

## 8. Route Configuration

### Current Route (No Changes Needed)

The Schedule page will use the existing route pattern:

```javascript
// src/router/index.js

{
  path: '/schedule',
  name: 'Schedule',
  component: () => import('@/pages/schedule/SchedulePage.vue'),
  meta: {
    requiresAuth: true,
    title: 'Schedule'
  }
}
```

### Tab State Management

**Recommended: URL Query Params**

```javascript
// In SchedulePage.vue
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const activeTab = ref(route.query.tab || 'calendar')

watch(activeTab, (newTab) => {
  router.replace({
    query: { ...route.query, tab: newTab }
  })
})
```

**Benefit**: Shareable URLs (e.g., `/schedule?tab=templates`)

---

## 9. Implementation Phases

### MVP Phase (Weeks 1-4)

#### Week 1: Data Model + Templates CRUD

**Day 1-2: Firestore Collections**
- Define Firestore schema (workoutTemplates, schedules)
- Create validation functions (templateUtils.js)
- Write unit tests for validation

**Day 3-4: scheduleStore.js**
- Implement template CRUD actions
- Implement schedule fetching logic
- Write store tests

**Day 5: Composables & Utilities**
- Create useWorkoutTemplates.js
- Create templateUtils.js, scheduleUtils.js
- Write unit tests

---

#### Week 2: Pre-built Presets + Quick Start

**Day 1-2: Split Presets**
- Define splitPresets.js (Full Body, Upper/Lower, PPL, Arnold Split)
- Create PresetLibrary.vue component
- Create PresetCard.vue component
- i18n for preset names (en + uk)

**Day 3-4: Quick Start Flow**
- Implement startWorkoutFromTemplate() in scheduleStore
- Modify workoutStore.startWorkout() to accept template data
- Auto-fill weights from history
- Create TemplatePickerSheet.vue (for Quick Log button)

**Day 5: Integration & Testing**
- Wire up Quick Start button in template cards
- Test Quick Start flow end-to-end
- Test weight auto-fill logic
- Bug fixes

---

#### Week 3: Weekly Calendar View

**Day 1-2: Calendar Components**
- Create WeeklyCalendar.vue (7-day grid)
- Create DayCard.vue (single day cell)
- Create TodayWorkoutCard.vue (prominent CTA)
- Create WeekNavigator.vue (prev/this/next week)

**Day 3: Schedule Management**
- Implement fetchScheduleForWeek() in scheduleStore
- Implement assignTemplateToDay() in scheduleStore
- Create useWeekNavigation.js composable
- Create useSchedule.js composable

**Day 4: Day Detail & Status**
- Create DayDetailSheet.vue (modal for day details)
- Implement status logic (completed/planned/missed/rest)
- Create StatusBadge.vue component
- Sync workout completion with schedule

**Day 5: Testing & Polish**
- Test calendar navigation
- Test template assignment
- Test status updates
- Mobile optimization

---

#### Week 4: Template Assignment + Polish

**Day 1-2: Assignment Flow**
- Implement drag-drop for desktop (VueUse useDraggable)
- Implement tap-based picker for mobile
- Create TemplatePickerSheet.vue (mobile)
- Implement batch assignment (apply to multiple days)

**Day 3: Template Management UI**
- Create TemplateList.vue (grid of cards)
- Create TemplateCard.vue (single template card)
- Create TemplateFormSheet.vue (create/edit form)
- Implement delete confirmation dialog

**Day 4: i18n & Accessibility**
- Add all i18n translations (uk + en)
- Test all translations
- Accessibility audit (keyboard navigation, ARIA labels)
- Screen reader testing

**Day 5: QA & Bug Fixes**
- Cross-browser testing
- Mobile optimization
- Performance testing
- Bug fixes
- Code review
- Merge to main

---

### V1.1 Phase (Weeks 5-6)

#### Week 5: Adherence Tracking

**Day 1-2: Adherence Logic**
- Implement adherence calculation in analyticsStore
- Implement streak calculation logic
- Create AdherenceStatsCard.vue
- Create AdherenceChart.vue (12-week bar chart)

**Day 3-4: Achievements**
- Create achievement system (Perfect Week, On Fire, Consistent)
- Create AchievementBadges.vue component
- Implement achievement unlocking logic
- Add celebration animations

**Day 5: Testing**
- Test adherence calculations
- Test streak logic
- Test achievement unlocking
- Bug fixes

---

#### Week 6: Recovery Intelligence

**Day 1-2: Recovery Logic**
- Create muscleRecoveryUtils.js (recovery hours, warnings)
- Implement analyzeWeeklySchedule() function
- Implement suggestOptimalRestDay() function
- Create RecoveryWarningBadge.vue

**Day 3-4: Recovery UI**
- Create MuscleRecoveryTimeline.vue (recovery status table)
- Create MuscleRotationHeatmap.vue (weekly balance view)
- Add recovery warnings to calendar
- Implement "dismiss warning" functionality

**Day 5: Settings & QA**
- Add settings toggle for recovery warnings
- Test recovery warnings
- Test muscle rotation heatmap
- Bug fixes
- Deploy V1.1

---

## 10. Code Reuse Strategy

### Dashboard → Schedule Reuse

| Dashboard Component | Schedule Component | Reuse Strategy |
|---------------------|---------------------|----------------|
| `QuickLogButton.vue` | `QuickStartButton.vue` | **Extend** - Add "From Template" option to QuickLogButton dropdown |
| `ExerciseTable.vue` | `TemplateFormSheet.vue` | **Borrow pattern** - Similar exercise selection logic |
| `StatCard.vue` | `AdherenceStatsCard.vue` | **Direct reuse** - Same card layout for stats |
| Period selector logic | N/A | Not applicable (Schedule uses week-based navigation) |

---

### Workout → Schedule Reuse

| Workout Component | Schedule Component | Reuse Strategy |
|-------------------|---------------------|----------------|
| Exercise selector | `ExerciseSelector.vue` | **Direct reuse** - Same component for selecting exercises |
| Set logging UI | Quick Start flow | **Borrow pattern** - Similar set/rep input pattern |
| Workout detail page | Day detail sheet | **Borrow pattern** - Similar layout for workout summary |

---

## 11. Testing Architecture

### Test File Organization

```
src/stores/
└── __tests__/
    └── scheduleStore.spec.js

src/composables/
└── __tests__/
    ├── useSchedule.spec.js
    ├── useWorkoutTemplates.spec.js
    └── useWeekNavigation.spec.js

src/utils/
└── __tests__/
    ├── templateUtils.spec.js
    └── scheduleUtils.spec.js

src/pages/schedule/components/
├── shared/__tests__/
│   ├── QuickStartButton.spec.js
│   └── StatusBadge.spec.js
├── templates/__tests__/
│   ├── TemplateCard.spec.js
│   └── TemplateFormSheet.spec.js
└── calendar/__tests__/
    ├── WeeklyCalendar.spec.js
    ├── DayCard.spec.js
    └── TodayWorkoutCard.spec.js
```

---

### Mock Strategies

#### Mock Firebase

```javascript
// Before importing scheduleStore
vi.mock('@/firebase/firestore', () => ({
  fetchCollection: vi.fn(),
  getDocument: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn()
}))
```

---

#### Mock Templates & Schedules

```javascript
// src/test/utils/mockGenerators.js

export function generateMockTemplate(overrides = {}) {
  return {
    id: 'template-1',
    name: 'Push Day A',
    description: 'Chest, shoulders, triceps',
    exercises: [
      {
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        sets: 4,
        reps: 8,
        targetWeight: 100,
        restTime: 120,
        notes: ''
      }
    ],
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    estimatedDuration: 75,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastUsedAt: null,
    usageCount: 0,
    sourcePresetId: null,
    ...overrides
  }
}

export function generateMockSchedule(overrides = {}) {
  return {
    id: '2026-W02',
    userId: 'user-1',
    weekStart: new Date('2026-01-06'),
    days: {
      monday: {
        templateId: 'template-1',
        templateName: 'Push Day A',
        muscleGroups: ['chest', 'shoulders', 'triceps'],
        completed: false,
        workoutId: null
      },
      // ... other days
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
}
```

---

### Component Testing Patterns

```javascript
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import TemplateCard from '../TemplateCard.vue'
import { generateMockTemplate } from '@/test/utils/mockGenerators'

describe('TemplateCard', () => {
  it('displays template name and exercises', () => {
    const template = generateMockTemplate()

    const wrapper = mount(TemplateCard, {
      props: { template },
      global: {
        plugins: [createTestingPinia()]
      }
    })

    expect(wrapper.text()).toContain('Push Day A')
    expect(wrapper.text()).toContain('1 exercises')
  })

  it('emits quick-start on button click', async () => {
    const template = generateMockTemplate()

    const wrapper = mount(TemplateCard, {
      props: { template }
    })

    await wrapper.find('[data-testid="quick-start-button"]').trigger('click')

    expect(wrapper.emitted('quick-start')).toBeTruthy()
    expect(wrapper.emitted('quick-start')[0]).toEqual([template.id])
  })
})
```

---

## 12. Performance Considerations

### Data Loading Strategy

**Week-based Caching**:
- Only load current week by default
- Cache loaded weeks in `scheduleCache` Map
- Invalidate cache on schedule updates

```javascript
// In scheduleStore
const scheduleCache = ref(new Map())

async function fetchScheduleForWeek(weekId) {
  // Check cache first
  if (scheduleCache.value.has(weekId)) {
    return scheduleCache.value.get(weekId)
  }

  // Fetch from Firestore
  const schedule = await getDocument(path)
  scheduleCache.value.set(weekId, schedule)

  return schedule
}
```

**Cache Invalidation**:
- Clear cache on template assignment
- Clear cache on workout completion
- Clear cache on logout

---

### Memoization Strategy

**Template Muscle Group Computation**:

```javascript
const muscleGroupsCache = new Map()

function computeMuscleGroups(exercises) {
  const cacheKey = exercises.map(e => e.exerciseId).join('-')

  if (muscleGroupsCache.has(cacheKey)) {
    return muscleGroupsCache.get(cacheKey)
  }

  // Compute muscle groups...
  const result = // ... computation

  muscleGroupsCache.set(cacheKey, result)
  return result
}
```

---

### Optimistic UI Updates

**Template Assignment**:

```javascript
async function assignTemplateToDay(weekId, dayName, templateId) {
  // 1. Update local state immediately
  currentSchedule.value.days[dayName] = {
    templateId,
    templateName: template.name,
    // ...
  }

  // 2. Sync to Firestore in background
  try {
    await updateDocument(path, updates)
  } catch (err) {
    // 3. Rollback on error
    currentSchedule.value.days[dayName] = originalValue
    throw err
  }
}
```

---

### Bundle Size Optimization

**Lazy Load Preset Data**:

```javascript
// Only load preset data when user opens preset library
const presetsModule = () => import('@/constants/splitPresets.js')

async function openPresetLibrary() {
  const { SPLIT_PRESETS } = await presetsModule()
  // Use presets...
}
```

---

## 13. Mobile Responsiveness Strategy

### Breakpoint Behavior

| Component | Mobile (<768px) | Desktop (≥768px) |
|-----------|-----------------|------------------|
| **SchedulePage Tabs** | Scrollable tab list | Horizontal tab buttons |
| **WeeklyCalendar** | Vertical scrollable list (7 rows) | Horizontal grid (7 columns) |
| **TemplateCard** | Full-width cards | Grid layout (2-3 columns) |
| **DayCard** | Stacked layout (icon + text) | Horizontal layout |
| **TemplateFormSheet** | Full-screen sheet | Half-screen dialog |
| **PresetLibrary** | Full-screen sheet | Dialog modal |

---

### Touch Interactions

**Swipe to Navigate Weeks**:

```javascript
import { useSwipe } from '@vueuse/core'

const calendarRef = ref()

const { isSwiping, direction } = useSwipe(calendarRef, {
  onSwipe() {
    if (direction.value === 'left') {
      goToNextWeek()
    } else if (direction.value === 'right') {
      goToPreviousWeek()
    }
  }
})
```

---

### Mobile-Specific Features

**Tap to Assign (No Drag-Drop)**:

```vue
<!-- DayCard.vue -->
<template>
  <div
    @click="isMobile ? openTemplatePicker() : null"
    :class="{ 'cursor-pointer': isMobile }"
  >
    <!-- Day content -->
  </div>
</template>
```

---

## 14. Success Metrics

### User Adoption (MVP)

- **Target**: 60% of users create ≥1 template in first week
- **Target**: 40% of users assign templates to schedule
- **Target**: 30% of workouts started via Quick Start

**Measurement**:
```javascript
// Analytics events
trackEvent('schedule_template_created', { presetId: null })
trackEvent('schedule_template_assigned', { dayName, weekId })
trackEvent('schedule_quick_start', { templateId })
```

---

### Efficiency (MVP)

- **Target**: 30% reduction in time from app open to workout start
- **Measure**: Average time (seconds) from app launch to first set logged

**Comparison**:
- Without template: Open app → Quick Log → Add exercises → Fill weights → Start logging (~45s)
- With template: Open app → Quick Start → Start logging (~10s)

---

### Adherence (V1.1)

- **Target**: 75% average schedule adherence rate
- **Target**: 50% of users maintain ≥7 day streak
- **Target**: 20% higher retention for users with templates vs non-template users

**Measurement**:
```javascript
// Weekly adherence calculation
const adherence = (completedWorkouts / plannedWorkouts) * 100

// Retention cohort analysis
const templateUsers = users.filter(u => u.hasTemplates)
const nonTemplateUsers = users.filter(u => !u.hasTemplates)
```

---

## 15. Implementation Checklist

### Pre-Implementation

- [ ] Review SCHEDULE_PRD.md thoroughly
- [ ] Review this architecture document
- [ ] Set up project board (tasks for Week 1)
- [ ] Create feature branch: `feature/schedule-mvp`
- [ ] Set up Firebase collections (workoutTemplates, schedules)

---

### Week 1: Foundation

- [ ] Define Firestore schema (workoutTemplates, schedules)
- [ ] Create scheduleStore.js with template CRUD
- [ ] Create templateUtils.js with validation
- [ ] Create scheduleUtils.js (week ID, date helpers)
- [ ] Write store tests
- [ ] Write utility tests
- [ ] Create useWorkoutTemplates.js composable
- [ ] Create useSchedule.js composable
- [ ] Write composable tests

---

### Week 2: Presets + Quick Start

- [ ] Define splitPresets.js (Full Body, Upper/Lower, PPL, Arnold)
- [ ] Create PresetLibrary.vue component
- [ ] Create PresetCard.vue component
- [ ] Implement createTemplatesFromPreset() in scheduleStore
- [ ] Implement startWorkoutFromTemplate() in scheduleStore
- [ ] Modify workoutStore.startWorkout() to accept template data
- [ ] Create TemplatePickerSheet.vue (for Quick Log button)
- [ ] Wire up Quick Start button in template cards
- [ ] Add i18n translations (uk + en) for presets
- [ ] Test Quick Start flow end-to-end
- [ ] Test weight auto-fill logic

---

### Week 3: Calendar View

- [ ] Create WeeklyCalendar.vue (7-day grid)
- [ ] Create DayCard.vue (single day cell)
- [ ] Create TodayWorkoutCard.vue (prominent CTA)
- [ ] Create WeekNavigator.vue (prev/this/next buttons)
- [ ] Implement fetchScheduleForWeek() in scheduleStore
- [ ] Implement assignTemplateToDay() in scheduleStore
- [ ] Create useWeekNavigation.js composable
- [ ] Create DayDetailSheet.vue (day detail modal)
- [ ] Implement status logic (completed/planned/missed/rest)
- [ ] Create StatusBadge.vue component
- [ ] Sync workout completion with schedule
- [ ] Test calendar navigation
- [ ] Test status updates
- [ ] Mobile optimization for calendar

---

### Week 4: Template Management + Polish

- [ ] Implement drag-drop for desktop (VueUse useDraggable)
- [ ] Implement tap-based picker for mobile
- [ ] Implement batch assignment (apply to multiple days)
- [ ] Create TemplateList.vue (grid of cards)
- [ ] Create TemplateCard.vue (single template card)
- [ ] Create TemplateFormSheet.vue (create/edit form)
- [ ] Implement delete confirmation dialog
- [ ] Implement duplicate template functionality
- [ ] Add all i18n translations (uk + en)
- [ ] Test all translations
- [ ] Accessibility audit (keyboard navigation, ARIA labels)
- [ ] Screen reader testing
- [ ] Cross-browser testing
- [ ] Performance testing
- [ ] Bug fixes
- [ ] Code review
- [ ] Merge to main
- [ ] Deploy to production

---

## Conclusion

This architecture document provides a comprehensive blueprint for implementing the Schedule section of the Obsessed app. By following this structure, the development team can build a robust, performant, and user-friendly schedule experience that transforms the app from a reactive tracking tool into a proactive training companion.

**Key Principles**:
1. **Follow existing patterns** from CLAUDE.md (Vue 3 Composition API, Pinia setup stores, i18n-first)
2. **Reduce friction** - Every feature should save time and taps
3. **Mobile-first** - Optimized for gym use (portrait mode, large touch targets)
4. **Offline-ready** - Denormalized data for quick display without fetches
5. **Future-proof** - Extensible architecture for V1.1, V1.2, and V2 features

**Next Steps**:
1. Review this document with the team
2. Ask questions and clarify any ambiguities
3. Set up Sprint 1 tasks (Week 1)
4. Begin implementation

Good luck with the implementation! 🚀
