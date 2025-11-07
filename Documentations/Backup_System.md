# Backup System Documentation

## Overview

The backup system automatically creates scheduled and test backups of your MongoDB databases and converts them to readable JSON format.

## Features

✅ **Automatic Scheduled Backups** - Runs on a configurable cron schedule
✅ **Test Backups** - Can run frequently for testing purposes
✅ **JSON Format** - All backups converted to clean, readable JSON
✅ **Automatic Cleanup** - BSON and metadata files automatically removed
✅ **Audit Logging** - All backup operations logged with timestamps and metadata
✅ **Manual Backup API** - Trigger backups manually via REST endpoint
✅ **Multi-Database Support** - Automatically handles multiple databases

## Configuration (.env)

```env
# Backup directory path
BACKUP_DIR=./backups

# Maximum number of backups to keep (older ones are automatically deleted)
BACKUP_MAX_COUNT=10

# Enable/disable test backups
BACKUP_ENABLE_TEST=true

# Cron expression for test backups (every minute by default)
BACKUP_CRON_TEST=*/1 * * * *

# Cron expression for production backups (2 AM daily by default)
BACKUP_CRON_PROD=0 2 * * *

# Timezone for production backups
BACKUP_TIMEZONE=Africa/Cairo

# Include operation log (oplog) in backup
BACKUP_USE_OPLOG=false

# Dump database users and roles in backup
BACKUP_DUMP_USERS=false

# Prefix for scheduled backup filenames
BACKUP_NAME_PREFIX=scheduled
```

## API Endpoints

All endpoints require authentication with ADMIN role.

### Create Manual Backup

**POST** `/api/backups/create`

Request Body (optional):
```json
{
  "name": "manual",
  "oplog": false,
  "dumpDbUsersAndRoles": false
}
```

Response:
```json
{
  "filename": "manual_2025-11-07_12-00-00",
  "timestamp": "2025-11-07T12:00:00.000Z",
  "size": 1024000,
  "path": "/path/to/backup",
  "options": {
    "name": "manual",
    "oplog": false,
    "dumpDbUsersAndRoles": false
  }
}
```

### List All Backups

**GET** `/api/backups/list`

Response:
```json
[
  {
    "filename": "manual_2025-11-07_12-00-00",
    "timestamp": "2025-11-07T12:00:00.000Z",
    "size": 1024000,
    "path": "/path/to/backup",
    "options": { ... }
  }
]
```

### Delete Backup

**DELETE** `/api/backups/:filename`

Response:
```json
{
  "message": "Backup manual_2025-11-07_12-00-00 deleted successfully"
}
```

## Backup File Structure

### Directory Layout
```
backups/
├── manual_2025-11-07_12-00-00/
│   ├── software_project_1/
│   │   ├── users.json
│   │   ├── auditlogs.json
│   │   └── collections...
│   └── test/
│       ├── users.json
│       ├── todos.json
│       └── collections...
├── scheduled_2025-11-07_02-00-00/
│   └── ...
└── test_2025-11-07_17-31-00/
    └── ...
```

### JSON File Format
Each collection is stored as a JSON file with the following structure:
```json
{
  "collection": "users",
  "documents": [
    {
      "_id": "...",
      "email": "user@example.com",
      "role": "admin",
      ...
    },
    ...
  ]
}
```

## Audit Logging

All backup operations are logged in the audit system:

### Backup Events
- `DATA_BACKUP_STARTED` - Scheduled backup started
- `DATA_BACKUP_COMPLETED` - Scheduled backup completed successfully
- `DATA_BACKUP_FAILED` - Scheduled backup failed
- `DATA_BACKUP_TEST_STARTED` - Test backup started
- `DATA_BACKUP_TEST_COMPLETED` - Test backup completed successfully
- `DATA_BACKUP_TEST_FAILED` - Test backup failed

### Audit Log Details
Each audit entry includes:
```json
{
  "type": "scheduled" | "test" | "manual",
  "cron": "0 2 * * *",
  "tz": "Africa/Cairo",
  "origin": "CronBackupService.backupProd | CronBackupService.backupTest | API",
  "options": {
    "oplog": false,
    "dumpDbUsersAndRoles": false
  },
  "filename": "scheduled_2025-11-07_02-00-00",
  "timestamp": "2025-11-07T02:00:00.000Z",
  "size": 1024000,
  "path": "/path/to/backup"
}
```

## Troubleshooting

### No Data in Backups

If backups are created but contain no data:

1. **Check MongoDB Connection**
   - Verify `MONGODB_URI` in `.env` is correct
   - Ensure MongoDB is accessible from your application

2. **Check Database Name**
   - The backup tool uses the database specified in the MongoDB URI
   - Verify data exists in that database

3. **Check MongoDB Credentials**
   - Ensure the user has permission to read the database
   - Test connection with MongoDB client: `mongosh "your_uri"`

### Backup Size Too Large

1. Disable `BACKUP_USE_OPLOG` if not needed:
   ```env
   BACKUP_USE_OPLOG=false
   ```

2. Disable users/roles dump if not needed:
   ```env
   BACKUP_DUMP_USERS=false
   ```

3. Reduce the number of kept backups:
   ```env
   BACKUP_MAX_COUNT=5
   ```

### Memory Issues During Backup

Increase Node.js memory limit:
```bash
node --max-old-space-size=4096 app.js
```

Or update npm start command in package.json:
```json
{
  "scripts": {
    "start": "node --max-old-space-size=4096 dist/main.js"
  }
}
```

## Requirements

- MongoDB (mongodump must be available in system PATH)
- `bsondump` utility (comes with MongoDB tools)
- Node.js with sufficient memory

## Best Practices

1. **Regular Testing** - Enable `BACKUP_ENABLE_TEST` during development to verify backups work
2. **Offsite Storage** - Copy backups to a separate location regularly
3. **Retention Policy** - Adjust `BACKUP_MAX_COUNT` based on your needs
4. **Monitor Size** - Check backup sizes regularly to ensure disk space
5. **Audit Review** - Check audit logs for backup failures
6. **Documentation** - Document your backup schedule and procedures

## Recovery

To restore from a backup:

1. Locate the backup JSON file you need
2. Parse the JSON to extract the documents
3. Use MongoDB tools to import the data:
   ```bash
   mongoimport --uri="your_connection_string" --collection=name --file=backup.json
   ```

Or manually insert documents via your application.

