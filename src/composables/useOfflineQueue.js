import { ref } from 'vue'

/**
 * Composable for offline queue management (Phase 3)
 * Currently a stub - will implement retry logic with exponential backoff later
 *
 * @returns {Object} Queue operations
 */
export function useOfflineQueue() {
  const queue = ref([])

  /**
   * Add a change to the queue
   *
   * @param {Object} change - Change object
   */
  function enqueue(change) {
    queue.value.push({
      ...change,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      retryCount: 0,
    })
  }

  /**
   * Remove a change from the queue
   *
   * @param {string} changeId - Change ID
   */
  function dequeue(changeId) {
    queue.value = queue.value.filter((c) => c.id !== changeId)
  }

  /**
   * Process the queue (retry failed operations)
   * TODO: Implement in Phase 3 with exponential backoff
   */
  async function processQueue() {
    // Stub for now - will implement retry logic in Phase 3
  }

  return {
    queue,
    enqueue,
    dequeue,
    processQueue,
  }
}
