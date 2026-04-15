# Creative Studio Portfolio Build Summary

## What Exists

This repository contains a full-stack creative studio portfolio application.

### Frontend

- React 18, TypeScript, Vite, Tailwind CSS
- Public pages for home, portfolio, services, pricing, and contact
- Client login, dashboard, billing, payment methods, and account settings
- Admin dashboard and client management
- Shared API client in `client/src/services/api.ts`
- Loading skeleton components

### Backend

- Express REST API
- Sequelize models backed by MySQL
- JWT authentication
- User, Project, Invoice, and Subscription models
- Admin stats and management routes
- Client project, billing, profile, preferences, and payment-method routes

### Database

- MySQL database named `creative_portfolio`
- Starter schema in `server/database.sql`
- Development sync through `sequelize.sync({ alter: true })`

## Current App Paths

- Frontend app: `client/`
- Backend API: `server/`
- Original standalone frontend kept for reference: `src/`

## Important Routes

Frontend:

- `/login`
- `/client-dashboard`
- `/client-dashboard/billing`
- `/client-dashboard/payment-methods`
- `/client-dashboard/settings`
- `/admin/dashboard`
- `/admin/clients`

Backend:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/projects/client/:clientId`
- `GET /api/invoices/client/:clientId`
- `GET /api/subscriptions/client/:clientId`
- `GET /api/admin/stats`
- `GET /api/admin/clients`
- `GET /api/users/profile`
- `GET /api/payment-methods`

## Recent Stabilization

- Client TypeScript build errors were fixed.
- Vite environment typing was added.
- Login now calls the real backend auth API.
- Client and admin routes that already had pages are now reachable.
- Frontend code now uses MySQL-style `id` fields instead of Mongo-style `_id`.
- Sequelize associations were added so admin routes with `include` can resolve related users.
- Setup docs now describe MySQL and Sequelize instead of MongoDB and Mongoose.

## Running Locally

Create the database:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS creative_portfolio;"
```

Start the server:

```bash
cd server
npm install
npm run dev
```

Start the client:

```bash
cd client
npm install
npm run dev
```

If PowerShell blocks `npm`, use `npm.cmd`.
