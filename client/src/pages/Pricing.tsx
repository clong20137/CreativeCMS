import { useEffect, useState } from 'react'
import { FiCheck } from 'react-icons/fi'
import { servicePackagesAPI, siteSettingsAPI } from '../services/api'
import SEO from '../components/SEO'

export default function Pricing() {
  const fallbackPricingPlans = [
    {
      id: 1,
      name: 'Starter',
      description: 'Perfect for small projects and startups',
      price: 1500,
      billingPeriod: 'one-time',
      features: [
        { name: '5 Page Website', included: true },
        { name: 'Responsive Design', included: true },
        { name: 'Basic SEO', included: true },
        { name: 'Contact Form', included: true },
        { name: 'Social Media Links', included: true },
        { name: 'Analytics Setup', included: false },
        { name: 'Advanced Features', included: false },
        { name: 'Monthly Support', included: false }
      ],
      popular: false
    },
    {
      id: 2,
      name: 'Professional',
      description: 'Ideal for growing businesses',
      price: 3500,
      billingPeriod: 'one-time',
      features: [
        { name: '10 Page Website', included: true },
        { name: 'Responsive Design', included: true },
        { name: 'Advanced SEO', included: true },
        { name: 'Contact Form & CRM', included: true },
        { name: 'Social Media Integration', included: true },
        { name: 'Analytics & Tracking', included: true },
        { name: 'E-commerce Setup', included: false },
        { name: '6 Months Support', included: true }
      ],
      popular: true
    },
    {
      id: 3,
      name: 'Enterprise',
      description: 'For large-scale projects and agencies',
      price: 7500,
      billingPeriod: 'one-time',
      features: [
        { name: 'Unlimited Pages', included: true },
        { name: 'Responsive Design', included: true },
        { name: 'Full SEO Optimization', included: true },
        { name: 'Advanced CRM Integration', included: true },
        { name: 'Social Media Management', included: true },
        { name: 'Advanced Analytics', included: true },
        { name: 'E-commerce Platform', included: true },
        { name: '12 Months Support', included: true }
      ],
      popular: false
    }
  ]

  const fallbackServicePackages = [
    { service: 'Photography Session', price: 800, unit: 'half day' },
    { service: 'Product Photography', price: 1200, unit: 'per day' },
    { service: 'Videography', price: 1500, unit: 'per day' },
    { service: 'Video Editing', price: 50, unit: 'per hour' },
    { service: 'Logo Design', price: 1000, unit: 'project' },
    { service: 'Brand Identity', price: 3000, unit: 'project' }
  ]
  const [pricingPlans, setPricingPlans] = useState<any[]>(fallbackPricingPlans)
  const [servicePackages, setServicePackages] = useState<any[]>(fallbackServicePackages)
  const fallbackFaqs = [
    {
      q: 'Do you offer custom quotes?',
      a: 'Yes, we provide custom quotes for projects outside our standard packages. Contact us to discuss your specific needs.'
    },
    {
      q: 'What is your revisions policy?',
      a: 'All packages include revision rounds. We work with you until you\'re completely satisfied with the final product.'
    },
    {
      q: 'Do you offer payment plans?',
      a: 'Yes, we offer flexible payment plans for larger projects. We can discuss options that work best for your budget.'
    },
    {
      q: 'What is your typical turnaround time?',
      a: 'Turnaround times vary by project complexity, typically ranging from 2-4 weeks. We\'ll provide a specific timeline during consultation.'
    }
  ]
  const [faqs, setFaqs] = useState<any[]>(fallbackFaqs)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const services = await servicePackagesAPI.getServices()
        if (services.length > 0) {
          setServicePackages(services)
        }
        const settings = await siteSettingsAPI.getSettings()
        if (Array.isArray(settings.webDesignPackages) && settings.webDesignPackages.length > 0) setPricingPlans(settings.webDesignPackages)
        if (Array.isArray(settings.faqs) && settings.faqs.length > 0) setFaqs(settings.faqs)
      } catch (error) {
        console.error('Error loading services:', error)
      }
    }

    fetchServices()
  }, [])

  return (
    <div>
      <SEO
        title="Web Design, Photography, Videography, and Branding Pricing"
        description="Review transparent pricing for web design packages, photography, videography, logo design, and brand identity services."
        path="/pricing"
      />
      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Transparent Pricing</h1>
          <p className="text-xl text-blue-100">Flexible packages tailored to your needs</p>
        </div>
      </section>

      {/* Web Design Pricing */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-3xl font-bold mb-4 text-center text-gray-900">Web Design Packages</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Choose the perfect web design package for your project. All packages include responsive design and modern aesthetics.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {pricingPlans.map((plan) => (
              <div
                key={plan.id}
                className={`card overflow-hidden transition transform ${
                  plan.popular ? 'ring-2 ring-blue-600 scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="bg-blue-600 text-white py-2 px-4 text-center font-bold">
                    MOST POPULAR
                  </div>
                )}
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-6">{plan.description}</p>
                  <div className="mb-8">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-600 ml-2">({plan.billingPeriod})</span>
                  </div>
                  <button className={`w-full py-3 rounded-lg font-bold transition mb-8 ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}>
                    Get Started
                  </button>
                  <div className="space-y-4">
                    {(plan.features || []).map((feature: any, i: number) => {
                      const featureName = typeof feature === 'string' ? feature : feature.name
                      const included = typeof feature === 'string' ? true : feature.included
                      return (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded flex items-center justify-center ${
                          included ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {included && <FiCheck className="text-green-600" />}
                        </div>
                        <span className={included ? 'text-gray-900' : 'text-gray-400 line-through'}>
                          {featureName}
                        </span>
                      </div>
                    )})}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Pricing */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <h2 className="text-3xl font-bold mb-4 text-center text-gray-900">A La Carte Services</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Need individual services? We offer flexible pricing for photography, videography, and branding.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicePackages.map((pkg, i) => (
              <div key={i} className="card p-6">
                <h3 className="text-1xl font-bold text-gray-900 mb-2">{pkg.service}</h3>
                {pkg.description && <p className="text-gray-600 text-sm mb-4">{pkg.description}</p>}
                <div className="flex items-baseline mb-4">
                  <span className="text-3xl font-bold text-blue-600">${pkg.price}</span>
                  <span className="text-gray-600 ml-2">per {pkg.unit}</span>
                </div>
                <button className="btn-primary w-full">
                  Inquire Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container max-w-2xl">
          <h2 className="text-3xl font-bold mb-12 text-center text-gray-900">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="card p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-3">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
