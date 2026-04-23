import express from 'express'
import jwt from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'
import crypto from 'crypto'
import User from '../models/User.js'
import { base32Encode, verifyTotp } from './auth.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Middleware to verify token
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No token provided' })
    
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    req.userRole = decoded.role
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

const ensureActiveUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId, { attributes: ['id', 'isActive'] })
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (user.isActive === false) return res.status(403).json({ error: 'This account has been disabled. Please contact support.' })
    next()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Get user profile
router.get('/profile', verifyToken, ensureActiveUser, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, { attributes: { exclude: ['password', 'twoFactorCode', 'twoFactorSecret'] } })
    if (!user) return res.status(404).json({ error: 'User not found' })
    
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update profile (name, phone, company, address fields)
router.put('/profile', verifyToken, ensureActiveUser, async (req, res) => {
  try {
    const { name, phone, company, address, city, state, zipCode, country } = req.body
    
    const user = await User.findByPk(req.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })
    
    await user.update({
      name: name || user.name,
      phone: phone || user.phone,
      company: company || user.company,
      address: address || user.address,
      city: city || user.city,
      state: state || user.state,
      zipCode: zipCode || user.zipCode,
      country: country || user.country
    })
    
    res.json({ message: 'Profile updated successfully', user })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update email
router.put('/email', verifyToken, ensureActiveUser, async (req, res) => {
  try {
    const { newEmail, password } = req.body
    
    // Verify password first
    const user = await User.findByPk(req.userId)
    const isValidPassword = await bcryptjs.compare(password, user.password)
    if (!isValidPassword) return res.status(401).json({ error: 'Invalid password' })
    
    // Check if email already exists
    const existingUser = await User.findOne({ where: { email: newEmail } })
    if (existingUser && existingUser.id !== req.userId)
      return res.status(400).json({ error: 'Email already in use' })
    
    // Update email
    await user.update({ email: newEmail })
    
    res.json({ message: 'Email updated successfully', email: user.email })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Change password
router.put('/password', verifyToken, ensureActiveUser, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' })
    }
    if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })
    
    const user = await User.findByPk(req.userId)
    const isValidPassword = await bcryptjs.compare(currentPassword, user.password)
    if (!isValidPassword) return res.status(401).json({ error: 'Current password is incorrect' })
    
    await user.update({ password: newPassword })
    
    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/two-factor/setup', verifyToken, ensureActiveUser, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const secret = base32Encode(crypto.randomBytes(20))
    await user.update({ twoFactorSecret: secret, twoFactorMethod: 'app' })
    const label = encodeURIComponent(`Creative by Caleb:${user.email}`)
    const issuer = encodeURIComponent('Creative by Caleb')
    const otpauthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`
    res.json({ secret, otpauthUrl })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/two-factor/confirm', verifyToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (!user.twoFactorSecret) return res.status(400).json({ error: 'Two-factor setup has not been started' })
    if (!verifyTotp(user.twoFactorSecret, req.body.code)) return res.status(401).json({ error: 'Invalid authenticator code' })

    await user.update({
      twoFactorEnabled: true,
      twoFactorMethod: 'app',
      twoFactorCode: null,
      twoFactorExpires: null
    })

    res.json({
      message: 'Two-factor authentication updated',
      user: { id: user.id, email: user.email, twoFactorEnabled: user.twoFactorEnabled, twoFactorMethod: user.twoFactorMethod }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/two-factor', verifyToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    await user.update({
      twoFactorEnabled: Boolean(req.body.enabled),
      twoFactorMethod: req.body.enabled ? 'email' : user.twoFactorMethod,
      twoFactorSecret: req.body.enabled ? user.twoFactorSecret : null,
      twoFactorCode: null,
      twoFactorExpires: null
    })

    res.json({
      message: 'Two-factor authentication updated',
      user: { id: user.id, email: user.email, twoFactorEnabled: user.twoFactorEnabled, twoFactorMethod: user.twoFactorMethod }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get user preferences (notifications, privacy, etc)
router.get('/preferences', verifyToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })
    
    res.json({
      emailNotifications: user.emailNotifications !== false,
      invoiceReminders: user.invoiceReminders !== false,
      marketingEmails: user.marketingEmails === true,
      privacyLevel: user.privacyLevel || 'public'
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update preferences
router.put('/preferences', verifyToken, async (req, res) => {
  try {
    const { emailNotifications, invoiceReminders, marketingEmails, privacyLevel } = req.body
    
    const user = await User.findByPk(req.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })
    
    await user.update({
      emailNotifications,
      invoiceReminders,
      marketingEmails,
      privacyLevel
    })
    
    res.json({ message: 'Preferences updated', preferences: { emailNotifications, invoiceReminders, marketingEmails, privacyLevel } })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
