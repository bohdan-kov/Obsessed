# Community Section - Product Requirements Document (PRD)

## Executive Summary

The Community page transforms Obsessed from a **personal tracking tool** into a **social fitness platform** where users motivate each other, share progress, and compete in friendly challenges. While Analytics answers "Am I progressing?", Community answers:
- "Who else is crushing their goals?"
- "Can I stay motivated through social accountability?"
- "How do I compare to others with similar goals?"
- "Where can I find workout inspiration?"

**Core Philosophy**: Build genuine connections through shared struggles and victories. Every feature must foster motivation, not vanity metrics or toxicity.

**Key Differentiator**: Unlike generic social networks, Obsessed Community is **context-aware** – it understands gym culture, progressive overload, and the mental game of consistent training.

---

## 📊 Implementation Roadmap

### MVP (Phase 1) - Community Foundation
**Timeline**: 3-4 weeks | **Goal**: Launch basic social features

- ✅ Public User Profiles (view-only)
- ✅ Workout Feed (chronological)
- ✅ Workout Sharing (post to feed)
- ✅ Like & Comment System
- ✅ Follow/Unfollow Users
- ✅ Privacy Controls (public/private/friends)
- ✅ Report & Block Features

**Success Metrics**:
- 30% of active users create a public profile
- 10% share at least one workout per week
- 50% engagement rate (likes/comments on shared workouts)

### V1.1 (Phase 2) - Gamification & Discovery
**Timeline**: 2-3 weeks | **Goal**: Increase engagement

- ❌ Achievements & Badges System
- ❌ Personal Records Feed ("User just hit a new PR!")
- ❌ User Discovery (suggested follows)
- ❌ Exercise-Specific Leaderboards
- ❌ Weekly Challenges (most volume, longest streak, etc.)
- ❌ Trending Workouts

**Success Metrics**:
- 40% of users follow at least 3 people
- 20% participate in weekly challenges
- Average session time +25%

### V1.2 (Phase 3) - Groups & Advanced Social
**Timeline**: 3-4 weeks | **Goal**: Build communities

- ❌ Groups/Teams (gyms, training partners, etc.)
- ❌ Group Challenges (team leaderboards)
- ❌ Direct Messaging (1-on-1 chat)
- ❌ Workout Templates Sharing
- ❌ Mentor/Coach Roles
- ❌ Community Guidelines & Moderation Tools

### V2 (Future) - Advanced Features
- ❌ Live Workout Sessions (real-time tracking with friends)
- ❌ Video Workout Sharing
- ❌ AI-Powered Workout Recommendations from Community
- ❌ Integration with Fitness Influencers
- ❌ Marketplace for Workout Programs

---

## 1. Background & Strategic Context

### 1.1 Why Community Matters for Gym Apps

**Research Insights**:
- **73% of gym-goers** report that social accountability increases workout consistency (ACSM 2023)
- **2.3x higher retention** for fitness apps with social features vs solo tracking (App Annie 2024)
- **"Workout buddy effect"**: People train 12% harder when someone is watching (Journal of Sports Science)

**Competitive Analysis**:
| App | Feed | Challenges | Groups | Messaging | Key Weakness |
|-----|------|-----------|---------|-----------|--------------|
| **Hevy** | ✅ | ❌ | ❌ | ❌ | No community features |
| **Strong** | ❌ | ❌ | ❌ | ❌ | Pure solo tracking |
| **JEFIT** | ✅ | ✅ | ✅ | ✅ | Cluttered UX, slow performance |
| **Fitbod** | ❌ | ❌ | ❌ | ❌ | AI-focused, no social |
| **Strava** (reference) | ✅ | ✅ | ✅ | ❌ | Running/cycling focused |

**Obsessed Opportunity**:
- **Mobile-first** design (competitors have desktop-era UX)
- **Privacy-first** (granular controls, no forced social)
- **Gym-specific** culture (not generic fitness)
- **Ukrainian market** (underserved community features)

### 1.2 Anti-Goals (What We Won't Build)

To maintain focus and avoid feature creep:

- ❌ **Influencer Platform**: No paid promotions, sponsored posts, or affiliate links
- ❌ **Dating Features**: Keep it strictly fitness-focused
- ❌ **Nutrition Tracking**: Stay in our lane (strength training)
- ❌ **E-commerce**: No selling supplements or gear (maybe partner integrations later)
- ❌ **Toxic Comparison**: No body shaming, no unrealistic standards
- ❌ **Algorithm-Driven Feed** (MVP): Start chronological, add intelligent ranking later

---

## 2. User Personas & Jobs-to-be-Done

### Persona 1: The Motivated Beginner (Анна, 24)
**Background**:
- Started gym 3 months ago
- Lacks confidence in exercise form
- Gets discouraged easily

**Goals**:
- Find inspiration from similar users
- Learn proper technique from community
- Build consistency through accountability

**Jobs-to-be-Done**:
- "When I'm feeling unmotivated, I want to see others crushing their workouts, so I get inspired to go to the gym."
- "When I'm unsure about an exercise, I want to see how others perform it, so I don't injure myself."
- "When I hit a small milestone, I want to share it with people who understand, so I feel validated."

**Key Features**: Workout feed, beginner-friendly challenges, supportive comments

---

### Persona 2: The Competitive Lifter (Богдан, 28)
**Background**:
- Training for 5+ years
- Tracks every PR meticulously
- Loves friendly competition

**Goals**:
- Compare lifts with peers
- Stay accountable to training partners
- Showcase progress

**Jobs-to-be-Done**:
- "When I hit a PR, I want to share it immediately, so my gym buddies can celebrate with me."
- "When I'm planning my next mesocycle, I want to see what programs others are running, so I can optimize my training."
- "When I see someone stronger than me, I want to follow their journey, so I stay motivated to improve."

**Key Features**: PR feed, leaderboards, exercise-specific challenges, detailed workout sharing

---

### Persona 3: The Social Trainer (Олена, 32)
**Background**:
- Certified personal trainer
- Trains 15-20 clients/week
- Wants to build online presence

**Goals**:
- Share workout templates with clients
- Build credibility through consistent content
- Find new clients organically

**Jobs-to-be-Done**:
- "When I design a great workout, I want to share it as a template, so others can benefit and I build my reputation."
- "When clients ask for motivation, I want to point them to my public profile, so they see my consistency and expertise."
- "When I post workouts, I want meaningful engagement (not just likes), so I can help more people."

**Key Features**: Workout templates, coach profiles, groups for clients, detailed analytics sharing

---

## 3. Core Features Specification

## Section 1: USER PROFILES

### Feature 1.1: Public Profile Creation ✅
**Priority**: CRITICAL | **Effort**: MEDIUM | **Version**: MVP

**User Story**:
> As a user, I want to create a public profile with my photo, bio, and stats, so others can discover me and follow my fitness journey.

**Acceptance Criteria**:
- [x] Profile creation flow:
  1. Prompt after first workout logged: "Want to connect with the community?"
  2. Upload profile photo (crop to square, max 2MB)
  3. Enter display name (3-30 chars, unique)
  4. Write bio (max 160 chars)
  5. Select privacy mode: Public / Friends Only / Private
  6. Choose visible stats: Total workouts, Volume, PRs, Streak
- [x] Profile URL: `/community/@username` (shareable) - **Note: Using userId as username in MVP**
- [x] Profile displays:
  - Header: Photo, Display name, Bio, Join date
  - Stats cards: Workouts (30d), Volume (30d), Current streak, Followers/Following
  - Tabs: Feed (shared workouts), PRs, Achievements - **Note: PRs and Achievements disabled for V1.1**
  - Follow/Unfollow button (if not own profile)
  - Settings cog (if own profile)
- [x] Edit profile: Change photo, bio, privacy, visible stats
- [x] Delete profile: Removes public data but keeps workout logs private
- [x] Empty state: "This user hasn't shared any workouts yet"

**Data Model** (`users` collection in Firestore):
```javascript
{
  uid: 'abc123',
  profile: {
    displayName: 'BogdanLifts',  // Unique, indexed
    photoURL: 'https://...',
    bio: 'Powerlifter | Kyiv 🇺🇦',
    createdAt: '2026-01-03',
    privacyMode: 'public',       // public | friends | private
    visibleStats: ['workouts', 'volume', 'streak'], // Array of enabled stats
    followerCount: 142,          // Denormalized for performance
    followingCount: 89,
    isVerified: false            // Future: verified coaches
  }
}
```

**Privacy Modes**:
| Mode | Who Sees Profile | Who Sees Workouts | Who Can Follow |
|------|-----------------|-------------------|----------------|
| **Public** | Everyone | Everyone | Everyone |
| **Friends Only** | Followers | Followers | Everyone (pending approval) |
| **Private** | No one | No one | No one |

