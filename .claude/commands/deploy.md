---
allowed-tools: Bash, Read
description: Deploy Schafkopf to Hetzner VPS
---

# Schafkopf Deployment auf Hetzner VPS

Führe alle Schritte nacheinander aus um die App zu deployen.

## Architektur

| Service | Port | Systemd |
|---------|------|---------|
| Next.js App | 3001 | `schafkopf` |
| Socket.IO Server | 3002 | `schafkopf-socket` |
| Redis | 6379 | `redis-server` |
| Nginx | 443 | Reverse Proxy |

**VPN IP:** `10.243.0.8`
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
REDIS_URL=redis://127.0.0.1:6379
SOCKET_TRIGGER_URL=http://127.0.0.1:3002/trigger
NEXT_PUBLIC_SOCKET_URL=https://mqtt.ivu-software.de
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
