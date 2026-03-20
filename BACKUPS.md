# Scrivenry Database Backups

## Automated Backup Setup

**Status:** ✅ Live and operational

### Schedule
- **Frequency:** Daily at 02:00 UTC
- **Retention:** Last 14 days (auto-cleanup)
- **Location:** `/home/justyn/backups/scrivenry/`
- **Log:** `/var/log/scrivenry-backup.log`

### Backup Command
```bash
/usr/local/bin/backup-scrivenry
```

### Cron Job
```
0 2 * * * /usr/local/bin/backup-scrivenry >> /var/log/scrivenry-backup.log 2>&1
```

## Database Recovery

### Restore from Backup
```bash
# 1. Get the backup file
ls -lh /home/justyn/backups/scrivenry/

# 2. Copy backup into container
docker cp /home/justyn/backups/scrivenry/scrivenry-YYYYMMDD-HHMMSS.db \
  scrivenry:/app/data/scrivenry.db

# 3. Restart container
docker restart scrivenry

# 4. Verify
curl -sk https://dev.fintonlabs.com:8080/scrivenry/api/health
```

## Maintenance

To manually trigger a backup:
```bash
ssh -i ~/.ssh/ada_id -p 7607 justyn@dev.fintonlabs.com \
  /usr/local/bin/backup-scrivenry
```

---

**Last Updated:** 2026-03-20 18:06 UTC
