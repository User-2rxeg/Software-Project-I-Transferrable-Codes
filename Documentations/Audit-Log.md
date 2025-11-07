# Audit Log Module

## Overview

The Audit Log Module tracks and records all significant events and operations within the application. It provides comprehensive audit trails for security, compliance, and debugging purposes.

## Features

- ✅ Comprehensive event logging
- ✅ User action tracking
- ✅ Timestamp recording
- ✅ Detailed event metadata
- ✅ Query and filtering capabilities
- ✅ Event categorization
- ✅ Security event tracking
- ✅ RBAC event logging

## Architecture

```
Audit Log Module
├── Model/
│   ├── Audit-Log.ts (Audit log schema)
│   └── Logs.ts (Event type enum)
├── Module/
│   ├── Audit-Log.Module.ts (NestJS module)
│   ├── Audit-Log.Controller.ts (API endpoints)
│   └── Audit-Log.Service.ts (Business logic)
└── Validator/
    ├── Audit-Log.Validator.ts (DTOs)
    └── PublicAuditDto.ts (Public response DTO)
```

## Audit Log Schema

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Unique audit log ID |
| `event` | Enum | Type of event (see Logs enum) |
| `userId` | ObjectId | ID of the user who triggered the event (optional) |
| `details` | Object | Additional event-specific data |
| `timestamp` | Date | When the event occurred |
| `ipAddress` | String | IP address of the request (optional) |
| `userAgent` | String | User agent string (optional) |

### Indexes

- `{ timestamp: -1 }` - For recent event queries
- `{ userId: 1, timestamp: -1 }` - For user activity queries
- `{ event: 1, timestamp: -1 }` - For event type queries

---

## Event Types

### User Registration & Verification

```typescript
enum Logs {
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  USER_REGISTERED = 'USER_REGISTERED',
  USER_CHANGED_EMAIL = 'USER_CHANGED_EMAIL',
  OTP_SENT = 'OTP_SENT',
  OTP_SEND_FAILED = 'OTP_SEND_FAILED',
  // ...
}
```

**Examples:**

```json
{
  "event": "USER_REGISTERED",
  "userId": "507f1f77bcf86cd799439011",
  "details": {
    "email": "user@example.com"
  },
  "timestamp": "2025-11-07T10:00:00Z"
}
```

---

### Authentication Events

```typescript
enum Logs {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  // ...
}
```

**Examples:**

```json
{
  "event": "LOGIN_SUCCESS",
  "userId": "507f1f77bcf86cd799439011",
  "details": {
    "email": "user@example.com",
    "ipAddress": "192.168.1.1"
  },
  "timestamp": "2025-11-07T10:30:00Z"
}
```

---

### MFA Events

```typescript
enum Logs {
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',
  // ...
}
```

---

### RBAC Events

```typescript
enum Logs {
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  TOKEN_BLACKLISTED = 'TOKEN_BLACKLISTED',
  RBAC_DENIED = 'RBAC_DENIED',
  RBAC_AUTHORIZED = 'RBAC_AUTHORIZED',
  // ...
}
```

**Examples:**

```json
{
  "event": "RBAC_AUTHORIZED",
  "userId": "507f1f77bcf86cd799439011",
  "details": {
    "userRole": "admin",
    "requiredRoles": ["admin"],
    "reason": "AUTHORIZED"
  },
  "timestamp": "2025-11-07T10:45:00Z"
}
```

---

### Admin Actions

```typescript
enum Logs {
  ADMIN_CREATED_USER = 'ADMIN_CREATED_USER',
  ADMIN_ANNOUNCE_ALL = 'ADMIN_ANNOUNCE_ALL',
  ROLE_CHANGED = 'ROLE_CHANGED',
  ADMIN_ANNOUNCE_ROLE = 'ADMIN_ANNOUNCE_ROLE',
  ADMIN_DELETE_USER = 'ADMIN_DELETE_USER',
  DATA_EXPORT = 'DATA_EXPORT',
  // ...
}
```

---

### Backup Events

```typescript
enum Logs {
  DATA_BACKUP_STARTED = 'DATA_BACKUP_STARTED',
  DATA_BACKUP_COMPLETED = 'DATA_BACKUP_COMPLETED',
  DATA_BACKUP_FAILED = 'DATA_BACKUP_FAILED',
  DATA_BACKUP_TEST_STARTED = 'DATA_BACKUP_TEST_STARTED',
  DATA_BACKUP_TEST_COMPLETED = 'DATA_BACKUP_TEST_COMPLETED',
  DATA_BACKUP_TEST_FAILED = 'DATA_BACKUP_TEST_FAILED',
  // ...
}
```

**Examples:**

```json
{
  "event": "DATA_BACKUP_COMPLETED",
  "userId": null,
  "details": {
    "type": "scheduled",
    "filename": "scheduled_2025-11-07_02-00-00",
    "size": 1024000,
    "path": "/path/to/backup",
    "timestamp": "2025-11-07T02:00:00Z",
    "options": {
      "oplog": false,
      "dumpDbUsersAndRoles": false
    }
  },
  "timestamp": "2025-11-07T02:00:05Z"
}
```

