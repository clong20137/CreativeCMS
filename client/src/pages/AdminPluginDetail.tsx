import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FiEdit, FiImage, FiPlus, FiTrash2, FiX } from 'react-icons/fi'
import AdminLayout from '../components/AdminLayout'
import MediaPicker from '../components/MediaPicker'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { adminAPI, resolveAssetUrl } from '../services/api'

const emptyMenuItem = {
  name: '',
  description: '',
  category: 'Entrees',
  price: '',
  image: '',
  isAvailable: true,
  sortOrder: '0'
}

const emptyListing = {
  title: '',
  address: '',
  description: '',
  price: '',
  image: '',
  moreInfoUrl: '',
  isActive: true,
  sortOrder: '0'
}

const emptyBookingSlot = {
  date: '',
  startTime: '09:00',
  endTime: '09:30',
  locationTypes: ['phone', 'zoom'],
  isActive: true
}

const emptyEventItem = {
  title: '',
  description: '',
  buttonLabel: 'Learn More',
  buttonUrl: '',
  image: '',
  eventDate: '',
  isActive: true,
  sortOrder: '0'
}

const emptyBlogPost = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: '',
  author: '',
  featuredImage: '',
  buttonLabel: 'Read Article',
  isPublished: true,
  publishedAt: '',
  sortOrder: '0'
}

const emptyProtectedContentItem = {
  title: '',
  description: '',
  contentType: 'video',
  previewImage: '',
  contentUrl: '',
  mediaAssetId: '',
  price: '',
  buttonLabel: 'Unlock Access',
  isActive: true,
  sortOrder: '0'
}

const meetingOptions = [
  { value: 'phone', label: 'Phone Call' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'google-meet', label: 'Google Meet' },
  { value: 'in-person', label: 'In Person' }
]

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function compressImage(file: File) {
  const dataUrl = await fileToDataUrl(file)
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })

  const maxWidth = 1000
  const maxHeight = 700
  const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.width * scale))
  canvas.height = Math.max(1, Math.round(image.height * scale))
  const context = canvas.getContext('2d')
  if (!context) return dataUrl
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.78)
}

function formatPrice(price: number | string) {
  return Number(price || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  })
}

