# User Module

## Overview

The User Module handles all user-related operations including user management, profiles, searching, and role-based user administration. It provides endpoints for users to manage their own accounts and for administrators/instructors to manage other users.

## Features

- ✅ User registration & profile management
- ✅ User search & filtering (Admin/Instructor)
- ✅ Soft delete support
- ✅ Role-based user management
- ✅ Email verification
- ✅ MFA support
- ✅ Notification tracking
- ✅ Pagination & sorting

## Architecture

```
User Module
├── Model/
│   └── User.ts (User schema & model)
├── Module/
│   ├── User-Module.ts (NestJS module)
│   ├── User-Controller.ts (API endpoints)
│   └── User-Service.ts (Business logic)
└── Validator/
    ├── User-Validator.ts (DTOs)
    └── public-userDTO.ts (Public response DTO)
```

## User Schema

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | ✓ | User's full name |
| `email` | String | ✓ | Unique email address |
| `passwordHash` | String | ✓ | Hashed password (never selected by default) |
| `role` | Enum | | User role (Student/Instructor/Admin) |
| `isEmailVerified` | Boolean | | Email verification status |
| `otpCode` | String | | OTP for email verification |
| `otpExpiresAt` | Date | | OTP expiration timestamp |
| `passwordResetOtpCode` | String | | OTP for password reset |
| `passwordResetOtpExpiresAt` | Date | | Password reset OTP expiration |
| `mfaEnabled` | Boolean | | Multi-factor authentication status |
| `mfaSecret` | String | | MFA secret (not selected by default) |
| `mfaBackupCodes` | String[] | | Backup codes for MFA (not selected by default) |
| `deletedAt` | Date | | Soft delete timestamp |
| `unreadNotificationCount` | Number | | Count of unread notifications |
| `notificationsPreview` | Object[] | | Recent notifications preview |
| `createdAt` | Date | | Account creation timestamp |
| `updatedAt` | Date | | Last update timestamp |

### User Roles

```typescript
enum UserRole {
  STUDENT = 'Student',
  INSTRUCTOR = 'Instructor',
  ADMIN = 'Admin',
}
```

## API Endpoints

### Public Endpoints (Authenticated Users)

#### Get User Profile

```http
GET /users/me
```

**Description:** Get the current logged-in user's profile

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:** `PublicUserDto`
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "Student",
  "isEmailVerified": true,
  "createdAt": "2025-11-01T10:00:00Z"
}
```

**Status Codes:**
- `200 OK` - User profile retrieved
- `401 Unauthorized` - Invalid/missing token

---

#### Update User Profile

```http
PATCH /users/me
```

**Description:** Update current user's profile information

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:** `UpdateUserDto`
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

**Response:** `PublicUserDto`

**Status Codes:**
- `200 OK` - Profile updated
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Invalid/missing token
- `409 Conflict` - Email already in use

---

#### Delete User Account

```http
DELETE /users/me
```

**Description:** Delete current user's account (soft delete)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true
}
```

**Status Codes:**
- `204 No Content` - Account deleted
- `401 Unauthorized` - Invalid/missing token

---

#### Find User by Name

```http
GET /users/name/:name
```

**Description:** Search for a user by name

**Parameters:**
- `name` (string) - User's name to search

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:** `PublicUserDto`

**Status Codes:**
- `200 OK` - User found
- `404 Not Found` - User not found
- `401 Unauthorized` - Invalid/missing token

---

### Admin/Instructor Endpoints

#### Search Users

```http
GET /users/search
```

**Description:** Search and filter users (Admin/Instructor only)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `q` (string, optional) - Search query
- `role` (string, optional) - Filter by role
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Results per page
- `sort` (string, optional) - Sort field and direction (e.g., `createdAt:desc`)

**Response:**
```json
{
  "items": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "Student",
      "createdAt": "2025-11-01T10:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "pages": 8,
  "limit": 20
}
```

**Status Codes:**
- `200 OK` - Users found
- `401 Unauthorized` - Invalid/missing token
- `403 Forbidden` - Insufficient permissions

---

#### Get User by ID

```http
GET /users/:id
```

**Description:** Get user details by ID (Admin/Instructor only)

**Parameters:**
- `id` (string) - User's MongoDB ObjectId

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:** `PublicUserDto`

**Status Codes:**
- `200 OK` - User found
- `404 Not Found` - User not found
- `401 Unauthorized` - Invalid/missing token
- `403 Forbidden` - Insufficient permissions

