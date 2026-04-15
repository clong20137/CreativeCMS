import express from 'express'
import nodemailer from 'nodemailer'
import ContactMessage from '../models/ContactMessage.js'
import { getOrCreateSiteSettings } from './site-settings.js'

const router = express.Router()

function createTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return null
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  })
}

router.post('/', async (req, res) => {
  try {
    const message = await ContactMessage.create(req.body)
    const settings = await getOrCreateSiteSettings()
    const transporter = createTransporter()

    if (transporter && settings.contactEmail) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: settings.contactEmail,
        replyTo: req.body.email,
        subject: `New website inquiry from ${req.body.name}`,
        text: `Name: ${req.body.name}\nEmail: ${req.body.email}\nPhone: ${req.body.phone || ''}\nCompany: ${req.body.company || ''}\nService: ${req.body.service || ''}\n\n${req.body.message}`
      })
    }

    res.status(201).json({ message: 'Message sent', contactMessage: message })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/', async (req, res) => {
  try {
    const messages = await ContactMessage.findAll({ order: [['createdAt', 'DESC']] })
    res.json(messages)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const message = await ContactMessage.findByPk(req.params.id)
    if (!message) return res.status(404).json({ error: 'Message not found' })
    await message.update(req.body)
    res.json(message)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
