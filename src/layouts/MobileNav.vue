<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import { useNavigation } from '@/composables/useNavigation'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { VisuallyHidden } from 'reka-ui'
import { Dumbbell, LogOut, Menu, Zap } from 'lucide-vue-next'

const { t } = useI18n()
const { displayName, email, photoURL, logout } = useAuth()
const {
  mainNavItems,
  libraryItems,
  footerItems,
  isActive,
  navigateTo: baseNavigateTo,
  userInitials,
} = useNavigation()

const isOpen = ref(false)

// Navigate and close sheet
function navigateTo(routeName) {
  baseNavigateTo(routeName)
  isOpen.value = false
}

// Quick log
function quickLog() {
  baseNavigateTo('Workouts')
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

      <SheetContent side="left" class="w-64 p-0 bg-[#0a0a0c]">
        <VisuallyHidden>
          <SheetTitle>{{ t('common.nav.mobileMenu.title') }}</SheetTitle>
          <SheetDescription>{{ t('common.nav.mobileMenu.description') }}</SheetDescription>
        </VisuallyHidden>

        <div class="flex flex-col h-full">
          <!-- Header -->
          <div class="flex items-center h-16 px-4 border-b border-white/6">
            <div class="flex items-center gap-2.5">
              <div
                class="w-7 h-7 rounded-md bg-linear-to-br from-red-500 to-red-600 flex items-center justify-center"
              >
                <Dumbbell class="w-[18px] h-[18px] text-white" />
              </div>
              <span class="text-lg font-bold tracking-tight bg-linear-to-br from-white to-zinc-400 bg-clip-text text-transparent">Obsessed</span>
            </div>
          </div>

          <!-- Navigation with ScrollArea -->
          <ScrollArea class="flex-1 px-3 py-4">
            <div class="space-y-0.5">
              <!-- Quick Log Button -->
              <Button
                @click="quickLog"
                class="w-full justify-center gap-2 mb-6 h-10 px-4 bg-linear-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-[0_2px_8px_rgba(239,68,68,0.3)] hover:shadow-[0_4px_12px_rgba(239,68,68,0.4)] hover:-translate-y-0.5 transition-all"
              >
                <Zap class="w-4 h-4 shrink-0" />
                <span class="text-sm font-medium">{{ t('common.nav.quickLog') }}</span>
              </Button>

              <!-- Main Navigation Items -->
              <div class="space-y-0.5 mb-6">
                <Button
                  v-for="item in mainNavItems"
                  :key="item.route"
                  variant="ghost"
                  @click="navigateTo(item.route)"
                  :class="[
                    'w-full justify-start gap-2.5 h-10 px-3 text-zinc-400 hover:bg-white/4 hover:text-white transition-all',
                    isActive(item.route) && 'bg-red-500/10 text-red-500 hover:bg-red-500/10 hover:text-red-500',
                  ]"
                >
                  <component :is="item.icon" class="w-[18px] h-[18px] shrink-0" />
                  <span class="text-sm">{{ item.name }}</span>
                </Button>
              </div>

              <!-- Library Section -->
              <div class="space-y-0.5">
                <div class="px-3 py-2 mb-2">
                  <span class="text-[11px] font-medium uppercase tracking-wider text-zinc-600">
                    {{ t('common.nav.library.label') }}
                  </span>
                </div>
                <Button
                  v-for="item in libraryItems"
                  :key="item.route"
                  variant="ghost"
                  @click="navigateTo(item.route)"
                  :class="[
                    'w-full justify-start gap-2.5 h-10 px-3 text-zinc-400 hover:bg-white/4 hover:text-white transition-all',
                    isActive(item.route) && 'bg-red-500/10 text-red-500 hover:bg-red-500/10 hover:text-red-500',
                  ]"
                >
                  <component :is="item.icon" class="w-[18px] h-[18px] shrink-0" />
                  <span class="text-sm">{{ item.name }}</span>
                </Button>
              </div>
            </div>
          </ScrollArea>

          <!-- Footer Section -->
          <div class="border-t border-white/6">
            <div class="px-3 py-2 space-y-0.5">
              <Button
                v-for="item in footerItems"
                :key="item.route"
                variant="ghost"
                @click="navigateTo(item.route)"
                :class="[
                  'w-full justify-start gap-2.5 h-10 px-3 text-zinc-400 hover:bg-white/4 hover:text-white transition-all',
                  isActive(item.route) && 'bg-red-500/10 text-red-500 hover:bg-red-500/10 hover:text-red-500',
                ]"
              >
                <component :is="item.icon" class="w-[18px] h-[18px] shrink-0" />
                <span class="text-sm">{{ item.name }}</span>
              </Button>
            </div>

            <!-- User Profile -->
            <div class="px-3 pb-3 pt-3 border-t border-white/6">
              <Button
                variant="ghost"
                @click="navigateTo('Profile')"
                class="w-full h-auto p-3 justify-start gap-2.5 hover:bg-white/4 transition-all"
              >
                <Avatar class="w-9 h-9 shrink-0 rounded-lg bg-linear-to-br from-red-500 to-orange-500">
                  <AvatarImage :src="photoURL" :alt="displayName" />
                  <AvatarFallback class="rounded-lg text-xs font-semibold">
                    {{ userInitials }}
                  </AvatarFallback>
                </Avatar>

                <div class="flex-1 text-left overflow-hidden min-w-0">
                  <div class="text-sm font-medium truncate">
                    {{ displayName || t('common.user.defaultName') }}
                  </div>
                  <div class="text-xs text-zinc-500 truncate">
                    {{ email }}
                  </div>
                </div>
              </Button>

              <Button
                variant="ghost"
                @click="handleLogout"
                class="w-full justify-start gap-2.5 h-10 px-3 mt-2 text-destructive hover:text-destructive hover:bg-white/4"
              >
                <LogOut class="w-[18px] h-[18px] shrink-0" />
                <span class="text-sm">{{ t('common.user.menu.signOut') }}</span>
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>
