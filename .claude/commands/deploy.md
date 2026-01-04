---
allowed-tools: Bash, Read
description: Deploy Schafkopf to Hetzner VPS
---

# Schafkopf Deployment auf Hetzner VPS

Führe alle Schritte nacheinander aus um die App zu deployen.

## Architektur

| Service | Host | Port | Systemd |
|---------|------|------|---------|
| Next.js App | 10.243.0.8 | 3001 | `schafkopf` |
| Socket.IO Server | 10.243.0.8 | 3002 | `schafkopf-socket` |
| PostgreSQL | 10.243.0.5 | 5432 | `postgresql` |
| Redis | 10.243.0.8 | 6379 | `redis-server` |
| Nginx | 10.243.0.8 | 443 | Reverse Proxy |

**App VPS:** `10.243.0.8`
**DB VPS:** `10.243.0.5`
**SSH Key:** `$HOME/Dropbox/MyData/Documents/OPENVPN_config/gitlab-nor-priv-ssh`

---

## Deployment Steps

### 1. Build
```bash
cd /Users/cschroeder/Github/schafkopf && npm run build
```

### 2. Archive erstellen
```bash
cd /Users/cschroeder/Github/schafkopf && tar -czf /tmp/schafkopf-deploy.tar.gz .next/standalone .next/static public socket-server.js
```

### 3. Zum Server kopieren
```bash
scp -i "$HOME/Dropbox/MyData/Documents/OPENVPN_config/gitlab-nor-priv-ssh" /tmp/schafkopf-deploy.tar.gz root@10.243.0.8:/tmp/
```

### 4. Auf Server extrahieren und Services neustarten

⚠️ **KRITISCH:** Next.js standalone enthält KEINEN public-Ordner!
Der `public`-Ordner MUSS explizit nach `.next/standalone/public` kopiert werden,
sonst fehlen Kartenbilder und Audio-Dateien!
```bash
ssh -i "$HOME/Dropbox/MyData/Documents/OPENVPN_config/gitlab-nor-priv-ssh" root@10.243.0.8 'cd /opt/schafkopf && tar -xzf /tmp/schafkopf-deploy.tar.gz 2>/dev/null && rm /tmp/schafkopf-deploy.tar.gz && cp -r .next/static .next/standalone/.next/ && rm -rf .next/standalone/public && cp -r public .next/standalone/ && systemctl restart schafkopf schafkopf-socket && sleep 2 && echo "=== Status ===" && systemctl is-active schafkopf schafkopf-socket'
```

### 5. Verify
```bash
ssh -i "$HOME/Dropbox/MyData/Documents/OPENVPN_config/gitlab-nor-priv-ssh" root@10.243.0.8 'curl -s http://localhost:3002/health && echo "" && curl -s "https://mqtt.ivu-software.de/schafkopf/api/rooms" | head -c 100'
```

---

## Umgebungsvariablen (Server: /opt/schafkopf/.env)

```bash
# Database
DATABASE_URL=postgresql://schafkopf:PASSWORD@10.243.0.5:5432/schafkopf
REDIS_URL=redis://127.0.0.1:6379

# Real-time
SOCKET_TRIGGER_URL=http://127.0.0.1:3002/trigger
NEXT_PUBLIC_SOCKET_URL=https://mqtt.ivu-software.de

# Feature Flags (set to true to enable PostgreSQL)
USE_POSTGRES_USERS=false
USE_POSTGRES_STATS=false
USE_POSTGRES_HISTORY=false
USE_POSTGRES_FEEDBACK=false
DUAL_WRITE_ENABLED=false
```

---

## Troubleshooting

### Logs anzeigen
```bash
ssh -i "$HOME/Dropbox/MyData/Documents/OPENVPN_config/gitlab-nor-priv-ssh" root@10.243.0.8 'journalctl -u schafkopf -u schafkopf-socket -n 30 --no-pager'
```

### Services Status
```bash
ssh -i "$HOME/Dropbox/MyData/Documents/OPENVPN_config/gitlab-nor-priv-ssh" root@10.243.0.8 'systemctl status schafkopf schafkopf-socket --no-pager'
```

### Redis prüfen
```bash
ssh -i "$HOME/Dropbox/MyData/Documents/OPENVPN_config/gitlab-nor-priv-ssh" root@10.243.0.8 'redis-cli keys "*"'
```

### PostgreSQL prüfen
```bash
ssh -i "$HOME/Dropbox/MyData/Documents/OPENVPN_config/gitlab-nor-priv-ssh" root@10.243.0.5 'psql -U schafkopf -d schafkopf -c "SELECT count(*) FROM users;"'
```

---

## PostgreSQL Migration

### Schema auf DB-Server erstellen (einmalig)
```bash
# Lokal: SQL-Migration zum Server kopieren
scp -i "$HOME/Dropbox/MyData/Documents/OPENVPN_config/gitlab-nor-priv-ssh" /Users/cschroeder/Github/schafkopf/drizzle/0000_early_wild_pack.sql root@10.243.0.5:/tmp/

# Auf DB-Server ausführen
ssh -i "$HOME/Dropbox/MyData/Documents/OPENVPN_config/gitlab-nor-priv-ssh" root@10.243.0.5 'psql -U postgres -d schafkopf -f /tmp/0000_early_wild_pack.sql'
```

### User-Migration (Redis → PostgreSQL)
```bash
# Auf App-Server: Dry-Run
ssh -i "$HOME/Dropbox/MyData/Documents/OPENVPN_config/gitlab-nor-priv-ssh" root@10.243.0.8 'cd /opt/schafkopf && npx tsx scripts/migrate-users.ts --dry-run'

# Echte Migration
ssh -i "$HOME/Dropbox/MyData/Documents/OPENVPN_config/gitlab-nor-priv-ssh" root@10.243.0.8 'cd /opt/schafkopf && npx tsx scripts/migrate-users.ts'
```

### Feature Flags aktivieren
Nach erfolgreicher Migration in `/opt/schafkopf/.env`:
```bash
USE_POSTGRES_USERS=true
DUAL_WRITE_ENABLED=true  # Für Übergangszeit
```
Dann: `systemctl restart schafkopf`
