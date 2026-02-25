// src/modules/appointment/appointment.validators.js
const { createStrictValidator } = require('../../../packages/core/src/utils/base.validators');
const { body, param, query } = require('express-validator');
const { APPOINTMENT_STATUS } = require('./appointment.utils');

exports.createAppointmentValidator = createStrictValidator([
  body('date').isISO8601().withMessage('Date must be a valid ISO8601 date string'),
  body('patient_id').isUUID(),
  body('organization_id').isString(),
  body('status')
    .isString()
    .isIn(APPOINTMENT_STATUS)
    .withMessage(`Status must be one of: ${APPOINTMENT_STATUS.join(', ')}`),
]);

exports.getAppointmentValidator = createStrictValidator([param('id').isUUID()]);

exports.listAppointmentsByOrganizationValidator = createStrictValidator([
  param('organization_id').isUUID(),
  query('status')
    .custom(value => JSON.parse(value).every(status => APPOINTMENT_STATUS.includes(status)))
    .withMessage(`Status must be one of: ${APPOINTMENT_STATUS.join(', ')}`)
    .optional(),
  query('skip').isInt().optional(),
  query('limit').isInt().optional(),
  query('search').isString().optional(),
]);

exports.updateAppointmentValidator = createStrictValidator([
  param('id').isUUID(),
  body('date').isISO8601().optional().withMessage('Date must be a valid ISO8601 date string'),
  body('patient_id').isUUID().optional(),
  body('organization_id').isString().optional(),
  body('status')
    .isString()
    .isIn(APPOINTMENT_STATUS)
    .withMessage(`Status must be one of: ${APPOINTMENT_STATUS.join(', ')}`),
]);

exports.deleteAppointmentValidator = createStrictValidator([param('id').isUUID()]);
