/**
 * Repository Snapshot Service
 * Generates AI-optimized codebase snapshots using Repomix
 * Stores snapshots in GCP for use by Error Fix and Security Fix agents
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const axios = require("axios");
const FormData = require("form-data");
const { fetchGitHubConfig } = require("./githubConfigService");

// Repomix configuration for Next.js projects
const REPOMIX_CONFIG = {
  output: {
    filePath: "repo-snapshot.xml",
    style: "xml",
    removeComments: false, // Keep comments for AI context
    removeEmptyLines: true,
    showLineNumbers: true,
    copyToClipboard: false,
    topFilesLength: 20,
    includeEmptyDirectories: false,
  },
  ignore: {
    customPatterns: [
      // Dependencies
      "**/node_modules/**",
      // Build outputs
      "**/.next/**",
      "**/dist/**",
      "**/build/**",
      "**/out/**",
      "**/.turbo/**",
      // Cache
      "**/.cache/**",
      "**/coverage/**",
      "**/.nyc_output/**",
      // Test files (optional - can be included if needed)
      "**/*.test.js",
      "**/*.test.ts",
      "**/*.test.jsx",
      "**/*.test.tsx",
      "**/*.spec.js",
      "**/*.spec.ts",
      "**/__tests__/**",
      // Lock files
      "**/package-lock.json",
      "**/yarn.lock",
      "**/pnpm-lock.yaml",
      // Git
      "**/.git/**",
      // Source maps and minified files
      "**/*.map",
      "**/*.min.js",
      "**/*.min.css",
      // Static assets (large files)
      "**/public/assets/**",
      "**/public/images/**",
      "**/public/fonts/**",
      "**/*.png",
      "**/*.jpg",
      "**/*.jpeg",
      "**/*.gif",
      "**/*.svg",
      "**/*.ico",
      "**/*.woff",
      "**/*.woff2",
      "**/*.ttf",
      "**/*.eot",
      // Environment files (security)
      "**/.env*",
      "**/secrets/**",
      // IDE
      "**/.vscode/**",
      "**/.idea/**",
      // Misc
      "**/README.md",
      "**/CHANGELOG.md",
      "**/LICENSE",
      "**/*.log",
    ],
  },
  include: [], // Empty means include all (except ignored)
  security: {
    enableSecurityCheck: true,
  },
};

// Maximum snapshot size (in bytes) - 10MB
const MAX_SNAPSHOT_SIZE = 10 * 1024 * 1024;

// Maximum token count for GPT-5 context budget
const MAX_TOKEN_COUNT = 300000;

/**
 * Clone repository to temporary directory
 * @param {Object} params - { token, owner, repo }
 * @returns {Promise<string>} Path to cloned repository
 */
