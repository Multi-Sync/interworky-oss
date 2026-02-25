'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollPosition } from '@/_common/hooks/useScrollPosition';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/_common/utils/handleSlackNotification';

export default function StickyCTABar() {
  const { isPastThreshold } = useScrollPosition(600);
  const router = useRouter();
  const { handleNotification } = useNotification();

  const handlePrimaryClick = () => {
    handleNotification('Sticky CTA - Get Started Free clicked');
    router.push('/new');
  };

  const handleSecondaryClick = () => {
    handleNotification('Sticky CTA - See Features clicked');
    const featuresSection = document.getElementById('ai-customer-support-section');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <AnimatePresence>
      {isPastThreshold && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-0 left-0 right-0 z-[2147483647] bg-gradient-to-r
            from-[#0a0a0a] to-[#1a1a1a] border-t border-white/10
            backdrop-blur-lg py-3 px-4 md:px-6"
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="hidden sm:block">
              <p className="text-white font-medium">Ready to supercharge your site?</p>
              <p className="text-gray-400 text-sm">100% free - No credit card required</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handlePrimaryClick}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-[#058A7C]
                  hover:bg-[#047A6C] text-white font-semibold rounded-full
                  transition-colors"
              >
                Get Started Free
              </button>
              <button
                onClick={handleSecondaryClick}
                className="hidden md:flex items-center gap-2 px-4 py-2.5
                  border border-white/20 text-white rounded-full
                  hover:bg-white/5 transition-colors"
              >
                See Features
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
