# Authentication Module

## Overview

The Authentication Module handles user authentication, authorization, and security operations. It provides JWT-based authentication, MFA support, email verification, password management, and token blacklisting.

## Features

- ✅ User registration & login
- ✅ JWT token authentication
- ✅ Email verification with OTP
- ✅ Multi-factor authentication (MFA)
- ✅ Password reset functionality
- ✅ Token blacklisting
- ✅ Role-based access control (RBAC)
- ✅ Automatic token expiration

## Architecture

```
Authentication Module
├── Decorators/
│   ├── Current-User.ts (Extract user from token)
│   ├── Public-Decorator.ts (Public endpoints)
│   └── Roles-Decorator.ts (Role requirements)
├── DTO's/
│   ├── Login.ts (Login request)
│   ├── MFA.ts (MFA operations)
│   ├── OTP.ts (OTP operations)
│   └── Responses.ts (Auth responses)
├── Email/
│   ├── Email-Module.ts
│   └── Email-Service.ts
├── Guards/
│   ├── Authentication-Guard.ts (JWT validation)
│   ├── MFA-Guard.ts (MFA validation)
│   └── Roles-Guard.ts (Role validation)
├── Interfaces/
│   └── JWT-Payload.ts
├── Module/
│   ├── Authentication-Module.ts (NestJS module)
│   ├── Authentication-Controller.ts (API endpoints)
│   └── Authentication-Service.ts (Business logic)
├── Strategies/
│   ├── JWT-Strategies.ts (JWT strategy)
│   └── MFA-JWT-Strategies.ts (MFA strategy)
└── Token/
    ├── blacklisted-token.schema.ts (Blacklist model)
    └── token.helper.ts (Token utilities)
```

## User Roles

```typescript
enum UserRole {
  STUDENT = 'Student',
  INSTRUCTOR = 'Instructor',
  ADMIN = 'Admin',
}
```

## JWT Payload Structure

```typescript
{
  sub: string;           // User ID
  email: string;         // User email
  role: UserRole;        // User role
  iat: number;          // Issued at
  exp: number;          // Expiration time
}
```

## API Endpoints

### Public Endpoints

#### Register User

```http
POST /auth/register
```

**Description:** Create a new user account

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "message": "Registered. Verify email via OTP.",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Student",
    "isEmailVerified": false
  }
}
```

**Status Codes:**
- `201 Created` - User registered successfully
- `400 Bad Request` - Invalid input
- `409 Conflict` - Email already in use

**Audit Logs:**
- `USER_REGISTERED` - User account created
- `OTP_SENT` - Verification OTP sent
- `OTP_SEND_FAILED` - Failed to send OTP

---

#### Verify Email OTP

```http
POST /auth/verify-otp
```

**Description:** Verify user's email with OTP code

**Request Body:**
```json
{
  "email": "john@example.com",
  "otpCode": "123456"
}
```

**Response:**
```json
{
  "message": "Email verified successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "isEmailVerified": true
  }
}
```

**Status Codes:**
- `200 OK` - Email verified
- `400 Bad Request` - Invalid/expired OTP
- `404 Not Found` - User not found

**Audit Logs:**
- `EMAIL_VERIFIED` - Email verified successfully

---

#### Login

```http
POST /auth/login
```

**Description:** Authenticate user and receive JWT token

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": "7d",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "role": "Student",
    "mfaEnabled": false
  }
}
```

**Status Codes:**
- `200 OK` - Login successful
- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - Account not verified

**Audit Logs:**
- `LOGIN_SUCCESS` - Successful login
- `LOGIN_FAILED` - Failed login attempt

---

#### Logout

```http
POST /auth/logout
```

**Description:** Logout and blacklist current token

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

**Status Codes:**
- `200 OK` - Logout successful
- `401 Unauthorized` - Invalid/missing token

**Audit Logs:**
- `LOGOUT` - User logged out
- `TOKEN_BLACKLISTED` - Token blacklisted

---

#### Request Password Reset

```http
POST /auth/forgot-password
```

