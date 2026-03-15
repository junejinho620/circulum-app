# Circulum — Architecture Document

## Overview

Circulum is a verified anonymous campus social network. The MVP is architected as a
**modular monolith** backend + **React Native** mobile client, designed to scale to
a microservice architecture if needed after initial traction.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                │
│                                                                 │
│   ┌─────────────────┐          ┌─────────────────┐             │
│   │  React Native   │          │  Web (future)   │             │
│   │  (iOS/Android)  │          │                 │             │
│   └────────┬────────┘          └────────┬────────┘             │
│            │                            │                       │
└────────────┼────────────────────────────┼───────────────────────┘
             │                            │
             ▼ REST + WebSocket           ▼ REST + WebSocket
┌─────────────────────────────────────────────────────────────────┐
│                       API GATEWAY / CDN                         │
│                    (Nginx / Cloudflare)                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CIRCULUM BACKEND API                         │
│                (NestJS + Fastify — Port 3000)                   │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │   Auth   │  │  Posts   │  │  Msgs    │  │ Moderation   │   │
│  │ Module   │  │  +Feed   │  │ +WS GW   │  │   Module     │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Univs    │  │Comments  │  │  Notifs  │  │ Communities  │   │
│  │ +Courses │  │  +Votes  │  │  Module  │  │   Module     │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Background Jobs                       │   │
│  │    • Hot score recalculation (every 5 minutes)           │   │
│  │    • Email queue processing                              │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────┬─────────────────┬─────────────────────┘
                          │                 │
              ┌───────────▼───┐      ┌─────▼──────┐
              │  PostgreSQL   │      │   Redis     │
              │  (TypeORM)    │      │  (Cache,    │
              │               │      │  Sessions,  │
              │               │      │  Pub/Sub)   │
              └───────────────┘      └────────────┘
```

---

## Backend Module Map

```
src/
├── main.ts                    # Fastify bootstrap
├── app.module.ts              # Root module
├── config/
│   └── app.config.ts          # Config factory functions
├── common/
│   ├── guards/                # JwtAuthGuard, RolesGuard
│   ├── interceptors/          # TransformInterceptor (wrap all responses)
│   ├── filters/               # HttpExceptionFilter
│   └── decorators/            # @CurrentUser, @Public, @Roles
├── database/
│   ├── entities/              # 16 TypeORM entities
│   ├── migrations/            # Schema migrations
│   ├── seeds/                 # Initial data (universities, courses)
│   └── data-source.ts         # TypeORM DataSource for CLI
└── modules/
    ├── auth/                  # Registration, verification, JWT, refresh
    ├── users/                 # User read operations
    ├── universities/          # Universities, majors, courses, enrollment
    ├── communities/           # Campus/major/course communities
    ├── posts/                 # CRUD + feed retrieval
    ├── comments/              # Threaded comments
    ├── votes/                 # Upvote/downvote with Wilson score
    ├── feed/                  # Background hot score updater (cron)
    ├── messages/              # Conversations, messages, WebSocket gateway
    ├── notifications/         # In-app notifications + email service
    └── moderation/            # Reports, admin actions, content removal
