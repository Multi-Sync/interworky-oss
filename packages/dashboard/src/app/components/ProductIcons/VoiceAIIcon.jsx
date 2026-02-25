'use client';
import { motion } from 'framer-motion';

export default function VoiceAIIcon({ className = 'w-[500px] h-[300px]' }) {
  return (
    <svg viewBox="0 0 500 300" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="voiceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>

        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background circle */}
      <circle cx="250" cy="150" r="120" fill="#1a1f3a" opacity="0.5" />

      {/* Microphone */}
      <motion.g animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
        <rect x="230" y="100" width="40" height="60" rx="20" fill="url(#voiceGradient)" filter="url(#glow)" />
        <path d="M210 140 Q210 180 250 180 Q290 180 290 140" stroke="url(#voiceGradient)" strokeWidth="4" fill="none" />
        <line x1="250" y1="180" x2="250" y2="200" stroke="url(#voiceGradient)" strokeWidth="4" />
        <rect x="230" y="200" width="40" height="8" rx="4" fill="url(#voiceGradient)" />
      </motion.g>

      {/* Sound waves */}
      {[1, 2, 3].map(i => (
        <motion.path
          key={`left-${i}`}
          d={`M ${180 - i * 20} 150 Q ${170 - i * 20} 130, ${160 - i * 20} 150 Q ${170 - i * 20} 170, ${180 - i * 20} 150`}
          stroke="#10b981"
          strokeWidth="3"
          fill="none"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
        />
      ))}

      {[1, 2, 3].map(i => (
        <motion.path
          key={`right-${i}`}
          d={`M ${320 + i * 20} 150 Q ${330 + i * 20} 130, ${340 + i * 20} 150 Q ${330 + i * 20} 170, ${320 + i * 20} 150`}
          stroke="#06b6d4"
          strokeWidth="3"
          fill="none"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
        />
      ))}

      {/* "AI" label */}
      <text x="250" y="240" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="bold">
        AI Voice
      </text>
    </svg>
  );
}
