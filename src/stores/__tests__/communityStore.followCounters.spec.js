/**
 * Tests for follower/following counter updates in communityStore
 * This test suite specifically verifies the fix for the counter update bug
 */

import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { useCommunityStore } from '@/stores/communityStore'
import { useAuthStore } from '@/stores/authStore'

// Mock Firebase functions
const mockSetDoc = vi.fn()
const mockDeleteDoc = vi.fn()
const mockGetDocs = vi.fn()
const mockUpdateDocument = vi.fn()
const mockFetchDocument = vi.fn()
const mockOnAuthChange = vi.fn()

vi.mock('@/firebase/firestore', () => ({
  fetchDocument: (...args) => mockFetchDocument(...args),
  updateDocument: (...args) => mockUpdateDocument(...args),
  subscribeToDocument: vi.fn(() => vi.fn()), // Return unsubscribe function
  subscribeToCollection: vi.fn(() => vi.fn()),
  setDocument: vi.fn(),
  getNestedDocRef: vi.fn((coll, userId, subcoll, docId) => ({
    path: `${coll}/${userId}/${subcoll}/${docId}`
  })),
  serverTimestamp: vi.fn(() => new Date().toISOString()),
  COLLECTIONS: {
    USERS: 'users',
  },
  db: {},
}))

vi.mock('@/firebase/auth', () => ({
  onAuthChange: (...args) => mockOnAuthChange(...args),
  signInWithGoogle: vi.fn(),
  signInWithEmail: vi.fn(),
  createAccount: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
  sendVerificationEmail: vi.fn(),
}))

// Mock Firebase modular SDK
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore')
  return {
    ...actual,
    collection: vi.fn((db, ...path) => ({ path: path.join('/') })),
    doc: vi.fn((db, ...path) => ({ path: path.join('/') })),
    setDoc: (...args) => mockSetDoc(...args),
    deleteDoc: (...args) => mockDeleteDoc(...args),
    getDocs: (...args) => mockGetDocs(...args),
  }
})

