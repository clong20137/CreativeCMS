import { DataTypes } from 'sequelize'
import sequelize from '../database.js'

const SiteSetting = sequelize.define('SiteSetting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    defaultValue: 1
  },
  siteName: {
    type: DataTypes.STRING,
    defaultValue: 'Creative by Caleb'
  },
  faviconUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  logoUrl: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  logoSize: {
    type: DataTypes.INTEGER,
    defaultValue: 40
  },
  clientPortalName: {
    type: DataTypes.STRING,
    defaultValue: 'Client Portal'
  },
  adminPortalName: {
    type: DataTypes.STRING,
    defaultValue: 'Admin Portal'
  },
  emailFromName: {
    type: DataTypes.STRING,
    defaultValue: 'Creative by Caleb'
  },
  showPoweredBy: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  poweredByText: {
    type: DataTypes.STRING,
    defaultValue: 'Powered by Creative CMS'
  },
  themeFontFamily: {
    type: DataTypes.STRING,
    defaultValue: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },
  themeBackgroundColor: {
    type: DataTypes.STRING,
    defaultValue: '#ffffff'
  },
  themeSurfaceColor: {
    type: DataTypes.STRING,
    defaultValue: '#ffffff'
  },
  themeHeadingColor: {
    type: DataTypes.STRING,
    defaultValue: '#111827'
  },
  themeBodyColor: {
    type: DataTypes.STRING,
    defaultValue: '#374151'
  },
  themePrimaryColor: {
    type: DataTypes.STRING,
    defaultValue: '#2563eb'
  },
  themePrimaryHoverColor: {
    type: DataTypes.STRING,
    defaultValue: '#1d4ed8'
  },
  themeSecondaryColor: {
    type: DataTypes.STRING,
    defaultValue: '#e5e7eb'
  },
  themeSecondaryHoverColor: {
    type: DataTypes.STRING,
    defaultValue: '#d1d5db'
  },
  themeButtonTextColor: {
    type: DataTypes.STRING,
    defaultValue: '#ffffff'
  },
  themeLinkColor: {
    type: DataTypes.STRING,
    defaultValue: '#2563eb'
  },
  themeButtonRadius: {
    type: DataTypes.INTEGER,
    defaultValue: 8
  },
  themeCardRadius: {
    type: DataTypes.INTEGER,
    defaultValue: 8
  },
  themeShadowPreset: {
    type: DataTypes.STRING,
    defaultValue: 'medium'
  },
  themeSpacingScale: {
    type: DataTypes.DECIMAL(4, 2),
    defaultValue: 1
  },
  cmsCurrentVersion: {
    type: DataTypes.STRING,
    defaultValue: '1.0.0'
  },
  cmsReleaseChannel: {
    type: DataTypes.ENUM('stable', 'early-access'),
    defaultValue: 'stable'
  },
  cmsVersionName: {
    type: DataTypes.STRING,
    defaultValue: 'Creative CMS'
  },
  cmsReleaseNotes: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  siteBackups: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  setupWizardCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  setupWizardCompletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  onboardingState: {
    type: DataTypes.JSON,
    defaultValue: {
      selectedDemoSlug: '',
      starterPageId: null,
      checklist: {
        branding: false,
        template: false,
        homepage: false,
        navigation: false,
        launch: false
      }
    }
  },
  contactEmail: {
    type: DataTypes.STRING,
    defaultValue: 'hello@creativestudio.com'
  },
  phone: {
    type: DataTypes.STRING,
    defaultValue: '+1 (555) 123-4567'
  },
  hours: {
    type: DataTypes.STRING,
    defaultValue: 'Mon-Fri, 9am-6pm EST'
  },
  locationLine1: {
    type: DataTypes.STRING,
    defaultValue: '123 Creative Street'
  },
  locationLine2: {
    type: DataTypes.STRING,
    defaultValue: 'New York, NY 10001'
  },
  footerDescription: {
    type: DataTypes.TEXT,
    defaultValue: 'Transforming ideas into stunning visual experiences through web design, photography, and videography.'
  },
  heroTitle: {
    type: DataTypes.STRING,
    defaultValue: 'Transform Your Vision Into Reality'
  },
  heroSubtitle: {
    type: DataTypes.TEXT,
    defaultValue: 'Professional web design, photography, videography, and branding services that elevate your creative presence.'
  },
  heroPrimaryLabel: {
    type: DataTypes.STRING,
    defaultValue: 'Start a Project'
  },
  heroPrimaryUrl: {
    type: DataTypes.STRING,
    defaultValue: '/contact'
  },
  heroSecondaryLabel: {
    type: DataTypes.STRING,
    defaultValue: 'View Our Work'
  },
  heroSecondaryUrl: {
    type: DataTypes.STRING,
    defaultValue: '/portfolio'
  },
  heroMediaType: {
    type: DataTypes.ENUM('none', 'image', 'video'),
    defaultValue: 'none'
  },
  heroMediaUrl: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  pageHeaders: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  pageMetadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  navigationItems: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  footerNavigationItems: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  footerNavigationColumns: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  pageSections: {
    type: DataTypes.JSON,
    defaultValue: {
      home: [],
      portfolio: [],
      services: [],
      pricing: [],
      plugins: [],
      contact: []
    }
  },
  reusableSections: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  facebookUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  instagramUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  twitterUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  linkedinUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  whatWeDo: {
    type: DataTypes.JSON,
    defaultValue: [
      { title: 'Web Design', desc: 'Modern, responsive websites that convert' },
      { title: 'Photography', desc: 'Professional visual storytelling' },
      { title: 'Videography', desc: 'Cinematic quality video production' },
      { title: 'Brand Building', desc: 'Complete identity and strategy' }
    ]
  },
  whatWeDoHeader: {
    type: DataTypes.JSON,
    defaultValue: {
      title: 'What We Do',
      subtitle: ''
    }
  },
  whatWeDoEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  webDesignPackages: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  services: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  featuredWork: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  faqs: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  testimonials: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  googleReviewsEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  googlePlaceId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  googleApiKey: {
    type: DataTypes.STRING,
    allowNull: true
  },
  googleSearchConsoleProperty: {
    type: DataTypes.STRING,
    allowNull: true
  },
  googleSearchConsoleServiceAccountJson: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  pageSpeedUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pageSpeedApiKey: {
    type: DataTypes.STRING,
    allowNull: true
  },
  stripePublishableKey: {
    type: DataTypes.STRING,
    allowNull: true
  },
  stripeSecretKey: {
    type: DataTypes.STRING,
    allowNull: true
  },
  stripeWebhookSecret: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bankName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bankAccountLast4: {
    type: DataTypes.STRING,
    allowNull: true
  },
  payoutInstructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  turnstileSiteKey: {
    type: DataTypes.STRING,
    allowNull: true
  },
  turnstileSecretKey: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
})

export default SiteSetting
