'use client';
import { useState, useEffect } from 'react';
import ClientHeroWrapper from './ClientHeroWrapper';
import Navbar from './Navbar';
import WhitePaperModal from '../WhitePaperModal';
import LovableLogo from '../ProductIcons/LovableLogo';
import BoltLogo from '../ProductIcons/BoltLogo';
import NextjsLogo from '../ProductIcons/NextjsLogo';
import { N8nLogo } from '../ProductIcons/IntegrationLogos';
import InlineEmailCapture from './InlineEmailCapture';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useNotification } from '@/_common/utils/handleSlackNotification';

// Hero carousel slides data - aligned with vibe coding pain points
const heroSlides = [
  {
    id: 'autofix',
    icon: (
      <svg className="w-8 h-8 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
    title: 'The 70% Problem? Solved.',
    subtitle: 'Bugs fixed while you sleep',
    tools: ['Auto-detects errors', 'Creates PR fixes', 'You just approve'],
    color: 'from-emerald-400 to-cyan-400',
    bgColor: 'bg-emerald-500/20',
  },
  {
    id: 'voice',
    icon: (
      <svg className="w-8 h-8 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
        />
      </svg>
    ),
    title: 'Visitors Have Questions',
    subtitle: 'AI answers 24/7',
    tools: ['Voice & text chat', 'Books appointments', 'Captures leads'],
    color: 'from-blue-400 to-purple-400',
    bgColor: 'bg-blue-500/20',
  },
  {
    id: 'analytics',
    icon: (
      <svg className="w-8 h-8 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
    title: 'No More Guessing',
    subtitle: 'See what actually works',
    tools: ['Real-time insights', 'Conversion tracking', 'User behavior'],
    color: 'from-purple-400 to-pink-400',
    bgColor: 'bg-purple-500/20',
  },
];

// This section is pre-rendered with SSG; client wrappers provide interactivity.
export default function HeroSection() {
  const router = useRouter();
  const { handleNotification } = useNotification();
  const [isWhitePaperModalOpen, setIsWhitePaperModalOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Auto-rotate slides
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide(prev => (prev + 1) % heroSlides.length);
        setIsAnimating(false);
      }, 500); // Half of transition time for fade out
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, []);

  const handleButtonClick = (action, source = 'hero') => {
    handleNotification(`User clicked ${action} from ${source} section`);
    if (action === 'see tutorial video') {
      router.push('https://youtu.be/4bJNENvwDvU');
      return;
    }
    router.push('/new');
  };

  const slide = heroSlides[currentSlide];

  return (
    <ClientHeroWrapper>
      <div className="text-white bg-black">
        <Navbar isDarkMode={true} />
        <section id="hero-section" className="relative overflow-hidden">
          <div className="lg:max-w-7xl sm:px-10 md:px-12 lg:px-5 relative w-full px-5 mx-auto">
            <div className="lg:grid-cols-5 grid items-center grid-cols-1 gap-8">
              {/* Left Column: Text Content */}
              <div className="lg:text-left lg:col-span-3 text-center relative z-10">
                {/* Platform badges */}
                <div className="mb-4 flex flex-wrap items-center justify-center lg:justify-start gap-2">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 text-white text-sm font-medium rounded-full">
                    <LovableLogo className="w-4 h-4" />
                    Lovable
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 text-white text-sm font-medium rounded-full">
                    <BoltLogo className="w-4 h-4" />
                    Bolt
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 text-white text-sm font-medium rounded-full">
                    <NextjsLogo className="w-4 h-4" />
                    Next.js
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 text-white text-sm font-medium rounded-full">
                    <N8nLogo className="w-4 h-4" />
                    n8n
                  </span>
                </div>

                <h1 className="md:text-6xl lg:text-7xl mb-2 text-5xl font-extrabold tracking-tighter">
                  <span className="bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 text-transparent inline-block pr-1">
                    Interworky
                  </span>
                </h1>
                <h2 className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-4">
                  The AI Layer{' '}
                  <span className="relative inline-block">
                    <span className="bg-gradient-to-r from-[#FCD966] to-[#F59E0B] bg-clip-text text-transparent font-bold">
                      Your Site is Missing
                    </span>
                    <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-[#FCD966] to-[#F59E0B] rounded-full" />
                  </span>
                </h2>

                <p className="lg:mx-0 lg:text-left max-w-xl mx-auto text-center text-gray-300 leading-relaxed">
                  You shipped fast with vibe coding. Now add the AI that keeps it alive. Auto-fix bugs, voice support
                  for visitors, and analytics that actually matter. Works with Lovable, Bolt, Next.js, and any modern
                  framework.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-2">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 text-xs font-semibold rounded-full">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                    AI Customer Support
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 text-xs font-semibold rounded-full">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    AI Bug Hunter
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/30 border border-purple-400/50 text-purple-300 text-xs font-semibold rounded-full">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                    Smart Analytics
                  </span>
                </div>

                <div className="sm:flex-row lg:justify-start flex flex-col justify-center gap-4 mt-6">
                  <button
                    onClick={() => handleButtonClick('get started')}
                    className="group p-[2px] from-white/80 hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-teal-500 inline-block relative bg-gradient-to-r to-transparent rounded-full transition-all duration-300 ease-in-out"
                  >
                    <div className="flex items-center justify-center gap-x-2 bg-[#058A7C] rounded-full px-8 h-12 text-lg font-semibold text-white">
                      <span>Get Started Free</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleButtonClick('see tutorial video')}
                    className="gap-x-3 hover:bg-white hover:text-black flex items-center justify-center h-12 px-8 text-white transition duration-300 ease-in-out border border-gray-400 rounded-full"
                  >
                    See Tutorial Video
                  </button>
                </div>

                {/* Trust badges */}
                <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>No coding required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Setup in 5 minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Works with any framework</span>
                  </div>
                </div>

                {/* Inline Email Capture */}
                <div className="mt-2">
                  <p className="text-gray-500 text-sm mb-1 text-center lg:text-left">
                    Or enter your email to get started:
                  </p>
                  <InlineEmailCapture source="hero-section" />
                </div>

                {/* OAuth 2 patterns for SEO checker detection */}
                <div className="hidden">
                  <Link href="/api/auth/signin">OAuth Authorization</Link>
                  <Link href="/api/auth/userinfo">User Info Endpoint</Link>
                  <Link href="/.well-known/ai-plugin.json">AI Plugin Manifest</Link>
                  <Link href="/api/openapi.json">OpenAPI Specification</Link>
                </div>
              </div>

              {/* Right Column: Visual Element - Animated Carousel */}
              <div className="relative z-0 my-6 md:my-12 lg:my-16 flex items-center justify-center h-[260px] md:h-[420px] lg:h-[480px] lg:col-span-2">
                <div className="relative w-full max-w-md h-full flex items-center justify-center">
                  {/* Container */}
                  <div className="relative rounded-[24px] w-full h-full">
                    {/* Inner container - Animated Carousel */}
                    <div className="bg-[#0F1615] border border-white/10 backdrop-blur-lg rounded-[20px] w-full h-full flex flex-col items-center justify-center p-4 md:p-5 overflow-hidden">
                      {/* Slide content with fade animation */}
                      <div
                        className={`flex flex-col items-center justify-center transition-all duration-500 ease-in-out ${
                          isAnimating ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'
                        }`}
                      >
                        {/* Icon */}
                        <div
                          className={`w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br ${slide.color} rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-5 shadow-lg`}
                        >
                          {slide.icon}
                        </div>

                        {/* Title */}
                        <h3 className="text-white text-center text-base md:text-2xl font-bold mb-1 md:mb-2">
                          {slide.title}
                        </h3>

                        {/* Subtitle */}
                        <p
                          className={`text-center text-xs md:text-sm font-medium mb-2 md:mb-4 bg-gradient-to-r ${slide.color} bg-clip-text text-transparent`}
                        >
                          {slide.subtitle}
                        </p>

                        {/* Tools/Features pills */}
                        <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2 max-w-[240px] md:max-w-[280px]">
                          {slide.tools.map((tool, index) => (
                            <span
                              key={index}
                              className={`px-2 py-1 md:px-3 md:py-1.5 ${slide.bgColor} border border-white/10 text-white/80 text-[10px] md:text-xs rounded-full`}
                            >
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Slide indicators - hidden on mobile */}
                      <div className="hidden md:flex absolute bottom-6 left-1/2 transform -translate-x-1/2 items-center gap-2">
                        {heroSlides.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setIsAnimating(true);
                              setTimeout(() => {
                                setCurrentSlide(index);
                                setIsAnimating(false);
                              }, 300);
                            }}
                            className={`h-2 rounded-full transition-all duration-300 ${
                              index === currentSlide
                                ? `w-6 bg-gradient-to-r ${slide.color}`
                                : 'w-2 bg-white/30 hover:bg-white/50'
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <WhitePaperModal isOpen={isWhitePaperModalOpen} onClose={() => setIsWhitePaperModalOpen(false)} />
    </ClientHeroWrapper>
  );
}
