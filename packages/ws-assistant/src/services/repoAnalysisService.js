/**
 * Repository Analysis Service
 * Orchestrates repository analysis and stores knowledge base
 */

const { Runner } = require("@openai/agents");
const { createRepoAnalysisAgent } = require("../agents/repoAnalysisAgent");
const axios = require("axios");

/**
 * Store repository knowledge in database
 * @param {string} organizationId - MongoDB ObjectId of organization
 * @param {Object} knowledge - Repository knowledge object
 * @returns {Promise<void>}
 */
async function storeRepoKnowledge(organizationId, knowledge) {
  const coreApiUrl = process.env.NODE_PUBLIC_API_URL;
  const accessToken = process.env.ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("ACCESS_TOKEN environment variable is not set");
  }

  try {
    await axios.put(
      `${coreApiUrl}/api/organization-version-control/${organizationId}/repository-knowledge`,
      {
        knowledge,
        analyzed_at: new Date().toISOString(),
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  } catch (error) {
    throw new Error(`Failed to store repository knowledge: ${error.message}`);
  }
}

/**
 * Fetch repository knowledge from database
 * @param {string} organizationId - MongoDB ObjectId of organization
 * @returns {Promise<Object|null>} Repository knowledge or null if not found
 */
async function fetchRepoKnowledge(organizationId) {
  const coreApiUrl = process.env.NODE_PUBLIC_API_URL;
  const accessToken = process.env.ACCESS_TOKEN;

  if (!accessToken) {
    return null;
  }

  try {
    const response = await axios.get(
      `${coreApiUrl}/api/organization-version-control/${organizationId}/repository-knowledge`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return response.data.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }

    return null;
  }
}

/**
 * Fetch file content from GitHub
 * @param {string} token - GitHub installation token
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - File path
 * @returns {Promise<string|null>} File content or null if not found
 */
async function fetchGitHubFile(token, owner, repo, path) {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );

    // Decode base64 content
    const content = Buffer.from(response.data.content, "base64").toString(
      "utf8",
    );
    return content;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error(`[RepoAnalysis] Error fetching ${path}:`, error.message);
    return null;
  }
}

/**
 * Fetch repository file tree structure
 * @param {string} token - GitHub installation token
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} branch - Branch name (default: main)
 * @returns {Promise<Array>} Array of file tree objects
 */
async function fetchGitHubFileTree(token, owner, repo, branch = "main") {
  try {
    // Get default branch if not specified
    const repoResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );

    const defaultBranch = repoResponse.data.default_branch || "main";

    // Get file tree
    const treeResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );

    return treeResponse.data.tree;
  } catch (error) {
    console.error("[RepoAnalysis] Error fetching file tree:", error.message);
    throw new Error(`Failed to fetch repository file tree: ${error.message}`);
  }
}

/**
 * Format file tree into a readable summary for agents
 * @param {Array} fileTree - GitHub file tree array
 * @returns {string} Formatted summary
 */
function formatFileTreeSummary(fileTree) {
  const directories = new Set();
  const keyFiles = [];

  // Collect directories and key files
  fileTree.forEach((item) => {
    if (item.type === "tree") {
      directories.add(item.path);
    } else if (item.type === "blob") {
      // Identify key files
      const filename = item.path.split("/").pop();
      if (
        filename.match(
          /^(layout|page|_app|_document|middleware|instrumentation)\.(tsx?|jsx?)$/,
        ) ||
        filename.match(/\.(test|spec)\.(tsx?|jsx?)$/) ||
        filename.match(
          /^(package\.json|tsconfig\.json|next\.config\.(js|mjs|ts))$/,
        )
      ) {
        keyFiles.push(item.path);
      }
    }
  });

  const summary = [];

  // List main directories
  const rootDirs = Array.from(directories)
    .filter((d) => !d.includes("/"))
    .sort();
  if (rootDirs.length > 0) {
    summary.push("Root directories: " + rootDirs.join(", "));
  }

  // List key Next.js directories
  const nextjsDirs = Array.from(directories).filter(
    (d) =>
      d.startsWith("app/") ||
      d.startsWith("pages/") ||
      d.startsWith("src/app/") ||
      d.startsWith("src/pages/"),
  );
  if (nextjsDirs.length > 0) {
    summary.push(
      "Next.js directories: " +
        nextjsDirs.slice(0, 10).join(", ") +
        (nextjsDirs.length > 10 ? "..." : ""),
    );
  }

  // List key files
  if (keyFiles.length > 0) {
    summary.push(
      "Key files found: " +
        keyFiles.slice(0, 20).join(", ") +
        (keyFiles.length > 20 ? "..." : ""),
    );
  }

  return summary.join("\n");
}

/**
 * Fetch repository data from GitHub (package.json, next.config, file tree)
 * @param {Object} githubConfig - GitHub config with token, owner, repo
 * @returns {Promise<Object>} Repository data
 */
