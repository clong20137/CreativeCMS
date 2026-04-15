import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiArrowLeft, FiExternalLink } from 'react-icons/fi'
import { portfolioAPI } from '../services/api'
import SEO from '../components/SEO'

export default function PortfolioDetail() {
  const { id } = useParams()
  const [item, setItem] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchItem = async () => {
      try {
        if (!id) return
        setItem(await portfolioAPI.getPortfolioItem(id))
      } catch (err: any) {
        setError(err.error || 'Portfolio item not found')
      }
    }

    fetchItem()
  }, [id])

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container">
        <Link to="/portfolio" className="inline-flex items-center gap-2 text-blue-600 font-semibold mb-8">
          <FiArrowLeft /> Back to Portfolio
        </Link>

        {error && <div className="p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">{error}</div>}

        {item && (
          <article className="max-w-5xl mx-auto bg-white rounded-lg shadow overflow-hidden">
            <SEO
              title={`${item.title} Portfolio Project`}
              description={item.description || 'A Creative Studio portfolio project for web design, photography, videography, or branding.'}
              path={`/portfolio/${item.id}`}
              image={item.image}
            />
            {item.image && (
              <div className="bg-gray-100 border-b">
                <img
                  src={item.image}
                  alt={item.title}
                  className="mx-auto max-h-72 md:max-h-[28rem] w-full object-contain"
                />
              </div>
            )}
            <div className="p-8">
              <span className="text-blue-600 font-semibold uppercase text-sm">{item.category?.replace('-', ' ')}</span>
              <h1 className="text-4xl font-bold text-gray-900 mt-2 mb-4">{item.title}</h1>
              <p className="text-lg text-gray-700 mb-8">{item.description}</p>
              {item.projectUrl && (
                <a href={item.projectUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 btn-primary">
                  Visit Project <FiExternalLink />
                </a>
              )}
            </div>
          </article>
        )}
      </div>
    </div>
  )
}
