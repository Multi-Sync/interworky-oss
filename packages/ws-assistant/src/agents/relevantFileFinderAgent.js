/**
 * Relevant File Finder Agent
 *
 * Specialized agent that analyzes repository snapshots to find files
 * relevant to a security vulnerability or error.
 *
 * Used as a TOOL by SecurityFixAgent and ErrorFixAgent to extract
 * focused context from large snapshots before analysis.
 */

const { Agent, tool } = require("@openai/agents");
const { z } = require("zod");

// ============================================================================
// Output Schema
// ============================================================================

const relevantFilesSchema = z.object({
  relevantFiles: z
    .array(
      z.object({
        path: z.string().describe("File path"),
        reason: z.string().describe("Why this file is relevant"),
        snippet: z.string().describe("Relevant code snippet (max 50 lines)"),
        lineStart: z.number().describe("Starting line number of snippet"),
        lineEnd: z.number().describe("Ending line number of snippet"),
      }),
    )
    .describe("List of relevant files with code snippets"),
  packageJson: z
    .string()
    .nullable()
    .describe("Relevant section of package.json (dependencies only)"),
  packageLockEntry: z
    .string()
    .nullable()
    .describe("The specific package entry from package-lock.json"),
  configFiles: z.array(z.string()).describe("Related config file paths found"),
  summary: z.string().describe("Brief summary of findings"),
  usageCount: z.number().describe("Number of places the package is used"),
  isPackageUsed: z
    .boolean()
    .describe("Whether the package is actually used in code (not just listed)"),
});

// ============================================================================
// Agent Instructions
// ============================================================================

