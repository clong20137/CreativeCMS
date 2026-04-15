# Backend Server Setup

This is the Express.js backend for the Creative Portfolio website. It uses MySQL through Sequelize, JWT authentication, and REST API routes for admin and client portals.

## Prerequisites

- Node.js v16+
- MySQL 8+ or compatible database
- npm or yarn

## Installation

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_NAME=creative_portfolio
DB_USER=root
DB_PASSWORD=123456
JWT_SECRET=your-super-secret-jwt-key-change-this
STRIPE_SECRET_KEY=sk_test_your_key
```

Create the database:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS creative_portfolio;"
```

You can also import `database.sql`. In development, the server syncs Sequelize models automatically.

## Running

```bash
npm run dev
```

Production:

```bash
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Projects

- `GET /api/projects/client/:clientId`
- `GET /api/projects/:id`
- `POST /api/projects`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`

### Invoices

- `GET /api/invoices/client/:clientId`
- `GET /api/invoices/:id`
- `POST /api/invoices`
- `PUT /api/invoices/:id`
- `PUT /api/invoices/:id/pay`
- `DELETE /api/invoices/:id`

### Subscriptions

- `GET /api/subscriptions/client/:clientId`
- `GET /api/subscriptions/:id`
- `POST /api/subscriptions`
- `PUT /api/subscriptions/:id`
- `PUT /api/subscriptions/:id/cancel`
- `DELETE /api/subscriptions/:id`

### Portfolio

- `GET /api/portfolio`
- `GET /api/portfolio/category/:category`
- `GET /api/portfolio/:id`

### Admin

- `GET /api/admin/stats`
- `GET /api/admin/clients`
- `GET /api/admin/projects`
- `GET /api/admin/invoices`
- `GET /api/admin/subscriptions`
- `GET /api/admin/revenue/monthly`
- `POST /api/admin/users`
- `PUT /api/admin/users/:id`
- `DELETE /api/admin/users/:id`

### Profile and Payment Methods

- `GET /api/users/profile`
- `PUT /api/users/profile`
- `PUT /api/users/email`
- `PUT /api/users/password`
- `GET /api/users/preferences`
- `PUT /api/users/preferences`
- `GET /api/payment-methods`
- `POST /api/payment-methods`
- `PUT /api/payment-methods/:id`
- `DELETE /api/payment-methods/:id`
- `PUT /api/payment-methods/:id/default`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port, default `5000` |
| `DB_HOST` | MySQL host |
| `DB_PORT` | MySQL port, default `3306` |
| `DB_NAME` | Database name, default `creative_portfolio` |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | Secret used to sign JWT tokens |
| `STRIPE_SECRET_KEY` | Stripe secret key, optional for current local flow |

## Troubleshooting

If the database connection fails, verify MySQL is running, the `creative_portfolio` database exists, and the `DB_*` values match your local credentials.

If port `5000` is already in use, change `PORT` in `.env`.
