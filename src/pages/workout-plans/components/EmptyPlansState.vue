<script setup>
import { FileText, Plus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const emit = defineEmits(['create'])
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div class="bg-muted/50 rounded-full p-6 mb-4">
      <FileText class="w-12 h-12 text-muted-foreground" />
    </div>

    <h3 class="text-lg font-semibold mb-2">
      {{ t('plans.list.empty') }}
    </h3>

    <p class="text-sm text-muted-foreground mb-6 max-w-sm">
      {{ t('plans.list.emptyDescription') }}
    </p>

    <Button @click="emit('create')" size="lg" class="min-h-11 min-w-44">
      <Plus class="mr-2 h-5 w-5" />
      {{ t('plans.list.createFirst') }}
    </Button>
  </div>
</template>
