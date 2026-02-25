require("dotenv").config();
require("./instrument");

// Handle EPIPE errors globally (happens when writing to closed stdout/stderr)
// This is common with OpenAI SDK and console.log during connection issues
process.stdout.on('error', (err) => {
  if (err.code === 'EPIPE') {
    // Silently ignore EPIPE errors on stdout
    return;
  }
  console.error('[Process] stdout error:', err);
});

process.stderr.on('error', (err) => {
  if (err.code === 'EPIPE') {
    // Silently ignore EPIPE errors on stderr
    return;
  }
  console.error('[Process] stderr error:', err);
});

// Global unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  // Ignore EPIPE errors
  if (reason && reason.code === 'EPIPE') {
    return;
  }
  console.error('[Process] Unhandled Rejection:', reason);
});

const WebSocket = require("ws");
const http = require("http");
const OpenAI = require("openai");
const openAIKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
const {
  runInterworkyAssistant,
  runInterworkyAssistantLM,
  runCarlaAgent,
  runMobileAgent,
  fetchGitHubInstallationToken,
} = require("./ws-utils");
const { autoFixError } = require("./services/autoFixService");
const { fixSecurityVulnerability } = require("./services/securityFixService");
const {
  generateRepoSnapshot,
  getSnapshotInfo,
} = require("./services/repoSnapshotService");
const { extractIntent } = require("./agents/intentExtractorAgent");
const { generatePersonalization, generatePersonalizationWithJudge } = require("./agents/personalizationGeneratorAgent");
const server = http.createServer();
server.setTimeout(0);
const wsServer = new WebSocket.Server({ noServer: true });
const Sentry = require("@sentry/node");
const parser = require("ua-parser-js");
const axios = require("axios");

const clients = new Map();
const messageTimeTracker = new Map(); // Map to store last message timestamps

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: openAIKey,
  baseURL: process.env.AI_BASE_URL || "https://api.openai.com/v1",
});

