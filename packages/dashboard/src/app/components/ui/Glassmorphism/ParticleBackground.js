'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

/**
 * ParticleBackground - Animated particle background with glassmorphism theme
 *
 * @param {object} props
 * @param {number} [props.particleCount=50] - Number of particles
 * @param {string} [props.color='cyan'] - Particle color: 'cyan', 'purple', 'blue', 'green', 'orange', 'pink'
 * @param {string} [props.className] - Additional CSS classes
 */
const ParticleBackground = ({ particleCount = 50, color = 'cyan', className = '' }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const particleColors = {
    cyan: 'bg-gray-600',
    purple: 'bg-gray-600',
    blue: 'bg-blue-400',
    green: 'bg-green-400',
    orange: 'bg-orange-400',
    pink: 'bg-gray-600',
    gray: 'bg-gray-600',
  };

  const particleColor = particleColors[color] || particleColors.cyan;

  if (!mounted) return null;

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {[...Array(particleCount)].map((_, i) => {
        const randomX = Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920);
        const randomY = Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080);
        const randomDuration = Math.random() * 10 + 10;
        const randomDelay = Math.random() * 5;

        return (
          <motion.div
            key={i}
            className={`absolute w-1 h-1 ${particleColor} rounded-full opacity-30`}
            initial={{
              x: randomX,
              y: randomY,
            }}
            animate={{
              y: [null, Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080)],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{
              duration: randomDuration,
              delay: randomDelay,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        );
      })}
    </div>
  );
};

export default ParticleBackground;
