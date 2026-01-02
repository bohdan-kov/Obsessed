<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePageMeta } from '@/composables/usePageMeta'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Bell, CalendarDays } from 'lucide-vue-next'

const { t } = useI18n()

// Set page metadata for mobile header
usePageMeta(
  computed(() => t('schedule.title')),
  computed(() => t('schedule.subtitle'))
)

// Placeholder schedule features
const features = [
  {
    icon: CalendarDays,
    label: t('schedule.features.upcoming'),
    description: t('schedule.features.upcomingDescription'),
  },
  {
    icon: Bell,
    label: t('schedule.features.reminders'),
    description: t('schedule.features.remindersDescription'),
  },
  {
    icon: Clock,
    label: t('schedule.features.timeBlocks'),
    description: t('schedule.features.timeBlocksDescription'),
  },
]
</script>

<template>
  <div class="container max-w-4xl mx-auto py-6 px-4 space-y-6">
    <!-- Header (hidden on mobile, shown in AppLayout mobile header) -->
    <div class="hidden md:block space-y-2">
      <h1 class="text-3xl font-bold tracking-tight">{{ t('schedule.title') }}</h1>
      <p class="text-muted-foreground">{{ t('schedule.subtitle') }}</p>
    </div>

    <!-- Coming Soon Card -->
    <Card class="border-dashed">
      <CardHeader class="text-center pb-4">
        <div
          class="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4"
        >
          <Calendar class="w-8 h-8 text-purple-500" />
        </div>
        <CardTitle class="text-2xl">{{ t('schedule.comingSoon.title') }}</CardTitle>
        <CardDescription class="max-w-md mx-auto text-base">
          {{ t('schedule.comingSoon.description') }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <!-- Features List -->
        <div class="space-y-4">
          <div
            v-for="(feature, index) in features"
            :key="index"
            class="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-not-allowed opacity-60"
          >
            <div
              class="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0"
            >
              <component :is="feature.icon" class="w-5 h-5 text-purple-500" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium">{{ feature.label }}</div>
              <div class="text-xs text-muted-foreground mt-1">{{ feature.description }}</div>
            </div>
          </div>
        </div>

        <!-- CTA Button (disabled) -->
        <div class="mt-6 flex justify-center">
          <Button disabled class="gap-2">
            <Calendar class="w-4 h-4" />
            {{ t('common.actions.add') }} {{ t('schedule.title') }}
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Calendar Placeholder -->
    <Card>
      <CardHeader>
        <CardTitle>{{ t('schedule.empty.title') }}</CardTitle>
        <CardDescription>{{ t('schedule.empty.description') }}</CardDescription>
      </CardHeader>
      <CardContent>
        <!-- Simple calendar grid placeholder -->
        <div
          class="aspect-[4/3] rounded-lg border-2 border-dashed bg-muted/20 flex items-center justify-center"
        >
          <div class="text-center space-y-2">
            <Calendar class="w-12 h-12 mx-auto text-muted-foreground/50" />
            <p class="text-sm text-muted-foreground">{{ t('schedule.calendar.upcoming') }}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