wsServer.on("connection", async (ws, req) => {
  console.log(
    "[WebSocket] Client connected from:",
    req.headers.origin || "unknown origin",
  );
  const key = req.headers["sec-websocket-key"];
  clients.set(key, { ws, threadId: null, runId: null });
  const userAgent = req.headers["user-agent"];

  // Send connection acknowledgment
  try {
    ws.send(
      JSON.stringify({
        type: "connected",
        message: "WebSocket connection established",
        timestamp: new Date().toISOString(),
      }),
    );
    console.log("[WebSocket] Sent connection acknowledgment");
  } catch (error) {
    console.error("[WebSocket] Failed to send connection ack:", error);
  }

  // Parse the user-agent to get OS and device details
  const uaData = parser(userAgent);
  // Construct client metadata
  const userMetadata = {
    ip: req.socket.remoteAddress,
    language: req.headers["accept-language"] || "Unknown",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown",
    userAgent: req.headers["user-agent"],
    operatingSystem: uaData.os.name || "Unknown OS",
    deviceType: uaData.device.type || "desktop",
    origin: req.headers["origin"] || "Unknown origin",
    referer: req.headers["referer"] || "No referer provided",
    connectionType: req.headers["connection"] || "Unknown",
  };

  ws.on("error", (err) => {
    console.log("Error at the websocket ");
    console.error({ err });
    Sentry.captureException(err);
  });

  ws.on("message", async (message) => {
    try {
      if (message == "ping") {
        ws.send("pong");
        return;
      }
      console.log(`Received message ${message} from client ${key}`);
      const {
        organizationId,
        conversationId,
        assistantId,
        lmStudioUrl,
        lmStudioModelName,
        lmStudioSystemMessage,
        messageContent,
        email,
        name,
        userId,
        clientMetadata,
        voiceEnabled,
        useCarlaAgent,
        useMobileAgent,
        action, // Special action commands (e.g., "clear_conversation")
      } = JSON.parse(message);

      // Handle special actions
      if (action === "clear_conversation") {
        console.log("[App] Clearing conversation state for:", conversationId);
        const { clearConversationState } = require("./ws-utils");
        const cleared = clearConversationState(organizationId, conversationId);
        ws.send(
          JSON.stringify({
            type: "conversation_cleared",
            success: cleared,
          }),
        );
        return;
      }

      if (
        !organizationId ||
        (!assistantId &&
          !useCarlaAgent &&
          !useMobileAgent &&
          (!lmStudioUrl || !lmStudioModelName || !lmStudioSystemMessage)) ||
        !messageContent ||
        !email ||
        !name ||
        !clientMetadata ||
        (useCarlaAgent && !conversationId) || // Require conversationId for Carla agent
        (useMobileAgent && !conversationId) || // Require conversationId for Mobile agent
        (useMobileAgent && !userId) // Require userId for Mobile agent (file/task scoping)
      ) {
        ws.send(
          `Unauthorized Message, please contact hello@interworky.com if the issue persists.`,
        );
        return;
      }

      // Create a unique key for the user+org combination
      const timestampKey = `${email}:${organizationId}`;

      // Update the timestamp for this user+org
      messageTimeTracker.set(timestampKey, {
        lastMessageAt: new Date().toISOString(),
        email,
        organizationId,
      });

      // Log for debugging
      // console.log(
      //   `Updated timestamp for ${timestampKey}:`,
      //   messageTimeTracker.get(timestampKey),
      // );

      userMetadata.timeZone = clientMetadata.timeZone;
      userMetadata.language = clientMetadata.language;
      userMetadata.deviceType = clientMetadata.deviceType;
      userMetadata.origin = clientMetadata.origin;
      userMetadata.connectionType = clientMetadata.connectionType;
      userMetadata.todayDate = clientMetadata.todayDate;
      userMetadata.todayWeekday = clientMetadata.todayWeekday;

      // Route to appropriate handler based on message type
      if (useMobileAgent) {
        // Route to Mobile Agent (personal productivity assistant)
        console.log("[App] Routing to Mobile Agent (streaming)");
        console.log("[App] Conversation ID:", conversationId);
        console.log("[App] User ID:", userId);

        runMobileAgent(
          organizationId,
          conversationId,
          messageContent,
          email,
          name,
          userId,
          ws,
          userMetadata,
        );
      } else if (useCarlaAgent) {
        // NEW: Route to Carla Agent (Agents SDK with streaming)
        console.log("[App] Routing to Carla Agent (streaming)");
        console.log("[App] Conversation ID:", conversationId);

        // CRITICAL FIX: Fetch GitHub installation token if available
        const githubData = await fetchGitHubInstallationToken(organizationId);
        const mcpServers = [];

        if (githubData) {
          console.log("[App] ✓ GitHub App connected - creating MCP server");
          console.log("[App] Repository:", githubData.repository.full_name);

          try {
            // Create GitHub MCP server instance
            const { createGitHubMCP } = require("./mcp/createGitHubMCP");
            const githubMCP = await createGitHubMCP({
              token: githubData.token,
              owner: githubData.repository.owner,
              repo: githubData.repository.name,
            });
            mcpServers.push(githubMCP);
            console.log("[App] ✓ GitHub MCP server connected");
          } catch (error) {
            console.error(
              "[App] ✗ Failed to create GitHub MCP server:",
              error.message,
            );
          }
        } else {
          console.log(
            "[App] ℹ GitHub App not installed - agent will run without GitHub access",
          );
        }

        runCarlaAgent(
          organizationId,
          conversationId,
          messageContent,
          email,
          name,
          ws,
          userMetadata,
          mcpServers, // GitHubMCPServer instances
        );
      } else if (
        lmStudioUrl &&
        lmStudioUrl != "" &&
        lmStudioModelName &&
        lmStudioModelName != "" &&
        lmStudioSystemMessage &&
        lmStudioSystemMessage != ""
      ) {
        // Route to LM Studio (local models)
        console.log("[App] Routing to LM Studio");
        runInterworkyAssistantLM(
          messageContent,
          lmStudioSystemMessage,
          lmStudioModelName,
          ws,
          lmStudioUrl,
        );
      } else {
        // Route to OpenAI Assistants API (legacy/deprecated)
        console.log("[App] Routing to OpenAI Assistants API");
        runInterworkyAssistant(
          organizationId,
          assistantId,
          messageContent,
          email,
          name,
          ws,
          key,
          clients,
          userMetadata,
          voiceEnabled ?? false,
        );
      }
    } catch (error) {
      Sentry.captureException(error);
    }
  });

  ws.on("close", async (code, reason) => {
    console.log(
      `[WebSocket] Client disconnected. Code: ${code}, Reason: ${reason || "none"}`,
    );
    const clientData = clients.get(key);

    if (clientData && clientData.runId) {
      try {
        // Retrieve the current status of the run
        const runStatusResponse = await openai.beta.threads.runs.retrieve(
          clientData.threadId,
          clientData.runId,
        );
        const runStatus = runStatusResponse.status;

        // Only attempt to cancel the run if it's in a state that can be cancelled
        if (
          runStatus === "queued" ||
          runStatus === "in_progress" ||
          runStatus === "requires_action" ||
          runStatus === "cancelling" ||
          runStatus != "completed"
        ) {
          await openai.beta.threads.runs.cancel(
            clientData.threadId,
            clientData.runId,
          );
          // console.log("Run cancelled successfully");
        } else {
          // console.log(
          //   `Run cannot be cancelled because it is in a terminal state: ${runStatus}`,
          // );
        }
      } catch (error) {
        Sentry.captureException(error);
        console.error("Error checking or cancelling run:", error.message);
      }
    } else {
      // console.log("Could not locate run in clients map");
    }

    // Clean up the client data
    clients.delete(key);
  });
});

