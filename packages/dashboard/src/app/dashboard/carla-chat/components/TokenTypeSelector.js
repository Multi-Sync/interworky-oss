'use client';

/**
 * Token Type Selector Component
 * Allows users to choose between Classic and Fine-Grained GitHub tokens
 */
export const TokenTypeSelector = ({ tokenType, setTokenType }) => {
  return (
    <div className="mb-6">
      <label className="block text-base font-medium text-gray-300 mb-3">Token Type</label>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setTokenType('classic')}
          className={`flex-1 px-5 py-4 rounded-lg text-base font-medium transition-all ${
            tokenType === 'classic'
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
              : 'bg-surface-elevated text-gray-400 hover:bg-neutral-700 hover:text-gray-300'
          }`}
        >
          <div className="flex flex-col items-center gap-1">
            <span>Classic Token</span>
            <span className="text-sm opacity-75">ghp_...</span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setTokenType('fine-grained')}
          className={`flex-1 px-5 py-4 rounded-lg text-base font-medium transition-all ${
            tokenType === 'fine-grained'
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
              : 'bg-surface-elevated text-gray-400 hover:bg-neutral-700 hover:text-gray-300'
          }`}
        >
          <div className="flex flex-col items-center gap-1">
            <span>Fine-Grained Token</span>
            <span className="text-sm opacity-75">
              github_pat_... <span className="ml-1 text-green-400">✓ Recommended</span>
            </span>
          </div>
        </button>
      </div>
      <p className="text-sm text-gray-500 mt-3">
        {tokenType === 'classic'
          ? 'Classic tokens have broad access to all repositories'
          : 'Fine-grained tokens are more secure with repository-specific permissions'}
      </p>
    </div>
  );
};
