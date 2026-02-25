/**
 * Factory function to create tools with API client injected
 * Combines analytics tools, agent tools, context tools, and Next.js tools
 */

const { tool } = require("@openai/agents");
const { z } = require("zod");
const { createAgentTools } = require("./agentTools");
const { createContextTools } = require("./contextTools");
const { createNextjsTools } = require("./nextjsTools");

/**
 * Create all Carla tools (analytics + agent + context + Next.js tools)
 * @param {Object} apiClient - API client for analytics tools
 * @param {Array} mcpServers - MCP servers for repo agent (GitHub)
 * @returns {Array} Combined array of all tools
 */
function createCarlaTools(apiClient, mcpServers = []) {
  // Analytics tools
  const analyticsTools = [
    // ==================== PERFORMANCE MONITORING TOOLS ====================
    tool({
      name: "get_error_statistics",
      description:
        "Get comprehensive error statistics and metrics for an organization within a specific date range. Returns total errors, breakdown by type, severity, status, and recent error examples.",
      parameters: z.object({
        start_date: z
          .string()
          .nullable()
          .default(null)
          .describe(
            'Start date for the statistics in ISO 8601 format (e.g., "2025-10-10T00:00:00Z"). If not provided or null, defaults to 7 days ago.',
          ),
        end_date: z
          .string()
          .nullable()
          .default(null)
          .describe(
            'End date for the statistics in ISO 8601 format (e.g., "2025-10-17T23:59:59Z"). If not provided or null, defaults to now.',
          ),
      }),
      execute: async (input) => {
        // Calculate default dates if not provided (7 days ago to now)
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const result = await apiClient.getErrorStatistics({
          start_date: input.start_date || sevenDaysAgo.toISOString(),
          end_date: input.end_date || now.toISOString(),
        });
        return JSON.stringify(result);
      },
    }),

    tool({
      name: "get_recent_errors",
      description:
        "Retrieve recent errors with optional filtering by severity, error type, or status. Useful for investigating specific types of issues or high-priority errors.",
      parameters: z.object({
        severity: z
          .enum(["low", "medium", "high", "critical"])
          .nullable()
          .default(null)
          .describe("Filter by error severity level. Null means no filter."),
        error_type: z
          .string()
          .nullable()
          .default(null)
          .describe(
            'Filter by error type (e.g., "console_error", "network_error"). Null means no filter.',
          ),
        status: z
          .enum(["new", "in_progress", "resolved"])
          .nullable()
          .default(null)
          .describe("Filter by error status. Null means no filter."),
        limit: z
          .number()
          .default(20)
          .describe(
            "Maximum number of errors to return (1-100). Defaults to 20.",
          ),
      }),
      execute: async (input) => {
        const result = await apiClient.getRecentErrors({
          severity: input.severity || undefined,
          error_type: input.error_type || undefined,
          status: input.status || undefined,
          limit: input.limit,
        });
        return JSON.stringify(result);
      },
    }),

    // ==================== ANALYTICS TOOLS ====================
    tool({
      name: "get_visitor_journeys",
      description:
        "Get detailed visitor journey data including page views, engagement metrics, and conversion events. Provides insights into how visitors interact with the website.",
      parameters: z.object({
        limit: z
          .number()
          .default(50)
          .describe("Number of journeys to retrieve (max 100)"),
        page: z.number().default(1).describe("Page number for pagination"),
        start_date: z
          .string()
          .nullable()
          .default(null)
          .describe("Start date filter (ISO 8601 format)"),
        end_date: z
          .string()
          .nullable()
          .default(null)
          .describe("End date filter (ISO 8601 format)"),
      }),
      execute: async (input) => {
        const result = await apiClient.getVisitorJourneys({
          limit: input.limit,
          page: input.page,
          start_date: input.start_date || undefined,
          end_date: input.end_date || undefined,
        });
        return JSON.stringify(result);
      },
    }),

    // ==================== CONVERSATION TOOLS ====================
    tool({
      name: "get_conversations",
      description:
        "Retrieve conversations between visitors and the assistant. Useful for analyzing customer interactions, common questions, and engagement patterns.",
      parameters: z.object({
        limit: z
          .number()
          .default(50)
          .describe("Number of conversations to retrieve"),
        start_date: z
          .string()
          .nullable()
          .default(null)
          .describe("Filter conversations from this date"),
        end_date: z
          .string()
          .nullable()
          .default(null)
          .describe("Filter conversations until this date"),
      }),
      execute: async (input) => {
        const result = await apiClient.getConversations({
          limit: input.limit,
          start_date: input.start_date || undefined,
          end_date: input.end_date || undefined,
        });
        return JSON.stringify(result);
      },
    }),

    tool({
      name: "get_conversation_details",
      description:
        "Get detailed information about a specific conversation including all messages, timestamps, and metadata.",
      parameters: z.object({
        conversation_id: z
          .string()
          .describe("The ID of the conversation to retrieve"),
      }),
      execute: async (input) => {
        const result = await apiClient.getConversationDetails(
          input.conversation_id,
        );
        return JSON.stringify(result);
      },
    }),
  ];

  // Agent tools (multi-agent system)
  const agentTools = createAgentTools(mcpServers);

  // Context gathering tools (for understanding projects before making changes)
  const contextTools = createContextTools(mcpServers);

  // Next.js domain-specific tools (high-level operations)
  const nextjsTools = createNextjsTools(apiClient, mcpServers);

  // Combine and return all tools
  return [...analyticsTools, ...agentTools, ...contextTools, ...nextjsTools];
}

module.exports = { createCarlaTools };
