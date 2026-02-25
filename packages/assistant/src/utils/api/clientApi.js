import {
  getOrganization,
  setPatient,
  getPatientId,
  generatePatientId,
} from '../../assistant/utils/state';
import logger from '../logger';
import { sendGetRequest, sendPostRequest, sendPutRequest } from './baseMethods';

/**
 * Sends a request to create or update a patient on the server using patient ID.
 * All contact fields (first_name, last_name, email, phone) are optional.
 *
 * @param {object} patientData - The patient data to send to the server.
 * @returns {Promise<object>} - The created or updated patient data from the server.
 */
export async function createPatientOnServer(patientData) {
  const { first_name, last_name, email, phone, timezone } = patientData;

  try {
    const org = getOrganization();
    let patientId = getPatientId();

    // Generate patient ID if it doesn't exist
    if (!patientId) {
      patientId = generatePatientId();
    }

    // Create or update patient with patient ID
    const response = await sendPostRequest('api/patients/', {
      id: patientId,
      first_name: first_name || null,
      last_name: last_name || null,
      email: email || null,
      phone: phone || null,
      timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      organization_id: org?.id,
    });

    setPatient(response);
    return response;
  } catch (error) {
    logger.error('IW046', 'Error creating/updating patient:', error);
  }
}

/**
 * Retrieves a patient by their email address from the server.
 *
 * @param {string} email - The email address of the patient.
 * @returns {Promise<object>} - The patient data retrieved from the server.
 */
export async function getPatientByEmail(email) {
  try {
    const response = await sendGetRequest(`api/patients/email/${email}`);
    return response;
  } catch (error) {
    logger.error('IW047', 'Error getting patient by email:', error);
  }
}

/**
 * Updates patient information using patient ID
 * @param {object} updates - The patient data to update
 * @returns {Promise<object>} - The updated patient data from the server
 */
export async function updatePatientInfo(updates) {
  const patientId = getPatientId();
  if (!patientId) {
    logger.error('IW048', 'No patient ID found', { updates });
    return null;
  }

  try {
    const response = await sendPutRequest(`api/patients/${patientId}`, updates);
    setPatient(response);
    return response;
  } catch (error) {
    logger.error('IW045', 'Error updating patient info:', error);
  }
}
