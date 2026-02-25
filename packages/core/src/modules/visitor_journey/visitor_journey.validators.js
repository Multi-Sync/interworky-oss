// src/modules/visitor_journey/visitor_journey.validators.js
const { createStrictValidator } = require('../../utils/base.validators');
const { param, body, query } = require('express-validator');

exports.createVisitorJourneyValidator = createStrictValidator([
  body('organization_id').isString().withMessage('Invalid organization ID'),
  body('session_id').isString().withMessage('Invalid session ID'),
  body('visitor_id').isString().withMessage('Invalid visitor ID'),
  body('traffic_source.type')
    .isIn(['direct', 'search', 'social', 'referral', 'email', 'paid', 'internal', 'other'])
    .withMessage('Invalid traffic source type'),
  body('traffic_source.medium').optional().isString(),
  body('traffic_source.source').optional().isString(),
  body('traffic_source.campaign').optional().isString(),
  body('traffic_source.keyword').optional().isString(),
  body('location.country').optional().isString(),
  body('location.country_code').optional().isString(),
  body('location.region').optional().isString(),
  body('location.city').optional().isString(),
  body('location.timezone').optional().isString(),
  body('location.source').optional().isString(),
  body('device.type').isIn(['desktop', 'mobile', 'tablet']).withMessage('Invalid device type'),
  body('device.browser').optional().isString(),
  body('device.os').optional().isString(),
  body('device.screen_resolution').optional().isString(),
  body('journey').optional().isObject(),
  body('intent').optional().isObject(),
  body('engagement').optional().isObject(),
  body('session').optional().isObject(),
]);

exports.updateVisitorJourneyValidator = createStrictValidator([
  param('id').isString().withMessage('Invalid ID'),
  body('traffic_source.type')
    .optional()
    .isIn(['direct', 'search', 'social', 'referral', 'email', 'paid', 'other'])
    .withMessage('Invalid traffic source type'),
  body('device.type').optional().isIn(['desktop', 'mobile', 'tablet']).withMessage('Invalid device type'),
  body('intent.urgency').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid urgency level'),
  body('exit.reason').optional().isIn(['natural', 'bounce', 'timeout', 'error']).withMessage('Invalid exit reason'),
]);

exports.getVisitorJourneyValidator = createStrictValidator([param('id').isString().withMessage('Invalid ID')]);

exports.deleteVisitorJourneyValidator = createStrictValidator([param('id').isString().withMessage('Invalid ID')]);

exports.listVisitorJourneysValidator = createStrictValidator([
  query('page').optional().isInt({ min: 1 }).withMessage('Invalid page number'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Invalid limit number'),
  query('organization_id').optional().isString().withMessage('Invalid organization ID'),
  query('session_id').optional().isString().withMessage('Invalid session ID'),
  query('visitor_id').optional().isString().withMessage('Invalid visitor ID'),
  query('is_active').optional().isBoolean().withMessage('Invalid is_active flag'),
]);

exports.getVisitorJourneyBySessionValidator = createStrictValidator([
  param('session_id').isString().withMessage('Invalid session ID'),
]);

exports.getVisitorJourneyByVisitorValidator = createStrictValidator([
  param('visitor_id').isString().withMessage('Invalid visitor ID'),
]);

exports.addPageToJourneyValidator = createStrictValidator([
  param('id').isString().withMessage('Invalid ID'),
  body('url').isString().withMessage('URL is required'),
  body('title').optional().isString().withMessage('Title must be a string'),
  body('timestamp').optional().isISO8601().withMessage('Invalid timestamp'),
  body('time_spent').optional().isInt({ min: 0 }).withMessage('Time spent must be a positive integer'),
  body('scroll_depth').optional().isInt({ min: 0, max: 100 }).withMessage('Scroll depth must be between 0 and 100'),
  body('interactions').optional().isInt({ min: 0 }).withMessage('Interactions must be a positive integer'),
]);

exports.addConversionEventValidator = createStrictValidator([
  param('id').isString().withMessage('Invalid ID'),
  body('event').isString().withMessage('Event name is required'),
  body('value').optional().isNumeric().withMessage('Value must be a number'),
]);

exports.addSearchQueryValidator = createStrictValidator([
  param('id').isString().withMessage('Invalid ID'),
  body('query').isString().withMessage('Query is required'),
]);

exports.updateSessionStatusValidator = createStrictValidator([
  param('id').isString().withMessage('Invalid ID'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
  body('end_time').optional().isISO8601().withMessage('Invalid end_time'),
  body('duration').optional().isInt({ min: 0 }).withMessage('Duration must be a positive integer'),
  body('exit_page').optional().isString().withMessage('exit_page must be a string'),
  body('exit_reason').optional().isString().withMessage('exit_reason must be a string'),
]);

exports.getOrganizationAnalyticsValidator = createStrictValidator([
  param('organization_id').isString().withMessage('Invalid organization ID'),
  query('start_date').isISO8601().withMessage('Valid start_date is required'),
  query('end_date').isISO8601().withMessage('Valid end_date is required'),
]);
