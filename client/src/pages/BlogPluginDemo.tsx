import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { pluginsAPI, resolveAssetUrl } from '../services/api'

function formatPublishDate(value: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

export default function BlogPluginDemo() {
  const [plugin, setPlugin] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await pluginsAPI.getBlogPosts()
        setPlugin(data.plugin)
        setPosts(data.posts)
      } catch (error) {
        console.error('Error loading blog posts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  return (
    <div className="demo-page bg-white text-gray-950">
      <SEO
        title="Blog & Articles Plugin Demo"
        description="Preview an editable blog and articles plugin with featured images, categories, excerpts, and article detail pages."
        path="/plugins/blog"
      />

      <section className="bg-gray-950 py-20 text-white">
        <div className="container">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-300">Plugin Demo</p>
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">Blog & Articles</h1>
          <p className="max-w-2xl text-xl text-gray-300">A flexible blog plugin for publishing articles, updates, guides, and evergreen content.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          {loading ? <PageSkeleton /> : (
            <>
              {!plugin?.isEnabled && (
                <div className="mb-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-900">
                  This plugin demo is currently inactive. Activate it from Admin Panel, Plugins.
                </div>
              )}

              {posts.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {posts.map((post) => (
                    <article key={post.id} className="card overflow-hidden">
                      {post.featuredImage ? (
                        <img src={resolveAssetUrl(post.featuredImage)} alt={post.title} className="h-64 w-full object-cover" />
                      ) : (
                        <div className="flex h-64 items-center justify-center bg-gray-100 text-gray-500">Featured image</div>
                      )}
                      <div className="p-6">
                        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-blue-600">
                          {post.category && <span>{post.category}</span>}
                          {post.publishedAt && <span>{formatPublishDate(post.publishedAt)}</span>}
                          {post.author && <span>By {post.author}</span>}
                        </div>
                        <h2 className="mb-3 text-2xl font-bold text-gray-900">{post.title}</h2>
                        {post.excerpt && <p className="mb-6 text-gray-600">{post.excerpt}</p>}
                        <Link to={`/plugins/blog/${post.slug}`} className="btn-primary inline-flex">
                          {post.buttonLabel || 'Read Article'}
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="card p-8 text-center text-gray-600">No articles have been published yet.</div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
