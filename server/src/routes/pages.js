import express from 'express'
import { DataTypes } from 'sequelize'
import crypto from 'crypto'
import CustomPage from '../models/CustomPage.js'

const router = express.Router()
let customPagesSchemaReady = false

async function ensureCustomPagesSchema() {
  if (customPagesSchemaReady) return

  const queryInterface = CustomPage.sequelize.getQueryInterface()
  const table = await queryInterface.describeTable('CustomPages').catch(() => null)
  if (!table) return

  if (!table.showPageHeader) {
    try {
      await queryInterface.addColumn('CustomPages', 'showPageHeader', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      })
    } catch (error) {
      const message = String(error?.message || '')
      if (!message.includes('Duplicate column')) throw error
    }
  }

  if (!table.previewToken) {
    try {
      await queryInterface.addColumn('CustomPages', 'previewToken', {
        type: DataTypes.STRING,
        allowNull: true
      })
    } catch (error) {
      const message = String(error?.message || '')
      if (!message.includes('Duplicate column')) throw error
    }
  }

  if (!table.ownerClientId) {
    try {
      await queryInterface.addColumn('CustomPages', 'ownerClientId', {
        type: DataTypes.INTEGER,
        allowNull: true
      })
    } catch (error) {
      const message = String(error?.message || '')
      if (!message.includes('Duplicate column')) throw error
    }
  }

  customPagesSchemaReady = true
}

function makePreviewToken() {
  return `${crypto.randomUUID().replace(/-/g, '')}${crypto.randomBytes(8).toString('hex')}`
}

async function ensurePagePreviewToken(page) {
  if (!page) return page
  if (page.previewToken) return page
  await page.update({ previewToken: makePreviewToken() })
  return page
}

router.get('/preview/:token', async (req, res) => {
  try {
    await ensureCustomPagesSchema()
    const token = String(req.params.token || '').trim()
    const page = await CustomPage.findOne({
      where: {
        previewToken: token
      }
    })

    if (!page) return res.status(404).json({ error: 'Preview page not found' })
    await ensurePagePreviewToken(page)
    res.json(page)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:slug', async (req, res) => {
  try {
    await ensureCustomPagesSchema()
    const page = await CustomPage.findOne({
      where: {
        slug: req.params.slug,
        isPublished: true
      }
    })

    if (!page) return res.status(404).json({ error: 'Page not found' })
    await ensurePagePreviewToken(page)
    res.json(page)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
