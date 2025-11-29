import { ref, onUnmounted, readonly } from 'vue'
import {
  subscribeToDocument,
  subscribeToCollection,
} from '@/firebase/firestore'

/**
 * Composable for real-time Firestore document subscription
 * Automatically cleans up listener on component unmount
 *
 * @param {string} collectionName - Firestore collection name
 * @param {string|Ref<string>} docId - Document ID (can be reactive)
 * @returns {Object} { data, loading, error }
 *
 * @example
 * const { data: user, loading, error } = useDocument('users', userId)
 */
export function useDocument(collectionName, docId) {
  const data = ref(null)
  const loading = ref(true)
  const error = ref(null)

  let unsubscribe = null

  // Subscribe to document changes
  const subscribe = (id) => {
    if (!id) {
      loading.value = false
      return
    }

    loading.value = true
    error.value = null

    unsubscribe = subscribeToDocument(
      collectionName,
      id,
      (docData) => {
        data.value = docData
        loading.value = false
      },
      (err) => {
        console.error(`Error in useDocument(${collectionName}/${id}):`, err)
        error.value = err.message || 'Failed to load document'
        loading.value = false
      }
    )
  }

  // If docId is a ref, watch for changes
  if (typeof docId === 'object' && 'value' in docId) {
    // Reactive docId
    const stopWatch = watch(
      () => docId.value,
      (newId) => {
        if (unsubscribe) unsubscribe()
        subscribe(newId)
      },
      { immediate: true }
    )

    onUnmounted(() => {
      stopWatch()
      if (unsubscribe) unsubscribe()
    })
  } else {
    // Static docId
    subscribe(docId)

    onUnmounted(() => {
      if (unsubscribe) unsubscribe()
    })
  }

  return {
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),
  }
}

/**
 * Composable for real-time Firestore collection subscription
 * Automatically cleans up listener on component unmount
 *
 * @param {string} collectionName - Firestore collection name
 * @param {Object} options - Query options { where, orderBy, limit }
 * @returns {Object} { data, loading, error }
 *
 * @example
 * const { data: workouts, loading, error } = useCollection('workouts', {
 *   where: [['userId', '==', userId.value]],
 *   orderBy: [['createdAt', 'desc']],
 *   limit: 10
 * })
 */
export function useCollection(collectionName, options = {}) {
  const data = ref([])
  const loading = ref(true)
  const error = ref(null)

  // Subscribe to collection changes
  const unsubscribe = subscribeToCollection(
    collectionName,
    options,
    (documents) => {
      data.value = documents
      loading.value = false
    },
    (err) => {
      console.error(`Error in useCollection(${collectionName}):`, err)
      error.value = err.message || 'Failed to load collection'
      loading.value = false
    }
  )

  // Cleanup on unmount
  onUnmounted(() => {
    unsubscribe()
  })

  return {
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),
  }
}

/**
 * Composable for loading multiple documents by IDs
 * Useful when you have an array of document IDs to fetch
 *
 * @param {string} collectionName - Firestore collection name
 * @param {Array<string>|Ref<Array<string>>} docIds - Array of document IDs
 * @returns {Object} { data, loading, error }
 *
 * @example
 * const exerciseIds = ref(['ex1', 'ex2', 'ex3'])
 * const { data: exercises, loading } = useDocuments('exercises', exerciseIds)
 */
export function useDocuments(collectionName, docIds) {
  const data = ref([])
  const loading = ref(true)
  const error = ref(null)

  const unsubscribers = ref([])

  const subscribe = (ids) => {
    // Clear previous subscriptions
    unsubscribers.value.forEach((unsub) => unsub())
    unsubscribers.value = []

    if (!ids || ids.length === 0) {
      data.value = []
      loading.value = false
      return
    }

    loading.value = true
    error.value = null

    const documents = ref({})
    let loadedCount = 0

    ids.forEach((id) => {
      const unsub = subscribeToDocument(
        collectionName,
        id,
        (docData) => {
          documents.value[id] = docData
          loadedCount++

          if (loadedCount === ids.length) {
            data.value = Object.values(documents.value).filter(Boolean)
            loading.value = false
          }
        },
        (err) => {
          console.error(
            `Error loading document ${collectionName}/${id}:`,
            err
          )
          error.value = err.message || 'Failed to load documents'
          loadedCount++

          if (loadedCount === ids.length) {
            data.value = Object.values(documents.value).filter(Boolean)
            loading.value = false
          }
        }
      )

      unsubscribers.value.push(unsub)
    })
  }

  // If docIds is a ref, watch for changes
  if (typeof docIds === 'object' && 'value' in docIds) {
    const stopWatch = watch(
      () => docIds.value,
      (newIds) => {
        subscribe(newIds)
      },
      { immediate: true }
    )

    onUnmounted(() => {
      stopWatch()
      unsubscribers.value.forEach((unsub) => unsub())
    })
  } else {
    subscribe(docIds)

    onUnmounted(() => {
      unsubscribers.value.forEach((unsub) => unsub())
    })
  }

  return {
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),
  }
}
