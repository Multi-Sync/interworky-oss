/**
 * Repository Analysis Agent (Orchestrator)
 * Coordinates 4 specialized agents to analyze repository structure and patterns
 * Uses agents-as-tools pattern for modular analysis
 */

const { Agent } = require("@openai/agents");
const { z } = require("zod");
const { createPackageJsonAgent } = require("./packageJsonAgent");
const { createNextConfigAgent } = require("./nextConfigAgent");
const { createTypeConfigAgent } = require("./typeConfigAgent");
const { createFileStructureAgent } = require("./fileStructureAgent");

// Repository knowledge schema (same as specialized agents)
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

const orchestratorInstructions = `You are a repository analysis orchestrator. You coordinate 4 specialized agents to build a complete knowledge base.

## Your Role

You have access to 4 specialized analysis tools:
1. **analyze_package_json** - Extracts project type, dependencies, testing framework from package.json
2. **analyze_next_config** - Extracts Next.js configuration details from next.config files
3. **analyze_type_config** - Extracts path aliases and compiler settings from tsconfig/jsconfig
4. **analyze_file_structure** - Analyzes directory structure and source code patterns

## Your Task

Call ALL 4 tools to gather comprehensive repository knowledge, then combine their outputs into a single, complete result.

### Step 1: Call All 4 Agents

You MUST call all 4 tools:

\`\`\`
analyze_package_json()
analyze_next_config()
analyze_type_config()
analyze_file_structure()
\`\`\`

Each agent returns the same schema structure but focuses on different aspects.

### Step 2: Merge Results Intelligently

After receiving all 4 outputs, merge them using these rules:

**project_type & framework_version:**
- Priority: packageJsonAgent > typeConfigAgent > fileStructureAgent > nextConfigAgent
- Use the most specific value (e.g., "nextjs" over "unknown")

**directories_summary:**
- Use fileStructureAgent's output (it's the only one that analyzes directories)

**entry_points:**
- Combine ALL entry points from all agents (comma-separated, deduplicated)
- Example: package.json gives "index.js", nextConfig gives "next.config.ts", typeConfig gives "tsconfig.json", fileStructure gives "app/layout.tsx"
- Merged: "index.js, next.config.ts, tsconfig.json, app/layout.tsx"

**uses_try_catch, uses_optional_chaining, uses_null_checks:**
- All agents return false (defaults) - file tree analysis cannot extract code patterns
- Leave as false

**error_patterns:**
- All agents return "[]" (empty) - file tree analysis cannot extract code patterns
- Leave as "[]"

**common_imports_summary:**
- **CRITICAL**: Merge imports from typeConfigAgent, nextConfigAgent, and fileStructureAgent
- **typeConfigAgent**: Path aliases (e.g., "@/* → ./src/*") - MOST IMPORTANT for import resolution!
- nextConfigAgent: Config file imports (plugins)
- fileStructureAgent: Returns "[]" (cannot extract from file tree)
- Combine all JSON arrays into one, prioritizing typeConfigAgent's path aliases

**testing_framework, has_tests, test_pattern:**
- Priority: fileStructureAgent > packageJsonAgent
- fileStructureAgent checks actual test files in tree
- packageJsonAgent infers from devDependencies

**dependencies_summary:**
- Merge packageJsonAgent (actual dependencies) with typeConfigAgent (compiler options)
- packageJsonAgent: npm dependencies with versions
- typeConfigAgent: compiler settings (target, module, strict, etc.)
- Combine both JSON objects

**notes:**
- Concatenate notes from ALL 4 agents
- Format: "PackageJson: ... | NextConfig: ... | TypeConfig: ... | FileStructure: ..."

### Step 3: Return Final Merged Output

Return the combined knowledge following the \`repoKnowledgeSchema\`.

## Example Workflow

\`\`\`
1. Call analyze_package_json()
   → Returns: { project_type: "nextjs", framework_version: "15.0.2", dependencies_summary: "{...}", testing_framework: "jest", ... }

2. Call analyze_next_config()
   → Returns: { project_type: "nextjs", entry_points: "next.config.ts", common_imports_summary: "[{...}]", notes: "..." }

3. Call analyze_type_config()
   → Returns: { entry_points: "tsconfig.json", common_imports_summary: "[{path aliases}]", dependencies_summary: "{compiler opts}", notes: "..." }

4. Call analyze_file_structure()
   → Returns: { directories_summary: "{...}", entry_points: "app/layout.tsx, app/page.tsx", has_tests: true, ... }

5. Merge results:
   {
     "project_type": "nextjs",  // from packageJson
     "framework_version": "15.0.2",  // from packageJson
     "directories_summary": "{...}",  // from fileStructure
     "entry_points": "next.config.ts, tsconfig.json, app/layout.tsx, app/page.tsx",  // combined from all
     "uses_try_catch": false,  // all agents return false
     "uses_optional_chaining": false,  // all agents return false
     "uses_null_checks": false,  // all agents return false
     "error_patterns": "[]",  // all agents return empty
     "common_imports_summary": "[{path aliases from typeConfig}, {config imports from nextConfig}]",  // merged, prioritize path aliases!
     "testing_framework": "jest",  // from fileStructure or packageJson
     "has_tests": true,  // from fileStructure or packageJson
     "test_pattern": "*.test.ts",  // from fileStructure or packageJson
     "dependencies_summary": "{npm deps + compiler options}",  // merged from packageJson + typeConfig
     "notes": "PackageJson: Next.js 15 with Jest | NextConfig: Standalone output | TypeConfig: Path aliases @/* | FileStructure: App Router"
   }
\`\`\`

## Important

- **Always call ALL 4 tools** - don't skip any
- **Merge intelligently** - use the most accurate/specific value for each field
- **Prioritize path aliases** - typeConfig's path aliases are CRITICAL for import resolution errors
- **Combine lists** - for entry_points, common_imports_summary, notes
- **Preserve JSON strings** - ensure proper escaping in JSON string fields

Start now by calling all 4 analysis tools.
`;

