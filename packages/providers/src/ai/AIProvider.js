/**
 * AIProvider — Base class for AI service providers.
 *
 * All AI providers must implement these methods.
 * The default implementation (OpenAIProvider) supports any
 * OpenAI-compatible API via AI_BASE_URL.
 */
class AIProvider {
  /**
   * Send a chat completion request.
   * @param {Array} messages - Array of { role, content } message objects
   * @param {object} [opts] - Additional options (model, temperature, tools, etc.)
   * @returns {Promise<object>} Chat completion response
   */
  async chat(messages, opts = {}) {
    throw new Error('chat() not implemented');
  }

  /**
   * Send a streaming chat completion request.
   * @param {Array} messages - Array of { role, content } message objects
   * @param {object} [opts] - Additional options
   * @returns {AsyncIterable} Stream of completion chunks
   */
  async stream(messages, opts = {}) {
    throw new Error('stream() not implemented');
  }

  /**
   * Create a realtime session (for voice/WebRTC).
   * @param {object} [config] - Session configuration
   * @returns {Promise<object>} Session data with client secret
   */
  async createSession(config = {}) {
    throw new Error('createSession() not implemented');
  }

  /**
   * Get the underlying client instance (for advanced usage).
   * @returns {object} The raw SDK client
   */
  getClient() {
    throw new Error('getClient() not implemented');
  }
}

module.exports = AIProvider;
