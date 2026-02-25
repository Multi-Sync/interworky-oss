import { sendGetRequest, sendPostRequest } from './baseMethods';

/**
 * Sends a request to create an appointment on the server.
 *
 * @param {object} appointmentData - An object containing the appointment details.
 *  - appointmentData.date {Date}: The date of the appointment.
 *  - appointmentData.time {string}: The time of the appointment.
 *  - appointmentData.patientId {string}: The UUID of the patient.
 *  - appointmentData.organizationId {string}: The ID of the organization.
 * @returns {Promise<object>} - The created appointment data from the server.
 */
export function createAppointmentOnServer(appointmentData) {
  const requestBody = {
    date: appointmentData.date,
    patient_id: appointmentData.patient_id,
    organization_id: appointmentData.organization_id,
    status: 'Requested',
  };

  return sendPostRequest('api/appointments', requestBody);
}

/**
 * Retrieves an appointment by its ID from the server.
 *
 * @param {string} appointmentId - The ID of the appointment to retrieve.
 * @returns {Promise<object>} - The appointment data retrieved from the server.
 */
export async function getAppointmentById(appointmentId) {
  return sendGetRequest(`api/appointments/${appointmentId}`);
}
