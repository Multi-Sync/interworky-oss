const { registerProvider, getProvider, clearProviderCache } = require('./registry');

// Load all provider modules (each auto-registers itself)
require('./ai');
require('./email');
require('./sms');
require('./storage');

// Convenience accessors
function getAIProvider() { return getProvider('ai'); }
function getEmailProvider() { return getProvider('email'); }
function getSMSProvider() { return getProvider('sms'); }
function getStorageProvider() { return getProvider('storage'); }

module.exports = {
  // Registry
  registerProvider,
  getProvider,
  clearProviderCache,
  // Typed accessors
  getAIProvider,
  getEmailProvider,
  getSMSProvider,
  getStorageProvider,
};
