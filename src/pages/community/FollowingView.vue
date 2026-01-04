<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useCommunityStore } from '@/stores/communityStore'
import { useAuthStore } from '@/stores/authStore'
import UserAvatar from './components/shared/UserAvatar.vue'
import FollowButton from './components/follow/FollowButton.vue'
import EmptyState from './components/shared/EmptyState.vue'
import LoadingSkeleton from './components/shared/LoadingSkeleton.vue'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-vue-next'

/**
 * FollowingView - List of users that this user follows
 *
 * Route: /profile/@:username/following
 *
 * Features:
 * - Display list of following with avatars and follow buttons
 * - Navigate to user profile on avatar/name click
 * - Empty state if not following anyone
 * - Loading skeleton
 * - Mobile-optimized layout
 */

const props = defineProps({
  username: {
    type: String,
    required: true,
  },
})

const { t } = useI18n()
const router = useRouter()
const communityStore = useCommunityStore()
const authStore = useAuthStore()

const isLoading = ref(true)
const error = ref(null)

// Get user ID from username (for now, using username as ID - in real app, need lookup)
const userId = computed(() => {
  // TODO: Implement username → userId lookup
  // For MVP, assume username = userId or we already have it in currentProfile
  return communityStore.currentProfile?.uid || props.username
})

const following = computed(() => communityStore.following)

onMounted(async () => {
  isLoading.value = true
  error.value = null

  try {
    await communityStore.fetchFollowing(userId.value)
  } catch (err) {
    error.value = err.message || t('community.errors.loadProfileFailed')
    console.error('[FollowingView] Error loading following:', err)
  } finally {
    isLoading.value = false
  }
})

const goBack = () => {
  router.back()
}

const navigateToProfile = (user) => {
  router.push({
    name: 'UserProfile',
    params: { username: user.displayName || user.id },
  })
}
</script>

<template>
  <div class="container max-w-2xl mx-auto p-4 space-y-4">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <Button variant="ghost" size="icon" class="min-h-11 min-w-11" @click="goBack">
        <ArrowLeft class="w-5 h-5" />
      </Button>
      <div>
        <h1 class="text-2xl font-bold">{{ t('community.follow.following') }}</h1>
        <p class="text-sm text-muted-foreground">@{{ username }}</p>
      </div>
    </div>

    <!-- Loading state -->
    <LoadingSkeleton v-if="isLoading" variant="user-card" :count="5" />

    <!-- Error state -->
    <Card v-else-if="error" class="p-6">
      <p class="text-destructive text-center">{{ error }}</p>
    </Card>

    <!-- Empty state -->
    <EmptyState
      v-else-if="following.length === 0"
      icon="user-plus"
      :title="t('community.empty.noFollowing')"
      :description="
        userId === authStore.uid
          ? t('community.feed.emptyFollowing')
          : `@${username} ${t('community.empty.noFollowing').toLowerCase()}`
      "
    />

    <!-- Following list -->
    <div v-else class="space-y-2">
      <Card
        v-for="user in following"
        :key="user.id"
        class="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
      >
        <div class="flex items-center gap-3">
          <!-- Avatar -->
          <UserAvatar :user="user" size="md" @click="navigateToProfile(user)" />

          <!-- User info -->
          <div class="flex-1 min-w-0" @click="navigateToProfile(user)">
            <p class="font-semibold truncate">{{ user.displayName }}</p>
            <p v-if="user.bio" class="text-sm text-muted-foreground truncate">
              {{ user.bio }}
            </p>
          </div>

          <!-- Follow button (will show "Following" for users we follow) -->
          <FollowButton :user-id="user.id" :username="user.displayName" variant="outline" size="sm" />
        </div>
      </Card>
    </div>
  </div>
</template>
