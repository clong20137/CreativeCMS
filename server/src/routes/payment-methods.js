import express from 'express'
import jwt from 'jsonwebtoken'

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

// In-memory storage for payment methods (replace with database in production)
const paymentMethods = new Map()

// Get all payment methods for user
router.get('/', verifyToken, async (req, res) => {
  try {
    const userMethods = paymentMethods.get(req.userId) || []
    res.json(userMethods)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Add new payment method
router.post('/', verifyToken, async (req, res) => {
  try {
    const { cardNumber, cardHolder, expiryMonth, expiryYear, cvv, isDefault } = req.body
    
    if (!cardNumber || !cardHolder || !expiryMonth || !expiryYear) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    
    const paymentMethod = {
      id: Math.random().toString(36).substr(2, 9),
      cardNumber: `****${cardNumber.slice(-4)}`,
      cardHolder,
      expiryMonth,
      expiryYear,
      lastFour: cardNumber.slice(-4),
      cardType: getCardType(cardNumber),
      isDefault: isDefault || false,
      createdAt: new Date()
    }
    
    const userMethods = paymentMethods.get(req.userId) || []
    
    // If setting as default, remove default from others
    if (isDefault) {
      userMethods.forEach(m => m.isDefault = false)
    }
    
    userMethods.push(paymentMethod)
    paymentMethods.set(req.userId, userMethods)
    
    res.status(201).json({ message: 'Payment method added', paymentMethod })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update payment method
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { isDefault, cardHolder, expiryMonth, expiryYear } = req.body
    const userMethods = paymentMethods.get(req.userId) || []
    
    const method = userMethods.find(m => m.id === req.params.id)
    if (!method) return res.status(404).json({ error: 'Payment method not found' })
    
    if (isDefault) {
      userMethods.forEach(m => m.isDefault = false)
    }
    
    method.isDefault = isDefault || method.isDefault
    method.cardHolder = cardHolder || method.cardHolder
    method.expiryMonth = expiryMonth || method.expiryMonth
    method.expiryYear = expiryYear || method.expiryYear
    
    paymentMethods.set(req.userId, userMethods)
    
    res.json({ message: 'Payment method updated', paymentMethod: method })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete payment method
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const existingMethods = paymentMethods.get(req.userId) || []
    let userMethods = existingMethods
    userMethods = userMethods.filter(m => m.id !== req.params.id)
    
    if (userMethods.length === existingMethods.length) {
      return res.status(404).json({ error: 'Payment method not found' })
    }
    
    paymentMethods.set(req.userId, userMethods)
    res.json({ message: 'Payment method deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Set default payment method
router.put('/:id/default', verifyToken, async (req, res) => {
  try {
    const userMethods = paymentMethods.get(req.userId) || []
    
    userMethods.forEach(method => {
      method.isDefault = method.id === req.params.id
    })
    
    paymentMethods.set(req.userId, userMethods)
    
    res.json({ message: 'Default payment method updated' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Helper function to determine card type
function getCardType(cardNumber) {
  const num = cardNumber.replace(/\D/g, '')
  if (/^4[0-9]{12}(?:[0-9]{3})?$/.test(num)) return 'Visa'
  if (/^5[1-5][0-9]{14}$/.test(num)) return 'Mastercard'
  if (/^3[47][0-9]{13}$/.test(num)) return 'American Express'
  if (/^6(?:011|5[0-9]{2})[0-9]{12}$/.test(num)) return 'Discover'
  return 'Unknown'
}

export default router
