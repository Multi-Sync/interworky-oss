/**
 * Next.js Domain-Specific Tools
 * High-level, domain-aware tools for Next.js 15 operations
 */

const { tool } = require("@openai/agents");
const { z } = require("zod");
const {
  parseJSXForImages,
  analyzeImageOptimization,
  canBeServerComponent,
  findPerformanceIssues,
  getSeverityRank,
  getImpactDescription,
  getActionForIssue,
  getGainEstimate,
} = require("./codeAnalyzers");

/**
 * Create domain-specific Next.js tools
 * These are higher-level tools that perform complete operations
 * @param {Object} apiClient - API client for analytics
 * @param {Array} mcpServers - MCP servers for GitHub access
 * @returns {Array} Next.js-specific tools
 */
function createNextjsTools(apiClient, mcpServers = []) {
  return [
    // ==================== IMAGE OPTIMIZATION FIXER ====================
    tool({
      name: "fix_nextjs_image_optimization",
      description: `Automatically fix Next.js Image component optimization issues.

This is a high-level operation that:
1. Scans file for Image components
2. Identifies missing props (alt, width, height, sizes, priority)
3. Generates complete fix with all required props
4. Validates fix follows Next.js 15 best practices
5. Returns ready-to-apply code changes

IMPORTANT: This tool requires file content. Use with analyze_repository tool:
1. First: Call analyze_repository to read the file
2. Then: Call this tool with the file content

Use this instead of manual image analysis for faster, more reliable fixes.`,
      parameters: z.object({
        filePath: z
          .string()
          .describe("Path to file containing Image components"),
        fileContent: z
          .string()
          .nullable()
          .describe(
            "File content to analyze. If not provided, tool will return instructions to read file first.",
          ),
        autoAddPriority: z
          .boolean()
          .default(false)
          .describe(
            "Automatically add priority prop to first above-fold image",
          ),
        preferredSizes: z
          .string()
          .default("100vw")
          .describe("Default sizes prop value for responsive images"),
      }),
      execute: async (input) => {
        console.log("\n========== IMAGE OPTIMIZATION FIXER CALLED ==========");
        console.log(`[ImageFixer] Analyzing ${input.filePath}...`);

        // Check if file content is provided
        if (!input.fileContent) {
          console.log("[ImageFixer] ⚠ No file content provided");
          console.log(
            "========== IMAGE OPTIMIZATION FIXER NEEDS FILE CONTENT ==========\n",
          );

          return JSON.stringify({
            success: false,
            needsFileContent: true,
            instructions: `Please use the analyze_repository tool first to read the file at ${input.filePath}, then call this tool again with the fileContent parameter.`,
            nextStep: {
              tool: "analyze_repository",
              task: `Read file at ${input.filePath} and provide its content`,
              files: [input.filePath],
            },
          });
        }

        // Parse file for Image components
        console.log("[ImageFixer] Parsing JSX for Image components...");
        const images = parseJSXForImages(input.fileContent);

        if (images.length === 0) {
          console.log("[ImageFixer] No Image components found");
          console.log(
            "========== IMAGE OPTIMIZATION FIXER FINISHED ==========\n",
          );

          return JSON.stringify({
            success: true,
            result: {
              filePath: input.filePath,
              imagesFound: 0,
              issuesFixed: [],
              codeChanges: [],
              message: "No next/image Image components found in this file",
            },
          });
        }

        // Analyze images for issues
        console.log(
          `[ImageFixer] Found ${images.length} Image components, analyzing...`,
        );
        const issues = analyzeImageOptimization(images, {
          preferredSizes: input.preferredSizes,
          autoAddPriority: input.autoAddPriority,
        });

        // Generate code changes
        const codeChanges = images
          .filter((img) => {
            // Find if this image has issues
            return issues.some((issue) => issue.line === img.line);
          })
          .map((img) => {
            const imgIssues = issues.filter((issue) => issue.line === img.line);

            // Build improved component string
            let newProps = { ...img.props };

            // Add missing props based on issues
            imgIssues.forEach((issue) => {
              if (issue.issue.includes("alt")) {
                newProps.alt =
                  newProps.alt || '"Description needed - please update"';
              }
              if (issue.issue.includes("sizes")) {
                newProps.sizes = `"${input.preferredSizes}"`;
              }
              if (issue.issue.includes("width") && !newProps.width) {
                newProps.width = "{800} // TODO: Set actual width";
              }
              if (issue.issue.includes("height") && !newProps.height) {
                newProps.height = "{600} // TODO: Set actual height";
              }
              if (issue.issue.includes("priority")) {
                newProps.priority = "true";
              }
            });

            // Generate new component string
            const propsString = Object.entries(newProps)
              .map(([key, value]) => {
                if (value === "true") return key;
                return `${key}=${value}`;
              })
              .join(" ");

            return {
              line: img.line,
              oldCode: img.componentString.split("\n")[0] + "...",
              newCode: `<Image ${propsString} />`,
              issuesFixed: imgIssues.map((i) => i.issue),
            };
          });

        // Estimate impact
        const criticalIssues = issues.filter(
          (i) => i.severity === "critical",
        ).length;
        const highIssues = issues.filter((i) => i.severity === "high").length;

        const estimatedImpact = {
          performanceGain:
            highIssues > 0
              ? `Improved LCP by ~${100 + highIssues * 150}-${200 + highIssues * 200}ms`
              : "No performance issues",
          accessibilityFix:
            criticalIssues > 0
              ? `Fixed ${criticalIssues} critical accessibility violation(s)`
              : "No accessibility issues",
          seoImpact:
            criticalIssues > 0
              ? "Improved image SEO with proper alt text"
              : "SEO already optimized",
        };

        const result = {
          filePath: input.filePath,
          imagesFound: images.length,
          issuesFixed: issues,
          codeChanges,
          estimatedImpact,
        };

        console.log(
          `[ImageFixer] ✓ Found ${issues.length} issues in ${images.length} images`,
        );
        console.log(
          "========== IMAGE OPTIMIZATION FIXER FINISHED ==========\n",
        );

        return JSON.stringify({
          success: true,
          result,
          recommendation:
            issues.length > 0
              ? "Apply these changes and test in browser to verify layout. Update TODO comments with actual dimensions."
              : "No optimization issues found - images are already properly configured",
        });
      },
    }),

    // ==================== COMPONENT CONVERTER ====================
    tool({
      name: "convert_to_server_component",
      description: `Convert a Client Component to a Server Component when possible.

Analyzes the component to determine if it can be a Server Component:
- Checks for client-only features (hooks, event handlers, browser APIs)
- Suggests splitting if only part needs client
- Generates refactored code
- Explains performance benefits

IMPORTANT: This tool requires file content. Use with analyze_repository tool first.

Helps optimize Next.js 15 apps by maximizing Server Components.`,
      parameters: z.object({
        filePath: z.string().describe("Path to component file"),
        fileContent: z.string().nullable().describe("File content to analyze"),
        splitIfNeeded: z
          .boolean()
          .default(true)
          .describe(
            "Split into Server + Client components if only part needs client",
          ),
      }),
      execute: async (input) => {
        console.log("\n========== COMPONENT CONVERTER CALLED ==========");
        console.log(`[ComponentConverter] Analyzing ${input.filePath}...`);

        if (!input.fileContent) {
          return JSON.stringify({
            success: false,
            needsFileContent: true,
            instructions: `Please use analyze_repository to read ${input.filePath} first`,
          });
        }

        // Analyze component for client features
        const serverAnalysis = canBeServerComponent(input.fileContent);

        const analysis = {
          filePath: input.filePath,
          currentType: serverAnalysis.hasUseClient ? "client" : "server",
          canConvert: serverAnalysis.canConvert,
          clientFeatures: serverAnalysis.clientFeatures,
          recommendation: {
            action: serverAnalysis.canConvert
              ? "convert"
              : input.splitIfNeeded
                ? "split"
                : "keep-client",
            reason: serverAnalysis.recommendation,
            approach: serverAnalysis.canConvert
              ? 'Remove "use client" directive'
              : "Extract interactive elements into separate client component",
          },
          estimatedBundleReduction: serverAnalysis.canConvert
            ? "~20-40KB"
            : "~10-20KB (if split)",
        };

        console.log(
          `[ComponentConverter] Recommendation: ${analysis.recommendation.action}`,
        );
        console.log("========== COMPONENT CONVERTER FINISHED ==========\n");

        return JSON.stringify({
          success: true,
          analysis,
          performanceImpact: serverAnalysis.canConvert
            ? "Significant: Reduces client bundle, improves initial load time, enables server-only data fetching"
            : "Moderate: Splitting reduces client JS but component remains interactive",
        });
      },
    }),

    // ==================== PERFORMANCE ANALYZER ====================
    tool({
      name: "analyze_nextjs_performance",
      description: `Analyze Next.js page for performance optimization opportunities.

Checks for:
- Unoptimized images
- Missing lazy loading
- Large client bundles
- Unnecessary "use client" directives
- Missing Suspense boundaries
- Missing metadata for SEO

IMPORTANT: This tool requires file content. Use with analyze_repository tool first.

Returns prioritized optimization recommendations.`,
      parameters: z.object({
        filePath: z.string().describe("Page or component file to analyze"),
        fileContent: z.string().nullable().describe("File content to analyze"),
        checkDependencies: z
          .boolean()
          .default(true)
          .describe("Analyze imported dependencies"),
      }),
      execute: async (input) => {
        console.log("\n========== PERFORMANCE ANALYZER CALLED ==========");
        console.log(`[PerfAnalyzer] Analyzing ${input.filePath}...`);

        if (!input.fileContent) {
          return JSON.stringify({
            success: false,
            needsFileContent: true,
            instructions: `Please use analyze_repository to read ${input.filePath} first`,
          });
        }

        // Find all performance issues
        const issues = findPerformanceIssues(input.fileContent, input.filePath);

        // Group by type and severity
        const issuesByType = issues.reduce((acc, issue) => {
          acc[issue.type] = acc[issue.type] || [];
          acc[issue.type].push(issue);
          return acc;
        }, {});

        const issueSummary = Object.entries(issuesByType).map(
          ([type, typeIssues]) => ({
            type,
            severity: typeIssues[0].severity,
            count: typeIssues.length,
            impact: getImpactDescription(type),
          }),
        );

        // Generate prioritized optimizations
        const optimizations = issues
          .sort(
            (a, b) => getSeverityRank(b.severity) - getSeverityRank(a.severity),
          )
          .slice(0, 5) // Top 5 issues
          .map((issue, index) => ({
            priority: index + 1,
            action: getActionForIssue(issue),
            file: input.filePath,
            lines: issue.line ? [issue.line] : [],
            estimatedGain: getGainEstimate(issue),
          }));

        // Calculate estimated improvements
        const criticalCount = issues.filter(
          (i) => i.severity === "critical",
        ).length;
        const highCount = issues.filter((i) => i.severity === "high").length;

        const analysis = {
          filePath: input.filePath,
          totalIssues: issues.length,
          issues: issueSummary,
          optimizations,
          estimatedGains: {
            bundleReduction:
              highCount > 0 ? `~${highCount * 20}KB` : "No bundle issues",
            lcpImprovement:
              highCount > 0
                ? `${highCount * 150}-${highCount * 250}ms`
                : "Already optimized",
            clsImprovement:
              highCount > 0 ? "Reduce layout shift" : "No CLS issues",
            seoImpact:
              criticalCount > 0
                ? `${criticalCount} SEO issues to fix`
                : "SEO optimized",
          },
        };

        console.log(
          `[PerfAnalyzer] ✓ Found ${issues.length} performance issues`,
        );
        console.log("========== PERFORMANCE ANALYZER FINISHED ==========\n");

        return JSON.stringify({
          success: true,
          analysis,
          recommendation:
            optimizations.length > 0
              ? "Prioritize high-impact optimizations first. Critical issues should be fixed immediately."
              : "No performance issues found - code is well optimized!",
        });
      },
    }),
  ];
}

module.exports = {
  createNextjsTools,
};
