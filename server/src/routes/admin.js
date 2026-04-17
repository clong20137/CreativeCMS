import express from 'express'
import sequelize from '../database.js'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'
import User from '../models/User.js'
import Project from '../models/Project.js'
import Invoice from '../models/Invoice.js'
import Subscription from '../models/Subscription.js'
import SubscriptionPlan from '../models/SubscriptionPlan.js'
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
import { getOrCreateSiteSettings } from './site-settings.js'
import { ensureDemoPlugins, getOrCreateBookingPlugin, getOrCreateEventsPlugin, getOrCreateProtectedContentPlugin, getOrCreateRestaurantPlugin, getOrCreateRealEstatePlugin } from './plugins.js'
import { ensureSiteDemos } from './site-demos.js'
import crypto from 'crypto'
import { base32Encode, verifyTotp } from './auth.js'
import jwt from 'jsonwebtoken'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = path.resolve(__dirname, '../../uploads')
let mediaAssetsSchemaReady = false
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

async function storeUpload(dataUrl, originalName = '') {
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

  await fs.mkdir(uploadsDir, { recursive: true })
  const filename = `${randomUUID()}.${extension}`
  const filePath = path.join(uploadsDir, filename)
  await fs.writeFile(filePath, buffer)
  await fs.access(filePath)

  return {
    filename,
    originalName,
    url: `/api/uploads/${filename}`,
    mimeType,
    mediaType: getMediaType(mimeType),
    size: buffer.length
  }
}

async function ensureMediaAssetsSchema() {
  if (mediaAssetsSchemaReady) return

  const queryInterface = MediaAsset.sequelize.getQueryInterface()
  const table = await queryInterface.describeTable('MediaAssets').catch(() => null)
  if (!table) {
    await MediaAsset.sync()
  }

  mediaAssetsSchemaReady = true
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
      attributes: { exclude: ['password'] },
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
    const subscriptions = await Subscription.findAll({
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
    const item = await ProtectedContentItem.create({
      title: req.body.title,
      description: req.body.description || '',
      contentType: req.body.contentType || 'video',
      previewImage: req.body.previewImage || '',
      contentUrl: req.body.contentUrl || '',
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
    const item = await ProtectedContentItem.findByPk(req.params.id)
    if (!item) return res.status(404).json({ error: 'Protected content not found' })

    await item.update({
      title: req.body.title,
      description: req.body.description || '',
      contentType: req.body.contentType || 'video',
      previewImage: req.body.previewImage || '',
      contentUrl: req.body.contentUrl || '',
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

router.post('/uploads', async (req, res) => {
  try {
    await ensureMediaAssetsSchema()
    const stored = await storeUpload(req.body.dataUrl, req.body.originalName || '')
    await MediaAsset.create({
      ...stored,
      title: req.body.title || req.body.originalName || stored.filename,
      altText: req.body.altText || ''
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
    const assets = await MediaAsset.findAll({ where, order: [['createdAt', 'DESC']] })
    res.json(assets)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/media', async (req, res) => {
  try {
    await ensureMediaAssetsSchema()
    const stored = await storeUpload(req.body.dataUrl, req.body.originalName || '')
    const asset = await MediaAsset.create({
      ...stored,
      title: req.body.title || req.body.originalName || stored.filename,
      altText: req.body.altText || ''
    })
    res.status(201).json(asset)
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message })
  }
})

router.put('/media/:id', async (req, res) => {
  try {
    await ensureMediaAssetsSchema()
    const asset = await MediaAsset.findByPk(req.params.id)
    if (!asset) return res.status(404).json({ error: 'Media asset not found' })
    await asset.update({
      title: req.body.title ?? asset.title,
      altText: req.body.altText ?? asset.altText
    })
    res.json(asset)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/media/:id', async (req, res) => {
  try {
    await ensureMediaAssetsSchema()
    const asset = await MediaAsset.findByPk(req.params.id)
    if (!asset) return res.status(404).json({ error: 'Media asset not found' })
    const filePath = path.join(uploadsDir, asset.filename)
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
    const plans = await SubscriptionPlan.findAll({ order: [['createdAt', 'DESC']] })
    res.json(plans)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create subscription plan
router.post('/subscription-plans', async (req, res) => {
  try {
    const features = Array.isArray(req.body.features)
      ? req.body.features
      : String(req.body.features || '')
        .split('\n')
        .map(feature => feature.trim())
        .filter(Boolean)

    const plan = await SubscriptionPlan.create({ ...req.body, features })
    res.status(201).json(plan)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update subscription plan
router.put('/subscription-plans/:id', async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByPk(req.params.id)
    if (!plan) return res.status(404).json({ error: 'Subscription plan not found' })

    const features = Array.isArray(req.body.features)
      ? req.body.features
      : String(req.body.features || '')
        .split('\n')
        .map(feature => feature.trim())
        .filter(Boolean)

    await plan.update({ ...req.body, features })
    res.json(plan)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete subscription plan
router.delete('/subscription-plans/:id', async (req, res) => {
  try {
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
    const pages = await CustomPage.findAll({ order: [['sortOrder', 'ASC'], ['title', 'ASC']] })
    res.json(pages)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/pages', async (req, res) => {
  try {
    const page = await CustomPage.create({
      title: req.body.title,
      slug: String(req.body.slug || req.body.title || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
      headerTitle: req.body.headerTitle || req.body.title,
      headerSubtitle: req.body.headerSubtitle || '',
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
    const { clientId, planId, renewalDate } = req.body
    const client = await User.findByPk(clientId)
    if (!client || client.role !== 'client') return res.status(404).json({ error: 'Client not found' })

    const plan = await SubscriptionPlan.findByPk(planId)
    if (!plan) return res.status(404).json({ error: 'Subscription plan not found' })

    const nextRenewalDate = renewalDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const subscription = await Subscription.create({
      clientId,
      planId,
      planName: plan.name,
      tier: plan.tier,
      status: 'active',
      price: plan.price,
      billingCycle: plan.billingCycle,
      renewalDate: nextRenewalDate,
      features: plan.features
    })

    res.status(201).json(subscription)
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
