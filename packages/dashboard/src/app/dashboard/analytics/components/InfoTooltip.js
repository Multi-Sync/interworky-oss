'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * InfoTooltip Component
 * Shows marketing insights and prompts users to expand for more details
 */
export default function InfoTooltip({ title, description, marketingValue, onExpand }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        className="p-1 rounded-full hover:bg-white/10 transition-colors"
        aria-label="More information"
      >
        <Info className="w-4 h-4 text-gray-400 hover:text-cyan-400 transition-colors" />
      </button>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-2 w-80"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
          >
            <div className="bg-gray-900/95 border border-cyan-500/50 rounded-lg p-4 shadow-2xl backdrop-blur-md">
              {/* Arrow */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-cyan-500/50"></div>

              {/* Title */}
              <h4 className="text-white font-semibold mb-2 text-sm">{title}</h4>

              {/* Description */}
              <p className="text-gray-300 text-xs mb-3 leading-relaxed">{description}</p>

              {/* Marketing Value */}
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-md p-2 mb-3">
                <p className="text-cyan-400 text-xs font-medium mb-1">Marketing Value:</p>
                <p className="text-gray-300 text-xs leading-relaxed">{marketingValue}</p>
              </div>

              {/* CTA */}
              {onExpand && (
                <button
                  onClick={() => {
                    onExpand();
                    setIsVisible(false);
                  }}
                  className="w-full px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 hover:border-cyan-500/50 text-cyan-400 rounded-md text-xs font-medium transition-all"
                >
                  Expand View for More Details →
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
