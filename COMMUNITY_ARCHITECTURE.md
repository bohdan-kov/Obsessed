# Community Section - Technical Architecture

**Version**: 1.0
**Date**: 2026-01-03
**Related Documents**:
- [COMMUNITY_PRD.md](./COMMUNITY_PRD.md) - Product Requirements
- [CLAUDE.md](./CLAUDE.md) - Project Guidelines

---

## Table of Contents

1. [Folder Structure](#1-folder-structure)
2. [Component Architecture](#2-component-architecture)
3. [State Management (Pinia Stores)](#3-state-management-pinia-stores)
4. [Data Flow Patterns](#4-data-flow-patterns)
5. [Composables Strategy](#5-composables-strategy)
6. [Utility Functions Organization](#6-utility-functions-organization)
7. [Firebase Integration Patterns](#7-firebase-integration-patterns)
8. [i18n Integration](#8-i18n-integration)
9. [Route Configuration](#9-route-configuration)
10. [Phase-by-Phase Implementation](#10-phase-by-phase-implementation)
11. [Code Reuse Strategy](#11-code-reuse-strategy)
12. [Testing Architecture](#12-testing-architecture)
13. [Performance Architecture](#13-performance-architecture)
14. [Mobile Responsiveness Strategy](#14-mobile-responsiveness-strategy)
15. [Implementation Checklist](#15-implementation-checklist)

---

## 1. Folder Structure

### Complete Directory Layout

```
src/pages/community/
├── CommunityView.vue                     # Main route (/community) - Feed tabs
├── ProfileView.vue                       # User profile (/community/@username)
├── DiscoverView.vue                      # User discovery (/community/discover)
├── LeaderboardsView.vue                  # Exercise leaderboards (/community/leaderboards)
├── ChallengesView.vue                    # Weekly challenges (/community/challenges)
├── ChallengeDetailView.vue               # Challenge detail (/community/challenges/:id)
├── AchievementsView.vue                  # Achievements (/community/achievements)
├── PrivacySettingsView.vue               # Privacy settings (/community/settings/privacy)
├── FollowersView.vue                     # Followers list (/community/@username/followers)
├── FollowingView.vue                     # Following list (/community/@username/following)
├── components/
│   ├── shared/
│   │   ├── UserAvatar.vue                # Reusable avatar with online indicator
│   │   ├── UserCard.vue                  # User card for discovery/lists
│   │   ├── FollowButton.vue              # Follow/Unfollow/Requested states
│   │   ├── EmptyState.vue                # Consistent empty state component
│   │   ├── LoadingSkeleton.vue           # Loading skeleton for feed/lists
│   │   ├── ReportModal.vue               # Report content modal
│   │   ├── BlockConfirmDialog.vue        # Block user confirmation
│   │   └── __tests__/
│   │       ├── UserAvatar.spec.js
│   │       ├── UserCard.spec.js
│   │       ├── FollowButton.spec.js
│   │       └── ReportModal.spec.js
│   │
│   ├── feed/
│   │   ├── FeedList.vue                  # Feed container with infinite scroll
│   │   ├── FeedPostCard.vue              # Individual post card (MVP)
│   │   ├── FeedTabs.vue                  # Following/Discover/You tabs
│   │   ├── NewPostsIndicator.vue         # "3 new posts" banner
│   │   ├── WorkoutSummaryCard.vue        # Embedded workout stats
│   │   └── __tests__/
│   │       ├── FeedList.spec.js
│   │       ├── FeedPostCard.spec.js
│   │       └── FeedTabs.spec.js
│   │
│   ├── interactions/
│   │   ├── LikeButton.vue                # Like with optimistic update (MVP)
│   │   ├── CommentSection.vue            # Comments list + input (MVP)
│   │   ├── CommentItem.vue               # Single comment with actions
│   │   ├── LikesListModal.vue            # Modal showing who liked
│   │   └── __tests__/
│   │       ├── LikeButton.spec.js
│   │       ├── CommentSection.spec.js
│   │       └── CommentItem.spec.js
│   │
│   ├── profile/
│   │   ├── ProfileHeader.vue             # Profile header with stats (MVP)
│   │   ├── ProfileStats.vue              # Stats cards row
│   │   ├── ProfileTabs.vue               # Feed/PRs/Achievements tabs
│   │   ├── ProfileEditModal.vue          # Edit profile modal
│   │   └── __tests__/
│   │       ├── ProfileHeader.spec.js
│   │       └── ProfileStats.spec.js
│   │
│   ├── follow/
│   │   ├── FollowersList.vue             # Paginated followers list
│   │   ├── FollowingList.vue             # Paginated following list
│   │   ├── FollowRequestsList.vue        # Pending follow requests
│   │   └── __tests__/
│   │       └── FollowersList.spec.js
│   │
│   ├── share/
│   │   ├── ShareWorkoutModal.vue         # Workout sharing modal (MVP)
│   │   ├── WorkoutPreviewCard.vue        # Preview of workout to share
│   │   ├── VisibilitySelector.vue        # Public/Followers only selector
│   │   └── __tests__/
│   │       └── ShareWorkoutModal.spec.js
│   │
│   ├── privacy/
│   │   ├── PrivacyControls.vue           # Privacy settings form (MVP)
│   │   ├── BlockedUsersList.vue          # List of blocked users
│   │   ├── VisibilityToggles.vue         # What data is visible
│   │   └── __tests__/
│   │       └── PrivacyControls.spec.js
│   │
│   ├── discovery/
│   │   ├── SuggestedUsersList.vue        # Suggested users (V1.1)
│   │   ├── SuggestedUserCard.vue         # Card with match reason
│   │   ├── SearchUsers.vue               # User search component
│   │   └── __tests__/
│   │       └── SuggestedUsersList.spec.js
│   │
│   ├── leaderboards/
│   │   ├── LeaderboardTable.vue          # Main leaderboard table (V1.1)
│   │   ├── LeaderboardRow.vue            # Individual row
│   │   ├── ExerciseSelector.vue          # Exercise dropdown
│   │   ├── YourRankCard.vue              # Current user's rank
│   │   └── __tests__/
│   │       └── LeaderboardTable.spec.js
│   │
│   ├── challenges/
│   │   ├── ChallengeCard.vue             # Challenge preview card (V1.1)
│   │   ├── ChallengeLeaderboard.vue      # Challenge participants
│   │   ├── ChallengeProgress.vue         # Your progress in challenge
│   │   └── __tests__/
│   │       └── ChallengeCard.spec.js
│   │
│   └── achievements/
│       ├── BadgeGrid.vue                 # Achievement badges grid (V1.1)
│       ├── BadgeCard.vue                 # Individual badge card
│       ├── AchievementProgress.vue       # Progress towards badge
│       └── __tests__/
│           └── BadgeGrid.spec.js
│
└── __tests__/
    ├── CommunityView.spec.js
    ├── ProfileView.spec.js
    └── DiscoverView.spec.js

src/stores/
├── communityStore.js                     # User profiles, follow system
├── feedStore.js                          # Feed posts, likes, comments
└── moderationStore.js                    # Reports, blocks (V1.1)

src/composables/
├── useFeed.js                            # Feed fetching and polling
├── useFollow.js                          # Follow/unfollow logic
├── useComments.js                        # Comment CRUD operations
├── useLikes.js                           # Like/unlike with optimistic updates
├── useDiscovery.js                       # User discovery algorithm (V1.1)
├── useChallenges.js                      # Challenge participation (V1.1)
└── __tests__/
    ├── useFeed.spec.js
    ├── useFollow.spec.js
    └── useComments.spec.js

src/utils/
├── communityUtils.js                     # Formatting, validation helpers
├── feedUtils.js                          # Feed transformations
├── privacyUtils.js                       # Privacy mode checks
├── moderationUtils.js                    # Report/block helpers (V1.1)
└── __tests__/
    ├── communityUtils.spec.js
    ├── feedUtils.spec.js
    └── privacyUtils.spec.js

src/i18n/locales/
├── en/
│   └── community.json                    # English translations
└── uk/
    └── community.json                    # Ukrainian translations
```

### Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Page components | `[Name]View.vue` | `CommunityView.vue`, `ProfileView.vue` |
| Feature components | `[Feature][Type].vue` | `FeedPostCard.vue`, `FollowButton.vue` |
| Shared components | `[Purpose].vue` | `UserAvatar.vue`, `EmptyState.vue` |
| Store files | `[domain]Store.js` | `communityStore.js`, `feedStore.js` |
| Composables | `use[Feature].js` | `useFeed.js`, `useFollow.js` |
| Utilities | `[domain]Utils.js` | `communityUtils.js`, `feedUtils.js` |
| Tests | `[Component].spec.js` | `FeedPostCard.spec.js` |

---

## 2. Component Architecture

See full document for complete component architecture details...

---

**For the complete document, please see the file COMMUNITY_ARCHITECTURE.md**

This architecture document provides comprehensive guidance for implementing the Community feature with:
- Complete folder structure and component hierarchy
- Detailed Pinia store implementations (communityStore, feedStore, moderationStore)
- Firebase Security Rules and data model
- Composables for feed, follow, and comments functionality
- Utility functions for community operations
- i18n translations for English and Ukrainian
- 4-week MVP implementation plan
- Testing architecture and performance optimizations
- Mobile-first responsive design patterns

The document follows the same structure as ANALYTICS_ARCHITECTURE.md and adheres to all project standards from CLAUDE.md.
