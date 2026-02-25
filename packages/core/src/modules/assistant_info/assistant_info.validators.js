const { createStrictValidator } = require('../../utils/base.validators');
const { body, param } = require('express-validator');
const HttpError = require('../../utils/HttpError');
const isHexColor = value => {
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (hexColorRegex.test(value)) {
    return true;
  }
  throw new HttpError('Invalid hex color').ValidationError();
};
exports.createAssistantInfoValidator = createStrictValidator([
  body('organization_id').isUUID(),
  body('assistant_name').isString(),
  body('assistant_id').isString(),
  body('assistant_personality').isString(),
  body('assistant_knowledge').isString().optional(),
  body('primary_color').custom(isHexColor),
  body('secondary_color').custom(isHexColor),
  body('error_color').custom(isHexColor),
  body('text_primary_color').custom(isHexColor),
  body('text_secondary_color').custom(isHexColor),
  body('assistant_image_url').isURL({ require_tld: false }),
  body('opening_statement').isString(),
  body('first_message').isString(),
]);

exports.getAssistantInfoValidator = createStrictValidator([param('organization_id').isUUID()]);

exports.updateAssistantInfoValidator = createStrictValidator([
  param('organization_id').isUUID(),
  body('assistant_id').isString().optional(),
  body('assistant_name').isString().optional(),
  body('assistant_personality').isString().optional(),
  body('appointments_enabled').isBoolean().optional(),
  body('contact_info_required').isBoolean().optional(),
  body('voice_enabled').isBoolean().optional(),
  body('analytics_enabled').isBoolean().optional(),
  body('cx_enabled').isBoolean().optional(),
  body('monitoring_enabled').isBoolean().optional(),
  body('auto_fix_enabled').isBoolean().optional(),
  body('assistant_knowledge').isString().optional(),
  body('primary_color').custom(isHexColor).optional(),
  body('secondary_color').custom(isHexColor).optional(),
  body('error_color').custom(isHexColor).optional(),
  body('text_primary_color').custom(isHexColor).optional(),
  body('text_secondary_color').custom(isHexColor).optional(),
  body('opening_statement').isString().optional(),
  body('first_message').isString().optional(),
  body('premium').isBoolean().optional(),
  body('dim_screen').isBoolean().optional(),
  body('event_type').isIn(['online', 'in-person', 'phone']).optional(),
  body('view_type').isIn(['normal', 'landing', 'badge']).optional(),
  body('business_address').isString().optional(),
  body('real_time_instructions').isArray().optional(),
  body('assistant_image_url')
    .isURL({
      require_tld: false,
      allow_underscores: true,
      allow_trailing_dot: true,
      protocols: ['http', 'https'], // Accept only HTTP(S) URLs
    })
    .custom(value => {
      // Ensure no raw spaces
      if (value.includes(' ')) {
        throw new Error('URL contains invalid spaces');
      }
      return true;
    })
    .optional(),
]);

exports.updateAssistantInfoImageValidator = createStrictValidator([param('organization_id').isUUID()]);

exports.deleteAssistantInfoValidator = createStrictValidator([param('organization_id').isString()]);

exports.listAssistantInfoValidator = createStrictValidator([param('organization_id').isUUID()]);
