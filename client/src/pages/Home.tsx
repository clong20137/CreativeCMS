import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { FiArrowRight } from 'react-icons/fi'
import Testimonials from '../components/Testimonials'
import { siteSettingsAPI } from '../services/api'

export default function Home() {
  const fallbackFeaturedWorks = [
    {
      id: 1,
      title: 'Modern E-Commerce Platform',
      category: 'Web Design',
      image: 'https://images.unsplash.com/photo-1460925895917-aeb19be489c7?w=500&h=500&fit=crop',
      description: 'A fully responsive e-commerce platform with advanced filtering and checkout.'
    },
    {
      id: 2,
      title: 'Corporate Brand Photography',
      category: 'Photography',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=500&fit=crop',
      description: 'Professional corporate headshots and team photography sessions.'
    },
    {
      id: 3,
      title: 'Product Launch Video',
      category: 'Videography',
      image: 'https://images.unsplash.com/photo-1533928298208-27ff66555d8d?w=500&h=500&fit=crop',
      description: 'High-quality product launch video with cinematic styling.'
    },
    {
      id: 4,
      title: 'Complete Brand Identity',
      category: 'Branding',
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&h=500&fit=crop',
      description: 'Full brand identity package including logo, guidelines, and collateral.'
    }
  ]
  const fallbackServices = [
    { title: 'Web Design', desc: 'Modern, responsive websites that convert' },
    { title: 'Photography', desc: 'Professional visual storytelling' },
    { title: 'Videography', desc: 'Cinematic quality video production' },
    { title: 'Brand Building', desc: 'Complete identity and strategy' }
  ]
  const [featuredWorks, setFeaturedWorks] = useState<any[]>(fallbackFeaturedWorks)
  const [whatWeDo, setWhatWeDo] = useState<any[]>(fallbackServices)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await siteSettingsAPI.getSettings()
        if (Array.isArray(settings.whatWeDo) && settings.whatWeDo.length > 0) setWhatWeDo(settings.whatWeDo)
        if (Array.isArray(settings.featuredWork) && settings.featuredWork.length > 0) setFeaturedWorks(settings.featuredWork)
      } catch (error) {
        console.error('Error loading homepage settings:', error)
      }
    }

    fetchSettings()
  }, [])

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20 md:py-32">
        <div className="container">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Transform Your Vision Into Reality
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Professional web design, photography, videography, and branding services that elevate your creative presence.
            </p>
            <div className="flex gap-4">
              <Link to="/contact" className="btn-primary inline-flex items-center gap-2">
                Start a Project <FiArrowRight />
              </Link>
              <Link to="/portfolio" className="btn-secondary inline-block">
                View Our Work
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <h2 className="section-title">What We Do</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whatWeDo.map((service, i) => (
              <div key={i} className="card p-8">
                <h3 className="text-xl font-bold mb-3 text-gray-900">{service.title}</h3>
                <p className="text-gray-600">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Work */}
      <section className="py-16">
        <div className="container">
          <h2 className="section-title">Featured Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featuredWorks.map((work) => (
              <div key={work.id} className="card overflow-hidden hover:shadow-2xl transition">
                <img
                  src={work.image}
                  alt={work.title}
                  className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                />
                <div className="p-6">
                  <span className="text-blue-600 font-semibold text-sm">{work.category}</span>
                  <h3 className="text-2xl font-bold mt-2 mb-3 text-gray-900">{work.title}</h3>
                  <p className="text-gray-600 mb-4">{work.description}</p>
                  <Link to="/portfolio" className="text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-2">
                    View Case Study <FiArrowRight />
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/portfolio" className="btn-primary">
              View All Projects
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-blue-100">
            Let's collaborate on your next creative project. Contact us today to discuss your vision.
          </p>
          <Link to="/contact" className="btn-primary inline-block">
            Get in Touch
          </Link>
        </div>
      </section>
    </div>
  )
}
