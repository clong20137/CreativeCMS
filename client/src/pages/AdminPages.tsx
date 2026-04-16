import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { adminAPI, resolveAssetUrl } from '../services/api'

const pageTabs = ['Homepage', 'Headers', 'Services Page', 'Pricing Page', 'Testimonials', 'Custom Pages']

const emptySettings = {
  heroTitle: '',
  heroSubtitle: '',
  heroPrimaryLabel: '',
  heroPrimaryUrl: '',
  heroSecondaryLabel: '',
  heroSecondaryUrl: '',
  heroMediaType: 'none',
  heroMediaUrl: '',
  pageHeaders: {} as Record<string, { title: string; subtitle: string }>,
  whatWeDo: [] as any[],
  featuredWork: [] as any[],
  services: [] as any[],
  webDesignPackages: [] as any[],
  faqs: [] as any[],
  googleReviewsEnabled: false,
  googlePlaceId: '',
  googleApiKey: '',
  testimonials: [] as any[]
}

const pageHeaderLabels: Record<string, string> = {
  portfolio: 'Portfolio',
  services: 'Services',
  pricing: 'Pricing',
  plugins: 'Plugins',
  contact: 'Contact'
}

const pluginOptions = [
  { value: 'restaurant', label: 'Restaurant Menu', url: '/plugins/restaurant' },
  { value: 'real-estate', label: 'Real Estate Listings', url: '/plugins/real-estate' },
  { value: 'booking', label: 'Booking Appointments', url: '/plugins/booking' },
  { value: 'plugins', label: 'All Plugins', url: '/plugins' }
]

