# Circulum — Product Roadmap

## V1 → MVP (Current Build)

**Goal:** Dominate one university. Prove the loop.

**Core loop:**
> Student joins → Verifies email → Picks communities → Reads feed → Posts anonymously → Gets upvoted → Comments on others → DMs someone → Comes back tomorrow

### V1 Deliverables (This Build)

- [x] University email verification with domain allowlist
- [x] Anonymous pseudonym identity (handle)
- [x] Campus feed + community feeds (Hot / New / Top)
- [x] Post categories: General, Study, Meme, Event, Buy/Sell, Lost & Found
- [x] Upvote / downvote with Wilson score-based hot ranking
- [x] Time-decayed hot score (background recalculation every 5 minutes)
- [x] Threaded comments (single level deep)
- [x] Campus, Major, and Course communities
- [x] Community join/leave
- [x] Anonymous DMs with accept/decline request flow
- [x] Real-time messaging via WebSockets (Socket.IO)
- [x] In-app notifications (comment replies, new messages, vote milestones)
- [x] Email notifications (verification, password reset, moderation)
- [x] Report system (post / comment / message / user)
- [x] Moderation dashboard (warn / remove / suspend / ban)
- [x] Rate limiting on sensitive endpoints
- [x] JWT auth with refresh token rotation
- [x] Docker Compose deployment setup

---

## V1.1 — Retention & Polish

**Timeline:** 2-4 weeks post-launch

**Priority:** Reduce friction, increase daily return rate

### Features
- [ ] **Push notifications** via Expo Push Notifications or Firebase FCM
  - Replace in-app polling with push for DMs and comment replies
- [ ] **Image upload** to posts via S3/R2
  - Compress on-device before upload
  - Maximum 4 images per post
- [ ] **Anonymous identity persistence**
  - Allow users to maintain conversation handles (e.g., "Person A" in each thread)
- [ ] **Saved/bookmarked posts**
  - Private bookmarks, not visible to others
- [ ] **Post search**
  - Full-text search within university posts
  - Filter by category and community
- [ ] **Deep links**
  - `circulum://post/:id`, `circulum://community/:id`
  - Share post links to other apps
- [ ] **Admin web dashboard**
  - Simple React web panel for moderation (not mobile)
  - Fast review of flagged content queue

### Technical
- [ ] **Redis feed cache**
  - Cache hot feed pages per university (TTL: 2 minutes)
  - Invalidate on new posts
- [ ] **Full-text search** with PostgreSQL `tsvector` or Meilisearch
- [ ] **Structured logging** (Pino) + Sentry error tracking
- [ ] **Database connection pooling** (PgBouncer)

---

## V1.2 — Growth & Virality

**Timeline:** 4-8 weeks post-launch

**Priority:** Drive organic campus word-of-mouth

### Features
- [ ] **Anonymous verification badges**
  - "Verified student" badge on all posts (already in V1)
  - "Course X student" badge when posting in course community
- [ ] **Weekly campus digest**
  - Email: Top 5 posts from your communities this week
  - In-app banner: "This week's top posts"
- [ ] **Course discovery during onboarding**
  - After registration, suggest communities based on enrolled courses
  - Auto-join course communities
- [ ] **Anonymous AMAs**
  - Faculty/TAs can create AMA posts with verified "Staff" badge
  - Students ask questions anonymously
- [ ] **Campus events board**
  - Event posts with date/time metadata
  - "Interested" counter (non-identifying)
- [ ] **Trending posts widget**
  - Home screen "Trending now" section showing 3 top posts

### Technical
- [ ] **App Store submission**
  - Apple App Store + Google Play Store
  - Production EAS builds
- [ ] **Onboarding analytics**
  - Track funnel: download → register → verify → first post
  - Identify drop-off points
- [ ] **A/B test framework hooks** (Statsig / GrowthBook)

---

## V2 — Multi-University Expansion

**Timeline:** 2-3 months post product-market fit signal

**Trigger:** >500 DAU + >60% D7 retention at first university

### Features
- [ ] **Multi-university support**
  - Verified roll-out process for new universities
  - University admin panel for community setup
  - Domain allowlist management
- [ ] **Cross-university discovery** (future phase)
  - Anonymous inter-campus communities for shared topics
- [ ] **Group chat** (bounded communities)
  - Course group chats with size limit
  - No DM group creation initially
- [ ] **AI moderation assist**
  - Toxicity pre-filtering before post goes live
  - Auto-flag high-probability harassment for review
  - LLM-assisted report triage
- [ ] **Reputation / karma system**
  - Karma levels unlock posting privileges
  - Karma used for prioritized listings in Buy/Sell
- [ ] **Anonymous polls**
  - Add poll option to posts
  - Results visible only after voting

### Infrastructure
- [ ] **Kubernetes deployment**
  - Separate API, WebSocket, and worker services
  - Horizontal pod autoscaling
- [ ] **Multi-region data residency**
  - Per-university data isolation
  - Regional database replicas
- [ ] **CDN for media**
  - CloudFront / Cloudflare R2 for image delivery
- [ ] **Elasticsearch** for full-text search at scale

---

## V3 — Platform & Monetization

**Timeline:** 6-12 months

**Goal:** Sustainable unit economics, campus brand presence

### Features
- [ ] **Campus verified pages**
  - Official student societies, clubs, newspapers can claim a verified page
  - Still anonymous — "posted by CS Society" not individual names
- [ ] **Anonymous classifieds**
  - Structured Buy/Sell with price, category, condition metadata
  - "Sold" marking
- [ ] **Academic tools**
  - Study group coordination within course communities
  - Exam schedule aggregation
  - Resource sharing (PDFs, notes — with copyright controls)
- [ ] **Sponsored content**
  - Campus-targeted anonymous ads
  - Local business promotions
  - University-approved sponsorships

---

## Success Metrics

### MVP (V1) Targets — Week 4 after launch

| Metric | Target |
|--------|--------|
| Registered users | 500+ |
| Verified users | 300+ |
| Daily Active Users | 150+ |
| Posts per day | 30+ |
| D7 retention | >35% |
| Avg session length | >4 minutes |
| DM conversations started | 50+ total |

### Growth Target — Month 3

| Metric | Target |
|--------|--------|
| Registered users | 2,500+ |
| DAU | 600+ |
| D30 retention | >25% |
| Posts per day | 150+ |
| Communities with daily posts | 10+ |

---

## Non-Goals (Permanent)

These will never be part of Circulum's core:

- Real-name identity (defeats the product thesis)
- Public follower/following social graph
- Algorithmic content recommendation beyond feed ranking
- Verified real-world profiles
- Cross-posting to other platforms
- Direct advertiser access to anonymous user data
