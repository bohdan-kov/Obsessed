<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { VisuallyHidden } from 'reka-ui'
import {
  LayoutDashboard,
  Activity,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Zap,
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { displayName, email, photoURL, logout } = useAuth()

const isOpen = ref(false)

// Navigation items - computed for reactive i18n
const navItems = computed(() => [
  { name: t('common.nav.dashboard.name'), route: 'Dashboard', icon: LayoutDashboard },
  { name: t('common.nav.workouts.name'), route: 'Workouts', icon: Activity },
  { name: t('common.nav.analytics.name'), route: 'Analytics', icon: BarChart3 },
  { name: t('common.nav.settings.name'), route: 'Settings', icon: Settings },
])

// Get user initials
const userInitials = displayName.value
  ? displayName.value
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  : 'U'

// Check if route is active
function isActive(routeName) {
  return route.name === routeName
}

// Navigate and close sheet
function navigateTo(routeName) {
  router.push({ name: routeName })
  isOpen.value = false
}

// Quick log
function quickLog() {
  router.push({ name: 'Workouts' })
  isOpen.value = false
}

// Logout
async function handleLogout() {
  await logout()
  isOpen.value = false
}
</script>

<template>
  <div class="lg:hidden">
    <Sheet v-model:open="isOpen">
      <SheetTrigger as-child>
        <Button variant="ghost" size="icon" class="shrink-0">
          <Menu class="w-6 h-6" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" class="w-64 p-0">
        <VisuallyHidden>
          <SheetTitle>{{ t('common.nav.mobileMenu.title') }}</SheetTitle>
          <SheetDescription>{{ t('common.nav.mobileMenu.description') }}</SheetDescription>
        </VisuallyHidden>

        <div class="flex flex-col h-full">
          <!-- Header -->
          <div class="flex items-center h-16 px-4 border-b border-border">
            <div class="flex items-center space-x-2">
              <div
                class="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500"
              >
                <Zap class="w-5 h-5 text-white" />
              </div>
              <span class="font-bold text-lg">Obsessed</span>
            </div>
          </div>

          <!-- Navigation -->
          <div class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <!-- Quick Log Button -->
            <Button
              @click="quickLog"
              class="w-full justify-start gap-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg"
            >
              <Zap class="w-5 h-5" />
              <span class="font-semibold">{{ t('common.nav.quickLog') }}</span>
            </Button>

            <Separator class="my-4" />

            <!-- Nav Items -->
            <div class="space-y-1">
              <Button
                v-for="item in navItems"
                :key="item.route"
                :variant="isActive(item.route) ? 'secondary' : 'ghost'"
                @click="navigateTo(item.route)"
                class="w-full justify-start gap-3"
              >
                <component :is="item.icon" class="w-5 h-5" />
                <span>{{ item.name }}</span>
              </Button>
            </div>
          </div>

          <!-- User Profile -->
          <div class="p-3 border-t border-border space-y-2">
            <div class="flex items-center gap-3 px-2 py-2">
              <Avatar class="w-10 h-10">
                <AvatarImage :src="photoURL" :alt="displayName" />
                <AvatarFallback>{{ userInitials }}</AvatarFallback>
              </Avatar>

              <div class="flex-1 overflow-hidden">
                <div class="text-sm font-medium truncate">
                  {{ displayName || t('common.user.defaultName') }}
                </div>
                <div class="text-xs text-muted-foreground truncate">
                  {{ email }}
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              @click="handleLogout"
              class="w-full justify-start gap-3 text-destructive hover:text-destructive"
            >
              <LogOut class="w-5 h-5" />
              <span>{{ t('common.user.menu.signOut') }}</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>
