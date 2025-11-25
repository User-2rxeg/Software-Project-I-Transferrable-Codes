# App Directory

## Overview

The `App` directory is the **core entry point** of the NestJS application. It contains the application bootstrap file and the root module that orchestrates all feature modules.

## 📁 Directory Structure

```
App/
├── App.ts           # Application bootstrap & configuration
└── App.Module.ts    # Root module - imports all feature modules
```

## 📄 File Descriptions

### **App.ts** - Bootstrap Entry Point

This is the main application startup file. It:

- **Creates the NestJS application** using `NestFactory.create()`
- **Configures Global Pipes** - Enables `ValidationPipe` with whitelist and automatic transformation
- **Sets up CORS** - Allows requests from localhost:3999, 3000, 5000
- **Initializes Swagger API Documentation** - Generates OpenAPI docs at `/api`
- **Configures JWT Bearer Authentication** - For API security
- **Starts the server** - Listens on port 5000 (or custom PORT env var)

**Key Features:**
- Validation of incoming requests with whitelist enabled
- CORS support for multiple frontend origins
- Swagger documentation for API endpoints
- Bearer token (JWT) authentication setup

### **App.Module.ts** - Root Module

The main NestJS module that imports and configures all feature modules:

**Imports:**
- `ConfigModule` - Environment variable management (global)
- `ScheduleModule` - For scheduled tasks and cron jobs
- `MongooseModule` - MongoDB connection with async configuration
- All Feature Modules:
  - `UserModule` - User management
  - `AuthModule` - Authentication, JWT, MFA, OTP
  - `AuditLogModule` - Event tracking and compliance
  - `BackupModule` - Database backup scheduling
  - `NotificationModule` - Real-time notifications
  - `ChatModule` - Real-time chat
  - `FeedbackModule` - User feedback
  - `AdminModule` - Admin operations

**Global Providers (Guards):**
- `JwtAuthGuard` - Validates JWT tokens globally
- `RolesGuard` - Checks user roles for authorization globally

**Database Configuration:**
- Connects to MongoDB using environment variable `MONGODB_URI`
- Uses async factory pattern for dependency injection

## 🔄 Data Flow

```
Request → App.ts (bootstrap)
    ↓
App.Module.ts (loads all modules)
    ↓
Global Guards (Authentication & Authorization)
    ↓
Route Handlers / Services
    ↓
Response
```

## 🔐 Security Features

✅ Global JWT Authentication Guard  
✅ Role-Based Access Control (RBAC) Guard  
✅ Input validation with whitelist  
✅ CORS protection  
✅ Environment variable management  

## 🚀 How to Run

```bash
# Development
npm run dev

# Production
npm run build
npm run start

# With custom port
PORT=3000 npm run dev
```

## 📊 Port Configuration

- **Default Port:** `5000`
- **Swagger UI:** `http://localhost:5000/api`
- **API Base:** `http://localhost:5000`
- **Custom Port:** Set via `PORT` environment variable

## 🔗 Related Documentation

- [Authentication Module](./Authentication.md) - JWT & Guard setup
- [Audit Logging](./Audit-Log.md) - Event tracking
- [Getting Started](./GETTING_STARTED.md) - Installation guide

