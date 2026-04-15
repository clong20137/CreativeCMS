import express from 'express'
import jwt from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'
import nodemailer from 'nodemailer'
import crypto from 'crypto'
import User from '../models/User.js'
import { verifyTurnstileToken } from '../utils/turnstile.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

function signAuthToken(user) {
  return jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
}

function signTwoFactorToken(user) {
  return jwt.sign({ userId: user.id, purpose: 'two-factor' }, JWT_SECRET, { expiresIn: '10m' })
}

function signPasswordResetToken(user) {
  return jwt.sign({ userId: user.id, purpose: 'password-reset' }, JWT_SECRET, { expiresIn: '15m' })
}

function createTwoFactorCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Encode(buffer) {
  let bits = ''
  let output = ''
  for (const byte of buffer) bits += byte.toString(2).padStart(8, '0')
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, '0')
    output += base32Alphabet[parseInt(chunk, 2)]
  }
  return output
}

function base32Decode(secret) {
  const clean = secret.replace(/=+$/g, '').toUpperCase().replace(/[^A-Z2-7]/g, '')
  let bits = ''
  for (const char of clean) bits += base32Alphabet.indexOf(char).toString(2).padStart(5, '0')
  const bytes = []
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2))
  return Buffer.from(bytes)
}

function generateTotp(secret, step = Math.floor(Date.now() / 30000)) {
  const key = base32Decode(secret)
  const buffer = Buffer.alloc(8)
  buffer.writeUInt32BE(0, 0)
  buffer.writeUInt32BE(step, 4)
  const hmac = crypto.createHmac('sha1', key).update(buffer).digest()
  const offset = hmac[hmac.length - 1] & 0xf
  const code = ((hmac[offset] & 0x7f) << 24)
    | ((hmac[offset + 1] & 0xff) << 16)
    | ((hmac[offset + 2] & 0xff) << 8)
    | (hmac[offset + 3] & 0xff)
  return String(code % 1000000).padStart(6, '0')
}

function verifyTotp(secret, code) {
  const currentStep = Math.floor(Date.now() / 30000)
  return [-1, 0, 1].some(offset => generateTotp(secret, currentStep + offset) === String(code))
}

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

