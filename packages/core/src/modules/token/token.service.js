// src/modules/token/token.service.js
const User = require('../user/user.model');
const TokenTransaction = require('./token.model');

const SIGNUP_BONUS = 1000000; // 1 million tokens

/**
 * Credit signup bonus to a new user
 */
async function creditSignupBonus(userId) {
  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new Error('User not found');
  }

  // Create transaction record
  await TokenTransaction.create({
    user_id: userId,
    type: 'signup_bonus',
    amount: SIGNUP_BONUS,
    balance_after: user.token_balance,
    metadata: { reason: 'New user signup bonus' },
  });

  return user.token_balance;
}

/**
 * Deduct tokens for flow usage
 * Returns { success, balance, error }
 */
async function deductFlowUsage(userId, flowId, tokenCost, sessionId, creatorId = null) {
  const user = await User.findOne({ id: userId });
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  if (user.token_balance < tokenCost) {
    return {
      success: false,
      error: 'Insufficient tokens',
      balance: user.token_balance,
      required: tokenCost,
    };
  }

  // Deduct tokens
  const newBalance = user.token_balance - tokenCost;
  await User.updateOne({ id: userId }, { token_balance: newBalance });

  // Record user's spend transaction
  await TokenTransaction.create({
    user_id: userId,
    type: 'flow_usage',
    amount: -tokenCost,
    balance_after: newBalance,
    flow_id: flowId,
    session_id: sessionId,
    creator_id: creatorId,
  });

  // If there's a creator, record their earning (for future payout)
  if (creatorId && creatorId !== userId) {
    // Creator gets a percentage (e.g., 70% of token cost)
    const creatorShare = Math.floor(tokenCost * 0.7);

    if (creatorShare > 0) {
      const creator = await User.findOne({ id: creatorId });
      if (creator) {
        const creatorNewBalance = creator.token_balance + creatorShare;
        await User.updateOne({ id: creatorId }, { token_balance: creatorNewBalance });

        await TokenTransaction.create({
          user_id: creatorId,
          type: 'creator_earning',
          amount: creatorShare,
          balance_after: creatorNewBalance,
          flow_id: flowId,
          session_id: sessionId,
          metadata: { from_user_id: userId },
        });
      }
    }
  }

  return { success: true, balance: newBalance };
}

/**
 * Check if user has enough tokens for a flow
 */
async function checkBalance(userId, tokenCost) {
  const user = await User.findOne({ id: userId });
  if (!user) {
    return { sufficient: false, balance: 0, error: 'User not found' };
  }

  return {
    sufficient: user.token_balance >= tokenCost,
    balance: user.token_balance,
    required: tokenCost,
  };
}

/**
 * Get user's token balance
 */
async function getBalance(userId) {
  const user = await User.findOne({ id: userId });
  if (!user) {
    return null;
  }
  return user.token_balance;
}

/**
 * Get user's transaction history
 */
async function getTransactionHistory(userId, limit = 50, offset = 0) {
  const transactions = await TokenTransaction.find({ user_id: userId })
    .sort({ created_at: -1 })
    .skip(offset)
    .limit(limit)
    .lean();

  const total = await TokenTransaction.countDocuments({ user_id: userId });

  return { transactions, total };
}

/**
 * Get creator earnings summary
 */
async function getCreatorEarnings(creatorId) {
  const earnings = await TokenTransaction.aggregate([
    { $match: { creator_id: creatorId, type: 'creator_earning' } },
    {
      $group: {
        _id: '$flow_id',
        total_earned: { $sum: '$amount' },
        usage_count: { $sum: 1 },
      },
    },
  ]);

  const totalEarned = earnings.reduce((sum, e) => sum + e.total_earned, 0);

  return { earnings_by_flow: earnings, total_earned: totalEarned };
}

module.exports = {
  SIGNUP_BONUS,
  creditSignupBonus,
  deductFlowUsage,
  checkBalance,
  getBalance,
  getTransactionHistory,
  getCreatorEarnings,
};
