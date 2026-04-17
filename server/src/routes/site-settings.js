import express from 'express'
import SiteSetting from '../models/SiteSetting.js'

const router = express.Router()

export async function getOrCreateSiteSettings() {
  const [settings] = await SiteSetting.findOrCreate({
    where: { id: 1 },
    defaults: { id: 1 }
  })
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
