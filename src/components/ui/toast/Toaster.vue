<script setup>
import { useToast } from './use-toast'
import Toast from './Toast.vue'
import { TransitionGroup } from 'vue'

const { toasts, dismiss } = useToast()
</script>

<template>
  <teleport to="body">
    <div
      class="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:top-auto sm:right-0 sm:bottom-0 sm:flex-col sm:p-6 md:max-w-[420px] pointer-events-none"
    >
      <TransitionGroup
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-2 sm:translate-y-0 sm:translate-x-2"
        enter-to-class="opacity-100 translate-y-0 sm:translate-x-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0 scale-95"
      >
        <Toast
          v-for="toast in toasts"
          :key="toast.id"
          :id="toast.id"
          :title="toast.title"
          :description="toast.description"
          :variant="toast.variant"
          @dismiss="dismiss"
          class="mb-2"
        />
      </TransitionGroup>
    </div>
  </teleport>
</template>
