import express from 'express'
import sequelize from '../database.js'
import { DataTypes } from 'sequelize'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'
import User from '../models/User.js'
import Project from '../models/Project.js'
import Invoice from '../models/Invoice.js'
import Subscription from '../models/Subscription.js'
import SubscriptionPlan from '../models/SubscriptionPlan.js'
import CMSLicense from '../models/CMSLicense.js'
import ServicePackage from '../models/ServicePackage.js'
import PortfolioItem from '../models/PortfolioItem.js'
import ContactMessage from '../models/ContactMessage.js'
import Ticket from '../models/Ticket.js'
import Plugin from '../models/Plugin.js'
import RestaurantMenuItem from '../models/RestaurantMenuItem.js'
import RealEstateListing from '../models/RealEstateListing.js'
import BookingAvailabilitySlot from '../models/BookingAvailabilitySlot.js'
import BookingAppointment from '../models/BookingAppointment.js'
import EventItem from '../models/EventItem.js'
import ProtectedContentItem from '../models/ProtectedContentItem.js'
import CustomPage from '../models/CustomPage.js'
import SiteDemo from '../models/SiteDemo.js'
import MediaAsset from '../models/MediaAsset.js'
import CRMLead from '../models/CRMLead.js'
import { getOrCreateSiteSettings } from './site-settings.js'
import { ensureDemoPlugins, getOrCreateBookingPlugin, getOrCreateCrmPlugin, getOrCreateEventsPlugin, getOrCreateProtectedContentPlugin, getOrCreateRestaurantPlugin, getOrCreateRealEstatePlugin } from './plugins.js'
import { ensureSiteDemos } from './site-demos.js'
import crypto from 'crypto'
import { base32Encode, verifyTotp } from './auth.js'
import jwt from 'jsonwebtoken'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = path.resolve(__dirname, '../../uploads')
const privateUploadsDir = path.resolve(__dirname, '../../private-uploads')
let mediaAssetsSchemaReady = false
let protectedContentSchemaReady = false
let customPagesSchemaReady = false
let subscriptionSchemaReady = false
let cmsLicenseSchemaReady = false
let googleAccessTokenCache = { token: '', expiresAt: 0 }
const seoDashboardCache = new Map()
const mediaMimeExtensions = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/zip': 'zip'
}

function getMediaType(mimeType) {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType === 'application/pdf' || mimeType.startsWith('text/') || mimeType.includes('word') || mimeType.includes('excel') || mimeType.includes('zip')) return 'document'
  return 'other'
}

function getIsoDate(daysAgo = 0) {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString().slice(0, 10)
}

function normalizeSearchConsoleProperty(value) {
  const property = String(value || '').trim()
  if (!property || property.startsWith('sc-domain:')) return property
  return property.endsWith('/') ? property : `${property}/`
}

function safeNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function parseGoogleServiceAccount(rawValue) {
  const value = rawValue || process.env.GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON || ''
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch (error) {
    const decoded = Buffer.from(value, 'base64').toString('utf8')
    return JSON.parse(decoded)
  }
}

async function ensureCustomPagesSchema() {
  if (customPagesSchemaReady) return

  const queryInterface = CustomPage.sequelize.getQueryInterface()
  const table = await queryInterface.describeTable('CustomPages').catch(() => null)
  if (!table) return

  if (!table.showPageHeader) {
    try {
      await queryInterface.addColumn('CustomPages', 'showPageHeader', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      })
    } catch (error) {
      const message = String(error?.message || '')
      if (!message.includes('Duplicate column')) throw error
    }
  }

  customPagesSchemaReady = true
}

async function ensureSubscriptionSchema() {
  if (subscriptionSchemaReady) return

  const queryInterface = Subscription.sequelize.getQueryInterface()
  const subscriptionTable = await queryInterface.describeTable('Subscriptions').catch(() => null)
  const planTable = await queryInterface.describeTable('SubscriptionPlans').catch(() => null)

  if (planTable) {
    if (!planTable.productType) {
      await queryInterface.addColumn('SubscriptionPlans', 'productType', {
        type: DataTypes.ENUM('service', 'cms-license'),
        allowNull: false,
        defaultValue: 'service'
      }).catch((error) => {
        if (!String(error?.message || '').includes('Duplicate column')) throw error
      })
    }
    if (!planTable.updateChannel) {
      await queryInterface.addColumn('SubscriptionPlans', 'updateChannel', {
        type: DataTypes.ENUM('stable', 'early-access'),
        allowNull: false,
        defaultValue: 'stable'
      }).catch((error) => {
        if (!String(error?.message || '').includes('Duplicate column')) throw error
      })
    }
    if (!planTable.includedUpdates) {
      await queryInterface.addColumn('SubscriptionPlans', 'includedUpdates', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }).catch((error) => {
        if (!String(error?.message || '').includes('Duplicate column')) throw error
      })
    }
  }

  if (subscriptionTable) {
    if (!subscriptionTable.productType) {
      await queryInterface.addColumn('Subscriptions', 'productType', {
        type: DataTypes.ENUM('service', 'cms-license'),
        allowNull: false,
        defaultValue: 'service'
      }).catch((error) => {
        if (!String(error?.message || '').includes('Duplicate column')) throw error
      })
    }
    if (!subscriptionTable.licenseKey) {
      await queryInterface.addColumn('Subscriptions', 'licenseKey', {
        type: DataTypes.STRING,
        allowNull: true
      }).catch((error) => {
        if (!String(error?.message || '').includes('Duplicate column')) throw error
      })
    }
    if (!subscriptionTable.licensedDomain) {
      await queryInterface.addColumn('Subscriptions', 'licensedDomain', {
        type: DataTypes.STRING,
        allowNull: true
      }).catch((error) => {
        if (!String(error?.message || '').includes('Duplicate column')) throw error
      })
    }
    if (!subscriptionTable.updateChannel) {
      await queryInterface.addColumn('Subscriptions', 'updateChannel', {
        type: DataTypes.ENUM('stable', 'early-access'),
        allowNull: false,
        defaultValue: 'stable'
      }).catch((error) => {
        if (!String(error?.message || '').includes('Duplicate column')) throw error
      })
    }
    if (!subscriptionTable.includedUpdates) {
      await queryInterface.addColumn('Subscriptions', 'includedUpdates', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }).catch((error) => {
        if (!String(error?.message || '').includes('Duplicate column')) throw error
      })
    }
    if (!subscriptionTable.lastValidatedAt) {
      await queryInterface.addColumn('Subscriptions', 'lastValidatedAt', {
        type: DataTypes.DATE,
        allowNull: true
      }).catch((error) => {
        if (!String(error?.message || '').includes('Duplicate column')) throw error
      })
    }
  }

  subscriptionSchemaReady = true
}

