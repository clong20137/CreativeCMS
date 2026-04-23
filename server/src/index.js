import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import sequelize from './database.js'
import User from './models/User.js'
import Project from './models/Project.js'
import Invoice from './models/Invoice.js'
import Subscription from './models/Subscription.js'
import SubscriptionPlan from './models/SubscriptionPlan.js'
import CMSLicense from './models/CMSLicense.js'
import ServicePackage from './models/ServicePackage.js'
import PortfolioItem from './models/PortfolioItem.js'
import SiteSetting from './models/SiteSetting.js'
import CustomPage from './models/CustomPage.js'
import Ticket from './models/Ticket.js'
import ContactMessage from './models/ContactMessage.js'
import Plugin from './models/Plugin.js'
import RestaurantMenuItem from './models/RestaurantMenuItem.js'
import RealEstateListing from './models/RealEstateListing.js'
import ClientPluginPurchase from './models/ClientPluginPurchase.js'
import BookingAvailabilitySlot from './models/BookingAvailabilitySlot.js'
import BookingAppointment from './models/BookingAppointment.js'
import EventItem from './models/EventItem.js'
import ProtectedContentItem from './models/ProtectedContentItem.js'
import ProtectedContentPurchase from './models/ProtectedContentPurchase.js'
import SiteDemo from './models/SiteDemo.js'
import MediaAsset from './models/MediaAsset.js'
import CRMLead from './models/CRMLead.js'
import { getOrCreateSiteSettings } from './routes/site-settings.js'

// Import routes
import authRoutes from './routes/auth.js'
import projectRoutes from './routes/projects.js'
import invoiceRoutes from './routes/invoices.js'
import subscriptionRoutes from './routes/subscriptions.js'
import portfolioRoutes from './routes/portfolio.js'
import adminRoutes from './routes/admin.js'
import usersRoutes from './routes/users.js'
import servicePackageRoutes from './routes/service-packages.js'
import siteSettingsRoutes from './routes/site-settings.js'
import ticketRoutes from './routes/tickets.js'
import contactMessageRoutes from './routes/contact-messages.js'
import stripeWebhookRoutes from './routes/stripe-webhooks.js'
import pluginRoutes from './routes/plugins.js'
import pageRoutes from './routes/pages.js'
import siteDemoRoutes from './routes/site-demos.js'
import protectedMediaRoutes from './routes/protected-media.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key')) {
  throw new Error('JWT_SECRET must be set to a strong unique value in production')
}
if (process.env.NODE_ENV === 'production' && (!process.env.DB_PASSWORD || process.env.DB_PASSWORD === '123456')) {
  throw new Error('DB_PASSWORD must be set to a non-default value in production')
}

User.hasMany(Project, { foreignKey: 'clientId' })
Project.belongsTo(User, { foreignKey: 'clientId' })

User.hasMany(Invoice, { foreignKey: 'clientId' })
Invoice.belongsTo(User, { foreignKey: 'clientId' })

Project.hasMany(Invoice, { foreignKey: 'projectId' })
Invoice.belongsTo(Project, { foreignKey: 'projectId' })

User.hasMany(Subscription, { foreignKey: 'clientId' })
Subscription.belongsTo(User, { foreignKey: 'clientId' })
User.hasMany(CMSLicense, { foreignKey: 'clientId' })
CMSLicense.belongsTo(User, { foreignKey: 'clientId' })

User.hasMany(Ticket, { foreignKey: 'clientId' })
Ticket.belongsTo(User, { foreignKey: 'clientId' })

SubscriptionPlan.hasMany(Subscription, { foreignKey: 'planId' })
Subscription.belongsTo(SubscriptionPlan, { foreignKey: 'planId' })
SubscriptionPlan.hasMany(CMSLicense, { foreignKey: 'planId' })
CMSLicense.belongsTo(SubscriptionPlan, { foreignKey: 'planId' })

User.hasMany(ClientPluginPurchase, { foreignKey: 'clientId' })
ClientPluginPurchase.belongsTo(User, { foreignKey: 'clientId' })
Plugin.hasMany(ClientPluginPurchase, { foreignKey: 'pluginId' })
ClientPluginPurchase.belongsTo(Plugin, { foreignKey: 'pluginId' })

BookingAvailabilitySlot.hasOne(BookingAppointment, { foreignKey: 'availabilitySlotId' })
BookingAppointment.belongsTo(BookingAvailabilitySlot, { foreignKey: 'availabilitySlotId' })

