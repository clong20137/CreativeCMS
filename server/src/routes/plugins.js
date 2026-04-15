import express from 'express'
import Plugin from '../models/Plugin.js'
import RestaurantMenuItem from '../models/RestaurantMenuItem.js'

const router = express.Router()

export async function getOrCreateRestaurantPlugin() {
  const [plugin] = await Plugin.findOrCreate({
    where: { slug: 'restaurant-menu' },
    defaults: {
      slug: 'restaurant-menu',
      name: 'Restaurant Menu',
      description: 'Create menu categories, item photos, descriptions, and prices for a restaurant website.',
      category: 'Restaurant',
      isEnabled: true,
      isPurchased: true,
      demoUrl: '/plugins/restaurant'
    }
  })

  const itemCount = await RestaurantMenuItem.count()
  if (itemCount === 0) {
    await RestaurantMenuItem.bulkCreate([
      {
        name: 'Harvest Bowl',
        description: 'Roasted vegetables, greens, grains, citrus vinaigrette, and toasted seeds.',
        category: 'Entrees',
        price: 14.5,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80',
        sortOrder: 1
      },
      {
        name: 'Wood Fired Pizza',
        description: 'Tomato, mozzarella, basil, olive oil, and a crisp blistered crust.',
        category: 'Entrees',
        price: 17,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80',
        sortOrder: 2
      },
      {
        name: 'Chocolate Tart',
        description: 'Dark chocolate ganache, sea salt, berry compote, and whipped cream.',
        category: 'Desserts',
        price: 9,
        image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=900&q=80',
        sortOrder: 3
      }
    ])
  }

  return plugin
}

router.get('/', async (req, res) => {
  try {
    await getOrCreateRestaurantPlugin()
    const plugins = await Plugin.findAll({ order: [['name', 'ASC']] })
    res.json(plugins)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/restaurant/menu', async (req, res) => {
  try {
    const plugin = await getOrCreateRestaurantPlugin()
    const items = await RestaurantMenuItem.findAll({
      where: { isAvailable: true },
      order: [['category', 'ASC'], ['sortOrder', 'ASC'], ['name', 'ASC']]
    })

    res.json({ plugin, items })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
