/**
 * Simple Template-Based Integration Service
 * No AI agents - just deterministic logic + templates
 */

const axios = require("axios");
const { fetchGitHubInstallationToken } = require("../ws-utils");

/**
 * Generate Carla integration PR using hybrid approach:
 * 1. Try deterministic analysis
 * 2. If failed, use AI classifier
 * 3. Retry with AI classification
 * 4. If still failed, create manual issue
 */
async function generateSimpleIntegrationPR({
  organizationId,
  installationId,
  repoFullName,
  repoOwner,
  repoName,
  githubToken,
  mcpServers, // For AI classifier fallback
}) {
  console.log(`[SimpleIntegration] Starting for ${repoFullName}`);

  try {
    // ========== STEP 1: Try Deterministic Analysis ==========
    console.log("[SimpleIntegration] Phase 1: Deterministic analysis...");
    const analysis = await analyzeProject({
      repoOwner,
      repoName,
      githubToken,
    });

    console.log(
      "[SimpleIntegration] Deterministic result:",
      JSON.stringify(analysis, null, 2),
    );

    // ========== STEP 2: If Failed, Try AI Classifier ==========
    if (!analysis.canAutomate) {
      console.log(
        "[SimpleIntegration] ⚠️ Deterministic failed, trying AI classifier...",
      );

      const aiClassification = await tryAIClassification({
        repoOwner,
        repoName,
        mcpServers,
      });

      if (aiClassification && aiClassification.canDetermineStructure) {
        console.log("[SimpleIntegration] ✅ AI classifier succeeded!");
        console.log(
          "[SimpleIntegration] AI result:",
          JSON.stringify(aiClassification, null, 2),
        );

        // Retry with AI's classification
        const retryAnalysis = await retryWithAIClassification({
          repoOwner,
          repoName,
          githubToken,
          aiClassification,
        });

        if (retryAnalysis.canAutomate) {
          console.log(
            "[SimpleIntegration] ✅ Retry with AI classification succeeded!",
          );

          // Generate files and create PR
          const files = generateFiles(retryAnalysis);
          const pr = await createPR({
            repoOwner,
            repoName,
            githubToken,
            files,
            analysis: retryAnalysis,
          });

          console.log(`[SimpleIntegration] ✅ PR created: ${pr.html_url}`);

          return {
            success: true,
            pr: {
              url: pr.html_url,
              number: pr.number,
            },
            method: "ai-classification",
          };
        }
      }

      // ========== STEP 3: Still Failed - Create Manual Issue ==========
      console.log(
        "[SimpleIntegration] ❌ Both deterministic and AI failed, creating manual issue",
      );
      return await createManualIssue({
        repoOwner,
        repoName,
        githubToken,
        reason: aiClassification?.reasoning || analysis.reason,
      });
    }

    // ========== Deterministic Succeeded ==========
    console.log("[SimpleIntegration] ✅ Deterministic succeeded!");

    // Step 3: Generate files from templates
    const files = generateFiles(analysis);

    // Step 4: Create PR
    const pr = await createPR({
      repoOwner,
      repoName,
      githubToken,
      files,
      analysis,
    });

    console.log(`[SimpleIntegration] ✅ PR created: ${pr.html_url}`);

    return {
      success: true,
      pr: {
        url: pr.html_url,
        number: pr.number,
      },
      method: "deterministic",
    };
  } catch (error) {
    console.error("[SimpleIntegration] Error:", error);
    throw error;
  }
}

/**
 * Analyze project structure using GitHub API
 */
