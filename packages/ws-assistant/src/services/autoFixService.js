/**
 * Auto-Fix Service
 * Orchestrates the error → analysis → PR/issue flow
 * Connects error detection, AI analysis, and GitHub PR creation
 */

const axios = require("axios");
const { Runner } = require("@openai/agents");
const { createErrorFixAgent } = require("../agents/errorFixAgent");
const { createGitHubMCP } = require("../mcp/createGitHubMCP");
const {
  createErrorFixPR,
  fetchRelatedFiles,
  fetchFileFromGitHub,
  convertToGitHubLink,
} = require("./errorFixPRService");
const { fetchRepoKnowledge } = require("./repoAnalysisService");
const { ensureSnapshot } = require("./repoSnapshotService");
const { fetchGitHubConfig } = require("./githubConfigService");
const { findExistingIssue } = require("./duplicateDetectionService");

/**
 * Build error analysis prompt for the agent
 * @param {Object} error - Error data from backend
 * @param {Object} repoKnowledge - Repository knowledge from analysis (optional)
 * @param {Array} relatedFiles - Array of { path, content } for related files (optional)
 * @param {boolean} hasSnapshot - Whether a codebase snapshot is available (passed to agent separately)
 * @returns {string} Formatted prompt for error fix agent
 */
function buildErrorPrompt(
  error,
  repoKnowledge = null,
  relatedFiles = [],
  hasSnapshot = false,
) {
  const {
    error_type,
    message,
    stack_trace,
    source_file,
    line_number,
    column_number,
    function_name,
    url,
    context,
    severity,
    metadata,
  } = error;

  // Use resolved source location from source maps if available (Phase 2)
  const userCodeFrame = metadata?.user_code_frame;
  const resolvedFrames = metadata?.resolved_stack_frames;

  // Determine actual source location (prefer resolved over minified)
  const actualFile = userCodeFrame?.file || source_file;
  const actualLine = userCodeFrame?.line || line_number;
  const actualColumn = userCodeFrame?.column || column_number;
  const actualFunction = userCodeFrame?.function || function_name;

  // Extract source file path from URL if it's a minified bundle
  let githubFilePath = actualFile;

  // Check if this is a Vite/Lovable minified bundle
  const viteBundleDetected = isViteBundle(source_file);
  const searchClues = viteBundleDetected ? extractSearchClues(error) : null;

  if (githubFilePath && githubFilePath.includes("http")) {
    // Extract path from URL: https://example.com/_next/static/chunks/app/test-bugs/page-ff1b88f8afe00694.js
    const urlMatch = githubFilePath.match(
      /\/_next\/static\/chunks\/app\/(.+)$/,
    );
    if (urlMatch) {
      let extractedPath = urlMatch[1];
      // Remove webpack hash: page-ff1b88f8afe00694.js → page.js
      extractedPath = extractedPath.replace(/-[a-f0-9]{16}\.js$/, ".js");
      githubFilePath = `src/app/${extractedPath}`;
    } else if (viteBundleDetected) {
      // For Vite bundles, we cannot extract a meaningful path
      // Set to null to trigger heuristic search
      githubFilePath = null;
    }
  } else if (githubFilePath && !githubFilePath.startsWith("src/")) {
    // If it's a relative path from source maps, ensure it starts with src/
    if (
      !githubFilePath.includes("node_modules") &&
      !githubFilePath.startsWith("webpack")
    ) {
      // Remove webpack hash if present
      githubFilePath = githubFilePath.replace(/-[a-f0-9]{16}\.js$/, ".js");
    }
  }

  return `# Error Analysis Request

## Error Information

**Error Type:** ${error_type}
**Message:** ${message}
**Severity:** ${severity}

## Source Location (After Source Map Resolution)

**File to Analyze:** \`${githubFilePath}\`
- Line: ${actualLine || "Unknown"}
- Column: ${actualColumn || "Unknown"}
- Function: ${actualFunction || "Unknown"}
- URL: ${url}

${
  userCodeFrame
    ? `
**Note:** This is the original source location resolved from the minified production bundle using source maps.
The minified location was: ${source_file}:${line_number}:${column_number}
`
    : viteBundleDetected
      ? `
**IMPORTANT: Minified Vite/Lovable Bundle Detected**

The error occurred in a minified Vite bundle (\`${source_file}\`). The file path and line numbers are NOT useful for finding the source code.

**You MUST use heuristic search to find the actual source file.**
`
      : `
**Note:** No source map resolution available. Location may be from minified production code.
`
}

${
  viteBundleDetected && searchClues
    ? `
## Heuristic Search Clues

Since this is a minified bundle, use these contextual clues to find the actual source file:

${
  searchClues.consoleMessages.length > 0
    ? `**Console Messages Before Error (HIGH PRIORITY - search for these exact strings):**
${searchClues.consoleMessages.map((m) => `- \`"${m}"\``).join("\n")}
`
    : ""
}
${
  searchClues.uiTexts.length > 0
    ? `**UI Elements Clicked (search for these in JSX/component files):**
${searchClues.uiTexts.map((t) => `- \`"${t}"\``).join("\n")}
`
    : ""
}
${
  searchClues.propertyPatterns.length > 0
    ? `**Property Access Pattern (search for .${searchClues.propertyPatterns.join(", .")} usage):**
${searchClues.propertyPatterns.map((p) => `- \`.${p}\``).join("\n")}
`
    : ""
}
${
  searchClues.functionPatterns.length > 0
    ? `**Potential Component/Function Names:**
${searchClues.functionPatterns.map((f) => `- \`${f}\``).join("\n")}
`
    : ""
}

### Search Strategy for Vite/Lovable Projects:
1. **FIRST**: Use \`find_relevant_files\` with the console messages as context
2. Search for the exact console.log string (most reliable)
3. Search for UI button/text to find click handlers
4. Search for the property being accessed (e.g., \`.profile\`)
5. Check common Lovable locations: \`src/components/\`, \`src/pages/\`, \`src/hooks/\`

### Lovable/Vite Project Structure:
- \`src/components/\` - React components (check here first!)
- \`src/components/ui/\` - shadcn-ui base components
- \`src/pages/\` - Page components
- \`src/hooks/\` - Custom React hooks
- \`src/lib/\` - Utilities and helpers
- \`src/App.tsx\` - Main app with providers/routing
- \`src/main.tsx\` - Entry point
`
    : ""
}

${
  resolvedFrames && resolvedFrames.length > 0
    ? `
## Resolved Stack Trace (Source-Mapped to Original Source)

\`\`\`
${resolvedFrames
  .slice(0, 5)
  .map(
    (f) =>
      `at ${f.function || "(anonymous)"} (${f.file}:${f.line}:${f.column})`,
  )
  .join("\n")}
\`\`\`
`
    : ""
}

## Production Stack Trace (Minified)

\`\`\`
${stack_trace || "No stack trace available"}
\`\`\`

## Error Context

${context ? JSON.stringify(context, null, 2) : "No context available"}

${
  repoKnowledge
    ? `
## Repository Knowledge (Pre-Analyzed Codebase Context)

The following information was pre-analyzed from the repository to help you understand the codebase:

**Project Information:**
- Type: ${repoKnowledge.project_type || "Unknown"}
- Framework Version: ${repoKnowledge.framework_version || "Unknown"}

**Directory Structure:**
${
  repoKnowledge.structure?.directories
    ? Object.entries(repoKnowledge.structure.directories)
        .map(([dir, desc]) => `  - \`${dir}\`: ${desc}`)
        .join("\n")
    : "  No directory information available"
}

**Entry Points:**
${repoKnowledge.structure?.entry_points ? repoKnowledge.structure.entry_points.join(", ") : "Unknown"}

**Path Aliases (CRITICAL for Import Resolution):**
${
  repoKnowledge.common_imports && repoKnowledge.common_imports.length > 0
    ? repoKnowledge.common_imports
        .filter(
          (imp) => imp.usage && imp.usage.toLowerCase().includes("path alias"),
        )
        .map((imp) => `  - ${imp.import_statement}\n    ${imp.usage}`)
        .join("\n") || "  No path aliases configured"
    : "  No path aliases configured"
}

**Dependencies:**
${
  repoKnowledge.dependencies
    ? Object.entries(repoKnowledge.dependencies)
        .slice(0, 10)
        .map(([dep, ver]) => `  - ${dep}: ${ver}`)
        .join("\n")
    : "  No dependency information available"
}

**Testing Setup:**
- Framework: ${repoKnowledge.testing?.framework || "none"}
- Has Tests: ${repoKnowledge.testing?.has_tests ? "Yes" : "No"}
- Test Pattern: ${repoKnowledge.testing?.test_pattern || "none"}

**Error Handling Patterns in Codebase:**
- Uses try-catch: ${repoKnowledge.error_handling_patterns?.uses_try_catch ? "Yes" : "No"}
- Uses optional chaining (?.): ${repoKnowledge.error_handling_patterns?.uses_optional_chaining ? "Yes" : "No"}
- Uses null checks: ${repoKnowledge.error_handling_patterns?.uses_null_checks ? "Yes" : "No"}

${
  repoKnowledge.error_handling_patterns?.common_patterns &&
  repoKnowledge.error_handling_patterns.common_patterns.length > 0
    ? `
**Common Error Handling Patterns Found:**
${repoKnowledge.error_handling_patterns.common_patterns
  .slice(0, 3)
  .map((pattern, i) => `  ${i + 1}. ${pattern}`)
  .join("\n")}
`
    : ""
}

**Additional Notes:**
${repoKnowledge.notes || "No additional notes"}

**How to Use This Information:**
- If the error is an import error, check the path aliases above
- Match the error handling style found in the codebase (try-catch vs optional chaining)
- Consider the project structure when determining file paths
- Use the testing framework information when suggesting test cases
`
    : ""
}

${
  relatedFiles && relatedFiles.length > 0
    ? `
## Related Files (Pre-Fetched for Context)

The following files are imported by or related to the error file. Use these to understand types, functions, and context:

${relatedFiles
  .map(
    (file) => `### \`${file.path}\`
\`\`\`javascript
${file.content}
\`\`\`
`,
  )
  .join("\n")}

**Note:** These files have been pre-fetched to save time. You may still need to read other files using the GitHub MCP tools.
`
    : ""
}

${
  hasSnapshot
    ? `
## Codebase Analysis Available

**IMPORTANT: Call find_relevant_files FIRST** to analyze the codebase and find files related to this error.

\`\`\`
find_relevant_files({
  packageName: "", // Leave empty for error analysis
  context: "${error_type}: ${message} in ${githubFilePath}:${actualLine}"
})
\`\`\`

The tool will analyze the repository and return:
- \`relevantFiles\`: Files related to the error with code snippets
- \`summary\`: Analysis of what was found

Use the results to understand the error context, find related files, and generate accurate fixes.
`
    : ""
}

