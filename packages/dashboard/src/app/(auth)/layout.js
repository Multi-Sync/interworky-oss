'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function AuthLayout({ children }) {
  const scrollContainerRef = useRef(null);
  const pathname = usePathname();

  // Reset scroll position on route change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [pathname]);

  return (
    <div className="h-screen flex justify-center lg:justify-normal bg-white bg-interworky-gradient lg:bg-none overflow-hidden">
      {/* Left side - Scrollable */}
      <div
        ref={scrollContainerRef}
        className="flex-1 flex flex-col max-w-[343px] lg:max-w-none gap-4 bg-white items-center px-4 pt-7 pb-10 rounded-lg lg:rounded-none lg:px-0 overflow-y-auto"
      >
        <div className="w-full max-w-[380px] mx-auto">
          <div className="mb-5">
            <Link href="/">
              <Image
                src="/finallogo.png"
                alt="Interworky Logo"
                width={223}
                height={31}
                className="h-auto w-[122px] lg:w-[223px]"
              />
            </Link>
          </div>
          <div className="w-full">{children}</div>
        </div>
        <div className="flex gap-1 justify-center items-center w-full text-secondary mt-auto">
          Having issues? <span className="text-primary underline font-medium">hello@interworky.com</span>
        </div>
      </div>
      {/* Right side - Static */}
      <div className="hidden lg:flex relative flex-1 bg-interworky-gradient items-end pb-24 justify-center overflow-hidden">
        <div className="relative flex flex-col items-center justify-center z-20  w-[556px] gap-8 rounded-lg p-12 text-white">
          <h1 className="scroll-m-20 lg:text-5xl text-4xl font-extrabold tracking-tight">Ship Fast. Stay Alive.</h1>
          <p className="scroll-m-20 text-subTitle tracking-tight">
            The AI layer for vibe-coded sites. 24/7 support, auto bug detection, and analytics that matter - so you can
            ship fast without breaking things.
          </p>
          <div className="flex flex-wrap gap-4 justify-center overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full relative group transition-all duration-300 hover:scale-105 animate-fade-slide-up bg-gradient-to-r from-white/10 to-white/20 overflow-hidden w-fit">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine"></div>
              <span className="text-lg relative z-10">🎙️</span>
              <span className="text-sm font-medium relative z-10 text-black">24/7 AI Support</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full relative group transition-all duration-300 hover:scale-105 animate-fade-slide-up [animation-delay:150ms] bg-gradient-to-r from-white/10 to-white/20 overflow-hidden w-fit">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine"></div>
              <span className="text-lg relative z-10">🐛</span>
              <span className="text-sm font-medium relative z-10 text-black">Auto Bug Detection</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full relative group transition-all duration-300 hover:scale-105 animate-fade-slide-up [animation-delay:300ms] bg-gradient-to-r from-white/10 to-white/20 overflow-hidden w-fit">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine"></div>
              <span className="text-lg relative z-10">📊</span>
              <span className="text-sm font-medium relative z-10 text-black">Smart Analytics</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full relative group transition-all duration-300 hover:scale-105 animate-fade-slide-up [animation-delay:450ms] bg-gradient-to-r from-white/10 to-white/20 overflow-hidden w-fit">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine"></div>
              <span className="text-lg relative z-10">⚡</span>
              <span className="text-sm font-medium relative z-10 text-black">Works with Lovable & Bolt</span>
            </div>
          </div>
          <div className="opacity-20 absolute top-0 right-0 z-10 w-full h-full bg-white rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}
