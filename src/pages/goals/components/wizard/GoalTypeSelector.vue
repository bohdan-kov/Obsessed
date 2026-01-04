<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dumbbell, BarChart3, Calendar, Flame } from 'lucide-vue-next'

const { t } = useI18n()

const emit = defineEmits(['select'])

const goalTypes = computed(() => [
  {
    id: 'strength',
    icon: Dumbbell,
    title: t('goals.wizard.types.strength.title'),
    description: t('goals.wizard.types.strength.description'),
    example: t('goals.wizard.types.strength.example'),
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10 hover:bg-orange-500/20',
    borderColor: 'border-orange-500/20 hover:border-orange-500/40',
  },
  {
    id: 'volume',
    icon: BarChart3,
    title: t('goals.wizard.types.volume.title'),
    description: t('goals.wizard.types.volume.description'),
    example: t('goals.wizard.types.volume.example'),
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10 hover:bg-blue-500/20',
    borderColor: 'border-blue-500/20 hover:border-blue-500/40',
  },
  {
    id: 'frequency',
    icon: Calendar,
    title: t('goals.wizard.types.frequency.title'),
    description: t('goals.wizard.types.frequency.description'),
    example: t('goals.wizard.types.frequency.example'),
    color: 'text-green-500',
    bgColor: 'bg-green-500/10 hover:bg-green-500/20',
    borderColor: 'border-green-500/20 hover:border-green-500/40',
  },
  {
    id: 'streak',
    icon: Flame,
    title: t('goals.wizard.types.streak.title'),
    description: t('goals.wizard.types.streak.description'),
    example: t('goals.wizard.types.streak.example'),
    color: 'text-red-500',
    bgColor: 'bg-red-500/10 hover:bg-red-500/20',
    borderColor: 'border-red-500/20 hover:border-red-500/40',
  },
])

function selectType(typeId) {
  emit('select', typeId)
}
</script>

<template>
  <div class="space-y-4">
    <div class="text-center mb-6">
      <h2 class="text-2xl font-bold mb-2">{{ t('goals.wizard.selectType') }}</h2>
      <p class="text-sm text-muted-foreground">
        {{ t('goals.wizard.selectTypeDescription') }}
      </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Card
        v-for="type in goalTypes"
        :key="type.id"
        :class="[
          'cursor-pointer transition-all duration-200 border-2',
          type.borderColor,
          type.bgColor,
          'hover:shadow-lg active:scale-[0.98]',
        ]"
        @click="selectType(type.id)"
      >
        <CardHeader class="pb-3">
          <div class="flex items-start gap-3">
            <div
              :class="[
                'p-2 rounded-lg shrink-0',
                type.bgColor.replace('hover:', '').replace('/20', '/20'),
              ]"
            >
              <component :is="type.icon" :class="['w-6 h-6', type.color]" />
            </div>
            <div class="flex-1 min-w-0">
              <CardTitle class="text-base mb-1">{{ type.title }}</CardTitle>
              <CardDescription class="text-xs">{{ type.description }}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent class="pt-0">
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <span class="font-medium">{{ t('goals.wizard.example') }}:</span>
            <span class="italic">{{ type.example }}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<style scoped>
/* Touch-friendly on mobile */
@media (max-width: 640px) {
  .cursor-pointer {
    min-height: 88px; /* 44px × 2 for easy tapping */
  }
}
</style>
