<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle, Share2, MoreVertical, Flag, ShieldAlert } from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import UserAvatar from '@/pages/community/components/shared/UserAvatar.vue'
import FollowButton from '@/pages/community/components/follow/FollowButton.vue'
import WorkoutSummaryCard from '@/pages/community/components/feed/WorkoutSummaryCard.vue'
import LikeButton from '@/pages/community/components/feed/LikeButton.vue'
import CommentSection from '@/pages/community/components/interactions/CommentSection.vue'
import ReportModal from '@/pages/community/components/shared/ReportModal.vue'
import BlockConfirmDialog from '@/pages/community/components/shared/BlockConfirmDialog.vue'
import { useAuthStore } from '@/stores/authStore'
import { useFeedStore } from '@/stores/feedStore'
import { useToast } from '@/components/ui/toast/use-toast'

/**
 * FeedPostCard - Feed post card component
 *
 * Features:
 * - Header: Avatar + Name + Timestamp + FollowButton (if not following)
 * - Caption: Text with "See more" if >3 lines
 * - WorkoutSummaryCard: Embedded workout
 * - Actions row: Like, Comment, Share buttons
 * - CommentSection: Collapsed by default, toggle on comment button click
 */

const props = defineProps({
  post: {
    type: Object,
    required: true,
    validator: (post) => post && post.id && post.userId && post.workout,
  },
})

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const feedStore = useFeedStore()
const { toast } = useToast()

const showFullCaption = ref(false)
const showComments = ref(false)
const showReportModal = ref(false)
const showBlockDialog = ref(false)

const isOwnPost = computed(() => props.post.userId === authStore.uid)

// Format time ago
const timeAgo = computed(() => {
  const now = new Date()
  const createdAt = new Date(props.post.createdAt)
  const diffMs = now - createdAt
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return t('community.time.justNow')
  if (diffMins < 60) return t('community.time.minutesAgo', { count: diffMins })

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return t('community.time.hoursAgo', { count: diffHours })

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return t('community.time.daysAgo', { count: diffDays })

  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks < 4) return t('community.time.weeksAgo', { count: diffWeeks })

  const diffMonths = Math.floor(diffDays / 30)
  return t('community.time.monthsAgo', { count: diffMonths })
})

// Caption with "See more" truncation
const captionLines = computed(() => {
  if (!props.post.caption) return []
  return props.post.caption.split('\n')
})

const truncatedCaption = computed(() => {
  if (showFullCaption.value || captionLines.value.length <= 3) {
    return props.post.caption
  }
  return captionLines.value.slice(0, 3).join('\n')
})

const shouldShowSeeMore = computed(() => {
  return captionLines.value.length > 3 && !showFullCaption.value
})

const navigateToProfile = () => {
  // Navigate to profile using userId (not displayName)
  // For MVP: username param = userId
  if (props.post.userId) {
    router.push({
      name: 'UserProfile',
      params: { username: props.post.userId },
    })
  }
}

const navigateToWorkout = () => {
  if (props.post.workoutId) {
    router.push({
      name: 'WorkoutDetail',
      params: { id: props.post.workoutId },
      query: { from: 'community' },
    })
  }
}

const toggleComments = () => {
  showComments.value = !showComments.value
}

const handleShare = async () => {
  // Native share API if available
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${props.post.user?.displayName}'s workout`,
        text: props.post.caption || 'Check out this workout!',
        url: window.location.href,
      })
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('[FeedPostCard] Error sharing:', error)
      }
    }
  } else {
    // Fallback: Copy link to clipboard
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast({
        title: t('common.copied'),
        description: 'Link copied to clipboard',
      })
    } catch (error) {
      console.error('[FeedPostCard] Error copying link:', error)
    }
  }
}

const handleDelete = async () => {
  try {
    await feedStore.deletePost(props.post.id)
    toast({
      title: t('community.share.delete'),
      description: t('community.share.deleteConfirm'),
    })
  } catch (error) {
    console.error('[FeedPostCard] Error deleting post:', error)
    toast({
      title: t('community.errors.deleteFailed'),
      variant: 'destructive',
    })
  }
}

const handleReport = () => {
  showReportModal.value = true
}

const handleBlock = () => {
  showBlockDialog.value = true
}

