<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <FileText class="h-5 w-5" />
          {{ t('exercises.notes.title') }}
        </div>
        <div v-if="isDirty || saving" class="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 v-if="saving" class="h-3 w-3 animate-spin" />
          <span v-if="saving">{{ t('exercises.notes.saving') }}</span>
          <span v-else-if="isDirty && !saving">{{ t('exercises.notes.autoSave', { seconds: 2 }) }}</span>
          <span v-else-if="lastSaved">{{ t('exercises.notes.saved') }}</span>
        </div>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <Textarea
        v-model="note"
        :placeholder="t('exercises.notes.placeholder')"
        class="min-h-[200px] resize-none"
        :aria-label="t('exercises.notes.title')"
      />

      <!-- Error message -->
      <p v-if="error" class="mt-2 text-sm text-destructive">
        {{ error }}
      </p>
    </CardContent>
  </Card>
</template>

<script setup>
import { FileText, Loader2 } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useExerciseNotes } from '@/composables/useExerciseNotes'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  /**
   * Exercise ID
   */
  exerciseId: {
    type: String,
    required: true,
  },
})

const { t } = useI18n()

// Use exercise notes composable
const { note, saving, lastSaved, error, isDirty } = useExerciseNotes(props.exerciseId)
</script>
