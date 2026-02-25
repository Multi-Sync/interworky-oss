/**
 * Security Fix Service
 * Orchestrates the CVE vulnerability → analysis → PR flow
 * Connects vulnerability detection, AI analysis, and GitHub PR creation
 */

const axios = require("axios");
const { Runner } = require("@openai/agents");
const { createSecurityFixAgent } = require("../agents/securityFixAgent");
const { createGitHubMCP } = require("../mcp/createGitHubMCP");
const {
  fetchFileFromGitHub,
  formatCode,
  detectIndentation,
  fetchPrettierConfig,
  validateAndFixWithESLint,
  waitForChecks,
} = require("./errorFixPRService");
const { ensureSnapshot } = require("./repoSnapshotService");
const { fetchGitHubConfig } = require("./githubConfigService");
const {
  findExistingPR,
  findExistingIssue,
} = require("./duplicateDetectionService");

/**
 * Build vulnerability analysis prompt for the agent
 * @param {Object} vulnerability - Vulnerability data from backend
 * @param {string} packageJsonContent - Content of package.json
 * @param {boolean} hasSnapshot - Whether a codebase snapshot is available (passed to agent separately)
 * @returns {string} Formatted prompt for security fix agent
 */
function buildVulnerabilityPrompt(
  vulnerability,
  packageJsonContent,
  hasSnapshot = false,
) {
  const {
    cve_id,
    ghsa_id,
    package_name,
    installed_version,
    patched_version,
    severity,
    title,
    description,
  } = vulnerability;

  return `# Security Vulnerability Analysis Request

## CVE Information

**CVE ID:** ${cve_id}
${ghsa_id ? `**GHSA ID:** ${ghsa_id}` : ""}
**Package:** ${package_name}
**Installed Version:** ${installed_version || "Unknown"}
**Patched Version:** ${patched_version || "⚠️ No patch available yet"}
**Severity:** ${severity}
**Title:** ${title}

## Description

${description || "No description available"}

## Project's package.json

\`\`\`json
${packageJsonContent}
\`\`\`

## Your Task

${
  hasSnapshot
    ? `**CRITICAL: Call find_relevant_files FIRST** to analyze the codebase.

\`\`\`
find_relevant_files({
  packageName: "${package_name}",
  context: "${cve_id} - ${title}"
})
\`\`\`

The tool will analyze the repository snapshot and return:
- relevantFiles: Files that import/use the vulnerable package
- isPackageUsed: Whether the package is actually used in code
- packageJson: Dependencies information
- configFiles: Related configuration files

After getting the results, use them to:
`
    : ""
}1. **Analyze package.json** to understand the current dependency setup
2. **Check if package is actually used** - If listed but never imported, action should be "skip"
3. **Check for middleware** if this is CVE-2025-29927 (middleware bypass)
4. **Determine action**: create_pr (dependency update only) OR create_issue (code changes needed) OR skip (not affected)
5. **Generate precise changes** for dependency updates only

**Decision Matrix:**
- Patched version exists + only package.json update needed → action: "create_pr"
- No patched version OR requires code changes → action: "create_issue"
- Package not actually used in code → action: "skip"

