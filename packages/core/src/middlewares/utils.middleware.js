const { getConfig } = require('dotenv-handler');
const Organization = require('../modules/organization/organization.model');
const Conversation = require('../modules/conversation/conversation.model');

// OSS: All features are always available — no subscription gating
const checkSubscriptionStatus = async (_organizationId) => {
  return true;
};

const checkMessageLimit = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findOne({ id: conversationId });
    if (!conversation) {
      return res.status(400).json({
        error: 'Cannot find conversation',
        message: 'Conversation not found',
        code: 'CONVERSATION_NOT_FOUND',
      });
    }

    // OSS: No message limits
    next();
  } catch (error) {
    console.error('Error checking message limit:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to check message limit',
      code: 'MESSAGE_LIMIT_CHECK_FAILED',
    });
  }
};

module.exports = {
  checkMessageLimit,
  checkSubscriptionStatus,
};
