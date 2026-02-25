/**
 * GitHub Configuration Service
 * Shared service for fetching GitHub configuration for organizations
 */

const axios = require("axios");

const LOG_PREFIX = "[GitHubConfig]";

/**
 * Fetch GitHub configuration for organization
 * @param {string} organizationId - MongoDB ObjectId of organization
 * @returns {Promise<Object>} GitHub config with token, owner, repo, installationId, repoFullName
 */
async function fetchGitHubConfig(organizationId) {
  console.log(`${LOG_PREFIX} Fetching GitHub config for org ${organizationId}`);

  const coreApiUrl = process.env.NODE_PUBLIC_API_URL;
  const accessToken = process.env.ACCESS_TOKEN;

  if (!accessToken) {
    console.error(`${LOG_PREFIX} ACCESS_TOKEN environment variable is not set`);
    throw new Error("ACCESS_TOKEN environment variable is not set");
  }

  try {
    const startTime = Date.now();
    const response = await axios.get(
      `${coreApiUrl}/api/organization-version-control/${organizationId}/token`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    const duration = Date.now() - startTime;

    const { token, repository } = response.data.data;

    if (!repository?.full_name || !token) {
      console.error(
        `${LOG_PREFIX} GitHub not configured for org ${organizationId}`,
      );
      throw new Error("GitHub not configured for organization");
    }

    const [owner, repo] = repository.full_name.split("/");

    console.log(
      `${LOG_PREFIX} ✅ Config fetched for ${owner}/${repo} (${duration}ms)`,
    );

    return {
      token,
      owner,
      repo,
      installationId: repository.id,
      repoFullName: repository.full_name,
    };
  } catch (error) {
    console.error(
      `${LOG_PREFIX} ❌ Failed to fetch config for org ${organizationId}:`,
      error.message,
    );
    throw new Error(`Failed to fetch GitHub config: ${error.message}`);
  }
}

module.exports = {
  fetchGitHubConfig,
};
