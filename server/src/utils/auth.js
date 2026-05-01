import jwt from 'jsonwebtoken'
import { DataTypes } from 'sequelize'
import User from '../models/User.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
let builderUserSchemaReady = false

async function ensureBuilderUserSchema() {
  if (builderUserSchemaReady) return

  const queryInterface = User.sequelize.getQueryInterface()
  const table = await queryInterface.describeTable('Users').catch(() => null)
  if (!table) return

  const addColumn = async (name, config) => {
    if (table[name]) return
    await queryInterface.addColumn('Users', name, config).catch((error) => {
      if (!String(error?.message || '').includes('Duplicate column')) throw error
    })
  }

  await addColumn('ownerClientId', {
    type: DataTypes.INTEGER,
    allowNull: true
  })

  await addColumn('cmsLicenseId', {
    type: DataTypes.INTEGER,
    allowNull: true
  })

  await queryInterface.changeColumn('Users', 'role', {
    type: DataTypes.ENUM('admin', 'client', 'builder'),
    allowNull: false,
    defaultValue: 'client'
  }).catch((error) => {
    const message = String(error?.message || '')
    if (!message.includes('Duplicate column')) throw error
  })

  builderUserSchemaReady = true
}

export function verifyToken(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No token provided' })

    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    req.userRole = decoded.role
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export async function ensureActiveUser(req, res, next) {
  try {
    await ensureBuilderUserSchema()
    const user = await User.findByPk(req.userId, { attributes: ['id', 'role', 'isActive', 'ownerClientId', 'cmsLicenseId'] })
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (user.isActive === false) {
      return res.status(403).json({ error: 'This account has been disabled. Please contact support.' })
    }

    req.userRole = req.userRole || user.role
    req.activeUser = user
    next()
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ error: `${roles[0] === 'admin' ? 'Admin' : 'Authorized'} access required` })
    }
    next()
  }
}

export function requireSelfOrAdmin(getTargetUserId) {
  return (req, res, next) => {
    const targetUserId = String(typeof getTargetUserId === 'function' ? getTargetUserId(req) : getTargetUserId)
    if (req.userRole === 'admin' || String(req.userId) === targetUserId) {
      return next()
    }
    return res.status(403).json({ error: 'You do not have access to this resource' })
  }
}
