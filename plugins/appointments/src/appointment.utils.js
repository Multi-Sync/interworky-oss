exports.APPOINTMENT_STATUS_ENUM = Object.freeze({
  CANCELLED: 'Cancelled',
  REQUESTED: 'Requested',
  SCHEDULED: 'Scheduled',
  ATTENDED: 'Attended',
  FEEDBACK_PENDING: 'Feedback Pending',
  FEEDBACK_COLLECTED: 'Feedback Collected',
});
exports.APPOINTMENT_STATUS = Object.values(exports.APPOINTMENT_STATUS_ENUM);

exports.statusOrder = ['Requested', 'Scheduled', 'Attended', 'Feedback Pending', 'Feedback Collected', 'Cancelled'];

exports.formatAppointmentDate = (date, patientTimezone = 'UTC', creatorTimezone = 'UTC') => {
  return {
    patient: new Date(date).toLocaleString('en-US', {
      timeZone: patientTimezone,
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }),
    creator: new Date(date).toLocaleString('en-US', {
      timeZone: creatorTimezone,
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }),
  };
};

exports.formatAppointmentData = (appointment, patient, creator, organization) => {
  const date = new Date(appointment.date);
  const { creator: creatorDate, patient: patientDate } = exports.formatAppointmentDate(
    date,
    patient.timezone,
    creator.timezone,
  );
  return {
    data: {
      'Patient Name': patient.first_name,
      'Doctor Name': creator.first_name,
      'Clinic Name': organization.organization_name,
      'Patient Appointment Date': patientDate,
      'Doctor Appointment Date': creatorDate,
      'Appointment Type': 'Appointment',
      'Patient Requested Date/Time': patientDate,
      'Doctor Requested Date/Time': creatorDate,
      'Patient Confirmed Date/Time': patientDate,
      'Doctor Confirmed Date/Time': creatorDate,
      'Patient New Date/Time': patientDate,
      'Doctor New Date/Time': creatorDate,
      'Clinic Phone Number': creator.phone,
      'Clinic Admin/Contact': creator.email,
      'Link to Feedback Form': `https://interworky.com/post-visit/${appointment.id}`,
      'Link to Feedback Page': `https://interworky.com/post-visit/${appointment.id}`,
    },
    recipients: {
      Doctor: { email: creator.email, phone: creator.phone },
      Patient: { email: patient.email, phone: patient.phone },
    },
  };
};