**i18n Keys**:
```json
{
  "community.profile.createPrompt": "Want to connect with the community?",
  "community.profile.displayName": "Display Name",
  "community.profile.bio": "Bio",
  "community.profile.privacyMode": "Privacy",
  "community.profile.visibleStats": "Visible Stats",
  "community.profile.followers": "Followers",
  "community.profile.following": "Following",
  "community.profile.emptyState": "This user hasn't shared any workouts yet"
}
```

**Technical Notes**:
- Use Firebase Storage for profile photos with image optimization
- Display names must be unique (check on blur via Cloud Function)
- Profile photos: 400x400px thumbnail, 1200x1200px full-res
- Implement username search index for discovery

---

### Feature 1.2: Follow/Unfollow System ✅
**Priority**: CRITICAL | **Effort**: MEDIUM | **Version**: MVP

**User Story**:
> As a user, I want to follow other users whose workouts inspire me, so I can see their activity in my community feed.

**Acceptance Criteria**:
- [x] Follow button states:
  - **Not following**: "Follow" (blue button)
  - **Pending** (friends-only profiles): "Requested" (gray, disabled) - **Note: Pending state not implemented in MVP**
  - **Following**: "Following" (gray button with checkmark)
  - **Hover on Following**: "Unfollow" (red)
- [x] Follow action:
  - Public profiles: Instant follow
  - Friends-only profiles: Send follow request → User receives notification → Approve/Deny - **Note: Instant follow for MVP, no approval flow**
- [x] Unfollow action:
  - Confirmation dialog: "Unfollow @username?"
  - Removes from feed immediately
- [x] Followers/Following lists:
  - `/community/@username/followers` - List of followers
  - `/community/@username/following` - List of users they follow
  - Each entry: Photo, Name, Bio snippet, Follow button
  - Sort: Recent first
  - Pagination: 50 per page - **Note: No pagination in MVP, loads all**
- [x] Blocked users don't appear in followers/following lists
- [x] Can't follow yourself (button hidden)

**Data Model**:

**Option A: Subcollections (Recommended)**
```javascript
// Firestore structure
users/{uid}/followers/{followerUid} = { createdAt, status }
users/{uid}/following/{followingUid} = { createdAt, status }

// Pros: Scalable, easy queries
// Cons: 2 writes per follow (follower + following docs)
```

**Option B: Arrays (Simpler, but limited)**
```javascript
users/{uid} = {
  followers: ['uid1', 'uid2'],  // Max 500 followers
  following: ['uid3', 'uid4']
}

// Pros: Single doc, fast reads
// Cons: Doesn't scale past ~500 followers
```

**Recommendation**: Use Option A (subcollections) for scalability.

**Security Rules** (Firestore):
```javascript
// Users can only follow/unfollow themselves
match /users/{uid}/following/{followingId} {
  allow write: if request.auth.uid == uid;
  allow read: if resource.data.status == 'approved' || request.auth.uid == uid;
}
```

**Real-time Updates**:
- Subscribe to `users/{uid}/followers` to update follower count in profile header
- Use `onSnapshot` for live follower count updates

**i18n Keys**:
```json
{
  "community.follow.button": "Follow",
  "community.follow.requested": "Requested",
  "community.follow.following": "Following",
  "community.follow.unfollow": "Unfollow",
  "community.follow.unfollowConfirm": "Unfollow @{username}?",
  "community.follow.followers": "Followers",
  "community.follow.following": "Following"
}
```

---

## Section 2: WORKOUT FEED

### Feature 2.1: Workout Sharing (Post to Feed) ✅
**Priority**: CRITICAL | **Effort**: HIGH | **Version**: MVP

**User Story**:
> As a user, I want to share my completed workouts to the community feed, so I can inspire others and receive feedback.

**Acceptance Criteria**:
- [x] Share button on workout detail page:
  - Icon: Share arrow (top-right)
  - States: Shareable (blue) / Already shared (gray, "Shared")
- [x] Share modal:
  - Workout preview card:
    - Exercise count, Total volume, Duration
    - Exercise list (truncated to 3, "+2 more")
  - Caption input (optional, max 280 chars)
  - Visibility selector: Public / Followers Only
  - "Share" button (primary)
- [x] Post-share confirmation:
  - Toast: "Workout shared!"
  - Button changes to "Shared" (gray)
  - Link to view post: "View in Feed"
- [x] Shared workout displays in feed:
  - User photo + name + timestamp ("2 hours ago")
  - Caption (if added)
  - Workout card (expandable):
    - Exercise count, Volume, Duration
    - Exercise details: Name, Sets, Reps, Weight
  - Interaction buttons: Like (❤️), Comment (💬), Share (external)
  - Tap anywhere → Navigate to full workout detail
- [x] Edit/Delete shared workout:
  - Edit: Update caption only (workout data immutable)
  - Delete: Confirmation dialog → Removes from feed (keeps original workout)
- [x] Privacy enforcement:
  - Private profiles: Share button hidden
  - Friends-only: Only followers see post
  - Public: Everyone sees post

**Data Model** (`feed` collection):
```javascript
{
  id: 'post123',
  userId: 'abc123',             // Author
  workoutId: 'workout456',      // Reference to original workout
  caption: 'Leg day PR! 💪',
  visibility: 'public',         // public | followers
  createdAt: '2026-01-03T10:30:00Z',
  likeCount: 24,                // Denormalized
  commentCount: 7,              // Denormalized
  workout: {                    // Snapshot of workout data (for feed performance)
    duration: 75,
    totalVolume: 8450,
    exerciseCount: 6,
    exercises: [
      { name: 'Squat', sets: 4, reps: 8, weight: 120 },
      // ... more
    ]
  }
}
```

**Why Snapshot Workout Data?**
- Feed query doesn't need to join with `workouts` collection (faster)
- If user deletes original workout, feed post persists
- Trade-off: Slight data duplication vs massive performance gain

**Feed Query** (Firestore):
```javascript
// Current user's feed (following + own posts)
const followingIds = await getFollowingIds(currentUserId)
const feedQuery = query(
  collection(db, 'feed'),
  where('userId', 'in', [...followingIds, currentUserId]),
  where('visibility', 'in', ['public', 'followers']), // Filtered by privacy
  orderBy('createdAt', 'desc'),
  limit(20)
)
```

**Performance Optimization**:
- **Composite index**: `(userId, createdAt)` for user profile feeds
- **Pagination**: Load 20 posts at a time, infinite scroll
- **Image lazy loading**: Profile photos load on viewport enter
- **Debounced like/comment counters**: Update every 5s, not real-time

**i18n Keys**:
```json
{
  "community.share.button": "Share Workout",
  "community.share.caption": "Add a caption...",
  "community.share.visibility": "Who can see this?",
  "community.share.public": "Everyone",
  "community.share.followers": "Followers Only",
  "community.share.success": "Workout shared!",
  "community.share.viewInFeed": "View in Feed",
  "community.share.delete": "Delete Post",
  "community.share.deleteConfirm": "Remove this post from your feed?"
}
```

---

### Feature 2.2: Feed Display & Pagination ✅
**Priority**: CRITICAL | **Effort**: MEDIUM | **Version**: MVP

**User Story**:
> As a user, I want to scroll through a feed of workouts from people I follow, so I can stay motivated and discover new exercises.

**Acceptance Criteria**:
- [x] Feed route: `/community` (main tab)
- [x] Feed types (tabs):
  - **Following**: Posts from users you follow (default)
  - **Discover**: Public posts from all users (algorithmic later, chronological MVP)
  - **You**: Your shared workouts (own profile)
- [x] Post card design:
  - Header: Avatar (40px), Name, Timestamp, Follow button (if not following)
  - Caption (if present, max 3 lines with "See more")
  - Workout summary card:
    - Stats row: 🏋️ 6 exercises • ⚡ 8,450 kg • ⏱️ 75 min
    - Exercise list (expandable):
      - Collapsed: Top 3 exercises
      - Expanded: All exercises with sets/reps/weight
    - Toggle: "Show all exercises"
  - Actions row:
    - Like button: ❤️ 24 (filled red if liked)
    - Comment button: 💬 7
    - Share button: ⤴️ (external share)
  - Comment section (collapsed by default):
    - Latest 2 comments shown
    - "View all 7 comments" link
    - Add comment input (if logged in)
- [x] Infinite scroll:
  - Load 20 posts initially
  - Load next 20 when user scrolls to bottom
  - Loading skeleton: 3 placeholder cards
  - End of feed: "You're all caught up! 🎉"
- [x] Empty states:
  - Following feed (no posts): "Follow users to see their workouts here"
  - Discover feed (no posts): "No public workouts yet. Be the first to share!"
  - Own feed (no posts): "Share your first workout to build your profile"
- [x] Pull-to-refresh (mobile): Reload latest 20 posts
- [ ] Real-time updates (optional MVP): **Not implemented in MVP**
  - New post indicator: "3 new posts" (tap to scroll to top)
  - Like/comment counts update every 30s (polling)

