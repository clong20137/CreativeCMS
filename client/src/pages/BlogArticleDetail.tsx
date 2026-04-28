import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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

export default function BlogArticleDetail() {
  const { slug } = useParams()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return
      try {
        const data = await pluginsAPI.getBlogPost(slug)
        setPost(data.post)
      } catch (err: any) {
        setError(err.error || 'Article not found')
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [slug])

  if (loading) {
    return (
      <section className="py-16">
        <div className="container"><PageSkeleton /></div>
      </section>
    )
  }

  if (error || !post) {
    return (
      <section className="py-16">
        <div className="container">
          <div className="card p-8 text-center text-gray-600">{error || 'Article not found'}</div>
        </div>
      </section>
    )
  }

  return (
    <div className="demo-page bg-white text-gray-950">
      <SEO
        title={post.title}
        description={post.excerpt || `Read ${post.title}.`}
        path={`/plugins/blog/${post.slug}`}
        image={resolveAssetUrl(post.featuredImage) || undefined}
      />

      {post.featuredImage ? (
        <section className="h-[45vh] min-h-[340px] bg-gray-900">
          <img src={resolveAssetUrl(post.featuredImage)} alt={post.title} className="h-full w-full object-cover" />
        </section>
      ) : (
        <section className="h-[35vh] min-h-[280px] bg-gray-950" />
      )}

      <section className="py-12">
        <div className="container max-w-4xl">
          <Link to="/plugins/blog" className="font-semibold text-blue-600 hover:text-blue-800">Back to Articles</Link>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-semibold text-blue-600">
            {post.category && <span>{post.category}</span>}
            {post.publishedAt && <span>{formatPublishDate(post.publishedAt)}</span>}
            {post.author && <span>By {post.author}</span>}
          </div>
          <h1 className="mt-3 mb-4 text-4xl font-bold text-gray-900">{post.title}</h1>
          {post.excerpt && <p className="mb-8 text-xl text-gray-600">{post.excerpt}</p>}
          <div className="prose prose-lg max-w-none whitespace-pre-line text-gray-700">
            {post.content}
          </div>
        </div>
      </section>
    </div>
  )
}