async function cloneRepository({ token, owner, repo }) {
  const timestamp = Date.now();
  const tempDir = path.join(
    os.tmpdir(),
    `repo-snapshot-${owner}-${repo}-${timestamp}`,
  );

  console.log(
    `[RepoSnapshot] 📥 Cloning ${owner}/${repo} to temp directory...`,
  );

  // Create temp directory
  fs.mkdirSync(tempDir, { recursive: true });

  // Clone with shallow depth (only latest commit)
  const cloneUrl = `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;

  try {
    const startTime = Date.now();
    execSync(`git clone --depth 1 "${cloneUrl}" "${tempDir}"`, {
      stdio: "pipe",
      timeout: 120000, // 2 minute timeout
    });
    const duration = Date.now() - startTime;
    console.log(
      `[RepoSnapshot] ✅ Clone completed in ${(duration / 1000).toFixed(1)}s`,
    );
    return tempDir;
  } catch (error) {
    console.error(
      `[RepoSnapshot] ❌ Clone failed for ${owner}/${repo}:`,
      error.message,
    );
    // Clean up on failure
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    throw new Error(`Failed to clone repository: ${error.message}`);
  }
}

/**
 * Get current commit SHA from cloned repo
 * @param {string} repoPath - Path to cloned repository
 * @returns {string} Commit SHA
 */
function getCommitSha(repoPath) {
  try {
    const sha = execSync("git rev-parse HEAD", {
      cwd: repoPath,
      encoding: "utf8",
    }).trim();
    return sha;
  } catch (_) {
    return "unknown";
  }
}

/**
 * Get default branch name
 * @param {string} repoPath - Path to cloned repository
 * @returns {string} Branch name
 */
function getBranchName(repoPath) {
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd: repoPath,
      encoding: "utf8",
    }).trim();
    return branch;
  } catch (_) {
    return "main";
  }
}

/**
 * Generate Repomix snapshot
 * @param {string} repoPath - Path to cloned repository
 * @returns {Promise<Object>} { snapshotPath, tokenCount, fileCount }
 */
async function generateSnapshot(repoPath) {
  console.log(`[RepoSnapshot] 📦 Running Repomix to generate snapshot...`);

  // Write config file
  const configPath = path.join(repoPath, "repomix.config.json");
  fs.writeFileSync(configPath, JSON.stringify(REPOMIX_CONFIG, null, 2));

  const outputPath = path.join(repoPath, "repo-snapshot.xml");

  try {
    const startTime = Date.now();

    // Run repomix CLI
    execSync(`npx repomix --config "${configPath}" --output "${outputPath}"`, {
      cwd: repoPath,
      encoding: "utf8",
      timeout: 300000, // 5 minute timeout
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer
    });

    const duration = Date.now() - startTime;

    // Check if output file exists
    if (!fs.existsSync(outputPath)) {
      throw new Error("Repomix did not generate output file");
    }

    // Get file stats
    const stats = fs.statSync(outputPath);

    // Estimate token count (rough: 4 chars per token)
    const content = fs.readFileSync(outputPath, "utf8");
    const estimatedTokens = Math.ceil(content.length / 4);

    // Count files in snapshot (parse XML for file count)
    const fileMatches = content.match(/<file\s+path="/g);
    const fileCount = fileMatches ? fileMatches.length : 0;

    console.log(
      `[RepoSnapshot] ✅ Repomix completed in ${(duration / 1000).toFixed(1)}s`,
    );
    console.log(
      `[RepoSnapshot]    Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`,
    );
    console.log(
      `[RepoSnapshot]    Tokens: ~${estimatedTokens.toLocaleString()}`,
    );
    console.log(`[RepoSnapshot]    Files: ${fileCount}`);

    return {
      snapshotPath: outputPath,
      tokenCount: estimatedTokens,
      fileCount,
      sizeBytes: stats.size,
    };
  } catch (error) {
    console.error(`[RepoSnapshot] ❌ Repomix failed:`, error.message);
    throw new Error(`Failed to generate snapshot: ${error.message}`);
  }
}

/**
 * Validate snapshot size and token count
 * @param {Object} snapshotInfo - { snapshotPath, tokenCount, fileCount, sizeBytes }
 * @returns {boolean} True if valid
 */
function validateSnapshot(snapshotInfo) {
  const { sizeBytes, tokenCount } = snapshotInfo;

  if (sizeBytes > MAX_SNAPSHOT_SIZE) {
    console.warn(
      `[RepoSnapshot] Snapshot too large: ${(sizeBytes / 1024 / 1024).toFixed(2)} MB > ${MAX_SNAPSHOT_SIZE / 1024 / 1024} MB`,
    );
    return false;
  }

  if (tokenCount > MAX_TOKEN_COUNT) {
    console.warn(
      `[RepoSnapshot] Token count too high: ${tokenCount} > ${MAX_TOKEN_COUNT}`,
    );
    return false;
  }

  return true;
}

/**
 * Upload snapshot to GCP via Core API
 * @param {string} organizationId - Organization ID
 * @param {string} snapshotPath - Path to snapshot file
 * @returns {Promise<string>} GCP URL
 */
async function uploadSnapshotToGCP(organizationId, snapshotPath) {
  const coreApiUrl = process.env.NODE_PUBLIC_API_URL;
  const accessToken = process.env.ACCESS_TOKEN;

  if (!accessToken) {
    console.error(`[RepoSnapshot] ❌ ACCESS_TOKEN not set for upload`);
    throw new Error("ACCESS_TOKEN environment variable is not set");
  }

  // Get file size for logging
  const fileStats = fs.statSync(snapshotPath);
  const fileSizeMB = (fileStats.size / 1024 / 1024).toFixed(2);
  console.log(
    `[RepoSnapshot] ☁️  Uploading snapshot to GCP (${fileSizeMB} MB)...`,
  );

  const form = new FormData();
  form.append("file", fs.createReadStream(snapshotPath), {
    filename: "repo-snapshot.xml",
    contentType: "application/xml",
  });

  try {
    const startTime = Date.now();
    const response = await axios.post(
      `${coreApiUrl}/api/organizations/upload`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${accessToken}`,
          "X-Organization-ID": organizationId,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      },
    );
    const duration = Date.now() - startTime;

    console.log(
      `[RepoSnapshot] ✅ Upload completed in ${(duration / 1000).toFixed(1)}s`,
    );
    console.log(`[RepoSnapshot]    URL: ${response.data.fileUrl}`);
    return response.data.fileUrl;
  } catch (error) {
    console.error(`[RepoSnapshot] ❌ Upload failed:`, error.message);
    if (error.response?.data) {
      console.error(`[RepoSnapshot]    API response:`, error.response.data);
    }
    throw new Error(`Failed to upload snapshot: ${error.message}`);
  }
}

