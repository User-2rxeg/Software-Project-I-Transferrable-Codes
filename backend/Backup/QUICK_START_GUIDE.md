# Quick Start Guide - Testing Backup System

## Prerequisites

1. Your Node.js application is running on port 6666
2. You have a valid JWT token with ADMIN role
3. MongoDB is accessible with your connection string
4. `mongodump` and `bsondump` tools are installed

## Step 1: Get Admin JWT Token

If you have a test admin account, get the JWT token:

```bash
curl -X POST http://localhost:6666/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": "7d"
}
```

Save the token: `export TOKEN="eyJhbGciOiJIUzI1NiIs..."`

## Step 2: Check Existing Backups

```bash
curl http://localhost:6666/api/backups/list \
  -H "Authorization: Bearer $TOKEN"
```

This will show you all existing backups with their metadata.

## Step 3: Create a Test Backup

```bash
curl -X POST http://localhost:6666/api/backups/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "manual-test",
    "oplog": false,
    "dumpDbUsersAndRoles": false
  }'
```

Response should look like:
```json
{
  "filename": "manual-test_2025-11-07_17-45-00",
  "timestamp": "2025-11-07T17:45:00.000Z",
  "size": 45678,
  "path": "/home/user/Test-repo/backend/backups/manual-test_2025-11-07_17-45-00",
  "options": {
    "name": "manual-test",
    "oplog": false,
    "dumpDbUsersAndRoles": false
  }
}
```

## Step 4: Verify Backup Content

Check the backup directory structure:

```bash
# Navigate to backups folder
cd backend/backups

# List the newly created backup
ls -la manual-test_2025-11-07_17-45-00/

# You should see database folders (e.g., software_project_1/)
# NOT .bson or .metadata.json files!
```

Expected structure:
```
manual-test_2025-11-07_17-45-00/
├── software_project_1/
│   ├── users.json
│   ├── auditlogs.json
│   └── other-collections.json
└── test/ (if it exists)
    ├── todos.json
    ├── messages.json
    └── other-collections.json
```

## Step 5: View Backup JSON Content

```bash
# Example: View first 50 lines of users collection
head -50 manual-test_2025-11-07_17-45-00/software_project_1/users.json
```

You should see clean JSON format:
```json
{
  "collection": "users",
  "documents": [
    {
      "_id": ObjectId(...),
      "email": "user@example.com",
      "role": "user",
      "createdAt": "2025-11-01T10:30:00.000Z",
      ...
    },
    ...
  ]
}
```

## Step 6: Check Audit Logs

To verify the backup operation was logged, check MongoDB:

```bash
# Connect to MongoDB
mongosh "your_connection_string"

# Switch to database
use software_project_1

# Check backup audit logs
db.auditlogs.find({
  event: {
    $in: [
      'DATA_BACKUP_COMPLETED',
      'DATA_BACKUP_FAILED'
    ]
  }
}).sort({timestamp: -1}).limit(5).pretty()
```

You should see entries like:
```javascript
{
  _id: ObjectId(...),
  event: "DATA_BACKUP_COMPLETED",
  userId: null,
  details: {
    type: "manual",
    origin: "API",
    options: {
      oplog: false,
      dumpDbUsersAndRoles: false
    },
    filename: "manual-test_2025-11-07_17-45-00",
    timestamp: ISODate("2025-11-07T17:45:00.000Z"),
    size: 45678,
    path: "..."
  },
  timestamp: ISODate("2025-11-07T17:45:00.000Z")
}
```

## Step 7: Check RBAC Audit Logs

Verify that role-based access control is being logged:

```bash
# In MongoDB
db.auditlogs.find({
  event: {
    $in: [
      'RBAC_AUTHORIZED',
      'UNAUTHORIZED_ACCESS'
    ]
  }
}).sort({timestamp: -1}).limit(10).pretty()
```

You should see entries like:
```javascript
{
  _id: ObjectId(...),
  event: "RBAC_AUTHORIZED",
  userId: ObjectId("..."),
  details: {
    userRole: "admin",
    requiredRoles: ["admin"],
    reason: "AUTHORIZED"
  },
  timestamp: ISODate("2025-11-07T17:45:00.000Z")
}
```

## Step 8: Delete a Backup (Optional)

```bash
curl -X DELETE http://localhost:6666/api/backups/manual-test_2025-11-07_17-45-00 \
  -H "Authorization: Bearer $TOKEN"
```

Response:
```json
{
  "message": "Backup manual-test_2025-11-07_17-45-00 deleted successfully"
}
```

---

## Troubleshooting

### Issue: Backup created but directories are empty

**Possible causes:**
1. No data in MongoDB database
2. MongoDB connection issue
3. Incorrect database name in URI

**Solution:**
1. Verify data exists: `db.users.countDocuments()`
2. Check logs for MongoDB connection errors
3. Verify MONGODB_URI in .env matches your setup

### Issue: BSON files still present after backup

This should not happen with the new code. If it does:
1. Restart the application
2. Check Node.js logs for cleanup errors
3. Ensure file permissions allow deletion

### Issue: API returns 403 Unauthorized

**Cause:** User doesn't have ADMIN role

**Solution:**
1. Verify your JWT token is valid
2. Check user role in MongoDB: `db.users.findOne({email: "your@email.com"})`
3. Ensure role is set to "admin"

### Issue: API returns 500 error

Check the application logs:
```bash
# If running with npm
npm run dev

# You'll see detailed error messages
```

---

## Performance Tips

1. **For large databases (>1GB):**
   - Increase Node memory: `node --max-old-space-size=4096 app.js`
   - Run backups during off-peak hours
   - Consider splitting backups by database

2. **For frequent backups:**
   - Reduce `BACKUP_MAX_COUNT` to auto-cleanup old backups faster
   - Disable `BACKUP_USE_OPLOG` if not needed
   - Run test backups less frequently

3. **For disk space:**
   - Compress JSON files after backup (external script)
   - Delete old backups manually periodically
   - Move backups to external storage

---

## Next Steps

1. ✅ Test the backup API endpoints
2. ✅ Verify backup JSON format looks correct
3. ✅ Check audit logs are being recorded
4. ✅ Monitor scheduled backups running automatically
5. ✅ Document your backup schedule
6. ✅ Set up external backup storage (optional)

---

## Common Curl Commands (Copy-Paste Ready)

### List Backups
```bash
curl -s http://localhost:6666/api/backups/list \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Create Backup
```bash
curl -s -X POST http://localhost:6666/api/backups/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"quick-test"}' | jq .
```

### Delete Backup
```bash
curl -s -X DELETE http://localhost:6666/api/backups/FILENAME \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Check Audit Logs (MongoDB)
```bash
mongosh "your_uri" --eval "db.auditlogs.find({event:/BACKUP|RBAC/}).sort({timestamp:-1}).limit(5).pretty()"
```

---

**Last Updated:** November 7, 2025

