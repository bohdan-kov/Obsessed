<script setup>
import { useI18n } from 'vue-i18n'
import { Construction } from 'lucide-vue-next'

defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
})

const { t } = useI18n()
</script>

<template>
  <div class="flex items-center justify-center min-h-[calc(100vh-4rem)] p-8">
    <div class="text-center space-y-6 max-w-md">
      <div class="flex justify-center">
        <div class="p-6 rounded-full bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20">
          <Construction class="w-16 h-16 text-red-500" />
        </div>
      </div>

      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight">{{ title }}</h1>
        <p v-if="description" class="text-muted-foreground text-lg">
          {{ description }}
        </p>
      </div>

      <div class="pt-4">
        <p class="text-sm text-muted-foreground">
          {{ t('common.status.inProgress') }}
        </p>
      </div>
    </div>
  </div>
</template>
