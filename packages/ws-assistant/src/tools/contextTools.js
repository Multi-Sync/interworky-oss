/**
 * Context Gathering Tools
 * Domain-aware tools for understanding Next.js projects before making changes
 */

const { tool } = require("@openai/agents");
const { z } = require("zod");

/**
 * Create context gathering tools for Next.js projects
 * These tools help agents understand the project structure before suggesting changes
 * @param {Array} mcpServers - MCP servers for GitHub access
 * @returns {Array} Context gathering tools
 */
function createContextTools(mcpServers = []) {
  return [
    // ==================== PROJECT SCANNER ====================
    tool({
      name: "scan_nextjs_project",
      description: `Scan and analyze a Next.js project structure to understand:
- Next.js version and configuration
- App Router vs Pages Router
- TypeScript setup
- File structure and conventions
- Installed dependencies
- Build configuration

Use this FIRST when analyzing or fixing any Next.js code to build context.

Returns comprehensive project metadata for making informed decisions.`,
      parameters: z.object({
        includePackageInfo: z
          .boolean()
          .default(true)
          .describe("Include package.json analysis"),
        includeConfig: z
          .boolean()
          .default(true)
          .describe("Include next.config.js analysis"),
        includeStructure: z
          .boolean()
          .default(true)
          .describe("Map directory structure"),
      }),
      execute: async (input) => {
        console.log("\n========== PROJECT SCANNER CALLED ==========");
        console.log("[ProjectScanner] Scanning Next.js project structure...");

        // Since this tool needs file content, return instructions for repoAgent
        const filesToRead = [];

        if (input.includePackageInfo) {
          filesToRead.push("package.json");
        }
        if (input.includeConfig) {
          filesToRead.push(
            "next.config.js",
            "next.config.mjs",
            "next.config.ts",
          );
        }

        console.log(
          `[ProjectScanner] Need to read ${filesToRead.length} files`,
        );
        console.log("========== PROJECT SCANNER FINISHED ==========\n");

        return JSON.stringify({
          success: true,
          requiresRepoAgent: true,
          instructions: {
            message: "Use analyze_repository tool to gather project context",
            task: "Read the following files to understand project structure",
            files: filesToRead,
            additionalScans: input.includeStructure
              ? ["List directories: app/, src/, components/, lib/, pages/"]
              : [],
          },
          whatToLookFor: {
            packageJson: [
              "Next.js version (check dependencies.next)",
              "TypeScript usage (check devDependencies.typescript)",
              "Key dependencies (react, tailwind, etc.)",
            ],
            nextConfig: [
              "Image optimization settings",
              "Webpack customizations",
              "Environment variables",
              "Redirects and rewrites",
            ],
            structure: [
              "App Router (app/) vs Pages Router (pages/)",
              "Source directory (src/ vs root)",
              "Components organization",
              "API routes location",
            ],
          },
          recommendations: [
            "After gathering context, match existing conventions",
            "Follow project TypeScript/JavaScript choice",
            "Respect folder structure patterns",
            "Use same styling approach (CSS modules, Tailwind, etc.)",
          ],
        });
      },
    }),

    // ==================== FILE BATCH READER ====================
    tool({
      name: "read_files_batch",
      description: `Read multiple files in parallel for efficient context gathering.

Instead of reading files one-by-one:
read_file("a.js") → read_file("b.js") → read_file("c.js")

Use this to read all at once:
read_files_batch(["a.js", "b.js", "c.js"])

Significantly faster for gathering comprehensive context.`,
      parameters: z.object({
        filePaths: z.array(z.string()).describe("Array of file paths to read"),
        maxFiles: z
          .number()
          .default(10)
          .describe("Maximum files to read (safety limit)"),
      }),
      execute: async (input) => {
        console.log("\n========== BATCH FILE READER CALLED ==========");
        console.log(
          `[BatchReader] Request to read ${input.filePaths.length} files...`,
        );

        const filesToRead = input.filePaths.slice(0, input.maxFiles);

        console.log(
          `[BatchReader] Will read ${filesToRead.length} files (max: ${input.maxFiles})`,
        );
        console.log("========== BATCH FILE READER FINISHED ==========\n");

        return JSON.stringify({
          success: true,
          requiresRepoAgent: true,
          instructions: {
            message: "Use analyze_repository tool to read multiple files",
            task: `Read ${filesToRead.length} files in batch`,
            files: filesToRead,
            tip: "The repoAgent can read multiple files efficiently using its search capabilities",
          },
          filesRequested: filesToRead,
          recommendation:
            "After reading, provide file contents back to the tool that requested them",
        });
      },
    }),

    // ==================== DEPENDENCY ANALYZER ====================
    tool({
      name: "analyze_component_dependencies",
      description: `Analyze what files depend on a given component or module.

Useful before making changes to understand impact:
- What imports this component?
- What would break if we change it?
- Where is it used in the app?

Helps prevent breaking changes.`,
      parameters: z.object({
        targetFile: z
          .string()
          .describe("File path to analyze dependencies for"),
        searchDepth: z
          .enum(["direct", "transitive"])
          .default("direct")
          .describe("Search only direct imports or full dependency tree"),
      }),
      execute: async (input) => {
        console.log("\n========== DEPENDENCY ANALYZER CALLED ==========");
        console.log(
          `[DependencyAnalyzer] Analyzing dependencies for ${input.targetFile}...`,
        );

        // Extract filename without extension and path for search
        const fileName = input.targetFile
          .split("/")
          .pop()
          .replace(/\.(tsx?|jsx?)$/, "");

        // Generate possible import patterns
        const importPatterns = [
          `from ['"].*${input.targetFile}['"]`,
          `from ['"].*${fileName}['"]`,
          `import.*${fileName}`,
        ];

        console.log(
          "[DependencyAnalyzer] Generated search patterns for imports",
        );
        console.log("========== DEPENDENCY ANALYZER FINISHED ==========\n");

        return JSON.stringify({
          success: true,
          requiresRepoAgent: true,
          instructions: {
            message:
              "Use analyze_repository with search_code to find dependencies",
            task: `Search for files that import from ${input.targetFile}`,
            searchPatterns: importPatterns,
            searchType:
              input.searchDepth === "direct"
                ? "Direct imports only"
                : "Full dependency tree",
          },
          analysis: {
            targetFile: input.targetFile,
            whatToSearchFor: [
              `Files importing: ${fileName}`,
              `Import statements referencing: ${input.targetFile}`,
              "Both default and named imports",
            ],
            impactAssessment: [
              "0-2 usages: Low impact - safe to modify",
              "3-10 usages: Medium impact - review changes carefully",
              "10+ usages: High impact - add comprehensive tests",
            ],
          },
          nextSteps: [
            "After finding dependent files, review each usage",
            "Check if changes would break dependent code",
            "Add tests for high-impact changes",
            "Consider creating PR with all affected files",
          ],
        });
      },
    }),
  ];
}

module.exports = {
  createContextTools,
};
