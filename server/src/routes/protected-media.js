import express from 'express'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import jwt from 'jsonwebtoken'
import { DataTypes } from 'sequelize'
import MediaAsset from '../models/MediaAsset.js'
import ProtectedContentItem from '../models/ProtectedContentItem.js'
import ProtectedContentPurchase from '../models/ProtectedContentPurchase.js'
import User from '../models/User.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const privateUploadsDir = path.resolve(__dirname, '../../private-uploads')

let protectedMediaSchemaReady = false

async function ensureProtectedMediaSchema() {
  if (protectedMediaSchemaReady) return

  const mediaQueryInterface = MediaAsset.sequelize.getQueryInterface()
  const mediaTable = await mediaQueryInterface.describeTable('MediaAssets').catch(() => null)
  if (mediaTable && !mediaTable.visibility) {
    await mediaQueryInterface.addColumn('MediaAssets', 'visibility', {
      type: DataTypes.ENUM('public', 'private'),
      allowNull: true,
      defaultValue: 'public'
    }).catch(error => {
      if (!String(error?.message || '').includes('Duplicate column')) throw error
    })
  }

  const contentQueryInterface = ProtectedContentItem.sequelize.getQueryInterface()
  const contentTable = await contentQueryInterface.describeTable('ProtectedContentItems').catch(() => null)
  if (contentTable && !contentTable.mediaAssetId) {
    await contentQueryInterface.addColumn('ProtectedContentItems', 'mediaAssetId', {
      type: DataTypes.INTEGER,
      allowNull: true
    }).catch(error => {
      if (!String(error?.message || '').includes('Duplicate column')) throw error
    })
  }

  protectedMediaSchemaReady = true
}

function verifyAccessToken(req) {
  const token = req.headers.authorization?.split(' ')[1] || req.query.token
  if (!token) return null

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return ['client', 'admin'].includes(decoded.role) ? decoded : null
  } catch (error) {
    return null
  }
}

router.get('/:assetId', async (req, res) => {
  try {
    await ensureProtectedMediaSchema()
    const decoded = verifyAccessToken(req)
    if (!decoded) return res.status(401).json({ error: 'Login required' })
    const user = await User.findByPk(decoded.userId, { attributes: ['id', 'isActive'] })
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (user.isActive === false) return res.status(403).json({ error: 'This account has been disabled. Please contact support.' })

    const asset = await MediaAsset.findOne({
      where: { id: req.params.assetId, visibility: 'private' }
    })
    if (!asset) return res.status(404).json({ error: 'Private media not found' })

    if (decoded.role !== 'admin') {
      const item = await ProtectedContentItem.findOne({
        where: { mediaAssetId: asset.id, isActive: true }
      })
      if (!item) return res.status(403).json({ error: 'This private media is not attached to purchasable content' })

      const purchase = await ProtectedContentPurchase.findOne({
        where: { clientId: decoded.userId, contentItemId: item.id, status: 'active' }
      })
      if (!purchase) return res.status(403).json({ error: 'Purchase required to view this media' })
    }

    const filePath = path.join(privateUploadsDir, asset.filename)
    await fs.access(filePath)
    res.setHeader('Content-Type', asset.mimeType)
    res.setHeader('Cache-Control', 'private, no-store')
    res.sendFile(filePath)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
