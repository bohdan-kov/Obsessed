# Obsessed - Seed Scripts Documentation

This directory contains scripts for seeding Firebase Firestore with test data for development and debugging purposes.

## Available Scripts

### 1. Exercise Library Seeder (`seedExercises.js`)

Seeds the Firestore database with a comprehensive library of default exercises.

**Features:**
- Idempotent: Safe to run multiple times (checks for existing exercises)
- 68+ exercises covering all major muscle groups
- Bilingual support (Ukrainian & English)
- Categorized by muscle group, equipment, and exercise type

**Usage:**
```bash
npm run seed:exercises
```

**Requirements:**
- `.env.local` file with Firebase configuration
- Firebase project initialized with Firestore enabled

**Output:**
- Creates exercises in the `exercises` collection
- Each exercise has a unique slug as document ID
- Includes timestamps (`createdAt`, `updatedAt`)

---

### 2. Workout Data Seeder (`seedWorkouts.js`)

Seeds realistic test workout data for debugging and development purposes.

**Features:**
- Generates realistic workout data with progression over 30 days
- Marks test data with `isTestData: true` for easy cleanup
- Supports add and remove operations
- Simulates progressive overload (weights increase over time)
- Varied RPE, reps, and set completion for realism
- 8 different workout templates (Push Day, Pull Day, Leg Day, Full Body A/B, etc.)

**Usage:**

**Add test workouts:**
```bash
# Add 15 workouts (default)
npm run seed:workouts

# Add specific number of workouts
node scripts/seedWorkouts.js --add --count=20
```

**Remove test workouts:**
```bash
# Remove all test workouts
npm run seed:workouts:remove

# Alternative syntax
node scripts/seedWorkouts.js --remove
```

**Requirements:**
- `.env.local` file with Firebase configuration
- User authentication (script will prompt for email/password)
- Exercise library seeded (run `npm run seed:exercises` first)

**Authentication:**
The script will prompt you to enter your Firebase credentials when run:
```
🔐 Authentication Required
Please enter your Firebase credentials:

Email: your-email@example.com
Password: ********
```

**Output Example:**
```
🏋️  Obsessed Workout Seeding Script
════════════════════════════════════════════════════════════

✅ Generated workouts:

   1. Barbell - Nov 2, 2025 - 5 exercises, 15 sets
   2. Deadlift - Nov 5, 2025 - 6 exercises, 21 sets
   3. Barbell - Nov 8, 2025 - 6 exercises, 24 sets
   ...

📊 Summary:
   Total workouts added: 15
   Total sets: 180
   Total volume: 12,450 kg
   Average volume per workout: 830 kg

📈 Workouts by type:
   Barbell: 4
   Deadlift: 3
   Pull-ups: 2
   ...
```

---

## Workout Templates

The workout seeder uses realistic workout templates defined in `workoutTemplates.js`:

### Available Templates:

1. **Push Day** - Chest, shoulders, triceps (75 min)
   - Barbell Bench Press, Incline Dumbbell Press, Overhead Press, Lateral Raise, Tricep Pushdown

2. **Pull Day** - Back, biceps (80 min)
   - Deadlift, Pull-ups, Barbell Row, Lat Pulldown, Face Pull, Barbell Curl

3. **Leg Day** - Quads, hamstrings, glutes, calves (85 min)
   - Barbell Squat, Leg Press, Romanian Deadlift, Leg Extension, Leg Curl, Calf Raise

4. **Full Body A** - Compound movements (60 min)
   - Squats, Bench Press, Barbell Row, Overhead Press, Plank

5. **Full Body B** - Mixed compound movements (60 min)
   - Deadlift, Incline Dumbbell Press, Pull-ups, Leg Press, Hanging Leg Raise

6. **Upper Body** - Balanced upper body (70 min)
   - Bench Press, Barbell Row, Dumbbell Press, Lat Pulldown, Curls, Pushdowns

7. **Chest & Back** - Antagonistic pairing (75 min)
   - Bench Press, Deadlift, Incline Press, Pull-ups, Cable Crossover, Cable Row

### Progressive Overload Simulation

The seeder automatically simulates realistic progression:

