# Schafkopf Online

Ein Multiplayer-Kartenspiel für das bayerische Kartenspiel Schafkopf mit Echtzeit-Kommunikation, KI-Gegnern und vollständiger Regelimplementierung.

**Live:** [mqtt.ivu-software.de/schafkopf](https://mqtt.ivu-software.de/schafkopf)

## Features

- **Multiplayer** - Echtzeit-Spiel mit bis zu 4 Spielern
- **KI-Gegner** - Intelligente Bots als Mitspieler
- **Vollständige Regeln** - Sauspiel, Wenz, Geier, Farbsolo, Tout, Du/Re, Legen, Laufende
- **PWA** - Installierbar auf Handy und Desktop
- **Sprachausgabe** - Bayerische Kommentare und Ansagen (OpenAI TTS)
- **Tutorial** - Interaktive Lektionen für Anfänger
- **Leaderboard** - Ranglisten (täglich, wöchentlich, monatlich, gesamt)
- **Feedback-System** - In-App Bug Reports mit Screenshot-Annotationen

## Tech Stack

| Bereich | Technologie |
|---------|-------------|
| Framework | Next.js 14 (App Router) |
| Real-time | Socket.IO (selbst gehostet) |
| Datenbank | PostgreSQL (Drizzle ORM) |
| State | Zustand |
| Styling | Tailwind CSS |
| Auth | NextAuth.js (Google, GitHub, JWT Sessions) |
| TTS | OpenAI Whisper |

## Installation

### Voraussetzungen

- Node.js 18+
- PostgreSQL 15+

### Setup

```bash
# Repository klonen
git clone https://github.com/your-username/schafkopf.git
cd schafkopf

# Dependencies installieren
npm install

# Environment-Variablen konfigurieren
cp .env.local.example .env.local
# Dann .env.local mit eigenen Werten füllen

# Datenbank-Schema pushen
npm run db:push

# Development-Server starten
npm run dev

# In einem zweiten Terminal: Socket.IO Server starten
node socket-server.js
```

Die App läuft dann auf [localhost:3000](http://localhost:3000).

## Projektstruktur

```
schafkopf/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── auth/             # NextAuth.js Endpoints
│   │   ├── game/             # Spielaktionen (legen, ansagen, spielzug)
│   │   ├── rooms/            # Raum-Verwaltung (CRUD, join/leave)
│   │   ├── leaderboard/      # Ranglisten-Daten
│   │   ├── feedback/         # Bug-Report-System
│   │   └── audio/            # TTS Audio-Generierung
│   ├── game/[roomId]/        # Spielansicht
│   ├── lobby/                # Raum-Übersicht
│   ├── lernen/               # Tutorial & Lektionen
│   ├── wissen/               # Wissensdatenbank
│   └── login/                # Anmeldung
│
├── components/               # React Komponenten
│   ├── Card.tsx              # Spielkarte
│   ├── Hand.tsx              # Handkarten-Anzeige
│   ├── Table.tsx             # Spieltisch
│   ├── Stich.tsx             # Aktueller Stich
│   ├── GameAnnounce.tsx      # Ansage-Dialog
│   ├── GameLegen.tsx         # Legen-Dialog
│   ├── PlayerInfo.tsx        # Spieler-Info (Name, Guthaben)
│   ├── ScoreBoard.tsx        # Punktestand
│   └── ...
│
├── lib/                      # Business Logic
│   ├── schafkopf/            # Spiellogik
│   │   ├── types.ts          # TypeScript-Typen
│   │   ├── rules.ts          # Schafkopf-Regeln
│   │   ├── game-state.ts     # State-Machine
│   │   ├── scoring.ts        # Punkteberechnung
│   │   └── cards.ts          # Deck-Erstellung
│   ├── db/                   # Datenbank
│   │   ├── schema.ts         # Drizzle Schema
│   │   └── index.ts          # Connection Pool
│   ├── auth/                 # Authentifizierung
│   ├── bot-logic.ts          # KI-Gegner
│   ├── pusher.ts             # Socket.IO Client/Server
│   ├── store.ts              # Zustand Store
│   └── rooms.ts              # Raum-Verwaltung (PostgreSQL)
│
├── public/                   # Statische Assets
│   ├── cards/                # Kartenbilder
│   ├── audio/                # Sound-Effekte
│   └── icons/                # PWA Icons
│
├── drizzle/                  # DB Migrations
├── socket-server.js          # Standalone Socket.IO Server
└── package.json
```

## Architektur

### Datenfluss

```
Player Action → API Route → PostgreSQL State Update
                    ↓
            Socket.IO Trigger (HTTP POST)
                    ↓
            Socket.IO Broadcast
                    ↓
            Clients (Zustand Store → React)
```

### Spielphasen

```
warten → austeilen → legen → ansagen → spielen ↔ stich-ende → runde-ende
   ↑                                                              │
   └──────────────────────────────────────────────────────────────┘
```

### Datenhaltung

| Daten | Speicher | Grund |
|-------|----------|-------|
| Sessions | JWT Tokens | Stateless, kein DB-Zugriff nötig |
| Rooms, Games, Users, Stats, History | PostgreSQL | Persistent, ACID, JSONB für flexible Strukturen |

## Schafkopf-Regeln (Kurzfassung)

### Kartenspiel
- **Kurzes Blatt**: 24 Karten (9, 10, Unter, Ober, König, Ass)
- **4 Farben**: Eichel, Gras, Herz, Schellen

### Spielarten
- **Sauspiel** - Partner-Spiel (Ass einer Farbe)
- **Wenz** - Nur Unter sind Trumpf
- **Geier** - Nur Ober sind Trumpf
- **Farbsolo** - Eine Farbe + Ober + Unter als Trumpf
- **Tout** - Solo mit Ansage alle Stiche

### Besondere Regeln
- **Legen** - Verdoppeln vor der Ansage
- **Du/Re** - Kontra/Re während des Spiels
- **Laufende** - Bonus für Trumpf-Sequenzen
- **Schneider** - Gegner <30 Punkte
- **Schwarz** - Gegner 0 Punkte

## API Endpoints

### Räume
```
GET    /api/rooms           # Alle offenen Räume
POST   /api/rooms           # Raum erstellen
POST   /api/rooms/join      # Raum beitreten
POST   /api/rooms/leave     # Raum verlassen
POST   /api/rooms/ready     # Bereit-Status
POST   /api/rooms/start     # Spiel starten
```

### Spiel
```
POST   /api/game            # Spielaktion
       action: 'legen'      # Verdoppeln ja/nein
       action: 'ansage'     # Spielart ansagen
       action: 'spielzug'   # Karte spielen
       action: 'du'         # Kontra sagen
       action: 're'         # Re sagen
```

### Sonstige
```
GET    /api/leaderboard     # Rangliste
POST   /api/feedback        # Bug Report senden
GET    /api/user/stats      # Eigene Statistiken
```

## Datenbank-Schema

```sql
-- Benutzer
users (id, email, name, image, settings, created_at, last_login_at)
oauth_accounts (user_id, provider, provider_account_id)
legacy_player_links (legacy_player_id, user_id)

-- Räume & Spiele
rooms (id, name, ersteller_id, spieler, status, erstellt_am)  -- JSONB für Spieler
active_games (room_id, state, updated_at)                      -- JSONB für SpielState

-- Statistiken
user_stats (user_id, guthaben, spiele_gesamt, siege, niederlagen,
            ansagen_count, weekly_guthaben, monthly_guthaben)

-- Spielhistorie
game_results (game_id, spielart, spielmacher_id, partner_id,
              punkte, gewonnen, schneider, schwarz, laufende)

-- Feedback
feedback_reports (id, user_id, title, description, category,
                  priority, github_issue_url, status)
feedback_screenshots (report_id, filename, annotations)
```

## Environment-Variablen

```bash
# Datenbank
DATABASE_URL=postgresql://user:pass@host:5432/schafkopf

# Real-time
SOCKET_TRIGGER_URL=http://127.0.0.1:3002/trigger
NEXT_PUBLIC_SOCKET_URL=https://your-domain.com

# Auth (NextAuth.js)
NEXTAUTH_URL=https://your-domain.com/schafkopf
NEXTAUTH_SECRET=your-secret-key
AUTH_GOOGLE_ID=xxx
AUTH_GOOGLE_SECRET=xxx
AUTH_GITHUB_ID=xxx
AUTH_GITHUB_SECRET=xxx

# OpenAI (für TTS)
OPENAI_API_KEY=sk-xxx
```

## Deployment

### Produktionsumgebung

| Service | Port | Systemd Unit |
|---------|------|--------------|
| Next.js App | 3001 | `schafkopf` |
| Socket.IO | 3002 | `schafkopf-socket` |
| PostgreSQL | 5432 | `postgresql` |

### Build & Deploy

```bash
# Production Build
npm run build

# Das Build-Artifact liegt in .next/standalone
# WICHTIG: public/ muss manuell nach .next/standalone/public kopiert werden!

# Starten
cd .next/standalone
node server.js
```

### Systemd Service (Beispiel)

```ini
[Unit]
Description=Schafkopf Online
After=network.target postgresql.service

[Service]
Type=simple
User=schafkopf
WorkingDirectory=/opt/schafkopf
ExecStart=/usr/bin/node .next/standalone/server.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```

## Entwicklung

### Verfügbare Scripts

```bash
npm run dev           # Development Server (Port 3000)
npm run build         # Production Build
npm run lint          # ESLint
npm run db:generate   # Migrations generieren
npm run db:push       # Schema auf DB pushen
npm run db:studio     # Drizzle Studio öffnen
```

### Socket.IO Server

Der Socket.IO Server läuft separat vom Next.js Server:

```bash
node socket-server.js          # Standard (Port 3002)
SOCKET_PORT=4000 node socket-server.js  # Custom Port
```

Health-Check: `GET http://localhost:3002/health`

### Code-Stil

- TypeScript strict mode
- ESLint mit Next.js Config
- Tailwind CSS für Styling
- Deutsche Kommentare für Spiellogik
- Englische Kommentare für technische Bereiche

## Lizenz

Private Nutzung.