**Feed Algorithm (MVP: Chronological)**:
```javascript
// V1: Simple reverse-chronological
const feedPosts = await getDocs(
  query(
    collection(db, 'feed'),
    where('userId', 'in', followingIds),
    orderBy('createdAt', 'desc'),
    limit(20)
  )
)

// V1.1: Add engagement boost
// Posts with high engagement (likes + comments) in last 24h get priority
const scoredPosts = posts.map(p => ({
  ...p,
  score: p.likeCount + p.commentCount * 2 - (Date.now() - p.createdAt) / 1000 / 60 / 60
})).sort((a, b) => b.score - a.score)
```

**Performance Considerations**:
- **Firestore read costs**: 20 posts/page × 50 users following = 1,000 reads/day (acceptable)
- **Cache strategy**: Cache feed for 5 minutes in Pinia store
- **Optimistic UI**: Likes/comments update instantly, sync in background
- **Image CDN**: Use Firebase Storage with auto-resizing (400px width for thumbnails)

**Mobile-First Design**:
- Post cards: Full width, stacked vertically
- Swipe gestures:
  - Swipe left on post → Quick like
  - Swipe right on post → Save/Bookmark (future feature)
- Avatar tap → Navigate to user profile
- Exercise name tap → Navigate to exercise detail

**i18n Keys**:
```json
{
  "community.feed.following": "Following",
  "community.feed.discover": "Discover",
  "community.feed.you": "You",
  "community.feed.exercises": "{count} exercises",
  "community.feed.showAll": "Show all exercises",
  "community.feed.hideExercises": "Hide exercises",
  "community.feed.loadingMore": "Loading more...",
  "community.feed.endOfFeed": "You're all caught up! 🎉",
  "community.feed.emptyFollowing": "Follow users to see their workouts here",
  "community.feed.emptyDiscover": "No public workouts yet. Be the first to share!",
  "community.feed.emptyYou": "Share your first workout to build your profile"
}
```

---

### Feature 2.3: Like & Comment System ✅
**Priority**: CRITICAL | **Effort**: MEDIUM | **Version**: MVP

**User Story**:
> As a user, I want to like and comment on workouts to show support and build connections with other lifters.

**Acceptance Criteria**:

**Likes**:
- [x] Like button states:
  - **Not liked**: ❤️ (outline, gray)
  - **Liked**: ❤️ (filled, red)
  - Counter: "24 likes" (tap to see list)
- [x] Like action:
  - Tap → Instant UI update (optimistic)
  - Send Firestore write in background
  - Haptic feedback on mobile
- [x] Unlike action:
  - Tap again → Remove like
  - Decrement counter
- [ ] Like list modal: **Not implemented in MVP**
  - Shows avatars + names of users who liked
  - Your likes appear first
  - Sort: Recent first
  - Max 100 shown, "+24 others"
  - Tap user → Navigate to profile
- [x] Can't like own posts (button disabled)

**Comments**:
- [x] Comment input:
  - Appears below post (collapsed by default)
  - "Add a comment..." placeholder
  - Max 500 chars
  - Emoji picker button - **Note: No emoji picker in MVP**
  - Submit button (blue, enabled when text present)
- [x] Comment display:
  - Avatar (32px) + Name + Timestamp
  - Comment text (linkified URLs) - **Note: URLs not linkified in MVP**
  - Reply button (future feature)
  - Delete button (if own comment or own post)
- [x] Comment submission:
  - Optimistic UI: Comment appears instantly
  - Firestore write in background
  - Error handling: Rollback on failure
  - Notification to post author (if not self) - **Note: No notifications in MVP**
- [x] Comment list:
  - Show latest 2 comments by default
  - "View all 7 comments" expands full list
  - Sorted: Oldest first (conversation flow)
  - Pagination: Load 20 at a time - **Note: Loads all comments, no pagination in MVP**
- [x] Delete comment:
  - Confirmation: "Delete this comment?"
  - Remove from list
  - Decrement comment counter

**Data Model**:

**Likes** (`feed/{postId}/likes` subcollection):
```javascript
{
  userId: 'abc123',
  createdAt: '2026-01-03T11:00:00Z'
}
// Document ID = userId (ensures one like per user)
```

**Comments** (`feed/{postId}/comments` subcollection):
```javascript
{
  id: 'comment123',
  userId: 'abc123',
  text: 'Great workout! 💪',
  createdAt: '2026-01-03T11:05:00Z',
  isDeleted: false  // Soft delete for moderation
}
```

**Denormalized Counters** (on feed post doc):
```javascript
{
  likeCount: 24,     // Increment/decrement via transaction
  commentCount: 7    // Updated on comment add/delete
}
```

**Why Denormalize Counters?**
- Feed query doesn't need to count subcollection docs (slow)
- Trade-off: Slight inconsistency (eventual consistency) vs massive perf gain
- Use Firestore transactions to prevent race conditions

**Security Rules**:
```javascript
// Users can only like/unlike as themselves
match /feed/{postId}/likes/{userId} {
  allow write: if request.auth.uid == userId;
  allow read: if true; // Anyone can see who liked (public posts)
}

// Users can only comment as themselves
match /feed/{postId}/comments/{commentId} {
  allow create: if request.auth.uid == request.resource.data.userId;
  allow delete: if request.auth.uid == resource.data.userId
                || request.auth.uid == get(/databases/$(database)/documents/feed/$(postId)).data.userId; // Post author can delete
  allow read: if true;
}
```

**Notification System** (Future: V1.1):
```javascript
// When user likes/comments, create notification
notifications/{userId}/items/{notificationId} = {
  type: 'like',  // like | comment | follow | mention
  fromUserId: 'abc123',
  postId: 'post123',
  commentId: 'comment123',  // If comment
  createdAt: '2026-01-03T11:00:00Z',
  isRead: false
}
```

**i18n Keys**:
```json
{
  "community.like.button": "Like",
  "community.like.liked": "Liked",
  "community.like.count": "{count} likes",
  "community.like.likedBy": "Liked by",
  "community.comment.add": "Add a comment...",
  "community.comment.submit": "Post",
  "community.comment.viewAll": "View all {count} comments",
  "community.comment.delete": "Delete Comment",
  "community.comment.deleteConfirm": "Delete this comment?"
}
```

**Performance Optimizations**:
- **Batch writes**: Queue like/unlike actions, flush every 2s
- **Optimistic updates**: UI responds instantly, sync in background
- **Comment pagination**: Load 20 comments at a time
- **Debounced counters**: Update every 5s, not on every like

---

## Section 3: DISCOVERY & ENGAGEMENT

### Feature 3.1: User Discovery (Suggested Follows)
**Priority**: HIGH | **Effort**: MEDIUM | **Version**: V1.1

**User Story**:
> As a user, I want to discover other users with similar goals or training styles, so I can follow people who inspire me.

**Acceptance Criteria**:
- [ ] Discovery section: `/community/discover`
- [ ] Suggested users algorithm (MVP):
  1. **Similar training frequency**: Users with ±20% workout frequency
  2. **Shared exercises**: Users who train same exercises
  3. **Similar volume**: Users with ±30% total volume
  4. **Location-based** (future): Users in same city/gym
- [ ] Discovery card:
  - Avatar, Name, Bio snippet
  - Stats: "142 workouts • 450kg avg volume"
  - Shared context: "Trains 5x/week like you" or "Also does Deadlifts"
  - Follow button
  - "View Profile" link
- [ ] Swipe interface (mobile):
  - Swipe right → Follow user
  - Swipe left → Dismiss suggestion
  - Card stack (Tinder-style)
- [ ] Filters:
  - Training frequency: 1-2x, 3-4x, 5-6x, 7x/week
  - Experience level: Beginner (<6mo), Intermediate (6mo-2y), Advanced (2y+)
  - Gender: All, Male, Female, Other
- [ ] Refresh button: Load new suggestions
- [ ] Empty state: "No suggestions right now. Check back later!"

**Algorithm Implementation**:
```javascript
// src/utils/discoveryUtils.js
export async function getSuggestedUsers(currentUser, limit = 10) {
  const { workoutFrequency, avgVolume, topExercises } = currentUser.stats

  // Query users with similar stats
  const candidates = await getDocs(
    query(
      collection(db, 'users'),
      where('stats.workoutFrequency', '>=', workoutFrequency * 0.8),
      where('stats.workoutFrequency', '<=', workoutFrequency * 1.2),
      limit(100)  // Get pool of candidates
    )
  )

  // Score each candidate
  const scored = candidates.docs.map(doc => {
    const user = doc.data()
    let score = 0

    // Frequency match (0-30 points)
    score += 30 - Math.abs(user.stats.workoutFrequency - workoutFrequency) * 5

    // Shared exercises (0-40 points)
    const sharedExercises = topExercises.filter(ex => user.stats.topExercises.includes(ex))
    score += sharedExercises.length * 10

    // Volume similarity (0-30 points)
    const volumeDiff = Math.abs(user.stats.avgVolume - avgVolume) / avgVolume
    score += Math.max(0, 30 - volumeDiff * 100)

    return { user, score }
  })

  // Sort by score, return top N
  return scored.sort((a, b) => b.score - a.score).slice(0, limit)
}
```