**Important Instructions:**
- ${hasSnapshot ? "Use find_relevant_files to understand if the package is actually used" : "Use MCP tools to check if the package is imported anywhere"}
- PRs are ONLY for package.json dependency updates - keep them simple
- For code changes, config changes, or no patched version → create an issue instead
- Be conservative: When in doubt, create an issue
- Flag any breaking changes that might occur
`;
}

/**
 * Update CVE alert status in backend
 * @param {string} alertId - Alert ID
 * @param {Object} updateData - Data to update (status, pr_url, etc.)
 * @returns {Promise<void>}
 */
async function updateAlertStatus(alertId, updateData) {
  const coreApiUrl = process.env.NODE_PUBLIC_API_URL;
  const accessToken = process.env.ACCESS_TOKEN;

  if (!accessToken) {
    console.warn("[SecurityFix] No ACCESS_TOKEN, skipping alert status update");
    return;
  }

  try {
    await axios.put(
      `${coreApiUrl}/api/organization-security/alerts/${alertId}/status`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    console.log(
      `[SecurityFix] Alert ${alertId} status updated to: ${updateData.status}`,
    );
  } catch (error) {
    console.error(
      `[SecurityFix] Failed to update alert status: ${error.message}`,
    );
  }
}

/**
 * Build PR description for security fix
 * @param {Object} vulnerability - Vulnerability details
 * @param {Object} fix - Fix analysis from agent
 * @returns {string} Markdown PR description
 */
function buildSecurityPRDescription(vulnerability, fix) {
  const severityEmoji = {
    critical: "🔴",
    high: "🟠",
    medium: "🟡",
    low: "🟢",
  };

  return `## ${severityEmoji[vulnerability.severity] || "⚠️"} Security Fix: ${vulnerability.title}

This PR automatically fixes a **${vulnerability.severity.toUpperCase()}** severity security vulnerability.

### Vulnerability Details

**CVE:** ${vulnerability.cve_id}
${vulnerability.ghsa_id ? `**GHSA:** ${vulnerability.ghsa_id}` : ""}
**Package:** \`${vulnerability.package_name}\`
**Severity:** ${vulnerability.severity}

${vulnerability.description ? `### Description\n\n${vulnerability.description}` : ""}

### Fix Applied

**Type:** ${fix.fixType}
**Confidence:** ${fix.confidence}

${fix.analysis}

### Changes Made

${fix.suggestedFixes
  .map(
    (f) => `
#### \`${f.filePath}\`

${f.description}

<details>
<summary>View Code Changes</summary>

**Before:**
\`\`\`
${f.oldCode}
\`\`\`

**After:**
\`\`\`
${f.newCode}
\`\`\`

</details>
`,
  )
  .join("\n")}

${
  fix.breakingChanges && fix.breakingChanges.length > 0
    ? `
### ⚠️ Potential Breaking Changes

${fix.breakingChanges.map((bc) => `- ${bc}`).join("\n")}
`
    : ""
}

${
  fix.testSuggestions && fix.testSuggestions.length > 0
    ? `
### Suggested Tests

${fix.testSuggestions.map((ts) => `- [ ] ${ts}`).join("\n")}
`
    : ""
}

${
  fix.requiresManualReview
    ? `
### ⚠️ Manual Review Required

This fix has been flagged for manual review. Please carefully test the changes before merging.
`
    : ""
}

### AI Analysis

${fix.reasoning}

---

🔒 *This PR was automatically generated by Interworky Security*
*CVE: ${vulnerability.cve_id}*
${fix.requiresManualReview ? "*⚠️ Please review carefully before merging*" : ""}
`;
}

/**
 * Create GitHub issue for security vulnerability (when auto-fix is not possible)
 * @param {Object} params - { vulnerability, fix, githubConfig }
 * @returns {Promise<Object>} Created issue data
 */
async function createSecurityIssue({ vulnerability, fix, githubConfig }) {
  const { token, owner, repo } = githubConfig;

  // Check for existing issue to prevent duplicates
  const cveId = vulnerability.cve_id;
  if (cveId) {
    console.log(`[SecurityFix] Checking for existing issue for ${cveId}...`);
    const existingIssue = await findExistingIssue({
      owner,
      repo,
      token,
      identifier: cveId,
      type: "security",
    });

    if (existingIssue) {
      console.log(
        `[SecurityFix] Duplicate detected! Issue already exists: #${existingIssue.number}`,
      );
      return {
        ...existingIssue,
        duplicate: true,
        message: `Issue already exists for ${cveId}: #${existingIssue.number}`,
      };
    }
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
  };

  console.log(`[SecurityFix] 📋 Creating GitHub issue for ${owner}/${repo}`);

  const severityEmoji = {
    critical: "🔴",
    high: "🟠",
    medium: "🟡",
    low: "🟢",
  };

  // Use agent-generated issue body if available, otherwise build our own
  const issueBody =
    fix.issueBody ||
    `## ${severityEmoji[vulnerability.severity] || "⚠️"} Security Vulnerability: ${vulnerability.title}

### Vulnerability Details

**CVE:** ${vulnerability.cve_id}
${vulnerability.ghsa_id ? `**GHSA:** ${vulnerability.ghsa_id}` : ""}
**Package:** \`${vulnerability.package_name}\`
**Installed Version:** \`${vulnerability.installed_version}\`
**Patched Version:** ${vulnerability.patched_version ? `\`${vulnerability.patched_version}\`` : "⚠️ No patch available yet"}
**Severity:** ${vulnerability.severity}

