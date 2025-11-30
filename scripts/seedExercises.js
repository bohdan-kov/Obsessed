#!/usr/bin/env node

/**
 * Exercise Library Seed Script
 *
 * Seeds the Firestore database with default exercises from src/data/defaultExercises.js
 *
 * Features:
 * - Idempotent: Safe to run multiple times (checks for existing exercises by slug)
 * - Batch operations: Efficient writes using Firebase batching (max 500 per batch)
 * - Progress feedback: Console logging with statistics
 * - Error handling: Comprehensive try-catch with clear error messages
 *
 * Usage:
 *   npm run seed:exercises
 *
 * Prerequisites:
 *   - .env.local file with Firebase configuration
 *   - Firebase project initialized
 *   - Firestore database enabled
 */

import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { defaultExercises } from '../src/data/defaultExercises.js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

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

// Validate Firebase configuration
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

// Constants
const COLLECTION_NAME = 'exercises'
const BATCH_SIZE = 500 // Firestore batch write limit

/**
 * Main seeding function
 */
async function seedExercises() {
  console.log('🏋️  Obsessed Exercise Library Seeding Script\n')
  console.log('=' .repeat(60))

  try {
    // Validate configuration
    console.log('📋 Validating Firebase configuration...')
    validateFirebaseConfig(firebaseConfig)
    console.log('✅ Firebase configuration valid\n')

    // Initialize Firebase
    console.log('🔥 Initializing Firebase...')
    const app = initializeApp(firebaseConfig)
    const db = getFirestore(app)
    console.log(`✅ Connected to Firebase project: ${firebaseConfig.projectId}\n`)

    // Get existing exercises
    console.log('🔍 Checking for existing exercises...')
    const exercisesRef = collection(db, COLLECTION_NAME)
    const existingSnapshot = await getDocs(exercisesRef)

    const existingSlugs = new Set()
    existingSnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.slug) {
        existingSlugs.add(data.slug)
      }
    })

    console.log(`📊 Found ${existingSlugs.size} existing exercises in database\n`)

    // Filter out existing exercises
    const exercisesToAdd = defaultExercises.filter(
      (exercise) => !existingSlugs.has(exercise.slug)
    )

    if (exercisesToAdd.length === 0) {
      console.log('✅ All default exercises already exist in the database.')
      console.log('   No new exercises to add.\n')
      console.log('=' .repeat(60))
      process.exit(0)
    }

    console.log(`📝 ${exercisesToAdd.length} new exercises to add:`)
    exercisesToAdd.forEach((ex) => {
      console.log(`   - ${ex.name.en} (${ex.muscleGroup})`)
    })
    console.log('')

    // Batch write exercises
    console.log('💾 Writing exercises to Firestore...')

    let addedCount = 0
    const batches = []
    let currentBatch = writeBatch(db)
    let batchCount = 0

    for (const exercise of exercisesToAdd) {
      // Use slug as document ID for predictability
      const docRef = doc(exercisesRef, exercise.slug)

      // Add timestamps
      const exerciseData = {
        ...exercise,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      currentBatch.set(docRef, exerciseData)
      batchCount++
      addedCount++

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

    console.log('')
    console.log('=' .repeat(60))
    console.log('✨ Seeding completed successfully!\n')

    // Print statistics
    console.log('📊 Summary:')
    console.log(`   Total exercises in database: ${existingSlugs.size + addedCount}`)
    console.log(`   Previously existed: ${existingSlugs.size}`)
    console.log(`   Newly added: ${addedCount}`)
    console.log('')

    // Print exercise breakdown by muscle group
    const byMuscleGroup = exercisesToAdd.reduce((acc, ex) => {
      acc[ex.muscleGroup] = (acc[ex.muscleGroup] || 0) + 1
      return acc
    }, {})

    if (Object.keys(byMuscleGroup).length > 0) {
      console.log('📈 Newly added exercises by muscle group:')
      Object.entries(byMuscleGroup)
        .sort(([, a], [, b]) => b - a)
        .forEach(([muscle, count]) => {
          console.log(`   ${muscle}: ${count}`)
        })
      console.log('')
    }

    console.log('=' .repeat(60))
    console.log('🎉 Done! Your exercise library is ready to use.\n')

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Seeding failed with error:\n')
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

// Run the seeding script
seedExercises()
