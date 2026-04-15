import { useState } from 'react'

export default function Portfolio() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const portfolioItems = [
    {
      id: 1,
      title: 'Modern E-Commerce Platform',
      category: 'web-design',
      image: 'https://images.unsplash.com/photo-1460925895917-aeb19be489c7?w=400&h=400&fit=crop',
      description: 'Fully responsive e-commerce platform built with React and Tailwind'
    },
    {
      id: 2,
      title: 'Corporate Headshots',
      category: 'photography',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=400&fit=crop',
      description: 'Professional corporate photography session for Fortune 500 company'
    },
    {
      id: 3,
      title: 'Product Launch Video',
      category: 'videography',
      image: 'https://images.unsplash.com/photo-1533928298208-27ff66555d8d?w=400&h=400&fit=crop',
      description: 'High-quality product launch video with 4K cinematography'
    },
    {
      id: 4,
      title: 'Complete Brand Identity',
      category: 'branding',
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=400&fit=crop',
      description: 'Full brand identity package including logo and guidelines'
    },
    {
      id: 5,
      title: 'SaaS Dashboard',
      category: 'web-design',
      image: 'https://images.unsplash.com/photo-1552308995-0285-4c04-9b3a-66d95fbfae9b?w=400&h=400&fit=crop',
      description: 'Beautiful and functional SaaS dashboard interface'
    },
    {
      id: 6,
      title: 'Wedding Photography',
      category: 'photography',
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=400&fit=crop',
      description: 'Beautiful wedding photography covering the entire day'
    },
    {
      id: 7,
      title: 'Documentary Film',
      category: 'videography',
      image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=400&fit=crop',
      description: 'Professional documentary-style video production'
    },
    {
      id: 8,
      title: 'Startup Branding',
      category: 'branding',
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=400&fit=crop',
      description: 'Comprehensive branding for tech startup'
    }
  ]

  const categories = [
    { id: 'all', label: 'All Work' },
    { id: 'web-design', label: 'Web Design' },
    { id: 'photography', label: 'Photography' },
    { id: 'videography', label: 'Videography' },
    { id: 'branding', label: 'Branding' }
  ]

  const filteredItems = selectedCategory === 'all'
    ? portfolioItems
    : portfolioItems.filter(item => item.category === selectedCategory)

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Portfolio</h1>
          <p className="text-xl text-blue-100">Showcase of our latest creative projects and client work</p>
        </div>
      </section>

      {/* Filter */}
      <section className="py-12 bg-gray-50">
        <div className="container">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-600'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="card overflow-hidden group cursor-pointer hover:shadow-2xl transition"
              >
                <div className="relative overflow-hidden h-64">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button className="btn-primary">View Details</button>
                  </div>
                </div>
                <div className="p-4">
                  <span className="text-blue-600 font-semibold text-xs uppercase">
                    {categories.find(c => c.id === item.category)?.label}
                  </span>
                  <h3 className="text-lg font-bold mt-2 text-gray-900">{item.title}</h3>
                  <p className="text-gray-600 text-sm mt-2">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