const MAX_IMAGE_WIDTH = 1200
const MAX_IMAGE_HEIGHT = 800
const MAX_UPLOAD_DATA_URL_LENGTH = 640_000

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
  if (!file.type.startsWith('image/')) return readFileAsDataUrl(file)
  if (file.type === 'image/svg+xml' || file.type === 'image/gif' || file.type.includes('icon')) return readFileAsDataUrl(file)

  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await loadImage(objectUrl)
    let scale = Math.min(1, MAX_IMAGE_WIDTH / image.width, MAX_IMAGE_HEIGHT / image.height)
    let quality = 0.76

    for (let attempt = 0; attempt < 7; attempt += 1) {
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Image compression is not available in this browser.')
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      if (dataUrl.length <= MAX_UPLOAD_DATA_URL_LENGTH) return dataUrl
      scale *= 0.82
      quality = Math.max(0.52, quality - 0.06)
    }

    throw new Error('This image is still too large after compression. Please use a smaller image.')
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function getActivePayload(settings: typeof emptySettings, activeTab: string) {
  const payloadMap: Record<string, string[]> = {
    Homepage: [
      'heroTitle',
      'heroSubtitle',
      'heroPrimaryLabel',
      'heroPrimaryUrl',
      'heroSecondaryLabel',
      'heroSecondaryUrl',
      'heroMediaType',
      'heroMediaUrl',
      'whatWeDo',
      'featuredWork'
    ],
    Headers: ['pageHeaders'],
    'Services Page': ['services'],
    'Pricing Page': ['webDesignPackages', 'faqs'],
    Testimonials: ['googleReviewsEnabled', 'googlePlaceId', 'googleApiKey', 'testimonials']
  }

  return (payloadMap[activeTab] || []).reduce((payload: any, key) => {
    payload[key] = (settings as any)[key]
    return payload
  }, {})
}

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function AdminPages() {
  const [activeTab, setActiveTab] = useState('Homepage')
  const [settings, setSettings] = useState(emptySettings)
  const [pages, setPages] = useState<any[]>([])
  const [selectedPageId, setSelectedPageId] = useState<string>('new')
  const [pageDraft, setPageDraft] = useState<any>({
    title: '',
    slug: '',
    headerTitle: '',
    headerSubtitle: '',
    content: '',
    sections: [],
    metaTitle: '',
    metaDescription: '',
    isPublished: false,
    sortOrder: 0
  })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [draggingSectionIndex, setDraggingSectionIndex] = useState<number | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [settingsData, pagesData] = await Promise.all([adminAPI.getSiteSettings(), adminAPI.getPages()])
        setSettings({ ...emptySettings, ...settingsData })
        setPages(pagesData)
      } catch (err: any) {
        setError(err.error || 'Failed to load pages')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleChange = (key: string, value: any) => setSettings(prev => ({ ...prev, [key]: value }))

  const updateListItem = (key: string, index: number, field: string, value: any) => {
    setSettings(prev => {
      const list = [...((prev as any)[key] || [])]
      list[index] = { ...list[index], [field]: value }
      return { ...prev, [key]: list }
    })
  }

  const addListItem = (key: string) => setSettings(prev => ({ ...prev, [key]: [...((prev as any)[key] || []), {}] }))
  const removeListItem = (key: string, index: number) => setSettings(prev => ({ ...prev, [key]: ((prev as any)[key] || []).filter((_: any, i: number) => i !== index) }))

  const updatePageHeader = (page: string, field: 'title' | 'subtitle', value: string) => {
    setSettings(prev => ({
      ...prev,
      pageHeaders: {
        ...(prev.pageHeaders || {}),
        [page]: {
          ...(prev.pageHeaders?.[page] || {}),
          [field]: value
        }
      }
    }))
  }

  const saveSettingsTab = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      setMessage('Saving page edits...')
      const payload = getActivePayload(settings, activeTab)
      await adminAPI.updateSiteSettings(payload)
      setMessage('Page edits saved')
    } catch (err: any) {
      setMessage('')
      setError(err.error || 'Failed to save page edits')
    }
  }

  const selectPage = (page: any) => {
    setSelectedPageId(String(page.id))
    setPageDraft({ ...page, sections: Array.isArray(page.sections) ? page.sections : [] })
  }

  const startNewPage = () => {
    setSelectedPageId('new')
    setPageDraft({
      title: '',
      slug: '',
      headerTitle: '',
      headerSubtitle: '',
      content: '',
      sections: [],
      metaTitle: '',
      metaDescription: '',
      isPublished: false,
      sortOrder: pages.length * 10
    })
  }

  const updatePageDraft = (field: string, value: any) => {
    setPageDraft((current: any) => ({
      ...current,
      [field]: value,
      ...(field === 'title' && !current.slug ? { slug: makeSlug(value) } : {})
    }))
  }

  const uploadImageToField = async (setter: (url: string) => void, file: File | undefined) => {
    if (!file) return
    try {
      setError('')
      setMessage('Uploading image...')
      const dataUrl = await getUploadDataUrl(file)
      const upload = await adminAPI.uploadImage(dataUrl)
      setter(upload.url)
      setMessage('Image uploaded. Save to publish it.')
    } catch (err: any) {
      setMessage('')
      setError(err.error || err.message || 'Failed to upload image')
    }
  }

  const addPageSection = (type: string) => {
    const baseSection: any = {
      id: crypto.randomUUID(),
      type,
      title: '',
      body: '',
      imageUrl: '',
      alt: '',
      pluginSlug: 'plugins',
      buttonLabel: 'View Plugin'
    }
    setPageDraft((current: any) => ({ ...current, sections: [...(current.sections || []), baseSection] }))
  }

  const updatePageSection = (index: number, field: string, value: any) => {
    setPageDraft((current: any) => {
      const sections = [...(current.sections || [])]
      sections[index] = { ...sections[index], [field]: value }
      return { ...current, sections }
    })
  }

  const removePageSection = (index: number) => {
    setPageDraft((current: any) => ({ ...current, sections: (current.sections || []).filter((_: any, i: number) => i !== index) }))
  }

  const movePageSection = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex < 0) return

    setPageDraft((current: any) => {
      const sections = [...(current.sections || [])]
      if (fromIndex < 0 || fromIndex >= sections.length || toIndex >= sections.length) return current
      const [movedSection] = sections.splice(fromIndex, 1)
      sections.splice(toIndex, 0, movedSection)
      return { ...current, sections }
    })
  }

  const saveCustomPage = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      setMessage('Saving page...')
      const savedPage = selectedPageId === 'new'
        ? await adminAPI.createPage(pageDraft)
        : await adminAPI.updatePage(selectedPageId, pageDraft)

      setPages(current => {
        const withoutSaved = current.filter(page => page.id !== savedPage.id)
        return [...withoutSaved, savedPage].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
      })
      setSelectedPageId(String(savedPage.id))
      setPageDraft(savedPage)
      setMessage('Custom page saved')
    } catch (err: any) {
      setMessage('')
      setError(err.error || 'Failed to save custom page')
    }
  }

  const deleteCustomPage = async () => {
    if (selectedPageId === 'new') return

    try {
      await adminAPI.deletePage(selectedPageId)
      setPages(current => current.filter(page => String(page.id) !== selectedPageId))
      startNewPage()
      setMessage('Custom page deleted')
    } catch (err: any) {
      setError(err.error || 'Failed to delete custom page')
    }
  }

  return (
    <AdminLayout title="Website Pages">
      {message && <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">{message}</div>}
      {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">{error}</div>}
      {loading ? <PageSkeleton /> : (
        <div className="space-y-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {pageTabs.map(tab => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}>
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Custom Pages' ? (
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-[18rem_1fr]">
              <div className="card p-4 space-y-3">
                <button type="button" onClick={startNewPage} className={`w-full rounded-lg px-4 py-2 text-left font-semibold ${selectedPageId === 'new' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                  Add New Page
                </button>
                {pages.map(page => (
                  <button key={page.id} type="button" onClick={() => selectPage(page)} className={`w-full rounded-lg px-4 py-2 text-left font-semibold ${selectedPageId === String(page.id) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    {page.title}
                    <span className="block text-xs font-normal">{page.isPublished ? `/${page.slug}` : 'Draft'}</span>
                  </button>
                ))}
              </div>

              <form onSubmit={saveCustomPage} className="card p-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input value={pageDraft.title || ''} onChange={(e) => updatePageDraft('title', e.target.value)} placeholder="Page title" className="px-4 py-2 border rounded-lg" required />
                  <input value={pageDraft.slug || ''} onChange={(e) => updatePageDraft('slug', makeSlug(e.target.value))} placeholder="page-url" className="px-4 py-2 border rounded-lg" required />
                  <input value={pageDraft.headerTitle || ''} onChange={(e) => updatePageDraft('headerTitle', e.target.value)} placeholder="Header title" className="px-4 py-2 border rounded-lg" />
                  <input type="number" value={pageDraft.sortOrder ?? 0} onChange={(e) => updatePageDraft('sortOrder', Number(e.target.value))} placeholder="Sort order" className="px-4 py-2 border rounded-lg" />
                  <textarea value={pageDraft.headerSubtitle || ''} onChange={(e) => updatePageDraft('headerSubtitle', e.target.value)} placeholder="Header subtitle" rows={2} className="px-4 py-2 border rounded-lg md:col-span-2" />
                  <input value={pageDraft.metaTitle || ''} onChange={(e) => updatePageDraft('metaTitle', e.target.value)} placeholder="SEO title" className="px-4 py-2 border rounded-lg" />
                  <input value={pageDraft.metaDescription || ''} onChange={(e) => updatePageDraft('metaDescription', e.target.value)} placeholder="SEO description" className="px-4 py-2 border rounded-lg" />
                  <textarea value={pageDraft.content || ''} onChange={(e) => updatePageDraft('content', e.target.value)} placeholder="Fallback page content" rows={5} className="px-4 py-2 border rounded-lg md:col-span-2" />
                </div>
                <div className="space-y-4 rounded-lg border p-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Page Sections</h3>
                    <p className="text-gray-600">Build this page with headers, paragraphs, images, plugin callouts, and content sections.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => addPageSection('header')} className="btn-secondary">Add Header</button>
                    <button type="button" onClick={() => addPageSection('paragraph')} className="btn-secondary">Add Paragraph</button>
                    <button type="button" onClick={() => addPageSection('image')} className="btn-secondary">Add Image</button>
                    <button type="button" onClick={() => addPageSection('plugin')} className="btn-secondary">Add Plugin</button>
                    <button type="button" onClick={() => addPageSection('section')} className="btn-secondary">Add Section</button>
                  </div>
                  <div className="space-y-3">
                    {(pageDraft.sections || []).map((section: any, index: number) => (
                      <div
                        key={section.id || index}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (draggingSectionIndex !== null) movePageSection(draggingSectionIndex, index)
                          setDraggingSectionIndex(null)
                        }}
                        className={`rounded-lg border bg-gray-50 p-4 transition ${draggingSectionIndex === index ? 'opacity-60 ring-2 ring-blue-500' : ''}`}
                      >
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              draggable
                              onDragStart={(e) => {
                                setDraggingSectionIndex(index)
                                e.dataTransfer.effectAllowed = 'move'
                              }}
                              onDragEnd={() => setDraggingSectionIndex(null)}
                              className="cursor-grab rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-gray-700 active:cursor-grabbing"
                              title="Drag to reorder"
                            >
                              Drag
                            </button>
                            <select value={section.type || 'paragraph'} onChange={(e) => updatePageSection(index, 'type', e.target.value)} className="px-4 py-2 border rounded-lg">
                              <option value="header">Header</option>
                              <option value="paragraph">Paragraph</option>
                              <option value="image">Image</option>
                              <option value="plugin">Plugin</option>
                              <option value="section">Section</option>
                            </select>
                            <span className="text-sm font-semibold text-gray-500">#{index + 1}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => movePageSection(index, index - 1)} disabled={index === 0} className="px-3 py-2 border rounded-lg text-gray-700 hover:bg-white disabled:opacity-40">Up</button>
                            <button type="button" onClick={() => movePageSection(index, index + 1)} disabled={index === (pageDraft.sections || []).length - 1} className="px-3 py-2 border rounded-lg text-gray-700 hover:bg-white disabled:opacity-40">Down</button>
                            <button type="button" onClick={() => removePageSection(index)} className="px-3 py-2 border rounded-lg text-red-600 hover:bg-red-50">Remove Section</button>
                          </div>
                        </div>

                        {(section.type === 'header' || section.type === 'section' || section.type === 'plugin') && (
                          <input value={section.title || ''} onChange={(e) => updatePageSection(index, 'title', e.target.value)} placeholder="Section title" className="mb-3 w-full px-4 py-2 border rounded-lg" />
                        )}

                        {(section.type === 'paragraph' || section.type === 'section' || section.type === 'plugin') && (
                          <textarea value={section.body || ''} onChange={(e) => updatePageSection(index, 'body', e.target.value)} placeholder="Text content" rows={4} className="mb-3 w-full px-4 py-2 border rounded-lg" />
                        )}

                        {(section.type === 'image' || section.type === 'section') && (
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <input value={section.imageUrl || ''} onChange={(e) => updatePageSection(index, 'imageUrl', e.target.value)} placeholder="Image URL" className="px-4 py-2 border rounded-lg" />
                            <input value={section.alt || ''} onChange={(e) => updatePageSection(index, 'alt', e.target.value)} placeholder="Image description" className="px-4 py-2 border rounded-lg" />
                            <input type="file" accept="image/*" onChange={(e) => uploadImageToField((url) => updatePageSection(index, 'imageUrl', url), e.target.files?.[0])} className="px-4 py-2 border rounded-lg md:col-span-2" />
                            {section.imageUrl && <img src={resolveAssetUrl(section.imageUrl)} alt={section.alt || section.title || 'Section image'} className="h-48 w-full rounded-lg object-cover md:col-span-2" />}
                          </div>
                        )}

                        {section.type === 'plugin' && (
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <select value={section.pluginSlug || 'plugins'} onChange={(e) => updatePageSection(index, 'pluginSlug', e.target.value)} className="px-4 py-2 border rounded-lg">
                              {pluginOptions.map(plugin => <option key={plugin.value} value={plugin.value}>{plugin.label}</option>)}
                            </select>
                            <input value={section.buttonLabel || ''} onChange={(e) => updatePageSection(index, 'buttonLabel', e.target.value)} placeholder="Button label" className="px-4 py-2 border rounded-lg" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <label className="inline-flex items-center gap-2 font-semibold text-gray-700">
                  <input type="checkbox" checked={Boolean(pageDraft.isPublished)} onChange={(e) => updatePageDraft('isPublished', e.target.checked)} />
                  Publish this page
                </label>
                <div className="flex flex-wrap gap-3">
                  <button type="submit" className="btn-primary">Save Page</button>
                  {selectedPageId !== 'new' && <button type="button" onClick={deleteCustomPage} className="btn-secondary text-red-600">Delete Page</button>}
                </div>
              </form>
            </section>
          ) : (
            <form onSubmit={saveSettingsTab} className="space-y-6">
              <div className="card p-6 space-y-6">
                {activeTab === 'Homepage' && (
                  <section className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input value={settings.heroTitle || ''} onChange={(e) => handleChange('heroTitle', e.target.value)} placeholder="Homepage headline" className="px-4 py-2 border rounded-lg md:col-span-2" />
                      <textarea value={settings.heroSubtitle || ''} onChange={(e) => handleChange('heroSubtitle', e.target.value)} placeholder="Homepage description" rows={3} className="px-4 py-2 border rounded-lg md:col-span-2" />
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
                        <span className="block text-sm font-semibold text-gray-700 mb-2">Upload banner image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => uploadImageToField((url) => {
                            handleChange('heroMediaUrl', url)
                            handleChange('heroMediaType', 'image')
                          }, e.target.files?.[0])}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </label>
                      {settings.heroMediaUrl && (
                        <img
                          src={resolveAssetUrl(settings.heroMediaUrl)}
                          alt="Homepage banner preview"
                          className="h-48 w-full rounded-lg border object-cover md:col-span-2"
                        />
                      )}
                    </div>
                    <ListEditor title="What We Do" listKey="whatWeDo" items={settings.whatWeDo} fields={['title', 'desc']} updateListItem={updateListItem} addListItem={addListItem} removeListItem={removeListItem} uploadImageToField={uploadImageToField} />
                    <ListEditor title="Featured Work" listKey="featuredWork" items={settings.featuredWork} fields={['title', 'category', 'image', 'description']} updateListItem={updateListItem} addListItem={addListItem} removeListItem={removeListItem} uploadImageToField={uploadImageToField} />
                  </section>
                )}

                {activeTab === 'Headers' && (
                  <section className="space-y-4">
                    {Object.entries(pageHeaderLabels).map(([page, label]) => {
                      const header = settings.pageHeaders?.[page] || { title: '', subtitle: '' }
                      return (
                        <div key={page} className="rounded-lg border p-4">
                          <h3 className="mb-3 text-lg font-bold text-gray-900">{label}</h3>
                          <div className="grid grid-cols-1 gap-3">
                            <input value={header.title || ''} onChange={(e) => updatePageHeader(page, 'title', e.target.value)} placeholder={`${label} title`} className="px-4 py-2 border rounded-lg" />
                            <textarea value={header.subtitle || ''} onChange={(e) => updatePageHeader(page, 'subtitle', e.target.value)} placeholder={`${label} subtitle`} rows={2} className="px-4 py-2 border rounded-lg" />
                          </div>
                        </div>
                      )
                    })}
                  </section>
                )}

                {activeTab === 'Services Page' && <ListEditor title="Services Page" listKey="services" items={settings.services} fields={['title', 'description', 'features', 'url', 'image']} updateListItem={updateListItem} addListItem={addListItem} removeListItem={removeListItem} uploadImageToField={uploadImageToField} />}
                {activeTab === 'Pricing Page' && (
                  <section className="space-y-6">
                    <ListEditor title="Web Design Packages" listKey="webDesignPackages" items={settings.webDesignPackages} fields={['name', 'description', 'price', 'billingPeriod', 'features']} updateListItem={updateListItem} addListItem={addListItem} removeListItem={removeListItem} uploadImageToField={uploadImageToField} />
                    <ListEditor title="FAQ" listKey="faqs" items={settings.faqs} fields={['q', 'a']} updateListItem={updateListItem} addListItem={addListItem} removeListItem={removeListItem} uploadImageToField={uploadImageToField} />
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
                    <ListEditor title="Manual Testimonials" listKey="testimonials" items={settings.testimonials} fields={['name', 'company', 'role', 'image', 'text']} updateListItem={updateListItem} addListItem={addListItem} removeListItem={removeListItem} uploadImageToField={uploadImageToField} />
                  </section>
                )}
              </div>
              <button type="submit" className="btn-primary">Save Page Edits</button>
            </form>
          )}
        </div>
      )}
    </AdminLayout>
  )
}

