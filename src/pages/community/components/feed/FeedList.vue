<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIntersectionObserver, useDebounceFn } from '@vueuse/core'
import FeedPostCard from './FeedPostCard.vue'
import EmptyState from '../shared/EmptyState.vue'
import LoadingSkeleton from '../shared/LoadingSkeleton.vue'
import { useFeedStore } from '@/stores/feedStore'
import { useAuthStore } from '@/stores/authStore'

/**
 * FeedList - Feed container with infinite scroll
 *
 * Features:
 * - Infinite scroll with useIntersectionObserver
 * - Load 20 posts initially, +20 on scroll
 * - Loading skeleton (3 placeholder cards)
 * - Empty states per feedType
 * - "You're all caught up!" at end
 * - Pull-to-refresh support (mobile)
 */

const props = defineProps({
  feedType: {
    type: String,
    default: 'following',
    validator: (value) => ['following', 'discover', 'user'].includes(value),
  },
  userId: {
    type: String,
    default: null,
  },
})

const { t } = useI18n()
const feedStore = useFeedStore()
const authStore = useAuthStore()

const loadMoreTrigger = ref(null)
const isRefreshing = ref(false)

const posts = computed(() => feedStore.feedPosts || [])
const isLoading = computed(() => feedStore.feedLoading)
const hasMore = computed(() => feedStore.hasMore)
const isEmpty = computed(() => !isLoading.value && posts.value.length === 0)
const indexBuilding = computed(() => feedStore.indexBuilding)
const retryDelay = computed(() => feedStore.retryDelay)

// Empty state messages per feed type
const emptyStateConfig = computed(() => {
  switch (props.feedType) {
    case 'following':
      return {
        icon: 'users',
        title: t('community.empty.title'),
        description: t('community.feed.emptyFollowing'),
      }
    case 'discover':
      return {
        icon: 'search',
        title: t('community.empty.title'),
        description: t('community.feed.emptyDiscover'),
      }
    case 'you':
      return {
        icon: 'user-plus',
        title: t('community.empty.title'),
        description: t('community.feed.emptyYou'),
      }
    default:
      return {
        icon: 'inbox',
        title: t('community.empty.title'),
        description: t('community.empty.description'),
      }
  }
})

// Initial load
onMounted(async () => {
  await fetchFeed(true)
})

// Watch feedType changes
watch(
  () => props.feedType,
  async () => {
    await fetchFeed(true)
  }
)

// Fetch feed data
async function fetchFeed(refresh = false) {
  try {
    await feedStore.fetchFeed(props.feedType, props.userId, refresh)
  } catch (error) {
    console.error('[FeedList] Error fetching feed:', error)
  }
}

// Debounced load more function to prevent multiple rapid calls
const debouncedLoadMore = useDebounceFn(() => {
  if (hasMore.value && !isLoading.value && !isRefreshing.value) {
    fetchFeed(false)
  }
}, 300)

// Infinite scroll observer with debounced load
const { stop } = useIntersectionObserver(
  loadMoreTrigger,
  ([{ isIntersecting }]) => {
    if (isIntersecting) {
      debouncedLoadMore()
    }
  },
  { threshold: 0.5 }
)

onUnmounted(() => {
  stop()
})

// Pull-to-refresh (mobile)
const handleRefresh = async () => {
  if (isRefreshing.value || isLoading.value) return

  isRefreshing.value = true
  try {
    await fetchFeed(true)
  } finally {
    isRefreshing.value = false
  }
}
</script>

<template>
  <div class="space-y-4 pb-6">
    <!-- Index building state (prioritized) -->
    <div
      v-if="indexBuilding && posts.length === 0"
      class="flex flex-col items-center justify-center py-12 space-y-4 text-center"
    >
      <div class="relative">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" />
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="h-12 w-12 rounded-full bg-background" />
        </div>
      </div>
      <div class="space-y-2">
        <h3 class="text-lg font-semibold">{{ t('community.errors.indexBuilding') }}</h3>
        <p class="text-sm text-muted-foreground max-w-md">
          {{ t('community.errors.indexBuildingDescription') }}
        </p>
        <p v-if="retryDelay > 0" class="text-xs text-primary font-medium mt-3">
          {{ t('community.errors.retrying', { seconds: retryDelay }) }}
        </p>
      </div>
    </div>

    <!-- Pull-to-refresh indicator (mobile) -->
    <div
      v-else-if="isRefreshing"
      class="flex items-center justify-center py-4 text-muted-foreground"
    >
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      <span class="ml-2 text-sm">{{ t('community.feed.loadingMore') }}</span>
    </div>

    <!-- Loading skeleton (initial load) -->
    <LoadingSkeleton
      v-else-if="isLoading && posts.length === 0 && !indexBuilding"
      variant="post"
      :count="3"
    />

    <!-- Empty state -->
    <EmptyState
      v-else-if="isEmpty && !indexBuilding"
      :icon="emptyStateConfig.icon"
      :title="emptyStateConfig.title"
      :description="emptyStateConfig.description"
    />

    <!-- Feed posts -->
    <template v-else>
      <FeedPostCard v-for="post in posts" :key="post.id" :post="post" />

      <!-- Load more trigger -->
      <div ref="loadMoreTrigger" class="h-20 flex items-center justify-center">
        <LoadingSkeleton v-if="isLoading && hasMore" variant="post" :count="1" />
      </div>

      <!-- End of feed message -->
      <div
        v-if="!hasMore && posts.length > 0"
        class="text-center py-8 text-muted-foreground"
      >
        <p class="text-lg font-medium">{{ t('community.feed.endOfFeed') }}</p>
      </div>
    </template>
  </div>
</template>
