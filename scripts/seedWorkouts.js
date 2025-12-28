#!/usr/bin/env node
/* eslint-env node */


/**
 * Workout Seed Script for Obsessed Gym Tracker
 *
 * Seeds Firebase Firestore with realistic test workout data for debugging and development
 *
 * Features:
 * - Generates realistic workout data with progression over last 30 days OR full year
 * - Year mode: Creates 150-200 workouts distributed across 365 days (3-5 per week)
 * - Realistic training patterns: Push/Pull/Legs, Upper/Lower, Full Body splits
 * - Includes vacation periods and varying weekly frequencies
 * - Progressive overload simulation with weights increasing over time
 * - Marks test data with `isTestData: true` for easy cleanup
 * - Supports add and remove operations
 * - Uses existing exercise library
 * - Varied RPE, reps, and completion status for realism
 *
 * Usage:
 *   npm run seed:workouts                          # Add default 15 workouts (30 days)
 *   npm run seed:workouts:remove                   # Remove all test workouts
 *   node scripts/seedWorkouts.js --year            # Generate full year of workouts
 *   node scripts/seedWorkouts.js --add --count=20  # Add 20 workouts (30 days)
 *   node scripts/seedWorkouts.js --remove          # Remove test workouts
 *
 * Prerequisites:
 *   - User must be authenticated in Firebase (run the app and log in first)
 *   - .env.local file with Firebase configuration
 *   - Exercise library seeded (run npm run seed:exercises)
 */

import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  writeBatch,
  query,
  where,
  Timestamp,
} from 'firebase/firestore'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { defaultExercises } from '../src/data/defaultExercises.js'
import { workoutTemplates, getRandomReps, getRandomRPE } from './workoutTemplates.js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import * as readline from 'readline'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env.local') })

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

// Constants
const BATCH_SIZE = 500 // Firestore batch write limit
const DEFAULT_WORKOUT_COUNT = 15

/**
 * Validate Firebase configuration
 */
