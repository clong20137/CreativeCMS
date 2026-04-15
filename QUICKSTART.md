# Quick Start Guide

## Start Everything

### 1. Start MySQL

Create the local database if it does not already exist:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS creative_portfolio;"
```

You can also import `server/database.sql` manually. During development, the server calls `sequelize.sync({ alter: true })` and will create/update tables from the models.

### 2. Start the Server

```bash
cd "c:\Users\ISP\Desktop\Project\server"
npm install
npm run dev
```

Server runs at: `http://localhost:5000`

### 3. Start the Client

```bash
cd "c:\Users\ISP\Desktop\Project\client"
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

## Environment

Server `.env`:

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

Client `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## Key Pages

| Page | URL |
|------|-----|
| Home | `/` |
| Portfolio | `/portfolio` |
| Services | `/services` |
| Pricing | `/pricing` |
| Contact | `/contact` |
| Login | `/login` |
| Client Dashboard | `/client-dashboard` |
| Billing | `/client-dashboard/billing` |
| Payment Methods | `/client-dashboard/payment-methods` |
| Account Settings | `/client-dashboard/settings` |
| Admin Dashboard | `/admin/dashboard` |
| Manage Clients | `/admin/clients` |

## Test Accounts

Create accounts through the API before logging in:

```bash
curl -X POST http://localhost:5000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Admin\",\"email\":\"admin@test.com\",\"password\":\"admin123\",\"role\":\"admin\"}"
```

```bash
curl -X POST http://localhost:5000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Client\",\"email\":\"client@test.com\",\"password\":\"client123\",\"role\":\"client\"}"
```

## Troubleshooting

If PowerShell blocks `npm`, use `npm.cmd`.

If the API cannot connect to the database, confirm MySQL is running and that `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` match your local setup.
