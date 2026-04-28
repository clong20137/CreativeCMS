import express from 'express'
import sequelize from '../database.js'
import { DataTypes, Op } from 'sequelize'
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
import BlogArticle from '../models/BlogArticle.js'
import AuditLog from '../models/AuditLog.js'
import { getOrCreateSiteSettings } from './site-settings.js'
import { ensureDemoPlugins, getOrCreateBlogPlugin, getOrCreateBookingPlugin, getOrCreateCrmPlugin, getOrCreateEventsPlugin, getOrCreateProtectedContentPlugin, getOrCreateRestaurantPlugin, getOrCreateRealEstatePlugin } from './plugins.js'
import { ensureSiteDemos } from './site-demos.js'
import crypto from 'crypto'
import { base32Encode, verifyTotp } from './auth.js'
import jwt from 'jsonwebtoken'
import { ensureActiveUser, requireRole, verifyToken } from '../utils/auth.js'
import { cleanString, sanitizeUserForResponse } from '../utils/validation.js'
import { createAuditLog, ensureAuditLogSchema } from '../utils/audit.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = path.resolve(__dirname, '../../uploads')
const privateUploadsDir = path.resolve(__dirname, '../../private-uploads')
let mediaAssetsSchemaReady = false
let protectedContentSchemaReady = false
let blogArticlesSchemaReady = false
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

function assetReferenceCandidates(asset) {
  return Array.from(new Set([
    asset?.url,
    asset?.filename ? `/api/uploads/${asset.filename}` : '',
    asset?.filename ? `/uploads/${asset.filename}` : '',
    asset?.filename || '',
    asset?.id ? `/api/protected-media/${asset.id}` : '',
    asset?.id ? `/protected-media/${asset.id}` : ''
  ].filter(Boolean).map(value => String(value))))
}

function valueContainsAssetReference(value, asset) {
  const candidates = assetReferenceCandidates(asset)
  let found = false

  const inspect = (current) => {
    if (found || current === null || current === undefined) return
    if (typeof current === 'string') {
      found = candidates.some(candidate => current.includes(candidate))
      return
    }
    if (Array.isArray(current)) {
      current.forEach(inspect)
      return
    }
    if (typeof current === 'object') {
      Object.values(current).forEach(inspect)
    }
  }

  inspect(value)
  return found
}

function buildMediaUsageLabel(type, label, path = '') {
  return {
    type,
    label,
    path
  }
}

