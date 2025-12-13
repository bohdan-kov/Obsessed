import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { app } from './config'

/**
 * Initialize Firestore with offline persistence
 * Uses persistent cache with multi-tab support
 */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
})

/**
 * Collection names enum for type safety and consistency
 */
export const COLLECTIONS = {
  USERS: 'users',
  WORKOUTS: 'workouts',
  EXERCISES: 'exercises',
  USER_EXERCISES: 'user_exercises',
  PERSONAL_RECORDS: 'personal_records',
  MUSCLE_GROUPS: 'muscle_groups',
  WORKOUT_PLANS: 'workoutPlans',
}

/**
 * Remove undefined values from an object recursively
 * Firestore's updateDoc does NOT accept undefined values - they must be removed or set to null
 * @param {Object} obj - Object to clean
 * @returns {Object} New object without undefined values
 */
function removeUndefinedValues(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedValues)
  }

  // Handle objects
  const cleaned = {}
  for (const [key, value] of Object.entries(obj)) {
    // Skip undefined values entirely
    if (value === undefined) {
      continue
    }

    // Recursively clean nested objects/arrays
    if (value !== null && typeof value === 'object') {
      cleaned[key] = removeUndefinedValues(value)
    } else {
      cleaned[key] = value
    }
  }

  return cleaned
}

/**
 * Get reference to a collection
 * Handles both simple paths (e.g., 'users') and nested paths (e.g., 'users/userId/exerciseNotes')
 * @param {string} collectionName - Collection path (can contain slashes for nested collections)
 * @returns {CollectionReference}
 */
export function getCollection(collectionName) {
  // Split the collection name by slashes to handle nested paths
  const pathSegments = collectionName.split('/').filter(Boolean)
  return collection(db, ...pathSegments)
}

/**
 * Get reference to a document
 * Handles both simple paths (e.g., 'users', 'userId') and nested paths (e.g., 'users/userId/exerciseNotes')
 * @param {string} collectionName - Collection path (can contain slashes for nested collections)
 * @param {string} docId - Document ID
 * @returns {DocumentReference}
 */
export function getDocRef(collectionName, docId) {
  // Split the collection name by slashes to handle nested paths
  const pathSegments = collectionName.split('/').filter(Boolean)
  return doc(db, ...pathSegments, docId)
}

/**
 * Get reference to a nested document
 * @param {string} path - Path segments (e.g., 'users', userId, 'workouts', workoutId)
 * @returns {DocumentReference}
 */
export function getNestedDocRef(...pathSegments) {
  return doc(db, ...pathSegments)
}

/**
 * Fetch a single document
 * @param {string} collectionName
 * @param {string} docId
 * @returns {Promise<Object|null>} Document data or null if not found
 */
export async function fetchDocument(collectionName, docId) {
  try {
    const docRef = getDocRef(collectionName, docId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      }
    }

    return null
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`Error fetching document ${collectionName}/${docId}:`, error)
    }
    throw new Error(`Failed to fetch document ${collectionName}/${docId}: ${error.message}`)
  }
}

/**
 * Fetch all documents from a collection
 * @param {string} collectionName
 * @param {Object} options - Query options (where, orderBy, limit)
 * @returns {Promise<Array>} Array of documents
 */
export async function fetchCollection(collectionName, options = {}) {
  try {
    const colRef = getCollection(collectionName)
    let q = colRef

    // Apply where clauses
    if (options.where) {
      options.where.forEach(([field, operator, value]) => {
        q = query(q, where(field, operator, value))
      })
    }

    // Apply orderBy
    if (options.orderBy) {
      options.orderBy.forEach(([field, direction = 'asc']) => {
        q = query(q, orderBy(field, direction))
      })
    }

    // Apply limit
    if (options.limit) {
      q = query(q, limit(options.limit))
    }

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`Error fetching collection ${collectionName}:`, error)
    }
    throw new Error(`Failed to fetch collection ${collectionName}: ${error.message}`)
  }
}

/**
 * Create a new document with auto-generated ID
 * @param {string} collectionName
 * @param {Object} data
 * @returns {Promise<string>} Document ID
 */