### Description

${vulnerability.description || "No description available."}

### Analysis

${fix.analysis || "This vulnerability was detected but requires manual review."}

### Why This Needs Manual Fix

**Fix Type:** ${fix.fixType}
**Confidence:** ${fix.confidence}

${fix.reasoning || ""}

${fix.fixType === "code_change" ? "This vulnerability requires code changes that cannot be safely auto-applied." : ""}
${fix.fixType === "config_change" ? "This vulnerability requires configuration changes that need manual review." : ""}
${!vulnerability.patched_version ? "There is no patched version available yet. Consider implementing workarounds or monitoring for updates." : ""}

${
  fix.breakingChanges && fix.breakingChanges.length > 0
    ? `
### ⚠️ Potential Breaking Changes

${fix.breakingChanges.map((bc) => `- ${bc}`).join("\n")}
`
    : ""
}

${
  fix.testSuggestions && fix.testSuggestions.length > 0
    ? `
### Suggested Tests

${fix.testSuggestions.map((ts) => `- [ ] ${ts}`).join("\n")}
`
    : ""
}

### References

- [GitHub Security Advisory](https://github.com/advisories/${vulnerability.ghsa_id || vulnerability.cve_id})
${vulnerability.cve_id ? `- [NVD - ${vulnerability.cve_id}](https://nvd.nist.gov/vuln/detail/${vulnerability.cve_id})` : ""}

---

🔒 *This issue was automatically created by Interworky Security*
`;

  const issueTitle = `[Security] ${severityEmoji[vulnerability.severity] || "⚠️"} ${vulnerability.cve_id}: ${vulnerability.title}`;

  // Add severity labels
  const labels = ["security"];
  if (vulnerability.severity === "critical") {
    labels.push("critical", "priority:high");
  } else if (vulnerability.severity === "high") {
    labels.push("priority:high");
  }

  try {
    const issueUrl = `https://api.github.com/repos/${owner}/${repo}/issues`;
    const issueData = await axios.post(
      issueUrl,
      {
        title: issueTitle,
        body: issueBody,
        labels: labels,
      },
      { headers },
    );

    console.log(`[SecurityFix] ✅ Issue created: #${issueData.data.number}`);
    console.log(`[SecurityFix]    URL: ${issueData.data.html_url}`);

    return issueData.data;
  } catch (error) {
    // If labels don't exist, retry without them
    if (error.response?.status === 422 && error.response?.data?.errors) {
      console.log(
        `[SecurityFix] ⚠️  Some labels don't exist, retrying without labels...`,
      );
      const issueUrl = `https://api.github.com/repos/${owner}/${repo}/issues`;
      const issueData = await axios.post(
        issueUrl,
        {
          title: issueTitle,
          body: issueBody,
        },
        { headers },
      );
      console.log(
        `[SecurityFix] ✅ Issue created (without labels): #${issueData.data.number}`,
      );
      return issueData.data;
    }
    throw error;
  }
}

