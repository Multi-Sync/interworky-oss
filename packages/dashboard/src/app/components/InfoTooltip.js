// InfoLabel.js
import Link from 'next/link';
import { useRef, useState } from 'react';

const InfoLabel = ({ label, tooltipText, docLink, docText = 'Documentation' }) => {
  const [showInfo, setShowInfo] = useState(false);
  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShowInfo(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowInfo(false);
    }, 300); // 300ms grace period
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <label className="block font-medium text-primary break-words">{label}</label>
        <div className="relative">
          <button
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              setShowInfo(prev => !prev);
            }}
            className="hover:ring-primary/50 hover:ring-2 block text-primary rounded-full transition-all"
            aria-label="Info"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </button>
          {showInfo && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 z-10 w-48 p-3 text-xs text-white bg-[#0a0e27]/95 backdrop-blur-xl border border-primary/30 rounded-lg shadow-2xl transition-opacity duration-300 text-balance">
              {tooltipText}
            </div>
          )}
        </div>
      </div>
      {docLink && (
        <Link
          href={docLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-primary tracking-tighter underline hover:text-primary transition-colors"
        >
          {docText}
        </Link>
      )}
    </div>
  );
};

export default InfoLabel;
