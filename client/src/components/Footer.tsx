import { FiFacebook, FiInstagram, FiTwitter, FiLinkedin } from 'react-icons/fi'
import { useEffect, useState } from 'react'
import { siteSettingsAPI } from '../services/api'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const [settings, setSettings] = useState<any>({
    siteName: 'Creative by Caleb',
    logoUrl: '',
    logoSize: 40,
    footerDescription: 'Transforming ideas into stunning visual experiences through web design, photography, and videography.',
    contactEmail: 'hello@creativestudio.com'
  })
  const socialLinks = [
    { url: settings.facebookUrl, icon: FiFacebook, label: 'Facebook' },
    { url: settings.instagramUrl, icon: FiInstagram, label: 'Instagram' },
    { url: settings.twitterUrl, icon: FiTwitter, label: 'Twitter' },
    { url: settings.linkedinUrl, icon: FiLinkedin, label: 'LinkedIn' }
  ].filter(link => link.url)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setSettings(await siteSettingsAPI.getSettings())
      } catch (error) {
        console.error('Error loading footer settings:', error)
      }
    }

    fetchSettings()
  }, [])

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.siteName}
                className="w-auto object-contain mb-4"
                style={{ height: `${Math.min(Math.max(Number(settings.logoSize) || 40, 24), 96)}px` }}
              />
            ) : <h3 className="text-2xl font-bold mb-4">{settings.siteName}</h3>}
            <p className="text-gray-400">
              {settings.footerDescription}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/" className="hover:text-white transition">Home</a></li>
              <li><a href="/portfolio" className="hover:text-white transition">Portfolio</a></li>
              <li><a href="/services" className="hover:text-white transition">Services</a></li>
              <li><a href="/pricing" className="hover:text-white transition">Pricing</a></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition">Web Design</a></li>
              <li><a href="#" className="hover:text-white transition">Photography</a></li>
              <li><a href="#" className="hover:text-white transition">Videography</a></li>
              <li><a href="#" className="hover:text-white transition">Branding</a></li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Connect</h4>
            <p className="text-gray-400 mb-4">{settings.contactEmail}</p>
            <div className="flex space-x-4">
              {socialLinks.map((link) => {
                const Icon = link.icon
                return (
                  <a key={link.label} href={link.url} aria-label={link.label} className="text-gray-400 hover:text-white transition">
                    <Icon size={20} />
                  </a>
                )
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-gray-400">
            <p>&copy; {currentYear} {settings.siteName}. All rights reserved.</p>
            <div className="space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition">Privacy Policy</a>
              <a href="#" className="hover:text-white transition">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
