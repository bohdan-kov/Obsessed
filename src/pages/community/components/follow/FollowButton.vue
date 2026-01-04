<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { UserPlus, UserCheck, UserMinus } from 'lucide-vue-next'
import { useCommunityStore } from '@/stores/communityStore'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/toast/use-toast'

/**
 * FollowButton - Follow/Unfollow button component
 *
 * States:
 * - Not following: "Follow" (blue button)
 * - Pending: "Requested" (gray, disabled) - for friends-only profiles
 * - Following: "Following" (gray with checkmark)
 * - Hover on Following: "Unfollow" (red)
 *
 * Features:
 * - Optimistic updates (instant UI change)
 * - Confirmation dialog for unfollow
 * - Mobile-friendly (min 44x44px)
 * - Can't follow yourself (button hidden)
 */

const props = defineProps({
  userId: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    default: '',
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'outline', 'ghost'].includes(value),
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'sm', 'lg'].includes(value),
  },
})

const { t } = useI18n()
const { toast } = useToast()
const communityStore = useCommunityStore()
const authStore = useAuthStore()

const isHovering = ref(false)
const showUnfollowDialog = ref(false)
const isLoading = ref(false)

// Check if current user is following this user
const isFollowing = computed(() => communityStore.isFollowing(props.userId))

// Check if this is current user's own profile
const isOwnProfile = computed(() => authStore.uid === props.userId)

// Button state logic
const buttonState = computed(() => {
  if (isFollowing.value) {
    return isHovering.value ? 'unfollow' : 'following'
  }
  return 'follow'
})

const buttonText = computed(() => {
  switch (buttonState.value) {
    case 'follow':
      return t('community.follow.button')
    case 'following':
      return t('community.follow.following')
    case 'unfollow':
      return t('community.follow.unfollow')
    default:
      return t('community.follow.button')
  }
})

const buttonVariant = computed(() => {
  if (buttonState.value === 'unfollow') {
    return 'destructive'
  }
  if (buttonState.value === 'following') {
    return 'outline'
  }
  return props.variant
})

const buttonIcon = computed(() => {
  if (buttonState.value === 'follow') {
    return UserPlus
  }
  if (buttonState.value === 'following') {
    return UserCheck
  }
  return UserMinus
})

// Initialize following state on mount
onMounted(async () => {
  if (authStore.uid) {
    await communityStore.fetchFollowing(authStore.uid)
  }
})

const handleFollow = async () => {
  if (!authStore.uid) {
    toast({
      title: t('community.errors.authRequired'),
      variant: 'destructive',
    })
    return
  }

  if (isFollowing.value) {
    // Show confirmation dialog for unfollow
    showUnfollowDialog.value = true
    return
  }

  // Follow user
  isLoading.value = true

  try {
    await communityStore.followUser(props.userId)
    toast({
      title: t('community.follow.following'),
      description: `@${props.username || props.userId}`,
    })
  } catch (error) {
    console.error('[FollowButton] Error following user:', error)
    toast({
      title: t('community.errors.followFailed'),
      variant: 'destructive',
    })
  } finally {
    isLoading.value = false
  }
}

const confirmUnfollow = async () => {
  isLoading.value = true
  showUnfollowDialog.value = false

  try {
    await communityStore.unfollowUser(props.userId)
    toast({
      title: t('community.follow.unfollow'),
      description: `@${props.username || props.userId}`,
    })
  } catch (error) {
    console.error('[FollowButton] Error unfollowing user:', error)
    toast({
      title: t('community.errors.unfollowFailed'),
      variant: 'destructive',
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <!-- Don't show button for own profile -->
  <div v-if="!isOwnProfile">
    <Button
      :variant="buttonVariant"
      :size="size"
      :disabled="isLoading"
      class="min-h-11 min-w-20"
      @click="handleFollow"
      @mouseenter="isHovering = true"
      @mouseleave="isHovering = false"
    >
      <component :is="buttonIcon" class="w-4 h-4 mr-2" />
      {{ buttonText }}
    </Button>

    <!-- Unfollow confirmation dialog -->
    <AlertDialog v-model:open="showUnfollowDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {{ t('community.follow.unfollow') }}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {{ t('community.follow.unfollowConfirm', { username: username || userId }) }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ t('community.share.cancel') }}</AlertDialogCancel>
          <AlertDialogAction @click="confirmUnfollow">
            {{ t('community.follow.unfollow') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