---

## API Endpoints

### Get All Audit Logs

```http
GET /audit-logs
```

**Description:** Retrieve all audit logs (Admin only)

**Headers:**
```
Authorization: Bearer <ADMIN_TOKEN>
```

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 50) - Results per page
- `event` (string, optional) - Filter by event type
- `userId` (string, optional) - Filter by user ID
- `startDate` (ISO string, optional) - Filter from date
- `endDate` (ISO string, optional) - Filter to date
- `sort` (string, optional) - Sort field (e.g., `timestamp:desc`)

**Response:**
```json
{
  "items": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "event": "LOGIN_SUCCESS",
      "userId": "507f1f77bcf86cd799439011",
      "details": {
        "email": "user@example.com"
      },
      "timestamp": "2025-11-07T10:30:00Z"
    }
  ],
  "total": 1500,
  "page": 1,
  "pages": 30,
  "limit": 50
}
```

**Status Codes:**
- `200 OK` - Logs retrieved
- `401 Unauthorized` - Invalid/missing token
- `403 Forbidden` - Not an admin

---

### Get User Audit Logs

```http
GET /audit-logs/user/:userId
```

**Description:** Get audit logs for a specific user

**Parameters:**
- `userId` (string) - User's MongoDB ObjectId

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 50) - Results per page
- `event` (string, optional) - Filter by event type
- `startDate` (ISO string, optional) - Filter from date
- `endDate` (ISO string, optional) - Filter to date

**Response:**
```json
{
  "items": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "event": "LOGIN_SUCCESS",
      "userId": "507f1f77bcf86cd799439011",
      "details": {},
      "timestamp": "2025-11-07T10:30:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "pages": 1,
  "limit": 50
}
```

**Status Codes:**
- `200 OK` - Logs retrieved
- `401 Unauthorized` - Invalid/missing token
- `403 Forbidden` - Not allowed to view other users' logs
- `404 Not Found` - User not found

**Note:** Users can only view their own logs unless they are admins.

---

### Get Logs by Event Type

```http
GET /audit-logs/event/:eventType
```

**Description:** Get all logs for a specific event type

**Parameters:**
- `eventType` (string) - Event type from Logs enum

**Headers:**
```
Authorization: Bearer <ADMIN_TOKEN>
```

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 50) - Results per page
- `startDate` (ISO string, optional) - Filter from date
- `endDate` (ISO string, optional) - Filter to date

**Response:** Paginated list of audit logs

**Status Codes:**
- `200 OK` - Logs retrieved
- `401 Unauthorized` - Invalid/missing token
- `403 Forbidden` - Not an admin

---

### Get Log by ID

```http
GET /audit-logs/:id
```

**Description:** Get a specific audit log by ID

**Parameters:**
- `id` (string) - Audit log MongoDB ObjectId

**Headers:**
```
Authorization: Bearer <ADMIN_TOKEN>
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "event": "LOGIN_SUCCESS",
  "userId": "507f1f77bcf86cd799439011",
  "details": {
    "email": "user@example.com",
    "ipAddress": "192.168.1.1"
  },
  "timestamp": "2025-11-07T10:30:00Z"
}
```

**Status Codes:**
- `200 OK` - Log found
- `401 Unauthorized` - Invalid/missing token
- `403 Forbidden` - Not an admin
- `404 Not Found` - Log not found

---

### Export Audit Logs

```http
GET /audit-logs/export
```

**Description:** Export audit logs as CSV or JSON

**Headers:**
```
Authorization: Bearer <ADMIN_TOKEN>
```

**Query Parameters:**
- `format` (string, default: `json`) - Export format (`json` or `csv`)
- `event` (string, optional) - Filter by event type
- `startDate` (ISO string, optional) - Filter from date
- `endDate` (ISO string, optional) - Filter to date

**Response:** File download (JSON array or CSV file)

**Status Codes:**
- `200 OK` - Export successful
- `401 Unauthorized` - Invalid/missing token
- `403 Forbidden` - Not an admin

---

## Service Methods

### AuditLogService

#### `log(event: Logs, userId?: string, details?: Record<string, any>): Promise<AuditLog>`
Log an event to the audit trail.

```typescript
await this.auditLogService.log(
  Logs.LOGIN_SUCCESS,
  '507f1f77bcf86cd799439011',
  { email: 'user@example.com' }
);
```

#### `record(event: Logs, userId?: string, details?: Record<string, any>): Promise<AuditLog>`
Alternative method to log an event (alias for `log`).

#### `create(dto: CreateAuditLogDto): Promise<AuditLog>`
Create an audit log from a DTO.

#### `findAll(filter?: FilterQuery, page?: number, limit?: number): Promise<PaginatedAuditLog[]>`
Get all audit logs with optional filtering and pagination.

#### `findById(id: string): Promise<AuditLog | null>`
Get a specific audit log by ID.

#### `findByUserId(userId: string, page?: number, limit?: number): Promise<PaginatedAuditLog[]>`
Get all logs for a specific user.

