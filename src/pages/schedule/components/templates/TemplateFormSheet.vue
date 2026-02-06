<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { refDebounced } from '@vueuse/core'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useExerciseStore } from '@/stores/exerciseStore'
import { validateTemplate } from '@/utils/templateUtils'
import { getLocalizedExerciseName } from '@/utils/exerciseUtils'
import { CONFIG } from '@/constants/config'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Plus, Trash2, GripVertical, Dumbbell } from 'lucide-vue-next'

const props = defineProps({
  open: {
    type: Boolean,
    required: true
  },
  templateId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const { t, locale } = useI18n()
const scheduleStore = useScheduleStore()
const exerciseStore = useExerciseStore()
const { templates } = storeToRefs(scheduleStore)
const { exercises } = storeToRefs(exerciseStore)

// Form state
const formData = ref({
  name: '',
  exercises: []
})

const errors = ref([])
const saving = ref(false)

// Exercise selector state
const showExerciseSelector = ref(false)
const searchInput = ref('')
const searchQuery = refDebounced(searchInput, CONFIG.exercise.SEARCH_DEBOUNCE)

const isEditMode = computed(() => !!props.templateId)

const filteredExercises = computed(() => {
  if (!searchQuery.value) return exercises.value

  const query = searchQuery.value.toLowerCase()
  return exercises.value.filter(exercise => {
    const exerciseName = getLocalizedExerciseName(exercise.name, locale.value).toLowerCase()
    return exerciseName.includes(query) ||
      exercise.muscleGroups?.some(muscle => muscle.toLowerCase().includes(query))
  })
})

// Load template for editing
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    if (props.templateId) {
      const template = templates.value.find(t => t.id === props.templateId)
      if (template) {
        formData.value = {
          name: template.name,
          exercises: template.exercises.map(ex => ({
            ...ex,
            // Preserve full name object for locale switching support
            exerciseName: ex.exerciseName
          }))
        }
      }
    } else {
      resetForm()
    }
    errors.value = []
  }
})

function resetForm() {
  formData.value = {
    name: '',
    exercises: []
  }
  searchInput.value = ''
  showExerciseSelector.value = false
}

function addExercise(exercise) {
  formData.value.exercises.push({
    exerciseId: exercise.id,
    exerciseName: exercise.name, // Store full object { uk: "...", en: "..." } for locale support
    sets: 3,
    reps: 10,
    targetWeight: null,
    restTime: 90,
    notes: ''
  })
  searchInput.value = ''
  showExerciseSelector.value = false
}

function removeExercise(index) {
  formData.value.exercises.splice(index, 1)
}

async function handleSave() {
  // Validate
  const validation = validateTemplate(formData.value)
  if (!validation.valid) {
    errors.value = validation.errors
    return
  }

  saving.value = true
  try {
    if (isEditMode.value) {
      await scheduleStore.updateTemplate(props.templateId, formData.value)
    } else {
      await scheduleStore.createTemplate(formData.value)
    }
    emit('save')
    emit('close')
    resetForm()
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to save template:', error)
    }
    errors.value = [t('schedule.errors.failedToCreateTemplate')]
  } finally {
    saving.value = false
  }
}

function handleClose() {
  emit('close')
  resetForm()
}

onMounted(async () => {
  // Ensure exercises are loaded
  if (exercises.value.length === 0) {
    try {
      await exerciseStore.fetchExercises()
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to load exercises:', error)
      }
      errors.value = [t('schedule.errors.failedToLoadExercises')]
    }
  }
})
</script>

