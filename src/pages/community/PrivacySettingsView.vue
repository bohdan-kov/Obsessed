<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import { useCommunityStore } from '@/stores/communityStore'
import { useToast } from '@/components/ui/toast/use-toast'
import { usePageMeta } from '@/composables/usePageMeta'

/**
 * PrivacySettingsView - Privacy settings page
 *
 * Route: /community/settings/privacy
 *
 * Features:
 * - Profile visibility settings (public/friends/private)
 * - Workout data visibility toggles
 * - Discovery settings toggles
 * - Save/Reset functionality
 */

const { t } = useI18n()
const router = useRouter()
const communityStore = useCommunityStore()
const { toast } = useToast()

// Set page metadata
usePageMeta(
  computed(() => t('community.privacy.title')),
  computed(() => t('settings.title'))
)

const isLoading = ref(true)
const isSaving = ref(false)

// Privacy settings form
const settings = ref({
  privacyMode: 'public',
  showSetsRepsWeight: true,
  showDuration: true,
  showMuscleGroups: true,
  allowLeaderboards: true,
  allowSearch: true,
  allowDiscovery: true,
})

// Default settings
const defaultSettings = {
  privacyMode: 'public',
  showSetsRepsWeight: true,
  showDuration: true,
  showMuscleGroups: true,
  allowLeaderboards: true,
  allowSearch: true,
  allowDiscovery: true,
}

onMounted(async () => {
  await fetchSettings()
})

async function fetchSettings() {
  isLoading.value = true

  try {
    const fetchedSettings = await communityStore.fetchPrivacySettings()
    if (fetchedSettings) {
      settings.value = { ...settings.value, ...fetchedSettings }
    }
  } catch (error) {
    console.error('[PrivacySettingsView] Error fetching settings:', error)
    toast({
      title: t('community.errors.loadProfileFailed'),
      variant: 'destructive',
    })
  } finally {
    isLoading.value = false
  }
}

async function handleSave() {
  isSaving.value = true

  try {
    await communityStore.updatePrivacySettings(settings.value)

    // Also update profile privacyMode in main user document
    if (settings.value.privacyMode) {
      await communityStore.updateMyProfile({
        privacyMode: settings.value.privacyMode,
      })
    }

    toast({
      title: t('community.privacy.saveSuccess'),
    })
  } catch (error) {
    console.error('[PrivacySettingsView] Error saving settings:', error)
    toast({
      title: t('community.privacy.saveError'),
      variant: 'destructive',
    })
  } finally {
    isSaving.value = false
  }
}