**Firestore Composite Index**:
```
Collection: users
Fields: stats.workoutFrequency (Ascending), stats.avgVolume (Ascending)
```

**Privacy**:
- Only suggest users with public profiles
- Exclude blocked users
- Exclude users you already follow

**i18n Keys**:
```json
{
  "community.discover.title": "Discover Users",
  "community.discover.suggested": "Suggested for You",
  "community.discover.similarFrequency": "Trains {frequency}x/week like you",
  "community.discover.sharedExercises": "Also trains {exercises}",
  "community.discover.viewProfile": "View Profile",
  "community.discover.refresh": "Show More",
  "community.discover.empty": "No suggestions right now. Check back later!"
}
```

---

### Feature 3.2: Personal Records (PR) Feed
**Priority**: HIGH | **Effort**: LOW | **Version**: V1.1

**User Story**:
> As a user, I want to see when people I follow hit new PRs, so I can celebrate their achievements and stay motivated.

**Acceptance Criteria**:
- [ ] PR detection logic:
  - Compare each set to user's historical data for that exercise
  - Detect new max weight for any rep range
  - Detect new max volume for an exercise in a workout
- [ ] PR feed card:
  - Banner: "🎉 New Personal Record!"
  - User photo + name
  - Exercise name: "Squat"
  - Achievement: "New 5RM: 120kg (previous: 115kg)"
  - Percentage gain: "+4.3%"
  - Timestamp: "2 hours ago"
  - Like & comment buttons
- [ ] PR types:
  - **Weight PR**: New max weight for rep range (1RM, 5RM, 10RM)
  - **Volume PR**: Most volume in single workout for exercise
  - **Reps PR**: Most reps at specific weight
- [ ] Filter by PR type:
  - All PRs (default)
  - Weight PRs only
  - Volume PRs only
- [ ] Auto-share setting:
  - Toggle in settings: "Auto-share PRs to feed" (default: ON)
  - If enabled, PRs automatically post to feed with caption: "New PR! 🎉"

**Data Model** (`feed` collection, type: 'pr'):
```javascript
{
  id: 'pr123',
  type: 'pr',  // Differentiate from regular workout posts
  userId: 'abc123',
  exercise: {
    id: 'squat',
    name: 'Squat',
    muscleGroup: 'legs'
  },
  prType: 'weight',  // weight | volume | reps
  achievement: {
    current: 120,
    previous: 115,
    unit: 'kg',
    reps: 5,
    percentIncrease: 4.3
  },
  createdAt: '2026-01-03T14:00:00Z',
  likeCount: 48,
  commentCount: 12
}
```

**PR Detection** (in workoutStore):
```javascript
// src/utils/prDetection.js
export function detectPRs(workout, userHistory) {
  const prs = []

  workout.exercises.forEach(exercise => {
    const exerciseHistory = userHistory[exercise.id] || []

    exercise.sets.forEach(set => {
      // Check weight PR for this rep range
      const maxForReps = getMaxWeightForReps(exerciseHistory, set.reps)
      if (set.weight > maxForReps) {
        prs.push({
          type: 'weight',
          exercise: exercise.name,
          reps: set.reps,
          current: set.weight,
          previous: maxForReps
        })
      }
    })

    // Check volume PR for exercise
    const currentVolume = calculateExerciseVolume(exercise)
    const maxVolume = getMaxExerciseVolume(exerciseHistory)
    if (currentVolume > maxVolume) {
      prs.push({
        type: 'volume',
        exercise: exercise.name,
        current: currentVolume,
        previous: maxVolume
      })
    }
  })

  return prs
}
```

**Celebration Animation** (optional):
```vue
<script setup>
import confetti from 'canvas-confetti'

function celebratePR() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  })
}
</script>
```

**i18n Keys**:
```json
{
  "community.pr.title": "Personal Records",
  "community.pr.badge": "New PR!",
  "community.pr.weightPR": "New {reps}RM: {weight} (previous: {previous})",
  "community.pr.volumePR": "New volume record: {volume} (previous: {previous})",
  "community.pr.repsPR": "New rep record: {reps} reps at {weight}",
  "community.pr.gain": "+{percent}%",
  "community.pr.autoShare": "Auto-share PRs to feed"
}
```

---

### Feature 3.3: Exercise-Specific Leaderboards
**Priority**: MEDIUM | **Effort**: HIGH | **Version**: V1.1

**User Story**:
> As a competitive lifter, I want to see how my lifts rank against others in the community, so I can find motivation to push harder.

**Acceptance Criteria**:
- [ ] Leaderboard route: `/community/leaderboards`
- [ ] Exercise selector:
  - Search: "Type exercise name..."
  - Popular exercises shown first (Squat, Deadlift, Bench Press, etc.)
  - Grouped by muscle group
- [ ] Leaderboard table:
  - Columns: Rank, User, Weight, Reps, Date, Follow
  - Sort options: 1RM / 5RM / 10RM / Total Volume
  - Your rank highlighted in gold
  - Top 3 have medals: 🥇 🥈 🥉
  - Pagination: 50 rows per page
- [ ] Filter options:
  - Gender: All / Male / Female / Other
  - Bodyweight class (future): <70kg, 70-80kg, 80-90kg, >90kg
  - Time period: All time / This year / This month / This week
- [ ] User row actions:
  - Tap row → View user profile
  - Follow button (if not following)
- [ ] Your stats card (sticky header):
  - "Your 1RM: 120kg"
  - "Rank: #47 out of 238"
  - "To reach #40: +5kg"
- [ ] Empty state:
  - "No data for this exercise yet. Be the first!"

**Data Model** (`leaderboards` collection):
```javascript
// Denormalized for query performance
{
  exerciseId: 'squat',
  userId: 'abc123',
  displayName: 'BogdanLifts',
  photoURL: 'https://...',
  gender: 'male',
  stats: {
    oneRM: 150,
    fiveRM: 120,
    tenRM: 100,
    totalVolume: 125000,  // All-time
    lastUpdated: '2026-01-03'
  }
}

// Composite index: (exerciseId, oneRM DESC)
```

**Leaderboard Update Strategy**:
```javascript
// Option 1: Real-time (expensive)
// Update leaderboard on every workout save
// Pros: Always current
// Cons: High Firestore write costs

// Option 2: Batch daily (recommended)
// Cloud Function runs daily at midnight
// Recalculates all exercise PRs for all users
// Updates leaderboard collection
// Pros: Low cost, acceptable freshness
// Cons: Up to 24h delay

// Option 3: Hybrid
// Update user's own leaderboard entry immediately
// Rebuild full leaderboard nightly
// Pros: Best UX, moderate cost
```

**Privacy Considerations**:
- Only include users with public profiles
- Allow users to opt-out: "Hide my lifts from leaderboards" setting
- Exclude blocked users from leaderboards

**Gamification**:
- Badges for top 10 finishes:
  - "🥇 Top 10 in Squat (Jan 2026)"
  - Display on user profile
- Monthly reset option: "Leaderboard Champions" archive

**i18n Keys**:
```json
{
  "community.leaderboards.title": "Leaderboards",
  "community.leaderboards.selectExercise": "Select an exercise",
  "community.leaderboards.rank": "Rank",
  "community.leaderboards.user": "User",
  "community.leaderboards.weight": "Weight",
  "community.leaderboards.yourRank": "Your Rank: #{rank} out of {total}",
  "community.leaderboards.toNextRank": "To reach #{rank}: +{difference}",
  "community.leaderboards.empty": "No data for this exercise yet. Be the first!",
  "community.leaderboards.optOut": "Hide my lifts from leaderboards"
}
```

**Technical Notes**:
- Use Cloud Functions for daily leaderboard rebuild
- Cache leaderboards in Pinia store (refresh every 5 min)
- Implement virtualized scrolling for long leaderboards (react-window or similar)

---

## Section 4: CHALLENGES & GAMIFICATION

### Feature 4.1: Weekly Challenges
**Priority**: MEDIUM | **Effort**: MEDIUM | **Version**: V1.1

**User Story**:
> As a user, I want to participate in weekly fitness challenges with others, so I can push myself harder and stay consistent.

**Acceptance Criteria**:
- [ ] Challenges route: `/community/challenges`
- [ ] Challenge types (MVP):
  - **Volume Challenge**: Most total volume in 7 days
  - **Streak Challenge**: Most consecutive workout days
  - **Exercise Challenge**: Most reps of specific exercise (e.g., "100 Pull-ups in a week")
  - **Frequency Challenge**: Most workouts in 7 days
- [ ] Active challenges card:
  - Challenge name: "Volume King (Jan 1-7)"
  - Description: "Who can lift the most weight this week?"
  - Time remaining: "3 days 14 hours left"
  - Current leader: Avatar + Name + Score
  - Your rank: "#12 with 45,000 kg"
  - Progress bar: Your score vs leader's score
  - "View Leaderboard" button