const fileFinderInstructions = `You are a code analysis specialist. Your job is to analyze a repository snapshot and find files relevant to a security vulnerability OR a runtime error.

## Analysis Modes

You will receive one of two types of requests:

### Mode 1: Security Vulnerability Analysis
When \`packageName\` is provided (e.g., "next", "react"):
- Find files that import/use the vulnerable package
- Check package.json for installed version
- Find config files related to the package
- Determine if package is actually used in code

### Mode 2: Error Analysis
When \`packageName\` is empty AND \`context\` contains an error message/stack trace:
- Find the file mentioned in the error (e.g., "UserProfile.jsx:42")
- Find files that import or are imported by the error file
- Look for related type definitions or utilities
- Find similar error handling patterns in the codebase

## Snapshot Format

The snapshot is XML with files wrapped like this:
\`\`\`xml
<file path="src/app/page.tsx">
1 | import React from 'react';
2 | import { something } from 'package-name';
...
</file>
\`\`\`

## Tools Available

1. **list_snapshot_files** - Get list of all files in snapshot (use filterPattern to find specific files)
2. **search_imports** - Find files that import a specific package (for security analysis)
3. **search_code_pattern** - Search for code patterns (function names, error messages, etc.)
4. **get_file_content** - Get full content of a specific file
5. **get_package_json** - Extract package.json content
6. **get_package_lock_entry** - Extract specific package from package-lock.json

## Analysis Process

### For Security Vulnerabilities (packageName provided):
1. Call \`search_imports\` to find files importing the package
2. Call \`search_code_pattern\` to find usage patterns
3. Get \`package.json\` to check version
4. Get \`package_lock_entry\` for exact version
5. Check for related config files

### For Runtime Errors (packageName empty):
1. Parse the error context to extract file path and line number
2. Call \`list_snapshot_files\` with filterPattern to find the error file
3. Call \`get_file_content\` to read the error file
4. Call \`search_code_pattern\` to find the function/component name
5. Look for related files (imports, type definitions)

## Package-Specific Patterns (Security Mode)

**For 'next' package:**
- Look for: middleware.ts, middleware.js, next.config.js/mjs/ts
- Search patterns: NextResponse, NextRequest, middleware

**For 'react' package:**
- Look for: 'use server', server actions, Server Components
- Search patterns: createServerAction, useFormState

## Error-Specific Patterns (Error Mode)

**For null/undefined errors:**
- Find the file and function where error occurred
- Look for variable declarations and data flow

**For import errors:**
- Check path aliases in tsconfig.json or jsconfig.json
- Find the actual file being imported

**For type errors:**
- Find type definitions (.d.ts files)
- Check prop types or interfaces

## Lovable/Vite Heuristic Search Patterns

When the \`context\` mentions console logs, UI button text, or indicates a minified Vite bundle, use heuristic search:

**Detecting Vite/Lovable projects:**
- Check for \`vite.config.ts\` or \`vite.config.js\` in file list
- Look for \`@tanstack/react-query\`, \`react-router-dom\`, \`@radix-ui\` in package.json
- Directory structure: \`src/components/\`, \`src/pages/\`, \`src/hooks/\`, \`src/lib/\`

**Search Strategy for Minified Bundle Errors:**

1. **Console log messages (HIGHEST PRIORITY)**
   - If context contains "Console log: 'Some message...'"
   - Use \`search_code_pattern\` with the EXACT message string
   - Example: \`search_code_pattern({ pattern: "Attempting to access user data" })\`
   - This will find the file containing that console.log statement

2. **UI button/text from breadcrumbs**
   - If context mentions "Button clicked: 'Get Started Now'"
   - Search for that exact text in JSX files
   - Example: \`search_code_pattern({ pattern: "Get Started Now" })\`
   - Look for onClick handlers near that text

3. **Property access patterns**
   - If error is "reading 'profile'", search for \`.profile\` usage
   - Example: \`search_code_pattern({ pattern: ".profile" })\`
   - Look for places where .profile is accessed without null checks

4. **Lovable-specific file locations to check:**
   - \`src/components/\` - React components (most likely location!)
   - \`src/pages/\` - Page components
   - \`src/hooks/\` - Custom hooks (useAuth, useUser, useProfile)
   - \`src/lib/\` - API clients and utilities
   - Ignore \`src/components/ui/\` - these are shadcn base components

**Example Heuristic Search Flow:**
\`\`\`
1. list_snapshot_files({ filterPattern: "src/components" })
2. search_code_pattern({ pattern: "Attempting to access user data" })
3. get_file_content({ filePath: "src/components/ErrorButton.tsx" })
\`\`\`

## Output Rules

1. **Max 10 relevant files** - Focus on the most important
2. **Snippets max 50 lines** - Include context around the usage/error
3. **Include line numbers** - For precise location
4. **Determine if actually used** - For security: package in deps but never imported = not used
5. **Be concise** - Summary should be 1-2 sentences

## Example Output - Security Mode

\`\`\`json
{
  "relevantFiles": [
    {
      "path": "middleware.ts",
      "reason": "Contains authentication middleware that could be bypassed",
      "snippet": "import { NextResponse } from 'next/server'\\n\\nexport function middleware(request) {\\n  // auth logic here\\n}",
      "lineStart": 1,
      "lineEnd": 15
    }
  ],
  "packageJson": "{\\"next\\": \\"^15.2.0\\"}",
  "packageLockEntry": "{\\"version\\": \\"15.2.0\\", ...}",
  "configFiles": ["next.config.js", "middleware.ts"],
  "summary": "Found next@15.2.0 with auth middleware that checks sessions. Package is actively used.",
  "usageCount": 12,
  "isPackageUsed": true
}
\`\`\`

## Example Output - Error Mode

\`\`\`json
{
  "relevantFiles": [
    {
      "path": "src/components/UserProfile.jsx",
      "reason": "File where the error occurred at line 42",
      "snippet": "function UserProfile({ userId }) {\\n  const user = getUser(userId);\\n  return <h1>{user.name}</h1>;\\n}",
      "lineStart": 40,
      "lineEnd": 50
    },
    {
      "path": "src/utils/userService.js",
      "reason": "Contains getUser function that may return undefined",
      "snippet": "export function getUser(id) {\\n  return users.find(u => u.id === id);\\n}",
      "lineStart": 10,
      "lineEnd": 15
    }
  ],
  "packageJson": null,
  "packageLockEntry": null,
  "configFiles": [],
  "summary": "Error in UserProfile.jsx:42 accessing user.name when user is undefined. getUser() returns undefined when user not found.",
  "usageCount": 0,
  "isPackageUsed": false
}
\`\`\`
`;

// ============================================================================
// Tool Implementations
// ============================================================================

/**
 * Escape special regex characters
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Tool: List all files in snapshot
 */