function resetToDefaults() {
  settings.value = { ...defaultSettings }
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="container max-w-2xl mx-auto py-6 px-4 space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <Button variant="ghost" size="icon" class="min-h-11 min-w-11" @click="goBack">
        <ArrowLeft class="w-5 h-5" />
      </Button>
      <div>
        <h1 class="text-2xl font-bold">{{ t('community.privacy.title') }}</h1>
        <p class="text-sm text-muted-foreground">{{ t('settings.title') }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-4">
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-center py-12">
            <Loader2 class="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Settings Form -->
    <div v-else class="space-y-6">
      <!-- 1. Profile Visibility -->
      <Card>
        <CardHeader>
          <CardTitle>{{ t('community.privacy.profileVisibility') }}</CardTitle>
          <CardDescription>
            {{ t('community.privacy.profileVisibilityDescription') }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup v-model="settings.privacyMode" class="space-y-4">
            <!-- Public -->
            <div class="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                 :class="{ 'bg-accent border-primary': settings.privacyMode === 'public' }">
              <RadioGroupItem value="public" id="public" class="mt-1" />
              <div class="flex-1 space-y-1">
                <Label for="public" class="font-medium cursor-pointer">
                  {{ t('community.privacy.public') }}
                </Label>
                <p class="text-sm text-muted-foreground">
                  {{ t('community.privacy.publicDescription') }}
                </p>
              </div>
            </div>

            <!-- Friends Only -->
            <div class="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                 :class="{ 'bg-accent border-primary': settings.privacyMode === 'friends' }">
              <RadioGroupItem value="friends" id="friends" class="mt-1" />
              <div class="flex-1 space-y-1">
                <Label for="friends" class="font-medium cursor-pointer">
                  {{ t('community.privacy.friendsOnly') }}
                </Label>
                <p class="text-sm text-muted-foreground">
                  {{ t('community.privacy.friendsOnlyDescription') }}
                </p>
              </div>
            </div>

            <!-- Private -->
            <div class="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                 :class="{ 'bg-accent border-primary': settings.privacyMode === 'private' }">
              <RadioGroupItem value="private" id="private" class="mt-1" />
              <div class="flex-1 space-y-1">
                <Label for="private" class="font-medium cursor-pointer">
                  {{ t('community.privacy.private') }}
                </Label>
                <p class="text-sm text-muted-foreground">
                  {{ t('community.privacy.privateDescription') }}
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <!-- 2. Workout Data Visibility -->
      <Card>
        <CardHeader>
          <CardTitle>{{ t('community.privacy.workoutDataVisibility') }}</CardTitle>
          <CardDescription>
            {{ t('community.privacy.workoutDataVisibilityDescription') }}
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- Show Sets/Reps/Weight -->
          <div class="flex items-center justify-between">
            <div class="space-y-0.5 flex-1 pr-4">
              <Label for="show-sets" class="font-medium">
                {{ t('community.privacy.showSetsRepsWeight') }}
              </Label>
              <p class="text-sm text-muted-foreground">
                {{ t('community.privacy.showSetsRepsWeightDescription') }}
              </p>
            </div>
            <Switch id="show-sets" v-model:checked="settings.showSetsRepsWeight" />
          </div>

          <Separator />

          <!-- Show Duration -->
          <div class="flex items-center justify-between">
            <div class="space-y-0.5 flex-1 pr-4">
              <Label for="show-duration" class="font-medium">
                {{ t('community.privacy.showDuration') }}
              </Label>
              <p class="text-sm text-muted-foreground">
                {{ t('community.privacy.showDurationDescription') }}
              </p>
            </div>
            <Switch id="show-duration" v-model:checked="settings.showDuration" />
          </div>

          <Separator />

          <!-- Show Muscle Groups -->
          <div class="flex items-center justify-between">
            <div class="space-y-0.5 flex-1 pr-4">
              <Label for="show-muscles" class="font-medium">
                {{ t('community.privacy.showMuscleGroups') }}
              </Label>
              <p class="text-sm text-muted-foreground">
                {{ t('community.privacy.showMuscleGroupsDescription') }}
              </p>
            </div>
            <Switch id="show-muscles" v-model:checked="settings.showMuscleGroups" />
          </div>
        </CardContent>
      </Card>

      <!-- 3. Discovery Settings -->
      <Card>
        <CardHeader>
          <CardTitle>{{ t('community.privacy.discoverySettings') }}</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- Allow Search -->
          <div class="flex items-center justify-between">
            <div class="space-y-0.5 flex-1 pr-4">
              <Label for="allow-search" class="font-medium">
                {{ t('community.privacy.allowSearch') }}
              </Label>
              <p class="text-sm text-muted-foreground">
                {{ t('community.privacy.allowSearchDescription') }}
              </p>
            </div>
            <Switch id="allow-search" v-model:checked="settings.allowSearch" />
          </div>

          <Separator />

          <!-- Allow Discovery -->
          <div class="flex items-center justify-between">
            <div class="space-y-0.5 flex-1 pr-4">
              <Label for="allow-discovery" class="font-medium">
                {{ t('community.privacy.allowDiscovery') }}
              </Label>
              <p class="text-sm text-muted-foreground">
                {{ t('community.privacy.allowDiscoveryDescription') }}
              </p>
            </div>
            <Switch id="allow-discovery" v-model:checked="settings.allowDiscovery" />
          </div>

          <Separator />

          <!-- Allow Leaderboards -->
          <div class="flex items-center justify-between">
            <div class="space-y-0.5 flex-1 pr-4">
              <Label for="allow-leaderboards" class="font-medium">
                {{ t('community.privacy.allowLeaderboards') }}
              </Label>
              <p class="text-sm text-muted-foreground">
                {{ t('community.privacy.allowLeaderboardsDescription') }}
              </p>
            </div>
            <Switch id="allow-leaderboards" v-model:checked="settings.allowLeaderboards" />
          </div>
        </CardContent>
      </Card>

      <!-- Action Buttons -->
      <div class="flex justify-end gap-4 pb-6">
        <Button variant="outline" @click="resetToDefaults" :disabled="isSaving">
          {{ t('common.reset') }}
        </Button>
        <Button @click="handleSave" :disabled="isSaving" class="min-w-32">
          <Loader2 v-if="isSaving" class="w-4 h-4 mr-2 animate-spin" />
          {{ t('common.save') }}
        </Button>
      </div>
    </div>
  </div>
</template>