/**
 * Create GitHub PR with security fix
 * @param {Object} params - { fix, vulnerability, githubConfig }
 * @returns {Promise<Object>} Created PR data
 */
async function createSecurityFixPR({ fix, vulnerability, githubConfig }) {
  const { token, owner, repo } = githubConfig;

  if (!fix.suggestedFixes || fix.suggestedFixes.length === 0) {
    throw new Error("No fixes available - suggestedFixes is empty");
  }

  // Check for existing PR to prevent duplicates
  const cveId = vulnerability.cve_id;
  if (cveId) {
    console.log(`[SecurityFix] Checking for existing PR for ${cveId}...`);
    const existingPR = await findExistingPR({
      owner,
      repo,
      token,
      identifier: cveId,
      type: "security",
    });

    if (existingPR) {
      console.log(
        `[SecurityFix] Duplicate detected! PR already exists: #${existingPR.number}`,
      );
      return {
        ...existingPR,
        duplicate: true,
        message: `PR already exists for ${cveId}: #${existingPR.number}`,
      };
    }
  }

  const headers = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github.v3+json",
  };

  console.log(`[SecurityFix] Creating PR for ${owner}/${repo}`);

  try {
    // 1. Get default branch
    const repoUrl = `https://api.github.com/repos/${owner}/${repo}`;
    const repoData = await axios.get(repoUrl, { headers });
    const defaultBranch = repoData.data.default_branch;

    console.log(`[SecurityFix] Default branch: ${defaultBranch}`);

    // 2. Get latest commit SHA from default branch
    const branchUrl = `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${defaultBranch}`;
    const branchData = await axios.get(branchUrl, { headers });
    const latestCommitSha = branchData.data.object.sha;

    console.log(`[SecurityFix] Latest commit: ${latestCommitSha}`);

    // 3. Get base tree SHA from latest commit
    const commitUrl = `https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`;
    const commitData = await axios.get(commitUrl, { headers });
    const baseTreeSha = commitData.data.tree.sha;

    // 4. Process all file changes
    const treeItems = [];

    for (const suggestedFix of fix.suggestedFixes) {
      console.log(`[SecurityFix] Processing fix for: ${suggestedFix.filePath}`);

      // Fetch current file content
      let currentContent = "";
      try {
        const { content } = await fetchFileFromGitHub({
          owner,
          repo,
          path: suggestedFix.filePath,
          token,
        });
        currentContent = content;
      } catch (error) {
        console.warn(
          `[SecurityFix] Could not fetch ${suggestedFix.filePath}, might be creating new file`,
        );
      }

      // Apply the fix
      let fixedContent;
      if (suggestedFix.filePath === "package.json") {
        // For package.json, do simple string replacement
        fixedContent = currentContent.replace(
          suggestedFix.oldCode,
          suggestedFix.newCode,
        );
      } else {
        // For code files, do more sophisticated replacement
        fixedContent = currentContent.replace(
          suggestedFix.oldCode,
          suggestedFix.newCode,
        );
      }

      // Format if it's a code file
      if (!suggestedFix.filePath.endsWith(".json")) {
        const projectPrettierConfig = await fetchPrettierConfig({
          owner,
          repo,
          token,
        });
        const detectedIndent = detectIndentation(currentContent);

        fixedContent = await formatCode(fixedContent, suggestedFix.filePath, {
          projectConfig: projectPrettierConfig || {},
          indentOptions: detectedIndent,
        });

        const eslintResult = await validateAndFixWithESLint(
          fixedContent,
          suggestedFix.filePath,
        );
        fixedContent = eslintResult.fixedContent;
      }

      // Create blob for fixed file
      const blobUrl = `https://api.github.com/repos/${owner}/${repo}/git/blobs`;
      const blobData = await axios.post(
        blobUrl,
        {
          content: fixedContent,
          encoding: "utf-8",
        },
        { headers },
      );

      console.log(
        `[SecurityFix] Created blob for ${suggestedFix.filePath}: ${blobData.data.sha}`,
      );

      treeItems.push({
        path: suggestedFix.filePath,
        mode: "100644",
        type: "blob",
        sha: blobData.data.sha,
      });
    }

    // 5. Create new tree with all fixed files
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees`;
    const treeData = await axios.post(
      treeUrl,
      {
        base_tree: baseTreeSha,
        tree: treeItems,
      },
      { headers },
    );

    // 6. Create commit
    const commitMessage = `security: fix ${vulnerability.cve_id} in ${vulnerability.package_name}

${fix.analysis}

Severity: ${vulnerability.severity}
Fix type: ${fix.fixType}
Confidence: ${fix.confidence}

Auto-fix applied by Interworky Security`;

    const newCommitUrl = `https://api.github.com/repos/${owner}/${repo}/git/commits`;
    const newCommitData = await axios.post(
      newCommitUrl,
      {
        message: commitMessage,
        tree: treeData.data.sha,
        parents: [latestCommitSha],
      },
      { headers },
    );

    console.log(`[SecurityFix] Created commit: ${newCommitData.data.sha}`);

    // 7. Create branch
    const timestamp = Date.now();
    const safeCveId = vulnerability.cve_id.replace(/[^a-zA-Z0-9-]/g, "-");
    const branchName = `security-fix/${safeCveId}-${timestamp}`;
    const createRefUrl = `https://api.github.com/repos/${owner}/${repo}/git/refs`;
    await axios.post(
      createRefUrl,
      {
        ref: `refs/heads/${branchName}`,
        sha: newCommitData.data.sha,
      },
      { headers },
    );

    console.log(`[SecurityFix] Created branch: ${branchName}`);

    // 8. Create PR as DRAFT
    const prTitle = `[Security] Fix ${vulnerability.cve_id}: ${vulnerability.title}`;
    const prUrl = `https://api.github.com/repos/${owner}/${repo}/pulls`;
    const prData = await axios.post(
      prUrl,
      {
        title: prTitle,
        head: branchName,
        base: defaultBranch,
        body: buildSecurityPRDescription(vulnerability, fix),
        draft: true,
      },
      { headers },
    );

    console.log(`[SecurityFix] PR created as DRAFT: #${prData.data.number}`);

    // 9. Wait for checks
    console.log(`[SecurityFix] Waiting for CI checks...`);
    const checksResult = await waitForChecks({
      owner,
      repo,
      headSha: newCommitData.data.sha,
      token,
      timeoutMs: 180000,
    });

    // 10. Update PR based on check results
    if (checksResult.allPassed) {
      await axios.patch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${prData.data.number}`,
        { draft: false },
        { headers },
      );
      console.log(
        `[SecurityFix] All checks passed! PR marked as ready for review.`,
      );
    } else if (checksResult.someFailed) {
      await axios.post(
        `https://api.github.com/repos/${owner}/${repo}/issues/${prData.data.number}/comments`,
        {
          body: `⚠️ **CI Checks Failed**\n\nThe following checks failed:\n${checksResult.failedChecks.map((c) => `- ❌ ${c.name}: ${c.conclusion}`).join("\n")}\n\nPlease review the failures before merging.\n\nKeeping this PR as draft until checks pass.`,
        },
        { headers },
      );
      console.log(`[SecurityFix] Some checks failed. PR kept as draft.`);
    }

    return {
      ...prData.data,
      checksResult,
    };
  } catch (error) {
    console.error("[SecurityFix] Failed to create PR:", error.message);
    if (error.response?.data) {
      console.error("[SecurityFix] GitHub API error:", error.response.data);
    }
    throw error;
  }
}

