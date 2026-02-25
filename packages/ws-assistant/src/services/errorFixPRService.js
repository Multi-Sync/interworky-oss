/**
 * Error Fix PR Service
 * Creates GitHub Pull Requests with error fixes
 * Adapted from simpleIntegrationService but for editing existing files
 */

const axios = require("axios");
const prettier = require("prettier");
const { ESLint } = require("eslint");
const { Runner } = require("@openai/agents");
const {
  createFixJudgeAgent,
  buildJudgePrompt,
} = require("../agents/fixJudgeAgent");
const {
  createFixApplierAgent,
  buildFixApplierPrompt,
} = require("../agents/fixApplierAgent");
const { findExistingPR } = require("./duplicateDetectionService");

/**
 * Fetch project's ESLint config from GitHub repo
 * @param {Object} params - { owner, repo, token }
 * @returns {Promise<Object|null>} ESLint config or null if not found
 */
async function fetchESLintConfig({ owner, repo, token }) {
  const configFiles = [
    "eslint.config.js",
    "eslint.config.mjs",
    ".eslintrc.js",
    ".eslintrc.json",
    ".eslintrc",
    ".eslintrc.yaml",
    ".eslintrc.yml",
  ];

  const headers = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github.v3+json",
  };

  for (const configFile of configFiles) {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${configFile}`;
      const response = await axios.get(url, { headers });

      console.log(`[ErrorFixPR] Found ESLint config: ${configFile}`);
      return { configFile, exists: true };
    } catch (error) {
      // File not found, try next
      continue;
    }
  }

  console.log("[ErrorFixPR] No ESLint config found in repo");
  return null;
}

/**
 * Validate and auto-fix code using ESLint
 * @param {string} content - Code content to validate
 * @param {string} filePath - File path (for parser detection)
 * @returns {Promise<Object>} { fixedContent, hasErrors, errors, wasFixed }
 */
async function validateAndFixWithESLint(content, filePath) {
  try {
    const ext = filePath.split(".").pop().toLowerCase();

    // Skip non-JS/TS files
    if (!["js", "jsx", "ts", "tsx", "mjs", "cjs"].includes(ext)) {
      return {
        fixedContent: content,
        hasErrors: false,
        errors: [],
        wasFixed: false,
      };
    }

    // Create ESLint instance with basic config for validation
    const eslint = new ESLint({
      fix: true,
      useEslintrc: false,
      overrideConfig: {
        languageOptions: {
          ecmaVersion: "latest",
          sourceType: "module",
          parserOptions: {
            ecmaFeatures: {
              jsx: ext === "jsx" || ext === "tsx",
            },
          },
        },
        rules: {
          // Only check for obvious errors, not style
          "no-undef": "off", // Can't know project globals
          "no-unused-vars": "off", // Too strict for fixes
          "no-const-assign": "error",
          "no-dupe-keys": "error",
          "no-duplicate-case": "error",
          "no-empty": "warn",
          "no-extra-semi": "error",
          "no-func-assign": "error",
          "no-invalid-regexp": "error",
          "no-irregular-whitespace": "error",
          "no-unreachable": "error",
          "valid-typeof": "error",
          // Syntax errors
          "no-unexpected-multiline": "error",
        },
      },
    });

    // Lint the content
    const results = await eslint.lintText(content, { filePath });
    const result = results[0];

    if (!result) {
      return {
        fixedContent: content,
        hasErrors: false,
        errors: [],
        wasFixed: false,
      };
    }

    // Get the fixed output if available
    const fixedContent = result.output || content;
    const wasFixed = result.output !== undefined && result.output !== content;

    // Collect remaining errors (after auto-fix)
    const errors = result.messages
      .filter((msg) => msg.severity === 2) // Only errors, not warnings
      .map((msg) => ({
        line: msg.line,
        column: msg.column,
        message: msg.message,
        ruleId: msg.ruleId,
      }));

    console.log(`[ErrorFixPR] ESLint validation:`, {
      filePath,
      wasFixed,
      errorCount: errors.length,
      warningCount: result.warningCount,
    });

    return {
      fixedContent,
      hasErrors: errors.length > 0,
      errors,
      wasFixed,
    };
  } catch (error) {
    console.warn(
      `[ErrorFixPR] ESLint validation failed, using original code: ${error.message}`,
    );
    return {
      fixedContent: content,
      hasErrors: false,
      errors: [],
      wasFixed: false,
    };
  }
}

/**
 * Convert minified production URL to source file path and GitHub link
 * @param {string} sourceUrl - Production URL like https://example.com/_next/static/chunks/app/foo/page-abc123.js
 * @param {Object} githubConfig - { owner, repo } for building GitHub URL
 * @returns {Object} { filePath, githubUrl } or { filePath: sourceUrl, githubUrl: null } if can't convert
 */
function convertToGitHubLink(sourceUrl, githubConfig = {}) {
  if (!sourceUrl) {
    return { filePath: null, githubUrl: null };
  }

  // If it's already a local path (not a URL), just return it
  if (!sourceUrl.includes("http")) {
    const { owner, repo } = githubConfig;
    const githubUrl =
      owner && repo
        ? `https://github.com/${owner}/${repo}/blob/main/${sourceUrl}`
        : null;
    return { filePath: sourceUrl, githubUrl };
  }

  // Extract path from Next.js production URL
  // Pattern: https://example.com/_next/static/chunks/app/foo/bar/page-hash.js
  const nextjsMatch = sourceUrl.match(/\/_next\/static\/chunks\/app\/(.+)$/);
  if (nextjsMatch) {
    let extractedPath = nextjsMatch[1];
    // Remove webpack hash: page-ff1b88f8afe00694.js → page.js
    extractedPath = extractedPath.replace(/-[a-f0-9]{16}\.js$/, ".js");
    const filePath = `src/app/${extractedPath}`;

    const { owner, repo } = githubConfig;
    const githubUrl =
      owner && repo
        ? `https://github.com/${owner}/${repo}/blob/main/${filePath}`
        : null;

    return { filePath, githubUrl };
  }

  // Detect Vite/Lovable minified bundles
  // Pattern: /assets/index-*.js or /assets/[name]-[hash].js
  const viteMatch = sourceUrl.match(/\/assets\/[\w-]+-[A-Za-z0-9]{6,10}\.js$/);
  if (viteMatch) {
    // Cannot determine source file from Vite bundle - requires heuristic search
    return {
      filePath: null,
      githubUrl: null,
      isMinifiedBundle: true,
      bundleType: "vite",
    };
  }

  // Check for Lovable-specific URL patterns
  if (sourceUrl.includes(".lovable.app/") || sourceUrl.includes(".lovable.dev/")) {
    return {
      filePath: null,
      githubUrl: null,
      isMinifiedBundle: true,
      bundleType: "lovable",
    };
  }

  // Can't convert - return original
  return { filePath: sourceUrl, githubUrl: null };
}

