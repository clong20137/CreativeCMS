import { FiStar } from 'react-icons/fi'

export default function Testimonials() {
  const testimonials = [
    {
      id: 1,
      name: 'Sarah Anderson',
      company: 'Tech Startup Co',
      role: 'Founder',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
      text: 'The team transformed our brand completely. Their web design exceeds all expectations and has tripled our conversion rate.'
    },
    {
      id: 2,
      name: 'Michael Chen',
      company: 'Creative Agency',
      role: 'Creative Director',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      text: 'Exceptional photography and videography work. They truly understand how to capture the essence of a brand.'
    },
    {
      id: 3,
      name: 'Emma Thompson',
      company: 'Luxury Retail Brand',
      role: 'Marketing Manager',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
      text: 'Professional, creative, and results-driven. They delivered our complete brand identity on time and within budget.'
    }
  ]

  const renderStars = () => (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <FiStar key={i} size={16} className="fill-yellow-400 text-yellow-400" />
      ))}
    </div>
  )

  return (
    <section className="py-16 bg-white">
      <div className="container">
        <h2 className="section-title">Client Testimonials</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="card p-8">
              <div className="mb-4">{renderStars()}</div>
              <p className="text-gray-600 mb-6 min-h-24">"{testimonial.text}"</p>
              <div className="flex items-center gap-4 border-t pt-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600">{testimonial.role} at {testimonial.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
