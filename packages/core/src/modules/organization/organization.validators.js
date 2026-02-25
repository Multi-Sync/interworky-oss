const { createStrictValidator } = require('../../utils/base.validators');
const { body, param } = require('express-validator');

exports.createOrganizationValidator = createStrictValidator([
  body('creator_user_id').isUUID().withMessage('Invalid creator_user_id'),
  body('organization_name').isString().notEmpty().withMessage('organization_name is required'),
  body('organization_website')
    .isURL({
      require_protocol: true,
      require_valid_protocol: true,
      protocols: ['http', 'https'],
      require_tld: false, // Allow ngrok URLs without strict TLD validation
    })
    .withMessage('organization_website must be a valid URL'),
  body('users').isArray().optional(),
  body('users.*.userId').isUUID().withMessage('Invalid userId for user'),
  body('users.*.role').isIn(['admin', 'member']).withMessage('Invalid role for user'),
]);

exports.updateOrganizationWebsiteValidator = createStrictValidator([
  body('organization_website')
    .isURL({
      require_protocol: true,
      require_valid_protocol: true,
      protocols: ['http', 'https'],
      require_tld: false, // Allow ngrok URLs without strict TLD validation
    })
    .withMessage('organization_website must be a valid URL'),
  param('id').isUUID().withMessage('Invalid organization id'),
]);
exports.organizationIdValidator = createStrictValidator([param('id').isUUID().withMessage('Invalid organization id')]);
exports.organizationNameValidator = createStrictValidator([
  param('organization_name').isString().withMessage('Invalid organization name'),
]);
exports.organizationByCreatorIdValidator = createStrictValidator([
  param('id').isUUID().withMessage('Invalid organization id'),
]);

exports.updateOrganizationValidator = createStrictValidator([
  param('id').isUUID().withMessage('Invalid organization id'),
  body('creator_user_id').optional().isUUID().withMessage('Invalid creator_user_id'),
  body('organization_name').optional().isString().notEmpty().withMessage('organization_name cannot be empty'),
  body('organization_website')
    .optional()
    .isURL({
      require_protocol: true,
      require_valid_protocol: true,
      protocols: ['http', 'https'],
      require_tld: false, // Allow ngrok URLs without strict TLD validation
    })
    .withMessage('organization_website must be a valid URL'),
  body('users').isArray().optional(),
  body('users.*.userId').optional().isUUID().withMessage('Invalid userId for user'),
  body('users.*.role').optional().isIn(['admin', 'member']).withMessage('Invalid role for user'),
]);

exports.listOrganizationsValidator = createStrictValidator([
  body('page').optional().isInt().withMessage('Invalid page number'),
  body('limit').optional().isInt().withMessage('Invalid limit'),
]);

// Invite a single member to organization
exports.organizationUserInviteValidator = createStrictValidator([
  param('id').isUUID().withMessage('Invalid organization id'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('first_name').optional().isString(),
  body('last_name').optional().isString(),
  body('timezone').optional().isString(),
  body('role').optional().isIn(['admin', 'member']).withMessage('Invalid role'),
]);

// New validators for organization users management
exports.organizationUsersListValidator = createStrictValidator([
  param('id').isUUID().withMessage('Invalid organization id'),
]);

exports.organizationUsersAddValidator = createStrictValidator([
  param('id').isUUID().withMessage('Invalid organization id'),
  body('users').isArray({ min: 1 }).withMessage('users array is required'),
  body('users.*.userId').isUUID().withMessage('Invalid userId for user'),
  body('users.*.role').isIn(['admin', 'member']).withMessage('Invalid role for user'),
]);

exports.organizationUserRoleUpdateValidator = createStrictValidator([
  param('id').isUUID().withMessage('Invalid organization id'),
  param('userId').isUUID().withMessage('Invalid user id'),
  body('role').isIn(['admin', 'member']).withMessage('Invalid role'),
]);

exports.organizationUserRemoveValidator = createStrictValidator([
  param('id').isUUID().withMessage('Invalid organization id'),
  param('userId').isUUID().withMessage('Invalid user id'),
]);
