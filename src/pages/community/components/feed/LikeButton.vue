<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-vue-next'
import { useFeedStore } from '@/stores/feedStore'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/toast/use-toast'

/**
 * LikeButton - Like button with optimistic updates
 *
 * Features:
 * - States: Not liked (❤️ outline), Liked (❤️ filled red)
 * - Counter: "24 likes" (tap counter to see list - future feature)
 * - Optimistic update: instant UI change, background sync
 * - Haptic feedback on mobile (if supported)
 * - Can't like own posts (disabled)
 */

const props = defineProps({
  postId: {
    type: String,
    required: true,
  },
  initialLikeCount: {
    type: Number,
    default: 0,
  },
  initialIsLiked: {
    type: Boolean,
    default: false,
  },
  authorId: {
    type: String,
    default: '',
  },
})

const { t } = useI18n()
const { toast } = useToast()
const feedStore = useFeedStore()
const authStore = useAuthStore()

// Local state for optimistic updates
const likeCount = ref(props.initialLikeCount)
const isLiked = ref(props.initialIsLiked)
const isLoading = ref(false)

// Watch for prop changes (when store updates)
watch(
  () => props.initialLikeCount,
  (newCount) => {
    likeCount.value = newCount
  }
)

watch(
  () => props.initialIsLiked,
  (newValue) => {
    isLiked.value = newValue
  }
)

// Check if this is user's own post (can't like own posts)
const isOwnPost = computed(() => props.authorId === authStore.uid)

const handleLike = async () => {
  if (!authStore.uid) {
    toast({
      title: t('community.errors.authRequired'),
      variant: 'destructive',
    })
    return
  }

  if (isOwnPost.value) {
    return // Can't like own post
  }

  if (isLoading.value) {
    return // Prevent double-click
  }

  isLoading.value = true

  // Store previous state for rollback
  const previousLikeCount = likeCount.value
  const previousIsLiked = isLiked.value

  try {
    if (isLiked.value) {
      // Optimistic update: Unlike
      isLiked.value = false
      likeCount.value = Math.max(0, likeCount.value - 1)

      // Haptic feedback (mobile)
      if (navigator.vibrate) {
        navigator.vibrate(10)
      }

      // Background sync
      await feedStore.unlikePost(props.postId)
    } else {
      // Optimistic update: Like
      isLiked.value = true
      likeCount.value += 1

      // Haptic feedback (mobile)
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }

      // Background sync
      await feedStore.likePost(props.postId)
    }
  } catch (error) {
    // Rollback optimistic update on error
    isLiked.value = previousIsLiked
    likeCount.value = previousLikeCount

    console.error('[LikeButton] Error toggling like:', error)
    toast({
      title: t('community.errors.likeFailed'),
      variant: 'destructive',
    })
  } finally {
    isLoading.value = false
  }
}

const handleCountClick = () => {
  // TODO: Show likes list modal
  // For MVP, just show count
  if (likeCount.value > 0) {
    toast({
      title: t('community.like.likedBy'),
      description: t('community.like.count', { count: likeCount.value }),
    })
  }
}
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- Like button -->
    <Button
      variant="ghost"
      size="sm"
      :disabled="isOwnPost || isLoading"
      :class="[
        'min-h-11 gap-2',
        isLiked && 'text-red-500 hover:text-red-600',
        isOwnPost && 'cursor-not-allowed opacity-50',
      ]"
      :aria-label="isLiked ? t('community.like.liked') : t('community.like.button')"
      @click="handleLike"
    >
      <Heart
        :class="['w-5 h-5 transition-all', isLiked && 'fill-current']"
        :stroke-width="isLiked ? 2 : 2"
      />
      <span class="text-sm font-medium">{{ likeCount }}</span>
    </Button>
  </div>
</template>
