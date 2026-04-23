import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { adminAPI } from '../services/api'

type NavigationItem = {
  label: string
  url: string
  isActive: boolean
  sortOrder: number
  children: NavigationItem[]
}

type FooterNavigationItem = {
  label: string
  url: string
  isActive: boolean
  sortOrder: number
}

type FooterNavigationColumn = {
  title: string
  sortOrder: number
  isActive: boolean
  links: FooterNavigationItem[]
}

const defaultNavigationItems: NavigationItem[] = [
  { label: 'Home', url: '/', isActive: true, sortOrder: 0, children: [] },
  { label: 'Portfolio', url: '/portfolio', isActive: true, sortOrder: 10, children: [] },
  { label: 'Services', url: '/services', isActive: true, sortOrder: 20, children: [] },
  { label: 'Pricing', url: '/pricing', isActive: true, sortOrder: 30, children: [] },
  { label: 'Plugins', url: '/plugins', isActive: true, sortOrder: 40, children: [] },
  { label: 'Contact', url: '/contact', isActive: true, sortOrder: 50, children: [] }
]

const defaultFooterNavigationItems: FooterNavigationItem[] = [
  { label: 'Home', url: '/', isActive: true, sortOrder: 0 },
  { label: 'Portfolio', url: '/portfolio', isActive: true, sortOrder: 10 },
  { label: 'Services', url: '/services', isActive: true, sortOrder: 20 },
  { label: 'Pricing', url: '/pricing', isActive: true, sortOrder: 30 }
]

const defaultFooterNavigationColumns: FooterNavigationColumn[] = [
  { title: 'Quick Links', sortOrder: 0, isActive: true, links: defaultFooterNavigationItems },
  {
    title: 'Services',
    sortOrder: 10,
    isActive: true,
    links: [
      { label: 'Web Design', url: '/services', isActive: true, sortOrder: 0 },
      { label: 'Photography', url: '/services', isActive: true, sortOrder: 10 },
      { label: 'Videography', url: '/services', isActive: true, sortOrder: 20 },
      { label: 'Branding', url: '/services', isActive: true, sortOrder: 30 }
    ]
  }
]

function normalizeNavigationItem(item: any, index = 0): NavigationItem {
  return {
    label: item?.label || 'New Page',
    url: item?.url || '/new-page',
    isActive: item?.isActive !== false,
    sortOrder: Number(item?.sortOrder ?? index * 10),
    children: Array.isArray(item?.children) ? item.children.map((child: any, childIndex: number): NavigationItem => normalizeNavigationItem(child, childIndex)) : []
  }
}

function sortNavigationItems(items: NavigationItem[]): NavigationItem[] {
  return [...items]
    .map((item: NavigationItem): NavigationItem => ({
      ...item,
      children: sortNavigationItems(Array.isArray(item.children) ? item.children : [])
    }))
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
}

