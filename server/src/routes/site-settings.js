import express from 'express'
import { DataTypes } from 'sequelize'
import SiteSetting from '../models/SiteSetting.js'

const router = express.Router()
let siteSettingsSchemaReady = false
const BUILT_IN_PAGE_KEYS = ['home', 'portfolio', 'services', 'pricing', 'plugins', 'contact']

const defaultFooterColumns = [
  {
    title: 'Quick Links',
    sortOrder: 0,
    isActive: true,
    links: [
      { label: 'Home', url: '/', isActive: true, sortOrder: 0 },
      { label: 'Portfolio', url: '/portfolio', isActive: true, sortOrder: 10 },
      { label: 'Services', url: '/services', isActive: true, sortOrder: 20 },
      { label: 'Pricing', url: '/pricing', isActive: true, sortOrder: 30 }
    ]
  },
  {
    title: 'Services',
    sortOrder: 10,
    isActive: true,
    links: [
      { label: 'Web Design', url: '/services', isActive: true, sortOrder: 0 },
      { label: 'Photography', url: '/services', isActive: true, sortOrder: 10 },
      { label: 'Videography', url: '/services', isActive: true, sortOrder: 20 },
      { label: 'Branding', url: '/services', isActive: true, sortOrder: 30 }
    ]
  }
]

const fallbackWhatWeDo = [
  { id: 'fallback-whatwedo-1', title: 'Web Design', desc: 'Modern, responsive websites that convert' },
  { id: 'fallback-whatwedo-2', title: 'Photography', desc: 'Professional visual storytelling' },
  { id: 'fallback-whatwedo-3', title: 'Videography', desc: 'Cinematic quality video production' },
  { id: 'fallback-whatwedo-4', title: 'Brand Building', desc: 'Complete identity and strategy' }
]

const fallbackFeaturedWork = [
  {
    id: 'fallback-featured-1',
    title: 'Modern E-Commerce Platform',
    category: 'Web Design',
    image: 'https://images.unsplash.com/photo-1460925895917-aeb19be489c7?w=500&h=500&fit=crop',
    description: 'A fully responsive e-commerce platform with advanced filtering and checkout.',
    buttonLabel: 'View Case Study',
    url: '/portfolio'
  },
  {
    id: 'fallback-featured-2',
    title: 'Corporate Brand Photography',
    category: 'Photography',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=500&fit=crop',
    description: 'Professional corporate headshots and team photography sessions.',
    buttonLabel: 'View Case Study',
    url: '/portfolio'
  },
  {
    id: 'fallback-featured-3',
    title: 'Product Launch Video',
    category: 'Videography',
    image: 'https://images.unsplash.com/photo-1533928298208-27ff66555d8d?w=500&h=500&fit=crop',
    description: 'High-quality product launch video with cinematic styling.',
    buttonLabel: 'View Case Study',
    url: '/portfolio'
  },
  {
    id: 'fallback-featured-4',
    title: 'Complete Brand Identity',
    category: 'Branding',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&h=500&fit=crop',
    description: 'Full brand identity package including logo, guidelines, and collateral.',
    buttonLabel: 'View Case Study',
    url: '/portfolio'
  }
]

const fallbackServices = [
  {
    id: 'fallback-service-1',
    title: 'Web Design',
    description: 'Custom-designed websites that are beautiful, functional, and conversion-focused.',
    features: [
      'Responsive design for all devices',
      'User experience optimization',
      'Performance optimization',
      'SEO-friendly structure',
      'Content management systems',
      'E-commerce integration'
    ]
  },
  {
    id: 'fallback-service-2',
    title: 'Professional Photography',
    description: 'Stunning photography that captures your brand story and engages your audience.',
    features: [
      'Corporate headshots',
      'Product photography',
      'Event coverage',
      'Real estate photography',
      'Lifestyle photography',
      'Post-processing & editing'
    ]
  },
  {
    id: 'fallback-service-3',
    title: 'Videography & Production',
    description: 'Cinematic videos that tell compelling stories and drive engagement.',
    features: [
      'Commercial production',
      'Product videos',
      'Event videography',
      'Testimonial videos',
      '4K cinematography',
      'Professional editing'
    ]
  },
  {
    id: 'fallback-service-4',
    title: 'Brand Building',
    description: 'Complete brand identity and strategy that sets you apart from competitors.',
    features: [
      'Logo design',
      'Brand guidelines',
      'Identity systems',
      'Marketing collateral',
      'Brand strategy',
      'Brand positioning'
    ]
  }
]

