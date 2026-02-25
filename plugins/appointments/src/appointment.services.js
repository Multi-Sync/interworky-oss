const { APPOINTMENT_STATUS_ENUM, formatAppointmentData } = require('./appointment.utils');
const Appointment = require('./appointment.model');
/**
 *
 * @param {Object} param0
 * @param {Object} param0.appointment
 * @param {Object} param0.oldAppointment
 * @param {Object} param0.organization
 * @param {Object} param0.patient
 * @param {Object} param0.creator
 * @param {Object} param0.NotificationDispatcher
 * @returns {Promise<void>}
 */
exports.sendUpdateAppointmentNotification = async ({
  appointment,
  oldAppointment,
  organization,
  patient,
  creator,
  NotificationDispatcher,
}) => {
  const oldStatus = oldAppointment.status;
  const newStatus = appointment.status;

  const dispatcher = new NotificationDispatcher();
  const { data, recipients } = formatAppointmentData(appointment, patient, creator, organization);

  const lastNotificationSent = oldAppointment.last_notification_sent
    ? new Date(oldAppointment.last_notification_sent)
    : new Date(0);
  const currentDate = new Date();
  const notificationTimeDifference = Math.abs(currentDate - lastNotificationSent); // milliseconds
  const notificationDaysDifference = Math.ceil(notificationTimeDifference / (1000 * 60 * 60 * 24)); // days

  const previousAppointmentTime = new Date(oldAppointment.date).getTime();
  const newAppointmentTime = new Date(appointment.date).getTime();

  if (previousAppointmentTime !== newAppointmentTime && oldStatus !== APPOINTMENT_STATUS_ENUM.REQUESTED) {
    dispatcher.dispatch('Rescheduled', data, recipients);
  } else if (oldStatus === APPOINTMENT_STATUS_ENUM.REQUESTED && newStatus === APPOINTMENT_STATUS_ENUM.SCHEDULED) {
    dispatcher.dispatch(APPOINTMENT_STATUS_ENUM.SCHEDULED, data, recipients);
  } else if (
    oldStatus !== newStatus ||
    (newStatus === APPOINTMENT_STATUS_ENUM.FEEDBACK_PENDING && notificationDaysDifference >= 1)
  ) {
    dispatcher.dispatch(newStatus, data, recipients);
    await Appointment.updateOne({ id: appointment.id }, { last_notification_sent: new Date() });
  }
};
