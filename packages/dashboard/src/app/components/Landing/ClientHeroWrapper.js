'use client';
import { memo } from 'react';

export default function ClientHeroWrapper({ children }) {
  return <>{children}</>;
}

// Export animated background elements
export const AnimatedBackground = memo(function AnimatedBackground() {
  return (
    <>
      {/* First circle - simplified for better rendering */}
      <div
        className="absolute top-0 left-0 -translate-x-[54%] -translate-y-[70%]"
        style={{ contain: 'paint' }} /* Improve paint performance */
      >
        <div
          className="rounded-full opacity-50 w-9/10 aspect-square bg-primary/50"
          style={{
            animation: 'upDown 6s ease-in-out infinite',
            willChange: 'transform',
            transform: 'translateZ(0)' /* Hardware acceleration */,
          }}
        />
      </div>
      {/* Second circle - simplified gradient for faster rendering */}
      <div
        className="absolute top-0 right-0 translate-x-[40%] -translate-y-[40%]"
        style={{ contain: 'paint' }} /* Improve paint performance */
      >
        <div
          className="min-w-[500px] w-[58%] md:w-4/5 aspect-square rounded-full bg-gradient-to-r from-emerald-400/5"
          style={{
            animation: 'upDown 6s ease-in-out infinite alternate',
            willChange: 'transform',
            transform: 'translateZ(0)' /* Hardware acceleration */,
          }}
        >
          <div className="inset-[10%] rounded-full bg-gradient-to-l from-emerald-400/10">
            <div className="absolute inset-[20%] rounded-full bg-gradient-to-l from-emerald-400/20" />
          </div>
        </div>
      </div>
    </>
  );
});