#### `findByEvent(event: Logs, page?: number, limit?: number): Promise<PaginatedAuditLog[]>`
Get all logs for a specific event type.

#### `deleteOldLogs(daysOld: number): Promise<number>`
Delete audit logs older than specified days (for cleanup).

---

## Usage Examples

### Using AuditLogService in Your Code

```typescript
import { AuditLogService } from './Audit-Log/Module/Audit-Log.Service';
import { Logs } from './Audit-Log/Model/Logs';

@Injectable()
export class MyService {
  constructor(private readonly auditLog: AuditLogService) {}

  async performAction(userId: string) {
    try {
      // Do something
      const result = await this.doSomething();
      
      // Log success
      await this.auditLog.log(Logs.DATA_EXPORT, userId, {
        action: 'exported_data',
        recordCount: result.length
      }).catch(() => {}); // Don't let logging errors fail the request
      
      return result;
    } catch (error) {
      // Log failure
      await this.auditLog.log(Logs.LOGIN_FAILED, userId, {
        error: error.message
      }).catch(() => {});
      
      throw error;
    }
  }
}
```

### Query Audit Logs

```bash
# Get all logs
curl http://localhost:6666/audit-logs \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Get LOGIN_SUCCESS events in last 24 hours
curl "http://localhost:6666/audit-logs?event=LOGIN_SUCCESS&startDate=2025-11-06T10:00:00Z" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Get logs for specific user
curl http://localhost:6666/audit-logs/user/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <JWT_TOKEN>"

# Get logs for specific event
curl http://localhost:6666/audit-logs/event/PASSWORD_CHANGED \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Export as CSV
curl "http://localhost:6666/audit-logs/export?format=csv&startDate=2025-11-01T00:00:00Z" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  > audit_logs.csv
```

---

## Best Practices

### When Logging Events

1. **Always catch logging errors:**
   ```typescript
   await this.audit.log(event, userId, details).catch(() => {});
   ```

2. **Include relevant details:**
   ```typescript
   await this.audit.log(Logs.ADMIN_DELETE_USER, adminId, {
     targetUserId: userId,
     reason: 'Duplicate account',
     deletedAt: new Date()
   });
   ```

3. **Use consistent event naming:**
   - Use past tense: `USER_CREATED`, `PASSWORD_CHANGED`
   - Be specific: `DATA_BACKUP_COMPLETED` not `BACKUP`
   - Group related events: `MFA_ENABLED`, `MFA_DISABLED`

4. **Don't log sensitive information:**
   ❌ Don't log passwords or tokens
   ✅ Log user actions and results

---

## Event Details Patterns

### Authentication Events

```json
{
  "email": "user@example.com",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "mfaEnabled": true
}
```

### Admin Actions

```json
{
  "targetUserId": "507f1f77bcf86cd799439012",
  "action": "delete",
  "reason": "Account abuse",
  "performedBy": "admin@example.com"
}
```

### Backup Events

```json
{
  "type": "scheduled",
  "filename": "scheduled_2025-11-07_02-00-00",
  "size": 1024000,
  "options": {
    "oplog": false,
    "dumpDbUsersAndRoles": false
  }
}
```

---

## Data Retention Policy

**Default:** Audit logs are kept indefinitely

**To implement retention:**
```typescript
// Run daily (e.g., via cron job)
await this.auditLogService.deleteOldLogs(90); // Delete logs older than 90 days
```

**Recommended Retention:**
- Security events (LOGIN, MFA, RBAC): 1 year
- User events (REGISTER, PASSWORD_CHANGED): 6 months
- Admin actions: 1 year
- Backup events: 1 month

---

## Querying Examples

### Find all failed login attempts

```bash
curl "http://localhost:6666/audit-logs?event=LOGIN_FAILED" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" | jq '.items'
```

### Find all admin actions in the last week

```bash
curl "http://localhost:6666/audit-logs?event=ADMIN_CREATED_USER&startDate=$(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%SZ)" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### Find all MFA events for a user

```bash
curl "http://localhost:6666/audit-logs/user/507f1f77bcf86cd799439011?event=MFA_ENABLED" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## Security Considerations

- 🔐 Only admins can view all audit logs
- 🔐 Users can only view their own logs (except admin logs)
- 🔐 Sensitive information should not be logged
- 🔐 Audit logs should be protected from modification
- 🔐 Consider enabling MongoDB encryption at rest

---

## Integration with Other Modules

The Audit Log Module is used by:
- **Authentication Module** - Logs login, logout, password changes
- **User Module** - Logs user creation, updates, deletions
- **Backup Module** - Logs backup operations
- **All modules** - For tracking operations

---

## Future Enhancements

- [ ] Real-time audit log streaming
- [ ] Advanced analytics dashboard
- [ ] Anomaly detection
- [ ] Compliance reporting (GDPR, SOC2)
- [ ] Log archiving to external storage
- [ ] Log encryption at rest
- [ ] Webhook notifications for critical events
- [ ] Audit log signing for immutability

---

**Last Updated:** November 7, 2025

