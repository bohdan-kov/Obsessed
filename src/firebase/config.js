import { initializeApp } from 'firebase/app'

/**
 * Firebase configuration object
 * All values are loaded from environment variables
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/**
 * Validate Firebase configuration
 * Throws an error if any required environment variable is missing
 */
function validateConfig(config) {
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
      `Missing Firebase configuration: ${missing.join(', ')}. ` +
        'Please check your .env file and ensure all VITE_FIREBASE_* variables are set.'
    )
  }
}

// Validate before initializing
validateConfig(firebaseConfig)

/**
 * Initialize and export Firebase app instance
 * This should be imported by auth.js and firestore.js
 */
export const app = initializeApp(firebaseConfig)
