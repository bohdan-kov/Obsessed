<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useToast } from '@/components/ui/toast'
import { useCommunityStore } from '@/stores/communityStore'
import { useFeedStore } from '@/stores/feedStore'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { ShieldAlert, X, EyeOff, MessageCircleOff, UserMinus } from 'lucide-vue-next'

const props = defineProps({
  open: {
    type: Boolean,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:open', 'blocked'])

const { t } = useI18n()
const { toast } = useToast()
const router = useRouter()
const communityStore = useCommunityStore()
const feedStore = useFeedStore()

const isBlocking = ref(false)

// Block effects list
const blockEffects = [
  {
    icon: EyeOff,
    text: () => t('community.block.effects.hidePosts'),
  },
  {
    icon: UserMinus,
    text: () => t('community.block.effects.unfollowBoth'),
  },
  {
    icon: MessageCircleOff,
    text: () => t('community.block.effects.hideComments'),
  },
  {
    icon: X,
    text: () => t('community.block.effects.preventInteraction'),
  },
]

async function handleBlock() {
  if (!props.userId) {
    toast.error(t('errors.validation.invalidUser'))
    return
  }

  isBlocking.value = true

  try {
    // Block the user (communityStore will handle unfollowing)
    await communityStore.blockUser(props.userId)

    // Remove all posts from this user in the feed
    feedStore.removePostsByUser(props.userId)

    toast.success(
      t('community.block.success', {
        username: props.username || t('community.profile.anonymous'),
      })
    )

    emit('blocked', props.userId)
    emit('update:open', false)

    // Navigate away from profile if currently viewing it
    if (router.currentRoute.value.params.username === props.username) {
      router.push('/community')
    }
  } catch (error) {
    console.error('[BlockConfirmDialog] Error blocking user:', error)
    toast.error(t('community.block.error'))
  } finally {
    isBlocking.value = false
  }
}

function handleCancel() {
  emit('update:open', false)
}
</script>

<template>
  <AlertDialog :open="open" @update:open="(value) => emit('update:open', value)">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle class="flex items-center gap-2">
          <ShieldAlert class="w-5 h-5 text-destructive" />
          {{ t('community.block.title', { username: username || t('community.profile.anonymous') }) }}
        </AlertDialogTitle>
        <AlertDialogDescription class="space-y-4">
          <p>{{ t('community.block.confirmation') }}</p>

          <!-- Block Effects List -->
          <div class="space-y-2 bg-muted/50 rounded-lg p-3 border">
            <p class="text-sm font-medium text-foreground">
              {{ t('community.block.effectsTitle') }}
            </p>
            <ul class="space-y-2">
              <li
                v-for="(effect, index) in blockEffects"
                :key="index"
                class="flex items-start gap-2 text-sm"
              >
                <component :is="effect.icon" class="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                <span>{{ effect.text() }}</span>
              </li>
            </ul>
          </div>

          <p class="text-sm">{{ t('community.block.reversible') }}</p>
        </AlertDialogDescription>
      </AlertDialogHeader>

      <AlertDialogFooter>
        <AlertDialogCancel as-child>
          <Button variant="outline" class="min-h-11 min-w-11" :disabled="isBlocking" @click="handleCancel">
            {{ t('common.cancel') }}
          </Button>
        </AlertDialogCancel>
        <AlertDialogAction as-child>
          <Button
            variant="destructive"
            class="min-h-11 min-w-11"
            :disabled="isBlocking"
            @click="handleBlock"
          >
            {{ isBlocking ? t('community.block.blocking') : t('community.block.confirm') }}
          </Button>
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
