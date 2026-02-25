import React from 'react';

const DeviceAwarenessIcon = () => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 200 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="deviceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <filter id="deviceGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Desktop Monitor */}
        <g filter="url(#deviceGlow)">
          <rect x="40" y="50" width="60" height="40" rx="2" fill="none" stroke="url(#deviceGradient)" strokeWidth="2" />
          <line x1="50" y1="90" x2="90" y2="90" stroke="url(#deviceGradient)" strokeWidth="2" />
          <rect x="65" y="90" width="10" height="8" fill="url(#deviceGradient)" />
        </g>

        {/* Tablet */}
        <g filter="url(#deviceGlow)">
          <rect
            x="70"
            y="110"
            width="40"
            height="55"
            rx="3"
            fill="none"
            stroke="url(#deviceGradient)"
            strokeWidth="2"
          />
          <circle cx="90" cy="160" r="2" fill="url(#deviceGradient)" />
        </g>

        {/* Mobile Phone */}
        <g filter="url(#deviceGlow)">
          <rect
            x="120"
            y="60"
            width="28"
            height="50"
            rx="4"
            fill="none"
            stroke="url(#deviceGradient)"
            strokeWidth="2"
          />
          <circle cx="134" cy="105" r="2" fill="url(#deviceGradient)" />
          <line
            x1="128"
            y1="65"
            x2="140"
            y2="65"
            stroke="url(#deviceGradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>

        {/* Smartwatch */}
        <g filter="url(#deviceGlow)">
          <rect
            x="155"
            y="110"
            width="22"
            height="26"
            rx="3"
            fill="none"
            stroke="url(#deviceGradient)"
            strokeWidth="2"
          />
          <line x1="155" y1="116" x2="152" y2="116" stroke="url(#deviceGradient)" strokeWidth="1.5" />
          <line x1="177" y1="116" x2="180" y2="116" stroke="url(#deviceGradient)" strokeWidth="1.5" />
        </g>

        {/* Connection dots/network effect */}
        <g opacity="0.6">
          <circle cx="70" cy="70" r="2" fill="#10b981">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="90" cy="130" r="2" fill="#06b6d4">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="0.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="134" cy="85" r="2" fill="#8b5cf6">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="1s" repeatCount="indefinite" />
          </circle>
          <circle cx="166" cy="123" r="2" fill="#10b981">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="1.5s" repeatCount="indefinite" />
          </circle>

          {/* Connecting lines */}
          <line x1="70" y1="70" x2="90" y2="130" stroke="#10b981" strokeWidth="0.5" opacity="0.3" strokeDasharray="2,2">
            <animate attributeName="stroke-dashoffset" from="0" to="10" dur="2s" repeatCount="indefinite" />
          </line>
          <line
            x1="90"
            y1="130"
            x2="134"
            y2="85"
            stroke="#06b6d4"
            strokeWidth="0.5"
            opacity="0.3"
            strokeDasharray="2,2"
          >
            <animate attributeName="stroke-dashoffset" from="0" to="10" dur="2s" repeatCount="indefinite" />
          </line>
          <line
            x1="134"
            y1="85"
            x2="166"
            y2="123"
            stroke="#8b5cf6"
            strokeWidth="0.5"
            opacity="0.3"
            strokeDasharray="2,2"
          >
            <animate attributeName="stroke-dashoffset" from="0" to="10" dur="2s" repeatCount="indefinite" />
          </line>
        </g>
      </svg>
    </div>
  );
};

export default DeviceAwarenessIcon;