- [ ] Challenge detail page:
  - Full leaderboard (top 100)
  - Your stats card
  - Activity feed: "BogdanLifts just took #1! 💪"
  - Share button: "Share to feed"
- [ ] Join/Leave challenge:
  - "Join Challenge" button (if not joined)
  - "Leave Challenge" confirmation (if joined)
  - Auto-join setting: "Auto-join weekly challenges"
- [ ] Challenge completion:
  - Winners announced: Top 3 get badges
  - Notification: "You finished #12 in Volume King!"
  - Archive: Past challenges viewable
- [ ] Create custom challenge (future V1.2):
  - Admin-only for MVP
  - V1.2: Users can create challenges for followers

**Data Model** (`challenges` collection):
```javascript
{
  id: 'challenge123',
  name: 'Volume King',
  description: 'Who can lift the most weight this week?',
  type: 'volume',  // volume | streak | exercise | frequency
  startDate: '2026-01-01',
  endDate: '2026-01-07',
  status: 'active',  // active | completed | upcoming
  participantCount: 342,
  leaderboard: {
    // Denormalized top 10 for quick display
    top10: [
      { userId: 'abc', displayName: 'BogdanLifts', score: 52000 },
      // ...
    ]
  }
}

// Participants subcollection
challenges/{challengeId}/participants/{userId} = {
  score: 45000,
  rank: 12,
  lastUpdated: '2026-01-03T10:00:00Z'
}
```

**Score Calculation**:
```javascript
// Cloud Function: Runs every hour during active challenges
export const updateChallengeScores = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async () => {
    const activeChallenges = await getActiveChallenges()

    for (const challenge of activeChallenges) {
      const participants = await getParticipants(challenge.id)

      for (const participant of participants) {
        const score = await calculateScore(
          participant.userId,
          challenge.type,
          challenge.startDate,
          challenge.endDate
        )

        await updateParticipantScore(challenge.id, participant.userId, score)
      }

      // Rebuild leaderboard
      await rebuildLeaderboard(challenge.id)
    }
  })
```

**Notification System**:
- **Position changes**: "You moved up to #10 in Volume King! 🎉"
- **Leader overtaken**: "BogdanLifts just passed you in Volume King!"
- **Challenge ending**: "Only 24 hours left in Volume King!"
- **Challenge complete**: "You finished #12 in Volume King!"

**Badges** (stored in user profile):
```javascript
users/{userId}/badges/{badgeId} = {
  type: 'challenge_winner',
  challengeId: 'challenge123',
  challengeName: 'Volume King',
  rank: 1,  // 1st, 2nd, 3rd
  earnedAt: '2026-01-07'
}
```

**i18n Keys**:
```json
{
  "community.challenges.title": "Challenges",
  "community.challenges.active": "Active Challenges",
  "community.challenges.upcoming": "Upcoming",
  "community.challenges.past": "Past Challenges",
  "community.challenges.join": "Join Challenge",
  "community.challenges.leave": "Leave Challenge",
  "community.challenges.yourRank": "Your Rank: #{rank}",
  "community.challenges.timeLeft": "{days}d {hours}h left",
  "community.challenges.winner": "Challenge Winner!",
  "community.challenges.badges": "Challenge Badges"
}
```

---

### Feature 4.2: Achievements & Badges
**Priority**: LOW | **Effort**: MEDIUM | **Version**: V1.1

**User Story**:
> As a user, I want to earn badges for milestones and achievements, so I feel rewarded for my consistency and progress.

**Acceptance Criteria**:
- [ ] Achievement types:
  - **Workout Milestones**: 10, 50, 100, 500, 1000 workouts
  - **Streak Milestones**: 7, 30, 100, 365 day streak
  - **Volume Milestones**: 100k, 500k, 1M, 10M kg total volume
  - **PR Count**: 10, 50, 100 personal records
  - **Social**: 10, 100, 1000 followers
  - **Challenge Wins**: 1st, 2nd, 3rd place in challenges
- [ ] Badge display:
  - User profile: "🏆 Achievements" section
  - Badge grid: 4 columns on desktop, 2 on mobile
  - Badge card: Icon, Name, Description, Date earned
  - Locked badges (not yet earned): Grayed out with progress bar
- [ ] Badge unlock notification:
  - Toast: "🎉 Achievement Unlocked: 100 Workouts!"
  - Confetti animation
  - Option to share to feed: "Share Achievement"
- [ ] Progress tracking:
  - `/community/achievements` page
  - List all achievements with progress:
    - ✅ 100 Workouts (Unlocked Jan 3, 2026)
    - ⏳ 500 Workouts (342/500 - 68%)
    - 🔒 1000 Workouts (0/1000)
  - Sort: Closest to unlock / Alphabetical / Date earned

**Badge Icons** (use lucide-vue-next):
```javascript
const badgeIcons = {
  workoutMilestone: Trophy,
  streakMilestone: Flame,
  volumeMilestone: Weight,
  prCount: TrendingUp,
  socialFollowers: Users,
  challengeWinner: Award
}
```

**Achievement Triggers**:
```javascript
// src/utils/achievementUtils.js
export async function checkAchievements(userId, eventType, eventData) {
  const userStats = await getUserStats(userId)
  const earnedBadges = []

  // Check all achievement criteria
  ACHIEVEMENT_DEFINITIONS.forEach(achievement => {
    if (
      !userStats.badges.includes(achievement.id) &&
      achievement.checkFn(userStats, eventData)
    ) {
      earnedBadges.push(achievement)
    }
  })

  // Award badges and notify
  for (const badge of earnedBadges) {
    await awardBadge(userId, badge)
    await sendNotification(userId, 'achievement_unlocked', badge)
  }

  return earnedBadges
}

// Achievement definitions
const ACHIEVEMENT_DEFINITIONS = [
  {
    id: 'workout_100',
    name: 'Century',
    description: 'Complete 100 workouts',
    icon: 'Trophy',
    checkFn: (stats) => stats.totalWorkouts >= 100
  },
  {
    id: 'streak_30',
    name: 'Dedicated',
    description: '30 day workout streak',
    icon: 'Flame',
    checkFn: (stats) => stats.currentStreak >= 30
  },
  // ... more
]
```

**Cloud Function** (trigger on workout save):
```javascript
export const onWorkoutCreated = functions.firestore
  .document('workouts/{workoutId}')
  .onCreate(async (snap, context) => {
    const workout = snap.data()
    const userId = workout.userId

    // Check for achievements
    await checkAchievements(userId, 'workout_created', workout)
  })
```

**i18n Keys**:
```json
{
  "community.achievements.title": "Achievements",
  "community.achievements.unlocked": "Unlocked",
  "community.achievements.locked": "Locked",
  "community.achievements.progress": "{current}/{total}",
  "community.achievements.share": "Share Achievement",
  "community.achievements.unlockNotification": "Achievement Unlocked: {name}!"
}
```

---

## Section 5: PRIVACY & SAFETY

### Feature 5.1: Privacy Controls ✅
**Priority**: CRITICAL | **Effort**: LOW | **Version**: MVP

**User Story**:
> As a user, I want granular control over who can see my profile and workouts, so I feel safe sharing my fitness journey.

**Acceptance Criteria**:
- [x] Privacy settings page: `/community/settings/privacy`
- [x] Profile visibility:
  - **Public**: Anyone can view profile, follow, see workouts
  - **Friends Only**: Only followers can view profile and workouts (requires approval to follow) - **Note: No approval flow in MVP**
  - **Private**: Profile hidden from search, workouts not shareable
- [x] Individual workout sharing:
  - Override profile setting per workout
  - Options: Public / Followers Only / Private
- [x] Workout data visibility toggles:
  - [x] Show exercise names (always on)
  - [x] Show sets/reps/weight (can hide)
  - [x] Show workout duration (can hide)
  - [x] Show muscle groups (can hide)
- [x] Leaderboard visibility:
  - [x] Show my lifts on leaderboards (default: ON)
  - If disabled, user excluded from all leaderboards
- [x] Discovery settings:
  - [x] Allow others to find me via search (default: ON)
  - [x] Suggest my profile to similar users (default: ON)
- [x] Blocked users list:
  - View all blocked users
  - Unblock button
  - Blocked users cannot:
    - View your profile
    - See your workouts in feed
    - Like/comment on your posts
    - Follow you

**Data Model** (in user profile):
```javascript
users/{uid}/settings/privacy = {
  profileVisibility: 'public',  // public | friends | private
  showSetsRepsWeight: true,
  showDuration: true,
  showMuscleGroups: true,
  allowLeaderboards: true,
  allowSearch: true,
  allowDiscovery: true,
  blockedUsers: ['uid1', 'uid2']  // Array of blocked user IDs
}
```

**UI Design**:
- Toggle switches for boolean settings
- Radio buttons for profile visibility
- Blocked users: List with unblock button
- Confirmation dialogs for critical changes

