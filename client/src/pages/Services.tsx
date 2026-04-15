import { useEffect, useState } from 'react'
import { FiMonitor, FiCamera, FiVideo, FiPenTool } from 'react-icons/fi'
import { siteSettingsAPI } from '../services/api'
import SEO, { localBusinessSchema } from '../components/SEO'

export default function Services() {
  const fallbackServices = [
    {
      id: 1,
      icon: FiMonitor,
      title: 'Web Design',
      description: 'Custom-designed websites that are beautiful, functional, and conversion-focused.',
      features: [
        'Responsive design for all devices',
        'User experience optimization',
        'Performance optimization',
        'SEO-friendly structure',
        'Content management systems',
        'E-commerce integration'
      ]
    },
    {
      id: 2,
      icon: FiCamera,
      title: 'Professional Photography',
      description: 'Stunning photography that captures your brand story and engages your audience.',
      features: [
        'Corporate headshots',
        'Product photography',
        'Event coverage',
        'Real estate photography',
        'Lifestyle photography',
        'Post-processing & editing'
      ]
    },
    {
      id: 3,
      icon: FiVideo,
      title: 'Videography & Production',
      description: 'Cinematic videos that tell compelling stories and drive engagement.',
      features: [
        'Commercial production',
        'Product videos',
        'Event videography',
        'Testimonial videos',
        '4K cinematography',
        'Professional editing'
      ]
    },
    {
      id: 4,
      icon: FiPenTool,
      title: 'Brand Building',
      description: 'Complete brand identity and strategy that sets you apart from competitors.',
      features: [
        'Logo design',
        'Brand guidelines',
        'Identity systems',
        'Marketing collateral',
        'Brand strategy',
        'Brand positioning'
      ]
    }
  ]
  const [services, setServices] = useState<any[]>(fallbackServices)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const settings = await siteSettingsAPI.getSettings()
        if (Array.isArray(settings.services) && settings.services.length > 0) {
          setServices(settings.services)
        }
      } catch (error) {
        console.error('Error loading services:', error)
      }
    }

    fetchServices()
  }, [])

  return (
    <div>
      <SEO
        title="Creative Services for Indianapolis and National Businesses"
        description="Explore web design, photography, videography, and branding services for Indianapolis companies and businesses across the United States."
        path="/services"
        structuredData={localBusinessSchema('/services')}
      />
      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Services</h1>
          <p className="text-xl text-blue-100">Comprehensive creative solutions for your business</p>
        </div>
      </section>

      {/* Services */}
      <section className="py-16">
        <div className="container">
          <div className="space-y-16">
            {services.map((service, index) => {
              const IconComponent = service.icon || [FiMonitor, FiCamera, FiVideo, FiPenTool][index % 4]
              const isEven = index % 2 === 0

              return (
                <div key={service.id || `${service.title}-${index}`} className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className={isEven ? 'order-1' : 'order-2'}>
                    <div className="mb-6">
                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                        <IconComponent size={32} className="text-blue-600" />
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900">{service.title}</h2>
                    </div>
                    <p className="text-lg text-gray-600 mb-8">{service.description}</p>
                    <div className="space-y-3">
                      {(service.features || []).map((feature: string, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <a href={service.url || '/contact'} className="btn-primary mt-8 inline-block">Learn More</a>
                  </div>

                  <div className={isEven ? 'order-2' : 'order-1'}>
                    {service.image ? (
                      <img src={service.image} alt={service.title} className="rounded-lg h-96 w-full object-cover" />
                    ) : (
                      <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg h-96 flex items-center justify-center">
                        <IconComponent size={120} className="text-blue-200" />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <h2 className="section-title">Our Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Discovery', desc: 'We understand your goals and vision' },
              { step: '02', title: 'Strategy', desc: 'We develop a comprehensive plan' },
              { step: '03', title: 'Creation', desc: 'We bring your ideas to life' },
              { step: '04', title: 'Launch', desc: 'We deliver and support you' }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-4">{item.step}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