function ListEditor({ title, listKey, items, fields, updateListItem, addListItem, removeListItem, uploadImageToField }: any) {
  const getFeatures = (item: any) => Array.isArray(item.features)
    ? item.features
    : String(item.features || '').split('\n').filter(Boolean)

  const updateFeature = (index: number, featureIndex: number, value: string) => {
    const currentItem = items[index] || {}
    const features = [...getFeatures(currentItem)]
    features[featureIndex] = value
    updateListItem(listKey, index, 'features', features)
  }

  const addFeature = (index: number) => {
    const currentItem = items[index] || {}
    updateListItem(listKey, index, 'features', [...getFeatures(currentItem), ''])
  }

  const removeFeature = (index: number, featureIndex: number) => {
    const currentItem = items[index] || {}
    updateListItem(listKey, index, 'features', getFeatures(currentItem).filter((_: string, i: number) => i !== featureIndex))
  }

  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-3">
        {(items || []).map((item: any, index: number) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2 border rounded-lg p-3">
            {fields.map((field: string) => (
              <div key={field}>
                {field === 'features' ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Features</p>
                    {getFeatures(item).map((feature: string, featureIndex: number) => (
                      <div key={featureIndex} className="flex gap-2">
                        <input value={feature} onChange={(e) => updateFeature(index, featureIndex, e.target.value)} placeholder="Feature" className="min-w-0 flex-1 px-4 py-2 border rounded-lg" />
                        <button type="button" onClick={() => removeFeature(index, featureIndex)} className="px-3 py-2 border rounded-lg text-red-600 hover:bg-red-50">Remove</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addFeature(index)} className="btn-secondary">Add Feature</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={Array.isArray(item[field]) ? item[field].join('\n') : item[field] || ''}
                      onChange={(e) => updateListItem(listKey, index, field, e.target.value)}
                      placeholder={field}
                      className="w-full px-4 py-2 border rounded-lg"
                      rows={field === 'description' || field === 'text' ? 3 : 1}
                    />
                    {field === 'image' && (
                      <>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => uploadImageToField((url: string) => updateListItem(listKey, index, 'image', url), e.target.files?.[0])}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                        {item.image && (
                          <img src={resolveAssetUrl(item.image)} alt={item.title || title} className="h-32 w-full rounded-lg object-cover" />
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
            <button type="button" onClick={() => removeListItem(listKey, index)} className="btn-secondary">Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => addListItem(listKey)} className="btn-secondary">Add {title}</button>
      </div>
    </section>
  )
}
