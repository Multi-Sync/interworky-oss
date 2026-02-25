const { createStrictValidator, isValidTimezone } = require('../../utils/base.validators');
const { body, param } = require('express-validator');

exports.createUserValidator = createStrictValidator([
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').optional().isString().withMessage('Last name must be a string'),
  body('phone').isMobilePhone('any').optional(),
  body('timezone').custom(isValidTimezone).withMessage("Must be a valid timezone like 'America/New_York'"),
  body('status').equals('invited').withMessage('Status must be "invited" for new users'),
  body('source')
    .isIn(['google', 'test-website', 'email', 'mobile'])
    .withMessage('Source must be "google", "test-website", "email", or "mobile"'),
  body('clinicName').optional().isString().withMessage('Clinic name must be a string'),
  body('clinicWebsite').optional().isString().withMessage('Clinic website must be a string'),
]);

exports.authenticateUserValidator = createStrictValidator([
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required'),
]);

exports.resetPasswordValidator = createStrictValidator([
  param('id').isUUID().withMessage('Invalid user ID'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
]);

exports.getUserByIdValidator = createStrictValidator([param('id').isUUID().withMessage('Invalid user ID')]);

exports.updateUserValidator = createStrictValidator([
  param('id').isUUID().withMessage('Invalid user ID'),
  body('email').isEmail().optional().withMessage('Invalid email address'),
  body('first_name').notEmpty().optional().withMessage('First name cannot be empty'),
  body('last_name').notEmpty().optional().withMessage('Last name cannot be empty'),
  body('phone').isMobilePhone('any').optional(),
  body('timezone').custom(isValidTimezone).withMessage("Must be a valid timezone like 'America/New_York'").optional(),
]);

exports.providerSignInValidator = createStrictValidator([
  body('email').isEmail().withMessage('Invalid email address'),
  body('name').notEmpty().withMessage('Name is required'),
  body('timezone').custom(isValidTimezone).withMessage("Must be a valid timezone like 'America/New_York'"),
]);

exports.deleteUserValidator = createStrictValidator([param('id').isUUID().withMessage('Invalid user ID')]);