async function analyzeProject({ repoOwner, repoName, githubToken }) {
  const headers = {
    Authorization: `Bearer ${githubToken}`,
    Accept: "application/vnd.github+json",
  };

  try {
    // Step 1: Fetch package.json
    console.log("[SimpleIntegration] Fetching package.json");
    const packageJson = await fetchFile({
      repoOwner,
      repoName,
      path: "package.json",
      headers,
    });

    if (!packageJson) {
      return {
        canAutomate: false,
        reason: "No package.json found - not a Node.js project",
      };
    }

    const pkg = JSON.parse(packageJson);
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    // Check if it's Next.js
    const isNextJs = deps.next !== undefined;
    if (!isNextJs) {
      return {
        canAutomate: false,
        reason: "Not a Next.js project",
      };
    }

    const nextVersion = deps.next?.replace(/[\^~]/g, "");
    const isTypeScript =
      deps.typescript !== undefined || deps["@types/react"] !== undefined;

    console.log(
      `[SimpleIntegration] Next.js ${nextVersion}, TypeScript: ${isTypeScript}`,
    );

    // Step 2: Detect router type and entry point
    const routerInfo = await detectRouter({
      repoOwner,
      repoName,
      headers,
      isTypeScript,
    });

    if (!routerInfo.found) {
      return {
        canAutomate: false,
        reason: "Could not find app/layout or pages/_app entry point",
      };
    }

    return {
      canAutomate: true,
      isNextJs: true,
      nextVersion,
      isTypeScript,
      routerType: routerInfo.type, // 'app' or 'pages'
      entryPointPath: routerInfo.path,
      entryPointContent: routerInfo.content,
      hasSrc: routerInfo.hasSrc,
    };
  } catch (error) {
    console.error("[SimpleIntegration] Analysis error:", error.message);
    return {
      canAutomate: false,
      reason: `Analysis failed: ${error.message}`,
    };
  }
}

/**
 * Detect router type (App Router vs Pages Router)
 */
async function detectRouter({ repoOwner, repoName, headers, isTypeScript }) {
  const ext = isTypeScript ? "tsx" : "jsx";

  // Try App Router first (Next.js 13+)
  const appRouterPaths = [`app/layout.${ext}`, `src/app/layout.${ext}`];

  for (const path of appRouterPaths) {
    console.log(`[SimpleIntegration] Checking ${path}`);
    const content = await fetchFile({ repoOwner, repoName, path, headers });
    if (content) {
      return {
        found: true,
        type: "app",
        path,
        content,
        hasSrc: path.startsWith("src/"),
      };
    }
  }

  // Try Pages Router (Next.js 12 and earlier)
  const pagesRouterPaths = [`pages/_app.${ext}`, `src/pages/_app.${ext}`];

  for (const path of pagesRouterPaths) {
    console.log(`[SimpleIntegration] Checking ${path}`);
    const content = await fetchFile({ repoOwner, repoName, path, headers });
    if (content) {
      return {
        found: true,
        type: "pages",
        path,
        content,
        hasSrc: path.startsWith("src/"),
      };
    }
  }

  return { found: false };
}

/**
 * Fetch file from GitHub
 */
async function fetchFile({ repoOwner, repoName, path, headers }) {
  try {
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;
    const response = await axios.get(url, { headers });

    if (response.data.encoding === "base64") {
      return Buffer.from(response.data.content, "base64").toString("utf8");
    }
    return response.data.content;
  } catch (error) {
    if (error.response?.status === 404) {
      return null; // File not found
    }
    throw error;
  }
}

/**
 * Generate files from templates
 */
function generateFiles(analysis) {
  const files = [];
  const ext = analysis.isTypeScript ? "tsx" : "jsx";
  const componentsDir = analysis.hasSrc ? "src/components" : "components";

  // 1. Widget component
  files.push({
    path: `${componentsDir}/CarlaWidget.${ext}`,
    content: getWidgetTemplate(analysis.isTypeScript),
  });

  // 2. Modified entry point
  files.push({
    path: analysis.entryPointPath,
    content: modifyEntryPoint(analysis),
  });

  // 3. Environment variable example
  files.push({
    path: ".env.local.example",
    content: `# Carla AI Assistant API Key
# Get your key from: https://interworky.com/dashboard/settings
NEXT_PUBLIC_CARLA_API_KEY=your-api-key-here
`,
  });

  return files;
}

/**
 * Widget component template
 */
function getWidgetTemplate(isTypeScript) {
  return `'use client';

import { useEffect } from 'react';

const SCRIPT_SRC = 'https://storage.googleapis.com/multisync/interworky/production/interworky.js';
const API_KEY = process.env.NEXT_PUBLIC_CARLA_API_KEY;

export default function CarlaWidget() {
  useEffect(() => {
    if (!API_KEY) {
      console.warn('Carla: NEXT_PUBLIC_CARLA_API_KEY not found in environment variables');
      return;
    }

    const timeoutId = setTimeout(() => {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.dataset.apiKey = API_KEY;
      script.dataset.position = 'bottom-50 right-50';
      script.async = true;
      script.defer = true;

      script.onerror = (e${isTypeScript ? ": any" : ""}) => {
        console.error('Carla Plugin failed to load', e);
      };

      document.body.appendChild(script);
    }, 1500);

    return () => {
      clearTimeout(timeoutId);
      document.querySelectorAll('script[data-api-key]').forEach(s => s.remove());
    };
  }, []);

  return null;
}
`;
}

