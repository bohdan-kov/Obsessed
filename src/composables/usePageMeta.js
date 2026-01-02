import { inject, watch, onUnmounted, isRef } from 'vue'

/**
 * Composable for setting page metadata (title and description) for mobile header.
 * Uses Vue's provide/inject pattern to communicate with AppLayout.
 *
 * @param {import('vue').Ref<string> | string} title - Page title (can be a ref or string)
 * @param {import('vue').Ref<string> | string} description - Optional page description (can be a ref or string)
 *
 * @example
 * // In a page component
 * import { usePageMeta } from '@/composables/usePageMeta'
 * import { useI18n } from 'vue-i18n'
 * import { computed } from 'vue'
 *
 * const { t } = useI18n()
 * usePageMeta(
 *   computed(() => t('exercises.title')),
 *   computed(() => t('exercises.description'))
 * )
 */
export function usePageMeta(title, description = '') {
  const pageMeta = inject('pageMeta', null)

  if (!pageMeta) {
    console.warn(
      'usePageMeta: pageMeta not provided. Make sure AppLayout provides pageMeta context.'
    )
    return
  }

  // CRITICAL FIX: If title/description are refs/computed, watch them directly
  // This ensures proper reactivity on all platforms including mobile
  const titleSource = isRef(title) ? title : () => title
  const descriptionSource = isRef(description) ? description : () => description

  // Watch for changes in title and description with deep reactivity
  watch(
    [titleSource, descriptionSource],
    ([newTitle, newDescription]) => {
      pageMeta.value = {
        title: newTitle || '',
        description: newDescription || '',
      }
    },
    { immediate: true, flush: 'sync' }
  )

  // Clear metadata on unmount
  onUnmounted(() => {
    if (pageMeta) {
      pageMeta.value = { title: '', description: '' }
    }
  })
}
