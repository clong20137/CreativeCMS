import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { adminAPI, usersAPI } from '../services/api'

const emptySettings = {
  siteName: '',
  faviconUrl: '',
  logoUrl: '',
  logoSize: 40,
  contactEmail: '',
  phone: '',
  hours: '',
  locationLine1: '',
  locationLine2: '',
  footerDescription: '',
  heroTitle: '',
  heroSubtitle: '',
  heroPrimaryLabel: '',
  heroPrimaryUrl: '',
  heroSecondaryLabel: '',
  heroSecondaryUrl: '',
  heroMediaType: 'none',
  heroMediaUrl: '',
  facebookUrl: '',
  instagramUrl: '',
  twitterUrl: '',
  linkedinUrl: '',
  whatWeDo: [] as any[],
  featuredWork: [] as any[],
  webDesignPackages: [] as any[],
  services: [] as any[],
  faqs: [] as any[],
  testimonials: [] as any[],
  googleReviewsEnabled: false,
  googlePlaceId: '',
  googleApiKey: '',
  stripePublishableKey: '',
  stripeSecretKey: '',
  stripeWebhookSecret: '',
  bankName: '',
  bankAccountLast4: '',
  payoutInstructions: '',
  turnstileSiteKey: '',
  turnstileSecretKey: ''
}

const tabs = ['General', 'Contact', 'Homepage', 'Services', 'Pricing', 'Testimonials', 'Payments', 'Security']
const MAX_DATA_URL_LENGTH = 900_000
const MAX_IMAGE_WIDTH = 1920
const MAX_IMAGE_HEIGHT = 1080
const IMAGE_QUALITY = 0.82

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to load image'))
    image.src = src
  })
}

