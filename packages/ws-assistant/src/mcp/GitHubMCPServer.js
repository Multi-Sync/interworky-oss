/**
 * Custom GitHub MCP Server Implementation
 *
 * Provides MCP-compatible interface for GitHub repository access
 * using the GitHub REST API via Octokit.
 *
 * Available Tools:
 * - read_file: Read file contents
 * - search_files: Search for files by name pattern
 * - search_code: Search code content
 * - list_directory: List directory contents
 * - get_file_info: Get file metadata
 */
class GitHubMCPServer {
  constructor({ token, owner, repo }) {
    this.name = "github";
    this.token = token;
    this.owner = owner;
    this.repo = repo;
    this.octokit = null;
    this.cacheToolsList = true;
    this._toolsCache = null;
  }

  async connect() {
    // Dynamic import for ES module compatibility
    const { Octokit } = await import("@octokit/rest");
    this.octokit = new Octokit({ auth: this.token });
    console.log(`[GitHubMCP] Connected to ${this.owner}/${this.repo}`);
  }

  async close() {
    this.octokit = null;
    console.log(`[GitHubMCP] Disconnected`);
  }

  async listTools() {
    if (this.cacheToolsList && this._toolsCache) {
      return this._toolsCache;
    }

    const tools = [
      {
        name: "read_file",
        description: "Read a file from the GitHub repository",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "File path relative to repository root",
            },
          },
          required: ["path"],
          additionalProperties: false,
        },
      },
      {
        name: "search_files",
        description: "Search for files in the repository by name pattern",
        inputSchema: {
          type: "object",
          properties: {
            pattern: {
              type: "string",
              description: "File name pattern to search for",
            },
          },
          required: ["pattern"],
          additionalProperties: false,
        },
      },
      {
        name: "search_code",
        description: "Search for code content in the repository",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Code search query",
            },
          },
          required: ["query"],
          additionalProperties: false,
        },
      },
      {
        name: "list_directory",
        description: "List contents of a directory",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Directory path (empty string for root)",
            },
          },
          required: ["path"],
          additionalProperties: false,
        },
      },
      {
        name: "get_file_info",
        description: "Get metadata about a file (size, type, existence)",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "File path",
            },
          },
          required: ["path"],
          additionalProperties: false,
        },
      },
    ];

    if (this.cacheToolsList) {
      this._toolsCache = tools;
    }

    return tools;
  }

  async callTool(toolName, args) {
    if (!this.octokit) {
      throw new Error("GitHub MCP server not connected");
    }

    console.log(`[GitHubMCP] Calling tool: ${toolName}`, args);

    try {
      switch (toolName) {
        case "read_file":
          return await this.readFile(args.path);
        case "search_files":
          return await this.searchFiles(args.pattern);
        case "search_code":
          return await this.searchCode(args.query);
        case "list_directory":
          return await this.listDirectory(args.path);
        case "get_file_info":
          return await this.getFileInfo(args.path);
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      console.error(`[GitHubMCP] Tool error:`, error.message);
      return [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ];
    }
  }

  async readFile(path) {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
      });

      if (data.type !== "file") {
        throw new Error(`${path} is not a file`);
      }

      const content = Buffer.from(data.content, "base64").toString("utf8");
      return [
        {
          type: "text",
          text: content,
        },
      ];
    } catch (error) {
      if (error.status === 404) {
        return [{ type: "text", text: `File not found: ${path}` }];
      }
      throw error;
    }
  }

  async searchFiles(pattern) {
    try {
      const { data } = await this.octokit.search.code({
        q: `filename:${pattern} repo:${this.owner}/${this.repo}`,
        per_page: 20,
      });

      const results = data.items.map((item) => item.path);
      return [
        {
          type: "text",
          text: results.length > 0 ? results.join("\n") : "No files found",
        },
      ];
    } catch (error) {
      throw error;
    }
  }

  async searchCode(query) {
    try {
      const { data } = await this.octokit.search.code({
        q: `${query} repo:${this.owner}/${this.repo}`,
        per_page: 20,
      });

      const results = data.items.map((item) => `${item.path}:${item.name}`);
      return [
        {
          type: "text",
          text: results.length > 0 ? results.join("\n") : "No results found",
        },
      ];
    } catch (error) {
      throw error;
    }
  }

  async listDirectory(path) {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: path || "",
      });

      if (!Array.isArray(data)) {
        return [{ type: "text", text: "Not a directory" }];
      }

      const listing = data.map((item) => `${item.type}: ${item.path}`);
      return [
        {
          type: "text",
          text: listing.join("\n"),
        },
      ];
    } catch (error) {
      if (error.status === 404) {
        return [{ type: "text", text: `Directory not found: ${path}` }];
      }
      throw error;
    }
  }

  async getFileInfo(path) {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
      });

      const info = {
        exists: true,
        type: data.type,
        size: data.size,
        name: data.name,
        path: data.path,
      };

      return [
        {
          type: "text",
          text: JSON.stringify(info, null, 2),
        },
      ];
    } catch (error) {
      if (error.status === 404) {
        return [
          {
            type: "text",
            text: JSON.stringify({ exists: false, path }),
          },
        ];
      }
      throw error;
    }
  }

  async invalidateToolsCache() {
    this._toolsCache = null;
  }
}

module.exports = { GitHubMCPServer };
