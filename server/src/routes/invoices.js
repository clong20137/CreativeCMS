import express from 'express'
import nodemailer from 'nodemailer'
import Stripe from 'stripe'
import Invoice from '../models/Invoice.js'
import User from '../models/User.js'
import { getOrCreateSiteSettings } from './site-settings.js'

const router = express.Router()

// Generate invoice number
function generateInvoiceNumber() {
  return 'INV-' + Date.now()
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  })
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('en-US') : '-'
}

function buildInvoiceHtml(invoice, client) {
  const items = Array.isArray(invoice.items) ? invoice.items : []
  const itemRows = items.map((item) => `
    <tr>
      <td>${escapeHtml(item.description || 'Service')}</td>
      <td>${escapeHtml(item.quantity || 1)}</td>
      <td>${formatCurrency(item.rate || item.amount || 0)}</td>
      <td>${formatCurrency(item.amount || (Number(item.quantity || 1) * Number(item.rate || 0)))}</td>
    </tr>
  `).join('')

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(invoice.invoiceNumber)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; margin: 40px; }
    .top { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #2563eb; padding-bottom: 24px; margin-bottom: 32px; }
    h1 { margin: 0 0 8px; color: #2563eb; }
    h2 { margin: 0 0 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e5e7eb; }
    th { background: #f3f4f6; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
    .summary { margin-left: auto; width: 280px; margin-top: 24px; }
    .summary div { display: flex; justify-content: space-between; padding: 8px 0; }
    .total { font-weight: 700; font-size: 20px; border-top: 2px solid #111827; }
    .muted { color: #6b7280; }
    .notes { margin-top: 32px; padding: 16px; background: #f9fafb; }
  </style>
</head>
<body>
  <div class="top">
    <div>
      <h1>Creative by Caleb</h1>
      <p class="muted">Professional creative services</p>
    </div>
    <div>
      <h2>Invoice ${escapeHtml(invoice.invoiceNumber)}</h2>
      <p>Status: <strong>${escapeHtml(invoice.status)}</strong></p>
      <p>Issued: ${formatDate(invoice.issueDate)}</p>
      <p>Due: ${formatDate(invoice.dueDate)}</p>
    </div>
  </div>

  <section>
    <h2>Bill To</h2>
    <p><strong>${escapeHtml(client?.name || 'Client')}</strong></p>
    <p>${escapeHtml(client?.company || '')}</p>
    <p>${escapeHtml(client?.email || '')}</p>
  </section>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Rate</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows || '<tr><td colspan="4">No line items</td></tr>'}
    </tbody>
  </table>

  <div class="summary">
    <div><span>Subtotal</span><span>${formatCurrency(invoice.subtotal)}</span></div>
    <div><span>Tax</span><span>${formatCurrency(invoice.tax)}</span></div>
    <div class="total"><span>Total</span><span>${formatCurrency(invoice.total)}</span></div>
  </div>

  ${invoice.notes ? `<div class="notes"><strong>Notes</strong><p>${escapeHtml(invoice.notes)}</p></div>` : ''}
  ${invoice.terms ? `<div class="notes"><strong>Terms</strong><p>${escapeHtml(invoice.terms)}</p></div>` : ''}
</body>
</html>`
}

async function findInvoiceWithClient(id) {
  return Invoice.findByPk(id, {
    include: [{ model: User, attributes: ['id', 'name', 'email', 'company'] }]
  })
}

async function getStripeClient() {
  const settings = await getOrCreateSiteSettings()
  const secretKey = settings.stripeSecretKey || process.env.STRIPE_SECRET_KEY
  if (!secretKey || secretKey.includes('your_key_here')) return null
  return new Stripe(secretKey)
}

function createTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    return null
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  })
}

// Get all invoices for a client
router.get('/client/:clientId', async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      where: { clientId: req.params.clientId },
      order: [['issueDate', 'DESC']]
    })
    res.json(invoices)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get single invoice
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id)
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })
    res.json(invoice)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Download invoice as printable HTML
router.get('/:id/download', async (req, res) => {
  try {
    const invoice = await findInvoiceWithClient(req.params.id)
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })

    const html = buildInvoiceHtml(invoice, invoice.User)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.html"`)
    res.send(html)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Email invoice to client
router.post('/:id/send', async (req, res) => {
  try {
    const invoice = await findInvoiceWithClient(req.params.id)
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })
    if (!invoice.User?.email) return res.status(400).json({ error: 'Client email is missing' })

    const transporter = createTransporter()
    if (!transporter) {
      return res.status(400).json({ error: 'Email is not configured on the server' })
    }

    const html = buildInvoiceHtml(invoice, invoice.User)
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: invoice.User.email,
      subject: `Invoice ${invoice.invoiceNumber} from Creative by Caleb`,
      html,
      attachments: [
        {
          filename: `${invoice.invoiceNumber}.html`,
          content: html,
          contentType: 'text/html'
        }
      ]
    })

    await invoice.update({ status: invoice.status === 'draft' ? 'sent' : invoice.status })
    res.json({ message: 'Invoice emailed successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/:id/checkout-session', async (req, res) => {
  try {
    const invoice = await findInvoiceWithClient(req.params.id)
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })

    const stripe = await getStripeClient()
    if (!stripe) return res.status(400).json({ error: 'Stripe is not configured' })

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: invoice.User?.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Invoice ${invoice.invoiceNumber}`
            },
            unit_amount: Math.round(Number(invoice.total || 0) * 100)
          }
        }
      ],
      metadata: {
        invoiceId: String(invoice.id)
      },
      success_url: `${frontendUrl}/client-dashboard/billing?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/client-dashboard/billing?payment=cancelled`
    })

    await invoice.update({ stripeCheckoutSessionId: session.id })

    res.json({ url: session.url })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create invoice
router.post('/', async (req, res) => {
  try {
    const invoiceData = {
      ...req.body,
      invoiceNumber: generateInvoiceNumber()
    }
    const invoice = await Invoice.create(invoiceData)
    res.status(201).json(invoice)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update invoice
router.put('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id)
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })
    await invoice.update(req.body)
    res.json(invoice)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Mark invoice as paid
router.put('/:id/pay', async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id)
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })
    await invoice.update({ status: 'paid', paidDate: new Date() })
    res.json(invoice)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete invoice
router.delete('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id)
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })
    await invoice.destroy()
    res.json({ message: 'Invoice deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
