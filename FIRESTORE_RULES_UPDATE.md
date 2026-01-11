# Firestore Rules Update - Schedule Feature

## Issue
The schedule feature was failing with a permissions error when trying to access the `workoutTemplates` subcollection:

```
FirebaseError: Missing or insufficient permissions.
Location: users/{userId}/workoutTemplates
```

## Root Cause
The `firestore.rules` file was missing security rules for two new subcollections introduced by the schedule feature:
1. `users/{userId}/workoutTemplates` - For storing workout templates
2. `users/{userId}/schedules/{weekId}` - For storing weekly workout schedules

## Solution
Added comprehensive security rules for both subcollections with proper validation and access control.

### 1. Workout Templates Rules

**Location:** `users/{userId}/workoutTemplates/{templateId}`

**Access Control:**
- Read: Only the owner of the user document
- Create/Update/Delete: Only the owner of the user document

**Data Validation:**
- Must contain: `name`, `exercises`, `muscleGroups`, `estimatedDuration`
- `name`: String between 2-100 characters
- `exercises`: List with 1-20 exercises
- `muscleGroups`: Must be a list
- `estimatedDuration`: Number between 0-300 minutes

**Rule Implementation:**
```javascript
match /workoutTemplates/{templateId} {
  allow read: if isOwner(userId);

  function isValidTemplate(template) {
    return template.keys().hasAll(['name', 'exercises', 'muscleGroups', 'estimatedDuration']) &&
           template.name is string &&
           template.name.size() >= 2 &&
           template.name.size() <= 100 &&
           template.exercises is list &&
           template.exercises.size() >= 1 &&
           template.exercises.size() <= 20 &&
           template.muscleGroups is list &&
           template.estimatedDuration is number &&
           template.estimatedDuration >= 0 &&
           template.estimatedDuration <= 300;
  }

  allow create: if isOwner(userId) && isValidTemplate(request.resource.data);
  allow update: if isOwner(userId) && isValidTemplate(request.resource.data);
  allow delete: if isOwner(userId);
}
```

### 2. Weekly Schedules Rules

**Location:** `users/{userId}/schedules/{weekId}`

**Access Control:**
- Read: Only the owner of the user document
- Create/Update/Delete: Only the owner of the user document

**Data Validation:**
- Must contain: `userId`, `weekStart`, `days`
- `userId`: Must match the authenticated user
- `days`: Must be a map containing all 7 days (monday-sunday)

**Rule Implementation:**
```javascript
match /schedules/{weekId} {
  allow read: if isOwner(userId);

  function isValidSchedule(schedule) {
    return schedule.keys().hasAll(['userId', 'weekStart', 'days']) &&
           schedule.userId == request.auth.uid &&
           schedule.days is map &&
           schedule.days.keys().hasAll(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
  }

  allow create: if isOwner(userId) && isValidSchedule(request.resource.data);
  allow update: if isOwner(userId) && isValidSchedule(request.resource.data);
  allow delete: if isOwner(userId);
}
```

## Security Principles Applied

1. **User Isolation**: Users can only access their own templates and schedules through the `isOwner(userId)` check
2. **Authentication Required**: All operations require authentication via `isAuthenticated()` helper
3. **Data Validation**: Strict validation ensures data integrity and prevents malformed documents
4. **Principle of Least Privilege**: No broader access than necessary
5. **Consistent Pattern**: Follows the same security model as other subcollections (workouts, workoutPlans, etc.)

## Pattern Consistency

These rules follow the exact same pattern as existing subcollections:
- `workouts` - User's workout history
- `workoutPlans` - User's saved workout plans
- `customExercises` - User's custom exercises
- `exerciseNotes` - User's exercise notes

This consistency makes the security model predictable and maintainable.

## Deployment

Rules deployed to Firebase on: 2026-01-11

Command used:
```bash
firebase deploy --only firestore:rules
```

Deployment status: SUCCESS

## Testing Recommendations

To verify the rules are working correctly:

1. **Authentication Test**: Ensure only authenticated users can access the collections
2. **Ownership Test**: Verify users cannot read/write other users' templates or schedules
3. **Validation Test**: Attempt to create invalid documents (missing fields, wrong types) and confirm they're rejected
4. **CRUD Test**: Test Create, Read, Update, Delete operations for both collections

## Files Modified

- `/firestore.rules` - Added security rules for `workoutTemplates` and `schedules` subcollections

## Related Code

The schedule feature uses these collections in:
- `/src/stores/scheduleStore.js` - Main Pinia store for schedule management
- `/src/pages/schedule/SchedulePage.vue` - Schedule UI component
- `/src/utils/scheduleUtils.js` - Schedule utility functions
- `/src/utils/templateUtils.js` - Template utility functions

## Expected Behavior

After this update:
- Users should be able to fetch, create, update, and delete their own workout templates
- Users should be able to manage their weekly schedules
- The "Missing or insufficient permissions" error should be resolved
- All schedule feature functionality should work as expected

## Notes

- The Firebase rules compiler shows some warnings about unused functions (like `isValidWeight`, `isValidReps`, etc.) - these are helper functions used in workout validation and are intentionally kept for potential future use
- The rules use nested path matching which is properly supported by Firestore security rules v2
