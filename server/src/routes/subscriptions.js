import express from 'express'
import Subscription from '../models/Subscription.js'
import SubscriptionPlan from '../models/SubscriptionPlan.js'
import CMSLicense from '../models/CMSLicense.js'
import { DataTypes } from 'sequelize'
import { ensureActiveUser, requireRole, requireSelfOrAdmin, verifyToken } from '../utils/auth.js'

const router = express.Router()
let subscriptionSchemaReady = false
let cmsLicenseSchemaReady = false

async function ensureSubscriptionSchema() {
  if (subscriptionSchemaReady) return

  const queryInterface = Subscription.sequelize.getQueryInterface()
  const subscriptionTable = await queryInterface.describeTable('Subscriptions').catch(() => null)
  const planTable = await queryInterface.describeTable('SubscriptionPlans').catch(() => null)

  if (subscriptionTable) {
    const addSubscriptionColumn = async (name, config) => {
      if (subscriptionTable[name]) return
      await queryInterface.addColumn('Subscriptions', name, config).catch((error) => {
        if (!String(error?.message || '').includes('Duplicate column')) throw error
      })
    }

    await addSubscriptionColumn('productType', {
      type: DataTypes.ENUM('service', 'cms-license'),
      allowNull: false,
      defaultValue: 'service'
    })
    await addSubscriptionColumn('licenseKey', { type: DataTypes.STRING, allowNull: true })
    await addSubscriptionColumn('licensedDomain', { type: DataTypes.STRING, allowNull: true })
    await addSubscriptionColumn('updateChannel', {
      type: DataTypes.ENUM('stable', 'early-access'),
      allowNull: false,
      defaultValue: 'stable'
    })
    await addSubscriptionColumn('includedUpdates', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    })
    await addSubscriptionColumn('lastValidatedAt', {
      type: DataTypes.DATE,
      allowNull: true
    })
  }

  if (planTable) {
    const addPlanColumn = async (name, config) => {
      if (planTable[name]) return
      await queryInterface.addColumn('SubscriptionPlans', name, config).catch((error) => {
        if (!String(error?.message || '').includes('Duplicate column')) throw error
      })
    }

    await addPlanColumn('productType', {
      type: DataTypes.ENUM('service', 'cms-license'),
      allowNull: false,
      defaultValue: 'service'
    })
    await addPlanColumn('updateChannel', {
      type: DataTypes.ENUM('stable', 'early-access'),
      allowNull: false,
      defaultValue: 'stable'
    })
    await addPlanColumn('includedUpdates', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    })
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

  await addColumn('planId', {
    type: DataTypes.INTEGER,
    allowNull: true
  })
  await addColumn('planName', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'CMS License'
  })
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
  await addColumn('licensedDomain', {
    type: DataTypes.STRING,
    allowNull: true
  })
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
  await addColumn('startDate', {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: new Date()
  })
  await addColumn('renewalDate', {
    type: DataTypes.DATE,
    allowNull: true
  })
  await addColumn('endDate', {
    type: DataTypes.DATE,
    allowNull: true
  })
  await addColumn('lastValidatedAt', {
    type: DataTypes.DATE,
    allowNull: true
  })
  await addColumn('features', {
    type: DataTypes.JSON,
    allowNull: true
  })
  await addColumn('notes', {
    type: DataTypes.TEXT,
    allowNull: true
  })

  cmsLicenseSchemaReady = true
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
    licenseKey: legacyLicense.licenseKey || `LEGACY-${legacyLicense.id}`,
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

// Get subscription for a client
router.get('/client/:clientId', verifyToken, ensureActiveUser, requireSelfOrAdmin((req) => req.params.clientId), async (req, res) => {
  try {
    await ensureSubscriptionSchema()
    const subscription = await Subscription.findOne({
      where: { clientId: req.params.clientId, status: 'active', productType: 'service' },
      order: [['createdAt', 'DESC']]
    })
    res.json(subscription)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/client/:clientId/license', verifyToken, ensureActiveUser, requireSelfOrAdmin((req) => req.params.clientId), async (req, res) => {
  try {
    await ensureCmsLicenseSchema()
    await migrateLegacySubscriptionLicense(req.params.clientId)

    const activeLicense = await CMSLicense.findOne({
      where: { clientId: req.params.clientId, status: 'active' },
      order: [['createdAt', 'DESC']]
    })

    if (activeLicense) {
      if (!activeLicense.lastValidatedAt) {
        await activeLicense.update({ lastValidatedAt: new Date() })
      }
      return res.json({ hasActiveLicense: true, license: activeLicense })
    }

    const latestLicense = await CMSLicense.findOne({
      where: { clientId: req.params.clientId },
      order: [['createdAt', 'DESC']]
    })

    res.json({ hasActiveLicense: false, license: latestLicense })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get single subscription
router.get('/:id', verifyToken, ensureActiveUser, async (req, res) => {
  try {
    await ensureSubscriptionSchema()
    const subscription = await Subscription.findByPk(req.params.id)
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' })
    if (req.userRole !== 'admin' && String(subscription.clientId) !== String(req.userId)) {
      return res.status(403).json({ error: 'You do not have access to this subscription' })
    }
    res.json(subscription)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create subscription
router.post('/', verifyToken, ensureActiveUser, requireRole('admin'), async (req, res) => {
  try {
    await ensureSubscriptionSchema()
    const subscription = await Subscription.create(req.body)
    res.status(201).json(subscription)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update subscription
router.put('/:id', verifyToken, ensureActiveUser, requireRole('admin'), async (req, res) => {
  try {
    await ensureSubscriptionSchema()
    const subscription = await Subscription.findByPk(req.params.id)
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' })
    await subscription.update(req.body)
    res.json(subscription)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Cancel subscription
router.put('/:id/cancel', verifyToken, ensureActiveUser, async (req, res) => {
  try {
    await ensureSubscriptionSchema()
    const subscription = await Subscription.findByPk(req.params.id)
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' })
    if (req.userRole !== 'admin' && String(subscription.clientId) !== String(req.userId)) {
      return res.status(403).json({ error: 'You do not have access to this subscription' })
    }
    await subscription.update({ status: 'cancelled', endDate: new Date() })
    res.json(subscription)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete subscription
router.delete('/:id', verifyToken, ensureActiveUser, requireRole('admin'), async (req, res) => {
  try {
    await ensureSubscriptionSchema()
    const subscription = await Subscription.findByPk(req.params.id)
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' })
    await subscription.destroy()
    res.json({ message: 'Subscription deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
