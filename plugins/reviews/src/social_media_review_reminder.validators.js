const { body, param, query } = require('express-validator');
const { createStrictValidator } = require('../../../packages/core/src/utils/base.validators');
const { METHODS } = require('./social_media_review_reminder.utils.js');
exports.createReviewReminderValidator = createStrictValidator([
  body('post_visitation_id').isString().notEmpty().withMessage('post_visitation_id is required'),
  body('patient_id').isString().notEmpty().withMessage('patient_id is required'),
  body('appt_id').isString().notEmpty().withMessage('appt_id is required'),
  body('scheduled_at').isISO8601().withMessage('scheduled_at must be a valid date'),
  body('method')
    .isString()
    .isIn(METHODS)
    .withMessage(`method must be one of: ${METHODS.join(', ')}`),
]);

exports.getReviewReminderValidator = createStrictValidator([
  param('id').isMongoId().withMessage('Invalid reminder ID'),
]);
exports.getReviewReminderByOrganizationValidator = createStrictValidator([
  param('organization_id').isMongoId().withMessage('Invalid organization ID'),
]);
exports.updateReviewReminderValidator = createStrictValidator([
  param('id').isMongoId().withMessage('Invalid reminder ID'),
  body('post_visitation_id').isString().notEmpty().optional(),
  body('patient_id').isString().notEmpty().optional(),
  body('appt_id').isString().notEmpty().optional(),
  body('scheduled_at').isISO8601().optional(),
  body('method')
    .isString()
    .isIn(METHODS)
    .optional()
    .withMessage(`method must be one of: ${METHODS.join(', ')}`),
]);

exports.deleteReviewReminderValidator = createStrictValidator([
  param('id').isMongoId().withMessage('Invalid reminder ID'),
]);

exports.listReviewRemindersValidator = createStrictValidator([
  query('page').isInt({ min: 1 }).optional().withMessage('page must be a positive integer'),
  query('limit').isInt({ min: 1 }).optional().withMessage('limit must be a positive integer'),
]);
