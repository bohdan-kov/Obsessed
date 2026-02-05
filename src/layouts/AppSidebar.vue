<script setup>
import { ref, computed, onMounted, watch, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useAuth } from '@/composables/useAuth'
import { useNavigation } from '@/composables/useNavigation'
import { useGoalsStore } from '@/stores/goalsStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Dumbbell, PanelLeft, Zap } from 'lucide-vue-next'

// Props - allow parent to force collapse state (for responsive behavior)
const props = defineProps({
  forceCollapsed: {
    type: Boolean,
    default: false,
  },
})

const { t } = useI18n()
const { displayName, email, photoURL } = useAuth()
const {
  mainNavItems,
  libraryItems,
  footerItems,
  isActive,
  navigateTo,
  userInitials,
} = useNavigation()

const goalsStore = useGoalsStore()
const { activeGoals } = storeToRefs(goalsStore)

// Inject onboarding highlight state (null if not in onboarding)
const onboardingHighlight = inject('onboardingHighlight', null)

// Inject onboarding QuickLog control (null if not in onboarding)
const onboardingQuickLogOpen = inject('onboardingQuickLogOpen', null)

// Check if Quick Log button should be highlighted
const isQuickLogHighlighted = computed(() => {
  return onboardingHighlight?.value === 'quick-log-button'
})

// Check if Settings nav should be highlighted
const isSettingsHighlighted = computed(() => {
  return onboardingHighlight?.value === 'settings-nav'
})

const STORAGE_KEY = 'obsessed_sidebar_collapsed'
const userCollapsed = ref(false) // User's manual preference
const localQuickLogOpen = ref(false)

// QuickLog state: controlled by onboarding or local state
const quickLogOpen = computed({
  get: () => onboardingQuickLogOpen?.value ?? localQuickLogOpen.value,
  set: (value) => {
    if (onboardingQuickLogOpen) {
      onboardingQuickLogOpen.value = value
    } else {
      localQuickLogOpen.value = value
    }
  },
})

// Actual collapsed state: forced (tablet) or user preference
const collapsed = computed(() => props.forceCollapsed || userCollapsed.value)

// Toggle sidebar collapse (only affects user preference, not forced collapse)
function toggleCollapse() {
  // Don't allow toggle if forced collapsed (tablet mode)
  if (props.forceCollapsed) return

  userCollapsed.value = !userCollapsed.value
  localStorage.setItem(STORAGE_KEY, userCollapsed.value.toString())
}

// Quick log action
function quickLog() {
  quickLogOpen.value = true
}

// Load collapse state from localStorage
onMounted(() => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored !== null) {
    userCollapsed.value = stored === 'true'
  }
})

// Watch forceCollapsed to save state when transitioning from forced to non-forced
watch(() => props.forceCollapsed, (newVal, oldVal) => {
  // When transitioning from tablet to desktop, restore user preference
  if (oldVal === true && newVal === false) {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      userCollapsed.value = stored === 'true'
    }
  }
})
</script>

