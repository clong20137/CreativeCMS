import express from 'express'
import { DataTypes } from 'sequelize'
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

  customPagesSchemaReady = true
}

router.get('/:slug', async (req, res) => {
  try {
    await ensureCustomPagesSchema()
    const page = await CustomPage.findOne({
      where: {
        slug: req.params.slug
      }
    })

    if (!page) return res.status(404).json({ error: 'Page not found' })
    res.json(page)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
