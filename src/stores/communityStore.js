import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
  fetchDocument,
  setDocument,
  updateDocument,
  deleteDocument,
  fetchCollection,
  subscribeToCollection,
  serverTimestamp,
  COLLECTIONS,
  getNestedDocRef,
} from '@/firebase/firestore'
import { setDoc, deleteDoc, getDoc, getDocs, collection, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '@/firebase/firestore'
import { useAuthStore } from './authStore'

/**
 * Community Store - User profiles, follow system
 *
 * Handles:
 * - Public user profiles (displayName, bio, photoURL, privacy)
 * - Follow/Unfollow users
 * - Followers/Following lists
 * - Blocked users
 * - Privacy settings
 */
export const useCommunityStore = defineStore('community', () => {
  const authStore = useAuthStore()

  // ============================================================================
  // STATE
  // ============================================================================

  // Current viewed user profile
  const currentProfile = ref(null)
  const currentProfileLoading = ref(false)

  // Following/Followers data
  const followers = ref([])
  const following = ref([])
  const followersLoading = ref(false)
  const followingLoading = ref(false)

  // Blocked users
  const blockedUsers = ref([])
  const blockedUsersLoading = ref(false)

  // Privacy settings
  const privacySettings = ref(null)

  // Suggested users (for discovery)
  const suggestedUsers = ref([])
  const suggestedUsersLoading = ref(false)

  // Error state
  const error = ref(null)

  // Real-time subscriptions cleanup
  let unsubscribeFollowers = null
  let unsubscribeFollowing = null

  // ============================================================================
  // GETTERS
  // ============================================================================

  const followerCount = computed(() => followers.value.length)
  const followingCount = computed(() => following.value.length)

  /**
   * Check if current user is following a specific user
   */
  const isFollowing = computed(() => (userId) => {
    if (!userId) return false
    return following.value.some((f) => f.id === userId)
  })

  /**
   * Check if a user is blocked
   */
  const isBlocked = computed(() => (userId) => {
    if (!userId) return false
    return blockedUsers.value.some((b) => b.id === userId)
  })

  /**
   * Alias for isBlocked (for consistency with naming)
   */
  const isUserBlocked = computed(() => (userId) => isBlocked.value(userId))

  /**
   * Get current user's own profile
   */
  const myProfile = computed(() => {
    if (!authStore.uid) return null
    return authStore.userProfile?.profile || null
  })

  /**
   * Check if current user has a public profile
   */
  const hasPublicProfile = computed(() => {
    return myProfile.value?.privacyMode === 'public'
  })

  // ============================================================================
  // ACTIONS - Profile Management
  // ============================================================================

  /**
   * Fetch a user's public profile
   * @param {string} userId - User ID to fetch
   * @returns {Promise<Object|null>} User profile or null
   */
  async function fetchUserProfile(userId) {
    if (!userId) {
      error.value = 'User ID is required'
      return null
    }

    currentProfileLoading.value = true
    error.value = null

    try {
      const userDoc = await fetchDocument(COLLECTIONS.USERS, userId)

      if (!userDoc) {
        error.value = 'User not found'
        return null
      }

      // Extract profile data (public fields only)
      currentProfile.value = {
        uid: userId,
        displayName: userDoc.profile?.displayName || 'Anonymous',
        bio: userDoc.profile?.bio || '',
        photoURL: userDoc.profile?.photoURL || '',
        privacyMode: userDoc.profile?.privacyMode || 'private',
        followerCount: userDoc.profile?.followerCount || 0,
        followingCount: userDoc.profile?.followingCount || 0,
        createdAt: userDoc.profile?.createdAt || null,
        // Stats (if visible based on privacy settings)
        stats: userDoc.stats || null,
      }

      return currentProfile.value
    } catch (err) {
      error.value = err.message || 'Failed to load user profile'
      if (import.meta.env.DEV) {
        console.error('[communityStore] Error fetching user profile:', err)
      }
      throw err
    } finally {
      currentProfileLoading.value = false
    }
  }

  /**
   * Create or update current user's public profile
   * @param {Object} profileData - Profile data (displayName, bio, photoURL, privacyMode)
   */
  async function updateMyProfile(profileData) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated to update profile')
    }

    error.value = null

    try {
      // Ensure we don't overwrite existing data if not provided
      const existingProfile = authStore.userProfile?.profile || {}

      const updates = {
        profile: {
          displayName: profileData.displayName || existingProfile.displayName || authStore.displayName || 'Gym Enthusiast',
          bio: profileData.bio !== undefined ? profileData.bio : (existingProfile.bio || ''),
          photoURL: profileData.photoURL || existingProfile.photoURL || authStore.photoURL || '',
          privacyMode: profileData.privacyMode || existingProfile.privacyMode || 'public',
          createdAt: existingProfile.createdAt || new Date().toISOString(),
          followerCount: existingProfile.followerCount || 0,
          followingCount: existingProfile.followingCount || 0,
        },
      }

      await setDocument(COLLECTIONS.USERS, authStore.uid, updates, { merge: true })

      // Update authStore's userProfile (real-time listener will handle this)
    } catch (err) {
      error.value = err.message || 'Failed to update profile'
      if (import.meta.env.DEV) {
        console.error('[communityStore] Error updating profile:', err)
      }
      throw err
    }
  }

  // ============================================================================
  // ACTIONS - Follow System
  // ============================================================================

  /**
   * Follow a user
   * @param {string} userId - User ID to follow
   */
  async function followUser(userId) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated to follow')
    }

    if (userId === authStore.uid) {
      throw new Error('Cannot follow yourself')
    }

    if (isFollowing.value(userId)) {
      if (import.meta.env.DEV) {
        console.warn('[communityStore] Already following this user')
      }
      return
    }

    error.value = null

    try {
      // Add to current user's following subcollection
      const followingRef = getNestedDocRef(COLLECTIONS.USERS, authStore.uid, 'following', userId)
      await setDoc(followingRef, {
        createdAt: serverTimestamp(),
      })

      // Add to target user's followers subcollection
      const followerRef = getNestedDocRef(COLLECTIONS.USERS, userId, 'followers', authStore.uid)
      await setDoc(followerRef, {
        createdAt: serverTimestamp(),
      })

      // Optimistically update local state
      following.value.push({ id: userId, createdAt: new Date().toISOString() })

      // Optimistically update currentProfile if viewing the followed user
      if (currentProfile.value?.uid === userId) {
        currentProfile.value.followerCount = (currentProfile.value.followerCount || 0) + 1
      }

      // Update follower/following counts (denormalized)
      await updateFollowCounts(authStore.uid, userId)
    } catch (err) {
      error.value = err.message || 'Failed to follow user'
      if (import.meta.env.DEV) {
        console.error('[communityStore] Error following user:', err)
      }
      throw err
    }
  }

  /**
   * Unfollow a user
   * @param {string} userId - User ID to unfollow
   */
  async function unfollowUser(userId) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated to unfollow')
    }

    if (!isFollowing.value(userId)) {
      if (import.meta.env.DEV) {
        console.warn('[communityStore] Not following this user')
      }
      return
    }

    error.value = null

    try {
      // Remove from current user's following subcollection
      const followingRef = getNestedDocRef(COLLECTIONS.USERS, authStore.uid, 'following', userId)
      await deleteDoc(followingRef)

      // Remove from target user's followers subcollection
      const followerRef = getNestedDocRef(COLLECTIONS.USERS, userId, 'followers', authStore.uid)
      await deleteDoc(followerRef)

      // Optimistically update local state
      following.value = following.value.filter((f) => f.id !== userId)

      // Optimistically update currentProfile if viewing the unfollowed user
      if (currentProfile.value?.uid === userId) {
        currentProfile.value.followerCount = Math.max((currentProfile.value.followerCount || 0) - 1, 0)
      }

      // Update follower/following counts (denormalized)
      await updateFollowCounts(authStore.uid, userId)
    } catch (err) {
      error.value = err.message || 'Failed to unfollow user'
      if (import.meta.env.DEV) {
        console.error('[communityStore] Error unfollowing user:', err)
      }
      throw err
    }
  }

  /**
   * Update denormalized follower/following counts in user profiles
   * @param {string} currentUserId - Current user's ID
   * @param {string} targetUserId - Target user's ID
   */
  async function updateFollowCounts(currentUserId, targetUserId) {
    try {
      // Get follower count for target user
      const followersColl = collection(db, COLLECTIONS.USERS, targetUserId, 'followers')
      const followersSnap = await getDocs(followersColl)
      const followerCount = followersSnap.size

      // Get following count for current user
      const followingColl = collection(db, COLLECTIONS.USERS, currentUserId, 'following')
      const followingSnap = await getDocs(followingColl)
      const followingCount = followingSnap.size

      // Update target user's follower count
      await updateDocument(COLLECTIONS.USERS, targetUserId, {
        'profile.followerCount': followerCount,
      })

      // Update current user's following count
      await updateDocument(COLLECTIONS.USERS, currentUserId, {
        'profile.followingCount': followingCount,
      })
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[communityStore] Error updating follow counts:', err)
      }
      // Don't throw - this is a background operation
    }
  }

  /**
   * Fetch followers list for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of follower user objects
   */
  async function fetchFollowers(userId) {
    if (!userId) return []

    followersLoading.value = true
    error.value = null

    try {
      // Fetch followers subcollection
      const followersColl = collection(db, COLLECTIONS.USERS, userId, 'followers')
      const followersSnap = await getDocs(followersColl)

      const followerIds = followersSnap.docs.map((doc) => doc.id)

      if (followerIds.length === 0) {
        followers.value = []
        return []
      }

      // Fetch full user profiles for followers (batch)
      const followerProfiles = await Promise.all(
        followerIds.map(async (followerId) => {
          const userDoc = await fetchDocument(COLLECTIONS.USERS, followerId)
          return userDoc
            ? {
                id: followerId,
                displayName: userDoc.profile?.displayName || 'Anonymous',
                photoURL: userDoc.profile?.photoURL || '',
                bio: userDoc.profile?.bio || '',
              }
            : null
        })
      )

      followers.value = followerProfiles.filter(Boolean)
      return followers.value
    } catch (err) {
      error.value = err.message || 'Failed to load followers'
      if (import.meta.env.DEV) {
        console.error('[communityStore] Error fetching followers:', err)
      }
      throw err
    } finally {
      followersLoading.value = false
    }
  }

  /**
   * Fetch following list for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of following user objects
   */
  async function fetchFollowing(userId) {
    if (!userId) return []

    followingLoading.value = true
    error.value = null

    try {
      // Fetch following subcollection
      const followingColl = collection(db, COLLECTIONS.USERS, userId, 'following')
      const followingSnap = await getDocs(followingColl)

      const followingIds = followingSnap.docs.map((doc) => doc.id)

      if (followingIds.length === 0) {
        following.value = []
        return []
      }

      // Fetch full user profiles for following (batch)
      const followingProfiles = await Promise.all(
        followingIds.map(async (followingId) => {
          const userDoc = await fetchDocument(COLLECTIONS.USERS, followingId)
          return userDoc
            ? {
                id: followingId,
                displayName: userDoc.profile?.displayName || 'Anonymous',
                photoURL: userDoc.profile?.photoURL || '',
                bio: userDoc.profile?.bio || '',
              }
            : null
        })
      )

      following.value = followingProfiles.filter(Boolean)
      return following.value
    } catch (err) {
      error.value = err.message || 'Failed to load following'
      if (import.meta.env.DEV) {
        console.error('[communityStore] Error fetching following:', err)
      }
      throw err
    } finally {
      followingLoading.value = false
    }
  }

  /**
   * Subscribe to real-time followers/following updates for current user
   */
  function subscribeToFollowData() {
    if (!authStore.uid) return

    // Clean up existing subscriptions
    cleanupSubscriptions()

    // Subscribe to followers
    const followersColl = collection(db, COLLECTIONS.USERS, authStore.uid, 'followers')
    unsubscribeFollowers = subscribeToCollection(
      `${COLLECTIONS.USERS}/${authStore.uid}/followers`,
      {},
      (docs) => {
        // Real-time update - refetch full profiles
        fetchFollowers(authStore.uid)
      },
      (err) => {
        if (import.meta.env.DEV) {
          console.error('[communityStore] Followers subscription error:', err)
        }
      }
    )

    // Subscribe to following
    const followingColl = collection(db, COLLECTIONS.USERS, authStore.uid, 'following')
    unsubscribeFollowing = subscribeToCollection(
      `${COLLECTIONS.USERS}/${authStore.uid}/following`,
      {},
      (docs) => {
        // Real-time update - refetch full profiles
        fetchFollowing(authStore.uid)
      },
      (err) => {
        if (import.meta.env.DEV) {
          console.error('[communityStore] Following subscription error:', err)
        }
      }
    )
  }

  // ============================================================================
  // ACTIONS - Privacy & Blocking
  // ============================================================================

  /**
   * Block a user
   * @param {string} userId - User ID to block
   */
  async function blockUser(userId) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated to block')
    }

    if (userId === authStore.uid) {
      throw new Error('Cannot block yourself')
    }

    error.value = null

    try {
      // Add to blockedUsers subcollection
      const blockedRef = getNestedDocRef(COLLECTIONS.USERS, authStore.uid, 'blockedUsers', userId)
      await setDoc(blockedRef, {
        blockedAt: serverTimestamp(),
      })

      // Automatically unfollow if following
      if (isFollowing.value(userId)) {
        await unfollowUser(userId)
      }

      // Optimistically update local state
      blockedUsers.value.push({ id: userId, blockedAt: new Date().toISOString() })
    } catch (err) {
      error.value = err.message || 'Failed to block user'
      if (import.meta.env.DEV) {
        console.error('[communityStore] Error blocking user:', err)
      }
      throw err
    }
  }

  /**
   * Unblock a user
   * @param {string} userId - User ID to unblock
   */
  async function unblockUser(userId) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated to unblock')
    }

    error.value = null

    try {
      const blockedRef = getNestedDocRef(COLLECTIONS.USERS, authStore.uid, 'blockedUsers', userId)
      await deleteDoc(blockedRef)

      // Optimistically update local state
      blockedUsers.value = blockedUsers.value.filter((b) => b.id !== userId)
    } catch (err) {
      error.value = err.message || 'Failed to unblock user'
      if (import.meta.env.DEV) {
        console.error('[communityStore] Error unblocking user:', err)
      }
      throw err
    }
  }

  /**
   * Fetch blocked users list
   */
  async function fetchBlockedUsers() {
    if (!authStore.uid) return []

    blockedUsersLoading.value = true
    error.value = null

    try {
      const blockedColl = collection(db, COLLECTIONS.USERS, authStore.uid, 'blockedUsers')
      const blockedSnap = await getDocs(blockedColl)

      const blockedIds = blockedSnap.docs.map((doc) => doc.id)

      if (blockedIds.length === 0) {
        blockedUsers.value = []
        return []
      }

      // Fetch full user profiles for blocked users (batch)
      const blockedProfiles = await Promise.all(
        blockedIds.map(async (blockedId) => {
          const userDoc = await fetchDocument(COLLECTIONS.USERS, blockedId)
          return userDoc
            ? {
                id: blockedId,
                displayName: userDoc.profile?.displayName || 'Anonymous',
                photoURL: userDoc.profile?.photoURL || '',
              }
            : null
        })
      )

      blockedUsers.value = blockedProfiles.filter(Boolean)
      return blockedUsers.value
    } catch (err) {
      error.value = err.message || 'Failed to load blocked users'
      if (import.meta.env.DEV) {
        console.error('[communityStore] Error fetching blocked users:', err)
      }
      throw err
    } finally {
      blockedUsersLoading.value = false
    }
  }

  /**
   * Update privacy settings
   * @param {Object} settings - Privacy settings object
   */
  async function updatePrivacySettings(settings) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated to update privacy settings')
    }

    error.value = null

    try {
      await setDocument(`${COLLECTIONS.USERS}/${authStore.uid}/settings`, 'privacy', settings, {
        merge: true,
      })

      privacySettings.value = settings
    } catch (err) {
      error.value = err.message || 'Failed to update privacy settings'
      if (import.meta.env.DEV) {
        console.error('[communityStore] Error updating privacy settings:', err)
      }
      throw err
    }
  }

  /**
   * Fetch privacy settings
   */
  async function fetchPrivacySettings() {
    if (!authStore.uid) return null

    try {
      const settingsDoc = await fetchDocument(
        `${COLLECTIONS.USERS}/${authStore.uid}/settings`,
        'privacy'
      )
      privacySettings.value = settingsDoc || getDefaultPrivacySettings()
      return privacySettings.value
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[communityStore] Error fetching privacy settings:', err)
      }
      privacySettings.value = getDefaultPrivacySettings()
      return privacySettings.value
    }
  }

  /**
   * Get default privacy settings
   */
  function getDefaultPrivacySettings() {
    return {
      profileVisibility: 'public',
      showSetsRepsWeight: true,
      showDuration: true,
      showMuscleGroups: true,
      allowLeaderboards: true,
      allowSearch: true,
      allowDiscovery: true,
    }
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  function cleanupSubscriptions() {
    if (unsubscribeFollowers) {
      unsubscribeFollowers()
      unsubscribeFollowers = null
    }
    if (unsubscribeFollowing) {
      unsubscribeFollowing()
      unsubscribeFollowing = null
    }
  }

  function clearData() {
    currentProfile.value = null
    followers.value = []
    following.value = []
    blockedUsers.value = []
    privacySettings.value = null
    suggestedUsers.value = []
    error.value = null
    cleanupSubscriptions()
  }

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State
    currentProfile,
    currentProfileLoading,
    followers,
    following,
    followersLoading,
    followingLoading,
    blockedUsers,
    blockedUsersLoading,
    privacySettings,
    suggestedUsers,
    suggestedUsersLoading,
    error,

    // Getters
    followerCount,
    followingCount,
    isFollowing,
    isBlocked,
    isUserBlocked,
    myProfile,
    hasPublicProfile,

    // Actions
    fetchUserProfile,
    updateMyProfile,
    followUser,
    unfollowUser,
    fetchFollowers,
    fetchFollowing,
    subscribeToFollowData,
    blockUser,
    unblockUser,
    fetchBlockedUsers,
    updatePrivacySettings,
    fetchPrivacySettings,
    clearData,
  }
})
