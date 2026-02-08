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
import {
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  increment,
  runTransaction,
} from 'firebase/firestore'
import { db } from '@/firebase/firestore'
import { useAuthStore } from './authStore'
import { useCommunityStore } from './communityStore'

/**
 * Feed Store - Posts, Likes, Comments
 *
 * Handles:
 * - Workout feed (chronological, paginated)
 * - Sharing workouts to feed
 * - Like/Unlike posts (optimistic updates)
 * - Comment CRUD operations
 * - Feed pagination (infinite scroll)
 */
export const useFeedStore = defineStore('feed', () => {
  const authStore = useAuthStore()
  const communityStore = useCommunityStore()

  // ============================================================================
  // STATE
  // ============================================================================

  // Feed posts
  const feedPosts = ref([])
  const feedLoading = ref(false)
  const hasMore = ref(true)
  const lastVisible = ref(null)

  // Current post (for detail view)
  const currentPost = ref(null)
  const currentPostLoading = ref(false)

  // Comments for current post
  const comments = ref([])
  const commentsLoading = ref(false)

  // Likes for current post
  const likes = ref([])
  const likesLoading = ref(false)

  // Error state
  const error = ref(null)

  // Feed type ('following', 'discover', 'user')
  const feedType = ref('following')

  // User ID for user-specific feed
  const feedUserId = ref(null)

  // Index building state
  const indexBuilding = ref(false)
  const retryCount = ref(0)
  const maxRetries = ref(5)
  const retryDelay = ref(0)

  // ============================================================================
  // GETTERS
  // ============================================================================

  const postsCount = computed(() => feedPosts.value.length)

  /**
   * Check if current user liked a post
   */
  const isLiked = computed(() => (postId) => {
    const post = feedPosts.value.find((p) => p.id === postId)
    return post?.isLiked || false
  })

  /**
   * Get like count for a post
   */
  const getLikeCount = computed(() => (postId) => {
    const post = feedPosts.value.find((p) => p.id === postId)
    return post?.likeCount || 0
  })

  /**
   * Get comment count for a post
   */
  const getCommentCount = computed(() => (postId) => {
    const post = feedPosts.value.find((p) => p.id === postId)
    return post?.commentCount || 0
  })

  // ============================================================================
  // HELPERS - Index Building Detection
  // ============================================================================

  /**
   * Check if error is due to index building
   * @param {Error} error - Firebase error
   * @returns {boolean} - True if error is index-building related
   */
  function isIndexBuildingError(error) {
    if (!error || !error.message) return false
    const message = error.message.toLowerCase()
    return (
      message.includes('index') &&
      (message.includes('currently building') || message.includes('cannot be used yet'))
    )
  }

  /**
   * Calculate retry delay with exponential backoff
   * @param {number} attempt - Current retry attempt (0-based)
   * @returns {number} - Delay in milliseconds
   */
  function calculateRetryDelay(attempt) {
    // Exponential backoff: 2s, 4s, 8s, 16s, 32s
    const baseDelay = 2000
    return Math.min(baseDelay * Math.pow(2, attempt), 32000)
  }

  /**
   * Wait for a specified delay
   * @param {number} ms - Milliseconds to wait
   */
  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // ============================================================================
  // ACTIONS - Feed Management
  // ============================================================================

  /**
   * Fetch feed posts (with pagination)
   * @param {string} type - Feed type ('following', 'discover', 'user')
   * @param {string} userId - User ID (for 'user' feed type)
   * @param {boolean} refresh - Clear existing posts and fetch from start
   */
  async function fetchFeed(type = 'following', userId = null, refresh = false) {
    if (!authStore.uid) {
      error.value = 'User must be authenticated to view feed'
      return
    }

    // Reset pagination if refreshing
    if (refresh) {
      feedPosts.value = []
      lastVisible.value = null
      hasMore.value = true
      retryCount.value = 0
      indexBuilding.value = false
    }

    if (!hasMore.value && !refresh) {
      if (import.meta.env.DEV) {
        console.log('[feedStore] No more posts to load')
      }
      return
    }

    feedLoading.value = true
    error.value = null
    feedType.value = type
    feedUserId.value = userId

    try {
      let feedQuery
      let useFallback = false

      if (type === 'following') {
        // Get following IDs
        await communityStore.fetchFollowing(authStore.uid)
        const followingIds = communityStore.following.map((f) => f.id)

        if (followingIds.length === 0) {
          feedPosts.value = []
          hasMore.value = false
          return
        }

        // Query feed for following users + current user
        const userIds = [...followingIds, authStore.uid]

        // Try with orderBy first, fallback to without orderBy if index is building
        try {
          feedQuery = query(
            collection(db, COLLECTIONS.FEED),
            where('userId', 'in', userIds.slice(0, 10)), // Firestore 'in' limit: 10 items
            orderBy('createdAt', 'desc'),
            limit(20)
          )
        } catch (queryError) {
          if (isIndexBuildingError(queryError)) {
            useFallback = true
            feedQuery = query(
              collection(db, COLLECTIONS.FEED),
              where('userId', 'in', userIds.slice(0, 10)),
              limit(20)
            )
          } else {
            throw queryError
          }
        }
      } else if (type === 'discover') {
        // Public posts from all users (chronological)
        try {
          feedQuery = query(
            collection(db, COLLECTIONS.FEED),
            where('visibility', '==', 'public'),
            orderBy('createdAt', 'desc'),
            limit(20)
          )
        } catch (queryError) {
          if (isIndexBuildingError(queryError)) {
            useFallback = true
            feedQuery = query(
              collection(db, COLLECTIONS.FEED),
              where('visibility', '==', 'public'),
              limit(20)
            )
          } else {
            throw queryError
          }
        }
      } else if (type === 'user' && userId) {
        // Posts from a specific user
        try {
          feedQuery = query(
            collection(db, COLLECTIONS.FEED),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(20)
          )
        } catch (queryError) {
          if (isIndexBuildingError(queryError)) {
            useFallback = true
            feedQuery = query(
              collection(db, COLLECTIONS.FEED),
              where('userId', '==', userId),
              limit(20)
            )
          } else {
            throw queryError
          }
        }
      } else {
        throw new Error('Invalid feed type or missing userId')
      }

      // Add pagination cursor (only if not using fallback)
      if (lastVisible.value && !useFallback) {
        feedQuery = query(feedQuery, startAfter(lastVisible.value))
      }

      const snapshot = await getDocs(feedQuery)

      if (snapshot.empty) {
        hasMore.value = false
        return
      }

      // Process posts
      const newPosts = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const postData = doc.data()

          // Check if current user liked this post
          const likeRef = getNestedDocRef(COLLECTIONS.FEED, doc.id, 'likes', authStore.uid)
          const likeSnap = await getDoc(likeRef)

          return {
            id: doc.id,
            userId: postData.userId,
            workoutId: postData.workoutId,
            caption: postData.caption || '',
            visibility: postData.visibility || 'public',
            createdAt: postData.createdAt?.toDate?.() || new Date(),
            likeCount: postData.likeCount || 0,
            commentCount: postData.commentCount || 0,
            workout: postData.workout || {},
            isLiked: likeSnap.exists(),
            // Fetch user profile (for avatar, name)
            user: await fetchUserProfile(postData.userId),
          }
        })
      )

      // Append or replace posts
      if (refresh) {
        feedPosts.value = newPosts
      } else {
        feedPosts.value = [...feedPosts.value, ...newPosts]
      }

      // Update pagination cursor
      lastVisible.value = snapshot.docs[snapshot.docs.length - 1]
      hasMore.value = snapshot.docs.length === 20

      // Clear index building state on success
      indexBuilding.value = false
      retryCount.value = 0
    } catch (err) {
      // Check if error is due to index building
      if (isIndexBuildingError(err)) {
        indexBuilding.value = true

        // Retry with exponential backoff
        if (retryCount.value < maxRetries.value) {
          const delay = calculateRetryDelay(retryCount.value)
          retryDelay.value = Math.ceil(delay / 1000) // Convert to seconds for UI
          retryCount.value++

          if (import.meta.env.DEV) {
            console.log(
              `[feedStore] Index building detected. Retry ${retryCount.value}/${maxRetries.value} in ${retryDelay.value}s`
            )
          }

          // Wait and retry
          await wait(delay)

          // Retry the fetch
          feedLoading.value = false // Reset loading state before retry
          return await fetchFeed(type, userId, false)
        } else {
          // Max retries reached, show error
          error.value = 'Index building timeout - please try again in a few minutes'
          if (import.meta.env.DEV) {
            console.error('[feedStore] Max retries reached for index building')
          }
        }
      } else {
        // Other errors
        error.value = err.message || 'Failed to load feed'
        if (import.meta.env.DEV) {
          console.error('[feedStore] Error fetching feed:', err)
        }
      }

      throw err
    } finally {
      feedLoading.value = false
    }
  }

  /**
   * Share a workout to the feed
   * @param {string} workoutId - Workout ID to share
   * @param {string} caption - Optional caption
   * @param {string} visibility - 'public' or 'followers'
   * @param {Object} workoutSnapshot - Workout data snapshot
   * @returns {Promise<string>} Post ID
   */
  async function shareWorkout(workoutId, caption = '', visibility = 'public', workoutSnapshot) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated to share workout')
    }

    // Ensure user has a public profile before posting
    const userProfile = authStore.userProfile
    if (!userProfile?.profile?.displayName) {
      if (import.meta.env.DEV) {
        console.warn('[feedStore] User missing public profile, will use fallback name')
      }
    }

    error.value = null

    try {
      const postData = {
        userId: authStore.uid,
        workoutId,
        caption,
        visibility,
        createdAt: serverTimestamp(),
        likeCount: 0,
        commentCount: 0,
        workout: workoutSnapshot, // Snapshot of workout data (for feed performance)
      }

      const feedColl = collection(db, COLLECTIONS.FEED)
      const postRef = await addDoc(feedColl, postData)

      // Optimistically add to feed with proper user data
      feedPosts.value.unshift({
        id: postRef.id,
        ...postData,
        createdAt: new Date(),
        isLiked: false,
        user: {
          uid: authStore.uid,
          displayName: userProfile?.profile?.displayName || authStore.displayName || 'Gym Enthusiast',
          photoURL: userProfile?.profile?.photoURL || authStore.photoURL || '',
        },
      })

      return postRef.id
    } catch (err) {
      error.value = err.message || 'Failed to share workout'
      if (import.meta.env.DEV) {
        console.error('[feedStore] Error sharing workout:', err)
      }
      throw err
    }
  }

  /**
   * Delete a post (only if current user is the author)
   * @param {string} postId - Post ID to delete
   */
  async function deletePost(postId) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated to delete post')
    }

    error.value = null

    try {
      // Verify ownership
      const post = feedPosts.value.find((p) => p.id === postId)
      if (!post || post.userId !== authStore.uid) {
        throw new Error('You can only delete your own posts')
      }

      await deleteDocument(COLLECTIONS.FEED, postId)

      // Remove from local state
      feedPosts.value = feedPosts.value.filter((p) => p.id !== postId)
    } catch (err) {
      error.value = err.message || 'Failed to delete post'
      if (import.meta.env.DEV) {
        console.error('[feedStore] Error deleting post:', err)
      }
      throw err
    }
  }

  /**
   * Update post caption
   * @param {string} postId - Post ID
   * @param {string} newCaption - New caption text
   */
  async function updatePostCaption(postId, newCaption) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated to update post')
    }

    error.value = null

    try {
      // Verify ownership
      const post = feedPosts.value.find((p) => p.id === postId)
      if (!post || post.userId !== authStore.uid) {
        throw new Error('You can only edit your own posts')
      }

      await updateDocument(COLLECTIONS.FEED, postId, { caption: newCaption })

      // Update local state
      const postIndex = feedPosts.value.findIndex((p) => p.id === postId)
      if (postIndex !== -1) {
        feedPosts.value[postIndex].caption = newCaption
      }
    } catch (err) {
      error.value = err.message || 'Failed to update post'
      if (import.meta.env.DEV) {
        console.error('[feedStore] Error updating post caption:', err)
      }
      throw err
    }
  }

  // ============================================================================
  // ACTIONS - Likes
  // ============================================================================

  /**
   * Like a post (optimistic update)
   * @param {string} postId - Post ID to like
   */
  async function likePost(postId) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated to like post')
    }

    error.value = null

    // Optimistic update
    const post = feedPosts.value.find((p) => p.id === postId)
    if (!post) {
      if (import.meta.env.DEV) {
        console.warn('[feedStore] Post not found:', postId)
      }
      return
    }

    if (post.isLiked) {
      if (import.meta.env.DEV) {
        console.warn('[feedStore] Already liked this post')
      }
      return
    }

    const previousLikeCount = post.likeCount
    post.likeCount++
    post.isLiked = true

    try {
      // Use Firestore transaction to ensure atomicity
      await runTransaction(db, async (transaction) => {
        const likeRef = getNestedDocRef(COLLECTIONS.FEED, postId, 'likes', authStore.uid)
        const postRef = getNestedDocRef(COLLECTIONS.FEED, postId)

        // Add like document
        transaction.set(likeRef, {
          createdAt: serverTimestamp(),
        })

        // Increment like count
        transaction.update(postRef, {
          likeCount: increment(1),
        })
      })
    } catch (err) {
      // Rollback optimistic update
      post.likeCount = previousLikeCount
      post.isLiked = false

      error.value = err.message || 'Failed to like post'
      if (import.meta.env.DEV) {
        console.error('[feedStore] Error liking post:', err)
      }
      throw err
    }
  }

  /**
   * Unlike a post (optimistic update)
   * @param {string} postId - Post ID to unlike
   */
  async function unlikePost(postId) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated to unlike post')
    }

    error.value = null

    // Optimistic update
    const post = feedPosts.value.find((p) => p.id === postId)
    if (!post) {
      if (import.meta.env.DEV) {
        console.warn('[feedStore] Post not found:', postId)
      }
      return
    }

    if (!post.isLiked) {
      if (import.meta.env.DEV) {
        console.warn('[feedStore] Not liked this post')
      }
      return
    }

    const previousLikeCount = post.likeCount
    post.likeCount = Math.max(0, post.likeCount - 1)
    post.isLiked = false

    try {
      // Use Firestore transaction to ensure atomicity
      await runTransaction(db, async (transaction) => {
        const likeRef = getNestedDocRef(COLLECTIONS.FEED, postId, 'likes', authStore.uid)
        const postRef = getNestedDocRef(COLLECTIONS.FEED, postId)

        // Delete like document
        transaction.delete(likeRef)

        // Decrement like count
        transaction.update(postRef, {
          likeCount: increment(-1),
        })
      })
    } catch (err) {
      // Rollback optimistic update
      post.likeCount = previousLikeCount
      post.isLiked = true

      error.value = err.message || 'Failed to unlike post'
      if (import.meta.env.DEV) {
        console.error('[feedStore] Error unliking post:', err)
      }
      throw err
    }
  }

  /**
   * Fetch users who liked a post
   * @param {string} postId - Post ID
   * @returns {Promise<Array>} Array of user objects
   */
  async function fetchLikes(postId) {
    likesLoading.value = true
    error.value = null

    try {
      const likesColl = collection(db, COLLECTIONS.FEED, postId, 'likes')
      const likesSnap = await getDocs(likesColl)

      const likeUserIds = likesSnap.docs.map((doc) => doc.id)

      if (likeUserIds.length === 0) {
        likes.value = []
        return []
      }

      // Fetch user profiles for users who liked (batch)
      const likeUsers = await Promise.all(
        likeUserIds.map(async (userId) => {
          return await fetchUserProfile(userId)
        })
      )

      likes.value = likeUsers.filter(Boolean)
      return likes.value
    } catch (err) {
      error.value = err.message || 'Failed to load likes'
      if (import.meta.env.DEV) {
        console.error('[feedStore] Error fetching likes:', err)
      }
      throw err
    } finally {
      likesLoading.value = false
    }
  }

  // ============================================================================
  // ACTIONS - Comments
  // ============================================================================

  /**
   * Add a comment to a post
   * @param {string} postId - Post ID
   * @param {string} text - Comment text
   * @returns {Promise<string>} Comment ID
   */
  async function addComment(postId, text) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated to comment')
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Comment text cannot be empty')
    }

    error.value = null

    try {
      // Use Firestore transaction
      const commentId = await runTransaction(db, async (transaction) => {
        const commentsColl = collection(db, COLLECTIONS.FEED, postId, 'comments')
        const postRef = getNestedDocRef(COLLECTIONS.FEED, postId)

        // Add comment document
        const commentRef = await addDoc(commentsColl, {
          userId: authStore.uid,
          text: text.trim(),
          createdAt: serverTimestamp(),
        })

        // Increment comment count
        transaction.update(postRef, {
          commentCount: increment(1),
        })

        return commentRef.id
      })

      // Optimistically update comment count
      const post = feedPosts.value.find((p) => p.id === postId)
      if (post) {
        post.commentCount++
      }

      // Optimistically add comment to local state
      comments.value.push({
        id: commentId,
        userId: authStore.uid,
        text: text.trim(),
        createdAt: new Date(),
        user: {
          displayName: authStore.displayName,
          photoURL: authStore.photoURL,
        },
      })

      return commentId
    } catch (err) {
      error.value = err.message || 'Failed to add comment'
      if (import.meta.env.DEV) {
        console.error('[feedStore] Error adding comment:', err)
      }
      throw err
    }
  }

  /**
   * Delete a comment (only if current user is author or post owner)
   * @param {string} postId - Post ID
   * @param {string} commentId - Comment ID
   */
  async function deleteComment(postId, commentId) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated to delete comment')
    }

    error.value = null

    try {
      // Verify ownership
      const comment = comments.value.find((c) => c.id === commentId)
      const post = feedPosts.value.find((p) => p.id === postId)

      if (!comment) {
        throw new Error('Comment not found')
      }

      // Allow deletion if user is comment author OR post author
      if (comment.userId !== authStore.uid && post?.userId !== authStore.uid) {
        throw new Error('You can only delete your own comments or comments on your posts')
      }

      // Use transaction
      await runTransaction(db, async (transaction) => {
        const commentRef = getNestedDocRef(COLLECTIONS.FEED, postId, 'comments', commentId)
        const postRef = getNestedDocRef(COLLECTIONS.FEED, postId)

        // Delete comment document
        transaction.delete(commentRef)

        // Decrement comment count
        transaction.update(postRef, {
          commentCount: increment(-1),
        })
      })

      // Remove from local state
      comments.value = comments.value.filter((c) => c.id !== commentId)

      // Update comment count
      if (post) {
        post.commentCount = Math.max(0, post.commentCount - 1)
      }
    } catch (err) {
      error.value = err.message || 'Failed to delete comment'
      if (import.meta.env.DEV) {
        console.error('[feedStore] Error deleting comment:', err)
      }
      throw err
    }
  }

  /**
   * Fetch comments for a post
   * @param {string} postId - Post ID
   * @returns {Promise<Array>} Array of comment objects
   */
  async function fetchComments(postId) {
    commentsLoading.value = true
    error.value = null

    try {
      const commentsColl = collection(db, COLLECTIONS.FEED, postId, 'comments')
      const commentsQuery = query(commentsColl, orderBy('createdAt', 'asc'), limit(50))
      const commentsSnap = await getDocs(commentsQuery)

      const commentsList = await Promise.all(
        commentsSnap.docs.map(async (doc) => {
          const commentData = doc.data()
          return {
            id: doc.id,
            userId: commentData.userId,
            text: commentData.text,
            createdAt: commentData.createdAt?.toDate?.() || new Date(),
            user: await fetchUserProfile(commentData.userId),
          }
        })
      )

      comments.value = commentsList
      return comments.value
    } catch (err) {
      error.value = err.message || 'Failed to load comments'
      if (import.meta.env.DEV) {
        console.error('[feedStore] Error fetching comments:', err)
      }
      throw err
    } finally {
      commentsLoading.value = false
    }
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Fetch user profile data (cached for performance)
   */
  const userProfileCache = new Map()
  const MAX_PROFILE_CACHE_SIZE = 100

  async function fetchUserProfile(userId) {
    if (userProfileCache.has(userId)) {
      return userProfileCache.get(userId)
    }

    if (userProfileCache.size >= MAX_PROFILE_CACHE_SIZE) {
      const firstKey = userProfileCache.keys().next().value
      userProfileCache.delete(firstKey)
    }

    try {
      const userDoc = await fetchDocument(COLLECTIONS.USERS, userId)

      const profile = userDoc
        ? {
            uid: userId,
            displayName: userDoc.profile?.displayName || 'Anonymous',
            photoURL: userDoc.profile?.photoURL || '',
          }
        : {
            uid: userId,
            displayName: 'Anonymous',
            photoURL: '',
          }

      userProfileCache.set(userId, profile)
      return profile
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[feedStore] Error fetching user profile:', err)
      }
      return {
        uid: userId,
        displayName: 'Anonymous',
        photoURL: '',
      }
    }
  }

  /**
   * Remove all posts by a specific user from the feed
   * (Used when blocking a user)
   * @param {string} userId - User ID whose posts to remove
   */
  function removePostsByUser(userId) {
    if (!userId) return

    const initialCount = feedPosts.value.length
    feedPosts.value = feedPosts.value.filter((post) => post.userId !== userId)

    const removedCount = initialCount - feedPosts.value.length
    if (removedCount > 0) {
      if (import.meta.env.DEV) {
        console.log(`[feedStore] Removed ${removedCount} posts from user ${userId}`)
      }
    }
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  function clearData() {
    feedPosts.value = []
    currentPost.value = null
    comments.value = []
    likes.value = []
    lastVisible.value = null
    hasMore.value = true
    error.value = null
    userProfileCache.clear()
  }

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State
    feedPosts,
    feedLoading,
    hasMore,
    currentPost,
    currentPostLoading,
    comments,
    commentsLoading,
    likes,
    likesLoading,
    error,
    feedType,
    indexBuilding,
    retryCount,
    retryDelay,

    // Getters
    postsCount,
    isLiked,
    getLikeCount,
    getCommentCount,

    // Actions
    fetchFeed,
    shareWorkout,
    deletePost,
    updatePostCaption,
    likePost,
    unlikePost,
    fetchLikes,
    addComment,
    deleteComment,
    fetchComments,
    removePostsByUser,
    clearData,
  }
})
