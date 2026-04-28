import express from 'express'
import Stripe from 'stripe'
import jwt from 'jsonwebtoken'
import { DataTypes } from 'sequelize'
import Plugin from '../models/Plugin.js'
import RestaurantMenuItem from '../models/RestaurantMenuItem.js'
import RealEstateListing from '../models/RealEstateListing.js'
import ClientPluginPurchase from '../models/ClientPluginPurchase.js'
import BookingAvailabilitySlot from '../models/BookingAvailabilitySlot.js'
import BookingAppointment from '../models/BookingAppointment.js'
import EventItem from '../models/EventItem.js'
import ProtectedContentItem from '../models/ProtectedContentItem.js'
import ProtectedContentPurchase from '../models/ProtectedContentPurchase.js'
import CRMLead from '../models/CRMLead.js'
import BlogArticle from '../models/BlogArticle.js'
import { getOrCreateSiteSettings } from './site-settings.js'
import User from '../models/User.js'
import { createRateLimiter } from '../utils/rate-limit.js'
import { cleanMultiline, cleanString, isValidEmail } from '../utils/validation.js'
import { getClientEntitlements, isPluginAllowed } from '../utils/entitlements.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
let protectedContentSchemaReady = false
const bookingRateLimit = createRateLimiter({
  name: 'booking-appointments',
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many booking requests. Please wait a bit and try again.'
})
const crmLeadRateLimit = createRateLimiter({
  name: 'crm-leads',
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many quote requests. Please wait a bit and try again.'
})

async function ensureProtectedContentSchema() {
  if (protectedContentSchemaReady) return

  const queryInterface = ProtectedContentItem.sequelize.getQueryInterface()
  const table = await queryInterface.describeTable('ProtectedContentItems').catch(() => null)
  if (table && !table.mediaAssetId) {
    await queryInterface.addColumn('ProtectedContentItems', 'mediaAssetId', {
      type: DataTypes.INTEGER,
      allowNull: true
    }).catch(error => {
      if (!String(error?.message || '').includes('Duplicate column')) throw error
    })
  }

  protectedContentSchemaReady = true
}

