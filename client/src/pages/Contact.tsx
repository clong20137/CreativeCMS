import { useEffect, useState } from 'react'
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi'
import { contactMessagesAPI, siteSettingsAPI } from '../services/api'
import TurnstileWidget from '../components/TurnstileWidget'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: '',
    message: ''
  })

  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [settings, setSettings] = useState<any>({
    contactEmail: 'hello@creativestudio.com',
    phone: '+1 (555) 123-4567',
    hours: 'Mon-Fri, 9am-6pm EST',
    locationLine1: '123 Creative Street',
    locationLine2: 'New York, NY 10001'
  })
  const socialLinks = [
    ['Facebook', settings.facebookUrl],
    ['Instagram', settings.instagramUrl],
    ['Twitter', settings.twitterUrl],
    ['LinkedIn', settings.linkedinUrl]
  ].filter(([, url]) => url)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setSettings(await siteSettingsAPI.getSettings())
      } catch (error) {
        console.error('Error loading contact settings:', error)
      }
    }

    fetchSettings()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (isSubmitted) setIsSubmitted(false)
    if (submitError) setSubmitError('')
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
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
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        service: '',
        message: ''
      })
    } catch (error) {
      console.error('Error sending message:', error)
      setSubmitError('We could not send your message. Please try again in a moment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Get in Touch</h1>
          <p className="text-xl text-blue-100">Have a project in mind? Let's talk about how we can help.</p>
        </div>
      </section>

      {/* Contact Info & Form */}
      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-8">Contact Information</h2>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiMail className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Email</h3>
                  <p className="text-gray-600">{settings.contactEmail}</p>
                  <p className="text-gray-600 text-sm">We reply within 24 hours</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiPhone className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Phone</h3>
                  <p className="text-gray-600">{settings.phone}</p>
                  <p className="text-gray-600 text-sm">{settings.hours}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiMapPin className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Location</h3>
                  <p className="text-gray-600">{settings.locationLine1}</p>
                  <p className="text-gray-600">{settings.locationLine2}</p>
                </div>
              </div>

              {/* Social Media */}
              <div className="pt-8 border-t">
                <h3 className="font-bold text-gray-900 mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  {socialLinks.map(([social, url], i) => (
                    <a
                      key={i}
                      href={url || '#'}
                      className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition"
                    >
                      {social[0]}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="card p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>

                {isSubmitted && (
                  <div role="status" className="mb-6 p-4 bg-green-100 border border-green-400 rounded-lg text-green-700">
                    Message sent. Thank you for reaching out. We will get back to you soon.
                  </div>
                )}

                {submitError && (
                  <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {submitError}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-gray-700 font-semibold mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-gray-700 font-semibold mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className="block text-gray-700 font-semibold mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div>
                      <label htmlFor="company" className="block text-gray-700 font-semibold mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="Your Company"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="service" className="block text-gray-700 font-semibold mb-2">
                      Service Interested In *
                    </label>
                    <select
                      id="service"
                      name="service"
                      value={formData.service}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">Select a service...</option>
                      <option value="web-design">Web Design</option>
                      <option value="photography">Photography</option>
                      <option value="videography">Videography</option>
                      <option value="branding">Branding</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-gray-700 font-semibold mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="Tell us about your project..."
                    ></textarea>
                  </div>

                  {settings.turnstileSiteKey && (
                    <TurnstileWidget siteKey={settings.turnstileSiteKey} onVerify={setTurnstileToken} />
                  )}

                  <button
                    type="submit"
                    className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
