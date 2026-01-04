<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Globe, Users, Dumbbell, Zap, Clock } from 'lucide-vue-next'
import { useFeedStore } from '@/stores/feedStore'
import { useToast } from '@/components/ui/toast/use-toast'
import { useUnits } from '@/composables/useUnits'

/**
 * ShareWorkoutModal - Share workout to community feed
 *
 * Features:
 * - Workout preview (stats + exercises)
 * - Caption input (max 280 chars)
 * - Visibility selector (Public / Followers Only)
 * - Share button
 * - Post-share toast + navigation
 */

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  workout: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:open', 'shared'])

const { t } = useI18n()
const router = useRouter()
const feedStore = useFeedStore()
const { toast } = useToast()
const { formatWeight } = useUnits()

const caption = ref('')
const visibility = ref('public')
const isSubmitting = ref(false)

const MAX_CAPTION_LENGTH = 280

const remainingChars = computed(() => MAX_CAPTION_LENGTH - caption.value.length)
const canSubmit = computed(() => !isSubmitting.value && caption.value.length <= MAX_CAPTION_LENGTH)

const exerciseCount = computed(() => props.workout?.exercises?.length || 0)
const totalVolume = computed(() => props.workout?.totalVolume || 0)
const duration = computed(() => props.workout?.duration || 0)

const formatDuration = (minutes) => {
  if (minutes < 60) return `${minutes}${t('common.min')}`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}${t('common.h')} ${mins}${t('common.min')}` : `${hours}${t('common.h')}`
}

const handleClose = () => {
  emit('update:open', false)
}

const handleShare = async () => {
  if (!canSubmit.value) return

  isSubmitting.value = true

  try {
    const postId = await feedStore.shareWorkout(
      props.workout.id,
      caption.value.trim(),
      visibility.value,
      {
        // Workout snapshot for feed performance
        id: props.workout.id,
        exercises: props.workout.exercises || [],
        totalVolume: totalVolume.value,
        duration: duration.value,
        createdAt: props.workout.createdAt,
      }
    )

    toast({
      title: t('community.share.success'),
      description: t('community.share.viewInFeed'),
      action: {
        label: t('common.view'),
        onClick: () => router.push({ name: 'Community' }),
      },
    })

    emit('shared', postId)
    emit('update:open', false)

    // Reset form
    caption.value = ''
    visibility.value = 'public'
  } catch (error) {
    console.error('[ShareWorkoutModal] Error sharing workout:', error)
    toast({
      title: t('community.errors.shareFailed'),
      variant: 'destructive',
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{{ t('community.share.button') }}</DialogTitle>
        <DialogDescription>
          {{ t('community.subtitle') }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <!-- Workout Preview -->
        <div class="border rounded-lg p-3 bg-muted/30 space-y-2">
          <div class="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <div class="flex items-center gap-1.5">
              <Dumbbell class="w-4 h-4" />
              <span>{{ t('community.feed.exercises', { count: exerciseCount }) }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <Zap class="w-4 h-4" />
              <span>{{ formatWeight(totalVolume, { precision: 0 }) }}</span>
            </div>
            <div v-if="duration" class="flex items-center gap-1.5">
              <Clock class="w-4 h-4" />
              <span>{{ formatDuration(duration) }}</span>
            </div>
          </div>

          <!-- Exercise list (top 3) -->
          <div v-if="exerciseCount > 0" class="space-y-1">
            <div
              v-for="(exercise, index) in workout.exercises.slice(0, 3)"
              :key="index"
              class="text-sm flex items-center justify-between"
            >
              <span class="font-medium">{{ exercise.name || exercise.exerciseName }}</span>
              <span class="text-muted-foreground">
                {{ exercise.sets?.length || 0 }} {{
                  t('community.workout.sets', { count: exercise.sets?.length || 0 })
                }}
              </span>
            </div>
            <p v-if="exerciseCount > 3" class="text-xs text-muted-foreground">
              +{{ exerciseCount - 3 }} {{ t('common.more') }}
            </p>
          </div>
        </div>

        <!-- Caption Input -->
        <div class="space-y-2">
          <Label for="caption">{{ t('community.share.caption') }}</Label>
          <Textarea
            id="caption"
            v-model="caption"
            :placeholder="t('community.share.caption')"
            :maxlength="MAX_CAPTION_LENGTH"
            class="min-h-20 resize-none"
            :disabled="isSubmitting"
          />
          <p
            :class="[
              'text-xs text-right',
              remainingChars < 50 ? 'text-destructive font-medium' : 'text-muted-foreground',
            ]"
          >
            {{ remainingChars }} / {{ MAX_CAPTION_LENGTH }}
          </p>
        </div>

        <!-- Visibility Selector -->
        <div class="space-y-3">
          <Label>{{ t('community.share.visibility') }}</Label>
          <RadioGroup v-model="visibility" :disabled="isSubmitting">
            <!-- Public -->
            <div class="flex items-start space-x-3 border rounded-lg p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                 :class="{ 'bg-accent': visibility === 'public' }">
              <RadioGroupItem id="public" value="public" />
              <div class="flex-1">
                <Label for="public" class="flex items-center gap-2 cursor-pointer">
                  <Globe class="w-4 h-4" />
                  <span class="font-medium">{{ t('community.share.public') }}</span>
                </Label>
                <p class="text-xs text-muted-foreground mt-1">
                  {{ t('community.privacy.description.public') }}
                </p>
              </div>
            </div>

            <!-- Followers Only -->
            <div class="flex items-start space-x-3 border rounded-lg p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                 :class="{ 'bg-accent': visibility === 'followers' }">
              <RadioGroupItem id="followers" value="followers" />
              <div class="flex-1">
                <Label for="followers" class="flex items-center gap-2 cursor-pointer">
                  <Users class="w-4 h-4" />
                  <span class="font-medium">{{ t('community.share.followers') }}</span>
                </Label>
                <p class="text-xs text-muted-foreground mt-1">
                  {{ t('community.privacy.description.friendsOnly') }}
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleClose" :disabled="isSubmitting">
          {{ t('community.share.cancel') }}
        </Button>
        <Button @click="handleShare" :disabled="!canSubmit">
          {{ isSubmitting ? t('community.feed.loadingMore') : t('community.share.button') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
