# Getting Started Guide

## 5-Minute Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

### 3. Start Development Server
```bash
npm run dev
```

Server runs on `http://localhost:6666`

### 4. Test the Application
```bash
# Register a new user
curl -X POST http://localhost:6666/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'

# Check your email for OTP (or database if no email configured)

# Verify OTP
curl -X POST http://localhost:6666/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "otpCode": "123456"
  }'

# Login
curl -X POST http://localhost:6666/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'

# Use the received token
export TOKEN="<your_access_token>"

# Get your profile
curl http://localhost:6666/users/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## Prerequisites Checklist

### System Requirements
- [ ] Node.js 16+ installed
- [ ] npm or yarn installed
- [ ] MongoDB 4.4+ running
- [ ] Git installed

### MongoDB Setup
- [ ] MongoDB Atlas account (or local MongoDB)
- [ ] Database created
- [ ] User with read/write permissions
- [ ] Connection string available

### Required Tools
- [ ] Postman or cURL (for testing APIs)
- [ ] Code editor (VS Code recommended)
- [ ] Terminal/Command line access

---

## Installation Steps

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd backend
```

### Step 2: Install Dependencies
```bash
npm install
```

Expected output:
```
added XXX packages in Xs
```

### Step 3: Create Environment File
```bash
# Create .env from example
cp .env.example .env

# Or create manually
cat > .env << EOF
NODE_ENV=development
PORT=6666
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/db_name
JWT_SECRET=your_secret_key_here_min_32_chars
JWT_EXPIRES_IN=7d
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
MAIL_FROM=noreply@example.com
BACKUP_DIR=./backups
BACKUP_MAX_COUNT=10
BACKUP_ENABLE_TEST=false
EOF
```

### Step 4: Verify MongoDB Connection
```bash
# Test connection string
mongosh "your_connection_string"

# Should see MongoDB shell
# Type: exit
```

### Step 5: Start Development Server
```bash
npm run dev
```

Expected output:
```
[Nest] XXX - 11/07/2025, X:XX:XX AM     LOG [NestFactory] Starting Nest application...
[Nest] XXX - 11/07/2025, X:XX:XX AM     LOG [InstanceLoader] MongooseModule dependencies initialized
[Nest] XXX - 11/07/2025, X:XX:XX AM     LOG [RoutesResolver] AppController {...}
[Nest] XXX - 11/07/2025, X:XX:XX AM     LOG [NestApplication] Nest application successfully started
```

---

## Common Issues & Solutions

### Issue: "Cannot find module 'mongoose'"
**Solution:**
```bash
npm install
npm run dev
```

### Issue: "MongoDB connection refused"
**Solution:**
```bash
# Check MongoDB is running
mongosh

# Verify connection string in .env
# Format: mongodb+srv://username:password@host/database

# Test connection manually
mongosh "your_connection_string"
```

### Issue: "Port 6666 already in use"
**Solution:**
```bash
# Find process using port
lsof -i :6666

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=3333
```

### Issue: "JWT_SECRET not found"
**Solution:**
```bash
# Generate a strong secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy to .env
JWT_SECRET=<generated_secret>
```

---

## Project Structure Overview

```
backend/
├── Authentication/      # Login, JWT, MFA
├── User/               # User profiles, management
├── Audit-Log/          # Event logging
├── Backup/             # Database backups
├── App/                # Root application module
├── README.md           # Main documentation (START HERE!)
├── ARCHITECTURE.md     # System design
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript config
└── .env                # Configuration (create this!)
```

---

## Available Commands

```bash
# Development
npm run dev              # Start with hot reload

# Build
npm run build            # Build for production

# Production
npm run start            # Run production build

# Testing
npm test                 # Run unit tests
npm run test:e2e         # Run E2E tests
npm run test:cov         # Generate coverage

# Linting
npm run lint             # Check code style
npm run format           # Format code

# Database
npm run migrate          # Run migrations (if applicable)
```

---

## API Testing

### Using cURL

```bash
# Register
curl -X POST http://localhost:6666/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"Pass123!"}'

# Login
curl -X POST http://localhost:6666/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Pass123!"}'

# Get Profile (with token)
curl http://localhost:6666/users/me \
  -H "Authorization: Bearer <token>"
```

### Using Postman

