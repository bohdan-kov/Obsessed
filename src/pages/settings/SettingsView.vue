<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/authStore'
import { useLocale } from '@/composables/useLocale'
import { useUnits } from '@/composables/useUnits'
import { useTheme } from '@/composables/useTheme'

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import { Globe, Scale, User, LogOut } from 'lucide-vue-next'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const { currentLocale, availableLocales, changeLocale } = useLocale()
const { weightUnit, availableWeightUnits, changeWeightUnit } = useUnits()
const { themePreference, effectiveTheme, availableThemes, changeTheme } =
  useTheme()

async function handleSignOut() {
  await authStore.signOut()
  router.push('/login')
}

const userInitials = computed(() => {
  const name = authStore.displayName || authStore.email || ''
  return name.substring(0, 2).toUpperCase()
})
</script>

<template>
  <div class="container max-w-2xl mx-auto py-6 px-4 sm:py-8 space-y-6 sm:space-y-8">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold">{{ t('settings.title') }}</h1>
      <p class="text-muted-foreground mt-2">
        {{ t('settings.description') }}
      </p>
    </div>

    <!-- Appearance Section -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Globe class="h-5 w-5" />
          {{ t('settings.appearance.title') }}
        </CardTitle>
        <CardDescription>
          {{ t('settings.appearance.description') }}
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <!-- Language -->
        <div class="space-y-3">
          <Label class="text-base">
            {{ t('settings.appearance.language') }}
          </Label>
          <RadioGroup
            :model-value="currentLocale"
            @update:model-value="changeLocale"
            class="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div v-for="lang in availableLocales" :key="lang.code">
              <RadioGroupItem
                :value="lang.code"
                :id="`lang-${lang.code}`"
                class="peer sr-only"
              />
              <Label
                :for="`lang-${lang.code}`"
                class="flex items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors"
              >
                <div class="flex items-center gap-3">
                  <span class="text-2xl">{{ lang.flag }}</span>
                  <span class="font-medium">{{ lang.name }}</span>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Separator />

        <!-- Theme -->
        <div class="space-y-3">
          <Label class="text-base">
            {{ t('settings.theme.title') }}
          </Label>
          <RadioGroup
            :model-value="themePreference"
            @update:model-value="changeTheme"
            class="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <div v-for="theme in availableThemes" :key="theme.value">
              <RadioGroupItem
                :value="theme.value"
                :id="`theme-${theme.value}`"
                class="peer sr-only"
              />
              <Label
                :for="`theme-${theme.value}`"
                class="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors min-h-[100px]"
              >
                <component
                  :is="theme.icon"
                  class="h-6 w-6 mb-2"
                />
                <span class="font-medium">{{ t(theme.labelKey) }}</span>
                <span class="text-xs text-muted-foreground text-center mt-1">
                  {{ t(theme.descriptionKey) }}
                </span>
              </Label>
            </div>
          </RadioGroup>

          <!-- System theme hint -->
          <p
            v-if="themePreference === 'system'"
            class="text-sm text-muted-foreground text-center"
          >
            {{ t('settings.theme.currentHint', { theme: t(`settings.theme.${effectiveTheme}`) }) }}
          </p>
        </div>
      </CardContent>
    </Card>

    <!-- Units Section -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Scale class="h-5 w-5" />
          {{ t('settings.units.title') }}
        </CardTitle>
        <CardDescription>
          {{ t('settings.units.description') }}
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <!-- Weight Unit -->
        <div class="space-y-3">
          <Label class="text-base">
            {{ t('settings.units.weight') }}
          </Label>
          <RadioGroup
            :model-value="weightUnit"
            @update:model-value="changeWeightUnit"
            class="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div v-for="unit in availableWeightUnits" :key="unit.value">
              <RadioGroupItem
                :value="unit.value"
                :id="`unit-${unit.value}`"
                class="peer sr-only"
              />
              <Label
                :for="`unit-${unit.value}`"
                class="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors text-center min-h-[100px]"
              >
                <span class="text-2xl font-bold">{{ unit.value }}</span>
                <span class="text-sm text-muted-foreground mt-1">
                  {{ unit.name }}
                </span>
              </Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>

    <!-- Account Section -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <User class="h-5 w-5" />
          {{ t('settings.account.title') }}
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <!-- Profile Info -->
        <div class="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
          <Avatar class="h-16 w-16">
            <AvatarImage :src="authStore.photoURL" />
            <AvatarFallback class="text-lg">
              {{ userInitials }}
            </AvatarFallback>
          </Avatar>
          <div class="flex-1">
            <p class="font-medium text-lg">
              {{ authStore.displayName || t('settings.account.noName') }}
            </p>
            <p class="text-muted-foreground">{{ authStore.email }}</p>
          </div>
        </div>

        <Separator />

        <!-- Sign Out -->
        <Button
          variant="outline"
          class="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-500/10"
          @click="handleSignOut"
        >
          <LogOut class="h-4 w-4 mr-2" />
          {{ t('auth.signOut') }}
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
