<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/components/ui/toast'
import { createDocument, COLLECTIONS } from '@/firebase/firestore'
import { useAuthStore } from '@/stores/authStore'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AlertCircle } from 'lucide-vue-next'

const props = defineProps({
  open: {
    type: Boolean,
    required: true,
  },
  type: {
    type: String,
    required: true,
    validator: (value) => ['post', 'comment', 'user'].includes(value),
  },
  targetId: {
    type: String,
    required: true,
  },
  targetUserId: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update:open', 'submitted'])

const { t } = useI18n()
const { toast } = useToast()
const authStore = useAuthStore()

// Form state
const selectedReason = ref('spam')
const additionalDetails = ref('')
const isSubmitting = ref(false)

// Max character limit for additional details
const MAX_DETAILS_LENGTH = 500
const remainingChars = computed(() => MAX_DETAILS_LENGTH - additionalDetails.value.length)

// Report reasons
const reportReasons = [
  {
    value: 'spam',
    label: computed(() => t('community.report.reasons.spam')),
    description: computed(() => t('community.report.reasonDescriptions.spam')),
  },
  {
    value: 'harassment',
    label: computed(() => t('community.report.reasons.harassment')),
    description: computed(() => t('community.report.reasonDescriptions.harassment')),
  },
  {
    value: 'hateSpeech',
    label: computed(() => t('community.report.reasons.hateSpeech')),
    description: computed(() => t('community.report.reasonDescriptions.hateSpeech')),
  },
  {
    value: 'inappropriate',
    label: computed(() => t('community.report.reasons.inappropriate')),
    description: computed(() => t('community.report.reasonDescriptions.inappropriate')),
  },
  {
    value: 'other',
    label: computed(() => t('community.report.reasons.other')),
    description: computed(() => t('community.report.reasonDescriptions.other')),
  },
]

// Reset form when dialog closes
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      resetForm()
    }
  }
)

function resetForm() {
  selectedReason.value = 'spam'
  additionalDetails.value = ''
}

async function handleSubmit() {
  if (!authStore.uid) {
    toast.error(t('errors.auth.notAuthenticated'))
    return
  }

  // Validate reason is selected
  if (!selectedReason.value) {
    toast.error(t('community.report.selectReason'))
    return
  }

  // Validate additional details length
  if (additionalDetails.value.length > MAX_DETAILS_LENGTH) {
    toast.error(t('community.report.detailsTooLong', { max: MAX_DETAILS_LENGTH }))
    return
  }

  isSubmitting.value = true

  try {
    const reportData = {
      reporterId: authStore.uid,
      type: props.type,
      targetId: props.targetId,
      targetUserId: props.targetUserId,
      reason: selectedReason.value,
      details: additionalDetails.value.trim() || null,
      status: 'pending',
      // Metadata
      reporterEmail: authStore.email || null,
      reporterDisplayName: authStore.displayName || 'Anonymous',
    }

    await createDocument(COLLECTIONS.REPORTS, reportData)

    toast.success(t('community.report.submitted'))
    emit('submitted')
    emit('update:open', false)
  } catch (error) {
    console.error('[ReportModal] Error submitting report:', error)
    toast.error(t('community.report.submitError'))
  } finally {
    isSubmitting.value = false
  }
}

function handleCancel() {
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="(value) => emit('update:open', value)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <AlertCircle class="w-5 h-5 text-destructive" />
          {{ t(`community.report.title.${type}`) }}
        </DialogTitle>
        <DialogDescription>
          {{ t('community.report.description') }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <!-- Report Reason Selection -->
        <div class="space-y-3">
          <Label class="text-sm font-medium">{{ t('community.report.selectReasonLabel') }}</Label>
          <RadioGroup v-model="selectedReason" class="space-y-2">
            <div
              v-for="reason in reportReasons"
              :key="reason.value"
              class="flex items-start space-x-3 border rounded-lg p-3 hover:bg-accent transition-colors"
            >
              <RadioGroupItem :value="reason.value" :id="reason.value" class="mt-0.5" />
              <div class="flex-1 space-y-1">
                <Label :for="reason.value" class="font-medium cursor-pointer">
                  {{ reason.label }}
                </Label>
                <p class="text-xs text-muted-foreground">{{ reason.description }}</p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <!-- Additional Details -->
        <div class="space-y-2">
          <Label for="details" class="text-sm font-medium">
            {{ t('community.report.additionalDetails') }}
            <span class="text-muted-foreground font-normal">
              ({{ t('common.optional') }})
            </span>
          </Label>
          <Textarea
            id="details"
            v-model="additionalDetails"
            :placeholder="t('community.report.detailsPlaceholder')"
            :maxlength="MAX_DETAILS_LENGTH"
            rows="4"
            class="resize-none"
          />
          <p
            class="text-xs text-right transition-colors"
            :class="remainingChars < 50 ? 'text-destructive' : 'text-muted-foreground'"
          >
            {{ remainingChars }} / {{ MAX_DETAILS_LENGTH }}
          </p>
        </div>
      </div>

      <DialogFooter class="gap-2 sm:gap-0">
        <Button variant="outline" @click="handleCancel" :disabled="isSubmitting">
          {{ t('common.cancel') }}
        </Button>
        <Button variant="destructive" @click="handleSubmit" :disabled="isSubmitting">
          {{ isSubmitting ? t('common.submitting') : t('community.report.submit') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