const fallbackPricingPlans = [
  {
    id: 'fallback-plan-1',
    name: 'Starter',
    description: 'Perfect for small projects and startups',
    price: 1500,
    billingPeriod: 'one-time',
    features: [
      { name: '5 Page Website', included: true },
      { name: 'Responsive Design', included: true },
      { name: 'Basic SEO', included: true },
      { name: 'Contact Form', included: true },
      { name: 'Social Media Links', included: true },
      { name: 'Analytics Setup', included: false },
      { name: 'Advanced Features', included: false },
      { name: 'Monthly Support', included: false }
    ],
    popular: false
  },
  {
    id: 'fallback-plan-2',
    name: 'Professional',
    description: 'Ideal for growing businesses',
    price: 3500,
    billingPeriod: 'one-time',
    features: [
      { name: '10 Page Website', included: true },
      { name: 'Responsive Design', included: true },
      { name: 'Advanced SEO', included: true },
      { name: 'Contact Form & CRM', included: true },
      { name: 'Social Media Integration', included: true },
      { name: 'Analytics & Tracking', included: true },
      { name: 'E-commerce Setup', included: false },
      { name: '6 Months Support', included: true }
    ],
    popular: true
  },
  {
    id: 'fallback-plan-3',
    name: 'Enterprise',
    description: 'For large-scale projects and agencies',
    price: 7500,
    billingPeriod: 'one-time',
    features: [
      { name: 'Unlimited Pages', included: true },
      { name: 'Responsive Design', included: true },
      { name: 'Full SEO Optimization', included: true },
      { name: 'Advanced CRM Integration', included: true },
      { name: 'Social Media Management', included: true },
      { name: 'Advanced Analytics', included: true },
      { name: 'E-commerce Platform', included: true },
      { name: '12 Months Support', included: true }
    ],
    popular: false
  }
]

const fallbackFaqs = [
  {
    id: 'fallback-faq-1',
    q: 'Do you offer custom quotes?',
    a: 'Yes, we provide custom quotes for projects outside our standard packages. Contact us to discuss your specific needs.'
  },
  {
    id: 'fallback-faq-2',
    q: 'What is your revisions policy?',
    a: "All packages include revision rounds. We work with you until you're completely satisfied with the final product."
  },
  {
    id: 'fallback-faq-3',
    q: 'Do you offer payment plans?',
    a: 'Yes, we offer flexible payment plans for larger projects. We can discuss options that work best for your budget.'
  },
  {
    id: 'fallback-faq-4',
    q: 'What is your typical turnaround time?',
    a: "Turnaround times vary by project complexity, typically ranging from 2-4 weeks. We'll provide a specific timeline during consultation."
  }
]

