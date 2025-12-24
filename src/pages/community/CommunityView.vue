<script setup>
import { useI18n } from 'vue-i18n'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, UserPlus, Trophy, Heart, MessageCircle } from 'lucide-vue-next'

const { t } = useI18n()

// Placeholder community features
const features = [
  {
    icon: UserPlus,
    label: t('community.features.findPartners'),
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: Trophy,
    label: t('community.features.shareAchievements'),
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  {
    icon: Heart,
    label: t('community.features.motivate'),
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  {
    icon: MessageCircle,
    label: t('community.features.exchangeTips'),
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
]
</script>

<template>
  <div class="container max-w-4xl mx-auto py-6 px-4 space-y-6">
    <!-- Header -->
    <div class="space-y-2">
      <h1 class="text-3xl font-bold tracking-tight">{{ t('community.title') }}</h1>
      <p class="text-muted-foreground">{{ t('community.subtitle') }}</p>
    </div>

    <!-- Coming Soon Card -->
    <Card class="border-dashed">
      <CardHeader class="text-center pb-4">
        <div
          class="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4"
        >
          <Users class="w-8 h-8 text-blue-500" />
        </div>
        <CardTitle class="text-2xl">{{ t('community.comingSoon.title') }}</CardTitle>
        <CardDescription class="max-w-md mx-auto text-base">
          {{ t('community.comingSoon.description') }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <!-- Features Grid -->
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="(feature, index) in features"
            :key="index"
            class="flex flex-col items-center gap-3 p-6 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-not-allowed opacity-60"
          >
            <div
              :class="['w-12 h-12 rounded-full flex items-center justify-center', feature.bgColor]"
            >
              <component :is="feature.icon" :class="['w-6 h-6', feature.color]" />
            </div>
            <span class="text-sm font-medium text-center">{{ feature.label }}</span>
          </div>
        </div>

        <!-- CTA Button (disabled) -->
        <div class="mt-6 flex justify-center">
          <Button disabled class="gap-2">
            <Users class="w-4 h-4" />
            {{ t('community.empty.description') }}
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Empty State -->
    <Card>
      <CardHeader>
        <CardTitle>{{ t('community.empty.title') }}</CardTitle>
        <CardDescription>{{ t('community.subtitle') }}</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="text-sm text-muted-foreground space-y-2">
          <p>{{ t('community.empty.features.intro') }}</p>
          <ul class="list-disc list-inside space-y-1 ml-2">
            <li>{{ t('community.empty.features.connect') }}</li>
            <li>{{ t('community.empty.features.share') }}</li>
            <li>{{ t('community.empty.features.partners') }}</li>
            <li>{{ t('community.empty.features.learn') }}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