function validateFirebaseConfig(config) {
  const required = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ]

  const missing = required.filter((key) => !config[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase configuration: ${missing.join(', ')}.\n` +
        'Please ensure your .env.local file contains all required VITE_FIREBASE_* variables.'
    )
  }
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    add: false,
    remove: false,
    count: DEFAULT_WORKOUT_COUNT,
    year: false, // New flag for generating a full year of workouts
  }

  args.forEach((arg) => {
    if (arg === '--add') {
      options.add = true
    } else if (arg === '--remove') {
      options.remove = true
    } else if (arg === '--year') {
      options.year = true
      options.add = true // Automatically enable add mode
    } else if (arg.startsWith('--count=')) {
      const count = parseInt(arg.split('=')[1], 10)
      if (!isNaN(count) && count > 0) {
        options.count = count
      }
    }
  })

  // Default to add if no operation specified
  if (!options.add && !options.remove) {
    options.add = true
  }

  return options
}

/**
 * Prompt user for email and password
 */
async function promptCredentials() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const question = (prompt) =>
    new Promise((resolve) => {
      rl.question(prompt, resolve)
    })

  console.log('\n🔐 Authentication Required')
  console.log('Please enter your Firebase credentials:\n')

  const email = await question('Email: ')
  const password = await question('Password: ')

  rl.close()

  return { email, password }
}

/**
 * Authenticate user with Firebase
 */
async function authenticateUser(auth) {
  try {
    const { email, password } = await promptCredentials()

    console.log('\n🔄 Authenticating...')
    const userCredential = await signInWithEmailAndPassword(auth, email, password)

    return userCredential.user
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      throw new Error('User not found. Please check your email and try again.')
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('Incorrect password. Please try again.')
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email format.')
    } else {
      throw new Error(`Authentication failed: ${error.message}`)
    }
  }
}

/**
 * Get exercise name by slug
 */
function getExerciseName(slug, locale = 'en') {
  const exercise = defaultExercises.find((ex) => ex.slug === slug)
  return exercise ? exercise.name[locale] : slug
}

/**
 * Generate a random date within the last N days
 */
function getRandomDateInLast(days) {
  const now = new Date()
  const millisecondsPerDay = 24 * 60 * 60 * 1000
  const randomOffset = Math.floor(Math.random() * days * millisecondsPerDay)
  return new Date(now.getTime() - randomOffset)
}

/**
 * Generate realistic workout schedule for a full year
 * Distributes workouts across 365 days with 3-5 workouts per week
 * Includes variations for holidays, vacation periods, and realistic patterns
 *
 * @returns {Date[]} Array of workout dates sorted chronologically (oldest first)
 */
function generateYearWorkoutSchedule() {
  const workoutDates = []
  const now = new Date()
  const oneYearAgo = new Date(now)
  oneYearAgo.setFullYear(now.getFullYear() - 1)

  // Start from one year ago and work forward week by week
  let currentDate = new Date(oneYearAgo)

  // Workout patterns: typical training split
  // 0 = Sunday, 1 = Monday, etc.
  const commonWorkoutDays = [
    [1, 3, 5], // Mon, Wed, Fri (3x/week)
    [0, 2, 4, 6], // Sun, Tue, Thu, Sat (4x/week)
    [1, 2, 4, 5, 6], // Mon, Tue, Thu, Fri, Sat (5x/week - high frequency)
    [1, 3, 5, 6], // Mon, Wed, Fri, Sat (4x/week alternative)
  ]

  // Track current pattern and when to change it
  let currentPattern = commonWorkoutDays[Math.floor(Math.random() * commonWorkoutDays.length)]
  let weeksUntilPatternChange = Math.floor(Math.random() * 8) + 4 // Change pattern every 4-12 weeks

  // Special periods with reduced training (vacations, holidays)
  const reducedTrainingWeeks = new Set()
  // Add 2-3 vacation periods throughout the year
  const vacationCount = Math.floor(Math.random() * 2) + 2
  for (let i = 0; i < vacationCount; i++) {
    const randomWeek = Math.floor(Math.random() * 52)
    reducedTrainingWeeks.add(randomWeek)
    // Vacation can be 1-2 weeks
    if (Math.random() > 0.5) {
      reducedTrainingWeeks.add(randomWeek + 1)
    }
  }

  let weekNumber = 0

  // Generate workouts week by week
  while (currentDate < now) {
    const isReducedWeek = reducedTrainingWeeks.has(weekNumber)

    // Get the start of the current week (Sunday)
    const weekStart = new Date(currentDate)
    const currentDayOfWeek = weekStart.getDay()
    // Move back to Sunday (start of week)
    weekStart.setDate(weekStart.getDate() - currentDayOfWeek)
    // Reset time to midnight
    weekStart.setHours(0, 0, 0, 0)

    // Change pattern periodically
    if (weeksUntilPatternChange <= 0) {
      currentPattern = commonWorkoutDays[Math.floor(Math.random() * commonWorkoutDays.length)]
      weeksUntilPatternChange = Math.floor(Math.random() * 8) + 4
    }

    // During reduced weeks, skip some workouts (50% chance to skip each workout)
    const thisWeekPattern = isReducedWeek
      ? currentPattern.filter(() => Math.random() > 0.5)
      : currentPattern

    // Add workouts for this week
    thisWeekPattern.forEach((dayOfWeek) => {
      const workoutDate = new Date(weekStart)
      // Add days from Sunday to get to the target day of week
      workoutDate.setDate(workoutDate.getDate() + dayOfWeek)

      // Set random workout time (mostly morning 8-10 AM, some afternoon 4-7 PM)
      const isMorning = Math.random() > 0.3 // 70% morning workouts
      if (isMorning) {
        workoutDate.setHours(Math.floor(Math.random() * 3) + 8, Math.floor(Math.random() * 60), 0, 0) // 8-10 AM
      } else {
        workoutDate.setHours(Math.floor(Math.random() * 4) + 16, Math.floor(Math.random() * 60), 0, 0) // 4-7 PM
      }

      // Only add if the date is valid (within the year range)
      if (workoutDate >= oneYearAgo && workoutDate < now) {
        workoutDates.push(workoutDate)
      }
    })

    // Move to next week
    currentDate.setDate(currentDate.getDate() + 7)
    weekNumber++
    weeksUntilPatternChange--
  }

  // Sort dates chronologically (oldest first)
  return workoutDates.sort((a, b) => a.getTime() - b.getTime())
}

/**
 * Select workout template based on training pattern and previous workouts
 * This ensures realistic split routines (Push/Pull/Legs, Upper/Lower, etc.)
 *
 * @param {number} index - Current workout index
 * @param {Array} previousTemplates - Array of recently used template names
 * @returns {Object} Selected workout template
 */
function selectWorkoutTemplate(index, previousTemplates) {
  // Define training splits
  const splits = {
    pushPullLegs: ['Push Day', 'Pull Day', 'Leg Day'],
    upperLower: ['Upper Body', 'Leg Day'],
    fullBody: ['Full Body A', 'Full Body B'],
    bro: ['Chest & Back', 'Push Day', 'Pull Day', 'Leg Day'],
  }

  // Choose a split pattern (changes every 8-12 weeks worth of workouts)
  const splitChangeInterval = Math.floor(Math.random() * 16) + 32 // 32-48 workouts
  const splitIndex = Math.floor(index / splitChangeInterval) % 4
  const splitNames = Object.keys(splits)
  const currentSplit = splits[splitNames[splitIndex]]

  // Rotate through the current split
  const positionInSplit = previousTemplates.length % currentSplit.length
  const templateName = currentSplit[positionInSplit]

  // Find and return the template
  return workoutTemplates.find((t) => t.name === templateName) || workoutTemplates[0]
}

/**
 * Generate workout data based on template and progression
 */
function generateWorkout(template, userId, workoutIndex, totalWorkouts, workoutDate) {
  // Calculate progression factor (0 at oldest, 1 at newest)
  const progressionFactor = workoutIndex / (totalWorkouts - 1)

  // Generate exercises with sets
  const exercises = template.exercises.map((exerciseTemplate, exerciseIndex) => {
    const { exerciseSlug, sets, repRange, baseWeight, weightProgression } = exerciseTemplate

    // Calculate progressive weight based on workout progression
    const exerciseWeight =
      baseWeight + weightProgression * Math.floor(progressionFactor * totalWorkouts * 0.5)

    // Generate sets for this exercise
    const generatedSets = Array.from({ length: sets }, (_, setIndex) => {
      const reps = getRandomReps(repRange)
      const rpe = getRandomRPE()

      // Some sets might be incomplete (more likely in later sets)
      const completed = Math.random() > 0.05 * (setIndex + 1) // 95% completion for set 1, decreasing

      return {
        weight: exerciseWeight,
        reps,
        rpe: completed ? rpe : null,
        type: 'normal',
        completedAt: completed ? workoutDate.toISOString() : null,
      }
    })

    return {
      exerciseId: exerciseSlug,
      exerciseName: getExerciseName(exerciseSlug, 'en'),
      sets: generatedSets,
      order: exerciseIndex,
      notes: '',
    }
  })

  // Calculate total volume and sets
  const totalVolume = exercises.reduce((total, exercise) => {
    return (
      total +
      exercise.sets.reduce((exTotal, set) => {
        return exTotal + set.weight * set.reps
      }, 0)
    )
  }, 0)

  const totalSets = exercises.reduce((total, exercise) => total + exercise.sets.length, 0)

  // Calculate workout duration with some randomness
  const baseDuration = template.duration || 60
  const durationVariance = Math.floor(Math.random() * 20) - 10 // ±10 minutes
  const duration = (baseDuration + durationVariance) * 60 // Convert to seconds

  // Workout status (most are completed)
  const status = 'completed'

  // Completion timestamp
  const completedAt = new Date(workoutDate.getTime() + duration * 1000)

  return {
    userId,
    status,
    startedAt: Timestamp.fromDate(workoutDate),
    completedAt: Timestamp.fromDate(completedAt),
    exercises,
    duration,
    totalVolume: Math.round(totalVolume),
    totalSets,
    notes: template.notes || '',
    isTestData: true, // Mark as test data for easy removal
    createdAt: Timestamp.fromDate(workoutDate),
    updatedAt: Timestamp.fromDate(completedAt),
    lastSavedAt: Timestamp.fromDate(completedAt),
  }
}

/**
 * Generate multiple workouts with realistic distribution
 * @param {string} userId - User ID
 * @param {number} count - Number of workouts to generate
 * @param {boolean} isYearMode - If true, generate workouts across a full year with realistic scheduling
 * @returns {Array} Array of workout objects
 */
function generateWorkouts(userId, count, isYearMode = false) {
  const workouts = []
  const previousTemplates = [] // Track template usage for realistic rotation

  if (isYearMode) {
    // Generate full year with realistic scheduling
    console.log('📅 Generating realistic workout schedule for full year (365 days)...')
    const workoutDates = generateYearWorkoutSchedule()

    console.log(`   Generated ${workoutDates.length} workout dates (avg ${(workoutDates.length / 52).toFixed(1)} per week)`)

    // Generate workouts for each scheduled date
    workoutDates.forEach((workoutDate, i) => {
      // Select template based on training pattern
      const template = selectWorkoutTemplate(i, previousTemplates)
      previousTemplates.push(template.name)

      // Keep only last 10 templates for rotation logic
      if (previousTemplates.length > 10) {
        previousTemplates.shift()
      }

      const workout = generateWorkout(template, userId, i, workoutDates.length, workoutDate)
      workouts.push(workout)
    })
  } else {
    // Original logic: random workouts spread across last 30 days
    const usedDates = new Set()

    for (let i = 0; i < count; i++) {
      // Pick random template
      const template = workoutTemplates[Math.floor(Math.random() * workoutTemplates.length)]

      // Generate unique date
      let workoutDate
      let attempts = 0
      do {
        workoutDate = getRandomDateInLast(30)
        workoutDate.setHours(Math.floor(Math.random() * 4) + 8, Math.floor(Math.random() * 60), 0, 0) // Random time between 8 AM - 12 PM
        attempts++
      } while (usedDates.has(workoutDate.toDateString()) && attempts < 100)

      usedDates.add(workoutDate.toDateString())

      const workout = generateWorkout(template, userId, i, count, workoutDate)
      workouts.push(workout)
    }
  }

  // Sort by date (oldest first)
  workouts.sort((a, b) => a.startedAt.toMillis() - b.startedAt.toMillis())

  return workouts
}

/**
 * Add test workouts to Firestore
 * @param {Object} db - Firestore database instance
 * @param {string} userId - User ID
 * @param {number} count - Number of workouts (ignored in year mode)
 * @param {boolean} isYearMode - If true, generate full year of workouts
 */
async function addWorkouts(db, userId, count, isYearMode = false) {
  if (isYearMode) {
    console.log(`\n📝 Generating full year of realistic workout data...\n`)
  } else {
    console.log(`\n📝 Generating ${count} test workouts...\n`)
  }

  // Generate workout data
  const workouts = generateWorkouts(userId, count, isYearMode)

  // Statistics
  let totalVolume = 0
  let totalSets = 0

  console.log('✅ Generated workouts:\n')

  // Show sample of workouts (first 10, middle 5, last 10 for year mode)
  const workoutsToShow = isYearMode ? [
    ...workouts.slice(0, 10),
    ...(workouts.length > 25 ? [{ separator: true }] : []),
    ...(workouts.length > 25 ? workouts.slice(Math.floor(workouts.length / 2) - 2, Math.floor(workouts.length / 2) + 3) : []),
    ...(workouts.length > 25 ? [{ separator: true }] : []),
    ...workouts.slice(-10),
  ] : workouts

  workoutsToShow.forEach((workout, displayIndex) => {
    if (workout.separator) {
      console.log('   ...')
      return
    }

    const actualIndex = isYearMode
      ? (displayIndex < 10 ? displayIndex : displayIndex < 16 ? Math.floor(workouts.length / 2) - 2 + (displayIndex - 11) : workouts.length - (workoutsToShow.length - displayIndex))
      : displayIndex

    const date = workout.startedAt.toDate()
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const exerciseCount = workout.exercises.length
    const setCount = workout.totalSets

    console.log(
      `   ${actualIndex + 1}. ${workout.exercises[0]?.exerciseName?.split(' ')[0] || 'Workout'} - ${dateStr} - ${exerciseCount} exercises, ${setCount} sets`
    )

    totalVolume += workout.totalVolume
    totalSets += workout.totalSets
  })

  // Calculate full stats for all workouts
  if (isYearMode && workouts.length > 25) {
    console.log('\n📊 Calculating full statistics for all workouts...')
    workouts.forEach((workout) => {
      if (!workoutsToShow.includes(workout)) {
        totalVolume += workout.totalVolume
        totalSets += workout.totalSets
      }
    })
  }

  console.log(`\n💾 Writing ${workouts.length} workouts to Firestore...`)

  // Batch write workouts
  const batches = []
  let currentBatch = writeBatch(db)
  let batchCount = 0

  const workoutsRef = collection(db, 'users', userId, 'workouts')

  for (const workout of workouts) {
    const docRef = doc(workoutsRef)
    currentBatch.set(docRef, workout)
    batchCount++

    // Create new batch if we hit the limit
    if (batchCount >= BATCH_SIZE) {
      batches.push(currentBatch)
      currentBatch = writeBatch(db)
      batchCount = 0
    }
  }

  // Add the last batch if it has any operations
  if (batchCount > 0) {
    batches.push(currentBatch)
  }

  // Commit all batches
  console.log(`📦 Committing ${batches.length} batch(es) to Firestore...`)

  for (let i = 0; i < batches.length; i++) {
    await batches[i].commit()
    console.log(`   ✅ Batch ${i + 1}/${batches.length} committed`)
  }

  console.log('\n' + '='.repeat(60))
  console.log('✨ Seeding completed successfully!\n')

  // Print statistics
  console.log('📊 Summary:')
  console.log(`   Total workouts added: ${workouts.length}`)
  if (isYearMode) {
    const avgPerWeek = (workouts.length / 52).toFixed(1)
    console.log(`   Average workouts per week: ${avgPerWeek}`)

    // Calculate date range
    const firstDate = workouts[0].startedAt.toDate()
    const lastDate = workouts[workouts.length - 1].startedAt.toDate()
    const daysCovered = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24))
    console.log(`   Date range: ${firstDate.toLocaleDateString('en-US')} to ${lastDate.toLocaleDateString('en-US')} (${daysCovered} days)`)
  }
  console.log(`   Total sets: ${totalSets}`)
  console.log(`   Total volume: ${totalVolume.toLocaleString()} kg`)
  console.log(`   Average volume per workout: ${Math.round(totalVolume / workouts.length).toLocaleString()} kg`)
  console.log('')

  // Print workout type breakdown
  const workoutTypes = workouts.reduce((acc, workout) => {
    // Use first exercise name as workout identifier
    const type = workout.exercises[0]?.exerciseName?.split(' ')[0] || 'Unknown'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})

  console.log('📈 Workouts by type:')
  Object.entries(workoutTypes)
    .sort(([, a], [, b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`)
    })
  console.log('')

  console.log('='.repeat(60))
  console.log('🎉 Done! Your test workouts are ready to use.\n')
}

