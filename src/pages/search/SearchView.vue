<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Dumbbell, Activity, Target } from 'lucide-vue-next'

const { t } = useI18n()
const searchQuery = ref('')
const isSearching = ref(false)

/**
 * Handle search input
 * TODO: Implement actual search functionality
 */
function handleSearch() {
  if (!searchQuery.value.trim()) return
  isSearching.value = true
  // Placeholder for future implementation
  setTimeout(() => {
    isSearching.value = false
  }, 500)
}
</script>

<template>
  <div class="container max-w-4xl mx-auto py-6 px-4 space-y-6">
    <!-- Header -->
    <div class="space-y-2">
      <h1 class="text-3xl font-bold tracking-tight">{{ t('search.title') }}</h1>
      <p class="text-muted-foreground">{{ t('search.subtitle') }}</p>
    </div>

    <!-- Search Input -->
    <Card>
      <CardContent class="pt-6">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            type="text"
            :placeholder="t('search.placeholder')"
            class="pl-10 h-12 text-lg"
            @input="handleSearch"
            aria-label="Search input"
          />
        </div>
      </CardContent>
    </Card>

    <!-- Coming Soon State (when no search query) -->
    <Card v-if="!searchQuery" class="border-dashed">
      <CardHeader class="text-center pb-4">
        <div
          class="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4"
        >
          <Search class="w-6 h-6 text-primary" />
        </div>
        <CardTitle>{{ t('search.comingSoon.title') }}</CardTitle>
        <CardDescription class="max-w-md mx-auto">
          {{ t('search.comingSoon.description') }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <!-- Popular Searches Suggestions -->
        <div class="space-y-4">
          <h3 class="text-sm font-medium text-muted-foreground">
            {{ t('search.suggestions.title') }}
          </h3>
          <div class="grid gap-3">
            <div
              class="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-not-allowed opacity-60"
            >
              <Dumbbell class="w-5 h-5 text-muted-foreground" />
              <span class="text-sm font-medium">{{ t('search.suggestions.exercises') }}</span>
            </div>
            <div
              class="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-not-allowed opacity-60"
            >
              <Activity class="w-5 h-5 text-muted-foreground" />
              <span class="text-sm font-medium">{{ t('search.suggestions.workouts') }}</span>
            </div>
            <div
              class="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-not-allowed opacity-60"
            >
              <Target class="w-5 h-5 text-muted-foreground" />
              <span class="text-sm font-medium">{{ t('common.nav.analytics.name') }}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Empty State (when searching but no results) -->
    <Card v-else-if="!isSearching" class="border-dashed">
      <CardHeader class="text-center">
        <div class="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Search class="w-6 h-6 text-muted-foreground" />
        </div>
        <CardTitle>{{ t('search.empty.title') }}</CardTitle>
        <CardDescription>{{ t('search.empty.description') }}</CardDescription>
      </CardHeader>
    </Card>

    <!-- Searching State -->
    <Card v-else>
      <CardContent class="py-12 text-center">
        <div class="inline-flex items-center gap-2 text-muted-foreground">
          <div
            class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"
          />
          <span>{{ t('search.searching') }}</span>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