async function ensureCmsLicenseSchema() {
  if (cmsLicenseSchemaReady) return

  const queryInterface = CMSLicense.sequelize.getQueryInterface()
  const table = await queryInterface.describeTable('CMSLicenses').catch(() => null)
  if (!table) {
    await CMSLicense.sync()
    cmsLicenseSchemaReady = true
    return
  }

  const addColumn = async (name, config) => {
    if (table[name]) return
    await queryInterface.addColumn('CMSLicenses', name, config).catch((error) => {
      if (!String(error?.message || '').includes('Duplicate column')) throw error
    })
  }

  await addColumn('planId', { type: DataTypes.INTEGER, allowNull: true })
  await addColumn('planName', { type: DataTypes.STRING, allowNull: false, defaultValue: 'CMS License' })
  await addColumn('tier', {
    type: DataTypes.ENUM('starter', 'professional', 'enterprise'),
    allowNull: false,
    defaultValue: 'starter'
  })
  await addColumn('status', {
    type: DataTypes.ENUM('active', 'inactive', 'suspended', 'expired', 'cancelled'),
    allowNull: false,
    defaultValue: 'active'
  })
  await addColumn('price', {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  })
  await addColumn('billingCycle', {
    type: DataTypes.ENUM('monthly', 'quarterly', 'annually'),
    allowNull: false,
    defaultValue: 'monthly'
  })
  await addColumn('licenseKey', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'TEMP-LICENSE'
  })
  await addColumn('licensedDomain', { type: DataTypes.STRING, allowNull: true })
  await addColumn('updateChannel', {
    type: DataTypes.ENUM('stable', 'early-access'),
    allowNull: false,
    defaultValue: 'stable'
  })
  await addColumn('includedUpdates', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  })
  await addColumn('startDate', { type: DataTypes.DATE, allowNull: false, defaultValue: new Date() })
  await addColumn('renewalDate', { type: DataTypes.DATE, allowNull: true })
  await addColumn('endDate', { type: DataTypes.DATE, allowNull: true })
  await addColumn('lastValidatedAt', { type: DataTypes.DATE, allowNull: true })
  await addColumn('features', { type: DataTypes.JSON, allowNull: true })
  await addColumn('notes', { type: DataTypes.TEXT, allowNull: true })

  cmsLicenseSchemaReady = true
}

function generateLicenseKey() {
  return `CBCMS-${randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}-${randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`
}

async function migrateLegacySubscriptionLicense(clientId) {
  await ensureSubscriptionSchema()
  await ensureCmsLicenseSchema()

  const existingLicense = await CMSLicense.findOne({
    where: { clientId },
    order: [['createdAt', 'DESC']]
  })
  if (existingLicense) return existingLicense

  const legacyLicense = await Subscription.findOne({
    where: { clientId, productType: 'cms-license' },
    order: [['createdAt', 'DESC']]
  })
  if (!legacyLicense) return null

  return CMSLicense.create({
    clientId: legacyLicense.clientId,
    planId: legacyLicense.planId,
    planName: legacyLicense.planName || 'CMS License',
    tier: legacyLicense.tier || 'starter',
    status: legacyLicense.status === 'active' ? 'active' : (legacyLicense.status || 'inactive'),
    price: legacyLicense.price || 0,
    billingCycle: legacyLicense.billingCycle || 'monthly',
    licenseKey: legacyLicense.licenseKey || generateLicenseKey(),
    licensedDomain: legacyLicense.licensedDomain || null,
    updateChannel: legacyLicense.updateChannel || 'stable',
    includedUpdates: legacyLicense.includedUpdates !== false,
    startDate: legacyLicense.startDate || legacyLicense.createdAt || new Date(),
    renewalDate: legacyLicense.renewalDate || null,
    endDate: legacyLicense.endDate || null,
    lastValidatedAt: legacyLicense.lastValidatedAt || new Date(),
    features: Array.isArray(legacyLicense.features) ? legacyLicense.features : []
  })
}

async function getGoogleAccessToken(settings) {
  if (googleAccessTokenCache.token && googleAccessTokenCache.expiresAt > Date.now() + 60_000) {
    return googleAccessTokenCache.token
  }

  const serviceAccount = parseGoogleServiceAccount(settings.googleSearchConsoleServiceAccountJson)
  if (!serviceAccount?.client_email || !serviceAccount?.private_key) {
    const error = new Error('Google Search Console service account JSON is missing or invalid')
    error.statusCode = 400
    throw error
  }

  const now = Math.floor(Date.now() / 1000)
  const assertion = jwt.sign({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  }, serviceAccount.private_key, {
    algorithm: 'RS256',
    keyid: serviceAccount.private_key_id
  })

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    })
  })
  const data = await response.json()
  if (!response.ok) {
    const error = new Error(data.error_description || data.error || 'Google authentication failed')
    error.statusCode = response.status
    throw error
  }

  googleAccessTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + safeNumber(data.expires_in, 3600) * 1000
  }
  return googleAccessTokenCache.token
}

async function fetchSearchConsoleRows(settings, dimensions, rowLimit = 10) {
  const siteUrl = normalizeSearchConsoleProperty(settings.googleSearchConsoleProperty || process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY || '')
  if (!siteUrl) {
    const error = new Error('Google Search Console property is not configured')
    error.statusCode = 400
    throw error
  }

  const accessToken = await getGoogleAccessToken(settings)
  const response = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      startDate: getIsoDate(28),
      endDate: getIsoDate(2),
      dimensions,
      rowLimit,
      startRow: 0
    })
  })
  const data = await response.json()
  if (!response.ok) {
    const error = new Error(data.error?.message || 'Search Console request failed')
    error.statusCode = response.status
    throw error
  }
  return data.rows || []
}