/**
 * Remove test workouts from Firestore
 */
async function removeWorkouts(db, userId) {
  console.log('\n🔍 Searching for test workouts...\n')

  const workoutsRef = collection(db, 'users', userId, 'workouts')
  const q = query(workoutsRef, where('isTestData', '==', true))
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    console.log('✅ No test workouts found. Database is clean.\n')
    console.log('='.repeat(60))
    return
  }

  console.log(`📊 Found ${snapshot.size} test workouts to remove\n`)

  // Batch delete
  const batches = []
  let currentBatch = writeBatch(db)
  let batchCount = 0

  snapshot.docs.forEach((docSnapshot) => {
    currentBatch.delete(docSnapshot.ref)
    batchCount++

    if (batchCount >= BATCH_SIZE) {
      batches.push(currentBatch)
      currentBatch = writeBatch(db)
      batchCount = 0
    }
  })

  if (batchCount > 0) {
    batches.push(currentBatch)
  }

  console.log(`🗑️  Removing test workouts...`)

  for (let i = 0; i < batches.length; i++) {
    await batches[i].commit()
    console.log(`   ✅ Batch ${i + 1}/${batches.length} committed`)
  }

  console.log('\n' + '='.repeat(60))
  console.log('✨ Cleanup completed successfully!\n')
  console.log('📊 Summary:')
  console.log(`   Test workouts removed: ${snapshot.size}`)
  console.log('')
  console.log('='.repeat(60))
  console.log('🎉 Done! Test data has been cleaned up.\n')
}

