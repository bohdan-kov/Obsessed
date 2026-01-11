<script setup>
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-vue-next'

const props = defineProps({
  templateId: {
    type: String,
    required: true,
  },
  templateName: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'default',
  },
})

const emit = defineEmits(['click'])

const { t } = useI18n()

function handleClick() {
  emit('click')
}
</script>

<template>
  <Button :size="size" @click="handleClick">
    <Play class="w-4 h-4 mr-2" />
    {{ t('schedule.quickStart.button') }}
  </Button>
</template>
