// Global in-memory caches
const vectorStoreCache = new Map(); // key: assistantId, value: vector_store_ids
const threadCache = new Map(); // key: `${email}:${assistantId}`, value: { threadId, firstMessage }

module.exports = {
  vectorStoreCache,
  threadCache,
};
