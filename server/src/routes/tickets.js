import express from 'express'
import jwt from 'jsonwebtoken'
import Ticket from '../models/Ticket.js'
import User from '../models/User.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No token provided' })
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    req.role = decoded.role
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

router.get('/client', verifyToken, async (req, res) => {
  try {
    const tickets = await Ticket.findAll({
      where: { clientId: req.userId },
      order: [['createdAt', 'DESC']]
    })
    res.json(tickets)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', verifyToken, async (req, res) => {
  try {
    const ticket = await Ticket.create({
      clientId: req.userId,
      subject: req.body.subject,
      message: req.body.message,
      priority: req.body.priority || 'normal'
    })
    res.status(201).json(ticket)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/admin', verifyToken, async (req, res) => {
  try {
    if (req.role !== 'admin') return res.status(403).json({ error: 'Admin access required' })
    const tickets = await Ticket.findAll({
      include: [{ model: User, attributes: ['id', 'name', 'email', 'company'] }],
      order: [['createdAt', 'DESC']]
    })
    res.json(tickets)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', verifyToken, async (req, res) => {
  try {
    if (req.role !== 'admin') return res.status(403).json({ error: 'Admin access required' })
    const ticket = await Ticket.findByPk(req.params.id)
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' })
    await ticket.update(req.body)
    res.json(ticket)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
