/**
 * Provider Registry
 *
 * A simple map-based registry for pluggable service providers.
 * Providers register themselves by type (ai, email, sms, storage) and name.
 * The active provider is selected via environment variable: <TYPE>_PROVIDER
 *
 * Example:
 *   EMAIL_PROVIDER=smtp → uses the 'smtp' email provider
 *   EMAIL_PROVIDER=console → uses the 'console' email provider (default)
 */

const providers = {};

/**
 * Register a provider factory.
 * @param {string} type - Provider type (e.g. 'ai', 'email', 'sms', 'storage')
 * @param {string} name - Provider name (e.g. 'openai', 'console', 'smtp')
 * @param {Function} factory - Factory function that returns a provider instance
 */
function registerProvider(type, name, factory) {
  if (!providers[type]) {
    providers[type] = {};
  }
  providers[type][name] = factory;
}

// Cache instantiated providers so factories are only called once
const instances = {};

/**
 * Get the active provider for a given type.
 * Reads <TYPE>_PROVIDER from env to select which provider to use.
 * Falls back to 'default' if not specified.
 * @param {string} type - Provider type
 * @returns {object} Provider instance
 */
function getProvider(type) {
  if (instances[type]) {
    return instances[type];
  }

  const envKey = `${type.toUpperCase()}_PROVIDER`;
  const name = process.env[envKey] || 'default';
  const typeProviders = providers[type];

  if (!typeProviders) {
    throw new Error(`No providers registered for type: ${type}`);
  }

  const factory = typeProviders[name] || typeProviders['default'];
  if (!factory) {
    throw new Error(
      `Provider "${name}" not found for type "${type}". Available: ${Object.keys(typeProviders).join(', ')}`
    );
  }

  instances[type] = factory();
  return instances[type];
}

/**
 * Clear cached provider instances (useful for testing).
 */
function clearProviderCache() {
  for (const key of Object.keys(instances)) {
    delete instances[key];
  }
}

module.exports = { registerProvider, getProvider, clearProviderCache };
