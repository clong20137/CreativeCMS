import { useEffect, useMemo, useState } from 'react'
import { FiCopy, FiDownload, FiFileText, FiImage, FiSearch, FiTrash2, FiUpload, FiVideo } from 'react-icons/fi'
import AdminLayout from '../components/AdminLayout'
import { PageSkeleton } from '../components/SkeletonLoaders'
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

export default function AdminMediaLibrary() {
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const [visibilityFilter, setVisibilityFilter] = useState('all')
  const [folderFilter, setFolderFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('all')
  const [uploadFolder, setUploadFolder] = useState('Uncategorized')
  const [uploadTags, setUploadTags] = useState('')
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedAssetIds, setSelectedAssetIds] = useState<Array<string | number>>([])
  const [bulkFolder, setBulkFolder] = useState('')
  const [bulkTags, setBulkTags] = useState('')

  const fetchAssets = async () => {
    try {
      setLoading(true)
      setAssets(await adminAPI.getMedia(typeFilter, visibilityFilter))
    } catch (err: any) {
      setError(err.error || 'Failed to load media')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssets()
  }, [typeFilter, visibilityFilter])

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

  const sortedAssets = useMemo(() => {
    return [...filteredAssets].sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      if (sortBy === 'name-asc') return String(a.title || a.originalName || a.filename || '').localeCompare(String(b.title || b.originalName || b.filename || ''))
      if (sortBy === 'name-desc') return String(b.title || b.originalName || b.filename || '').localeCompare(String(a.title || a.originalName || a.filename || ''))
      if (sortBy === 'size-desc') return Number(b.size || 0) - Number(a.size || 0)
      if (sortBy === 'size-asc') return Number(a.size || 0) - Number(b.size || 0)
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    })
  }, [filteredAssets, sortBy])

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return
    try {
      setError('')
      setUploading(true)
      for (const file of Array.from(files)) {
        if (file.size > MAX_UPLOAD_SIZE) {
          throw new Error(`${file.name} is larger than 25 MB.`)
        }
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
      setMessage(`${files.length} media file${files.length === 1 ? '' : 's'} uploaded`)
      await fetchAssets()
    } catch (err: any) {
      setMessage('')
      setError(err.error || err.message || 'Failed to upload media')
    } finally {
      setUploading(false)
    }
  }

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url)
    setMessage('Media URL copied')
  }

  const updateAsset = async (asset: any, updates: any) => {
    try {
      const updated = await adminAPI.updateMedia(String(asset.id), { ...asset, ...updates })
      setAssets(current => current.map(item => item.id === updated.id ? updated : item))
      setMessage('Media details saved')
    } catch (err: any) {
      setError(err.error || 'Failed to update media')
    }
  }

  const toggleAssetSelection = (assetId: string | number) => {
    setSelectedAssetIds(current => current.map(String).includes(String(assetId)) ? current.filter(id => String(id) !== String(assetId)) : [...current, assetId])
  }

  const selectVisibleAssets = () => {
    const visibleIds = sortedAssets.map(asset => asset.id)
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedAssetIds.map(String).includes(String(id)))
    setSelectedAssetIds(allVisibleSelected ? [] : visibleIds)
  }

  const bulkMoveFolder = async () => {
    if (selectedAssetIds.length === 0 || !bulkFolder.trim()) return
    try {
      const updated = await adminAPI.bulkUpdateMedia({ ids: selectedAssetIds, folder: bulkFolder.trim() })
      setAssets(current => current.map(asset => updated.find((item: any) => item.id === asset.id) || asset))
      setBulkFolder('')
      setMessage(`${selectedAssetIds.length} media asset${selectedAssetIds.length === 1 ? '' : 's'} moved`)
    } catch (err: any) {
      setError(err.error || 'Failed to move media')
    }
  }

  const bulkUpdateTags = async (tagAction: 'add' | 'remove') => {
    const tagList = normalizeTags(bulkTags)
    if (selectedAssetIds.length === 0 || tagList.length === 0) return
    try {
      const updated = await adminAPI.bulkUpdateMedia({ ids: selectedAssetIds, tagAction, tags: tagList })
      setAssets(current => current.map(asset => updated.find((item: any) => item.id === asset.id) || asset))
      setBulkTags('')
      setMessage(`${tagAction === 'add' ? 'Updated tags for' : 'Removed tags from'} ${selectedAssetIds.length} media asset${selectedAssetIds.length === 1 ? '' : 's'}`)
    } catch (err: any) {
      setError(err.error || 'Failed to update tags')
    }
  }

  const bulkDeleteAssets = async () => {
    if (selectedAssetIds.length === 0) return
    if (!window.confirm(`Delete ${selectedAssetIds.length} selected media asset${selectedAssetIds.length === 1 ? '' : 's'}?`)) return
    try {
      await adminAPI.bulkDeleteMedia(selectedAssetIds)
      const selected = new Set(selectedAssetIds.map(String))
      setAssets(current => current.filter(asset => !selected.has(String(asset.id))))
      setSelectedAssetIds([])
      setMessage('Selected media assets deleted')
    } catch (err: any) {
      setError(err.error || 'Failed to delete selected media')
    }
  }

  const deleteAsset = async (asset: any) => {
    if (!window.confirm(`Delete ${asset.title || asset.filename}?`)) return
    try {
      await adminAPI.deleteMedia(String(asset.id))
      setAssets(current => current.filter(item => item.id !== asset.id))
      setMessage('Media asset deleted')
    } catch (err: any) {
      setError(err.error || 'Failed to delete media')
    }
  }

  return (
    <AdminLayout title="Media Library">
      {message && <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 md:mb-6">{message}</div>}
      {error && <div className="mb-4 rounded-lg border border-red-400 bg-red-100 p-4 text-sm text-red-700 md:mb-6">{error}</div>}

      <section className="card mb-4 p-4 md:mb-6 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 md:text-2xl">Assets</h2>
            <p className="text-sm text-gray-600 md:text-base">Upload and reuse images, videos, PDFs, and documents across the admin portal.</p>
          </div>
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700">
            <FiUpload />
            {uploading ? 'Uploading...' : 'Upload Media'}
            <input
              type="file"
              multiple
              accept={MEDIA_ACCEPT}
              className="hidden"
              onChange={(e) => {
                uploadFiles(e.target.files)
                e.target.value = ''
              }}
              disabled={uploading}
            />
          </label>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-[12rem_12rem_12rem_12rem_12rem_1fr]">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg border px-4 py-2">
            <option value="all">All media</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="document">Documents</option>
            <option value="other">Other</option>
          </select>
          <select value={visibilityFilter} onChange={(e) => setVisibilityFilter(e.target.value)} className="rounded-lg border px-4 py-2">
            <option value="all">All access</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
          <select value={folderFilter} onChange={(e) => setFolderFilter(e.target.value)} className="rounded-lg border px-4 py-2">
            <option value="all">All folders</option>
            {folders.map(folder => <option key={folder} value={folder}>{folder}</option>)}
          </select>
          <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="rounded-lg border px-4 py-2">
            <option value="all">All tags</option>
            {tags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-lg border px-4 py-2">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="size-desc">Largest first</option>
            <option value="size-asc">Smallest first</option>
          </select>
          <label className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-gray-600">
            <FiSearch />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search media" className="w-full border-0 bg-transparent p-0 outline-none" />
          </label>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value)} placeholder="Upload folder" className="rounded-lg border px-4 py-2" />
          <input value={uploadTags} onChange={(e) => setUploadTags(e.target.value)} placeholder="Upload tags, comma separated" className="rounded-lg border px-4 py-2" />
        </div>
      </section>

      {!loading && (
        <section className="card mb-4 p-4 md:mb-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={selectVisibleAssets} className="rounded-lg border px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50">
                {sortedAssets.length > 0 && sortedAssets.every(asset => selectedAssetIds.map(String).includes(String(asset.id))) ? 'Clear visible' : 'Select visible'}
              </button>
              <span className="text-sm font-semibold text-gray-600">{selectedAssetIds.length} selected / {sortedAssets.length} visible</span>
            </div>
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-[12rem_1fr_auto_auto_auto]">
              <input value={bulkFolder} onChange={(e) => setBulkFolder(e.target.value)} placeholder="Move to folder" className="rounded-lg border px-3 py-2" />
              <input value={bulkTags} onChange={(e) => setBulkTags(e.target.value)} placeholder="Tags, comma separated" className="rounded-lg border px-3 py-2" />
              <button type="button" onClick={bulkMoveFolder} disabled={selectedAssetIds.length === 0 || !bulkFolder.trim()} className="rounded-lg border px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-40">Move</button>
              <button type="button" onClick={() => bulkUpdateTags('add')} disabled={selectedAssetIds.length === 0 || normalizeTags(bulkTags).length === 0} className="rounded-lg border px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-40">Add Tags</button>
              <button type="button" onClick={() => bulkUpdateTags('remove')} disabled={selectedAssetIds.length === 0 || normalizeTags(bulkTags).length === 0} className="rounded-lg border px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-40">Remove Tags</button>
            </div>
            <button type="button" onClick={bulkDeleteAssets} disabled={selectedAssetIds.length === 0} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-40 xl:w-auto">
              <FiTrash2 /> Delete Selected
            </button>
          </div>
        </section>
      )}

      {loading ? <PageSkeleton /> : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-5">
          {sortedAssets.map(asset => (
            <article key={asset.id} className={`card overflow-hidden transition ${selectedAssetIds.map(String).includes(String(asset.id)) ? 'ring-2 ring-blue-600' : ''}`}>
              <label className="flex cursor-pointer items-center gap-2 border-b bg-white px-4 py-3 text-sm font-bold text-gray-700">
                <input type="checkbox" checked={selectedAssetIds.map(String).includes(String(asset.id))} onChange={() => toggleAssetSelection(asset.id)} />
                Select asset
              </label>
              <div className="flex h-56 items-center justify-center bg-gray-100">
                {asset.mediaType === 'image' ? (
                  <img src={getPreviewUrl(asset)} alt={asset.altText || asset.title || ''} className="h-full w-full object-cover" />
                ) : asset.mediaType === 'video' ? (
                  <video src={getPreviewUrl(asset)} className="h-full w-full object-cover" controls />
                ) : (
                  <div className="text-center text-gray-600">
                    <MediaIcon type={asset.mediaType} />
                    <p className="mt-3 font-bold">{asset.originalName || asset.filename}</p>
                  </div>
                )}
              </div>
              <div className="space-y-3 p-4 md:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-blue-600">{asset.mediaType} / {formatBytes(Number(asset.size || 0))}</p>
                    <p className={`text-xs font-bold uppercase ${asset.visibility === 'private' ? 'text-red-600' : 'text-green-700'}`}>{asset.visibility || 'public'}</p>
                    <h3 className="mt-1 break-words text-lg font-bold text-gray-900">{asset.title || asset.originalName || asset.filename}</h3>
                  </div>
                  <MediaIcon type={asset.mediaType} />
                </div>
                <input defaultValue={asset.title || ''} onBlur={(e) => updateAsset(asset, { title: e.target.value })} placeholder="Title" className="w-full rounded-lg border px-3 py-2" />
                <input defaultValue={asset.altText || ''} onBlur={(e) => updateAsset(asset, { altText: e.target.value })} placeholder="Alt text / description" className="w-full rounded-lg border px-3 py-2" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input defaultValue={asset.folder || 'Uncategorized'} onBlur={(e) => updateAsset(asset, { folder: e.target.value || 'Uncategorized' })} placeholder="Folder" className="w-full rounded-lg border px-3 py-2" />
                  <input defaultValue={normalizeTags(asset.tags).join(', ')} onBlur={(e) => updateAsset(asset, { tags: normalizeTags(e.target.value) })} placeholder="Tags" className="w-full rounded-lg border px-3 py-2" />
                </div>
                <select defaultValue={asset.visibility || 'public'} onChange={(e) => updateAsset(asset, { visibility: e.target.value })} className="w-full rounded-lg border px-3 py-2">
                  <option value="public">Public media</option>
                  <option value="private">Private media</option>
                </select>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs font-bold text-gray-700">{asset.folder || 'Uncategorized'}</span>
                  {normalizeTags(asset.tags).map(tag => <span key={tag} className="rounded bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">{tag}</span>)}
                </div>
                <p className="break-all rounded-lg bg-gray-50 p-3 text-xs text-gray-600">{asset.url}</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button type="button" onClick={() => copyUrl(asset.url)} className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold hover:bg-gray-50"><FiCopy /> Copy URL</button>
                  <a href={getPreviewUrl(asset)} download className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold hover:bg-gray-50"><FiDownload /> Download</a>
                  <button type="button" onClick={() => deleteAsset(asset)} className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50"><FiTrash2 /> Delete</button>
                </div>
              </div>
            </article>
          ))}
          {sortedAssets.length === 0 && <div className="card p-8 text-center text-gray-600 md:col-span-2 xl:col-span-3">No media found.</div>}
        </div>
      )}
    </AdminLayout>
  )
}