/**
 * Update snapshot metadata in Core API
 * @param {string} organizationId - Organization ID
 * @param {Object} metadata - Snapshot metadata
 */
async function updateSnapshotMetadata(organizationId, metadata) {
  const coreApiUrl = process.env.NODE_PUBLIC_API_URL;
  const accessToken = process.env.ACCESS_TOKEN;

  if (!accessToken) {
    console.warn("[RepoSnapshot] No ACCESS_TOKEN, skipping metadata update");
    return;
  }

  try {
    await axios.put(
      `${coreApiUrl}/api/organization-version-control/${organizationId}/snapshot`,
      metadata,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    console.log(`[RepoSnapshot] Metadata updated for org ${organizationId}`);
  } catch (error) {
    console.error(`[RepoSnapshot] Failed to update metadata:`, error.message);
    // Don't throw - metadata update failure shouldn't block the process
  }
}

/**
 * Cleanup temporary directory
 * @param {string} tempDir - Path to temporary directory
 */
function cleanup(tempDir) {
  try {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log(`[RepoSnapshot] Cleaned up temp directory: ${tempDir}`);
    }
  } catch (error) {
    console.warn(`[RepoSnapshot] Failed to cleanup:`, error.message);
  }
}

/**
 * Main function: Generate repository snapshot
 * @param {Object} params - { organizationId, force }
 * @returns {Promise<Object>} Result with snapshot URL and metadata
 */
async function generateRepoSnapshot({ organizationId, force = false }) {
  console.log("[RepoSnapshot] ========================================");
  console.log(`[RepoSnapshot] STARTING SNAPSHOT GENERATION`);
  console.log(`[RepoSnapshot] Organization ID: ${organizationId}`);
  console.log(`[RepoSnapshot] Force: ${force}`);
  console.log("[RepoSnapshot] ========================================\n");

  let tempDir = null;

  try {
    // Step 1: Update status to generating
    await updateSnapshotMetadata(organizationId, {
      status: "generating",
    });

    // Step 2: Fetch GitHub configuration
    console.log(`[RepoSnapshot] Step 1: Fetching GitHub config...`);
    const githubConfig = await fetchGitHubConfig(organizationId);
    console.log(`[RepoSnapshot] Repository: ${githubConfig.repoFullName}`);

    // Step 3: Clone repository
    console.log(`[RepoSnapshot] Step 2: Cloning repository...`);
    tempDir = await cloneRepository(githubConfig);

    // Get commit info
    const commitSha = getCommitSha(tempDir);
    const branch = getBranchName(tempDir);
    console.log(`[RepoSnapshot] Commit: ${commitSha.substring(0, 7)}`);
    console.log(`[RepoSnapshot] Branch: ${branch}`);

    // Step 4: Generate Repomix snapshot
    console.log(`[RepoSnapshot] Step 3: Generating Repomix snapshot...`);
    const snapshotInfo = await generateSnapshot(tempDir);

    // Step 5: Validate snapshot
    console.log(`[RepoSnapshot] Step 4: Validating snapshot...`);
    if (!validateSnapshot(snapshotInfo)) {
      // Try with more aggressive filtering if too large
      console.log(
        `[RepoSnapshot] Snapshot too large, trying with compression...`,
      );
      // For now, we'll proceed with warning
      console.warn(
        `[RepoSnapshot] Warning: Snapshot exceeds recommended size limits`,
      );
    }

    // Step 6: Upload to GCP
    console.log(`[RepoSnapshot] Step 5: Uploading to GCP...`);
    const snapshotUrl = await uploadSnapshotToGCP(
      organizationId,
      snapshotInfo.snapshotPath,
    );

    // Step 7: Update metadata
    console.log(`[RepoSnapshot] Step 6: Updating metadata...`);
    const metadata = {
      status: "ready",
      snapshot_url: snapshotUrl,
      token_count: snapshotInfo.tokenCount,
      file_count: snapshotInfo.fileCount,
      size_bytes: snapshotInfo.sizeBytes,
      commit_sha: commitSha,
      branch: branch,
      generated_at: new Date().toISOString(),
    };
    await updateSnapshotMetadata(organizationId, metadata);

    console.log("[RepoSnapshot] ========================================");
    console.log(`[RepoSnapshot] SNAPSHOT GENERATION COMPLETED`);
    console.log(`[RepoSnapshot] URL: ${snapshotUrl}`);
    console.log(`[RepoSnapshot] Tokens: ${snapshotInfo.tokenCount}`);
    console.log(`[RepoSnapshot] Files: ${snapshotInfo.fileCount}`);
    console.log("[RepoSnapshot] ========================================\n");

    return {
      success: true,
      snapshot_url: snapshotUrl,
      token_count: snapshotInfo.tokenCount,
      file_count: snapshotInfo.fileCount,
      size_bytes: snapshotInfo.sizeBytes,
      commit_sha: commitSha,
      branch: branch,
    };
  } catch (error) {
    console.error("[RepoSnapshot] Snapshot generation failed:", error.message);
    console.error("[RepoSnapshot] Stack:", error.stack);

    // Update status to failed
    await updateSnapshotMetadata(organizationId, {
      status: "failed",
      error_message: error.message,
    });

    return {
      success: false,
      error: error.message,
    };
  } finally {
    // Cleanup
    cleanup(tempDir);
  }
}