const fallbackPageMetadata = {
  home: {
    pageTitle: 'Homepage',
    pageUrl: '/',
    metaTitle: 'Indianapolis Web Design, Photography, Videography, and Branding',
    metaDescription: 'Creative by Caleb helps Indianapolis businesses and national clients with responsive web design, brand photography, videography, and visual branding.'
  },
  portfolio: {
    pageTitle: 'Portfolio',
    pageUrl: '/portfolio',
    headerTitle: 'Our Portfolio',
    headerSubtitle: 'Showcase of our latest creative projects and client work',
    metaTitle: 'Creative by Caleb Portfolio for Web Design, Photo, Video, and Branding',
    metaDescription: 'View web design, photography, videography, and branding work from Creative by Caleb, serving Indianapolis and clients throughout the United States.'
  },
  services: {
    pageTitle: 'Services',
    pageUrl: '/services',
    headerTitle: 'Our Services',
    headerSubtitle: 'Comprehensive creative solutions for your business',
    metaTitle: 'Creative Services for Indianapolis and National Businesses',
    metaDescription: 'Explore web design, photography, videography, and branding services for Indianapolis companies and businesses across the United States.'
  },
  pricing: {
    pageTitle: 'Pricing',
    pageUrl: '/pricing',
    headerTitle: 'Transparent Pricing',
    headerSubtitle: 'Flexible packages tailored to your needs',
    metaTitle: 'Web Design, Photography, Videography, and Branding Pricing',
    metaDescription: 'Review transparent pricing for web design packages, photography, videography, logo design, and brand identity services.'
  },
  plugins: {
    pageTitle: 'Plugins',
    pageUrl: '/plugins',
    headerTitle: 'Website Plugins',
    headerSubtitle: 'Add the features your business needs when you need them.',
    metaTitle: 'Website Plugins and Add Ons',
    metaDescription: 'Explore optional website plugins from Creative by Caleb, including restaurant menus and real estate listing tools.'
  },
  contact: {
    pageTitle: 'Contact',
    pageUrl: '/contact',
    headerTitle: 'Get in Touch',
    headerSubtitle: "Have a project in mind? Let's talk about how we can help.",
    metaTitle: 'Contact Creative by Caleb',
    metaDescription: 'Contact Creative by Caleb for web design, photography, videography, and branding projects in Indianapolis, Indiana, or anywhere in the United States.'
  }
}

function legacyHeaderFor(settings, pageKey) {
  return settings?.pageHeaders?.[pageKey] || {}
}

function metadataFor(settings, pageKey) {
  return {
    ...(fallbackPageMetadata[pageKey] || {}),
    ...legacyHeaderFor(settings, pageKey),
    ...(settings?.pageMetadata?.[pageKey] || {})
  }
}

function buildFooterColumns(settings) {
  const existingColumns = Array.isArray(settings?.footerNavigationColumns) ? settings.footerNavigationColumns : []
  if (existingColumns.length > 0) return existingColumns
  const legacyLinks = Array.isArray(settings?.footerNavigationItems) ? settings.footerNavigationItems : []
  if (legacyLinks.length > 0) {
    return [
      {
        title: 'Quick Links',
        sortOrder: 0,
        isActive: true,
        links: legacyLinks
      },
      defaultFooterColumns[1]
    ]
  }
  return defaultFooterColumns
}