export default function AdminNavigation() {
  const [items, setItems] = useState<NavigationItem[]>(defaultNavigationItems)
  const [footerColumns, setFooterColumns] = useState<FooterNavigationColumn[]>(defaultFooterNavigationColumns)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        const settings = await adminAPI.getSiteSettings()
        setItems(Array.isArray(settings.navigationItems) && settings.navigationItems.length ? settings.navigationItems.map(normalizeNavigationItem) : defaultNavigationItems)
        setFooterColumns(Array.isArray(settings.footerNavigationColumns) && settings.footerNavigationColumns.length
          ? settings.footerNavigationColumns.map((column: any, columnIndex: number) => ({
            title: column?.title || `Footer Column ${columnIndex + 1}`,
            sortOrder: Number(column?.sortOrder ?? columnIndex * 10),
            isActive: column?.isActive !== false,
            links: Array.isArray(column?.links)
              ? column.links.map((item: any, index: number) => ({
                  label: item?.label || 'Footer Link',
                  url: item?.url || '/',
                  isActive: item?.isActive !== false,
                  sortOrder: Number(item?.sortOrder ?? index * 10)
                }))
              : []
          }))
          : Array.isArray(settings.footerNavigationItems) && settings.footerNavigationItems.length
            ? [
                {
                  title: 'Quick Links',
                  sortOrder: 0,
                  isActive: true,
                  links: settings.footerNavigationItems.map((item: any, index: number) => ({
                    label: item?.label || 'Footer Link',
                    url: item?.url || '/',
                    isActive: item?.isActive !== false,
                    sortOrder: Number(item?.sortOrder ?? index * 10)
                  }))
                },
                defaultFooterNavigationColumns[1]
              ]
            : defaultFooterNavigationColumns)
      } catch (err: any) {
        setError(err.error || 'Failed to load navigation')
      } finally {
        setLoading(false)
      }
    }

    fetchNavigation()
  }, [])

  const updateItem = (index: number, field: keyof NavigationItem, value: any) => {
    setItems(current => current.map((item: NavigationItem, itemIndex: number) => itemIndex === index ? { ...item, [field]: value } : item))
  }

  const updateChildItem = (parentIndex: number, childIndex: number, field: keyof NavigationItem, value: any) => {
    setItems(current => current.map((item: NavigationItem, itemIndex: number) => itemIndex === parentIndex ? {
      ...item,
      children: (item.children || []).map((child: NavigationItem, currentChildIndex: number) => currentChildIndex === childIndex ? { ...child, [field]: value } : child)
    } : item))
  }

  const addItem = () => {
    setItems(current => [
      ...current,
      normalizeNavigationItem({ label: 'New Page', url: '/new-page', isActive: true, sortOrder: current.length * 10, children: [] }, current.length)
    ])
  }

  const addChildItem = (parentIndex: number) => {
    setItems(current => current.map((item, itemIndex) => itemIndex === parentIndex ? {
      ...item,
      children: [
        ...(item.children || []),
        normalizeNavigationItem({ label: 'Sub Page', url: '/sub-page', isActive: true, sortOrder: (item.children || []).length * 10, children: [] }, (item.children || []).length)
      ]
    } : item))
  }

  const removeItem = (index: number) => {
    setItems(current => current.filter((_: NavigationItem, itemIndex: number) => itemIndex !== index))
  }

  const removeChildItem = (parentIndex: number, childIndex: number) => {
    setItems(current => current.map((item: NavigationItem, itemIndex: number) => itemIndex === parentIndex ? {
      ...item,
      children: (item.children || []).filter((_: NavigationItem, currentChildIndex: number) => currentChildIndex !== childIndex)
    } : item))
  }

  const saveNavigation = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      setMessage('Saving navigation...')
      const sortedItems = sortNavigationItems(items)
      const sortedFooterColumns = [...footerColumns]
        .map((column) => ({
          ...column,
          links: [...(column.links || [])].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
        }))
        .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
      await adminAPI.updateSiteSettings({ navigationItems: sortedItems, footerNavigationColumns: sortedFooterColumns })
      setItems(sortedItems)
      setFooterColumns(sortedFooterColumns)
      setMessage('Navigation saved')
    } catch (err: any) {
      setMessage('')
      setError(err.error || 'Failed to save navigation')
    }
  }

  const updateFooterColumn = (index: number, field: keyof FooterNavigationColumn, value: any) => {
    setFooterColumns((current) => current.map((column, columnIndex) => columnIndex === index ? { ...column, [field]: value } : column))
  }

  const addFooterColumn = () => {
    setFooterColumns(current => [
      ...current,
      { title: 'Footer Column', sortOrder: current.length * 10, isActive: true, links: [] }
    ])
  }

  const removeFooterColumn = (index: number) => {
    setFooterColumns(current => current.filter((_, columnIndex) => columnIndex !== index))
  }

  const updateFooterLink = (columnIndex: number, linkIndex: number, field: keyof FooterNavigationItem, value: any) => {
    setFooterColumns((current) => current.map((column, currentColumnIndex) => currentColumnIndex === columnIndex ? {
      ...column,
      links: (column.links || []).map((link, currentLinkIndex) => currentLinkIndex === linkIndex ? { ...link, [field]: value } : link)
    } : column))
  }

  const addFooterLink = (columnIndex: number) => {
    setFooterColumns((current) => current.map((column, currentColumnIndex) => currentColumnIndex === columnIndex ? {
      ...column,
      links: [
        ...(column.links || []),
        { label: 'Footer Link', url: '/', isActive: true, sortOrder: (column.links || []).length * 10 }
      ]
    } : column))
  }

  const removeFooterLink = (columnIndex: number, linkIndex: number) => {
    setFooterColumns((current) => current.map((column, currentColumnIndex) => currentColumnIndex === columnIndex ? {
      ...column,
      links: (column.links || []).filter((_, currentLinkIndex) => currentLinkIndex !== linkIndex)
    } : column))
  }

  return (
    <AdminLayout title="Navigation">
      {message && <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 md:mb-6">{message}</div>}
      {error && <div className="mb-4 rounded-lg border border-red-400 bg-red-100 p-4 text-sm text-red-700 md:mb-6">{error}</div>}
      {loading ? <PageSkeleton /> : (
        <form onSubmit={saveNavigation} className="space-y-4 pb-28 md:space-y-6 md:pb-24">
          <div className="card space-y-4 p-4 md:p-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 md:text-2xl">Public Website Menu</h2>
              <p className="text-sm text-gray-600 md:text-base">Choose which links appear in the main navigation and where they go.</p>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="text-sm font-bold text-blue-900">Subnavigation / Dropdowns</h3>
              <p className="mt-1 text-sm text-blue-800">Use the <span className="font-bold">Add Subnav</span> button on any main navigation item to create dropdown links under it.</p>
            </div>

            <div className="space-y-3 md:max-h-[calc(100vh-22rem)] md:overflow-y-auto md:pr-1">
              {items.map((item, index) => (
                <div key={index} className="space-y-4 rounded-xl border p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-bold text-gray-900">Main Navigation Item</p>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Dropdown parent</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_1fr_7rem_auto_auto_auto] xl:items-center">
                    <input
                      value={item.label || ''}
                      onChange={(e) => updateItem(index, 'label', e.target.value)}
                      placeholder="Label"
                      className="px-4 py-2 border rounded-lg"
                    />
                    <input
                      value={item.url || ''}
                      onChange={(e) => updateItem(index, 'url', e.target.value)}
                      placeholder="/page-url"
                      className="px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="number"
                      value={item.sortOrder ?? 0}
                      onChange={(e) => updateItem(index, 'sortOrder', Number(e.target.value))}
                      placeholder="Order"
                      className="px-4 py-2 border rounded-lg"
                    />
                    <label className="inline-flex items-center gap-2 font-semibold text-gray-700">
                      <input
                        type="checkbox"
                        checked={item.isActive !== false}
                        onChange={(e) => updateItem(index, 'isActive', e.target.checked)}
                      />
                      Active
                    </label>
                    <button type="button" onClick={() => addChildItem(index)} className="btn-secondary w-full xl:w-auto">
                      Add Subnav
                    </button>
                    <button type="button" onClick={() => removeItem(index)} className="btn-secondary w-full text-red-600 xl:w-auto">
                      Remove
                    </button>
                  </div>

                  <div className="space-y-3 rounded-lg bg-gray-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-bold text-gray-700">Dropdown Items</p>
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Subnavigation</span>
                    </div>
                    {(item.children || []).length > 0 ? (
                      <>
                      {(item.children || []).map((child: NavigationItem, childIndex: number) => (
                        <div key={`${index}-${childIndex}`} className="grid grid-cols-1 gap-3 rounded-lg border bg-white p-3 xl:grid-cols-[1fr_1fr_7rem_auto_auto] xl:items-center">
                          <input
                            value={child.label || ''}
                            onChange={(e) => updateChildItem(index, childIndex, 'label', e.target.value)}
                            placeholder="Subnav label"
                            className="px-4 py-2 border rounded-lg"
                          />
                          <input
                            value={child.url || ''}
                            onChange={(e) => updateChildItem(index, childIndex, 'url', e.target.value)}
                            placeholder="/sub-page-url"
                            className="px-4 py-2 border rounded-lg"
                          />
                          <input
                            type="number"
                            value={child.sortOrder ?? 0}
                            onChange={(e) => updateChildItem(index, childIndex, 'sortOrder', Number(e.target.value))}
                            placeholder="Order"
                            className="px-4 py-2 border rounded-lg"
                          />
                          <label className="inline-flex items-center gap-2 font-semibold text-gray-700">
                            <input
                              type="checkbox"
                              checked={child.isActive !== false}
                              onChange={(e) => updateChildItem(index, childIndex, 'isActive', e.target.checked)}
                            />
                            Active
                          </label>
                          <button type="button" onClick={() => removeChildItem(index, childIndex)} className="btn-secondary w-full text-red-600 xl:w-auto">
                            Remove
                          </button>
                        </div>
                      ))}
                      </>
                    ) : (
                      <div className="rounded-lg border border-dashed bg-white p-4 text-sm text-gray-600">
                        No subnavigation yet. Click <span className="font-bold">Add Subnav</span> above to create a dropdown under this menu item.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={addItem} className="btn-secondary">
              Add Navigation Item
            </button>
          </div>

          <div className="card space-y-4 p-4 md:p-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 md:text-2xl">Footer Columns</h2>
              <p className="text-sm text-gray-600 md:text-base">Build footer columns like Quick Links, Services, Legal, or any custom group you want.</p>
            </div>

            <div className="space-y-3 md:max-h-[calc(100vh-28rem)] md:overflow-y-auto md:pr-1">
              {footerColumns.map((column, columnIndex) => (
                <div key={`footer-column-${columnIndex}`} className="space-y-4 rounded-xl border p-4">
                  <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_7rem_auto_auto] xl:items-center">
                    <input
                      value={column.title || ''}
                      onChange={(e) => updateFooterColumn(columnIndex, 'title', e.target.value)}
                      placeholder="Column title"
                      className="px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="number"
                      value={column.sortOrder ?? 0}
                      onChange={(e) => updateFooterColumn(columnIndex, 'sortOrder', Number(e.target.value))}
                      placeholder="Order"
                      className="px-4 py-2 border rounded-lg"
                    />
                    <label className="inline-flex items-center gap-2 font-semibold text-gray-700">
                      <input
                        type="checkbox"
                        checked={column.isActive !== false}
                        onChange={(e) => updateFooterColumn(columnIndex, 'isActive', e.target.checked)}
                      />
                      Active
                    </label>
                    <button type="button" onClick={() => removeFooterColumn(columnIndex)} className="btn-secondary w-full text-red-600 xl:w-auto">
                      Remove Column
                    </button>
                  </div>

                  <div className="space-y-3 rounded-lg bg-gray-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-bold text-gray-700">Column Links</p>
                      <button type="button" onClick={() => addFooterLink(columnIndex)} className="btn-secondary w-full sm:w-auto">
                        Add Link
                      </button>
                    </div>
                    {(column.links || []).length > 0 ? (
                      (column.links || []).map((item, linkIndex) => (
                        <div key={`footer-link-${columnIndex}-${linkIndex}`} className="grid grid-cols-1 gap-3 rounded-xl border bg-white p-4 xl:grid-cols-[1fr_1fr_7rem_auto_auto] xl:items-center">
                          <input
                            value={item.label || ''}
                            onChange={(e) => updateFooterLink(columnIndex, linkIndex, 'label', e.target.value)}
                            placeholder="Footer label"
                            className="px-4 py-2 border rounded-lg"
                          />
                          <input
                            value={item.url || ''}
                            onChange={(e) => updateFooterLink(columnIndex, linkIndex, 'url', e.target.value)}
                            placeholder="/page-url"
                            className="px-4 py-2 border rounded-lg"
                          />
                          <input
                            type="number"
                            value={item.sortOrder ?? 0}
                            onChange={(e) => updateFooterLink(columnIndex, linkIndex, 'sortOrder', Number(e.target.value))}
                            placeholder="Order"
                            className="px-4 py-2 border rounded-lg"
                          />
                          <label className="inline-flex items-center gap-2 font-semibold text-gray-700">
                            <input
                              type="checkbox"
                              checked={item.isActive !== false}
                              onChange={(e) => updateFooterLink(columnIndex, linkIndex, 'isActive', e.target.checked)}
                            />
                            Active
                          </label>
                          <button type="button" onClick={() => removeFooterLink(columnIndex, linkIndex)} className="btn-secondary w-full text-red-600 xl:w-auto">
                            Remove
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed bg-white p-4 text-sm text-gray-600">
                        No links in this column yet. Click <span className="font-bold">Add Link</span> to start building it.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={addFooterColumn} className="btn-secondary">
              Add Footer Column
            </button>
          </div>

          <div className="fixed inset-x-3 bottom-3 z-30 md:inset-x-auto md:bottom-6 md:right-6">
            <button type="submit" className="btn-primary w-full shadow-xl md:w-auto">Save Navigation</button>
          </div>
        </form>
      )}
    </AdminLayout>
  )
}
