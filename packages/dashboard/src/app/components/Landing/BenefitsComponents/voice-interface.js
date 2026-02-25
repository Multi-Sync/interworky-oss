'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ChatHeader from './chat-header';
import VisualizerWaveAnimation from '../../VisualizerWaveAnimation';

export default function VoiceInterface({ isInView, showWaveform }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const waveformRef = useRef(null);

  // Initialize animation
  useEffect(() => {
    if (!isInView) {
      setIsAnimating(false);
      return;
    }

    // Start animation after a delay
    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [isInView]);

  return (
    <div className="w-full max-w-md mx-auto relative rounded-[24px] h-[340px] md:h-[400px]">
      <div className="bg-[#0F1615] border border-white/10 relative backdrop-blur-lg rounded-[20px] h-full flex flex-col">
        {/* Chat header */}
        <ChatHeader />

        {/* Voice interface body */}
        <div className="p-4 flex flex-col items-center justify-center flex-1 relative overflow-hidden">
          {/* Mic icon with pulsing animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-16"
          >
            <div className="relative flex justify-center">
              <div className="relative flex justify-center">
                {/* Outer circle */}
                <div className="hidden lg:block absolute -top-20 left-1/2 transform -translate-x-1/2">
                  <svg width="400" height="172" viewBox="0 0 419 172" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M418 171C406 -23.0004 90.0011 -63.0001 1.0007 116" stroke="white" strokeOpacity="0.12" />
                  </svg>
                </div>

                {/* Inner circle */}
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-0">
                  <svg width="250" height="250" viewBox="0 0 250 250" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="125" cy="125" r="124.5" stroke="white" strokeOpacity="0.12" />
                  </svg>
                </div>
                <div className="w-40 h-40 mt-20 bg-gradient-to-r from-[#058A7C] to-[#FCD966] rounded-full flex items-center justify-center z-10"></div>
              </div>
              <motion.div
                animate={
                  isAnimating
                    ? {
                        scale: [1, 1.2, 1],
                        opacity: [0.7, 0.5, 0.7],
                      }
                    : { scale: 1, opacity: 0.7 }
                }
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: 'loop',
                }}
                className="absolute inset-0 rounded-full -z-10"
              />
            </div>
          </motion.div>

          {/* Voice waveform */}
          {showWaveform && (
            <div
              ref={waveformRef}
              className="absolute bottom-0 translate-x-1 w-full max-w-[280px] md:max-w-[300px] z-20"
            >
              <VisualizerWaveAnimation isAnimating={isAnimating} width={280} height={60} />
            </div>
          )}

          {/* Floating elements */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isAnimating ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="absolute top-28 left-1"
          >
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="24" fill="#2F3333" fillOpacity="0.933333" />
              <path
                d="M27.5 17.5C27.5 15.567 25.933 14 24 14C22.067 14 20.5 15.567 20.5 17.5V24C20.5 25.933 22.067 27.5 24 27.5C25.933 27.5 27.5 25.933 27.5 24V17.5Z"
                fill="white"
                stroke="white"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M16.5 23.5C16.5 27.642 19.858 31 24 31M24 31C28.142 31 31.5 27.642 31.5 23.5M24 31V34"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isAnimating ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="absolute top-4 right-4"
          >
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="24" fill="#2F3333" fillOpacity="0.933333" />
              <path
                d="M25 14.5C25.3729 14.5 25.7324 14.6389 26.0084 14.8896C26.2844 15.1403 26.4572 15.4848 26.493 15.856L26.5 16V32C26.4998 32.3852 26.3514 32.7556 26.0856 33.0344C25.8198 33.3132 25.4569 33.479 25.0721 33.4975C24.6873 33.516 24.3102 33.3858 24.0188 33.1338C23.7274 32.8818 23.5442 32.5274 23.507 32.144L23.5 32V16C23.5 15.6022 23.658 15.2206 23.9393 14.9393C24.2206 14.658 24.6022 14.5 25 14.5ZM21 17.5C21.3978 17.5 21.7794 17.658 22.0607 17.9393C22.342 18.2206 22.5 18.6022 22.5 19V29C22.5 29.3978 22.342 29.7794 22.0607 30.0607C21.7794 30.342 21.3978 30.5 21 30.5C20.6022 30.5 20.2206 30.342 19.9393 30.0607C19.658 29.7794 19.5 29.3978 19.5 29V19C19.5 18.6022 19.658 18.2206 19.9393 17.9393C20.2206 17.658 20.6022 17.5 21 17.5ZM29 17.5C29.3978 17.5 29.7794 17.658 30.0607 17.9393C30.342 18.2206 30.5 18.6022 30.5 19V29C30.5 29.3978 30.342 29.7794 30.0607 30.0607C29.7794 30.342 29.3978 30.5 29 30.5C28.6022 30.5 28.2206 30.342 27.9393 30.0607C27.658 29.7794 27.5 29.3978 27.5 29V19C27.5 18.6022 27.658 18.2206 27.9393 17.9393C28.2206 17.658 28.6022 17.5 29 17.5ZM17 20.5C17.3978 20.5 17.7794 20.658 18.0607 20.9393C18.342 21.2206 18.5 21.6022 18.5 22V26C18.5 26.3978 18.342 26.7794 18.0607 27.0607C17.7794 27.342 17.3978 27.5 17 27.5C16.6022 27.5 16.2206 27.342 15.9393 27.0607C15.658 26.7794 15.5 26.3978 15.5 26V22C15.5 21.6022 15.658 21.2206 15.9393 20.9393C16.2206 20.658 16.6022 20.5 17 20.5ZM33 20.5C33.3729 20.5 33.7324 20.6389 34.0084 20.8896C34.2844 21.1403 34.4572 21.4848 34.493 21.856L34.5 22V26C34.4998 26.3852 34.3514 26.7556 34.0856 27.0344C33.8198 27.3132 33.4569 27.479 33.0721 27.4975C32.6873 27.516 32.3102 27.3858 32.0188 27.1338C31.7274 26.8818 31.5442 26.5274 31.507 26.144L31.5 26V22C31.5 21.6022 31.658 21.2206 31.9393 20.9393C32.2206 20.658 32.6022 20.5 33 20.5Z"
                fill="white"
              />
            </svg>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
