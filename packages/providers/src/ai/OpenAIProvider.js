const OpenAI = require('openai');
const AIProvider = require('./AIProvider');
const { registerProvider } = require('../registry');

/**
 * OpenAI-compatible AI provider.
 *
 * Works with OpenAI, Ollama, LM Studio, vLLM, Together AI, or any
 * service that exposes an OpenAI-compatible API.
 *
 * Env vars:
 *   AI_API_KEY    — API key (required for OpenAI; use "ollama" for Ollama)
 *   AI_BASE_URL   — Base URL (default: https://api.openai.com/v1)
 *   AI_MODEL      — Default model name (default: gpt-4o)
 *   AI_REALTIME_MODEL — Realtime/voice model (default: gpt-4o-realtime-preview-2024-12-17)
 */
class OpenAIProvider extends AIProvider {
  constructor() {
    super();
    this.apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || 'not-configured';
    this.baseURL = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
    this.model = process.env.AI_MODEL || 'gpt-4o';
    this.realtimeModel = process.env.AI_REALTIME_MODEL || 'gpt-4o-realtime-preview-2024-12-17';

    if (this.apiKey === 'not-configured') {
      console.warn('[AIProvider] No AI_API_KEY set. AI features will not work until configured.');
    }

    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.baseURL,
    });
  }

  async chat(messages, opts = {}) {
    const response = await this.client.chat.completions.create({
      model: opts.model || this.model,
      messages,
      ...opts,
    });
    return response;
  }

  async stream(messages, opts = {}) {
    const response = await this.client.chat.completions.create({
      model: opts.model || this.model,
      messages,
      stream: true,
      ...opts,
    });
    return response;
  }

  async createSession(config = {}) {
    try {
      const response = await this.client.realtime.clientSecrets.create({
        session: {
          type: 'realtime',
          model: config.model || this.realtimeModel,
          ...config,
        },
      });
      return response;
    } catch (error) {
      // Graceful fallback: if realtime isn't supported (non-OpenAI provider)
      const isUnsupported =
        error.status === 404 ||
        error.status === 405 ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        error.message?.includes('not found') ||
        error.message?.includes('not supported');

      if (isUnsupported) {
        console.warn(
          `[AIProvider] Realtime sessions not available at ${this.baseURL}. Voice features disabled.`
        );
        return null;
      }
      throw error;
    }
  }

  getClient() {
    return this.client;
  }
}

// Register as both 'openai' and 'default'
registerProvider('ai', 'openai', () => new OpenAIProvider());
registerProvider('ai', 'default', () => new OpenAIProvider());

module.exports = OpenAIProvider;
