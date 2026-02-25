const router = require('./src/appointment.routes');
const Appointment = require('./src/appointment.model');
const { NotificationDispatcher } = require('./src/appointment_notification/appointment_notification.service');
const { sendUpdateAppointmentNotification } = require('./src/appointment.services');
const { APPOINTMENT_STATUS, APPOINTMENT_STATUS_ENUM, statusOrder, formatAppointmentData } = require('./src/appointment.utils');

module.exports = {
  name: 'appointments',
  router,
  models: { Appointment },
  services: { NotificationDispatcher, sendUpdateAppointmentNotification },
  utils: { APPOINTMENT_STATUS, APPOINTMENT_STATUS_ENUM, statusOrder, formatAppointmentData },
};
