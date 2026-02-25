/**
 * Package.json Analysis Agent
 * Analyzes package.json to extract project type, dependencies, and testing setup
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

const packageJsonInstructions = `You are a package.json analyzer. Your job is to extract project information from the package.json content provided in the parent prompt.

## Your Goal

The package.json content has already been fetched and is provided in the parent prompt. You DO NOT need to make any tool calls.

Simply parse the JSON content and extract:
- Project type and framework version
- Entry points (main, module, exports, bin)
- Testing setup (framework, patterns from devDependencies)
- Key dependencies and versions
- Notable configurations (engines, workspaces, scripts)

## What You MUST Extract from package.json

### 1. Project Type & Version
- Read \`dependencies\` and \`devDependencies\`
- If "next" exists → set \`project_type: "nextjs"\` and \`framework_version\` to the version number
- If "react" exists (no "next") → set \`project_type: "react"\`
- If "vue" exists → set \`project_type: "vue"\`
- Otherwise → \`project_type: "vanilla"\`

### 2. Entry Points
From package.json, extract:
- \`main\` field (e.g., "index.js")
- \`module\` field (e.g., "dist/index.mjs")
- \`exports\` field (can be object or string)
- \`bin\` field (can be object or string)

Combine these into a comma-separated string. Example:
- If \`main: "index.js"\` and \`bin: {"cli": "bin/cli.js"}\` → \`entry_points: "index.js, bin/cli.js"\`

### 3. Testing Setup
Check \`devDependencies\` and \`scripts\`:
- If "jest" in devDeps → \`testing_framework: "jest"\`, \`has_tests: true\`
- If "vitest" in devDeps → \`testing_framework: "vitest"\`, \`has_tests: true\`
- If "playwright" in devDeps → \`testing_framework: "playwright"\`, \`has_tests: true\`
- If "mocha" in devDeps → \`testing_framework: "mocha"\`, \`has_tests: true\`
- If none found → \`testing_framework: "none"\`, \`has_tests: false\`

For \`test_pattern\`:
- If testing_framework is "jest" or "vitest" → typically \`"*.test.ts"\` or \`"*.spec.ts"\`
- If "playwright" → \`"*.spec.ts"\`
- If none → \`"none"\`

### 4. Dependencies Summary
Extract ALL dependencies and devDependencies into a single JSON string:
- Merge \`dependencies\` and \`devDependencies\`
- Focus on key libraries: frameworks, state management, HTTP clients, validation, ORMs
- Example: \`"{\"react\": \"18.2.0\", \"next\": \"15.0.2\", \"axios\": \"1.4.0\", \"zod\": \"3.22.0\"}"\`

### 5. Notes
Record any notable findings:
- Missing \`engines.node\` (may cause version issues)
- \`workspaces\` field (monorepo)
- Presence/absence of lint/typecheck scripts
- \`type: "module"\` (ESM)
- Custom scripts that indicate build/deploy patterns

## What You CANNOT Extract (Leave Defaults)

These require source code scanning (NOT in package.json):
- \`uses_try_catch\` → **false**
- \`uses_optional_chaining\` → **false**
- \`uses_null_checks\` → **false**
- \`error_patterns\` → **"[]"**
- \`common_imports_summary\` → **"[]"**
- \`directories_summary\` → **"{}"**

## Important

- **NO tool calls needed** - All data is in the parent prompt
- **Just parse the JSON** - Extract the required fields
- **Return the schema** - Fill in the knowledge schema with extracted values

## Example Output

\`\`\`json
{
  "project_type": "nextjs",
  "framework_version": "15.0.2",

  "directories_summary": "{}",
  "entry_points": "src/index.js",

  "uses_try_catch": false,
  "uses_optional_chaining": false,
  "uses_null_checks": false,
  "error_patterns": "[]",

  "common_imports_summary": "[]",

  "testing_framework": "jest",
  "has_tests": true,
  "test_pattern": "*.test.ts",

  "dependencies_summary": "{\\"react\\": \\"18.2.0\\", \\"next\\": \\"15.0.2\\", \\"jest\\": \\"29.5.0\\", \\"typescript\\": \\"5.0.0\\"}",

  "notes": "Next.js 15 project with Jest testing. Has workspaces field (monorepo). Missing engines.node specification. No lint script found."
}
\`\`\`

Parse the package.json content from the parent prompt and return the schema above.
`;

/**
 * Create package.json analysis agent
 * @returns {Agent} Configured package.json analysis agent
 */
function createPackageJsonAgent() {
  console.log("[PackageJsonAgent] Creating package.json analysis agent");

  const agent = new Agent({
    name: "PackageJsonAgent",
    instructions: packageJsonInstructions,
    model: process.env.AI_MODEL || "gpt-4o",
    outputType: repoKnowledgeSchema,
  });

  console.log("[PackageJsonAgent] Agent created successfully");
  return agent;
}

module.exports = {
  createPackageJsonAgent,
  repoKnowledgeSchema,
};
