import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiCamera, FiCheck, FiMail, FiMapPin, FiMonitor, FiPenTool, FiPhone, FiVideo } from 'react-icons/fi'
import Testimonials from './Testimonials'
import TurnstileWidget from './TurnstileWidget'
import { contactMessagesAPI, pluginsAPI, portfolioAPI, resolveAssetUrl, servicePackagesAPI, siteDemosAPI, siteSettingsAPI } from '../services/api'

const pluginLabels: Record<string, string> = {
  restaurant: 'Restaurant Menu',
  'real-estate': 'Real Estate Listings',
  booking: 'Booking Appointments',
  events: 'Events',
  'protected-content': 'Protected Content',
  plugins: 'Website Plugins'
}

const columnClasses: Record<number, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-2 lg:grid-cols-4',
  5: 'md:grid-cols-2 lg:grid-cols-5',
  6: 'md:grid-cols-3 lg:grid-cols-6'
}

export default function PageSections({ sections }: { sections?: any[] }) {
  const visibleSections = Array.isArray(sections) ? sections : []
  if (visibleSections.length === 0) return null

  return (
    <div>
      {visibleSections.map((section, index) => (
        <div key={section.id || index} className="page-section-render" style={getSectionSpacingStyle(section)}>
          <PageSection section={section} />
        </div>
      ))}
    </div>
  )
}

function getSectionSpacingStyle(section: any) {
  const toPixels = (value: any) => {
    if (value === '' || value === null || value === undefined) return undefined
    const number = Number(value)
    return Number.isFinite(number) ? `${number}px` : undefined
  }

  return {
    marginTop: toPixels(section.marginTop),
    marginRight: toPixels(section.marginRight),
    marginBottom: toPixels(section.marginBottom),
    marginLeft: toPixels(section.marginLeft),
    paddingTop: toPixels(section.paddingTop),
    paddingRight: toPixels(section.paddingRight),
    paddingBottom: toPixels(section.paddingBottom),
    paddingLeft: toPixels(section.paddingLeft),
    backgroundColor: section.backgroundColor || undefined,
    color: section.textColor || undefined,
    boxShadow: section.boxShadow || undefined,
    borderWidth: toPixels(section.borderWidth),
    borderColor: section.borderColor || undefined,
    borderStyle: section.borderWidth ? (section.borderStyle || 'solid') : undefined,
    borderTopLeftRadius: toPixels(section.borderTopLeftRadius),
    borderTopRightRadius: toPixels(section.borderTopRightRadius),
    borderBottomRightRadius: toPixels(section.borderBottomRightRadius),
    borderBottomLeftRadius: toPixels(section.borderBottomLeftRadius),
    overflow: (section.borderTopLeftRadius || section.borderTopRightRadius || section.borderBottomRightRadius || section.borderBottomLeftRadius) ? 'hidden' : undefined,
    '--section-heading-color': section.headingColor || undefined,
    '--section-text-color': section.textColor || undefined,
    '--section-button-bg': section.buttonBackgroundColor || undefined,
    '--section-button-text': section.buttonTextColor || undefined
  } as CSSProperties
}

