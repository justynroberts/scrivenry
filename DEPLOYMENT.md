# Scrivenry Deployment & Operations

## Overview

Scrivenry is deployed on dev.fintonlabs.com (VPS) behind Traefik reverse proxy at `/scrivenry`.

- **Live URL:** https://dev.fintonlabs.com:8080/scrivenry/
- **Local dev:** http://localhost:3847 (when running locally)
- **Database:** SQLite at `/app/data/scrivenry.db` (inside Docker volume)
- **Docker container:** `scrivenry:latest`

## Authentication

### How It Works

1. **Registration/Login:** User submits credentials via POST `/api/auth/login`
2. **JWT Generation:** Server returns JWT token (7-day expiry)
3. **Client Storage:** Browser stores token in localStorage + sets as cookie (`auth-token`)
4. **Server Validation:** `validateRequest()` reads cookie and validates JWT signature
5. **Access:** If valid, user is authenticated; otherwise redirected to login

### Security Notes

- **JWT Secret:** Must be set in `JWT_SECRET` environment variable (no hardcoded fallback)
- **Password Hashing:** SHA-256 (NOT salted; acceptable for internal app)
- **Token Storage:** localStorage (accessible to XSS attacks); use `httpOnly: true` for production
- **Cookie Path:** Set to `/` for Traefik compatibility

## Database Backups

### Backup Script

Located at `/tmp/scrivenry-backup.sh` on the VPS:

```bash
#!/bin/bash
BACKUP_DIR="/home/justyn/backups/scrivenry-vps"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/scrivenry-${TIMESTAMP}.db"

docker run --rm -v scrivenry-data:/data -v ${BACKUP_DIR}:/backup \
  alpine cp /data/scrivenry.db /backup/scrivenry-${TIMESTAMP}.db

find ${BACKUP_DIR} -name "scrivenry-*.db" -type f | sort -r | tail -n +8 | xargs -r rm
```

### Cron Schedule

**Daily at 2:00 AM UTC** (via OpenClaw cron job `scrivenry-db-backup`)
- Retention: 7 backups (auto-cleanup)
- Location: `/home/justyn/backups/scrivenry-vps/`

### Manual Backup

```bash
docker run --rm -v scrivenry-data:/data -v /home/justyn/backups/scrivenry-vps:/backup \
  alpine cp /data/scrivenry.db /backup/scrivenry-$(date +%Y%m%d-%H%M%S).db
```

### Database Recovery

```bash
# Stop the container
docker stop scrivenry

# Restore from backup
docker run --rm -v scrivenry-data:/data -v /home/justyn/backups/scrivenry-vps:/backup \
  alpine cp /backup/scrivenry-20260320-070439.db /data/scrivenry.db

# Start container
docker start scrivenry
```

## Deployment

### Prerequisites

- SSH access to dev.fintonlabs.com (port 7607)
- Docker installed on VPS
- Traefik running (handles routing)

### Deploy Steps

1. **Build Docker image:**
   ```bash
   docker build -t scrivenry:latest .
   ```

2. **Stop old container:**
   ```bash
   docker stop scrivenry && docker rm -f scrivenry
   sleep 2
   ```

3. **Start new container:**
   ```bash
   docker run -d --name scrivenry --network traefik-net -v scrivenry-data:/app/data \
     --label traefik.enable=true \
     --label 'traefik.http.routers.scrivenry.rule=PathPrefix(`/scrivenry`)' \
     --label traefik.http.routers.scrivenry.entrypoints=websecure \
     --label traefik.http.routers.scrivenry.tls=true \
     --label 'traefik.http.services.scrivenry.loadbalancer.server.port=3847' \
     scrivenry:latest
   ```

4. **Verify health:**
   ```bash
   curl -sk https://dev.fintonlabs.com:8080/scrivenry/ | head -c 100
   ```

### Environment Variables

**Required:**
- `JWT_SECRET` - JWT signing secret (min 32 chars)
- `DATABASE_URL` - SQLite path (default: `file:/app/data/scrivenry.db`)

**Optional:**
- `AUTH_SECURE_COOKIES` - Require HTTPS (default: `true`)
- `NODE_ENV` - `production` for prod, `development` for dev

## Troubleshooting

### Login Returns 401

**Cause:** User doesn't exist in database or password is wrong.

**Fix:** Create user via register endpoint:
```bash
curl -sk https://dev.fintonlabs.com:8080/scrivenry/api/auth/register -X POST \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "User Name"
  }'
```

### Container Won't Start

**Cause:** Database initialization failure or missing volume.

**Fix:**
```bash
# Check logs
docker logs scrivenry

# Recreate volume if needed
docker volume rm scrivenry-data
docker volume create scrivenry-data

# Restart container
docker run -d --name scrivenry ... scrivenry:latest
```

### Cookie Not Being Set

**Cause:** Secure flag + mixed HTTPS/HTTP or domain mismatch.

**Fix:** Ensure:
1. Accessing via HTTPS (dev.fintonlabs.com uses SSL)
2. Cookie path is `/` not `/scrivenry/` (Traefik strips subpath)
3. SameSite=lax is set

## Development

### Local Setup

```bash
npm install
npm run dev
# Runs on http://localhost:3847
```

### Environment

Create `.env.local`:
```
DATABASE_URL="file:./data/scrivenry.db"
JWT_SECRET="dev-secret-key-32-chars-minimum"
AUTH_SECURE_COOKIES="false"
```

## Security Checklist

- [ ] JWT_SECRET is NOT hardcoded (must use env var)
- [ ] Password hashing is consistent (SHA-256)
- [ ] Database backups run daily
- [ ] No API keys in git
- [ ] .env files in .gitignore
- [ ] Traefik labels are correct (expose, not ports)

