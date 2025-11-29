<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const isSubmitting = ref(false)
const localError = ref(null)

const redirectPath = computed(() => route.query.redirect || '/')

async function handleEmailLogin() {
  if (!email.value || !password.value) {
    localError.value = 'Please fill in all fields'
    return
  }

  isSubmitting.value = true
  localError.value = null
  authStore.clearError()

  try {
    await authStore.handleSignInWithEmail(email.value, password.value)
    router.push(redirectPath.value)
  } catch (error) {
    localError.value = error.message || 'Failed to sign in'
  } finally {
    isSubmitting.value = false
  }
}

async function handleGoogleLogin() {
  isSubmitting.value = true
  localError.value = null
  authStore.clearError()

  try {
    await authStore.handleSignInWithGoogle()
    router.push(redirectPath.value)
  } catch (error) {
    localError.value = error.message || 'Failed to sign in with Google'
  } finally {
    isSubmitting.value = false
  }
}

function goToRegister() {
  router.push({ name: 'Register', query: route.query })
}

const displayError = computed(() => localError.value || authStore.error)
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background p-4">
    <Card class="w-full max-w-md">
      <CardHeader class="space-y-1">
        <CardTitle class="text-2xl font-bold">Welcome back</CardTitle>
        <CardDescription>
          Sign in to your Obsessed account to continue
        </CardDescription>
      </CardHeader>

      <CardContent class="space-y-4">
        <Alert v-if="displayError" variant="destructive">
          <AlertCircle class="h-4 w-4" />
          <AlertDescription>{{ displayError }}</AlertDescription>
        </Alert>

        <form @submit.prevent="handleEmailLogin" class="space-y-4">
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="your@email.com"
              required
              autocomplete="email"
              :disabled="isSubmitting"
            />
          </div>

          <div class="space-y-2">
            <Label for="password">Password</Label>
            <Input
              id="password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              required
              autocomplete="current-password"
              :disabled="isSubmitting"
            />
          </div>

          <Button type="submit" class="w-full" :disabled="isSubmitting">
            <Loader2
              v-if="isSubmitting"
              class="mr-2 h-4 w-4 animate-spin"
            />
            Sign In
          </Button>
        </form>

        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          class="w-full"
          @click="handleGoogleLogin"
          :disabled="isSubmitting"
        >
          <svg class="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </Button>
      </CardContent>

      <CardFooter>
        <div class="text-center text-sm text-muted-foreground w-full">
          Don't have an account?
          <Button
            variant="link"
            class="p-0 h-auto font-normal"
            @click="goToRegister"
          >
            Sign up
          </Button>
        </div>
      </CardFooter>
    </Card>
  </div>
</template>
