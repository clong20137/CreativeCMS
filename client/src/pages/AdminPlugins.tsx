import { useEffect, useState } from 'react'
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

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function compressMenuImage(file: File) {
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

export default function AdminPlugins() {
  const [plugins, setPlugins] = useState<any[]>([])
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [listings, setListings] = useState<any[]>([])
  const [formData, setFormData] = useState(emptyMenuItem)
  const [listingFormData, setListingFormData] = useState(emptyListing)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingListingId, setEditingListingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showListingForm, setShowListingForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [imageUploading, setImageUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const restaurantPlugin = plugins.find(plugin => plugin.slug === 'restaurant-menu')
  const realEstatePlugin = plugins.find(plugin => plugin.slug === 'real-estate-listings')

  const fetchPlugins = async () => {
    try {
      setLoading(true)
      const [pluginData, itemData, listingData] = await Promise.all([
        adminAPI.getPlugins(),
        adminAPI.getRestaurantMenuItems(),
        adminAPI.getRealEstateListings()
      ])
      setPlugins(pluginData)
      setMenuItems(itemData)
      setListings(listingData)
    } catch (err: any) {
      setError(err.error || 'Failed to load plugins')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlugins()
  }, [])

  const resetForm = () => {
    setFormData(emptyMenuItem)
    setEditingId(null)
    setShowForm(false)
  }

  const resetListingForm = () => {
    setListingFormData(emptyListing)
    setEditingListingId(null)
    setShowListingForm(false)
  }

  const togglePlugin = async (plugin: any) => {
    if (!plugin) return
    try {
      setError('')
      const updated = await adminAPI.updatePlugin(plugin.slug, {
        isEnabled: !plugin.isEnabled
      })
      setPlugins(current => current.map(plugin => plugin.id === updated.id ? updated : plugin))
      setMessage(updated.isEnabled ? `${updated.name} plugin activated` : `${updated.name} plugin deactivated`)
    } catch (err: any) {
      setError(err.error || 'Failed to update plugin')
    }
  }

  const handleImageUpload = async (file?: File) => {
    if (!file) return
    try {
      setImageUploading(true)
      setError('')
      const dataUrl = await compressMenuImage(file)
      const upload = await adminAPI.uploadImage(dataUrl)
      setFormData(current => ({ ...current, image: upload.url }))
      setMessage('Menu item image uploaded')
    } catch (err: any) {
      setError(err.error || 'Failed to upload menu image')
    } finally {
      setImageUploading(false)
    }
  }

  const handleListingImageUpload = async (file?: File) => {
    if (!file) return
    try {
      setImageUploading(true)
      setError('')
      const dataUrl = await compressMenuImage(file)
      const upload = await adminAPI.uploadImage(dataUrl)
      setListingFormData(current => ({ ...current, image: upload.url }))
      setMessage('Listing image uploaded')
    } catch (err: any) {
      setError(err.error || 'Failed to upload listing image')
    } finally {
      setImageUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      const payload = {
        ...formData,
        price: Number(formData.price || 0),
        sortOrder: Number(formData.sortOrder || 0)
      }

      if (editingId) {
        await adminAPI.updateRestaurantMenuItem(editingId, payload)
        setMessage('Menu item updated')
      } else {
        await adminAPI.createRestaurantMenuItem(payload)
        setMessage('Menu item created')
      }

      resetForm()
      fetchPlugins()
    } catch (err: any) {
      setError(err.error || 'Failed to save menu item')
    }
  }

  const handleEdit = (item: any) => {
    setEditingId(String(item.id))
    setFormData({
      name: item.name || '',
      description: item.description || '',
      category: item.category || 'Entrees',
      price: String(item.price || ''),
      image: item.image || '',
      isAvailable: item.isAvailable !== false,
      sortOrder: String(item.sortOrder || 0)
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this menu item?')) return
    try {
      await adminAPI.deleteRestaurantMenuItem(id)
      setMessage('Menu item deleted')
      fetchPlugins()
    } catch (err: any) {
      setError(err.error || 'Failed to delete menu item')
    }
  }

  const handleListingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      const payload = {
        ...listingFormData,
        price: Number(listingFormData.price || 0),
        sortOrder: Number(listingFormData.sortOrder || 0)
      }

      if (editingListingId) {
        await adminAPI.updateRealEstateListing(editingListingId, payload)
        setMessage('Listing updated')
      } else {
        await adminAPI.createRealEstateListing(payload)
        setMessage('Listing created')
      }

      resetListingForm()
      fetchPlugins()
    } catch (err: any) {
      setError(err.error || 'Failed to save listing')
    }
  }

  const handleListingEdit = (listing: any) => {
    setEditingListingId(String(listing.id))
    setListingFormData({
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

  const handleListingDelete = async (id: string) => {
    if (!confirm('Delete this listing?')) return
    try {
      await adminAPI.deleteRealEstateListing(id)
      setMessage('Listing deleted')
      fetchPlugins()
    } catch (err: any) {
      setError(err.error || 'Failed to delete listing')
    }
  }

  return (
    <AdminLayout title="Plugins">
      {message && <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">{message}</div>}
      {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">{error}</div>}

      {loading ? <PageSkeleton /> : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <section className="card p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h2 className="text-2xl font-bold text-gray-900">Restaurant Menu</h2>
                    <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-semibold">
                      {restaurantPlugin?.isPurchased ? 'Purchased demo' : 'Not purchased'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${restaurantPlugin?.isEnabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                      {restaurantPlugin?.isEnabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-gray-600">
                    Create menu categories, item photos, descriptions, prices, and availability for restaurant websites using this template.
                  </p>
                </div>
                <button onClick={() => togglePlugin(restaurantPlugin)} className={restaurantPlugin?.isEnabled ? 'btn-secondary' : 'btn-primary'}>
                  {restaurantPlugin?.isEnabled ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </section>

            <section className="card p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h2 className="text-2xl font-bold text-gray-900">Real Estate Listings</h2>
                    <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-semibold">
                      {realEstatePlugin?.isPurchased ? 'Purchased demo' : 'Not purchased'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${realEstatePlugin?.isEnabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                      {realEstatePlugin?.isEnabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-gray-600">
                    Add property listings with photos, prices, descriptions, and more information buttons for real estate websites.
                  </p>
                </div>
                <button onClick={() => togglePlugin(realEstatePlugin)} className={realEstatePlugin?.isEnabled ? 'btn-secondary' : 'btn-primary'}>
                  {realEstatePlugin?.isEnabled ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </section>
          </div>

          {restaurantPlugin?.isEnabled && (
            <>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Restaurant Menu Items</h2>
                  <p className="text-gray-600">These items appear on the public restaurant plugin demo.</p>
                </div>
                <button onClick={() => { setShowForm(!showForm); setEditingId(null) }} className="inline-flex items-center gap-2 btn-primary">
                  {showForm ? <FiX /> : <FiPlus />}
                  {showForm ? 'Close Form' : 'Add Menu Item'}
                </button>
              </div>

              {showForm && (
                <form onSubmit={handleSubmit} className="card p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Item name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
                    <input type="text" placeholder="Category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
                    <input type="number" min="0" step="0.01" placeholder="Price" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
                    <input type="number" placeholder="Sort order" value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  </div>
                  <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" rows={3} />
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-start">
                    <input type="url" placeholder="Image URL" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    <label className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-blue-50 hover:text-blue-700">
                      <FiImage />
                      {imageUploading ? 'Uploading...' : 'Upload Image'}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files?.[0])} />
                    </label>
                  </div>
                  {formData.image && (
                    <img src={formData.image} alt={formData.name || 'Menu item'} className="h-32 w-48 rounded-lg object-cover border" />
                  )}
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={formData.isAvailable} onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })} />
                    Available on menu
                  </label>
                  <button type="submit" className="btn-primary">{editingId ? 'Save Menu Item' : 'Create Menu Item'}</button>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {menuItems.map((item) => (
                  <div key={item.id} className="card overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-48 w-full object-cover" />
                    ) : (
                      <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-500">No image</div>
                    )}
                    <div className="p-6">
                      <div className="flex justify-between gap-4 mb-2">
                        <div>
                          <p className="text-sm font-semibold text-blue-600">{item.category}</p>
                          <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                        </div>
                        <p className="text-xl font-bold text-gray-900">${Number(item.price || 0).toFixed(2)}</p>
                      </div>
                      <p className="text-gray-600 mb-4">{item.description || 'No description'}</p>
                      <span className={`inline-flex mb-5 px-2 py-1 rounded text-xs font-semibold ${item.isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                        {item.isAvailable ? 'Available' : 'Hidden'}
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(item)} className="inline-flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"><FiEdit /> Edit</button>
                        <button onClick={() => handleDelete(String(item.id))} className="inline-flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><FiTrash2 /> Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
                {menuItems.length === 0 && <div className="card p-8 text-center text-gray-600 xl:col-span-3">No menu items yet.</div>}
              </div>
            </>
          )}

          {realEstatePlugin?.isEnabled && (
            <>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Real Estate Listings</h2>
                  <p className="text-gray-600">These listings appear on the public real estate plugin demo.</p>
                </div>
                <button onClick={() => { setShowListingForm(!showListingForm); setEditingListingId(null) }} className="inline-flex items-center gap-2 btn-primary">
                  {showListingForm ? <FiX /> : <FiPlus />}
                  {showListingForm ? 'Close Form' : 'Add Listing'}
                </button>
              </div>

              {showListingForm && (
                <form onSubmit={handleListingSubmit} className="card p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Listing title" value={listingFormData.title} onChange={(e) => setListingFormData({ ...listingFormData, title: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
                    <input type="text" placeholder="Address or location" value={listingFormData.address} onChange={(e) => setListingFormData({ ...listingFormData, address: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    <input type="number" min="0" step="1" placeholder="Price" value={listingFormData.price} onChange={(e) => setListingFormData({ ...listingFormData, price: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
                    <input type="number" placeholder="Sort order" value={listingFormData.sortOrder} onChange={(e) => setListingFormData({ ...listingFormData, sortOrder: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  </div>
                  <textarea placeholder="Description" value={listingFormData.description} onChange={(e) => setListingFormData({ ...listingFormData, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" rows={3} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="url" placeholder="Image URL" value={listingFormData.image} onChange={(e) => setListingFormData({ ...listingFormData, image: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    <input type="url" placeholder="More info URL, optional" value={listingFormData.moreInfoUrl} onChange={(e) => setListingFormData({ ...listingFormData, moreInfoUrl: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  </div>
                  <label className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-blue-50 hover:text-blue-700">
                    <FiImage />
                    {imageUploading ? 'Uploading...' : 'Upload Listing Image'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleListingImageUpload(e.target.files?.[0])} />
                  </label>
                  {listingFormData.image && (
                    <img src={listingFormData.image} alt={listingFormData.title || 'Listing'} className="h-32 w-48 rounded-lg object-cover border" />
                  )}
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={listingFormData.isActive} onChange={(e) => setListingFormData({ ...listingFormData, isActive: e.target.checked })} />
                    Show listing publicly
                  </label>
                  <button type="submit" className="btn-primary">{editingListingId ? 'Save Listing' : 'Create Listing'}</button>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <div key={listing.id} className="card overflow-hidden">
                    {listing.image ? (
                      <img src={listing.image} alt={listing.title} className="h-48 w-full object-cover" />
                    ) : (
                      <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-500">No image</div>
                    )}
                    <div className="p-6">
                      <p className="text-xl font-bold text-blue-600 mb-2">
                        {Number(listing.price || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                      </p>
                      <h3 className="text-xl font-bold text-gray-900">{listing.title}</h3>
                      {listing.address && <p className="text-sm font-semibold text-gray-500 mt-1">{listing.address}</p>}
                      <p className="text-gray-600 my-4">{listing.description || 'No description'}</p>
                      <span className={`inline-flex mb-5 px-2 py-1 rounded text-xs font-semibold ${listing.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                        {listing.isActive ? 'Shown' : 'Hidden'}
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => handleListingEdit(listing)} className="inline-flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"><FiEdit /> Edit</button>
                        <button onClick={() => handleListingDelete(String(listing.id))} className="inline-flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><FiTrash2 /> Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
                {listings.length === 0 && <div className="card p-8 text-center text-gray-600 xl:col-span-3">No listings yet.</div>}
              </div>
            </>
          )}
        </div>
      )}
    </AdminLayout>
  )
}
