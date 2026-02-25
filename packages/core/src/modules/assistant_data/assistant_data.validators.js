const { createStrictValidator } = require('../../utils/base.validators');
const { body, param } = require('express-validator');

exports.createAssistantDataValidator = createStrictValidator([
  body('name').isString().notEmpty().withMessage('Name is required'),
  body('image_url').isURL().withMessage('Image URL must be a valid URL'),
  body('opening_statement').isString().notEmpty().withMessage('Opening statement is required'),
  body('personality').isString().notEmpty().withMessage('Personality is required'),
  body('type').isString().notEmpty().withMessage('Type is required'),
]);

exports.assistantDataIdValidator = createStrictValidator([
  param('id').isUUID().withMessage('Invalid assistant data ID'),
]);

exports.updateAssistantDataValidator = createStrictValidator([
  param('id').isUUID().withMessage('Invalid assistant data ID'),
  body('name').optional().isString().notEmpty().withMessage('Name cannot be empty'),
  body('image_url').optional().isURL().withMessage('Image URL must be a valid URL'),
  body('opening_statement').optional().isString().notEmpty().withMessage('Opening statement cannot be empty'),
  body('personality').optional().isString().notEmpty().withMessage('Personality cannot be empty'),
  body('type').optional().isString().notEmpty().withMessage('Type cannot be empty'),
  body('assistant_id').optional().isUUID().withMessage('Invalid assistant ID'),
]);
