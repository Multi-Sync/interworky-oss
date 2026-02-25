const { createStrictValidator } = require('../../utils/base.validators');
const { body, param } = require('express-validator');

exports.createOrganizationConversationValidator = createStrictValidator([
  body('organization_id').isString().isLength({ min: 1, max: 255 }),
  body('thread_id').isString().isLength({ min: 1, max: 255 }),
  body('email').isEmail(),
]);

exports.organizationConversationIdValidator = createStrictValidator([param('id').isMongoId()]);
exports.organizationConversationByOrganizationIdAndEmailValidator = createStrictValidator([
  param('organization_id').isString().isLength({ min: 1, max: 255 }),
  param('email').isEmail(),
]);
exports.organizationConversationByOrganizationId = createStrictValidator([param('organization_id').isUUID()]);
exports.updateOrganizationConversationValidator = createStrictValidator([
  param('id').isMongoId(),
  body('organization_id').isString().isLength({ min: 1, max: 255 }).optional(),
  body('thread_id').isString().isLength({ min: 1, max: 255 }).optional(),
  body('email').isEmail().optional(),
]);
