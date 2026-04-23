import { useEffect, useMemo, useState } from 'react'
import { FiClock, FiPackage, FiTag } from 'react-icons/fi'
import ClientLayout from '../components/ClientLayout'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { siteSettingsAPI } from '../services/api'

export default function ClientPortalUpdates() {
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    siteSettingsAPI.getSettings()
      .then((data) => setSettings(data))
      .catch((err: any) => setError(err.error || 'Failed to load update history'))
      .finally(() => setLoading(false))
  }, [])

  const releases = useMemo(() => {
    const list = Array.isArray(settings?.cmsReleaseNotes) ? [...settings.cmsReleaseNotes] : []
    return list.sort((a, b) => {
      const aTime = new Date(a?.releasedAt || 0).getTime()
      const bTime = new Date(b?.releasedAt || 0).getTime()
      return bTime - aTime
    })
  }, [settings])

  return (
    <ClientLayout title="Updates">
      {loading ? <PageSkeleton /> : (
        <div className="space-y-6">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

          <section className="card p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Current release</p>
                <h2 className="mt-2 text-2xl font-bold text-gray-900">{settings?.cmsVersionName || 'Creative CMS'}</h2>
                <p className="mt-2 text-gray-600">Track the current version, release channel, and the latest rollout notes from one place.</p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-500"><FiPackage /> Version</div>
                  <p className="mt-2 text-xl font-bold text-gray-900">{settings?.cmsCurrentVersion || '1.0.0'}</p>
                </div>
                <div className="rounded-xl border bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-500"><FiTag /> Channel</div>
                  <p className="mt-2 text-xl font-bold text-gray-900">{settings?.cmsReleaseChannel === 'early-access' ? 'Early Access' : 'Stable'}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Release History</h3>
              <p className="text-gray-600">Each update shows the version, summary, and the main improvements that shipped.</p>
            </div>

            {releases.length > 0 ? (
              <div className="space-y-4">
                {releases.map((release: any, index: number) => (
                  <article key={release.id || `${release.version}-${index}`} className="card p-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">v{release.version || 'Draft'}</span>
                          {release.releasedAt && (
                            <span className="inline-flex items-center gap-2 text-sm text-gray-500"><FiClock /> {new Date(release.releasedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                        <h4 className="mt-3 text-xl font-bold text-gray-900">{release.title || 'Untitled release'}</h4>
                        {release.summary && <p className="mt-2 text-gray-600">{release.summary}</p>}
                      </div>
                    </div>
                    {Array.isArray(release.highlights) && release.highlights.filter(Boolean).length > 0 && (
                      <ul className="mt-4 space-y-2 text-gray-700">
                        {release.highlights.filter(Boolean).map((highlight: string, highlightIndex: number) => (
                          <li key={`${release.id || index}-${highlightIndex}`} className="flex gap-3">
                            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-8 text-center text-gray-500">
                No release notes have been published yet.
              </div>
            )}
          </section>
        </div>
      )}
    </ClientLayout>
  )
}