/**
 * Modify entry point to include widget
 * Supports: TypeScript/JavaScript + App Router/Pages Router
 */
function modifyEntryPoint(analysis) {
  const { routerType, entryPointContent, hasSrc, entryPointPath } = analysis;

  let modified = entryPointContent;

  // Determine correct import path based on router type and structure
  let importPath;
  if (routerType === "app") {
    // App Router: Always use @/components (Next.js 13+ has @ alias by default)
    importPath = "@/components/CarlaWidget";
  } else {
    // Pages Router: Depends on src directory
    if (hasSrc) {
      // pages/_app in root, components in src/components
      importPath = "@/components/CarlaWidget";
    } else {
      // Both pages/_app and components in root
      importPath = "../components/CarlaWidget";
    }
  }

  const importStatement = `import CarlaWidget from '${importPath}';\n`;

  console.log(
    `[SimpleIntegration] Modifying ${entryPointPath} (${routerType} router)`,
  );
  console.log(`[SimpleIntegration] Import path: ${importPath}`);

  if (routerType === "app") {
    // ==================== APP ROUTER ====================
    // Modify app/layout.tsx or src/app/layout.tsx
    if (!modified.includes("CarlaWidget")) {
      // 1. Add import after the last import statement
      const lastImportIndex = modified.lastIndexOf("import ");
      if (lastImportIndex !== -1) {
        const lineEnd = modified.indexOf("\n", lastImportIndex);
        modified =
          modified.slice(0, lineEnd + 1) +
          importStatement +
          modified.slice(lineEnd + 1);
      } else {
        // No imports found, add at the very top
        modified = importStatement + modified;
      }

      // 2. Add component before </body> closing tag
      if (modified.includes("</body>")) {
        modified = modified.replace(
          "</body>",
          "        <CarlaWidget />\n      </body>",
        );
      } else {
        console.warn(
          "[SimpleIntegration] Warning: Could not find </body> tag in App Router layout",
        );
      }
    }
  } else {
    // ==================== PAGES ROUTER ====================
    // Modify pages/_app.tsx or src/pages/_app.tsx
    if (!modified.includes("CarlaWidget")) {
      // 1. Add import after the last import statement
      const lastImportIndex = modified.lastIndexOf("import ");
      if (lastImportIndex !== -1) {
        const lineEnd = modified.indexOf("\n", lastImportIndex);
        modified =
          modified.slice(0, lineEnd + 1) +
          importStatement +
          modified.slice(lineEnd + 1);
      } else {
        // No imports found, add at the very top
        modified = importStatement + modified;
      }

      // 2. Add component inside the Component return
      // Strategy: Add right before the last </> or closing tag
      // Look for patterns like:
      // - </Component>
      // - </>
      // - </div>
      // - </main>

      // Find the closing of the main return statement
      // Most _app.tsx files return <Component {...pageProps} /> or similar
      const componentPattern = /<Component\s+[^>]*\/>/;
      if (componentPattern.test(modified)) {
        // Self-closing Component tag - need to wrap it
        modified = modified.replace(
          componentPattern,
          (match) => `<>\n        ${match}\n        <CarlaWidget />\n      </>`,
        );
      } else {
        // Look for the pattern: return ( ... )
        // Add before the last closing tag inside the return
        const returnMatch = modified.match(/return\s*\(([\s\S]*)\)/);
        if (returnMatch) {
          const returnContent = returnMatch[1];
          const lastClosingTag = returnContent.lastIndexOf("</");

          if (lastClosingTag !== -1) {
            const beforeClosing = returnContent.slice(0, lastClosingTag);
            const closingTag = returnContent.slice(lastClosingTag);
            const newReturnContent =
              beforeClosing + "      <CarlaWidget />\n      " + closingTag;
            modified = modified.replace(
              /return\s*\(([\s\S]*)\)/,
              `return (${newReturnContent})`,
            );
          }
        } else {
          console.warn(
            "[SimpleIntegration] Warning: Could not find return statement pattern in Pages Router _app",
          );
        }
      }
    }
  }

  return modified;
}

/**
 * Create GitHub PR
 */