<template>
  <Sheet :open="open" @update:open="(value) => !value && handleClose()">
    <SheetContent side="right" class="w-full sm:max-w-2xl flex flex-col p-0">
      <SheetHeader class="px-6 pt-6 pb-4">
        <SheetTitle class="text-2xl">
          {{ isEditMode ? t('schedule.templates.edit') : t('schedule.templates.create') }}
        </SheetTitle>
        <SheetDescription>
          {{ isEditMode ? t('schedule.form.editDescription') : t('schedule.form.createDescription') }}
        </SheetDescription>
      </SheetHeader>

      <Separator />

      <!-- Form Content -->
      <ScrollArea class="flex-1 px-6">
        <div class="space-y-6 py-6">
          <!-- Errors -->
          <div v-if="errors.length > 0" class="p-4 bg-destructive/10 border border-destructive rounded-lg">
            <ul class="list-disc list-inside text-sm text-destructive space-y-1">
              <li v-for="(error, index) in errors" :key="index">{{ error }}</li>
            </ul>
          </div>

          <!-- Template Name -->
          <div class="space-y-2">
            <Label for="template-name">{{ t('schedule.form.templateName') }}</Label>
            <Input
              id="template-name"
              v-model="formData.name"
              :placeholder="t('schedule.form.templateNamePlaceholder')"
              maxlength="50"
            />
            <p class="text-xs text-muted-foreground">
              {{ formData.name.length }}/50
            </p>
          </div>

          <!-- Exercises List -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <Label>{{ t('schedule.form.exercises') }} ({{ formData.exercises.length }})</Label>
              <Button
                variant="outline"
                size="sm"
                @click="showExerciseSelector = !showExerciseSelector"
              >
                <Plus class="w-4 h-4 mr-2" />
                {{ t('schedule.form.addExercise') }}
              </Button>
            </div>

            <!-- Exercise Selector -->
            <Card v-if="showExerciseSelector" class="border-primary">
              <CardContent class="p-4 space-y-3">
                <Input
                  v-model="searchInput"
                  :placeholder="t('schedule.form.searchExercises')"
                  autofocus
                />
                <ScrollArea class="h-[200px]">
                  <div class="space-y-2">
                    <div
                      v-for="exercise in filteredExercises"
                      :key="exercise.id"
                      class="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                      @click="addExercise(exercise)"
                    >
                      <div class="font-medium">{{ getLocalizedExerciseName(exercise.name, locale) }}</div>
                      <div class="text-xs text-muted-foreground">
                        {{ exercise.muscleGroups?.join(', ') }}
                      </div>
                    </div>
                    <div v-if="filteredExercises.length === 0" class="text-center py-4 text-muted-foreground">
                      {{ t('schedule.form.noExercisesFound') }}
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <!-- Exercises -->
            <div class="space-y-3">
              <Card
                v-for="(exercise, index) in formData.exercises"
                :key="index"
                class="border-l-4 border-l-primary"
              >
                <CardContent class="p-4">
                  <div class="flex items-start gap-3">
                    <GripVertical class="w-5 h-5 text-muted-foreground mt-1 shrink-0" />

                    <div class="flex-1 space-y-4">
                      <!-- Exercise Name -->
                      <div class="flex items-center justify-between">
                        <div class="font-semibold">{{ getLocalizedExerciseName(exercise.exerciseName, locale) }}</div>
                        <Button
                          variant="ghost"
                          size="icon"
                          class="h-8 w-8 text-destructive"
                          @click="removeExercise(index)"
                        >
                          <Trash2 class="w-4 h-4" />
                        </Button>
                      </div>

                      <!-- Sets & Reps -->
                      <div class="grid grid-cols-2 gap-3">
                        <div class="space-y-1">
                          <Label :for="`sets-${index}`" class="text-xs">
                            {{ t('schedule.form.sets') }}
                          </Label>
                          <Input
                            :id="`sets-${index}`"
                            v-model.number="exercise.sets"
                            type="number"
                            min="1"
                            max="20"
                            class="h-9"
                          />
                        </div>
                        <div class="space-y-1">
                          <Label :for="`reps-${index}`" class="text-xs">
                            {{ t('schedule.form.reps') }}
                          </Label>
                          <Input
                            :id="`reps-${index}`"
                            v-model.number="exercise.reps"
                            type="number"
                            min="1"
                            max="100"
                            class="h-9"
                          />
                        </div>
                      </div>

                      <!-- Target Weight & Rest Time -->
                      <div class="grid grid-cols-2 gap-3">
                        <div class="space-y-1">
                          <Label :for="`weight-${index}`" class="text-xs">
                            {{ t('schedule.form.targetWeight') }} ({{ t('common.optional') }})
                          </Label>
                          <Input
                            :id="`weight-${index}`"
                            v-model.number="exercise.targetWeight"
                            type="number"
                            min="0"
                            step="0.5"
                            :placeholder="t('common.kg')"
                            class="h-9"
                          />
                        </div>
                        <div class="space-y-1">
                          <Label :for="`rest-${index}`" class="text-xs">
                            {{ t('schedule.form.restTime') }} ({{ t('common.sec') }})
                          </Label>
                          <Select v-model="exercise.restTime">
                            <SelectTrigger :id="`rest-${index}`" class="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem :value="30">30s</SelectItem>
                              <SelectItem :value="60">60s</SelectItem>
                              <SelectItem :value="90">90s</SelectItem>
                              <SelectItem :value="120">2 min</SelectItem>
                              <SelectItem :value="180">3 min</SelectItem>
                              <SelectItem :value="240">4 min</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <!-- Empty State -->
              <div v-if="formData.exercises.length === 0" class="text-center py-8 border-2 border-dashed rounded-lg">
                <Dumbbell class="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p class="text-sm text-muted-foreground">
                  {{ t('schedule.form.noExercisesAdded') }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      <Separator />

      <!-- Footer -->
      <SheetFooter class="px-6 py-4">
        <div class="flex gap-2 w-full">
          <Button variant="outline" class="flex-1" @click="handleClose">
            {{ t('common.cancel') }}
          </Button>
          <Button
            class="flex-1"
            @click="handleSave"
            :disabled="saving || formData.exercises.length === 0 || !formData.name"
          >
            {{ saving ? t('common.saving') : t('common.save') }}
          </Button>
        </div>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
