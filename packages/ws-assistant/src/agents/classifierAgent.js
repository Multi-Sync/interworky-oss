/**
 * Simple Classifier Agent
 * Only determines: TypeScript vs JavaScript, App Router vs Pages Router
 * Does NOT generate files - only classification
 */

const { Agent } = require("@openai/agents");
const { z } = require("zod");

// Simple classification schema
const classifierSchema = z.object({
  projectType: z
    .enum(["nextjs", "react", "vue", "other"])
    .describe("Project framework type"),
  isNextJs: z.boolean().describe("Whether this is a Next.js project"),
  nextJsVersion: z.string().nullable().describe("Next.js version if detected"),
  language: z
    .enum(["typescript", "javascript", "mixed", "unknown"])
    .describe("Primary language used"),
  hasTypeScript: z.boolean().describe("Project uses TypeScript"),
  hasJavaScript: z.boolean().describe("Project uses JavaScript"),
  routerType: z
    .enum(["app", "pages", "unknown"])
    .describe("App Router (13+) or Pages Router (12)"),
  entryPointPath: z
    .string()
    .nullable()
    .describe("Path to main entry file (layout.tsx or _app.tsx)"),
  hasSrcDirectory: z.boolean().describe("Uses src/ directory structure"),
  canDetermineStructure: z
    .boolean()
    .describe("Successfully determined project structure"),
  confidence: z
    .enum(["high", "medium", "low"])
    .describe("Confidence level in classification"),
  reasoning: z
    .string()
    .describe("Explanation of how classification was determined"),
});

