# Doğu AŞ Backend API

Backend REST API for Doğu AŞ Stok ve Süreç Takip Sistemi.

## Technology Stack

- **Runtime:** Node.js v20+
- **Framework:** Express.js (minimal, bare metal)
- **Database:** PostgreSQL 16 (Raw SQL with `pg` library)
- **Authentication:** JWT + bcrypt
- **Background Jobs:** node-cron
- **Email:** nodemailer

## Installation

```bash
cd backend
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` with your actual configuration:
- Database credentials (PostgreSQL)
- JWT secret key
- SMTP settings for email notifications

## Database Setup

**IMPORTANT:** The PostgreSQL database `doguas_db` must already be restored and running.

This backend connects to the existing database - it does NOT create tables.

Verify the database connection in `.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=doguas_db
DB_USER=postgres
DB_PASSWORD=your_password
```

## Running the Server

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will run on `http://localhost:3000` by default.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (creates as personel, not approved)
- `POST /api/auth/login` - Login (checks approval status)
- `GET /api/auth/me` - Get current user (requires JWT)

### User Management (Admin Only)
- `GET /api/users/pending` - Get users waiting for approval
- `PUT /api/users/:id/approve` - Approve a user
- `GET /api/users` - Get all users

### Products
- `GET /api/products` - List products (supports pagination, search, category filter)
- `GET /api/products/:id` - Get product details
- `GET /api/products/categories` - Get all categories

### Stock
- `GET /api/stock` - Get stock status (flags items below critical level)
- `GET /api/stock/:productId/history` - Get stock history for a product

### Active Jobs
- `POST /api/jobs` - Create new job (Alış/Satış)
- `POST /api/jobs/:id/items` - Add items to a job
- `POST /api/jobs/:id/complete` - Complete job with survey data
- `GET /api/jobs/active` - List active jobs
- `GET /api/jobs/:id` - Get job details
- `GET /api/jobs/parties/customers` - Get customers list
- `GET /api/jobs/parties/suppliers` - Get suppliers list

### History
- `GET /api/history` - Get transaction history (supports filters)
- `GET /api/history/:id` - Get transaction details

### Logs (Admin Only)
- `GET /api/logs` - Get system logs with JSON parsing

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/profit-chart` - Get monthly profit chart data
- `GET /api/dashboard/active-products` - Get most active products
- `GET /api/dashboard/forecast` - Get AI forecast (SMA)
- `GET /api/dashboard/inactivity` - Get inactivity alerts (Admin only)

## Authentication

All protected endpoints require a JWT bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Database Triggers (Automatic)

The following operations are handled automatically by PostgreSQL triggers:

1. **Stock Updates:** When adding items to jobs, stock is automatically recalculated
2. **Logs:** All data changes are automatically logged
3. **Total Prices:** Transaction totals are automatically calculated

**DO NOT** manually update stock or insert logs - the database handles this.

## Background Jobs

### Inactivity Check (Cron)
- Runs daily at midnight (Europe/Istanbul timezone)
- Checks for customers inactive for 30/45/60/90/120/150 days
- Sends email alert to admin
- Displays in dashboard with color codes

## Critical: BigInt Handling

The database uses `BIGINT` for IDs. The `pg` library is configured to parse these as JavaScript numbers:

```javascript
types.setTypeParser(20, (val) => parseInt(val, 10));
```

This prevents JSON serialization errors when returning data via the API.

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Configure PM2 for process management:

```bash
npm install -g pm2
pm2 start src/app.js --name doguas-backend
pm2 startup
pm2 save
```

3. Use Nginx as reverse proxy (recommended)

## Support

For issues or questions, contact the development team.
