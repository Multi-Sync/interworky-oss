// src/modules/flow/flow-auth.controller.js
/**
 * Flow Authentication Controller
 * Handles OAuth for standalone flow users (not organization members)
 */

const User = require('../user/user.model');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getConfig } = require('dotenv-handler');
const { asyncHandler } = require('../../utils/asyncHandler');
const HttpError = require('../../utils/HttpError');
const tokenService = require('../token/token.service');
const sendSlackMessage = require('../../utils/slackCVP');

const JWT_SECRET = getConfig('JWT_SECRET');

/**
 * Continue with Google OAuth for flow users
 * Creates a standalone user (not org member) with token balance
 */
exports.flowGoogleAuth = asyncHandler(async (req, res) => {
  const { email, name, avatar_url, oauth_id } = req.body;

  if (!email || !name) {
    throw new HttpError('Email and name are required').BadRequest();
  }

  // Check if user already exists
  let user = await User.findOne({ email });
  let isNewUser = false;

  if (user) {
    // Lazy migration: Check if user has flow-related fields
    // If not, add them and credit signup bonus (for legacy dashboard users)
    if (user.token_balance === undefined || user.token_balance === null) {
      user.token_balance = tokenService.SIGNUP_BONUS;
      user.account_type = user.account_type || 'legacy';
      user.source = user.source || 'dashboard';

      // Update avatar if provided and user doesn't have one
      if (avatar_url && !user.avatar_url) {
        user.avatar_url = avatar_url;
      }

      await user.save();

      // Record signup bonus transaction for migrated user
      await tokenService.creditSignupBonus(user.id);

      // Notify Slack about migrated user
      sendSlackMessage(
        `🔄 Legacy User Migrated to Flow!\nEmail: ${user.email}\nName: ${user.first_name} ${user.last_name}\nTokens: ${tokenService.SIGNUP_BONUS.toLocaleString()}`
      );
    }

    // Generate token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: '30d', // Longer expiry for flow users
    });

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar_url: user.avatar_url,
        token_balance: user.token_balance,
        account_type: user.account_type,
      },
      is_new_user: false,
    });
  }

  // Create new standalone user
  const nameParts = name.trim().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || '';

  user = new User({
    id: uuidv4(),
    first_name: firstName,
    last_name: lastName,
    email,
    password: null, // No password for OAuth users
    status: 'active',
    source: 'flow',
    account_type: 'standalone',
    token_balance: tokenService.SIGNUP_BONUS,
    oauth_provider: 'google',
    oauth_id: oauth_id || null,
    avatar_url: avatar_url || null,
  });

  await user.save();
  isNewUser = true;

  // Record signup bonus transaction
  await tokenService.creditSignupBonus(user.id);

  // Notify Slack
  sendSlackMessage(
    `🎮 New Flow User!\nEmail: ${email}\nName: ${name}\nTokens: ${tokenService.SIGNUP_BONUS.toLocaleString()}`
  );

  // Generate token
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
    expiresIn: '30d',
  });

  res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar_url: user.avatar_url,
      token_balance: user.token_balance,
      account_type: user.account_type,
    },
    is_new_user: isNewUser,
  });
}, 'Failed to authenticate flow user');

/**
 * Get current flow user info
 */
exports.getFlowUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ id: req.userId });

  if (!user) {
    throw new HttpError('User not found').NotFound();
  }

  res.status(200).json({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    avatar_url: user.avatar_url,
    token_balance: user.token_balance,
    account_type: user.account_type,
    created_at: user.created_at,
  });
}, 'Failed to get flow user');

/**
 * Get user's token balance
 */
exports.getTokenBalance = asyncHandler(async (req, res) => {
  const balance = await tokenService.getBalance(req.userId);

  if (balance === null) {
    throw new HttpError('User not found').NotFound();
  }

  res.status(200).json({ balance });
}, 'Failed to get token balance');

/**
 * Get user's transaction history
 */
exports.getTransactionHistory = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  const { transactions, total } = await tokenService.getTransactionHistory(
    req.userId,
    limit,
    offset
  );

  res.status(200).json({ transactions, total, limit, offset });
}, 'Failed to get transaction history');

/**
 * Check if user can afford a flow
 */
exports.checkFlowAffordability = asyncHandler(async (req, res) => {
  const { token_cost } = req.body;

  if (typeof token_cost !== 'number') {
    throw new HttpError('token_cost is required').BadRequest();
  }

  const result = await tokenService.checkBalance(req.userId, token_cost);

  res.status(200).json(result);
}, 'Failed to check affordability');
