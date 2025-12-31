---
allowed-tools: Bash, Read
description: Deploy Schafkopf to Hetzner VPS
---

# Schafkopf Deployment auf Hetzner VPS

## Server Details
| Komponente | Pfad | Port |
|------------|------|------|
| Schafkopf | `/opt/schafkopf/` | 3000 |
| nginx | Reverse Proxy | 443 (HTTPS) |

**VPN IP:** `10.243.0.8` (für SSH-Zugriff)

## SSH Key
```
/Users/cschroeder/Dropbox/MyData/Documents/OPENVPN_config/gitlab-nor-priv-ssh
```

---

## Deployment Steps

### 1. Build (Standalone)
```bash
cd /Users/cschroeder/Github/schafkopf && npm run build
```

### 2. Archive erstellen (Standalone Output)
```bash
cd /Users/cschroeder/Github/schafkopf && tar -czf /tmp/schafkopf-deploy.tar.gz .next/standalone .next/static public
```

### 3. Archive zum Server kopieren
```bash
scp -i /Users/cschroeder/Dropbox/MyData/Documents/OPENVPN_config/gitlab-nor-priv-ssh /tmp/schafkopf-deploy.tar.gz root@10.243.0.8:/tmp/
```

### 4. Auf Server: Extrahieren und Service neustarten
```bash
ssh -i /Users/cschroeder/Dropbox/MyData/Documents/OPENVPN_config/gitlab-nor-priv-ssh root@10.243.0.8 'cd /opt/schafkopf && rm -rf .next public && tar -xzf /tmp/schafkopf-deploy.tar.gz && rm /tmp/schafkopf-deploy.tar.gz && cp -r .next/static .next/standalone/.next/ && systemctl restart schafkopf && sleep 2 && systemctl status schafkopf --no-pager'
```

---

## Erstmalige Server-Einrichtung

### 1. Verzeichnis erstellen
```bash
ssh -i ... root@10.243.0.8 'mkdir -p /opt/schafkopf'
```

### 2. .env auf Server erstellen
```bash
ssh -i ... root@10.243.0.8 'cat > /opt/schafkopf/.env << EOF
# Redis
REDIS_URL=redis://...

# Pusher
PUSHER_APP_ID=...
PUSHER_KEY=...
PUSHER_SECRET=...
PUSHER_CLUSTER=eu
NEXT_PUBLIC_PUSHER_KEY=...
NEXT_PUBLIC_PUSHER_CLUSTER=eu

# OpenAI (optional für KI-Gegner)
OPENAI_API_KEY=...
EOF'
```

### 3. Systemd Service erstellen
```bash
ssh -i ... root@10.243.0.8 'cat > /etc/systemd/system/schafkopf.service << EOF
[Unit]
Description=Schafkopf Online
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/schafkopf/.next/standalone
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3000
EnvironmentFile=/opt/schafkopf/.env

[Install]
WantedBy=multi-user.target
EOF'

ssh -i ... root@10.243.0.8 'systemctl daemon-reload && systemctl enable schafkopf'
```

### 4. nginx Konfiguration
```bash
ssh -i ... root@10.243.0.8 'cat > /etc/nginx/sites-available/schafkopf << EOF
server {
    listen 80;
    server_name schafkopf.ivu-software.de;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name schafkopf.ivu-software.de;

    ssl_certificate /etc/letsencrypt/live/schafkopf.ivu-software.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/schafkopf.ivu-software.de/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF'

ssh -i ... root@10.243.0.8 'ln -sf /etc/nginx/sites-available/schafkopf /etc/nginx/sites-enabled/ && nginx -t && systemctl reload nginx'
```

---

## Troubleshooting

### Service startet nicht
```bash
ssh -i ... root@10.243.0.8 'journalctl -u schafkopf -n 50 --no-pager'
```

### Port prüfen
```bash
ssh -i ... root@10.243.0.8 'ss -tlnp | grep 3000'
```
