<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, CalendarDays, Activity } from 'lucide-vue-next'

const { t } = useI18n()

const props = defineProps({
  frequencyType: {
    type: String,
    default: 'total',
  },
  targetCount: {
    type: Number,
    default: null,
  },
  period: {
    type: String,
    default: 'week',
  },
  muscleGroup: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['update:frequencyType', 'update:targetCount', 'update:period', 'update:muscleGroup'])

// Local state
const localFrequencyType = ref(props.frequencyType)
const localTargetCount = ref(props.targetCount?.toString() || '')
const localPeriod = ref(props.period)
const localMuscleGroup = ref(props.muscleGroup)

// Frequency types
const frequencyTypes = computed(() => [
  {
    id: 'total',
    icon: Calendar,
    title: t('goals.wizard.frequencyTypes.total'),
    description: t('goals.wizard.frequencyTypes.totalDescription'),
  },
  {
    id: 'muscleGroup',
    icon: Activity,
    title: t('goals.wizard.frequencyTypes.muscleGroup'),
    description: t('goals.wizard.frequencyTypes.muscleGroupDescription'),
  },
])

// Periods
const periods = computed(() => [
  { value: 'week', label: t('goals.wizard.periods.week') },
  { value: 'month', label: t('goals.wizard.periods.month') },
])

// Muscle groups
const muscleGroups = computed(() => [
  { value: 'chest', label: t('common.muscleGroups.chest') },
  { value: 'back', label: t('common.muscleGroups.back') },
  { value: 'legs', label: t('common.muscleGroups.legs') },
  { value: 'shoulders', label: t('common.muscleGroups.shoulders') },
  { value: 'arms', label: t('common.muscleGroups.arms') },
  { value: 'core', label: t('common.muscleGroups.core') },
])

// Validation
const isValid = computed(() => {
  const count = parseInt(localTargetCount.value)
  if (isNaN(count) || count <= 0) return false
  if (localFrequencyType.value === 'muscleGroup' && !localMuscleGroup.value) return false
  return true
})

// Watch and emit changes
watch(localFrequencyType, (value) => {
  emit('update:frequencyType', value)
  // Reset muscle group if switching to total
  if (value === 'total') {
    localMuscleGroup.value = null
    emit('update:muscleGroup', null)
  }
})

watch(localTargetCount, (value) => {
  const count = parseInt(value)
  emit('update:targetCount', isNaN(count) ? null : count)
})

watch(localPeriod, (value) => {
  emit('update:period', value)
})

watch(localMuscleGroup, (value) => {
  emit('update:muscleGroup', value)
})

function selectFrequencyType(typeId) {
  localFrequencyType.value = typeId
}
</script>

<template>
  <div class="space-y-4">
    <div class="text-center mb-6">
      <h3 class="text-lg font-semibold mb-2">{{ t('goals.wizard.configureFrequency') }}</h3>
      <p class="text-sm text-muted-foreground">
        {{ t('goals.wizard.configureFrequencyDescription') }}
      </p>
    </div>

    <!-- Frequency Type Selection -->
    <div class="space-y-3">
      <Label class="text-sm font-medium">{{ t('goals.wizard.frequencyType') }}</Label>
      <div class="space-y-2">
        <Card
          v-for="type in frequencyTypes"
          :key="type.id"
          :class="[
            'cursor-pointer transition-all duration-200 border-2',
            localFrequencyType === type.id
              ? 'border-primary bg-primary/5 shadow-md'
              : 'border-border hover:border-primary/50 hover:bg-accent/50',
            'active:scale-[0.98]',
          ]"
          @click="selectFrequencyType(type.id)"
        >
          <CardHeader class="pb-3">
            <div class="flex items-center gap-3">
              <div
                :class="[
                  'p-2 rounded-lg shrink-0',
                  localFrequencyType === type.id ? 'bg-primary/10' : 'bg-accent',
                ]"
              >
                <component
                  :is="type.icon"
                  :class="['w-4 h-4', localFrequencyType === type.id ? 'text-primary' : 'text-muted-foreground']"
                />
              </div>
              <div class="flex-1 min-w-0">
                <CardTitle class="text-sm mb-0.5">{{ type.title }}</CardTitle>
                <CardDescription class="text-xs">{{ type.description }}</CardDescription>
              </div>
              <div
                v-if="localFrequencyType === type.id"
                class="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0"
              >
                <div class="w-2 h-2 rounded-full bg-primary-foreground" />
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>

    <!-- Muscle Group Selection (if muscleGroup type) -->
    <div v-if="localFrequencyType === 'muscleGroup'" class="space-y-2">
      <Label for="muscle-group">{{ t('goals.wizard.selectMuscleGroup') }}</Label>
      <Select v-model="localMuscleGroup">
        <SelectTrigger id="muscle-group" class="h-11">
          <SelectValue :placeholder="t('goals.wizard.selectMuscleGroupPlaceholder')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="muscle in muscleGroups" :key="muscle.value" :value="muscle.value">
            {{ muscle.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Target Count Input -->
    <div class="space-y-2">
      <Label for="target-count">{{ t('goals.wizard.targetWorkouts') }}</Label>
      <Input
        id="target-count"
        v-model="localTargetCount"
        type="number"
        inputmode="numeric"
        :placeholder="t('goals.wizard.enterTargetWorkouts')"
        class="text-lg h-12"
      />
    </div>

    <!-- Period Selection -->
    <div class="space-y-2">
      <Label for="period">{{ t('goals.wizard.timePeriod') }}</Label>
      <Select v-model="localPeriod">
        <SelectTrigger id="period" class="h-11">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="period in periods" :key="period.value" :value="period.value">
            {{ period.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Validation Error -->
    <p v-if="localTargetCount && !isValid" class="text-sm text-destructive">
      {{ t('goals.wizard.invalidFrequency') }}
    </p>
  </div>
</template>

<style scoped>
/* Remove spinner from number input */
input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type='number'] {
  -moz-appearance: textfield;
}

/* Touch-friendly on mobile */
@media (max-width: 640px) {
  .cursor-pointer {
    min-height: 72px;
  }
}
</style>
