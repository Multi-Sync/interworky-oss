// src/modules/post_visitation_reminder/post_visitation_reminder.validators.js
const { createStrictValidator } = require('../../../packages/core/src/utils/base.validators');
const { body, param } = require('express-validator');
const { POST_VISITATION_REMINDER_METHOD } = require('./post_visitation_reminder.utils');

exports.createPostVisitationReminderValidator = createStrictValidator([
  body('patient_id').isUUID(),
  body('appointment_id').isUUID(),
  body('scheduled_at').isDate(),
  body('method')
    .isString()
    .isIn(POST_VISITATION_REMINDER_METHOD)
    .withMessage(`Status must be one of: ${POST_VISITATION_REMINDER_METHOD.join(', ')}`),
]);

exports.getPostVisitationReminderValidator = createStrictValidator([param('id').isUUID()]);

exports.getPostVisitationReminderValidatorByOrganizationId = createStrictValidator([param('organization_id').isUUID()]);

exports.updatePostVisitationReminderValidator = createStrictValidator([
  param('id').isUUID(),
  body('patient_id').isUUID().optional(),
  body('appointment_id').isUUID().optional(),
  body('scheduled_at').isDate().optional(),
  body('method')
    .optional()
    .isString()
    .isIn(POST_VISITATION_REMINDER_METHOD)
    .withMessage(`Status must be one of: ${POST_VISITATION_REMINDER_METHOD.join(', ')}`),
]);

exports.deletePostVisitationReminderValidator = createStrictValidator([param('id').isUUID()]);
