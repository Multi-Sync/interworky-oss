/**
 * Abstract Base Connector
 * All connectors (Google Calendar, Outlook, Slack, etc.) should extend this.
 * Provides a unified interface for OAuth, data sync, and capability registration.
 */
class BaseConnector {
  constructor(connectorType, displayName) {
    this.connectorType = connectorType;
    this.displayName = displayName;
  }

  /**
   * Generate OAuth authorization URL
   * @returns {string} Auth URL to redirect user to
   */
  getAuthUrl(userId, organizationId) {
    throw new Error('getAuthUrl() must be implemented');
  }

  /**
   * Exchange authorization code for tokens
   * @returns {Object} Token data
   */
  async exchangeCode(code) {
    throw new Error('exchangeCode() must be implemented');
  }

  /**
   * Refresh an expired access token
   * @returns {Object} New token data
   */
  async refreshToken(refreshToken) {
    throw new Error('refreshToken() must be implemented');
  }

  /**
   * Get a valid access token (with auto-refresh)
   * @returns {string} Valid access token
   */
  async getAccessToken(userId) {
    throw new Error('getAccessToken() must be implemented');
  }

  /**
   * Fetch data from the connector
   * @param {string} resource - Resource type to fetch
   * @param {Object} params - Query parameters
   * @returns {Array} Data items
   */
  async fetchData(userId, resource, params = {}) {
    throw new Error('fetchData() must be implemented');
  }

  /**
   * Push/create data to the connector
   * @param {string} resource - Resource type
   * @param {Object} data - Data to push
   * @returns {Object} Created resource
   */
  async pushData(userId, resource, data) {
    throw new Error('pushData() must be implemented');
  }

  /**
   * Get the capabilities this connector provides for AI assistant
   * @returns {Array} Capability definitions
   */
  getCapabilities() {
    return [];
  }

  /**
   * Get available connectors catalog
   */
  static getAvailableConnectors() {
    return [
      {
        type: 'google_calendar',
        name: 'Google Calendar',
        description: 'Sync your Google Calendar events',
        icon: 'calendar',
        category: 'productivity',
        status: 'available',
      },
      {
        type: 'outlook_calendar',
        name: 'Outlook Calendar',
        description: 'Sync your Outlook/Microsoft 365 calendar',
        icon: 'calendar',
        category: 'productivity',
        status: 'available',
      },
      {
        type: 'github',
        name: 'GitHub',
        description: 'Connect your repositories',
        icon: 'code',
        category: 'development',
        status: 'available',
      },
      {
        type: 'wix',
        name: 'Wix',
        description: 'Manage your Wix site and orders',
        icon: 'globe',
        category: 'business',
        status: 'available',
      },
      {
        type: 'slack',
        name: 'Slack',
        description: 'Connect your Slack workspace',
        icon: 'message',
        category: 'communication',
        status: 'coming_soon',
      },
      {
        type: 'trello',
        name: 'Trello',
        description: 'Sync your Trello boards',
        icon: 'board',
        category: 'productivity',
        status: 'coming_soon',
      },
      {
        type: 'notion',
        name: 'Notion',
        description: 'Connect your Notion workspace',
        icon: 'document',
        category: 'productivity',
        status: 'coming_soon',
      },
      {
        type: 'quickbooks',
        name: 'QuickBooks',
        description: 'Manage invoices and finances',
        icon: 'dollar',
        category: 'finance',
        status: 'coming_soon',
      },
    ];
  }
}

module.exports = BaseConnector;
