/**
 * API Client for Carla Analytics Tools
 * Communicates with interworky-core API for analytics and performance data
 */

const axios = require("axios");

/**
 * Create API client scoped to an organization
 * @param {string} organizationId - Organization ID for scoping requests
 * @returns {Object} API client with methods for analytics
 */
function createApiClient(organizationId) {
  const baseURL = process.env.NODE_PUBLIC_API_URL;
  const token = process.env.ACCESS_TOKEN;

  const client = axios.create({
    baseURL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return {
    /**
     * Get error statistics for the organization
     * @param {Object} params - Query parameters (start_date, end_date)
     * @returns {Promise<Object>} Error statistics
     */
    async getErrorStatistics(params = {}) {
      try {
        const response = await client.get("/api/performance-monitoring/stats", {
          params: {
            organization_id: organizationId,
            ...params,
          },
        });
        return response.data;
      } catch (error) {
        console.error(
          "[ApiClient] Error fetching error statistics:",
          error.message,
        );
        throw new Error(`Failed to fetch error statistics: ${error.message}`);
      }
    },

    /**
     * Get recent errors for the organization
     * @param {Object} params - Query parameters (severity, error_type, status, limit)
     * @returns {Promise<Object>} Recent errors
     */
    async getRecentErrors(params = {}) {
      try {
        const response = await client.get(
          "/api/performance-monitoring/recent",
          {
            params: {
              organization_id: organizationId,
              ...params,
            },
          },
        );
        return response.data;
      } catch (error) {
        console.error(
          "[ApiClient] Error fetching recent errors:",
          error.message,
        );
        throw new Error(`Failed to fetch recent errors: ${error.message}`);
      }
    },

    /**
     * Get visitor journeys for the organization
     * @param {Object} params - Query parameters (limit, page, start_date, end_date)
     * @returns {Promise<Object>} Visitor journeys
     */
    async getVisitorJourneys(params = {}) {
      try {
        const response = await client.get("/api/visitor-journey", {
          params: {
            organization_id: organizationId,
            limit: params.limit || 50,
            page: params.page || 1,
            ...(params.start_date && { start_date: params.start_date }),
            ...(params.end_date && { end_date: params.end_date }),
          },
        });
        return response.data;
      } catch (error) {
        console.error(
          "[ApiClient] Error fetching visitor journeys:",
          error.message,
        );
        throw new Error(`Failed to fetch visitor journeys: ${error.message}`);
      }
    },

    /**
     * Get conversations for the organization
     * @param {Object} params - Query parameters (limit, start_date, end_date)
     * @returns {Promise<Object>} Conversations
     */
    async getConversations(params = {}) {
      try {
        const response = await client.get("/api/conversation", {
          params: {
            organization_id: organizationId,
            limit: params.limit || 50,
            ...(params.start_date && { start_date: params.start_date }),
            ...(params.end_date && { end_date: params.end_date }),
          },
        });
        return response.data;
      } catch (error) {
        console.error(
          "[ApiClient] Error fetching conversations:",
          error.message,
        );
        throw new Error(`Failed to fetch conversations: ${error.message}`);
      }
    },

    /**
     * Get details of a specific conversation
     * @param {string} conversationId - Conversation ID
     * @returns {Promise<Object>} Conversation details
     */
    async getConversationDetails(conversationId) {
      try {
        const response = await client.get(
          `/api/conversation/${conversationId}`,
        );
        return response.data;
      } catch (error) {
        console.error(
          "[ApiClient] Error fetching conversation details:",
          error.message,
        );
        throw new Error(
          `Failed to fetch conversation details: ${error.message}`,
        );
      }
    },
  };
}

module.exports = { createApiClient };
