/**
 * Next.config Analysis Agent
 * Analyzes next.config.(js|mjs|ts) to extract Next.js configuration patterns
 */

const { Agent } = require("@openai/agents");
const { z } = require("zod");

// Repository knowledge schema (same as parent)
const repoKnowledgeSchema = z.object({
  project_type: z
    .string()
    .describe("Framework type: nextjs, react, vue, vanilla, etc."),
  framework_version: z
    .string()
    .describe("Framework version number or 'unknown'"),

  // Flattened structure fields
  directories_summary: z
    .string()
    .describe(
      'JSON string of directory descriptions: {"src/app": "Next.js pages", ...}',
    ),
  entry_points: z.string().describe("Comma-separated list of main entry files"),

  // Flattened error handling
  uses_try_catch: z
    .boolean()
    .describe("Does the codebase use try-catch blocks?"),
  uses_optional_chaining: z
    .boolean()
    .describe("Does the codebase use optional chaining (?.)"),
  uses_null_checks: z
    .boolean()
    .describe("Does the codebase explicitly check for null/undefined?"),
  error_patterns: z
    .string()
    .describe(
      "JSON string array of code snippets showing error handling patterns",
    ),

  // Flattened imports
  common_imports_summary: z
    .string()
    .describe(
      "JSON string array of objects: [{file, import_statement, usage}, ...]",
    ),

  // Flattened testing
  testing_framework: z
    .string()
    .describe("Testing framework name: jest, vitest, mocha, or 'none'"),
  has_tests: z.boolean().describe("Are there test files in the repository?"),
  test_pattern: z
    .string()
    .describe("Test file naming pattern, e.g., *.test.ts, or 'none'"),

  // Flattened dependencies
  dependencies_summary: z
    .string()
    .describe('JSON string of key dependencies: {"react": "18.2.0", ...}'),

  notes: z
    .string()
    .describe("Any additional important observations about the codebase"),
});

const nextConfigInstructions = `You are a Next.js config file analyzer. Your job is to extract configuration details from the next.config file content provided in the parent prompt.

## Your Goal

The next.config file content (if it exists) has already been fetched and is provided in the parent prompt. You DO NOT need to make any tool calls.

If the file was found, parse it to extract:
- Next.js-specific configuration (output mode, basePath, redirects, etc.)
- Imported plugins and dependencies (@next/bundle-analyzer, @sentry/nextjs, etc.)
- Experimental features enabled
- Deployment/runtime settings

If the file was NOT found, return default values.

## What You MUST Extract

### 1. Project Type
- If file content is provided → \`project_type: "nextjs"\`
- If not provided → \`project_type: "unknown"\`
- \`framework_version: "unknown"\` (version comes from package.json)

### 2. Entry Points
- If file exists → Set to the filename (you'll see it in the parent prompt header)
- If not found → Empty string ""

### 3. Common Imports (Config Dependencies)
Extract imports/requires from the config file:
- Look for: \`import ... from ...\` or \`const ... = require(...)\`
- Common patterns:
  - \`@next/bundle-analyzer\` - bundle analysis
  - \`@sentry/nextjs\` - error tracking
  - \`next-pwa\` - PWA support
  - \`@next/mdx\` - MDX support
  - Custom plugins

Example output:
\`\`\`json
[
  {
    "file": "next.config.js",
    "import_statement": "const withBundleAnalyzer = require('@next/bundle-analyzer')",
    "usage": "Bundle size analysis"
  }
]
\`\`\`

Serialize to JSON string for \`common_imports_summary\`.

### 4. Dependencies Summary
List config-specific dependencies found in imports:
- Extract package names from import statements
- Example: \`"{\\"@next/bundle-analyzer\\": \\"used\\", \\"@sentry/nextjs\\": \\"used\\"}"\`

### 5. Notes (Critical Configurations)
Scan the config file for these patterns and note what you find:
- \`output\`: "standalone" | "export" (deployment mode)
- \`basePath\`: custom base path for deployment
- \`assetPrefix\`: CDN configuration
- \`images.domains\` or \`images.remotePatterns\`: allowed image sources
- \`rewrites\` / \`redirects\` / \`headers\`: routing customizations
- \`experimental\`: experimental flags (serverActions, appDir, etc.)
- \`transpilePackages\`: packages to transpile
- \`i18n\`: internationalization config
- \`webpack\`: custom webpack config
- \`env\`: environment variables

Example notes:
\`\`\`
Next.js config found (next.config.ts). Uses standalone output mode. Has custom webpack config for bundle analysis. Images configured for domains: example.com, cdn.example.com. Experimental serverActions enabled. Transpiles: @acme/ui package.
\`\`\`

## What You CANNOT Extract (Leave Defaults)

These require source code scanning:
- \`uses_try_catch\` → **false** (unless you find try/catch in this config file itself)
- \`uses_optional_chaining\` → **false** (unless in this config)
- \`uses_null_checks\` → **false** (unless in this config)
- \`error_patterns\` → **"[]"**
- \`directories_summary\` → **"{}"**
- \`testing_framework\` → **"none"**
- \`has_tests\` → **false**
- \`test_pattern\` → **"none"**

## Important

- **NO tool calls needed** - File content is in the parent prompt
- **Check if provided** - Look for the "NEXT.CONFIG FILE" section in parent prompt
- **Parse if found** - Extract configuration details
- **Return defaults if not found** - Use empty/default values

## Example Output

\`\`\`json
{
  "project_type": "nextjs",
  "framework_version": "unknown",

  "directories_summary": "{}",
  "entry_points": "next.config.ts",

  "uses_try_catch": false,
  "uses_optional_chaining": false,
  "uses_null_checks": false,
  "error_patterns": "[]",

  "common_imports_summary": "[{\\"file\\": \\"next.config.ts\\", \\"import_statement\\": \\"import { withSentryConfig } from '@sentry/nextjs'\\", \\"usage\\": \\"Error tracking integration\\"}]",

  "testing_framework": "none",
  "has_tests": false,
  "test_pattern": "none",

  "dependencies_summary": "{\\"@sentry/nextjs\\": \\"used\\"}",

  "notes": "Next.js config found (next.config.ts). Uses standalone output mode. Sentry integration enabled. Images configured with remotePatterns for CDN. Experimental serverActions enabled."
}
\`\`\`

Parse the next.config content from the parent prompt (if provided) and return the schema above.
`;

/**
 * Create next.config analysis agent
 * @returns {Agent} Configured next.config analysis agent
 */
function createNextConfigAgent() {
  console.log("[NextConfigAgent] Creating next.config analysis agent");

  const agent = new Agent({
    name: "NextConfigAgent",
    instructions: nextConfigInstructions,
    model: process.env.AI_MODEL || "gpt-4o",
    outputType: repoKnowledgeSchema,
  });

  console.log("[NextConfigAgent] Agent created successfully");
  return agent;
}

module.exports = {
  createNextConfigAgent,
  repoKnowledgeSchema,
};