async function createPR({ repoOwner, repoName, githubToken, files, analysis }) {
  const headers = {
    Authorization: `Bearer ${githubToken}`,
    Accept: "application/vnd.github+json",
  };

  // 1. Get default branch
  const repoUrl = `https://api.github.com/repos/${repoOwner}/${repoName}`;
  const repoData = await axios.get(repoUrl, { headers });
  const defaultBranch = repoData.data.default_branch;

  // 2. Get latest commit SHA
  const refUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/git/ref/heads/${defaultBranch}`;
  const refData = await axios.get(refUrl, { headers });
  const latestCommitSha = refData.data.object.sha;

  // 3. Get commit tree
  const commitUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/git/commits/${latestCommitSha}`;
  const commitData = await axios.get(commitUrl, { headers });
  const baseTreeSha = commitData.data.tree.sha;

  // 4. Create blobs for new files
  const tree = [];
  for (const file of files) {
    const blobUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/git/blobs`;
    const blobData = await axios.post(
      blobUrl,
      {
        content: file.content,
        encoding: "utf-8",
      },
      { headers },
    );

    tree.push({
      path: file.path,
      mode: "100644",
      type: "blob",
      sha: blobData.data.sha,
    });
  }

  // 5. Create new tree
  const treeUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/git/trees`;
  const treeData = await axios.post(
    treeUrl,
    {
      base_tree: baseTreeSha,
      tree,
    },
    { headers },
  );

  // 6. Create commit
  const newCommitUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/git/commits`;
  const newCommitData = await axios.post(
    newCommitUrl,
    {
      message: "feat: Add Carla AI widget integration",
      tree: treeData.data.sha,
      parents: [latestCommitSha],
    },
    { headers },
  );

  // 7. Create branch
  const branchName = `carla-integration-${Date.now()}`;
  const createRefUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/git/refs`;
  await axios.post(
    createRefUrl,
    {
      ref: `refs/heads/${branchName}`,
      sha: newCommitData.data.sha,
    },
    { headers },
  );

  // 8. Create PR
  const prUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/pulls`;
  const prData = await axios.post(
    prUrl,
    {
      title: "Add Carla AI Widget Integration",
      head: branchName,
      base: defaultBranch,
      body: generatePRDescription(analysis),
    },
    { headers },
  );

  return prData.data;
}

/**
 * Generate PR description
 */
function generatePRDescription(analysis) {
  return `## 🤖 Carla AI Widget Integration

This PR adds the Carla AI assistant widget to your Next.js application.

### Changes Made

- ✅ Created \`CarlaWidget\` component
- ✅ Added widget to your ${analysis.routerType === "app" ? "App Router layout" : "Pages Router _app"}
- ✅ Added environment variable example

### Project Details

- **Next.js Version**: ${analysis.nextVersion}
- **Router Type**: ${analysis.routerType === "app" ? "App Router" : "Pages Router"}
- **Language**: ${analysis.isTypeScript ? "TypeScript" : "JavaScript"}
- **Source Directory**: ${analysis.hasSrc ? "Yes (src/)" : "No"}

### Setup Instructions

1. Add your Carla API key to \`.env.local\`:
   \`\`\`bash
   NEXT_PUBLIC_CARLA_API_KEY=your-api-key-here
   \`\`\`

2. Get your API key from: https://interworky.com/dashboard/settings

3. Test the integration locally:
   \`\`\`bash
   npm run dev
   \`\`\`

4. The Carla widget should appear in the bottom-right corner

### Widget Behavior

- Loads after 1.5 second delay (prevents blocking page load)
- Positioned at bottom-right by default
- Only loads if \`NEXT_PUBLIC_CARLA_API_KEY\` is set
- Cleans up on component unmount

---

🚀 Generated by [Carla Auto-Integration](https://interworky.com)
`;
}

/**
 * Create manual instructions issue
 */
async function createManualIssue({ repoOwner, repoName, githubToken, reason }) {
  const headers = {
    Authorization: `Bearer ${githubToken}`,
    Accept: "application/vnd.github+json",
  };

  const issueUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/issues`;
  const issueData = await axios.post(
    issueUrl,
    {
      title: "Manual Carla AI Widget Integration Required",
      body: `## ⚠️ Manual Integration Needed

The automatic integration could not be completed for the following reason:

**${reason}**

### Manual Integration Steps

1. **Install the widget script in your HTML:**

\`\`\`html
<script
  src="https://storage.googleapis.com/multisync/interworky/production/interworky.js"
  data-api-key="YOUR_API_KEY"
  data-position="bottom-50 right-50"
  async
  defer
></script>
\`\`\`

2. **Get your API key from:** https://interworky.com/dashboard/settings

3. **For React/Next.js projects**, create a component:

\`\`\`jsx
'use client';

import { useEffect } from 'react';

export default function CarlaWidget() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://storage.googleapis.com/multisync/interworky/production/interworky.js';
    script.dataset.apiKey = process.env.NEXT_PUBLIC_CARLA_API_KEY;
    script.dataset.position = 'bottom-50 right-50';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  return null;
}
\`\`\`

### Need Help?

Contact support: hello@interworky.com

---

🤖 Generated by [Carla Auto-Integration](https://interworky.com)
`,
      labels: ["carla-integration", "help wanted"],
    },
    { headers },
  );

  return {
    success: true,
    manual: true,
    issue: {
      url: issueData.data.html_url,
      number: issueData.data.number,
    },
  };
}