/**
 * Parse imports from JavaScript/TypeScript file content
 * @param {string} content - File content
 * @returns {Array<string>} List of import paths
 */
function parseImports(content) {
  const imports = [];

  // Match ES6 imports: import ... from '...'
  const es6ImportRegex =
    /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s*,?\s*)*\s*from\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = es6ImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  // Match require statements: require('...')
  const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = requireRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  // Match dynamic imports: import('...')
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

/**
 * Resolve import path to actual file path
 * @param {string} importPath - Import path from code
 * @param {string} currentFilePath - Path of the file containing the import
 * @param {Object} pathAliases - Path aliases from tsconfig/jsconfig (e.g., { "@/": "src/" })
 * @returns {string|null} Resolved file path or null if can't resolve
 */
function resolveImportPath(importPath, currentFilePath, pathAliases = {}) {
  // Skip node_modules imports
  if (
    !importPath.startsWith(".") &&
    !importPath.startsWith("@/") &&
    !importPath.startsWith("~/")
  ) {
    // Check if it matches a path alias
    let matchedAlias = false;
    for (const [alias, target] of Object.entries(pathAliases)) {
      if (importPath.startsWith(alias.replace("/*", ""))) {
        const resolvedPath = importPath.replace(
          alias.replace("/*", ""),
          target.replace("/*", ""),
        );
        return resolvedPath;
      }
    }
    if (!matchedAlias) {
      return null; // Node module, skip
    }
  }

  // Handle path aliases
  for (const [alias, target] of Object.entries(pathAliases)) {
    const aliasPattern = alias.replace("/*", "");
    if (importPath.startsWith(aliasPattern)) {
      const targetPath = target.replace("/*", "");
      return importPath.replace(aliasPattern, targetPath);
    }
  }

  // Handle relative imports
  if (importPath.startsWith(".")) {
    const currentDir = currentFilePath.split("/").slice(0, -1).join("/");
    const parts = importPath.split("/");
    let resolvedDir = currentDir.split("/");

    for (const part of parts) {
      if (part === "..") {
        resolvedDir.pop();
      } else if (part !== ".") {
        resolvedDir.push(part);
      }
    }

    return resolvedDir.join("/");
  }

  return importPath;
}

/**
 * Fetch related files (imports) for context
 * @param {Object} params - { owner, repo, token, filePath, content, pathAliases }
 * @returns {Promise<Array<Object>>} Array of { path, content } for related files
 */
