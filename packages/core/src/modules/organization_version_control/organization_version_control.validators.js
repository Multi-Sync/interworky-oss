const { createStrictValidator } = require('../../utils/base.validators');
const { body, param } = require('express-validator');

/**
 * Validator for creating/connecting GitHub credentials for an organization
 */
exports.createVersionControlValidator = createStrictValidator([
  body('organization_id').isString().notEmpty().withMessage('organization_id is required'),
  body('github_token').isString().notEmpty().withMessage('github_token is required'),
  body('github_repo_owner').isString().notEmpty().withMessage('github_repo_owner is required'),
  body('github_repo_name').isString().notEmpty().withMessage('github_repo_name is required'),
  body('has_write_access').optional().isBoolean().withMessage('has_write_access must be a boolean'),
]);

/**
 * Validator for getting GitHub credentials by organization ID
 */
exports.getVersionControlValidator = createStrictValidator([
  param('organization_id').isString().notEmpty().withMessage('Invalid organization_id'),
]);

/**
 * Validator for updating GitHub credentials
 */
exports.updateVersionControlValidator = createStrictValidator([
  param('organization_id').isString().notEmpty().withMessage('Invalid organization_id'),
  body('github_token').optional().isString().notEmpty().withMessage('github_token cannot be empty'),
  body('github_repo_owner').optional().isString().notEmpty().withMessage('github_repo_owner cannot be empty'),
  body('github_repo_name').optional().isString().notEmpty().withMessage('github_repo_name cannot be empty'),
  body('has_write_access').optional().isBoolean().withMessage('has_write_access must be a boolean'),
]);

/**
 * Validator for deleting/disconnecting GitHub credentials
 */
exports.deleteVersionControlValidator = createStrictValidator([
  param('organization_id').isString().notEmpty().withMessage('Invalid organization_id'),
]);

/**
 * Validator for verifying GitHub credentials (test connection)
 */
exports.verifyVersionControlValidator = createStrictValidator([
  param('organization_id').isString().notEmpty().withMessage('Invalid organization_id'),
]);

/**
 * Validator for updating auto-fix enabled status
 */
exports.updateAutoFixEnabledValidator = createStrictValidator([
  param('organization_id').isString().notEmpty().withMessage('Invalid organization_id'),
  body('auto_fix_enabled').isBoolean().withMessage('auto_fix_enabled must be a boolean'),
]);
