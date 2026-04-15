import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import sequelize from './database.js'
import User from './models/User.js'
import Project from './models/Project.js'
import Invoice from './models/Invoice.js'
import Subscription from './models/Subscription.js'
import SubscriptionPlan from './models/SubscriptionPlan.js'
import ServicePackage from './models/ServicePackage.js'
import PortfolioItem from './models/PortfolioItem.js'
import SiteSetting from './models/SiteSetting.js'
import Ticket from './models/Ticket.js'

// Import routes
import authRoutes from './routes/auth.js'
import projectRoutes from './routes/projects.js'
import invoiceRoutes from './routes/invoices.js'
import subscriptionRoutes from './routes/subscriptions.js'
import portfolioRoutes from './routes/portfolio.js'
import adminRoutes from './routes/admin.js'
import usersRoutes from './routes/users.js'
import paymentMethodsRoutes from './routes/payment-methods.js'
import servicePackageRoutes from './routes/service-packages.js'
import siteSettingsRoutes from './routes/site-settings.js'
import ticketRoutes from './routes/tickets.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

User.hasMany(Project, { foreignKey: 'clientId' })
Project.belongsTo(User, { foreignKey: 'clientId' })

User.hasMany(Invoice, { foreignKey: 'clientId' })
Invoice.belongsTo(User, { foreignKey: 'clientId' })

Project.hasMany(Invoice, { foreignKey: 'projectId' })
Invoice.belongsTo(Project, { foreignKey: 'projectId' })

User.hasMany(Subscription, { foreignKey: 'clientId' })
Subscription.belongsTo(User, { foreignKey: 'clientId' })

User.hasMany(Ticket, { foreignKey: 'clientId' })
Ticket.belongsTo(User, { foreignKey: 'clientId' })

SubscriptionPlan.hasMany(Subscription, { foreignKey: 'planId' })
Subscription.belongsTo(SubscriptionPlan, { foreignKey: 'planId' })

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Database Connection & Sync
sequelize.authenticate()
  .then(async () => {
    console.log('✓ MySQL connected successfully')
    // Sync models with database
    await sequelize.sync({ alter: true })
    console.log('✓ Database models synchronized')
  })
  .catch(err => console.error('✗ Database connection error:', err))

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/portfolio', portfolioRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/payment-methods', paymentMethodsRoutes)
app.use('/api/service-packages', servicePackageRoutes)
app.use('/api/site-settings', siteSettingsRoutes)
app.use('/api/tickets', ticketRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`)
  console.log(`📡 MySQL connected to: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}\n`)
})
