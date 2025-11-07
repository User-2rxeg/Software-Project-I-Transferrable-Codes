# Getting Started - Installation & Setup

## 5-Minute Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# 3. Start development server
npm run dev
# Server runs on http://localhost:6666
```

## Prerequisites

- **Node.js** 16+ installed
- **npm** or yarn installed
- **MongoDB** 4.4+ running (local or MongoDB Atlas)
- **Git** installed
- **cURL** or Postman for testing

## Detailed Installation

### Step 1: Clone & Install
```bash
git clone <repository-url>
cd backend
npm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
# Server
NODE_ENV=development
PORT=6666

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/db_name

# JWT
JWT_SECRET=your_secret_key_here_min_32_chars_long
JWT_EXPIRES_IN=7d

# Email (optional)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
MAIL_FROM=noreply@example.com

# Backup
BACKUP_DIR=./backups
BACKUP_MAX_COUNT=10
BACKUP_ENABLE_TEST=false
BACKUP_CRON_PROD=0 2 * * *
BACKUP_TIMEZONE=Africa/Cairo
```

### Step 3: Test MongoDB Connection
```bash
mongosh "your_connection_string"
# Should connect successfully
exit
```

### Step 4: Start Server
```bash
npm run dev
```

Expected output:
```
[Nest] ... LOG [NestApplication] Nest application successfully started
```

## Testing the API

### 1. Register a User
```bash
curl -X POST http://localhost:6666/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### 2. Verify with OTP
```bash
curl -X POST http://localhost:6666/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "otpCode": "123456"
  }'
```

### 3. Login
```bash
curl -X POST http://localhost:6666/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### 4. Get Your Profile
```bash
# Save the token from login response
export TOKEN="eyJhbGci..."

curl http://localhost:6666/users/me \
  -H "Authorization: Bearer $TOKEN"
```

## Testing Backup System

### Prerequisites
- Admin user with JWT token
- mongodump and bsondump installed

### Test Steps

**1. Get Admin Token**
```bash
curl -X POST http://localhost:6666/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password"
  }'

export TOKEN="eyJhbGci..."
```

**2. Create Manual Backup**
```bash
curl -X POST http://localhost:6666/backups/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "manual-test",
    "oplog": false,
    "dumpDbUsersAndRoles": false
  }'
```

**3. List Backups**
```bash
curl http://localhost:6666/backups/list \
  -H "Authorization: Bearer $TOKEN"
```

**4. Verify Backup Content**
```bash
cd backend/backups
ls -la                    # See backup folders
cd manual-test_*/         # Enter backup folder
ls -la                    # Should see .json files, NOT .bson files
cat software_project_1/users.json | head -50  # View JSON content
```

**5. Check Audit Logs**
```bash
mongosh "your_connection_string"
use software_project_1
db.auditlogs.find({
  event: {$in: ['DATA_BACKUP_COMPLETED', 'DATA_BACKUP_FAILED']}
}).sort({timestamp: -1}).limit(5).pretty()
```

## Troubleshooting

### "Cannot connect to MongoDB"
```bash
# 1. Check connection string
cat .env | grep MONGODB_URI

# 2. Test connection manually
mongosh "your_connection_string"

# 3. Verify credentials and IP whitelist (if using Atlas)
```

### "Module not found" errors
```bash
# 1. Clear node_modules
rm -rf node_modules package-lock.json

# 2. Reinstall
npm install

# 3. Clear build cache
npm run build:clean 2>/dev/null || true
```

### "Port 6666 already in use"
```bash
# 1. On Windows
netstat -ano | findstr :6666
taskkill /PID <PID> /F

# 2. On Mac/Linux
lsof -i :6666
kill -9 <PID>

# 3. Or use different port
# Edit .env: PORT=6667
```

### "JWT validation failed"
- Check JWT_SECRET in .env is set correctly
- Verify token is not expired
- Ensure Authorization header format is: `Authorization: Bearer <token>`

### "Admin permission denied"
- Verify user role is "Admin"
- Check user was created with correct role
- See ADMIN.md for more details

### "Backup not created"
- Ensure mongodump is installed
- Check BACKUP_DIR has write permissions
- Verify backup configuration in .env
- Check application logs for errors

## Running Tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov
```

## Building for Production

```bash
# Build
npm run build

# Start production server
npm start
```

## Next Steps

- 📖 Read [INDEX.md](./INDEX.md) for complete documentation
- 🏗️ See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- 🔐 See [Authentication.md](./Authentication.md) for security details
- 💾 See [BACKUP_SYSTEM_DOCUMENTATION.md](Backup_System.md) for backup details

---

**Last Updated:** November 7, 2025


