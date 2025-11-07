# Application Architecture & Setup Guide

## Overview

This document provides a comprehensive overview of the application architecture, setup procedures, and integration patterns for the NestJS backend application.

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Application                      │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP/HTTPS
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                    NestJS Application                        │
├──────────────────────────────────────────────────────────────┤
│ ┌────────────────┬──────────────┬──────────────────────────┐ │
│ │ Controllers    │ Guards       │ Decorators               │ │
│ └────────────────┴──────────────┴──────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────┐ │
│ │            Services (Business Logic)                      │ │
│ │  Auth    │  User    │  Audit   │  Backup    │  Email    │ │
│ └────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ ┌─────────────────────┬──────────────────────────────────────┐ │
│ │ MongoDB Mongoose    │ Schedulers & Jobs (NestJS Schedule)  │ │
│ │ (Data Layer)        │                                       │ │
│ └─────────────────────┴──────────────────────────────────────┘ │
└────────────────────────────┬───────────────────────────────────┘
                             │
            ┌────────────────┼────────────────┐
            ↓                ↓                ↓
      ┌──────────┐    ┌─────────────┐   ┌──────────┐
      │ MongoDB  │    │ Email SMTP  │   │ Mongodump│
      │ Database │    │ Service     │   │ Backup   │
      └──────────┘    └─────────────┘   └──────────┘
```

---

## Module Structure

### Module Dependency Graph

```
AppModule (Root)
    ├── ConfigModule (Global)
    ├── ScheduleModule
    ├── MongooseModule
    │
    ├── AuthModule
    │   ├── JwtModule
    │   ├── ConfigService
    │   ├── UserModule
    │   ├── MailModule
    │   └── MongooseModule (BlacklistedToken)
    │
    ├── UserModule
    │   ├── MongooseModule (User)
    │   └── AuthModule
    │
    ├── AuditLogModule
    │   └── MongooseModule (AuditLog)
    │
    └── BackupModule
        ├── ScheduleModule
        └── AuditLogModule
```

### Request Flow

```
HTTP Request
    ↓
NestJS Router
    ↓
Controller Handler
    ↓
Global Guards
    ├─ JwtAuthGuard (Validate token)
    ├─ RolesGuard (Check permissions)
    └─ MfaGuard (If required)
    ↓
Decorators
    ├─ @CurrentUser() (Extract user)
    ├─ @Roles() (Define required roles)
    └─ @Body()/@Param()/@Query() (Extract data)
    ↓
Service Method
    ├─ Validation
    ├─ Database Operation
    ├─ Audit Logging
    └─ Error Handling
    ↓
HTTP Response
```

---

## Authentication Flow Diagram

```
1. REGISTRATION
   User Data → Validate → Hash Password → Create User → Send OTP Email
   
2. EMAIL VERIFICATION
   OTP → Validate OTP → Mark Email Verified
   
3. LOGIN
   Email + Password → Validate Credentials → Generate JWT → Issue Token
   
4. MFA (if enabled)
   JWT (temp) → Send MFA Code → Verify Code → Issue Full JWT
   
5. PROTECTED REQUEST
   JWT → Validate Signature → Extract Claims → Check Roles → Allow/Deny
   
6. LOGOUT
   JWT → Add to Blacklist → Invalidate Token
```

---

## Database Schema

### Collections

#### Users
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (index),
  passwordHash: String,
  role: String (index),
  isEmailVerified: Boolean,
  otpCode: String,
  otpExpiresAt: Date,
  passwordResetOtpCode: String,
  passwordResetOtpExpiresAt: Date,
  mfaEnabled: Boolean,
  mfaSecret: String,
  mfaBackupCodes: [String],
  deletedAt: Date (soft delete),
  unreadNotificationCount: Number,
  createdAt: Date (index),
  updatedAt: Date
}
```

#### Audit Logs
```javascript
{
  _id: ObjectId,
  event: String (index),
  userId: ObjectId (index, ref: User),
  details: Object,
  ipAddress: String,
  userAgent: String,
  timestamp: Date (index)
}
```

