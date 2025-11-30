<template>
  <Button
    variant="ghost"
    size="icon"
    :aria-label="isFavorite ? t('exercises.actions.unfavorite') : t('exercises.actions.favorite')"
    :class="cn('min-h-11 min-w-11', className)"
    @click.stop="handleToggle"
    :disabled="loading"
  >
    <Star
      :class="
        cn(
          'h-5 w-5 transition-colors',
          isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
        )
      "
    />
  </Button>
</template>

<script setup>
import { ref } from 'vue'
import { Star } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useExerciseLibraryStore } from '@/stores/exerciseLibraryStore'
import { useToast } from '@/components/ui/toast/use-toast'
import { useI18n } from 'vue-i18n'
import { cn } from '@/lib/utils'

const props = defineProps({
  /**
   * Exercise ID
   */
  exerciseId: {
    type: String,
    required: true,
  },
  /**
   * Current favorite status
   */
  isFavorite: {
    type: Boolean,
    required: true,
  },
  /**
   * Additional CSS classes
   */
  className: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['toggle'])

const { t } = useI18n()
const { toast } = useToast()
const exerciseLibraryStore = useExerciseLibraryStore()

const loading = ref(false)

/**
 * Handle favorite toggle
 */
async function handleToggle() {
  loading.value = true

  try {
    const newStatus = await exerciseLibraryStore.toggleFavorite(props.exerciseId)

    toast({
      title: newStatus
        ? t('exercises.toast.favoriteAdded')
        : t('exercises.toast.favoriteRemoved'),
    })

    emit('toggle', newStatus)
  } catch {
    toast({
      title: t('exercises.toast.error'),
      variant: 'destructive',
    })
  } finally {
    loading.value = false
  }
}
</script>