1. Download [Postman](https://www.postman.com/)
2. Create new collection "Backend API"
3. Add requests:
   - POST `/auth/register`
   - POST `/auth/login`
   - GET `/users/me` (with Bearer token)

### Using VS Code REST Client

Create `requests.http`:
```http
### Register
POST http://localhost:6666/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "SecurePass123!"
}

### Login
POST http://localhost:6666/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "SecurePass123!"
}

### Get Profile
GET http://localhost:6666/users/me
Authorization: Bearer <your_token_here>
```

---

## Configuration Guide

### JWT Configuration
```env
JWT_SECRET=use_strong_key_min_32_chars_abcdefghijklmnopqrstuvwxyz
JWT_EXPIRES_IN=7d      # Token expiration time
```

### Email Configuration
```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-specific-password  # NOT your Gmail password
MAIL_FROM=noreply@example.com
```

**Note:** For Gmail, use [App Passwords](https://myaccount.google.com/apppasswords)

### Database Configuration
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
```

Format: `mongodb+srv://[username]:[password]@[host]/[database]`

### Backup Configuration
```env
BACKUP_DIR=./backups           # Where backups are stored
BACKUP_MAX_COUNT=10            # Keep last 10 backups
BACKUP_ENABLE_TEST=false       # Disable in production
BACKUP_CRON_PROD=0 2 * * *    # 2 AM daily
```

---

## Database Setup

### Create MongoDB Atlas Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create account
3. Create free cluster
4. Add database user
5. Get connection string
6. Whitelist IP address
7. Add to `.env` as `MONGODB_URI`

### Verify Connection
```bash
mongosh "your_connection_string"
# Should connect successfully
```

---

## Next Steps

1. **Read Documentation:**
   - [Main README](BACKEND.md) - Overview
   - [Architecture](ARCHITECTURE.md) - System design
   - [User Module](User.md) - User management
   - [Authentication](Authentication.md) - Auth & security
   - [Audit Logs](Audit-Log.md) - Event logging
   - [Backups](BACKUP.md) - Backup system

2. **Test Features:**
   - User registration & login
   - Email verification
   - MFA setup
   - Role-based access
   - Audit log queries
   - Manual backups

3. **Set Up Monitoring:**
   - Enable application logs
   - Monitor MongoDB performance
   - Set up backup alerts
   - Review audit logs daily

4. **Explore Advanced Features:**
   - Custom decorators
   - Middleware
   - Database optimization
   - Performance profiling

---

## Debugging Tips

### Enable Verbose Logging
```bash
# In development
npm run dev 2>&1 | tee debug.log

# Or set log level
DEBUG=* npm run dev
```

### Check MongoDB Queries
```bash
# In MongoDB
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().sort({ ts: -1 }).limit(5).pretty()
```

### Inspect JWT Tokens
```bash
# Copy token and decode at https://jwt.io
# Or using Node.js
node -e "console.log(JSON.stringify(require('jsonwebtoken').decode('<token>'), null, 2))"
```

### Check Active Connections
```bash
# MongoDB connections
db.currentOp()

# Port usage
lsof -i :6666
```

---

## Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` (32+ characters)
- [ ] Set up real email service
- [ ] Configure MongoDB backups
- [ ] Enable HTTPS
- [ ] Set up rate limiting
- [ ] Configure CORS properly
- [ ] Set up monitoring/alerts
- [ ] Configure log rotation
- [ ] Test disaster recovery

---

## Getting Help

### Check Logs
```bash
# Application logs
npm run dev 2>&1 | grep -i error

# MongoDB logs
mongosh --eval "db.currentOp()"
```

### Search Documentation
All modules have detailed README files in their directories.

### Common Questions

**Q: How do I reset a user's password?**
A: Use the `/auth/forgot-password` endpoint → verify OTP → `/auth/reset-password`

**Q: How do I create an admin user?**
A: Register normally, then use MongoDB to set `role: 'Admin'`

**Q: How do I view audit logs?**
A: Use `/audit-logs` endpoint (admin only)

**Q: How do I create a backup?**
A: POST `/api/backups/create` (admin only)

---

## Quick Reference

### Key Endpoints

| Purpose | Method | Endpoint |
|---------|--------|----------|
| Register | POST | `/auth/register` |
| Login | POST | `/auth/login` |
| Get Profile | GET | `/users/me` |
| Update Profile | PATCH | `/users/me` |
| Enable MFA | POST | `/auth/mfa/enable` |
| View Audit Logs | GET | `/audit-logs` |
| Create Backup | POST | `/api/backups/create` |

### Key Files

| File | Purpose |
|------|---------|
| `.env` | Configuration |
| `src/main.ts` | Application entry |
| `src/app.module.ts` | Root module |
| `package.json` | Dependencies |

---

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [JWT Introduction](https://jwt.io/introduction)
- [TypeScript Documentation](https://www.typescriptlang.org/)

---

**Welcome to the Backend API!** 🚀

Start with:
1. Setting up `.env`
2. Starting the server: `npm run dev`
3. Reading [README.md](BACKEND.md)
4. Testing an endpoint: `curl http://localhost:6666/...`

---

**Last Updated:** November 7, 2025