/**
 * Main function
 */
async function main() {
  console.log('🏋️  Obsessed Workout Seeding Script')
  console.log('='.repeat(60))

  try {
    // Parse command line arguments
    const options = parseArgs()

    // Validate configuration
    console.log('\n📋 Validating Firebase configuration...')
    validateFirebaseConfig(firebaseConfig)
    console.log('✅ Firebase configuration valid')

    // Initialize Firebase
    console.log('\n🔥 Initializing Firebase...')
    const app = initializeApp(firebaseConfig)
    const db = getFirestore(app)
    const auth = getAuth(app)
    console.log(`✅ Connected to Firebase project: ${firebaseConfig.projectId}`)

    // Authenticate user
    const user = await authenticateUser(auth)
    console.log(`✅ Authenticated as: ${user.email}`)
    console.log(`   User ID: ${user.uid}`)

    // Execute operation
    if (options.remove) {
      await removeWorkouts(db, user.uid)
    } else if (options.add) {
      await addWorkouts(db, user.uid, options.count, options.year)
    }

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Operation failed with error:\n')
    console.error(error.message)

    if (error.code) {
      console.error(`\nFirebase Error Code: ${error.code}`)
    }

    if (error.message.includes('Missing Firebase configuration')) {
      console.error('\n💡 Tip: Make sure your .env.local file exists and contains:')
      console.error('   VITE_FIREBASE_API_KEY=...')
      console.error('   VITE_FIREBASE_AUTH_DOMAIN=...')
      console.error('   VITE_FIREBASE_PROJECT_ID=...')
      console.error('   VITE_FIREBASE_STORAGE_BUCKET=...')
      console.error('   VITE_FIREBASE_MESSAGING_SENDER_ID=...')
      console.error('   VITE_FIREBASE_APP_ID=...')
    }

    console.error('\n')
    process.exit(1)
  }
}

// Run the script
main()