async function enrichMediaAssetsWithUsage(assets) {
  if (!Array.isArray(assets) || assets.length === 0) return []

  const [settings, customPages, portfolioItems, restaurantItems, realEstateListings, eventItems, protectedItems, siteDemos] = await Promise.all([
    getOrCreateSiteSettings(),
    CustomPage.findAll({ attributes: ['id', 'title', 'slug', 'sections'] }).catch(() => []),
    PortfolioItem.findAll({ attributes: ['id', 'title', 'image'] }).catch(() => []),
    RestaurantMenuItem.findAll({ attributes: ['id', 'name', 'image'] }).catch(() => []),
    RealEstateListing.findAll({ attributes: ['id', 'title', 'image'] }).catch(() => []),
    EventItem.findAll({ attributes: ['id', 'title', 'image'] }).catch(() => []),
    ProtectedContentItem.findAll({ attributes: ['id', 'title', 'mediaAssetId', 'contentUrl'] }).catch(() => []),
    SiteDemo.findAll({ attributes: ['id', 'name', 'slug', 'previewImage'] }).catch(() => [])
  ])

  const settingsJson = settings?.toJSON?.() || {}

  return assets.map((asset) => {
    const usageLocations = []
    const addUsage = (usage) => {
      if (!usageLocations.some(item => item.type === usage.type && item.label === usage.label && item.path === usage.path)) {
        usageLocations.push(usage)
      }
    }

    if (valueContainsAssetReference(settingsJson.logoUrl, asset)) addUsage(buildMediaUsageLabel('Site Setting', 'Logo', '/admin/settings'))
    if (valueContainsAssetReference(settingsJson.faviconUrl, asset)) addUsage(buildMediaUsageLabel('Site Setting', 'Favicon', '/admin/settings'))
    if (valueContainsAssetReference(settingsJson.heroMediaUrl, asset)) addUsage(buildMediaUsageLabel('Site Setting', 'Homepage hero media', '/admin/settings'))

    Object.entries(settingsJson.pageSections || {}).forEach(([pageKey, pageSections]) => {
      if (valueContainsAssetReference(pageSections, asset)) {
        addUsage(buildMediaUsageLabel('Built-in Page', `${String(pageKey)} page sections`, '/admin/pages'))
      }
    })

    if (valueContainsAssetReference(settingsJson.whatWeDo, asset)) addUsage(buildMediaUsageLabel('Homepage', 'What We Do section', '/admin/settings'))
    if (valueContainsAssetReference(settingsJson.featuredWork, asset)) addUsage(buildMediaUsageLabel('Homepage', 'Featured Work section', '/admin/settings'))
    if (valueContainsAssetReference(settingsJson.services, asset)) addUsage(buildMediaUsageLabel('Services', 'Services list', '/admin/pages'))
    if (valueContainsAssetReference(settingsJson.testimonials, asset)) addUsage(buildMediaUsageLabel('Testimonials', 'Manual testimonials', '/admin/pages'))

    customPages.forEach((page) => {
      if (valueContainsAssetReference(page.sections, asset)) {
        addUsage(buildMediaUsageLabel('Custom Page', page.title || page.slug, `/admin/pages?slug=${page.slug}`))
      }
    })

    portfolioItems.forEach((item) => {
      if (valueContainsAssetReference(item.image, asset)) {
        addUsage(buildMediaUsageLabel('Portfolio Item', item.title || `Portfolio #${item.id}`, '/admin/portfolio'))
      }
    })

    restaurantItems.forEach((item) => {
      if (valueContainsAssetReference(item.image, asset)) {
        addUsage(buildMediaUsageLabel('Restaurant Plugin', item.name || `Menu item #${item.id}`, '/admin/plugins/restaurant'))
      }
    })

    realEstateListings.forEach((item) => {
      if (valueContainsAssetReference(item.image, asset)) {
        addUsage(buildMediaUsageLabel('Real Estate Plugin', item.title || `Listing #${item.id}`, '/admin/plugins/real-estate'))
      }
    })

    eventItems.forEach((item) => {
      if (valueContainsAssetReference(item.image, asset)) {
        addUsage(buildMediaUsageLabel('Events Plugin', item.title || `Event #${item.id}`, '/admin/plugins/events'))
      }
    })

    protectedItems.forEach((item) => {
      if (Number(item.mediaAssetId || 0) === Number(asset.id) || valueContainsAssetReference(item.contentUrl, asset)) {
        addUsage(buildMediaUsageLabel('Protected Content', item.title || `Protected item #${item.id}`, '/admin/plugins/protected-content'))
      }
    })

    siteDemos.forEach((demo) => {
      if (valueContainsAssetReference(demo.previewImage, asset)) {
        addUsage(buildMediaUsageLabel('Site Demo', demo.name || demo.slug, '/admin/site-demos'))
      }
    })

    const data = asset.toJSON ? asset.toJSON() : asset
    return {
      ...data,
      usageCount: usageLocations.length,
      usageLocations,
      altStatus: String(data.altText || '').trim() ? 'complete' : 'missing'
    }
  })
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
    const addPlanColumn = async (name, config) => {
      if (planTable[name]) return
      await queryInterface.addColumn('SubscriptionPlans', name, config).catch((error) => {
        if (!String(error?.message || '').includes('Duplicate column')) throw error
      })
    }
    await addPlanColumn('maxPages', { type: DataTypes.INTEGER, allowNull: true })
    await addPlanColumn('maxMediaItems', { type: DataTypes.INTEGER, allowNull: true })
    await addPlanColumn('maxStorageMb', { type: DataTypes.INTEGER, allowNull: true })
    await addPlanColumn('maxTeamMembers', { type: DataTypes.INTEGER, allowNull: true })
    await addPlanColumn('allowAllPlugins', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    })
    await addPlanColumn('allowedPluginSlugs', { type: DataTypes.JSON, allowNull: true })
    await addPlanColumn('whiteLabelEnabled', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    })
    await addPlanColumn('backupsEnabled', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    })
    await addPlanColumn('auditLogEnabled', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    })
    await addPlanColumn('customDomainEnabled', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    })
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
  await addColumn('stripeCheckoutSessionId', { type: DataTypes.STRING, allowNull: true })
  await addColumn('stripeSubscriptionId', { type: DataTypes.STRING, allowNull: true })
  await addColumn('stripeCustomerId', { type: DataTypes.STRING, allowNull: true })
  await addColumn('cancelAtPeriodEnd', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  })

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

function decodeUploadDataUrl(dataUrl) {
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
  if (buffer.length > 45 * 1024 * 1024) {
    const error = new Error('Upload is too large')
    error.statusCode = 413
    throw error
  }

  return { mimeType, extension, buffer }
}