/**
 * Fetch snapshot content from GCP
 * @param {string} snapshotUrl - GCP URL to snapshot
 * @returns {Promise<string>} Snapshot XML content
 */
async function fetchSnapshotContent(snapshotUrl) {
  if (!snapshotUrl) {
    console.error(`[RepoSnapshot] ❌ No snapshot URL provided`);
    throw new Error("No snapshot URL provided");
  }

  console.log(`[RepoSnapshot] 📥 Fetching snapshot from GCP...`);

  try {
    const startTime = Date.now();
    const response = await axios.get(snapshotUrl, {
      responseType: "text",
      timeout: 30000, // 30 second timeout
    });
    const duration = Date.now() - startTime;

    const charCount = response.data.length;
    const estimatedTokens = Math.ceil(charCount / 4);
    console.log(
      `[RepoSnapshot] ✅ Snapshot fetched in ${(duration / 1000).toFixed(1)}s`,
    );
    console.log(
      `[RepoSnapshot]    Size: ${(charCount / 1024 / 1024).toFixed(2)} MB (~${estimatedTokens.toLocaleString()} tokens)`,
    );

    return response.data;
  } catch (error) {
    console.error(`[RepoSnapshot] ❌ Failed to fetch snapshot:`, error.message);
    throw new Error(`Failed to fetch snapshot: ${error.message}`);
  }
}

/**
 * Check if snapshot is stale (older than threshold)
 * @param {Date|string} generatedAt - When snapshot was generated
 * @param {number} thresholdHours - Hours before considered stale (default: 6)
 * @returns {boolean} True if stale
 */
function isSnapshotStale(generatedAt, thresholdHours = 6) {
  if (!generatedAt) return true;

  const generatedDate = new Date(generatedAt);
  const now = new Date();
  const hoursDiff = (now - generatedDate) / (1000 * 60 * 60);

  return hoursDiff > thresholdHours;
}

/**
 * Get snapshot info for organization
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Object>} Snapshot info from database
 */