const listSnapshotFilesTool = tool({
  name: "list_snapshot_files",
  description:
    "List all file paths in the repository snapshot. Use filterPattern to narrow down (e.g., '.ts', 'middleware', 'config').",
  parameters: z.object({
    snapshot: z.string().describe("The repository snapshot XML"),
    filterPattern: z
      .string()
      .default("")
      .describe(
        "Optional pattern to filter files (e.g., 'middleware', '.config'). Empty string means no filter.",
      ),
  }),
  execute: async ({ snapshot, filterPattern }) => {
    const fileRegex = /<file path="([^"]+)"/g;
    const files = [];
    let match;

    while ((match = fileRegex.exec(snapshot)) !== null) {
      const filePath = match[1];
      if (
        !filterPattern ||
        filePath.toLowerCase().includes(filterPattern.toLowerCase())
      ) {
        files.push(filePath);
      }
    }

    return {
      files: files.slice(0, 100), // Limit to prevent huge output
      totalCount: files.length,
      filtered: !!filterPattern,
    };
  },
});

/**
 * Tool: Search for files importing a package
 */
const searchImportsTool = tool({
  name: "search_imports",
  description:
    "Find all files that import or require a specific package. Returns file paths and the import lines. For error analysis, use search_code_pattern instead.",
  parameters: z.object({
    snapshot: z.string().describe("The repository snapshot XML"),
    packageName: z
      .string()
      .describe(
        "Package name to search for (e.g., 'next', 'react', '@modelcontextprotocol/sdk'). Must not be empty.",
      ),
  }),
  execute: async ({ snapshot, packageName }) => {
    // Handle empty packageName - return helpful error
    if (!packageName || packageName.trim() === "") {
      return {
        files: [],
        count: 0,
        packageName: "",
        error:
          "packageName is required. For error analysis, use search_code_pattern or list_snapshot_files instead.",
      };
    }

    const results = [];
    const fileRegex = /<file path="([^"]+)"[^>]*>([\s\S]*?)<\/file>/g;

    // Patterns for different import styles
    const importPatterns = [
      new RegExp(`from\\s+['"]${escapeRegex(packageName)}['"]`, "g"),
      new RegExp(`from\\s+['"]${escapeRegex(packageName)}/[^'"]*['"]`, "g"),
      new RegExp(
        `require\\s*\\(\\s*['"]${escapeRegex(packageName)}['"]\\s*\\)`,
        "g",
      ),
      new RegExp(
        `require\\s*\\(\\s*['"]${escapeRegex(packageName)}/[^'"]*['"]\\s*\\)`,
        "g",
      ),
      new RegExp(`import\\s+['"]${escapeRegex(packageName)}['"]`, "g"),
    ];

    let match;
    while ((match = fileRegex.exec(snapshot)) !== null) {
      const [, filePath, content] = match;

      // Skip node_modules and lock files
      if (
        filePath.includes("node_modules") ||
        filePath === "package-lock.json"
      ) {
        continue;
      }

      for (const pattern of importPatterns) {
        pattern.lastIndex = 0; // Reset regex
        if (pattern.test(content)) {
          // Find the actual import lines
          const lines = content.split("\n");
          const importLines = [];

          lines.forEach((line, idx) => {
            if (
              line.includes(packageName) &&
              (line.includes("import") || line.includes("require"))
            ) {
              importLines.push({
                lineNumber: idx + 1,
                content: line.trim().substring(0, 200), // Limit line length
              });
            }
          });

          results.push({
            path: filePath,
            importLines: importLines.slice(0, 5), // Max 5 import lines per file
          });
          break;
        }
      }
    }

    return {
      files: results,
      count: results.length,
      packageName,
    };
  },
});

/**
 * Tool: Search for code patterns
 */
