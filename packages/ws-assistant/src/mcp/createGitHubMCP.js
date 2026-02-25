const { GitHubMCPServer } = require("./GitHubMCPServer");

/**
 * Create and connect GitHub MCP server
 *
 * Factory function that creates a GitHubMCPServer instance and establishes
 * connection to GitHub API via Octokit.
 *
 * @param {object} config - GitHub configuration
 * @param {string} config.token - GitHub Personal Access Token or Installation token
 * @param {string} config.owner - Repository owner (organization or user)
 * @param {string} config.repo - Repository name
 * @returns {Promise<GitHubMCPServer>} Connected MCP server instance
 *
 * @example
 * const githubMCP = await createGitHubMCP({
 *   token: "ghp_xxx",
 *   owner: "Multi-Sync",
 *   repo: "interworky-frontend"
 * });
 *
 * // Use with agent
 * const agent = createCarlaAgent(orgId, [githubMCP]);
 *
 * // Always cleanup when done
 * await githubMCP.close();
 */
async function createGitHubMCP({ token, owner, repo }) {
  if (!token) {
    throw new Error("GitHub token is required");
  }
  if (!owner || !repo) {
    throw new Error("Repository owner and name are required");
  }

  const server = new GitHubMCPServer({ token, owner, repo });
  await server.connect();
  return server;
}

module.exports = { createGitHubMCP };
