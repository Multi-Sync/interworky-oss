const { body, param, query } = require('express-validator');
const { createStrictValidator } = require('../../../packages/core/src/utils/base.validators');

const createNegativeFeedbackValidator = createStrictValidator([
  body('post_visitation_id').isString().notEmpty().withMessage('post_visitation_id is required'),
  body('patient_id').isString().notEmpty().withMessage('patient_id is required'),
  body('appt_id').isString().notEmpty().withMessage('appt_id is required'),
]);

const getNegativeFeedbackValidator = createStrictValidator([param('id').isUUID().withMessage('Invalid feedback ID')]);

const updateNegativeFeedbackValidator = createStrictValidator([
  param('id').isUUID().withMessage('Invalid feedback ID'),
  body('post_visitation_id').isString().notEmpty().optional(),
  body('patient_id').isString().notEmpty().optional(),
  body('appt_id').isString().notEmpty().optional(),
]);

const deleteNegativeFeedbackValidator = createStrictValidator([
  param('id').isUUID().withMessage('Invalid feedback ID'),
]);

const listNegativeFeedbackValidator = createStrictValidator([
  query('page').isInt({ min: 1 }).optional().withMessage('page must be a positive integer'),
  query('limit').isInt({ min: 1 }).optional().withMessage('limit must be a positive integer'),
]);

module.exports = {
  createNegativeFeedbackValidator,
  getNegativeFeedbackValidator,
  updateNegativeFeedbackValidator,
  deleteNegativeFeedbackValidator,
  listNegativeFeedbackValidator,
};
