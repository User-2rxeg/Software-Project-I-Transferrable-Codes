# Backup Module

## Overview

The Backup Module provides automated and manual database backup functionality with scheduled cron jobs, JSON format conversion, and comprehensive audit logging. It supports multiple databases, automatic cleanup of old backups, and provides REST API endpoints for manual backup operations.

## Features

- ✅ Automated scheduled backups
- ✅ Test/development backups
- ✅ Manual backup API endpoints
- ✅ BSON to JSON conversion
- ✅ Automatic cleanup of BSON/metadata files
- ✅ Multi-database support
- ✅ Backup rotation (keeps N latest backups)
- ✅ Comprehensive audit logging
- ✅ Detailed backup metadata
- ✅ Role-based access control (Admin only)

## Architecture

```
Backup Module
├── Module/
│   ├── Backup-Module.ts (NestJS module)
│   ├── Backup-Controller.ts (API endpoints)
│   ├── Backup-Service.ts (Business logic)
│   └── Backup-Module.ts (Configuration)
└── Scheduler/
    └── Backup-Cron.ts (Scheduled tasks)
```

## Backup Data Structure

### File Organization

```
backups/
├── manual_2025-11-07_12-00-00/
│   ├── software_project_1/
│   │   ├── users.json
│   │   ├── auditlogs.json
│   │   ├── todos.json
│   │   └── ... (other collections)
│   └── test/
│       ├── users.json
│       ├── conversations.json
│       └── ... (other collections)
├── scheduled_2025-11-07_02-00-00/
│   └── ... (same structure)
└── test_2025-11-07_17-31-00/
    └── ... (same structure)
```

### JSON File Format

Each collection is stored as a JSON file with metadata:

```json
{
  "collection": "users",
  "documents": [
    {
      "_id": {
        "$oid": "507f1f77bcf86cd799439011"
      },
      "name": "John Doe",
      "email": "john@example.com",
      "role": "Student",
      "createdAt": {
        "$date": "2025-11-01T10:00:00.000Z"
      }
    },
    ...
  ]
}
```

### Backup Metadata

```typescript
{
  filename: string;              // e.g., "scheduled_2025-11-07_02-00-00"
  timestamp: Date;               // Creation time
  size: number;                  // Total size in bytes
  path: string;                  // Full filesystem path
  options?: {
    name?: string;               // Backup name prefix
    oplog?: boolean;             // Include operation log
    dumpDbUsersAndRoles?: boolean; // Include user/role data
  };
}
```

---

## Configuration

Required environment variables in `.env`:

```env
# Backup Directory Configuration
BACKUP_DIR=./backups
BACKUP_MAX_COUNT=10                    # Keep last 10 backups

# Test Backups Configuration
BACKUP_ENABLE_TEST=true                # Enable test backups
BACKUP_CRON_TEST=*/1 * * * *           # Every minute

# Production Backups Configuration
BACKUP_CRON_PROD=0 2 * * *             # Daily at 2 AM
BACKUP_TIMEZONE=Africa/Cairo           # Timezone for prod backups

# Backup Options
BACKUP_USE_OPLOG=false                 # Include operation log
BACKUP_DUMP_USERS=false                # Include db users/roles
BACKUP_NAME_PREFIX=scheduled           # Filename prefix

# MongoDB Connection
MONGODB_URI=mongodb+srv://...
```

---

## API Endpoints

### Create Manual Backup

```http
POST /api/backups/create
```

**Description:** Manually trigger a backup (Admin only)

**Headers:**
```
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "manual-backup",
  "oplog": false,
  "dumpDbUsersAndRoles": false
}
```

**Response:**
```json
{
  "filename": "manual-backup_2025-11-07_12-30-45",
  "timestamp": "2025-11-07T12:30:45.000Z",
  "size": 2048576,
  "path": "/home/user/backups/manual-backup_2025-11-07_12-30-45",
  "options": {
    "name": "manual-backup",
    "oplog": false,
    "dumpDbUsersAndRoles": false
  }
}
```

**Status Codes:**
- `201 Created` - Backup created successfully
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Not an admin
- `500 Internal Server Error` - Backup failed

**Audit Logs:**
- `DATA_BACKUP_COMPLETED` - Backup created successfully
- `DATA_BACKUP_FAILED` - Backup creation failed

---

### List All Backups

```http
GET /api/backups/list
```

**Description:** Get list of all backups (Admin only)

**Headers:**
```
Authorization: Bearer <ADMIN_TOKEN>
```

**Response:**
```json
[
  {
    "filename": "manual-backup_2025-11-07_12-30-45",
    "timestamp": "2025-11-07T12:30:45.000Z",
    "size": 2048576,
    "path": "/home/user/backups/manual-backup_2025-11-07_12-30-45",
    "options": {
      "name": "manual-backup",
      "oplog": false,
      "dumpDbUsersAndRoles": false
    }
  },
  {
    "filename": "scheduled_2025-11-07_02-00-00",
    "timestamp": "2025-11-07T02:00:00.000Z",
    "size": 1956863,
    "path": "/home/user/backups/scheduled_2025-11-07_02-00-00",
    "options": {
      "name": "scheduled",
      "oplog": false,
      "dumpDbUsersAndRoles": false
    }
  }
]
```

