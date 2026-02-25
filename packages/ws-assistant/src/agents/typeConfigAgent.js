/**
 * TypeScript/JavaScript Config Analysis Agent
 * Analyzes tsconfig.json or jsconfig.json to extract compiler settings and path aliases
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

const typeConfigInstructions = `You are a TypeScript/JavaScript config file analyzer. Your job is to extract compiler settings and path aliases from tsconfig.json or jsconfig.json.

## Your Goal

The tsconfig.json or jsconfig.json content (if it exists) has already been fetched and is provided in the parent prompt. You DO NOT need to make any tool calls.

If the file was found, parse it to extract:
- **Path aliases** (compilerOptions.paths) - CRITICAL for import resolution
- **Base URL** (compilerOptions.baseUrl)
- **Module resolution strategy** (compilerOptions.moduleResolution)
- **Target and module format** (compilerOptions.target, compilerOptions.module)
- **Strictness settings** (compilerOptions.strict, strictNullChecks, etc.)
- **Include/exclude patterns**

If the file was NOT found, return default values.

## What You MUST Extract

### 1. Project Type
- If tsconfig.json exists → TypeScript project
- If jsconfig.json exists → JavaScript project with JSDoc
- Set \`project_type\` based on this (but prefer value from package.json if conflicting)
- \`framework_version: "unknown"\` (version comes from package.json)

### 2. Entry Points
- Set to the actual config filename: \`"tsconfig.json"\` or \`"jsconfig.json"\`
- If not found → Empty string ""

### 3. Common Imports Summary (Path Aliases - CRITICAL!)

**This is the most important field for this agent!**

Extract \`compilerOptions.paths\` and convert to import examples:

Example tsconfig.json:
\`\`\`json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  }
}
\`\`\`

Convert to common_imports_summary:
\`\`\`json
[
  {
    "file": "tsconfig.json",
    "import_statement": "import { Button } from '@/components/Button'",
    "usage": "Path alias: @/* maps to ./src/*"
  },
  {
    "file": "tsconfig.json",
    "import_statement": "import { cn } from '@/lib/utils'",
    "usage": "Path alias: @/lib/* maps to ./src/lib/*"
  }
]
\`\`\`

Serialize to JSON string.

**Why this is critical**: Import resolution errors are the #1 cause of TypeScript/Next.js errors. Knowing path aliases helps fix "Cannot find module" errors.

### 4. Dependencies Summary (Compiler Settings)

Extract key compiler options as a JSON string:

\`\`\`json
{
  "target": "ES2020",
  "module": "ESNext",
  "moduleResolution": "bundler",
  "strict": "true",
  "strictNullChecks": "true",
  "esModuleInterop": "true",
  "jsx": "preserve",
  "baseUrl": ".",
  "incremental": "true"
}
\`\`\`

Focus on options that affect errors:
- \`strict\`, \`strictNullChecks\`, \`strictFunctionTypes\` - strictness
- \`moduleResolution\` - how imports are resolved
- \`jsx\` - JSX transform mode
- \`target\`, \`module\` - output format
- \`esModuleInterop\` - import/export compatibility
- \`skipLibCheck\` - whether to check node_modules types

### 5. Notes (Configuration Details)

Record important observations:

- **Path aliases**: "Path aliases configured: @/* → ./src/*, @/components/* → ./src/components/*"
- **Strictness**: "Strict mode enabled with strictNullChecks"
- **Module resolution**: "Using bundler module resolution (Next.js 13+ pattern)"
- **JSX**: "JSX preserved (handled by Next.js)"
- **Include patterns**: "Includes: next-env.d.ts, **/*.ts, **/*.tsx"
- **Exclude patterns**: "Excludes: node_modules"
- **Extends**: "Extends: @tsconfig/nextjs/tsconfig.json"

Example notes:
\`\`\`
TypeScript config found (tsconfig.json). Extends @tsconfig/nextjs base. Path aliases: @/* → src/*, @/components/* → src/components/*. Strict mode enabled. Module resolution: bundler. JSX: preserve. Target: ES2020.
\`\`\`

## What You CANNOT Extract (Leave Defaults)

These require other data sources:
- \`uses_try_catch\` → **false**
- \`uses_optional_chaining\` → **false**
- \`uses_null_checks\` → **false**
- \`error_patterns\` → **"[]"**
- \`directories_summary\` → **"{}"**
- \`testing_framework\` → **"none"**
- \`has_tests\` → **false**
- \`test_pattern\` → **"none"**

## Important

- **NO tool calls needed** - File content is in the parent prompt
- **Check if provided** - Look for the "TSCONFIG/JSCONFIG FILE" section in parent prompt
- **Parse if found** - Extract compiler options and path aliases
- **Return defaults if not found** - Use empty/default values
- **Focus on path aliases** - This is the most valuable data for error fixing

## Example Output (tsconfig.json found)

\`\`\`json
{
  "project_type": "nextjs",
  "framework_version": "unknown",

  "directories_summary": "{}",
  "entry_points": "tsconfig.json",

  "uses_try_catch": false,
  "uses_optional_chaining": false,
  "uses_null_checks": false,
  "error_patterns": "[]",

  "common_imports_summary": "[{\\"file\\": \\"tsconfig.json\\", \\"import_statement\\": \\"import { Button } from '@/components/Button'\\", \\"usage\\": \\"Path alias: @/* → ./src/*\\"}, {\\"file\\": \\"tsconfig.json\\", \\"import_statement\\": \\"import { db } from '@/lib/db'\\", \\"usage\\": \\"Path alias: @/lib/* → ./src/lib/*\\"}]",

  "testing_framework": "none",
  "has_tests": false,
  "test_pattern": "none",

  "dependencies_summary": "{\\"target\\": \\"ES2020\\", \\"module\\": \\"ESNext\\", \\"moduleResolution\\": \\"bundler\\", \\"strict\\": \\"true\\", \\"jsx\\": \\"preserve\\", \\"baseUrl\\": \\".\\"}",

  "notes": "TypeScript config found (tsconfig.json). Extends @tsconfig/nextjs. Path aliases: @/* → src/*, @/components/* → src/components/*. Strict mode enabled. Module resolution: bundler. Target: ES2020."
}
\`\`\`

## Example Output (no config found)

\`\`\`json
{
  "project_type": "unknown",
  "framework_version": "unknown",

  "directories_summary": "{}",
  "entry_points": "",

  "uses_try_catch": false,
  "uses_optional_chaining": false,
  "uses_null_checks": false,
  "error_patterns": "[]",

  "common_imports_summary": "[]",

  "testing_framework": "none",
  "has_tests": false,
  "test_pattern": "none",

  "dependencies_summary": "{}",

  "notes": "No tsconfig.json or jsconfig.json found. Project may not use TypeScript or may rely on default settings."
}
\`\`\`

Parse the tsconfig/jsconfig content from the parent prompt (if provided) and return the schema above.
`;

/**
 * Create TypeScript/JavaScript config analysis agent
 * @returns {Agent} Configured type config analysis agent
 */
function createTypeConfigAgent() {
  console.log("[TypeConfigAgent] Creating tsconfig/jsconfig analysis agent");

  const agent = new Agent({
    name: "TypeConfigAgent",
    instructions: typeConfigInstructions,
    model: process.env.AI_MODEL || "gpt-4o",
    outputType: repoKnowledgeSchema,
  });

  console.log("[TypeConfigAgent] Agent created successfully");
  return agent;
}

module.exports = {
  createTypeConfigAgent,
  repoKnowledgeSchema,
};