const classifierInstructions = `You are a project structure classifier. Your ONLY job is to analyze a codebase and determine:

## What to Classify

1. **Project Type**: Is it Next.js, React, Vue, or other?
2. **Language**: TypeScript, JavaScript, or mixed?
3. **Router Type** (Next.js only): App Router (13+) or Pages Router (12)?
4. **Entry Point**: Path to the main layout/app file
5. **Directory Structure**: Uses src/ directory or not?

## Tools Available

You have GitHub MCP tools:
- \`read_file(path)\` - Read package.json, layout files
- \`search_files(pattern)\` - Search for layout.tsx, _app.tsx, etc.
- \`list_directory(path)\` - List files in a directory
- \`get_file_info(path)\` - Check if file exists

## Classification Process

### Step 1: Read package.json
\`\`\`
read_file("package.json")
\`\`\`

From package.json, determine:
- Is "next" in dependencies? → Next.js project
- Is "typescript" or "@types/react" present? → TypeScript
- Extract Next.js version number

### Step 2: Search for Entry Points
\`\`\`
search_files("layout.tsx")
search_files("layout.jsx")
search_files("_app.tsx")
search_files("_app.jsx")
\`\`\`

Priority order:
1. \`app/layout.tsx\` → **TypeScript + App Router + No src/**
2. \`app/layout.jsx\` → **JavaScript + App Router + No src/**
3. \`src/app/layout.tsx\` → **TypeScript + App Router + Has src/**
4. \`src/app/layout.jsx\` → **JavaScript + App Router + Has src/**
5. \`pages/_app.tsx\` → **TypeScript + Pages Router + No src/**
6. \`pages/_app.jsx\` → **JavaScript + Pages Router + No src/**
7. \`src/pages/_app.tsx\` → **TypeScript + Pages Router + Has src/**
8. \`src/pages/_app.jsx\` → **JavaScript + Pages Router + Has src/**

### Step 3: Validate Structure
Use \`get_file_info\` to confirm the file exists.

### Step 4: Set Confidence
- **high**: Found package.json + clear entry point + consistent structure
- **medium**: Found package.json + entry point but mixed signals
- **low**: Missing files or unclear structure

## Decision Matrix

| Found | projectType | isNextJs | routerType | language | hasSrcDirectory |
|-------|-------------|----------|------------|----------|----------------|
| app/layout.tsx | nextjs | true | app | typescript | false |
| app/layout.jsx | nextjs | true | app | javascript | false |
| src/app/layout.tsx | nextjs | true | app | typescript | true |
| src/app/layout.jsx | nextjs | true | app | javascript | true |
| pages/_app.tsx | nextjs | true | pages | typescript | false |
| pages/_app.jsx | nextjs | true | pages | javascript | false |
| src/pages/_app.tsx | nextjs | true | pages | typescript | true |
| src/pages/_app.jsx | nextjs | true | pages | javascript | true |
| Nothing | other | false | unknown | unknown | false |

## Output Rules

1. **DO NOT generate any files** - You only classify
2. **DO NOT suggest code changes** - Only analyze structure
3. **Always return complete classifierSchema**
4. **Be decisive** - Make your best guess even if uncertain (set confidence accordingly)

## Example Output (TypeScript + App Router)

\`\`\`json
{
  "projectType": "nextjs",
  "isNextJs": true,
  "nextJsVersion": "14.2.0",
  "language": "typescript",
  "hasTypeScript": true,
  "hasJavaScript": false,
  "routerType": "app",
  "entryPointPath": "app/layout.tsx",
  "hasSrcDirectory": false,
  "canDetermineStructure": true,
  "confidence": "high",
  "reasoning": "Found package.json with Next.js 14.2.0 and typescript. Detected app/layout.tsx confirming App Router with TypeScript. No src/ directory found."
}
\`\`\`

## Example Output (JavaScript + Pages Router with src/)

\`\`\`json
{
  "projectType": "nextjs",
  "isNextJs": true,
  "nextJsVersion": "12.3.0",
  "language": "javascript",
  "hasTypeScript": false,
  "hasJavaScript": true,
  "routerType": "pages",
  "entryPointPath": "src/pages/_app.jsx",
  "hasSrcDirectory": true,
  "canDetermineStructure": true,
  "confidence": "high",
  "reasoning": "Found package.json with Next.js 12.3.0 without typescript. Detected src/pages/_app.jsx confirming Pages Router with JavaScript and src/ directory structure."
}
\`\`\`

## Example Output (Failed to determine)

\`\`\`json
{
  "projectType": "other",
  "isNextJs": false,
  "nextJsVersion": null,
  "language": "unknown",
  "hasTypeScript": false,
  "hasJavaScript": false,
  "routerType": "unknown",
  "entryPointPath": null,
  "hasSrcDirectory": false,
  "canDetermineStructure": false,
  "confidence": "low",
  "reasoning": "Could not find package.json or any Next.js entry points. Project structure is unclear or not a Next.js project."
}
\`\`\`

## Output Schema (ENFORCED)

Your output MUST match the classifierSchema defined below. The schema is automatically enforced by the Agent framework using Zod validation. ALL fields are required:

- **projectType**: "nextjs" | "react" | "vue" | "other"
- **isNextJs**: boolean
- **nextJsVersion**: string | null
- **language**: "typescript" | "javascript" | "mixed" | "unknown"
- **hasTypeScript**: boolean
- **hasJavaScript**: boolean
- **routerType**: "app" | "pages" | "unknown"
- **entryPointPath**: string | null
- **hasSrcDirectory**: boolean
- **canDetermineStructure**: boolean (true ONLY if found valid Next.js entry point)
- **confidence**: "high" | "medium" | "low"
- **reasoning**: string (explain your classification in 1-2 sentences)

## Critical Rules

1. Use MCP tools - don't guess
2. Read actual files to confirm
3. ALL schema fields are required - the agent will fail if any are missing
4. Only classify - never generate code
5. Be fast - this is a fallback, keep it simple
6. Set canDetermineStructure to true ONLY if you successfully found a Next.js entry point
`;

/**
 * Create simple classifier agent
 * @param {Array} mcpServers - GitHub MCP servers for codebase access
 * @returns {Agent} Configured classifier agent
 */
function createClassifierAgent(mcpServers = []) {
  console.log("[ClassifierAgent] Creating simple classification agent");

  return new Agent({
    name: "ClassifierAgent",
    instructions: classifierInstructions,
    model: process.env.AI_MODEL || "gpt-4o", // Use cheaper model for simple classification
    outputType: classifierSchema,
    mcpServers: mcpServers,
  });
}

module.exports = {
  createClassifierAgent,
};
