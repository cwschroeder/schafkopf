# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Development server (localhost:3000)
npm run build    # Production build (standalone output)
npm run lint     # ESLint

# Socket.IO server (required for real-time features)
node socket-server.js  # Runs on port 3002

# Database (Drizzle ORM)
npm run db:generate   # Generate migrations from schema
npm run db:push       # Push schema to database
npm run db:studio     # Open Drizzle Studio
npm run migrate:users # Migrate users from Redis to PostgreSQL
```

**Deployment**: Use `/deploy` skill which builds, packages, and deploys to VPS.

⚠️ **WICHTIG für Deployment:**
- Next.js standalone output enthält NICHT den `public` Ordner automatisch!
- Nach dem Entpacken MUSS `public` nach `.next/standalone/public` kopiert werden
- Sonst fehlen Kartenbilder und Audio-Dateien!

## Architecture

**Schafkopf Online** - Multiplayer Bavarian card game with real-time communication.

### Stack
- **Next.js 14** (App Router, standalone output, basePath `/schafkopf`)
- **Socket.IO** - Self-hosted WebSocket server for real-time events
- **PostgreSQL** - Persistent data (users, stats, game history) via Drizzle ORM
- **Redis** - Ephemeral data (sessions, active games/rooms)
- **Zustand** - Client-side state management

### Production Services (Hetzner VPS)

**Live URL:** https://mqtt.ivu-software.de/schafkopf

| Service | Host | Port | Systemd |
|---------|------|------|---------|
| Next.js App | 10.243.0.8 | 3001 | `schafkopf` |
| Socket.IO | 10.243.0.8 | 3002 | `schafkopf-socket` |
| PostgreSQL | 10.243.0.5 | 5432 | `postgresql` |
| Redis | 10.243.0.8 | 6379 | `redis-server` |

### Core Files

**Game Logic** (`lib/schafkopf/`):
- `types.ts` - Core types: `Karte`, `Spieler`, `SpielState`, `Raum`
- `rules.ts` - Schafkopf rules: trump order, playable cards validation
- `game-state.ts` - State machine: phases (warten→austeilen→legen→ansagen→spielen→runde-ende)
- `scoring.ts` - Point calculation, Schneider/Schwarz, Laufende
- `cards.ts` - Deck creation (kurzes Blatt: 24 cards)

**Real-time** (`lib/pusher.ts`):
- `getPusherServer()` - Server-side: triggers events via HTTP POST to Socket.IO
- `getPusherClient()` - Client-side: Socket.IO connection
- `EVENTS` - All event names (GAME_STATE, KARTE_GESPIELT, STICH_ENDE, etc.)
- Channel helpers: `lobbyChannel()`, `roomChannel(id)`, `gameChannel(id)`

**Bot Logic** (`lib/bot-logic.ts`):
- `botAnsage()` - Rule-based game announcement (Sauspiel, Wenz, Solo)
- `botSpielzug()` - Card selection strategy

**Database** (`lib/db/`):
- `schema.ts` - Drizzle schema (users, stats, game_results, feedback)
- `index.ts` - PostgreSQL connection pool
- Feature flags in `lib/config/feature-flags.ts` control PostgreSQL vs Redis

**API Routes** (`app/api/`):
- `/api/rooms` - Room CRUD, join/leave, ready status, start game
- `/api/game` - Game actions: legen, ansage, spielzug, du, re

### Key Concepts (Schafkopf Terminology)
- **Legen** - Doubling stakes before seeing announcement
- **Ansage** - Game type announcement (Sauspiel, Wenz, Geier, Solo)
- **Sauspiel** - Partner game (search for Ass of a color)
- **Spielmacher** - Player who made the winning announcement
- **Du/Re** - Kontra/Re doubling during play
- **Stich** - Trick (4 cards played)
- **Schneider/Schwarz** - Bonus for <30 or 0 points

### Data Flow
1. Player action → API route → Update Redis state
2. API triggers Socket.IO event via HTTP POST to `/trigger`
3. Socket.IO broadcasts to subscribed clients
4. Clients update Zustand store → React re-renders

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://schafkopf:PASSWORD@10.243.0.5:5432/schafkopf
REDIS_URL=redis://127.0.0.1:6379

# Real-time
SOCKET_TRIGGER_URL=http://127.0.0.1:3002/trigger
NEXT_PUBLIC_SOCKET_URL=https://mqtt.ivu-software.de

# Feature Flags (PostgreSQL migration)
USE_POSTGRES_USERS=false      # User accounts
USE_POSTGRES_STATS=false      # Statistics & leaderboards
USE_POSTGRES_HISTORY=false    # Game history
USE_POSTGRES_FEEDBACK=false   # Feedback system
DUAL_WRITE_ENABLED=false      # Write to both during migration
```
