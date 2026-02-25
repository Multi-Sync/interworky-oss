/**
 * Agent Tools - Wraps specialist agents as callable tools for Carla
 * Implements the "agent-as-tool" pattern from OpenAI Agents SDK
 */

const {
  tool,
  Agent,
  Runner,
  OutputGuardrailTripwireTriggered,
} = require("@openai/agents");
const { z } = require("zod");
const { repoAgentSchema } = require("../agents/repoAgent");
const { plannerAgent, plannerAgentSchema } = require("../agents/plannerAgent");
const { verifyAgent, verifyAgentSchema } = require("../agents/verifyAgent");
const { testAgent, testAgentSchema } = require("../agents/testAgent");
const {
  protectedBranchGuardrail,
} = require("../guardrails/protectedBranchGuardrail");

// Import repo agent instructions separately
const { repoAgent } = require("../agents/repoAgent");

/**
 * Create agent tools with dynamic MCP server injection
 * @param {Array} mcpServers - MCP servers to inject into repo agent (GitHub MCP)
 * @returns {Array} Array of agent tools
 */
function createAgentTools(mcpServers = []) {
  const runner = new Runner();

  return [
    // ==================== PLANNING TOOL ====================
    tool({
      name: "plan_task",
      description: `Break down complex user requests into structured, executable tasks.

Use this tool when:
- User asks a complex question requiring multiple steps
- Request involves both analytics and code analysis
- You need to organize a multi-step workflow
- Request is ambiguous and needs decomposition

This tool returns a structured plan with:
- Ordered task breakdown
- Agent assignments for each task
- Execution strategy (sequential/parallel)
- Estimated complexity and turns
- Potential challenges and success criteria

Example uses:
- "Find and fix all Image errors" → Plan with search, analyze, fix, PR tasks
- "Show performance trends and code issues" → Plan with parallel analytics + code analysis
- "Analyze landing page" → Plan with search, read, analyze tasks`,
      parameters: z.object({
        userRequest: z
          .string()
          .describe("The original user request to plan for"),
        context: z
          .string()
          .nullable()
          .describe(
            "Additional context about the request (e.g., previous conversation, clarifications)",
          ),
        maxTurns: z
          .number()
          .nullable()
          .describe("Maximum turns available (default 20)"),
        requiresGitHub: z
          .boolean()
          .nullable()
          .describe("Whether GitHub access is known to be required"),
        requiresAnalytics: z
          .boolean()
          .nullable()
          .describe("Whether analytics data is known to be required"),
      }),
      execute: async (input) => {
        console.log("\n========== PLANNER AGENT CALLED ==========");
        console.log("[PlannerAgent] User Request:", input.userRequest);
        console.log("[PlannerAgent] Context:", input.context || "None");
        console.log("[PlannerAgent] Max Turns:", input.maxTurns || 20);

        const plannerInput = `
User Request: ${input.userRequest}

${input.context ? `Additional Context: ${input.context}` : ""}

Constraints:
- Max Turns: ${input.maxTurns || 20}
- GitHub Required: ${input.requiresGitHub ? "Yes" : "Unknown"}
- Analytics Required: ${input.requiresAnalytics ? "Yes" : "Unknown"}

Please create a comprehensive task plan.`;

        console.log("[PlannerAgent] Input sent to agent:\n", plannerInput);

        try {
          console.log("[PlannerAgent] Running planner agent...");
          const result = await runner.run(plannerAgent, plannerInput);
          const plan = plannerAgentSchema.parse(result.finalOutput);

          console.log("[PlannerAgent] ✓ Plan created successfully");
          console.log("[PlannerAgent] Tasks:", plan.taskBreakdown.length);
          console.log("[PlannerAgent] Complexity:", plan.complexity);
          console.log(
            "[PlannerAgent] Estimated Turns:",
            plan.estimatedTotalTurns,
          );
          console.log(
            "[PlannerAgent] Execution Strategy:",
            plan.executionStrategy,
          );
          console.log("[PlannerAgent] Task Breakdown:");
          plan.taskBreakdown.forEach((task, idx) => {
            console.log(
              `  ${idx + 1}. [${task.agent}] ${task.description} (Priority: ${task.priority})`,
            );
          });
          console.log(
            "[PlannerAgent] Output:\n",
            JSON.stringify(plan, null, 2),
          );
          console.log("========== PLANNER AGENT FINISHED ==========\n");

          return JSON.stringify(plan);
        } catch (error) {
          console.error("[PlannerAgent] ✗ Planning failed:", error);
          console.log("========== PLANNER AGENT FAILED ==========\n");
          throw new Error(`Planning failed: ${error.message}`);
        }
      },
    }),

    // ==================== REPOSITORY ANALYSIS TOOL ====================
    tool({
      name: "analyze_repository",
      description: `Search code, analyze files, and identify issues in the GitHub repository.

Use this tool for:
- Searching for specific files or code patterns
- Reading and analyzing code
- Identifying bugs, performance issues, security vulnerabilities
- Generating fix suggestions
- Understanding repository structure

This tool has access to GitHub MCP server with these capabilities:
- search_files: Find files by glob patterns (e.g., "**/*.js", "app/**/page.tsx")
- search_code: Search for code patterns using text or regex
- read_file: Read and analyze file contents
- list_directory: Explore directory structure
- create_pull_request: Create PRs with fixes (when requested)

The tool uses multi-strategy search (will try 3-5 different approaches before giving up).

Returns structured data including:
- Files found during search
- Search strategies attempted
- Code analysis and insights
- Issues identified (with severity and category)
- Fix suggestions (with code snippets)
- Next steps and confidence level

Example uses:
- "Find all Image components missing sizes prop"
- "Analyze the landing page for performance issues"
- "Search for security vulnerabilities"
- "Read the app/page.js file and identify issues"`,
      parameters: z.object({
        task: z
          .string()
          .describe(
            "Specific task for the repository agent (be detailed about what to search/analyze)",
          ),
        files: z
          .array(z.string())
          .nullable()
          .describe("Specific file paths to analyze (if already known)"),
        searchPatterns: z
          .array(z.string())
          .nullable()
          .describe(
            "Specific search patterns to try (e.g., glob patterns, keywords)",
          ),
        analysisType: z
          .enum([
            "search-only",
            "search-and-analyze",
            "analyze-provided-files",
            "comprehensive",
          ])
          .nullable()
          .default("comprehensive")
          .describe("Type of analysis to perform"),
      }),
      execute: async (input) => {
        console.log("\n========== REPOSITORY AGENT CALLED ==========");
        console.log("[RepoAgent] Task:", input.task);
        console.log("[RepoAgent] Files provided:", input.files || "None");
        console.log(
          "[RepoAgent] Search patterns:",
          input.searchPatterns || "None",
        );
        console.log(
          "[RepoAgent] Analysis type:",
          input.analysisType || "comprehensive",
        );
        console.log(
          "[RepoAgent] MCP Servers available:",
          mcpServers.length > 0 ? "Yes (GitHub)" : "No",
        );

        // Create a new Agent instance with MCP servers injected
        const repoAgentWithMCP = new Agent({
          name: repoAgent.name,
          instructions: repoAgent.instructions,
          model: repoAgent.model,
          modelSettings: repoAgent.modelSettings, // Include reasoning settings
          outputType: repoAgent.outputType,
          mcpServers: mcpServers, // Inject MCP servers dynamically
          outputGuardrails: [protectedBranchGuardrail], // Prevent commits to protected branches
        });

        const repoInput = `
Task: ${input.task}

${input.files ? `Files to analyze: ${input.files.join(", ")}` : ""}

${input.searchPatterns ? `Search patterns to try: ${input.searchPatterns.join(", ")}` : ""}

Analysis type: ${input.analysisType || "comprehensive"}

Please perform the repository analysis according to your multi-strategy search protocol.`;

        console.log("[RepoAgent] Input sent to agent:\n", repoInput);

        try {
          console.log(
            "[RepoAgent] Running repository agent with GitHub MCP access...",
          );
          const result = await runner.run(repoAgentWithMCP, repoInput);
          const analysis = repoAgentSchema.parse(result.finalOutput);

          console.log("[RepoAgent] ✓ Analysis completed successfully");
          console.log(
            "[RepoAgent] Search performed:",
            analysis.searchPerformed,
          );
          console.log("[RepoAgent] Files found:", analysis.filesFound.length);
          console.log(
            "[RepoAgent] Search strategies used:",
            analysis.searchStrategies,
          );
          console.log(
            "[RepoAgent] Issues identified:",
            analysis.issuesIdentified.length,
          );
          console.log(
            "[RepoAgent] Fix suggestions:",
            analysis.fixSuggestions.length,
          );
          console.log("[RepoAgent] Confidence:", analysis.confidence);
          console.log(
            "[RepoAgent] Needs more context:",
            analysis.needsMoreContext,
          );

          if (analysis.filesFound.length > 0) {
            console.log("[RepoAgent] Files found:");
            analysis.filesFound.forEach((file) => console.log(`  - ${file}`));
          }

          if (analysis.issuesIdentified.length > 0) {
            console.log("[RepoAgent] Issues identified:");
            analysis.issuesIdentified.forEach((issue, idx) => {
              console.log(
                `  ${idx + 1}. [${issue.severity}] ${issue.file}:${issue.line || "?"} - ${issue.issue}`,
              );
            });
          }

          if (analysis.needsMoreContext) {
            console.log(
              "[RepoAgent] ⚠ More context needed. Next steps:",
              analysis.nextSteps,
            );
          }

          console.log(
            "[RepoAgent] Full output:\n",
            JSON.stringify(analysis, null, 2),
          );
          console.log("========== REPOSITORY AGENT FINISHED ==========\n");

          return JSON.stringify(analysis);
        } catch (error) {
          // Handle guardrail tripwire (security violation)
          if (error instanceof OutputGuardrailTripwireTriggered) {
            console.error(
              "[RepoAgent] ⚠️ GUARDRAIL BLOCKED:",
              error.result?.output?.outputInfo,
            );
            console.log(
              "========== REPOSITORY AGENT BLOCKED BY GUARDRAIL ==========\n",
            );

            // Return safe fallback response
            const blockedResponse = {
              searchPerformed: false,
              filesFound: [],
              searchStrategies: [],
              codeAnalysis: `Operation blocked by security guardrail. ${error.result?.output?.outputInfo || "Direct commits to protected branches (main, production) are not allowed."}`,
              issuesIdentified: [],
              fixSuggestions: [],
              needsMoreContext: false,
              nextSteps: [
                "Create a pull request with your changes instead of committing directly",
              ],
              confidence: "high",
            };

            return JSON.stringify(blockedResponse);
          }

          // Handle other errors
          console.error("[RepoAgent] ✗ Repository analysis failed:", error);
          console.log("========== REPOSITORY AGENT FAILED ==========\n");
          throw new Error(`Repository analysis failed: ${error.message}`);
        }
      },
    }),

    // ==================== VERIFICATION TOOL ====================
    tool({
      name: "verify_response",
      description: `Verify that a proposed response fully answers the user's question with high quality.

Use this tool to:
- Check if your response is complete before sending to user
- Validate that all aspects of the user's request were addressed
- Identify gaps or missing information
- Ensure accuracy and clarity
- Get suggestions for improvement

This implements the LLM-as-judge pattern for quality assurance.

The tool evaluates:
- Completeness: Did we answer the full question?
- Accuracy: Is the information correct?
- Clarity: Is it easy to understand?
- Actionability: Can the user take action based on this?

Returns structured feedback including:
- Quality scores (0-100) for different aspects
- Specific issues found with severity levels
- Missing information that should be included
- Revision suggestions (if needed)
- Estimated user satisfaction

Use this BEFORE presenting complex or important responses to users.

Example uses:
- Before presenting code analysis results
- After gathering analytics data to ensure completeness
- Before suggesting fixes to verify they're clear and actionable
- When uncertain if your response fully addresses the request`,
      parameters: z.object({
        userQuestion: z.string().describe("The original user question/request"),
        proposedResponse: z
          .string()
          .describe("Your proposed response to verify"),
        toolsUsed: z
          .array(z.string())
          .nullable()
          .describe("Tools/agents used to generate this response"),
        dataGathered: z
          .array(z.string())
          .nullable()
          .describe("What data/information was gathered"),
        issuesIdentified: z
          .number()
          .nullable()
          .describe("Number of issues found (for code analysis)"),
        fixesSuggested: z
          .number()
          .nullable()
          .describe("Number of fixes suggested"),
      }),
      execute: async (input) => {
        console.log("\n========== VERIFY AGENT CALLED ==========");
        console.log("[VerifyAgent] User Question:", input.userQuestion);
        console.log("[VerifyAgent] Tools Used:", input.toolsUsed || "None");
        console.log(
          "[VerifyAgent] Data Gathered:",
          input.dataGathered || "None",
        );
        console.log(
          "[VerifyAgent] Issues Identified:",
          input.issuesIdentified || "N/A",
        );
        console.log(
          "[VerifyAgent] Fixes Suggested:",
          input.fixesSuggested || "N/A",
        );

        const verifyInput = `
User Question: ${input.userQuestion}

Proposed Response: ${input.proposedResponse}

Response Context:
- Tools Used: ${input.toolsUsed?.join(", ") || "N/A"}
- Data Gathered: ${input.dataGathered?.join(", ") || "N/A"}
- Issues Identified: ${input.issuesIdentified || "N/A"}
- Fixes Suggested: ${input.fixesSuggested || "N/A"}

Please verify if this response fully satisfies the user's request.`;

        console.log("[VerifyAgent] Input sent to agent:\n", verifyInput);

        try {
          console.log("[VerifyAgent] Running verification agent...");
          const result = await runner.run(verifyAgent, verifyInput);
          const verification = verifyAgentSchema.parse(result.finalOutput);

          console.log("[VerifyAgent] ✓ Verification completed");
          console.log("[VerifyAgent] Complete:", verification.isComplete);
          console.log(
            "[VerifyAgent] Quality Score:",
            verification.qualityScore,
          );
          console.log(
            "[VerifyAgent] Completeness Score:",
            verification.completenessScore,
          );
          console.log(
            "[VerifyAgent] Accuracy Score:",
            verification.accuracyScore,
          );
          console.log(
            "[VerifyAgent] Clarity Score:",
            verification.clarityScore,
          );
          console.log(
            "[VerifyAgent] Actionability Score:",
            verification.actionabilityScore,
          );
          console.log(
            "[VerifyAgent] Needs Revision:",
            verification.needsRevision,
          );
          console.log(
            "[VerifyAgent] User Satisfaction Estimate:",
            verification.userSatisfactionEstimate,
          );

          if (verification.missingInformation.length > 0) {
            console.log("[VerifyAgent] Missing Information:");
            verification.missingInformation.forEach((info) =>
              console.log(`  - ${info}`),
            );
          }

          if (verification.issuesFound.length > 0) {
            console.log(
              "[VerifyAgent] ⚠ Issues Found:",
              verification.issuesFound.length,
            );
            verification.issuesFound.forEach((issue, idx) => {
              console.log(
                `  ${idx + 1}. [${issue.severity}] ${issue.category}: ${issue.description}`,
              );
            });
          }

          if (verification.needsRevision) {
            console.log("[VerifyAgent] 🔧 Revision Needed. Suggestions:");
            verification.revisionSuggestions.forEach((suggestion, idx) => {
              console.log(
                `  ${idx + 1}. [${suggestion.priority}] ${suggestion.issue}`,
              );
              console.log(`     → ${suggestion.suggestion}`);
            });
          } else {
            console.log(
              "[VerifyAgent] ✓ Response is good quality - no revision needed",
            );
          }

          console.log("[VerifyAgent] Reasoning:", verification.reasoning);
          console.log(
            "[VerifyAgent] Full output:\n",
            JSON.stringify(verification, null, 2),
          );
          console.log("========== VERIFY AGENT FINISHED ==========\n");

          return JSON.stringify(verification);
        } catch (error) {
          console.error("[VerifyAgent] ✗ Verification failed:", error);
          console.log("========== VERIFY AGENT FAILED ==========\n");
          throw new Error(`Verification failed: ${error.message}`);
        }
      },
    }),

    // ==================== TEST GENERATION TOOL ====================
    tool({
      name: "generate_tests",
      description: `Generate comprehensive tests for code fixes and validate quality.

Use this tool to:
- Write unit tests for Next.js components (Server & Client)
- Generate integration tests for API routes
- Create E2E tests for user flows
- Run pre-flight validation checks before deployment
- Ensure test coverage for fixes
- Validate TypeScript compilation, linting, builds

This implements test-driven development pattern for code quality assurance.

The tool generates:
- Complete test files with Jest/Vitest/Playwright
- Tests for React Server Components and Client Components
- API route handler tests
- Image component optimization tests
- Pre-flight validation results (TypeScript, ESLint, build checks)
- Test coverage analysis
- Recommendations for additional testing

Returns structured data including:
- Generated test files with full content
- Test coverage analysis (what's covered, what's missing)
- Validation check results (TypeScript, linting, build, etc.)
- Quality confidence level (high/medium/low)
- Next steps and recommendations

Use this AFTER generating fixes to ensure they work correctly.

Example uses:
- "Generate tests for the Image component fixes"
- "Create tests for the new API route handler"
- "Validate this component meets quality standards"
- "Write E2E tests for the checkout flow"`,
      parameters: z.object({
        targetFile: z.string().describe("File path that needs tests generated"),
        fixDescription: z
          .string()
          .nullable()
          .describe(
            "Description of what fix was applied (helps generate relevant tests)",
          ),
        testType: z
          .enum(["unit", "integration", "e2e", "all"])
          .default("unit")
          .describe("Type of tests to generate"),
        includeValidation: z
          .boolean()
          .default(true)
          .describe(
            "Run pre-flight validation checks (TypeScript, linting, build)",
          ),
        existingTestFile: z
          .string()
          .nullable()
          .describe("Path to existing test file if updating tests"),
      }),
      execute: async (input) => {
        console.log("\n========== TEST AGENT CALLED ==========");
        console.log("[TestAgent] Target File:", input.targetFile);
        console.log(
          "[TestAgent] Fix Description:",
          input.fixDescription || "None provided",
        );
        console.log("[TestAgent] Test Type:", input.testType);
        console.log("[TestAgent] Include Validation:", input.includeValidation);
        console.log(
          "[TestAgent] Existing Test File:",
          input.existingTestFile || "None",
        );

        const testInput = `
Target File: ${input.targetFile}

${input.fixDescription ? `Fix Applied: ${input.fixDescription}` : ""}

Test Type Required: ${input.testType}

Include Pre-Flight Validation: ${input.includeValidation}

${input.existingTestFile ? `Existing Test File: ${input.existingTestFile}` : "No existing test file - generate new"}

Please generate comprehensive tests according to Next.js 15 testing best practices.`;

        console.log("[TestAgent] Input sent to agent:\n", testInput);

        try {
          console.log("[TestAgent] Running test generation agent...");
          const result = await runner.run(testAgent, testInput);
          const testResult = testAgentSchema.parse(result.finalOutput);

          console.log("[TestAgent] ✓ Test generation completed");
          console.log(
            "[TestAgent] Tests Generated:",
            testResult.testsGenerated,
          );
          console.log("[TestAgent] Test Files:", testResult.testFiles.length);
          console.log("[TestAgent] Confidence:", testResult.confidence);

          if (testResult.testFiles.length > 0) {
            console.log("[TestAgent] Generated Test Files:");
            testResult.testFiles.forEach((file, idx) => {
              console.log(
                `  ${idx + 1}. ${file.filePath} (${file.framework}, ${file.testType})`,
              );
            });
          }

          if (testResult.testCoverage) {
            console.log("[TestAgent] Test Coverage:");
            console.log("  Target:", testResult.testCoverage.targetFile);
            console.log(
              "  Coverage Areas:",
              testResult.testCoverage.coverageAreas.length,
            );
            console.log(
              "  Missing Coverage:",
              testResult.testCoverage.missingCoverage.length,
            );
          }

          if (testResult.validationChecks.length > 0) {
            console.log("[TestAgent] Validation Checks:");
            testResult.validationChecks.forEach((check) => {
              const status = check.passed ? "✓" : "✗";
              console.log(`  ${status} ${check.check}: ${check.details}`);
            });
          }

          if (testResult.recommendations.length > 0) {
            console.log("[TestAgent] Recommendations:");
            testResult.recommendations.forEach((rec, idx) => {
              console.log(`  ${idx + 1}. ${rec}`);
            });
          }

          console.log(
            "[TestAgent] Full output:\n",
            JSON.stringify(testResult, null, 2),
          );
          console.log("========== TEST AGENT FINISHED ==========\n");

          return JSON.stringify(testResult);
        } catch (error) {
          console.error("[TestAgent] ✗ Test generation failed:", error);
          console.log("========== TEST AGENT FAILED ==========\n");
          throw new Error(`Test generation failed: ${error.message}`);
        }
      },
    }),
  ];
}

module.exports = { createAgentTools };
