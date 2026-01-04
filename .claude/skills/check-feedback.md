# /feedback - Schafkopf Feedback prüfen

Zeigt eingegangenes Feedback aus dem Schafkopf-Spiel an.

## Usage
```
/feedback [--limit N] [--status STATUS]
```

## Implementation

### PostgreSQL (Aktuell)

1. **Alle Feedbacks anzeigen:**
```bash
ssh -i ~/Dropbox/MyData/Documents/OPENVPN_config/gitlab-nor-priv-ssh root@10.243.0.8 'sudo -u postgres psql -d schafkopf -c "SELECT id, title, category, status, created_at FROM feedback_reports ORDER BY created_at DESC LIMIT 20;"'
```

2. **Details zu einem Report:**
```bash
ssh -i ~/Dropbox/MyData/Documents/OPENVPN_config/gitlab-nor-priv-ssh root@10.243.0.8 'sudo -u postgres psql -d schafkopf -c "SELECT * FROM feedback_reports WHERE id = '\''fb_xxx'\'';"'
```

3. **Status ändern:**
```bash
ssh -i ~/Dropbox/MyData/Documents/OPENVPN_config/gitlab-nor-priv-ssh root@10.243.0.8 'sudo -u postgres psql -d schafkopf -c "UPDATE feedback_reports SET status = '\''resolved'\'', resolved_at = NOW() WHERE id = '\''fb_xxx'\'';"'
```

### Legacy Redis (noch aktiv, wird migriert)

```bash
ssh -i ~/Dropbox/MyData/Documents/OPENVPN_config/gitlab-nor-priv-ssh root@10.243.0.8 'redis-cli smembers feedback:list'
```

## Status Werte

- `pending` - Neu, unbearbeitet
- `in_progress` - Wird bearbeitet
- `resolved` - Gelöst/Umgesetzt
- `wont_fix` - Wird nicht umgesetzt

## Output Format

```
📬 Schafkopf Feedback (4 Reports)

ID              | Titel                              | Kategorie | Status
----------------|------------------------------------|-----------|---------
fb_7vwgw8yufue  | Reinschmeissen wenn klar...        | feature   | pending
fb_3newdagm6q5  | Quiz Frage b oft richtig           | other     | pending
fb_4mth7debndi  | Trumpf Quiz sauspiel               | bug       | pending
fb_0vbft1gg1qud | Regelbuch nicht optimal            | other     | pending
```