const searchCodePatternTool = tool({
  name: "search_code_pattern",
  description:
    "Search for a specific code pattern in the repository. Use for finding function calls, class usage, etc.",
  parameters: z.object({
    snapshot: z.string().describe("The repository snapshot XML"),
    pattern: z
      .string()
      .describe(
        "Pattern to search for (e.g., 'NextResponse', 'middleware', 'createServer')",
      ),
    maxResults: z
      .number()
      .default(10)
      .describe("Maximum number of results (default 10)"),
  }),
  execute: async ({ snapshot, pattern, maxResults = 10 }) => {
    const results = [];
    const fileRegex = /<file path="([^"]+)"[^>]*>([\s\S]*?)<\/file>/g;
    const searchRegex = new RegExp(escapeRegex(pattern), "gi");

    let match;
    while (
      (match = fileRegex.exec(snapshot)) !== null &&
      results.length < maxResults
    ) {
      const [, filePath, content] = match;

      // Skip node_modules
      if (filePath.includes("node_modules")) {
        continue;
      }

      searchRegex.lastIndex = 0;
      if (searchRegex.test(content)) {
        const lines = content.split("\n");
        const matchingLines = [];

        lines.forEach((line, idx) => {
          if (line.toLowerCase().includes(pattern.toLowerCase())) {
            matchingLines.push({
              lineNumber: idx + 1,
              content: line.trim().substring(0, 200),
            });
          }
        });

        if (matchingLines.length > 0) {
          results.push({
            path: filePath,
            matches: matchingLines.slice(0, 5),
            matchCount: matchingLines.length,
          });
        }
      }
    }

    return {
      files: results,
      count: results.length,
      pattern,
    };
  },
});

/**
 * Tool: Get full content of a specific file
 */
const getFileContentTool = tool({
  name: "get_file_content",
  description:
    "Get the full content of a specific file from the snapshot. Use after finding relevant files.",
  parameters: z.object({
    snapshot: z.string().describe("The repository snapshot XML"),
    filePath: z.string().describe("Exact file path to extract"),
    startLine: z
      .number()
      .default(0)
      .describe(
        "Optional start line (1-based) to extract a section. 0 means extract all.",
      ),
    endLine: z
      .number()
      .default(0)
      .describe("Optional end line to extract a section. 0 means extract all."),
  }),
  execute: async ({ snapshot, filePath, startLine, endLine }) => {
    const regex = new RegExp(
      `<file path="${escapeRegex(filePath)}"[^>]*>([\\s\\S]*?)</file>`,
      "i",
    );
    const match = snapshot.match(regex);

    if (!match) {
      return {
        found: false,
        content: null,
        error: `File not found: ${filePath}`,
      };
    }

    let content = match[1];
    const lines = content.split("\n");
    const totalLines = lines.length;

    // Extract section if line numbers provided
    if (startLine && endLine) {
      const start = Math.max(0, startLine - 1);
      const end = Math.min(lines.length, endLine);
      content = lines.slice(start, end).join("\n");
    }

    // Limit content size
    if (content.length > 10000) {
      content = content.substring(0, 10000) + "\n... (truncated)";
    }

    return {
      found: true,
      path: filePath,
      content,
      totalLines,
      extractedLines: startLine && endLine ? `${startLine}-${endLine}` : "all",
    };
  },
});

/**
 * Tool: Get package.json content
 */
const getPackageJsonTool = tool({
  name: "get_package_json",
  description:
    "Extract package.json content from the snapshot. Returns dependencies and devDependencies.",
  parameters: z.object({
    snapshot: z.string().describe("The repository snapshot XML"),
  }),
  execute: async ({ snapshot }) => {
    const regex = /<file path="package\.json"[^>]*>([\s\S]*?)<\/file>/i;
    const match = snapshot.match(regex);

    if (!match) {
      return { found: false, content: null, error: "package.json not found" };
    }

    try {
      // Remove line numbers if present (e.g., "1 | {")
      const cleanContent = match[1].replace(/^\s*\d+\s*\|\s*/gm, "");
      const pkg = JSON.parse(cleanContent);

      return {
        found: true,
        name: pkg.name,
        version: pkg.version,
        dependencies: pkg.dependencies || {},
        devDependencies: pkg.devDependencies || {},
      };
    } catch (e) {
      return {
        found: true,
        raw: match[1].substring(0, 2000),
        parseError: e.message,
      };
    }
  },
});

/**
 * Tool: Get specific package entry from package-lock.json
 */