**Description:** Request password reset OTP via email

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "message": "If email exists, password reset OTP will be sent"
}
```

**Status Codes:**
- `200 OK` - OTP sent (or user not found - same response for security)

**Audit Logs:**
- `PASSWORD_RESET_REQUESTED` - Password reset requested

---

#### Reset Password

```http
POST /auth/reset-password
```

**Description:** Reset password using OTP

**Request Body:**
```json
{
  "email": "john@example.com",
  "otpCode": "123456",
  "newPassword": "NewSecurePassword123!"
}
```

**Response:**
```json
{
  "message": "Password reset successfully"
}
```

**Status Codes:**
- `200 OK` - Password reset
- `400 Bad Request` - Invalid/expired OTP
- `404 Not Found` - User not found

**Audit Logs:**
- `PASSWORD_RESET_COMPLETED` - Password reset successfully
- `PASSWORD_CHANGED` - Password changed

---

### Protected Endpoints

#### Get Current User

```http
GET /auth/me
```

**Description:** Get authenticated user's information

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "role": "Student",
  "isEmailVerified": true,
  "mfaEnabled": false
}
```

**Status Codes:**
- `200 OK` - User info retrieved
- `401 Unauthorized` - Invalid/expired token

---

#### Enable MFA

```http
POST /auth/mfa/enable
```

**Description:** Enable multi-factor authentication

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "secret": "JBSWY3DPEBLW64TMMQ6ACK3SSGE======",
  "qrCode": "data:image/png;base64,...",
  "backupCodes": ["code1", "code2", "code3", "..."]
}
```

**Status Codes:**
- `200 OK` - MFA setup initiated
- `401 Unauthorized` - Invalid/expired token
- `400 Bad Request` - MFA already enabled

**Audit Logs:**
- `MFA_ENABLED` - MFA enabled for user

---

#### Verify MFA Code

```http
POST /auth/mfa/verify
```

**Description:** Verify MFA code during login or setup

**Request Body:**
```json
{
  "token": "123456"
}
```

**Response:**
```json
{
  "message": "MFA verified successfully",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer"
}
```

**Status Codes:**
- `200 OK` - MFA verified
- `401 Unauthorized` - Invalid MFA code

---

#### Disable MFA

```http
DELETE /auth/mfa/disable
```

**Description:** Disable multi-factor authentication

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "message": "MFA disabled successfully"
}
```

**Status Codes:**
- `200 OK` - MFA disabled
- `401 Unauthorized` - Invalid/expired token

**Audit Logs:**
- `MFA_DISABLED` - MFA disabled for user

---

#### Change Password

```http
POST /auth/change-password
```

**Description:** Change password for authenticated user

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

**Status Codes:**
- `200 OK` - Password changed
- `401 Unauthorized` - Invalid current password or token

**Audit Logs:**
- `PASSWORD_CHANGED` - User changed password

---

## Guards & Decorators

### JwtAuthGuard

Validates JWT tokens and extracts user information from the token payload.

**Usage:**
```typescript
@UseGuards(JwtAuthGuard)
@Get('protected')
async protectedRoute(@CurrentUser() user: JwtPayload) {
  // Only authenticated users can access
}
```

---

### RolesGuard

Validates user roles based on `@Roles()` decorator.

**Usage:**
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
@Get('admin-only')
async adminRoute() {
  // Only ADMIN or INSTRUCTOR can access
}
```

**Audit Logs:**
- `RBAC_AUTHORIZED` - User authorized for role
- `UNAUTHORIZED_ACCESS` - User denied access due to role

---

### MfaGuard

Validates MFA verification for users with MFA enabled.

**Usage:**
```typescript
@UseGuards(MfaGuard)
@Post('sensitive-operation')
async sensitiveOp() {
  // Requires MFA verification
}
```

---

### CurrentUser Decorator

Extracts the authenticated user from JWT token.

**Usage:**
```typescript
@Get('profile')
async getProfile(@CurrentUser() user: JwtPayload) {
  console.log(user.sub);    // User ID
  console.log(user.email);  // Email
  console.log(user.role);   // Role
}
```

---

### Roles Decorator

Specifies required roles for an endpoint.

**Usage:**
```typescript
@Roles(UserRole.ADMIN)
@Get('admin-dashboard')
async adminDashboard() {
  // Only admins can access
}
```

---

### Public Decorator

Marks endpoints as public (no authentication required).

**Usage:**
```typescript
@Public()
@Post('register')
async register(@Body() dto: CreateUserDto) {
  // No authentication required
}
```

---

## Service Methods

### AuthService

#### `register(dto: CreateUserDto): Promise<{ message: string; user: SafeUser }>`
Register a new user account.

#### `verifyOTP(email: string, otpCode: string): Promise<{ message: string; user: SafeUser }>`
Verify email with OTP code.

#### `login(email: string, password: string): Promise<{ access_token: string; expires_in: string; user: SafeUser }>`
Authenticate user and return JWT token.

#### `logout(token: string): Promise<{ message: string }>`
Logout user and blacklist token.

#### `forgotPassword(email: string): Promise<{ message: string }>`
Request password reset OTP.

#### `resetPassword(email: string, otpCode: string, newPassword: string): Promise<{ message: string }>`
Reset password using OTP.

#### `changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }>`
Change password for authenticated user.

#### `enableMFA(userId: string): Promise<{ secret: string; qrCode: string; backupCodes: string[] }>`
Initialize MFA setup.

#### `verifyMFA(userId: string, token: string): Promise<{ message: string }>`
Verify MFA code.

#### `disableMFA(userId: string): Promise<{ message: string }>`
Disable MFA for user.

---

## Configuration

Required environment variables in `.env`:

```env
# JWT Configuration
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# Email Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password
MAIL_FROM=noreply@example.com

