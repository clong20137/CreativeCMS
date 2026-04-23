import express from 'express'
import Project from '../models/Project.js'
import { ensureActiveUser, requireRole, requireSelfOrAdmin, verifyToken } from '../utils/auth.js'

const router = express.Router()

// Get all projects for a client
router.get('/client/:clientId', verifyToken, ensureActiveUser, requireSelfOrAdmin((req) => req.params.clientId), async (req, res) => {
  try {
    const projects = await Project.findAll({
      where: { clientId: req.params.clientId },
      order: [['createdAt', 'DESC']]
    })
    res.json(projects)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get single project
router.get('/:id', verifyToken, ensureActiveUser, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id)
    if (!project) return res.status(404).json({ error: 'Project not found' })
    if (req.userRole !== 'admin' && String(project.clientId) !== String(req.userId)) {
      return res.status(403).json({ error: 'You do not have access to this project' })
    }
    res.json(project)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create project
router.post('/', verifyToken, ensureActiveUser, requireRole('admin'), async (req, res) => {
  try {
    const project = await Project.create(req.body)
    res.status(201).json(project)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update project
router.put('/:id', verifyToken, ensureActiveUser, requireRole('admin'), async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id)
    if (!project) return res.status(404).json({ error: 'Project not found' })
    await project.update(req.body)
    res.json(project)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete project
router.delete('/:id', verifyToken, ensureActiveUser, requireRole('admin'), async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id)
    if (!project) return res.status(404).json({ error: 'Project not found' })
    await project.destroy()
    res.json({ message: 'Project deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
