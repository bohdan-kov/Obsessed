#!/usr/bin/env node

/**
 * Workout Seed Script for Obsessed Gym Tracker
 *
 * Seeds Firebase Firestore with realistic test workout data for debugging and development
 *
 * Features:
 * - Generates realistic workout data with progression over last 30 days
 * - Marks test data with `isTestData: true` for easy cleanup
 * - Supports add and remove operations
 * - Uses existing exercise library
 * - Simulates progressive overload (weights increase over time)
 * - Varied RPE, reps, and completion status for realism
 *
 * Usage:
 *   npm run seed:workouts              # Add default 15 workouts
 *   npm run seed:workouts:remove       # Remove all test workouts
 *   node scripts/seedWorkouts.js --add --count=20  # Add 20 workouts
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
import {
  workoutTemplates,
  calculateProgressiveWeight,
  getRandomReps,
  getRandomRPE,
} from './workoutTemplates.js'
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
  }

  args.forEach((arg) => {
    if (arg === '--add') {
      options.add = true
    } else if (arg === '--remove') {
      options.remove = true
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
 */
function generateWorkouts(userId, count) {
  const workouts = []
  const usedDates = new Set()

  // Generate workouts spread across last 30 days
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

  // Sort by date (oldest first)
  workouts.sort((a, b) => a.startedAt.toMillis() - b.startedAt.toMillis())

  return workouts
}

/**
 * Add test workouts to Firestore
 */
async function addWorkouts(db, userId, count) {
  console.log(`\n📝 Generating ${count} test workouts...\n`)

  // Generate workout data
  const workouts = generateWorkouts(userId, count)

  // Statistics
  let totalVolume = 0
  let totalSets = 0

  console.log('✅ Generated workouts:\n')
  workouts.forEach((workout, index) => {
    const date = workout.startedAt.toDate()
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const exerciseCount = workout.exercises.length
    const setCount = workout.totalSets

    console.log(
      `   ${index + 1}. ${workout.exercises[0]?.exerciseName?.split(' ')[0] || 'Workout'} - ${dateStr} - ${exerciseCount} exercises, ${setCount} sets`
    )

    totalVolume += workout.totalVolume
    totalSets += workout.totalSets
  })

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
      await addWorkouts(db, user.uid, options.count)
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
