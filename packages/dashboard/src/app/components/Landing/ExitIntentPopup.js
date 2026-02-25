'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ModalPortal from '../ModalPortal';
import { useExitIntent } from '@/_common/hooks/useExitIntent';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/_common/utils/handleSlackNotification';

export default function ExitIntentPopup() {
  const { showExitIntent, setShowExitIntent } = useExitIntent({
    delay: 5000,
    cookieExpiry: 7,
  });
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { handleNotification } = useNotification();

  const handleSubmit = async e => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await handleNotification(`Exit intent capture: ${email}`);
      sessionStorage.setItem('prefilledEmail', email);
      router.push('/new');
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    handleNotification('Exit intent popup dismissed');
    setShowExitIntent(false);
  };

  if (!showExitIntent) return null;

  return (
    <ModalPortal>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center
            p-4 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative max-w-md w-full bg-gradient-to-br
              from-[#0a0a0a] to-[#1a1a1a] border border-emerald-500/30
              rounded-2xl p-8 text-center"
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white
                transition-colors"
              aria-label="Close popup"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Icon */}
            <div
              className="w-16 h-16 mx-auto mb-4 bg-emerald-500/20
              rounded-full flex items-center justify-center"
            >
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                />
              </svg>
            </div>

            {/* Content */}
            <h3 className="text-2xl font-bold text-white mb-2">Wait! Get Interworky Free</h3>
            <p className="text-gray-400 mb-6">
              AI-powered error tracking, voice support, and analytics for your site. 100% free, no credit card needed.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter your email"
                  className={`w-full px-4 py-3 rounded-lg bg-white/10
                    border ${error ? 'border-red-400' : 'border-white/20'}
                    text-white placeholder-gray-500
                    focus:outline-none focus:border-emerald-400 transition-colors`}
                  disabled={isLoading}
                />
                {error && <p className="absolute -bottom-5 left-0 text-xs text-red-400">{error}</p>}
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#058A7C] hover:bg-[#047A6C]
                  text-white font-semibold rounded-lg transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  'Get Started Free'
                )}
              </button>
            </form>

            <p className="text-gray-500 text-xs mt-4">No credit card required. Setup in 5 minutes.</p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </ModalPortal>
  );
}