function buildFallbackBuiltInSections(settings) {
  const homeMetadata = metadataFor(settings, 'home')
  const portfolioMetadata = metadataFor(settings, 'portfolio')
  const servicesMetadata = metadataFor(settings, 'services')
  const pricingMetadata = metadataFor(settings, 'pricing')
  const pluginsMetadata = metadataFor(settings, 'plugins')
  const contactMetadata = metadataFor(settings, 'contact')
  const whatWeDo = Array.isArray(settings.whatWeDo) && settings.whatWeDo.length > 0 ? settings.whatWeDo : fallbackWhatWeDo
  const featuredWork = Array.isArray(settings.featuredWork) && settings.featuredWork.length > 0 ? settings.featuredWork : fallbackFeaturedWork
  const services = Array.isArray(settings.services) && settings.services.length > 0 ? settings.services : fallbackServices
  const pricingPlans = Array.isArray(settings.webDesignPackages) && settings.webDesignPackages.length > 0 ? settings.webDesignPackages : fallbackPricingPlans
  const faqs = Array.isArray(settings.faqs) && settings.faqs.length > 0 ? settings.faqs : fallbackFaqs

  return {
    home: [
      {
        id: 'legacy-home-hero',
        type: 'hero',
        title: settings.heroTitle || 'Transform Your Vision Into Reality',
        body: settings.heroSubtitle || 'Professional web design, photography, videography, and branding services that elevate your creative presence.',
        buttonLabel: settings.heroPrimaryLabel || 'Start a Project',
        buttonUrl: settings.heroPrimaryUrl || '/contact',
        secondaryButtonLabel: settings.heroSecondaryLabel || 'View Our Work',
        secondaryButtonUrl: settings.heroSecondaryUrl || '/portfolio',
        mediaType: settings.heroMediaType || 'none',
        imageUrl: settings.heroMediaUrl || ''
      },
      ...(settings.whatWeDoEnabled === false ? [] : [{
        id: 'legacy-home-whatwedo',
        type: 'whatWeDo',
        title: settings.whatWeDoHeader?.title || 'What We Do',
        body: settings.whatWeDoHeader?.subtitle || '',
        items: whatWeDo
      }]),
      {
        id: 'legacy-home-featured',
        type: 'featuredWork',
        title: 'Featured Work',
        items: featuredWork
      },
      {
        id: 'legacy-home-testimonials',
        type: 'testimonials'
      },
      {
        id: 'legacy-home-cta',
        type: 'cta',
        title: 'Ready to Get Started?',
        body: "Let's collaborate on your next creative project. Contact us today to discuss your vision.",
        buttonLabel: 'Get in Touch',
        buttonUrl: '/contact'
      }
    ],
    portfolio: [
      {
        id: 'legacy-portfolio-header',
        type: 'header',
        title: portfolioMetadata.headerTitle || portfolioMetadata.pageTitle || 'Our Portfolio',
        body: portfolioMetadata.headerSubtitle || 'Showcase of our latest creative projects and client work'
      },
      {
        id: 'legacy-portfolio-gallery',
        type: 'portfolioGallery',
        title: '',
        body: ''
      }
    ],
    services: [
      {
        id: 'legacy-services-header',
        type: 'header',
        title: servicesMetadata.headerTitle || servicesMetadata.pageTitle || 'Our Services',
        body: servicesMetadata.headerSubtitle || 'Comprehensive creative solutions for your business'
      },
      {
        id: 'legacy-services-list',
        type: 'servicesList',
        items: services
      },
      {
        id: 'legacy-services-process',
        type: 'columns',
        title: 'Our Process',
        columns: 4,
        tabletColumns: 2,
        mobileColumns: 1,
        items: [
          {
            id: 'legacy-services-process-col-1',
            sections: [{ id: 'legacy-services-process-block-1', type: 'header', title: '01 Discovery', body: 'We understand your goals and vision' }]
          },
          {
            id: 'legacy-services-process-col-2',
            sections: [{ id: 'legacy-services-process-block-2', type: 'header', title: '02 Strategy', body: 'We develop a comprehensive plan' }]
          },
          {
            id: 'legacy-services-process-col-3',
            sections: [{ id: 'legacy-services-process-block-3', type: 'header', title: '03 Creation', body: 'We bring your ideas to life' }]
          },
          {
            id: 'legacy-services-process-col-4',
            sections: [{ id: 'legacy-services-process-block-4', type: 'header', title: '04 Launch', body: 'We deliver and support you' }]
          }
        ]
      }
    ],
    pricing: [
      {
        id: 'legacy-pricing-header',
        type: 'header',
        title: pricingMetadata.headerTitle || pricingMetadata.pageTitle || 'Transparent Pricing',
        body: pricingMetadata.headerSubtitle || 'Flexible packages tailored to your needs'
      },
      {
        id: 'legacy-pricing-plans',
        type: 'pricingPackages',
        title: 'Web Design Packages',
        body: 'Choose the perfect web design package for your project. All packages include responsive design and modern aesthetics.',
        items: pricingPlans
      },
      {
        id: 'legacy-pricing-services',
        type: 'servicePricing',
        title: 'A La Carte Services',
        body: 'Need individual services? We offer flexible pricing for photography, videography, and branding.'
      },
      {
        id: 'legacy-pricing-faq',
        type: 'faq',
        title: 'Frequently Asked Questions',
        items: faqs
      }
    ],
    plugins: [
      {
        id: 'legacy-plugins-header',
        type: 'header',
        title: pluginsMetadata.headerTitle || pluginsMetadata.pageTitle || 'Website Plugins',
        body: pluginsMetadata.headerSubtitle || 'Add the features your business needs when you need them.'
      },
      {
        id: 'legacy-plugins-list',
        type: 'pluginsList',
        title: 'Plugin Demos',
        body: 'Explore optional add-ons and interactive demos that can be activated for your site.'
      }
    ],
    contact: [
      {
        id: 'legacy-contact-header',
        type: 'header',
        title: contactMetadata.headerTitle || contactMetadata.pageTitle || 'Get in Touch',
        body: contactMetadata.headerSubtitle || "Have a project in mind? Let's talk about how we can help."
      },
      {
        id: 'legacy-contact-form',
        type: 'contactForm'
      }
    ]
  }
}

