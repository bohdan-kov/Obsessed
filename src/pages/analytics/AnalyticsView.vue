<script setup>
import { ref } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Target, Clock, Dumbbell, TrendingUp } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Active tab state
const activeTab = ref('muscles')
</script>

<template>
  <div class="container max-w-7xl mx-auto py-6 px-4 sm:py-8 space-y-6 sm:space-y-8">
    <!-- Page Title -->
    <h1 class="text-3xl font-bold sm:text-4xl">{{ t('analytics.title') }}</h1>

    <!-- Analytics Tabs -->
    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="grid w-full grid-cols-2 sm:grid-cols-4 gap-2">
        <!-- Muscles Tab -->
        <TabsTrigger
          value="muscles"
          class="inline-flex items-center justify-center gap-2 px-3 py-2.5"
        >
          <Target class="w-4 h-4 shrink-0" />
          <span class="hidden sm:inline truncate">{{ t('analytics.tabs.muscles') }}</span>
        </TabsTrigger>

        <!-- Duration Tab -->
        <TabsTrigger
          value="duration"
          class="inline-flex items-center justify-center gap-2 px-3 py-2.5"
        >
          <Clock class="w-4 h-4 shrink-0" />
          <span class="hidden sm:inline truncate">{{ t('analytics.tabs.duration') }}</span>
        </TabsTrigger>

        <!-- Volume Tab -->
        <TabsTrigger
          value="volume"
          class="inline-flex items-center justify-center gap-2 px-3 py-2.5"
        >
          <Dumbbell class="w-4 h-4 shrink-0" />
          <span class="hidden sm:inline truncate">{{ t('analytics.tabs.volume') }}</span>
        </TabsTrigger>

        <!-- Exercises Tab -->
        <TabsTrigger
          value="exercises"
          class="inline-flex items-center justify-center gap-2 px-3 py-2.5"
        >
          <TrendingUp class="w-4 h-4 shrink-0" />
          <span class="hidden sm:inline truncate">{{ t('analytics.tabs.exercises') }}</span>
        </TabsTrigger>
      </TabsList>

      <!-- Muscles Tab Content -->
      <TabsContent value="muscles" class="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>{{ t('analytics.charts.muscleDistribution') }}</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-muted-foreground">
              {{ t('analytics.comingSoon') }}
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Duration Tab Content -->
      <TabsContent value="duration" class="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>{{ t('analytics.charts.workoutDuration') }}</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-muted-foreground">
              {{ t('analytics.comingSoon') }}
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Volume Tab Content -->
      <TabsContent value="volume" class="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>{{ t('analytics.charts.workoutVolume') }}</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-muted-foreground">
              {{ t('analytics.comingSoon') }}
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Exercises Tab Content -->
      <TabsContent value="exercises" class="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>{{ t('analytics.charts.exerciseProgress') }}</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-muted-foreground">
              {{ t('analytics.comingSoon') }}
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>