export async function createDocument(collectionName, data) {
  try {
    const colRef = getCollection(collectionName)
    const docRef = await addDoc(colRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`Error creating document in ${collectionName}:`, error)
    }
    throw new Error(`Failed to create document in ${collectionName}: ${error.message}`)
  }
}

/**
 * Set a document with a specific ID (creates or overwrites)
 * @param {string} collectionName
 * @param {string} docId
 * @param {Object} data
 * @param {Object} options - { merge: boolean }
 * @returns {Promise<void>}
 */
export async function setDocument(collectionName, docId, data, options = {}) {
  try {
    const docRef = getDocRef(collectionName, docId)
    await setDoc(
      docRef,
      {
        ...data,
        updatedAt: serverTimestamp(),
      },
      options
    )
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`Error setting document ${collectionName}/${docId}:`, error)
    }
    throw new Error(`Failed to set document ${collectionName}/${docId}: ${error.message}`)
  }
}

/**
 * Update an existing document
 * @param {string} collectionName
 * @param {string} docId
 * @param {Object} data
 * @returns {Promise<void>}
 */
export async function updateDocument(collectionName, docId, data) {
  try {
    const docRef = getDocRef(collectionName, docId)

    // Remove undefined values from data to prevent Firestore errors
    // Firestore's updateDoc() does not accept undefined values
    const sanitizedData = removeUndefinedValues({
      ...data,
      updatedAt: serverTimestamp(),
    })

    await updateDoc(docRef, sanitizedData)
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(
        `Error updating document ${collectionName}/${docId}:`,
        error,
        'Original data:',
        data
      )
    }
    throw new Error(`Failed to update document ${collectionName}/${docId}: ${error.message}`)
  }
}

/**
 * Delete a document
 * @param {string} collectionName
 * @param {string} docId
 * @returns {Promise<void>}
 */
export async function deleteDocument(collectionName, docId) {
  try {
    const docRef = getDocRef(collectionName, docId)
    await deleteDoc(docRef)
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(
        `Error deleting document ${collectionName}/${docId}:`,
        error
      )
    }
    throw new Error(`Failed to delete document ${collectionName}/${docId}: ${error.message}`)
  }
}

/**
 * Subscribe to real-time updates for a document
 * @param {string} collectionName
 * @param {string} docId
 * @param {Function} callback - Called with document data
 * @param {Function} errorCallback - Called on error
 * @returns {Function} Unsubscribe function
 */
export function subscribeToDocument(
  collectionName,
  docId,
  callback,
  errorCallback = (error) => {
    if (import.meta.env.DEV) {
      console.error(error)
    }
  }
) {
  const docRef = getDocRef(collectionName, docId)

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback({
          id: docSnap.id,
          ...docSnap.data(),
        })
      } else {
        callback(null)
      }
    },
    errorCallback
  )
}

/**
 * Subscribe to real-time updates for a collection
 * @param {string} collectionName
 * @param {Object} options - Query options
 * @param {Function} callback - Called with array of documents
 * @param {Function} errorCallback - Called on error
 * @returns {Function} Unsubscribe function
 */
export function subscribeToCollection(
  collectionName,
  options = {},
  callback,
  errorCallback = (error) => {
    if (import.meta.env.DEV) {
      console.error(error)
    }
  }
) {
  const colRef = getCollection(collectionName)
  let q = colRef

  // Apply where clauses
  if (options.where) {
    options.where.forEach(([field, operator, value]) => {
      q = query(q, where(field, operator, value))
    })
  }

  // Apply orderBy
  if (options.orderBy) {
    options.orderBy.forEach(([field, direction = 'asc']) => {
      q = query(q, orderBy(field, direction))
    })
  }

  // Apply limit
  if (options.limit) {
    q = query(q, limit(options.limit))
  }

  return onSnapshot(
    q,
    (querySnapshot) => {
      const documents = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      callback(documents)
    },
    errorCallback
  )
}

/**
 * Export Firestore utilities
 */
export {
  serverTimestamp,
  Timestamp,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
}
