'use client';
import { motion } from 'framer-motion';

export default function AutoDiscoveryIcon({ className = 'w-[500px] h-[300px]' }) {
  return (
    <svg viewBox="0 0 500 300" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="scanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
          <stop offset="50%" stopColor="#10b981" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Terminal window */}
      <rect x="100" y="50" width="300" height="200" rx="8" fill="#0a0e27" stroke="#2a3f5f" strokeWidth="2" />

      {/* Terminal header */}
      <rect x="100" y="50" width="300" height="30" rx="8" fill="#1a1f3a" />
      <circle cx="120" cy="65" r="5" fill="#ef4444" />
      <circle cx="140" cy="65" r="5" fill="#f59e0b" />
      <circle cx="160" cy="65" r="5" fill="#10b981" />

      {/* Code lines */}
      <text x="120" y="110" fill="#10b981" fontSize="14" fontFamily="monospace">
        $ npx carla-nextjs scan
      </text>

      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <text x="120" y="135" fill="#06b6d4" fontSize="12" fontFamily="monospace">
          ✓ Found /api/users
        </text>
        <text x="120" y="155" fill="#06b6d4" fontSize="12" fontFamily="monospace">
          ✓ Found /api/posts
        </text>
        <text x="120" y="175" fill="#06b6d4" fontSize="12" fontFamily="monospace">
          ✓ Found /api/auth
        </text>
      </motion.g>

      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
        <text x="120" y="200" fill="#10b981" fontSize="12" fontFamily="monospace" fontWeight="bold">
          ✓ 12 routes discovered
        </text>
      </motion.g>

      {/* Scanning line */}
      <motion.rect
        x="100"
        y="80"
        width="300"
        height="4"
        fill="url(#scanGradient)"
        initial={{ y: 80 }}
        animate={{ y: 250 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />

      {/* Radar circles */}
      <motion.circle
        cx="250"
        cy="150"
        r="50"
        fill="none"
        stroke="#10b981"
        strokeWidth="1"
        opacity="0.3"
        initial={{ r: 0, opacity: 0.6 }}
        animate={{ r: 150, opacity: 0 }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </svg>
  );
}
