'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

// Sparkle component for magical effects
const Sparkle = ({ delay = 0, x, y, size = 4 }) => {
  return (
    <motion.div
      className="absolute rounded-full bg-gradient-to-r from-primary to-primary"
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: [0, 1, 0],
        opacity: [0, 1, 0],
      }}
      transition={{
        duration: 1.5,
        delay,
        ease: 'easeInOut',
      }}
    />
  );
};

// Generate random sparkles around the edges
const generateSparkles = count => {
  const sparkles = [];
  for (let i = 0; i < count; i++) {
    const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    let x, y;

    switch (edge) {
      case 0: // top
        x = `${Math.random() * 100}%`;
        y = '0%';
        break;
      case 1: // right
        x = '100%';
        y = `${Math.random() * 100}%`;
        break;
      case 2: // bottom
        x = `${Math.random() * 100}%`;
        y = '100%';
        break;
      case 3: // left
        x = '0%';
        y = `${Math.random() * 100}%`;
        break;
    }

    sparkles.push({
      id: i,
      x,
      y,
      delay: Math.random() * 0.5,
      size: Math.random() * 4 + 2,
    });
  }
  return sparkles;
};

export default function PageTransition({ children }) {
  const pathname = usePathname();
  const [sparkles, setSparkles] = useState([]);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Generate new sparkles on route change
    setIsAnimating(true);
    setSparkles(generateSparkles(20));

    // Hide sparkles after animation completes
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
        transition={{
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1], // Custom easing for smooth feel
        }}
        className="relative w-full h-full"
      >
        {/* Magical glow effect */}
        <motion.div
          className="fixed inset-0 pointer-events-none z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.15, 0] }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        >
          {/* Purple glow from top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/30 blur-[100px] rounded-full" />
          {/* Pink glow from bottom */}
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-primary/20 blur-[100px] rounded-full" />
        </motion.div>

        {/* Sparkles effect */}
        {isAnimating && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {sparkles.map(sparkle => (
              <Sparkle key={sparkle.id} x={sparkle.x} y={sparkle.y} delay={sparkle.delay} size={sparkle.size} />
            ))}
          </div>
        )}

        {/* Border glow animation */}
        <motion.div
          className="fixed inset-0 pointer-events-none z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        >
          {/* Top border glow */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
          {/* Bottom border glow */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
          {/* Left border glow */}
          <div className="absolute top-0 left-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-primary to-transparent" />
          {/* Right border glow */}
          <div className="absolute top-0 right-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-primary to-transparent" />
        </motion.div>

        {/* Ripple effect from center */}
        <motion.div
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 3, opacity: [0, 0.3, 0] }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <div className="w-32 h-32 rounded-full border-2 border-primary/50" />
        </motion.div>

        {/* Page content */}
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
