// src/modules/organization_assistants/organization_assistants.validators.js
const { createStrictValidator } = require('../../utils/base.validators');
const { param, body, query } = require('express-validator');

exports.createOrganizationAssistantValidator = createStrictValidator([
  body('organization_id').isUUID().withMessage('Invalid organization ID'),
  body('assistant_id').isString().withMessage('Invalid assistant ID'),
]);

exports.listOrganizationAssistantsValidator = createStrictValidator([
  query('page').isInt().withMessage('Invalid page number'),
  query('limit').isInt().withMessage('Invalid limit number'),
]);

exports.deleteOrganizationAssistantValidator = createStrictValidator([param('id').isUUID().withMessage('Invalid ID')]);
