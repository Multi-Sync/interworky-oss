/**
 * Duplicate Detection Service
 * Prevents creating duplicate PRs/issues for the same error or CVE
 */

const axios = require("axios");

const LOG_PREFIX = "[DuplicateDetection]";

/**
 * Search for existing open PRs containing a specific identifier in the body
 * @param {Object} params - { owner, repo, token, identifier, type }
 * @param {string} params.identifier - Unique ID to search for (error ID or CVE ID)
 * @param {string} params.type - Type of fix: "error" or "security"
 * @returns {Promise<Object|null>} Existing PR data or null if none found
 */
async function findExistingPR({ owner, repo, token, identifier, type }) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
  };

  try {
    // Build search query based on type
    const titlePrefix = type === "security" ? "[Security]" : "[Auto-Fix]";

    // Search for open PRs in the repo containing the identifier
    const searchQuery = `repo:${owner}/${repo} is:pr is:open "${identifier}" in:body`;
    const searchUrl = `https://api.github.com/search/issues?q=${encodeURIComponent(searchQuery)}`;

    console.log(
      `${LOG_PREFIX} Searching for existing PR with identifier: ${identifier}`,
    );

    const response = await axios.get(searchUrl, { headers });

    if (response.data.total_count > 0) {
      // Filter to ensure it's the right type of PR
      const matchingPR = response.data.items.find(
        (item) => item.title.startsWith(titlePrefix) && item.pull_request, // Ensure it's a PR
      );

      if (matchingPR) {
        console.log(
          `${LOG_PREFIX} Found existing PR #${matchingPR.number}: ${matchingPR.html_url}`,
        );
        return {
          number: matchingPR.number,
          html_url: matchingPR.html_url,
          title: matchingPR.title,
          state: matchingPR.state,
        };
      }
    }

    console.log(
      `${LOG_PREFIX} No existing PR found for identifier: ${identifier}`,
    );
    return null;
  } catch (error) {
    console.error(
      `${LOG_PREFIX} Error searching for existing PR:`,
      error.message,
    );
    // Don't block PR creation on search failure
    return null;
  }
}

/**
 * Search for existing open issues containing a specific identifier in the body
 * @param {Object} params - { owner, repo, token, identifier, type }
 * @param {string} params.identifier - Unique ID to search for (error ID or CVE ID)
 * @param {string} params.type - Type of fix: "error" or "security"
 * @returns {Promise<Object|null>} Existing issue data or null if none found
 */
async function findExistingIssue({ owner, repo, token, identifier, type }) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
  };

  try {
    // Build search query based on type
    const titlePrefix = type === "security" ? "[Security]" : "[Auto-Fix]";

    // Search for open issues in the repo containing the identifier
    // Note: GitHub search API returns both issues and PRs, so we filter
    const searchQuery = `repo:${owner}/${repo} is:issue is:open "${identifier}" in:body`;
    const searchUrl = `https://api.github.com/search/issues?q=${encodeURIComponent(searchQuery)}`;

    console.log(
      `${LOG_PREFIX} Searching for existing issue with identifier: ${identifier}`,
    );

    const response = await axios.get(searchUrl, { headers });

    if (response.data.total_count > 0) {
      // Filter to ensure it's the right type of issue (not a PR)
      const matchingIssue = response.data.items.find(
        (item) => item.title.startsWith(titlePrefix) && !item.pull_request, // Ensure it's an issue, not a PR
      );

      if (matchingIssue) {
        console.log(
          `${LOG_PREFIX} Found existing issue #${matchingIssue.number}: ${matchingIssue.html_url}`,
        );
        return {
          number: matchingIssue.number,
          html_url: matchingIssue.html_url,
          title: matchingIssue.title,
          state: matchingIssue.state,
        };
      }
    }

    console.log(
      `${LOG_PREFIX} No existing issue found for identifier: ${identifier}`,
    );
    return null;
  } catch (error) {
    console.error(
      `${LOG_PREFIX} Error searching for existing issue:`,
      error.message,
    );
    // Don't block issue creation on search failure
    return null;
  }
}

/**
 * Check for any existing PR or issue for a given identifier
 * @param {Object} params - { owner, repo, token, identifier, type }
 * @returns {Promise<Object|null>} Existing PR/issue data with type indicator, or null
 */
async function findExistingPROrIssue({ owner, repo, token, identifier, type }) {
  // Check PRs first (more important to not duplicate)
  const existingPR = await findExistingPR({
    owner,
    repo,
    token,
    identifier,
    type,
  });
  if (existingPR) {
    return { ...existingPR, itemType: "pr" };
  }

  // Then check issues
  const existingIssue = await findExistingIssue({
    owner,
    repo,
    token,
    identifier,
    type,
  });
  if (existingIssue) {
    return { ...existingIssue, itemType: "issue" };
  }

  return null;
}

module.exports = {
  findExistingPR,
  findExistingIssue,
  findExistingPROrIssue,
};
