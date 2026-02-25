/**
 * GitHub token and repository validation helpers
 */

/**
 * Validate GitHub token format
 * @param {string} token - GitHub token
 * @param {string} tokenType - 'classic' or 'fine-grained'
 * @returns {boolean} - Whether token format is valid
 */
export const isValidTokenFormat = (token, tokenType) => {
  if (!token) return false;

  if (tokenType === 'classic') {
    // Classic tokens: ghp_XXXX (40 chars total)
    return /^ghp_[a-zA-Z0-9]{36}$/.test(token);
  } else {
    // Fine-grained tokens: github_pat_XXXX (longer, variable length)
    return /^github_pat_[a-zA-Z0-9_]+$/.test(token);
  }
};

/**
 * Auto-detect token type from format
 * @param {string} token - GitHub token
 * @returns {string|null} - 'classic', 'fine-grained', or null if unknown
 */
export const detectTokenType = token => {
  if (!token) return null;

  if (token.startsWith('ghp_')) return 'classic';
  if (token.startsWith('github_pat_')) return 'fine-grained';

  return null;
};

/**
 * Validate repository owner and name format
 * @param {string} owner - Repository owner (username or organization)
 * @param {string} repo - Repository name
 * @returns {object} - { valid: boolean, error: string|null }
 */
export const validateRepositoryFormat = (owner, repo) => {
  if (!owner || !repo) {
    return {
      valid: false,
      error: 'Both owner and repository name are required',
    };
  }

  // GitHub username/org: alphanumeric, hyphens (no consecutive hyphens)
  // 1-39 characters, cannot start or end with hyphen
  const ownerRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

  if (!ownerRegex.test(owner)) {
    return {
      valid: false,
      error: 'Invalid owner format. Use only letters, numbers, and hyphens (cannot start/end with hyphen)',
    };
  }

  // Repo name: alphanumeric, hyphens, underscores, dots
  // 1-100 characters
  const repoRegex = /^[a-zA-Z0-9._-]{1,100}$/;

  if (!repoRegex.test(repo)) {
    return {
      valid: false,
      error: 'Invalid repository name. Use only letters, numbers, hyphens, underscores, and dots',
    };
  }

  return { valid: true, error: null };
};

/**
 * Get user-friendly error message based on API error
 * @param {string} errorMessage - Error message from API
 * @param {string} tokenType - 'classic' or 'fine-grained'
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {string} - User-friendly error message
 */
export const getGitHubErrorMessage = (errorMessage, tokenType, owner, repo) => {
  const lowerError = errorMessage.toLowerCase();

  if (lowerError.includes('404') || lowerError.includes('not found')) {
    return `❌ Repository "${owner}/${repo}" not found. Check that it exists and your token has access to it.`;
  }

  if (lowerError.includes('401') || lowerError.includes('unauthorized')) {
    return `❌ Authentication failed. Your token may be invalid or expired. Please create a new token.`;
  }

  if (lowerError.includes('403') || lowerError.includes('forbidden')) {
    const permissions =
      tokenType === 'classic'
        ? 'repo, workflow'
        : 'Contents (Read & Write), Pull requests (Read & Write), Issues (Read & Write)';

    return `❌ Access denied. Check your token has these permissions: ${permissions}`;
  }

  if (lowerError.includes('network') || lowerError.includes('fetch')) {
    return '❌ Network error. Please check your internet connection and try again.';
  }

  return `❌ ${errorMessage || 'Failed to connect. Please check your credentials and try again.'}`;
};

/**
 * Get required permissions list for display
 * @param {string} tokenType - 'classic' or 'fine-grained'
 * @returns {object} - { required: string[], optional: string[] }
 */
