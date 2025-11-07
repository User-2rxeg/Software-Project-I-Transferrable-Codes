# Backend Documentation

Welcome to the backend documentation. Start with the guide below or jump to any module.

## 📚 Quick Navigation

### Getting Started
- **[Installation & Setup](./GETTING_STARTED.md)** - How to install and configure

### Core Modules  
- **[Authentication](./Authentication.md)** - JWT, MFA, OTP, security
- **[User Management](./User.md)** - User profiles and admin
- **[Audit Logging](./Audit-Log.md)** - Event tracking and compliance
- **[Backup System](Backup_System.md)** - Database backups

### Communication
- **[Admin](Admin.md)** - Administrative operations
- **[Chat](Chat.md)** - Real-time messaging
- **[Feedback](User-Feedback.md)** - User feedback management
- **[Notifications](Notifications.md)** - Real-time notifications

### System Design
- **[Architecture](./ARCHITECTURE.md)** - System design and patterns

---

## 🚀 Quick Start (5 minutes)

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# 3. Start
npm run dev
# Server runs on http://localhost:6666
```

## 🔐 Key Features

✅ JWT Authentication with MFA  
✅ Role-Based Access Control (RBAC)  
✅ Comprehensive Audit Logging  
✅ Automated Database Backups  
✅ Real-time Chat & Notifications  
✅ User Feedback System  

## 📋 All Modules

| Module | Purpose | Endpoints |
|--------|---------|-----------|
| Authentication | JWT, MFA, OTP, security | 11+ |
| User | User management & profiles | 8+ |
| Audit Log | Event tracking | 5+ |
| Backup | Database backups | 3+ |
| Admin | Admin operations | 9+ |
| Chat | Real-time messaging | 6+ |
| Feedback | User feedback | 6+ |
| Notifications | Real-time notifications | Gateway |

## 🏗️ Project Structure

```
backend/
├── Authentication/    # JWT, MFA, OTP, guards
├── User/            # User management
├── Audit-Log/       # Event logging
├── Backup/          # Database backups
├── Admin/           # Admin operations
├── Communication/
│   ├── Chat/        # Messaging
│   ├── Feedback/    # Feedback
│   └── Notification/ # Real-time notifications
└── App/             # Root module
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# API testing
# See GETTING_STARTED.md for examples
```

## 🐛 Troubleshooting

**MongoDB Connection Issues**
- Check connection string in .env
- Verify MongoDB is running
- See GETTING_STARTED.md for details

**JWT/Authentication Errors**
- Verify JWT_SECRET in .env
- Check token expiration
- See Authentication.md for details

**Permission Denied**
- Verify user has correct role
- Check Authorization header
- See ADMIN.md for access control

See individual module docs for module-specific issues.

---

**Last Updated:** November 7, 2025