function ensureBuiltInPageDefaults(settings) {
  let changed = false
  const currentMetadata = settings.pageMetadata || {}
  const currentSections = settings.pageSections || {}
  const hasAnyBuiltInSections = BUILT_IN_PAGE_KEYS.some((pageKey) => Array.isArray(currentSections[pageKey]) && currentSections[pageKey].length > 0)

  const nextMetadata = { ...currentMetadata }
  for (const pageKey of BUILT_IN_PAGE_KEYS) {
    const mergedMetadata = metadataFor(settings, pageKey)
    const existingMetadata = currentMetadata[pageKey] || {}
    const finalMetadata = { ...mergedMetadata, ...existingMetadata }
    if (JSON.stringify(finalMetadata) !== JSON.stringify(existingMetadata)) {
      nextMetadata[pageKey] = finalMetadata
      changed = true
    }
  }

  if (changed) {
    settings.pageMetadata = nextMetadata
  }

  if (!hasAnyBuiltInSections) {
    settings.pageSections = {
      ...currentSections,
      ...buildFallbackBuiltInSections({
        ...settings.toJSON(),
        pageMetadata: settings.pageMetadata || nextMetadata
      })
    }
    changed = true
  }

  return changed
}

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
    ['themeFontFamily', { type: DataTypes.STRING, allowNull: true }],
    ['themeBackgroundColor', { type: DataTypes.STRING, allowNull: true }],
    ['themeSurfaceColor', { type: DataTypes.STRING, allowNull: true }],
    ['themeHeadingColor', { type: DataTypes.STRING, allowNull: true }],
    ['themeBodyColor', { type: DataTypes.STRING, allowNull: true }],
    ['themePrimaryColor', { type: DataTypes.STRING, allowNull: true }],
    ['themePrimaryHoverColor', { type: DataTypes.STRING, allowNull: true }],
    ['themeSecondaryColor', { type: DataTypes.STRING, allowNull: true }],
    ['themeSecondaryHoverColor', { type: DataTypes.STRING, allowNull: true }],
    ['themeButtonTextColor', { type: DataTypes.STRING, allowNull: true }],
    ['themeLinkColor', { type: DataTypes.STRING, allowNull: true }],
    ['themeButtonRadius', { type: DataTypes.INTEGER, allowNull: true }],
    ['themeCardRadius', { type: DataTypes.INTEGER, allowNull: true }],
    ['themeShadowPreset', { type: DataTypes.STRING, allowNull: true }],
    ['themeSpacingScale', { type: DataTypes.DECIMAL(4, 2), allowNull: true }],
    ['googleSearchConsoleProperty', { type: DataTypes.STRING, allowNull: true }],
    ['googleSearchConsoleServiceAccountJson', { type: DataTypes.TEXT('long'), allowNull: true }],
    ['pageSpeedUrl', { type: DataTypes.STRING, allowNull: true }],
    ['pageSpeedApiKey', { type: DataTypes.STRING, allowNull: true }],
    ['footerNavigationItems', { type: DataTypes.JSON, allowNull: true }],
    ['footerNavigationColumns', { type: DataTypes.JSON, allowNull: true }]
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
  let changed = false
  if (!settings.reusableSections) {
    settings.reusableSections = []
    changed = true
  }
  if (!Array.isArray(settings.footerNavigationColumns) || settings.footerNavigationColumns.length === 0) {
    settings.footerNavigationColumns = buildFooterColumns(settings)
    changed = true
  }
  if (ensureBuiltInPageDefaults(settings)) changed = true
  if (changed) await settings.save()
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
    'themeFontFamily',
    'themeBackgroundColor',
    'themeSurfaceColor',
    'themeHeadingColor',
    'themeBodyColor',
    'themePrimaryColor',
    'themePrimaryHoverColor',
    'themeSecondaryColor',
    'themeSecondaryHoverColor',
    'themeButtonTextColor',
    'themeLinkColor',
    'themeButtonRadius',
    'themeCardRadius',
    'themeShadowPreset',
    'themeSpacingScale',
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
    'footerNavigationColumns',
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