const getPackageLockEntryTool = tool({
  name: "get_package_lock_entry",
  description:
    "Extract a specific package entry from package-lock.json to see exact installed version.",
  parameters: z.object({
    snapshot: z.string().describe("The repository snapshot XML"),
    packageName: z.string().describe("Package name to look up"),
  }),
  execute: async ({ snapshot, packageName }) => {
    const regex = /<file path="package-lock\.json"[^>]*>([\s\S]*?)<\/file>/i;
    const match = snapshot.match(regex);

    if (!match) {
      return {
        found: false,
        content: null,
        error: "package-lock.json not found",
      };
    }

    try {
      // Remove line numbers if present
      const cleanContent = match[1].replace(/^\s*\d+\s*\|\s*/gm, "");
      const lockFile = JSON.parse(cleanContent);

      // Check packages (npm v7+) and dependencies (npm v6)
      const packages = lockFile.packages || {};
      const dependencies = lockFile.dependencies || {};

      // Look for the package
      let entry = null;
      let location = null;

      // npm v7+ format: packages["node_modules/package-name"]
      const nodeModulesKey = `node_modules/${packageName}`;
      if (packages[nodeModulesKey]) {
        entry = packages[nodeModulesKey];
        location = nodeModulesKey;
      }

      // npm v6 format: dependencies["package-name"]
      if (!entry && dependencies[packageName]) {
        entry = dependencies[packageName];
        location = packageName;
      }

      if (entry) {
        return {
          found: true,
          packageName,
          location,
          version: entry.version,
          resolved: entry.resolved,
          integrity: entry.integrity,
          dependencies: entry.dependencies,
        };
      }

      return {
        found: false,
        packageName,
        error: `Package ${packageName} not found in package-lock.json`,
      };
    } catch (e) {
      return {
        found: false,
        parseError: e.message,
      };
    }
  },
});

// ============================================================================
// Agent Factory
// ============================================================================

/**
 * Create the RelevantFileFinder agent
 * @returns {Agent} Configured agent instance
 */
function createRelevantFileFinderAgent() {
  console.log("[RelevantFileFinder] Creating file finder agent");

  const agent = new Agent({
    name: "RelevantFileFinderAgent",
    instructions: fileFinderInstructions,
    model: process.env.AI_MODEL || "gpt-4o", // Fast and cheap for parsing tasks
    tools: [
      listSnapshotFilesTool,
      searchImportsTool,
      searchCodePatternTool,
      getFileContentTool,
      getPackageJsonTool,
      getPackageLockEntryTool,
    ],
    outputType: relevantFilesSchema,
  });

  console.log("[RelevantFileFinder] Agent created with 6 tools");
  return agent;
}

/**
 * Get the agent configured as a tool for orchestrator agents
 * NOTE: This is the old method that requires passing snapshot through the main agent.
 * Prefer getFileFinderToolWithSnapshot() for better context efficiency.
 * @returns {Object} Agent configured as a tool
 */
function getFileFinderAsTool() {
  const agent = createRelevantFileFinderAgent();

  return agent.asTool({
    toolName: "find_relevant_files",
    toolDescription: `Analyze the repository snapshot to find files relevant to a security vulnerability or error.

ALWAYS call this tool FIRST before analyzing or suggesting fixes.

Input parameters:
- snapshot: The full repository snapshot XML
- packageName: The affected package name (e.g., 'next', 'react') - leave empty for error analysis
- context: Description of the vulnerability or error

Returns:
- relevantFiles: Array of files with code snippets
- packageJson: The dependencies section
- packageLockEntry: The specific package version info
- configFiles: Related configuration files
- summary: Brief summary of findings
- isPackageUsed: Whether the package is actually used in code`,
    runOptions: {
      maxTurns: 8, // Allow enough turns to use all tools
    },
  });
}

/**
 * Create a file finder tool with the snapshot pre-captured.
 * This prevents the main agent from needing the full snapshot in its context.
 *
 * @param {string} snapshot - The full repository snapshot XML
 * @returns {Object} Tool definition that can be passed to an agent
 */