// HTTP endpoint for error fixing (Carla)
server.on("request", async (req, res) => {
  console.log(
    `[WS-Assistant HTTP] Incoming ${req.method} request to ${req.url}`,
  );

  // Auto-fix endpoint - analyzes errors and creates PRs
  if (req.method === "POST" && req.url === "/fix-error") {
    console.log("[FixError] === RECEIVED /fix-error REQUEST ===");
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      console.log(`[FixError] Received data chunk (${chunk.length} bytes)`);
    });
    req.on("end", async () => {
      try {
        console.log("[FixError] Request body:", body);
        const { errorId, organizationId } = JSON.parse(body);

        console.log("[FixError] ✅ Parsed request:", {
          errorId,
          organizationId,
        });

        console.log(
          `[FixError] 🚀 Starting auto-fix process for error: ${errorId}`,
        );

        // Start async fix process (don't wait for completion)
        autoFixError({ errorId, organizationId })
          .then(() => {
            console.log(
              `[FixError] ✅ Auto-fix process completed successfully for error: ${errorId}`,
            );
          })
          .catch((err) => {
            console.error("[FixError] ❌ Auto-fix process failed:", {
              errorId,
              errorMessage: err.message,
              errorStack: err.stack,
            });
          });

        console.log("[FixError] ✅ Responding with 202 Accepted");
        res.writeHead(202, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            message:
              "Auto-fix process started. Error will be analyzed and PR/issue created.",
          }),
        );
      } catch (error) {
        console.error("[FixError] ❌ Error processing request:", {
          errorMessage: error.message,
          errorStack: error.stack,
          rawBody: body,
        });
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else if (
    req.method === "POST" &&
    req.url === "/fix-security-vulnerability"
  ) {
    // Security vulnerability fix endpoint - analyzes CVEs and creates PRs
    console.log(
      "[SecurityFix] === RECEIVED /fix-security-vulnerability REQUEST ===",
    );
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      console.log(`[SecurityFix] Received data chunk (${chunk.length} bytes)`);
    });
    req.on("end", async () => {
      try {
        console.log("[SecurityFix] Request body:", body);
        const { organizationId, vulnerability, alertId } = JSON.parse(body);

        console.log("[SecurityFix] ✅ Parsed request:", {
          organizationId,
          cve_id: vulnerability?.cve_id,
          package_name: vulnerability?.package_name,
          severity: vulnerability?.severity,
          alertId,
        });

        if (!organizationId || !vulnerability) {
          console.error("[SecurityFix] ❌ Missing required fields");
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error:
                "Missing required fields: organizationId and vulnerability",
            }),
          );
          return;
        }

        console.log(
          `[SecurityFix] 🚀 Starting security fix process for ${vulnerability.cve_id}`,
        );

        // Start async fix process (don't wait for completion)
        fixSecurityVulnerability({ organizationId, vulnerability, alertId })
          .then((result) => {
            if (result.success) {
              console.log(
                `[SecurityFix] ✅ Security fix process completed for ${vulnerability.cve_id}`,
              );
              if (result.type === "pr") {
                console.log(`[SecurityFix] PR created: ${result.url}`);
              } else {
                console.log(`[SecurityFix] Skipped: ${result.reason}`);
              }
            } else {
              console.error(
                `[SecurityFix] ❌ Security fix failed: ${result.error}`,
              );
            }
          })
          .catch((err) => {
            console.error("[SecurityFix] ❌ Security fix process error:", {
              cve_id: vulnerability.cve_id,
              errorMessage: err.message,
              errorStack: err.stack,
            });
          });

        console.log("[SecurityFix] ✅ Responding with 202 Accepted");
        res.writeHead(202, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            message:
              "Security fix process started. Vulnerability will be analyzed and PR created if possible.",
          }),
        );
      } catch (error) {
        console.error("[SecurityFix] ❌ Error processing request:", {
          errorMessage: error.message,
          errorStack: error.stack,
          rawBody: body,
        });
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else if (req.method === "POST" && req.url === "/generate-repo-snapshot") {
    // Repository snapshot generation endpoint - creates Repomix snapshot
    console.log(
      "[RepoSnapshot] === RECEIVED /generate-repo-snapshot REQUEST ===",
    );
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      try {
        const { organizationId, force } = JSON.parse(body);

        console.log("[RepoSnapshot] Parsed request:", {
          organizationId,
          force: force || false,
        });

        if (!organizationId) {
          console.error("[RepoSnapshot] Missing organizationId");
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: "Missing required field: organizationId",
            }),
          );
          return;
        }

        console.log(
          `[RepoSnapshot] Starting snapshot generation for org ${organizationId}`,
        );

        // Start async snapshot generation (don't wait for completion)
        generateRepoSnapshot({ organizationId, force: force || false })
          .then((result) => {
            if (result.success) {
              console.log(
                `[RepoSnapshot] Snapshot generated: ${result.snapshot_url}`,
              );
              console.log(
                `[RepoSnapshot] Tokens: ${result.token_count}, Files: ${result.file_count}`,
              );
            } else {
              console.error(
                `[RepoSnapshot] Snapshot generation failed: ${result.error}`,
              );
            }
          })
          .catch((err) => {
            console.error("[RepoSnapshot] Snapshot generation error:", {
              errorMessage: err.message,
              errorStack: err.stack,
            });
          });

        console.log("[RepoSnapshot] Responding with 202 Accepted");
        res.writeHead(202, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            message:
              "Snapshot generation started. This may take 1-2 minutes for large repositories.",
          }),
        );
      } catch (error) {
        console.error("[RepoSnapshot] Error processing request:", {
          errorMessage: error.message,
          errorStack: error.stack,
          rawBody: body,
        });
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else if (req.method === "GET" && req.url.startsWith("/snapshot-status/")) {
    // Snapshot status endpoint
    const organizationId = req.url.split("/snapshot-status/")[1];
    console.log(`[RepoSnapshot] Status request for org: ${organizationId}`);

    if (!organizationId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing organizationId in URL" }));
      return;
    }

    try {
      const snapshotInfo = await getSnapshotInfo(organizationId);

      if (!snapshotInfo) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "No snapshot info found",
            status: "not_found",
          }),
        );
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(snapshotInfo));
    } catch (error) {
      console.error("[RepoSnapshot] Status check error:", error.message);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.message }));
    }
  } else if (req.method === "POST" && req.url === "/analyze-repository") {
    // Repository analysis endpoint - analyzes repo structure and patterns
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { organizationId } = JSON.parse(body);

        console.log(
          `[AnalyzeRepo] Received repository analysis request for org: ${organizationId}`,
        );

        // Import service dynamically to avoid circular dependencies
        const {
          analyzeRepository,
          fetchGitHubConfig,
        } = require("./services/repoAnalysisService");

        // Start async analysis process (don't wait for completion)
        (async () => {
          try {
            console.log(
              `[AnalyzeRepo] Fetching GitHub config for org: ${organizationId}`,
            );
            const githubConfig = await fetchGitHubConfig(organizationId);

            console.log(
              `[AnalyzeRepo] Starting repository analysis for ${githubConfig.owner}/${githubConfig.repo}`,
            );
            const result = await analyzeRepository({
              organizationId,
              githubConfig,
            });

            if (result.success) {
              console.log(
                `[AnalyzeRepo] ✅ Repository analysis complete for org: ${organizationId}`,
              );
            } else {
              console.error(
                `[AnalyzeRepo] ❌ Repository analysis failed for org: ${organizationId}:`,
                result.error,
              );
            }
          } catch (error) {
            console.error(
              "[AnalyzeRepo] Repository analysis process failed:",
              error,
            );
          }
        })();

        res.writeHead(202, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            message:
              "Repository analysis started in background. This may take 2-3 minutes.",
          }),
        );
      } catch (error) {
        console.error("[AnalyzeRepo] Error processing request:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else if (req.method === "POST" && req.url === "/generate-integration-pr") {
    // Generate Carla widget integration PR
    console.log("[GenerateIntegrationPR] ===== REQUEST RECEIVED =====");
    console.log("[GenerateIntegrationPR] Method:", req.method);
    console.log("[GenerateIntegrationPR] URL:", req.url);
    console.log(
      "[GenerateIntegrationPR] Headers:",
      JSON.stringify(req.headers, null, 2),
    );

    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      console.log(
        "[GenerateIntegrationPR] Receiving data chunk:",
        chunk.length,
        "bytes",
      );
    });
    req.on("end", async () => {
      try {
        console.log("[GenerateIntegrationPR] Raw body received:", body);

        const {
          organizationId,
          installationId,
          repoFullName,
          repoOwner,
          repoName,
        } = JSON.parse(body);

        console.log("[GenerateIntegrationPR] ===== PARSED REQUEST DATA =====");
        console.log(
          `[GenerateIntegrationPR] Organization ID: ${organizationId}`,
        );
        console.log(
          `[GenerateIntegrationPR] Installation ID: ${installationId}`,
        );
        console.log(`[GenerateIntegrationPR] Repo Full Name: ${repoFullName}`);
        console.log(`[GenerateIntegrationPR] Repo Owner: ${repoOwner}`);
        console.log(`[GenerateIntegrationPR] Repo Name: ${repoName}`);

        // Fetch GitHub installation token and create MCP servers using organizationId
        console.log(
          "[GenerateIntegrationPR] Fetching GitHub installation token...",
        );
        const mcpServers = await fetchGitHubInstallationToken(organizationId);

        if (!mcpServers) {
          console.error(
            "[GenerateIntegrationPR] ❌ Failed to fetch GitHub token",
          );
          throw new Error(
            `Failed to fetch GitHub installation token for organization ${organizationId}`,
          );
        }

        console.log(
          "[GenerateIntegrationPR] ✅ GitHub token fetched successfully",
        );
        console.log(
          "[GenerateIntegrationPR] Token:",
          mcpServers.token?.substring(0, 10) + "...",
        );

        // Import simple template-based integration service (no AI agents)
        const {
          generateSimpleIntegrationPR,
        } = require("./services/simpleIntegrationService");
        const { createGitHubMCP } = require("./mcp/createGitHubMCP");

        console.log("[GenerateIntegrationPR] Starting async PR generation...");

        // Create GitHub MCP server for AI classifier fallback
        let githubMCP = null;
        try {
          githubMCP = await createGitHubMCP({
            token: mcpServers.token,
            owner: mcpServers.repository.owner,
            repo: mcpServers.repository.name,
          });
          console.log("[GenerateIntegrationPR] ✓ GitHub MCP server created");
        } catch (error) {
          console.error(
            "[GenerateIntegrationPR] ✗ Failed to create GitHub MCP server:",
            error.message,
          );
        }

        // Start async PR generation (don't wait for completion)
        generateSimpleIntegrationPR({
          organizationId,
          installationId,
          repoFullName,
          repoOwner,
          repoName,
          githubToken: mcpServers.token,
          mcpServers: githubMCP ? [githubMCP] : [], // GitHubMCPServer instance for AI classifier
        })
          .then(async (result) => {
            console.log(
              "[GenerateIntegrationPR] ✅ PR generation completed successfully",
            );
            console.log(
              "[GenerateIntegrationPR] Result:",
              JSON.stringify(result, null, 2),
            );
            if (result.success && result.pr) {
              console.log(
                `[GenerateIntegrationPR] PR created: ${result.pr.url}`,
              );

              // Save PR URL to database
              try {
                const backendApiUrl = process.env.NODE_PUBLIC_API_URL;
                await axios.put(
                  `${backendApiUrl}/api/organization-version-control/${organizationId}/pr`,
                  {
                    pr_url: result.pr.url,
                    pr_number: result.pr.number,
                    pr_created_at: new Date(),
                  },
                );
                console.log(
                  `[GenerateIntegrationPR] PR URL saved to database for org ${organizationId}`,
                );
              } catch (dbError) {
                console.error(
                  "[GenerateIntegrationPR] Failed to save PR URL to database:",
                  dbError.message,
                );
              }
            }
          })
          .catch((err) => {
            console.error("[GenerateIntegrationPR] ❌ PR generation failed");
            console.error("[GenerateIntegrationPR] Error:", err);
            console.error("[GenerateIntegrationPR] Error stack:", err.stack);
          })
          .finally(async () => {
            // Cleanup MCP server connection
            if (githubMCP) {
              try {
                await githubMCP.close();
                console.log("[GenerateIntegrationPR] GitHub MCP server closed");
              } catch (cleanupError) {
                console.error(
                  "[GenerateIntegrationPR] Error closing MCP:",
                  cleanupError.message,
                );
              }
            }
          });

        console.log("[GenerateIntegrationPR] Sending 202 Accepted response...");
        res.writeHead(202, { "Content-Type": "application/json" });
        const responseBody = JSON.stringify({
          success: true,
          message:
            "Carla is generating the integration PR. Check your repository in a few moments.",
        });
        res.end(responseBody);
        console.log("[GenerateIntegrationPR] Response sent:", responseBody);
        console.log("[GenerateIntegrationPR] ===== REQUEST COMPLETE =====");
      } catch (error) {
        console.error("[GenerateIntegrationPR] ❌ ERROR processing request");
        console.error("[GenerateIntegrationPR] Error message:", error.message);
        console.error("[GenerateIntegrationPR] Error stack:", error.stack);
        console.error("[GenerateIntegrationPR] Error object:", error);

        res.writeHead(500, { "Content-Type": "application/json" });
        const errorResponse = JSON.stringify({ error: error.message });
        res.end(errorResponse);
        console.error(
          "[GenerateIntegrationPR] Error response sent:",
          errorResponse,
        );
      }
    });
  } else if (req.method === "POST" && req.url === "/extract-intent") {
    // Intent extraction endpoint for personalization
    console.log("[ExtractIntent] === RECEIVED /extract-intent REQUEST ===");
    let body = "";
    let responseSent = false;

    // Helper to safely send response
    const safeResponse = (statusCode, data) => {
      if (responseSent || res.writableEnded) {
        console.warn("[ExtractIntent] Response already sent, skipping");
        return;
      }
      responseSent = true;
      try {
        res.writeHead(statusCode, { "Content-Type": "application/json" });
        res.end(JSON.stringify(data));
      } catch (writeError) {
        if (writeError.code !== 'EPIPE') {
          console.error("[ExtractIntent] Error writing response:", writeError.message);
        }
      }
    };

    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      try {
        const { visitorJourney } = JSON.parse(body);

        if (!visitorJourney) {
          console.error("[ExtractIntent] Missing visitorJourney");
          safeResponse(400, { error: "Missing required field: visitorJourney" });
          return;
        }

        console.log("[ExtractIntent] Processing visitor:", visitorJourney.visitor_id);

        const result = await extractIntent(visitorJourney);

        console.log("[ExtractIntent] Intent extracted successfully");
        safeResponse(200, result);
      } catch (error) {
        console.error("[ExtractIntent] Error:", error.message);
        if (error.code !== 'EPIPE') {
          safeResponse(500, { error: error.message });
        }
      }
    });

    // Handle request errors
    req.on("error", (error) => {
      if (error.code !== 'EPIPE') {
        console.error("[ExtractIntent] Request error:", error.message);
      }
    });
  } else if (req.method === "POST" && req.url === "/generate-personalization") {
    // Personalization generation endpoint
    console.log("[GeneratePersonalization] === RECEIVED /generate-personalization REQUEST ===");
    let body = "";
    let responseSent = false;

    // Helper to safely send response
    const safeResponse = (statusCode, data) => {
      if (responseSent || res.writableEnded) {
        console.warn("[GeneratePersonalization] Response already sent, skipping");
        return;
      }
      responseSent = true;
      try {
        res.writeHead(statusCode, { "Content-Type": "application/json" });
        res.end(JSON.stringify(data));
      } catch (writeError) {
        if (writeError.code !== 'EPIPE') {
          console.error("[GeneratePersonalization] Error writing response:", writeError.message);
        }
      }
    };

    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      try {
        const { personalizationPrompt, personalizationObj, visitorId, originalWebsiteContent } = JSON.parse(body);

        if (!personalizationPrompt || !personalizationObj) {
          console.error("[GeneratePersonalization] Missing required fields");
          safeResponse(400, {
            error: "Missing required fields: personalizationPrompt, personalizationObj"
          });
          return;
        }

        console.log("[GeneratePersonalization] Processing for visitor:", visitorId);
        console.log("[GeneratePersonalization] Page URL:", personalizationObj.pageUrl);
        console.log("[GeneratePersonalization] Has original content:", !!originalWebsiteContent);
        console.log("[GeneratePersonalization] Original content length:", originalWebsiteContent?.length || 0);

        // Use judge loop if original content is available, otherwise use simple generation
        let result;
        if (originalWebsiteContent) {
          console.log("[GeneratePersonalization] Using judge-enhanced generation (max 3 turns)");
          result = await generatePersonalizationWithJudge(
            personalizationPrompt,
            personalizationObj,
            visitorId || "anonymous",
            originalWebsiteContent,
            3  // maxTurns
          );
        } else {
          console.log("[GeneratePersonalization] Using simple generation (no original content)");
          result = await generatePersonalization(
            personalizationPrompt,
            personalizationObj,
            visitorId || "anonymous"
          );
        }

        console.log("[GeneratePersonalization] Variation generated:", result.variationId);
        if (result.judgeTurns) {
          console.log("[GeneratePersonalization] Judge turns:", result.judgeTurns);
          console.log("[GeneratePersonalization] Judge score:", result.judgeScore);
        }
        safeResponse(200, result);
      } catch (error) {
        console.error("[GeneratePersonalization] Error:", error.message);
        if (error.code !== 'EPIPE') {
          safeResponse(500, { error: error.message });
        }
      }
    });

    // Handle request errors
    req.on("error", (error) => {
      if (error.code !== 'EPIPE') {
        console.error("[GeneratePersonalization] Request error:", error.message);
      }
    });
  } else if (req.method === "GET" && req.url === "/health") {
    // Health check endpoint
    console.log("[Health] Health check requested");
    res.writeHead(200, { "Content-Type": "application/json" });
    const healthResponse = {
      status: "healthy",
      service: "interworky-ws-assistant",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "unknown",
      port: process.env.PORT,
      activeConnections: clients.size,
      trackedConversations: messageTimeTracker.size,
    };
    res.end(JSON.stringify(healthResponse, null, 2));
    console.log("[Health] Response sent:", healthResponse);
  } else {
    // For all other HTTP requests, return 404
    console.log(
      `[HTTP] ❌ 404 Not Found - Method: ${req.method}, URL: ${req.url}`,
    );
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Not Found",
        method: req.method,
        url: req.url,
        availableEndpoints: [
          "POST /fix-error",
          "POST /fix-security-vulnerability",
          "POST /generate-repo-snapshot",
          "GET /snapshot-status/:organizationId",
          "POST /generate-integration-pr",
          "POST /analyze-repository",
          "POST /extract-intent",
          "POST /generate-personalization",
          "GET /health",
        ],
      }),
    );
  }
});