## Your Task

${
  viteBundleDetected
    ? `**HEURISTIC SEARCH MODE (Vite/Lovable Bundle)**

1. **Use \`find_relevant_files\` FIRST** with the search clues above
2. Search for console log messages to find the source file
3. Search for UI text/button labels to find event handlers
4. Once you find the source file, analyze the code
5. Determine if it can be automatically fixed
6. If fixable, generate the precise code fix

**Important Instructions:**
- DO NOT try to read \`${source_file}\` - it's a minified bundle
- Use the console messages and UI text as search terms
- Search in \`src/components/\`, \`src/pages/\`, \`src/hooks/\`
- The error likely involves accessing \`.${searchClues?.propertyPatterns?.[0] || "property"}\` on undefined`
    : `1. **Read the source file:** \`${githubFilePath}\`
2. **Focus on line ${actualLine}** in the \`${actualFunction || "function"}\`
3. Analyze the root cause of the error
4. Determine if it can be automatically fixed
5. If fixable, generate the precise code fix
6. Provide detailed reasoning for your analysis

**Important Instructions:**
- Start by reading: \`${githubFilePath}\`
- The error occurs around line ${actualLine}
- This is the ORIGINAL SOURCE CODE, not minified`
}
${repoKnowledge ? "- Use the Repository Knowledge above to understand path aliases, project structure, and coding patterns\n- Match the error handling style found in this codebase\n" : ""}- Be conservative: Only set canFix: true if you're confident the fix won't introduce bugs
- If this appears to be intentional test code, set canFix: false

