#!/usr/bin/env node
/* eslint-env node */
/* global process */

/**
 * Fix Invalid Workout Dates Script
 *
 * This script identifies and fixes workouts with invalid completedAt fields.
 * It specifically handles cases where completedAt is a malformed object or Proxy.
 *
 * Usage:
 *   node scripts/fixInvalidWorkoutDates.js --check    # Check for invalid dates
 *   node scripts/fixInvalidWorkoutDates.js --fix      # Fix invalid dates
 */

import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
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

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    check: false,
    fix: false,
    workoutId: null,
  }

  args.forEach((arg) => {
    if (arg === '--check') options.check = true
    if (arg === '--fix') options.fix = true
    if (arg.startsWith('--id=')) {
      options.workoutId = arg.split('=')[1]
    }
  })

  // Default to check mode if nothing specified
  if (!options.check && !options.fix) {
    options.check = true
  }

  return options
}

/**
 * Prompt user for confirmation
 */
function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })
}

/**
 * Check if a completedAt field is valid
 */
function isValidCompletedAt(completedAt) {
  if (!completedAt) return false

  // Valid if it's a Timestamp with toDate method
  if (completedAt.toDate && typeof completedAt.toDate === 'function') {
    try {
      const date = completedAt.toDate()
      return !isNaN(date.getTime())
    } catch {
      return false
    }
  }

  // Valid if it has seconds/nanoseconds structure
  if (typeof completedAt === 'object' && completedAt.seconds !== undefined) {
    return typeof completedAt.seconds === 'number' && !isNaN(completedAt.seconds)
  }

  return false
}

/**
 * Normalize completedAt to a valid Timestamp
 */
function normalizeCompletedAt(completedAt, startedAt) {
  // If completedAt is valid, return as-is
  if (isValidCompletedAt(completedAt)) {
    return completedAt
  }

  // Fallback: use startedAt + 1 hour as a reasonable estimate
  if (startedAt && isValidCompletedAt(startedAt)) {
    const startDate = startedAt.toDate()
    const estimatedCompletedDate = new Date(startDate.getTime() + 60 * 60 * 1000) // +1 hour
    return Timestamp.fromDate(estimatedCompletedDate)
  }

  // Last resort: use current timestamp
  return Timestamp.now()
}

/**
 * Main function
 */
async function main() {
  const options = parseArgs()

  console.log('🔍 Invalid Workout Dates Fix Utility\n')

  // Validate Firebase config
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    console.error('❌ Missing Firebase configuration:', missing.join(', '))
    console.error('   Please ensure your .env.local file is set up correctly.')
    process.exit(1)
  }

  // Initialize Firebase
  const app = initializeApp(firebaseConfig)
  const db = getFirestore(app)
  const auth = getAuth(app)

  // Authenticate user
  const email = process.env.FIREBASE_USER_EMAIL
  const password = process.env.FIREBASE_USER_PASSWORD

  if (!email || !password) {
    console.error('❌ Missing FIREBASE_USER_EMAIL or FIREBASE_USER_PASSWORD in .env.local')
    console.error('   Add these temporarily to run this script.')
    process.exit(1)
  }

  try {
    await signInWithEmailAndPassword(auth, email, password)
    console.log('✅ Authenticated successfully\n')
  } catch (error) {
    console.error('❌ Authentication failed:', error.message)
    process.exit(1)
  }

  const userId = auth.currentUser.uid
  const workoutsRef = collection(db, 'users', userId, 'workouts')

  // Fetch all completed workouts
  const q = query(workoutsRef, where('status', '==', 'completed'))
  const snapshot = await getDocs(q)

  console.log(`📊 Found ${snapshot.size} completed workouts\n`)

  const invalidWorkouts = []

  snapshot.forEach((docSnap) => {
    const workout = docSnap.data()
    const workoutId = docSnap.id

    if (!isValidCompletedAt(workout.completedAt)) {
      invalidWorkouts.push({
        id: workoutId,
        completedAt: workout.completedAt,
        startedAt: workout.startedAt,
      })
    }
  })

  console.log(`❌ Found ${invalidWorkouts.length} workouts with invalid completedAt\n`)

  if (invalidWorkouts.length === 0) {
    console.log('✅ All workouts have valid completedAt timestamps!')
    process.exit(0)
  }

  // Display invalid workouts
  console.log('Invalid workouts:')
  invalidWorkouts.forEach((w) => {
    console.log(`  - ID: ${w.id}`)
    console.log(`    completedAt: ${JSON.stringify(w.completedAt)}`)
    console.log(`    completedAt type: ${typeof w.completedAt}`)
    console.log(
      `    startedAt: ${w.startedAt?.toDate ? w.startedAt.toDate().toISOString() : 'N/A'}`
    )
    console.log('')
  })

  // Check mode - just report and exit
  if (options.check) {
    console.log('ℹ️  Run with --fix to repair these workouts')
    process.exit(0)
  }

  // Fix mode - ask for confirmation
  if (options.fix) {
    const confirmed = await askQuestion(
      `\n⚠️  This will update ${invalidWorkouts.length} workouts. Continue? (y/n): `
    )

    if (!confirmed) {
      console.log('❌ Operation cancelled')
      process.exit(0)
    }

    console.log('\n🔧 Fixing invalid workouts...\n')

    let fixed = 0
    let failed = 0

    for (const workout of invalidWorkouts) {
      try {
        const workoutRef = doc(db, 'users', userId, 'workouts', workout.id)
        const normalizedCompletedAt = normalizeCompletedAt(
          workout.completedAt,
          workout.startedAt
        )

        await updateDoc(workoutRef, {
          completedAt: normalizedCompletedAt,
          updatedAt: Timestamp.now(),
        })

        console.log(`✅ Fixed workout ${workout.id}`)
        console.log(`   New completedAt: ${normalizedCompletedAt.toDate().toISOString()}`)
        fixed++
      } catch (error) {
        console.error(`❌ Failed to fix workout ${workout.id}:`, error.message)
        failed++
      }
    }

    console.log(`\n✅ Fixed ${fixed} workouts`)
    if (failed > 0) {
      console.log(`❌ Failed to fix ${failed} workouts`)
    }
  }

  process.exit(0)
}

main().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