---

#### Update User (Admin)

```http
PATCH /users/:id
```

**Description:** Update any user's information (Admin only)

**Parameters:**
- `id` (string) - User's MongoDB ObjectId

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:** `UpdateUserDto`

**Response:** `PublicUserDto`

**Status Codes:**
- `200 OK` - User updated
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Invalid/missing token
- `403 Forbidden` - Not an admin
- `404 Not Found` - User not found
- `409 Conflict` - Email already in use

---

#### Delete User (Admin)

```http
DELETE /users/:id
```

**Description:** Delete any user account (Admin only, soft delete)

**Parameters:**
- `id` (string) - User's MongoDB ObjectId

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true
}
```

**Status Codes:**
- `204 No Content` - User deleted
- `401 Unauthorized` - Invalid/missing token
- `403 Forbidden` - Not an admin
- `404 Not Found` - User not found

---

## Data Transfer Objects (DTOs)

### UpdateUserDto

```typescript
{
  name?: string;
  email?: string;
  role?: UserRole; // Admin only
}
```

### PublicUserDto

```typescript
{
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Service Methods

### UserService

#### `create(dto: CreateUserDto): Promise<User>`
Create a new user with the provided information.

#### `findByEmail(email: string): Promise<User | null>`
Find user by email address.

#### `findById(id: string): Promise<User | null>`
Find user by MongoDB ObjectId.

#### `findByName(name: string): Promise<User | null>`
Find user by name.

#### `updateUser(id: string, dto: UpdateUserDto): Promise<User>`
Update user information.

#### `updateUserInternal(id: string, updates: any): Promise<User>`
Internal method to update user without validation.

#### `deleteUser(id: string): Promise<void>`
Soft delete user by setting `deletedAt` timestamp.

#### `search(query: string, role?: UserRole, page?: number, limit?: number): Promise<PaginatedResult<User>>`
Search users with optional filtering.

#### `getUserProfile(id: string): Promise<User>`
Get full user profile (for authenticated users).

## Usage Examples

### Register New User

```bash
curl -X POST http://localhost:6666/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'
```

### Get Current User Profile

```bash
curl http://localhost:6666/users/me \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Update Profile

```bash
curl -X PATCH http://localhost:6666/users/me \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe"
  }'
```

### Search Users (Admin)

```bash
curl "http://localhost:6666/users/search?q=john&role=Student&page=1&limit=20" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### Delete Account

```bash
curl -X DELETE http://localhost:6666/users/me \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

## Security Considerations

- 🔐 Passwords are hashed using bcrypt and never returned
- 🔐 MFA secrets and backup codes are not selected by default
- 🔐 Sensitive fields are stripped from JSON responses
- 🔐 Email verification required for account security
- 🔐 Soft delete preserves data for audit trails
- 🔐 Role-based access control on admin endpoints

## Error Handling

| Error | Status | Description |
|-------|--------|-------------|
| `BadRequestException` | 400 | Invalid input data |
| `UnauthorizedException` | 401 | Missing/invalid authentication |
| `ForbiddenException` | 403 | Insufficient permissions |
| `NotFoundException` | 404 | User not found |
| `ConflictException` | 409 | Email already in use |

## Dependencies

- `@nestjs/common` - NestJS core
- `@nestjs/mongoose` - MongoDB integration
- `mongoose` - MongoDB ODM
- `bcrypt` - Password hashing
- `@nestjs/jwt` - JWT authentication

## Module Integration

The User Module integrates with:
- **Authentication Module** - For user registration & authentication
- **Audit Log Module** - For logging user operations
- **Email Module** - For email verification

## Testing

### Create Test User

```bash
# Register
curl -X POST http://localhost:6666/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123!"
  }'

# Verify OTP (check your email)
curl -X POST http://localhost:6666/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otpCode": "123456"
  }'

# Login to get token
curl -X POST http://localhost:6666/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'

# Use token for user endpoints
export TOKEN="<received_access_token>"
curl http://localhost:6666/users/me \
  -H "Authorization: Bearer $TOKEN"
```

## Future Enhancements

- [ ] User profile pictures
- [ ] Social media integration
- [ ] User preferences/settings
- [ ] Batch user operations
- [ ] User activity tracking
- [ ] Advanced search filters
- [ ] Export user data
- [ ] User analytics

---

**Last Updated:** November 7, 2025