async function getUploadDataUrl(file: File) {
  if (!file.type.startsWith('image/')) {
    const dataUrl = await readFileAsDataUrl(file)
    if (dataUrl.length > MAX_DATA_URL_LENGTH) {
      throw new Error('This upload is too large. Please use a hosted video URL or a smaller file.')
    }
    return dataUrl
  }

  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    const dataUrl = await readFileAsDataUrl(file)
    if (dataUrl.length > MAX_DATA_URL_LENGTH) {
      throw new Error('This image is too large. Please use a smaller image or paste a hosted image URL.')
    }
    return dataUrl
  }

  const objectUrl = URL.createObjectURL(file)

  try {
    const image = await loadImage(objectUrl)
    const scale = Math.min(1, MAX_IMAGE_WIDTH / image.width, MAX_IMAGE_HEIGHT / image.height)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.width * scale))
    canvas.height = Math.max(1, Math.round(image.height * scale))

    const context = canvas.getContext('2d')
    if (!context) throw new Error('Image compression is not available in this browser.')

    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', IMAGE_QUALITY)
    if (dataUrl.length > MAX_DATA_URL_LENGTH) {
      throw new Error('This image is still too large after compression. Please use a smaller image or paste a hosted image URL.')
    }
    return dataUrl
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('General')
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
        const [data, profile] = await Promise.all([adminAPI.getSiteSettings(), usersAPI.getProfile()])
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

  const handleChange = (key: string, value: any) => setSettings(prev => ({ ...prev, [key]: value }))
  const logoSize = Math.min(Math.max(Number(settings.logoSize) || 40, 24), 96)

  const handleUpload = async (key: string, file: File | undefined) => {
    if (!file) return
    try {
      setError('')
      setMessage('Preparing upload...')
      handleChange(key, await getUploadDataUrl(file))
      setMessage('Upload ready. Save settings to publish it.')
    } catch (err: any) {
      setMessage('')
      setError(err.message || 'Failed to prepare upload')
    }
  }

  const updateListItem = (key: string, index: number, field: string, value: any) => {
    setSettings(prev => {
      const list = [...((prev as any)[key] || [])]
      list[index] = { ...list[index], [field]: value }
      return { ...prev, [key]: list }
    })
  }

  const addListItem = (key: string, item: any) => setSettings(prev => ({ ...prev, [key]: [...((prev as any)[key] || []), item] }))
  const removeListItem = (key: string, index: number) => setSettings(prev => ({ ...prev, [key]: ((prev as any)[key] || []).filter((_: any, i: number) => i !== index) }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await adminAPI.updateSiteSettings(settings)
      setMessage('Site settings saved')
      document.title = settings.siteName || 'Creative by Caleb'
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

  const qrUrl = twoFactorSetup
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(twoFactorSetup.otpauthUrl)}`
    : ''

  return (
    <AdminLayout title="Site Settings">
      {message && <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">{message}</div>}
      {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">{error}</div>}
      {loading ? <PageSkeleton /> : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map(tab => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="card p-6 space-y-6">
            {activeTab === 'General' && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">Branding</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input value={settings.siteName} onChange={(e) => handleChange('siteName', e.target.value)} placeholder="Site name / text logo" className="px-4 py-2 border rounded-lg" />
                  <input value={settings.faviconUrl || ''} onChange={(e) => handleChange('faviconUrl', e.target.value)} placeholder="Favicon URL" className="px-4 py-2 border rounded-lg" />
                  <input value={settings.logoUrl || ''} onChange={(e) => handleChange('logoUrl', e.target.value)} placeholder="Logo URL" className="px-4 py-2 border rounded-lg" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_7rem] gap-4 items-end">
                  <label className="block">
                    <span className="block text-sm font-semibold text-gray-700 mb-2">Logo size</span>
                    <input
                      type="range"
                      min="24"
                      max="96"
                      value={logoSize}
                      onChange={(e) => handleChange('logoSize', Number(e.target.value))}
                      className="w-full"
                    />
                  </label>
                  <label className="block">
                    <span className="block text-sm font-semibold text-gray-700 mb-2">Pixels</span>
                    <input
                      type="number"
                      min="24"
                      max="96"
                      value={logoSize}
                      onChange={(e) => handleChange('logoSize', Number(e.target.value))}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="block text-sm font-semibold text-gray-700 mb-2">Upload logo</span>
                    <input type="file" accept="image/*" onChange={(e) => handleUpload('logoUrl', e.target.files?.[0])} className="w-full px-4 py-2 border rounded-lg" />
                  </label>
                  <label className="block">
                    <span className="block text-sm font-semibold text-gray-700 mb-2">Upload favicon</span>
                    <input type="file" accept="image/*" onChange={(e) => handleUpload('faviconUrl', e.target.files?.[0])} className="w-full px-4 py-2 border rounded-lg" />
                  </label>
                </div>
                {settings.logoUrl && (
                  <div className="rounded-lg border p-4">
                    <p className="mb-3 text-sm font-semibold text-gray-700">Logo preview</p>
                    <img
                      src={settings.logoUrl}
                      alt="Logo preview"
                      className="w-auto object-contain"
                      style={{ height: `${logoSize}px` }}
                    />
                  </div>
                )}
              </section>
            )}

            {activeTab === 'Contact' && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">Contact and Social Links</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input value={settings.contactEmail} onChange={(e) => handleChange('contactEmail', e.target.value)} placeholder="Contact email" className="px-4 py-2 border rounded-lg" />
                  <input value={settings.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="Phone number" className="px-4 py-2 border rounded-lg" />
                  <input value={settings.hours} onChange={(e) => handleChange('hours', e.target.value)} placeholder="Business hours" className="px-4 py-2 border rounded-lg" />
                  <input value={settings.locationLine1} onChange={(e) => handleChange('locationLine1', e.target.value)} placeholder="Location line 1" className="px-4 py-2 border rounded-lg" />
                  <input value={settings.locationLine2} onChange={(e) => handleChange('locationLine2', e.target.value)} placeholder="Location line 2" className="px-4 py-2 border rounded-lg md:col-span-2" />
                  <input value={settings.facebookUrl || ''} onChange={(e) => handleChange('facebookUrl', e.target.value)} placeholder="Facebook URL" className="px-4 py-2 border rounded-lg" />
                  <input value={settings.instagramUrl || ''} onChange={(e) => handleChange('instagramUrl', e.target.value)} placeholder="Instagram URL" className="px-4 py-2 border rounded-lg" />
                  <input value={settings.twitterUrl || ''} onChange={(e) => handleChange('twitterUrl', e.target.value)} placeholder="Twitter URL" className="px-4 py-2 border rounded-lg" />
                  <input value={settings.linkedinUrl || ''} onChange={(e) => handleChange('linkedinUrl', e.target.value)} placeholder="LinkedIn URL" className="px-4 py-2 border rounded-lg" />
                </div>
                <textarea value={settings.footerDescription} onChange={(e) => handleChange('footerDescription', e.target.value)} placeholder="Footer description" rows={3} className="w-full px-4 py-2 border rounded-lg" />
              </section>
            )}

            {activeTab === 'Homepage' && (
              <section className="space-y-6">
                <section className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900">Homepage Banner</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input value={settings.heroTitle || ''} onChange={(e) => handleChange('heroTitle', e.target.value)} placeholder="Banner headline" className="px-4 py-2 border rounded-lg md:col-span-2" />
                    <textarea value={settings.heroSubtitle || ''} onChange={(e) => handleChange('heroSubtitle', e.target.value)} placeholder="Banner description" rows={3} className="px-4 py-2 border rounded-lg md:col-span-2" />
                    <input value={settings.heroPrimaryLabel || ''} onChange={(e) => handleChange('heroPrimaryLabel', e.target.value)} placeholder="Primary button label" className="px-4 py-2 border rounded-lg" />
                    <input value={settings.heroPrimaryUrl || ''} onChange={(e) => handleChange('heroPrimaryUrl', e.target.value)} placeholder="Primary button URL" className="px-4 py-2 border rounded-lg" />
                    <input value={settings.heroSecondaryLabel || ''} onChange={(e) => handleChange('heroSecondaryLabel', e.target.value)} placeholder="Secondary button label" className="px-4 py-2 border rounded-lg" />
                    <input value={settings.heroSecondaryUrl || ''} onChange={(e) => handleChange('heroSecondaryUrl', e.target.value)} placeholder="Secondary button URL" className="px-4 py-2 border rounded-lg" />
                    <select value={settings.heroMediaType || 'none'} onChange={(e) => handleChange('heroMediaType', e.target.value)} className="px-4 py-2 border rounded-lg">
                      <option value="none">No media</option>
                      <option value="image">Image banner</option>
                      <option value="video">Video banner</option>
                    </select>
                    <input value={settings.heroMediaUrl || ''} onChange={(e) => handleChange('heroMediaUrl', e.target.value)} placeholder="Image or video URL" className="px-4 py-2 border rounded-lg" />
                    <label className="block md:col-span-2">
                      <span className="block text-sm font-semibold text-gray-700 mb-2">Upload banner image or video</span>
                      <input type="file" accept="image/*,video/*" onChange={(e) => handleUpload('heroMediaUrl', e.target.files?.[0])} className="w-full px-4 py-2 border rounded-lg" />
                    </label>
                  </div>
                </section>
                <ListEditor title="What We Do" listKey="whatWeDo" items={settings.whatWeDo} fields={['title', 'desc']} updateListItem={updateListItem} addListItem={addListItem} removeListItem={removeListItem} setError={setError} />
                <ListEditor title="Featured Work" listKey="featuredWork" items={settings.featuredWork} fields={['title', 'category', 'image', 'description']} updateListItem={updateListItem} addListItem={addListItem} removeListItem={removeListItem} setError={setError} />
              </section>
            )}

            {activeTab === 'Pricing' && (
              <section className="space-y-6">
                <ListEditor title="Web Design Packages" listKey="webDesignPackages" items={settings.webDesignPackages} fields={['name', 'description', 'price', 'billingPeriod', 'features']} updateListItem={updateListItem} addListItem={addListItem} removeListItem={removeListItem} setError={setError} />
                <ListEditor title="FAQ" listKey="faqs" items={settings.faqs} fields={['q', 'a']} updateListItem={updateListItem} addListItem={addListItem} removeListItem={removeListItem} setError={setError} />
              </section>
            )}

            {activeTab === 'Services' && (
              <section className="space-y-6">
                <ListEditor
                  title="Services Page"
                  listKey="services"
                  items={settings.services}
                  fields={['title', 'description', 'features', 'url', 'image']}
                  updateListItem={updateListItem}
                  addListItem={addListItem}
                  removeListItem={removeListItem}
                  setError={setError}
                />
              </section>
            )}

            {activeTab === 'Testimonials' && (
              <section className="space-y-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={settings.googleReviewsEnabled} onChange={(e) => handleChange('googleReviewsEnabled', e.target.checked)} />
                  Pull testimonials from Google Reviews
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input value={settings.googlePlaceId || ''} onChange={(e) => handleChange('googlePlaceId', e.target.value)} placeholder="Google Place ID" className="px-4 py-2 border rounded-lg" />
                  <input value={settings.googleApiKey || ''} onChange={(e) => handleChange('googleApiKey', e.target.value)} placeholder="Google API Key" className="px-4 py-2 border rounded-lg" />
                </div>
                <ListEditor title="Manual Testimonials" listKey="testimonials" items={settings.testimonials} fields={['name', 'company', 'role', 'image', 'text']} updateListItem={updateListItem} addListItem={addListItem} removeListItem={removeListItem} setError={setError} />
              </section>
            )}

            {activeTab === 'Payments' && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">Stripe and Payout Info</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input value={settings.stripePublishableKey || ''} onChange={(e) => handleChange('stripePublishableKey', e.target.value)} placeholder="Stripe publishable key" className="px-4 py-2 border rounded-lg" />
                  <input value={settings.stripeSecretKey || ''} onChange={(e) => handleChange('stripeSecretKey', e.target.value)} placeholder="Stripe secret key" className="px-4 py-2 border rounded-lg" />
                  <input value={settings.stripeWebhookSecret || ''} onChange={(e) => handleChange('stripeWebhookSecret', e.target.value)} placeholder="Stripe webhook signing secret" className="px-4 py-2 border rounded-lg md:col-span-2" />
                  <input value={settings.bankName || ''} onChange={(e) => handleChange('bankName', e.target.value)} placeholder="Bank name" className="px-4 py-2 border rounded-lg" />
                  <input value={settings.bankAccountLast4 || ''} onChange={(e) => handleChange('bankAccountLast4', e.target.value)} placeholder="Bank account last 4" className="px-4 py-2 border rounded-lg" />
                </div>
                <textarea value={settings.payoutInstructions || ''} onChange={(e) => handleChange('payoutInstructions', e.target.value)} placeholder="Payout / banking notes" rows={3} className="w-full px-4 py-2 border rounded-lg" />
              </section>
            )}

            {activeTab === 'Security' && (
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Two-Factor Authentication</h2>
                  <p className="text-gray-600 mb-6">Use email codes or an authenticator app on your phone.</p>
                  <button type="button" onClick={handleTwoFactorToggle} className={twoFactorEnabled ? 'btn-secondary' : 'btn-primary'}>
                    {twoFactorEnabled ? 'Disable 2FA' : 'Enable Email 2FA'}
                  </button>
                  <button type="button" onClick={startAuthenticatorSetup} className="btn-secondary ml-3">Set Up Authenticator App</button>
                </div>
                {twoFactorSetup && (
                  <div className="space-y-3">
                    <img src={qrUrl} alt="Authenticator QR code" className="w-44 h-44 border rounded-lg" />
                    <p className="font-mono text-sm break-all bg-gray-100 p-3 rounded">{twoFactorSetup.secret}</p>
                    <input value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} placeholder="Authenticator code" className="w-full px-4 py-2 border rounded-lg" />
                    <button type="button" onClick={confirmAuthenticatorSetup} className="btn-primary">Confirm App 2FA</button>
                  </div>
                )}
                <div className="space-y-4 lg:col-span-2">
                  <h2 className="text-2xl font-bold text-gray-900">Cloudflare Turnstile</h2>
                  <p className="text-gray-600">Protect login, account creation, password reset, and contact forms from bots.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input value={settings.turnstileSiteKey || ''} onChange={(e) => handleChange('turnstileSiteKey', e.target.value)} placeholder="Turnstile site key" className="px-4 py-2 border rounded-lg" />
                    <input value={settings.turnstileSecretKey || ''} onChange={(e) => handleChange('turnstileSecretKey', e.target.value)} placeholder="Turnstile secret key" className="px-4 py-2 border rounded-lg" />
                  </div>
                </div>
              </section>
            )}
          </div>

          <button type="submit" className="btn-primary">Save Settings</button>
        </form>
      )}
    </AdminLayout>
  )
}

function ListEditor({ title, listKey, items, fields, updateListItem, addListItem, removeListItem, setError }: any) {
  const handleListImageUpload = async (index: number, file: File | undefined) => {
    if (!file) return
    try {
      setError('')
      updateListItem(listKey, index, 'image', await getUploadDataUrl(file))
    } catch (err: any) {
      setError(err.message || 'Failed to prepare upload')
    }
  }

  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-3">
        {(items || []).map((item: any, index: number) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2 border rounded-lg p-3">
            {fields.map((field: string) => (
              <div key={field}>
                <textarea
                  value={Array.isArray(item[field]) ? item[field].join('\n') : item[field] || ''}
                  onChange={(e) => updateListItem(listKey, index, field, field === 'features' ? e.target.value.split('\n').filter(Boolean) : e.target.value)}
                  placeholder={field === 'features' ? 'features, one per line' : field}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={field === 'description' || field === 'text' || field === 'features' ? 3 : 1}
                />
                {field === 'image' && (
                  <input type="file" accept="image/*" onChange={(e) => handleListImageUpload(index, e.target.files?.[0])} className="mt-2 w-full px-3 py-2 border rounded-lg" />
                )}
              </div>
            ))}
            <button type="button" onClick={() => removeListItem(listKey, index)} className="btn-secondary">Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => addListItem(listKey, {})} className="btn-secondary">Add {title}</button>
      </div>
    </section>
  )
}