**i18n Keys**:
```json
{
  "community.privacy.title": "Privacy Settings",
  "community.privacy.profileVisibility": "Profile Visibility",
  "community.privacy.public": "Public",
  "community.privacy.friendsOnly": "Friends Only",
  "community.privacy.private": "Private",
  "community.privacy.showSetsRepsWeight": "Show sets, reps, and weight",
  "community.privacy.showDuration": "Show workout duration",
  "community.privacy.showMuscleGroups": "Show muscle groups",
  "community.privacy.allowLeaderboards": "Show my lifts on leaderboards",
  "community.privacy.allowSearch": "Allow others to find me via search",
  "community.privacy.allowDiscovery": "Suggest my profile to similar users",
  "community.privacy.blockedUsers": "Blocked Users"
}
```

---

### Feature 5.2: Report & Block System ✅
**Priority**: CRITICAL | **Effort**: MEDIUM | **Version**: MVP

**User Story**:
> As a user, I want to report inappropriate content and block abusive users, so I can maintain a safe community experience.

**Acceptance Criteria**:
- [x] Report button:
  - Available on: Posts, Comments, User profiles
  - Icon: Flag (⚐)
  - Opens report modal
- [x] Report modal:
  - Title: "Report this {post/comment/user}"
  - Reason selector (required):
    - Spam or misleading
    - Harassment or bullying
    - Hate speech
    - Inappropriate content
    - Other (text input)
  - Additional details (optional, max 500 chars)
  - "Submit Report" button
  - Confirmation: "Report submitted. We'll review within 24h."
- [x] Block button:
  - Available on: User profiles, Post author dropdown
  - Confirmation: "Block @username? They won't be able to see your profile or interact with you."
  - "Block" (red) / "Cancel" buttons
- [x] Block effects:
  - Blocked user cannot view your profile
  - Blocked user's posts hidden from your feed
  - Blocked user cannot follow you
  - You cannot see blocked user's content
- [x] Unblock:
  - From Privacy Settings → Blocked Users list
  - Confirmation: "Unblock @username?"
- [ ] Admin moderation dashboard (future):
  - View all reports
  - Review flagged content
  - Actions: Dismiss, Warn user, Remove content, Suspend account

**Data Model**:

**Reports** (`reports` collection):
```javascript
{
  id: 'report123',
  type: 'post',  // post | comment | user
  targetId: 'post123',
  targetUserId: 'abc123',  // User being reported
  reportedBy: 'xyz789',    // User submitting report
  reason: 'harassment',
  details: 'User is sending threatening messages',
  createdAt: '2026-01-03T15:00:00Z',
  status: 'pending',  // pending | reviewed | dismissed | action_taken
  reviewedBy: null,   // Admin UID
  reviewedAt: null,
  action: null        // warn | remove_content | suspend_account
}
```

**Blocked Users** (in user profile):
```javascript
users/{uid}/blockedUsers/{blockedUid} = {
  blockedAt: '2026-01-03T15:05:00Z'
}
```

**Security Rules**:
```javascript
// Users can only report as themselves
match /reports/{reportId} {
  allow create: if request.auth.uid == request.resource.data.reportedBy;
  allow read: if request.auth.uid == resource.data.reportedBy
              || isAdmin(request.auth.uid);
}

// Users can only block for themselves
match /users/{uid}/blockedUsers/{blockedUid} {
  allow write: if request.auth.uid == uid;
  allow read: if request.auth.uid == uid;
}
```

**Feed Filtering** (apply blocks):
```javascript
async function getFeedPosts(userId) {
  // Get user's blocked users list
  const blockedUsers = await getBlockedUsers(userId)

  // Query feed, exclude blocked users
  const feedQuery = query(
    collection(db, 'feed'),
    where('userId', 'not-in', blockedUsers),  // Firestore limitation: max 10
    orderBy('createdAt', 'desc'),
    limit(20)
  )

  // Alternative: Filter after fetching (if >10 blocked users)
  const posts = await getDocs(feedQuery)
  return posts.docs.filter(p => !blockedUsers.includes(p.data().userId))
}
```

**i18n Keys**:
```json
{
  "community.report.button": "Report",
  "community.report.title": "Report this {type}",
  "community.report.reason": "Reason",
  "community.report.spam": "Spam or misleading",
  "community.report.harassment": "Harassment or bullying",
  "community.report.hateSpeech": "Hate speech",
  "community.report.inappropriate": "Inappropriate content",
  "community.report.other": "Other",
  "community.report.details": "Additional details (optional)",
  "community.report.submit": "Submit Report",
  "community.report.success": "Report submitted. We'll review within 24h.",
  "community.block.button": "Block User",
  "community.block.confirm": "Block @{username}? They won't be able to see your profile or interact with you.",
  "community.block.success": "User blocked",
  "community.unblock.confirm": "Unblock @{username}?"
}
```

**Content Moderation Strategy** (Future):
- **Automated filters**: Detect spam, hate speech using ML (Cloud Functions + Perspective API)
- **Community moderation**: High-rep users can flag content
- **Admin dashboard**: Review reports, take action
- **Appeal process**: Suspended users can appeal decisions

---

## 4. Technical Architecture

### 4.1 Firestore Data Model

**Collections Overview**:
```
users/{uid}
  ├── profile (public data)
  ├── settings/privacy (private)
  ├── followers/{followerUid}
  ├── following/{followingUid}
  ├── blockedUsers/{blockedUid}
  └── badges/{badgeId}

feed/{postId}
  ├── likes/{userId}
  └── comments/{commentId}

challenges/{challengeId}
  └── participants/{userId}

leaderboards/{exerciseId}_{userId}

reports/{reportId}

notifications/{userId}
  └── items/{notificationId}
```

**Indexes Required**:
```javascript
// Firestore Composite Indexes
[
  { collection: 'feed', fields: ['userId', 'createdAt DESC'] },
  { collection: 'feed', fields: ['visibility', 'createdAt DESC'] },
  { collection: 'leaderboards', fields: ['exerciseId', 'oneRM DESC'] },
  { collection: 'users', fields: ['profile.displayName ASC'] },  // Search
  { collection: 'challenges', fields: ['status', 'endDate DESC'] }
]
```

**Storage Estimates** (1000 active users):
- **Users**: 1K × 5KB = 5MB
- **Feed posts**: 10K posts × 3KB = 30MB
- **Comments**: 50K comments × 500B = 25MB
- **Likes**: 100K likes × 100B = 10MB
- **Total**: ~70MB (well within Firestore free tier: 1GB)

**Read/Write Estimates** (per day):
- **Feed reads**: 1K users × 20 posts = 20K reads
- **Feed writes**: 200 posts/day = 200 writes
- **Like writes**: 1K likes/day = 1K writes
- **Comment writes**: 500 comments/day = 500 writes
- **Total writes**: ~2K/day (free tier: 20K/day)
- **Total reads**: ~20K/day (free tier: 50K/day)

**Cost Projection** (1000 users):
- Firestore: FREE (well under limits)
- Storage (photos): 1K users × 2MB = 2GB ($0.10/mo)
- Bandwidth: Negligible for MVP
- **Total**: ~$0.10/mo (MVP scale)

---

### 4.2 Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isPublicProfile(userId) {
      return get(/databases/$(database)/documents/users/$(userId)/settings/privacy).data.profileVisibility == 'public';
    }

    function isFollowing(userId, targetUserId) {
      return exists(/databases/$(database)/documents/users/$(userId)/following/$(targetUserId));
    }

    function isBlocked(userId, targetUserId) {
      return exists(/databases/$(database)/documents/users/$(userId)/blockedUsers/$(targetUserId));
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated()
                  && (isOwner(userId) || isPublicProfile(userId))
                  && !isBlocked(userId, request.auth.uid);

      allow write: if isOwner(userId);

      // Privacy settings (private)
      match /settings/privacy {
        allow read, write: if isOwner(userId);
      }

      // Followers subcollection
      match /followers/{followerId} {
        allow read: if isAuthenticated();
        allow create: if isAuthenticated() && request.auth.uid == followerId;
        allow delete: if isOwner(followerId);
      }

      // Following subcollection
      match /following/{followingId} {
        allow read: if isAuthenticated();
        allow create, delete: if isOwner(userId);
      }

      // Blocked users (private)
      match /blockedUsers/{blockedUid} {
        allow read, write: if isOwner(userId);
      }
    }

    // Feed collection
    match /feed/{postId} {
      allow read: if isAuthenticated()
                  && !isBlocked(resource.data.userId, request.auth.uid)
                  && (
                    resource.data.visibility == 'public'
                    || isOwner(resource.data.userId)
                    || (resource.data.visibility == 'followers' && isFollowing(request.auth.uid, resource.data.userId))
                  );

      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
      allow update, delete: if isAuthenticated() && isOwner(resource.data.userId);

      // Likes subcollection
      match /likes/{likeId} {
        allow read: if isAuthenticated();
        allow write: if isAuthenticated() && request.auth.uid == likeId;
      }

      // Comments subcollection
      match /comments/{commentId} {
        allow read: if isAuthenticated();
        allow create: if isAuthenticated() && request.auth.uid == request.resource.data.userId;
        allow delete: if isAuthenticated()
                      && (request.auth.uid == resource.data.userId
                          || isOwner(get(/databases/$(database)/documents/feed/$(postId)).data.userId));
      }
    }

    // Leaderboards (public read, system write only)
    match /leaderboards/{entryId} {
      allow read: if isAuthenticated();
      allow write: if false;  // Only Cloud Functions can write
    }

    // Challenges
    match /challenges/{challengeId} {
      allow read: if isAuthenticated();
      allow write: if false;  // Only admins via Cloud Functions

      match /participants/{userId} {
        allow read: if isAuthenticated();
        allow create: if isAuthenticated() && isOwner(userId);
        allow delete: if isOwner(userId);
      }
    }

    // Reports (write-only for users, read for admins)
    match /reports/{reportId} {
      allow create: if isAuthenticated() && request.auth.uid == request.resource.data.reportedBy;
      allow read: if isAdmin(request.auth.uid);  // Define admin check
    }
  }
}
```

---

### 4.3 State Management (Pinia Stores)

**New Stores**:

**1. communityStore.js** (User profiles, follow system)
```javascript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './authStore'

