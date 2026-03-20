# Scrivenry Deployment & Operations

## Overview

Scrivenry is deployed on dev.fintonlabs.com (VPS) behind Traefik reverse proxy at `/scrivenry`.

- **Live URL:** https://dev.fintonlabs.com:8080/scrivenry/
- **Local dev:** http://localhost:3847 (when running locally)
- **Database:** SQLite at `/app/data/scrivenry.db` (inside Docker volume)
- **Docker container:** `scrivenry:latest`

## Security Features (Updated 2026-03-20)

### Password Hashing - bcrypt

- **Algorithm:** bcrypt with 10 rounds (via bcryptjs)
- **Migration:** Old SHA-256 passwords will fail login; users must re-register
- **Verification:** New hashes start with `$2b$10$...`

### httpOnly Cookies

- **Implementation:** JWT token set via server `Set-Cookie` header
- **Flags:** `HttpOnly`, `Secure`, `SameSite=lax`, `Path=/`
- **Expiry:** 7 days
- **Client:** No more `document.cookie` or localStorage for auth
- **Protection:** Prevents XSS attacks from reading auth tokens

### Rate Limiting

- **Login:** 5 attempts per IP per 15 minutes
- **Register:** 3 attempts per IP per hour
- **Response:** HTTP 429 Too Many Requests with `Retry-After` header

### CSRF Protection

- **Endpoint:** `GET /api/auth/csrf` returns a token
- **Token format:** `{timestamp}.{random}.{signature}`
- **Validity:** 1 hour
- **Required:** All login/register requests must include `csrfToken` in body
- **Failure:** HTTP 403 "Invalid request. Please refresh and try again."

## Authentication Flow

1. **Page Load:** Client fetches CSRF token from `/api/auth/csrf`
2. **Form Submit:** Client includes `csrfToken` in POST body
3. **Server Validates:** CSRF token signature and expiry
4. **Rate Check:** IP-based rate limiting
5. **Credential Check:** bcrypt password verification
6. **Response:** Server sets `Set-Cookie: auth-token=...` with httpOnly flag
7. **Subsequent Requests:** Browser automatically sends cookie

## Environment Variables

**Required:**
- `JWT_SECRET` - JWT signing secret (min 32 chars)
- `DATABASE_URL` - SQLite path (default: `file:/app/data/scrivenry.db`)

**Security:**
- `AUTH_SECURE_COOKIES` - Require HTTPS for cookies (default: `true`)
- `CSRF_SECRET` - CSRF token signing key (falls back to JWT_SECRET)

**Generate secure secrets:**
```bash
openssl rand -base64 32
```

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

3. **Start with docker-compose:**
   ```bash
   docker-compose up -d scrivenry
   ```

4. **Verify health:**
   ```bash
   curl -sk https://dev.fintonlabs.com:8080/scrivenry/ | head -c 100
   ```

## Troubleshooting

### Login Returns 401

**Cause:** User doesn't exist or has old SHA-256 password (migration needed).

**Fix:** Re-register with same email (old hash won't match):
```bash
CSRF=$(curl -sk https://dev.fintonlabs.com:8080/scrivenry/api/auth/csrf | jq -r '.csrfToken')
curl -sk https://dev.fintonlabs.com:8080/scrivenry/api/auth/register -X POST \
  -H 'Content-Type: application/json' \
  -d "{
    \"email\": \"user@example.com\",
    \"password\": \"password123\",
    \"name\": \"User Name\",
    \"csrfToken\": \"$CSRF\"
  }"
```

### Login Returns 429 (Rate Limited)

**Cause:** Too many failed login attempts from your IP.

**Fix:** Wait 15 minutes (login) or 1 hour (register). Check `Retry-After` header.

### Login Returns 403 (CSRF Failed)

**Cause:** Missing or invalid CSRF token.

**Fix:** Ensure you're fetching `/api/auth/csrf` first and including the token.

### Cookie Not Being Set

**Cause:** Response received but no `Set-Cookie` header visible.

**Check:** Use `curl -D-` to see full headers. Cookie should have `HttpOnly` flag.

### Old Users Can't Login

**Cause:** SHA-256 password hashes are no longer supported (bcrypt migration).

**Fix:** Users with old hashes must re-register. Delete old account from database if needed:
```bash
docker exec scrivenry node -e "
const Database = require('better-sqlite3');
const db = new Database('/app/data/scrivenry.db');
db.prepare('DELETE FROM users WHERE email = ?').run('old@email.com');
db.close();
"
```

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
JWT_SECRET="dev-secret-key-32-chars-minimum-here"
AUTH_SECURE_COOKIES="false"
CSRF_SECRET="dev-csrf-secret-32-chars-minimum"
```

## Security Checklist

- [x] Password hashing with bcrypt (10 rounds)
- [x] httpOnly cookies (XSS protection)
- [x] Rate limiting on auth endpoints
- [x] CSRF protection on forms
- [x] JWT_SECRET from environment variable
- [x] Database backups run daily
- [x] No API keys in git
- [x] .env files in .gitignore
- [x] Traefik labels are correct (expose, not ports)

## API Reference

### Auth Endpoints

| Endpoint | Method | Auth | Rate Limit |
|----------|--------|------|------------|
| `/api/auth/csrf` | GET | No | No |
| `/api/auth/login` | POST | No | 5/15min |
| `/api/auth/register` | POST | No | 3/1hr |
| `/api/auth/logout` | POST | Yes | No |
