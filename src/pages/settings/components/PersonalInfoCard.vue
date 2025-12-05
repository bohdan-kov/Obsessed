<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/userStore'
import { useUnits } from '@/composables/useUnits'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useToast } from '@/components/ui/toast'
import { z } from 'zod'
import { CONFIG } from '@/constants/config'

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { UserCircle, Loader2 } from 'lucide-vue-next'

const { t } = useI18n()
const userStore = useUserStore()
const { unitLabel, fromStorageUnit, toStorageUnit } = useUnits()
const { handleError } = useErrorHandler()
const { toast } = useToast()

// Local state
const inputValue = ref('')
const isSaving = ref(false)
const validationError = ref(null)

/**
 * Display weight converted from stored kg to user's preferred unit
 */
const displayWeight = computed(() => {
  if (userStore.currentWeight === null) return null
  return fromStorageUnit(userStore.currentWeight)
})

/**
 * Check if user has made changes to the weight input
 */
const hasChanges = computed(() => {
  if (displayWeight.value === null && inputValue.value === '') return false
  if (displayWeight.value === null) return inputValue.value !== ''
  return parseFloat(inputValue.value) !== displayWeight.value
})

/**
 * Minimum weight in display unit for validation
 */
const minDisplayWeight = computed(() => {
  return fromStorageUnit(CONFIG.personalInfo.MIN_WEIGHT)
})

/**
 * Maximum weight in display unit for validation
 */
const maxDisplayWeight = computed(() => {
  return fromStorageUnit(CONFIG.personalInfo.MAX_WEIGHT)
})

/**
 * Dynamic Zod schema based on current unit
 */
const weightSchema = computed(() =>
  z.coerce
    .number({
      required_error: t('settings.personalInfo.validation.required'),
      invalid_type_error: t('settings.personalInfo.validation.invalidType'),
    })
    .min(
      minDisplayWeight.value,
      t('settings.personalInfo.validation.min', {
        min: minDisplayWeight.value.toFixed(1),
        unit: unitLabel.value,
      })
    )
    .max(
      maxDisplayWeight.value,
      t('settings.personalInfo.validation.max', {
        max: maxDisplayWeight.value.toFixed(1),
        unit: unitLabel.value,
      })
    )
    .refine(
      (val) => {
        const decimalPart = val.toString().split('.')[1]
        return !decimalPart || decimalPart.length <= 1
      },
      { message: t('settings.personalInfo.validation.decimalPlaces') }
    )
)

/**
 * Validate weight input using Zod schema
 */
function validateWeight() {
  validationError.value = null

  if (!inputValue.value) {
    validationError.value = t('settings.personalInfo.validation.required')
    return false
  }

  const result = weightSchema.value.safeParse(inputValue.value)

  if (!result.success) {
    validationError.value = result.error.errors[0].message
    return false
  }

  return true
}

/**
 * Save weight to Firestore
 */
async function saveWeight() {
  if (!validateWeight()) return

  isSaving.value = true
  validationError.value = null

  try {
    const weightInDisplayUnit = parseFloat(inputValue.value)
    const weightInKg = toStorageUnit(weightInDisplayUnit)

    if (weightInKg === null) {
      throw new Error('Invalid weight conversion')
    }

    await userStore.updateWeight(weightInKg)

    toast({
      title: t('settings.personalInfo.saveSuccess'),
    })
  } catch (error) {
    handleError(
      error,
      t('errors.updateFailed'),
      'PersonalInfoCard.saveWeight'
    )
  } finally {
    isSaving.value = false
  }
}

/**
 * Initialize input with display weight when it changes
 */
watch(
  displayWeight,
  (newVal) => {
    if (newVal !== null) {
      inputValue.value = newVal.toFixed(1)
    } else {
      inputValue.value = ''
    }
  },
  { immediate: true }
)

/**
 * Validate on blur
 */
function handleBlur() {
  if (inputValue.value) {
    validateWeight()
  } else {
    validationError.value = null
  }
}

/**
 * Clear validation error on input
 */
function handleInput() {
  validationError.value = null
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <UserCircle class="h-5 w-5" />
        {{ t('settings.personalInfo.title') }}
      </CardTitle>
      <CardDescription>
        {{ t('settings.personalInfo.description') }}
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- Weight Input -->
      <div class="space-y-2">
        <Label for="weight" class="text-base">
          {{ t('settings.personalInfo.weight') }}
        </Label>
        <div class="flex gap-2">
          <div class="flex-1 space-y-1">
            <div class="relative">
              <Input
                id="weight"
                v-model="inputValue"
                type="number"
                inputmode="decimal"
                step="0.1"
                :placeholder="t('settings.personalInfo.weightPlaceholder')"
                :class="{ 'border-destructive': validationError }"
                :aria-invalid="!!validationError"
                :aria-describedby="validationError ? 'weight-error' : undefined"
                @blur="handleBlur"
                @input="handleInput"
                class="pr-12"
              />
              <span
                class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none"
              >
                {{ unitLabel }}
              </span>
            </div>
            <p
              v-if="validationError"
              id="weight-error"
              class="text-xs text-destructive"
              role="alert"
            >
              {{ validationError }}
            </p>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <Button
        @click="saveWeight"
        :disabled="!hasChanges || !!validationError || isSaving"
        class="w-full sm:w-auto"
      >
        <Loader2 v-if="isSaving" class="w-4 h-4 mr-2 animate-spin" />
        {{ isSaving ? t('common.saving') : t('common.actions.save') }}
      </Button>
    </CardContent>
  </Card>
</template>
