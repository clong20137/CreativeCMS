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

export async function getOrCreateTowingTransportSiteDemo() {
  const [demo] = await SiteDemo.findOrCreate({
    where: { slug: 'towing-transport' },
    defaults: {
      slug: 'towing-transport',
      name: 'Towing & Heavy Transport Demo',
      category: 'Transportation',
      description: 'A 24/7 towing, recovery, crane, and heavy transport website demo for service companies.',
      previewImage: 'https://unsplash.com/photos/qlx6GLKvgHw/download?force=true',
      demoUrl: '/site-demos/towing-transport',
      isActive: true,
      sortOrder: 20
    }
  })

  return demo
}

export async function getOrCreateBarbershopSiteDemo() {
  const [demo] = await SiteDemo.findOrCreate({
    where: { slug: 'barbershop' },
    defaults: {
      slug: 'barbershop',
      name: 'Barbershop Demo',
      category: 'Barbershop',
      description: 'A modern barbershop website demo for cuts, beard trims, memberships, and booking.',
      previewImage: 'https://unsplash.com/photos/k6RsU8om2UE/download?force=true',
      demoUrl: '/site-demos/barbershop',
      isActive: true,
      sortOrder: 30
    }
  })

  return demo
}

export async function getOrCreateRealEstateSiteDemo() {
  const [demo] = await SiteDemo.findOrCreate({
    where: { slug: 'real-estate' },
    defaults: {
      slug: 'real-estate',
      name: 'Real Estate Demo',
      category: 'Real Estate',
      description: 'A real estate website demo for featured listings, neighborhood guides, agents, and lead capture.',
      previewImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      demoUrl: '/site-demos/real-estate',
      isActive: true,
      sortOrder: 40
    }
  })

  return demo
}

export async function getOrCreateElectricianSiteDemo() {
  const [demo] = await SiteDemo.findOrCreate({
    where: { slug: 'electrician' },
    defaults: {
      slug: 'electrician',
      name: 'Electrician Demo',
      category: 'Home Services',
      description: 'A residential and commercial electrician website demo for emergency calls, service panels, lighting, and quote requests.',
      previewImage: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=80',
      demoUrl: '/site-demos/electrician',
      isActive: true,
      sortOrder: 50
    }
  })

  return demo
}

export async function getOrCreateMowingBusinessSiteDemo() {
  const [demo] = await SiteDemo.findOrCreate({
    where: { slug: 'mowing-business' },
    defaults: {
      slug: 'mowing-business',
      name: 'Mowing Business Demo',
      category: 'Lawn Care',
      description: 'A lawn mowing and property care website demo for recurring service plans, seasonal cleanup, and quote requests.',
      previewImage: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&w=1200&q=80',
      demoUrl: '/site-demos/mowing-business',
      isActive: true,
      sortOrder: 60
    }
  })

  return demo
}

export async function getOrCreateGolfSiteDemo() {
  const [demo] = await SiteDemo.findOrCreate({
    where: { slug: 'golf' },
    defaults: {
      slug: 'golf',
      name: 'Golf Demo',
      category: 'Sports & Recreation',
      description: 'A golf website demo for tee times, lessons, memberships, tournaments, and clubhouse events.',
      previewImage: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1200&q=80',
      demoUrl: '/site-demos/golf',
      isActive: true,
      sortOrder: 70
    }
  })

  return demo
}

export async function getOrCreateCornholeSiteDemo() {
  const [demo] = await SiteDemo.findOrCreate({
    where: { slug: 'cornhole' },
    defaults: {
      slug: 'cornhole',
      name: 'Cornhole Demo',
      category: 'Events & Recreation',
      description: 'A cornhole website demo for leagues, tournaments, social nights, sponsors, and registration.',
      previewImage: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1200&q=80',
      demoUrl: '/site-demos/cornhole',
      isActive: true,
      sortOrder: 80
    }
  })

  return demo
}

export async function ensureSiteDemos() {
  await getOrCreateRestaurantSiteDemo()
  await getOrCreateTowingTransportSiteDemo()
  await getOrCreateBarbershopSiteDemo()
  await getOrCreateRealEstateSiteDemo()
  await getOrCreateElectricianSiteDemo()
  await getOrCreateMowingBusinessSiteDemo()
  await getOrCreateGolfSiteDemo()
  await getOrCreateCornholeSiteDemo()
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
