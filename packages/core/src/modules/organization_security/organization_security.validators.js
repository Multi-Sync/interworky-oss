const { body, param, query } = require('express-validator');
const { createStrictValidator } = require('../../utils/base.validators');

/**
 * Organization Security Validators (Simplified)
 */

exports.organizationIdValidator = createStrictValidator([
  param('organization_id').isString().notEmpty().withMessage('Organization ID is required'),
]);

exports.alertIdValidator = createStrictValidator([
  param('alert_id').isString().notEmpty().withMessage('Alert ID is required'),
]);

exports.alertsQueryValidator = createStrictValidator([
  param('organization_id').isString().notEmpty().withMessage('Organization ID is required'),
  query('status')
    .optional()
    .isIn(['pending', 'notified', 'fixing', 'resolved', 'failed', 'ignored'])
    .withMessage('Invalid status'),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('limit must be between 1 and 100'),
]);

exports.updateAlertStatusValidator = createStrictValidator([
  param('alert_id').isString().notEmpty().withMessage('Alert ID is required'),
  body('status')
    .isIn(['pending', 'notified', 'fixing', 'resolved', 'failed', 'ignored'])
    .withMessage('Invalid status'),
  body('pr_url').optional().isURL().withMessage('pr_url must be a valid URL'),
  body('pr_number').optional().isInt().withMessage('pr_number must be an integer'),
  body('error_message').optional().isString().withMessage('error_message must be a string'),
]);
