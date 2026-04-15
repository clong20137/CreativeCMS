import express from 'express'
import jwt from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'
import User from '../models/User.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Middleware to verify token
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No token provided' })
    
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, { attributes: { exclude: ['password', 'twoFactorCode', 'twoFactorSecret'] } })
    if (!user) return res.status(404).json({ error: 'User not found' })
    
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update profile (name, phone, company, address fields)
router.put('/profile', verifyToken, async (req, res) => {
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
router.put('/email', verifyToken, async (req, res) => {
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
router.put('/password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' })
    }
    
    const user = await User.findByPk(req.userId)
    const isValidPassword = await bcryptjs.compare(currentPassword, user.password)
    if (!isValidPassword) return res.status(401).json({ error: 'Current password is incorrect' })
    
    await user.update({ password: newPassword })
    
    res.json({ message: 'Password changed successfully' })
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