export const useCommunityStore = defineStore('community', () => {
  const authStore = useAuthStore()

  // State
  const userProfile = ref(null)
  const followers = ref([])
  const following = ref([])
  const suggestedUsers = ref([])
  const loading = ref(false)

  // Getters
  const followerCount = computed(() => followers.value.length)
  const followingCount = computed(() => following.value.length)
  const isFollowing = computed(() => (userId) => {
    return following.value.some(f => f.uid === userId)
  })

  // Actions
  async function fetchUserProfile(userId) {
    loading.value = true
    try {
      const profile = await getDoc(doc(db, 'users', userId))
      userProfile.value = profile.data()
    } catch (error) {
      handleError(error, 'Failed to load profile')
    } finally {
      loading.value = false
    }
  }

  async function followUser(userId) {
    try {
      await setDoc(
        doc(db, 'users', authStore.user.uid, 'following', userId),
        { createdAt: serverTimestamp() }
      )
      await setDoc(
        doc(db, 'users', userId, 'followers', authStore.user.uid),
        { createdAt: serverTimestamp() }
      )
      following.value.push({ uid: userId })
    } catch (error) {
      handleError(error, 'Failed to follow user')
    }
  }

  async function unfollowUser(userId) {
    try {
      await deleteDoc(doc(db, 'users', authStore.user.uid, 'following', userId))
      await deleteDoc(doc(db, 'users', userId, 'followers', authStore.user.uid))
      following.value = following.value.filter(f => f.uid !== userId)
    } catch (error) {
      handleError(error, 'Failed to unfollow user')
    }
  }

  return {
    userProfile,
    followers,
    following,
    suggestedUsers,
    loading,
    followerCount,
    followingCount,
    isFollowing,
    fetchUserProfile,
    followUser,
    unfollowUser
  }
})
```

**2. feedStore.js** (Feed posts, likes, comments)
```javascript
export const useFeedStore = defineStore('feed', () => {
  const authStore = useAuthStore()

  // State
  const feedPosts = ref([])
  const hasMore = ref(true)
  const lastVisible = ref(null)
  const loading = ref(false)

  // Actions
  async function fetchFeed(feedType = 'following') {
    loading.value = true
    try {
      const followingIds = await getFollowingIds(authStore.user.uid)

      let feedQuery = query(
        collection(db, 'feed'),
        orderBy('createdAt', 'desc'),
        limit(20)
      )

      if (feedType === 'following') {
        feedQuery = query(feedQuery, where('userId', 'in', followingIds))
      }

      if (lastVisible.value) {
        feedQuery = query(feedQuery, startAfter(lastVisible.value))
      }

      const snapshot = await getDocs(feedQuery)
      const newPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

      feedPosts.value = [...feedPosts.value, ...newPosts]
      lastVisible.value = snapshot.docs[snapshot.docs.length - 1]
      hasMore.value = snapshot.docs.length === 20
    } catch (error) {
      handleError(error, 'Failed to load feed')
    } finally {
      loading.value = false
    }
  }

  async function likePost(postId) {
    const optimisticUpdate = () => {
      const post = feedPosts.value.find(p => p.id === postId)
      if (post) {
        post.likeCount++
        post.isLiked = true
      }
    }

    optimisticUpdate()

    try {
      await setDoc(
        doc(db, 'feed', postId, 'likes', authStore.user.uid),
        { createdAt: serverTimestamp() }
      )
    } catch (error) {
      optimisticUpdate()  // Rollback
      handleError(error, 'Failed to like post')
    }
  }

  async function addComment(postId, text) {
    try {
      await addDoc(collection(db, 'feed', postId, 'comments'), {
        userId: authStore.user.uid,
        text,
        createdAt: serverTimestamp()
      })

      const post = feedPosts.value.find(p => p.id === postId)
      if (post) post.commentCount++
    } catch (error) {
      handleError(error, 'Failed to add comment')
    }
  }

  return {
    feedPosts,
    hasMore,
    loading,
    fetchFeed,
    likePost,
    addComment
  }
})
```

---

### 4.4 Components Structure

```
src/pages/community/
  ├── CommunityView.vue           # Main route (/community)
  │   ├── Feed tabs (Following / Discover / You)
  │   └── Renders FeedList component
  ├── ProfileView.vue             # User profile (/community/@username)
  ├── DiscoverView.vue            # User discovery (/community/discover)
  ├── LeaderboardsView.vue        # Leaderboards (/community/leaderboards)
  ├── ChallengesView.vue          # Challenges (/community/challenges)
  ├── AchievementsView.vue        # Achievements (/community/achievements)
  └── components/
      ├── FeedList.vue            # Feed posts list with infinite scroll
      ├── FeedPostCard.vue        # Individual post card
      ├── ProfileHeader.vue       # Profile header with stats
      ├── FollowButton.vue        # Follow/Unfollow button
      ├── CommentSection.vue      # Comments list + input
      ├── LikeButton.vue          # Like button with count
      ├── ShareWorkoutModal.vue   # Workout sharing modal
      ├── UserCard.vue            # User discovery card
      ├── LeaderboardTable.vue    # Leaderboard display
      ├── ChallengeCard.vue       # Challenge card
      └── BadgeGrid.vue           # Achievement badges grid

src/components/community/       # Shared community components
  ├── ReportModal.vue
  ├── BlockConfirmDialog.vue
  └── PrivacySettings.vue
```

---

### 4.5 Routes Configuration

```javascript
// src/router/index.js
{
  path: '/community',
  component: AppLayout,
  meta: { requiresAuth: true },
  children: [
    {
      path: '',
      name: 'community',
      component: () => import('@/pages/community/CommunityView.vue')
    },
    {
      path: '@:username',
      name: 'profile',
      component: () => import('@/pages/community/ProfileView.vue')
    },
    {
      path: 'discover',
      name: 'community-discover',
      component: () => import('@/pages/community/DiscoverView.vue')
    },
    {
      path: 'leaderboards',
      name: 'leaderboards',
      component: () => import('@/pages/community/LeaderboardsView.vue')
    },
    {
      path: 'leaderboards/:exerciseId',
      name: 'leaderboard-exercise',
      component: () => import('@/pages/community/LeaderboardsView.vue')
    },
    {
      path: 'challenges',
      name: 'challenges',
      component: () => import('@/pages/community/ChallengesView.vue')
    },
    {
      path: 'challenges/:challengeId',
      name: 'challenge-detail',
      component: () => import('@/pages/community/ChallengeDetailView.vue')
    },
    {
      path: 'achievements',
      name: 'achievements',
      component: () => import('@/pages/community/AchievementsView.vue')
    }
  ]
}
```

---

## 5. Success Metrics & KPIs

### 5.1 Engagement Metrics (Primary)

| Metric | MVP Target | V1.1 Target | V1.2 Target |
|--------|-----------|------------|------------|
| **Profile Creation Rate** | 30% of users | 50% | 70% |
| **Weekly Active Users (WAU)** | Baseline | +20% | +40% |
| **Daily Active Users (DAU)** | Baseline | +15% | +30% |
| **Avg Session Duration** | Baseline | +25% | +50% |
| **Feed Engagement Rate** | 50% (like/comment on posts) | 60% | 70% |
| **Workout Sharing Rate** | 10% of workouts shared | 20% | 30% |
| **Follow Rate** | 3 follows/user avg | 5 follows/user | 10 follows/user |

### 5.2 Retention Metrics (Secondary)

| Metric | MVP Target | V1.1 Target | V1.2 Target |
|--------|-----------|------------|------------|
| **7-Day Retention** | Baseline | +10% | +20% |
| **30-Day Retention** | Baseline | +15% | +25% |
| **Churn Rate** | Baseline | -10% | -20% |

### 5.3 Community Health Metrics

| Metric | Target | Monitoring |
|--------|--------|-----------|
| **Report Rate** | <1% of posts | Weekly review |
| **Block Rate** | <2% of users | Weekly review |
| **Avg Comments per Post** | >2 | Daily tracking |
| **Avg Likes per Post** | >10 | Daily tracking |
| **Reply Time** | <24h for 80% of comments | Weekly review |

---

## 6. Privacy & Legal Compliance

### 6.1 GDPR Compliance (EU Users)

**Requirements**:
- ✅ **Consent**: Explicit opt-in for public profile
- ✅ **Right to Access**: Users can download all their data
- ✅ **Right to Deletion**: Users can delete profile and all data
- ✅ **Data Portability**: Export profile, posts, comments as JSON
- ✅ **Transparency**: Clear privacy policy and terms of service

**Implementation**:
```javascript
// src/pages/settings/DataExport.vue
async function exportUserData() {
  const data = {
    profile: await getUserProfile(uid),
    posts: await getUserPosts(uid),
    comments: await getUserComments(uid),
    likes: await getUserLikes(uid),
    following: await getFollowing(uid),
    followers: await getFollowers(uid)
  }

  downloadJSON(data, `obsessed-data-${uid}.json`)
}

