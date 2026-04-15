import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { adminAPI, usersAPI } from '../services/api'

const emptySettings = {
  siteName: '',
  faviconUrl: '',
  contactEmail: '',
  phone: '',
  hours: '',
  locationLine1: '',
  locationLine2: '',
  footerDescription: '',
  facebookUrl: '',
  instagramUrl: '',
  twitterUrl: '',
  linkedinUrl: ''
  ,
  whatWeDo: [] as any[],
  featuredWork: [] as any[],
  faqs: [] as any[],
  testimonials: [] as any[],
  googleReviewsEnabled: false,
  googlePlaceId: '',
  googleApiKey: '',
  stripePublishableKey: '',
  stripeSecretKey: '',
  bankName: '',
  bankAccountLast4: '',
  payoutInstructions: ''
}

export default function AdminSettings() {
  const [settings, setSettings] = useState(emptySettings)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorSetup, setTwoFactorSetup] = useState<any>(null)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const userId = localStorage.getItem('userId') || ''

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const [data, profile] = await Promise.all([
          adminAPI.getSiteSettings(),
          usersAPI.getProfile()
        ])
        setSettings({ ...emptySettings, ...data })
        setTwoFactorEnabled(Boolean(profile.twoFactorEnabled))
      } catch (err: any) {
        setError(err.error || 'Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const updateListItem = (key: string, index: number, field: string, value: any) => {
    setSettings(prev => {
      const list = [...(prev[key as keyof typeof prev] as any[] || [])]
      list[index] = { ...list[index], [field]: value }
      return { ...prev, [key]: list }
    })
  }

  const addListItem = (key: string, item: any) => {
    setSettings(prev => ({ ...prev, [key]: [...(prev[key as keyof typeof prev] as any[] || []), item] }))
  }

  const removeListItem = (key: string, index: number) => {
    setSettings(prev => ({ ...prev, [key]: (prev[key as keyof typeof prev] as any[] || []).filter((_, i) => i !== index) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await adminAPI.updateSiteSettings(settings)
      setMessage('Site settings saved')
      document.title = settings.siteName || 'Creative Studio'
    } catch (err: any) {
      setError(err.error || 'Failed to save settings')
    }
  }

  const handleTwoFactorToggle = async () => {
    try {
      const nextValue = !twoFactorEnabled
      await adminAPI.updateTwoFactor(userId, nextValue)
      setTwoFactorEnabled(nextValue)
      setMessage(nextValue ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled')
    } catch (err: any) {
      setError(err.error || 'Failed to update two-factor authentication')
    }
  }

  const startAuthenticatorSetup = async () => {
    try {
      setTwoFactorSetup(await adminAPI.startTwoFactorSetup(userId))
    } catch (err: any) {
      setError(err.error || 'Failed to start authenticator setup')
    }
  }

  const confirmAuthenticatorSetup = async () => {
    try {
      await adminAPI.confirmTwoFactorSetup(userId, twoFactorCode)
      setTwoFactorEnabled(true)
      setTwoFactorSetup(null)
      setTwoFactorCode('')
      setMessage('Authenticator app two-factor authentication enabled')
    } catch (err: any) {
      setError(err.error || 'Invalid authenticator code')
    }
  }

  return (
    <AdminLayout title="Site Settings">
      {message && <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">{message}</div>}
      {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">{error}</div>}

      {loading ? (
        <PageSkeleton />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form onSubmit={handleSubmit} className="lg:col-span-2 card p-6 space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Generic Site Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={settings.siteName} onChange={(e) => handleChange('siteName', e.target.value)} placeholder="Site name" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                <input value={settings.faviconUrl || ''} onChange={(e) => handleChange('faviconUrl', e.target.value)} placeholder="Favicon URL" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={settings.contactEmail} onChange={(e) => handleChange('contactEmail', e.target.value)} placeholder="Contact email" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                <input value={settings.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="Phone number" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                <input value={settings.hours} onChange={(e) => handleChange('hours', e.target.value)} placeholder="Business hours" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                <input value={settings.locationLine1} onChange={(e) => handleChange('locationLine1', e.target.value)} placeholder="Location line 1" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                <input value={settings.locationLine2} onChange={(e) => handleChange('locationLine2', e.target.value)} placeholder="Location line 2" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 md:col-span-2" />
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Footer and Social Links</h2>
              <textarea value={settings.footerDescription} onChange={(e) => handleChange('footerDescription', e.target.value)} placeholder="Footer description" rows={3} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={settings.facebookUrl || ''} onChange={(e) => handleChange('facebookUrl', e.target.value)} placeholder="Facebook URL" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                <input value={settings.instagramUrl || ''} onChange={(e) => handleChange('instagramUrl', e.target.value)} placeholder="Instagram URL" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                <input value={settings.twitterUrl || ''} onChange={(e) => handleChange('twitterUrl', e.target.value)} placeholder="Twitter URL" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                <input value={settings.linkedinUrl || ''} onChange={(e) => handleChange('linkedinUrl', e.target.value)} placeholder="LinkedIn URL" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What We Do</h2>
              <div className="space-y-3">
                {(settings.whatWeDo || []).map((item: any, index: number) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2">
                    <input value={item.title || ''} onChange={(e) => updateListItem('whatWeDo', index, 'title', e.target.value)} placeholder="Title" className="px-4 py-2 border rounded-lg" />
                    <input value={item.desc || ''} onChange={(e) => updateListItem('whatWeDo', index, 'desc', e.target.value)} placeholder="Description" className="px-4 py-2 border rounded-lg" />
                    <button type="button" onClick={() => removeListItem('whatWeDo', index)} className="btn-secondary">Remove</button>
                  </div>
                ))}
                <button type="button" onClick={() => addListItem('whatWeDo', { title: '', desc: '' })} className="btn-secondary">Add What We Do Item</button>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Featured Work</h2>
              <div className="space-y-3">
                {(settings.featuredWork || []).map((item: any, index: number) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2 border rounded-lg p-3">
                    <input value={item.title || ''} onChange={(e) => updateListItem('featuredWork', index, 'title', e.target.value)} placeholder="Title" className="px-4 py-2 border rounded-lg" />
                    <input value={item.category || ''} onChange={(e) => updateListItem('featuredWork', index, 'category', e.target.value)} placeholder="Category" className="px-4 py-2 border rounded-lg" />
                    <input value={item.image || ''} onChange={(e) => updateListItem('featuredWork', index, 'image', e.target.value)} placeholder="Image URL" className="px-4 py-2 border rounded-lg" />
                    <input value={item.description || ''} onChange={(e) => updateListItem('featuredWork', index, 'description', e.target.value)} placeholder="Description" className="px-4 py-2 border rounded-lg" />
                    <button type="button" onClick={() => removeListItem('featuredWork', index)} className="btn-secondary">Remove</button>
                  </div>
                ))}
                <button type="button" onClick={() => addListItem('featuredWork', { title: '', category: '', image: '', description: '' })} className="btn-secondary">Add Featured Work</button>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Pricing FAQ</h2>
              <div className="space-y-3">
                {(settings.faqs || []).map((item: any, index: number) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2">
                    <input value={item.q || ''} onChange={(e) => updateListItem('faqs', index, 'q', e.target.value)} placeholder="Question" className="px-4 py-2 border rounded-lg" />
                    <input value={item.a || ''} onChange={(e) => updateListItem('faqs', index, 'a', e.target.value)} placeholder="Answer" className="px-4 py-2 border rounded-lg" />
                    <button type="button" onClick={() => removeListItem('faqs', index)} className="btn-secondary">Remove</button>
                  </div>
                ))}
                <button type="button" onClick={() => addListItem('faqs', { q: '', a: '' })} className="btn-secondary">Add FAQ</button>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Testimonials and Google Reviews</h2>
              <label className="flex items-center gap-2 mb-4">
                <input type="checkbox" checked={settings.googleReviewsEnabled} onChange={(e) => setSettings(prev => ({ ...prev, googleReviewsEnabled: e.target.checked }))} />
                Pull testimonials from Google Reviews
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input value={settings.googlePlaceId || ''} onChange={(e) => handleChange('googlePlaceId', e.target.value)} placeholder="Google Place ID" className="px-4 py-2 border rounded-lg" />
                <input value={settings.googleApiKey || ''} onChange={(e) => handleChange('googleApiKey', e.target.value)} placeholder="Google API Key" className="px-4 py-2 border rounded-lg" />
              </div>
              <div className="space-y-3">
                {(settings.testimonials || []).map((item: any, index: number) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2 border rounded-lg p-3">
                    <input value={item.name || ''} onChange={(e) => updateListItem('testimonials', index, 'name', e.target.value)} placeholder="Name" className="px-4 py-2 border rounded-lg" />
                    <input value={item.company || ''} onChange={(e) => updateListItem('testimonials', index, 'company', e.target.value)} placeholder="Company" className="px-4 py-2 border rounded-lg" />
                    <input value={item.role || ''} onChange={(e) => updateListItem('testimonials', index, 'role', e.target.value)} placeholder="Role" className="px-4 py-2 border rounded-lg" />
                    <input value={item.image || ''} onChange={(e) => updateListItem('testimonials', index, 'image', e.target.value)} placeholder="Image URL" className="px-4 py-2 border rounded-lg" />
                    <textarea value={item.text || ''} onChange={(e) => updateListItem('testimonials', index, 'text', e.target.value)} placeholder="Testimonial" className="px-4 py-2 border rounded-lg md:col-span-2" />
                    <button type="button" onClick={() => removeListItem('testimonials', index)} className="btn-secondary">Remove</button>
                  </div>
                ))}
                <button type="button" onClick={() => addListItem('testimonials', { name: '', company: '', role: '', image: '', text: '' })} className="btn-secondary">Add Testimonial</button>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Payments</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={settings.stripePublishableKey || ''} onChange={(e) => handleChange('stripePublishableKey', e.target.value)} placeholder="Stripe publishable key" className="px-4 py-2 border rounded-lg" />
                <input value={settings.stripeSecretKey || ''} onChange={(e) => handleChange('stripeSecretKey', e.target.value)} placeholder="Stripe secret key" className="px-4 py-2 border rounded-lg" />
                <input value={settings.bankName || ''} onChange={(e) => handleChange('bankName', e.target.value)} placeholder="Bank name" className="px-4 py-2 border rounded-lg" />
                <input value={settings.bankAccountLast4 || ''} onChange={(e) => handleChange('bankAccountLast4', e.target.value)} placeholder="Bank account last 4" className="px-4 py-2 border rounded-lg" />
              </div>
              <textarea value={settings.payoutInstructions || ''} onChange={(e) => handleChange('payoutInstructions', e.target.value)} placeholder="Payout / banking notes" rows={3} className="w-full mt-4 px-4 py-2 border rounded-lg" />
            </section>

            <button type="submit" className="btn-primary">Save Settings</button>
          </form>

          <aside className="card p-6 h-fit">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Two-Factor Authentication</h2>
            <p className="text-gray-600 mb-6">
              When enabled, this admin account will receive a verification code by email after entering the correct password.
            </p>
            <button onClick={handleTwoFactorToggle} className={twoFactorEnabled ? 'btn-secondary w-full' : 'btn-primary w-full'}>
              {twoFactorEnabled ? 'Disable Email/App 2FA' : 'Enable Email 2FA'}
            </button>
            <button onClick={startAuthenticatorSetup} className="btn-secondary w-full mt-3">
              Set Up Authenticator App
            </button>
            {twoFactorSetup && (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-gray-600">Add this secret to your authenticator app:</p>
                <p className="font-mono text-sm break-all bg-gray-100 p-3 rounded">{twoFactorSetup.secret}</p>
                <p className="text-xs text-gray-500 break-all">{twoFactorSetup.otpauthUrl}</p>
                <input value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} placeholder="Authenticator code" className="w-full px-4 py-2 border rounded-lg" />
                <button onClick={confirmAuthenticatorSetup} className="btn-primary w-full">Confirm App 2FA</button>
              </div>
            )}
          </aside>
        </div>
      )}
    </AdminLayout>
  )
}