async function fetchRelatedFiles({
  owner,
  repo,
  token,
  filePath,
  content,
  pathAliases = {},
}) {
  const relatedFiles = [];
  const imports = parseImports(content);

  console.log(`[ErrorFixPR] Found ${imports.length} imports in ${filePath}`);

  // Only fetch first 5 local imports to avoid too many API calls
  const localImports = imports
    .map((imp) => resolveImportPath(imp, filePath, pathAliases))
    .filter((resolved) => resolved !== null)
    .slice(0, 5);

  console.log(`[ErrorFixPR] Fetching ${localImports.length} related files...`);

  const headers = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github.v3+json",
  };

  for (const importPath of localImports) {
    // Try different extensions
    const extensions = [
      "",
      ".js",
      ".jsx",
      ".ts",
      ".tsx",
      "/index.js",
      "/index.ts",
    ];

    for (const ext of extensions) {
      const fullPath = importPath + ext;
      try {
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${fullPath}`;
        const response = await axios.get(url, { headers });

        let fileContent;
        if (response.data.encoding === "base64") {
          fileContent = Buffer.from(response.data.content, "base64").toString(
            "utf8",
          );
        } else {
          fileContent = response.data.content;
        }

        relatedFiles.push({
          path: fullPath,
          content: fileContent.substring(0, 2000), // Limit content size
        });

        console.log(`[ErrorFixPR] ✅ Fetched related file: ${fullPath}`);
        break; // Found the file, don't try other extensions
      } catch {
        // File not found with this extension, try next
        continue;
      }
    }
  }

  return relatedFiles;
}

/**
 * Detect indentation style from file content
 * @param {string} content - File content
 * @returns {Object} { useTabs: boolean, tabWidth: number }
 */
function detectIndentation(content) {
  const lines = content.split("\n");
  let tabCount = 0;
  let spaceCount = 0;
  let twoSpaceCount = 0;
  let fourSpaceCount = 0;

  for (const line of lines) {
    if (line.startsWith("\t")) {
      tabCount++;
    } else if (line.startsWith("  ")) {
      spaceCount++;
      // Check if it's 2-space or 4-space indentation
      const match = line.match(/^( +)/);
      if (match) {
        const spaces = match[1].length;
        if (spaces % 4 === 0) fourSpaceCount++;
        else if (spaces % 2 === 0) twoSpaceCount++;
      }
    }
  }

  const useTabs = tabCount > spaceCount;
  const tabWidth = twoSpaceCount > fourSpaceCount ? 2 : 4;

  return { useTabs, tabWidth };
}

/**
 * Get Prettier parser based on file extension
 * @param {string} filePath - Path to file
 * @returns {string} Prettier parser name
 */
function getParserForFile(filePath) {
  const ext = filePath.split(".").pop().toLowerCase();
  const parserMap = {
    js: "babel",
    jsx: "babel",
    ts: "typescript",
    tsx: "typescript",
    json: "json",
    md: "markdown",
    css: "css",
    scss: "scss",
    less: "less",
    html: "html",
    vue: "vue",
    yaml: "yaml",
    yml: "yaml",
  };
  return parserMap[ext] || "babel";
}

/**
 * Fetch project's Prettier config from GitHub repo
 * Tries multiple common config file names
 * @param {Object} params - { owner, repo, token }
 * @returns {Promise<Object|null>} Prettier config or null if not found
 */
async function fetchPrettierConfig({ owner, repo, token }) {
  const configFiles = [
    ".prettierrc",
    ".prettierrc.json",
    ".prettierrc.js",
    "prettier.config.js",
    ".prettierrc.yaml",
    ".prettierrc.yml",
  ];

  const headers = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github.v3+json",
  };

  for (const configFile of configFiles) {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${configFile}`;
      const response = await axios.get(url, { headers });

      let content;
      if (response.data.encoding === "base64") {
        content = Buffer.from(response.data.content, "base64").toString("utf8");
      } else {
        content = response.data.content;
      }

      // Parse based on file type
      if (configFile.endsWith(".json") || configFile === ".prettierrc") {
        try {
          return JSON.parse(content);
        } catch {
          // Might be YAML or JS, try next
          continue;
        }
      } else if (configFile.endsWith(".yaml") || configFile.endsWith(".yml")) {
        // Simple YAML parsing for common cases
        const config = {};
        const lines = content.split("\n");
        for (const line of lines) {
          const match = line.match(/^(\w+):\s*(.+)$/);
          if (match) {
            let value = match[2].trim();
            // Parse booleans and numbers
            if (value === "true") value = true;
            else if (value === "false") value = false;
            else if (!isNaN(value)) value = Number(value);
            else value = value.replace(/^['"]|['"]$/g, ""); // Remove quotes
            config[match[1]] = value;
          }
        }
        return config;
      } else if (configFile.endsWith(".js")) {
        // Can't eval JS safely, extract common patterns
        const config = {};
        const singleQuoteMatch = content.match(/singleQuote:\s*(true|false)/);
        const semiMatch = content.match(/semi:\s*(true|false)/);
        const tabWidthMatch = content.match(/tabWidth:\s*(\d+)/);
        const useTabsMatch = content.match(/useTabs:\s*(true|false)/);
        const trailingCommaMatch = content.match(
          /trailingComma:\s*['"](\w+)['"]/,
        );
        const printWidthMatch = content.match(/printWidth:\s*(\d+)/);

        if (singleQuoteMatch)
          config.singleQuote = singleQuoteMatch[1] === "true";
        if (semiMatch) config.semi = semiMatch[1] === "true";
        if (tabWidthMatch) config.tabWidth = Number(tabWidthMatch[1]);
        if (useTabsMatch) config.useTabs = useTabsMatch[1] === "true";
        if (trailingCommaMatch) config.trailingComma = trailingCommaMatch[1];
        if (printWidthMatch) config.printWidth = Number(printWidthMatch[1]);

        if (Object.keys(config).length > 0) {
          return config;
        }
      }
    } catch (error) {
      // File not found or error, try next
      continue;
    }
  }

  console.log(
    "[ErrorFixPR] No Prettier config found in repo, using detected settings",
  );
  return null;
}

/**
 * Format code using Prettier with project standards
 * @param {string} content - Code content to format
 * @param {string} filePath - File path (for parser detection)
 * @param {Object} options - { projectConfig, indentOptions }
 * @returns {Promise<string>} Formatted code
 */
async function formatCode(content, filePath, options = {}) {
  try {
    const parser = getParserForFile(filePath);
    const { projectConfig = {}, indentOptions = {} } = options;

    // Merge: project config takes precedence, then detected indentation, then defaults
    // Parser is always forced to the file-based value (strip it from projectConfig)
    const { parser: _ignoredParser, ...safeProjectConfig } = projectConfig;
    const prettierOptions = {
      parser,
      // Defaults
      semi: true,
      singleQuote: true,
      trailingComma: "all",
      printWidth: 100,
      bracketSpacing: true,
      arrowParens: "avoid",
      useTabs: false,
      tabWidth: 2,
      // Override with detected indentation
      ...indentOptions,
      // Override with project config (highest priority)
      ...safeProjectConfig,
    };

    console.log(`[ErrorFixPR] Formatting ${filePath} with options:`, {
      tabWidth: prettierOptions.tabWidth,
      useTabs: prettierOptions.useTabs,
      singleQuote: prettierOptions.singleQuote,
      semi: prettierOptions.semi,
    });

    const formatted = await prettier.format(content, prettierOptions);
    return formatted;
  } catch (error) {
    console.warn(
      `[ErrorFixPR] Prettier formatting failed, using unformatted code: ${error.message}`,
    );
    // Return original content if formatting fails
    return content;
  }
}

/**
 * Normalize whitespace for comparison
 */
function normalizeWhitespace(str) {
  return str.replace(/\s+/g, " ").trim();
}

/**
 * Tier 1: Apply fix using line numbers (fast, original behavior)
 * @returns {string|null} Fixed content or null if oldCode doesn't match
 */
function applyFixByLine(fileContent, fix) {
  const lines = fileContent.split("\n");
  const { oldCode, newCode, lineStart, lineEnd } = fix;

  const startIdx = lineStart - 1;
  const endIdx = lineEnd - 1;

  if (startIdx < 0 || endIdx >= lines.length || startIdx > endIdx) {
    console.log(
      `[ApplyFix] Tier 1: Invalid line range ${lineStart}-${lineEnd}`,
    );
    return null;
  }

  const originalSection = lines.slice(startIdx, endIdx + 1).join("\n");

  if (normalizeWhitespace(originalSection) === normalizeWhitespace(oldCode)) {
    console.log(
      `[ApplyFix] Tier 1: oldCode matches at lines ${lineStart}-${lineEnd}`,
    );
    const newCodeLines = newCode.split("\n");
    return [
      ...lines.slice(0, startIdx),
      ...newCodeLines,
      ...lines.slice(endIdx + 1),
    ].join("\n");
  }

  console.log(
    `[ApplyFix] Tier 1: oldCode NOT found at lines ${lineStart}-${lineEnd}`,
  );
  return null;
}

/**
 * Tier 2: Apply fix using string search (fast fallback)
 * @returns {string|null} Fixed content or null if oldCode not found/ambiguous
 */
function applyFixBySearch(fileContent, fix) {
  const { oldCode, newCode } = fix;
  const trimmedOld = oldCode.trim();

  // Count occurrences
  const occurrences = fileContent.split(trimmedOld).length - 1;

  if (occurrences === 1) {
    console.log(`[ApplyFix] Tier 2: oldCode found once via string search`);
    return fileContent.replace(trimmedOld, newCode.trim());
  } else if (occurrences > 1) {
    console.log(
      `[ApplyFix] Tier 2: oldCode found ${occurrences} times (ambiguous)`,
    );
    return null;
  } else {
    // Try normalized search
    const normalizedContent = normalizeWhitespace(fileContent);
    const normalizedOld = normalizeWhitespace(oldCode);
    if (normalizedContent.includes(normalizedOld)) {
      console.log(
        `[ApplyFix] Tier 2: oldCode found with normalized whitespace`,
      );
      // Find and replace with original whitespace preserved where possible
      const regex = new RegExp(
        oldCode
          .trim()
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          .replace(/\s+/g, "\\s+"),
      );
      if (regex.test(fileContent)) {
        return fileContent.replace(regex, newCode.trim());
      }
    }
    console.log(`[ApplyFix] Tier 2: oldCode not found in file`);
    return null;
  }
}

/**
 * Tier 3: Apply fix using AI (slow fallback for edge cases)
 * @returns {Promise<string|null>} Fixed content or null if AI fails
 */
async function applyFixByAI(fileContent, fix) {
  console.log(`[ApplyFix] Tier 3: Using AI to apply fix`);

  try {
    const agent = createFixApplierAgent();
    const runner = new Runner();
    const prompt = buildFixApplierPrompt({
      originalContent: fileContent,
      oldCode: fix.oldCode,
      newCode: fix.newCode,
      description: fix.description || "Apply the code fix",
    });

    const result = await runner.run(agent, prompt, { stream: false });

    // Extract output
    let outputText = result.state?._currentStep?.output?.trim();
    if (!outputText) {
      console.log(`[ApplyFix] Tier 3: No output from AI`);
      return null;
    }

    const parsed = JSON.parse(outputText);
    if (parsed.fixedContent) {
      console.log(`[ApplyFix] Tier 3: AI applied fix - ${parsed.changesMade}`);
      return parsed.fixedContent;
    }

    return null;
  } catch (error) {
    console.error(`[ApplyFix] Tier 3: AI error - ${error.message}`);
    return null;
  }
}

/**
 * Apply fix to file content using 3-tier fallback
 * Tier 1: Line-based (fast) → Tier 2: String search (fast) → Tier 3: AI (slow)
 *
 * @param {string} fileContent - Original file content
 * @param {Object} fix - Fix details (oldCode, newCode, lineStart, lineEnd)
 * @param {Object} options - { useAI: boolean } - whether to use AI fallback
 * @returns {Promise<string>} Fixed file content
 */
async function applyFix(fileContent, fix, options = { useAI: true }) {
  const { oldCode, lineStart, lineEnd } = fix;
  console.log(`[ApplyFix] Applying fix: lines ${lineStart}-${lineEnd}`);
  console.log(`[ApplyFix] oldCode: "${oldCode.substring(0, 50)}..."`);

  // Tier 1: Try line-based replacement
  const tier1Result = applyFixByLine(fileContent, fix);
  if (tier1Result) {
    return tier1Result;
  }

  // Tier 2: Try string search
  const tier2Result = applyFixBySearch(fileContent, fix);
  if (tier2Result) {
    return tier2Result;
  }

  // Tier 3: Use AI as last resort
  if (options.useAI) {
    const tier3Result = await applyFixByAI(fileContent, fix);
    if (tier3Result) {
      return tier3Result;
    }
  }

  // All tiers failed - throw error instead of creating broken PR
  throw new Error(
    `Failed to apply fix: oldCode not found at lines ${lineStart}-${lineEnd} or anywhere in file`,
  );
}

/**
 * Fetch file content from GitHub
 *
 * @param {Object} params - { owner, repo, path, token }
 * @returns {Promise<Object>} { content, sha }
 */
async function fetchFileFromGitHub({ owner, repo, path, token }) {
  const headers = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github.v3+json",
  };

  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const response = await axios.get(url, { headers });

    let content;
    if (response.data.encoding === "base64") {
      content = Buffer.from(response.data.content, "base64").toString("utf8");
    } else {
      content = response.data.content;
    }

    return {
      content,
      sha: response.data.sha,
    };
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`File not found: ${path}`);
    }
    throw new Error(`Failed to fetch file: ${error.message}`);
  }
}