Use the GitHub MCP tools to read source files and understand the codebase context.
`;
}

/**
 * Detect if source file is from a minified Vite/Lovable bundle
 * @param {string} sourceFile - Source file path or URL
 * @returns {boolean} True if this is a Vite bundle
 */
function isViteBundle(sourceFile) {
  if (!sourceFile) return false;

  // Pattern 1: Vite assets directory with hash
  // e.g., assets/index-C9hwmkc6.js, assets/main-Ab12Cd34.js
  if (sourceFile.includes("/assets/") && /-[A-Za-z0-9]{6,10}\.js$/.test(sourceFile)) {
    return true;
  }

  // Pattern 2: Just the filename without path
  // e.g., index-C9hwmkc6.js
  if (/^(index|main|app|vendor)-[A-Za-z0-9]{6,10}\.js$/.test(sourceFile)) {
    return true;
  }

  // Pattern 3: Lovable-specific URL patterns
  if (sourceFile.includes(".lovable.app/assets/") || sourceFile.includes(".lovable.dev/assets/")) {
    return true;
  }

  return false;
}

/**
 * Extract searchable clues from error context for heuristic file finding
 * When stack traces are from minified bundles, these clues help find the actual source
 * @param {Object} error - Error data from backend
 * @returns {Object} { consoleMessages, uiTexts, propertyPatterns, functionPatterns }
 */
function extractSearchClues(error) {
  const clues = {
    consoleMessages: [],
    uiTexts: [],
    propertyPatterns: [],
    functionPatterns: [],
  };

  // Extract console log messages (most reliable clue)
  // Look for non-error logs that happened right before the crash
  if (error.context?.consoleHistory) {
    clues.consoleMessages = error.context.consoleHistory
      .filter((log) => log.level !== "error") // Non-error logs before the crash
      .map((log) =>
        typeof log.message === "string" ? log.message : JSON.stringify(log.message),
      )
      .filter((msg) => msg && msg.length > 5 && msg.length < 200) // Reasonable length
      .slice(-5); // Last 5 console messages
  }

  // Extract UI text from breadcrumbs (buttons clicked, elements interacted with)
  if (error.context?.breadcrumbs) {
    clues.uiTexts = error.context.breadcrumbs
      .filter((b) => b.type === "click" || b.type === "ui" || b.category === "ui.click")
      .map((b) => b.data?.text || b.data?.innerText || b.message)
      .filter((text) => text && text.length > 2 && text.length < 100)
      .slice(-5); // Last 5 UI interactions
  }

  // Extract property access pattern from error message
  // "Cannot read properties of undefined (reading 'profile')" -> "profile"
  const propertyMatch = error.message?.match(/reading ['"]([^'"]+)['"]/);
  if (propertyMatch) {
    clues.propertyPatterns.push(propertyMatch[1]);
  }

  // Also check for "of undefined" or "of null" patterns
  // "Cannot read property 'name' of undefined" -> "name"
  const propertyOfMatch = error.message?.match(/property ['"]([^'"]+)['"] of/);
  if (propertyOfMatch) {
    clues.propertyPatterns.push(propertyOfMatch[1]);
  }

  // Extract potential function/component patterns from stack trace
  // Even in minified code, sometimes component names survive (especially React components)
  if (error.stack_trace) {
    const componentMatches = error.stack_trace.match(/at\s+([A-Z][a-zA-Z0-9]+)\s/g);
    if (componentMatches) {
      clues.functionPatterns = componentMatches
        .map((m) => m.replace("at ", "").trim())
        .filter(
          (name) =>
            name.length > 2 &&
            !["Error", "Object", "Array", "Function", "Promise", "TypeError"].includes(name),
        );
    }
  }

  return clues;
}

/**
 * Detect project framework type based on repository knowledge
 * @param {Object} repoKnowledge - Repository knowledge from analysis
 * @returns {Object} { isVite, isLovable, isNextJs, framework }
 */
function detectFramework(repoKnowledge) {
  if (!repoKnowledge) {
    return { isVite: false, isLovable: false, isNextJs: false, framework: "unknown" };
  }

  const deps = repoKnowledge.dependencies || {};
  const projectType = (repoKnowledge.project_type || "").toLowerCase();

  // Check for Next.js
  const isNextJs = !!deps.next || projectType.includes("next");

  // Check for Vite
  const hasVite = !!deps.vite || !!deps["@vitejs/plugin-react"];

  // Check for Lovable indicators (React + Vite + specific libs typical of Lovable)
  const isLovable =
    hasVite &&
    (!!deps["@tanstack/react-query"] || !!deps["react-query"]) &&
    !!deps["react-router-dom"] &&
    (!!deps["@radix-ui/react-dialog"] ||
      !!deps["@radix-ui/react-slot"] ||
      !!deps["class-variance-authority"]); // shadcn-ui indicator

  // Determine primary framework
  let framework = "unknown";
  if (isNextJs) {
    framework = projectType.includes("app") ? "nextjs-app" : "nextjs";
  } else if (isLovable) {
    framework = "lovable";
  } else if (hasVite) {
    framework = "vite";
  } else if (deps.react) {
    framework = "react";
  }

  return {
    isVite: hasVite,
    isLovable,
    isNextJs,
    framework,
  };
}

/**
 * Fetch error details from backend
 * @param {string} errorId - MongoDB ObjectId of the error
 * @returns {Promise<Object>} Error data
 */
async function fetchError(errorId) {
  const coreApiUrl = process.env.NODE_PUBLIC_API_URL;
  const accessToken = process.env.ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("ACCESS_TOKEN environment variable is not set");
  }

  try {
    const response = await axios.get(
      `${coreApiUrl}/api/performance-monitoring/errors/${errorId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    return response.data.data;
  } catch (error) {
    throw new Error(`Failed to fetch error ${errorId}: ${error.message}`);
  }
}