async function getSnapshotInfo(organizationId) {
  console.log(
    `[RepoSnapshot] 🔍 Checking snapshot status for org ${organizationId}...`,
  );

  const coreApiUrl = process.env.NODE_PUBLIC_API_URL;
  const accessToken = process.env.ACCESS_TOKEN;

  if (!accessToken) {
    console.error(`[RepoSnapshot] ❌ ACCESS_TOKEN not set`);
    throw new Error("ACCESS_TOKEN environment variable is not set");
  }

  try {
    const response = await axios.get(
      `${coreApiUrl}/api/organization-version-control/${organizationId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const data = response.data.data;
    const isStale = isSnapshotStale(data.repo_snapshot_generated_at);

    console.log(
      `[RepoSnapshot]    Status: ${data.repo_snapshot_status || "no snapshot"}`,
    );
    if (data.repo_snapshot_status === "ready") {
      console.log(
        `[RepoSnapshot]    Generated: ${data.repo_snapshot_generated_at || "unknown"} (stale: ${isStale})`,
      );
      console.log(
        `[RepoSnapshot]    Tokens: ${data.repo_snapshot_token_count?.toLocaleString() || "unknown"}`,
      );
    }

    return {
      snapshot_url: data.repo_snapshot_url,
      status: data.repo_snapshot_status,
      generated_at: data.repo_snapshot_generated_at,
      token_count: data.repo_snapshot_token_count,
      file_count: data.repo_snapshot_file_count,
      is_stale: isStale,
    };
  } catch (error) {
    console.error(
      `[RepoSnapshot] ❌ Failed to get snapshot info:`,
      error.message,
    );
    return null;
  }
}

/**
 * Ensure snapshot exists and is fresh, generate if needed
 * @param {string} organizationId - Organization ID
 * @returns {Promise<string>} Snapshot content
 */
async function ensureSnapshot(organizationId) {
  console.log(`[RepoSnapshot] ========================================`);
  console.log(`[RepoSnapshot] 🔄 ENSURING SNAPSHOT FOR ORG ${organizationId}`);
  console.log(`[RepoSnapshot] ========================================`);

  const startTime = Date.now();

  // Get current snapshot info
  const snapshotInfo = await getSnapshotInfo(organizationId);

  // Handle "generating" status - wait briefly then check again or use existing
  if (snapshotInfo?.status === "generating") {
    console.log(
      `[RepoSnapshot] ⏳ Snapshot currently being generated, waiting up to 60s...`,
    );
    // Wait up to 60 seconds for generation to complete
    for (let i = 0; i < 12; i++) {
      console.log(`[RepoSnapshot]    Waiting... (${(i + 1) * 5}s elapsed)`);
      await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 second intervals
      const updatedInfo = await getSnapshotInfo(organizationId);
      if (updatedInfo?.status === "ready" && updatedInfo?.snapshot_url) {
        console.log(
          `[RepoSnapshot] ✅ Snapshot generation completed, using new snapshot`,
        );
        const content = await fetchSnapshotContent(updatedInfo.snapshot_url);
        console.log(
          `[RepoSnapshot] ✅ ensureSnapshot completed in ${((Date.now() - startTime) / 1000).toFixed(1)}s`,
        );
        return content;
      }
      if (updatedInfo?.status === "failed") {
        console.log(
          `[RepoSnapshot] ⚠️ Snapshot generation failed, will regenerate`,
        );
        break; // Exit loop and fall through to generation
      }
    }
    // If still generating after 60s, use existing snapshot if available
    if (snapshotInfo.snapshot_url) {
      console.log(
        `[RepoSnapshot] ⚠️ Generation taking too long, using existing snapshot`,
      );
      const content = await fetchSnapshotContent(snapshotInfo.snapshot_url);
      console.log(
        `[RepoSnapshot] ✅ ensureSnapshot completed in ${((Date.now() - startTime) / 1000).toFixed(1)}s`,
      );
      return content;
    }
  }

  // Check if we need to generate
  const needsGeneration =
    !snapshotInfo ||
    !snapshotInfo.snapshot_url ||
    snapshotInfo.status === "failed" ||
    snapshotInfo.status === "pending" ||
    isSnapshotStale(snapshotInfo.generated_at, 24); // 24 hours for hard refresh

  if (needsGeneration) {
    const reason = !snapshotInfo
      ? "no snapshot"
      : !snapshotInfo.snapshot_url
        ? "no URL"
        : snapshotInfo.status === "failed"
          ? "previous generation failed"
          : snapshotInfo.status === "pending"
            ? "pending"
            : "stale (>24h)";
    console.log(
      `[RepoSnapshot] 🔨 Generating new snapshot (reason: ${reason})...`,
    );

    const result = await generateRepoSnapshot({ organizationId });

    if (!result.success) {
      console.error(`[RepoSnapshot] ❌ Generation failed: ${result.error}`);
      throw new Error(`Failed to generate snapshot: ${result.error}`);
    }

    const content = await fetchSnapshotContent(result.snapshot_url);
    console.log(
      `[RepoSnapshot] ✅ ensureSnapshot completed in ${((Date.now() - startTime) / 1000).toFixed(1)}s`,
    );
    return content;
  }

  // Check if stale (6 hours) - regenerate in background
  if (snapshotInfo.is_stale) {
    console.log(
      `[RepoSnapshot] 🔄 Snapshot stale (>6h), triggering background regeneration...`,
    );
    // Fire and forget - don't wait
    generateRepoSnapshot({ organizationId }).catch((err) => {
      console.error(
        `[RepoSnapshot] ❌ Background regeneration failed:`,
        err.message,
      );
    });
  } else {
    console.log(`[RepoSnapshot] ✅ Using existing fresh snapshot`);
  }

  // Return existing snapshot
  const content = await fetchSnapshotContent(snapshotInfo.snapshot_url);
  console.log(
    `[RepoSnapshot] ✅ ensureSnapshot completed in ${((Date.now() - startTime) / 1000).toFixed(1)}s`,
  );
  return content;
}

module.exports = {
  generateRepoSnapshot,
  getSnapshotInfo,
  ensureSnapshot,
};
