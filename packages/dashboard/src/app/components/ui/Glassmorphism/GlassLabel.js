'use client';

/**
 * GlassLabel - A glassmorphism styled label with optional tooltip
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Label content
 * @param {boolean} [props.required=false] - Show required indicator
 * @param {string} [props.tooltip] - Tooltip text
 * @param {string} [props.accentColor='cyan'] - Accent color
 * @param {string} [props.className] - Additional CSS classes
 */
const GlassLabel = ({ children, required = false, tooltip, accentColor = 'cyan', className = '', htmlFor }) => {
  const accentColors = {
    cyan: 'text-cyan-400',
    purple: 'text-primary',
    blue: 'text-blue-400',
    green: 'text-green-400',
    orange: 'text-orange-400',
    pink: 'text-primary',
  };

  const textColor = accentColors[accentColor] || accentColors.cyan;

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={htmlFor} className={`text-sm font-medium ${textColor} ${className}`}>
        {children}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {tooltip && (
        <div className="group relative">
          <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {/* Tooltip */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-10">
            <div className="bg-[#0a0e27]/95 backdrop-blur-xl border border-gray-700/50 rounded-lg px-3 py-2 text-xs text-gray-300 whitespace-nowrap shadow-xl">
              {tooltip}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlassLabel;
