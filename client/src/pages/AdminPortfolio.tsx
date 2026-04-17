import { useEffect, useState } from 'react'
import { FiEdit, FiPlus, FiTrash2, FiX } from 'react-icons/fi'
import AdminLayout from '../components/AdminLayout'
import MediaPicker from '../components/MediaPicker'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { adminAPI, resolveAssetUrl } from '../services/api'

const emptyForm = {
  title: '',
  category: 'web-design',
  image: '',
  description: '',
  projectUrl: '',
  sortOrder: '0',
  isPublished: true
}

export default function AdminPortfolio() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)

  const fetchItems = async () => {
    try {
      setLoading(true)
      setItems(await adminAPI.getPortfolioItems())
    } catch (err: any) {
      setError(err.error || 'Failed to load portfolio')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const resetForm = () => {
    setFormData(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...formData, sortOrder: Number(formData.sortOrder || 0) }
      if (editingId) {
        await adminAPI.updatePortfolioItem(editingId, payload)
        setMessage('Portfolio item updated')
      } else {
        await adminAPI.createPortfolioItem(payload)
        setMessage('Portfolio item created')
      }
      resetForm()
      fetchItems()
    } catch (err: any) {
      setError(err.error || 'Failed to save portfolio item')
    }
  }

  const handleEdit = (item: any) => {
    setEditingId(String(item.id))
    setFormData({
      title: item.title || '',
      category: item.category || 'web-design',
      image: item.image || '',
      description: item.description || '',
      projectUrl: item.projectUrl || '',
      sortOrder: String(item.sortOrder || 0),
      isPublished: item.isPublished !== false
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this portfolio item?')) return
    await adminAPI.deletePortfolioItem(id)
    setMessage('Portfolio item deleted')
    fetchItems()
  }

  const handleImageUpload = async (file: File | undefined) => {
    if (!file) return
    try {
      setError('')
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const upload = await adminAPI.uploadImage(String(reader.result || ''))
          setFormData(prev => ({ ...prev, image: upload.url }))
        } catch (err: any) {
          setError(err.error || 'Failed to upload image')
        }
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      setError(err.error || 'Failed to upload image')
    }
  }

  return (
    <AdminLayout title="Portfolio">
      {message && <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">{message}</div>}
      {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">{error}</div>}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Public Portfolio</h2>
          <p className="text-gray-600">These items appear on the public portfolio page.</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null) }} className="inline-flex items-center gap-2 btn-primary">
          {showForm ? <FiX /> : <FiPlus />}
          {showForm ? 'Close Form' : 'Add Portfolio Item'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
              <option value="web-design">Web Design</option>
              <option value="photography">Photography</option>
              <option value="videography">Videography</option>
              <option value="branding">Branding</option>
            </select>
            <input type="url" placeholder="Image URL" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
            <input type="url" placeholder="Project URL" value={formData.projectUrl} onChange={(e) => setFormData({ ...formData, projectUrl: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
            <input type="number" placeholder="Sort order" value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Upload image</label>
            <button type="button" onClick={() => setMediaPickerOpen(true)} className="mb-3 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50">
              Choose from Media Library
            </button>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e.target.files?.[0])}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {formData.image && (
              <img src={resolveAssetUrl(formData.image)} alt="Portfolio preview" className="mt-4 h-32 w-48 object-cover rounded-lg border" />
            )}
          </div>
          <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" rows={3} />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={formData.isPublished} onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })} />
            Publish on portfolio page
          </label>
          <button type="submit" className="btn-primary">{editingId ? 'Save Item' : 'Create Item'}</button>
        </form>
      )}

      {loading ? <PageSkeleton /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div key={item.id} className="card overflow-hidden">
              <div className="h-44 bg-gray-100">
                {item.image ? <img src={resolveAssetUrl(item.image)} alt={item.title} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-gray-500">No image</div>}
              </div>
              <div className="p-4">
                <span className={`inline-block mb-2 px-2 py-1 rounded text-xs font-semibold ${item.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>{item.isPublished ? 'Published' : 'Hidden'}</span>
                <h3 className="font-bold text-gray-900">{item.title}</h3>
                <p className="text-sm text-blue-600 capitalize">{item.category?.replace('-', ' ')}</p>
                <p className="text-sm text-gray-600 mt-2 mb-4">{item.description}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(item)} className="inline-flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"><FiEdit /> Edit</button>
                  <button onClick={() => handleDelete(String(item.id))} className="inline-flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><FiTrash2 /> Delete</button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="card p-8 text-center text-gray-600 lg:col-span-4">No portfolio items yet.</div>}
        </div>
      )}
      <MediaPicker
        isOpen={mediaPickerOpen}
        type="image"
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(url) => {
          setFormData(prev => ({ ...prev, image: url }))
          setMessage('Media selected. Save to publish it.')
        }}
      />
    </AdminLayout>
  )
}