server.listen(process.env.PORT, () => {
  const address = server.address();
  console.log(`WebSocket is listening on ${address.port}`);
});

server.on("upgrade", (request, socket, head) => {
  console.log(
    "[WebSocket] Upgrade request received from:",
    request.headers.origin || "unknown",
  );
  console.log("[WebSocket] Headers:", JSON.stringify(request.headers, null, 2));

  wsServer.handleUpgrade(request, socket, head, (ws) => {
    console.log("[WebSocket] Upgrade successful, emitting connection event");
    wsServer.emit("connection", ws, request);
  });
});

const INTERVAL = 900000;
const THRESHOLD = 15;

// SET AN INTERVAL THAT RUNS EVERY 15 MINS AND SEND A REQUEST TO THE SERVER TO CLOSE THE CONVERSATION AND CLEANS THE TIMESTAMP MAP FROM OLD ENTRIES THAT PASSED 15 MINS
setInterval(() => {
  // const currentTime = new Date().toISOString();
  // console.log("Checking for old timestamps at", currentTime);

  // Iterate over the entries in the timestamp map
  for (const [key, value] of messageTimeTracker.entries()) {
    try {
      const lastMessageAt = new Date(value.lastMessageAt);
      const timeDifference = Math.abs(new Date() - lastMessageAt);
      const timeDifferenceMinutes = Math.floor(timeDifference / 60000);

      // If the time difference is greater than 15 minutes, remove the entry
      if (timeDifferenceMinutes > THRESHOLD) {
        console.log(`Removing old timestamp for ${key}`);
        messageTimeTracker.delete(key);
        console.log(
          `${process.env.NODE_PUBLIC_API_URL}/api/conversation/close/patient/${value.email}/organization/${value.organizationId}`,
        );
        axios.post(
          `${process.env.NODE_PUBLIC_API_URL}/api/conversation/close/patient/${value.email}/organization/${value.organizationId}`,
        );
      }
    } catch (error) {
      console.error("Error while cleaning up old timestamps:", error.message);
    }
  }
}, INTERVAL); // 15 minutes in milliseconds
