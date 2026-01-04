import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/authStore'

// Mock Firebase modules
vi.mock('@/firebase/auth', () => ({
  signInWithGoogle: vi.fn(),
  signInWithEmail: vi.fn(),
  createAccount: vi.fn(),
  signOut: vi.fn(),
  onAuthChange: vi.fn(),
  resetPassword: vi.fn(),
  sendVerificationEmail: vi.fn(),
}))

vi.mock('@/firebase/firestore', () => ({
  fetchDocument: vi.fn(),
  setDocument: vi.fn(),
  subscribeToDocument: vi.fn(),
  COLLECTIONS: {
    USERS: 'users',
  },
}))

// Import mocked modules after mock setup
import {
  signInWithGoogle,
  signInWithEmail,
  createAccount,
  signOut as firebaseSignOut,
  onAuthChange,
  resetPassword,
  sendVerificationEmail,
} from '@/firebase/auth'

import { fetchDocument, setDocument, subscribeToDocument } from '@/firebase/firestore'

describe('authStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('should initialize with null user', () => {
      const store = useAuthStore()
      expect(store.user).toBeNull()
    })

    it('should initialize with null userProfile', () => {
      const store = useAuthStore()
      expect(store.userProfile).toBeNull()
    })

    it('should initialize with loading as true', () => {
      const store = useAuthStore()
      expect(store.loading).toBe(true)
    })

    it('should initialize with initializing as true', () => {
      const store = useAuthStore()
      expect(store.initializing).toBe(true)
    })

    it('should initialize with null error', () => {
      const store = useAuthStore()
      expect(store.error).toBeNull()
    })
  })

  describe('computed getters', () => {
    it('should return false for isAuthenticated when user is null', () => {
      const store = useAuthStore()
      expect(store.isAuthenticated).toBe(false)
    })

    it('should return true for isAuthenticated when user exists', async () => {
      const store = useAuthStore()

      // Mock successful auth state change
      onAuthChange.mockImplementation((callback) => {
        callback({
          uid: 'test-uid',
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: null,
          emailVerified: true,
        })
        return vi.fn() // unsubscribe function
      })

      fetchDocument.mockResolvedValue({
        displayName: 'Test User',
        email: 'test@example.com',
      })

      subscribeToDocument.mockReturnValue(vi.fn())

      await store.initAuth()
      expect(store.isAuthenticated).toBe(true)
    })

    it('should return correct emailVerified status', async () => {
      const store = useAuthStore()

      onAuthChange.mockImplementation((callback) => {
        callback({
          uid: 'test-uid',
          email: 'test@example.com',
          emailVerified: false,
        })
        return vi.fn()
      })

      fetchDocument.mockResolvedValue({
        email: 'test@example.com',
        profile: {
          displayName: 'Test User',
          bio: '',
          photoURL: '',
          privacyMode: 'public',
          followerCount: 0,
          followingCount: 0,
        },
      })
      subscribeToDocument.mockReturnValue(vi.fn())

      await store.initAuth()
      expect(store.isEmailVerified).toBe(false)
    })

    it('should return uid from user', async () => {
      const store = useAuthStore()

      onAuthChange.mockImplementation((callback) => {
        callback({
          uid: 'test-uid-123',
          email: 'test@example.com',
        })
        return vi.fn()
      })

      fetchDocument.mockResolvedValue({
        email: 'test@example.com',
        profile: {
          displayName: 'Test User',
          bio: '',
          photoURL: '',
          privacyMode: 'public',
          followerCount: 0,
          followingCount: 0,
        },
      })
      subscribeToDocument.mockReturnValue(vi.fn())

      await store.initAuth()
      expect(store.uid).toBe('test-uid-123')
    })

    it('should return displayName from userProfile if available', async () => {
      const store = useAuthStore()

      onAuthChange.mockImplementation((callback) => {
        callback({
          uid: 'test-uid',
          email: 'test@example.com',
          displayName: 'Firebase User',
        })
        return vi.fn()
      })

      fetchDocument.mockResolvedValue({
        displayName: 'Profile User',
        email: 'test@example.com',
      })

      subscribeToDocument.mockImplementation((collection, docId, callback) => {
        // Immediately call callback with profile data
        callback({
          displayName: 'Profile User',
          email: 'test@example.com',
        })
        return vi.fn()
      })

      await store.initAuth()
      expect(store.displayName).toBe('Profile User')
    })

    it('should fallback to user.displayName if userProfile is null', async () => {
      const store = useAuthStore()

      onAuthChange.mockImplementation((callback) => {
        callback({
          uid: 'test-uid',
          email: 'test@example.com',
          displayName: 'Firebase User',
        })
        return vi.fn()
      })

      fetchDocument.mockResolvedValue(null)
      setDocument.mockResolvedValue()
      subscribeToDocument.mockReturnValue(vi.fn())

      await store.initAuth()
      expect(store.displayName).toBe('Firebase User')
    })

    it('should return empty string for displayName when both are null', () => {
      const store = useAuthStore()
      expect(store.displayName).toBe('')
    })

    it('should return email from user', async () => {
      const store = useAuthStore()

      onAuthChange.mockImplementation((callback) => {
        callback({
          uid: 'test-uid',
          email: 'user@test.com',
        })
        return vi.fn()
      })

      fetchDocument.mockResolvedValue({
        email: 'user@test.com',
        profile: {
          displayName: 'Test User',
          bio: '',
          photoURL: '',
          privacyMode: 'public',
          followerCount: 0,
          followingCount: 0,
        },
      })
      subscribeToDocument.mockReturnValue(vi.fn())

      await store.initAuth()
      expect(store.email).toBe('user@test.com')
    })

    it('should return photoURL from userProfile if available', async () => {
      const store = useAuthStore()

      onAuthChange.mockImplementation((callback) => {
        callback({
          uid: 'test-uid',
          email: 'test@example.com',
          photoURL: 'firebase-photo.jpg',
        })
        return vi.fn()
      })

      fetchDocument.mockResolvedValue({
        email: 'test@example.com',
        photoURL: 'profile-photo.jpg',
      })

      subscribeToDocument.mockImplementation((collection, docId, callback) => {
        callback({
          email: 'test@example.com',
          photoURL: 'profile-photo.jpg',
        })
        return vi.fn()
      })

      await store.initAuth()
      expect(store.photoURL).toBe('profile-photo.jpg')
    })
  })

  describe('initAuth', () => {
    it('should set user when auth state changes to signed in', async () => {
      const store = useAuthStore()

      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'photo.jpg',
        emailVerified: true,
      }

      onAuthChange.mockImplementation((callback) => {
        callback(mockUser)
        return vi.fn()
      })

      fetchDocument.mockResolvedValue({
        email: 'test@example.com',
        profile: {
          displayName: 'Test User',
          bio: '',
          photoURL: '',
          privacyMode: 'public',
          followerCount: 0,
          followingCount: 0,
        },
      })
      subscribeToDocument.mockReturnValue(vi.fn())

      await store.initAuth()

      expect(store.user).toEqual({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'photo.jpg',
        emailVerified: true,
      })
    })

    it('should clear user when auth state changes to signed out', async () => {
      const store = useAuthStore()

      onAuthChange.mockImplementation((callback) => {
        callback(null)
        return vi.fn()
      })

      await store.initAuth()

      expect(store.user).toBeNull()
      expect(store.userProfile).toBeNull()
    })

    it('should set loading to false after auth state change', async () => {
      const store = useAuthStore()

      onAuthChange.mockImplementation((callback) => {
        callback(null)
        return vi.fn()
      })

      await store.initAuth()

      expect(store.loading).toBe(false)
    })

    it('should set initializing to false after auth state change', async () => {
      const store = useAuthStore()

      onAuthChange.mockImplementation((callback) => {
        callback(null)
        return vi.fn()
      })

      await store.initAuth()

      expect(store.initializing).toBe(false)
    })

    it('should subscribe to user profile when user signs in', async () => {
      const store = useAuthStore()

      onAuthChange.mockImplementation((callback) => {
        callback({
          uid: 'test-uid',
          email: 'test@example.com',
        })
        return vi.fn()
      })

      fetchDocument.mockResolvedValue({
        email: 'test@example.com',
        profile: {
          displayName: 'Test User',
          bio: '',
          photoURL: '',
          privacyMode: 'public',
          followerCount: 0,
          followingCount: 0,
        },
      })
      subscribeToDocument.mockReturnValue(vi.fn())

      await store.initAuth()

      expect(subscribeToDocument).toHaveBeenCalledWith(
        'users',
        'test-uid',
        expect.any(Function),
        expect.any(Function)
      )
    })

    it('should create user profile if it does not exist', async () => {
      const store = useAuthStore()

      onAuthChange.mockImplementation((callback) => {
        callback({
          uid: 'test-uid',
          email: 'newuser@example.com',
          displayName: 'New User',
          photoURL: 'photo.jpg',
        })
        return vi.fn()
      })

      fetchDocument.mockResolvedValue(null)
      setDocument.mockResolvedValue()
      subscribeToDocument.mockReturnValue(vi.fn())

      await store.initAuth()

      expect(setDocument).toHaveBeenCalledWith('users', 'test-uid', {
        displayName: 'New User',
        email: 'newuser@example.com',
        photoURL: 'photo.jpg',
        profile: {
          displayName: 'New User',
          bio: '',
          photoURL: 'photo.jpg',
          privacyMode: 'public',
          followerCount: 0,
          followingCount: 0,
          createdAt: expect.any(String),
        },
        settings: {
          defaultRestTime: 90,
          weightUnit: 'kg',
          theme: 'system',
          locale: 'uk',
          notifications: true,
          autoStartTimer: true,
          soundEnabled: true,
        },
        stats: {
          totalWorkouts: 0,
          totalSets: 0,
          totalVolume: 0,
          totalDuration: 0,
          currentStreak: 0,
          longestStreak: 0,
        },
      })
    })

    it('should cleanup profile subscription on sign out', async () => {
      const store = useAuthStore()
      const unsubscribeMock = vi.fn()

      // First sign in
      onAuthChange.mockImplementation((callback) => {
        callback({
          uid: 'test-uid',
          email: 'test@example.com',
        })
        return vi.fn()
      })

      fetchDocument.mockResolvedValue({
        email: 'test@example.com',
        profile: {
          displayName: 'Test User',
          bio: '',
          photoURL: '',
          privacyMode: 'public',
          followerCount: 0,
          followingCount: 0,
        },
      })
      subscribeToDocument.mockReturnValue(unsubscribeMock)

      await store.initAuth()

      // Then sign out
      onAuthChange.mockImplementation((callback) => {
        callback(null)
        return vi.fn()
      })

      await store.initAuth()

      expect(unsubscribeMock).toHaveBeenCalled()
    })
  })

  describe('handleSignInWithGoogle', () => {
    it('should successfully sign in with Google', async () => {
      const store = useAuthStore()
      const mockResult = { user: { uid: 'test-uid' } }

      signInWithGoogle.mockResolvedValue(mockResult)

      const result = await store.handleSignInWithGoogle()

      expect(signInWithGoogle).toHaveBeenCalled()
      expect(result).toEqual(mockResult)
      expect(store.error).toBeNull()
    })

    it('should set loading state during Google sign in', async () => {
      const store = useAuthStore()

      signInWithGoogle.mockImplementation(() => {
        expect(store.loading).toBe(true)
        return Promise.resolve({ user: { uid: 'test-uid' } })
      })

      await store.handleSignInWithGoogle()

      expect(store.loading).toBe(false)
    })

    it('should handle Google sign in error', async () => {
      const store = useAuthStore()
      const errorMessage = 'Google sign in failed'

      signInWithGoogle.mockRejectedValue(new Error(errorMessage))

      await expect(store.handleSignInWithGoogle()).rejects.toThrow(errorMessage)
      expect(store.error).toBe(errorMessage)
    })

    it('should set loading to false after error', async () => {
      const store = useAuthStore()

      signInWithGoogle.mockRejectedValue(new Error('Failed'))

      await expect(store.handleSignInWithGoogle()).rejects.toThrow()
      expect(store.loading).toBe(false)
    })
  })

  describe('handleSignInWithEmail', () => {
    it('should successfully sign in with email and password', async () => {
      const store = useAuthStore()
      const mockResult = { user: { uid: 'test-uid', email: 'test@example.com' } }

      signInWithEmail.mockResolvedValue(mockResult)

      const result = await store.handleSignInWithEmail('test@example.com', 'password123')

      expect(signInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(result).toEqual(mockResult)
      expect(store.error).toBeNull()
    })

    it('should set loading state during email sign in', async () => {
      const store = useAuthStore()

      signInWithEmail.mockImplementation(() => {
        expect(store.loading).toBe(true)
        return Promise.resolve({ user: { uid: 'test-uid' } })
      })

      await store.handleSignInWithEmail('test@example.com', 'password123')

      expect(store.loading).toBe(false)
    })

    it('should handle email sign in error', async () => {
      const store = useAuthStore()
      const errorMessage = 'Invalid credentials'

      signInWithEmail.mockRejectedValue(new Error(errorMessage))

      await expect(
        store.handleSignInWithEmail('wrong@example.com', 'wrongpass')
      ).rejects.toThrow(errorMessage)

      expect(store.error).toBe(errorMessage)
    })

    it('should set loading to false after error', async () => {
      const store = useAuthStore()

      signInWithEmail.mockRejectedValue(new Error('Failed'))

      await expect(
        store.handleSignInWithEmail('test@example.com', 'password')
      ).rejects.toThrow()

      expect(store.loading).toBe(false)
    })
  })

  describe('signUp', () => {
    it('should successfully create account', async () => {
      const store = useAuthStore()
      const mockResult = { user: { uid: 'new-uid', email: 'new@example.com' } }

      createAccount.mockResolvedValue(mockResult)

      const result = await store.signUp('new@example.com', 'password123', 'New User')

      expect(createAccount).toHaveBeenCalledWith('new@example.com', 'password123', 'New User')
      expect(result).toEqual(mockResult)
      expect(store.error).toBeNull()
    })

    it('should set loading state during sign up', async () => {
      const store = useAuthStore()

      createAccount.mockImplementation(() => {
        expect(store.loading).toBe(true)
        return Promise.resolve({ user: { uid: 'new-uid' } })
      })

      await store.signUp('new@example.com', 'password123', 'New User')

      expect(store.loading).toBe(false)
    })

    it('should handle sign up error', async () => {
      const store = useAuthStore()
      const errorMessage = 'Email already in use'

      createAccount.mockRejectedValue(new Error(errorMessage))

      await expect(
        store.signUp('existing@example.com', 'password123', 'User')
      ).rejects.toThrow(errorMessage)

      expect(store.error).toBe(errorMessage)
    })
  })

  describe('signOut', () => {
    it('should successfully sign out user', async () => {
      const store = useAuthStore()

      firebaseSignOut.mockResolvedValue()

      await store.signOut()

      expect(firebaseSignOut).toHaveBeenCalled()
      expect(store.user).toBeNull()
      expect(store.userProfile).toBeNull()
      expect(store.error).toBeNull()
    })

    it('should set loading state during sign out', async () => {
      const store = useAuthStore()

      firebaseSignOut.mockImplementation(() => {
        expect(store.loading).toBe(true)
        return Promise.resolve()
      })

      await store.signOut()

      expect(store.loading).toBe(false)
    })

    it('should cleanup profile subscription on sign out', async () => {
      const store = useAuthStore()
      const unsubscribeMock = vi.fn()

      // Set up a profile subscription first
      onAuthChange.mockImplementation((callback) => {
        callback({
          uid: 'test-uid',
          email: 'test@example.com',
        })
        return vi.fn()
      })

      fetchDocument.mockResolvedValue({
        email: 'test@example.com',
        profile: {
          displayName: 'Test User',
          bio: '',
          photoURL: '',
          privacyMode: 'public',
          followerCount: 0,
          followingCount: 0,
        },
      })
      subscribeToDocument.mockReturnValue(unsubscribeMock)

      await store.initAuth()

      // Now sign out
      firebaseSignOut.mockResolvedValue()
      await store.signOut()

      expect(unsubscribeMock).toHaveBeenCalled()
    })

    it('should handle sign out error', async () => {
      const store = useAuthStore()
      const errorMessage = 'Sign out failed'

      firebaseSignOut.mockRejectedValue(new Error(errorMessage))

      await expect(store.signOut()).rejects.toThrow(errorMessage)
      expect(store.error).toBe(errorMessage)
    })
  })

  describe('sendPasswordReset', () => {
    it('should successfully send password reset email', async () => {
      const store = useAuthStore()

      resetPassword.mockResolvedValue()

      await store.sendPasswordReset('user@example.com')

      expect(resetPassword).toHaveBeenCalledWith('user@example.com')
      expect(store.error).toBeNull()
    })

    it('should set loading state during password reset', async () => {
      const store = useAuthStore()

      resetPassword.mockImplementation(() => {
        expect(store.loading).toBe(true)
        return Promise.resolve()
      })

      await store.sendPasswordReset('user@example.com')

      expect(store.loading).toBe(false)
    })

    it('should handle password reset error', async () => {
      const store = useAuthStore()
      const errorMessage = 'User not found'

      resetPassword.mockRejectedValue(new Error(errorMessage))

      await expect(
        store.sendPasswordReset('nonexistent@example.com')
      ).rejects.toThrow(errorMessage)

      expect(store.error).toBe(errorMessage)
    })
  })

  describe('sendEmailVerification', () => {
    it('should successfully send verification email', async () => {
      const store = useAuthStore()

      sendVerificationEmail.mockResolvedValue()

      await store.sendEmailVerification()

      expect(sendVerificationEmail).toHaveBeenCalled()
      expect(store.error).toBeNull()
    })

    it('should set loading state during email verification send', async () => {
      const store = useAuthStore()

      sendVerificationEmail.mockImplementation(() => {
        expect(store.loading).toBe(true)
        return Promise.resolve()
      })

      await store.sendEmailVerification()

      expect(store.loading).toBe(false)
    })

    it('should handle verification email error', async () => {
      const store = useAuthStore()
      const errorMessage = 'Failed to send verification email'

      sendVerificationEmail.mockRejectedValue(new Error(errorMessage))

      await expect(store.sendEmailVerification()).rejects.toThrow(errorMessage)
      expect(store.error).toBe(errorMessage)
    })
  })

  describe('updateProfile', () => {
    it('should successfully update user profile', async () => {
      const store = useAuthStore()

      // Set up authenticated user
      onAuthChange.mockImplementation((callback) => {
        callback({
          uid: 'test-uid',
          email: 'test@example.com',
        })
        return vi.fn()
      })

      fetchDocument.mockResolvedValue({
        email: 'test@example.com',
        profile: {
          displayName: 'Test User',
          bio: '',
          photoURL: '',
          privacyMode: 'public',
          followerCount: 0,
          followingCount: 0,
        },
      })
      subscribeToDocument.mockReturnValue(vi.fn())
      setDocument.mockResolvedValue()

      await store.initAuth()

      const updates = { displayName: 'Updated Name' }
      await store.updateProfile(updates)

      expect(setDocument).toHaveBeenCalledWith(
        'users',
        'test-uid',
        updates,
        { merge: true }
      )
      expect(store.error).toBeNull()
    })

    it('should throw error when no user is signed in', async () => {
      const store = useAuthStore()

      await expect(
        store.updateProfile({ displayName: 'Name' })
      ).rejects.toThrow('No user is currently signed in')
    })

    it('should set loading state during profile update', async () => {
      const store = useAuthStore()

      // Set up authenticated user
      onAuthChange.mockImplementation((callback) => {
        callback({
          uid: 'test-uid',
          email: 'test@example.com',
        })
        return vi.fn()
      })

      fetchDocument.mockResolvedValue({
        email: 'test@example.com',
        profile: {
          displayName: 'Test User',
          bio: '',
          photoURL: '',
          privacyMode: 'public',
          followerCount: 0,
          followingCount: 0,
        },
      })
      subscribeToDocument.mockReturnValue(vi.fn())

      setDocument.mockImplementation(() => {
        expect(store.loading).toBe(true)
        return Promise.resolve()
      })

      await store.initAuth()
      await store.updateProfile({ displayName: 'Updated' })

      expect(store.loading).toBe(false)
    })

    it('should handle profile update error', async () => {
      const store = useAuthStore()
      const errorMessage = 'Update failed'

      // Set up authenticated user
      onAuthChange.mockImplementation((callback) => {
        callback({
          uid: 'test-uid',
          email: 'test@example.com',
        })
        return vi.fn()
      })

      fetchDocument.mockResolvedValue({
        email: 'test@example.com',
        profile: {
          displayName: 'Test User',
          bio: '',
          photoURL: '',
          privacyMode: 'public',
          followerCount: 0,
          followingCount: 0,
        },
      })
      subscribeToDocument.mockReturnValue(vi.fn())
      setDocument.mockRejectedValue(new Error(errorMessage))

      await store.initAuth()

      await expect(
        store.updateProfile({ displayName: 'Updated' })
      ).rejects.toThrow(errorMessage)

      expect(store.error).toBe(errorMessage)
    })
  })

  describe('clearError', () => {
    it('should clear error message', async () => {
      const store = useAuthStore()

      // Set an error first
      signInWithGoogle.mockRejectedValue(new Error('Test error'))
      await expect(store.handleSignInWithGoogle()).rejects.toThrow()

      expect(store.error).toBe('Test error')

      // Clear error
      store.clearError()

      expect(store.error).toBeNull()
    })
  })
})
