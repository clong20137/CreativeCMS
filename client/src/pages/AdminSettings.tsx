import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { adminAPI, resolveAssetUrl, usersAPI } from '../services/api'
import { cloneDemoStarterSections } from '../utils/demoStarterTemplates'

const emptySettings = {
  siteName: '',
  faviconUrl: '',
  logoUrl: '',
  logoSize: 40,
  clientPortalName: 'Client Portal',
  adminPortalName: 'Admin Portal',
  emailFromName: '',
  showPoweredBy: true,
  poweredByText: 'Powered by Creative CMS',
  announcementBarEnabled: false,
  announcementBarText: '',
  announcementBarLinkLabel: '',
  announcementBarLinkUrl: '',
  announcementBarBackgroundColor: '#111827',
  announcementBarTextColor: '#ffffff',
  themeFontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  themeBackgroundColor: '#ffffff',
  themeSurfaceColor: '#ffffff',
  themeHeadingColor: '#111827',
  themeBodyColor: '#374151',
  themePrimaryColor: '#2563eb',
  themePrimaryHoverColor: '#1d4ed8',
  themeSecondaryColor: '#e5e7eb',
  themeSecondaryHoverColor: '#d1d5db',
  themeButtonTextColor: '#ffffff',
  themeLinkColor: '#2563eb',
  themeButtonRadius: 8,
  themeCardRadius: 8,
  themeShadowPreset: 'medium',
  themeSpacingScale: 1,
  cmsCurrentVersion: '1.0.0',
  cmsReleaseChannel: 'stable',
  cmsVersionName: 'Creative CMS',
  cmsReleaseNotes: [] as any[],
  siteBackups: [] as any[],
  setupWizardCompleted: false,
  setupWizardCompletedAt: '',
  onboardingState: {
    selectedDemoSlug: '',
    starterPageId: null,
    checklist: {
      branding: false,
      template: false,
      homepage: false,
      navigation: false,
      launch: false
    }
  },
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
  pageHeaders: {
    portfolio: {
      title: 'Our Portfolio',
      subtitle: 'Showcase of our latest creative projects and client work'
    },
    services: {
      title: 'Our Services',
      subtitle: 'Comprehensive creative solutions for your business'
    },
    pricing: {
      title: 'Transparent Pricing',
      subtitle: 'Flexible packages tailored to your needs'
    },
    plugins: {
      title: 'Website Plugins',
      subtitle: 'Add the features your business needs when you need them.'
    },
    creativecms: {
      title: 'CreativeCMS',
      subtitle: 'A website platform for demos, plugins, private previews, and recurring client delivery.'
    },
    contact: {
      title: 'Get in Touch',
      subtitle: "Have a project in mind? Let's talk about how we can help."
    }
  } as Record<string, { title: string; subtitle: string }>,
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
  googleSearchConsoleProperty: '',
  googleSearchConsoleServiceAccountJson: '',
  pageSpeedUrl: '',
  pageSpeedApiKey: '',
  stripePublishableKey: '',
  stripeSecretKey: '',
  stripeWebhookSecret: '',
  bankName: '',
  bankAccountLast4: '',
  payoutInstructions: '',
  turnstileSiteKey: '',
  turnstileSecretKey: ''
}

const tabs = ['Setup Wizard', 'General', 'Theme', 'Releases', 'Backups', 'Contact', 'SEO', 'Payments', 'Security']
const pageHeaderLabels: Record<string, string> = {
  portfolio: 'Portfolio',
  services: 'Services',
  pricing: 'Pricing',
  plugins: 'Plugins',
  creativecms: 'CreativeCMS',
  contact: 'Contact'
}
const MAX_DATA_URL_LENGTH = 2_500_000
const MAX_IMAGE_WIDTH = 1600
const MAX_IMAGE_HEIGHT = 1200
const IMAGE_QUALITY = 0.78
const IMAGE_SETTING_KEYS = ['faviconUrl', 'logoUrl', 'heroMediaUrl']
const IMAGE_LIST_KEYS = ['featuredWork', 'services', 'testimonials']

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

async function compressImageSource(src: string, maxDataUrlLength = MAX_DATA_URL_LENGTH) {
  const image = await loadImage(src)
  let scale = Math.min(1, MAX_IMAGE_WIDTH / image.width, MAX_IMAGE_HEIGHT / image.height)
  let quality = IMAGE_QUALITY

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.width * scale))
    canvas.height = Math.max(1, Math.round(image.height * scale))

    const context = canvas.getContext('2d')
    if (!context) throw new Error('Image compression is not available in this browser.')

    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', quality)

    if (dataUrl.length <= maxDataUrlLength) return dataUrl

    scale *= 0.8
    quality = Math.max(0.5, quality - 0.08)
  }

  throw new Error('This image is still too large after compression. Please use a smaller image or paste a hosted image URL.')
}

