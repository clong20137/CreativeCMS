import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FiEdit, FiImage, FiPlus, FiTrash2, FiX } from 'react-icons/fi'
import AdminLayout from '../components/AdminLayout'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { adminAPI } from '../services/api'

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
  const [menuForm, setMenuForm] = useState(emptyMenuItem)
  const [listingForm, setListingForm] = useState(emptyListing)
  const [bookingForm, setBookingForm] = useState(emptyBookingSlot)
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null)
  const [editingListingId, setEditingListingId] = useState<string | null>(null)
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null)
  const [showMenuForm, setShowMenuForm] = useState(false)
  const [showListingForm, setShowListingForm] = useState(false)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [imageUploading, setImageUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const fetchData = async () => {
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
    } catch (err: any) {
      setError(err.error || 'Failed to load plugin')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [slug])

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

  const uploadImage = async (file: File | undefined, setter: React.Dispatch<React.SetStateAction<any>>) => {
    if (!file) return
    try {
      setImageUploading(true)
      setError('')
      const dataUrl = await compressImage(file)
      const upload = await adminAPI.uploadImage(dataUrl)
      setter((current: any) => ({ ...current, image: upload.url }))
      setMessage('Image uploaded')
    } catch (err: any) {
      setError(err.error || 'Failed to upload image')
    } finally {
      setImageUploading(false)
    }
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

  return (
    <AdminLayout title={plugin?.name || 'Plugin'}>
      {message && <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">{message}</div>}
      {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">{error}</div>}

      {loading ? <PageSkeleton /> : (
        <div className="space-y-8">
          <section className="card p-6">
            <Link to="/admin/plugins" className="text-blue-600 font-semibold hover:text-blue-800">Back to Plugins</Link>
            <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h2 className="text-2xl font-bold text-gray-900">{plugin.name}</h2>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${plugin.isPurchased ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {plugin.isPurchased ? 'Purchased' : 'Not purchased'}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${plugin.isEnabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                    {plugin.isEnabled ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-gray-600 max-w-3xl">{plugin.description}</p>
              </div>
              <div className="flex flex-col gap-3 sm:min-w-56">
                <label className="text-sm font-semibold text-gray-700">Plugin Price</label>
                <input type="number" min="0" step="0.01" value={pluginPrice} onChange={(e) => setPluginPrice(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                <button onClick={() => updatePlugin({ price: Number(pluginPrice || 0), isEnabled: plugin.isEnabled })} className="btn-primary">Save Price</button>
                <button onClick={() => updatePlugin({ price: Number(pluginPrice || 0), isEnabled: !plugin.isEnabled })} className="btn-secondary">
                  {plugin.isEnabled ? 'Deactivate Plugin' : 'Activate Plugin'}
                </button>
              </div>
            </div>
          </section>

          {plugin.slug === 'restaurant-menu' && (
            <>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Restaurant Menu Items</h2>
                  <p className="text-gray-600">Price shown to buyers: {formatPrice(plugin.price)}</p>
                </div>
                <button onClick={() => { setShowMenuForm(!showMenuForm); setEditingMenuId(null) }} className="inline-flex items-center gap-2 btn-primary">
                  {showMenuForm ? <FiX /> : <FiPlus />}
                  {showMenuForm ? 'Close Form' : 'Add Menu Item'}
                </button>
              </div>

              {showMenuForm && (
                <form onSubmit={saveMenuItem} className="card p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Item name" value={menuForm.name} onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
                    <input type="text" placeholder="Category" value={menuForm.category} onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
                    <input type="number" min="0" step="0.01" placeholder="Price" value={menuForm.price} onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
                    <input type="number" placeholder="Sort order" value={menuForm.sortOrder} onChange={(e) => setMenuForm({ ...menuForm, sortOrder: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  </div>
                  <textarea placeholder="Description" value={menuForm.description} onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" rows={3} />
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-start">
                    <input type="url" placeholder="Image URL" value={menuForm.image} onChange={(e) => setMenuForm({ ...menuForm, image: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    <label className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-blue-50 hover:text-blue-700">
                      <FiImage /> {imageUploading ? 'Uploading...' : 'Upload Image'}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e.target.files?.[0], setMenuForm)} />
                    </label>
                  </div>
                  {menuForm.image && <img src={menuForm.image} alt={menuForm.name || 'Menu item'} className="h-32 w-48 rounded-lg object-cover border" />}
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={menuForm.isAvailable} onChange={(e) => setMenuForm({ ...menuForm, isAvailable: e.target.checked })} />
                    Available on menu
                  </label>
                  <button type="submit" className="btn-primary">{editingMenuId ? 'Save Menu Item' : 'Create Menu Item'}</button>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {menuItems.map((item) => (
                  <div key={item.id} className="card overflow-hidden">
                    {item.image ? <img src={item.image} alt={item.name} className="h-48 w-full object-cover" /> : <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-500">No image</div>}
                    <div className="p-6">
                      <div className="flex justify-between gap-4 mb-2">
                        <div>
                          <p className="text-sm font-semibold text-blue-600">{item.category}</p>
                          <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                        </div>
                        <p className="text-xl font-bold text-gray-900">${Number(item.price || 0).toFixed(2)}</p>
                      </div>
                      <p className="text-gray-600 mb-4">{item.description || 'No description'}</p>
                      <div className="flex gap-2">
                        <button onClick={() => editMenuItem(item)} className="inline-flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"><FiEdit /> Edit</button>
                        <button onClick={() => deleteMenuItem(String(item.id))} className="inline-flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><FiTrash2 /> Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
                {menuItems.length === 0 && <div className="card p-8 text-center text-gray-600 xl:col-span-3">No menu items yet.</div>}
              </div>
            </>
          )}

          {plugin.slug === 'real-estate-listings' && (
            <>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Real Estate Listings</h2>
                  <p className="text-gray-600">Price shown to buyers: {formatPrice(plugin.price)}</p>
                </div>
                <button onClick={() => { setShowListingForm(!showListingForm); setEditingListingId(null) }} className="inline-flex items-center gap-2 btn-primary">
                  {showListingForm ? <FiX /> : <FiPlus />}
                  {showListingForm ? 'Close Form' : 'Add Listing'}
                </button>
              </div>

              {showListingForm && (
                <form onSubmit={saveListing} className="card p-6 space-y-4">
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
                  {listingForm.image && <img src={listingForm.image} alt={listingForm.title || 'Listing'} className="h-32 w-48 rounded-lg object-cover border" />}
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={listingForm.isActive} onChange={(e) => setListingForm({ ...listingForm, isActive: e.target.checked })} />
                    Show listing publicly
                  </label>
                  <button type="submit" className="btn-primary">{editingListingId ? 'Save Listing' : 'Create Listing'}</button>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <div key={listing.id} className="card overflow-hidden">
                    {listing.image ? <img src={listing.image} alt={listing.title} className="h-48 w-full object-cover" /> : <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-500">No image</div>}
                    <div className="p-6">
                      <p className="text-xl font-bold text-blue-600 mb-2">{formatPrice(listing.price)}</p>
                      <h3 className="text-xl font-bold text-gray-900">{listing.title}</h3>
                      {listing.address && <p className="text-sm font-semibold text-gray-500 mt-1">{listing.address}</p>}
                      <p className="text-gray-600 my-4">{listing.description || 'No description'}</p>
                      <div className="flex gap-2">
                        <button onClick={() => editListing(listing)} className="inline-flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"><FiEdit /> Edit</button>
                        <button onClick={() => deleteListing(String(listing.id))} className="inline-flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><FiTrash2 /> Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
                {listings.length === 0 && <div className="card p-8 text-center text-gray-600 xl:col-span-3">No listings yet.</div>}
              </div>
            </>
          )}

          {plugin.slug === 'booking-appointments' && (
            <>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Availability</h2>
                  <p className="text-gray-600">Price shown to buyers: {formatPrice(plugin.price)}</p>
                </div>
                <button onClick={() => { setShowBookingForm(!showBookingForm); setEditingSlotId(null) }} className="inline-flex items-center gap-2 btn-primary">
                  {showBookingForm ? <FiX /> : <FiPlus />}
                  {showBookingForm ? 'Close Form' : 'Add Time Slot'}
                </button>
              </div>

              {showBookingForm && (
                <form onSubmit={saveBookingSlot} className="card p-6 space-y-4">
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
                  <button type="submit" className="btn-primary">{editingSlotId ? 'Save Time Slot' : 'Create Time Slot'}</button>
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
        </div>
      )}
    </AdminLayout>
  )
}