export default function AdminPluginDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [plugin, setPlugin] = useState<any>(null)
  const [pluginPrice, setPluginPrice] = useState('')
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [listings, setListings] = useState<any[]>([])
  const [bookingSlots, setBookingSlots] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [eventItems, setEventItems] = useState<any[]>([])
  const [blogPosts, setBlogPosts] = useState<any[]>([])
  const [protectedContentItems, setProtectedContentItems] = useState<any[]>([])
  const [crmLeads, setCrmLeads] = useState<any[]>([])
  const [menuForm, setMenuForm] = useState(emptyMenuItem)
  const [listingForm, setListingForm] = useState(emptyListing)
  const [bookingForm, setBookingForm] = useState(emptyBookingSlot)
  const [eventForm, setEventForm] = useState(emptyEventItem)
  const [blogForm, setBlogForm] = useState(emptyBlogPost)
  const [protectedContentForm, setProtectedContentForm] = useState(emptyProtectedContentItem)
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null)
  const [editingListingId, setEditingListingId] = useState<string | null>(null)
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [editingBlogPostId, setEditingBlogPostId] = useState<string | null>(null)
  const [editingProtectedContentId, setEditingProtectedContentId] = useState<string | null>(null)
  const [showMenuForm, setShowMenuForm] = useState(false)
  const [showListingForm, setShowListingForm] = useState(false)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [showEventForm, setShowEventForm] = useState(false)
  const [showBlogForm, setShowBlogForm] = useState(false)
  const [showProtectedContentForm, setShowProtectedContentForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [imageUploading, setImageUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [mediaPicker, setMediaPicker] = useState<{ open: boolean; type: string; visibility: string; onSelect: null | ((url: string, asset?: any) => void) }>({ open: false, type: 'image', visibility: 'all', onSelect: null })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const plugins = await adminAPI.getPlugins()
      const foundPlugin = plugins.find(item => item.slug === slug)
      if (!foundPlugin) {
        navigate('/admin/plugins')
        return
      }

      setPlugin(foundPlugin)
      setPluginPrice(String(foundPlugin.price || 0))

      if (foundPlugin.slug === 'restaurant-menu') {
        setMenuItems(await adminAPI.getRestaurantMenuItems())
      }
      if (foundPlugin.slug === 'real-estate-listings') {
        setListings(await adminAPI.getRealEstateListings())
      }
      if (foundPlugin.slug === 'booking-appointments') {
        const [slots, bookingAppointments] = await Promise.all([
          adminAPI.getBookingSlots(),
          adminAPI.getBookingAppointments()
        ])
        setBookingSlots(slots)
        setAppointments(bookingAppointments)
      }
      if (foundPlugin.slug === 'events') {
        setEventItems(await adminAPI.getEventItems())
      }
      if (foundPlugin.slug === 'blog-articles') {
        setBlogPosts(await adminAPI.getBlogPosts())
      }
      if (foundPlugin.slug === 'protected-content') {
        setProtectedContentItems(await adminAPI.getProtectedContentAdminItems())
      }
      if (foundPlugin.slug === 'crm-quote-system') {
        setCrmLeads(await adminAPI.getCrmLeads())
      }
    } catch (err: any) {
      setError(err.error || 'Failed to load plugin')
    } finally {
      setLoading(false)
    }
  }, [navigate, slug])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const updatePlugin = async (updates: any) => {
    if (!plugin) return
    try {
      setError('')
      const updated = await adminAPI.updatePlugin(plugin.slug, updates)
      setPlugin(updated)
      setPluginPrice(String(updated.price || 0))
      setMessage('Plugin settings saved')
    } catch (err: any) {
      setError(err.error || 'Failed to save plugin')
    }
  }

  const uploadImage = async (file: File | undefined, setter: React.Dispatch<React.SetStateAction<any>>, field = 'image') => {
    if (!file) return
    try {
      setImageUploading(true)
      setError('')
      const dataUrl = await compressImage(file)
      const upload = await adminAPI.uploadImage(dataUrl)
      setter((current: any) => ({ ...current, [field]: upload.url }))
      setMessage('Image uploaded')
    } catch (err: any) {
      setError(err.error || 'Failed to upload image')
    } finally {
      setImageUploading(false)
    }
  }

  const openMediaPicker = (setter: React.Dispatch<React.SetStateAction<any>>, field = 'image', type = 'image', visibility = 'all') => {
    setMediaPicker({
      open: true,
      type,
      visibility,
      onSelect: (url: string) => setter((current: any) => ({ ...current, [field]: url }))
    })
  }

  const openProtectedMediaPicker = () => {
    setMediaPicker({
      open: true,
      type: protectedContentForm.contentType || 'all',
      visibility: 'private',
      onSelect: (url: string, asset?: any) => {
        setProtectedContentForm(current => ({
          ...current,
          contentUrl: url,
          mediaAssetId: asset?.id ? String(asset.id) : '',
          contentType: asset?.mediaType && ['image', 'video', 'document'].includes(asset.mediaType) ? asset.mediaType : current.contentType
        }))
      }
    })
  }

  const resetMenuForm = () => {
    setMenuForm(emptyMenuItem)
    setEditingMenuId(null)
    setShowMenuForm(false)
  }

  const resetListingForm = () => {
    setListingForm(emptyListing)
    setEditingListingId(null)
    setShowListingForm(false)
  }

  const saveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...menuForm,
        price: Number(menuForm.price || 0),
        sortOrder: Number(menuForm.sortOrder || 0)
      }
      if (editingMenuId) {
        await adminAPI.updateRestaurantMenuItem(editingMenuId, payload)
        setMessage('Menu item updated')
      } else {
        await adminAPI.createRestaurantMenuItem(payload)
        setMessage('Menu item created')
      }
      resetMenuForm()
      setMenuItems(await adminAPI.getRestaurantMenuItems())
    } catch (err: any) {
      setError(err.error || 'Failed to save menu item')
    }
  }

  const editMenuItem = (item: any) => {
    setEditingMenuId(String(item.id))
    setMenuForm({
      name: item.name || '',
      description: item.description || '',
      category: item.category || 'Entrees',
      price: String(item.price || ''),
      image: item.image || '',
      isAvailable: item.isAvailable !== false,
      sortOrder: String(item.sortOrder || 0)
    })
    setShowMenuForm(true)
  }

  const deleteMenuItem = async (id: string) => {
    if (!confirm('Delete this menu item?')) return
    await adminAPI.deleteRestaurantMenuItem(id)
    setMessage('Menu item deleted')
    setMenuItems(await adminAPI.getRestaurantMenuItems())
  }

  const saveListing = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...listingForm,
        price: Number(listingForm.price || 0),
        sortOrder: Number(listingForm.sortOrder || 0)
      }
      if (editingListingId) {
        await adminAPI.updateRealEstateListing(editingListingId, payload)
        setMessage('Listing updated')
      } else {
        await adminAPI.createRealEstateListing(payload)
        setMessage('Listing created')
      }
      resetListingForm()
      setListings(await adminAPI.getRealEstateListings())
    } catch (err: any) {
      setError(err.error || 'Failed to save listing')
    }
  }

  const editListing = (listing: any) => {
    setEditingListingId(String(listing.id))
    setListingForm({
      title: listing.title || '',
      address: listing.address || '',
      description: listing.description || '',
      price: String(listing.price || ''),
      image: listing.image || '',
      moreInfoUrl: listing.moreInfoUrl || '',
      isActive: listing.isActive !== false,
      sortOrder: String(listing.sortOrder || 0)
    })
    setShowListingForm(true)
  }

  const deleteListing = async (id: string) => {
    if (!confirm('Delete this listing?')) return
    await adminAPI.deleteRealEstateListing(id)
    setMessage('Listing deleted')
    setListings(await adminAPI.getRealEstateListings())
  }

  const resetBookingForm = () => {
    setBookingForm(emptyBookingSlot)
    setEditingSlotId(null)
    setShowBookingForm(false)
  }

  const toggleMeetingType = (type: string) => {
    setBookingForm(current => ({
      ...current,
      locationTypes: current.locationTypes.includes(type)
        ? current.locationTypes.filter(item => item !== type)
        : [...current.locationTypes, type]
    }))
  }

  const saveBookingSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...bookingForm,
        locationTypes: bookingForm.locationTypes.length > 0 ? bookingForm.locationTypes : ['phone']
      }
      if (editingSlotId) {
        await adminAPI.updateBookingSlot(editingSlotId, payload)
        setMessage('Availability slot updated')
      } else {
        await adminAPI.createBookingSlot(payload)
        setMessage('Availability slot created')
      }
      resetBookingForm()
      setBookingSlots(await adminAPI.getBookingSlots())
    } catch (err: any) {
      setError(err.error || 'Failed to save availability')
    }
  }

  const editBookingSlot = (slot: any) => {
    setEditingSlotId(String(slot.id))
    setBookingForm({
      date: slot.date || '',
      startTime: slot.startTime || '09:00',
      endTime: slot.endTime || '09:30',
      locationTypes: Array.isArray(slot.locationTypes) ? slot.locationTypes : ['phone'],
      isActive: slot.isActive !== false
    })
    setShowBookingForm(true)
  }

  const deleteBookingSlot = async (id: string) => {
    if (!confirm('Delete this availability slot?')) return
    await adminAPI.deleteBookingSlot(id)
    setMessage('Availability slot deleted')
    setBookingSlots(await adminAPI.getBookingSlots())
  }

  const updateAppointmentStatus = async (id: string, status: string) => {
    await adminAPI.updateBookingAppointment(id, { status })
    setMessage('Appointment updated')
    setAppointments(await adminAPI.getBookingAppointments())
  }

  const resetEventForm = () => {
    setEventForm(emptyEventItem)
    setEditingEventId(null)
    setShowEventForm(false)
  }

  const saveEventItem = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...eventForm,
        sortOrder: Number(eventForm.sortOrder || 0)
      }
      if (editingEventId) {
        await adminAPI.updateEventItem(editingEventId, payload)
        setMessage('Event updated')
      } else {
        await adminAPI.createEventItem(payload)
        setMessage('Event created')
      }
      resetEventForm()
      setEventItems(await adminAPI.getEventItems())
    } catch (err: any) {
      setError(err.error || 'Failed to save event')
    }
  }

  const editEventItem = (event: any) => {
    setEditingEventId(String(event.id))
    setEventForm({
      title: event.title || '',
      description: event.description || '',
      buttonLabel: event.buttonLabel || '',
      buttonUrl: event.buttonUrl || '',
      image: event.image || '',
      eventDate: event.eventDate || '',
      isActive: event.isActive !== false,
      sortOrder: String(event.sortOrder || 0)
    })
    setShowEventForm(true)
  }

  const deleteEventItem = async (id: string) => {
    if (!confirm('Delete this event?')) return
    await adminAPI.deleteEventItem(id)
    setMessage('Event deleted')
    setEventItems(await adminAPI.getEventItems())
  }

  const resetProtectedContentForm = () => {
    setProtectedContentForm(emptyProtectedContentItem)
    setEditingProtectedContentId(null)
    setShowProtectedContentForm(false)
  }

  const resetBlogForm = () => {
    setBlogForm(emptyBlogPost)
    setEditingBlogPostId(null)
    setShowBlogForm(false)
  }

  const saveBlogPost = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...blogForm,
        sortOrder: Number(blogForm.sortOrder || 0)
      }
      if (editingBlogPostId) {
        await adminAPI.updateBlogPost(editingBlogPostId, payload)
        setMessage('Article updated')
      } else {
        await adminAPI.createBlogPost(payload)
        setMessage('Article created')
      }
      resetBlogForm()
      setBlogPosts(await adminAPI.getBlogPosts())
    } catch (err: any) {
      setError(err.error || 'Failed to save article')
    }
  }

  const editBlogPost = (post: any) => {
    setEditingBlogPostId(String(post.id))
    setBlogForm({
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      category: post.category || '',
      author: post.author || '',
      featuredImage: post.featuredImage || '',
      buttonLabel: post.buttonLabel || 'Read Article',
      isPublished: post.isPublished !== false,
      publishedAt: post.publishedAt ? String(post.publishedAt).slice(0, 10) : '',
      sortOrder: String(post.sortOrder || 0)
    })
    setShowBlogForm(true)
  }

  const deleteBlogPost = async (id: string) => {
    if (!confirm('Delete this article?')) return
    await adminAPI.deleteBlogPost(id)
    setMessage('Article deleted')
    setBlogPosts(await adminAPI.getBlogPosts())
  }

  const saveProtectedContentItem = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...protectedContentForm,
        price: Number(protectedContentForm.price || 0),
        sortOrder: Number(protectedContentForm.sortOrder || 0)
      }
      if (editingProtectedContentId) {
        await adminAPI.updateProtectedContentAdminItem(editingProtectedContentId, payload)
        setMessage('Protected content updated')
      } else {
        await adminAPI.createProtectedContentAdminItem(payload)
        setMessage('Protected content created')
      }
      resetProtectedContentForm()
      setProtectedContentItems(await adminAPI.getProtectedContentAdminItems())
    } catch (err: any) {
      setError(err.error || 'Failed to save protected content')
    }
  }

  const editProtectedContentItem = (item: any) => {
    setEditingProtectedContentId(String(item.id))
    setProtectedContentForm({
      title: item.title || '',
      description: item.description || '',
      contentType: item.contentType || 'video',
      previewImage: item.previewImage || '',
      contentUrl: item.contentUrl || '',
      mediaAssetId: item.mediaAssetId ? String(item.mediaAssetId) : '',
      price: String(item.price || ''),
      buttonLabel: item.buttonLabel || 'Unlock Access',
      isActive: item.isActive !== false,
      sortOrder: String(item.sortOrder || 0)
    })
    setShowProtectedContentForm(true)
  }

  const deleteProtectedContentItem = async (id: string) => {
    if (!confirm('Delete this protected content item?')) return
    await adminAPI.deleteProtectedContentAdminItem(id)
    setMessage('Protected content deleted')
    setProtectedContentItems(await adminAPI.getProtectedContentAdminItems())
  }

  const updateCrmLead = async (id: string, updates: any) => {
    await adminAPI.updateCrmLead(id, updates)
    setMessage('CRM lead updated')
    setCrmLeads(await adminAPI.getCrmLeads())
  }

  const deleteCrmLead = async (id: string) => {
    if (!confirm('Delete this CRM lead?')) return
    await adminAPI.deleteCrmLead(id)
    setMessage('CRM lead deleted')
    setCrmLeads(await adminAPI.getCrmLeads())
  }

  return (
    <AdminLayout title={plugin?.name || 'Plugin'}>
      {message && <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">{message}</div>}
      {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">{error}</div>}

      {loading ? <PageSkeleton /> : (
        <div className="space-y-6 sm:space-y-8">
          <section className="card p-4 sm:p-6">
            <Link to="/admin/plugins" className="text-blue-600 font-semibold hover:text-blue-800">Back to Plugins</Link>
            <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{plugin.name}</h2>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${plugin.isPurchased ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {plugin.isPurchased ? 'Purchased' : 'Not purchased'}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${plugin.isEnabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                    {plugin.isEnabled ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-gray-600 max-w-3xl">{plugin.description}</p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:min-w-56 lg:w-auto">
                <label className="text-sm font-semibold text-gray-700">Plugin Price</label>
                <input type="number" min="0" step="0.01" value={pluginPrice} onChange={(e) => setPluginPrice(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                <button onClick={() => updatePlugin({ price: Number(pluginPrice || 0), isEnabled: plugin.isEnabled })} className="w-full btn-primary">Save Price</button>
                <button onClick={() => updatePlugin({ price: Number(pluginPrice || 0), isEnabled: !plugin.isEnabled })} className="w-full btn-secondary">
                  {plugin.isEnabled ? 'Deactivate Plugin' : 'Activate Plugin'}
                </button>
              </div>
            </div>
          </section>

          {plugin.slug === 'restaurant-menu' && (
            <>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Restaurant Menu Items</h2>
                  <p className="text-gray-600">Price shown to buyers: {formatPrice(plugin.price)}</p>
                </div>
                <button onClick={() => { setShowMenuForm(!showMenuForm); setEditingMenuId(null) }} className="inline-flex w-full items-center justify-center gap-2 btn-primary md:w-auto">
                  {showMenuForm ? <FiX /> : <FiPlus />}
                  {showMenuForm ? 'Close Form' : 'Add Menu Item'}
                </button>
              </div>

              {showMenuForm && (
                <form onSubmit={saveMenuItem} className="card space-y-4 p-4 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Item name" value={menuForm.name} onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
                    <input type="text" placeholder="Category" value={menuForm.category} onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
                    <input type="number" min="0" step="0.01" placeholder="Price" value={menuForm.price} onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
                    <input type="number" placeholder="Sort order" value={menuForm.sortOrder} onChange={(e) => setMenuForm({ ...menuForm, sortOrder: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  </div>
                  <textarea placeholder="Description" value={menuForm.description} onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" rows={3} />
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-start">
                    <input type="url" placeholder="Image URL" value={menuForm.image} onChange={(e) => setMenuForm({ ...menuForm, image: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    <button type="button" onClick={() => openMediaPicker(setMenuForm)} className="inline-flex items-center justify-center gap-2 px-4 py-2 border text-gray-700 rounded-lg hover:bg-gray-50">
                      <FiImage /> Choose Media
                    </button>
                    <label className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-blue-50 hover:text-blue-700">
                      <FiImage /> {imageUploading ? 'Uploading...' : 'Upload Image'}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e.target.files?.[0], setMenuForm)} />
                    </label>
                  </div>
                  {menuForm.image && <img src={resolveAssetUrl(menuForm.image)} alt={menuForm.name || 'Menu item'} className="h-32 w-48 rounded-lg object-cover border" />}
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={menuForm.isAvailable} onChange={(e) => setMenuForm({ ...menuForm, isAvailable: e.target.checked })} />
                    Available on menu
                  </label>
                  <button type="submit" className="w-full btn-primary sm:w-auto">{editingMenuId ? 'Save Menu Item' : 'Create Menu Item'}</button>
                </form>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
                {menuItems.map((item) => (
                  <div key={item.id} className="card overflow-hidden">
                    {item.image ? <img src={resolveAssetUrl(item.image)} alt={item.name} className="h-48 w-full object-cover" /> : <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-500">No image</div>}
                    <div className="p-4 sm:p-6">
                      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:justify-between sm:gap-4">
                        <div>
                          <p className="text-sm font-semibold text-blue-600">{item.category}</p>
                          <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                        </div>
                        <p className="text-xl font-bold text-gray-900">${Number(item.price || 0).toFixed(2)}</p>
                      </div>
                      <p className="text-gray-600 mb-4">{item.description || 'No description'}</p>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button onClick={() => editMenuItem(item)} className="inline-flex items-center justify-center gap-1 rounded-lg bg-blue-100 px-3 py-2 text-blue-700 hover:bg-blue-200"><FiEdit /> Edit</button>
                        <button onClick={() => deleteMenuItem(String(item.id))} className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-100 px-3 py-2 text-red-700 hover:bg-red-200"><FiTrash2 /> Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
                {menuItems.length === 0 && <div className="card p-6 text-center text-gray-600 sm:p-8 xl:col-span-3">No menu items yet.</div>}
              </div>
            </>
          )}

          {plugin.slug === 'real-estate-listings' && (
            <>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Real Estate Listings</h2>
                  <p className="text-gray-600">Price shown to buyers: {formatPrice(plugin.price)}</p>
                </div>
                <button onClick={() => { setShowListingForm(!showListingForm); setEditingListingId(null) }} className="inline-flex w-full items-center justify-center gap-2 btn-primary md:w-auto">
                  {showListingForm ? <FiX /> : <FiPlus />}
                  {showListingForm ? 'Close Form' : 'Add Listing'}
                </button>
              </div>

              {showListingForm && (
                <form onSubmit={saveListing} className="card space-y-4 p-4 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Listing title" value={listingForm.title} onChange={(e) => setListingForm({ ...listingForm, title: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
                    <input type="text" placeholder="Address or location" value={listingForm.address} onChange={(e) => setListingForm({ ...listingForm, address: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    <input type="number" min="0" step="1" placeholder="Price" value={listingForm.price} onChange={(e) => setListingForm({ ...listingForm, price: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
                    <input type="number" placeholder="Sort order" value={listingForm.sortOrder} onChange={(e) => setListingForm({ ...listingForm, sortOrder: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  </div>
                  <textarea placeholder="Description" value={listingForm.description} onChange={(e) => setListingForm({ ...listingForm, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" rows={3} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="url" placeholder="Image URL" value={listingForm.image} onChange={(e) => setListingForm({ ...listingForm, image: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    <input type="url" placeholder="More info URL, optional" value={listingForm.moreInfoUrl} onChange={(e) => setListingForm({ ...listingForm, moreInfoUrl: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  </div>
                  <label className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-blue-50 hover:text-blue-700">
                    <FiImage /> {imageUploading ? 'Uploading...' : 'Upload Listing Image'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e.target.files?.[0], setListingForm)} />
                  </label>
                  <button type="button" onClick={() => openMediaPicker(setListingForm)} className="inline-flex items-center justify-center gap-2 px-4 py-2 border text-gray-700 rounded-lg hover:bg-gray-50">
                    <FiImage /> Choose Media
                  </button>
                  {listingForm.image && <img src={resolveAssetUrl(listingForm.image)} alt={listingForm.title || 'Listing'} className="h-32 w-48 rounded-lg object-cover border" />}
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={listingForm.isActive} onChange={(e) => setListingForm({ ...listingForm, isActive: e.target.checked })} />
                    Show listing publicly
                  </label>
                  <button type="submit" className="w-full btn-primary sm:w-auto">{editingListingId ? 'Save Listing' : 'Create Listing'}</button>
                </form>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
                {listings.map((listing) => (
                  <div key={listing.id} className="card overflow-hidden">
                    {listing.image ? <img src={resolveAssetUrl(listing.image)} alt={listing.title} className="h-48 w-full object-cover" /> : <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-500">No image</div>}
                    <div className="p-4 sm:p-6">
                      <p className="text-xl font-bold text-blue-600 mb-2">{formatPrice(listing.price)}</p>
                      <h3 className="text-xl font-bold text-gray-900">{listing.title}</h3>
                      {listing.address && <p className="text-sm font-semibold text-gray-500 mt-1">{listing.address}</p>}
                      <p className="text-gray-600 my-4">{listing.description || 'No description'}</p>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button onClick={() => editListing(listing)} className="inline-flex items-center justify-center gap-1 rounded-lg bg-blue-100 px-3 py-2 text-blue-700 hover:bg-blue-200"><FiEdit /> Edit</button>
                        <button onClick={() => deleteListing(String(listing.id))} className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-100 px-3 py-2 text-red-700 hover:bg-red-200"><FiTrash2 /> Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
                {listings.length === 0 && <div className="card p-6 text-center text-gray-600 sm:p-8 xl:col-span-3">No listings yet.</div>}
              </div>
            </>
          )}

          {plugin.slug === 'booking-appointments' && (
            <>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Availability</h2>
                  <p className="text-gray-600">Price shown to buyers: {formatPrice(plugin.price)}</p>
                </div>
                <button onClick={() => { setShowBookingForm(!showBookingForm); setEditingSlotId(null) }} className="inline-flex w-full items-center justify-center gap-2 btn-primary md:w-auto">
                  {showBookingForm ? <FiX /> : <FiPlus />}
                  {showBookingForm ? 'Close Form' : 'Add Time Slot'}
                </button>
              </div>

              {showBookingForm && (
                <form onSubmit={saveBookingSlot} className="card space-y-4 p-4 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="date" value={bookingForm.date} onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
                    <input type="time" value={bookingForm.startTime} onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
                    <input type="time" value={bookingForm.endTime} onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {meetingOptions.map(option => (
                      <label key={option.value} className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm text-gray-700">
                        <input type="checkbox" checked={bookingForm.locationTypes.includes(option.value)} onChange={() => toggleMeetingType(option.value)} />
                        {option.label}
                      </label>
                    ))}
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={bookingForm.isActive} onChange={(e) => setBookingForm({ ...bookingForm, isActive: e.target.checked })} />
                    Show this slot publicly
                  </label>
                  <button type="submit" className="w-full btn-primary sm:w-auto">{editingSlotId ? 'Save Time Slot' : 'Create Time Slot'}</button>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {bookingSlots.map((slot) => (
                  <div key={slot.id} className="card p-6">
                    <div className="flex justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{new Date(`${slot.date}T00:00:00`).toLocaleDateString()}</h3>
                        <p className="text-blue-600 font-semibold">{slot.startTime} - {slot.endTime}</p>
                      </div>
                      <span className={`h-fit px-2 py-1 rounded text-xs font-semibold ${slot.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                        {slot.isActive ? 'Shown' : 'Hidden'}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-5">
                      {(slot.locationTypes || []).map((type: string) => meetingOptions.find(option => option.value === type)?.label || type).join(', ')}
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => editBookingSlot(slot)} className="inline-flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"><FiEdit /> Edit</button>
                      <button onClick={() => deleteBookingSlot(String(slot.id))} className="inline-flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><FiTrash2 /> Delete</button>
                    </div>
                  </div>
                ))}
                {bookingSlots.length === 0 && <div className="card p-8 text-center text-gray-600 xl:col-span-3">No availability slots yet.</div>}
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Appointments</h2>
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="card p-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{appointment.name}</h3>
                          <p className="text-gray-600">{appointment.email}{appointment.phone ? ` | ${appointment.phone}` : ''}</p>
                          <p className="text-blue-700 font-semibold mt-2">
                            {appointment.BookingAvailabilitySlot?.date} {appointment.BookingAvailabilitySlot?.startTime} - {appointment.BookingAvailabilitySlot?.endTime}
                          </p>
                          <p className="text-gray-600 capitalize">{String(appointment.meetingType).replace('-', ' ')}</p>
                          {appointment.notes && <p className="text-gray-600 mt-2">{appointment.notes}</p>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {['scheduled', 'completed', 'cancelled'].map(status => (
                            <button key={status} onClick={() => updateAppointmentStatus(String(appointment.id), status)} className={`px-3 py-2 rounded-lg text-sm font-semibold capitalize ${appointment.status === status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700'}`}>
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  {appointments.length === 0 && <div className="card p-8 text-center text-gray-600">No appointments booked yet.</div>}
                </div>
              </div>
            </>
          )}

          {plugin.slug === 'events' && (
            <>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Events</h2>
                  <p className="text-gray-600">Price shown to buyers: {formatPrice(plugin.price)}</p>
                </div>
                <button onClick={() => { setShowEventForm(!showEventForm); setEditingEventId(null) }} className="inline-flex items-center gap-2 btn-primary">
                  {showEventForm ? <FiX /> : <FiPlus />}
                  {showEventForm ? 'Close Form' : 'Add Event'}
                </button>
              </div>

              {showEventForm && (
                <form onSubmit={saveEventItem} className="card p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Event title" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
                    <input type="date" value={eventForm.eventDate} onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
                    <input type="text" placeholder="Button label" value={eventForm.buttonLabel} onChange={(e) => setEventForm({ ...eventForm, buttonLabel: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    <input type="text" placeholder="Button URL" value={eventForm.buttonUrl} onChange={(e) => setEventForm({ ...eventForm, buttonUrl: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    <input type="number" placeholder="Sort order" value={eventForm.sortOrder} onChange={(e) => setEventForm({ ...eventForm, sortOrder: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  </div>
                  <textarea placeholder="Description" value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" rows={4} />
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-start">
                    <input type="text" placeholder="Image URL" value={eventForm.image} onChange={(e) => setEventForm({ ...eventForm, image: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    <button type="button" onClick={() => openMediaPicker(setEventForm)} className="inline-flex items-center justify-center gap-2 px-4 py-2 border text-gray-700 rounded-lg hover:bg-gray-50">
                      <FiImage /> Choose Media
                    </button>
                    <label className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-blue-50 hover:text-blue-700">
                      <FiImage /> {imageUploading ? 'Uploading...' : 'Upload Image'}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e.target.files?.[0], setEventForm)} />
                    </label>
                  </div>
                  {eventForm.image && <img src={resolveAssetUrl(eventForm.image)} alt={eventForm.title || 'Event'} className="h-32 w-48 rounded-lg object-cover border" />}
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={eventForm.isActive} onChange={(e) => setEventForm({ ...eventForm, isActive: e.target.checked })} />
                    Show event publicly
                  </label>
                  <button type="submit" className="btn-primary">{editingEventId ? 'Save Event' : 'Create Event'}</button>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {eventItems.map((event) => (
                  <div key={event.id} className="card overflow-hidden">
                    {event.image ? <img src={resolveAssetUrl(event.image)} alt={event.title} className="h-48 w-full object-cover" /> : <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-500">No image</div>}
                    <div className="p-6">
                      <p className="text-sm font-bold uppercase text-blue-600 mb-2">{event.eventDate ? new Date(`${event.eventDate}T00:00:00`).toLocaleDateString() : 'No date'}</p>
                      <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
                      <p className="text-gray-600 my-4">{event.description || 'No description'}</p>
                      {event.buttonLabel && <p className="text-sm font-semibold text-gray-600 mb-4">Button: {event.buttonLabel}</p>}
                      <div className="flex gap-2">
                        <button onClick={() => editEventItem(event)} className="inline-flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"><FiEdit /> Edit</button>
                        <button onClick={() => deleteEventItem(String(event.id))} className="inline-flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><FiTrash2 /> Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
                {eventItems.length === 0 && <div className="card p-8 text-center text-gray-600 xl:col-span-3">No events yet.</div>}
              </div>
            </>
          )}

          {plugin.slug === 'blog-articles' && (
            <>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Blog Articles</h2>
                  <p className="text-gray-600">Publish articles with excerpts, categories, feature images, and detail pages.</p>
                </div>
                <button onClick={() => { setShowBlogForm(!showBlogForm); setEditingBlogPostId(null) }} className="inline-flex items-center gap-2 btn-primary">
                  {showBlogForm ? <FiX /> : <FiPlus />}
                  {showBlogForm ? 'Close Form' : 'Add Article'}
                </button>
              </div>

              {showBlogForm && (
                <form onSubmit={saveBlogPost} className="card space-y-4 p-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <input type="text" placeholder="Article title" value={blogForm.title} onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
                    <input type="text" placeholder="Article slug" value={blogForm.slug} onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    <input type="text" placeholder="Category" value={blogForm.category} onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    <input type="text" placeholder="Author" value={blogForm.author} onChange={(e) => setBlogForm({ ...blogForm, author: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    <input type="text" placeholder="Button label" value={blogForm.buttonLabel} onChange={(e) => setBlogForm({ ...blogForm, buttonLabel: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    <input type="date" value={blogForm.publishedAt} onChange={(e) => setBlogForm({ ...blogForm, publishedAt: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    <input type="number" placeholder="Sort order" value={blogForm.sortOrder} onChange={(e) => setBlogForm({ ...blogForm, sortOrder: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  </div>
                  <textarea placeholder="Excerpt" value={blogForm.excerpt} onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" rows={3} />
                  <textarea placeholder="Article content" value={blogForm.content} onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" rows={8} />
                  <div className="grid grid-cols-1 gap-4 items-start lg:grid-cols-[1fr_auto]">
                    <input type="text" placeholder="Featured image URL" value={blogForm.featuredImage} onChange={(e) => setBlogForm({ ...blogForm, featuredImage: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    <button type="button" onClick={() => openMediaPicker(setBlogForm, 'featuredImage')} className="inline-flex items-center justify-center gap-2 px-4 py-2 border text-gray-700 rounded-lg hover:bg-gray-50">
                      <FiImage /> Choose Media
                    </button>
                    <label className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-blue-50 hover:text-blue-700">
                      <FiImage /> {imageUploading ? 'Uploading...' : 'Upload Image'}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e.target.files?.[0], setBlogForm, 'featuredImage')} />
                    </label>
                  </div>
                  {blogForm.featuredImage && <img src={resolveAssetUrl(blogForm.featuredImage)} alt={blogForm.title || 'Article'} className="h-32 w-48 rounded-lg object-cover border" />}
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={blogForm.isPublished} onChange={(e) => setBlogForm({ ...blogForm, isPublished: e.target.checked })} />
                    Publish this article
                  </label>
                  <button type="submit" className="btn-primary">{editingBlogPostId ? 'Save Article' : 'Create Article'}</button>
                </form>
              )}

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {blogPosts.map((post) => (
                  <div key={post.id} className="card overflow-hidden">
                    {post.featuredImage ? <img src={resolveAssetUrl(post.featuredImage)} alt={post.title} className="h-48 w-full object-cover" /> : <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-500">No image</div>}
                    <div className="p-6">
                      <div className="mb-2 flex flex-wrap gap-2">
                        {post.category && <span className="rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">{post.category}</span>}
                        <span className={`rounded px-2 py-1 text-xs font-semibold ${post.isPublished ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                          {post.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{post.title}</h3>
                      {(post.author || post.publishedAt) && (
                        <p className="mt-2 text-sm text-gray-500">
                          {post.author ? `By ${post.author}` : ''}{post.author && post.publishedAt ? ' | ' : ''}{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''}
                        </p>
                      )}
                      <p className="my-4 text-gray-600">{post.excerpt || 'No excerpt yet.'}</p>
                      <div className="flex gap-2">
                        <button onClick={() => editBlogPost(post)} className="inline-flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"><FiEdit /> Edit</button>
                        <button onClick={() => deleteBlogPost(String(post.id))} className="inline-flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><FiTrash2 /> Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
                {blogPosts.length === 0 && <div className="card p-8 text-center text-gray-600 xl:col-span-3">No articles yet.</div>}
              </div>
            </>
          )}

          {plugin.slug === 'protected-content' && (
            <>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Protected Content</h2>
                  <p className="text-gray-600">Sell private videos, images, and documents to logged-in clients.</p>
                </div>
                <button onClick={() => { setShowProtectedContentForm(!showProtectedContentForm); setEditingProtectedContentId(null) }} className="inline-flex items-center gap-2 btn-primary">
                  {showProtectedContentForm ? <FiX /> : <FiPlus />}
                  {showProtectedContentForm ? 'Close Form' : 'Add Protected Item'}
                </button>
              </div>

              {showProtectedContentForm && (
                <form onSubmit={saveProtectedContentItem} className="card p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Content title" value={protectedContentForm.title} onChange={(e) => setProtectedContentForm({ ...protectedContentForm, title: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
                    <select value={protectedContentForm.contentType} onChange={(e) => setProtectedContentForm({ ...protectedContentForm, contentType: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                      <option value="video">Video</option>
                      <option value="image">Image</option>
                      <option value="document">Document</option>
                    </select>
                    <input type="number" min="0" step="0.01" placeholder="Price" value={protectedContentForm.price} onChange={(e) => setProtectedContentForm({ ...protectedContentForm, price: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
                    <input type="number" placeholder="Sort order" value={protectedContentForm.sortOrder} onChange={(e) => setProtectedContentForm({ ...protectedContentForm, sortOrder: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    <input type="text" placeholder="Button label" value={protectedContentForm.buttonLabel} onChange={(e) => setProtectedContentForm({ ...protectedContentForm, buttonLabel: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  </div>
                  <textarea placeholder="Description" value={protectedContentForm.description} onChange={(e) => setProtectedContentForm({ ...protectedContentForm, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" rows={4} />
                  <div className="grid grid-cols-1 gap-4">
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
                      Public upload URLs can be copied. Use a private media asset here for paid videos, images, and documents.
                    </div>
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
                      <input type="text" placeholder="Private content URL, returned only after purchase" value={protectedContentForm.contentUrl} onChange={(e) => setProtectedContentForm({ ...protectedContentForm, contentUrl: e.target.value, mediaAssetId: '' })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
                      <button type="button" onClick={openProtectedMediaPicker} className="inline-flex items-center justify-center gap-2 px-4 py-2 border text-gray-700 rounded-lg hover:bg-gray-50">
                        <FiImage /> Choose Private Media
                      </button>
                    </div>
                    {protectedContentForm.mediaAssetId && <p className="text-sm font-semibold text-green-700">Private media asset #{protectedContentForm.mediaAssetId} selected.</p>}
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-start">
                      <input type="text" placeholder="Preview image URL" value={protectedContentForm.previewImage} onChange={(e) => setProtectedContentForm({ ...protectedContentForm, previewImage: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                      <button type="button" onClick={() => openMediaPicker(setProtectedContentForm, 'previewImage')} className="inline-flex items-center justify-center gap-2 px-4 py-2 border text-gray-700 rounded-lg hover:bg-gray-50">
                        <FiImage /> Choose Media
                      </button>
                      <label className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-blue-50 hover:text-blue-700">
                        <FiImage /> {imageUploading ? 'Uploading...' : 'Upload Preview'}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e.target.files?.[0], setProtectedContentForm, 'previewImage')} />
                      </label>
                    </div>
                  </div>
                  {protectedContentForm.previewImage && <img src={resolveAssetUrl(protectedContentForm.previewImage)} alt={protectedContentForm.title || 'Preview'} className="h-32 w-48 rounded-lg object-cover border" />}
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={protectedContentForm.isActive} onChange={(e) => setProtectedContentForm({ ...protectedContentForm, isActive: e.target.checked })} />
                    Show this content publicly
                  </label>
                  <button type="submit" className="btn-primary">{editingProtectedContentId ? 'Save Protected Item' : 'Create Protected Item'}</button>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {protectedContentItems.map((item) => (
                  <div key={item.id} className="card overflow-hidden">
                    {item.previewImage ? <img src={resolveAssetUrl(item.previewImage)} alt={item.title} className="h-48 w-full object-cover" /> : <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-500">No preview</div>}
                    <div className="p-6">
                      <div className="mb-2 flex flex-wrap gap-2">
                        <span className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold capitalize text-gray-700">{item.contentType}</span>
                        <span className={`rounded px-2 py-1 text-xs font-semibold ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>{item.isActive ? 'Shown' : 'Hidden'}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                      <p className="mt-2 text-2xl font-bold text-blue-600">{formatPrice(item.price)}</p>
                      <p className="text-gray-600 my-4">{item.description || 'No description'}</p>
                      <div className="flex gap-2">
                        <button onClick={() => editProtectedContentItem(item)} className="inline-flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"><FiEdit /> Edit</button>
                        <button onClick={() => deleteProtectedContentItem(String(item.id))} className="inline-flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><FiTrash2 /> Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
                {protectedContentItems.length === 0 && <div className="card p-8 text-center text-gray-600 xl:col-span-3">No protected content yet.</div>}
              </div>
            </>
          )}

          {plugin.slug === 'crm-quote-system' && (
            <>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">CRM Leads</h2>
                <p className="text-gray-600">Quote requests submitted through CRM sections appear here.</p>
              </div>

              <div className="space-y-4">
                {crmLeads.map((lead) => (
                  <div key={lead.id} className="card p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-bold text-gray-900">{lead.name}</h3>
                          <span className="rounded bg-blue-100 px-2 py-1 text-xs font-semibold capitalize text-blue-800">{lead.status}</span>
                          <span className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">{lead.inquiryType || 'quote'}</span>
                        </div>
                        <p className="text-gray-600">{lead.email}{lead.phone ? ` | ${lead.phone}` : ''}</p>
                        {lead.company && <p className="text-gray-600">{lead.company}</p>}
                        {lead.serviceTitle && <p className="mt-3 font-semibold text-blue-700">Service: {lead.serviceTitle}</p>}
                        {(lead.budget || lead.timeline || lead.preferredContact) && (
                          <p className="mt-2 text-sm text-gray-600">
                            {[lead.budget && `Budget: ${lead.budget}`, lead.timeline && `Timeline: ${lead.timeline}`, lead.preferredContact && `Contact: ${lead.preferredContact}`].filter(Boolean).join(' | ')}
                          </p>
                        )}
                        {lead.description && <p className="mt-3 whitespace-pre-line text-gray-700">{lead.description}</p>}
                        {lead.sourcePage && <p className="mt-3 text-sm text-gray-500">Source: {lead.sourcePage}</p>}
                        <p className="mt-2 text-xs text-gray-500">{new Date(lead.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-2 sm:min-w-48">
                        <select value={lead.status || 'new'} onChange={(e) => updateCrmLead(String(lead.id), { status: e.target.value })} className="rounded-lg border px-3 py-2">
                          {['new', 'contacted', 'quoted', 'won', 'lost', 'archived'].map(status => <option key={status} value={status}>{status}</option>)}
                        </select>
                        <button onClick={() => deleteCrmLead(String(lead.id))} className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-100 px-3 py-2 text-red-700 hover:bg-red-200"><FiTrash2 /> Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
                {crmLeads.length === 0 && <div className="card p-8 text-center text-gray-600">No CRM leads yet.</div>}
              </div>
            </>
          )}
        </div>
      )}
      <MediaPicker
        isOpen={mediaPicker.open}
        type={mediaPicker.type}
        visibility={mediaPicker.visibility}
        onClose={() => setMediaPicker({ open: false, type: 'image', visibility: 'all', onSelect: null })}
        onSelect={(url, asset) => {
          mediaPicker.onSelect?.(url, asset)
          setMessage('Media selected')
        }}
      />
    </AdminLayout>
  )
}
