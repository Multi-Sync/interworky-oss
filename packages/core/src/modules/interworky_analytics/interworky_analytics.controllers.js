const Conversation = require('../conversation/conversation.model');
const AssistantInfo = require('../assistant_info/assistant_info.model');
const { asyncHandler } = require('../../utils/asyncHandler');

// In-memory cache to store the result and timestamp
let cachedTopBots = null;
let lastFetchedTime = null;

const getTopBots = asyncHandler(async (req, res) => {
  const ONE_HOUR = 3600000; // 1 hour in milliseconds
  const now = Date.now();

  // Return cached data if available and not older than 1 hour
  if (cachedTopBots && lastFetchedTime && now - lastFetchedTime < ONE_HOUR) {
    return res.status(200).json({
      topBots: cachedTopBots,
      lastFetched: lastFetchedTime,
    });
  }

  // Aggregate conversation counts by organizationId
  const conversationCounts = await Conversation.aggregate([
    { $group: { _id: '$organizationId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  // For each top organization, fetch the corresponding AssistantInfo
  const topBots = await Promise.all(
    conversationCounts.map(async ({ _id, count }) => {
      const assistantInfo = await AssistantInfo.findOne({ organization_id: _id });
      if (!assistantInfo) return null;
      return { ...assistantInfo.toObject(), conversationCount: count };
    }),
  );

  // Filter out any null values (in case some organizations don't have an AssistantInfo)
  const filteredTopBots = topBots.filter(bot => bot !== null);

  // Cache the result and timestamp
  cachedTopBots = filteredTopBots;
  lastFetchedTime = now;

  res.status(200).json({
    topBots: filteredTopBots,
    lastFetched: lastFetchedTime,
  });
}, 'Failed to retrieve TopBots');

module.exports = {
  getTopBots,
};
