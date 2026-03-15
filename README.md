# Circulum

**Verified anonymous campus social network for university students.**

---

## Project Structure

```
circulum-app/
├── backend/          # NestJS API (Fastify + PostgreSQL + Redis + WebSockets)
├── mobile/           # React Native app (Expo + Zustand + React Query)
├── docs/             # Architecture docs and roadmap
├── docker-compose.yml
└── .env.example
```

## Quick Start

### Prerequisites
- Docker + Docker Compose
- Node.js 20+
- Expo CLI (`npm install -g expo-cli`)

### 1. Clone and configure

```bash
git clone https://github.com/your-org/circulum.git
cd circulum-app

# Configure environment
cp .env.example .env
# Edit .env with your JWT secrets and SMTP credentials
```

### 2. Start infrastructure + backend

```bash
# Start PostgreSQL, Redis, and API
docker-compose up -d

# Wait for DB to be ready, then seed initial data
docker-compose exec backend npm run seed
```

### 3. Start the mobile app

```bash
cd mobile
cp .env.example .env
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press `i`/`a` to open in simulator.

---

## Development

### Backend

```bash
cd backend
npm install
cp .env.example .env  # Configure

# Development (hot reload)
npm run start:dev

# Run migrations
npm run migration:run

# Seed database
npm run seed
```

### Mobile

```bash
cd mobile
npm install

# Start with Expo
npx expo start

# Build for production
eas build --platform ios
eas build --platform android
```

---

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full system design including:
- Database schema
- API endpoints
- Feed ranking algorithm
- Authentication flow
- Moderation system
- Deployment setup

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for V1 → V2 → V3 evolution plan.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native + Expo |
| State | Zustand + TanStack Query |
| Backend | NestJS + Fastify |
| Database | PostgreSQL 16 + TypeORM |
| Cache | Redis 7 |
| Real-time | Socket.IO (WebSockets) |
| Auth | JWT (15m access) + bcrypt refresh tokens |
| Email | Nodemailer (SMTP) |
| Deploy | Docker Compose → Kubernetes (V2) |

---

## Security

- University email domain allowlist at registration
- Anonymous identity — real email never exposed publicly
- All tokens hashed before storage
- Rate limiting on auth endpoints
- Role-based access control (student / moderator / admin)
- Report + moderation system with account suspension/ban flows

## License

MIT
