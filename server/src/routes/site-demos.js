import express from 'express'
import SiteDemo from '../models/SiteDemo.js'

const router = express.Router()

export async function getOrCreateRestaurantSiteDemo() {
  const [demo] = await SiteDemo.findOrCreate({
    where: { slug: 'restaurant' },
    defaults: {
      slug: 'restaurant',
      name: 'Restaurant Demo',
      category: 'Restaurant',
      description: 'A polished restaurant website demo powered by the editable Menu plugin.',
      previewImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      demoUrl: '/site-demos/restaurant',
      isActive: true,
      sortOrder: 10
    }
  })

  return demo
}

export async function ensureSiteDemos() {
  await getOrCreateRestaurantSiteDemo()
}

router.get('/', async (req, res) => {
  try {
    await ensureSiteDemos()
    const demos = await SiteDemo.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC'], ['name', 'ASC']]
    })
    res.json(demos)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:slug', async (req, res) => {
  try {
    await ensureSiteDemos()
    const demo = await SiteDemo.findOne({
      where: {
        slug: req.params.slug,
        isActive: true
      }
    })
    if (!demo) return res.status(404).json({ error: 'Site demo not found' })
    res.json(demo)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
