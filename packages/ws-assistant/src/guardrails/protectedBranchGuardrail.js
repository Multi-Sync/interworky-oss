/**
 * Protected Branch Guardrail
 * Prevents RepoAgent from committing to main/production branches
 * Only allows PR creation and issue creation
 */

const PROTECTED_BRANCHES = ["main", "master", "production", "prod"];

const DANGEROUS_OPERATIONS = [
  "push_files",
  "create_or_update_file",
  "commit",
  "git_push",
  "force_push",
  "delete_branch",
];

const ALLOWED_OPERATIONS = [
  "read_file",
  "search_files",
  "search_code",
  "list_directory",
  "get_file_contents",
  "create_pull_request",
  "create_issue",
];

const protectedBranchGuardrail = {
  name: "protected-branch-guardrail",

  execute: async ({ agent, context, output }) => {
    console.log(
      "[Guardrail] Checking RepoAgent output for protected branch violations...",
    );

    // Only check RepoAgent outputs
    if (agent.name !== "RepoAgent") {
      return {
        tripwireTriggered: false,
        outputInfo: "Not RepoAgent - skipping check",
      };
    }

    // Parse the structured output
    const repoOutput = typeof output === "string" ? JSON.parse(output) : output;

    // Check for dangerous operations in fixSuggestions
    if (repoOutput.fixSuggestions && repoOutput.fixSuggestions.length > 0) {
      for (const suggestion of repoOutput.fixSuggestions) {
        // Check if suggestion mentions direct commits
        const lowerDescription = suggestion.description.toLowerCase();

        // Detect attempts to commit or push
        if (
          (lowerDescription.includes("commit") ||
            lowerDescription.includes("push") ||
            (lowerDescription.includes("apply") &&
              !lowerDescription.includes("pr"))) &&
          !lowerDescription.includes("pull request") &&
          !lowerDescription.includes("create pr")
        ) {
          console.log(
            "[Guardrail] ⚠️ Detected commit/push suggestion without PR",
          );
          return {
            tripwireTriggered: true,
            outputInfo: `Security violation: RepoAgent attempted to suggest direct commits. Only PR creation is allowed. Blocked suggestion: "${suggestion.description}"`,
          };
        }
      }
    }

    // Check nextSteps for dangerous operations
    if (repoOutput.nextSteps && repoOutput.nextSteps.length > 0) {
      for (const step of repoOutput.nextSteps) {
        const lowerStep = step.toLowerCase();

        // Check for mentions of protected branches with dangerous ops
        const mentionsProtectedBranch = PROTECTED_BRANCHES.some((branch) =>
          lowerStep.includes(branch),
        );

        const mentionsDangerousOp = DANGEROUS_OPERATIONS.some((op) =>
          lowerStep.includes(op.toLowerCase()),
        );

        if (mentionsProtectedBranch && mentionsDangerousOp) {
          console.log(
            "[Guardrail] ⚠️ Detected dangerous operation on protected branch",
          );
          return {
            tripwireTriggered: true,
            outputInfo: `Security violation: Attempted operation on protected branch. Step: "${step}". Use create_pull_request instead.`,
          };
        }

        // Also check for direct commit mentions without PR
        if (
          (lowerStep.includes("commit") || lowerStep.includes("push")) &&
          !lowerStep.includes("pull request") &&
          !lowerStep.includes("create pr") &&
          !lowerStep.includes("pr")
        ) {
          console.log(
            "[Guardrail] ⚠️ Detected direct commit/push in next steps",
          );
          return {
            tripwireTriggered: true,
            outputInfo: `Security violation: Next step suggests direct commit/push. Step: "${step}". Use create_pull_request instead.`,
          };
        }
      }
    }

    // Additional check: scan codeAnalysis text for violations
    if (repoOutput.codeAnalysis) {
      const analysis = repoOutput.codeAnalysis.toLowerCase();

      if (
        (analysis.includes("commit to main") ||
          analysis.includes("push to main") ||
          analysis.includes("commit to production") ||
          analysis.includes("push to production")) &&
        !analysis.includes("pull request") &&
        !analysis.includes("pr")
      ) {
        console.log(
          "[Guardrail] ⚠️ Detected protected branch commit mention in analysis",
        );
        return {
          tripwireTriggered: true,
          outputInfo:
            "Security violation: Analysis suggests committing directly to protected branches. Only PR creation is allowed.",
        };
      }
    }

    console.log("[Guardrail] ✓ Output passed protected branch checks");
    return {
      tripwireTriggered: false,
      outputInfo: "Protected branch check passed - no violations detected",
    };
  },
};

module.exports = { protectedBranchGuardrail };
