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
    defaultValue: 'Creative Studio'
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
  stripePublishableKey: {
    type: DataTypes.STRING,
    allowNull: true
  },
  stripeSecretKey: {
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
