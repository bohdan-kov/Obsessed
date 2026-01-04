<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Activity, Target } from 'lucide-vue-next'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const selectedType = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const volumeTypes = computed(() => [
  {
    id: 'total',
    icon: BarChart3,
    title: t('goals.wizard.volumeTypes.total'),
    description: t('goals.wizard.volumeTypes.totalDescription'),
    example: t('goals.wizard.volumeTypes.totalExample'),
  },
  {
    id: 'exercise',
    icon: Target,
    title: t('goals.wizard.volumeTypes.exercise'),
    description: t('goals.wizard.volumeTypes.exerciseDescription'),
    example: t('goals.wizard.volumeTypes.exerciseExample'),
  },
  {
    id: 'muscleGroup',
    icon: Activity,
    title: t('goals.wizard.volumeTypes.muscleGroup'),
    description: t('goals.wizard.volumeTypes.muscleGroupDescription'),
    example: t('goals.wizard.volumeTypes.muscleGroupExample'),
  },
])

function selectType(typeId) {
  selectedType.value = typeId
}
</script>

<template>
  <div class="space-y-4">
    <div class="text-center mb-6">
      <h3 class="text-lg font-semibold mb-2">{{ t('goals.wizard.selectVolumeType') }}</h3>
      <p class="text-sm text-muted-foreground">
        {{ t('goals.wizard.selectVolumeTypeDescription') }}
      </p>
    </div>

    <div class="space-y-3">
      <Card
        v-for="type in volumeTypes"
        :key="type.id"
        :class="[
          'cursor-pointer transition-all duration-200 border-2',
          selectedType === type.id
            ? 'border-primary bg-primary/5 shadow-md'
            : 'border-border hover:border-primary/50 hover:bg-accent/50',
          'active:scale-[0.98]',
        ]"
        @click="selectType(type.id)"
      >
        <CardHeader class="pb-3">
          <div class="flex items-start gap-3">
            <div
              :class="[
                'p-2 rounded-lg shrink-0',
                selectedType === type.id ? 'bg-primary/10' : 'bg-accent',
              ]"
            >
              <component
                :is="type.icon"
                :class="['w-5 h-5', selectedType === type.id ? 'text-primary' : 'text-muted-foreground']"
              />
            </div>
            <div class="flex-1 min-w-0">
              <CardTitle class="text-base mb-1">{{ type.title }}</CardTitle>
              <CardDescription class="text-xs">{{ type.description }}</CardDescription>
            </div>
            <div
              v-if="selectedType === type.id"
              class="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0"
            >
              <div class="w-2 h-2 rounded-full bg-primary-foreground" />
            </div>
          </div>
        </CardHeader>
        <CardContent class="pt-0">
          <div class="text-xs text-muted-foreground italic">
            {{ type.example }}
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
    min-height: 88px;
  }
}
</style>