/**
 * Build PR description for error fix
 *
 * @param {Object} error - Error details
 * @param {Object} fix - Fix analysis from agent
 * @param {Object} githubConfig - { owner, repo } for GitHub links
 * @returns {string} Markdown PR description
 */
function buildPRDescription(error, fix, githubConfig = {}) {
  // Convert source file URL to GitHub link
  const { filePath, githubUrl } = convertToGitHubLink(
    error.source_file,
    githubConfig,
  );
  const fileDisplay = githubUrl
    ? `[${filePath}](${githubUrl})`
    : `\`${error.source_file}\``;

  return `## 🔧 Auto-Fix: ${error.error_type}

This PR automatically fixes a ${error.severity} severity error detected in production.

### Error Details

**Message:** ${error.message}
**Type:** ${error.error_type}
**Severity:** ${error.severity}

**Location:**
- File: ${fileDisplay}
- Line: ${error.line_number}
- URL: ${error.url}

### Root Cause

${fix.rootCause}

### Fix Applied

**Category:** ${fix.errorCategory}
**Confidence:** ${fix.confidence}

${
  fix.suggestedFix
    ? `
**Changed File:** \`${fix.suggestedFix.filePath}\`
**Lines Changed:** ${fix.suggestedFix.lineStart}-${fix.suggestedFix.lineEnd}

<details>
<summary>View Code Changes</summary>

**Before:**
\`\`\`javascript
${fix.suggestedFix.oldCode}
\`\`\`

**After:**
\`\`\`javascript
${fix.suggestedFix.newCode}
\`\`\`

</details>
`
    : ""
}

