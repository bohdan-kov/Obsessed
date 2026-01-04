<script setup>
import { Target } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const emit = defineEmits(['create-goal'])
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
    <!-- Icon -->
    <div
      class="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted/50"
    >
      <Target class="h-10 w-10 text-muted-foreground/50" />
    </div>

    <!-- Title & Description -->
    <h3 class="mb-2 text-lg font-semibold text-foreground">
      {{ t('goals.empty.title') }}
    </h3>
    <p class="mb-8 max-w-md text-sm text-muted-foreground">
      {{ t('goals.empty.description') }}
    </p>

    <!-- Examples List -->
    <div class="mb-8 max-w-md space-y-2 text-left text-sm text-muted-foreground">
      <p class="font-medium">{{ t('goals.empty.examples.intro') }}</p>
      <ul class="ml-4 space-y-1">
        <li class="flex items-start">
          <span class="mr-2">•</span>
          <span>{{ t('goals.empty.examples.bench') }}</span>
        </li>
        <li class="flex items-start">
          <span class="mr-2">•</span>
          <span>{{ t('goals.empty.examples.frequency') }}</span>
        </li>
        <li class="flex items-start">
          <span class="mr-2">•</span>
          <span>{{ t('goals.empty.examples.workouts') }}</span>
        </li>
        <li class="flex items-start">
          <span class="mr-2">•</span>
          <span>{{ t('goals.empty.examples.squat') }}</span>
        </li>
      </ul>
    </div>

    <!-- CTA Button -->
    <Button size="lg" class="min-h-11 min-w-44" @click="emit('create-goal')">
      <Target class="mr-2 h-4 w-4" />
      {{ t('goals.createGoal') }}
    </Button>
  </div>
</template>