/**
 * Main security fix function
 * Orchestrates: vulnerability data → GitHub MCP → agent analysis → PR creation
 *
 * @param {Object} params - { organizationId, vulnerability, alertId }
 * @returns {Promise<Object>} Result with status, pr_url
 */
async function fixSecurityVulnerability({
  organizationId,
  vulnerability,
  alertId,
}) {
  console.log("[SecurityFix] ========================================");
  console.log(`[SecurityFix] STARTING SECURITY FIX PROCESS`);
  console.log(`[SecurityFix] Organization ID: ${organizationId}`);
  console.log(`[SecurityFix] CVE: ${vulnerability.cve_id}`);
  console.log(`[SecurityFix] Package: ${vulnerability.package_name}`);
  console.log(`[SecurityFix] Severity: ${vulnerability.severity}`);
  console.log("[SecurityFix] ========================================\n");

  let githubMCP = null;

  try {
    // 1. Update alert status to 'fixing'
    if (alertId) {
      await updateAlertStatus(alertId, { status: "fixing" });
    }

    // 2. Fetch GitHub configuration
    console.log(
      `[SecurityFix] Step 1: Fetching GitHub config for org ${organizationId}...`,
    );
    const githubConfig = await fetchGitHubConfig(organizationId);
    console.log(
      `[SecurityFix] GitHub config fetched: ${githubConfig.owner}/${githubConfig.repo}`,
    );

    // 3. Create GitHub MCP server
    console.log(`[SecurityFix] Step 2: Creating GitHub MCP server...`);
    githubMCP = await createGitHubMCP({
      token: githubConfig.token,
      owner: githubConfig.owner,
      repo: githubConfig.repo,
    });
    console.log(`[SecurityFix] GitHub MCP server created`);

    // 4. Fetch package.json content
    console.log(`[SecurityFix] Step 3: Fetching package.json...`);
    const { content: packageJsonContent } = await fetchFileFromGitHub({
      owner: githubConfig.owner,
      repo: githubConfig.repo,
      path: "package.json",
      token: githubConfig.token,
    });
    console.log(
      `[SecurityFix] package.json fetched (${packageJsonContent.length} bytes)`,
    );

    // 4.5. Fetch codebase snapshot (for enhanced security analysis with o3 model)
    console.log(
      `[SecurityFix] Step 3.5: Fetching codebase snapshot for comprehensive analysis...`,
    );
    let codebaseSnapshot = null;
    try {
      const snapshotStartTime = Date.now();
      codebaseSnapshot = await ensureSnapshot(organizationId);
      const snapshotDuration = Date.now() - snapshotStartTime;
      const estimatedTokens = Math.ceil(codebaseSnapshot.length / 4);
      console.log(
        `[SecurityFix] ✅ Codebase snapshot ready in ${(snapshotDuration / 1000).toFixed(1)}s`,
      );
      console.log(
        `[SecurityFix]    Size: ${(codebaseSnapshot.length / 1024 / 1024).toFixed(2)} MB (~${estimatedTokens.toLocaleString()} tokens)`,
      );
      console.log(
        `[SecurityFix]    Will use find_relevant_files tool to extract focused context`,
      );
    } catch (err) {
      console.warn(
        `[SecurityFix] ⚠️  Snapshot unavailable - using gpt-4o with MCP tools instead`,
      );
      console.warn(`[SecurityFix]    Reason: ${err.message}`);
      // Continue without snapshot - it's optional, agent will use MCP tools instead
    }

    // 5. Create security fix agent (pass snapshot to agent, not prompt)
    console.log(`[SecurityFix] Step 4: Creating security fix agent...`);
    const hasSnapshot = !!codebaseSnapshot;
    // Pass snapshot to agent factory - it will be captured in the tool closure
    // This way the main agent doesn't have the full snapshot in its context
    const securityFixAgent = createSecurityFixAgent(
      [githubMCP],
      codebaseSnapshot,
    );
    console.log(
      `[SecurityFix] ✅ Agent created with model: gpt-4o${hasSnapshot ? " + find_relevant_files tool" : " + MCP tools"}`,
    );

    // 6. Run agent analysis
    console.log(`[SecurityFix] Step 5: Running AI agent analysis...`);
    const runner = new Runner();
    // Pass hasSnapshot boolean to prompt (not the actual snapshot)
    const prompt = buildVulnerabilityPrompt(
      vulnerability,
      packageJsonContent,
      hasSnapshot,
    );
    const promptStats = {
      cveId: vulnerability.cve_id,
      packageName: vulnerability.package_name,
      severity: vulnerability.severity,
      hasSnapshot: hasSnapshot,
      estimatedPromptSize: prompt.length,
    };
    console.log(`[SecurityFix]    Prompt stats:`, JSON.stringify(promptStats));

    let rawResult;
    try {
      rawResult = await runner.run(securityFixAgent, prompt, { stream: false });
      console.log(`[SecurityFix] Agent run completed`);
    } catch (runError) {
      console.error(`[SecurityFix] Agent run failed:`, runError.message);
      throw runError;
    }

    // 7. Extract result from runner response
    console.log(`[SecurityFix] Step 6: Parsing agent output...`);
    let result;
    let outputText = rawResult.state?._currentStep?.output?.trim();

    // Try multiple locations where output might be
    if (
      !outputText &&
      rawResult.state?._lastProcessedResponse?.newItems?.[0]?.rawItem
        ?.content?.[0]?.text
    ) {
      outputText =
        rawResult.state._lastProcessedResponse.newItems[0].rawItem.content[0]
          .text;
    }

    if (
      !outputText &&
      rawResult.state?._generatedItems &&
      Array.isArray(rawResult.state._generatedItems)
    ) {
      for (let i = rawResult.state._generatedItems.length - 1; i >= 0; i--) {
        const item = rawResult.state._generatedItems[i];
        if (
          item.type === "message_output_item" &&
          item.rawItem?.content?.[0]?.text
        ) {
          outputText = item.rawItem.content[0].text;
          break;
        }
      }
    }

    if (outputText) {
      try {
        result = JSON.parse(outputText);
        console.log(`[SecurityFix] Agent output parsed:`, {
          action: result.action,
          canFix: result.canFix,
          confidence: result.confidence,
          fixType: result.fixType,
          fixCount: result.suggestedFixes?.length || 0,
        });
      } catch (parseError) {
        console.error(
          `[SecurityFix] Failed to parse agent output:`,
          parseError.message,
        );
        throw new Error(`Failed to parse agent output: ${parseError.message}`);
      }
    } else {
      console.error(`[SecurityFix] Agent output not found`);
      throw new Error("Agent output not found in expected locations");
    }

    // 8. Handle action based on agent decision
    const action =
      result.action || (result.canFix ? "create_pr" : "create_issue");
    console.log(
      `[SecurityFix] Step 7: Action decision - ${action} (confidence: ${result.confidence})`,
    );

    // Check for invalid create_pr (no fixes provided)
    if (
      action === "create_pr" &&
      (!result.suggestedFixes || result.suggestedFixes.length === 0)
    ) {
      // Agent said create_pr but didn't provide fixes - fall through to issue creation
      console.warn(
        `[SecurityFix] ⚠️  Agent returned action=create_pr but suggestedFixes is empty`,
      );
      console.warn(
        `[SecurityFix]    Falling back to creating an issue instead`,
      );
    }

    // Handle: create_pr (only if fixes are provided)
    if (action === "create_pr" && result.suggestedFixes?.length > 0) {
      console.log(`[SecurityFix] 🔧 Creating PR for dependency update...`);
      const pr = await createSecurityFixPR({
        fix: result,
        vulnerability,
        githubConfig,
      });

      console.log(`[SecurityFix] ✅ PR created: ${pr.html_url}`);

      if (alertId) {
        await updateAlertStatus(alertId, {
          status: "resolved",
          pr_url: pr.html_url,
          pr_number: pr.number,
        });
      }

      console.log(`[SecurityFix] ========================================`);
      console.log(`[SecurityFix] ✅ SECURITY FIX PR CREATED`);
      console.log(`[SecurityFix] PR URL: ${pr.html_url}`);
      console.log(`[SecurityFix] ========================================\n`);

      return {
        success: true,
        type: "pr",
        url: pr.html_url,
        pr_number: pr.number,
        canFix: true,
        confidence: result.confidence,
        fixType: result.fixType,
      };
    }

    // Handle: create_issue
    if (action === "create_issue") {
      console.log(
        `[SecurityFix] 📋 Creating issue for manual fix (${result.fixType})...`,
      );
      const issue = await createSecurityIssue({
        vulnerability,
        fix: result,
        githubConfig,
      });

      if (alertId) {
        await updateAlertStatus(alertId, {
          status: "issue_created",
          issue_url: issue.html_url,
          issue_number: issue.number,
        });
      }

      console.log(`[SecurityFix] ========================================`);
      console.log(`[SecurityFix] 📋 SECURITY ISSUE CREATED`);
      console.log(`[SecurityFix] Issue URL: ${issue.html_url}`);
      console.log(`[SecurityFix] Reason: ${result.fixType}`);
      console.log(`[SecurityFix] ========================================\n`);

      return {
        success: true,
        type: "issue",
        url: issue.html_url,
        issue_number: issue.number,
        canFix: false,
        confidence: result.confidence,
        fixType: result.fixType,
        reasoning: result.reasoning,
      };
    }

    // Handle: skip (package not affected)
    if (action === "skip") {
      console.log(`[SecurityFix] ⏭️  Skipping - package not affected`);
      console.log(`[SecurityFix] Reason: ${result.reasoning}`);

      if (alertId) {
        await updateAlertStatus(alertId, {
          status: "not_affected",
          error_message: result.reasoning || "Package not used in codebase",
        });
      }

      console.log(`[SecurityFix] ========================================`);
      console.log(`[SecurityFix] ⏭️  SKIPPED - NOT AFFECTED`);
      console.log(`[SecurityFix] ========================================\n`);

      return {
        success: true,
        type: "skipped",
        reason: result.reasoning || "Package not used in codebase",
        canFix: false,
        fixType: "not_affected",
      };
    }

    // Fallback: unknown action or missing data
    console.log(
      `[SecurityFix] ⚠️  Unexpected state - creating issue as fallback`,
    );
    const fallbackIssue = await createSecurityIssue({
      vulnerability,
      fix: result,
      githubConfig,
    });

    if (alertId) {
      await updateAlertStatus(alertId, {
        status: "issue_created",
        issue_url: fallbackIssue.html_url,
        issue_number: fallbackIssue.number,
      });
    }

    return {
      success: true,
      type: "issue",
      url: fallbackIssue.html_url,
      issue_number: fallbackIssue.number,
      canFix: false,
      confidence: result.confidence,
      fixType: result.fixType,
    };
  } catch (error) {
    console.error("[SecurityFix] Security fix process failed:", error.message);
    console.error("[SecurityFix] Error stack:", error.stack);

    // Update alert status to failed
    if (alertId) {
      await updateAlertStatus(alertId, {
        status: "failed",
        error_message: error.message,
      });
    }

    return {
      success: false,
      error: error.message,
    };
  } finally {
    // Cleanup MCP connection
    if (githubMCP) {
      try {
        await githubMCP.close();
      } catch (_) {
        // Error closing MCP connection - ignore
      }
    }
  }
}

module.exports = {
  fixSecurityVulnerability,
  updateAlertStatus,
  buildVulnerabilityPrompt,
  buildSecurityPRDescription,
  createSecurityFixPR,
  createSecurityIssue,
};