async function storeUpload(dataUrl, originalName = '', visibility = 'public') {
  const { mimeType, extension, buffer } = decodeUploadDataUrl(dataUrl)

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

async function writeBackupAssetFile(asset, dataUrl) {
  const { mimeType, extension, buffer } = decodeUploadDataUrl(dataUrl)
  const visibility = asset?.visibility === 'private' ? 'private' : 'public'
  const targetDir = visibility === 'private' ? privateUploadsDir : uploadsDir
  await fs.mkdir(targetDir, { recursive: true })

  const safeFilename = String(asset?.filename || '')
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const filename = safeFilename || `${randomUUID()}.${extension}`
  const filePath = path.join(targetDir, filename)
  await fs.writeFile(filePath, buffer)

  return {
    filename,
    originalName: asset?.originalName || filename,
    url: visibility === 'private' ? '' : `/api/uploads/${filename}`,
    mimeType,
    mediaType: getMediaType(mimeType),
    size: buffer.length,
    visibility
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

async function ensureBlogArticlesSchema() {
  if (blogArticlesSchemaReady) return
  await BlogArticle.sync()
  blogArticlesSchemaReady = true
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

function stripModelMetadata(record, fieldsToKeep = []) {
  const data = record?.toJSON ? record.toJSON() : { ...(record || {}) }
  const preserved = new Set(['id', ...fieldsToKeep])
  delete data.createdAt
  delete data.updatedAt
  Object.keys(data).forEach((key) => {
    if ((data[key] === undefined || data[key] === null) && !preserved.has(key)) {
      delete data[key]
    }
  })
  return data
}

function summarizeChangedKeys(previous = {}, next = {}, ignoredKeys = []) {
  const ignored = new Set(['createdAt', 'updatedAt', ...ignoredKeys])
  const keys = new Set([...Object.keys(previous || {}), ...Object.keys(next || {})])
  return Array.from(keys).filter((key) => {
    if (ignored.has(key)) return false
    return JSON.stringify(previous?.[key]) !== JSON.stringify(next?.[key])
  })
}

async function serializeMediaAssets(includeFiles = false) {
  await ensureMediaAssetsSchema()
  const assets = await MediaAsset.findAll({ order: [['createdAt', 'ASC'], ['id', 'ASC']] })

  return Promise.all(assets.map(async (asset) => {
    const data = stripModelMetadata(asset)
    if (!includeFiles || !data.filename) return data

    const sourceDir = data.visibility === 'private' ? privateUploadsDir : uploadsDir
    const filePath = path.join(sourceDir, data.filename)
    try {
      const buffer = await fs.readFile(filePath)
      data.fileDataUrl = `data:${data.mimeType};base64,${buffer.toString('base64')}`
    } catch (error) {
      data.fileDataUrl = null
    }
    return data
  }))
}

function backupSummaryFromData(data = {}) {
  return {
    customPages: Array.isArray(data.customPages) ? data.customPages.length : 0,
    mediaAssets: Array.isArray(data.mediaAssets) ? data.mediaAssets.length : 0,
    reusableSections: Array.isArray(data.siteSettings?.reusableSections) ? data.siteSettings.reusableSections.length : 0,
    servicePackages: Array.isArray(data.servicePackages) ? data.servicePackages.length : 0,
    portfolioItems: Array.isArray(data.portfolioItems) ? data.portfolioItems.length : 0,
    plugins: Array.isArray(data.plugins) ? data.plugins.length : 0,
    siteDemos: Array.isArray(data.siteDemos) ? data.siteDemos.length : 0,
    restaurantMenuItems: Array.isArray(data.restaurantMenuItems) ? data.restaurantMenuItems.length : 0,
    realEstateListings: Array.isArray(data.realEstateListings) ? data.realEstateListings.length : 0,
    bookingAvailabilitySlots: Array.isArray(data.bookingAvailabilitySlots) ? data.bookingAvailabilitySlots.length : 0,
    eventItems: Array.isArray(data.eventItems) ? data.eventItems.length : 0,
    protectedContentItems: Array.isArray(data.protectedContentItems) ? data.protectedContentItems.length : 0,
    blogArticles: Array.isArray(data.blogArticles) ? data.blogArticles.length : 0
  }
}

async function buildCmsBackupPayload({ includeFiles = false } = {}) {
  await Promise.all([
    ensureCustomPagesSchema(),
    ensureMediaAssetsSchema(),
    ensureBlogArticlesSchema(),
    ensureProtectedContentSchema(),
    ensureDemoPlugins(),
    ensureSiteDemos()
  ])

  const [
    settings,
    customPages,
    servicePackages,
    portfolioItems,
    plugins,
    siteDemos,
    restaurantMenuItems,
    realEstateListings,
    bookingAvailabilitySlots,
    eventItems,
    protectedContentItems,
    blogArticles,
    mediaAssets
  ] = await Promise.all([
    getOrCreateSiteSettings(),
    CustomPage.findAll({ order: [['sortOrder', 'ASC'], ['title', 'ASC']] }),
    ServicePackage.findAll({ order: [['createdAt', 'ASC'], ['id', 'ASC']] }),
    PortfolioItem.findAll({ order: [['createdAt', 'ASC'], ['id', 'ASC']] }),
    Plugin.findAll({ order: [['createdAt', 'ASC'], ['id', 'ASC']] }),
    SiteDemo.findAll({ order: [['sortOrder', 'ASC'], ['name', 'ASC']] }),
    RestaurantMenuItem.findAll({ order: [['createdAt', 'ASC'], ['id', 'ASC']] }),
    RealEstateListing.findAll({ order: [['createdAt', 'ASC'], ['id', 'ASC']] }),
    BookingAvailabilitySlot.findAll({ order: [['createdAt', 'ASC'], ['id', 'ASC']] }),
    EventItem.findAll({ order: [['createdAt', 'ASC'], ['id', 'ASC']] }),
    ProtectedContentItem.findAll({ order: [['createdAt', 'ASC'], ['id', 'ASC']] }),
    BlogArticle.findAll({ order: [['sortOrder', 'ASC'], ['publishedAt', 'DESC'], ['createdAt', 'DESC']] }),
    serializeMediaAssets(includeFiles)
  ])

  const siteSettings = stripModelMetadata(settings)
  delete siteSettings.id
  delete siteSettings.siteBackups

  const data = {
    siteSettings,
    customPages: customPages.map((item) => stripModelMetadata(item)),
    servicePackages: servicePackages.map((item) => stripModelMetadata(item)),
    portfolioItems: portfolioItems.map((item) => stripModelMetadata(item)),
    plugins: plugins.map((item) => stripModelMetadata(item)),
    siteDemos: siteDemos.map((item) => stripModelMetadata(item)),
    mediaAssets,
    restaurantMenuItems: restaurantMenuItems.map((item) => stripModelMetadata(item)),
    realEstateListings: realEstateListings.map((item) => stripModelMetadata(item)),
    bookingAvailabilitySlots: bookingAvailabilitySlots.map((item) => stripModelMetadata(item)),
    eventItems: eventItems.map((item) => stripModelMetadata(item)),
    protectedContentItems: protectedContentItems.map((item) => stripModelMetadata(item)),
    blogArticles: blogArticles.map((item) => stripModelMetadata(item))
  }

  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    includesFiles: includeFiles,
    summary: backupSummaryFromData(data),
    data
  }
}

function sanitizeBackupRecord(backup) {
  return {
    id: backup.id,
    name: backup.name,
    createdAt: backup.createdAt,
    summary: backup.summary || backupSummaryFromData(backup.payload?.data || {})
  }
}

function parseIncomingBackupPayload(rawPayload) {
  const payload = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload
  if (!payload || typeof payload !== 'object' || !payload.data || typeof payload.data !== 'object') {
    const error = new Error('Invalid backup payload')
    error.statusCode = 400
    throw error
  }
  return payload
}

async function appendSiteBackup(settings, backup) {
  const currentBackups = Array.isArray(settings.siteBackups) ? settings.siteBackups : []
  settings.siteBackups = [backup, ...currentBackups].slice(0, 10)
  await settings.save()
}

async function createSiteBackupRecord(name, options = {}) {
  const settings = await getOrCreateSiteSettings()
  const payload = await buildCmsBackupPayload(options)
  const backup = {
    id: randomUUID(),
    name: String(name || '').trim() || `Backup ${new Date().toLocaleString('en-US')}`,
    createdAt: new Date().toISOString(),
    summary: payload.summary,
    payload
  }
  await appendSiteBackup(settings, backup)
  return backup
}

async function replaceTableRecords(Model, rows = []) {
  await Model.destroy({ where: {} })
  if (!Array.isArray(rows) || rows.length === 0) return
  await Model.bulkCreate(rows, { validate: false })
}

async function upsertTableRecords(Model, rows = [], { fallbackKeys = [], preserveMissing = true } = {}) {
  if (!Array.isArray(rows) || rows.length === 0) return

  const existingRecords = await Model.findAll()
  const matchedIds = new Set()

  for (const row of rows) {
    const incoming = { ...row }
    let existing = null

    if (incoming.id !== undefined && incoming.id !== null) {
      existing = existingRecords.find((item) => Number(item.id) === Number(incoming.id)) || null
    }

    if (!existing) {
      existing = fallbackKeys
        .map((key) => existingRecords.find((item) => String(item[key] || '') === String(incoming[key] || '')))
        .find(Boolean) || null
    }

    if (existing) {
      matchedIds.add(existing.id)
      const updates = { ...incoming }
      delete updates.id
      await existing.update(updates)
    } else {
      const created = await Model.create(incoming)
      matchedIds.add(created.id)
    }
  }

  if (!preserveMissing) {
    const idsToDelete = existingRecords
      .filter((item) => !matchedIds.has(item.id))
      .map((item) => item.id)
    if (idsToDelete.length) {
      await Model.destroy({ where: { id: idsToDelete } })
    }
  }
}

async function prepareImportedMediaAssets(rows = []) {
  return Promise.all((Array.isArray(rows) ? rows : []).map(async (row) => {
    const asset = { ...row }
    const fileDataUrl = asset.fileDataUrl
    delete asset.fileDataUrl
    if (!fileDataUrl) return asset

    const stored = await writeBackupAssetFile(asset, fileDataUrl)
    return {
      ...asset,
      ...stored
    }
  }))
}

async function restoreCmsBackupPayload(payload) {
  const backup = parseIncomingBackupPayload(payload)
  const data = backup.data || {}
  const settings = await getOrCreateSiteSettings()

  const nextSettings = { ...(data.siteSettings || {}) }
  delete nextSettings.id
  delete nextSettings.siteBackups

  await settings.update(nextSettings)

  await replaceTableRecords(CustomPage, Array.isArray(data.customPages) ? data.customPages : [])
  await replaceTableRecords(ServicePackage, Array.isArray(data.servicePackages) ? data.servicePackages : [])
  await replaceTableRecords(PortfolioItem, Array.isArray(data.portfolioItems) ? data.portfolioItems : [])
  await replaceTableRecords(RestaurantMenuItem, Array.isArray(data.restaurantMenuItems) ? data.restaurantMenuItems : [])
  await replaceTableRecords(RealEstateListing, Array.isArray(data.realEstateListings) ? data.realEstateListings : [])
  await replaceTableRecords(EventItem, Array.isArray(data.eventItems) ? data.eventItems : [])
  await replaceTableRecords(BlogArticle, Array.isArray(data.blogArticles) ? data.blogArticles : [])
  await replaceTableRecords(SiteDemo, Array.isArray(data.siteDemos) ? data.siteDemos : [])

  const preparedMediaAssets = await prepareImportedMediaAssets(data.mediaAssets)
  await replaceTableRecords(MediaAsset, preparedMediaAssets)

  await upsertTableRecords(Plugin, Array.isArray(data.plugins) ? data.plugins : [], { fallbackKeys: ['slug'], preserveMissing: true })
  await upsertTableRecords(BookingAvailabilitySlot, Array.isArray(data.bookingAvailabilitySlots) ? data.bookingAvailabilitySlots : [], { preserveMissing: true })
  await upsertTableRecords(ProtectedContentItem, Array.isArray(data.protectedContentItems) ? data.protectedContentItems : [], { preserveMissing: true })

  return backupSummaryFromData(data)
}

router.use(verifyToken, ensureActiveUser, requireRole('admin'))

router.get('/audit-logs', async (req, res) => {
  try {
    await ensureAuditLogSchema()
    const where = {}
    const action = String(req.query.action || '').trim()
    const targetType = String(req.query.targetType || '').trim()
    const q = String(req.query.q || '').trim()
    const limit = Math.max(1, Math.min(200, Number(req.query.limit || 100)))

    if (action) where.action = action
    if (targetType) where.targetType = targetType
    if (q) {
      where[Op.or] = [
        { summary: { [Op.like]: `%${q}%` } },
        { actorEmail: { [Op.like]: `%${q}%` } },
        { targetId: { [Op.like]: `%${q}%` } },
        { targetType: { [Op.like]: `%${q}%` } }
      ]
    }

    const logs = await AuditLog.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit
    })

    res.json(logs)
  } catch (error) {
    res.status(500).json({ error: error.message })
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
    const previous = plugin.toJSON()

    await plugin.update({
      price: req.body.price === undefined ? plugin.price : Number(req.body.price || 0),
      isEnabled: Boolean(req.body.isEnabled),
      isPurchased: req.body.isPurchased === undefined ? plugin.isPurchased : Boolean(req.body.isPurchased)
    })
    await createAuditLog(req, {
      action: 'plugin.updated',
      targetType: 'plugin',
      targetId: plugin.slug,
      summary: `Updated plugin "${plugin.name}"`,
      details: {
        changedKeys: summarizeChangedKeys(previous, plugin.toJSON())
      }
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
    const previous = demo.toJSON()

    await demo.update({
      name: req.body.name || demo.name,
      category: req.body.category || demo.category,
      description: req.body.description || '',
      previewImage: req.body.previewImage || '',
      demoUrl: req.body.demoUrl || demo.demoUrl,
      isActive: req.body.isActive === undefined ? demo.isActive : Boolean(req.body.isActive),
      sortOrder: Number(req.body.sortOrder || 0)
    })
    await createAuditLog(req, {
      action: 'site-demo.updated',
      targetType: 'site-demo',
      targetId: demo.slug,
      summary: `Updated site demo "${demo.name}"`,
      details: {
        changedKeys: summarizeChangedKeys(previous, demo.toJSON())
      }
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

function makeArticleSlug(value = '') {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

router.get('/plugins/blog/posts', async (req, res) => {
  try {
    await ensureBlogArticlesSchema()
    await getOrCreateBlogPlugin()
    const posts = await BlogArticle.findAll({
      order: [['sortOrder', 'ASC'], ['publishedAt', 'DESC'], ['createdAt', 'DESC']]
    })
    res.json(posts)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/plugins/blog/posts', async (req, res) => {
  try {
    await ensureBlogArticlesSchema()
    await getOrCreateBlogPlugin()
    const title = cleanString(req.body.title, 180)
    if (!title) return res.status(400).json({ error: 'Title is required' })
    const slug = makeArticleSlug(req.body.slug || title)
    if (!slug) return res.status(400).json({ error: 'Slug is required' })

    const post = await BlogArticle.create({
      title,
      slug,
      excerpt: req.body.excerpt || '',
      content: req.body.content || '',
      category: cleanString(req.body.category, 120),
      author: cleanString(req.body.author, 120),
      featuredImage: req.body.featuredImage || '',
      buttonLabel: cleanString(req.body.buttonLabel, 80) || 'Read Article',
      isPublished: req.body.isPublished !== false,
      publishedAt: req.body.publishedAt || null,
      sortOrder: Number(req.body.sortOrder || 0)
    })
    res.status(201).json(post)
  } catch (error) {
    if (String(error?.message || '').includes('slug')) {
      return res.status(400).json({ error: 'That article slug is already in use' })
    }
    res.status(500).json({ error: error.message })
  }
})

router.put('/plugins/blog/posts/:id', async (req, res) => {
  try {
    await ensureBlogArticlesSchema()
    await getOrCreateBlogPlugin()
    const post = await BlogArticle.findByPk(req.params.id)
    if (!post) return res.status(404).json({ error: 'Article not found' })
    const title = cleanString(req.body.title, 180)
    if (!title) return res.status(400).json({ error: 'Title is required' })
    const slug = makeArticleSlug(req.body.slug || title)
    if (!slug) return res.status(400).json({ error: 'Slug is required' })

    await post.update({
      title,
      slug,
      excerpt: req.body.excerpt || '',
      content: req.body.content || '',
      category: cleanString(req.body.category, 120),
      author: cleanString(req.body.author, 120),
      featuredImage: req.body.featuredImage || '',
      buttonLabel: cleanString(req.body.buttonLabel, 80) || 'Read Article',
      isPublished: req.body.isPublished !== false,
      publishedAt: req.body.publishedAt || null,
      sortOrder: Number(req.body.sortOrder || 0)
    })
    res.json(post)
  } catch (error) {
    if (String(error?.message || '').includes('slug')) {
      return res.status(400).json({ error: 'That article slug is already in use' })
    }
    res.status(500).json({ error: error.message })
  }
})

router.delete('/plugins/blog/posts/:id', async (req, res) => {
  try {
    await ensureBlogArticlesSchema()
    const post = await BlogArticle.findByPk(req.params.id)
    if (!post) return res.status(404).json({ error: 'Article not found' })
    await post.destroy()
    res.json({ message: 'Article deleted' })
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
    res.json(await enrichMediaAssetsWithUsage(assets))
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
    await createAuditLog(req, {
      action: 'media.created',
      targetType: 'media',
      targetId: asset.id,
      summary: `Added media asset "${asset.altText || asset.originalName}"`,
      details: {
        mediaType: asset.mediaType,
        visibility: asset.visibility
      }
    })
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
    await createAuditLog(req, {
      action: 'media.bulk-updated',
      targetType: 'media',
      summary: `Updated ${ids.length} media asset${ids.length === 1 ? '' : 's'}`,
      details: {
        ids,
        folder: req.body.folder,
        tagAction: req.body.tagAction || null,
        tags: tagUpdates,
        visibility: req.body.visibility || null
      }
    })
    res.json(await enrichMediaAssetsWithUsage(updatedAssets))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/media/:id', async (req, res) => {
  try {
    await ensureMediaAssetsSchema()
    const asset = await MediaAsset.findByPk(req.params.id)
    if (!asset) return res.status(404).json({ error: 'Media asset not found' })
    const previous = asset.toJSON()
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
    await createAuditLog(req, {
      action: 'media.updated',
      targetType: 'media',
      targetId: asset.id,
      summary: `Updated media asset "${asset.altText || asset.originalName}"`,
      details: {
        changedKeys: summarizeChangedKeys(previous, asset.toJSON())
      }
    })
    res.json((await enrichMediaAssetsWithUsage([asset]))[0])
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
    const deletedAssets = assets.map((asset) => ({ id: asset.id, name: asset.altText || asset.originalName }))
    await Promise.all(assets.map(async asset => {
      const filePath = path.join(asset.visibility === 'private' ? privateUploadsDir : uploadsDir, asset.filename)
      await fs.unlink(filePath).catch(() => {})
      await asset.destroy()
    }))

    await createAuditLog(req, {
      action: 'media.bulk-deleted',
      targetType: 'media',
      summary: `Deleted ${deletedAssets.length} media asset${deletedAssets.length === 1 ? '' : 's'}`,
      details: {
        assets: deletedAssets
      }
    })
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
    const assetLabel = asset.altText || asset.originalName
    const filePath = path.join(asset.visibility === 'private' ? privateUploadsDir : uploadsDir, asset.filename)
    await fs.unlink(filePath).catch(() => {})
    await asset.destroy()
    await createAuditLog(req, {
      action: 'media.deleted',
      targetType: 'media',
      targetId: req.params.id,
      summary: `Deleted media asset "${assetLabel}"`,
      details: {
        filename: asset.filename
      }
    })
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
    const allowedPluginSlugs = Array.isArray(req.body.allowedPluginSlugs)
      ? req.body.allowedPluginSlugs
      : String(req.body.allowedPluginSlugs || '')
        .split('\n')
        .map((slug) => slug.trim())
        .filter(Boolean)

    const plan = await SubscriptionPlan.create({
      ...req.body,
      productType: req.body.productType === 'cms-license' ? 'cms-license' : 'service',
      updateChannel: req.body.updateChannel === 'early-access' ? 'early-access' : 'stable',
      includedUpdates: req.body.includedUpdates !== false,
      maxPages: req.body.maxPages ? Number(req.body.maxPages) : null,
      maxMediaItems: req.body.maxMediaItems ? Number(req.body.maxMediaItems) : null,
      maxStorageMb: req.body.maxStorageMb ? Number(req.body.maxStorageMb) : null,
      maxTeamMembers: req.body.maxTeamMembers ? Number(req.body.maxTeamMembers) : null,
      allowAllPlugins: req.body.allowAllPlugins !== false,
      allowedPluginSlugs,
      whiteLabelEnabled: req.body.whiteLabelEnabled === true,
      backupsEnabled: req.body.backupsEnabled === true,
      auditLogEnabled: req.body.auditLogEnabled === true,
      customDomainEnabled: req.body.customDomainEnabled === true,
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
    const allowedPluginSlugs = Array.isArray(req.body.allowedPluginSlugs)
      ? req.body.allowedPluginSlugs
      : String(req.body.allowedPluginSlugs || '')
        .split('\n')
        .map((slug) => slug.trim())
        .filter(Boolean)

    await plan.update({
      ...req.body,
      productType: req.body.productType === 'cms-license' ? 'cms-license' : 'service',
      updateChannel: req.body.updateChannel === 'early-access' ? 'early-access' : 'stable',
      includedUpdates: req.body.includedUpdates !== false,
      maxPages: req.body.maxPages ? Number(req.body.maxPages) : null,
      maxMediaItems: req.body.maxMediaItems ? Number(req.body.maxMediaItems) : null,
      maxStorageMb: req.body.maxStorageMb ? Number(req.body.maxStorageMb) : null,
      maxTeamMembers: req.body.maxTeamMembers ? Number(req.body.maxTeamMembers) : null,
      allowAllPlugins: req.body.allowAllPlugins !== false,
      allowedPluginSlugs,
      whiteLabelEnabled: req.body.whiteLabelEnabled === true,
      backupsEnabled: req.body.backupsEnabled === true,
      auditLogEnabled: req.body.auditLogEnabled === true,
      customDomainEnabled: req.body.customDomainEnabled === true,
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
    const previous = settings.toJSON()
    await settings.update(req.body)
    const changedKeys = summarizeChangedKeys(previous, settings.toJSON(), ['siteBackups'])
    await createAuditLog(req, {
      action: 'site-settings.updated',
      targetType: 'site-settings',
      targetId: settings.id,
      summary: `Updated site settings${changedKeys.length ? ` (${changedKeys.slice(0, 4).join(', ')})` : ''}`,
      details: {
        changedKeys
      }
    })
    res.json(settings)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/backups', async (req, res) => {
  try {
    const settings = await getOrCreateSiteSettings()
    const backups = Array.isArray(settings.siteBackups) ? settings.siteBackups.map(sanitizeBackupRecord) : []
    res.json(backups)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/backups', async (req, res) => {
  try {
    const backup = await createSiteBackupRecord(req.body?.name, { includeFiles: false })
    await createAuditLog(req, {
      action: 'backup.created',
      targetType: 'backup',
      targetId: backup.id,
      summary: `Created backup "${backup.name}"`,
      details: {
        summary: backup.summary
      }
    })
    res.status(201).json({ backup: sanitizeBackupRecord(backup) })
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message })
  }
})

router.get('/backups/export', async (req, res) => {
  try {
    const payload = await buildCmsBackupPayload({ includeFiles: true })
    res.json(payload)
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message })
  }
})

router.get('/backups/:id/export', async (req, res) => {
  try {
    const settings = await getOrCreateSiteSettings()
    const backup = (Array.isArray(settings.siteBackups) ? settings.siteBackups : []).find((item) => String(item.id) === String(req.params.id))
    if (!backup) return res.status(404).json({ error: 'Backup not found' })
    res.json(backup.payload)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/backups/import', async (req, res) => {
  try {
    const incoming = parseIncomingBackupPayload(req.body?.payload ?? req.body)
    const preImportBackup = await createSiteBackupRecord(`Auto backup before import ${new Date().toLocaleString('en-US')}`, { includeFiles: false })
    const summary = await restoreCmsBackupPayload(incoming)
    await createAuditLog(req, {
      action: 'backup.imported',
      targetType: 'backup',
      targetId: incoming?.metadata?.id || null,
      summary: `Imported backup "${incoming?.metadata?.name || 'Imported backup'}"`,
      details: {
        importedSummary: summary,
        restorePointId: preImportBackup.id
      }
    })
    res.json({
      message: 'Backup imported successfully',
      summary,
      restorePoint: sanitizeBackupRecord(preImportBackup)
    })
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message })
  }
})

router.post('/backups/:id/restore', async (req, res) => {
  try {
    const settings = await getOrCreateSiteSettings()
    const backup = (Array.isArray(settings.siteBackups) ? settings.siteBackups : []).find((item) => String(item.id) === String(req.params.id))
    if (!backup) return res.status(404).json({ error: 'Backup not found' })

    const preRestoreBackup = await createSiteBackupRecord(`Auto backup before restore ${new Date().toLocaleString('en-US')}`, { includeFiles: false })
    const summary = await restoreCmsBackupPayload(backup.payload)
    await createAuditLog(req, {
      action: 'backup.restored',
      targetType: 'backup',
      targetId: backup.id,
      summary: `Restored backup "${backup.name}"`,
      details: {
        restoredSummary: summary,
        restorePointId: preRestoreBackup.id
      }
    })
    res.json({
      message: 'Backup restored successfully',
      summary,
      restorePoint: sanitizeBackupRecord(preRestoreBackup)
    })
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message })
  }
})

router.delete('/backups/:id', async (req, res) => {
  try {
    const settings = await getOrCreateSiteSettings()
    const backups = Array.isArray(settings.siteBackups) ? settings.siteBackups : []
    const backup = backups.find((item) => String(item.id) === String(req.params.id))
    settings.siteBackups = backups.filter((item) => String(item.id) !== String(req.params.id))
    await settings.save()
    if (backup) {
      await createAuditLog(req, {
        action: 'backup.deleted',
        targetType: 'backup',
        targetId: backup.id,
        summary: `Deleted backup "${backup.name}"`,
        details: {
          summary: backup.summary || null
        }
      })
    }
    res.json({ message: 'Backup deleted' })
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
    await createAuditLog(req, {
      action: 'page.created',
      targetType: 'page',
      targetId: page.id,
      summary: `Created page "${page.title}"`,
      details: {
        slug: page.slug,
        isPublished: page.isPublished
      }
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
    const previous = page.toJSON()

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
    await createAuditLog(req, {
      action: 'page.updated',
      targetType: 'page',
      targetId: page.id,
      summary: `Updated page "${page.title}"`,
      details: {
        changedKeys: summarizeChangedKeys(previous, page.toJSON())
      }
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
    await createAuditLog(req, {
      action: 'page.deleted',
      targetType: 'page',
      targetId: req.params.id,
      summary: `Deleted page "${page.title}"`,
      details: {
        slug: page.slug
      }
    })
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
    const settings = await getOrCreateSiteSettings().catch(() => null)
    const siteName = settings?.siteName || 'Creative by Caleb'
    const label = encodeURIComponent(`${siteName}:${user.email}`)
    const issuer = encodeURIComponent(siteName)
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
    const previous = message.toJSON()
    await message.update(req.body)
    await createAuditLog(req, {
      action: 'contact-message.updated',
      targetType: 'contact-message',
      targetId: message.id,
      summary: `Updated contact message from "${message.name}"`,
      details: {
        changedKeys: summarizeChangedKeys(previous, message.toJSON())
      }
    })
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

      await createAuditLog(req, {
        action: 'license.assigned',
        targetType: 'license',
        targetId: license.id,
        summary: `Assigned CMS license "${plan.name}" to ${client.email}`,
        details: {
          clientId: client.id,
          planId: plan.id,
          licensedDomain: license.licensedDomain
        }
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

    await createAuditLog(req, {
      action: 'subscription.assigned',
      targetType: 'subscription',
      targetId: subscription.id,
      summary: `Assigned service subscription "${plan.name}" to ${client.email}`,
      details: {
        clientId: client.id,
        planId: plan.id
      }
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
    await createAuditLog(req, {
      action: 'license.cancelled',
      targetType: 'license',
      targetId: license.id,
      summary: `Cancelled CMS license "${license.planName}"`,
      details: {
        clientId: license.clientId
      }
    })
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
    const user = await User.create({
      ...req.body,
      name: cleanString(req.body.name, 120),
      email: cleanString(req.body.email, 160).toLowerCase(),
      company: cleanString(req.body.company, 120),
      phone: cleanString(req.body.phone, 40)
    })
    const safeUser = sanitizeUserForResponse(user)
    await createAuditLog(req, {
      action: 'user.created',
      targetType: 'user',
      targetId: user.id,
      summary: `Created ${user.role} user "${user.email}"`,
      details: {
        role: user.role
      }
    })
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
    const previous = user.toJSON()
    await user.update({
      ...req.body,
      name: req.body.name !== undefined ? cleanString(req.body.name, 120) : user.name,
      email: req.body.email !== undefined ? cleanString(req.body.email, 160).toLowerCase() : user.email,
      company: req.body.company !== undefined ? cleanString(req.body.company, 120) : user.company,
      phone: req.body.phone !== undefined ? cleanString(req.body.phone, 40) : user.phone
    })
    const safeUser = sanitizeUserForResponse(user)
    await createAuditLog(req, {
      action: 'user.updated',
      targetType: 'user',
      targetId: user.id,
      summary: `Updated user "${user.email}"`,
      details: {
        changedKeys: summarizeChangedKeys(previous, user.toJSON(), ['password', 'twoFactorSecret', 'twoFactorCode', 'twoFactorExpires'])
      }
    })
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
    await createAuditLog(req, {
      action: 'user.deleted',
      targetType: 'user',
      targetId: req.params.id,
      summary: `Deleted user "${user.email}"`,
      details: {
        role: user.role
      }
    })
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