async function fetchPageSpeed(url, apiKey, strategy) {
  const params = new URLSearchParams({
    url,
    strategy,
    category: 'performance'
  })
  params.append('category', 'seo')
  if (apiKey) params.set('key', apiKey)

  const response = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`)
  const data = await response.json()
  if (!response.ok) {
    const error = new Error(data.error?.message || 'PageSpeed Insights request failed')
    error.statusCode = response.status
    throw error
  }

  const categories = data.lighthouseResult?.categories || {}
  const audits = data.lighthouseResult?.audits || {}
  return {
    strategy,
    performance: Math.round(safeNumber(categories.performance?.score) * 100),
    seo: Math.round(safeNumber(categories.seo?.score) * 100),
    firstContentfulPaint: audits['first-contentful-paint']?.displayValue || '',
    largestContentfulPaint: audits['largest-contentful-paint']?.displayValue || '',
    cumulativeLayoutShift: audits['cumulative-layout-shift']?.displayValue || '',
    speedIndex: audits['speed-index']?.displayValue || '',
    checkedAt: new Date().toISOString()
  }
}

function buildSeoRecommendations(searchConsole, pageSpeed) {
  const recommendations = []
  let opportunityQueries = []
  let lowCtrPages = []

  if (searchConsole) {
    const ctrPercent = safeNumber(searchConsole.ctr) * 100
    if (searchConsole.impressions >= 100 && ctrPercent < 3) {
      recommendations.push({
        title: 'Improve click-through rate from search',
        detail: `Your average CTR is ${ctrPercent.toFixed(1)}%. Tighten page titles and meta descriptions on high-impression pages to win more clicks.`,
        priority: 'high'
      })
    }

    if (safeNumber(searchConsole.averagePosition) > 10) {
      recommendations.push({
        title: 'Push pages from page 2 onto page 1',
        detail: `Average position is ${safeNumber(searchConsole.averagePosition).toFixed(1)}. Focus internal links, headings, and supporting copy on the queries already getting impressions.`,
        priority: 'medium'
      })
    }

    opportunityQueries = (searchConsole.topQueries || [])
      .filter((row) => safeNumber(row.impressions) >= 20 && safeNumber(row.position) > 3 && safeNumber(row.position) <= 20)
      .sort((a, b) => safeNumber(b.impressions) - safeNumber(a.impressions))
      .slice(0, 5)
      .map((row) => ({
        query: row.query,
        impressions: safeNumber(row.impressions),
        clicks: safeNumber(row.clicks),
        position: safeNumber(row.position),
        ctr: safeNumber(row.ctr)
      }))

    lowCtrPages = (searchConsole.topPages || [])
      .filter((row) => safeNumber(row.impressions) >= 20)
      .sort((a, b) => safeNumber(a.ctr) - safeNumber(b.ctr))
      .slice(0, 5)
      .map((row) => ({
        page: row.page,
        impressions: safeNumber(row.impressions),
        clicks: safeNumber(row.clicks),
        position: safeNumber(row.position),
        ctr: safeNumber(row.ctr)
      }))

  }

  if (pageSpeed?.mobile && safeNumber(pageSpeed.mobile.performance) < 70) {
    recommendations.push({
      title: 'Speed up the mobile experience',
      detail: `Mobile performance is ${safeNumber(pageSpeed.mobile.performance)}/100. Improving images, scripts, and layout stability should help rankings and conversions.`,
      priority: 'high'
    })
  }

  return { recommendations, opportunityQueries, lowCtrPages }
}

async function storeUpload(dataUrl, originalName = '', visibility = 'public') {
  const match = String(dataUrl || '').match(/^data:([^;]+);base64,(.+)$/)
  if (!match) {
    const error = new Error('Unsupported upload format')
    error.statusCode = 400
    throw error
  }

  const mimeType = match[1]
  const extension = mediaMimeExtensions[mimeType]
  if (!extension) {
    const error = new Error('This file type is not supported')
    error.statusCode = 400
    throw error
  }

  const buffer = Buffer.from(match[2], 'base64')
  if (buffer.length > 25 * 1024 * 1024) {
    const error = new Error('Upload is too large')
    error.statusCode = 413
    throw error
  }

  const isPrivate = visibility === 'private'
  const targetDir = isPrivate ? privateUploadsDir : uploadsDir
  await fs.mkdir(targetDir, { recursive: true })
  const filename = `${randomUUID()}.${extension}`
  const filePath = path.join(targetDir, filename)
  await fs.writeFile(filePath, buffer)
  await fs.access(filePath)

  return {
    filename,
    originalName,
    url: isPrivate ? '' : `/api/uploads/${filename}`,
    mimeType,
    mediaType: getMediaType(mimeType),
    size: buffer.length,
    visibility: isPrivate ? 'private' : 'public'
  }
}

async function ensureMediaAssetsSchema() {
  if (mediaAssetsSchemaReady) return

  const queryInterface = MediaAsset.sequelize.getQueryInterface()
  const table = await queryInterface.describeTable('MediaAssets').catch(() => null)
  if (!table) {
    await MediaAsset.sync()
  } else {
    if (!table.folder) {
      await queryInterface.addColumn('MediaAssets', 'folder', {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Uncategorized'
      }).catch(error => {
        if (!String(error?.message || '').includes('Duplicate column')) throw error
      })
    }
    if (!table.tags) {
      await queryInterface.addColumn('MediaAssets', 'tags', {
        type: DataTypes.JSON,
        allowNull: true
      }).catch(error => {
        if (!String(error?.message || '').includes('Duplicate column')) throw error
      })
    }
    if (!table.visibility) {
      await queryInterface.addColumn('MediaAssets', 'visibility', {
        type: DataTypes.ENUM('public', 'private'),
        allowNull: true,
        defaultValue: 'public'
      }).catch(error => {
        if (!String(error?.message || '').includes('Duplicate column')) throw error
      })
    }
  }

  mediaAssetsSchemaReady = true
}

async function ensureProtectedContentSchema() {
  if (protectedContentSchemaReady) return

  const queryInterface = ProtectedContentItem.sequelize.getQueryInterface()
  const table = await queryInterface.describeTable('ProtectedContentItems').catch(() => null)
  if (!table) {
    await ProtectedContentItem.sync()
  } else if (!table.mediaAssetId) {
    await queryInterface.addColumn('ProtectedContentItems', 'mediaAssetId', {
      type: DataTypes.INTEGER,
      allowNull: true
    }).catch(error => {
      if (!String(error?.message || '').includes('Duplicate column')) throw error
    })
  }

  protectedContentSchemaReady = true
}

async function moveMediaAssetFile(asset, nextVisibility) {
  const currentVisibility = asset.visibility === 'private' ? 'private' : 'public'
  if (nextVisibility !== 'private' && nextVisibility !== 'public') return {}
  if (nextVisibility === currentVisibility) return {}

  const currentDir = currentVisibility === 'private' ? privateUploadsDir : uploadsDir
  const nextDir = nextVisibility === 'private' ? privateUploadsDir : uploadsDir
  await fs.mkdir(nextDir, { recursive: true })
  await fs.rename(path.join(currentDir, asset.filename), path.join(nextDir, asset.filename)).catch(async () => {
    await fs.copyFile(path.join(currentDir, asset.filename), path.join(nextDir, asset.filename))
    await fs.unlink(path.join(currentDir, asset.filename)).catch(() => {})
  })

  return {
    visibility: nextVisibility,
    url: nextVisibility === 'private' ? `/api/protected-media/${asset.id}` : `/api/uploads/${asset.filename}`
  }
}

router.use((req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No token provided' })
    const decoded = jwt.verify(token, JWT_SECRET)
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin access required' })
    req.userId = decoded.userId
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
})

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const totalClients = await User.count({ where: { role: 'client' } })
    const totalProjects = await Project.count()
    const activeProjects = await Project.count({ where: { status: 'in-progress' } })
    
    const totalRevenueResult = await Invoice.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total')), 'total']
      ],
      where: { status: 'paid' }
    })
    
    const activeSubscriptions = await Subscription.count({ where: { status: 'active' } })
    
    res.json({
      totalClients,
      totalProjects,
      activeProjects,
      totalRevenue: totalRevenueResult?.dataValues?.total || 0,
      activeSubscriptions
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all clients
router.get('/clients', async (req, res) => {
  try {
    const clients = await User.findAll({
      where: { role: 'client' },
      attributes: { exclude: ['password', 'twoFactorCode', 'twoFactorSecret', 'passwordResetCode', 'passwordResetExpires'] },
      order: [['createdAt', 'DESC']]
    })
    res.json(clients)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all projects
router.get('/projects', async (req, res) => {
  try {
    const projects = await Project.findAll({
      include: [{ model: User, attributes: ['id', 'name', 'email', 'company'] }],
      order: [['createdAt', 'DESC']]
    })
    res.json(projects)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all invoices
router.get('/invoices', async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      include: [{ model: User, attributes: ['id', 'name', 'email', 'company'] }],
      order: [['issueDate', 'DESC']]
    })
    res.json(invoices)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all subscriptions
router.get('/subscriptions', async (req, res) => {
  try {
    await ensureSubscriptionSchema()
    const subscriptions = await Subscription.findAll({
      where: { productType: 'service' },
      include: [
        { model: User, attributes: ['id', 'name', 'email', 'company'] },
        { model: SubscriptionPlan, attributes: ['id', 'name', 'price', 'billingCycle'] }
      ],
      order: [['createdAt', 'DESC']]
    })
    res.json(subscriptions)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/notifications', async (req, res) => {
  try {
    const [newMessages, newTickets] = await Promise.all([
      ContactMessage.count({ where: { status: 'new' } }),
      Ticket.count({ where: { status: 'pending' } })
    ])

    res.json({
      newMessages,
      newTickets,
      total: newMessages + newTickets
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/licenses', async (req, res) => {
  try {
    await ensureCmsLicenseSchema()
    const clients = await User.findAll({ where: { role: 'client' }, attributes: ['id'] })
    await Promise.all(clients.map((client) => migrateLegacySubscriptionLicense(client.id)))

    const licenses = await CMSLicense.findAll({
      include: [
        { model: User, attributes: ['id', 'name', 'email', 'company'] },
        { model: SubscriptionPlan, attributes: ['id', 'name', 'price', 'billingCycle'] }
      ],
      order: [['createdAt', 'DESC']]
    })
    res.json(licenses)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/seo-dashboard', async (req, res) => {
  try {
    const settings = await getOrCreateSiteSettings()
    const configured = Boolean(settings.googleSearchConsoleProperty && (settings.googleSearchConsoleServiceAccountJson || process.env.GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON))
    const normalizedProperty = normalizeSearchConsoleProperty(settings.googleSearchConsoleProperty || process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY || '')
    const pageSpeedUrl = settings.pageSpeedUrl || process.env.PAGESPEED_URL || (!String(normalizedProperty || '').startsWith('sc-domain:') ? normalizedProperty : '')
    const pageSpeedApiKey = settings.pageSpeedApiKey || process.env.PAGESPEED_API_KEY || settings.googleApiKey || ''
    const cacheKey = JSON.stringify({
      property: normalizedProperty,
      pageSpeedUrl,
      hasSearchConsoleCredentials: configured,
      hasPageSpeedApiKey: Boolean(pageSpeedApiKey)
    })
    const cached = seoDashboardCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return res.json({ ...cached.data, cached: true })
    }

    const result = {
      configured,
      property: normalizedProperty,
      dateRange: { startDate: getIsoDate(28), endDate: getIsoDate(2) },
      searchConsole: null,
      pageSpeed: null,
      cached: false,
      errors: []
    }

    if (configured) {
      try {
        const [queryRows, pageRows] = await Promise.all([
          fetchSearchConsoleRows(settings, ['query'], 25),
          fetchSearchConsoleRows(settings, ['page'], 25)
        ])
        const totals = queryRows.reduce((sum, row) => ({
          clicks: sum.clicks + safeNumber(row.clicks),
          impressions: sum.impressions + safeNumber(row.impressions),
          weightedPosition: sum.weightedPosition + safeNumber(row.position) * safeNumber(row.impressions)
        }), { clicks: 0, impressions: 0, weightedPosition: 0 })

        result.searchConsole = {
          clicks: totals.clicks,
          impressions: totals.impressions,
          ctr: totals.impressions ? totals.clicks / totals.impressions : 0,
          averagePosition: totals.impressions ? totals.weightedPosition / totals.impressions : 0,
          topQueries: queryRows.map(row => ({
            query: row.keys?.[0] || '',
            clicks: safeNumber(row.clicks),
            impressions: safeNumber(row.impressions),
            ctr: safeNumber(row.ctr),
            position: safeNumber(row.position)
          })),
          topPages: pageRows.map(row => ({
            page: row.keys?.[0] || '',
            clicks: safeNumber(row.clicks),
            impressions: safeNumber(row.impressions),
            ctr: safeNumber(row.ctr),
            position: safeNumber(row.position)
          }))
        }
      } catch (error) {
        result.errors.push(`Search Console: ${error.message}`)
      }
    }

    if (pageSpeedUrl && pageSpeedApiKey) {
      try {
        const [mobile, desktop] = await Promise.all([
          fetchPageSpeed(pageSpeedUrl, pageSpeedApiKey, 'mobile'),
          fetchPageSpeed(pageSpeedUrl, pageSpeedApiKey, 'desktop')
        ])
        result.pageSpeed = { url: pageSpeedUrl, mobile, desktop }
      } catch (error) {
        if (String(error.message || '').toLowerCase().includes('quota exceeded')) {
          result.pageSpeed = {
            url: pageSpeedUrl,
            disabledReason: 'PageSpeed quota has been used up for today. Try again after Google resets quota or use a different API key/project.'
          }
        } else {
          result.pageSpeed = {
            url: pageSpeedUrl,
            disabledReason: error.message
          }
        }
      }
    } else if (pageSpeedUrl) {
      result.pageSpeed = {
        url: pageSpeedUrl,
        disabledReason: 'Add a PageSpeed API key in Admin Settings, SEO to enable PageSpeed data.'
      }
    }

    result.insights = buildSeoRecommendations(result.searchConsole, result.pageSpeed)

    seoDashboardCache.set(cacheKey, {
      data: result,
      expiresAt: Date.now() + 6 * 60 * 60 * 1000
    })

    res.json(result)
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message })
  }
})

router.get('/plugins', async (req, res) => {
  try {
    await ensureDemoPlugins()
    const plugins = await Plugin.findAll({ order: [['name', 'ASC']] })
    res.json(plugins)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/plugins/:slug', async (req, res) => {
  try {
    const plugin = await Plugin.findOne({ where: { slug: req.params.slug } })
    if (!plugin) return res.status(404).json({ error: 'Plugin not found' })

    await plugin.update({
      price: req.body.price === undefined ? plugin.price : Number(req.body.price || 0),
      isEnabled: Boolean(req.body.isEnabled),
      isPurchased: req.body.isPurchased === undefined ? plugin.isPurchased : Boolean(req.body.isPurchased)
    })
    res.json(plugin)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/site-demos', async (req, res) => {
  try {
    await ensureSiteDemos()
    const demos = await SiteDemo.findAll({ order: [['sortOrder', 'ASC'], ['name', 'ASC']] })
    res.json(demos)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/site-demos/:slug', async (req, res) => {
  try {
    await ensureSiteDemos()
    const demo = await SiteDemo.findOne({ where: { slug: req.params.slug } })
    if (!demo) return res.status(404).json({ error: 'Site demo not found' })

    await demo.update({
      name: req.body.name || demo.name,
      category: req.body.category || demo.category,
      description: req.body.description || '',
      previewImage: req.body.previewImage || '',
      demoUrl: req.body.demoUrl || demo.demoUrl,
      isActive: req.body.isActive === undefined ? demo.isActive : Boolean(req.body.isActive),
      sortOrder: Number(req.body.sortOrder || 0)
    })
    res.json(demo)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/plugins/restaurant/menu', async (req, res) => {
  try {
    await getOrCreateRestaurantPlugin()
    const items = await RestaurantMenuItem.findAll({
      order: [['category', 'ASC'], ['sortOrder', 'ASC'], ['name', 'ASC']]
    })
    res.json(items)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/plugins/restaurant/menu', async (req, res) => {
  try {
    const item = await RestaurantMenuItem.create({
      name: req.body.name,
      description: req.body.description || '',
      category: req.body.category || 'Entrees',
      price: Number(req.body.price || 0),
      image: req.body.image || '',
      isAvailable: req.body.isAvailable !== false,
      sortOrder: Number(req.body.sortOrder || 0)
    })
    res.status(201).json(item)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/plugins/restaurant/menu/:id', async (req, res) => {
  try {
    const item = await RestaurantMenuItem.findByPk(req.params.id)
    if (!item) return res.status(404).json({ error: 'Menu item not found' })

    await item.update({
      name: req.body.name,
      description: req.body.description || '',
      category: req.body.category || 'Entrees',
      price: Number(req.body.price || 0),
      image: req.body.image || '',
      isAvailable: req.body.isAvailable !== false,
      sortOrder: Number(req.body.sortOrder || 0)
    })
    res.json(item)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/plugins/restaurant/menu/:id', async (req, res) => {
  try {
    const item = await RestaurantMenuItem.findByPk(req.params.id)
    if (!item) return res.status(404).json({ error: 'Menu item not found' })

    await item.destroy()
    res.json({ message: 'Menu item deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/plugins/real-estate/listings', async (req, res) => {
  try {
    await getOrCreateRealEstatePlugin()
    const listings = await RealEstateListing.findAll({
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']]
    })
    res.json(listings)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/plugins/real-estate/listings', async (req, res) => {
  try {
    const listing = await RealEstateListing.create({
      title: req.body.title,
      address: req.body.address || '',
      description: req.body.description || '',
      price: Number(req.body.price || 0),
      image: req.body.image || '',
      moreInfoUrl: req.body.moreInfoUrl || '',
      isActive: req.body.isActive !== false,
      sortOrder: Number(req.body.sortOrder || 0)
    })
    res.status(201).json(listing)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/plugins/real-estate/listings/:id', async (req, res) => {
  try {
    const listing = await RealEstateListing.findByPk(req.params.id)
    if (!listing) return res.status(404).json({ error: 'Listing not found' })

    await listing.update({
      title: req.body.title,
      address: req.body.address || '',
      description: req.body.description || '',
      price: Number(req.body.price || 0),
      image: req.body.image || '',
      moreInfoUrl: req.body.moreInfoUrl || '',
      isActive: req.body.isActive !== false,
      sortOrder: Number(req.body.sortOrder || 0)
    })
    res.json(listing)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/plugins/real-estate/listings/:id', async (req, res) => {
  try {
    const listing = await RealEstateListing.findByPk(req.params.id)
    if (!listing) return res.status(404).json({ error: 'Listing not found' })

    await listing.destroy()
    res.json({ message: 'Listing deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/plugins/booking/slots', async (req, res) => {
  try {
    await getOrCreateBookingPlugin()
    const slots = await BookingAvailabilitySlot.findAll({
      order: [['date', 'ASC'], ['startTime', 'ASC']]
    })
    res.json(slots)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/plugins/booking/slots', async (req, res) => {
  try {
    const slot = await BookingAvailabilitySlot.create({
      date: req.body.date,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      locationTypes: Array.isArray(req.body.locationTypes) ? req.body.locationTypes : [],
      isActive: req.body.isActive !== false
    })
    res.status(201).json(slot)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/plugins/booking/slots/:id', async (req, res) => {
  try {
    const slot = await BookingAvailabilitySlot.findByPk(req.params.id)
    if (!slot) return res.status(404).json({ error: 'Availability slot not found' })

    await slot.update({
      date: req.body.date,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      locationTypes: Array.isArray(req.body.locationTypes) ? req.body.locationTypes : [],
      isActive: req.body.isActive !== false
    })
    res.json(slot)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/plugins/booking/slots/:id', async (req, res) => {
  try {
    const slot = await BookingAvailabilitySlot.findByPk(req.params.id)
    if (!slot) return res.status(404).json({ error: 'Availability slot not found' })

    await slot.destroy()
    res.json({ message: 'Availability slot deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/plugins/booking/appointments', async (req, res) => {
  try {
    await getOrCreateBookingPlugin()
    const appointments = await BookingAppointment.findAll({
      include: [{ model: BookingAvailabilitySlot }],
      order: [['createdAt', 'DESC']]
    })
    res.json(appointments)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/plugins/booking/appointments/:id', async (req, res) => {
  try {
    const appointment = await BookingAppointment.findByPk(req.params.id)
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' })

    await appointment.update({ status: req.body.status || appointment.status })
    res.json(appointment)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/plugins/events/items', async (req, res) => {
  try {
    await getOrCreateEventsPlugin()
    const events = await EventItem.findAll({
      order: [['eventDate', 'ASC'], ['sortOrder', 'ASC'], ['title', 'ASC']]
    })
    res.json(events)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/plugins/events/items', async (req, res) => {
  try {
    const event = await EventItem.create({
      title: req.body.title,
      description: req.body.description || '',
      buttonLabel: req.body.buttonLabel || '',
      buttonUrl: req.body.buttonUrl || '',
      image: req.body.image || '',
      eventDate: req.body.eventDate,
      isActive: req.body.isActive !== false,
      sortOrder: Number(req.body.sortOrder || 0)
    })
    res.status(201).json(event)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/plugins/events/items/:id', async (req, res) => {
  try {
    const event = await EventItem.findByPk(req.params.id)
    if (!event) return res.status(404).json({ error: 'Event not found' })

    await event.update({
      title: req.body.title,
      description: req.body.description || '',
      buttonLabel: req.body.buttonLabel || '',
      buttonUrl: req.body.buttonUrl || '',
      image: req.body.image || '',
      eventDate: req.body.eventDate,
      isActive: req.body.isActive !== false,
      sortOrder: Number(req.body.sortOrder || 0)
    })
    res.json(event)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/plugins/events/items/:id', async (req, res) => {
  try {
    const event = await EventItem.findByPk(req.params.id)
    if (!event) return res.status(404).json({ error: 'Event not found' })

    await event.destroy()
    res.json({ message: 'Event deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/plugins/protected-content/items', async (req, res) => {
  try {
    await ensureProtectedContentSchema()
    await getOrCreateProtectedContentPlugin()
    const items = await ProtectedContentItem.findAll({
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']]
    })
    res.json(items)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/plugins/protected-content/items', async (req, res) => {
  try {
    await ensureProtectedContentSchema()
    const item = await ProtectedContentItem.create({
      title: req.body.title,
      description: req.body.description || '',
      contentType: req.body.contentType || 'video',
      previewImage: req.body.previewImage || '',
      contentUrl: req.body.contentUrl || '',
      mediaAssetId: req.body.mediaAssetId || null,
      price: Number(req.body.price || 0),
      buttonLabel: req.body.buttonLabel || 'Unlock Access',
      isActive: req.body.isActive !== false,
      sortOrder: Number(req.body.sortOrder || 0)
    })
    res.status(201).json(item)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/plugins/protected-content/items/:id', async (req, res) => {
  try {
    await ensureProtectedContentSchema()
    const item = await ProtectedContentItem.findByPk(req.params.id)
    if (!item) return res.status(404).json({ error: 'Protected content not found' })

    await item.update({
      title: req.body.title,
      description: req.body.description || '',
      contentType: req.body.contentType || 'video',
      previewImage: req.body.previewImage || '',
      contentUrl: req.body.contentUrl || '',
      mediaAssetId: req.body.mediaAssetId || null,
      price: Number(req.body.price || 0),
      buttonLabel: req.body.buttonLabel || 'Unlock Access',
      isActive: req.body.isActive !== false,
      sortOrder: Number(req.body.sortOrder || 0)
    })
    res.json(item)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/plugins/protected-content/items/:id', async (req, res) => {
  try {
    const item = await ProtectedContentItem.findByPk(req.params.id)
    if (!item) return res.status(404).json({ error: 'Protected content not found' })

    await item.destroy()
    res.json({ message: 'Protected content deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/plugins/crm/leads', async (req, res) => {
  try {
    await getOrCreateCrmPlugin()
    const leads = await CRMLead.findAll({ order: [['createdAt', 'DESC']] })
    res.json(leads)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/plugins/crm/leads/:id', async (req, res) => {
  try {
    const lead = await CRMLead.findByPk(req.params.id)
    if (!lead) return res.status(404).json({ error: 'CRM lead not found' })

    await lead.update({
      status: req.body.status || lead.status,
      notes: req.body.notes ?? lead.notes
    })
    res.json(lead)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/plugins/crm/leads/:id', async (req, res) => {
  try {
    const lead = await CRMLead.findByPk(req.params.id)
    if (!lead) return res.status(404).json({ error: 'CRM lead not found' })

    await lead.destroy()
    res.json({ message: 'CRM lead deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/uploads', async (req, res) => {
  try {
    await ensureMediaAssetsSchema()
    const stored = await storeUpload(req.body.dataUrl, req.body.originalName || '', 'public')
    await MediaAsset.create({
      ...stored,
      title: req.body.title || req.body.originalName || stored.filename,
      altText: req.body.altText || '',
      folder: req.body.folder || 'Uncategorized',
      tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      visibility: 'public'
    })
    res.status(201).json({ url: stored.url })
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message })
  }
})

router.get('/media', async (req, res) => {
  try {
    await ensureMediaAssetsSchema()
    const where = {}
    if (req.query.type && req.query.type !== 'all') where.mediaType = req.query.type
    if (req.query.visibility && req.query.visibility !== 'all') where.visibility = req.query.visibility
    const assets = await MediaAsset.findAll({ where, order: [['createdAt', 'DESC']] })
    res.json(assets)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/media', async (req, res) => {
  try {
    await ensureMediaAssetsSchema()
    const visibility = req.body.visibility === 'private' ? 'private' : 'public'
    const stored = await storeUpload(req.body.dataUrl, req.body.originalName || '', visibility)
    const asset = await MediaAsset.create({
      ...stored,
      title: req.body.title || req.body.originalName || stored.filename,
      altText: req.body.altText || '',
      folder: req.body.folder || 'Uncategorized',
      tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      visibility
    })
    if (visibility === 'private') await asset.update({ url: `/api/protected-media/${asset.id}` })
    res.status(201).json(asset)
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message })
  }
})

router.put('/media/bulk', async (req, res) => {
  try {
    await ensureMediaAssetsSchema()
    const ids = Array.isArray(req.body.ids) ? req.body.ids.filter(Boolean) : []
    if (ids.length === 0) return res.status(400).json({ error: 'No media assets selected' })

    const assets = await MediaAsset.findAll({ where: { id: ids } })
    const tagUpdates = Array.isArray(req.body.tags) ? req.body.tags.map(tag => String(tag).trim()).filter(Boolean) : []

    await Promise.all(assets.map(asset => {
      const updates = {}
      if (req.body.folder !== undefined) updates.folder = req.body.folder || 'Uncategorized'

      if (req.body.tagAction === 'add') {
        updates.tags = Array.from(new Set([...(Array.isArray(asset.tags) ? asset.tags : []), ...tagUpdates]))
      }
      if (req.body.tagAction === 'remove') {
        updates.tags = (Array.isArray(asset.tags) ? asset.tags : []).filter(tag => !tagUpdates.includes(tag))
      }

      return (async () => {
        if (req.body.visibility === 'public' || req.body.visibility === 'private') {
          Object.assign(updates, await moveMediaAssetFile(asset, req.body.visibility))
        }
        return Object.keys(updates).length > 0 ? asset.update(updates) : asset
      })()
    }))

    const updatedAssets = await MediaAsset.findAll({ where: { id: ids }, order: [['createdAt', 'DESC']] })
    res.json(updatedAssets)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/media/:id', async (req, res) => {
  try {
    await ensureMediaAssetsSchema()
    const asset = await MediaAsset.findByPk(req.params.id)
    if (!asset) return res.status(404).json({ error: 'Media asset not found' })
    const visibilityUpdates = req.body.visibility === 'private' || req.body.visibility === 'public'
      ? await moveMediaAssetFile(asset, req.body.visibility)
      : {}
    await asset.update({
      title: req.body.title ?? asset.title,
      altText: req.body.altText ?? asset.altText,
      folder: req.body.folder ?? asset.folder,
      tags: Array.isArray(req.body.tags) ? req.body.tags : asset.tags,
      ...visibilityUpdates
    })
    res.json(asset)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/media/bulk', async (req, res) => {
  try {
    await ensureMediaAssetsSchema()
    const ids = Array.isArray(req.body.ids) ? req.body.ids.filter(Boolean) : []
    if (ids.length === 0) return res.status(400).json({ error: 'No media assets selected' })

    const assets = await MediaAsset.findAll({ where: { id: ids } })
    await Promise.all(assets.map(async asset => {
      const filePath = path.join(asset.visibility === 'private' ? privateUploadsDir : uploadsDir, asset.filename)
      await fs.unlink(filePath).catch(() => {})
      await asset.destroy()
    }))

    res.json({ deleted: assets.length })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/media/:id', async (req, res) => {
  try {
    await ensureMediaAssetsSchema()
    const asset = await MediaAsset.findByPk(req.params.id)
    if (!asset) return res.status(404).json({ error: 'Media asset not found' })
    const filePath = path.join(asset.visibility === 'private' ? privateUploadsDir : uploadsDir, asset.filename)
    await fs.unlink(filePath).catch(() => {})
    await asset.destroy()
    res.json({ message: 'Media asset deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get subscription plans offered by the studio
router.get('/subscription-plans', async (req, res) => {
  try {
    await ensureSubscriptionSchema()
    const plans = await SubscriptionPlan.findAll({ order: [['createdAt', 'DESC']] })
    res.json(plans)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create subscription plan
router.post('/subscription-plans', async (req, res) => {
  try {
    await ensureSubscriptionSchema()
    const features = Array.isArray(req.body.features)
      ? req.body.features
      : String(req.body.features || '')
        .split('\n')
        .map(feature => feature.trim())
        .filter(Boolean)

    const plan = await SubscriptionPlan.create({
      ...req.body,
      productType: req.body.productType === 'cms-license' ? 'cms-license' : 'service',
      updateChannel: req.body.updateChannel === 'early-access' ? 'early-access' : 'stable',
      includedUpdates: req.body.includedUpdates !== false,
      features
    })
    res.status(201).json(plan)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update subscription plan
router.put('/subscription-plans/:id', async (req, res) => {
  try {
    await ensureSubscriptionSchema()
    const plan = await SubscriptionPlan.findByPk(req.params.id)
    if (!plan) return res.status(404).json({ error: 'Subscription plan not found' })

    const features = Array.isArray(req.body.features)
      ? req.body.features
      : String(req.body.features || '')
        .split('\n')
        .map(feature => feature.trim())
        .filter(Boolean)

    await plan.update({
      ...req.body,
      productType: req.body.productType === 'cms-license' ? 'cms-license' : 'service',
      updateChannel: req.body.updateChannel === 'early-access' ? 'early-access' : 'stable',
      includedUpdates: req.body.includedUpdates !== false,
      features
    })
    res.json(plan)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete subscription plan
router.delete('/subscription-plans/:id', async (req, res) => {
  try {
    await ensureSubscriptionSchema()
    const plan = await SubscriptionPlan.findByPk(req.params.id)
    if (!plan) return res.status(404).json({ error: 'Subscription plan not found' })
    await plan.destroy()
    res.json({ message: 'Subscription plan deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all a la carte service packages
router.get('/service-packages', async (req, res) => {
  try {
    const services = await ServicePackage.findAll({ order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']] })
    res.json(services)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/service-packages', async (req, res) => {
  try {
    const service = await ServicePackage.create(req.body)
    res.status(201).json(service)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/service-packages/:id', async (req, res) => {
  try {
    const service = await ServicePackage.findByPk(req.params.id)
    if (!service) return res.status(404).json({ error: 'Service package not found' })
    await service.update(req.body)
    res.json(service)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/service-packages/:id', async (req, res) => {
  try {
    const service = await ServicePackage.findByPk(req.params.id)
    if (!service) return res.status(404).json({ error: 'Service package not found' })
    await service.destroy()
    res.json({ message: 'Service package deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all portfolio items
router.get('/portfolio-items', async (req, res) => {
  try {
    const items = await PortfolioItem.findAll({ order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']] })
    res.json(items)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/portfolio-items', async (req, res) => {
  try {
    const item = await PortfolioItem.create(req.body)
    res.status(201).json(item)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/portfolio-items/:id', async (req, res) => {
  try {
    const item = await PortfolioItem.findByPk(req.params.id)
    if (!item) return res.status(404).json({ error: 'Portfolio item not found' })
    await item.update(req.body)
    res.json(item)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/portfolio-items/:id', async (req, res) => {
  try {
    const item = await PortfolioItem.findByPk(req.params.id)
    if (!item) return res.status(404).json({ error: 'Portfolio item not found' })
    await item.destroy()
    res.json({ message: 'Portfolio item deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/site-settings', async (req, res) => {
  try {
    const settings = await getOrCreateSiteSettings()
    res.json(settings)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/site-settings', async (req, res) => {
  try {
    const settings = await getOrCreateSiteSettings()
    await settings.update(req.body)
    res.json(settings)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/pages', async (req, res) => {
  try {
    await ensureCustomPagesSchema()
    const pages = await CustomPage.findAll({ order: [['sortOrder', 'ASC'], ['title', 'ASC']] })
    res.json(pages)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/pages', async (req, res) => {
  try {
    await ensureCustomPagesSchema()
    const page = await CustomPage.create({
      title: req.body.title,
      slug: String(req.body.slug || req.body.title || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
      headerTitle: req.body.headerTitle || req.body.title,
      headerSubtitle: req.body.headerSubtitle || '',
      showPageHeader: req.body.showPageHeader !== false,
      content: req.body.content || '',
      sections: Array.isArray(req.body.sections) ? req.body.sections : [],
      metaTitle: req.body.metaTitle || '',
      metaDescription: req.body.metaDescription || '',
      isPublished: Boolean(req.body.isPublished),
      sortOrder: Number(req.body.sortOrder || 0)
    })
    res.status(201).json(page)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/pages/:id', async (req, res) => {
  try {
    await ensureCustomPagesSchema()
    const page = await CustomPage.findByPk(req.params.id)
    if (!page) return res.status(404).json({ error: 'Page not found' })

    await page.update({
      title: req.body.title,
      slug: String(req.body.slug || req.body.title || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
      headerTitle: req.body.headerTitle || req.body.title,
      headerSubtitle: req.body.headerSubtitle || '',
      showPageHeader: req.body.showPageHeader !== false,
      content: req.body.content || '',
      sections: Array.isArray(req.body.sections) ? req.body.sections : [],
      metaTitle: req.body.metaTitle || '',
      metaDescription: req.body.metaDescription || '',
      isPublished: Boolean(req.body.isPublished),
      sortOrder: Number(req.body.sortOrder || 0)
    })
    res.json(page)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/pages/:id', async (req, res) => {
  try {
    await ensureCustomPagesSchema()
    const page = await CustomPage.findByPk(req.params.id)
    if (!page) return res.status(404).json({ error: 'Page not found' })

    await page.destroy()
    res.json({ message: 'Page deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/users/:id/two-factor/setup', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const secret = base32Encode(crypto.randomBytes(20))
    await user.update({ twoFactorSecret: secret, twoFactorMethod: 'app' })
    const label = encodeURIComponent(`Creative by Caleb:${user.email}`)
    const issuer = encodeURIComponent('Creative by Caleb')
    const otpauthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`
    res.json({ secret, otpauthUrl })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/users/:id/two-factor/confirm', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (!user.twoFactorSecret) return res.status(400).json({ error: 'Two-factor setup has not been started' })
    if (!verifyTotp(user.twoFactorSecret, req.body.code)) return res.status(401).json({ error: 'Invalid authenticator code' })

    await user.update({
      twoFactorEnabled: true,
      twoFactorMethod: 'app',
      twoFactorCode: null,
      twoFactorExpires: null
    })

    res.json({
      message: 'Two-factor authentication updated',
      user: { id: user.id, email: user.email, twoFactorEnabled: user.twoFactorEnabled }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/users/:id/two-factor', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    await user.update({
      twoFactorEnabled: Boolean(req.body.enabled),
      twoFactorMethod: req.body.method || user.twoFactorMethod || 'email',
      twoFactorSecret: req.body.enabled ? user.twoFactorSecret : null,
      twoFactorCode: null,
      twoFactorExpires: null
    })

    res.json({
      message: 'Two-factor authentication updated',
      user: { id: user.id, email: user.email, twoFactorEnabled: user.twoFactorEnabled }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/contact-messages', async (req, res) => {
  try {
    const messages = await ContactMessage.findAll({ order: [['createdAt', 'DESC']] })
    res.json(messages)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/contact-messages/:id', async (req, res) => {
  try {
    const message = await ContactMessage.findByPk(req.params.id)
    if (!message) return res.status(404).json({ error: 'Message not found' })
    await message.update(req.body)
    res.json(message)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Assign a plan to a client
router.post('/subscriptions/assign', async (req, res) => {
  try {
    await ensureSubscriptionSchema()
    await ensureCmsLicenseSchema()
    const { clientId, planId, renewalDate, licensedDomain } = req.body
    const client = await User.findByPk(clientId)
    if (!client || client.role !== 'client') return res.status(404).json({ error: 'Client not found' })

    const plan = await SubscriptionPlan.findByPk(planId)
    if (!plan) return res.status(404).json({ error: 'Subscription plan not found' })

    const nextRenewalDate = renewalDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    if (plan.productType === 'cms-license') {
      await CMSLicense.update(
        { status: 'cancelled', endDate: new Date() },
        { where: { clientId, status: 'active' } }
      )

      const license = await CMSLicense.create({
        clientId,
        planId,
        planName: plan.name,
        tier: plan.tier,
        status: 'active',
        price: plan.price,
        billingCycle: plan.billingCycle,
        licenseKey: generateLicenseKey(),
        licensedDomain: String(licensedDomain || '').trim() || null,
        updateChannel: plan.updateChannel || 'stable',
        includedUpdates: plan.includedUpdates !== false,
        lastValidatedAt: new Date(),
        renewalDate: nextRenewalDate,
        features: plan.features
      })

      return res.status(201).json({ type: 'license', license })
    }

    const subscription = await Subscription.create({
      clientId,
      planId,
      planName: plan.name,
      tier: plan.tier,
      status: 'active',
      price: plan.price,
      billingCycle: plan.billingCycle,
      productType: 'service',
      licenseKey: null,
      licensedDomain: null,
      updateChannel: plan.updateChannel || 'stable',
      includedUpdates: plan.includedUpdates !== false,
      lastValidatedAt: null,
      renewalDate: nextRenewalDate,
      features: plan.features
    })

    res.status(201).json({ type: 'subscription', subscription })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/licenses/:id/cancel', async (req, res) => {
  try {
    await ensureCmsLicenseSchema()
    const license = await CMSLicense.findByPk(req.params.id)
    if (!license) return res.status(404).json({ error: 'License not found' })
    await license.update({ status: 'cancelled', endDate: new Date() })
    res.json(license)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create user (by admin)
router.post('/users', async (req, res) => {
  try {
    if (!req.body.password || req.body.password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }
    const user = await User.create(req.body)
    const { password, ...safeUser } = user.toJSON()
    res.status(201).json({ message: 'User created', user: safeUser })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    await user.update(req.body)
    const { password, ...safeUser } = user.toJSON()
    res.json(safeUser)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    await user.destroy()
    res.json({ message: 'User deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Revenue by month
router.get('/revenue/monthly', async (req, res) => {
  try {
    const monthlyRevenue = await sequelize.query(
      `SELECT 
        DATE_FORMAT(paidDate, '%Y-%m') as month,
        SUM(total) as revenue  
      FROM Invoices 
      WHERE status = 'paid' AND paidDate IS NOT NULL
      GROUP BY DATE_FORMAT(paidDate, '%Y-%m')
      ORDER BY month ASC`,
      { type: 'SELECT' }
    )
    res.json(monthlyRevenue)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
