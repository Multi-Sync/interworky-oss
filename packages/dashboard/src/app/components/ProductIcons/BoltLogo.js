export default function BoltLogo({ className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className} fill="none">
      <defs>
        <linearGradient id="bolt-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1588FD" />
          <stop offset="100%" stopColor="#0066CC" />
        </linearGradient>
      </defs>
      <path
        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
        fill="url(#bolt-gradient)"
        stroke="url(#bolt-gradient)"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
