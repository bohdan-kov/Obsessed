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
}

/**
 * Get reference to a collection
 * @param {string} collectionName
 * @returns {CollectionReference}
 */
export function getCollection(collectionName) {
  return collection(db, collectionName)
}

/**
 * Get reference to a document
 * @param {string} collectionName
 * @param {string} docId
 * @returns {DocumentReference}
 */
export function getDocRef(collectionName, docId) {
  return doc(db, collectionName, docId)
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
    console.error(`Error fetching document ${collectionName}/${docId}:`, error)
    throw new Error('Failed to fetch document')
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
    console.error(`Error fetching collection ${collectionName}:`, error)
    throw new Error('Failed to fetch collection')
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
    console.error(`Error creating document in ${collectionName}:`, error)
    throw new Error('Failed to create document')
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
    console.error(`Error setting document ${collectionName}/${docId}:`, error)
    throw new Error('Failed to set document')
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
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error(
      `Error updating document ${collectionName}/${docId}:`,
      error
    )
    throw new Error('Failed to update document')
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
    console.error(
      `Error deleting document ${collectionName}/${docId}:`,
      error
    )
    throw new Error('Failed to delete document')
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
  errorCallback = console.error
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
  errorCallback = console.error
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
