# Scrivenry Production — March 20, 2026

## Status: HEALTHY & OPERATIONAL

**Live:** https://dev.fintonlabs.com:8080/scrivenry/
**Container:** Up 41 minutes | Health: Connected
**Database:** /home/justyn/scrivenry-data/scrivenry.db | 124KB

## Today's Fixes (All Pushed to GitHub)

### 1. Database Persistence (CRITICAL)
Fixed: Pages not saving due to WAL files lost on restart
Solution: Changed volume from /tmp/scrivenry.db to /home/justyn/scrivenry-data/
Result: All data now persists across container restarts

### 2. Deployment-Agnostic API Client (CRITICAL)  
Fixed: 31 fetch calls broken behind Traefik /scrivenry path
Solution: Created lib/api-client.ts with apiFetch(), shareUrl(), clientUrl()
Result: Works behind Traefik or standalone at any path

### 3. Authentication Fix
Fixed: justyn@fintonlabs.com couldn't login
Solution: Reset to bcrypt, password = Scrivenry123!
Result: Admin can now login and manage

### 4. Showcase Pages
Created 4 demo pages to show off features
Result: Users see Welcome, Editor Blocks, Charts, API Examples on login

## GitHub Status

VPS Repo (scrivenry-vps): PUSHED - All 6 commits to main
Sparks Repo (scrivenry-sparks): 20 commits unpushed (SSH not configured)

Latest VPS Commit: 33d71dc - fix: use NEXT_PUBLIC_BASE_PATH

## Next

Admin panel being built now (user management, stats, audit log)
