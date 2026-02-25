'use client';
import { motion } from 'framer-motion';

const metrics = [
  { value: '2,500+', label: 'Active Sites', icon: '🌐' },
  { value: '15M+', label: 'Errors Caught', icon: '🛡️' },
  { value: '99.9%', label: 'Uptime', icon: '⚡' },
  { value: '< 5 min', label: 'Setup Time', icon: '🚀' },
];

const testimonials = [
  {
    quote: 'Interworky caught a critical Safari bug before any of our users noticed. The auto-fix feature is magic.',
    author: 'Sarah Chen',
    role: 'Lead Developer',
    company: 'TechFlow',
  },
  {
    quote: 'Finally, an analytics tool built for developers. No marketing fluff, just actionable insights.',
    author: 'Marcus Rodriguez',
    role: 'Founder',
    company: 'ShipFast.io',
  },
  {
    quote: 'The voice AI is incredibly human. Our visitors love being able to just talk to the assistant.',
    author: 'Emma Thompson',
    role: 'Product Manager',
    company: 'Lovable Sites',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function SocialProofSection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-black to-[#0a0a0a]">
      <div className="max-w-6xl mx-auto">
        {/* Metrics Row */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={containerVariants}
        >
          {metrics.map((metric, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="text-center p-4 md:p-6 rounded-xl bg-white/5 border border-white/10
                hover:border-emerald-500/30 transition-colors"
            >
              <span className="text-2xl md:text-3xl mb-2 block">{metric.icon}</span>
              <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1">{metric.value}</p>
              <p className="text-gray-400 text-sm">{metric.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Section Header */}
        <div className="text-center mb-12">
          <span
            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10
            border border-yellow-500/30 text-yellow-400 text-sm font-semibold rounded-full mb-4"
          >
            <span className="w-2 h-2 bg-yellow-400 rounded-full" />
            Trusted by Makers
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">Loved by Developers Worldwide</h2>
        </div>

        {/* Testimonials Grid */}
        <motion.div
          className="grid md:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={containerVariants}
        >
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="p-6 rounded-xl bg-white/5 border border-white/10
                hover:border-emerald-500/30 transition-colors"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="text-gray-300 mb-6 leading-relaxed">&quot;{testimonial.quote}&quot;</p>

              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full bg-emerald-500/20
                  flex items-center justify-center text-emerald-400 font-semibold"
                >
                  {testimonial.author
                    .split(' ')
                    .map(n => n[0])
                    .join('')}
                </div>
                <div>
                  <p className="text-white font-medium">{testimonial.author}</p>
                  <p className="text-gray-500 text-sm">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