```

---

## Database Schema

### Core Entities

| Table | Key Fields |
|-------|-----------|
| `universities` | id, name, emailDomain, country, city |
| `users` | id, email (private), passwordHash, handle (public), universityId, role, status |
| `majors` | id, name, code, universityId |
| `courses` | id, code, name, department, universityId |
| `user_courses` | userId, courseId (junction) |
| `communities` | id, name, slug, type(campus/major/course), universityId |
| `community_members` | userId, communityId (junction) |
| `posts` | id, title, body, category, hotScore, upvotes, downvotes, authorId, communityId |
| `comments` | id, body, parentId (self-ref), postId, authorId |
| `votes` | id, value(+1/-1), userId, postId OR commentId |
| `conversations` | id, status(pending/active), lastMessageAt |
| `conversation_participants` | conversationId, userId, role, unreadCount, hasBlocked |
| `messages` | id, body, senderId, conversationId |
| `notifications` | id, type, payload(jsonb), isRead, userId |
| `reports` | id, type, reason, status, reporterId, postId/commentId/userId |
| `moderation_actions` | id, type, reason, targetUserId, moderatorId |

### Key Indexes

- `posts(communityId, hotScore)` — hot feed per community
- `posts(universityId, createdAt)` — campus feed
- `notifications(userId, isRead, createdAt)` — notification polling
- `messages(conversationId, createdAt)` — conversation history
- `votes(userId, postId)`, `votes(userId, commentId)` — prevent double-voting

---

## Feed Ranking Algorithm

### Hot Score (Wilson Lower Bound + Time Decay)

```
hotScore = wilsonLowerBound(upvotes, total) / (ageHours + 2)^gravity
```

Where:
- `wilsonLowerBound` = 95% confidence lower bound on upvote ratio
- `gravity` = 1.8 (higher = faster decay)
- Scores are recalculated every 5 minutes by background cron
- Only posts from last 48 hours are recalculated (older posts already decayed to near zero)

### Sort Modes
- **Hot**: ORDER BY `hotScore DESC` — Wilson score with time decay
- **New**: ORDER BY `createdAt DESC` — pure chronological
- **Top**: ORDER BY `(upvotes - downvotes) DESC` — net score, no decay

---

## Authentication Flow

```
Register → Validate email domain → Hash password → Send verification email
    ↓
Verify email (24h token) → Account activated
    ↓
Login → Compare hash → Issue JWT (15m) + Refresh token (7d, hashed in DB)
    ↓
Request with JWT → JwtStrategy validates → Inject user into request
    ↓
JWT expires → Frontend calls /auth/refresh → New token pair issued
    ↓
Logout → Clear refreshTokenHash → Force re-login
```

**Security notes:**
- Passwords hashed with bcrypt (cost 12)
- Refresh tokens hashed with bcrypt (cost 10) before storage
- Never return password hashes, email verification tokens, or refresh token hashes in responses
- Domain allowlist enforced at registration time
- Email enumeration prevented in forgot-password endpoint

---

## Anonymous Messaging Architecture

```
User A (PostCard) → "DM" button
    ↓
POST /conversations/initiate { recipientId, initialMessage, fromPostId }
    ↓
Conversation created (status: PENDING)
Initial message stored
Notification sent to User B
    ↓
User B sees request in Inbox → PATCH /conversations/:id/accept
    ↓
Conversation status → ACTIVE
Both users can now exchange messages via REST or WebSocket
```

**WebSocket Events:**
- `join_conversation` — join a Socket.IO room for a conversation
- `send_message` — send a message via WS (updates all clients in room)
- `new_message` — pushed to all room participants
- `typing` — typing indicators
- `notification` — real-time notification delivery to user's personal room

---

## Security Architecture

| Layer | Protection |
|-------|-----------|
| Transport | HTTPS (Nginx TLS termination) |
| Auth | JWT access (15m) + refresh (7d), bcrypt passwords |
| Domain validation | Email domain checked against university allowlist |
| Rate limiting | NestJS ThrottlerModule (100 req / 60s per IP) |
| Anonymous identity | Handle never linked to email in any API response |
| RBAC | student / moderator / admin roles enforced via RolesGuard |
| Account states | pending_verification → active → warned → suspended → banned |
| Content | Report system → moderation queue → admin action |

---

## Moderation Flow

```
User reports content → Report stored (status: PENDING)
    ↓
Moderator reviews GET /moderation/reports
    ↓
Moderator takes action POST /moderation/actions
    ↓
Action applied:
  WARN         → UserStatus.WARNED
  REMOVE       → Content status = 'removed'
  SUSPEND      → UserStatus.SUSPENDED + suspendedUntil date
  BAN          → UserStatus.BANNED + refresh token cleared
    ↓
Target user notified (in-app + email)
Report resolved
```

---

## Deployment Architecture

### MVP (Single Server)

```
Hetzner CPX41 / DigitalOcean 8GB Droplet
├── Nginx (reverse proxy, TLS, rate limiting)
├── Docker containers:
│   ├── circulum_api (NestJS)
│   ├── circulum_db (PostgreSQL 16)
│   └── circulum_redis (Redis 7)
└── Let's Encrypt SSL (Certbot)
```

### Scaling Path (V2+)

```
Cloudflare CDN
    ↓