- **Weight progression:** Each exercise has a base weight that increases over time
- **Workout distribution:** Workouts spread across last 30 days
- **Set completion:** ~95% completion rate (some sets left incomplete for realism)
- **RPE variation:** Random RPE between 6-9 for each set
- **Rep ranges:** Varies by exercise (e.g., 5-8 for deadlifts, 12-15 for accessories)

**Example progression for Barbell Bench Press:**
- Workout 1 (30 days ago): 60 kg × 8 reps
- Workout 5 (20 days ago): 65 kg × 9 reps
- Workout 10 (10 days ago): 70 kg × 8 reps
- Workout 15 (today): 75 kg × 10 reps

---

## Data Structure

### Test Workout Document Structure

```javascript
{
  userId: "user-id-here",
  status: "completed",
  startedAt: Timestamp,
  completedAt: Timestamp,
  exercises: [
    {
      exerciseId: "barbell-bench-press",
      exerciseName: "Barbell Bench Press",
      sets: [
        {
          weight: 60,        // kg (storage unit)
          reps: 10,
          rpe: 7,           // Rate of Perceived Exertion (6-9)
          type: "normal",
          completedAt: "2025-11-30T10:30:00.000Z"
        },
        // ... more sets
      ],
      order: 0,
      notes: ""
    },
    // ... more exercises
  ],
  duration: 4500,           // seconds (75 minutes)
  totalVolume: 4500,        // kg (total weight × reps)
  totalSets: 15,
  notes: "Focus on progressive overload and controlled tempo",
  isTestData: true,         // ⚠️ IMPORTANT: Marks as test data for cleanup
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastSavedAt: Timestamp
}
```

**Key Fields:**
- `isTestData: true` - Allows easy filtering and removal of test workouts
- `userId` - Associated with the authenticated user
- All weights stored in kg (converted for display in app via `useUnits` composable)
- Timestamps use Firestore `Timestamp` type
- Stored in `users/{userId}/workouts` collection

---

## Tips & Best Practices

### Before Running Scripts:

1. **Backup your data** (if running on production database)
2. **Ensure exercises are seeded first:**
   ```bash
   npm run seed:exercises
   ```
3. **Log in to the app** to ensure Firebase auth is working
4. **Check `.env.local`** has all required Firebase variables

### During Development:

- **Use test workouts frequently** to test analytics, charts, and workout history features
- **Remove and re-add** test data to test empty states and data loading
- **Adjust workout count** based on what you're testing (e.g., 50+ for volume testing)

### Cleanup:

```bash
# Clean up test workouts when done
npm run seed:workouts:remove
```

This removes ALL workouts marked with `isTestData: true`, leaving real user workouts intact.

---

## Troubleshooting

### "Missing Firebase configuration"
- Ensure `.env.local` exists in project root
- Check all `VITE_FIREBASE_*` variables are set

### "User not found" or "Wrong password"
- Create an account in the app first
- Use the same email/password when prompted by the script

### "Exercise not found"
- Run `npm run seed:exercises` first
- Check Firebase console that exercises exist in `exercises` collection

### Firestore Permission Denied
- Ensure Firestore security rules allow authenticated users to write to their own `users/{userId}/workouts` collection
- Check user is authenticated (script should show "✅ Authenticated as: email")

### Script hangs or times out
- Check network connection to Firebase
- Verify Firebase project is active (not disabled/paused)
- Try reducing workout count with `--count=5`

---

## Development

### Modifying Workout Templates

Edit `scripts/workoutTemplates.js` to:
- Add new workout types
- Adjust exercise selections
- Change rep ranges or weight progressions
- Modify workout durations

**Example: Add a new template:**
```javascript
{
  name: 'Arms Day',
  exercises: [
    {
      exerciseSlug: 'barbell-curl',
      sets: 4,
      repRange: [8, 12],
      baseWeight: 25,
      weightProgression: 2.5,
    },
    // ... more exercises
  ],
  duration: 50,
  notes: 'Focus on bicep and tricep isolation',
}
```

### Modifying Seed Logic

Edit `scripts/seedWorkouts.js` to:
- Change date distribution (currently last 30 days)
- Adjust RPE randomness
- Modify set completion rates
- Change batch sizes or performance settings

---

## License

These scripts are part of the Obsessed gym tracking application and are intended for development use only.