async function fetchRepositoryData(githubConfig) {
  const { token, owner, repo } = githubConfig;

  console.log(`[RepoAnalysis] Fetching repository data for ${owner}/${repo}`);

  // Fetch package.json
  console.log("[RepoAnalysis] Fetching package.json...");
  const packageJson = await fetchGitHubFile(token, owner, repo, "package.json");

  // Fetch next.config.* (try all variants)
  console.log("[RepoAnalysis] Fetching next.config files...");
  let nextConfig = await fetchGitHubFile(token, owner, repo, "next.config.js");
  if (!nextConfig) {
    nextConfig = await fetchGitHubFile(token, owner, repo, "next.config.mjs");
  }
  if (!nextConfig) {
    nextConfig = await fetchGitHubFile(token, owner, repo, "next.config.ts");
  }

  // Fetch tsconfig.json or jsconfig.json (try both)
  console.log("[RepoAnalysis] Fetching tsconfig/jsconfig files...");
  let typeConfig = await fetchGitHubFile(token, owner, repo, "tsconfig.json");
  let typeConfigFilename = "tsconfig.json";
  if (!typeConfig) {
    typeConfig = await fetchGitHubFile(token, owner, repo, "jsconfig.json");
    typeConfigFilename = "jsconfig.json";
  }

  // Fetch file tree
  console.log("[RepoAnalysis] Fetching file tree...");
  const fileTree = await fetchGitHubFileTree(token, owner, repo);

  console.log(`[RepoAnalysis] Data fetched successfully:`);
  console.log(`  - package.json: ${packageJson ? "found" : "NOT FOUND"}`);
  console.log(
    `  - next.config.*: ${nextConfig ? "found" : "not found (optional)"}`,
  );
  console.log(
    `  - ${typeConfigFilename}: ${typeConfig ? "found" : "not found (optional)"}`,
  );
  console.log(`  - file tree: ${fileTree.length} files/directories`);

  return {
    packageJson,
    nextConfig,
    typeConfig,
    typeConfigFilename,
    fileTree,
  };
}

/**
 * Analyze repository and store knowledge base
 * @param {Object} params - { organizationId, githubConfig }
 * @returns {Promise<Object>} Result with success status and knowledge
 */
