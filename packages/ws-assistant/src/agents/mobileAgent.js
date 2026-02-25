/**
 * Mobile Agent - Personal productivity assistant for the Interworky mobile app
 * Uses OpenAI Agents SDK for streaming real-time responses via WebSocket
 */

const { Agent } = require("@openai/agents");
const { createMobileTools } = require("../tools/mobileTools");
const { getMobileSystemInstructions } = require("./mobileSystemInstructions");

/**
 * Create Mobile Agent instance with productivity tools
 * @param {string} organizationId - Organization ID for scoping API calls
 * @param {Object} userContext - User context for personalization
 * @param {string} userContext.userId - User ID
 * @param {string} userContext.email - User email
 * @param {string} userContext.name - User display name
 * @param {string} userContext.timezone - User timezone (e.g. "America/New_York")
 * @param {string} userContext.organizationId - Organization ID
 * @returns {Agent} Configured mobile agent instance
 */
function createMobileAgent(organizationId, userContext) {
  console.log("\n========== CREATING MOBILE AGENT ==========");
  console.log("[MobileAgent] Organization ID:", organizationId);
  console.log("[MobileAgent] User:", userContext.email);

  // Create tools scoped to this user/org
  const tools = createMobileTools(organizationId, userContext);

  console.log("[MobileAgent] Total tools loaded:", tools.length);
  console.log("[MobileAgent] Tools:", tools.map((t) => t.name).join(", "));

  // Build dynamic system instructions with user context
  const instructions = getMobileSystemInstructions(userContext);

  const agent = new Agent({
    name: "Interworky Assistant",
    instructions,
    model: process.env.AI_MODEL || "gpt-4o",
    tools,
  });

  console.log("[MobileAgent] Agent created successfully");
  console.log("========== MOBILE AGENT READY ==========\n");

  return agent;
}

module.exports = { createMobileAgent };
