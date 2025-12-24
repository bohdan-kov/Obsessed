<script setup>
import { useI18n } from 'vue-i18n'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Target, TrendingUp, Calendar, Award } from 'lucide-vue-next'

const { t } = useI18n()

// Placeholder goal categories
const goalCategories = [
  {
    icon: TrendingUp,
    label: t('goals.categories.strength'),
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  {
    icon: Calendar,
    label: t('goals.categories.consistency'),
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: Award,
    label: t('goals.categories.achievement'),
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
]
</script>

<template>
  <div class="container max-w-4xl mx-auto py-6 px-4 space-y-6">
    <!-- Header -->
    <div class="space-y-2">
      <h1 class="text-3xl font-bold tracking-tight">{{ t('goals.title') }}</h1>
      <p class="text-muted-foreground">{{ t('goals.subtitle') }}</p>
    </div>

    <!-- Coming Soon Card -->
    <Card class="border-dashed">
      <CardHeader class="text-center pb-4">
        <div
          class="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 flex items-center justify-center mb-4"
        >
          <Target class="w-8 h-8 text-red-500" />
        </div>
        <CardTitle class="text-2xl">{{ t('goals.comingSoon.title') }}</CardTitle>
        <CardDescription class="max-w-md mx-auto text-base">
          {{ t('goals.comingSoon.description') }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <!-- Goal Categories Preview -->
        <div class="space-y-4">
          <h3 class="text-sm font-medium text-center text-muted-foreground">
            {{ t('goals.empty.description') }}
          </h3>
          <div class="grid gap-4 sm:grid-cols-3">
            <div
              v-for="(category, index) in goalCategories"
              :key="index"
              class="flex flex-col items-center gap-3 p-6 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-not-allowed opacity-60"
            >
              <div
                :class="[
                  'w-12 h-12 rounded-full flex items-center justify-center',
                  category.bgColor,
                ]"
              >
                <component :is="category.icon" :class="['w-6 h-6', category.color]" />
              </div>
              <span class="text-sm font-medium text-center">{{ category.label }}</span>
            </div>
          </div>
        </div>

        <!-- CTA Button (disabled) -->
        <div class="mt-6 flex justify-center">
          <Button disabled class="gap-2">
            <Target class="w-4 h-4" />
            {{ t('common.actions.add') }} {{ t('goals.title') }}
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Empty State -->
    <Card>
      <CardHeader>
        <CardTitle>{{ t('goals.empty.title') }}</CardTitle>
        <CardDescription>{{ t('goals.empty.description') }}</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="text-sm text-muted-foreground space-y-2">
          <p>{{ t('goals.empty.examples.intro') }}</p>
          <ul class="list-disc list-inside space-y-1 ml-2">
            <li>{{ t('goals.empty.examples.bench') }}</li>
            <li>{{ t('goals.empty.examples.frequency') }}</li>
            <li>{{ t('goals.empty.examples.workouts') }}</li>
            <li>{{ t('goals.empty.examples.squat') }}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