/**
 * Try AI classification as fallback when deterministic fails
 */
async function tryAIClassification({ repoOwner, repoName, mcpServers }) {
  if (!mcpServers || !mcpServers[0]) {
    console.log(
      "[SimpleIntegration] No MCP servers available for AI classification",
    );
    return null;
  }

  // Use the already-connected GitHub MCP server instance
  const githubMCP = mcpServers[0];

  try {
    const { Runner } = require("@openai/agents");
    const { createClassifierAgent } = require("../agents/classifierAgent");

    console.log(
      "[SimpleIntegration] Using GitHub MCP server for AI classification...",
    );
    console.log(`[SimpleIntegration] Repository: ${repoOwner}/${repoName}`);

    // Create classifier agent with proper MCP server instance
    const classifierAgent = createClassifierAgent([githubMCP]);

    const runner = new Runner();
    const prompt = `Analyze the repository "${repoOwner}/${repoName}" and determine:
1. Is it a Next.js project?
2. TypeScript or JavaScript?
3. App Router or Pages Router?
4. Entry point file path
5. Uses src/ directory or not?

Use GitHub MCP servers to read files and search the codebase. Be thorough but efficient.`;

    console.log("[SimpleIntegration] Running classifier agent...");
    const result = await runner.run(classifierAgent, prompt, { stream: false });

    console.log("[SimpleIntegration] ✅ Classifier completed successfully");

    // Extract the actual classification from RunResult
    const output = result.state._currentStep?.output;
    const classification =
      typeof output === "string" ? JSON.parse(output) : output;

    console.log(
      "[SimpleIntegration] Classifier result:",
      JSON.stringify(classification, null, 2),
    );
    return classification;
  } catch (error) {
    console.error(
      "[SimpleIntegration] ❌ AI classification error:",
      error.message,
    );
    console.error("[SimpleIntegration] Error stack:", error.stack);
    return null;
  }
  // Note: MCP server cleanup handled by caller (app.js)
}

/**
 * Retry analysis using AI classification results
 */
async function retryWithAIClassification({
  repoOwner,
  repoName,
  githubToken,
  aiClassification,
}) {
  console.log("[SimpleIntegration] Retrying with AI classification...");

  const headers = {
    Authorization: `Bearer ${githubToken}`,
    Accept: "application/vnd.github+json",
  };

  try {
    if (!aiClassification.isNextJs) {
      return {
        canAutomate: false,
        reason: "AI determined this is not a Next.js project",
      };
    }

    // Fetch the entry point file content
    const entryPointContent = await fetchFile({
      repoOwner,
      repoName,
      path: aiClassification.entryPointPath,
      headers,
    });

    if (!entryPointContent) {
      return {
        canAutomate: false,
        reason: `AI found entry point ${aiClassification.entryPointPath} but file could not be fetched`,
      };
    }

    // Build analysis object from AI classification
    return {
      canAutomate: true,
      isNextJs: true,
      nextVersion: aiClassification.nextJsVersion || "unknown",
      isTypeScript: aiClassification.hasTypeScript,
      routerType: aiClassification.routerType,
      entryPointPath: aiClassification.entryPointPath,
      entryPointContent,
      hasSrc: aiClassification.hasSrcDirectory,
      detectionMethod: "ai-classifier",
    };
  } catch (error) {
    console.error(
      "[SimpleIntegration] Retry with AI classification error:",
      error,
    );
    return {
      canAutomate: false,
      reason: `Failed to process AI classification: ${error.message}`,
    };
  }
}

module.exports = {
  generateSimpleIntegrationPR,
};