#### Blacklisted Tokens
```javascript
{
  _id: ObjectId,
  token: String,
  userId: ObjectId (ref: User),
  blacklistedAt: Date,
  expiresAt: Date (TTL index - auto-delete)
}
```

---

## Configuration Management

### Environment Variables

```env
# Application
NODE_ENV=development
PORT=6666

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db_name

# JWT
JWT_SECRET=your_secret_key_min_32_chars
JWT_EXPIRES_IN=7d

# Email
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=app_specific_password
MAIL_FROM=noreply@example.com

# Backup
BACKUP_DIR=./backups
BACKUP_MAX_COUNT=10
BACKUP_ENABLE_TEST=false
BACKUP_CRON_TEST=*/1 * * * *
BACKUP_CRON_PROD=0 2 * * *
BACKUP_TIMEZONE=Africa/Cairo
BACKUP_USE_OPLOG=false
BACKUP_DUMP_USERS=false
```

### Loading Configuration

NestJS uses `ConfigService` to load environment variables:

```typescript
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MyService {
  constructor(private config: ConfigService) {
    const dbUri = config.get<string>('MONGODB_URI');
    const jwtSecret = config.get<string>('JWT_SECRET');
  }
}
```

---

## Guard & Decorator System

### Authentication Guards

#### JwtAuthGuard
```typescript
@UseGuards(JwtAuthGuard)
@Get('protected')
async protectedRoute() {
  // Only authenticated users
}
```

Validates JWT token and extracts user claims.

#### RolesGuard
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
@Get('admin-only')
async adminRoute() {
  // Only specified roles allowed
}
```

Checks if user has required role(s).

#### MfaGuard
```typescript
@UseGuards(MfaGuard)
@Post('sensitive')
async sensitiveOp() {
  // Requires MFA verification
}
```

For MFA-protected endpoints.

### Custom Decorators

#### @CurrentUser()
```typescript
@Get('profile')
async getProfile(@CurrentUser() user: JwtPayload) {
  // user = { sub, email, role, iat, exp }
}
```

Extracts authenticated user from JWT.

#### @Roles()
```typescript
@Roles(UserRole.ADMIN)
@Get('admin')
async adminEndpoint() {}
```

Specifies required roles.

#### @Public()
```typescript
@Public()
@Post('register')
async register() {}
```

Bypasses authentication (no JwtAuthGuard needed).

---

## Error Handling

### Global Exception Filter

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Handle all exceptions globally
  }
}
```

### Exception Types

```typescript
// BadRequestException (400)
throw new BadRequestException('Invalid input');

// UnauthorizedException (401)
throw new UnauthorizedException('Invalid credentials');

// ForbiddenException (403)
throw new ForbiddenException('Access denied');

// NotFoundException (404)
throw new NotFoundException('User not found');

// ConflictException (409)
throw new ConflictException('Email already in use');

// InternalServerErrorException (500)
throw new InternalServerErrorException('Database error');
```

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Invalid email format",
  "error": "BadRequestException",
  "timestamp": "2025-11-07T10:30:00Z"
}
```

---

## Middleware & Interceptors

### Middleware
```typescript
@Module({
  imports: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');
  }
}
```

### Interceptors
```typescript
@UseInterceptors(TransformInterceptor)
@Get('data')
getData() {}
```

---

## Scheduled Tasks (Cron Jobs)

### Backup Scheduler

```typescript
@Injectable()
export class CronBackupService {
  // Test backups
  @Cron('*/1 * * * *')
  async handleTestCron() {}
  
