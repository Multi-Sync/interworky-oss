'use client';

import { motion } from 'framer-motion';

const limits = [
  {
    title: 'Limited time',
    description: 'There are only so many hours. Every tool you switch between costs you minutes you never get back.',
  },
  {
    title: 'Limited energy',
    description: 'Decision fatigue is real. The more apps you manage, the less energy you have for actual work.',
  },
  {
    title: 'Limited focus',
    description: 'Every notification, every tab, every context switch pulls you further from what matters.',
  },
  {
    title: 'Limited clarity',
    description: 'When your work is scattered across a dozen apps, it\'s hard to see what actually needs to happen next.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function ProblemSolution() {
  return (
    <section className="bg-[#0a0a0a] py-20 md:py-32">
      <div className="lg:max-w-7xl sm:px-10 md:px-12 lg:px-5 px-5 mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            The real problem isn&apos;t your tools
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            You don&apos;t need another app. You need fewer things competing for what you have least of.
          </p>
        </motion.div>

        {/* Limit Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto mb-12"
        >
          {limits.map((limit, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] transition-colors"
            >
              <h3 className="text-white font-semibold text-lg mb-2">{limit.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{limit.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Closing line */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center text-xl md:text-2xl font-semibold bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 text-transparent"
        >
          Interworky exists to protect those limits.
        </motion.p>
      </div>
    </section>
  );
}
