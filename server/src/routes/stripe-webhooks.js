import express from 'express'
import Stripe from 'stripe'
import Invoice from '../models/Invoice.js'
import Plugin from '../models/Plugin.js'
import ClientPluginPurchase from '../models/ClientPluginPurchase.js'
import { getOrCreateSiteSettings } from './site-settings.js'

const router = express.Router()

async function getStripeWebhookConfig() {
  const settings = await getOrCreateSiteSettings()
  const secretKey = settings.stripeSecretKey || process.env.STRIPE_SECRET_KEY
  const webhookSecret = settings.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET

  if (!secretKey || secretKey.includes('your_key_here')) {
    throw new Error('Stripe secret key is not configured')
  }

  if (!webhookSecret) {
    throw new Error('Stripe webhook secret is not configured')
  }

  return {
    stripe: new Stripe(secretKey),
    webhookSecret
  }
}

async function markInvoicePaid(session) {
  const invoiceId = session.metadata?.invoiceId
  if (!invoiceId || session.payment_status !== 'paid') return

  const invoice = await Invoice.findByPk(invoiceId)
  if (!invoice || invoice.status === 'paid') return

  await invoice.update({
    status: 'paid',
    paidDate: new Date(),
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null
  })
}

async function markPluginPurchased(session) {
  const pluginSlug = session.metadata?.pluginSlug
  if (!pluginSlug || session.payment_status !== 'paid') return

  const plugin = await Plugin.findOne({ where: { slug: pluginSlug } })
  if (!plugin) return

  const clientId = session.metadata?.clientId
  if (clientId) {
    const purchaseData = {
      clientId: Number(clientId),
      pluginId: plugin.id,
      pluginSlug: plugin.slug,
      pluginName: plugin.name,
      price: plugin.price,
      status: 'active',
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
      purchasedAt: new Date()
    }
    const purchase = await ClientPluginPurchase.findOne({
      where: { clientId: Number(clientId), pluginSlug: plugin.slug }
    })
    if (purchase) {
      await purchase.update(purchaseData)
    } else {
      await ClientPluginPurchase.create(purchaseData)
    }
    return
  }

  await plugin.update({
    isPurchased: true,
    isEnabled: true
  })
}

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature']
    const { stripe, webhookSecret } = await getStripeWebhookConfig()
    const event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret)

    if (event.type === 'checkout.session.completed') {
      await markInvoicePaid(event.data.object)
      await markPluginPurchased(event.data.object)
    }

    res.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error.message)
    res.status(400).json({ error: error.message })
  }
})

export default router