  // Production backups
  @Cron('0 2 * * *')
  async handleProdCron() {}
}
```

### Token Cleanup (TTL)

MongoDB automatically deletes expired tokens via TTL index:

```typescript
@Index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
export class BlacklistedToken {}
```

---

## Testing Strategy

### Unit Tests
```typescript
describe('UserService', () => {
  it('should create a user', async () => {
    const result = await service.create(dto);
    expect(result).toHaveProperty('_id');
  });
});
```

### E2E Tests
```bash
curl -X POST http://localhost:6666/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"Pass123!"}'
```

---

## Performance Considerations

### Database Optimization

1. **Indexes**: Create indexes on frequently queried fields
```javascript
db.users.createIndex({ email: 1 });
db.auditlogs.createIndex({ timestamp: -1 });
```

2. **Query Projection**: Only select needed fields
```typescript
findOne(id).select('name email role');
```

3. **Pagination**: Always paginate large result sets
```typescript
find().limit(20).skip(page * 20);
```

### Memory Optimization

1. **Streaming**: For large data transfers
2. **Lazy Loading**: Load data on demand
3. **Caching**: Redis for frequently accessed data

### Network Optimization

1. **Compression**: Enable gzip
2. **Batch Operations**: Combine multiple operations
3. **Connection Pooling**: Reuse database connections

---

## Deployment Scenarios

### Local Development
```bash
npm install
npm run dev
```

### Docker Development
```bash
docker-compose up
```

### Production (PM2)
```bash
npm run build
pm2 start dist/main.js --name backend
```

### Production (Docker)
```bash
docker build -t backend:1.0 .
docker run -p 6666:6666 --env-file .env backend:1.0
```

---

## Monitoring & Debugging

### Application Logs
```bash
npm run dev 2>&1 | tee app.log
```

### Database Monitoring
```bash
# Connect to MongoDB
mongosh

# Check current operations
db.currentOp()

# View slow queries
db.collection.find().explain("executionStats")
```

### Performance Profiling
```bash
npm install clinic
clinic doctor -- node dist/main.js
```

---

## Security Checklist

- [ ] JWT_SECRET is strong (32+ characters)
- [ ] Passwords hashed with bcrypt
- [ ] HTTPS enabled in production
- [ ] CORS configured appropriately
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] SQL/NoSQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Environment variables not hardcoded
- [ ] Audit logging enabled
- [ ] Backup encryption considered

---

## Troubleshooting Guide

### Application Won't Start
```bash
# Check Node version
node --version  # Should be 16+

# Check MongoDB connection
mongosh "your_uri"

# View startup errors
npm run dev 2>&1
```

### High CPU Usage
```bash
# Profile the application
npm install clinic
clinic doctor -- node dist/main.js
```

### High Memory Usage
```bash
# Increase Node memory
node --max-old-space-size=4096 dist/main.js
```

### Slow API Responses
```bash
# Enable query profiling
db.setProfilingLevel(1, { slowms: 100 })

# Check slow queries
db.system.profile.find().sort({ ts: -1 }).limit(10).pretty()
```

---

## Integration Examples

### Using AuthService in a Controller

```typescript
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private auditLog: AuditLogService
  ) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    try {
      const result = await this.authService.login(dto.email, dto.password);
      await this.auditLog.log(Logs.LOGIN_SUCCESS, result.user._id, { email: dto.email });
      return result;
    } catch (error) {
      await this.auditLog.log(Logs.LOGIN_FAILED, undefined, { email: dto.email, error: error.message });
      throw error;
    }
  }
}
```

### Using AuditLogService

```typescript
@Injectable()
export class UserService {
  constructor(private auditLog: AuditLogService) {}

  async deleteUser(id: string, adminId: string) {
    await this.users.updateOne({ _id: id }, { deletedAt: new Date() });
    await this.auditLog.log(
      Logs.ADMIN_DELETE_USER,
      adminId,
      { targetUserId: id, deletedAt: new Date() }
    ).catch(() => {});
  }
}
```

---

## Best Practices

1. **Error Handling**: Always use try-catch and log errors
2. **Validation**: Validate input before processing
3. **Audit Logging**: Log all important operations
4. **Security**: Never log sensitive information
5. **Performance**: Use pagination for large datasets
6. **Testing**: Write tests for critical paths
7. **Documentation**: Keep docs updated
8. **Version Control**: Use semantic versioning

---

**Last Updated:** November 7, 2025
**Architecture Version:** 1.0

