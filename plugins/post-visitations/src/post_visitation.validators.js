// src/modules/post_visitation/post_visitation.validators.js
const { createStrictValidator } = require('../../../packages/core/src/utils/base.validators');
const { body, param, query } = require('express-validator');

exports.createPostVisitationValidator = createStrictValidator([
  body('appointment_id').isUUID(),
  body('rating').isNumeric(),
  body('what_was_good').isString(),
  body('what_was_bad').isString(),
  body('would_you_recommend').isString(),
  body('can_we_add_you_as_a_happy_customer_on_our_social_website').isBoolean(),
]);

exports.getPostVisitationValidator = createStrictValidator([param('id').isUUID()]);
exports.listPostVisitationsByOrganizationValidator = createStrictValidator([
  param('organization_id').isUUID(),
  query('limit').isInt({ min: 1 }).optional(),
  query('skip').isInt({ min: 0 }).optional(),
]);

exports.updatePostVisitationValidator = createStrictValidator([
  param('id').isUUID(),
  body('appointment_id').optional().isUUID(),
  body('rating').optional().isNumeric(),
  body('what_was_good').optional().isString(),
  body('what_was_bad').optional().isString(),
  body('would_you_recommend').optional().isString(),
  body('can_we_add_you_as_a_happy_customer_on_our_social_website').optional().isBoolean(),
]);

exports.deletePostVisitationValidator = createStrictValidator([param('id').isUUID()]);
