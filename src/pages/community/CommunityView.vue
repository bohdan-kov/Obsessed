<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePageMeta } from '@/composables/usePageMeta'
import FeedTabs from './components/feed/FeedTabs.vue'
import FeedList from './components/feed/FeedList.vue'
import { useAuthStore } from '@/stores/authStore'

/**
 * CommunityView - Main community page
 *
 * Route: /community
 *
 * Features:
 * - FeedTabs component (Following / Discover / You)
 * - FeedList component per tab
 * - Mobile-optimized layout
 * - Real-time feed updates
 */

const { t } = useI18n()
const authStore = useAuthStore()

// Set page metadata for mobile header
usePageMeta(
  computed(() => t('community.title')),
  computed(() => t('community.subtitle'))
)

const currentTab = ref('following')
</script>

<template>
  <div class="container max-w-2xl mx-auto py-6 px-4 space-y-4">
    <!-- Header (hidden on mobile, shown in AppLayout mobile header) -->
    <div class="hidden md:block space-y-2 mb-6">
      <h1 class="text-3xl font-bold tracking-tight">{{ t('community.title') }}</h1>
      <p class="text-muted-foreground">{{ t('community.subtitle') }}</p>
    </div>

    <!-- Feed Tabs -->
    <FeedTabs v-model="currentTab">
      <!-- Following Tab -->
      <template #following>
        <FeedList feed-type="following" />
      </template>

      <!-- Discover Tab -->
      <template #discover>
        <FeedList feed-type="discover" />
      </template>

      <!-- You Tab (current user's posts) -->
      <template #you>
        <FeedList feed-type="user" :user-id="authStore.uid" />
      </template>
    </FeedTabs>
  </div>
</template>
