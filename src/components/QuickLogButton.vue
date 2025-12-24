<script setup>
import { Zap } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineEmits(['click'])
</script>

<template>
  <button
    @click="$emit('click')"
    class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-0 rounded-lg text-white text-sm font-medium cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(239,68,68,0.3)] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(239,68,68,0.4)]"
  >
    <Zap :size="16" :stroke-width="2" />
    <span>{{ t('common.nav.quickLog') }}</span>
  </button>
</template>
