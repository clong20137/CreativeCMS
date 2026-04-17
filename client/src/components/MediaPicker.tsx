import { useEffect, useMemo, useState } from 'react'
import { FiFileText, FiImage, FiSearch, FiUpload, FiVideo, FiX } from 'react-icons/fi'
import { adminAPI, resolveAssetUrl } from '../services/api'

const MAX_UPLOAD_SIZE = 25 * 1024 * 1024
const MEDIA_ACCEPT = 'image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip'

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function formatBytes(value: number) {
  if (!value) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1)
  return `${(value / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

function MediaIcon({ type }: { type: string }) {
  if (type === 'image') return <FiImage />
  if (type === 'video') return <FiVideo />
  return <FiFileText />
}

function normalizeTags(value: any) {
  if (Array.isArray(value)) return value.map(tag => String(tag).trim()).filter(Boolean)
  return String(value || '').split(',').map(tag => tag.trim()).filter(Boolean)
}

function getPreviewUrl(asset: any) {
  const url = resolveAssetUrl(asset.url)
  if (asset.visibility !== 'private') return url
  const token = localStorage.getItem('authToken') || ''
  return `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`
}

export default function MediaPicker({ isOpen, onClose, onSelect, type = 'image', visibility = 'all' }: { isOpen: boolean; onClose: () => void; onSelect: (url: string, asset?: any) => void; type?: string; visibility?: string }) {
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState(type || 'all')
  const [visibilityFilter, setVisibilityFilter] = useState(visibility || 'all')
  const [folderFilter, setFolderFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('all')
  const [uploadFolder, setUploadFolder] = useState('Uncategorized')
  const [uploadTags, setUploadTags] = useState('')
  const [error, setError] = useState('')

  const fetchAssets = async () => {
    try {
      setError('')
      setLoading(true)
      setAssets(await adminAPI.getMedia(typeFilter, visibilityFilter))
    } catch (err: any) {
      setError(err.error || 'Failed to load media')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isOpen) return
    setTypeFilter(type || 'all')
    setVisibilityFilter(visibility || 'all')
  }, [isOpen, type, visibility])

  useEffect(() => {
    if (isOpen) fetchAssets()
  }, [isOpen, typeFilter, visibilityFilter])

  const filteredAssets = useMemo(() => {
    const term = query.trim().toLowerCase()
    return assets.filter(asset => {
      const tags = normalizeTags(asset.tags)
      const matchesFolder = folderFilter === 'all' || String(asset.folder || 'Uncategorized') === folderFilter
      const matchesTag = tagFilter === 'all' || tags.includes(tagFilter)
      const matchesQuery = !term || [asset.title, asset.originalName, asset.filename, asset.altText, asset.mimeType, asset.folder, tags.join(' ')].some(value => String(value || '').toLowerCase().includes(term))
      return matchesFolder && matchesTag && matchesQuery
    })
  }, [assets, folderFilter, query, tagFilter])

  const folders = useMemo(() => {
    return Array.from(new Set(assets.map(asset => String(asset.folder || 'Uncategorized')))).sort((a, b) => a.localeCompare(b))
  }, [assets])

  const tags = useMemo(() => {
    return Array.from(new Set(assets.flatMap(asset => normalizeTags(asset.tags)))).sort((a, b) => a.localeCompare(b))
  }, [assets])

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return
    try {
      setError('')
      setUploading(true)
      for (const file of Array.from(files)) {
        if (file.size > MAX_UPLOAD_SIZE) throw new Error(`${file.name} is larger than 25 MB.`)
        const dataUrl = await readFileAsDataUrl(file)
        await adminAPI.uploadMedia({
          dataUrl,
          originalName: file.name,
          title: file.name,
          folder: uploadFolder || 'Uncategorized',
          tags: normalizeTags(uploadTags),
          visibility: visibilityFilter === 'private' ? 'private' : 'public'
        })
      }
      await fetchAssets()
    } catch (err: any) {
      setError(err.error || err.message || 'Failed to upload media')
    } finally {
      setUploading(false)
    }
  }

  const selectAsset = (asset: any) => {
    onSelect(asset.url, asset)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Choose Media</h2>
            <p className="text-sm text-gray-600">Pick from the library or upload something new.</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700 transition hover:bg-gray-200" aria-label="Close media picker">
            <FiX />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 border-b bg-gray-50 p-4 lg:grid-cols-[10rem_10rem_10rem_10rem_1fr_auto]">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg border bg-white px-4 py-2">
            <option value="all">All media</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="document">Documents</option>
            <option value="other">Other</option>
          </select>
          <select value={visibilityFilter} onChange={(e) => setVisibilityFilter(e.target.value)} className="rounded-lg border bg-white px-4 py-2">
            <option value="all">All access</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
          <select value={folderFilter} onChange={(e) => setFolderFilter(e.target.value)} className="rounded-lg border bg-white px-4 py-2">
            <option value="all">All folders</option>
            {folders.map(folder => <option key={folder} value={folder}>{folder}</option>)}
          </select>
          <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="rounded-lg border bg-white px-4 py-2">
            <option value="all">All tags</option>
            {tags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>
          <label className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-gray-600">
            <FiSearch />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search media" className="w-full border-0 bg-transparent p-0 outline-none" />
          </label>
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-bold text-white transition hover:bg-blue-700">
            <FiUpload />
            {uploading ? 'Uploading...' : 'Upload'}
            <input
              type="file"
              multiple
              accept={MEDIA_ACCEPT}
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                uploadFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </label>
          <div className="grid grid-cols-1 gap-3 lg:col-span-6 lg:grid-cols-2">
            <input value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value)} placeholder="Upload folder" className="rounded-lg border bg-white px-4 py-2" />
            <input value={uploadTags} onChange={(e) => setUploadTags(e.target.value)} placeholder="Upload tags, comma separated" className="rounded-lg border bg-white px-4 py-2" />
          </div>
        </div>

        {error && <div className="border-b border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

        <div className="min-h-0 flex-1 overflow-auto p-4">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-52 animate-pulse rounded-lg bg-gray-100" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filteredAssets.map(asset => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => selectAsset(asset)}
                  className="group overflow-hidden rounded-lg border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md"
                >
                  <div className="flex h-40 items-center justify-center bg-gray-100">
                    {asset.mediaType === 'image' ? (
                      <img src={getPreviewUrl(asset)} alt={asset.altText || asset.title || ''} className="h-full w-full object-cover" />
                    ) : asset.mediaType === 'video' ? (
                      <video src={getPreviewUrl(asset)} className="h-full w-full object-cover" muted />
                    ) : (
                      <div className="text-3xl text-gray-500"><MediaIcon type={asset.mediaType} /></div>
                    )}
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="truncate text-sm font-bold text-gray-900">{asset.title || asset.originalName || asset.filename}</p>
                    <p className="text-xs font-semibold uppercase text-blue-600">{asset.mediaType} / {formatBytes(Number(asset.size || 0))}</p>
                    <p className={`text-xs font-bold uppercase ${asset.visibility === 'private' ? 'text-red-600' : 'text-green-700'}`}>{asset.visibility || 'public'}</p>
                    <p className="truncate text-xs font-semibold text-gray-600">{asset.folder || 'Uncategorized'}</p>
                    <p className="truncate text-xs text-gray-500">{asset.url}</p>
                  </div>
                </button>
              ))}
              {filteredAssets.length === 0 && (
                <div className="col-span-full rounded-lg border border-dashed p-8 text-center text-gray-600">
                  No media found.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