function PageSection({ section }: { section: any }) {
  if (section.type === 'banner') {
    return (
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-800 py-20 text-white md:py-28">
        {section.imageUrl && <img src={resolveAssetUrl(section.imageUrl)} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-blue-950/55"></div>
        <div className="container relative">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-bold md:text-6xl">{section.title}</h2>
            {section.body && <p className="mt-6 text-xl text-blue-100 whitespace-pre-line">{section.body}</p>}
            {section.buttonLabel && section.buttonUrl && (
              <Link to={section.buttonUrl} className="btn-primary mt-8 inline-flex">
                {section.buttonLabel}
              </Link>
            )}
          </div>
        </div>
      </section>
    )
  }

  if (section.type === 'header') {
    return (
      <section className="section-padding">
        <div className="container text-center">
          <h2 className="section-title">{section.title}</h2>
          {section.body && <p className="mx-auto -mt-8 max-w-3xl text-lg text-gray-600 whitespace-pre-line">{section.body}</p>}
        </div>
      </section>
    )
  }

  if (section.type === 'image') {
    return (
      <section className="section-padding">
        <div className="container max-w-5xl">
          <figure>
            <img src={resolveAssetUrl(section.imageUrl)} alt={section.alt || section.title || ''} className="w-full rounded-lg object-cover" />
            {(section.title || section.body) && (
              <figcaption className="mt-3 text-sm text-gray-600">
                {section.title && <strong className="text-gray-900">{section.title}</strong>} {section.body}
              </figcaption>
            )}
          </figure>
        </div>
      </section>
    )
  }

  if (section.type === 'plugin') return <EmbeddedPluginSection section={section} />
  if (section.type === 'testimonials') return <TestimonialsSection />
  if (section.type === 'portfolio') return <PortfolioSection section={section} />
  if (section.type === 'services') return <ServicesSection section={section} />
  if (section.type === 'hero') return <HeroSection section={section} />
  if (section.type === 'columns') return <ColumnsSection section={section} />
  if (section.type === 'imageCards') return <ImageCardsSection section={section} />
  if (section.type === 'imageOverlay') return <ImageOverlaySection section={section} />
  if (section.type === 'gallery') return <GallerySection section={section} />
  if (section.type === 'whatWeDo') return <WhatWeDoSection section={section} />
  if (section.type === 'featuredWork') return <FeaturedWorkSection section={section} />
  if (section.type === 'portfolioGallery') return <PortfolioGallerySection section={section} />
  if (section.type === 'servicesList') return <ServicesListSection section={section} />
  if (section.type === 'pricingPackages') return <PricingPackagesSection section={section} />
  if (section.type === 'servicePricing') return <ServicePricingSection section={section} />
  if (section.type === 'faq') return <FaqSection section={section} />
  if (section.type === 'pluginsList') return <PluginsListSection section={section} />
  if (section.type === 'siteDemos') return <SiteDemosSection section={section} />
  if (section.type === 'contactForm') return <ContactFormSection />
  if (section.type === 'cta') return <CtaSection section={section} />

  if (section.type === 'section') {
    return (
      <section className="section-padding">
        <div className="container">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-center">
            <div>
              {section.title && <h2 className="text-3xl font-bold text-gray-900">{section.title}</h2>}
              {section.body && <p className="mt-3 text-gray-600 whitespace-pre-line">{section.body}</p>}
            </div>
            {section.imageUrl && <img src={resolveAssetUrl(section.imageUrl)} alt={section.alt || section.title || ''} className="w-full rounded-lg object-cover" />}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section-padding">
      <div className="container max-w-4xl">
        <p className="text-lg leading-relaxed text-gray-700 whitespace-pre-line">{section.body}</p>
      </div>
    </section>
  )
}

function ColumnsSection({ section }: { section: any }) {
  const columns = Array.isArray(section.items) ? section.items : []
  const count = Number(section.columns || columns.length || 2)

  return (
    <section className="py-16">
      <div className="container">
        <SectionHeading section={section} fallbackTitle="" />
        <div className={`grid grid-cols-1 gap-6 ${columnClasses[count] || columnClasses[2]}`}>
          {columns.slice(0, count).map((column: any, index: number) => (
            <div key={column.id || index} className="space-y-5">
              {(column.sections || []).map((block: any, blockIndex: number) => (
                <ColumnBlock key={block.id || blockIndex} block={block} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ColumnBlock({ block }: { block: any }) {
  if (block.type === 'header') {
    return (
      <div>
        {block.title && <h3 className="text-2xl font-bold text-gray-900">{block.title}</h3>}
        {block.body && <p className="mt-2 text-gray-600 whitespace-pre-line">{block.body}</p>}
      </div>
    )
  }

  if (block.type === 'image') {
    return block.imageUrl ? <img src={resolveAssetUrl(block.imageUrl)} alt={block.alt || block.title || ''} className="w-full rounded-lg object-cover" /> : null
  }

  if (block.type === 'imageCard') {
    return <ImageCard item={block} />
  }

  return <p className="text-gray-700 whitespace-pre-line">{block.body}</p>
}

function ImageCardsSection({ section }: { section: any }) {
  const items = Array.isArray(section.items) ? section.items : []

  return (
    <section className="py-16">
      <div className="container">
        <SectionHeading section={section} fallbackTitle="Image Cards" />
        <div className={`grid grid-cols-1 gap-8 ${columnClasses[Number(section.columns || 2)] || columnClasses[2]}`}>
          {items.map((item: any, index: number) => <ImageCard key={item.id || index} item={item} />)}
          {items.length === 0 && <div className="rounded-lg border p-6 text-center text-gray-600 md:col-span-2">No image cards have been added yet.</div>}
        </div>
      </div>
    </section>
  )
}

function ImageCard({ item }: { item: any }) {
  return (
    <article className="card overflow-hidden">
      {item.image && <img src={resolveAssetUrl(item.image)} alt={item.title || ''} className="h-64 w-full object-cover" />}
      {item.imageUrl && !item.image && <img src={resolveAssetUrl(item.imageUrl)} alt={item.title || ''} className="h-64 w-full object-cover" />}
      <div className="p-6">
        {(item.category || item.subtitle) && <p className="text-sm font-semibold text-blue-600">{item.category || item.subtitle}</p>}
        {item.title && <h3 className="mt-2 text-2xl font-bold text-gray-900">{item.title}</h3>}
        {(item.description || item.body) && <p className="mt-3 text-gray-600">{item.description || item.body}</p>}
        {item.buttonLabel && item.buttonUrl && (
          <Link to={item.buttonUrl} className="mt-5 inline-flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-800">
            {item.buttonLabel} <FiArrowRight />
          </Link>
        )}
      </div>
    </article>
  )
}

function ImageOverlaySection({ section }: { section: any }) {
  return (
    <section className="relative min-h-[30rem] overflow-hidden bg-gray-950 text-white">
      {section.imageUrl && <img src={resolveAssetUrl(section.imageUrl)} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      <div className="absolute inset-0 bg-black/55"></div>
      <div className="container relative flex min-h-[30rem] items-center py-16">
        <div className="max-w-2xl">
          {section.title && <h2 className="text-4xl font-bold md:text-6xl">{section.title}</h2>}
          {section.body && <p className="mt-5 text-lg text-gray-100 whitespace-pre-line md:text-xl">{section.body}</p>}
          {section.buttonLabel && section.buttonUrl && <Link to={section.buttonUrl} className="btn-primary mt-8 inline-flex">{section.buttonLabel}</Link>}
        </div>
      </div>
    </section>
  )
}

function GallerySection({ section }: { section: any }) {
  const items = Array.isArray(section.items) ? section.items : []

  return (
    <section className="py-16">
      <div className="container">
        <SectionHeading section={section} fallbackTitle="Gallery" />
        <div className={`grid grid-cols-1 gap-4 ${columnClasses[Number(section.columns || 3)] || columnClasses[3]}`}>
          {items.map((item: any, index: number) => (
            <figure key={item.id || index} className="group overflow-hidden rounded-lg bg-gray-100">
              {item.image && <img src={resolveAssetUrl(item.image)} alt={item.title || section.title || ''} className="h-72 w-full object-cover transition duration-300 group-hover:scale-105" />}
              {(item.title || item.description) && (
                <figcaption className="p-4">
                  {item.title && <h3 className="font-bold text-gray-900">{item.title}</h3>}
                  {item.description && <p className="mt-1 text-sm text-gray-600">{item.description}</p>}
                </figcaption>
              )}
            </figure>
          ))}
          {items.length === 0 && <div className="rounded-lg border p-6 text-center text-gray-600 md:col-span-2 lg:col-span-3">No gallery images have been added yet.</div>}
        </div>
      </div>
    </section>
  )
}

function HeroSection({ section }: { section: any }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-800 py-20 text-white md:py-32">
      {section.imageUrl && section.mediaType !== 'video' && <img src={resolveAssetUrl(section.imageUrl)} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      {section.imageUrl && section.mediaType === 'video' && <video src={resolveAssetUrl(section.imageUrl)} className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline />}
      <div className="absolute inset-0 bg-blue-950/55"></div>
      <div className="container relative">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold md:text-6xl">{section.title}</h1>
          {section.body && <p className="mt-6 text-xl text-blue-100 md:text-2xl whitespace-pre-line">{section.body}</p>}
          <div className="mt-8 flex flex-wrap gap-4">
            {section.buttonLabel && section.buttonUrl && <Link to={section.buttonUrl} className="btn-primary inline-flex items-center gap-2">{section.buttonLabel} <FiArrowRight /></Link>}
            {section.secondaryButtonLabel && section.secondaryButtonUrl && <Link to={section.secondaryButtonUrl} className="btn-secondary inline-flex">{section.secondaryButtonLabel}</Link>}
          </div>
        </div>
      </div>
    </section>
  )
}

function WhatWeDoSection({ section }: { section: any }) {
  const items = Array.isArray(section.items) ? section.items : []
  return (
    <section className="py-16 bg-gray-50">
      <div className="container">
        <SectionHeading section={section} fallbackTitle="What We Do" />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {items.map((item: any, index: number) => (
            <div key={item.id || index} className="card p-8">
              {item.image && <img src={resolveAssetUrl(item.image)} alt={item.title} className="mb-4 h-32 w-full rounded-lg object-cover" />}
              <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
              <p className="mt-3 text-gray-600">{item.desc || item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturedWorkSection({ section }: { section: any }) {
  const items = Array.isArray(section.items) ? section.items : []
  return (
    <section className="py-16">
      <div className="container">
        <SectionHeading section={section} fallbackTitle="Featured Work" />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {items.map((work: any, index: number) => (
            <div key={work.id || index} className="card overflow-hidden transition hover:shadow-2xl">
              {work.image && <img src={resolveAssetUrl(work.image)} alt={work.title} className="h-64 w-full object-cover transition-transform duration-300 hover:scale-105" />}
              <div className="p-6">
                <span className="text-sm font-semibold text-blue-600">{work.category}</span>
                <h3 className="mt-2 text-2xl font-bold text-gray-900">{work.title}</h3>
                <p className="mt-3 text-gray-600">{work.description}</p>
                <Link to={work.url || '/portfolio'} className="mt-4 flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-800">
                  {work.buttonLabel || 'View Case Study'} <FiArrowRight />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function SectionHeading({ section, fallbackTitle }: { section: any; fallbackTitle: string }) {
  if (!section.title && !section.body) return null

  return (
    <div className="mb-10 text-center">
      <h2 className="text-3xl font-bold text-gray-900">{section.title || fallbackTitle}</h2>
      {section.body && <p className="mx-auto mt-3 max-w-3xl text-gray-600 whitespace-pre-line">{section.body}</p>}
    </div>
  )
}

function TestimonialsSection() {
  return (
    <section>
      <Testimonials />
    </section>
  )
}

function PortfolioSection({ section }: { section: any }) {
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setItems(await portfolioAPI.getPortfolio())
      } catch (error) {
        setItems([])
      }
    }

    fetchItems()
  }, [])

  return (
    <section className="section-padding">
      <div className="container">
        <div className={`grid grid-cols-1 gap-6 ${columnClasses[Number(section.columns || 4)] || columnClasses[4]}`}>
          {items.slice(0, Number(section.itemLimit || 8)).map((item) => (
            <article key={item.id} className="card overflow-hidden">
              {item.image && <img src={resolveAssetUrl(item.image)} alt={item.title} className="h-56 w-full object-contain p-2" />}
              <div className="p-4">
                <p className="text-xs font-semibold uppercase text-blue-600">{item.category}</p>
                <h3 className="mt-2 text-lg font-bold text-gray-900">{item.title}</h3>
                {item.description && <p className="mt-2 text-sm text-gray-600">{item.description}</p>}
                <Link to={`/portfolio/${item.id}`} className="mt-4 inline-flex font-semibold text-blue-600 hover:text-blue-800">
                  View Details
                </Link>
              </div>
            </article>
          ))}
          {items.length === 0 && <div className="rounded-lg border p-6 text-center text-gray-600 md:col-span-2 lg:col-span-4">No portfolio items have been added yet.</div>}
        </div>
      </div>
    </section>
  )
}

function ServicesSection({ section }: { section: any }) {
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setItems(await servicePackagesAPI.getServices())
      } catch (error) {
        setItems([])
      }
    }

    fetchItems()
  }, [])

  return (
    <section className="section-padding bg-gray-50">
      <div className="container">
        <SectionHeading section={section} fallbackTitle="Services" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, Number(section.itemLimit || 6)).map((item) => (
            <article key={item.id || item.service} className="card p-6">
              <h3 className="text-xl font-bold text-gray-900">{item.service}</h3>
              {item.description && <p className="mt-3 text-gray-600">{item.description}</p>}
              <div className="mt-5 flex items-baseline">
                <span className="text-3xl font-bold text-blue-600">${item.price}</span>
                {item.unit && <span className="ml-2 text-gray-600">per {item.unit}</span>}
              </div>
              <Link to="/contact" className="btn-primary mt-6 inline-flex">Inquire Now</Link>
            </article>
          ))}
          {items.length === 0 && <div className="rounded-lg border bg-white p-6 text-center text-gray-600 md:col-span-2 lg:col-span-3">No services have been added yet.</div>}
        </div>
      </div>
    </section>
  )
}

function PortfolioGallerySection({ section }: { section: any }) {
  const [items, setItems] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    portfolioAPI.getPortfolio().then(setItems).catch(() => setItems([]))
  }, [])

  const categories = [
    { id: 'all', label: 'All Work' },
    { id: 'web-design', label: 'Web Design' },
    { id: 'photography', label: 'Photography' },
    { id: 'videography', label: 'Videography' },
    { id: 'branding', label: 'Branding' }
  ]
  const filteredItems = selectedCategory === 'all' ? items : items.filter(item => item.category === selectedCategory)

  return (
    <>
      <section className="py-12 bg-gray-50">
        <div className="container">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map(category => (
              <button key={category.id} type="button" onClick={() => setSelectedCategory(category.id)} className={`rounded-lg px-6 py-2 font-semibold transition ${selectedCategory === category.id ? 'bg-blue-600 text-white' : 'border-2 border-gray-200 bg-white text-gray-700 hover:border-blue-600'}`}>
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="container">
          <SectionHeading section={section} fallbackTitle="" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {filteredItems.map(item => (
              <div key={item.id} className="card group cursor-pointer overflow-hidden transition hover:shadow-2xl">
                <div className="relative h-64 overflow-hidden bg-gray-100">
                  {item.image && <img src={resolveAssetUrl(item.image)} alt={item.title} className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105" />}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <Link to={`/portfolio/${item.id}`} className="btn-primary">View Details</Link>
                  </div>
                </div>
                <div className="p-4">
                  <span className="text-xs font-semibold uppercase text-blue-600">{categories.find(category => category.id === item.category)?.label}</span>
                  <h3 className="mt-2 text-lg font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && <div className="rounded-lg border p-6 text-center text-gray-600 md:col-span-2 lg:col-span-4">No portfolio items have been added yet.</div>}
          </div>
        </div>
      </section>
    </>
  )
}

function ServicesListSection({ section }: { section: any }) {
  const icons = [FiMonitor, FiCamera, FiVideo, FiPenTool]
  const items = Array.isArray(section.items) ? section.items : []

  return (
    <section className="py-16">
      <div className="container">
        <SectionHeading section={section} fallbackTitle="" />
        <div className="space-y-16">
          {items.map((service: any, index: number) => {
            const IconComponent = icons[index % icons.length]
            const isEven = index % 2 === 0

            return (
              <div key={service.id || `${service.title}-${index}`} className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
                <div className={isEven ? 'order-1' : 'order-2'}>
                  <div className="mb-6">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-blue-100">
                      <IconComponent size={32} className="text-blue-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">{service.title}</h2>
                  </div>
                  <p className="mb-8 text-lg text-gray-600">{service.description}</p>
                  <div className="space-y-3">
                    {(service.features || []).map((feature: string, featureIndex: number) => (
                      <div key={featureIndex} className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Link to={service.url || '/contact'} className="btn-primary mt-8 inline-block">Learn More</Link>
                </div>
                <div className={isEven ? 'order-2' : 'order-1'}>
                  {service.image ? (
                    <img src={resolveAssetUrl(service.image)} alt={service.title} className="h-96 w-full rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-96 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-blue-50">
                      <IconComponent size={120} className="text-blue-200" />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {items.length === 0 && <div className="rounded-lg border p-6 text-center text-gray-600">No services have been added yet.</div>}
        </div>
      </div>
    </section>
  )
}

function PricingPackagesSection({ section }: { section: any }) {
  const plans = Array.isArray(section.items) ? section.items : []

  return (
    <section className="py-16">
      <div className="container">
        <SectionHeading section={section} fallbackTitle="Web Design Packages" />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {plans.map((plan: any, index: number) => (
            <div key={plan.id || index} className={`card overflow-hidden transition ${plan.popular ? 'scale-105 ring-2 ring-blue-600' : ''}`}>
              {plan.popular && <div className="bg-blue-600 px-4 py-2 text-center font-bold text-white">MOST POPULAR</div>}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
                <div className="my-8">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  <span className="ml-2 text-gray-600">({plan.billingPeriod})</span>
                </div>
                <Link to="/contact" className={`mb-8 block w-full rounded-lg py-3 text-center font-bold transition ${plan.popular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>Get Started</Link>
                <div className="space-y-4">
                  {(plan.features || []).map((feature: any, featureIndex: number) => {
                    const featureName = typeof feature === 'string' ? feature : feature.name
                    const included = typeof feature === 'string' ? true : feature.included
                    return (
                      <div key={featureIndex} className="flex items-center gap-3">
                        <div className={`flex h-5 w-5 items-center justify-center rounded ${included ? 'bg-green-100' : 'bg-gray-100'}`}>{included && <FiCheck className="text-green-600" />}</div>
                        <span className={included ? 'text-gray-900' : 'text-gray-400 line-through'}>{featureName}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ServicePricingSection({ section }: { section: any }) {
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    servicePackagesAPI.getServices().then(setItems).catch(() => setItems([]))
  }, [])

  return (
    <section className="py-16 bg-gray-50">
      <div className="container">
        <SectionHeading section={section} fallbackTitle="A La Carte Services" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((pkg, index) => (
            <div key={pkg.id || index} className="card p-6">
              <h3 className="text-xl font-bold text-gray-900">{pkg.service}</h3>
              {pkg.description && <p className="mt-2 text-sm text-gray-600">{pkg.description}</p>}
              <div className="my-4 flex items-baseline">
                <span className="text-3xl font-bold text-blue-600">${pkg.price}</span>
                <span className="ml-2 text-gray-600">per {pkg.unit}</span>
              </div>
              <Link to="/contact" className="btn-primary block w-full text-center">Inquire Now</Link>
            </div>
          ))}
          {items.length === 0 && <div className="rounded-lg border bg-white p-6 text-center text-gray-600 md:col-span-2 lg:col-span-3">No services have been added yet.</div>}
        </div>
      </div>
    </section>
  )
}

function FaqSection({ section }: { section: any }) {
  const items = Array.isArray(section.items) ? section.items : []
  return (
    <section className="py-16">
      <div className="container max-w-2xl">
        <SectionHeading section={section} fallbackTitle="Frequently Asked Questions" />
        <div className="space-y-6">
          {items.map((faq: any, index: number) => (
            <div key={index} className="card p-6">
              <h3 className="text-lg font-bold text-gray-900">{faq.q}</h3>
              <p className="mt-3 text-gray-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function EmbeddedPluginSection({ section }: { section: any }) {
  const pluginLabel = pluginLabels[section.pluginSlug] || pluginLabels.plugins
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPluginData = async () => {
      try {
        setLoading(true)
        if (section.pluginSlug === 'restaurant') {
          setData(await pluginsAPI.getRestaurantMenu())
        } else if (section.pluginSlug === 'real-estate') {
          setData(await pluginsAPI.getRealEstateListings())
        } else if (section.pluginSlug === 'booking') {
          setData(await pluginsAPI.getBookingSlots())
        } else if (section.pluginSlug === 'events') {
          setData(await pluginsAPI.getEvents())
        } else if (section.pluginSlug === 'protected-content') {
          setData(await pluginsAPI.getProtectedContentItems())
        } else {
          setData({ plugins: await pluginsAPI.getPlugins() })
        }
      } catch (error) {
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPluginData()
  }, [section.pluginSlug])

  return (
    <section className="section-padding">
      <div className="container">
        {loading ? (
          <div className="text-gray-600">Loading {pluginLabel}...</div>
        ) : (
          <PluginContent pluginSlug={section.pluginSlug || 'plugins'} data={data} />
        )}
      </div>
    </section>
  )
}

function PluginsListSection({ section }: { section: any }) {
  const [plugins, setPlugins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    pluginsAPI.getPlugins()
      .then(setPlugins)
      .catch(() => setPlugins([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="py-16">
      <div className="container">
        <SectionHeading section={section} fallbackTitle="" />
        {loading ? (
          <div className="text-gray-600">Loading plugins...</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {plugins.map(plugin => (
              <div key={plugin.id} className="card p-6">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">{plugin.name}</h2>
                  <span className={`rounded px-2 py-1 text-xs font-semibold ${plugin.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                    {plugin.isEnabled ? 'Demo active' : 'Demo inactive'}
                  </span>
                </div>
                <p className="mb-6 text-gray-600">{plugin.description}</p>
                {plugin.demoUrl && <Link to={plugin.demoUrl} className="btn-primary inline-flex">View Demo</Link>}
              </div>
            ))}
            {plugins.length === 0 && <div className="card p-8 text-center text-gray-600 md:col-span-2">No active plugin demos are available yet.</div>}
          </div>
        )}
      </div>
    </section>
  )
}

function SiteDemosSection({ section }: { section: any }) {
  const [demos, setDemos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const limit = Number(section.itemLimit || 6)

  useEffect(() => {
    siteDemosAPI.getDemos()
      .then(setDemos)
      .catch(() => setDemos([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="py-16 bg-gray-50">
      <div className="container">
        <SectionHeading section={section} fallbackTitle="Site Demos" />
        {loading ? (
          <div className="text-gray-600">Loading site demos...</div>
        ) : (
          <div className={`grid grid-cols-1 gap-6 ${columnClasses[Number(section.columns || 3)] || columnClasses[3]}`}>
            {demos.slice(0, limit).map(demo => (
              <article key={demo.id || demo.slug} className="group overflow-hidden rounded-lg bg-white shadow transition hover:-translate-y-1 hover:shadow-xl">
                {demo.previewImage && <img src={resolveAssetUrl(demo.previewImage)} alt={demo.name} className="h-64 w-full object-cover transition duration-300 group-hover:scale-105" />}
                <div className="p-6">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-600">{demo.category}</p>
                  <h3 className="mt-2 text-2xl font-bold text-gray-900">{demo.name}</h3>
                  {demo.description && <p className="mt-3 text-gray-600">{demo.description}</p>}
                  <Link to={demo.demoUrl} className="btn-primary mt-6 inline-flex items-center gap-2">
                    View Demo <FiArrowRight />
                  </Link>
                </div>
              </article>
            ))}
            {demos.length === 0 && <div className="rounded-lg border bg-white p-8 text-center text-gray-600 md:col-span-2 lg:col-span-3">No active site demos are available yet.</div>}
          </div>
        )}
      </div>
    </section>
  )
}

function ContactFormSection() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '', service: '', message: '' })
  const [settings, setSettings] = useState<any>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')

  useEffect(() => {
    siteSettingsAPI.getSettings().then(setSettings).catch(() => setSettings({}))
  }, [])

  const socialLinks = [
    ['Facebook', settings.facebookUrl],
    ['Instagram', settings.instagramUrl],
    ['Twitter', settings.twitterUrl],
    ['LinkedIn', settings.linkedinUrl]
  ].filter(([, url]) => url)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (isSubmitted) setIsSubmitted(false)
    if (submitError) setSubmitError('')
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setIsSubmitted(false)
    setSubmitError('')

    try {
      await contactMessagesAPI.createMessage({ ...formData, turnstileToken })
      setIsSubmitted(true)
      setTurnstileToken('')
      setFormData({ name: '', email: '', phone: '', company: '', service: '', message: '' })
    } catch (error) {
      setSubmitError('We could not send your message. Please try again in a moment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="py-16">
      <div className="container">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900">Contact Information</h2>
            <ContactInfo icon={<FiMail className="text-blue-600" size={24} />} label="Email" value={settings.contactEmail || 'hello@creativestudio.com'} note="We reply within 24 hours" />
            <ContactInfo icon={<FiPhone className="text-blue-600" size={24} />} label="Phone" value={settings.phone || '+1 (555) 123-4567'} note={settings.hours || 'Mon-Fri, 9am-6pm EST'} />
            <ContactInfo icon={<FiMapPin className="text-blue-600" size={24} />} label="Location" value={settings.locationLine1 || '123 Creative Street'} note={settings.locationLine2 || 'New York, NY 10001'} />
            {socialLinks.length > 0 && (
              <div className="border-t pt-8">
                <h3 className="mb-4 font-bold text-gray-900">Follow Us</h3>
                <div className="flex gap-4">
                  {socialLinks.map(([social, url], index) => (
                    <a key={index} href={url || '#'} className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 transition hover:bg-blue-600 hover:text-white">
                      {social[0]}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="lg:col-span-2">
            <div className="card p-8">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">Send us a Message</h2>
              {isSubmitted && <div role="status" className="mb-6 rounded-lg border border-green-400 bg-green-100 p-4 text-green-700">Message sent. Thank you for reaching out. We will get back to you soon.</div>}
              {submitError && <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{submitError}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field id="name" label="Your Name *" value={formData.name} onChange={handleChange} required />
                  <Field id="email" label="Email Address *" type="email" value={formData.email} onChange={handleChange} required />
                  <Field id="phone" label="Phone Number" type="tel" value={formData.phone} onChange={handleChange} />
                  <Field id="company" label="Company" value={formData.company} onChange={handleChange} />
                </div>
                <div>
                  <label htmlFor="service" className="mb-2 block font-semibold text-gray-700">Service Interested In *</label>
                  <select id="service" name="service" value={formData.service} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600">
                    <option value="">Select a service...</option>
                    <option value="web-design">Web Design</option>
                    <option value="photography">Photography</option>
                    <option value="videography">Videography</option>
                    <option value="branding">Branding</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="mb-2 block font-semibold text-gray-700">Message *</label>
                  <textarea id="message" name="message" value={formData.message} onChange={handleChange} required rows={5} className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="Tell us about your project..."></textarea>
                </div>
                {settings.turnstileSiteKey && <TurnstileWidget siteKey={settings.turnstileSiteKey} onVerify={setTurnstileToken} />}
                <button type="submit" className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting}>{isSubmitting ? 'Sending...' : 'Send Message'}</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CtaSection({ section }: { section: any }) {
  return (
    <section className="bg-blue-600 py-16 text-white">
      <div className="container text-center">
        <h2 className="text-3xl font-bold md:text-4xl">{section.title}</h2>
        {section.body && <p className="mx-auto mt-6 max-w-2xl text-xl text-blue-100 whitespace-pre-line">{section.body}</p>}
        {section.buttonLabel && section.buttonUrl && <Link to={section.buttonUrl} className="btn-primary mt-8 inline-block">{section.buttonLabel}</Link>}
      </div>
    </section>
  )
}

function ContactInfo({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note?: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">{icon}</div>
      <div>
        <h3 className="font-bold text-gray-900">{label}</h3>
        <p className="text-gray-600">{value}</p>
        {note && <p className="text-sm text-gray-600">{note}</p>}
      </div>
    </div>
  )
}

function Field({ id, label, type = 'text', value, onChange, required = false }: any) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-semibold text-gray-700">{label}</label>
      <input type={type} id={id} name={id} value={value} onChange={onChange} required={required} className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600" />
    </div>
  )
}

function PluginContent({ pluginSlug, data }: { pluginSlug: string; data: any }) {
  if (!data) return <div className="text-gray-600">This plugin content is not available right now.</div>

  if (pluginSlug === 'restaurant') {
    const items = data.items || []
    if (items.length === 0) return <div className="text-gray-600">No menu items have been added yet.</div>

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.slice(0, 6).map((item: any) => (
          <article key={item.id} className="overflow-hidden rounded-lg bg-white shadow">
            {item.image && <img src={resolveAssetUrl(item.image)} alt={item.name} className="h-40 w-full object-cover" />}
            <div className="p-4">
              <div className="flex justify-between gap-3">
                <h3 className="font-bold text-gray-900">{item.name}</h3>
                <p className="font-bold text-blue-600">${Number(item.price || 0).toFixed(2)}</p>
              </div>
              {item.description && <p className="mt-2 text-sm text-gray-600">{item.description}</p>}
            </div>
          </article>
        ))}
      </div>
    )
  }

  if (pluginSlug === 'real-estate') {
    const listings = data.listings || []
    if (listings.length === 0) return <div className="text-gray-600">No listings have been added yet.</div>

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {listings.slice(0, 4).map((listing: any) => (
          <article key={listing.id} className="overflow-hidden rounded-lg bg-white shadow">
            {listing.image && <img src={resolveAssetUrl(listing.image)} alt={listing.title} className="h-44 w-full object-cover" />}
            <div className="p-4">
              <p className="font-bold text-blue-600">{formatCurrency(listing.price)}</p>
              <h3 className="mt-1 font-bold text-gray-900">{listing.title}</h3>
              {listing.address && <p className="mt-1 text-sm text-gray-500">{listing.address}</p>}
            </div>
          </article>
        ))}
      </div>
    )
  }

  if (pluginSlug === 'booking') {
    const slots = data.slots || []
    if (slots.length === 0) return <div className="text-gray-600">No appointment times are currently available.</div>

    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {slots.slice(0, 6).map((slot: any) => (
          <div key={slot.id} className="rounded-lg bg-white p-4 shadow">
            <p className="font-bold text-gray-900">{formatDate(slot.date)}</p>
            <p className="text-gray-600">{slot.startTime} - {slot.endTime}</p>
            {Array.isArray(slot.locationTypes) && slot.locationTypes.length > 0 && (
              <p className="mt-2 text-sm text-blue-600">{slot.locationTypes.join(', ')}</p>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (pluginSlug === 'events') {
    const events = data.events || []
    if (events.length === 0) return <div className="text-gray-600">No events have been added yet.</div>

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {events.slice(0, 4).map((event: any) => (
          <article key={event.id} className="overflow-hidden rounded-lg bg-white shadow">
            {event.image && <img src={resolveAssetUrl(event.image)} alt={event.title} className="h-44 w-full object-cover" />}
            <div className="p-4">
              <p className="text-sm font-bold uppercase text-blue-600">{formatDate(event.eventDate)}</p>
              <h3 className="mt-1 font-bold text-gray-900">{event.title}</h3>
              {event.description && <p className="mt-2 text-sm text-gray-600">{event.description}</p>}
              {event.buttonLabel && event.buttonUrl && <a href={event.buttonUrl} className="mt-4 inline-flex font-semibold text-blue-600 hover:text-blue-800">{event.buttonLabel}</a>}
            </div>
          </article>
        ))}
      </div>
    )
  }

  if (pluginSlug === 'protected-content') {
    const items = data.items || []
    if (items.length === 0) return <div className="text-gray-600">No protected content has been added yet.</div>

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.slice(0, 4).map((item: any) => (
          <article key={item.id} className="overflow-hidden rounded-lg bg-white shadow">
            {item.previewImage && <img src={resolveAssetUrl(item.previewImage)} alt={item.title} className="h-44 w-full object-cover" />}
            <div className="p-4">
              <p className="text-sm font-bold uppercase text-blue-600">{item.contentType}</p>
              <h3 className="mt-1 font-bold text-gray-900">{item.title}</h3>
              {item.description && <p className="mt-2 text-sm text-gray-600">{item.description}</p>}
              <Link to="/plugins/protected-content" className="mt-4 inline-flex font-semibold text-blue-600 hover:text-blue-800">
                {item.isUnlocked ? 'View Content' : item.buttonLabel || 'Unlock Access'}
              </Link>
            </div>
          </article>
        ))}
      </div>
    )
  }

  const plugins = data.plugins || []
  if (plugins.length === 0) return <div className="text-gray-600">No plugins are active right now.</div>

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {plugins.slice(0, 4).map((plugin: any) => (
        <div key={plugin.id || plugin.slug} className="rounded-lg bg-white p-4 shadow">
          <h3 className="font-bold text-gray-900">{plugin.name}</h3>
          <p className="mt-2 text-sm text-gray-600">{plugin.description}</p>
        </div>
      ))}
    </div>
  )
}

function formatCurrency(value: number | string) {
  return Number(value || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  })
}

function formatDate(value: string) {
  if (!value) return 'Available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