async function getUploadDataUrl(file: File) {
  if (!file.type.startsWith('image/')) {
    const dataUrl = await readFileAsDataUrl(file)
    if (dataUrl.length > MAX_DATA_URL_LENGTH) {
      throw new Error('This upload is too large. Please use a hosted video URL or a smaller file.')
    }
    return dataUrl
  }

  if (file.type === 'image/svg+xml' || file.type === 'image/gif' || file.type.includes('icon')) {
    const dataUrl = await readFileAsDataUrl(file)
    if (dataUrl.length > MAX_DATA_URL_LENGTH) {
      throw new Error('This image is too large. Please use a smaller image or paste a hosted image URL.')
    }
    return dataUrl
  }

  const objectUrl = URL.createObjectURL(file)

  try {
    return await compressImageSource(objectUrl)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

async function storeImageDataUrl(dataUrl: string) {
  const upload = await adminAPI.uploadImage(dataUrl)
  return upload.url
}

async function compactDataUrl(value: any) {
  if (typeof value !== 'string' || !value.startsWith('data:image/')) {
    return value
  }

  if (value.startsWith('data:image/svg+xml') || value.startsWith('data:image/gif')) {
    throw new Error('SVG and GIF uploads cannot be optimized here. Please use a JPG, PNG, WebP, or a hosted image URL.')
  }

  const compactDataUrl = value.length > MAX_DATA_URL_LENGTH
    ? await compressImageSource(value)
    : value

  return storeImageDataUrl(compactDataUrl)
}

async function compactSettingsPayload(settings: Record<string, any>) {
  const payload: any = { ...settings }

  for (const key of IMAGE_SETTING_KEYS) {
    payload[key] = await compactDataUrl(payload[key])
  }

  for (const listKey of IMAGE_LIST_KEYS) {
    if (!Array.isArray(payload[listKey])) continue

    payload[listKey] = await Promise.all(payload[listKey].map(async (item: any) => ({
      ...item,
      image: await compactDataUrl(item?.image)
    })))
  }

  return payload
}

function getActiveTabPayload(settings: typeof emptySettings, activeTab: string) {
  const payloadMap: Record<string, string[]> = {
    'Setup Wizard': ['setupWizardCompleted', 'setupWizardCompletedAt', 'onboardingState', 'siteName', 'logoUrl', 'contactEmail'],
    General: ['siteName', 'faviconUrl', 'logoUrl', 'logoSize', 'clientPortalName', 'adminPortalName', 'emailFromName', 'showPoweredBy', 'poweredByText', 'announcementBarEnabled', 'announcementBarText', 'announcementBarLinkLabel', 'announcementBarLinkUrl', 'announcementBarBackgroundColor', 'announcementBarTextColor'],
    Theme: [
      'themeFontFamily',
      'themeBackgroundColor',
      'themeSurfaceColor',
      'themeHeadingColor',
      'themeBodyColor',
      'themePrimaryColor',
      'themePrimaryHoverColor',
      'themeSecondaryColor',
      'themeSecondaryHoverColor',
      'themeButtonTextColor',
      'themeLinkColor',
      'themeButtonRadius',
      'themeCardRadius',
      'themeShadowPreset',
      'themeSpacingScale'
    ],
    Releases: ['cmsCurrentVersion', 'cmsReleaseChannel', 'cmsVersionName', 'cmsReleaseNotes'],
    Contact: [
      'contactEmail',
      'phone',
      'hours',
      'locationLine1',
      'locationLine2',
      'facebookUrl',
      'instagramUrl',
      'twitterUrl',
      'linkedinUrl',
      'footerDescription'
    ],
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
    'Page Headers': ['pageHeaders'],
    Services: ['services'],
    Pricing: ['webDesignPackages', 'faqs'],
    Testimonials: ['googleReviewsEnabled', 'googlePlaceId', 'googleApiKey', 'testimonials'],
    SEO: ['googleSearchConsoleProperty', 'googleSearchConsoleServiceAccountJson', 'pageSpeedUrl', 'pageSpeedApiKey'],
    Payments: ['stripePublishableKey', 'stripeSecretKey', 'stripeWebhookSecret', 'bankName', 'bankAccountLast4', 'payoutInstructions'],
    Security: ['turnstileSiteKey', 'turnstileSecretKey']
  }

  const keys = payloadMap[activeTab] || Object.keys(settings)
  return keys.reduce((payload: any, key) => {
    payload[key] = (settings as any)[key]
    return payload
  }, {})
}

export default function AdminSettings() {
  const location = useLocation()
  const navigate = useNavigate()
  const requestedTab = decodeURIComponent(new URLSearchParams(location.search).get('tab') || '')
  const initialTab = tabs.includes(requestedTab) ? requestedTab : 'Setup Wizard'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [settings, setSettings] = useState(emptySettings)
  const [demos, setDemos] = useState<any[]>([])
  const [backups, setBackups] = useState<any[]>([])
  const [backupName, setBackupName] = useState('')
  const [importPayload, setImportPayload] = useState('')
  const [importFilename, setImportFilename] = useState('')
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorSetup, setTwoFactorSetup] = useState<any>(null)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const userId = localStorage.getItem('userId') || ''

  useEffect(() => {
    const nextRequestedTab = decodeURIComponent(new URLSearchParams(location.search).get('tab') || '')
    if (nextRequestedTab && tabs.includes(nextRequestedTab) && nextRequestedTab !== activeTab) {
      setActiveTab(nextRequestedTab)
    }
  }, [activeTab, location.search])

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const [data, profile, backupData, demoData] = await Promise.all([adminAPI.getSiteSettings(), usersAPI.getProfile(), adminAPI.getBackups(), adminAPI.getSiteDemos()])
        setSettings({ ...emptySettings, ...data })
        setTwoFactorEnabled(Boolean(profile.twoFactorEnabled))
        setBackups(Array.isArray(backupData) ? backupData : [])
        setDemos(Array.isArray(demoData) ? demoData : [])
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
  const buttonRadius = Math.min(Math.max(Number(settings.themeButtonRadius) || 8, 0), 32)
  const cardRadius = Math.min(Math.max(Number(settings.themeCardRadius) || 8, 0), 32)
  const spacingScale = Math.min(Math.max(Number(settings.themeSpacingScale) || 1, 0.8), 1.4)
  const hasImportPayload = useMemo(() => Boolean(importPayload.trim()), [importPayload])
  const onboardingChecklist = {
    branding: Boolean(settings.siteName?.trim() && settings.contactEmail?.trim()),
    template: Boolean(settings.onboardingState?.checklist?.template),
    homepage: Boolean(settings.onboardingState?.checklist?.homepage),
    navigation: Boolean(settings.onboardingState?.checklist?.navigation),
    launch: Boolean(settings.onboardingState?.checklist?.launch)
  }
  const setupSteps = [
    { key: 'branding', label: 'Brand basics', description: 'Add your site name, logo, and primary contact details.' },
    { key: 'template', label: 'Choose a starter', description: 'Pick a demo template or reusable layout to avoid starting from zero.' },
    { key: 'homepage', label: 'Homepage review', description: 'Confirm your homepage content, hero, and call to action feel right.' },
    { key: 'navigation', label: 'Navigation review', description: 'Make sure the key pages are in the nav and footer.' },
    { key: 'launch', label: 'Launch checklist', description: 'Do a final pass on SEO, backups, and publish readiness.' }
  ] as const
  const completedSetupSteps = setupSteps.filter((step) => onboardingChecklist[step.key]).length
  const setupProgress = Math.round((completedSetupSteps / setupSteps.length) * 100)
  const releaseNotes = useMemo(() => {
    const list = Array.isArray(settings.cmsReleaseNotes) ? [...settings.cmsReleaseNotes] : []
    return list.sort((a: any, b: any) => {
      const aTime = new Date(a?.releasedAt || 0).getTime()
      const bTime = new Date(b?.releasedAt || 0).getTime()
      return bTime - aTime
    })
  }, [settings.cmsReleaseNotes])
  const latestRelease = releaseNotes[0] || null
  const launchReadinessItems = [
    {
      label: 'Branding',
      description: settings.siteName?.trim() ? `${settings.siteName} is set and ready.` : 'Add your site name and logo.',
      complete: onboardingChecklist.branding
    },
    {
      label: 'Starter content',
      description: settings.onboardingState?.selectedDemoSlug
        ? `Starter selected: ${settings.onboardingState.selectedDemoSlug.replace(/-/g, ' ')}.`
        : 'Choose a demo or reusable layout starter.',
      complete: onboardingChecklist.template
    },
    {
      label: 'Homepage',
      description: settings.heroTitle?.trim() ? 'Homepage hero content is filled in.' : 'Review the homepage hero and CTA.',
      complete: onboardingChecklist.homepage
    },
    {
      label: 'Launch safety',
      description: backups.length > 0 ? `${backups.length} backup${backups.length === 1 ? '' : 's'} available.` : 'Create your first backup before launch.',
      complete: onboardingChecklist.launch
    }
  ]
  const launchQuickLinks = [
    { label: 'Edit Pages', description: 'Review homepage copy, sections, and CTA flow.', path: '/admin/pages' },
    { label: 'Open Navigation', description: 'Tighten your header, footer columns, and menu order.', path: '/admin/navigation' },
    { label: 'Check SEO', description: 'Verify Search Console, PageSpeed, and metadata basics.', path: '/admin/settings?tab=SEO' },
    { label: 'Create Backup', description: 'Save a restore point before launch day.', path: '/admin/settings?tab=Backups' }
  ]
  const brandingPreviewCards = [
    {
      label: 'Public site',
      title: settings.siteName || 'Creative by Caleb',
      body: settings.poweredByText || 'Powered by Creative CMS'
    },
    {
      label: 'Client portal',
      title: settings.clientPortalName || 'Client Portal',
      body: settings.emailFromName || settings.siteName || 'Branded client-facing experience'
    },
    {
      label: 'Admin portal',
      title: settings.adminPortalName || 'Admin Portal',
      body: 'Internal editing, launches, and client operations'
    }
  ]

  const handleUpload = async (key: string, file: File | undefined) => {
    if (!file) return
    try {
      setError('')
      setMessage('Preparing upload...')
      const dataUrl = await getUploadDataUrl(file)
      handleChange(key, file.type.startsWith('image/') ? await storeImageDataUrl(dataUrl) : dataUrl)
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

  const setWizardChecklistValue = (key: 'branding' | 'template' | 'homepage' | 'navigation' | 'launch', value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      onboardingState: {
        ...(prev.onboardingState || {}),
        selectedDemoSlug: prev.onboardingState?.selectedDemoSlug || '',
        starterPageId: prev.onboardingState?.starterPageId || null,
        checklist: {
          ...(prev.onboardingState?.checklist || {}),
          [key]: value
        }
      }
    }))
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    const params = new URLSearchParams(location.search)
    params.set('tab', tab)
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true })
  }

  const updateReleaseNote = (index: number, field: string, value: any) => {
    setSettings(prev => {
      const notes = [...(prev.cmsReleaseNotes || [])]
      notes[index] = { ...notes[index], [field]: value }
      return { ...prev, cmsReleaseNotes: notes }
    })
  }

  const addReleaseNote = () => {
    setSettings(prev => ({
      ...prev,
      cmsReleaseNotes: [
        ...(prev.cmsReleaseNotes || []),
        {
          id: `release-${Date.now()}`,
          version: prev.cmsCurrentVersion || '',
          releasedAt: new Date().toISOString().slice(0, 10),
          title: '',
          summary: '',
          highlights: ['']
        }
      ]
    }))
  }

  const removeReleaseNote = (index: number) => {
    setSettings(prev => ({
      ...prev,
      cmsReleaseNotes: (prev.cmsReleaseNotes || []).filter((_: any, i: number) => i !== index)
    }))
  }

  const updateReleaseHighlight = (releaseIndex: number, highlightIndex: number, value: string) => {
    setSettings(prev => {
      const notes = [...(prev.cmsReleaseNotes || [])]
      const release = { ...(notes[releaseIndex] || {}) }
      const highlights = Array.isArray(release.highlights) ? [...release.highlights] : []
      highlights[highlightIndex] = value
      release.highlights = highlights
      notes[releaseIndex] = release
      return { ...prev, cmsReleaseNotes: notes }
    })
  }

  const addReleaseHighlight = (releaseIndex: number) => {
    setSettings(prev => {
      const notes = [...(prev.cmsReleaseNotes || [])]
      const release = { ...(notes[releaseIndex] || {}) }
      const highlights = Array.isArray(release.highlights) ? [...release.highlights] : []
      release.highlights = [...highlights, '']
      notes[releaseIndex] = release
      return { ...prev, cmsReleaseNotes: notes }
    })
  }

  const removeReleaseHighlight = (releaseIndex: number, highlightIndex: number) => {
    setSettings(prev => {
      const notes = [...(prev.cmsReleaseNotes || [])]
      const release = { ...(notes[releaseIndex] || {}) }
      const highlights = Array.isArray(release.highlights) ? [...release.highlights] : []
      release.highlights = highlights.filter((_: any, i: number) => i !== highlightIndex)
      notes[releaseIndex] = release
      return { ...prev, cmsReleaseNotes: notes }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      setMessage('Saving settings...')
      const activeTabPayload = getActiveTabPayload(settings, activeTab)
      const payload = await compactSettingsPayload(activeTabPayload)
      await adminAPI.updateSiteSettings(payload)
      setSettings(prev => ({ ...prev, ...payload }))
      setMessage('Site settings saved')
      document.title = settings.siteName || 'Creative by Caleb'
    } catch (err: any) {
      setMessage('')
      setError(err.error || err.message || 'Failed to save settings')
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

  const downloadBackupFile = (payload: any, filename: string) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const refreshBackups = async () => {
    const backupData = await adminAPI.getBackups()
    setBackups(Array.isArray(backupData) ? backupData : [])
  }

  const handleCreateBackup = async () => {
    try {
      setError('')
      setMessage('Creating backup...')
      await adminAPI.createBackup({ name: backupName.trim() || undefined })
      setBackupName('')
      await refreshBackups()
      setMessage('Backup created')
    } catch (err: any) {
      setMessage('')
      setError(err.error || err.message || 'Failed to create backup')
    }
  }

  const handleExportCurrentBackup = async () => {
    try {
      setError('')
      setMessage('Preparing export...')
      const payload = await adminAPI.exportCurrentBackup()
      downloadBackupFile(payload, `creative-cms-export-${new Date().toISOString().slice(0, 10)}.json`)
      setMessage('Export downloaded')
    } catch (err: any) {
      setMessage('')
      setError(err.error || err.message || 'Failed to export backup')
    }
  }

  const handleExportStoredBackup = async (backup: any) => {
    try {
      setError('')
      setMessage('Preparing backup download...')
      const payload = await adminAPI.exportStoredBackup(String(backup.id))
      const safeName = String(backup.name || 'backup').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      downloadBackupFile(payload, `${safeName || 'backup'}.json`)
      setMessage('Backup downloaded')
    } catch (err: any) {
      setMessage('')
      setError(err.error || err.message || 'Failed to download backup')
    }
  }

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const text = await file.text()
      setImportPayload(text)
      setImportFilename(file.name)
      setMessage('Backup file loaded. Review and import when ready.')
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to read backup file')
    }
  }

  const handleImportBackup = async () => {
    if (!hasImportPayload) return
    const confirmed = window.confirm('Importing this backup will replace current site settings and content. We will create an automatic restore point first. Continue?')
    if (!confirmed) return

    try {
      setError('')
      setMessage('Importing backup...')
      await adminAPI.importBackup(importPayload)
      await Promise.all([
        refreshBackups(),
        adminAPI.getSiteSettings().then((data) => setSettings({ ...emptySettings, ...data }))
      ])
      setMessage('Backup imported successfully')
      setImportPayload('')
      setImportFilename('')
    } catch (err: any) {
      setMessage('')
      setError(err.error || err.message || 'Failed to import backup')
    }
  }

  const handleRestoreBackup = async (backupId: string) => {
    const confirmed = window.confirm('Restore this backup? We will create an automatic restore point before replacing current site content.')
    if (!confirmed) return

    try {
      setError('')
      setMessage('Restoring backup...')
      await adminAPI.restoreBackup(backupId)
      await Promise.all([
        refreshBackups(),
        adminAPI.getSiteSettings().then((data) => setSettings({ ...emptySettings, ...data }))
      ])
      setMessage('Backup restored successfully')
    } catch (err: any) {
      setMessage('')
      setError(err.error || err.message || 'Failed to restore backup')
    }
  }

  const handleDeleteBackup = async (backupId: string) => {
    const confirmed = window.confirm('Delete this backup permanently?')
    if (!confirmed) return

    try {
      setError('')
      setMessage('Deleting backup...')
      await adminAPI.deleteBackup(backupId)
      await refreshBackups()
      setMessage('Backup deleted')
    } catch (err: any) {
      setMessage('')
      setError(err.error || err.message || 'Failed to delete backup')
    }
  }

  const handleCreateStarterFromDemo = async () => {
    const selectedDemoSlug = String(settings.onboardingState?.selectedDemoSlug || '').trim()
    if (!selectedDemoSlug) {
      setError('Choose a demo starter first.')
      return
    }

    const demo = demos.find((item) => item.slug === selectedDemoSlug)
    if (!demo) {
      setError('That demo is not available right now.')
      return
    }

    try {
      setError('')
      setMessage(`Creating ${demo.name} starter page...`)
      const suffix = Date.now().toString().slice(-5)
      const page = await adminAPI.createPage({
        title: `${demo.name} Starter`,
        slug: `${demo.slug}-starter-${suffix}`,
        headerTitle: demo.name,
        headerSubtitle: demo.description || '',
        content: '',
        sections: cloneDemoStarterSections(demo.slug),
        metaTitle: `${demo.name} Starter`,
        metaDescription: demo.description || '',
        isPublished: false,
        sortOrder: 1000 + Number(demo.sortOrder || 0)
      })

      setSettings((prev) => ({
        ...prev,
        onboardingState: {
          ...(prev.onboardingState || {}),
          selectedDemoSlug,
          starterPageId: page.id,
          checklist: {
            ...(prev.onboardingState?.checklist || {}),
            template: true
          }
        }
      }))
      window.dispatchEvent(new Event('admin-pages-refresh'))
      setMessage(`${demo.name} starter page created. You can keep going in the wizard or jump into the editor.`)
    } catch (err: any) {
      setMessage('')
      setError(err.error || err.message || 'Failed to create starter page')
    }
  }

  const handleCompleteSetupWizard = async () => {
    try {
      setError('')
      setMessage('Saving setup wizard...')
      const payload = {
        setupWizardCompleted: true,
        setupWizardCompletedAt: new Date().toISOString(),
        onboardingState: {
          ...(settings.onboardingState || {}),
          checklist: {
            ...onboardingChecklist
          }
        },
        siteName: settings.siteName,
        logoUrl: settings.logoUrl,
        contactEmail: settings.contactEmail
      }
      await adminAPI.updateSiteSettings(payload)
      setSettings((prev) => ({ ...prev, ...payload }))
      setMessage('Setup wizard completed. Nice work.')
    } catch (err: any) {
      setMessage('')
      setError(err.error || err.message || 'Failed to complete setup wizard')
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
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="sticky top-[4.5rem] z-10 -mx-1 flex gap-2 overflow-x-auto bg-gray-50 px-1 pb-2 pt-1 sm:static sm:bg-transparent sm:px-0 sm:pt-0">
            {tabs.map(tab => (
              <button key={tab} type="button" onClick={() => handleTabChange(tab)} className={`rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap sm:px-4 ${activeTab === tab ? 'bg-blue-600 text-white' : 'border bg-white text-gray-700'}`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="card space-y-5 p-4 sm:space-y-6 sm:p-6">
            {activeTab === 'Setup Wizard' && (
              <section className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Onboarding Setup Wizard</h2>
                    <p className="mt-2 max-w-2xl text-sm text-gray-600">Let’s get the big pieces in place: brand basics, a starter layout, homepage review, navigation review, and launch readiness.</p>
                  </div>
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                    <div className="font-semibold">{setupProgress}% complete</div>
                    <div>{completedSetupSteps} of {setupSteps.length} setup steps checked off</div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
                  <div className="space-y-3">
                    {setupSteps.map((step, index) => {
                      const complete = onboardingChecklist[step.key]
                      return (
                        <div key={step.key} className={`rounded-2xl border px-4 py-3 ${complete ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${complete ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                              {index + 1}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{step.label}</div>
                              <p className="mt-1 text-xs text-gray-600">{step.description}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="space-y-5">
                    <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">Launch readiness</h3>
                            <p className="mt-1 text-sm text-gray-600">A quick read on what still needs attention before you hand this site off.</p>
                          </div>
                          <div className={`rounded-full px-3 py-1 text-xs font-bold ${setupProgress >= 100 ? 'bg-green-100 text-green-800' : setupProgress >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                            {setupProgress >= 100 ? 'Ready' : 'In Progress'}
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {launchReadinessItems.map((item) => (
                            <div key={item.label} className={`rounded-xl border px-4 py-3 ${item.complete ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
                              <div className="flex items-center gap-2">
                                <span className={`inline-block h-2.5 w-2.5 rounded-full ${item.complete ? 'bg-green-500' : 'bg-amber-400'}`} />
                                <span className="text-sm font-semibold text-gray-900">{item.label}</span>
                              </div>
                              <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-gray-200 p-4 sm:p-5">
                        <h3 className="text-lg font-bold text-gray-900">Quick launch links</h3>
                        <p className="mt-1 text-sm text-gray-600">Jump straight to the spots teams usually touch right before launch.</p>
                        <div className="mt-4 space-y-3">
                          {launchQuickLinks.map((link) => (
                            <button
                              key={link.label}
                              type="button"
                              onClick={() => navigate(link.path)}
                              className="flex w-full items-start justify-between gap-3 rounded-xl border border-gray-200 px-4 py-3 text-left transition hover:bg-gray-50"
                            >
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{link.label}</div>
                                <p className="mt-1 text-xs text-gray-600">{link.description}</p>
                              </div>
                              <span className="text-sm font-semibold text-blue-600">Open</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">1. Brand basics</h3>
                          <p className="mt-1 text-sm text-gray-600">Set the essentials people will see first.</p>
                        </div>
                        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                          <input type="checkbox" checked={onboardingChecklist.branding} onChange={(e) => setWizardChecklistValue('branding', e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                          Done
                        </label>
                      </div>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <input value={settings.siteName} onChange={(e) => handleChange('siteName', e.target.value)} placeholder="Site name" className="px-4 py-2 border rounded-lg" />
                        <input value={settings.contactEmail} onChange={(e) => handleChange('contactEmail', e.target.value)} placeholder="Primary contact email" className="px-4 py-2 border rounded-lg" />
                        <input value={settings.logoUrl || ''} onChange={(e) => handleChange('logoUrl', e.target.value)} placeholder="Logo URL" className="px-4 py-2 border rounded-lg md:col-span-2" />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">2. Choose a starter</h3>
                          <p className="mt-1 text-sm text-gray-600">Use one of your demo sites as the starting point for the first real page.</p>
                        </div>
                        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                          <input type="checkbox" checked={onboardingChecklist.template} onChange={(e) => setWizardChecklistValue('template', e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                          Done
                        </label>
                      </div>
                      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
                        <select
                          value={settings.onboardingState?.selectedDemoSlug || ''}
                          onChange={(e) => setSettings((prev) => ({
                            ...prev,
                            onboardingState: {
                              ...(prev.onboardingState || {}),
                              selectedDemoSlug: e.target.value,
                              starterPageId: prev.onboardingState?.starterPageId || null,
                              checklist: {
                                ...(prev.onboardingState?.checklist || {})
                              }
                            }
                          }))}
                          className="px-4 py-2 border rounded-lg bg-white"
                        >
                          <option value="">Choose a demo starter</option>
                          {demos.filter((demo) => demo.isActive !== false).map((demo) => (
                            <option key={demo.slug} value={demo.slug}>{demo.name}</option>
                          ))}
                        </select>
                        <button type="button" onClick={handleCreateStarterFromDemo} className="btn-primary justify-center">
                          Create Starter Page
                        </button>
                      </div>
                      {settings.onboardingState?.starterPageId ? (
                        <p className="mt-3 text-sm text-green-700">Starter page created. You can open it from the Pages editor any time.</p>
                      ) : null}
                    </div>

                    <div className="rounded-2xl border border-gray-200 p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">3. Homepage review</h3>
                          <p className="mt-1 text-sm text-gray-600">Make sure the homepage hero, copy, and call to action are ready.</p>
                        </div>
                        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                          <input type="checkbox" checked={onboardingChecklist.homepage} onChange={(e) => setWizardChecklistValue('homepage', e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                          Done
                        </label>
                      </div>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <input value={settings.heroTitle} onChange={(e) => handleChange('heroTitle', e.target.value)} placeholder="Homepage hero title" className="px-4 py-2 border rounded-lg" />
                        <input value={settings.heroPrimaryLabel} onChange={(e) => handleChange('heroPrimaryLabel', e.target.value)} placeholder="Primary CTA label" className="px-4 py-2 border rounded-lg" />
                        <textarea value={settings.heroSubtitle} onChange={(e) => handleChange('heroSubtitle', e.target.value)} placeholder="Homepage hero subtitle" className="min-h-[120px] px-4 py-3 border rounded-lg md:col-span-2" />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">4. Navigation review</h3>
                          <p className="mt-1 text-sm text-gray-600">Confirm your main pages and footer are organized the way clients will expect.</p>
                        </div>
                        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                          <input type="checkbox" checked={onboardingChecklist.navigation} onChange={(e) => setWizardChecklistValue('navigation', e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                          Done
                        </label>
                      </div>
                      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                        Next stop after this step: <span className="font-semibold">Pages</span> and <span className="font-semibold">Navigation</span> in the admin sidebar. That’s where you can fine-tune menus, footer columns, and the page stack.
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">5. Launch checklist</h3>
                          <p className="mt-1 text-sm text-gray-600">Do the final confidence pass before you call the site ready.</p>
                        </div>
                        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                          <input type="checkbox" checked={onboardingChecklist.launch} onChange={(e) => setWizardChecklistValue('launch', e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                          Done
                        </label>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-gray-200 p-3 text-sm text-gray-700">SEO connected in Settings to SEO</div>
                        <div className="rounded-xl border border-gray-200 p-3 text-sm text-gray-700">Fresh backup created in Settings to Backups</div>
                        <div className="rounded-xl border border-gray-200 p-3 text-sm text-gray-700">Homepage preview checked on mobile</div>
                        <div className="rounded-xl border border-gray-200 p-3 text-sm text-gray-700">Navigation and footer links reviewed</div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-base font-semibold text-blue-900">Finish the wizard</div>
                        <p className="mt-1 text-sm text-blue-800">This stores your onboarding progress so the admin portal stops nudging you.</p>
                      </div>
                      <button type="button" onClick={handleCompleteSetupWizard} className="btn-primary justify-center">
                        Mark Setup Complete
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'General' && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Branding</h2>
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
                <div className="rounded-lg border p-4 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">White-Label Portal Branding</h3>
                    <p className="text-sm text-gray-600">Control the names shown in the admin portal, client portal, login page, and branded emails.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="block text-sm font-semibold text-gray-700 mb-2">Client portal name</span>
                      <input value={settings.clientPortalName || ''} onChange={(e) => handleChange('clientPortalName', e.target.value)} placeholder="Client Portal" className="w-full px-4 py-2 border rounded-lg" />
                    </label>
                    <label className="block">
                      <span className="block text-sm font-semibold text-gray-700 mb-2">Admin portal name</span>
                      <input value={settings.adminPortalName || ''} onChange={(e) => handleChange('adminPortalName', e.target.value)} placeholder="Admin Portal" className="w-full px-4 py-2 border rounded-lg" />
                    </label>
                    <label className="block">
                      <span className="block text-sm font-semibold text-gray-700 mb-2">Email from name</span>
                      <input value={settings.emailFromName || ''} onChange={(e) => handleChange('emailFromName', e.target.value)} placeholder="Brand name used for auth and invoice emails" className="w-full px-4 py-2 border rounded-lg" />
                    </label>
                    <label className="flex items-center gap-3 rounded-lg border px-4 py-3">
                      <input type="checkbox" checked={settings.showPoweredBy !== false} onChange={(e) => handleChange('showPoweredBy', e.target.checked)} />
                      <span>
                        <span className="block text-sm font-semibold text-gray-800">Show powered-by text</span>
                        <span className="block text-xs text-gray-500">Keep a small product credit visible on login and portal screens.</span>
                      </span>
                    </label>
                  </div>
                  <label className="block">
                    <span className="block text-sm font-semibold text-gray-700 mb-2">Powered-by text</span>
                    <input value={settings.poweredByText || ''} onChange={(e) => handleChange('poweredByText', e.target.value)} placeholder="Powered by Creative CMS" className="w-full px-4 py-2 border rounded-lg" />
                  </label>
                  <div className="grid gap-4 lg:grid-cols-3">
                    {brandingPreviewCards.map((card) => (
                      <div key={card.label} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{card.label}</p>
                        <h4 className="mt-3 text-lg font-bold text-gray-900">{card.title}</h4>
                        <p className="mt-2 text-sm text-gray-600">{card.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border p-4 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Announcement and Promo Bar</h3>
                    <p className="text-sm text-gray-600">Show a site-wide message above the navigation with an optional call to action.</p>
                  </div>
                  <label className="flex items-center gap-3 rounded-lg border px-4 py-3">
                    <input type="checkbox" checked={settings.announcementBarEnabled === true} onChange={(e) => handleChange('announcementBarEnabled', e.target.checked)} />
                    <span>
                      <span className="block text-sm font-semibold text-gray-800">Enable announcement bar</span>
                      <span className="block text-xs text-gray-500">Useful for promos, launches, waitlists, seasonal offers, and urgent updates.</span>
                    </span>
                  </label>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-sm font-semibold text-gray-700">Message</span>
                      <textarea
                        value={settings.announcementBarText || ''}
                        onChange={(e) => handleChange('announcementBarText', e.target.value)}
                        placeholder="Now booking June projects. Reserve your spot before the next sprint fills up."
                        rows={3}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-gray-700">CTA label</span>
                      <input value={settings.announcementBarLinkLabel || ''} onChange={(e) => handleChange('announcementBarLinkLabel', e.target.value)} placeholder="Book a call" className="w-full px-4 py-2 border rounded-lg" />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-gray-700">CTA URL</span>
                      <input value={settings.announcementBarLinkUrl || ''} onChange={(e) => handleChange('announcementBarLinkUrl', e.target.value)} placeholder="/contact" className="w-full px-4 py-2 border rounded-lg" />
                    </label>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <ColorField label="Bar background" value={settings.announcementBarBackgroundColor || '#111827'} onChange={(value) => handleChange('announcementBarBackgroundColor', value)} />
                    <ColorField label="Bar text" value={settings.announcementBarTextColor || '#ffffff'} onChange={(value) => handleChange('announcementBarTextColor', value)} />
                  </div>
                  <div
                    className="rounded-xl border px-4 py-3"
                    style={{
                      backgroundColor: settings.announcementBarBackgroundColor || '#111827',
                      color: settings.announcementBarTextColor || '#ffffff'
                    }}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <p className="text-sm font-medium">
                        {settings.announcementBarText?.trim() || 'Your announcement or promo message will preview here.'}
                      </p>
                      {settings.announcementBarLinkLabel?.trim() ? (
                        <span
                          className="inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold"
                          style={{ borderColor: settings.announcementBarTextColor || '#ffffff', color: settings.announcementBarTextColor || '#ffffff' }}
                        >
                          {settings.announcementBarLinkLabel}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                {(settings.logoUrl || settings.faviconUrl) && (
                  <div className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-2">
                    {settings.logoUrl && (
                      <div>
                        <p className="mb-3 text-sm font-semibold text-gray-700">Logo preview</p>
                        <img
                          src={resolveAssetUrl(settings.logoUrl)}
                          alt="Logo preview"
                          className="w-auto object-contain"
                          style={{ height: `${logoSize}px` }}
                        />
                      </div>
                    )}
                    {settings.faviconUrl && (
                      <div>
                        <p className="mb-3 text-sm font-semibold text-gray-700">Favicon preview</p>
                        <img
                          src={resolveAssetUrl(settings.faviconUrl)}
                          alt="Favicon preview"
                          className="h-12 w-12 rounded border object-contain p-1"
                        />
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {activeTab === 'Theme' && (
              <section className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Global Theme</h2>
                  <p className="text-gray-600">Set the site-wide look and feel for typography, buttons, cards, and default colors.</p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="block text-sm font-semibold text-gray-700">Font stack</span>
                    <input value={settings.themeFontFamily} onChange={(e) => handleChange('themeFontFamily', e.target.value)} placeholder='Inter, system-ui, sans-serif' className="w-full px-4 py-2 border rounded-lg" />
                  </label>
                  <label className="space-y-2">
                    <span className="block text-sm font-semibold text-gray-700">Shadow preset</span>
                    <select value={settings.themeShadowPreset} onChange={(e) => handleChange('themeShadowPreset', e.target.value)} className="w-full px-4 py-2 border rounded-lg">
                      <option value="none">None</option>
                      <option value="soft">Soft</option>
                      <option value="medium">Medium</option>
                      <option value="strong">Strong</option>
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <ColorField label="Background" value={settings.themeBackgroundColor} onChange={(value) => handleChange('themeBackgroundColor', value)} />
                  <ColorField label="Surface / cards" value={settings.themeSurfaceColor} onChange={(value) => handleChange('themeSurfaceColor', value)} />
                  <ColorField label="Heading text" value={settings.themeHeadingColor} onChange={(value) => handleChange('themeHeadingColor', value)} />
                  <ColorField label="Body text" value={settings.themeBodyColor} onChange={(value) => handleChange('themeBodyColor', value)} />
                  <ColorField label="Primary button" value={settings.themePrimaryColor} onChange={(value) => handleChange('themePrimaryColor', value)} />
                  <ColorField label="Primary hover" value={settings.themePrimaryHoverColor} onChange={(value) => handleChange('themePrimaryHoverColor', value)} />
                  <ColorField label="Secondary button" value={settings.themeSecondaryColor} onChange={(value) => handleChange('themeSecondaryColor', value)} />
                  <ColorField label="Secondary hover" value={settings.themeSecondaryHoverColor} onChange={(value) => handleChange('themeSecondaryHoverColor', value)} />
                  <ColorField label="Button text" value={settings.themeButtonTextColor} onChange={(value) => handleChange('themeButtonTextColor', value)} />
                  <ColorField label="Links" value={settings.themeLinkColor} onChange={(value) => handleChange('themeLinkColor', value)} />
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <SliderField
                    label="Button radius"
                    min={0}
                    max={32}
                    step={1}
                    value={buttonRadius}
                    onChange={(value) => handleChange('themeButtonRadius', value)}
                  />
                  <SliderField
                    label="Card radius"
                    min={0}
                    max={32}
                    step={1}
                    value={cardRadius}
                    onChange={(value) => handleChange('themeCardRadius', value)}
                  />
                  <SliderField
                    label="Spacing scale"
                    min={0.8}
                    max={1.4}
                    step={0.05}
                    value={spacingScale}
                    onChange={(value) => handleChange('themeSpacingScale', value)}
                  />
                </div>

                <div className="rounded-lg border p-5">
                  <p className="mb-4 text-sm font-semibold text-gray-700">Theme preview</p>
                  <div
                    className="space-y-4 rounded-lg border p-5"
                    style={{
                      background: settings.themeBackgroundColor,
                      color: settings.themeBodyColor,
                      fontFamily: settings.themeFontFamily
                    }}
                  >
                    <div
                      className="rounded-lg border p-4"
                      style={{
                        background: settings.themeSurfaceColor,
                        borderRadius: `${cardRadius}px`
                      }}
                    >
                      <h3 style={{ color: settings.themeHeadingColor }} className="text-2xl font-bold">{settings.siteName || 'Creative by Caleb'}</h3>
                      <p style={{ color: settings.themeBodyColor }} className="mt-2">Site-wide theme controls for buttons, cards, links, and shared page styles.</p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          style={{
                            background: settings.themePrimaryColor,
                            color: settings.themeButtonTextColor,
                            borderRadius: `${buttonRadius}px`,
                            padding: `${0.75 * spacingScale}rem ${1.5 * spacingScale}rem`
                          }}
                        >
                          Primary Button
                        </button>
                        <button
                          type="button"
                          style={{
                            background: settings.themeSecondaryColor,
                            color: settings.themeHeadingColor,
                            borderRadius: `${buttonRadius}px`,
                            padding: `${0.75 * spacingScale}rem ${1.5 * spacingScale}rem`
                          }}
                        >
                          Secondary Button
                        </button>
                      </div>
                      <p className="mt-4">
                        <span style={{ color: settings.themeLinkColor, textDecoration: 'underline' }}>Sample link color</span>
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'Releases' && (
              <section className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Release and Version Management</h2>
                  <p className="text-gray-600">Track the current CMS version, release channel, and the update history shown to clients.</p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <label className="space-y-2">
                    <span className="block text-sm font-semibold text-gray-700">Product name</span>
                    <input value={settings.cmsVersionName || ''} onChange={(e) => handleChange('cmsVersionName', e.target.value)} placeholder="Creative CMS" className="w-full px-4 py-2 border rounded-lg" />
                  </label>
                  <label className="space-y-2">
                    <span className="block text-sm font-semibold text-gray-700">Current version</span>
                    <input value={settings.cmsCurrentVersion || ''} onChange={(e) => handleChange('cmsCurrentVersion', e.target.value)} placeholder="1.0.0" className="w-full px-4 py-2 border rounded-lg" />
                  </label>
                  <label className="space-y-2">
                    <span className="block text-sm font-semibold text-gray-700">Release channel</span>
                    <select value={settings.cmsReleaseChannel || 'stable'} onChange={(e) => handleChange('cmsReleaseChannel', e.target.value)} className="w-full px-4 py-2 border rounded-lg">
                      <option value="stable">Stable</option>
                      <option value="early-access">Early Access</option>
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
                  <div className="rounded-xl border p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Client-facing summary</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">v{settings.cmsCurrentVersion || '1.0.0'}</span>
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
                        {settings.cmsReleaseChannel === 'early-access' ? 'Early Access' : 'Stable'}
                      </span>
                    </div>
                    <h3 className="mt-4 text-2xl font-bold text-gray-900">{settings.cmsVersionName || 'Creative CMS'}</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      This is the release snapshot clients will connect to the Updates page. Keep it crisp, reassuring, and easy to scan.
                    </p>
                    {latestRelease ? (
                      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <div className="text-sm font-semibold text-gray-900">{latestRelease.title || 'Latest release'}</div>
                        <p className="mt-2 text-sm text-gray-600">{latestRelease.summary || 'Add a short summary so clients understand what changed without digging.'}</p>
                        {Array.isArray(latestRelease.highlights) && latestRelease.highlights.filter(Boolean).length > 0 && (
                          <ul className="mt-3 space-y-2 text-sm text-gray-700">
                            {latestRelease.highlights.filter(Boolean).slice(0, 3).map((highlight: string, index: number) => (
                              <li key={`${latestRelease.id || 'latest'}-${index}`} className="flex gap-2">
                                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                                <span>{highlight}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl border border-dashed p-4 text-sm text-gray-500">
                        Add your first release note to preview how client updates will look.
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border p-5">
                    <h3 className="text-lg font-bold text-gray-900">Release writing tips</h3>
                    <div className="mt-4 space-y-3 text-sm text-gray-600">
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                        Lead with the business outcome, not just the feature list.
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                        Keep summaries to one or two sentences so clients actually read them.
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                        Save the top three highlights for the biggest visible improvements.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Release History</h3>
                      <p className="text-sm text-gray-600">These notes show up in the client updates area and give you a simple internal changelog.</p>
                    </div>
                    <button type="button" onClick={addReleaseNote} className="btn-primary w-full sm:w-auto">Add Release</button>
                  </div>

                  <div className="space-y-4">
                    {(settings.cmsReleaseNotes || []).map((release: any, index: number) => (
                      <div key={release.id || index} className="space-y-4 rounded-xl border bg-gray-50 p-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <input value={release.version || ''} onChange={(e) => updateReleaseNote(index, 'version', e.target.value)} placeholder="Version, e.g. 1.2.0" className="px-4 py-2 border rounded-lg" />
                          <input type="date" value={release.releasedAt || ''} onChange={(e) => updateReleaseNote(index, 'releasedAt', e.target.value)} className="px-4 py-2 border rounded-lg" />
                          <button type="button" onClick={() => removeReleaseNote(index)} className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 font-semibold text-red-700 hover:bg-red-100">Remove Release</button>
                        </div>
                        <input value={release.title || ''} onChange={(e) => updateReleaseNote(index, 'title', e.target.value)} placeholder="Release title" className="w-full px-4 py-2 border rounded-lg" />
                        <textarea value={release.summary || ''} onChange={(e) => updateReleaseNote(index, 'summary', e.target.value)} placeholder="Release summary" rows={3} className="w-full px-4 py-2 border rounded-lg" />
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-700">Highlights</p>
                            <button type="button" onClick={() => addReleaseHighlight(index)} className="rounded-lg border px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-white">Add Highlight</button>
                          </div>
                          {(Array.isArray(release.highlights) ? release.highlights : []).map((highlight: string, highlightIndex: number) => (
                            <div key={`${release.id || index}-highlight-${highlightIndex}`} className="flex gap-2">
                              <input value={highlight || ''} onChange={(e) => updateReleaseHighlight(index, highlightIndex, e.target.value)} placeholder="Release highlight" className="min-w-0 flex-1 px-4 py-2 border rounded-lg" />
                              <button type="button" onClick={() => removeReleaseHighlight(index, highlightIndex)} className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700 hover:bg-red-100">Remove</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {(settings.cmsReleaseNotes || []).length === 0 && (
                      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">
                        No releases yet. Add your first release to start version tracking and the client-facing update history.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'Backups' && (
              <section className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Backups, Exports, and Imports</h2>
                  <p className="text-gray-600">Create restore points on this server, download a full JSON export, or import a backup into this CMS. Imports replace site content and settings, but not users, invoices, subscriptions, tickets, or leads.</p>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border p-4 space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Create Server Backup</h3>
                      <p className="text-sm text-gray-600">Stores a restore point in the CMS so we can roll back later.</p>
                    </div>
                    <input
                      value={backupName}
                      onChange={(e) => setBackupName(e.target.value)}
                      placeholder="Optional backup name"
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button type="button" onClick={handleCreateBackup} className="btn-primary w-full sm:w-auto">Create Backup</button>
                      <button type="button" onClick={handleExportCurrentBackup} className="btn-secondary w-full sm:w-auto">Export Current Site</button>
                    </div>
                  </div>

                  <div className="rounded-xl border p-4 space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Import Backup</h3>
                      <p className="text-sm text-gray-600">Upload or paste a backup JSON file. We create an automatic restore point before importing.</p>
                    </div>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-gray-700">Import file</span>
                      <input type="file" accept="application/json,.json" onChange={(e) => handleImportFile(e.target.files?.[0])} className="w-full px-4 py-2 border rounded-lg" />
                    </label>
                    {importFilename && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                        Loaded file: <span className="font-semibold">{importFilename}</span>
                      </div>
                    )}
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-gray-700">Backup JSON</span>
                      <textarea
                        value={importPayload}
                        onChange={(e) => setImportPayload(e.target.value)}
                        rows={8}
                        placeholder="Paste backup JSON here if you are not uploading a file."
                        className="w-full rounded-lg border px-4 py-3 font-mono text-sm"
                      />
                    </label>
                    <button type="button" onClick={handleImportBackup} disabled={!hasImportPayload} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60">
                      Import Backup
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border p-4 space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Saved Restore Points</h3>
                      <p className="text-sm text-gray-600">The newest 10 backups are stored here for quick rollback.</p>
                    </div>
                    <button type="button" onClick={refreshBackups} className="btn-secondary w-full sm:w-auto">Refresh</button>
                  </div>

                  <div className="space-y-3">
                    {backups.length === 0 && (
                      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">
                        No backups yet. Create your first restore point before making major changes.
                      </div>
                    )}

                    {backups.map((backup) => (
                      <div key={backup.id} className="rounded-xl border bg-gray-50 p-4 space-y-3">
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h4 className="text-base font-bold text-gray-900">{backup.name || 'Untitled backup'}</h4>
                            <p className="text-sm text-gray-500">{new Date(backup.createdAt).toLocaleString()}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-gray-600 sm:grid-cols-4">
                            <span className="rounded-lg bg-white px-3 py-2">Pages {backup.summary?.customPages ?? 0}</span>
                            <span className="rounded-lg bg-white px-3 py-2">Media {backup.summary?.mediaAssets ?? 0}</span>
                            <span className="rounded-lg bg-white px-3 py-2">Plugins {backup.summary?.plugins ?? 0}</span>
                            <span className="rounded-lg bg-white px-3 py-2">Blocks {backup.summary?.reusableSections ?? 0}</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                          <button type="button" onClick={() => handleRestoreBackup(String(backup.id))} className="btn-primary w-full sm:w-auto">Restore</button>
                          <button type="button" onClick={() => handleExportStoredBackup(backup)} className="btn-secondary w-full sm:w-auto">Download JSON</button>
                          <button type="button" onClick={() => handleDeleteBackup(String(backup.id))} className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2 font-semibold text-red-700 hover:bg-red-100 sm:w-auto">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'Contact' && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Contact and Social Links</h2>
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

            {activeTab === 'Page Headers' && (
              <section className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Public Page Headers</h2>
                  <p className="text-gray-600">Edit the main title and subtitle shown at the top of each public page.</p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {Object.entries(pageHeaderLabels).map(([page, label]) => {
                    const header = settings.pageHeaders?.[page] || { title: '', subtitle: '' }
                    return (
                      <div key={page} className="rounded-lg border p-4">
                        <h3 className="mb-3 text-lg font-bold text-gray-900">{label}</h3>
                        <div className="grid grid-cols-1 gap-3">
                          <input
                            value={header.title || ''}
                            onChange={(e) => updatePageHeader(page, 'title', e.target.value)}
                            placeholder={`${label} title`}
                            className="px-4 py-2 border rounded-lg"
                          />
                          <textarea
                            value={header.subtitle || ''}
                            onChange={(e) => updatePageHeader(page, 'subtitle', e.target.value)}
                            placeholder={`${label} subtitle`}
                            rows={2}
                            className="px-4 py-2 border rounded-lg"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
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

            {activeTab === 'SEO' && (
              <section className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Google Search Console and PageSpeed</h2>
                  <p className="text-gray-600">Connect Search Console with a Google service account. Add that service account email as a user on your Search Console property.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input
                    value={settings.googleSearchConsoleProperty || ''}
                    onChange={(e) => handleChange('googleSearchConsoleProperty', e.target.value)}
                    placeholder="Search Console property, e.g. https://example.com/ or sc-domain:example.com"
                    className="px-4 py-2 border rounded-lg md:col-span-2"
                  />
                  <input
                    value={settings.pageSpeedUrl || ''}
                    onChange={(e) => handleChange('pageSpeedUrl', e.target.value)}
                    placeholder="PageSpeed URL, e.g. https://example.com/"
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    value={settings.pageSpeedApiKey || ''}
                    onChange={(e) => handleChange('pageSpeedApiKey', e.target.value)}
                    placeholder="PageSpeed API key, optional"
                    className="px-4 py-2 border rounded-lg"
                  />
                </div>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">Google service account JSON</span>
                  <textarea
                    value={settings.googleSearchConsoleServiceAccountJson || ''}
                    onChange={(e) => handleChange('googleSearchConsoleServiceAccountJson', e.target.value)}
                    placeholder='Paste the full service account JSON. Keep this private.'
                    rows={9}
                    className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                  />
                </label>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                  Search Console ranking data uses the last 28 days, ending 2 days ago, because Google Search Console data is delayed.
                </div>
              </section>
            )}

            {activeTab === 'Payments' && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Stripe and Payout Info</h2>
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
                  <h2 className="mb-4 text-xl font-bold text-gray-900 sm:text-2xl">Two-Factor Authentication</h2>
                  <p className="text-gray-600 mb-6">Use email codes or an authenticator app on your phone.</p>
                  <button type="button" onClick={handleTwoFactorToggle} className={twoFactorEnabled ? 'btn-secondary' : 'btn-primary'}>
                    {twoFactorEnabled ? 'Disable 2FA' : 'Enable Email 2FA'}
                  </button>
                  <button type="button" onClick={startAuthenticatorSetup} className="btn-secondary mt-3 sm:ml-3 sm:mt-0">Set Up Authenticator App</button>
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
                  <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Cloudflare Turnstile</h2>
                  <p className="text-gray-600">Protect login, account creation, password reset, and contact forms from bots.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input value={settings.turnstileSiteKey || ''} onChange={(e) => handleChange('turnstileSiteKey', e.target.value)} placeholder="Turnstile site key" className="px-4 py-2 border rounded-lg" />
                    <input value={settings.turnstileSecretKey || ''} onChange={(e) => handleChange('turnstileSecretKey', e.target.value)} placeholder="Turnstile secret key" className="px-4 py-2 border rounded-lg" />
                  </div>
                </div>
              </section>
            )}
          </div>

          {activeTab !== 'Backups' && (
            <button type="submit" className="w-full btn-primary sm:w-auto">Save Settings</button>
          )}
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
      const dataUrl = await getUploadDataUrl(file)
      updateListItem(listKey, index, 'image', await storeImageDataUrl(dataUrl))
    } catch (err: any) {
      setError(err.message || 'Failed to prepare upload')
    }
  }

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
      <h2 className="mb-4 text-xl font-bold text-gray-900 sm:text-2xl">{title}</h2>
      <div className="space-y-3">
        {(items || []).map((item: any, index: number) => (
          <div key={index} className="grid grid-cols-1 gap-3 rounded-lg border p-3 md:grid-cols-2">
            {fields.map((field: string) => (
              <div key={field}>
                {field === 'features' ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Features</p>
                    {getFeatures(item).map((feature: string, featureIndex: number) => (
                      <div key={featureIndex} className="flex gap-2">
                        <input
                          value={feature}
                          onChange={(e) => updateFeature(index, featureIndex, e.target.value)}
                          placeholder="Feature"
                          className="min-w-0 flex-1 px-4 py-2 border rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeFeature(index, featureIndex)}
                          className="shrink-0 rounded-lg border px-3 py-2 text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addFeature(index)} className="btn-secondary">
                      Add Feature
                    </button>
                  </div>
                ) : (
                  <textarea
                    value={Array.isArray(item[field]) ? item[field].join('\n') : item[field] || ''}
                    onChange={(e) => updateListItem(listKey, index, field, e.target.value)}
                    placeholder={field}
                    className="w-full px-4 py-2 border rounded-lg"
                    rows={field === 'description' || field === 'text' ? 3 : 1}
                  />
                )}
                {field === 'image' && (
                  <input type="file" accept="image/*" onChange={(e) => handleListImageUpload(index, e.target.files?.[0])} className="mt-2 w-full px-3 py-2 border rounded-lg" />
                )}
              </div>
            ))}
            <button type="button" onClick={() => removeListItem(listKey, index)} className="btn-secondary w-full md:w-auto">Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => addListItem(listKey, {})} className="btn-secondary w-full sm:w-auto">Add {title}</button>
      </div>
    </section>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="space-y-2">
      <span className="block text-sm font-semibold text-gray-700">{label}</span>
      <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
        <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 cursor-pointer rounded border-0 bg-transparent p-0" />
        <input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="#000000" className="min-w-0 flex-1 border-0 bg-transparent px-0 py-0 focus:outline-none" />
      </div>
    </label>
  )
}

function SliderField({ label, min, max, step, value, onChange }: { label: string; min: number; max: number; step: number; value: number; onChange: (value: number) => void }) {
  return (
    <label className="space-y-2">
      <span className="block text-sm font-semibold text-gray-700">{label}</span>
      <div className="grid grid-cols-[1fr_5rem] items-center gap-3">
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
        <input type="number" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full rounded-lg border px-3 py-2 text-right" />
      </div>
    </label>
  )
}