async function ensureActiveClient(req, res, next) {
  try {
    const user = await User.findByPk(req.userId, { attributes: ['id', 'isActive'] })
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (user.isActive === false) return res.status(403).json({ error: 'This account has been disabled. Please contact support.' })
    next()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

function verifyClient(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No token provided' })
    const decoded = jwt.verify(token, JWT_SECRET)
    if (decoded.role !== 'client') return res.status(403).json({ error: 'Client access required' })
    req.userId = decoded.userId
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

function optionalClient(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return next()
    const decoded = jwt.verify(token, JWT_SECRET)
    if (decoded.role === 'client') req.userId = decoded.userId
    next()
  } catch (error) {
    next()
  }
}

async function getStripeClient() {
  const settings = await getOrCreateSiteSettings()
  const secretKey = settings.stripeSecretKey || process.env.STRIPE_SECRET_KEY
  if (!secretKey || secretKey.includes('your_key_here')) return null
  return new Stripe(secretKey)
}

export async function getOrCreateRestaurantPlugin() {
  const [plugin] = await Plugin.findOrCreate({
    where: { slug: 'restaurant-menu' },
    defaults: {
      slug: 'restaurant-menu',
      name: 'Restaurant Menu',
      description: 'Create menu categories, item photos, descriptions, and prices for a restaurant website.',
      category: 'Restaurant',
      price: 299,
      isEnabled: true,
      isPurchased: true,
      demoUrl: '/plugins/restaurant'
    }
  })

  const itemCount = await RestaurantMenuItem.count()
  if (itemCount === 0) {
    await RestaurantMenuItem.bulkCreate([
      {
        name: 'Harvest Bowl',
        description: 'Roasted vegetables, greens, grains, citrus vinaigrette, and toasted seeds.',
        category: 'Entrees',
        price: 14.5,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80',
        sortOrder: 1
      },
      {
        name: 'Wood Fired Pizza',
        description: 'Tomato, mozzarella, basil, olive oil, and a crisp blistered crust.',
        category: 'Entrees',
        price: 17,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80',
        sortOrder: 2
      },
      {
        name: 'Chocolate Tart',
        description: 'Dark chocolate ganache, sea salt, berry compote, and whipped cream.',
        category: 'Desserts',
        price: 9,
        image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=900&q=80',
        sortOrder: 3
      }
    ])
  }

  return plugin
}

export async function getOrCreateRealEstatePlugin() {
  const [plugin] = await Plugin.findOrCreate({
    where: { slug: 'real-estate-listings' },
    defaults: {
      slug: 'real-estate-listings',
      name: 'Real Estate Listings',
      description: 'Add property listings with photos, prices, descriptions, and more information buttons.',
      category: 'Real Estate',
      price: 399,
      isEnabled: true,
      isPurchased: true,
      demoUrl: '/plugins/real-estate'
    }
  })

  const listingCount = await RealEstateListing.count()
  if (listingCount === 0) {
    await RealEstateListing.bulkCreate([
      {
        title: 'Modern Meridian-Kessler Home',
        address: 'Indianapolis, IN',
        description: 'Bright living spaces, updated finishes, a private backyard, and room to entertain.',
        price: 489000,
        image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1000&q=80',
        sortOrder: 1
      },
      {
        title: 'Downtown Condo With Skyline Views',
        address: 'Indianapolis, IN',
        description: 'Walkable downtown condo with secure parking, open kitchen, and city views.',
        price: 335000,
        image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1000&q=80',
        sortOrder: 2
      },
      {
        title: 'Quiet Carmel Retreat',
        address: 'Carmel, IN',
        description: 'Spacious layout, mature trees, finished basement, and a flexible home office.',
        price: 625000,
        image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1000&q=80',
        sortOrder: 3
      }
    ])
  }

  return plugin
}

export async function getOrCreateBookingPlugin() {
  const [plugin] = await Plugin.findOrCreate({
    where: { slug: 'booking-appointments' },
    defaults: {
      slug: 'booking-appointments',
      name: 'Booking Appointments',
      description: 'Let visitors book appointments from available time slots for in-person, Zoom, Google Meet, or phone calls.',
      category: 'Scheduling',
      price: 349,
      isEnabled: true,
      isPurchased: true,
      demoUrl: '/plugins/booking'
    }
  })

  const slotCount = await BookingAvailabilitySlot.count()
  if (slotCount === 0) {
    const today = new Date()
    const firstDate = new Date(today)
    firstDate.setDate(today.getDate() + 3)
    const secondDate = new Date(today)
    secondDate.setDate(today.getDate() + 5)

    await BookingAvailabilitySlot.bulkCreate([
      {
        date: firstDate.toISOString().slice(0, 10),
        startTime: '10:00',
        endTime: '10:30',
        locationTypes: ['phone', 'zoom', 'google-meet']
      },
      {
        date: firstDate.toISOString().slice(0, 10),
        startTime: '14:00',
        endTime: '14:30',
        locationTypes: ['phone', 'zoom', 'google-meet', 'in-person']
      },
      {
        date: secondDate.toISOString().slice(0, 10),
        startTime: '11:00',
        endTime: '11:45',
        locationTypes: ['phone', 'zoom']
      }
    ])
  }

  return plugin
}

export async function getOrCreateEventsPlugin() {
  const [plugin] = await Plugin.findOrCreate({
    where: { slug: 'events' },
    defaults: {
      slug: 'events',
      name: 'Events',
      description: 'Add upcoming events with titles, descriptions, dates, images, and action buttons.',
      category: 'Events',
      price: 299,
      isEnabled: true,
      isPurchased: true,
      demoUrl: '/plugins/events'
    }
  })

  const eventCount = await EventItem.count()
  if (eventCount === 0) {
    const firstDate = new Date()
    firstDate.setDate(firstDate.getDate() + 14)
    const secondDate = new Date()
    secondDate.setDate(secondDate.getDate() + 35)

    await EventItem.bulkCreate([
      {
        title: 'Community Launch Night',
        description: 'A casual evening for guests to meet the team, preview new work, and connect with local businesses.',
        buttonLabel: 'Reserve a Spot',
        buttonUrl: '/contact',
        image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=80',
        eventDate: firstDate.toISOString().slice(0, 10),
        sortOrder: 1
      },
      {
        title: 'Creative Workshop',
        description: 'A hands-on session covering practical ways to improve your website content, visuals, and calls to action.',
        buttonLabel: 'Learn More',
        buttonUrl: '/contact',
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80',
        eventDate: secondDate.toISOString().slice(0, 10),
        sortOrder: 2
      }
    ])
  }

  return plugin
}

export async function getOrCreateProtectedContentPlugin() {
  await ensureProtectedContentSchema()
  const [plugin] = await Plugin.findOrCreate({
    where: { slug: 'protected-content' },
    defaults: {
      slug: 'protected-content',
      name: 'Protected Content Library',
      description: 'Sell private images, videos, and documents that unlock only for logged-in clients who purchased access.',
      category: 'Content',
      price: 499,
      isEnabled: true,
      isPurchased: true,
      demoUrl: '/plugins/protected-content'
    }
  })

  const itemCount = await ProtectedContentItem.count()
  if (itemCount === 0) {
    await ProtectedContentItem.bulkCreate([
      {
        title: 'Towing Safety Basics',
        description: 'A private training module for drivers covering jobsite awareness, vehicle positioning, and basic towing safety.',
        contentType: 'video',
        previewImage: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80',
        contentUrl: 'https://example.com/private/towing-safety-basics',
        price: 79,
        buttonLabel: 'Unlock Training',
        sortOrder: 1
      },
      {
        title: 'Inspection Checklist PDF',
        description: 'A downloadable checklist for pre-trip inspections, equipment readiness, and incident documentation.',
        contentType: 'document',
        previewImage: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1000&q=80',
        contentUrl: 'https://example.com/private/inspection-checklist.pdf',
        price: 29,
        buttonLabel: 'Buy Checklist',
        sortOrder: 2
      }
    ])
  }

  return plugin
}

export async function getOrCreateCrmPlugin() {
  const [plugin] = await Plugin.findOrCreate({
    where: { slug: 'crm-quote-system' },
    defaults: {
      slug: 'crm-quote-system',
      name: 'CRM Quote System',
      description: 'Capture quote requests and customer leads from custom forms, then manage their status in the admin CRM.',
      category: 'CRM',
      price: 599,
      isEnabled: true,
      isPurchased: true,
      demoUrl: '/plugins/crm'
    }
  })

  return plugin
}

function makeArticleSlug(value = '') {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function getOrCreateBlogPlugin() {
  const [plugin] = await Plugin.findOrCreate({
    where: { slug: 'blog-articles' },
    defaults: {
      slug: 'blog-articles',
      name: 'Blog & Articles',
      description: 'Publish articles with categories, feature images, excerpts, and detail pages for SEO-friendly content marketing.',
      category: 'Content',
      price: 349,
      isEnabled: true,
      isPurchased: true,
      demoUrl: '/plugins/blog'
    }
  })

  const articleCount = await BlogArticle.count()
  if (articleCount === 0) {
    await BlogArticle.bulkCreate([
      {
        title: 'How to Plan a Homepage That Actually Converts',
        slug: 'how-to-plan-a-homepage-that-actually-converts',
        excerpt: 'A simple framework for structuring the first screen, proof sections, and calls to action so visitors know what to do next.',
        content: `A homepage should answer three questions quickly: what you do, who you help, and what someone should do next.\n\nStart with a clear opening statement, add one strong supporting line, and make the first call to action obvious. After that, use proof sections like services, featured work, reviews, or case studies to reduce uncertainty.\n\nThe goal is not to say everything at once. The goal is to make the next step feel easy.`,
        category: 'Marketing',
        author: 'Creative CMS',
        featuredImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
        publishedAt: new Date().toISOString().slice(0, 10),
        sortOrder: 1
      },
      {
        title: 'Five Website Updates Small Businesses Should Make This Quarter',
        slug: 'five-website-updates-small-businesses-should-make-this-quarter',
        excerpt: 'A practical short list of updates that improve clarity, trust, and lead flow without rebuilding the whole site.',
        content: `If your site feels stale, you probably do not need a complete redesign to improve it.\n\nStart with your homepage message, make sure your services are current, refresh old project images, tighten your contact flow, and review your mobile layout. Those small changes can create a much better first impression.\n\nA good website is less about endless features and more about keeping the important details current.`,
        category: 'Small Business',
        author: 'Creative CMS',
        featuredImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10),
        sortOrder: 2
      },
      {
        title: 'Choosing Between Landing Pages and Full Service Pages',
        slug: 'choosing-between-landing-pages-and-full-service-pages',
        excerpt: 'When to use a focused campaign page, when to build a deep evergreen page, and how both can work together.',
        content: `Landing pages are best when you have one clear traffic source and one clear action. Full service pages are better when you want long-term search visibility and space to explain your process.\n\nIn most cases, both are useful. Use service pages for evergreen organic traffic and use landing pages for campaigns, seasonal offers, or niche messaging.\n\nThe important part is keeping the message aligned with the visitor intent.`,
        category: 'SEO',
        author: 'Creative CMS',
        featuredImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString().slice(0, 10),
        sortOrder: 3
      }
    ])
  }

  return plugin
}

export async function ensureDemoPlugins() {
  await Promise.all([
    getOrCreateRestaurantPlugin(),
    getOrCreateRealEstatePlugin(),
    getOrCreateBookingPlugin(),
    getOrCreateEventsPlugin(),
    getOrCreateProtectedContentPlugin(),
    getOrCreateCrmPlugin(),
    getOrCreateBlogPlugin()
  ])
}

router.get('/client', verifyClient, ensureActiveClient, async (req, res) => {
  try {
    await ensureDemoPlugins()
    const [plugins, purchases, entitlements] = await Promise.all([
      Plugin.findAll({ where: { isEnabled: true }, order: [['name', 'ASC']] }),
      ClientPluginPurchase.findAll({ where: { clientId: req.userId } }),
      getClientEntitlements(req.userId)
    ])

    const purchasesBySlug = new Map(purchases.map(purchase => [purchase.pluginSlug, purchase]))
    res.json(plugins.map(plugin => ({
      ...plugin.toJSON(),
      clientPurchase: purchasesBySlug.get(plugin.slug) || null,
      planAccess: isPluginAllowed(entitlements, plugin.slug)
    })))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/', async (req, res) => {
  try {
    await ensureDemoPlugins()
    const plugins = await Plugin.findAll({
      where: { isEnabled: true },
      order: [['name', 'ASC']]
    })
    res.json(plugins)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/:slug/checkout-session', verifyClient, ensureActiveClient, async (req, res) => {
  try {
    await ensureDemoPlugins()
    const plugin = await Plugin.findOne({ where: { slug: req.params.slug } })
    if (!plugin) return res.status(404).json({ error: 'Plugin not found' })
    const entitlements = await getClientEntitlements(req.userId)
    const pluginAccess = isPluginAllowed(entitlements, plugin.slug)
    if (!pluginAccess.allowed) return res.status(403).json({ error: pluginAccess.reason })

    const existingPurchase = await ClientPluginPurchase.findOne({
      where: { clientId: req.userId, pluginSlug: plugin.slug, status: 'active' }
    })
    if (existingPurchase) return res.status(400).json({ error: 'Plugin is already purchased' })

    const stripe = await getStripeClient()
    if (!stripe) return res.status(400).json({ error: 'Stripe is not configured' })

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${plugin.name} Plugin`
            },
            unit_amount: Math.round(Number(plugin.price || 0) * 100)
          }
        }
      ],
      metadata: {
        pluginSlug: plugin.slug,
        clientId: String(req.userId)
      },
      success_url: `${frontendUrl}/client-dashboard/plugins?plugin_payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/client-dashboard/plugins?plugin_payment=cancelled`
    })

    const pendingPurchase = await ClientPluginPurchase.findOne({
      where: { clientId: req.userId, pluginSlug: plugin.slug }
    })
    const purchaseData = {
      clientId: req.userId,
      pluginId: plugin.id,
      pluginSlug: plugin.slug,
      pluginName: plugin.name,
      price: plugin.price,
      status: 'pending',
      stripeCheckoutSessionId: session.id
    }

    if (pendingPurchase) {
      await pendingPurchase.update(purchaseData)
    } else {
      await ClientPluginPurchase.create(purchaseData)
    }

    res.json({ url: session.url })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/protected-content/items/:id/checkout-session', verifyClient, ensureActiveClient, async (req, res) => {
  try {
    await ensureProtectedContentSchema()
    const plugin = await getOrCreateProtectedContentPlugin()
    const item = await ProtectedContentItem.findOne({
      where: { id: req.params.id, isActive: true }
    })
    if (!item) return res.status(404).json({ error: 'Protected content not found' })

    const existingPurchase = await ProtectedContentPurchase.findOne({
      where: { clientId: req.userId, contentItemId: item.id, status: 'active' }
    })
    if (existingPurchase) return res.status(400).json({ error: 'You already have access to this content' })

    const stripe = await getStripeClient()
    if (!stripe) return res.status(400).json({ error: 'Stripe is not configured' })

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.title
            },
            unit_amount: Math.round(Number(item.price || 0) * 100)
          }
        }
      ],
      metadata: {
        protectedContentItemId: String(item.id),
        clientId: String(req.userId)
      },
      success_url: `${frontendUrl}/plugins/protected-content?content_payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/plugins/protected-content?content_payment=cancelled`
    })

    const pendingPurchase = await ProtectedContentPurchase.findOne({
      where: { clientId: req.userId, contentItemId: item.id }
    })
    const purchaseData = {
      clientId: req.userId,
      contentItemId: item.id,
      itemTitle: item.title,
      price: item.price,
      status: 'pending',
      stripeCheckoutSessionId: session.id
    }

    if (pendingPurchase) {
      await pendingPurchase.update(purchaseData)
    } else {
      await ProtectedContentPurchase.create(purchaseData)
    }

    res.json({ url: session.url })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/booking/slots', async (req, res) => {
  try {
    const plugin = await getOrCreateBookingPlugin()
    const appointments = await BookingAppointment.findAll({ where: { status: 'scheduled' } })
    const bookedSlotIds = appointments.map(appointment => appointment.availabilitySlotId)
    const slots = await BookingAvailabilitySlot.findAll({
      where: { isActive: true },
      order: [['date', 'ASC'], ['startTime', 'ASC']]
    })

    res.json({
      plugin,
      slots: slots.filter(slot => !bookedSlotIds.includes(slot.id))
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/booking/appointments', bookingRateLimit, async (req, res) => {
  try {
    const slot = await BookingAvailabilitySlot.findByPk(req.body.availabilitySlotId)
    if (!slot || !slot.isActive) return res.status(404).json({ error: 'Availability slot not found' })
    const name = cleanString(req.body.name, 120)
    const email = cleanString(req.body.email, 160).toLowerCase()
    const phone = cleanString(req.body.phone, 40)
    const meetingType = cleanString(req.body.meetingType, 40)
    const notes = cleanMultiline(req.body.notes, 2000)
    if (!name || !email || !meetingType) return res.status(400).json({ error: 'Name, email, and meeting type are required' })
    if (!isValidEmail(email)) return res.status(400).json({ error: 'A valid email address is required' })
    if (!['in-person', 'zoom', 'google-meet', 'phone'].includes(meetingType)) return res.status(400).json({ error: 'Invalid meeting type' })

    const existingAppointment = await BookingAppointment.findOne({
      where: { availabilitySlotId: slot.id, status: 'scheduled' }
    })
    if (existingAppointment) return res.status(400).json({ error: 'This appointment time has already been booked' })

    const appointment = await BookingAppointment.create({
      availabilitySlotId: slot.id,
      name,
      email,
      phone,
      meetingType,
      notes
    })

    res.status(201).json(appointment)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/restaurant/menu', async (req, res) => {
  try {
    const plugin = await getOrCreateRestaurantPlugin()
    const items = await RestaurantMenuItem.findAll({
      where: { isAvailable: true },
      order: [['category', 'ASC'], ['sortOrder', 'ASC'], ['name', 'ASC']]
    })

    res.json({ plugin, items })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/events', async (req, res) => {
  try {
    const plugin = await getOrCreateEventsPlugin()
    const events = await EventItem.findAll({
      where: { isActive: true },
      order: [['eventDate', 'ASC'], ['sortOrder', 'ASC'], ['title', 'ASC']]
    })

    res.json({ plugin, events })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/protected-content/items', optionalClient, async (req, res) => {
  try {
    await ensureProtectedContentSchema()
    const plugin = await getOrCreateProtectedContentPlugin()
    const items = await ProtectedContentItem.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']]
    })
    const purchases = req.userId
      ? await ProtectedContentPurchase.findAll({
        where: { clientId: req.userId, status: 'active' }
      })
      : []
    const purchasedIds = new Set(purchases.map(purchase => purchase.contentItemId))

    res.json({
      plugin,
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        contentType: item.contentType,
        previewImage: item.previewImage,
        mediaAssetId: item.mediaAssetId,
        price: item.price,
        buttonLabel: item.buttonLabel,
        isUnlocked: purchasedIds.has(item.id)
      }))
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/protected-content/items/:id', verifyClient, ensureActiveClient, async (req, res) => {
  try {
    await ensureProtectedContentSchema()
    await getOrCreateProtectedContentPlugin()
    const item = await ProtectedContentItem.findOne({
      where: { id: req.params.id, isActive: true }
    })
    if (!item) return res.status(404).json({ error: 'Protected content not found' })

    const purchase = await ProtectedContentPurchase.findOne({
      where: { clientId: req.userId, contentItemId: item.id, status: 'active' }
    })
    if (!purchase) return res.status(403).json({ error: 'Purchase required to view this content' })

    const data = item.toJSON()
    if (item.mediaAssetId) {
      data.contentUrl = `/api/protected-media/${item.mediaAssetId}`
    }
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/crm', async (req, res) => {
  try {
    const plugin = await getOrCreateCrmPlugin()
    if (!plugin.isEnabled) return res.status(404).json({ error: 'CRM plugin is not active' })
    res.json({ plugin })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/blog/posts', async (req, res) => {
  try {
    const plugin = await getOrCreateBlogPlugin()
    const posts = await BlogArticle.findAll({
      where: { isPublished: true },
      order: [['sortOrder', 'ASC'], ['publishedAt', 'DESC'], ['createdAt', 'DESC']]
    })
    res.json({ plugin, posts })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/blog/posts/:slug', async (req, res) => {
  try {
    const plugin = await getOrCreateBlogPlugin()
    const slug = makeArticleSlug(req.params.slug)
    const post = await BlogArticle.findOne({
      where: { slug, isPublished: true }
    })
    if (!post) return res.status(404).json({ error: 'Article not found' })
    res.json({ plugin, post })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/crm/leads', crmLeadRateLimit, async (req, res) => {
  try {
    const plugin = await getOrCreateCrmPlugin()
    if (!plugin.isEnabled) return res.status(404).json({ error: 'CRM plugin is not active' })
    const inquiryType = cleanString(req.body.inquiryType || 'quote', 40) || 'quote'
    const name = cleanString(req.body.name, 120)
    const email = cleanString(req.body.email, 160).toLowerCase()
    const phone = cleanString(req.body.phone, 40)
    const company = cleanString(req.body.company, 120)
    const serviceTitle = cleanString(req.body.serviceTitle, 160)
    const description = cleanMultiline(req.body.description, 4000)
    const budget = cleanString(req.body.budget, 80)
    const timeline = cleanString(req.body.timeline, 80)
    const preferredContact = cleanString(req.body.preferredContact, 40)
    const sourcePage = cleanString(req.body.sourcePage, 255)
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' })
    if (!isValidEmail(email)) return res.status(400).json({ error: 'A valid email address is required' })

    const lead = await CRMLead.create({
      inquiryType,
      name,
      email,
      phone,
      company,
      serviceTitle,
      description,
      budget,
      timeline,
      preferredContact,
      sourcePage,
      metadata: req.body.metadata && typeof req.body.metadata === 'object' && !Array.isArray(req.body.metadata) ? req.body.metadata : null
    })

    res.status(201).json({ message: 'Quote request received', leadId: lead.id })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/real-estate/listings', async (req, res) => {
  try {
    const plugin = await getOrCreateRealEstatePlugin()
    const listings = await RealEstateListing.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']]
    })

    res.json({ plugin, listings })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/real-estate/listings/:id', async (req, res) => {
  try {
    const plugin = await getOrCreateRealEstatePlugin()
    const listing = await RealEstateListing.findOne({
      where: { id: req.params.id, isActive: true }
    })
    if (!listing) return res.status(404).json({ error: 'Listing not found' })

    res.json({ plugin, listing })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
