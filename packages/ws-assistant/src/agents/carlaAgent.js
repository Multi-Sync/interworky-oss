/**
 * Carla Agent - Main AI Agent for Analytics and Performance Assistant
 * Uses OpenAI Agents SDK for streaming real-time responses via WebSocket
 */

const { Agent } = require("@openai/agents");
const { createCarlaTools } = require("../tools");
const { createApiClient } = require("../services/apiClient");
const { systemInstructions } = require("./systemInstructions");

/**
 * Create Carla Agent instance with all tools
 * @param {string} organizationId - Organization ID for scoping API calls
 * @param {Array} mcpServers - MCP servers for GitHub access (optional)
 * @returns {Agent} Configured Carla agent instance
 */
function createCarlaAgent(organizationId, mcpServers = []) {
  console.log("\n========== CREATING CARLA AGENT ==========");
  console.log("[CarlaAgent] Organization ID:", organizationId);
  console.log(
    "[CarlaAgent] MCP Servers available:",
    mcpServers.length > 0 ? "Yes (GitHub)" : "No",
  );

  // Create API client for analytics tools (scoped to organization)
  const apiClient = createApiClient(organizationId);

  // Create all tools (analytics + agents + context + Next.js)
  const tools = createCarlaTools(apiClient, mcpServers);

  console.log("[CarlaAgent] Total tools loaded:", tools.length);
  console.log("[CarlaAgent] Tools:", tools.map((t) => t.name).join(", "));

  // Create the agent with all capabilities
  const agent = new Agent({
    name: "Carla",
    instructions: systemInstructions,
    model: process.env.AI_MODEL || "gpt-4o",
    tools: tools,
    ...(mcpServers.length > 0 && { mcpServers: mcpServers }),
  });

  console.log("[CarlaAgent] ✓ Agent created successfully");
  console.log("========== CARLA AGENT READY ==========\n");

  return agent;
}

module.exports = { createCarlaAgent };