<template>
  <TooltipProvider>
    <aside
      :class="[
        'flex flex-col h-screen-safe bg-background border-r border-border transition-all duration-200',
        collapsed ? 'w-[68px]' : 'w-[260px]',
      ]"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-3 py-5 border-b border-border">
        <div v-if="!collapsed" class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-md bg-linear-to-br from-red-500 to-red-600 flex items-center justify-center">
            <Dumbbell class="w-[18px] h-[18px] text-white" />
          </div>
          <span class="text-[20px] font-bold tracking-tight bg-linear-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
            Obsessed
          </span>
        </div>

        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              @click="toggleCollapse"
              :class="[
                'shrink-0 h-8 w-8 border border-border hover:bg-accent hover:border-border',
                collapsed && 'mx-auto',
              ]"
            >
              <PanelLeft :class="['w-4 h-4 text-muted-foreground', collapsed && 'rotate-180']" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {{ collapsed ? t('common.sidebar.expand') : t('common.sidebar.collapse') }}
          </TooltipContent>
        </Tooltip>
      </div>

      <ScrollArea class="flex-1 px-3 py-5">
        <div class="space-y-0.5">
          <!-- Quick Log Button -->
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                @click="quickLog"
                :class="[
                  'w-full gap-2 mb-6 bg-linear-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-[0_2px_8px_rgba(239,68,68,0.3)] hover:shadow-[0_4px_12px_rgba(239,68,68,0.4)] hover:-translate-y-0.5 transition-all',
                  collapsed ? 'justify-center px-2.5 h-10' : 'justify-center px-4 h-10',
                  isQuickLogHighlighted && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                ]"
              >
                <Zap class="w-4 h-4 shrink-0" />
                <span v-if="!collapsed" class="text-sm font-medium">{{ t('common.nav.quickLog') }}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent v-if="collapsed" side="right">
              {{ t('common.nav.quickLog') }}
            </TooltipContent>
          </Tooltip>

          <!-- Main Navigation Items -->
          <div class="space-y-0.5 mb-6">
            <Tooltip v-for="item in mainNavItems" :key="item.route">
              <TooltipTrigger as-child>
                <Button
                  variant="ghost"
                  @click="navigateTo(item.route)"
                  :class="[
                    'w-full gap-2.5 h-10 text-muted-foreground hover:bg-accent hover:text-foreground transition-all',
                    collapsed ? 'justify-center px-2.5' : 'justify-start px-3',
                    isActive(item.route) && 'bg-red-500/10 text-red-500 hover:bg-red-500/10 hover:text-red-500',
                  ]"
                >
                  <component :is="item.icon" class="w-[18px] h-[18px] shrink-0" />
                  <span v-if="!collapsed" class="text-sm flex-1 text-left">{{ item.name }}</span>
                  <!-- Badge for Goals (active goals count) -->
                  <Badge
                    v-if="!collapsed && item.route === 'Goals' && activeGoals.length > 0"
                    variant="secondary"
                    class="ml-auto h-5 min-w-5 px-1.5 text-xs"
                  >
                    {{ activeGoals.length }}
                  </Badge>
                </Button>
              </TooltipTrigger>
              <TooltipContent v-if="collapsed" side="right">
                <div>
                  <div class="font-medium">{{ item.name }}</div>
                  <div class="text-xs text-muted-foreground">{{ item.description }}</div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>

          <!-- Library Section -->
          <div v-if="!collapsed" class="space-y-0.5">
            <div class="px-3 py-2 mb-2">
              <span class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
                {{ t('common.nav.library.label') }}
              </span>
            </div>
            <Tooltip v-for="item in libraryItems" :key="item.route">
              <TooltipTrigger as-child>
                <Button
                  variant="ghost"
                  @click="navigateTo(item.route)"
                  :class="[
                    'w-full gap-2.5 h-10 text-muted-foreground hover:bg-accent hover:text-foreground transition-all justify-start px-3',
                    isActive(item.route) && 'bg-red-500/10 text-red-500 hover:bg-red-500/10 hover:text-red-500',
                  ]"
                >
                  <component :is="item.icon" class="w-[18px] h-[18px] shrink-0" />
                  <span class="text-sm">{{ item.name }}</span>
                </Button>
              </TooltipTrigger>
            </Tooltip>
          </div>

          <!-- Library Section (Collapsed) -->
          <div v-else class="space-y-0.5">
            <Tooltip v-for="item in libraryItems" :key="item.route">
              <TooltipTrigger as-child>
                <Button
                  variant="ghost"
                  @click="navigateTo(item.route)"
                  :class="[
                    'w-full gap-2.5 h-10 text-muted-foreground hover:bg-accent hover:text-foreground transition-all justify-center px-2.5',
                    isActive(item.route) && 'bg-red-500/10 text-red-500 hover:bg-red-500/10 hover:text-red-500',
                  ]"
                >
                  <component :is="item.icon" class="w-[18px] h-[18px] shrink-0" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div>
                  <div class="font-medium">{{ item.name }}</div>
                  <div class="text-xs text-muted-foreground">{{ item.description }}</div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </ScrollArea>

      <!-- Footer Section -->
      <div class="border-t border-border">
        <div class="px-3 py-2 space-y-0.5">
          <Tooltip v-for="item in footerItems" :key="item.route">
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                @click="navigateTo(item.route)"
                :class="[
                  'w-full gap-2.5 h-10 text-muted-foreground hover:bg-accent hover:text-foreground transition-all',
                  collapsed ? 'justify-center px-2.5' : 'justify-start px-3',
                  isActive(item.route) && 'bg-red-500/10 text-red-500 hover:bg-red-500/10 hover:text-red-500',
                  item.route === 'Settings' && isSettingsHighlighted && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                ]"
              >
                <component :is="item.icon" class="w-[18px] h-[18px] shrink-0" />
                <span v-if="!collapsed" class="text-sm">{{ item.name }}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent v-if="collapsed" side="right">
              <div>
                <div class="font-medium">{{ item.name }}</div>
                <div class="text-xs text-muted-foreground">{{ item.description }}</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>

        <!-- User Profile -->
        <div class="px-3 pb-3 pt-3 border-t border-border">
          <Button
            variant="ghost"
            @click="navigateTo('MyProfile')"
            :class="[
              'w-full h-auto p-3 hover:bg-accent transition-all',
              collapsed ? 'justify-center' : 'justify-start gap-2.5',
            ]"
          >
            <Avatar class="w-9 h-9 shrink-0 rounded-lg bg-linear-to-br from-red-500 to-orange-500">
              <AvatarImage :src="photoURL" :alt="displayName" />
              <AvatarFallback class="rounded-lg text-xs font-semibold">
                {{ userInitials }}
              </AvatarFallback>
            </Avatar>

            <div v-if="!collapsed" class="flex-1 text-left overflow-hidden min-w-0">
              <div class="text-sm font-medium truncate">
                {{ displayName || t('common.user.defaultName') }}
              </div>
              <div class="text-xs text-muted-foreground truncate">
                {{ email }}
              </div>
            </div>
          </Button>
        </div>
      </div>
    </aside>
  </TooltipProvider>
</template>
