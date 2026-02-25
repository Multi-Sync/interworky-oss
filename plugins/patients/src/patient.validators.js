const { createStrictValidator, isValidTimezone } = require('../../../packages/core/src/utils/base.validators');
const { body, param, query } = require('express-validator');

exports.createPatientValidator = createStrictValidator([
  body('id').optional().isUUID().withMessage('Patient ID must be a valid UUID if provided'),
  body('organization_id').isUUID(),
  body('timezone').custom(isValidTimezone).withMessage("Must be a valid timezone like 'America/New_York'"),
]);

exports.getPatientListValidator = createStrictValidator([
  query('limit').isInt({ min: 1 }).optional(),
  query('page').isInt({ min: 1 }).optional(),
]);

exports.getPatientValidator = createStrictValidator([param('id').isUUID()]);
exports.getPatientByEmailValidator = createStrictValidator([param('email').trim().toLowerCase().isEmail()]);

exports.listPatientsByOrganizationValidator = createStrictValidator([
  param('organization_id').isUUID(),
  query('limit').isInt({ min: 1 }).optional(),
  query('skip').isInt({ min: 0 }).optional(),
  query('search').isString().optional(),
]);
exports.updatePatientValidator = createStrictValidator([
  param('id').isUUID(),
  body('first_name').isString().isLength({ min: 1, max: 255 }).optional(),
  body('last_name').isString().isLength({ min: 1, max: 255 }).optional(),
  body('email').isEmail().optional(),
  body('phone').isMobilePhone('any').optional(),
  body('timezone').custom(isValidTimezone).withMessage("Must be a valid timezone like 'America/New_York'").optional(),
]);

exports.deletePatientValidator = createStrictValidator([param('id').isUUID()]);
