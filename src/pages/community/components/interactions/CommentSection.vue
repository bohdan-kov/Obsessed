<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import CommentItem from './CommentItem.vue'
import { useFeedStore } from '@/stores/feedStore'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/toast/use-toast'

/**
 * CommentSection - Comment list and input
 *
 * Features:
 * - Comment input (collapsed by default, expands on focus)
 * - "Add a comment..." placeholder
 * - Max 500 chars with counter
 * - Submit button (enabled when text present)
 * - Comments list (show latest 2, "View all X comments" to expand)
 * - Sorted: Oldest first (from Firestore)
 * - Pagination: Load 20 at a time
 */

const props = defineProps({
  postId: {
    type: String,
    required: true,
  },
  postAuthorId: {
    type: String,
    default: '',
  },
  initialCommentCount: {
    type: Number,
    default: 0,
  },
  isExpanded: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle-expanded'])

const { t } = useI18n()
const { toast } = useToast()
const feedStore = useFeedStore()
const authStore = useAuthStore()

const commentText = ref('')
const isSubmitting = ref(false)
const showInput = ref(false)
const textareaRef = ref(null)

const MAX_CHARS = 500

// Comments from store
const allComments = computed(() => feedStore.comments || [])
const commentCount = computed(() => props.initialCommentCount || allComments.value.length)

// Show latest 2 comments when collapsed
const displayedComments = computed(() => {
  if (props.isExpanded) {
    return allComments.value
  }
  return allComments.value.slice(-2)
})

const hasMoreComments = computed(() => commentCount.value > 2 && !props.isExpanded)
const remainingChars = computed(() => MAX_CHARS - commentText.value.length)
const canSubmit = computed(() => commentText.value.trim().length > 0 && !isSubmitting.value)

// Auto-focus textarea when showInput becomes true
watch(showInput, async (newValue) => {
  if (newValue) {
    await nextTick()
    textareaRef.value?.focus()
  }
})

const handleViewAll = async () => {
  if (!props.isExpanded) {
    // Fetch comments from store
    try {
      await feedStore.fetchComments(props.postId)
    } catch (error) {
      console.error('[CommentSection] Error fetching comments:', error)
      toast({
        title: t('community.errors.loadFeedFailed'),
        variant: 'destructive',
      })
    }
  }
  emit('toggle-expanded')
}

const handleSubmit = async () => {
  if (!canSubmit.value) return

  if (!authStore.uid) {
    toast({
      title: t('community.errors.authRequired'),
      variant: 'destructive',
    })
    return
  }

  isSubmitting.value = true

  try {
    await feedStore.addComment(props.postId, commentText.value.trim())
    commentText.value = ''
    showInput.value = false

    toast({
      title: t('community.comment.submit'),
    })
  } catch (error) {
    console.error('[CommentSection] Error adding comment:', error)
    toast({
      title: t('community.errors.commentFailed'),
      variant: 'destructive',
    })
  } finally {
    isSubmitting.value = false
  }
}

const handleCommentDeleted = (commentId) => {
  // Optimistic update handled by store
  console.log('[CommentSection] Comment deleted:', commentId)
}
</script>

<template>
  <div class="space-y-3 pt-2 border-t">
    <!-- View all comments button -->
    <Button
      v-if="hasMoreComments"
      variant="ghost"
      size="sm"
      class="text-muted-foreground hover:text-foreground -ml-2"
      @click="handleViewAll"
    >
      {{ t('community.comment.viewAll', { count: commentCount }) }}
    </Button>

    <!-- Comments list -->
    <div v-if="displayedComments.length > 0" class="space-y-1">
      <CommentItem
        v-for="comment in displayedComments"
        :key="comment.id"
        :comment="comment"
        :post-id="postId"
        :post-author-id="postAuthorId"
        @deleted="handleCommentDeleted"
      />
    </div>

    <!-- Comment input toggle -->
    <div v-if="!showInput" class="pt-1">
      <Button
        variant="ghost"
        size="sm"
        class="text-muted-foreground hover:text-foreground w-full justify-start -ml-2"
        @click="showInput = true"
      >
        {{ t('community.comment.add') }}
      </Button>
    </div>

    <!-- Comment input form -->
    <div v-else class="space-y-2">
      <Textarea
        ref="textareaRef"
        v-model="commentText"
        :placeholder="t('community.comment.placeholder')"
        :maxlength="MAX_CHARS"
        class="min-h-20 resize-none"
        :disabled="isSubmitting"
        @keydown.meta.enter="handleSubmit"
        @keydown.ctrl.enter="handleSubmit"
      />

      <div class="flex items-center justify-between gap-2">
        <!-- Character counter -->
        <span
          :class="[
            'text-xs',
            remainingChars < 50 ? 'text-destructive font-medium' : 'text-muted-foreground',
          ]"
        >
          {{ remainingChars }} / {{ MAX_CHARS }}
        </span>

        <!-- Actions -->
        <div class="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            :disabled="isSubmitting"
            @click="
              () => {
                commentText = ''
                showInput = false
              }
            "
          >
            {{ t('community.share.cancel') }}
          </Button>
          <Button size="sm" :disabled="!canSubmit" @click="handleSubmit">
            {{ isSubmitting ? t('community.feed.loadingMore') : t('community.comment.submit') }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
