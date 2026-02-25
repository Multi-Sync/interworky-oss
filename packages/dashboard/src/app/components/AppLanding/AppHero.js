'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '@/_common/utils/handleSlackNotification';

export default function AppHero() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);
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
      const timestamp = new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

      await handleNotification(
        `🚀 New Interworky Mobile Waitlist Signup\nEmail: ${email}\nSource: Mobile Landing Page\nTime: ${timestamp}`,
      );

      sessionStorage.setItem('mobileWaitlistEmail', email);
      setSuccess(true);
      setEmail('');
      // Keep modal open for 2.5s to show success message, then close
      setTimeout(() => {
        setShowModal(false);
      }, 2500);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fadeInUp = delay => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay },
  });

  const cards = [
    {
      icon: '💬',
      title: 'Chat',
      subtitle: 'Your command center',
      gradient: 'from-emerald-500/15 to-emerald-500/5',
      border: 'border-emerald-500/30',
      hoverBorder: 'hover:border-emerald-500/50',
    },
    {
      icon: '📁',
      title: 'Files',
      subtitle: 'Your work memory',
      gradient: 'from-cyan-500/15 to-cyan-500/5',
      border: 'border-cyan-500/30',
      hoverBorder: 'hover:border-cyan-500/50',
    },
    {
      icon: '📅',
      title: 'Calendar',
      subtitle: 'Your reality check',
      gradient: 'from-purple-500/15 to-purple-500/5',
      border: 'border-purple-500/30',
      hoverBorder: 'hover:border-purple-500/50',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col text-white bg-black relative">
      {/* Background atmosphere */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-cyan-500/5 blur-[100px] pointer-events-none" />

      {/* NAV — shrink-0 */}
      <nav className="shrink-0 w-full py-3 px-5 sm:px-10 lg:px-5 lg:max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">iW</span>
          </div>
          <span className="text-white font-semibold text-lg">Interworky</span>
        </div>
        <a
          href="https://multisync.io"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 text-sm hover:text-gray-300 transition-colors"
        >
          by MultiSync
        </a>
      </nav>

      {/* CENTER HERO — flex-1, vertically centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 relative">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div {...fadeInUp(0)} className="mb-4 sm:mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white text-sm font-medium rounded-full">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Coming Soon
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            {...fadeInUp(0.1)}
            className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight mb-4 sm:mb-6"
          >
            <span className="bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 text-transparent">
              Your AI
            </span>
            <br />
            <span className="text-white">Executive Assistant</span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            {...fadeInUp(0.2)}
            className="text-lg sm:text-xl lg:text-2xl text-gray-300 font-medium mb-6 sm:mb-8"
          >
            You talk. It listens. It remembers.
            <br className="sm:hidden" />{' '}
            It plans. It executes.
          </motion.p>

          {/* CTA Button */}
          <motion.div {...fadeInUp(0.3)} className="flex justify-center">
            {success ? (
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/20 border border-emerald-500/50 rounded-full">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-emerald-300 font-medium">You&apos;re on the list</span>
              </div>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                className="px-8 py-3 sm:px-10 sm:py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600
                  text-white font-semibold rounded-full transition-all text-base sm:text-lg
                  shadow-lg shadow-emerald-500/25"
              >
                Coming Soon
              </button>
            )}
          </motion.div>
        </div>
      </div>

      {/* BOTTOM — shrink-0, surface cards + philosophy */}
      <div className="shrink-0 px-5 pb-6 sm:pb-8 relative">
        {/* Surface cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex justify-center gap-3 sm:gap-4 mb-4 sm:mb-5"
        >
          {cards.map(card => (
            <div
              key={card.title}
              className={`bg-gradient-to-b ${card.gradient} border ${card.border} ${card.hoverBorder}
                backdrop-blur-lg rounded-xl p-3 sm:p-4 text-center transition-colors
                w-[110px] sm:w-[140px]`}
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-1.5 sm:mb-2 flex items-center justify-center text-xl sm:text-2xl">
                {card.icon}
              </div>
              <div className="text-white font-semibold text-sm sm:text-base">{card.title}</div>
              <div className="text-gray-400 text-xs sm:text-sm mt-0.5">{card.subtitle}</div>
            </div>
          ))}
        </motion.div>

        {/* Philosophy line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center text-gray-500 text-sm sm:text-base"
        >
          Conversation, memory, files, and time — one calm experience.
        </motion.p>
      </div>

      {/* Interest Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-5"
            onClick={() => setShowModal(false)}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative bg-[#111] border border-white/10 rounded-2xl p-8 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              {/* Close button */}
              {!success && (
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {success ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">You&apos;re on the list!</h3>
                  <p className="text-gray-400 mb-2">
                    Thanks for your interest in Interworky.
                  </p>
                  <p className="text-gray-500 text-sm">
                    We&apos;ll reach out as soon as early access is available.
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-white mb-2">Get early access</h3>
                  <p className="text-gray-400 mb-6">
                    Leave your email and we&apos;ll let you know when Interworky is ready.
                  </p>

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
                        className={`w-full px-5 py-4 rounded-xl bg-white/10 border
                          ${error ? 'border-red-400' : 'border-white/20'}
                          text-white placeholder-gray-400 focus:outline-none
                          focus:border-emerald-400 transition-colors text-lg`}
                        disabled={isLoading}
                        autoFocus
                      />
                      {error && <p className="absolute -bottom-6 left-5 text-xs text-red-400">{error}</p>}
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600
                        text-white font-semibold rounded-xl transition-all disabled:opacity-50
                        disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg
                        shadow-lg shadow-emerald-500/25"
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
                        "I'm Interested"
                      )}
                    </button>

                    {/* Trust indicators */}
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-500 pt-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>No spam</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Unsubscribe anytime</span>
                      </div>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