/**
 * Update error status in backend
 * @param {string} errorId - MongoDB ObjectId of the error
 * @param {Object} updateData - Data to update (status, carla_analysis)
 * @returns {Promise<void>}
 */
async function updateErrorStatus(errorId, updateData) {
  const coreApiUrl = process.env.NODE_PUBLIC_API_URL;
  const accessToken = process.env.ACCESS_TOKEN;

  if (!accessToken) {
    return; // Don't throw - status update failure shouldn't block the process
  }

  try {
    await axios.put(
      `${coreApiUrl}/api/performance-monitoring/errors/${errorId}/status`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  } catch {
    // Don't throw - status update failure shouldn't block the process
  }
}

/**
 * Format breadcrumbs (user actions) as a readable timeline
 * @param {Array} breadcrumbs - User action breadcrumbs
 * @returns {string} Formatted markdown
 */
function formatBreadcrumbs(breadcrumbs) {
  if (!breadcrumbs || breadcrumbs.length === 0) {
    return "_No user actions recorded_";
  }

  return breadcrumbs
    .map((crumb, idx) => {
      const time = crumb.timestamp
        ? new Date(crumb.timestamp).toLocaleTimeString()
        : "";
      const type = crumb.type || crumb.category || "action";
      const message = crumb.message || crumb.data || "";
      const data =
        typeof message === "object" ? JSON.stringify(message) : message;
      return `${idx + 1}. **${type}** ${data ? `- ${data.substring(0, 100)}` : ""} ${time ? `_(${time})_` : ""}`;
    })
    .join("\n");
}

/**
 * Format console history as readable logs
 * @param {Array} consoleHistory - Console log entries
 * @returns {string} Formatted markdown
 */
function formatConsoleHistory(consoleHistory) {
  if (!consoleHistory || consoleHistory.length === 0) {
    return "_No console logs recorded_";
  }

  return consoleHistory
    .slice(-10) // Last 10 entries
    .map((log) => {
      const level = (log.level || "log").toUpperCase();
      const message =
        typeof log.message === "object"
          ? JSON.stringify(log.message)
          : log.message || "";
      const emoji =
        level === "ERROR" ? "🔴" : level === "WARN" ? "🟡" : "⚪";
      return `${emoji} \`[${level}]\` ${message.substring(0, 150)}`;
    })
    .join("\n");
}

/**
 * Format pending network requests
 * @param {Array} pendingRequests - Pending network requests
 * @returns {string} Formatted markdown
 */
function formatPendingRequests(pendingRequests) {
  if (!pendingRequests || pendingRequests.length === 0) {
    return "_No pending requests_";
  }

  return pendingRequests
    .map((req) => {
      const method = req.method || "GET";
      const url = req.url || req.name || "Unknown URL";
      return `- \`${method}\` ${url.substring(0, 100)}`;
    })
    .join("\n");
}

/**
 * Format environment info as a table
 * @param {Object} error - Error object with metadata and context
 * @returns {string} Formatted markdown table
 */
function formatEnvironment(error) {
  const env = error.context?.environment || {};
  const browser = error.metadata?.browser_info || {};
  const device = error.metadata?.device_info || {};

  const rows = [];

  if (browser.name)
    rows.push(`| Browser | ${browser.name} ${browser.version || ""} |`);
  if (browser.platform) rows.push(`| Platform | ${browser.platform} |`);
  if (device.type) rows.push(`| Device | ${device.type} |`);
  if (device.viewport_size) rows.push(`| Viewport | ${device.viewport_size} |`);
  if (device.screen_resolution)
    rows.push(`| Screen | ${device.screen_resolution} |`);
  if (env.network?.connectionType)
    rows.push(`| Network | ${env.network.connectionType} |`);
  if (env.network?.online !== undefined)
    rows.push(`| Online | ${env.network.online ? "Yes" : "No"} |`);
  if (env.viewport?.width)
    rows.push(`| Viewport Size | ${env.viewport.width}x${env.viewport.height} |`);

  if (rows.length === 0) {
    return "_No environment data available_";
  }

  return `| Property | Value |\n|----------|-------|\n${rows.join("\n")}`;
}

/**
 * Get confidence emoji and label
 * @param {string} confidence - high, medium, or low
 * @returns {Object} { emoji, label, note }
 */
function getConfidenceDisplay(confidence) {
  switch (confidence) {
    case "high":
      return {
        emoji: "🟢",
        label: "High",
        note: "Analysis is reliable and actionable",
      };
    case "medium":
      return {
        emoji: "🟡",
        label: "Medium",
        note: "Analysis may need verification",
      };
    case "low":
      return {
        emoji: "🔴",
        label: "Low",
        note: "Limited information available - manual investigation recommended",
      };
    default:
      return { emoji: "⚪", label: "Unknown", note: "" };
  }
}

/**
 * Create GitHub issue for errors that can't be auto-fixed
 * @param {Object} params - { error, analysis, githubConfig }
 * @returns {Promise<Object>} Created issue
 */
async function createManualFixIssue({ error, analysis, githubConfig }) {
  console.log({ error, analysis, githubConfig });

  const { owner, repo, token } = githubConfig;

  // Check for existing issue to prevent duplicates (use error_hash for same underlying error)
  const errorHash = error.error_hash;
  if (errorHash) {
    console.log(
      `[AutoFix] Checking for existing issue for error_hash ${errorHash}...`,
    );
    const existingIssue = await findExistingIssue({
      owner,
      repo,
      token,
      identifier: errorHash,
      type: "error",
    });

    if (existingIssue) {
      console.log(
        `[AutoFix] Duplicate detected! Issue already exists: #${existingIssue.number}`,
      );
      return {
        ...existingIssue,
        duplicate: true,
        message: `Issue already exists for error_hash ${errorHash}: #${existingIssue.number}`,
      };
    }
  }

  // Use dynamic import for ESM module
  const { Octokit } = await import("@octokit/rest");
  const octokit = new Octokit({ auth: token });

  // Build title based on confidence
  const confidencePrefix = analysis.confidence === "low" ? "⚠️ " : "";
  const title = `${confidencePrefix}[Auto-Fix] ${error.error_type}: ${error.message.substring(0, 80)}`;

  // Convert source file URL to GitHub link
  const { filePath, githubUrl } = convertToGitHubLink(error.source_file, {
    owner,
    repo,
  });
  const fileDisplay = githubUrl
    ? `[${filePath}](${githubUrl})`
    : `\`${error.source_file || "Unknown"}\``;

  // Get confidence display info
  const confidenceInfo = getConfidenceDisplay(analysis.confidence);

  // Format user journey sections
  const breadcrumbsSection = formatBreadcrumbs(error.context?.breadcrumbs);
  const consoleSection = formatConsoleHistory(error.context?.consoleHistory);
  const pendingRequestsSection = formatPendingRequests(
    error.context?.pendingRequests,
  );
  const environmentSection = formatEnvironment(error);

  const body = `## ${analysis.confidence === "low" ? "⚠️ Client Error Alert" : "🐛 Error Report"}

**Type:** \`${error.error_type}\`
**Severity:** \`${error.severity}\`
**Message:** ${error.message}

**Location:**
- 🔗 URL: ${error.url}
- 📄 File: ${fileDisplay}
- 📍 Line: ${error.line_number || "Unknown"}

---

## 👤 User Journey

> _What the user did before this error occurred_

### Actions Before Error
${breadcrumbsSection}

### Console Logs Before Error
${consoleSection}

### Pending Network Requests
${pendingRequestsSection}

---

## 🌐 Environment

${environmentSection}

---

## 📜 Stack Trace

\`\`\`
${error.stack_trace || "No stack trace available"}
\`\`\`

---

## 🤖 AI Analysis

| Property | Value |
|----------|-------|
| Can Auto-Fix | No |
| Confidence | ${confidenceInfo.emoji} ${confidenceInfo.label} |
| Category | ${analysis.errorCategory || "Unknown"} |

${confidenceInfo.note ? `> ${confidenceInfo.note}` : ""}

**Root Cause:**
${analysis.rootCause || "_Unable to determine root cause_"}

**Analysis:**
${analysis.reasoning || "_No detailed analysis available_"}

${analysis.requiresManualReview ? "\n⚠️ **This error requires manual review**" : ""}

---

<details>
<summary>📋 Raw Error Context (click to expand)</summary>

\`\`\`json
${error.context ? JSON.stringify(error.context, null, 2) : "No additional context"}
\`\`\`

</details>

---
_This issue was automatically created by [Interworky](https://interworky.com) Auto-Fix system._
_Error ID: \`${error._id || error.id}\`_
_Error Hash: \`${error.error_hash}\`_
`;

  // Build labels based on confidence
  const labels = ["bug", `severity:${error.severity}`];

  if (analysis.confidence === "low") {
    labels.push("needs-investigation", "confidence:low");
  } else if (analysis.confidence === "medium") {
    labels.push("auto-fix-failed", "confidence:medium");
  } else {
    labels.push("auto-fix-failed", "confidence:high");
  }

  try {
    console.log(`[AutoFix] Creating GitHub issue for ${owner}/${repo}`);
    console.log(`[AutoFix] Issue title: ${title.substring(0, 60)}...`);
    console.log(`[AutoFix] Labels: ${labels.join(", ")}`);

    const { data: issue } = await octokit.rest.issues.create({
      owner,
      repo,
      title,
      body,
      labels,
    });

    console.log(
      `[AutoFix] ✅ Issue created: #${issue.number} - ${issue.html_url}`,
    );
    return issue;
  } catch (issueCreationError) {
    console.error(
      "[AutoFix] ❌ Failed to create GitHub issue:",
      issueCreationError.message,
    );
    if (issueCreationError.response) {
      console.error("[AutoFix] GitHub API response:", {
        status: issueCreationError.response.status,
        data: issueCreationError.response.data,
      });
    }
    throw issueCreationError;
  }
}

/**
 * Main auto-fix function
 * Orchestrates: error fetch → GitHub MCP → agent analysis → PR/issue creation
 *
 * @param {Object} params - { errorId, organizationId }
 * @returns {Promise<Object>} Result with status, pr_url/issue_url
 */
async function autoFixError({ errorId, organizationId }) {
  console.log("[AutoFix] ========================================");
  console.log(`[AutoFix] 🚀 STARTING AUTO-FIX PROCESS`);
  console.log(`[AutoFix] Error ID: ${errorId}`);
  console.log(`[AutoFix] Organization ID: ${organizationId}`);
  console.log("[AutoFix] ========================================\n");

  let githubMCP = null;

  try {
    // 1. Fetch error details from backend
    console.log(`[AutoFix] Step 1: Fetching error details for ${errorId}...`);
    const error = await fetchError(errorId);

    if (!error) {
      throw new Error(`Error ${errorId} not found`);
    }

    console.log(`[AutoFix] ✅ Error fetched:`, {
      errorType: error.error_type,
      message: error.message,
      severity: error.severity,
      sourceFile: error.source_file,
      lineNumber: error.line_number,
    });

    // 2. Update status to carla_fixing
    console.log(`[AutoFix] Step 2: Updating error status to 'carla_fixing'...`);
    await updateErrorStatus(errorId, {
      status: "carla_fixing",
      carla_analysis: {
        attempted_at: new Date(),
      },
    });
    console.log(`[AutoFix] ✅ Error status updated to 'carla_fixing'`);

    // 3. Fetch GitHub configuration
    console.log(
      `[AutoFix] Step 3: Fetching GitHub configuration for org ${organizationId}...`,
    );
    const githubConfig = await fetchGitHubConfig(organizationId);
    console.log(`[AutoFix] ✅ GitHub config fetched:`, {
      owner: githubConfig.owner,
      repo: githubConfig.repo,
      repoFullName: githubConfig.repoFullName,
      hasToken: !!githubConfig.token,
    });

    // 4. Create GitHub MCP server
    console.log(`[AutoFix] Step 4: Creating GitHub MCP server...`);
    githubMCP = await createGitHubMCP({
      token: githubConfig.token,
      owner: githubConfig.owner,
      repo: githubConfig.repo,
    });
    console.log(`[AutoFix] ✅ GitHub MCP server created`);

    // 5. Fetch repository knowledge (if available)
    console.log(
      `[AutoFix] Step 5: Fetching repository knowledge (optional)...`,
    );
    let repoKnowledge = null;
    try {
      repoKnowledge = await fetchRepoKnowledge(organizationId);
      console.log(`[AutoFix] ✅ Repository knowledge fetched`);
    } catch (err) {
      console.log(
        `[AutoFix] ⚠️  No repository knowledge available - continuing without it:`,
        err.message,
      );
      // Continue without repo knowledge - it's optional
    }

    // 5.5. Fetch related files for context
    console.log(`[AutoFix] Step 5.5: Fetching related files for context...`);
    let relatedFiles = [];
    try {
      // First, determine the actual file path to analyze
      const userCodeFrame = error.metadata?.user_code_frame;
      let githubFilePath = userCodeFrame?.file || error.source_file;

      if (githubFilePath && githubFilePath.includes("http")) {
        const urlMatch = githubFilePath.match(
          /\/_next\/static\/chunks\/app\/(.+)$/,
        );
        if (urlMatch) {
          let extractedPath = urlMatch[1];
          extractedPath = extractedPath.replace(/-[a-f0-9]{16}\.js$/, ".js");
          githubFilePath = `src/app/${extractedPath}`;
        }
      }

      if (githubFilePath && !githubFilePath.includes("node_modules")) {
        // Fetch the error file content
        const { content: errorFileContent } = await fetchFileFromGitHub({
          owner: githubConfig.owner,
          repo: githubConfig.repo,
          path: githubFilePath,
          token: githubConfig.token,
        });

        // Get path aliases from repo knowledge
        const pathAliases = {};
        if (repoKnowledge?.common_imports) {
          for (const imp of repoKnowledge.common_imports) {
            if (imp.usage && imp.usage.toLowerCase().includes("path alias")) {
              // Extract alias pattern, e.g., "@/" -> "src/"
              const aliasMatch = imp.import_statement.match(
                /['"](@\/|~\/)[^'"]*['"]/,
              );
              if (aliasMatch) {
                pathAliases[aliasMatch[1]] = "src/";
              }
            }
          }
        }
        // Add common Next.js/React aliases as fallback
        if (!pathAliases["@/"]) pathAliases["@/"] = "src/";

        // Fetch related files
        relatedFiles = await fetchRelatedFiles({
          owner: githubConfig.owner,
          repo: githubConfig.repo,
          token: githubConfig.token,
          filePath: githubFilePath,
          content: errorFileContent,
          pathAliases,
        });

        console.log(
          `[AutoFix] ✅ Fetched ${relatedFiles.length} related files`,
        );
      }
    } catch (err) {
      console.log(
        `[AutoFix] ⚠️  Could not fetch related files - continuing without them:`,
        err.message,
      );
      // Continue without related files - they're optional
    }

    // 5.6. Fetch codebase snapshot (for enhanced AI analysis with o3 model)
    console.log(
      `[AutoFix] Step 5.6: Fetching codebase snapshot for enhanced analysis...`,
    );
    let codebaseSnapshot = null;
    try {
      const snapshotStartTime = Date.now();
      // Try to get existing snapshot, generate if needed
      codebaseSnapshot = await ensureSnapshot(organizationId);
      const snapshotDuration = Date.now() - snapshotStartTime;
      const estimatedTokens = Math.ceil(codebaseSnapshot.length / 4);
      console.log(
        `[AutoFix] ✅ Codebase snapshot ready in ${(snapshotDuration / 1000).toFixed(1)}s`,
      );
      console.log(
        `[AutoFix]    Size: ${(codebaseSnapshot.length / 1024 / 1024).toFixed(2)} MB (~${estimatedTokens.toLocaleString()} tokens)`,
      );
      console.log(
        `[AutoFix]    Will use find_relevant_files tool to extract focused context`,
      );
    } catch (err) {
      console.warn(
        `[AutoFix] ⚠️  Snapshot unavailable - using gpt-4o with MCP tools instead`,
      );
      console.warn(`[AutoFix]    Reason: ${err.message}`);
      // Continue without snapshot - it's optional, agent will use MCP tools instead
    }

    // 6. Create error fix agent
    console.log(`[AutoFix] Step 6: Creating error fix agent...`);
    const hasSnapshot = !!codebaseSnapshot;
    // Pass actual snapshot to agent (for the find_relevant_files tool closure)
    const errorFixAgent = createErrorFixAgent([githubMCP], codebaseSnapshot);
    console.log(
      `[AutoFix] ✅ Agent created with model: gpt-4o${hasSnapshot ? " + find_relevant_files tool" : " + MCP tools"}`,
    );

    // 7. Run agent analysis
    console.log(`[AutoFix] Step 7: Running AI agent analysis...`);
    const runner = new Runner();
    // Pass hasSnapshot boolean to prompt (not the full snapshot - that's in the tool closure)
    const errorPrompt = buildErrorPrompt(
      error,
      repoKnowledge,
      relatedFiles,
      hasSnapshot,
    );
    const promptStats = {
      relatedFiles: relatedFiles.length,
      hasRepoKnowledge: !!repoKnowledge,
      hasSnapshot: !!codebaseSnapshot,
      estimatedPromptSize: errorPrompt.length,
    };
    console.log(`[AutoFix]    Prompt stats:`, JSON.stringify(promptStats));

    let rawResult;
    try {
      rawResult = await runner.run(errorFixAgent, errorPrompt, {
        stream: false,
      });
      console.log(`[AutoFix] ✅ Agent run completed`);
      console.log(" rawResult.currentStep: ", rawResult.state._currentStep);
    } catch (runError) {
      console.error(`[AutoFix] ❌ Agent run failed:`, {
        errorMessage: runError.message,
        errorStack: runError.stack,
      });
      throw runError;
    }

    // Extract the actual result from the runner response
    // Try multiple locations where the output might be (try all, not just first match)
    let result;
    let outputText = rawResult.state._currentStep?.output.trim();

    // Strategy 1: Check currentStep.output
    if (
      !outputText &&
      rawResult.state._currentStep?.output &&
      typeof rawResult.state._currentStep.output === "string" &&
      rawResult.state._currentStep.output.trim()
    ) {
      outputText = rawResult.state._currentStep.output;
    }

    // Strategy 2: Check lastProcessedResponse.newItems (most recent output)
    if (
      !outputText &&
      rawResult.state._lastProcessedResponse?.newItems?.[0]?.rawItem
        ?.content?.[0]?.text
    ) {
      outputText =
        rawResult.state._lastProcessedResponse.newItems[0].rawItem.content[0]
          .text;
    }

    // Strategy 3: Check generatedItems for last message_output_item
    if (
      !outputText &&
      rawResult.state._generatedItems &&
      Array.isArray(rawResult.state._generatedItems)
    ) {
      // Find the last message output item
      for (let i = rawResult.state._generatedItems.length - 1; i >= 0; i--) {
        const item = rawResult.state._generatedItems[i];
        if (
          item.type === "message_output_item" &&
          item.rawItem?.content?.[0]?.text
        ) {
          outputText = item.rawItem.content[0].text;
          break;
        }
      }
    }

    console.log(`[AutoFix] Step 8: Parsing agent output...`);
    console.log(" Agent Output Text: ", outputText);
    if (outputText) {
      try {
        result = JSON.parse(outputText);
        console.log(`[AutoFix] ✅ Agent output parsed successfully:`, {
          canFix: result.canFix,
          confidence: result.confidence,
          hasReasoning: !!result.reasoning,
        });
      } catch (parseError) {
        console.error(
          `[AutoFix] ❌ Failed to parse agent output:`,
          parseError.message,
        );
        throw new Error(`Failed to parse agent output: ${parseError.message}`);
      }
    } else {
      console.error(
        `[AutoFix] ❌ Agent output not found in expected locations`,
      );
      throw new Error("Agent output not found in expected locations");
    }

    // 8. Create PR or issue based on analysis
    console.log(
      `[AutoFix] Step 9: Decision - Can fix: ${result.canFix}, Confidence: ${result.confidence}`,
    );
    if (result.canFix && result.confidence !== "low") {
      console.log(`[AutoFix] ✅ Creating PR for error fix...`);
      let pr;
      try {
        pr = await createErrorFixPR({
          fix: result,
          error,
          githubConfig,
        });
        console.log(`[AutoFix] ✅ PR created successfully:`, {
          prUrl: pr.html_url,
          prNumber: pr.number,
        });
      } catch (prError) {
        console.error(`[AutoFix] ❌ Failed to create PR:`, {
          errorMessage: prError.message,
          errorStack: prError.stack,
        });
        throw prError;
      }

      console.log(`[AutoFix] Updating error status to 'pr_created'...`);
      await updateErrorStatus(errorId, {
        status: "pr_created",
        carla_analysis: {
          attempted_at: new Date(),
          can_fix: true,
          confidence: result.confidence,
          analysis: result.reasoning,
          pr_url: pr.html_url,
          error_message: null,
        },
      });
      console.log(`[AutoFix] ✅ Error status updated to 'pr_created'`);

      console.log(`[AutoFix] ========================================`);
      console.log(`[AutoFix] ✅ AUTO-FIX COMPLETED SUCCESSFULLY`);
      console.log(`[AutoFix] PR URL: ${pr.html_url}`);
      console.log(`[AutoFix] ========================================\n`);

      return {
        success: true,
        type: "pr",
        url: pr.html_url,
        pr_number: pr.number,
        canFix: true,
        confidence: result.confidence,
      };
    } else {
      console.log(
        `[AutoFix] Cannot auto-fix this error (canFix: ${result.canFix}, confidence: ${result.confidence})`,
      );
      console.log(
        `[AutoFix] Error category: ${result.errorCategory}, Confidence: ${result.confidence}`,
      );
      console.log(
        `[AutoFix] Root cause: ${result.rootCause.substring(0, 100)}...`,
      );

      // Create issue for all errors that can't be auto-fixed (regardless of confidence)
      // Even low confidence issues provide value as alerts with user journey context
      console.log(
        `[AutoFix] Creating GitHub issue for manual review (confidence: ${result.confidence})`,
      );

      let issue;
      try {
        issue = await createManualFixIssue({
          error,
          analysis: result,
          githubConfig,
        });
      } catch (issueError) {
        console.error("[AutoFix] ❌ Issue creation failed, re-throwing error");
        throw issueError;
      }

      await updateErrorStatus(errorId, {
        status: "issue_created",
        carla_analysis: {
          attempted_at: new Date(),
          can_fix: false,
          confidence: result.confidence,
          analysis: result.reasoning,
          issue_url: issue.html_url,
          error_message: null,
        },
      });

      console.log(`[AutoFix] ========================================`);
      console.log(`[AutoFix] ✅ ISSUE CREATED FOR MANUAL REVIEW`);
      console.log(`[AutoFix] Issue URL: ${issue.html_url}`);
      console.log(`[AutoFix] ========================================\n`);

      return {
        success: true,
        type: "issue",
        url: issue.html_url,
        issue_number: issue.number,
        canFix: false,
        confidence: result.confidence,
      };
    }
  } catch (error) {
    console.error("[AutoFix] ❌❌ Auto-fix process failed:", error.message);
    console.error("[AutoFix] Error stack:", error.stack);

    // Update error status to fix_failed
    try {
      await updateErrorStatus(errorId, {
        status: "fix_failed",
        carla_analysis: {
          attempted_at: new Date(),
          can_fix: false,
          error_message: error.message,
        },
      });
      console.log('[AutoFix] Error status updated to "fix_failed"');
    } catch (updateError) {
      console.error(
        "[AutoFix] Failed to update error status:",
        updateError.message,
      );
    }

    return {
      success: false,
      error: error.message,
    };
  } finally {
    // Cleanup MCP connection
    if (githubMCP) {
      try {
        await githubMCP.close();
      } catch {
        // Error closing MCP connection
      }
    }
  }
}

module.exports = {
  autoFixError,
  buildErrorPrompt,
  fetchError,
  updateErrorStatus,
  createManualFixIssue,
};