User.hasMany(ProtectedContentPurchase, { foreignKey: 'clientId' })
ProtectedContentPurchase.belongsTo(User, { foreignKey: 'clientId' })
ProtectedContentItem.hasMany(ProtectedContentPurchase, { foreignKey: 'contentItemId' })
ProtectedContentPurchase.belongsTo(ProtectedContentItem, { foreignKey: 'contentItemId' })

// Middleware
app.disable('x-powered-by')
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' data: blob: https:",
    "style-src 'self' 'unsafe-inline' https:",
    "script-src 'self' https://challenges.cloudflare.com",
    "connect-src 'self' https://www.googleapis.com https://searchconsole.googleapis.com https://oauth2.googleapis.com https://api.stripe.com https://challenges.cloudflare.com"
  ].join('; '))
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  next()
})
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}))

app.use('/api/stripe', stripeWebhookRoutes)
app.use(express.json({ limit: '60mb' }))
app.use(express.urlencoded({ extended: true, limit: '60mb' }))
const uploadsPath = path.resolve(__dirname, '../uploads')
app.use('/uploads', express.static(uploadsPath))
app.use('/api/uploads', express.static(uploadsPath))

function normalizePublicPath(pathname = '/') {
  const value = String(pathname || '/').trim()
  if (!value || value === '/') return '/'
  const prefixed = value.startsWith('/') ? value : `/${value}`
  const normalized = prefixed.replace(/\/{2,}/g, '/')
  return normalized !== '/' && normalized.endsWith('/') ? normalized.slice(0, -1) : normalized
}

function getPublicSiteUrl() {
  return String(process.env.PUBLIC_SITE_URL || process.env.VITE_SITE_URL || allowedOrigins[0] || 'http://localhost:5173').replace(/\/$/, '')
}

function xmlEscape(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const authAttempts = new Map()
app.use('/api/auth', (req, res, next) => {
  if (!['POST'].includes(req.method)) return next()
  const key = req.ip
  const now = Date.now()
  const attempts = (authAttempts.get(key) || []).filter(time => now - time < 15 * 60 * 1000)
  attempts.push(now)
  authAttempts.set(key, attempts)

  if (attempts.length > 30) {
    return res.status(429).json({ error: 'Too many authentication attempts. Please try again later.' })
  }

  next()
})

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
app.use('/api/service-packages', servicePackageRoutes)
app.use('/api/site-settings', siteSettingsRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/contact-messages', contactMessageRoutes)
app.use('/api/plugins', pluginRoutes)
app.use('/api/site-demos', siteDemoRoutes)
app.use('/api/pages', pageRoutes)
app.use('/api/protected-media', protectedMediaRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' })
})

app.get('/sitemap.xml', async (req, res) => {
  try {
    const siteUrl = getPublicSiteUrl()
    const settings = await getOrCreateSiteSettings()
    const builtInPaths = ['/', '/portfolio', '/services', '/pricing', '/plugins', '/contact']
    const metadataEntries = Object.values(settings.pageMetadata || {})
      .map((page) => normalizePublicPath(page?.pageUrl || ''))
      .filter(Boolean)
    const customPages = await CustomPage.findAll({
      where: { isPublished: true },
      attributes: ['slug', 'updatedAt']
    })
    const siteDemos = await SiteDemo.findAll({
      where: { isActive: true },
      attributes: ['slug', 'updatedAt']
    })
    const plugins = await Plugin.findAll({
      where: { isEnabled: true },
      attributes: ['demoUrl', 'updatedAt']
    })

    const urls = new Map()
    const addUrl = (pathname, updatedAt) => {
      const normalized = normalizePublicPath(pathname)
      if (!normalized || normalized.startsWith('/admin') || normalized.startsWith('/client-dashboard') || normalized === '/login') return
      urls.set(normalized, updatedAt || urls.get(normalized) || null)
    }

    builtInPaths.forEach(pathname => addUrl(pathname, null))
    metadataEntries.forEach(pathname => addUrl(pathname, null))
    customPages.forEach(page => addUrl(`/${page.slug}`, page.updatedAt))
    siteDemos.forEach(demo => addUrl(`/site-demos/${demo.slug}`, demo.updatedAt))
    plugins.forEach(plugin => plugin.demoUrl && addUrl(plugin.demoUrl, plugin.updatedAt))

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from(urls.entries()).map(([pathname, updatedAt]) => `  <url>
    <loc>${xmlEscape(`${siteUrl}${pathname}`)}</loc>
    ${updatedAt ? `<lastmod>${new Date(updatedAt).toISOString()}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`

    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.send(xml)
  } catch (error) {
    res.status(500).type('text/plain').send('Failed to generate sitemap')
  }
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