async function analyzeRepository({ organizationId, githubConfig }) {
  try {
    // 1. Fetch repository data from GitHub (package.json, next.config, file tree)
    const repoData = await fetchRepositoryData(githubConfig);

    if (!repoData.packageJson) {
      throw new Error("package.json not found in repository");
    }

    // 2. Create repo analysis agent (no MCP needed - data is pre-fetched)
    const repoAgent = createRepoAnalysisAgent();

    // 3. Build analysis prompt with pre-fetched data
    const prompt = `Analyze the repository: ${githubConfig.owner}/${githubConfig.repo}

You have been provided with the following repository data:

## PACKAGE.JSON
\`\`\`json
${repoData.packageJson}
\`\`\`

## NEXT.CONFIG FILE
${
  repoData.nextConfig
    ? `\`\`\`javascript
${repoData.nextConfig}
\`\`\``
    : "NOT FOUND (This repository may not be a Next.js project)"
}

## TSCONFIG/JSCONFIG FILE (${repoData.typeConfigFilename})
${
  repoData.typeConfig
    ? `\`\`\`json
${repoData.typeConfig}
\`\`\``
    : "NOT FOUND (This repository may not use TypeScript or may rely on default settings)"
}

## FILE TREE (all files in repository)
Total files: ${repoData.fileTree.length}

Key directories and files:
${formatFileTreeSummary(repoData.fileTree)}

Full file list (first 500 files):
${repoData.fileTree
  .slice(0, 500)
  .map((f) => `${f.type === "tree" ? "📁" : "📄"} ${f.path}`)
  .join("\n")}

---

Use the 4 specialized tools to analyze this data:
1. Call analyze_package_json() - analyzes the package.json content provided above
2. Call analyze_next_config() - analyzes the next.config content provided above
3. Call analyze_type_config() - analyzes the tsconfig/jsconfig content provided above (extracts path aliases!)
4. Call analyze_file_structure() - analyzes the file tree provided above

Then merge their outputs into a complete knowledge base.

Start your analysis now.`;

    // 4. Run agent analysis
    const runner = new Runner();
    const startTime = Date.now();

    const rawResult = await runner.run(repoAgent, prompt, { stream: false });

    const duration = Date.now() - startTime;

    // 5. Extract result from agent response
    // NOTE: OpenAI Agents output can be in multiple locations depending on version/config
    // Always check: currentStep.output, lastProcessedResponse, generatedItems, finalMessage
    let knowledge;
    let outputText = null;

    // Strategy 1: Check currentStep.output (check both currentStep and _currentStep)
    const currentStep =
      rawResult.currentStep ||
      rawResult._currentStep ||
      rawResult.state?._currentStep;
    console.log({ currentStep });
    if (currentStep?.output) {
      // console.log("[RepoAnalysis] Strategy 1: Checking currentStep.output");
      // console.log("[RepoAnalysis] currentStep.output type:", typeof currentStep.output);

      if (typeof currentStep.output === "string") {
        outputText = currentStep.output;
      } else if (typeof currentStep.output === "object") {
        // Sometimes it's already parsed
        knowledge = currentStep.output;
      }
    }

    // Strategy 2: Check lastProcessedResponse.newItems
    if (
      !outputText &&
      !knowledge &&
      rawResult.lastProcessedResponse?.newItems
    ) {
      for (const item of rawResult.lastProcessedResponse.newItems) {
        if (item.rawItem?.content?.[0]?.text) {
          outputText = item.rawItem.content[0].text;
          break;
        }
      }
    }

    // Strategy 3: Check generatedItems for message_output_item
    if (
      !outputText &&
      !knowledge &&
      rawResult.generatedItems &&
      Array.isArray(rawResult.generatedItems)
    ) {
      for (let i = rawResult.generatedItems.length - 1; i >= 0; i--) {
        const item = rawResult.generatedItems[i];

        if (
          item.type === "message_output_item" &&
          item.rawItem?.content?.[0]?.text
        ) {
          outputText = item.rawItem.content[0].text;
          break;
        }
      }
    }

    // Strategy 4: Check finalMessage
    if (!outputText && !knowledge && rawResult.finalMessage) {
      if (typeof rawResult.finalMessage === "string") {
        outputText = rawResult.finalMessage;
      } else if (rawResult.finalMessage.content?.[0]?.text) {
        outputText = rawResult.finalMessage.content[0].text;
      }
    }

    // Strategy 5: Check state.modelResponses (new OpenAI Agents format)
    if (!outputText && !knowledge && rawResult.state?.modelResponses) {
      // Get last response (most recent)
      const lastResponse =
        rawResult.state.modelResponses[
          rawResult.state.modelResponses.length - 1
        ];

      if (lastResponse?.output && Array.isArray(lastResponse.output)) {
        // Look for output with text content
        for (const outputItem of lastResponse.output) {
          // Check for text field directly
          if (outputItem.text) {
            outputText = outputItem.text;
            break;
          }
          // Check for content array
          if (outputItem.content?.[0]?.text) {
            outputText = outputItem.content[0].text;
            break;
          }
        }
      }
    }

    // Parse outputText to knowledge if needed
    if (outputText && !knowledge) {
      try {
        knowledge = JSON.parse(outputText);
      } catch (parseError) {
        throw new Error(`Failed to parse agent output: ${parseError.message}`);
      }
    }

    // Final check
    if (!knowledge) {
      throw new Error("Agent output not found in expected locations");
    }

    // 6. Parse JSON strings back to objects for storage
    const parsedKnowledge = {
      ...knowledge,
      structure: {
        directories: JSON.parse(knowledge.directories_summary || "{}"),
        entry_points: knowledge.entry_points
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      },
      error_handling_patterns: {
        uses_try_catch: knowledge.uses_try_catch,
        uses_optional_chaining: knowledge.uses_optional_chaining,
        uses_null_checks: knowledge.uses_null_checks,
        common_patterns: JSON.parse(knowledge.error_patterns || "[]"),
      },
      common_imports: JSON.parse(knowledge.common_imports_summary || "[]"),
      testing: {
        framework: knowledge.testing_framework,
        has_tests: knowledge.has_tests,
        test_pattern: knowledge.test_pattern,
      },
      dependencies: JSON.parse(knowledge.dependencies_summary || "{}"),
    };

    // Remove flattened fields
    delete parsedKnowledge.directories_summary;
    delete parsedKnowledge.entry_points;
    delete parsedKnowledge.uses_try_catch;
    delete parsedKnowledge.uses_optional_chaining;
    delete parsedKnowledge.uses_null_checks;
    delete parsedKnowledge.error_patterns;
    delete parsedKnowledge.common_imports_summary;
    delete parsedKnowledge.testing_framework;
    delete parsedKnowledge.has_tests;
    delete parsedKnowledge.test_pattern;
    delete parsedKnowledge.dependencies_summary;

    // 7. Store knowledge in database
    await storeRepoKnowledge(organizationId, parsedKnowledge);

    return {
      success: true,
      knowledge: parsedKnowledge,
      analyzed_at: new Date().toISOString(),
      duration_ms: duration,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      analyzed_at: new Date().toISOString(),
    };
  }
}

module.exports = {
  analyzeRepository,
  fetchRepoKnowledge,
  storeRepoKnowledge,
};
