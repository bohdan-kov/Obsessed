<script setup>
import { Button } from '@/components/ui/button'
import { Zap } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineEmits(['click'])
</script>

<template>
  <Button
    @click="$emit('click')"
    class="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/20"
  >
    <Zap class="w-4 h-4 mr-2" />
    <span>{{ t('common.nav.quickLog') }}</span>
  </Button>
</template>