Load Balancer
    ↓
Multiple API instances (horizontal scaling)
    ↓
PostgreSQL (primary + read replica)
Redis Cluster
Object Storage (S3 / R2 for media uploads)
```

---

## API Endpoint Summary

### Auth
- `POST /auth/register` — Register with university email
- `POST /auth/verify-email` — Verify email token
- `POST /auth/login` — Login, get tokens
- `POST /auth/refresh` — Refresh access token
- `POST /auth/logout` — Invalidate refresh token
- `GET /auth/me` — Get current user profile

### Universities
- `GET /universities` — List all (public)
- `GET /universities/:id/majors` — List majors
- `GET /universities/:id/courses?q=` — Search courses
- `POST /universities/me/courses` — Enroll in course
- `DELETE /universities/me/courses/:id` — Unenroll
- `POST /universities/me/major` — Set major

### Posts & Feed
- `GET /posts/feed/personalized` — Joined community feed
- `GET /posts/feed` — Campus-wide feed
- `GET /posts/community/:id` — Community-specific feed
- `POST /posts` — Create post
- `GET /posts/:id` — Post detail
- `DELETE /posts/:id` — Soft-delete own post

### Comments
- `GET /posts/:id/comments` — Get comments (threaded)
- `POST /posts/:id/comments` — Add comment/reply
- `DELETE /posts/:id/comments/:commentId` — Delete own comment

### Votes
- `POST /votes` — Vote on post or comment (+1/-1, toggleable)

### Communities
- `GET /communities` — List all campus communities
- `GET /communities/my` — Joined communities
- `POST /communities/:id/join` — Join
- `DELETE /communities/:id/leave` — Leave

### Messaging
- `GET /conversations` — Conversation list
- `POST /conversations/initiate` — Start a DM
- `PATCH /conversations/:id/accept` — Accept DM request
- `GET /conversations/:id/messages` — Message history
- `POST /conversations/:id/messages` — Send message (REST)
- `PATCH /conversations/:id/block` — Block conversation
- `DELETE /conversations/:id` — Delete from inbox

### Notifications
- `GET /notifications` — List notifications
- `GET /notifications/unread-count` — Unread count
- `PATCH /notifications/:id/read` — Mark one read
- `PATCH /notifications/mark-all-read` — Mark all read

### Moderation
- `POST /moderation/reports` — Report content (any user)
- `GET /moderation/reports` — Review queue (mod/admin)
- `POST /moderation/actions` — Take action (mod/admin)
- `PATCH /moderation/reports/:id/dismiss` — Dismiss (mod/admin)
- `GET /moderation/stats` — Platform stats (admin)

---

## State Management (Mobile)

| Layer | Technology |
|-------|-----------|
| Auth state | Zustand (`useAuthStore`) |
| Notification count | Zustand (`useNotificationsStore`) |
| Server state / cache | TanStack Query (react-query) |
| Token persistence | Expo SecureStore (encrypted) |
| Real-time | Socket.IO client (`socketService` singleton) |

**Pattern:**
- Zustand stores handle authentication and global UI state
- React Query handles all server data fetching, caching, and mutation
- React Query's `useInfiniteQuery` drives virtualized feed lists
- Socket.IO service is a singleton that injects events into React Query cache or Zustand

---

## Mobile Screen Hierarchy

```
App
├── (auth)/
│   ├── welcome.tsx          — Landing with value props
│   ├── register.tsx         — 4-step onboarding: University → Email → Handle → Verify
│   └── login.tsx            — Login screen
│
└── (tabs)/
    ├── feed.tsx             — Personalized feed (Hot/New/Top)
    ├── communities.tsx      — Discover + joined communities
    ├── create.tsx           — Create post (category, community, title, body)
    ├── inbox.tsx            — Conversation list
    ├── profile.tsx          — Profile, stats, settings
    │
    ├── /post/[id].tsx       — Post detail + comments + vote
    ├── /community/[id].tsx  — Community feed
    └── /conversation/[id].tsx — Chat screen with accept/decline
```
