'use client';

import LovableLogo from '../../ProductIcons/LovableLogo';
import BoltLogo from '../../ProductIcons/BoltLogo';
import NextjsLogo from '../../ProductIcons/NextjsLogo';
import {
  WordPressLogo,
  SquarespaceLogo,
  WixLogo,
  HTML5Logo,
  OtherPlatformLogo,
} from '../../ProductIcons/IntegrationLogos';

const platforms = [
  {
    id: 'lovable',
    name: 'Lovable',
    description: 'AI-powered web builder',
    Logo: LovableLogo,
    color: 'from-pink-500/20 to-red-500/20',
    borderColor: 'border-pink-500/40',
    hoverBorder: 'hover:border-pink-500/60',
    selectedBorder: 'border-pink-500',
    selectedBg: 'bg-pink-500/10',
  },
  {
    id: 'bolt',
    name: 'Bolt',
    description: 'AI development platform',
    Logo: BoltLogo,
    color: 'from-yellow-500/20 to-orange-500/20',
    borderColor: 'border-yellow-500/40',
    hoverBorder: 'hover:border-yellow-500/60',
    selectedBorder: 'border-yellow-500',
    selectedBg: 'bg-yellow-500/10',
  },
  {
    id: 'nextjs',
    name: 'Next.js / React',
    description: 'CLI or manual integration',
    Logo: NextjsLogo,
    color: 'from-gray-500/20 to-gray-600/20',
    borderColor: 'border-gray-500/40',
    hoverBorder: 'hover:border-gray-500/60',
    selectedBorder: 'border-gray-700 dark:border-white',
    selectedBg: 'bg-gray-500/10',
  },
  {
    id: 'wordpress',
    name: 'WordPress',
    description: 'Plugin installation',
    Logo: WordPressLogo,
    color: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/40',
    hoverBorder: 'hover:border-blue-500/60',
    selectedBorder: 'border-blue-500',
    selectedBg: 'bg-blue-500/10',
  },
  {
    id: 'squarespace',
    name: 'Squarespace',
    description: 'Script embed',
    Logo: SquarespaceLogo,
    color: 'from-gray-600/20 to-gray-700/20',
    borderColor: 'border-gray-600/40',
    hoverBorder: 'hover:border-gray-600/60',
    selectedBorder: 'border-gray-600',
    selectedBg: 'bg-gray-600/10',
  },
  {
    id: 'wix',
    name: 'Wix',
    description: 'Script embed',
    Logo: WixLogo,
    color: 'from-indigo-500/20 to-purple-500/20',
    borderColor: 'border-indigo-500/40',
    hoverBorder: 'hover:border-indigo-500/60',
    selectedBorder: 'border-indigo-500',
    selectedBg: 'bg-indigo-500/10',
  },
  {
    id: 'html5',
    name: 'HTML / Static',
    description: 'Script embed',
    Logo: HTML5Logo,
    color: 'from-orange-500/20 to-red-500/20',
    borderColor: 'border-orange-500/40',
    hoverBorder: 'hover:border-orange-500/60',
    selectedBorder: 'border-orange-500',
    selectedBg: 'bg-orange-500/10',
  },
  {
    id: 'other',
    name: 'Other',
    description: 'Script embed',
    Logo: OtherPlatformLogo,
    color: 'from-slate-500/20 to-slate-600/20',
    borderColor: 'border-slate-500/40',
    hoverBorder: 'hover:border-slate-500/60',
    selectedBorder: 'border-slate-500',
    selectedBg: 'bg-slate-500/10',
  },
];

export default function PlatformSelector({ selected, onSelect, showChangeLink = false, onChangeClick }) {
  if (showChangeLink) {
    const selectedPlatform = platforms.find(p => p.id === selected);
    return (
      <div className="flex items-center gap-3 mb-6 p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-300 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {selectedPlatform && <selectedPlatform.Logo className="w-6 h-6" />}
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedPlatform?.name}</span>
        </div>
        <button
          onClick={onChangeClick}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors"
        >
          Change platform
        </button>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">
        What platform did you build your app with?
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Select your platform to see the relevant integration instructions
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {platforms.map(platform => {
          const isSelected = selected === platform.id;
          const Logo = platform.Logo;

          return (
            <button
              key={platform.id}
              onClick={() => onSelect(platform.id)}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-200
                bg-gradient-to-br ${platform.color}
                ${isSelected ? `${platform.selectedBorder} ${platform.selectedBg}` : `${platform.borderColor} ${platform.hoverBorder}`}
                hover:shadow-lg
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              `}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}

              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 mb-2 flex items-center justify-center">
                  <Logo className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{platform.name}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{platform.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
