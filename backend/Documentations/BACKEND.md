# Backend Application Documentation

## Overview

This is a comprehensive NestJS backend application built with MongoDB for a software project management system. It includes user management, authentication with MFA, audit logging, and automated backup functionality.

## Quick Start

### Prerequisites

- Node.js 16+ 
- MongoDB 4.4+
- `mongodump` and `bsondump` tools (MongoDB Database Tools)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create .env file with required variables
cp .env.example .env

# Update .env with your configuration
nano .env

# Run database migrations (if applicable)
npm run migrate

# Start development server
npm run dev

# Start production server
npm run start

# Build for production
npm run build
```

### Environment Setup

```env
# Server Configuration
NODE_ENV=development
PORT=6666

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name

# JWT Authentication
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# Email Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password
MAIL_FROM=noreply@example.com

# Backup Configuration
BACKUP_DIR=./backups
BACKUP_MAX_COUNT=10
BACKUP_ENABLE_TEST=false
BACKUP_CRON_PROD=0 2 * * *
BACKUP_TIMEZONE=Africa/Cairo
```

---

## Project Structure

```
backend/
├── App/
│   └── App.Module.ts (Root module)
├── Authentication/
│   ├── Decorators/
│   ├── DTO's/
│   ├── Email/
│   ├── Guards/
│   ├── Interfaces/
│   ├── Module/
│   ├── Strategies/
│   ├── Token/
│   └── README.md
├── User/
│   ├── Model/
│   ├── Module/
│   ├── Validator/
│   └── README.md
├── Audit-Log/
│   ├── Model/
│   ├── Module/
│   ├── Validator/
│   └── README.md
├── Backup/
│   ├── Module/
│   ├── Scheduler/
│   ├── README.md
│   └── QUICK_START_GUIDE.md
├── package.json
├── tsconfig.json
└── README.md
```

---

## Core Modules

### 1. User Module (`/User`)
Handles user management, profiles, and role-based operations.

**Key Features:**
- User registration & profile management
- Search & filtering
- Role-based operations
- Email verification

**Read More:** [User Module Documentation](User.md)

---

### 2. Authentication Module (`/Authentication`)
Manages authentication, authorization, and security operations.

**Key Features:**
- JWT authentication
- Email verification with OTP
- Multi-factor authentication (MFA)
- Password reset
- Token blacklisting
- Role-based access control

**Read More:** [Authentication Module Documentation](Authentication.md)

---

### 3. Audit Log Module (`/Audit-Log`)
Tracks and records all significant events for compliance and debugging.

**Key Features:**
- Comprehensive event logging
- User action tracking
- Security event tracking
- Query & filtering
- Export capabilities

**Read More:** [Audit Log Module Documentation](Audit-Log.md)

---

### 4. Backup Module (`/Backup`)
Provides automated and manual database backup functionality.

**Key Features:**
- Scheduled automated backups
- Manual backup API
- BSON to JSON conversion
- Multi-database support
- Automatic cleanup & rotation

**Read More:** [Backup Module Documentation](BACKUP.md)

---

## API Overview

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| POST | `/auth/logout` | Logout user |
| POST | `/auth/verify-otp` | Verify email OTP |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password |
| POST | `/auth/change-password` | Change password |
| POST | `/auth/mfa/enable` | Enable MFA |
| POST | `/auth/mfa/verify` | Verify MFA code |
| DELETE | `/auth/mfa/disable` | Disable MFA |

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me` | Get current user profile |
| PATCH | `/users/me` | Update profile |
| DELETE | `/users/me` | Delete account |
| GET | `/users/name/:name` | Find by name |
| GET | `/users/search` | Search users (Admin) |
| GET | `/users/:id` | Get user by ID (Admin) |
| PATCH | `/users/:id` | Update user (Admin) |
| DELETE | `/users/:id` | Delete user (Admin) |

### Audit Log Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/audit-logs` | Get all logs (Admin) |
| GET | `/audit-logs/:id` | Get log by ID (Admin) |
| GET | `/audit-logs/user/:userId` | Get user logs |
| GET | `/audit-logs/event/:eventType` | Get event logs (Admin) |
| GET | `/audit-logs/export` | Export logs (Admin) |

### Backup Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/backups/create` | Create backup (Admin) |
| GET | `/api/backups/list` | List backups (Admin) |
| DELETE | `/api/backups/:filename` | Delete backup (Admin) |

---

## User Roles & Permissions

### Student (Default Role)
- ✅ View own profile
- ✅ Update own profile
- ✅ View own audit logs
- ❌ Cannot manage other users
- ❌ Cannot access admin endpoints

### Instructor
- ✅ All Student permissions
- ✅ Search users
- ✅ View user details
- ✅ Create announcements
- ❌ Cannot manage backups
- ❌ Cannot modify user roles

### Admin
- ✅ All permissions
- ✅ Manage all users
- ✅ Manage backups
- ✅ View all audit logs
- ✅ Modify user roles

---

## Authentication Flow

