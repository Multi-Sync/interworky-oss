'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function VisualizerWaveAnimation({ isAnimating, delay = 0.3 }) {
  const [barsCount, setBarsCount] = useState(20);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateBarsCount = () => {
      if (window.innerWidth < 640) {
        setBarsCount(35);
      } else {
        setBarsCount(25);
      }
    };

    updateBarsCount();
    window.addEventListener('resize', updateBarsCount);
    return () => window.removeEventListener('resize', updateBarsCount);
  }, []);

  useEffect(() => {
    if (!isAnimating) {
      setIsVisible(false);
      return;
    }
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay * 1000);
    return () => clearTimeout(timer);
  }, [isAnimating, delay]);

  if (!isVisible) return null;

  return (
    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-white/50 backdrop-blur-lg py-3 px-6 md:border border-[#E8E8E8] p-4 rounded-2xl rounded-tl-sm md:left-auto md:right-[20px]">
      <div className="flex items-center justify-center h-8 gap-[3px]">
        {[...Array(barsCount)].map((_, i) => (
          <motion.div
            key={i}
            className="w-1 bg-secondary rounded-full"
            animate={{
              height: [
                20 + Math.random() * 15,
                15 + Math.random() * 15,
                5 + Math.random() * 10,
                20 + Math.random() * 10,
                8 + Math.random() * 15,
              ],
            }}
            transition={{
              duration: 1.2 + Math.random() * 0.8,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: 'mirror',
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  );
}