# OTP Configuration
OTP_EXPIRY_MINUTES=10
RESET_OTP_EXPIRY_MINUTES=30
```

---

## Security Features

🔐 **Password Security:**
- Passwords hashed with bcrypt (salt rounds: 10)
- Never stored or transmitted in plain text
- Never returned in API responses

🔐 **Token Security:**
- JWT tokens with configurable expiration (default: 7 days)
- Automatic token blacklisting on logout
- Token validation on every protected request

🔐 **MFA Support:**
- TOTP-based (Time-based One-Time Password)
- Backup codes for account recovery
- QR code generation for authenticator apps

🔐 **Email Verification:**
- OTP required to verify email
- OTP expires after 10 minutes
- Automatic resend functionality

🔐 **Audit Logging:**
- All authentication events logged
- Login attempts tracked
- Password changes recorded

---

## Error Handling

| Error | Status | Description |
|-------|--------|-------------|
| `BadRequestException` | 400 | Invalid input or validation error |
| `UnauthorizedException` | 401 | Invalid credentials or expired token |
| `ForbiddenException` | 403 | Insufficient permissions or MFA required |
| `NotFoundException` | 404 | User not found |
| `ConflictException` | 409 | Email already in use or resource conflict |

---

## Usage Examples

### Complete Auth Flow

```bash
# 1. Register
curl -X POST http://localhost:6666/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'

# 2. Verify OTP (check email)
curl -X POST http://localhost:6666/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "otpCode": "123456"
  }'

# 3. Login
curl -X POST http://localhost:6666/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'

# Save the token
export TOKEN="<access_token_from_response>"

# 4. Get current user
curl http://localhost:6666/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 5. Change password
curl -X POST http://localhost:6666/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "SecurePass123!",
    "newPassword": "NewSecurePass123!"
  }'

# 6. Enable MFA
curl -X POST http://localhost:6666/auth/mfa/enable \
  -H "Authorization: Bearer $TOKEN"

# 7. Logout
curl -X POST http://localhost:6666/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

### Password Reset Flow

```bash
# 1. Request password reset
curl -X POST http://localhost:6666/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com"}'

# 2. Check email for OTP (valid for 30 minutes)

# 3. Reset password
curl -X POST http://localhost:6666/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "otpCode": "654321",
    "newPassword": "AnotherNewPassword123!"
  }'

# 4. Login with new password
curl -X POST http://localhost:6666/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "AnotherNewPassword123!"
  }'
```

---

## Dependencies

- `@nestjs/common` - NestJS core
- `@nestjs/jwt` - JWT authentication
- `@nestjs/passport` - Passport authentication
- `passport-jwt` - JWT strategy
- `bcrypt` - Password hashing
- `speakeasy` - TOTP generation
- `qrcode` - QR code generation

---

## Module Integration

Authentication Module integrates with:
- **User Module** - For user management
- **Email Module** - For sending verification emails
- **Audit Log Module** - For logging authentication events
- **App Module** - Global JwtAuthGuard

---

## Best Practices

1. **Token Management:**
   - Store tokens securely on client side
   - Use HTTPS only in production
   - Don't expose tokens in logs

2. **Password Policy:**
   - Enforce strong passwords
   - Encourage password changes regularly
   - Hash passwords with bcrypt

3. **MFA Usage:**
   - Recommend MFA for admin accounts
   - Store backup codes securely
   - Test backup code functionality

4. **Rate Limiting:**
   - Limit login attempts
   - Limit OTP requests
   - Implement exponential backoff

---

## Future Enhancements

- [ ] OAuth 2.0 integration (Google, GitHub)
- [ ] Social login support
- [ ] Biometric authentication
- [ ] Session management
- [ ] Device fingerprinting
- [ ] Suspicious activity alerts
- [ ] IP whitelisting
- [ ] Account lockout after failed attempts

---

**Last Updated:** November 7, 2025

