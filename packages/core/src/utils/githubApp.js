const jwt = require('jsonwebtoken');
const axios = require('axios');

/**
 * GitHub App Authentication Utility
 * Generates JWTs and installation access tokens for GitHub App
 */

// GitHub App Configuration
const GH_APP_ID = process.env.GH_APP_ID;
const GH_APP_PRIVATE_KEY = process.env.GH_APP_PRIVATE_KEY;
const GH_CLIENT_ID = process.env.GH_CLIENT_ID;
const GH_CLIENT_SECRET = process.env.GH_CLIENT_SECRET;

/**
 * Generate JWT for GitHub App authentication
 * JWT is valid for 10 minutes (GitHub's max) and is used to authenticate as the app itself
 * @returns {string} JWT token
 */
function generateAppJWT() {
  if (!GH_APP_PRIVATE_KEY) {
    throw new Error('GH_APP_PRIVATE_KEY environment variable is not set');
  }

  // Parse the private key (handle both direct PEM and base64-encoded formats)
  let privateKey = GH_APP_PRIVATE_KEY;
  if (!privateKey.includes('BEGIN RSA PRIVATE KEY')) {
    // Assume it's base64 encoded
    try {
      privateKey = Buffer.from(privateKey, 'base64').toString('utf8');
    } catch (error) {
      console.error('[GitHubApp] Error parsing private key:', error.message);
      throw new Error('Invalid GH_APP_PRIVATE_KEY format');
    }
  }

  // Replace literal \n with actual newlines if needed
  privateKey = privateKey.replace(/\\n/g, '\n');

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60, // Issued at time (60 seconds in the past to allow for clock drift)
    exp: now + 600, // Expiration time (10 minutes, GitHub's maximum)
    iss: GH_APP_ID, // GitHub App's identifier
  };

  try {
    return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
  } catch (error) {
    console.error('[GitHubApp] Error generating JWT:', error.message);
    throw new Error(`Failed to generate GitHub App JWT: ${error.message}`);
  }
}

/**
 * Exchange OAuth code for access token
 * Used during the installation callback to get user authorization
 * @param {string} code - OAuth code from GitHub callback
 * @returns {Promise<{access_token: string, token_type: string, scope: string}>}
 */
async function exchangeCodeForToken(code) {
  try {
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GH_CLIENT_ID,
        client_secret: GH_CLIENT_SECRET,
        code: code,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      },
    );

    if (response.data.error) {
      throw new Error(`GitHub OAuth error: ${response.data.error_description || response.data.error}`);
    }

    return response.data;
  } catch (error) {
    console.error('[GitHubApp] Error exchanging code for token:', error.message);
    throw error;
  }
}

/**
 * Get installation access token for a specific installation
 * This token is scoped to the repositories the installation has access to
 * Token is valid for 1 hour
 * @param {string} installationId - GitHub App installation ID
 * @returns {Promise<{token: string, expires_at: string, permissions: object, repositories?: array}>}
 */
async function getInstallationAccessToken(installationId) {
  const appJWT = generateAppJWT();

  try {
    const response = await axios.post(
      `https://api.github.com/app/installations/${installationId}/access_tokens`,
      {},
      {
        headers: {
          Authorization: `Bearer ${appJWT}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error('[GitHubApp] Error getting installation token:', error.response?.data || error.message);
    throw new Error(`Failed to get installation access token: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Get installation details
 * @param {string} installationId - GitHub App installation ID
 * @returns {Promise<object>} Installation details including account info and permissions
 */
async function getInstallationDetails(installationId) {
  const appJWT = generateAppJWT();

  try {
    const response = await axios.get(`https://api.github.com/app/installations/${installationId}`, {
      headers: {
        Authorization: `Bearer ${appJWT}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    return response.data;
  } catch (error) {
    console.error('[GitHubApp] Error getting installation details:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get repositories accessible by an installation
 * @param {string} installationId - GitHub App installation ID
 * @returns {Promise<array>} Array of repository objects
 */
async function getInstallationRepositories(installationId) {
  const { token } = await getInstallationAccessToken(installationId);

  try {
    const response = await axios.get('https://api.github.com/installation/repositories', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    return response.data.repositories;
  } catch (error) {
    console.error('[GitHubApp] Error getting installation repositories:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Verify installation access token is valid
 * @param {string} token - Installation access token to verify
 * @returns {Promise<boolean>} True if valid, false otherwise
 */
async function verifyInstallationToken(token) {
  try {
    const response = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });
    return response.status === 200;
  } catch (error) {
    console.error('[GitHubApp] Error verifying installation token:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Create a GitHub issue for an error
 * @param {string} installationId - GitHub App installation ID
 * @param {string} repoFullName - Repository full name (owner/repo)
 * @param {object} errorData - Error information
 * @returns {Promise<object>} Created issue details
 */
async function createIssueForError(installationId, repoFullName, errorData) {
  const { token } = await getInstallationAccessToken(installationId);

  const issueBody = `## Error Details

**Message:** ${errorData.message}

**Severity:** ${errorData.severity || 'N/A'}

**Timestamp:** ${errorData.timestamp || new Date().toISOString()}

**Stack Trace:**
\`\`\`
${errorData.stack || 'No stack trace available'}
\`\`\`

**Context:**
${errorData.context ? JSON.stringify(errorData.context, null, 2) : 'No additional context'}

---
*This issue was automatically created by Carla Auto Fix*`;

  try {
    const response = await axios.post(
      `https://api.github.com/repos/${repoFullName}/issues`,
      {
        title: `[Auto Fix] ${errorData.message}`,
        body: issueBody,
        labels: ['auto-fix', 'bug'],
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error('[GitHubApp] Error creating issue:', error.response?.data || error.message);
    throw new Error(`Failed to create GitHub issue: ${error.response?.data?.message || error.message}`);
  }
}

module.exports = {
  generateAppJWT,
  exchangeCodeForToken,
  getInstallationAccessToken,
  getInstallationDetails,
  getInstallationRepositories,
  verifyInstallationToken,
  createIssueForError,
  GH_APP_ID,
  GH_CLIENT_ID,
};