async function sendTwoFactorCode(user, code) {
  const transporter = createTransporter()
  if (!transporter) return false

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Your Creative by Caleb sign-in code',
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`
  })

  return true
}

async function sendPasswordResetCode(user, code) {
  const transporter = createTransporter()
  if (!transporter) return false

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Reset your Creative by Caleb password',
    text: `Your password reset code is ${code}. It expires in 15 minutes.`,
    html: `<p>Your password reset code is <strong>${code}</strong>.</p><p>It expires in 15 minutes.</p>`
  })

  return true
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, company, turnstileToken } = req.body
    if (!await verifyTurnstileToken(turnstileToken, req.ip)) return res.status(400).json({ error: 'Captcha verification failed' })
    if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })
    
    const existingUser = await User.findOne({ where: { email } })
    if (existingUser) return res.status(400).json({ error: 'Email already exists' })
    
    const user = await User.create({ name, email, password, company, role: 'client' })
    
    const token = signAuthToken(user)
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, turnstileToken } = req.body
    if (!await verifyTurnstileToken(turnstileToken, req.ip)) return res.status(400).json({ error: 'Captcha verification failed' })
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })
    
    const user = await User.findOne({ where: { email } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    
    const isValidPassword = await bcryptjs.compare(password, user.password)
    if (!isValidPassword) return res.status(401).json({ error: 'Invalid credentials' })
    
    if (user.twoFactorEnabled) {
      if (user.twoFactorMethod === 'app' && user.twoFactorSecret) {
        return res.json({
          requiresTwoFactor: true,
          method: 'app',
          tempToken: signTwoFactorToken(user),
          message: 'Authenticator code required'
        })
      }

      const code = createTwoFactorCode()
      await user.update({
        twoFactorCode: code,
        twoFactorExpires: new Date(Date.now() + 10 * 60 * 1000)
      })

      const sent = await sendTwoFactorCode(user, code)
      if (!sent) return res.status(500).json({ error: 'Two-factor email is not configured' })

      return res.json({
        requiresTwoFactor: true,
        method: 'email',
        tempToken: signTwoFactorToken(user),
        message: 'Verification code sent'
      })
    }

    const token = signAuthToken(user)
    
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Verify two-factor code
router.post('/verify-2fa', async (req, res) => {
  try {
    const { tempToken, code } = req.body
    if (!tempToken || !code) return res.status(400).json({ error: 'Verification code is required' })

    const decoded = jwt.verify(tempToken, JWT_SECRET)
    if (decoded.purpose !== 'two-factor') return res.status(401).json({ error: 'Invalid verification session' })

    const user = await User.findByPk(decoded.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (user.twoFactorMethod === 'app' && user.twoFactorSecret) {
      if (!verifyTotp(user.twoFactorSecret, code)) return res.status(401).json({ error: 'Invalid verification code' })
    } else {
      if (!user.twoFactorCode || user.twoFactorCode !== code) return res.status(401).json({ error: 'Invalid verification code' })
      if (!user.twoFactorExpires || new Date(user.twoFactorExpires).getTime() < Date.now()) {
        return res.status(401).json({ error: 'Verification code expired' })
      }
    }

    await user.update({ twoFactorCode: null, twoFactorExpires: null })
    const token = signAuthToken(user)

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    })
  } catch (error) {
    res.status(401).json({ error: 'Invalid verification session' })
  }
})

export { base32Encode, verifyTotp }

router.post('/forgot-password', async (req, res) => {
  try {
    const { email, turnstileToken } = req.body
    if (!await verifyTurnstileToken(turnstileToken, req.ip)) return res.status(400).json({ error: 'Captcha verification failed' })
    const user = await User.findOne({ where: { email } })

    if (!user) {
      return res.json({ message: 'If an account exists, a reset code was sent' })
    }

    const code = createTwoFactorCode()
    await user.update({
      passwordResetCode: code,
      passwordResetExpires: new Date(Date.now() + 15 * 60 * 1000)
    })

    const sent = await sendPasswordResetCode(user, code)
    if (!sent) return res.status(500).json({ error: 'Password reset email is not configured' })

    res.json({
      message: 'Password reset code sent',
      tempToken: signPasswordResetToken(user),
      requiresAuthenticator: user.twoFactorEnabled && user.twoFactorMethod === 'app'
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/reset-password', async (req, res) => {
  try {
    const { tempToken, resetCode, twoFactorCode, newPassword } = req.body
    if (!tempToken || !resetCode || !newPassword) {
      return res.status(400).json({ error: 'Reset code and new password are required' })
    }
    if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })

    const decoded = jwt.verify(tempToken, JWT_SECRET)
    if (decoded.purpose !== 'password-reset') return res.status(401).json({ error: 'Invalid reset session' })

    const user = await User.findByPk(decoded.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (!user.passwordResetCode || user.passwordResetCode !== resetCode) return res.status(401).json({ error: 'Invalid reset code' })
    if (!user.passwordResetExpires || new Date(user.passwordResetExpires).getTime() < Date.now()) {
      return res.status(401).json({ error: 'Reset code expired' })
    }

    if (user.twoFactorEnabled && user.twoFactorMethod === 'app' && user.twoFactorSecret) {
      if (!verifyTotp(user.twoFactorSecret, twoFactorCode || '')) {
        return res.status(401).json({ error: 'Invalid authenticator code' })
      }
    }

    await user.update({
      password: newPassword,
      passwordResetCode: null,
      passwordResetExpires: null,
      twoFactorCode: null,
      twoFactorExpires: null
    })

    res.json({ message: 'Password reset successful' })
  } catch (error) {
    res.status(401).json({ error: 'Invalid reset session' })
  }
})

// Get Current User
router.get('/me', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No token provided' })
    
    const decoded = jwt.verify(token, JWT_SECRET)
    res.json({ userId: decoded.userId, role: decoded.role })
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
})

export default router
