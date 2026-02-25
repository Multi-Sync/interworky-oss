const { createStrictValidator } = require('../../utils/base.validators');
const { body, param } = require('express-validator');

exports.createOrganizationMethodValidator = createStrictValidator([
  body('organization_id').isUUID(),
  body('assistant_id').isString().notEmpty(),
  body('method_name').isString().notEmpty(),
  body('method_instruction').isString().notEmpty(),
  body('method_description').isString().notEmpty(),
  body('capability_type').optional().isIn(['http', 'email']),
  // HTTP-specific validations (required only if capability_type is 'http' or not provided)
  body('method_verb').if(body('capability_type').not().equals('email')).isIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  body('method_endpoint').if(body('capability_type').not().equals('email')).isString(),
  // Email-specific validations (required only if capability_type is 'email')
  body('email_config').if(body('capability_type').equals('email')).isObject(),
  body('email_config.to').if(body('capability_type').equals('email')).isEmail(),
  body('email_config.subject').if(body('capability_type').equals('email')).isString().notEmpty(),
  body('email_config.from_name').optional().isString(),
  body('email_config.template_type').optional().isIn(['simple', 'detailed']),
  body('fixed_params').isArray().optional(),
  body('dynamic_params').isArray().optional(),
  body('dynamic_params.*.field_name').isString().notEmpty(),
  body('dynamic_params.*.field_type').isString().notEmpty(),
  body('dynamic_params.*.field_description').isString().notEmpty(),
  body('dynamic_params.*.field_required').isBoolean().notEmpty(),
  body('auth').isString().optional(),
  body('public').isBoolean().optional(),
]);

exports.createBulkOrganizationMethodValidator = createStrictValidator([
  body('organization_id').isUUID(),
  body('methods').isArray().notEmpty(),
  body('methods.*.method_name').isString().notEmpty(),
  body('methods.*.method_instruction').isString().notEmpty(),
  body('methods.*.method_description').isString().notEmpty(),
  body('methods.*.capability_type').optional().isIn(['http', 'email']),
  body('methods.*.method_verb').optional().isIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  body('methods.*.method_endpoint').optional().isString(),
  body('methods.*.email_config').optional().isObject(),
  body('methods.*.fixed_params').isArray().optional(),
  body('methods.*.dynamic_params').isArray().optional(),
  body('methods.*.auth').isString().optional(),
  body('methods.*.public').isBoolean().optional(),
  body('methods.*.assistant_id').isString().optional(),
]);

exports.updateOrganizationMethodValidator = createStrictValidator([
  param('id').isUUID(),
  body('method_name').isString().optional(),
  body('method_instruction').isString().optional(),
  body('method_description').isString().optional(),
  body('capability_type').optional().isIn(['http', 'email']),
  body('method_verb').isIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).optional(),
  body('method_endpoint').isURL().optional(),
  body('email_config').optional().isObject(),
  body('email_config.to').optional().isEmail(),
  body('email_config.subject').optional().isString(),
  body('email_config.from_name').optional().isString(),
  body('email_config.template_type').optional().isIn(['simple', 'detailed']),
  body('fixed_params').isArray().optional(),
  body('dynamic_params').isArray().optional(),
  body('dynamic_params.*.field_name').isString().optional(),
  body('dynamic_params.*.field_type').isString().optional(),
  body('dynamic_params.*.field_description').isString().optional(),
  body('dynamic_params.*.field_required').isBoolean().optional(),
  body('auth').isString().optional(),
  body('public').isBoolean().optional(),
]);

exports.deleteOrganizationMethodValidator = createStrictValidator([param('id').isUUID()]);

exports.getOrganizationMethodsValidator = createStrictValidator([param('organization_id').isUUID()]);

exports.generateCapabilityValidator = createStrictValidator([
  body('description').isString().notEmpty().withMessage('Description is required'),
  body('organization_email').optional().isString(), // Can be email or any string, used as hint for AI
]);

exports.executeCapabilityValidator = createStrictValidator([
  body('method_id').isUUID().withMessage('method_id must be a valid UUID'),
  body('params').isObject().withMessage('params must be an object'),
]);
