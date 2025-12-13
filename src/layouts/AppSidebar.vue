<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard,
  Activity,
  Dumbbell,
  BarChart3,
  Settings,
  PanelLeft,
  LogOut,
  User,
  Zap,
} from 'lucide-vue-next'
import QuickLogSheet from '@/components/QuickLogSheet.vue'

// Props - allow parent to force collapse state (for responsive behavior)
const props = defineProps({
  forceCollapsed: {
    type: Boolean,
    default: false,
  },
})

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { displayName, email, photoURL, logout } = useAuth()

const STORAGE_KEY = 'obsessed_sidebar_collapsed'
const userCollapsed = ref(false) // User's manual preference
const quickLogOpen = ref(false)

// Actual collapsed state: forced (tablet) or user preference
const collapsed = computed(() => props.forceCollapsed || userCollapsed.value)

// Navigation items - computed for reactive i18n
const navItems = computed(() => [
  {
    name: t('common.nav.dashboard.name'),
    route: 'Dashboard',
    icon: LayoutDashboard,
    description: t('common.nav.dashboard.description'),
  },
  {
    name: t('common.nav.workouts.name'),
    route: 'Workouts',
    icon: Activity,
    description: t('common.nav.workouts.description'),
  },
  {
    name: t('exercises.title'),
    route: 'Exercises',
    icon: Dumbbell,
    description: t('exercises.subtitle'),
  },
  {
    name: t('common.nav.analytics.name'),
    route: 'Analytics',
    icon: BarChart3,
    description: t('common.nav.analytics.description'),
  },
])

// Get user initials for avatar fallback
const userInitials = computed(() => {
  if (!displayName.value) return 'U'
  return displayName.value
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

// Check if route is active
function isActive(routeName) {
  return route.name === routeName
}

// Navigate to route
function navigateTo(routeName) {
  router.push({ name: routeName })
}

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

// Settings
function openSettings() {
  router.push({ name: 'Settings' })
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
        'flex flex-col h-screen bg-card border-r border-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
      ]"
    >
      <!-- Header -->
      <div class="flex items-center justify-between h-16 px-4 border-b border-border">
        <div v-if="!collapsed" class="flex items-center space-x-2">
          <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500">
            <Zap class="w-5 h-5 text-white" />
          </div>
          <span class="font-bold text-lg">Obsessed</span>
        </div>

        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              @click="toggleCollapse"
              class="shrink-0"
            >
              <PanelLeft :class="['w-5 h-5', collapsed && 'rotate-180']" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {{ collapsed ? t('common.sidebar.expand') : t('common.sidebar.collapse') }}
          </TooltipContent>
        </Tooltip>
      </div>

      <ScrollArea class="flex-1 px-3 py-4">
        <div class="space-y-1">
          <!-- Quick Log Button
               Note: This button uses the same label as the "Add Exercise" button in ExerciseTable.
               Both buttons open QuickLogSheet for logging exercises. The unified naming eliminates
               confusion about different entry points performing the same action.
          -->
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                @click="quickLog"
                :class="[
                  'w-full justify-start gap-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg',
                  collapsed && 'justify-center px-0',
                ]"
              >
                <Zap class="w-5 h-5 shrink-0" />
                <span v-if="!collapsed" class="font-semibold">{{ t('common.nav.quickLog') }}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent v-if="collapsed" side="right">
              {{ t('common.nav.quickLog') }}
            </TooltipContent>
          </Tooltip>

          <Separator class="my-4" />

          <!-- Navigation Items -->
          <div class="space-y-1">
            <Tooltip v-for="item in navItems" :key="item.route">
              <TooltipTrigger as-child>
                <Button
                  :variant="isActive(item.route) ? 'secondary' : 'ghost'"
                  @click="navigateTo(item.route)"
                  :class="[
                    'w-full justify-start gap-3',
                    collapsed && 'justify-center px-0',
                    isActive(item.route) && 'bg-secondary',
                  ]"
                >
                  <component :is="item.icon" class="w-5 h-5 shrink-0" />
                  <span v-if="!collapsed">{{ item.name }}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent v-if="collapsed" side="right">
                <div>
                  <div class="font-medium">{{ item.name }}</div>
                  <div class="text-xs text-muted-foreground">
                    {{ item.description }}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>

          <Separator class="my-4" />

          <!-- Settings -->
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                @click="openSettings"
                :class="[
                  'w-full justify-start gap-3',
                  collapsed && 'justify-center px-0',
                  isActive('Settings') && 'bg-secondary',
                ]"
              >
                <Settings class="w-5 h-5 shrink-0" />
                <span v-if="!collapsed">{{ t('common.nav.settings.name') }}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent v-if="collapsed" side="right">
              {{ t('common.nav.settings.name') }}
            </TooltipContent>
          </Tooltip>
        </div>
      </ScrollArea>

      <!-- User Profile Section -->
      <div class="p-3 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              variant="ghost"
              :class="[
                'w-full h-auto p-2',
                collapsed ? 'justify-center' : 'justify-start gap-3',
              ]"
            >
              <Avatar class="w-8 h-8 shrink-0">
                <AvatarImage :src="photoURL" :alt="displayName" />
                <AvatarFallback>{{ userInitials }}</AvatarFallback>
              </Avatar>

              <div v-if="!collapsed" class="flex-1 text-left overflow-hidden">
                <div class="text-sm font-medium truncate">
                  {{ displayName || t('common.user.defaultName') }}
                </div>
                <div class="text-xs text-muted-foreground truncate">
                  {{ email }}
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" class="w-56">
            <DropdownMenuLabel>{{ t('common.user.menu.myAccount') }}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="openSettings">
              <User class="w-4 h-4 mr-2" />
              {{ t('common.user.menu.profile') }}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="logout" class="text-destructive">
              <LogOut class="w-4 h-4 mr-2" />
              {{ t('common.user.menu.signOut') }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>

    <!-- Quick Log Sheet -->
    <QuickLogSheet v-model:open="quickLogOpen" />
  </TooltipProvider>
</template>
