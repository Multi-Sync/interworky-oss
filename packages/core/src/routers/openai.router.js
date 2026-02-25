const express = require('express');
const openaiRouter = express.Router();

const authenticateToken = require('../middlewares/auth.middleware');
const { getAIProvider } = require('@interworky/providers');

/**
 * Validates the request body for session creation
 * @param {Object} body - Request body
 * @throws {Error} If validation fails
 */
function validateSessionRequest(body) {
  if (body.instructions && typeof body.instructions !== 'string') {
    throw new Error('Instructions must be a string');
  }
}

/**
 * POST /session-key
 * Creates a new OpenAI realtime session
 * @route POST /session-key
 * @param {string} req.body.instructions - Optional instructions for the session
 * @returns {Object} Session data from OpenAI API
 */
openaiRouter.post('/session-key', authenticateToken, async (req, res) => {
  try {
    // Validate request body
    validateSessionRequest(req.body);

    const aiProvider = getAIProvider();
    const response = await aiProvider.createSession();

    if (!response) {
      return res.status(503).json({
        error: 'Realtime not available',
        message: 'Realtime sessions are not supported by the configured AI provider',
      });
    }

    res.json(response);
  } catch (error) {
    console.error('Error in session-key endpoint:', error);

    if (error.message.includes('timeout')) {
      return res.status(504).json({
        error: 'Gateway timeout',
        message: 'AI API request timed out',
      });
    }

    if (error.message.includes('Instructions must be')) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message,
      });
    }

    // Generic error response
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while creating the session',
    });
  }
});

module.exports = openaiRouter;
