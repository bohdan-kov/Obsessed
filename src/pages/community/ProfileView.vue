<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Settings, MoreVertical, Flag, ShieldAlert } from 'lucide-vue-next'
import UserAvatar from './components/shared/UserAvatar.vue'
import FollowButton from './components/follow/FollowButton.vue'
import FeedList from './components/feed/FeedList.vue'
import EmptyState from './components/shared/EmptyState.vue'
import LoadingSkeleton from './components/shared/LoadingSkeleton.vue'
import ReportModal from './components/shared/ReportModal.vue'
import BlockConfirmDialog from './components/shared/BlockConfirmDialog.vue'
import { useCommunityStore } from '@/stores/communityStore'
import { useAuthStore } from '@/stores/authStore'
import { useFeedStore } from '@/stores/feedStore'

/**
 * ProfileView - User profile page
 *
 * Route: /profile/@:username
 *
 * MVP ROUTING: username parameter = userId
 * - Example: /profile/@abc123xyz (where abc123xyz is the Firebase user ID)
 * - Future enhancement: Add username lookup table for vanity URLs
 *
 * Features:
 * - Simple profile header (avatar, name, bio, stats)
 * - Follow button (if not own profile)
 * - Tabs: Feed / PRs / Achievements (only Feed active in Week 2)
 * - User's shared workouts via FeedList
 * - Loading and error states
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
const feedStore = useFeedStore()

const isLoading = ref(true)
const error = ref(null)
const showReportModal = ref(false)
const showBlockDialog = ref(false)

const profile = computed(() => communityStore.currentProfile)
const isOwnProfile = computed(() => profile.value?.uid === authStore.uid)

// Count workouts from feed (approximation for Week 2)
const workoutCount = computed(() => {
  if (!profile.value?.uid) return 0
  // For Week 2, show approximate count
  // In Week 3+, add actual count to user profile stats
  return feedStore.feedPosts?.filter((p) => p.userId === profile.value.uid)?.length || 0
})

onMounted(async () => {
  await fetchProfile()
})

async function fetchProfile() {
  isLoading.value = true
  error.value = null

  try {
    // For MVP: username = userId (in real app, need username → userId lookup)
    await communityStore.fetchUserProfile(props.username)

    if (!communityStore.currentProfile) {
      error.value = 'not_found'
    }
  } catch (err) {
    console.error('[ProfileView] Error fetching profile:', err)
    error.value = err.message || 'load_failed'
  } finally {
    isLoading.value = false
  }
}

const navigateToFollowers = () => {
  router.push({
    name: 'UserFollowers',
    params: { username: props.username },
  })
}

const navigateToFollowing = () => {
  router.push({
    name: 'UserFollowing',
    params: { username: props.username },
  })
}

const navigateToMyProfile = () => {
  router.push({ name: 'MyProfile' })
}

const handleReport = () => {
  showReportModal.value = true
}

const handleBlock = () => {
  showBlockDialog.value = true
}

const onReportSubmitted = () => {
  showReportModal.value = false
}

const onUserBlocked = () => {
  showBlockDialog.value = false
  // Navigate back to community feed after blocking
  router.push('/community')
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Loading State -->
    <LoadingSkeleton v-if="isLoading" variant="profile" :count="1" class="container max-w-2xl mx-auto p-4" />

    <!-- Error State: Not Found -->
    <div v-else-if="error === 'not_found'" class="container max-w-2xl mx-auto p-4">
      <EmptyState
        icon="user-x"
        :title="t('community.profile.notFound')"
        :description="t('community.profile.notFoundDescription')"
        :cta-text="t('common.back')"
        @cta-click="router.back()"
      />
    </div>

    <!-- Error State: Load Failed -->
    <div v-else-if="error" class="container max-w-2xl mx-auto p-4">
      <EmptyState
        icon="inbox"
        :title="t('community.errors.loadProfileFailed')"
        :description="error"
        :cta-text="t('common.retry')"
        @cta-click="fetchProfile"
      />
    </div>

    <!-- Profile Content -->
    <div v-else-if="profile" class="container max-w-2xl mx-auto">
      <!-- Profile Header -->
      <div class="profile-header">
        <!-- Cover/Banner -->
        <div class="h-32 bg-gradient-to-r from-primary/20 to-primary/10" />

        <!-- Avatar + Info -->
        <div class="relative px-4 pb-4">
          <!-- Avatar -->
          <UserAvatar
            :user="profile"
            size="xl"
            class="-mt-16 shadow-lg"
          />

          <!-- Info Section -->
          <div class="mt-4 space-y-4">
            <!-- Name + Actions -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <h1 class="text-2xl font-bold truncate">{{ profile.displayName }}</h1>
                <p class="text-sm text-muted-foreground">
                  ID: {{ username.substring(0, 8) }}...
                </p>
              </div>

              <!-- Actions: Follow or Edit Profile -->
              <div class="flex items-center gap-2 flex-shrink-0">
                <!-- Own Profile: View My Profile Button -->
                <Button v-if="isOwnProfile" variant="outline" @click="navigateToMyProfile">
                  <Settings class="w-4 h-4 mr-2" />
                  {{ t('community.profile.viewMyProfile') }}
                </Button>

                <!-- Other User: Follow Button + More Menu -->
                <template v-else>
                  <FollowButton
                    :user-id="profile.uid"
                    :username="profile.displayName"
                    size="default"
                  />

                  <!-- More Actions Menu -->
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="outline" size="icon">
                        <MoreVertical class="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem class="gap-2" @click="handleReport">
                        <Flag class="w-4 h-4" />
                        {{ t('community.report.reportUser') }}
                      </DropdownMenuItem>
                      <DropdownMenuItem class="gap-2 text-destructive" @click="handleBlock">
                        <ShieldAlert class="w-4 h-4" />
                        {{ t('community.block.blockUser') }}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </template>
              </div>
            </div>

            <!-- Bio -->
            <p v-if="profile.bio" class="text-muted-foreground">
              {{ profile.bio }}
            </p>

            <!-- Stats Row -->
            <div class="flex gap-6 text-sm">
              <button
                class="flex flex-col items-center hover:opacity-80 transition-opacity min-w-16"
                @click="navigateToFollowers"
              >
                <span class="text-xl font-bold">{{ profile.followerCount || 0 }}</span>
                <span class="text-muted-foreground">{{ t('community.profile.followers') }}</span>
              </button>

              <button
                class="flex flex-col items-center hover:opacity-80 transition-opacity min-w-16"
                @click="navigateToFollowing"
              >
                <span class="text-xl font-bold">{{ profile.followingCount || 0 }}</span>
                <span class="text-muted-foreground">{{ t('community.profile.following') }}</span>
              </button>

              <div class="flex flex-col items-center min-w-16">
                <span class="text-xl font-bold">{{ workoutCount }}</span>
                <span class="text-muted-foreground">{{ t('community.profile.workouts') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs: Feed / PRs / Achievements -->
      <Tabs default-value="feed" class="mt-6 px-4">
        <TabsList class="grid w-full grid-cols-3">
          <TabsTrigger value="feed">
            {{ t('community.profile.tabs.feed') }}
          </TabsTrigger>
          <TabsTrigger value="prs" disabled class="relative">
            {{ t('community.profile.tabs.prs') }}
            <Badge variant="secondary" class="ml-2 text-xs">V1.1</Badge>
          </TabsTrigger>
          <TabsTrigger value="achievements" disabled class="relative">
            {{ t('community.profile.tabs.achievements') }}
            <Badge variant="secondary" class="ml-2 text-xs">V1.1</Badge>
          </TabsTrigger>
        </TabsList>

        <!-- Feed Tab Content -->
        <TabsContent value="feed" class="mt-6">
          <FeedList feed-type="user" :user-id="profile.uid" />
        </TabsContent>

        <!-- PRs Tab (disabled for Week 2) -->
        <TabsContent value="prs" class="mt-6">
          <EmptyState
            icon="trophy"
            :title="t('common.comingSoon')"
            description="Personal Records feature coming in V1.1"
          />
        </TabsContent>

        <!-- Achievements Tab (disabled for Week 2) -->
        <TabsContent value="achievements" class="mt-6">
          <EmptyState
            icon="trophy"
            :title="t('common.comingSoon')"
            description="Achievements feature coming in V1.1"
          />
        </TabsContent>
      </Tabs>
    </div>

    <!-- Report Modal -->
    <ReportModal
      v-if="profile && !isOwnProfile"
      v-model:open="showReportModal"
      type="user"
      :target-id="profile.uid"
      :target-user-id="profile.uid"
      @submitted="onReportSubmitted"
    />

    <!-- Block Confirm Dialog -->
    <BlockConfirmDialog
      v-if="profile && !isOwnProfile"
      v-model:open="showBlockDialog"
      :user-id="profile.uid"
      :username="profile.displayName"
      @blocked="onUserBlocked"
    />
  </div>
</template>
