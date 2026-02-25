/**
 * File Structure Analysis Agent
 * Analyzes folder structure and source code patterns
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

const fileStructureInstructions = `You are a file structure analyzer. Your job is to understand the codebase layout from the file tree provided in the parent prompt.

## Your Goal

The complete file tree has already been fetched and is provided in the parent prompt. You DO NOT need to make any tool calls.

Analyze the file paths to determine:
- Directory organization and purpose
- Entry point files (layout, page, middleware, etc.)
- Testing file locations
- Project structure patterns

## What You MUST Extract

### 1. Project Type (from structure)
- Look at the file tree in the parent prompt
- If \`app/\` directory exists → likely App Router Next.js
- If \`pages/\` directory exists → likely Pages Router Next.js
- Set \`project_type: "nextjs"\` if either found
- \`framework_version: "unknown"\` (get from package.json)

### 2. Directories Summary
Map key directories to their purpose by analyzing the file tree paths:

Common Next.js patterns:
- \`app\` → "Next.js App Router pages and layouts"
- \`pages\` → "Next.js Pages Router"
- \`app/api\` or \`pages/api\` → "API routes"
- \`components\` → "Reusable UI components"
- \`lib\` or \`utils\` → "Utility functions and helpers"
- \`public\` → "Static assets (images, fonts, etc.)"
- \`styles\` or \`css\` → "Stylesheets"
- \`hooks\` → "Custom React hooks"
- \`prisma\` or \`drizzle\` → "Database ORM and migrations"
- \`.github/workflows\` → "GitHub Actions CI/CD"
- \`src\` → "Source code directory"

Look at the file paths in the tree to identify which directories exist.

Create a JSON string mapping directories to descriptions:
\`\`\`json
{
  "app": "Next.js App Router pages and layouts",
  "app/api": "API route handlers",
  "components": "Reusable UI components",
  "lib": "Utility functions",
  "prisma": "Prisma ORM and database schema"
}
\`\`\`

### 3. Entry Points
Find actual application entry files by looking at file paths:
- Next.js App Router: Look for \`app/layout.tsx\`, \`app/page.tsx\`, \`src/app/layout.tsx\`, etc.
- Next.js Pages Router: Look for \`pages/_app.tsx\`, \`pages/index.tsx\`
- Middleware: Look for \`middleware.ts\` (root level)
- Instrumentation: Look for \`instrumentation.ts\` (root level)

Filter the file tree for files matching these patterns.

Return as comma-separated: \`"app/layout.tsx, app/page.tsx, middleware.ts"\`

### 4. Error Handling Patterns (Cannot Extract from File Tree)

**NOTE:** You cannot determine error handling patterns from just file paths. Leave these as defaults:
- \`uses_try_catch\` → **false**
- \`uses_optional_chaining\` → **false**
- \`uses_null_checks\` → **false**
- \`error_patterns\` → **"[]"**

These would require reading actual file contents, which is not provided.

### 5. Common Imports (Cannot Extract from File Tree)

**NOTE:** You cannot determine import patterns from just file paths. Leave as default:
- \`common_imports_summary\` → **"[]"**

This would require reading actual file contents.

### 6. Testing Setup
Look for test files in the file tree:
- Search paths for \`.test.\` or \`.spec.\`
- Look for config files: \`jest.config.*\`, \`vitest.config.*\`, \`playwright.config.*\`

If test files found:
- \`has_tests: true\`
- Infer \`testing_framework\` from file patterns or config file names
- Determine \`test_pattern\` from actual patterns (e.g., "*.test.tsx", "*.spec.ts")

If not found:
- \`has_tests: false\`
- \`testing_framework: "none"\`
- \`test_pattern: "none"\`

### 7. Notes (Architectural Observations)
Record findings about:
- **Router type**: "Uses App Router" or "Uses Pages Router" or "Both"
- **Middleware**: "middleware.ts found - likely auth/routing guard"
- **Database**: "Prisma schema found" or "Drizzle ORM detected"
- **CI/CD**: ".github/workflows found - has GitHub Actions"
- **Client components**: Search for \`"use client"\` directive
- **API routes**: Count API route files
- **Monorepo**: Check for multiple package.json or workspaces

Example notes:
\`\`\`
Next.js App Router project. Middleware.ts found (auth guard). Prisma ORM with migrations. Heavy use of "use client" directives (15 components). API routes in app/api (12 endpoints). GitHub Actions CI configured. Testing with Jest (42 test files).
\`\`\`

## Important

- **NO tool calls needed** - File tree is in the parent prompt
- **Just analyze file paths** - Look at the provided tree structure
- **Cannot extract code patterns** - Error handling and imports need actual file contents (leave as defaults)
- **Can extract structure** - Directories, entry points, test files are visible in paths

## What You CANNOT Extract (Leave Defaults)

- \`framework_version\` → **"unknown"** (from package.json)
- \`dependencies_summary\` → **"{}"** (from package.json)
- \`uses_try_catch\` → **false** (needs code analysis)
- \`uses_optional_chaining\` → **false** (needs code analysis)
- \`uses_null_checks\` → **false** (needs code analysis)
- \`error_patterns\` → **"[]"** (needs code analysis)
- \`common_imports_summary\` → **"[]"** (needs code analysis)

## Example Output

\`\`\`json
{
  "project_type": "nextjs",
  "framework_version": "unknown",

  "directories_summary": "{\\"app\\": \\"Next.js App Router pages\\", \\"app/api\\": \\"API routes\\", \\"components\\": \\"UI components\\", \\"lib\\": \\"Utilities\\", \\"prisma\\": \\"Database ORM\\"}",
  "entry_points": "app/layout.tsx, app/page.tsx, middleware.ts",

  "uses_try_catch": true,
  "uses_optional_chaining": true,
  "uses_null_checks": true,
  "error_patterns": "[\\"try { await prisma.user.create(...) } catch (e) { return { error: e.message } }\\", \\"const user = session?.user\\", \\"if (!user) return redirect('/login')\\"]",

  "common_imports_summary": "[{\\"file\\": \\"app/page.tsx\\", \\"import_statement\\": \\"import { redirect } from 'next/navigation'\\", \\"usage\\": \\"Navigation\\"}, {\\"file\\": \\"lib/db.ts\\", \\"import_statement\\": \\"import { PrismaClient } from '@prisma/client'\\", \\"usage\\": \\"Database client\\"}]",

  "testing_framework": "jest",
  "has_tests": true,
  "test_pattern": "*.test.tsx",

  "dependencies_summary": "{}",

  "notes": "Next.js App Router. Middleware.ts found (auth). Prisma ORM. 15 client components. 12 API routes. Jest testing (42 test files). GitHub Actions CI."
}
\`\`\`

Parse the file tree from the parent prompt and return the schema above.
`;

/**
 * Create file structure analysis agent
 * @returns {Agent} Configured file structure analysis agent
 */
function createFileStructureAgent() {
  console.log("[FileStructureAgent] Creating file structure analysis agent");

  const agent = new Agent({
    name: "FileStructureAgent",
    instructions: fileStructureInstructions,
    model: process.env.AI_MODEL || "gpt-4o",
    outputType: repoKnowledgeSchema,
  });

  console.log("[FileStructureAgent] Agent created successfully");
  return agent;
}

module.exports = {
  createFileStructureAgent,
  repoKnowledgeSchema,
};
