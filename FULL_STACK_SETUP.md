# Full-Stack Setup Guide

This project is split into a React frontend in `client/` and an Express API in `server/`. The backend uses MySQL through Sequelize.

## Prerequisites

- Node.js v16+
- MySQL 8+ or compatible database
- npm or yarn

## 1. Configure MySQL

Create the database:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS creative_portfolio;"
```

Optional: import the starter schema manually:

```bash
mysql -u root -p creative_portfolio < server/database.sql
```

During local development, the API also calls `sequelize.sync({ alter: true })`, so model changes are synced automatically.

## 2. Configure the Server

Create or update `server/.env`:

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_NAME=creative_portfolio
DB_USER=root
DB_PASSWORD=123456
JWT_SECRET=change-this-to-a-random-secret-string
STRIPE_SECRET_KEY=sk_test_xxxx
```

Install and start:

```bash
cd "c:\Users\ISP\Desktop\Project\server"
npm install
npm run dev
```

Expected output includes:

```text
Server running at http://localhost:5000
MySQL connected successfully
Database models synchronized
```

## 3. Configure the Client

Create or update `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Install and start:

```bash
cd "c:\Users\ISP\Desktop\Project\client"
npm install
npm run dev
```

Open `http://localhost:5173`.

## 4. Create Test Users

Register an admin:

```bash
curl -X POST http://localhost:5000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Admin\",\"email\":\"admin@test.com\",\"password\":\"admin123\",\"role\":\"admin\"}"
```

Register a client:

```bash
curl -X POST http://localhost:5000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Client\",\"email\":\"client@test.com\",\"password\":\"client123\",\"role\":\"client\"}"
```

After login, the frontend stores `authToken`, `userId`, `userRole`, and `userEmail` in local storage.

## 5. Useful Routes

Frontend:

- `/login`
- `/client-dashboard`
- `/client-dashboard/billing`
- `/client-dashboard/payment-methods`
- `/client-dashboard/settings`
- `/admin/dashboard`
- `/admin/clients`

Backend:

- `/api/health`
- `/api/auth/register`
- `/api/auth/login`
- `/api/projects/client/:clientId`
- `/api/invoices/client/:clientId`
- `/api/subscriptions/client/:clientId`
- `/api/admin/stats`
- `/api/admin/clients`

## Troubleshooting

If PowerShell blocks `npm`, use `npm.cmd`.

If the server cannot connect to MySQL, confirm the database exists and the `DB_*` values in `server/.env` match your local credentials.

If the client redirects to login, confirm a valid JWT exists in local storage and the API is running.