function getFileFinderToolWithSnapshot(snapshot) {
  const { Runner, tool } = require("@openai/agents");

  return tool({
    name: "find_relevant_files",
    description: `Analyze the repository to find files relevant to a security vulnerability or error.

ALWAYS call this tool FIRST before analyzing or suggesting fixes.

Input parameters:
- packageName: The affected package name (e.g., 'next', 'react') - leave empty for error analysis
- context: Description of the vulnerability or error (include file paths, line numbers, error messages)

Returns:
- relevantFiles: Array of files with code snippets showing the relevant code
- packageJson: The dependencies section (for security analysis)
- packageLockEntry: The specific package version info
- configFiles: Related configuration files found
- summary: Brief summary of findings
- isPackageUsed: Whether the package is actually used in code (not just in dependencies)

Note: The repository snapshot is pre-loaded - you don't need to pass it.`,
    parameters: z.object({
      packageName: z
        .string()
        .describe(
          "Package name to search for (e.g., 'next', 'react'). Leave empty for error analysis.",
        ),
      context: z
        .string()
        .describe(
          "Description of the vulnerability or error. Include CVE ID, file paths, line numbers, error messages as applicable.",
        ),
    }),
    execute: async ({ packageName, context }) => {
      console.log(
        `[FileFinderTool] 🔍 Analyzing snapshot for: ${packageName || "error"}`,
      );
      console.log(`[FileFinderTool] Context: ${context.substring(0, 100)}...`);

      const agent = createRelevantFileFinderAgent();
      const runner = new Runner();

      // Build prompt for the sub-agent with the pre-captured snapshot
      const prompt = `## Analysis Request

**Package:** ${packageName || "(Error analysis - no specific package)"}
**Context:** ${context}

## Repository Snapshot

<snapshot>
${snapshot}
</snapshot>

Please analyze the snapshot and return the relevant files.`;

      try {
        const startTime = Date.now();
        const result = await runner.run(agent, prompt, {
          stream: false,
          maxTurns: 8,
        });
        const duration = Date.now() - startTime;

        console.log(
          `[FileFinderTool] ✅ Analysis complete in ${(duration / 1000).toFixed(1)}s`,
        );

        // Extract the output from the runner result
        let output = null;
        const outputText = result.state?._currentStep?.output;

        if (outputText) {
          try {
            output =
              typeof outputText === "string"
                ? JSON.parse(outputText)
                : outputText;
          } catch {
            // If parsing fails, try other locations
          }
        }

        // Try lastProcessedResponse
        if (
          !output &&
          result.state?._lastProcessedResponse?.newItems?.[0]?.rawItem
            ?.content?.[0]?.text
        ) {
          try {
            output = JSON.parse(
              result.state._lastProcessedResponse.newItems[0].rawItem.content[0]
                .text,
            );
          } catch {
            // Continue trying
          }
        }

        // Try generatedItems
        if (!output && result.state?._generatedItems) {
          for (let i = result.state._generatedItems.length - 1; i >= 0; i--) {
            const item = result.state._generatedItems[i];
            if (
              item.type === "message_output_item" &&
              item.rawItem?.content?.[0]?.text
            ) {
              try {
                output = JSON.parse(item.rawItem.content[0].text);
                break;
              } catch {
                // Continue trying
              }
            }
          }
        }

        if (output) {
          console.log(
            `[FileFinderTool] Found ${output.relevantFiles?.length || 0} relevant files`,
          );
          console.log(
            `[FileFinderTool] isPackageUsed: ${output.isPackageUsed}`,
          );
          return output;
        }

        console.warn(`[FileFinderTool] ⚠️ Could not parse sub-agent output`);
        return {
          relevantFiles: [],
          packageJson: null,
          packageLockEntry: null,
          configFiles: [],
          summary: "Failed to analyze snapshot",
          usageCount: 0,
          isPackageUsed: false,
          error: "Could not parse sub-agent output",
        };
      } catch (error) {
        console.error(`[FileFinderTool] ❌ Analysis failed:`, error.message);
        return {
          relevantFiles: [],
          packageJson: null,
          packageLockEntry: null,
          configFiles: [],
          summary: `Analysis failed: ${error.message}`,
          usageCount: 0,
          isPackageUsed: false,
          error: error.message,
        };
      }
    },
  });
}

module.exports = {
  createRelevantFileFinderAgent,
  getFileFinderAsTool,
  getFileFinderToolWithSnapshot,
  relevantFilesSchema,
  // Export tools for testing
  tools: {
    listSnapshotFilesTool,
    searchImportsTool,
    searchCodePatternTool,
    getFileContentTool,
    getPackageJsonTool,
    getPackageLockEntryTool,
  },
};