```
User Registration
    ↓
Send Verification OTP
    ↓
User Verifies Email
    ↓
User Logs In
    ↓
Check MFA Enabled?
    ├─ Yes: Send MFA Code → Verify MFA → Issue JWT
    └─ No: Issue JWT Directly
    ↓
User Authenticated
```

---

## Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  passwordHash: String (hashed with bcrypt),
  role: Enum ['Student', 'Instructor', 'Admin'],
  isEmailVerified: Boolean,
  otpCode: String,
  otpExpiresAt: Date,
  mfaEnabled: Boolean,
  mfaSecret: String (encrypted),
  mfaBackupCodes: [String],
  deletedAt: Date (soft delete),
  createdAt: Date,
  updatedAt: Date
}
```

### Audit Log Collection
```javascript
{
  _id: ObjectId,
  event: String,
  userId: ObjectId (ref: User),
  details: Object,
  timestamp: Date,
  ipAddress: String,
  userAgent: String
}
```

### Blacklisted Token Collection
```javascript
{
  _id: ObjectId,
  token: String (hashed),
  userId: ObjectId (ref: User),
  expiresAt: Date,
  createdAt: Date
}
```

---

## Deployment

### Development

```bash
npm run dev
```

Runs with hot reload on `http://localhost:6666`

### Production

```bash
npm run build
npm run start
```

or using PM2:

```bash
pm2 start dist/main.js --name "backend" --watch
```

### Docker

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 6666
CMD ["node", "dist/main.js"]
```

Build and run:
```bash
docker build -t backend:latest .
docker run -p 6666:6666 --env-file .env backend:latest
```

---

## Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm run test:cov
```

---

## Logging

The application uses NestJS Logger for console output:

```bash
# View logs
npm run dev 2>&1 | grep "Log"
```

For production, consider using:
- Winston
- Bunyan
- Pino

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "statusCode": 400,
  "message": "Invalid input",
  "error": "BadRequestException"
}
```

**Common Status Codes:**
- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Success, no content
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - No permission
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `500 Internal Server Error` - Server error

---

## Security Best Practices

- 🔐 **Passwords**: Hashed with bcrypt (10 salt rounds)
- 🔐 **Tokens**: JWT with configurable expiration
- 🔐 **MFA**: TOTP-based with backup codes
- 🔐 **Email**: Verified with OTP before account activation
- 🔐 **Audit**: All operations logged for compliance
- 🔐 **RBAC**: Role-based access control on all endpoints
- 🔐 **HTTPS**: Use HTTPS in production
- 🔐 **CORS**: Configure appropriate CORS settings
- 🔐 **Rate Limiting**: Implement rate limiting (not included)

---

## Performance Optimization

### Database Indexes

Create these indexes for better performance:

```javascript
// Users
db.users.createIndex({ email: 1 });
db.users.createIndex({ role: 1 });
db.users.createIndex({ createdAt: -1 });

// Audit Logs
db.auditlogs.createIndex({ timestamp: -1 });
db.auditlogs.createIndex({ userId: 1, timestamp: -1 });
db.auditlogs.createIndex({ event: 1, timestamp: -1 });

// Blacklisted Tokens
db.blacklistedtokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

### Caching

Consider adding:
- Redis for token caching
- User profile caching
- Audit log caching

### Query Optimization

- Always use pagination for large result sets
- Use field projection to limit returned data
- Create proper indexes before querying

---

## Monitoring & Maintenance

### Daily Checks

- [ ] Application is running
- [ ] No error spikes in logs
- [ ] Database is responsive
- [ ] Backups completed successfully

### Weekly Checks

- [ ] Review audit logs for anomalies
- [ ] Check disk space usage
- [ ] Verify backup integrity
- [ ] Update dependencies

### Monthly Checks

- [ ] Review security logs
- [ ] Update MongoDB
- [ ] Clean up old audit logs
- [ ] Test disaster recovery

---

## Troubleshooting

### Application Won't Start

```bash
# Check Node version
node --version

# Check MongoDB connection
mongosh "your_uri"

# Check port availability
lsof -i :6666

# View error logs
npm run dev 2>&1
```

### High Memory Usage

```bash
# Increase Node memory
node --max-old-space-size=4096 dist/main.js

# Check for memory leaks
npm install clinic
clinic doctor -- node dist/main.js
```

### Slow Queries

```bash
# Check MongoDB logs
db.currentOp()

# Analyze query plans
db.collection.find(...).explain("executionStats")
```

---

## Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update documentation
4. Use meaningful commit messages
5. Follow existing code style

---

## License

Proprietary - All rights reserved

---

## Support

For issues or questions:
1. Check module-specific documentation
2. Review error logs
3. Contact development team

---

## Related Documentation

- [User Module](User.md) - User management
- [Authentication Module](Authentication.md) - Auth & security
- [Audit Log Module](Audit-Log.md) - Event tracking
- [Backup Module](BACKUP.md) - Database backups
- [Backup Quick Start](QUICK_START_GUIDE.md) - Backup operations

---

**Last Updated:** November 7, 2025
**Version:** 1.0.0

