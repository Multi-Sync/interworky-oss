'use client';

import Link from 'next/link';

export default function GradientBorderButton({ href, children, className = '', showArrow = true, target = '_self' }) {
  return (
    <Link
      target={target || '_self'}
      href={href}
      className={`group p-[2px] from-white/80 hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-teal-500 ${className} inline-block relative bg-gradient-to-r to-transparent rounded-full transition-all duration-300 ease-in-out`}
    >
      <div className="flex items-center justify-center gap-x-2 bg-[#058A7C] rounded-full px-8 h-12 text-lg font-semibold text-white">
        <span>{children}</span>
        {showArrow && (
          <svg
            className="group-hover:translate-x-1 w-5 h-5 transition-transform duration-300 ease-in-out transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
          </svg>
        )}
      </div>
    </Link>
  );
}