**Status Codes:**
- `200 OK` - Backups retrieved
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Not an admin
- `500 Internal Server Error` - Failed to list backups

---

### Delete Backup

```http
DELETE /api/backups/:filename
```

**Description:** Delete a specific backup (Admin only)

**Parameters:**
- `filename` (string) - Backup directory name

**Headers:**
```
Authorization: Bearer <ADMIN_TOKEN>
```

**Response:**
```json
{
  "message": "Backup manual-backup_2025-11-07_12-30-45 deleted successfully"
}
```

**Status Codes:**
- `200 OK` - Backup deleted
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Not an admin
- `404 Not Found` - Backup not found
- `500 Internal Server Error` - Deletion failed

---

## Service Methods

### BackupService

#### `createBackup(options: BackupOptions): Promise<BackupMetadata>`
Create a new backup with optional configuration.

```typescript
const metadata = await this.backupService.createBackup({
  name: 'manual',
  oplog: false,
  dumpDbUsersAndRoles: false
});
```

#### `listBackups(): Promise<BackupMetadata[]>`
List all available backups sorted by newest first.

```typescript
const backups = await this.backupService.listBackups();
```

#### `deleteBackup(filename: string): Promise<void>`
Delete a specific backup directory.

```typescript
await this.backupService.deleteBackup('manual-backup_2025-11-07_12-30-45');
```

#### `cleanupOldBackups(): Promise<void>`
Remove backups older than BACKUP_MAX_COUNT.

```typescript
await this.backupService.cleanupOldBackups();
```

#### Private Methods

- `convertBackupToJson(backupPath: string)` - Converts BSON files to JSON
- `convertDatabaseToJson(dbPath: string, dbName: string)` - Converts single database
- `cleanupBsonAndMetadataFiles(backupPath: string)` - Removes .bson and .metadata.json files
- `getDirectorySize(dirPath: string)` - Calculates total backup size
- `pathExists(path: string)` - Checks if path exists

---

## Scheduled Backups

### Test Backups

Enabled when `BACKUP_ENABLE_TEST=true`

- **Trigger:** Every minute (configurable via `BACKUP_CRON_TEST`)
- **Use:** Development/testing
- **Default Schedule:** `*/1 * * * *`
- **Timezone:** UTC

**Audit Events:**
- `DATA_BACKUP_TEST_STARTED` - Test backup initiated
- `DATA_BACKUP_TEST_COMPLETED` - Test backup finished
- `DATA_BACKUP_TEST_FAILED` - Test backup failed

---

### Production Backups

- **Trigger:** Daily (configurable via `BACKUP_CRON_PROD`)
- **Use:** Production backup
- **Default Schedule:** `0 2 * * *` (2 AM)
- **Timezone:** Configurable via `BACKUP_TIMEZONE`

**Audit Events:**
- `DATA_BACKUP_STARTED` - Scheduled backup initiated
- `DATA_BACKUP_COMPLETED` - Scheduled backup finished
- `DATA_BACKUP_FAILED` - Scheduled backup failed

---

## Usage Examples

### Create a Backup via API

```bash
# Get admin token
export ADMIN_TOKEN="<your_admin_jwt_token>"

# Create manual backup
curl -X POST http://localhost:6666/api/backups/create \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "pre-deployment",
    "oplog": false,
    "dumpDbUsersAndRoles": false
  }'
```

### List All Backups

```bash
curl http://localhost:6666/api/backups/list \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
```

### Delete Specific Backup

```bash
curl -X DELETE http://localhost:6666/api/backups/pre-deployment_2025-11-07_12-30-45 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Check Backup Contents

```bash
# Navigate to backup
cd ./backups/manual-backup_2025-11-07_12-30-45

# List databases backed up
ls -la

# View collection data
cat software_project_1/users.json | jq '.documents | length'

# Find specific document
cat software_project_1/users.json | jq '.documents[] | select(.email == "user@example.com")'
```

### Restore from Backup

```bash
# Extract documents from JSON backup
cat ./backups/manual-backup_2025-11-07_12-30-45/software_project_1/users.json | \
  jq '.documents' > users_data.json

# Import to MongoDB
mongoimport \
  --uri="your_mongodb_uri" \
  --collection=users \
  --file=users_data.json \
  --jsonArray
```

---

## Backup Process Flow

```
1. Backup Triggered (Manual or Scheduled)
   ↓
2. Create Backup Directory
   ↓
3. Run mongodump
   (Creates database directories with .bson files)
   ↓
4. Convert BSON to JSON
   (Uses bsondump for each collection)
   ↓
5. Clean Up BSON/Metadata Files
   (Remove .bson and .metadata.json files)
   ↓
6. Calculate Total Size
   ↓
7. Log Success (DATA_BACKUP_COMPLETED)
   ↓
