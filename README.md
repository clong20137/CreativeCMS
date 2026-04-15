# Creative by Caleb Portfolio

A full-stack portfolio and client portal for creative businesses. The app includes public marketing pages, client billing/project views, an admin dashboard, JWT login, and a MySQL-backed Express API.

## Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios

### Backend

- Node.js
- Express
- Sequelize
- MySQL
- JWT
- bcryptjs

## Project Structure

```text
Project/
  client/                  React frontend
    src/
      components/
      pages/
      services/api.ts
  server/                  Express backend
    src/
      index.js
      database.js
      models/
      routes/
    database.sql
  src/                     Original standalone frontend kept for reference
```

## Quick Start

Create the database:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS creative_portfolio;"
```

Start the API:

```bash
cd server
npm install
npm run dev
```

Start the frontend:

```bash
cd client
npm install
npm run dev
```

Open:

- Frontend: `http://localhost:5173`
- API health check: `http://localhost:5000/api/health`
- Login: `http://localhost:5173/login`
- Client dashboard: `http://localhost:5173/client-dashboard`
- Admin dashboard: `http://localhost:5173/admin/dashboard`

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

## Key Features

- Public pages: home, portfolio, services, pricing, contact
- Real login through the Express API
- Client dashboard with project loading from MySQL
- Client billing, payment-method, and account-settings routes
- Admin dashboard and client management
- Sequelize model relationships for admin project/invoice/subscription queries
- Skeleton loading states and responsive Tailwind UI

## Main API Areas

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/projects/client/:clientId`
- `GET /api/invoices/client/:clientId`
- `GET /api/subscriptions/client/:clientId`
- `GET /api/admin/stats`
- `GET /api/admin/clients`
- `GET /api/users/profile`
- `GET /api/payment-methods`

See `server/README.md` for the full backend route list.

## Notes

The root-level `src/` app is the older standalone frontend. The current full-stack frontend lives in `client/`.

On Windows PowerShell, if `npm` is blocked by execution policy, use `npm.cmd` instead.
