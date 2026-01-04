<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Flame, CalendarDays } from 'lucide-vue-next'

const { t } = useI18n()

const props = defineProps({
  streakType: {
    type: String,
    default: 'daily',
  },
  targetDays: {
    type: Number,
    default: null,
  },
  allowRestDays: {
    type: Boolean,
    default: false,
  },
  maxRestDays: {
    type: Number,
    default: null,
  },
})

const emit = defineEmits(['update:streakType', 'update:targetDays', 'update:allowRestDays', 'update:maxRestDays'])

// Local state
const localStreakType = ref(props.streakType)
const localTargetDays = ref(props.targetDays?.toString() || '')
const localAllowRestDays = ref(props.allowRestDays)
const localMaxRestDays = ref(props.maxRestDays?.toString() || '')

// Streak types
const streakTypes = computed(() => [
  {
    id: 'daily',
    icon: Flame,
    title: t('goals.wizard.streakTypes.daily'),
    description: t('goals.wizard.streakTypes.dailyDescription'),
    example: t('goals.wizard.streakTypes.dailyExample'),
  },
  {
    id: 'weekly',
    icon: CalendarDays,
    title: t('goals.wizard.streakTypes.weekly'),
    description: t('goals.wizard.streakTypes.weeklyDescription'),
    example: t('goals.wizard.streakTypes.weeklyExample'),
  },
])

// Validation
const isValid = computed(() => {
  const days = parseInt(localTargetDays.value)
  if (isNaN(days) || days <= 0) return false

  if (localAllowRestDays.value) {
    const maxRest = parseInt(localMaxRestDays.value)
    if (isNaN(maxRest) || maxRest < 0) return false
    // For weekly streaks, max rest days should be less than 7
    if (localStreakType.value === 'daily' && maxRest >= 7) return false
  }

  return true
})

// Watch and emit changes
watch(localStreakType, (value) => {
  emit('update:streakType', value)
  // Reset rest days if switching to weekly
  if (value === 'weekly') {
    localAllowRestDays.value = false
    localMaxRestDays.value = ''
    emit('update:allowRestDays', false)
    emit('update:maxRestDays', null)
  }
})

watch(localTargetDays, (value) => {
  const days = parseInt(value)
  emit('update:targetDays', isNaN(days) ? null : days)
})

watch(localAllowRestDays, (value) => {
  emit('update:allowRestDays', value)
  if (!value) {
    localMaxRestDays.value = ''
    emit('update:maxRestDays', null)
  }
})

watch(localMaxRestDays, (value) => {
  const days = parseInt(value)
  emit('update:maxRestDays', isNaN(days) ? null : days)
})

function selectStreakType(typeId) {
  localStreakType.value = typeId
}
</script>

<template>
  <div class="space-y-4">
    <div class="text-center mb-6">
      <h3 class="text-lg font-semibold mb-2">{{ t('goals.wizard.configureStreak') }}</h3>
      <p class="text-sm text-muted-foreground">
        {{ t('goals.wizard.configureStreakDescription') }}
      </p>
    </div>

    <!-- Streak Type Selection -->
    <div class="space-y-3">
      <Label class="text-sm font-medium">{{ t('goals.wizard.streakType') }}</Label>
      <div class="space-y-2">
        <Card
          v-for="type in streakTypes"
          :key="type.id"
          :class="[
            'cursor-pointer transition-all duration-200 border-2',
            localStreakType === type.id
              ? 'border-primary bg-primary/5 shadow-md'
              : 'border-border hover:border-primary/50 hover:bg-accent/50',
            'active:scale-[0.98]',
          ]"
          @click="selectStreakType(type.id)"
        >
          <CardHeader class="pb-3">
            <div class="flex items-start gap-3">
              <div
                :class="[
                  'p-2 rounded-lg shrink-0',
                  localStreakType === type.id ? 'bg-primary/10' : 'bg-accent',
                ]"
              >
                <component
                  :is="type.icon"
                  :class="['w-4 h-4', localStreakType === type.id ? 'text-primary' : 'text-muted-foreground']"
                />
              </div>
              <div class="flex-1 min-w-0">
                <CardTitle class="text-sm mb-0.5">{{ type.title }}</CardTitle>
                <CardDescription class="text-xs mb-2">{{ type.description }}</CardDescription>
                <p class="text-xs text-muted-foreground italic">{{ type.example }}</p>
              </div>
              <div
                v-if="localStreakType === type.id"
                class="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0"
              >
                <div class="w-2 h-2 rounded-full bg-primary-foreground" />
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>

    <!-- Target Days/Weeks Input -->
    <div class="space-y-2">
      <Label for="target-days">
        {{ localStreakType === 'daily' ? t('goals.wizard.targetDays') : t('goals.wizard.targetWeeks') }}
      </Label>
      <Input
        id="target-days"
        v-model="localTargetDays"
        type="number"
        inputmode="numeric"
        :placeholder="localStreakType === 'daily' ? t('goals.wizard.enterTargetDays') : t('goals.wizard.enterTargetWeeks')"
        class="text-lg h-12"
      />
    </div>

    <!-- Rest Days (only for daily streaks) -->
    <div v-if="localStreakType === 'daily'" class="space-y-4">
      <!-- Allow Rest Days Toggle -->
      <Card class="border-2">
        <CardContent class="pt-4 pb-4">
          <div class="flex items-center justify-between gap-4">
            <div class="flex-1 min-w-0">
              <Label for="allow-rest" class="text-sm font-medium cursor-pointer">
                {{ t('goals.wizard.allowRestDays') }}
              </Label>
              <p class="text-xs text-muted-foreground mt-1">
                {{ t('goals.wizard.allowRestDaysDescription') }}
              </p>
            </div>
            <Switch
              id="allow-rest"
              v-model:checked="localAllowRestDays"
              class="shrink-0"
            />
          </div>
        </CardContent>
      </Card>

      <!-- Max Rest Days Input (if allowed) -->
      <div v-if="localAllowRestDays" class="space-y-2">
        <Label for="max-rest-days">{{ t('goals.wizard.maxRestDaysPerWeek') }}</Label>
        <Input
          id="max-rest-days"
          v-model="localMaxRestDays"
          type="number"
          inputmode="numeric"
          :placeholder="t('goals.wizard.enterMaxRestDays')"
          class="text-lg h-12"
          max="6"
        />
        <p class="text-xs text-muted-foreground">
          {{ t('goals.wizard.maxRestDaysHint') }}
        </p>
      </div>
    </div>

    <!-- Validation Error -->
    <p v-if="localTargetDays && !isValid" class="text-sm text-destructive">
      {{ t('goals.wizard.invalidStreak') }}
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
    min-height: 88px;
  }
}
</style>
