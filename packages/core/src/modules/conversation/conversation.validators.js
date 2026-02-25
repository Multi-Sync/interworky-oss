const { body, param, query } = require('express-validator');
const { createStrictValidator } = require('../../utils/base.validators');

// Validate conversation creation
exports.createConversationValidator = createStrictValidator([
  body('organizationId').notEmpty().trim().withMessage('Organization ID is required'),
  body('patientId').notEmpty().trim().withMessage('Patient ID is required'),
]);

// Validate message addition
exports.addMessageValidator = createStrictValidator([
  param('conversationId').isUUID().withMessage('Invalid conversation ID'),
  body('role').isIn(['assistant', 'owner', 'user']).withMessage('Invalid role'),
  body('content').notEmpty().trim().withMessage('Message content is required'),
  body('timestamp').optional().isISO8601().withMessage('Invalid timestamp'),
  body('metadata').optional().isObject().withMessage('Invalid metadata'),
  body('reaction').optional().isIn([null, 1, 2]).withMessage('Invalid reaction value'),
]);

// Validate conversation ID parameter
exports.conversationIdValidator = createStrictValidator([
  param('conversationId').isUUID().withMessage('Invalid conversation ID'),
]);

// Validate organization conversations query
exports.organizationConversationsValidator = createStrictValidator([
  param('organizationId').isUUID().notEmpty().trim().withMessage('Organization ID is required'),
  query('skip').optional().isInt({ min: 0 }).withMessage('Skip must be a non-negative integer'),
  query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer'),
]);

exports.getConversationsByPatientIdValidator = createStrictValidator([
  param('patientId').isUUID().notEmpty().trim().withMessage('Invalid patient ID'),
  query('skip').optional().isInt({ min: 0 }).withMessage('Skip must be a non-negative integer'),
  query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer'),
]);

exports.closeConversationValidator = createStrictValidator([
  param('patientId').isUUID().notEmpty().trim().withMessage('Invalid patient ID'),
  param('organizationId').isUUID().notEmpty().trim().withMessage('Organization ID is required'),
]);

exports.updateConversationValidator = createStrictValidator([
  param('conversationId').isUUID().withMessage('Invalid conversation ID'),
  body('organizationId').optional().notEmpty().trim().withMessage('Organization ID must not be empty if provided'),
  body('patientId').optional().notEmpty().trim().withMessage('Patient ID must not be empty if provided'),
]);

exports.updateMessageReactionValidator = createStrictValidator([
  param('conversationId').isUUID().withMessage('Invalid conversation ID'),
  param('messageId').isUUID().withMessage('Invalid message ID'),
  body('reaction').optional().isIn([1, 2]).withMessage('Invalid reaction value'),
]);

// Validate Carla dashboard conversation initialization
exports.carlaInitValidator = createStrictValidator([
  body('organizationId').notEmpty().trim().withMessage('Organization ID is required'),
  body('userId').notEmpty().trim().withMessage('User ID is required'),
  body('conversationId').optional().isUUID().withMessage('Invalid conversation ID'),
]);

// Validate Carla conversation messages retrieval
exports.getCarlaConversationMessagesValidator = createStrictValidator([
  param('conversationId').isUUID().withMessage('Invalid conversation ID'),
]);
