'use client';
import { motion } from 'framer-motion';

export default function ErrorTrackingIcon({ className = 'w-[500px] h-[300px]' }) {
  return (
    <svg viewBox="0 0 500 300" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="errorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>

      {/* Error alert box */}
      <motion.rect
        x="100"
        y="80"
        width="300"
        height="140"
        rx="12"
        fill="#7f1d1d"
        stroke="#ef4444"
        strokeWidth="3"
        animate={{ stroke: ['#ef4444', '#fca5a5', '#ef4444'] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Warning icon */}
      <circle cx="250" cy="120" r="25" fill="#ef4444" />
      <text x="250" y="135" textAnchor="middle" fill="#fff" fontSize="32" fontWeight="bold">
        !
      </text>

      {/* Error text */}
      <text x="250" y="165" textAnchor="middle" fill="#fca5a5" fontSize="16" fontWeight="bold">
        TypeError
      </text>
      <text x="250" y="185" textAnchor="middle" fill="#fecaca" fontSize="12" fontFamily="monospace">
        Cannot read property &apos;id&apos; of undefined
      </text>
      <text x="250" y="205" textAnchor="middle" fill="#fecaca" fontSize="11" opacity="0.7">
        at CheckoutPage.tsx:247
      </text>

      {/* Stack trace lines */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <rect x="120" y="220" width="260" height="2" fill="#ef4444" opacity="0.3" />
        <rect x="120" y="230" width="200" height="2" fill="#ef4444" opacity="0.3" />
        <rect x="120" y="240" width="220" height="2" fill="#ef4444" opacity="0.3" />
      </motion.g>

      {/* Pulse rings */}
      {[0, 1, 2].map(i => (
        <motion.circle
          key={i}
          cx="250"
          cy="150"
          r="60"
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          initial={{ r: 60, opacity: 0.6 }}
          animate={{ r: 150, opacity: 0 }}
          transition={{ duration: 2, delay: i * 0.7, repeat: Infinity }}
        />
      ))}
    </svg>
  );
}
