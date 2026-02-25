const { createStrictValidator } = require('../../utils/base.validators');
const { body, param } = require('express-validator');
const { isValidObjectId } = require('mongoose');
exports.createAssistantAccessValidator = createStrictValidator([
  // body('assistant_id').isUUID().withMessage('Invalid assistant ID'),
  body('table_name').isString().notEmpty().withMessage('Table name is required'),
  body('access_level')
    .isInt({ min: 0, max: 2 })
    .withMessage('Access level must be 0 (read), 1 (write), or 2 (readwrite)'),
]);

exports.updateAssistantAccessValidator = createStrictValidator([
  param('id')
    .custom(value => isValidObjectId(value))
    .withMessage('Invalid assistant access ID'),
  body('table_name').optional().isString().notEmpty().withMessage('Table name cannot be empty'),
  body('access_level')
    .optional()
    .isInt({ min: 0, max: 2 })
    .withMessage('Access level must be 0 (read), 1 (write), or 2 (readwrite)'),
]);