// src/pages/settings/DeleteAccount.vue
async function deleteAccount() {
  // 1. Delete all public data
  await deleteUserProfile(uid)
  await deleteUserPosts(uid)
  await deleteUserComments(uid)

  // 2. Keep workout logs (private) unless user explicitly deletes
  // 3. Anonymize data that can't be deleted (e.g., leaderboard entries)

  // 4. Delete Firebase Auth account
  await deleteUser(auth.currentUser)
}
```

### 6.2 Content Moderation Policy

**Prohibited Content**:
- ❌ Hate speech, discrimination, harassment
- ❌ Graphic violence or self-harm
- ❌ Sexual content or nudity
- ❌ Spam, scams, or misleading information
- ❌ Promotion of illegal substances (steroids without prescription)
- ❌ Impersonation or fake accounts

**Enforcement**:
1. **User Reports**: Community flags inappropriate content
2. **Automated Filters**: ML-based detection (Perspective API)
3. **Admin Review**: Manual review of flagged content within 24h
4. **Actions**:
   - Warning: First offense for minor violations
   - Content Removal: Immediate for severe violations
   - Temporary Suspension: 7/30 days for repeat offenses
   - Permanent Ban: Severe or repeated violations

**Appeal Process**:
- Suspended users can appeal via email
- Admin reviews appeal within 7 days
- Decision is final

---

## 7. Implementation Timeline

### Phase 1: MVP (Weeks 1-4) ✅ COMPLETED

**Week 1: Foundation** ✅
- [x] Firestore schema design
- [x] Security rules implementation
- [x] communityStore.js setup
- [x] User profile creation UI
- [x] Privacy settings page

**Week 2: Core Social** ✅
- [x] Follow/Unfollow system
- [x] feedStore.js setup
- [x] Workout sharing modal
- [x] Feed display (Following tab)
- [x] Like button (no UI for likes list yet)

**Week 3: Engagement** ✅
- [x] Comment system (add/delete)
- [x] Report & Block modals
- [x] Profile view page
- [x] Feed pagination (infinite scroll)
- [x] Empty states

**Week 4: Polish & Testing** ✅
- [x] Mobile optimizations
- [x] Performance testing (Firestore query optimization)
- [x] i18n translations (uk/en)
- [x] Bug fixes
- [x] Security rules tested

**MVP Launch Checklist**:
- ✅ Users can create public profiles
- ✅ Users can share workouts to feed
- ✅ Users can follow/unfollow
- ✅ Users can like/comment on posts
- ✅ Privacy controls work correctly
- ✅ Report/Block features functional
- ✅ Security rules tested

---

### Phase 2: V1.1 (Weeks 5-7)

**Week 5: Gamification**
- [ ] Achievements system
- [ ] Badge display on profiles
- [ ] PR feed auto-posting
- [ ] Weekly challenges (system-created)

**Week 6: Discovery**
- [ ] User discovery algorithm
- [ ] Suggested follows UI
- [ ] Exercise leaderboards
- [ ] Search users by name

**Week 7: Notifications**
- [ ] Notification system (Firestore)
- [ ] Push notifications (optional)
- [ ] Email notifications for key events
- [ ] Notification settings page

---

### Phase 3: V1.2 (Weeks 8-11)

**Week 8-9: Groups**
- [ ] Group creation
- [ ] Group feed
- [ ] Group challenges
- [ ] Member management

**Week 10: Messaging**
- [ ] 1-on-1 DMs
- [ ] Chat UI
- [ ] Notification on new message

**Week 11: Advanced Features**
- [ ] Workout templates sharing
- [ ] Mentor/Coach roles
- [ ] Admin moderation dashboard

---

## 8. Open Questions & Decisions Needed

### 8.1 Product Decisions

**Q1: Should we allow video sharing?**
- **Pros**: More engaging content (form checks, celebrations)
- **Cons**: Storage costs, moderation complexity
- **Decision**: ❓ Defer to V2, start with text + stats only

**Q2: Monetization strategy for Community?**
- **Option A**: Premium profiles ($2/mo) with extra features (custom badges, analytics)
- **Option B**: No monetization, keep it free
- **Option C**: Coach/Trainer subscriptions (charge for DMs, custom programs)
- **Decision**: ❓ Needs user research

**Q3: Notification frequency limits?**
- **Problem**: Users might get spammed if they have many followers
- **Options**:
  - Batch notifications (hourly digest)
  - Rate limit per user (max 10 notifications/day)
  - User-configurable frequency
- **Decision**: ❓ Start with batching, add granular controls later

### 8.2 Technical Decisions

**Q4: Feed algorithm for Discover tab?**
- **Option A**: Chronological (simple, transparent)
- **Option B**: Engagement-based (likes + comments score)
- **Option C**: ML-based recommendations (complex, requires data)
- **Decision**: ✅ Start with A (chronological), iterate to B in V1.1

**Q5: Real-time updates vs polling?**
- **Real-time**: Firestore onSnapshot (expensive, always fresh)
- **Polling**: Fetch every 30s (cheaper, slight delay)
- **Decision**: ✅ Polling for feed, real-time for notifications

**Q6: Image storage optimization?**
- **Problem**: Profile photos can bloat storage costs
- **Options**:
  - Lazy resize on upload (Firebase Extensions)
  - CDN with auto-optimization (Cloudflare/Imgix)
  - Restrict size (max 500KB)
- **Decision**: ✅ Use Firebase Extensions (Resize Images) + 2MB limit

---

## 9. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|------------|-----------|
| **Low Engagement** (users don't share workouts) | HIGH | MEDIUM | Onboarding prompts, achievement rewards for sharing |
| **Toxic Community** (harassment, trolling) | HIGH | MEDIUM | Strong moderation tools, clear guidelines, quick bans |
| **Privacy Backlash** (users uncomfortable with public data) | MEDIUM | LOW | Granular privacy controls, opt-in by default |
| **Firebase Costs** (unexpectedly high usage) | MEDIUM | LOW | Query optimization, caching, pagination limits |
| **Spam/Bots** (fake accounts flooding feed) | HIGH | MEDIUM | Email verification, CAPTCHA on signup, rate limiting |
| **Competitor Copying** (other apps steal features) | LOW | HIGH | Move fast, focus on UX quality over features |
| **Legal Issues** (GDPR violations, user data breach) | HIGH | LOW | Compliance audit, security reviews, encryption |

---

## 10. Appendix

### 10.1 Wireframes & UI Mockups

**To be added**: Figma links for:
- Community Feed (mobile)
- User Profile Page
- Workout Sharing Modal
- Leaderboards
- Challenges

### 10.2 i18n Translation Files

**File structure**:
```
src/i18n/locales/
  ├── uk/community.json
  └── en/community.json
```

**Sample keys** (see inline sections above for full list):
```json
{
  "community": {
    "feed": {
      "title": "Стрічка",
      "following": "Підписки",
      "discover": "Цікаве",
      "you": "Ви"
    },
    "profile": {
      "followers": "Підписники",
      "following": "Підписки",
      "workouts": "Тренування"
    }
  }
}
```

### 10.3 Firebase Config Updates

**Add to `firestore.indexes.json`**:
```json
{
  "indexes": [
    {
      "collectionGroup": "feed",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "leaderboards",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "exerciseId", "order": "ASCENDING" },
        { "fieldPath": "stats.oneRM", "order": "DESCENDING" }
      ]
    }
  ]
}
```

**Add to `firestore.rules`**: See Section 4.2 above

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-03 | Claude (Product Owner) | Initial PRD creation |
| 1.1 | TBD | TBD | Post-MVP feedback iteration |

---

**End of PRD**

This document is a living specification and will be updated as we learn from user feedback and iterate on features. All stakeholders should refer to this document for scope, priorities, and implementation details.

For questions or suggestions, please discuss in the team Slack channel or open a GitHub issue.