describe('CommunityStore - Follower/Following Counter Updates', () => {
  let communityStore
  let authStore

  beforeEach(() => {
    setActivePinia(createPinia())
    communityStore = useCommunityStore()
    authStore = useAuthStore()

    // Reset mocks
    vi.clearAllMocks()

    // Setup auth state
    authStore.user = {
      uid: 'current-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
    }
  })

  describe('followUser - Counter Updates', () => {
    it('should optimistically update currentProfile.followerCount when following the viewed user', async () => {
      // Setup: currentProfile is the user we're viewing
      communityStore.currentProfile = {
        uid: 'target-user-id',
        displayName: 'Target User',
        followerCount: 5,
        followingCount: 10,
      }

      // Mock successful Firestore operations
      mockSetDoc.mockResolvedValue(undefined)
      mockGetDocs.mockResolvedValueOnce({ size: 6 }) // New follower count
      mockGetDocs.mockResolvedValueOnce({ size: 1 }) // Current user's following count
      mockUpdateDocument.mockResolvedValue(undefined)

      // Act: Follow the target user
      await communityStore.followUser('target-user-id')

      // Assert: followerCount should be optimistically incremented
      expect(communityStore.currentProfile.followerCount).toBe(6)
    })

    it('should NOT update currentProfile.followerCount when following a different user', async () => {
      // Setup: currentProfile is NOT the user we're following
      communityStore.currentProfile = {
        uid: 'some-other-user-id',
        displayName: 'Other User',
        followerCount: 5,
        followingCount: 10,
      }

      // Mock successful Firestore operations
      mockSetDoc.mockResolvedValue(undefined)
      mockGetDocs.mockResolvedValueOnce({ size: 6 })
      mockGetDocs.mockResolvedValueOnce({ size: 1 })
      mockUpdateDocument.mockResolvedValue(undefined)

      // Act: Follow a different user
      await communityStore.followUser('target-user-id')

      // Assert: followerCount should NOT change (we're viewing someone else)
      expect(communityStore.currentProfile.followerCount).toBe(5)
    })

    it('should add user to following array for isFollowing check', async () => {
      // Setup
      communityStore.following = []
      mockSetDoc.mockResolvedValue(undefined)
      mockGetDocs.mockResolvedValueOnce({ size: 1 })
      mockGetDocs.mockResolvedValueOnce({ size: 1 })
      mockUpdateDocument.mockResolvedValue(undefined)

      // Act
      await communityStore.followUser('target-user-id')

      // Assert
      expect(communityStore.following).toHaveLength(1)
      expect(communityStore.following[0].id).toBe('target-user-id')
      expect(communityStore.isFollowing('target-user-id')).toBe(true)
    })

    it('should call updateFollowCounts with correct counts', async () => {
      // Setup
      mockSetDoc.mockResolvedValue(undefined)
      mockGetDocs.mockResolvedValueOnce({ size: 6 }) // Target user followers
      mockGetDocs.mockResolvedValueOnce({ size: 3 }) // Current user following
      mockUpdateDocument.mockResolvedValue(undefined)

      // Act
      await communityStore.followUser('target-user-id')

      // Assert: updateDocument should be called twice with correct counts
      expect(mockUpdateDocument).toHaveBeenCalledTimes(2)
      expect(mockUpdateDocument).toHaveBeenCalledWith(
        'users',
        'target-user-id',
        { 'profile.followerCount': 6 }
      )
      expect(mockUpdateDocument).toHaveBeenCalledWith(
        'users',
        'current-user-id',
        { 'profile.followingCount': 3 }
      )
    })
  })

  describe('unfollowUser - Counter Updates', () => {
    it('should optimistically update currentProfile.followerCount when unfollowing the viewed user', async () => {
      // Setup: currentProfile is the user we're viewing
      communityStore.currentProfile = {
        uid: 'target-user-id',
        displayName: 'Target User',
        followerCount: 5,
        followingCount: 10,
      }
      communityStore.following = [{ id: 'target-user-id', createdAt: '2024-01-01' }]

      // Mock successful Firestore operations
      mockDeleteDoc.mockResolvedValue(undefined)
      mockGetDocs.mockResolvedValueOnce({ size: 4 }) // New follower count (decremented)
      mockGetDocs.mockResolvedValueOnce({ size: 0 }) // Current user's following count
      mockUpdateDocument.mockResolvedValue(undefined)

      // Act: Unfollow the target user
      await communityStore.unfollowUser('target-user-id')

      // Assert: followerCount should be optimistically decremented
      expect(communityStore.currentProfile.followerCount).toBe(4)
    })

    it('should NOT decrement below 0', async () => {
      // Setup: Edge case - followerCount is already 0
      communityStore.currentProfile = {
        uid: 'target-user-id',
        displayName: 'Target User',
        followerCount: 0,
        followingCount: 10,
      }
      communityStore.following = [{ id: 'target-user-id', createdAt: '2024-01-01' }]

      // Mock successful Firestore operations
      mockDeleteDoc.mockResolvedValue(undefined)
      mockGetDocs.mockResolvedValueOnce({ size: 0 })
      mockGetDocs.mockResolvedValueOnce({ size: 0 })
      mockUpdateDocument.mockResolvedValue(undefined)

      // Act
      await communityStore.unfollowUser('target-user-id')

      // Assert: Should stay at 0, not go negative
      expect(communityStore.currentProfile.followerCount).toBe(0)
    })

    it('should remove user from following array', async () => {
      // Setup
      communityStore.following = [
        { id: 'target-user-id', createdAt: '2024-01-01' },
        { id: 'another-user-id', createdAt: '2024-01-02' },
      ]
      mockDeleteDoc.mockResolvedValue(undefined)
      mockGetDocs.mockResolvedValueOnce({ size: 0 })
      mockGetDocs.mockResolvedValueOnce({ size: 1 })
      mockUpdateDocument.mockResolvedValue(undefined)

      // Act
      await communityStore.unfollowUser('target-user-id')

      // Assert
      expect(communityStore.following).toHaveLength(1)
      expect(communityStore.following[0].id).toBe('another-user-id')
      expect(communityStore.isFollowing('target-user-id')).toBe(false)
    })
  })

  describe('Reactivity Integration', () => {
    it('should maintain reactivity when currentProfile is updated', async () => {
      // Setup: Fetch a user profile
      mockFetchDocument.mockResolvedValue({
        profile: {
          displayName: 'Target User',
          bio: 'Test bio',
          photoURL: '',
          privacyMode: 'public',
          followerCount: 10,
          followingCount: 5,
        },
      })

      await communityStore.fetchUserProfile('target-user-id')

      const initialCount = communityStore.currentProfile.followerCount

      // Act: Follow this user
      mockSetDoc.mockResolvedValue(undefined)
      mockGetDocs.mockResolvedValueOnce({ size: 11 })
      mockGetDocs.mockResolvedValueOnce({ size: 1 })
      mockUpdateDocument.mockResolvedValue(undefined)

      await communityStore.followUser('target-user-id')

      // Assert: Counter should have incremented
      expect(communityStore.currentProfile.followerCount).toBe(initialCount + 1)
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing followerCount gracefully', async () => {
      // Setup: currentProfile without followerCount
      communityStore.currentProfile = {
        uid: 'target-user-id',
        displayName: 'Target User',
        // followerCount is undefined
      }

      mockSetDoc.mockResolvedValue(undefined)
      mockGetDocs.mockResolvedValueOnce({ size: 1 })
      mockGetDocs.mockResolvedValueOnce({ size: 1 })
      mockUpdateDocument.mockResolvedValue(undefined)

      // Act
      await communityStore.followUser('target-user-id')

      // Assert: Should default to 0 + 1 = 1
      expect(communityStore.currentProfile.followerCount).toBe(1)
    })

    it('should not follow yourself', async () => {
      // Act & Assert
      await expect(
        communityStore.followUser('current-user-id')
      ).rejects.toThrow('Cannot follow yourself')
    })

    it('should warn if already following', async () => {
      // Setup
      communityStore.following = [{ id: 'target-user-id', createdAt: '2024-01-01' }]
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Act
      await communityStore.followUser('target-user-id')

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Already following')
      )
      consoleSpy.mockRestore()
    })
  })
})
