import express from 'express'
import { DataTypes } from 'sequelize'
import SiteSetting from '../models/SiteSetting.js'

const router = express.Router()
let siteSettingsSchemaReady = false

async function ensureSiteSettingsSchema() {
  if (siteSettingsSchemaReady) return

  const queryInterface = SiteSetting.sequelize.getQueryInterface()
  const table = await queryInterface.describeTable('SiteSettings').catch(() => null)
  if (!table) return

  if (!table.reusableSections) {
    try {
      await queryInterface.addColumn('SiteSettings', 'reusableSections', {
        type: DataTypes.JSON,
        allowNull: true
      })
    } catch (error) {
      const message = String(error?.message || '')
      if (!message.includes('Duplicate column')) throw error
    }
  }

  const columns = [
    ['googleSearchConsoleProperty', { type: DataTypes.STRING, allowNull: true }],
    ['googleSearchConsoleServiceAccountJson', { type: DataTypes.TEXT('long'), allowNull: true }],
    ['pageSpeedUrl', { type: DataTypes.STRING, allowNull: true }],
    ['pageSpeedApiKey', { type: DataTypes.STRING, allowNull: true }],
    ['footerNavigationItems', { type: DataTypes.JSON, allowNull: true }]
  ]

  for (const [name, definition] of columns) {
    if (!table[name]) {
      try {
        await queryInterface.addColumn('SiteSettings', name, definition)
      } catch (error) {
        const message = String(error?.message || '')
        if (!message.includes('Duplicate column')) throw error
      }
    }
  }

  siteSettingsSchemaReady = true
}

export async function getOrCreateSiteSettings() {
  await ensureSiteSettingsSchema()
  const [settings] = await SiteSetting.findOrCreate({
    where: { id: 1 },
    defaults: { id: 1 }
  })
  if (!settings.reusableSections) {
    settings.reusableSections = []
  }
  return settings
}

function publicSiteSettings(settings) {
  const data = settings.toJSON()
  const allowedKeys = [
    'siteName',
    'faviconUrl',
    'logoUrl',
    'logoSize',
    'logoText',
    'contactEmail',
    'phone',
    'hours',
    'locationLine1',
    'locationLine2',
    'heroTitle',
    'heroSubtitle',
    'heroPrimaryLabel',
    'heroPrimaryUrl',
    'heroSecondaryLabel',
    'heroSecondaryUrl',
    'heroMediaType',
    'heroMediaUrl',
    'pageHeaders',
    'pageMetadata',
    'navigationItems',
    'footerNavigationItems',
    'pageSections',
    'reusableSections',
    'facebookUrl',
    'instagramUrl',
    'twitterUrl',
    'linkedinUrl',
    'whatWeDo',
    'whatWeDoHeader',
    'whatWeDoEnabled',
    'featuredWork',
    'webDesignPackages',
    'services',
    'faqs',
    'testimonials',
    'stripePublishableKey',
    'turnstileSiteKey'
  ]

  const safeSettings = allowedKeys.reduce((safe, key) => {
    safe[key] = data[key]
    return safe
  }, {})
  safeSettings.turnstileSiteKey = data.turnstileSiteKey || process.env.TURNSTILE_SITE_KEY || ''
  return safeSettings
}

router.get('/', async (req, res) => {
  try {
    const settings = await getOrCreateSiteSettings()
    res.json(publicSiteSettings(settings))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/testimonials', async (req, res) => {
  try {
    const settings = await getOrCreateSiteSettings()

    if (settings.googleReviewsEnabled && settings.googlePlaceId && settings.googleApiKey) {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(settings.googlePlaceId)}&fields=reviews&key=${encodeURIComponent(settings.googleApiKey)}`
      const response = await fetch(url)
      const data = await response.json()
      const reviews = data.result?.reviews || []
      return res.json(reviews.map(review => ({
        id: review.time,
        name: review.author_name,
        company: 'Google Review',
        role: `${review.rating} star review`,
        image: review.profile_photo_url,
        text: review.text,
        rating: review.rating
      })))
    }

    res.json(settings.testimonials || [])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
