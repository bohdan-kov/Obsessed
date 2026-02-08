<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Trash2, Flag } from 'lucide-vue-next'
import UserAvatar from '@/pages/community/components/shared/UserAvatar.vue'
import ReportModal from '@/pages/community/components/shared/ReportModal.vue'
import { useAuthStore } from '@/stores/authStore'
import { useFeedStore } from '@/stores/feedStore'
import { useToast } from '@/components/ui/toast/use-toast'

/**
 * CommentItem - Single comment display
 *
 * Features:
 * - Avatar (32px) + Name + Timestamp
 * - Comment text (linkified URLs)
 * - Delete button (if own comment or own post)
 * - Confirmation dialog for delete
 * - Time ago formatting
 */

const props = defineProps({
  comment: {
    type: Object,
    required: true,
    validator: (comment) => comment && comment.id && comment.userId && comment.text,
  },
  postId: {
    type: String,
    required: true,
  },
  postAuthorId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['deleted'])

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const feedStore = useFeedStore()
const { toast } = useToast()

const showReportModal = ref(false)

// Check if current user can delete this comment
// User can delete if: own comment OR own post
const canDelete = computed(() => {
  return props.comment.userId === authStore.uid || props.postAuthorId === authStore.uid
})

// Check if comment is from another user (can be reported)
const canReport = computed(() => {
  return props.comment.userId !== authStore.uid
})

// Format time ago
const timeAgo = computed(() => {
  const now = new Date()
  const createdAt = new Date(props.comment.createdAt)
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

// Linkify URLs in comment text
const linkifiedText = computed(() => {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return props.comment.text.replace(
    urlRegex,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline">$1</a>'
  )
})

const navigateToProfile = () => {
  if (props.comment.userId) {
    router.push({
      name: 'UserProfile',
      params: { username: props.comment.userId },
    })
  }
}

const handleDelete = async () => {
  try {
    await feedStore.deleteComment(props.postId, props.comment.id)
    toast({
      title: t('community.comment.delete'),
      description: t('community.comment.deleteConfirm'),
    })
    emit('deleted', props.comment.id)
  } catch (error) {
    console.error('[CommentItem] Error deleting comment:', error)
    toast({
      title: t('community.errors.deleteFailed'),
      variant: 'destructive',
    })
  }
}

const handleReport = () => {
  showReportModal.value = true
}

const onReportSubmitted = () => {
  showReportModal.value = false
  toast({
    title: t('community.report.thankYou'),
    description: t('community.report.reviewMessage'),
  })
}
</script>

<template>
  <div class="flex gap-2 py-2 group">
    <!-- Avatar -->
    <UserAvatar
      v-if="comment.user"
      :user="comment.user"
      size="sm"
      class="flex-shrink-0"
      @click="navigateToProfile"
    />

    <!-- Comment content -->
    <div class="flex-1 min-w-0 space-y-0.5">
      <!-- Name + Timestamp -->
      <div class="flex items-center gap-2 text-xs">
        <button
          class="font-semibold text-sm hover:underline"
          @click="navigateToProfile"
        >
          {{ comment.user?.displayName || 'Anonymous' }}
        </button>
        <span class="text-muted-foreground">{{ timeAgo }}</span>
      </div>

      <!-- Comment text (linkified) -->
      <p class="text-sm break-words" v-html="linkifiedText" />
    </div>

    <!-- Action buttons -->
    <div class="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
      <!-- Report button (if can report) -->
      <Button
        v-if="canReport"
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        @click="handleReport"
      >
        <Flag class="w-4 h-4" />
      </Button>

      <!-- Delete button (if can delete) -->
      <AlertDialog v-if="canDelete">
        <AlertDialogTrigger as-child>
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8"
          >
            <Trash2 class="w-4 h-4 text-destructive" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{{ t('community.comment.delete') }}</AlertDialogTitle>
            <AlertDialogDescription>
              {{ t('community.comment.deleteConfirm') }}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel as-child>
              <Button variant="outline" class="min-h-11 min-w-11">
                {{ t('community.share.cancel') }}
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction as-child>
              <Button variant="destructive" class="min-h-11 min-w-11" @click="handleDelete">
                {{ t('community.comment.delete') }}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>

    <!-- Report Modal -->
    <ReportModal
      v-model:open="showReportModal"
      type="comment"
      :target-id="comment.id"
      :target-user-id="comment.userId"
      @submitted="onReportSubmitted"
    />
  </div>
</template>
