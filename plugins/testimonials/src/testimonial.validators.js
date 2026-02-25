// validators/testimonialValidator.js
const { body, param, query } = require('express-validator');
const { createStrictValidator } = require('../../../packages/core/src/utils/base.validators');

const createTestimonialValidator = createStrictValidator([
  body('post_visitation_id').isString().notEmpty().withMessage('post_visitation_id is required'),
  body('patient_id').isString().notEmpty().withMessage('patient_id is required'),
  body('appt_id').isString().notEmpty().withMessage('appt_id is required'),
]);

const getTestimonialValidator = createStrictValidator([param('id').isUUID().withMessage('Invalid testimonial ID')]);

const updateTestimonialValidator = createStrictValidator([
  param('id').isUUID().withMessage('Invalid testimonial ID'),
  body('post_visitation_id').isString().notEmpty().optional(),
  body('patient_id').isString().notEmpty().optional(),
  body('appt_id').isString().notEmpty().optional(),
]);

const deleteTestimonialValidator = createStrictValidator([param('id').isUUID().withMessage('Invalid testimonial ID')]);

const listTestimonialsValidator = createStrictValidator([
  query('page').isInt({ min: 1 }).optional().withMessage('page must be a positive integer'),
  query('limit').isInt({ min: 1 }).optional().withMessage('limit must be a positive integer'),
]);

module.exports = {
  createTestimonialValidator,
  getTestimonialValidator,
  updateTestimonialValidator,
  deleteTestimonialValidator,
  listTestimonialsValidator,
};