const onReportSubmitted = () => {
  showReportModal.value = false
  toast({
    title: t('community.report.thankYou'),
    description: t('community.report.reviewMessage'),
  })
}

const onUserBlocked = () => {
  showBlockDialog.value = false
  // FeedPostCard will be removed from the feed by removePostsByUser in BlockConfirmDialog
}
</script>

<template>
  <Card class="overflow-hidden">
    <!-- Header -->
    <CardHeader class="pb-3">
      <div class="flex items-start gap-3">
        <!-- Avatar -->
        <UserAvatar
          v-if="post.user"
          :user="post.user"
          size="md"
          class="cursor-pointer"
          @click="navigateToProfile"
        />

        <!-- User info -->
        <div class="flex-1 min-w-0">
          <button
            class="font-semibold hover:underline text-sm"
            @click="navigateToProfile"
          >
            {{ post.user?.displayName || 'Anonymous' }}
          </button>
          <p class="text-xs text-muted-foreground">{{ timeAgo }}</p>
        </div>

        <!-- Follow button (if not following and not own post) -->
        <FollowButton
          v-if="!isOwnPost"
          :user-id="post.userId"
          :username="post.user?.displayName"
          variant="outline"
          size="sm"
        />

        <!-- More options -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" class="h-8 w-8">
              <MoreVertical class="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <!-- Own post actions -->
            <template v-if="isOwnPost">
              <DropdownMenuItem class="text-destructive" @click="handleDelete">
                {{ t('community.share.delete') }}
              </DropdownMenuItem>
            </template>

            <!-- Other user's post actions -->
            <template v-else>
              <DropdownMenuItem class="gap-2" @click="handleReport">
                <Flag class="w-4 h-4" />
                {{ t('community.report.reportPost') }}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem class="gap-2 text-destructive" @click="handleBlock">
                <ShieldAlert class="w-4 h-4" />
                {{ t('community.block.blockUser') }}
              </DropdownMenuItem>
            </template>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardHeader>

    <!-- Content -->
    <CardContent class="space-y-3 pb-3">
      <!-- Caption -->
      <div v-if="post.caption" class="text-sm whitespace-pre-wrap">
        <p>{{ truncatedCaption }}</p>
        <button
          v-if="shouldShowSeeMore"
          class="text-muted-foreground hover:text-foreground font-medium mt-1"
          @click="showFullCaption = true"
        >
          {{ t('common.seeMore') }}...
        </button>
      </div>

      <!-- Workout Summary -->
      <WorkoutSummaryCard :workout="post.workout" @click="navigateToWorkout" />
    </CardContent>

    <!-- Actions -->
    <CardFooter class="flex flex-col gap-3 pt-0">
      <div class="flex items-center gap-2 w-full">
        <!-- Like button -->
        <LikeButton
          :post-id="post.id"
          :initial-like-count="post.likeCount || 0"
          :initial-is-liked="post.isLiked || false"
          :author-id="post.userId"
        />

        <!-- Comment button -->
        <Button
          variant="ghost"
          size="sm"
          class="min-h-11 gap-2"
          @click="toggleComments"
        >
          <MessageCircle class="w-5 h-5" />
          <span class="text-sm font-medium">{{ post.commentCount || 0 }}</span>
        </Button>

        <!-- Share button -->
        <Button variant="ghost" size="sm" class="min-h-11" @click="handleShare">
          <Share2 class="w-5 h-5" />
        </Button>
      </div>

      <!-- Comment Section (collapsible) -->
      <CommentSection
        v-if="showComments"
        :post-id="post.id"
        :post-author-id="post.userId"
        :initial-comment-count="post.commentCount || 0"
        :is-expanded="showComments"
        @toggle-expanded="toggleComments"
      />
    </CardFooter>

    <!-- Report Modal -->
    <ReportModal
      v-model:open="showReportModal"
      type="post"
      :target-id="post.id"
      :target-user-id="post.userId"
      @submitted="onReportSubmitted"
    />

    <!-- Block Confirm Dialog -->
    <BlockConfirmDialog
      v-model:open="showBlockDialog"
      :user-id="post.userId"
      :username="post.user?.displayName || ''"
      @blocked="onUserBlocked"
    />
  </Card>
</template>
