<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {{ isEditMode ? t('exercises.form.edit') : t('exercises.form.create') }}
        </DialogTitle>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Bilingual Name -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Ukrainian Name -->
          <div class="space-y-2">
            <label for="name-uk" class="text-sm font-medium">
              {{ t('exercises.form.nameUk') }} *
            </label>
            <Input
              id="name-uk"
              v-model="formData.name.uk"
              type="text"
              :placeholder="t('exercises.form.namePlaceholder')"
              class="h-11"
              required
            />
            <p v-if="errors.name?.uk" class="text-xs text-destructive">
              {{ errors.name.uk }}
            </p>
          </div>

          <!-- English Name -->
          <div class="space-y-2">
            <label for="name-en" class="text-sm font-medium">
              {{ t('exercises.form.nameEn') }} *
            </label>
            <Input
              id="name-en"
              v-model="formData.name.en"
              type="text"
              :placeholder="t('exercises.form.namePlaceholder')"
              class="h-11"
              required
            />
            <p v-if="errors.name?.en" class="text-xs text-destructive">
              {{ errors.name.en }}
            </p>
          </div>
        </div>

        <!-- Primary Muscle Group -->
        <div class="space-y-2">
          <label for="muscle-group" class="text-sm font-medium">
            {{ t('exercises.form.muscleGroupLabel') }} *
          </label>
          <Select v-model="formData.muscleGroup" required>
            <SelectTrigger id="muscle-group" class="h-11">
              <SelectValue :placeholder="t('exercises.form.muscleGroupPlaceholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="group in muscleGroups"
                :key="group.id"
                :value="group.id"
              >
                <div class="flex items-center gap-2">
                  <span
                    class="w-3 h-3 rounded-full shrink-0"
                    :style="{ backgroundColor: group.color }"
                  ></span>
                  <span>{{ t(`exercises.muscleGroups.${group.id}`) }}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p v-if="errors.muscleGroup" class="text-xs text-destructive">
            {{ errors.muscleGroup }}
          </p>
        </div>

        <!-- Secondary Muscles -->
        <div class="space-y-2">
          <label class="text-sm font-medium">
            {{ t('exercises.form.secondaryMusclesLabel') }}
          </label>
          <div class="flex flex-wrap gap-2">
            <Badge
              v-for="muscle in availableSecondaryMuscles"
              :key="muscle.id"
              :variant="formData.secondaryMuscles.includes(muscle.id) ? 'default' : 'outline'"
              class="cursor-pointer"
              @click="toggleSecondaryMuscle(muscle.id)"
            >
              <span
                class="w-2 h-2 rounded-full mr-1.5"
                :style="{ backgroundColor: muscle.color }"
              ></span>
              {{ t(`exercises.muscleGroups.${muscle.id}`) }}
            </Badge>
          </div>
          <p class="text-xs text-muted-foreground">
            {{ t('exercises.form.secondaryMusclesPlaceholder') }}
          </p>
          <p v-if="errors.secondaryMuscles" class="text-xs text-destructive">
            {{ errors.secondaryMuscles }}
          </p>
        </div>

        <!-- Equipment and Type -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Equipment -->
          <div class="space-y-2">
            <label for="equipment" class="text-sm font-medium">
              {{ t('exercises.form.equipmentLabel') }} *
            </label>
            <Select v-model="formData.equipment" required>
              <SelectTrigger id="equipment" class="h-11">
                <SelectValue :placeholder="t('exercises.form.equipmentPlaceholder')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="equipment in equipmentTypes"
                  :key="equipment"
                  :value="equipment"
                >
                  {{ t(`exercises.equipment.${equipment}`) }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="errors.equipment" class="text-xs text-destructive">
              {{ errors.equipment }}
            </p>
          </div>

          <!-- Exercise Type -->
          <div class="space-y-2">
            <label for="type" class="text-sm font-medium">
              {{ t('exercises.form.typeLabel') }}
            </label>
            <Select v-model="formData.type">
              <SelectTrigger id="type" class="h-11">
                <SelectValue :placeholder="t('exercises.form.typePlaceholder')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="type in exerciseTypes"
                  :key="type"
                  :value="type"
                >
                  {{ t(`exercises.types.${type}`) }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- Bilingual Description -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Ukrainian Description -->
          <div class="space-y-2">
            <label for="description-uk" class="text-sm font-medium">
              {{ t('exercises.form.descriptionUk') }}
            </label>
            <Textarea
              id="description-uk"
              v-model="formData.description.uk"
              :placeholder="t('exercises.form.descriptionPlaceholder')"
              class="min-h-[100px] resize-none"
            />
          </div>

          <!-- English Description -->
          <div class="space-y-2">
            <label for="description-en" class="text-sm font-medium">
              {{ t('exercises.form.descriptionEn') }}
            </label>
            <Textarea
              id="description-en"
              v-model="formData.description.en"
              :placeholder="t('exercises.form.descriptionPlaceholder')"
              class="min-h-[100px] resize-none"
            />
          </div>
        </div>

        <!-- Video URL -->
        <div class="space-y-2">
          <label for="video-url" class="text-sm font-medium">
            {{ t('exercises.form.videoUrlLabel') }}
          </label>
          <Input
            id="video-url"
            v-model="formData.videoUrl"
            type="url"
            :placeholder="t('exercises.form.videoUrlPlaceholder')"
            class="h-11"
          />
          <p v-if="errors.videoUrl" class="text-xs text-destructive">
            {{ errors.videoUrl }}
          </p>
        </div>

        <!-- Actions -->
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            @click="handleCancel"
            :disabled="submitting"
          >
            {{ t('exercises.form.cancel') }}
          </Button>
          <Button type="submit" :disabled="submitting">
            <Loader2 v-if="submitting" class="h-4 w-4 mr-2 animate-spin" />
            {{ submitting ? t('exercises.form.submitting') : t('exercises.form.submit') }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useExerciseLibraryStore } from '@/stores/exerciseLibraryStore'
import { useToast } from '@/components/ui/toast/use-toast'
import { useI18n } from 'vue-i18n'
import { MUSCLE_GROUPS, EQUIPMENT_TYPES, EXERCISE_TYPES } from '@/shared/config/constants'
import { createExerciseSchema, updateExerciseSchema } from '@/schemas'

const props = defineProps({
  /**
   * Dialog open state
   */
  open: {
    type: Boolean,
    required: true,
  },
  /**
   * Exercise to edit (null for create mode)
   */
  exercise: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:open', 'success'])

const { t } = useI18n()
const { toast } = useToast()
const exerciseLibraryStore = useExerciseLibraryStore()

// Data
const muscleGroups = MUSCLE_GROUPS
const equipmentTypes = EQUIPMENT_TYPES
const exerciseTypes = EXERCISE_TYPES

// State
const submitting = ref(false)
const errors = ref({})

// Form data
const formData = ref({
  name: {
    uk: '',
    en: '',
  },
  muscleGroup: '',
  secondaryMuscles: [],
  equipment: '',
  type: 'compound',
  description: {
    uk: '',
    en: '',
  },
  videoUrl: '',
})

/**
 * Check if in edit mode
 */
const isEditMode = computed(() => !!props.exercise)

/**
 * Available secondary muscles (exclude primary)
 */
const availableSecondaryMuscles = computed(() => {
  return muscleGroups.filter((m) => m.id !== formData.value.muscleGroup)
})

/**
 * Toggle secondary muscle
 */
function toggleSecondaryMuscle(muscleId) {
  const index = formData.value.secondaryMuscles.indexOf(muscleId)

  if (index > -1) {
    formData.value.secondaryMuscles.splice(index, 1)
  } else {
    if (formData.value.secondaryMuscles.length < 3) {
      formData.value.secondaryMuscles.push(muscleId)
    } else {
      toast({
        title: t('exercises.validation.secondaryMusclesMax'),
        variant: 'destructive',
      })
    }
  }
}

/**
 * Initialize form data when exercise prop changes
 */
watch(
  () => props.exercise,
  (newExercise) => {
    if (newExercise) {
      // Edit mode - populate form
      formData.value = {
        name: newExercise.name || { uk: '', en: '' },
        muscleGroup: newExercise.muscleGroup || newExercise.muscleGroups?.[0] || '',
        secondaryMuscles: newExercise.secondaryMuscles || [],
        equipment: newExercise.equipment || '',
        type: newExercise.type || 'compound',
        description: newExercise.description || { uk: '', en: '' },
        videoUrl: newExercise.videoUrl || '',
      }
    } else {
      // Create mode - reset form
      resetForm()
    }
    errors.value = {}
  },
  { immediate: true }
)

/**
 * Reset form to initial state
 */
function resetForm() {
  formData.value = {
    name: { uk: '', en: '' },
    muscleGroup: '',
    secondaryMuscles: [],
    equipment: '',
    type: 'compound',
    description: { uk: '', en: '' },
    videoUrl: '',
  }
  errors.value = {}
}

/**
 * Validate form data
 */
function validateForm() {
  errors.value = {}

  try {
    const schema = isEditMode.value ? updateExerciseSchema : createExerciseSchema
    schema.parse(formData.value)
    return true
  } catch (error) {
    if (error.errors) {
      error.errors.forEach((err) => {
        const path = err.path.join('.')
        errors.value[path] = err.message
      })
    }
    return false
  }
}

/**
 * Handle form submission
 */
async function handleSubmit() {
  if (!validateForm()) {
    toast({
      title: t('errors.validationError'),
      description: t('errors.checkFormFields'),
      variant: 'destructive',
    })
    return
  }

  submitting.value = true

  try {
    if (isEditMode.value) {
      // Update existing exercise
      await exerciseLibraryStore.updateExercise(props.exercise.id, formData.value)
      toast({
        title: t('exercises.toast.updated'),
      })
    } else {
      // Create new exercise
      await exerciseLibraryStore.createExercise(formData.value)
      toast({
        title: t('exercises.toast.created'),
      })
    }

    emit('success')
    handleOpenChange(false)
  } catch (error) {
    toast({
      title: t('exercises.toast.error'),
      description: error.message,
      variant: 'destructive',
    })
  } finally {
    submitting.value = false
  }
}

/**
 * Handle cancel
 */
function handleCancel() {
  handleOpenChange(false)
}

/**
 * Handle dialog open state change
 */
function handleOpenChange(newOpen) {
  if (!newOpen && !submitting.value) {
    resetForm()
  }
  emit('update:open', newOpen)
}
</script>