/**
 * Create repository analysis orchestrator agent
 * @returns {Agent} Configured orchestrator agent with 4 specialized agents as tools
 */
function createRepoAnalysisAgent() {
  console.log(
    "[RepoAnalysisAgent] Creating orchestrator agent with 4 specialized agents",
  );

  // Create specialized agents (no MCP needed - data is pre-fetched and passed in prompts)
  const packageJsonAgent = createPackageJsonAgent();
  const nextConfigAgent = createNextConfigAgent();
  const typeConfigAgent = createTypeConfigAgent();
  const fileStructureAgent = createFileStructureAgent();

  console.log("[RepoAnalysisAgent] Specialized agents created:");
  console.log(
    "  - PackageJsonAgent (analyzes package.json content from prompt)",
  );
  console.log("  - NextConfigAgent (analyzes next.config content from prompt)");
  console.log(
    "  - TypeConfigAgent (analyzes tsconfig/jsconfig content - extracts path aliases!)",
  );
  console.log("  - FileStructureAgent (analyzes file tree from prompt)");

  // Create orchestrator agent with specialized agents as tools
  const orchestratorAgent = new Agent({
    name: "RepoAnalysisOrchestrator",
    instructions: orchestratorInstructions,
    model: process.env.AI_MODEL || "gpt-4o",
    outputType: repoKnowledgeSchema,
    tools: [
      packageJsonAgent.asTool({
        toolName: "analyze_package_json",
        toolDescription:
          "Analyzes the package.json content provided in the parent prompt. Extracts project type, framework version, dependencies, and testing setup. Returns repository knowledge schema with package.json-specific fields populated.",
        runOptions: {
          maxTurns: 2,
        },
      }),
      nextConfigAgent.asTool({
        toolName: "analyze_next_config",
        toolDescription:
          "Analyzes the next.config file content provided in the parent prompt. Extracts Next.js configuration, plugins, and deployment settings. Returns repository knowledge schema with config-specific fields populated.",
        runOptions: {
          maxTurns: 2,
        },
      }),
      typeConfigAgent.asTool({
        toolName: "analyze_type_config",
        toolDescription:
          "Analyzes the tsconfig.json or jsconfig.json content provided in the parent prompt. Extracts CRITICAL path aliases (e.g., @/* → ./src/*) for import resolution, plus compiler settings. Returns repository knowledge schema with path alias mappings in common_imports_summary.",
        runOptions: {
          maxTurns: 2,
        },
      }),
      fileStructureAgent.asTool({
        toolName: "analyze_file_structure",
        toolDescription:
          "Analyzes the file tree provided in the parent prompt. Extracts directory organization, entry points, and identifies patterns from file paths. Returns repository knowledge schema with structure fields populated.",
        runOptions: {
          maxTurns: 3,
        },
      }),
    ],
  });

  console.log("[RepoAnalysisAgent] Orchestrator agent created with 4 tools");
  return orchestratorAgent;
}

module.exports = {
  createRepoAnalysisAgent,
  repoKnowledgeSchema,
};
