<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/userStore'
import { useAuthStore } from '@/stores/authStore'
import { useUnits } from '@/composables/useUnits'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useToast } from '@/components/ui/toast'
import { z } from 'zod'
import { CONFIG } from '@/constants/config'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  User,
  Mail,
  Calendar,
  Loader2,
  Edit2,
  Trophy,
  Dumbbell,
  TrendingUp,
  Timer,
  Flame,
} from 'lucide-vue-next'

const { t, d } = useI18n()
const userStore = useUserStore()
const authStore = useAuthStore()
const { unitLabel, fromStorageUnit, toStorageUnit } = useUnits()
const { handleError } = useErrorHandler()
const { toast } = useToast()

// Local editing state
const isEditingIdentity = ref(false)
const isEditingBio = ref(false)
const isEditingPersonalInfo = ref(false)
const isSaving = ref(false)

// Form data
const identityForm = ref({
  displayName: '',
})

const bioForm = ref({
  bio: '',
})

const personalInfoForm = ref({
  age: null,
  weight: null,
  height: null,
  gender: '',
})

// Validation errors
const identityErrors = ref({})
const bioErrors = ref({})
const personalInfoErrors = ref({})

// Computed properties
const userInitials = computed(() => {
  const name = userStore.displayName || authStore.email || 'U'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const memberSince = computed(() => {
  if (!userStore.profile?.createdAt) return t('profile.myStats.never')
  const date = userStore.profile.createdAt?.toDate
    ? userStore.profile.createdAt.toDate()
    : new Date(userStore.profile.createdAt)
  return d(date, 'long')
})

const displayWeight = computed(() => {
  const weight = userStore.profile?.personalInfo?.weight
  if (!weight) return null
  return fromStorageUnit(weight)
})

const totalDurationFormatted = computed(() => {
  const seconds = userStore.profile?.stats?.totalDuration || 0
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}${t('profile.myStats.hours', hours)} ${minutes}${t('profile.myStats.minutes', minutes)}`
  }
  return `${minutes}${t('profile.myStats.minutes', minutes)}`
})

const lastWorkoutFormatted = computed(() => {
  const lastWorkout = userStore.profile?.stats?.lastWorkout
  if (!lastWorkout) return t('profile.myStats.never')

  const date = lastWorkout?.toDate ? lastWorkout.toDate() : new Date(lastWorkout)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Reset time parts for comparison
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return t('profile.myStats.today')
  } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return t('profile.myStats.yesterday')
  } else {
    const diffTime = Math.abs(todayOnly - dateOnly)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return t('profile.myStats.daysAgo', diffDays)
  }
})

// Validation schemas
const identitySchema = z.object({
  displayName: z
    .string()
    .min(2, t('profile.validation.displayNameMinLength'))
    .max(50, t('profile.validation.displayNameMaxLength')),
})

const bioSchema = z.object({
  bio: z.string().max(500, t('profile.validation.bioMaxLength')).optional(),
})

const personalInfoSchema = computed(() =>
  z.object({
    age: z
      .number()
      .min(13, t('profile.validation.ageMin'))
      .max(120, t('profile.validation.ageMax'))
      .optional()
      .nullable(),
    weight: z
      .number()
      .min(
        fromStorageUnit(CONFIG.personalInfo.MIN_WEIGHT),
        t('profile.validation.weightMin', {
          min: fromStorageUnit(CONFIG.personalInfo.MIN_WEIGHT).toFixed(1),
          unit: unitLabel.value,
        }),
      )
      .max(
        fromStorageUnit(CONFIG.personalInfo.MAX_WEIGHT),
        t('profile.validation.weightMax', {
          max: fromStorageUnit(CONFIG.personalInfo.MAX_WEIGHT).toFixed(1),
          unit: unitLabel.value,
        }),
      )
      .optional()
      .nullable(),
    height: z
      .number()
      .min(100, t('profile.validation.heightMin'))
      .max(250, t('profile.validation.heightMax'))
      .optional()
      .nullable(),
    gender: z.string().optional(),
  }),
)

// Edit functions
function startEditingIdentity() {
  identityForm.value.displayName = userStore.displayName || ''
  identityErrors.value = {}
  isEditingIdentity.value = true
}

function cancelEditingIdentity() {
  isEditingIdentity.value = false
  identityErrors.value = {}
}

function startEditingBio() {
  bioForm.value.bio = userStore.profile?.bio || ''
  bioErrors.value = {}
  isEditingBio.value = true
}

function cancelEditingBio() {
  isEditingBio.value = false
  bioErrors.value = {}
}

function startEditingPersonalInfo() {
  const personalInfo = userStore.profile?.personalInfo || {}
  personalInfoForm.value = {
    age: personalInfo.age || null,
    weight: displayWeight.value || null,
    height: personalInfo.height || null,
    gender: personalInfo.gender || '',
  }
  personalInfoErrors.value = {}
  isEditingPersonalInfo.value = true
}

function cancelEditingPersonalInfo() {
  isEditingPersonalInfo.value = false
  personalInfoErrors.value = {}
}

// Save functions
async function saveIdentity() {
  identityErrors.value = {}

  const result = identitySchema.safeParse(identityForm.value)
  if (!result.success) {
    result.error.errors.forEach((err) => {
      identityErrors.value[err.path[0]] = err.message
    })
    return
  }

  isSaving.value = true
  try {
    await userStore.updateProfile({
      displayName: identityForm.value.displayName,
    })

    toast({
      title: t('profile.messages.profileUpdated'),
    })

    isEditingIdentity.value = false
  } catch (error) {
    handleError(error, t('profile.messages.updateFailed'), 'ProfileView.saveIdentity')
  } finally {
    isSaving.value = false
  }
}

async function saveBio() {
  bioErrors.value = {}

  const result = bioSchema.safeParse(bioForm.value)
  if (!result.success) {
    result.error.errors.forEach((err) => {
      bioErrors.value[err.path[0]] = err.message
    })
    return
  }

  isSaving.value = true
  try {
    await userStore.updateProfile({
      bio: bioForm.value.bio || '',
    })

    toast({
      title: t('profile.messages.bioUpdated'),
    })

    isEditingBio.value = false
  } catch (error) {
    handleError(error, t('profile.messages.updateFailed'), 'ProfileView.saveBio')
  } finally {
    isSaving.value = false
  }
}

async function savePersonalInfo() {
  personalInfoErrors.value = {}

  // Convert weight to storage unit
  const formDataWithConvertedWeight = {
    ...personalInfoForm.value,
    weight: personalInfoForm.value.weight ? toStorageUnit(personalInfoForm.value.weight) : null,
  }

  const result = personalInfoSchema.value.safeParse(formDataWithConvertedWeight)
  if (!result.success) {
    result.error.errors.forEach((err) => {
      personalInfoErrors.value[err.path[0]] = err.message
    })
    return
  }

  isSaving.value = true
  try {
    // Filter out null/undefined values
    const personalInfo = Object.fromEntries(
      Object.entries(formDataWithConvertedWeight).filter(
        ([, v]) => v !== null && v !== undefined && v !== '',
      ),
    )

    await userStore.updateProfile({
      personalInfo,
    })

    toast({
      title: t('profile.messages.personalInfoUpdated'),
    })

    isEditingPersonalInfo.value = false
  } catch (error) {
    handleError(error, t('profile.messages.updateFailed'), 'ProfileView.savePersonalInfo')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="container max-w-4xl mx-auto py-6 px-4 sm:py-8 space-y-6 sm:space-y-8">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold">{{ t('profile.title') }}</h1>
      <p class="text-muted-foreground mt-2">
        {{ t('profile.description') }}
      </p>
    </div>

    <!-- Account Identity Section -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle class="flex items-center gap-2">
              <User class="h-5 w-5" />
              {{ t('profile.sections.accountIdentity') }}
            </CardTitle>
            <CardDescription>
              {{ t('profile.accountIdentity.description') }}
            </CardDescription>
          </div>
          <Button v-if="!isEditingIdentity" variant="ghost" size="sm" @click="startEditingIdentity">
            <Edit2 class="h-4 w-4 mr-2" />
            {{ t('profile.accountIdentity.editProfile') }}
          </Button>
        </div>
      </CardHeader>
      <CardContent class="space-y-6">
        <!-- Avatar and basic info (always visible) -->
        <div class="flex items-center gap-4">
          <Avatar class="h-20 w-20">
            <AvatarImage :src="authStore.photoURL" />
            <AvatarFallback class="text-2xl">
              {{ userInitials }}
            </AvatarFallback>
          </Avatar>
          <div v-if="!isEditingIdentity" class="flex-1">
            <p class="text-2xl font-bold">
              {{ userStore.displayName || t('settings.account.noName') }}
            </p>
            <div class="flex items-center gap-2 text-muted-foreground mt-1">
              <Mail class="h-4 w-4" />
              <p>{{ authStore.email }}</p>
            </div>
            <div class="flex items-center gap-2 text-muted-foreground mt-1">
              <Calendar class="h-4 w-4" />
              <p>{{ t('profile.accountIdentity.memberSince') }}: {{ memberSince }}</p>
            </div>
          </div>
        </div>

        <!-- Edit form -->
        <div v-if="isEditingIdentity" class="space-y-4">
          <Separator />

          <div class="space-y-2">
            <Label for="displayName">
              {{ t('profile.accountIdentity.displayName') }}
            </Label>
            <Input
              id="displayName"
              v-model="identityForm.displayName"
              :placeholder="t('profile.accountIdentity.displayNamePlaceholder')"
              :class="{ 'border-destructive': identityErrors.displayName }"
            />
            <p v-if="identityErrors.displayName" class="text-xs text-destructive">
              {{ identityErrors.displayName }}
            </p>
          </div>

          <div class="space-y-2">
            <Label>{{ t('profile.accountIdentity.email') }}</Label>
            <Input :value="authStore.email" disabled class="bg-muted" />
            <p class="text-xs text-muted-foreground">
              {{ t('profile.accountIdentity.emailCannotChange') }}
            </p>
          </div>

          <div class="flex gap-2">
            <Button @click="saveIdentity" :disabled="isSaving" class="flex-1">
              <Loader2 v-if="isSaving" class="w-4 h-4 mr-2 animate-spin" />
              {{ t('profile.accountIdentity.saveChanges') }}
            </Button>
            <Button
              variant="outline"
              @click="cancelEditingIdentity"
              :disabled="isSaving"
              class="flex-1"
            >
              {{ t('profile.accountIdentity.cancelEdit') }}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- About Me Section -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle>{{ t('profile.sections.aboutMe') }}</CardTitle>
            <CardDescription>
              {{ t('profile.aboutMe.description') }}
            </CardDescription>
          </div>
          <Button v-if="!isEditingBio" variant="ghost" size="sm" @click="startEditingBio">
            <Edit2 class="h-4 w-4 mr-2" />
            {{ t('profile.aboutMe.edit') }}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <!-- Display mode -->
        <div v-if="!isEditingBio">
          <p v-if="userStore.profile?.bio" class="text-sm">
            {{ userStore.profile.bio }}
          </p>
          <p v-else class="text-sm text-muted-foreground italic">
            {{ t('profile.aboutMe.noBio') }}
          </p>
        </div>

        <!-- Edit mode -->
        <div v-else class="space-y-4">
          <div class="space-y-2">
            <Label for="bio">{{ t('profile.aboutMe.bio') }}</Label>
            <Textarea
              id="bio"
              v-model="bioForm.bio"
              :placeholder="t('profile.aboutMe.bioPlaceholder')"
              rows="4"
              :class="{ 'border-destructive': bioErrors.bio }"
            />
            <p class="text-xs text-muted-foreground">
              {{ t('profile.aboutMe.bioHint') }}
            </p>
            <p v-if="bioErrors.bio" class="text-xs text-destructive">
              {{ bioErrors.bio }}
            </p>
          </div>

          <div class="flex gap-2">
            <Button @click="saveBio" :disabled="isSaving" class="flex-1">
              <Loader2 v-if="isSaving" class="w-4 h-4 mr-2 animate-spin" />
              {{ t('profile.aboutMe.save') }}
            </Button>
            <Button variant="outline" @click="cancelEditingBio" :disabled="isSaving" class="flex-1">
              {{ t('profile.aboutMe.cancel') }}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- My Stats Section (Read-only) -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Trophy class="h-5 w-5" />
          {{ t('profile.sections.myStats') }}
        </CardTitle>
        <CardDescription>
          {{ t('profile.myStats.description') }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <!-- Total Workouts -->
          <div class="flex flex-col items-center p-4 rounded-lg bg-muted/50">
            <Dumbbell class="h-8 w-8 text-red-500 mb-2" />
            <p class="text-2xl font-bold">
              {{ userStore.profile?.stats?.totalWorkouts || 0 }}
            </p>
            <p class="text-xs text-muted-foreground text-center">
              {{ t('profile.myStats.totalWorkouts') }}
            </p>
          </div>

          <!-- Total Volume -->
          <div class="flex flex-col items-center p-4 rounded-lg bg-muted/50">
            <TrendingUp class="h-8 w-8 text-orange-500 mb-2" />
            <p class="text-2xl font-bold">
              {{ (userStore.profile?.stats?.totalVolume || 0).toLocaleString() }}
            </p>
            <p class="text-xs text-muted-foreground text-center">
              {{ t('profile.myStats.totalVolume') }} (kg)
            </p>
          </div>

          <!-- Current Streak -->
          <div class="flex flex-col items-center p-4 rounded-lg bg-muted/50">
            <Flame class="h-8 w-8 text-yellow-500 mb-2" />
            <p class="text-2xl font-bold">
              {{ userStore.profile?.stats?.currentStreak || 0 }}
            </p>
            <p class="text-xs text-muted-foreground text-center">
              {{ t('profile.myStats.currentStreak') }}
            </p>
          </div>

          <!-- Total Sets -->
          <div class="flex flex-col items-center p-4 rounded-lg bg-muted/50">
            <Dumbbell class="h-8 w-8 text-blue-500 mb-2" />
            <p class="text-2xl font-bold">
              {{ userStore.profile?.stats?.totalSets || 0 }}
            </p>
            <p class="text-xs text-muted-foreground text-center">
              {{ t('profile.myStats.totalSets') }}
            </p>
          </div>

          <!-- Total Duration -->
          <div class="flex flex-col items-center p-4 rounded-lg bg-muted/50">
            <Timer class="h-8 w-8 text-green-500 mb-2" />
            <p class="text-lg font-bold">
              {{ totalDurationFormatted }}
            </p>
            <p class="text-xs text-muted-foreground text-center">
              {{ t('profile.myStats.totalDuration') }}
            </p>
          </div>

          <!-- Last Workout -->
          <div class="flex flex-col items-center p-4 rounded-lg bg-muted/50">
            <Calendar class="h-8 w-8 text-purple-500 mb-2" />
            <p class="text-lg font-bold">
              {{ lastWorkoutFormatted }}
            </p>
            <p class="text-xs text-muted-foreground text-center">
              {{ t('profile.myStats.lastWorkout') }}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Personal Info Section -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle>{{ t('profile.sections.personalInfo') }}</CardTitle>
            <CardDescription>
              {{ t('profile.personalInfo.description') }}
            </CardDescription>
          </div>
          <Button
            v-if="!isEditingPersonalInfo"
            variant="ghost"
            size="sm"
            @click="startEditingPersonalInfo"
          >
            <Edit2 class="h-4 w-4 mr-2" />
            {{ t('profile.personalInfo.edit') }}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <!-- Display mode -->
        <div v-if="!isEditingPersonalInfo" class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="space-y-1">
            <Label class="text-xs text-muted-foreground">
              {{ t('profile.personalInfo.age') }}
            </Label>
            <p class="text-lg font-medium">
              {{ userStore.profile?.personalInfo?.age || t('profile.personalInfo.notSet') }}
            </p>
          </div>

          <div class="space-y-1">
            <Label class="text-xs text-muted-foreground">
              {{ t('profile.personalInfo.weight') }}
            </Label>
            <p class="text-lg font-medium">
              {{
                displayWeight
                  ? `${displayWeight.toFixed(1)} ${unitLabel}`
                  : t('profile.personalInfo.notSet')
              }}
            </p>
          </div>

          <div class="space-y-1">
            <Label class="text-xs text-muted-foreground">
              {{ t('profile.personalInfo.height') }}
            </Label>
            <p class="text-lg font-medium">
              {{
                userStore.profile?.personalInfo?.height
                  ? `${userStore.profile.personalInfo.height} cm`
                  : t('profile.personalInfo.notSet')
              }}
            </p>
          </div>

          <div class="space-y-1">
            <Label class="text-xs text-muted-foreground">
              {{ t('profile.personalInfo.gender') }}
            </Label>
            <p class="text-lg font-medium">
              {{
                userStore.profile?.personalInfo?.gender
                  ? t(`profile.personalInfo.genderOptions.${userStore.profile.personalInfo.gender}`)
                  : t('profile.personalInfo.notSet')
              }}
            </p>
          </div>
        </div>

        <!-- Edit mode -->
        <div v-else class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Age -->
            <div class="space-y-2">
              <Label for="age">{{ t('profile.personalInfo.age') }}</Label>
              <Input
                id="age"
                v-model.number="personalInfoForm.age"
                type="number"
                inputmode="numeric"
                :placeholder="t('profile.personalInfo.agePlaceholder')"
                :class="{ 'border-destructive': personalInfoErrors.age }"
              />
              <p v-if="personalInfoErrors.age" class="text-xs text-destructive">
                {{ personalInfoErrors.age }}
              </p>
            </div>

            <!-- Weight -->
            <div class="space-y-2">
              <Label for="weight">{{ t('profile.personalInfo.weight') }}</Label>
              <div class="relative">
                <Input
                  id="weight"
                  v-model.number="personalInfoForm.weight"
                  type="number"
                  inputmode="decimal"
                  step="0.1"
                  :placeholder="t('profile.personalInfo.weightPlaceholder')"
                  :class="{ 'border-destructive': personalInfoErrors.weight }"
                  class="pr-12"
                />
                <span
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none"
                >
                  {{ unitLabel }}
                </span>
              </div>
              <p v-if="personalInfoErrors.weight" class="text-xs text-destructive">
                {{ personalInfoErrors.weight }}
              </p>
            </div>

            <!-- Height -->
            <div class="space-y-2">
              <Label for="height">{{ t('profile.personalInfo.height') }}</Label>
              <div class="relative">
                <Input
                  id="height"
                  v-model.number="personalInfoForm.height"
                  type="number"
                  inputmode="numeric"
                  :placeholder="t('profile.personalInfo.heightPlaceholder')"
                  :class="{ 'border-destructive': personalInfoErrors.height }"
                  class="pr-12"
                />
                <span
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none"
                >
                  cm
                </span>
              </div>
              <p v-if="personalInfoErrors.height" class="text-xs text-destructive">
                {{ personalInfoErrors.height }}
              </p>
            </div>

            <!-- Gender -->
            <div class="space-y-2">
              <Label for="gender">{{ t('profile.personalInfo.gender') }}</Label>
              <select
                id="gender"
                v-model="personalInfoForm.gender"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">{{ t('profile.personalInfo.notSet') }}</option>
                <option value="male">{{ t('profile.personalInfo.genderOptions.male') }}</option>
                <option value="female">{{ t('profile.personalInfo.genderOptions.female') }}</option>
                <option value="other">{{ t('profile.personalInfo.genderOptions.other') }}</option>
                <option value="preferNotToSay">
                  {{ t('profile.personalInfo.genderOptions.preferNotToSay') }}
                </option>
              </select>
            </div>
          </div>

          <div class="flex gap-2">
            <Button @click="savePersonalInfo" :disabled="isSaving" class="flex-1">
              <Loader2 v-if="isSaving" class="w-4 h-4 mr-2 animate-spin" />
              {{ t('profile.personalInfo.save') }}
            </Button>
            <Button
              variant="outline"
              @click="cancelEditingPersonalInfo"
              :disabled="isSaving"
              class="flex-1"
            >
              {{ t('profile.personalInfo.cancel') }}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
