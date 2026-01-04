<script setup>
import { ref, computed, watch } from 'vue'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

/**
 * UserAvatar - Reusable user avatar component
 *
 * Features:
 * - Multiple size variants (sm, md, lg, xl)
 * - Fallback to user initials if no photo
 * - Handles nested photoURL paths (user.photoURL OR user.profile.photoURL)
 * - Image load error handling with automatic fallback
 * - Colored fallback backgrounds based on user ID for consistency
 * - Optional online indicator (green dot)
 * - Clickable (emits click event for navigation)
 */

const props = defineProps({
  user: {
    type: Object,
    required: true,
    validator: (user) => user && (user.displayName || user.uid),
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg', 'xl'].includes(value),
  },
  showOnline: {
    type: Boolean,
    default: false,
  },
  clickable: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['click'])

// Track if image failed to load
const imageLoadError = ref(false)

// Size classes mapping
const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-base',
  xl: 'w-24 h-24 text-xl',
}

// Online indicator size
const indicatorSizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-4 h-4',
}

const avatarClass = computed(() => {
  return [sizeClasses[props.size], props.clickable && 'cursor-pointer hover:opacity-80 transition-opacity']
    .filter(Boolean)
    .join(' ')
})

const indicatorClass = computed(() => {
  return indicatorSizeClasses[props.size]
})

/**
 * Get photoURL from multiple possible locations
 * Priority: user.photoURL > user.profile.photoURL > null
 */
const photoURL = computed(() => {
  const url = props.user.photoURL || props.user.profile?.photoURL || ''

  // Log if photoURL is found but might not load
  if (url && import.meta.env.DEV) {
    console.log('[UserAvatar] Photo URL for', props.user.displayName || props.user.uid, ':', url)
  }

  return url || null
})

/**
 * Get user initials from display name
 * Supports both Latin and Cyrillic characters
 * Falls back to first letter of email or 'U' if nothing available
 */
const userInitials = computed(() => {
  const displayName = props.user.displayName || props.user.profile?.displayName || ''

  if (displayName) {
    const parts = displayName.trim().split(' ')
    if (parts.length >= 2) {
      // Get first character of first and last name
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    // Get first two characters of single name
    return parts[0].substring(0, 2).toUpperCase()
  }

  if (props.user.email) {
    return props.user.email.substring(0, 2).toUpperCase()
  }

  return 'U'
})

/**
 * Generate consistent background color for fallback based on user ID
 * Uses hsl() for better color control and accessibility
 */
const fallbackBgColor = computed(() => {
  const userId = props.user.uid || props.user.id || 'default'

  // Generate hue from user ID (0-360)
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash % 360)

  // Use high saturation and medium lightness for vibrant, accessible colors
  // Lightness: 35% in dark mode for good contrast, 65% in light mode
  return `hsl(${hue}, 70%, var(--avatar-lightness, 45%))`
})

/**
 * Handle successful image load
 */
const handleImageLoad = () => {
  if (import.meta.env.DEV) {
    console.log(
      '[UserAvatar] Successfully loaded image for',
      props.user.displayName || props.user.uid,
      '- URL:',
      photoURL.value
    )
  }
}

/**
 * Handle image load error
 */
const handleImageError = (event) => {
  imageLoadError.value = true

  if (import.meta.env.DEV) {
    console.error(
      '[UserAvatar] Failed to load image for',
      props.user.displayName || props.user.uid,
      '- URL:',
      photoURL.value,
      '- Event:',
      event
    )
  }
}

/**
 * Reset error state when photoURL changes
 * This allows retry if the user's photo is updated
 */
watch(photoURL, () => {
  imageLoadError.value = false
})

const handleClick = () => {
  if (props.clickable) {
    emit('click', props.user)
  }
}
</script>

<template>
  <div class="relative inline-block">
    <Avatar :class="avatarClass" @click="handleClick">
      <!-- Use custom image rendering to avoid reka-ui display:none issue -->
      <template v-if="photoURL && !imageLoadError">
        <img
          :src="photoURL"
          :alt="user.displayName || user.profile?.displayName || 'User'"
          class="h-full w-full object-cover"
          @load="handleImageLoad"
          @error="handleImageError"
        />
      </template>

      <!-- Fallback with colored background and high-contrast text -->
      <template v-else>
        <AvatarFallback
          :class="sizeClasses[size]"
          :style="{ backgroundColor: fallbackBgColor }"
          class="flex items-center justify-center text-white font-semibold select-none"
        >
          {{ userInitials }}
        </AvatarFallback>
      </template>
    </Avatar>

    <!-- Online indicator (green dot) -->
    <div
      v-if="showOnline"
      :class="[
        'absolute bottom-0 right-0 rounded-full bg-green-500 border-2 border-background',
        indicatorClass,
      ]"
      aria-label="Online"
    />
  </div>
</template>

<style scoped>
/* CSS variable for adaptive lightness based on color scheme */
@media (prefers-color-scheme: dark) {
  :root {
    --avatar-lightness: 35%; /* Darker in dark mode for better contrast */
  }
}

@media (prefers-color-scheme: light) {
  :root {
    --avatar-lightness: 65%; /* Lighter in light mode for better contrast */
  }
}
</style>