8. Cleanup Old Backups
   (If count exceeds BACKUP_MAX_COUNT)
   ↓
9. Return Backup Metadata
```

---

## Troubleshooting

### Problem: Backups Created But Empty

**Causes:**
1. No data in MongoDB database
2. MongoDB connection issue
3. Incorrect MONGODB_URI

**Solution:**
```bash
# Verify MongoDB connection
mongosh "your_uri"
db.users.countDocuments()

# Check application logs for errors
npm run dev 2>&1 | grep -i backup

# Test mongodump manually
mongodump --uri="your_uri" --out="./test_backup"
```

---

### Problem: BSON Files Not Cleaned Up

**Cause:** Cleanup function encountered an error

**Solution:**
```bash
# Manually clean up
find ./backups -name "*.bson" -delete
find ./backups -name "*.metadata.json" -delete

# Check Node logs
```

---

### Problem: Disk Space Running Out

**Solutions:**

1. Reduce backup count:
```env
BACKUP_MAX_COUNT=5  # Keep only last 5 backups
```

2. Delete old backups manually:
```bash
ls -lt ./backups | tail -5 | awk '{print $NF}' | xargs rm -rf
```

3. Archive backups to external storage:
```bash
tar -czf backup_archive.tar.gz ./backups/*
# Upload to S3, GCS, or other storage
```

---

### Problem: Backup Takes Too Long

**Solutions:**

1. Disable unnecessary options:
```env
BACKUP_USE_OPLOG=false           # Don't backup operation log
BACKUP_DUMP_USERS=false          # Don't backup users/roles
```

2. Increase Node memory:
```bash
node --max-old-space-size=4096 app.js
```

3. Run backups during off-peak hours:
```env
BACKUP_CRON_PROD=0 3 * * *       # 3 AM instead of 2 AM
```

---

## Monitoring & Alerts

### Monitor Backup Health

```bash
# Check recent backups
ls -lah ./backups | head -10

# Check backup sizes
du -sh ./backups/*

# Monitor backup logs
grep "DATA_BACKUP" ./logs/combined.log | tail -20
```

### Set Up Alerts (Example using MongoDB)

```javascript
// Query for failed backups in last 24 hours
db.auditlogs.countDocuments({
  event: 'DATA_BACKUP_FAILED',
  timestamp: { $gte: new Date(Date.now() - 24*60*60*1000) }
})
```

---

## Performance Considerations

| Factor | Impact | Solution |
|--------|--------|----------|
| Database Size | Large backups take longer | Run during off-peak hours |
| Network | Remote MongoDB slower | Use local backups first |
| Disk I/O | BSON→JSON conversion CPU intensive | Increase Node memory |
| Storage | Backups consume disk space | Limit BACKUP_MAX_COUNT |

---

## Security Considerations

- 🔐 Only admins can create/delete backups
- 🔐 Backups not encrypted by default (consider encryption)
- 🔐 Include sensitive data (user passwords hashed)
- 🔐 Store backups in secure location
- 🔐 All operations audit-logged
- 🔐 Consider removing old backups per retention policy

---

## Integration with Other Modules

- **Audit Log Module** - Logs all backup operations
- **Authentication Module** - RBAC for backup endpoints
- **User Module** - User data included in backups

---

## Best Practices

1. **Regular Testing:**
   - Test backup/restore procedures regularly
   - Verify backup integrity

2. **Offsite Storage:**
   - Keep copies of important backups elsewhere
   - Use cloud storage for disaster recovery

3. **Monitoring:**
   - Check backup completion daily
   - Alert on failures

4. **Documentation:**
   - Document backup schedule
   - Document recovery procedures
   - Document retention policies

5. **Retention Policy:**
   - Daily: Keep last 7 days
   - Weekly: Keep last 4 weeks
   - Monthly: Keep last 12 months

---

## Backup Size Estimation

```
Empty Database:      5-10 MB
Small Database:      50-500 MB
Medium Database:     500 MB - 5 GB
Large Database:      5 GB+
```

**Space Requirement:** 2x-3x database size (original + JSON conversion)

---

## Future Enhancements

- [ ] Backup compression (gzip/brotli)
- [ ] Incremental backups
- [ ] Encrypted backups
- [ ] Cloud storage integration (S3/GCS)
- [ ] Backup verification/integrity checks
- [ ] Restore API endpoints
- [ ] Backup scheduling via API
- [ ] Bandwidth throttling
- [ ] Parallel backup of multiple databases
- [ ] Backup notifications via webhooks

---

## Deployment Checklist

- [ ] Set `BACKUP_ENABLE_TEST=false` in production
- [ ] Configure appropriate `BACKUP_CRON_PROD` schedule
- [ ] Set reasonable `BACKUP_MAX_COUNT` for storage capacity
- [ ] Verify `BACKUP_DIR` has sufficient free space
- [ ] Test manual backup creation
- [ ] Test backup restoration procedure
- [ ] Set up backup monitoring/alerts
- [ ] Document backup/restore procedures
- [ ] Plan backup retention policy

---

**Last Updated:** November 7, 2025