### AI Analysis

${fix.reasoning}

${
  fix.requiresManualReview
    ? `
### ⚠️ Manual Review Required

This fix has been flagged for manual review. Please carefully test the changes before merging.
`
    : ""
}

${
  fix.testCase
    ? `
### Suggested Test Case

\`\`\`javascript
${fix.testCase}
\`\`\`
`
    : ""
}

### Stack Trace

<details>
<summary>View Full Stack Trace</summary>

\`\`\`
${error.stack_trace || "No stack trace available"}
\`\`\`

</details>

---

🤖 *This PR was automatically generated by Interworky Auto-Fix*
*Error ID: ${error._id}*
*Error Hash: ${error.error_hash}*
${fix.requiresManualReview ? "*⚠️ Please review carefully before merging*" : ""}
`;
}

/**
 * Wait for GitHub checks to complete on a PR
 *
 * @param {Object} params - { owner, repo, headSha, token, timeoutMs }
 * @returns {Promise<Object>} Check results { allPassed, someFailed, failedChecks, timedOut }
 */
async function waitForChecks({
  owner,
  repo,
  headSha,
  token,
  timeoutMs = 180000,
}) {
  const startTime = Date.now();
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  console.log(
    `[ErrorFixPR] Polling for check runs on commit ${headSha.substring(0, 7)}...`,
  );

  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 3;

  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/commits/${headSha}/check-runs`,
        { headers },
      );

      consecutiveErrors = 0; // Reset on success
      const checkRuns = response.data.check_runs;

      // If no checks have started yet, wait and retry
      if (checkRuns.length === 0) {
        console.log(`[ErrorFixPR] No checks found yet, waiting 5s...`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }

      console.log(`[ErrorFixPR] Found ${checkRuns.length} check(s):`);
      checkRuns.forEach((check) => {
        console.log(
          `  - ${check.name}: ${check.status} (${check.conclusion || "pending"})`,
        );
      });

      // Check if all checks are completed
      const allCompleted = checkRuns.every((c) => c.status === "completed");

      if (!allCompleted) {
        console.log(`[ErrorFixPR] Checks still running, waiting 10s...`);
        await new Promise((resolve) => setTimeout(resolve, 10000));
        continue;
      }

      // All checks completed - determine if they passed
      const failedChecks = checkRuns.filter((c) => c.conclusion !== "success");

      if (failedChecks.length === 0) {
        console.log(`[ErrorFixPR] ✅ All ${checkRuns.length} checks passed!`);
        return {
          allPassed: true,
          someFailed: false,
          failedChecks: [],
          timedOut: false,
        };
      } else {
        console.log(`[ErrorFixPR] ❌ ${failedChecks.length} check(s) failed`);
        return {
          allPassed: false,
          someFailed: true,
          failedChecks: failedChecks.map((c) => ({
            name: c.name,
            conclusion: c.conclusion,
          })),
          timedOut: false,
        };
      }
    } catch (error) {
      consecutiveErrors++;

      // Handle 403 specifically - likely missing checks permission
      if (error.response?.status === 403) {
        console.warn(
          `[ErrorFixPR] ⚠️ Cannot access check runs API (403 Forbidden).`,
        );
        console.warn(
          `[ErrorFixPR]    GitHub App may not have 'checks: read' permission.`,
        );
        console.warn(
          `[ErrorFixPR]    Skipping check verification - PR created but checks not monitored.`,
        );
        return {
          allPassed: false,
          someFailed: false,
          failedChecks: [],
          timedOut: false,
          skipped: true,
          reason: "Missing checks permission (403)",
        };
      }

      console.error(`[ErrorFixPR] Error fetching check runs:`, error.message);

      // Stop polling after too many consecutive errors
      if (consecutiveErrors >= maxConsecutiveErrors) {
        console.error(
          `[ErrorFixPR] Too many consecutive errors, stopping check polling.`,
        );
        return {
          allPassed: false,
          someFailed: false,
          failedChecks: [],
          timedOut: false,
          skipped: true,
          reason: `Too many errors: ${error.message}`,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }

  // Timeout reached
  console.log(`[ErrorFixPR] ⏱️ Timeout reached after ${timeoutMs / 1000}s`);
  return {
    allPassed: false,
    someFailed: false,
    failedChecks: [],
    timedOut: true,
  };
}

/**
 * Create GitHub PR with error fix
 *
 * @param {Object} params - { fix, error, githubConfig }
 * @returns {Promise<Object>} Created PR data
 */
async function createErrorFixPR({ fix, error, githubConfig }) {
  const { token, owner, repo } = githubConfig;

  if (!fix.suggestedFix) {
    throw new Error("No fix available - suggestedFix is null");
  }

  // Check for existing PR to prevent duplicates (use error_hash for same underlying error)
  const errorHash = error.error_hash;
  if (errorHash) {
    console.log(
      `[ErrorFixPR] Checking for existing PR for error_hash ${errorHash}...`,
    );
    const existingPR = await findExistingPR({
      owner,
      repo,
      token,
      identifier: errorHash,
      type: "error",
    });

    if (existingPR) {
      console.log(
        `[ErrorFixPR] Duplicate detected! PR already exists: #${existingPR.number}`,
      );
      return {
        ...existingPR,
        duplicate: true,
        message: `PR already exists for error_hash ${errorHash}: #${existingPR.number}`,
      };
    }
  }

  const headers = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github.v3+json",
  };

  console.log(`[ErrorFixPR] Creating PR for ${owner}/${repo}`);

  try {
    // 1. Get default branch
    const repoUrl = `https://api.github.com/repos/${owner}/${repo}`;
    const repoData = await axios.get(repoUrl, { headers });
    const defaultBranch = repoData.data.default_branch;

    console.log(`[ErrorFixPR] Default branch: ${defaultBranch}`);

    // 2. Get latest commit SHA from default branch
    const branchUrl = `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${defaultBranch}`;
    const branchData = await axios.get(branchUrl, { headers });
    const latestCommitSha = branchData.data.object.sha;

    console.log(`[ErrorFixPR] Latest commit: ${latestCommitSha}`);

    // 3. Fetch the file to be fixed
    console.log(`[ErrorFixPR] Fetching file: ${fix.suggestedFix.filePath}`);
    const { content: originalContent } = await fetchFileFromGitHub({
      owner,
      repo,
      path: fix.suggestedFix.filePath,
      token,
    });

    // 3.5. Fetch project's Prettier config (in parallel with other setup)
    console.log("[ErrorFixPR] Fetching project's Prettier config...");
    const [projectPrettierConfig, detectedIndent] = await Promise.all([
      fetchPrettierConfig({ owner, repo, token }),
      Promise.resolve(detectIndentation(originalContent)),
    ]);

    if (projectPrettierConfig) {
      console.log(
        "[ErrorFixPR] Found project Prettier config:",
        projectPrettierConfig,
      );
    }
    console.log("[ErrorFixPR] Detected indentation:", detectedIndent);

    // 4. Apply fix with LLM Judge validation (max 3 turns)
    const MAX_JUDGE_TURNS = 3;
    let fixedContent;
    let judgeFeedback = "";
    let judgeUsed = false;

    console.log(
      "[ErrorFixPR] Starting fix application with judge validation...",
    );

    for (let turn = 1; turn <= MAX_JUDGE_TURNS; turn++) {
      console.log(`[ErrorFixPR] Judge turn ${turn}/${MAX_JUDGE_TURNS}`);

      // 4.1 Apply the fix
      console.log("[ErrorFixPR] Applying fix...");
      const unfixedContent = await applyFix(originalContent, fix.suggestedFix);

      // 4.2 Format the fixed content using project standards
      console.log(
        "[ErrorFixPR] Formatting fixed code with project standards...",
      );
      const formattedContent = await formatCode(
        unfixedContent,
        fix.suggestedFix.filePath,
        {
          projectConfig: projectPrettierConfig || {},
          indentOptions: detectedIndent,
        },
      );

      // 4.3 Validate with ESLint and auto-fix any issues
      console.log("[ErrorFixPR] Validating with ESLint...");
      const eslintResult = await validateAndFixWithESLint(
        formattedContent,
        fix.suggestedFix.filePath,
      );

      if (eslintResult.wasFixed) {
        console.log("[ErrorFixPR] ESLint auto-fixed some issues");
      }
      if (eslintResult.hasErrors) {
        console.warn(
          "[ErrorFixPR] ESLint found errors that couldn't be auto-fixed:",
          eslintResult.errors,
        );
      }

      const candidateContent = eslintResult.fixedContent;

      // 4.4 Judge evaluation
      console.log("[ErrorFixPR] Running LLM judge validation...");
      try {
        const judgeAgent = createFixJudgeAgent();
        const runner = new Runner();
        const judgePrompt = buildJudgePrompt({
          originalContent,
          suggestedFix: fix.suggestedFix,
          appliedContent: candidateContent,
          previousFeedback: judgeFeedback,
        });

        const judgeResult = await runner.run(judgeAgent, judgePrompt, {
          stream: false,
        });

        // Extract judge output
        let judgment;
        const outputText = judgeResult.state?._currentStep?.output?.trim();
        if (outputText) {
          judgment = JSON.parse(outputText);
        } else {
          console.warn(
            "[ErrorFixPR] Could not extract judge output, assuming pass",
          );
          judgment = {
            score: "pass",
            issues: [],
            feedback: "No output from judge",
          };
        }

        console.log(`[ErrorFixPR] Judge score: ${judgment.score}`);
        if (judgment.issues?.length > 0) {
          console.log("[ErrorFixPR] Judge issues:", judgment.issues);
        }

        judgeUsed = true;

        if (judgment.score === "pass") {
          console.log("[ErrorFixPR] Judge approved the fix");
          fixedContent = candidateContent;
          break;
        }

        // Judge failed - store feedback for next turn
        judgeFeedback = judgment.feedback;
        console.warn(`[ErrorFixPR] Judge rejected fix: ${judgment.feedback}`);

        if (turn === MAX_JUDGE_TURNS) {
          // Final turn failed - fallback to raw applyFix (no AI to avoid infinite loop)
          console.warn(
            "[ErrorFixPR] Judge failed 3x - using raw applyFix as fallback",
          );
          fixedContent = await applyFix(originalContent, fix.suggestedFix, {
            useAI: false,
          });
        }
      } catch (judgeError) {
        console.error("[ErrorFixPR] Judge error:", judgeError.message);
        // On judge error, use the candidate content and continue
        fixedContent = candidateContent;
        break;
      }
    }

    if (!judgeUsed) {
      console.log("[ErrorFixPR] Judge was not used, using formatted content");
    }

    // 5. Get base tree SHA from latest commit
    const commitUrl = `https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`;
    const commitData = await axios.get(commitUrl, { headers });
    const baseTreeSha = commitData.data.tree.sha;

    // 6. Create blob for fixed file
    const blobUrl = `https://api.github.com/repos/${owner}/${repo}/git/blobs`;
    const blobData = await axios.post(
      blobUrl,
      {
        content: fixedContent,
        encoding: "utf-8",
      },
      { headers },
    );

    console.log(`[ErrorFixPR] Created blob: ${blobData.data.sha}`);

    // 7. Create new tree with fixed file
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees`;
    const treeData = await axios.post(
      treeUrl,
      {
        base_tree: baseTreeSha,
        tree: [
          {
            path: fix.suggestedFix.filePath,
            mode: "100644",
            type: "blob",
            sha: blobData.data.sha,
          },
        ],
      },
      { headers },
    );

    // 8. Create commit
    const errorType = error.error_type.replace(/_/g, " ");
    const commitMessage = `fix: ${errorType} in ${fix.suggestedFix.filePath}

${fix.rootCause}

Auto-fix applied by Interworky (Error ID: ${error._id})
Confidence: ${fix.confidence}`;

    const newCommitUrl = `https://api.github.com/repos/${owner}/${repo}/git/commits`;
    const newCommitData = await axios.post(
      newCommitUrl,
      {
        message: commitMessage,
        tree: treeData.data.sha,
        parents: [latestCommitSha],
      },
      { headers },
    );

    console.log(`[ErrorFixPR] Created commit: ${newCommitData.data.sha}`);

    // 9. Create branch
    const timestamp = Date.now();
    const branchName = `auto-fix/${fix.errorCategory}-${timestamp}`;
    const createRefUrl = `https://api.github.com/repos/${owner}/${repo}/git/refs`;
    await axios.post(
      createRefUrl,
      {
        ref: `refs/heads/${branchName}`,
        sha: newCommitData.data.sha,
      },
      { headers },
    );

    console.log(`[ErrorFixPR] Created branch: ${branchName}`);

    // 10. Create PR as DRAFT
    const prTitle = `[Auto-Fix] ${error.error_type}: ${error.message}`;
    const prUrl = `https://api.github.com/repos/${owner}/${repo}/pulls`;
    const prData = await axios.post(
      prUrl,
      {
        title: prTitle,
        head: branchName,
        base: defaultBranch,
        body: buildPRDescription(error, fix, { owner, repo }),
        draft: true, // Create as draft initially
      },
      { headers },
    );

    console.log(`[ErrorFixPR] ✅ PR created as DRAFT: #${prData.data.number}`);
    console.log(`[ErrorFixPR] Waiting for CI checks to run...`);

    // 11. Wait for checks to complete (with timeout)
    const checksResult = await waitForChecks({
      owner,
      repo,
      prNumber: prData.data.number,
      headSha: newCommitData.data.sha,
      token,
      timeoutMs: 180000, // 3 minutes
    });

    // 12. Update PR based on check results
    if (checksResult.allPassed) {
      // Mark PR as ready for review if all checks pass
      await axios.patch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${prData.data.number}`,
        { draft: false },
        { headers },
      );
      console.log(
        `[ErrorFixPR] ✅ All checks passed! PR marked as ready for review.`,
      );
    } else if (checksResult.someFailed) {
      // Check if any failed checks are linting/formatting related
      const lintRelatedChecks = checksResult.failedChecks.filter((c) =>
        /lint|eslint|prettier|format|style|code.?quality/i.test(c.name),
      );

      if (lintRelatedChecks.length > 0) {
        console.log(
          `[ErrorFixPR] 🔄 Detected lint-related CI failure, attempting auto-retry...`,
        );
        console.log(
          `[ErrorFixPR] Failed lint checks: ${lintRelatedChecks.map((c) => c.name).join(", ")}`,
        );

        try {
          // Fetch the file again from the PR branch
          const branchFileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${fix.suggestedFix.filePath}?ref=${branchName}`;
          const branchFileResponse = await axios.get(branchFileUrl, {
            headers,
          });
          const currentContent = Buffer.from(
            branchFileResponse.data.content,
            "base64",
          ).toString("utf8");

          // Re-run formatting and linting
          console.log("[ErrorFixPR] Re-formatting code...");
          const reFormattedContent = await formatCode(
            currentContent,
            fix.suggestedFix.filePath,
            {
              projectConfig: projectPrettierConfig || {},
              indentOptions: detectedIndent,
            },
          );

          console.log("[ErrorFixPR] Re-running ESLint...");
          const reEslintResult = await validateAndFixWithESLint(
            reFormattedContent,
            fix.suggestedFix.filePath,
          );
          const reFixedContent = reEslintResult.fixedContent;

          // Check if content actually changed
          if (reFixedContent !== currentContent) {
            console.log("[ErrorFixPR] Code was updated, pushing fix commit...");

            // Get current branch head
            const branchRefUrl = `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branchName}`;
            const branchRefData = await axios.get(branchRefUrl, { headers });
            const currentBranchSha = branchRefData.data.object.sha;

            // Get current commit's tree
            const currentCommitUrl = `https://api.github.com/repos/${owner}/${repo}/git/commits/${currentBranchSha}`;
            const currentCommitData = await axios.get(currentCommitUrl, {
              headers,
            });
            const currentTreeSha = currentCommitData.data.tree.sha;

            // Create new blob
            const fixBlobData = await axios.post(
              `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
              { content: reFixedContent, encoding: "utf-8" },
              { headers },
            );

            // Create new tree
            const fixTreeData = await axios.post(
              `https://api.github.com/repos/${owner}/${repo}/git/trees`,
              {
                base_tree: currentTreeSha,
                tree: [
                  {
                    path: fix.suggestedFix.filePath,
                    mode: "100644",
                    type: "blob",
                    sha: fixBlobData.data.sha,
                  },
                ],
              },
              { headers },
            );

            // Create fix commit
            const fixCommitData = await axios.post(
              `https://api.github.com/repos/${owner}/${repo}/git/commits`,
              {
                message:
                  "chore: fix linting and formatting issues\n\nAuto-fix applied by Interworky",
                tree: fixTreeData.data.sha,
                parents: [currentBranchSha],
              },
              { headers },
            );

            // Update branch reference
            await axios.patch(
              branchRefUrl,
              { sha: fixCommitData.data.sha },
              { headers },
            );

            console.log(
              `[ErrorFixPR] ✅ Fix commit pushed: ${fixCommitData.data.sha.substring(0, 7)}`,
            );

            // Wait for new checks
            console.log("[ErrorFixPR] Waiting for CI checks on fix commit...");
            const retryChecksResult = await waitForChecks({
              owner,
              repo,
              headSha: fixCommitData.data.sha,
              token,
              timeoutMs: 180000,
            });

            if (retryChecksResult.allPassed) {
              await axios.patch(
                `https://api.github.com/repos/${owner}/${repo}/pulls/${prData.data.number}`,
                { draft: false },
                { headers },
              );
              console.log(
                `[ErrorFixPR] ✅ Retry successful! All checks passed. PR marked as ready for review.`,
              );

              await axios.post(
                `https://api.github.com/repos/${owner}/${repo}/issues/${prData.data.number}/comments`,
                {
                  body: `✅ **CI Checks Passed After Auto-Retry**\n\nInitial checks failed due to linting issues. A follow-up commit was automatically pushed to fix formatting, and all checks now pass.\n\n🤖 *Auto-retry by Interworky*`,
                },
                { headers },
              );

              return {
                ...prData.data,
                checksResult: retryChecksResult,
                retried: true,
              };
            } else {
              console.log(`[ErrorFixPR] ⚠️ Retry didn't fix all issues`);
            }
          } else {
            console.log(
              "[ErrorFixPR] No changes after re-formatting, skipping retry",
            );
          }
        } catch (retryError) {
          console.error(
            `[ErrorFixPR] Auto-retry failed: ${retryError.message}`,
          );
        }
      }

      // Add comment about failed checks (original behavior if retry didn't work)
      await axios.post(
        `https://api.github.com/repos/${owner}/${repo}/issues/${prData.data.number}/comments`,
        {
          body: `⚠️ **CI Checks Failed**\n\nThe following checks failed:\n${checksResult.failedChecks.map((c) => `- ❌ ${c.name}: ${c.conclusion}`).join("\n")}\n\n${fix.requiresManualReview ? "This PR was already flagged for manual review." : "Please review the failures before merging."}\n\nKeeping this PR as draft until checks pass.`,
        },
        { headers },
      );
      console.log(`[ErrorFixPR] ⚠️ Some checks failed. PR kept as draft.`);
    } else {
      console.log(
        `[ErrorFixPR] ℹ️ Checks still running or not started. PR kept as draft.`,
      );
    }

    return {
      ...prData.data,
      checksResult,
    };
  } catch (error) {
    console.error("[ErrorFixPR] Failed to create PR:", error.message);
    if (error.response?.data) {
      console.error("[ErrorFixPR] GitHub API error:", error.response.data);
    }
    throw error;
  }
}

module.exports = {
  createErrorFixPR,
  applyFix,
  fetchFileFromGitHub,
  buildPRDescription,
  waitForChecks,
  // Code formatting utilities
  formatCode,
  detectIndentation,
  fetchPrettierConfig,
  getParserForFile,
  // ESLint validation
  validateAndFixWithESLint,
  fetchESLintConfig,
  // Related files context
  parseImports,
  resolveImportPath,
  fetchRelatedFiles,
  // URL conversion
  convertToGitHubLink,
};
