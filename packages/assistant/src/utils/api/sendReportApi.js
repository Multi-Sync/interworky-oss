import { sendPostRequest } from './baseMethods';

/**
 * Sends a report request to interworky functions that triggers a slack message
 *
 * @param {string} message - A string containing the report message
 * @returns {Promise<object>} - The request
 */
export function sendReport(reportMessage) {
  const patient = JSON.parse(localStorage.getItem('patient'));
  const requestBody = {
    message: `👤Patient_id: ${patient.patient.id}
🏛️Organization_id: ${patient.patient.organization_id}
📨Message: ${reportMessage}`,
    slackWebhookUrl: process.env.REACT_APP_SLACK_REPORT_WEBHOOK_URL,
  };

  //use setImmediate to avoid blocking the main thread
  setTimeout(() => {
    sendPostRequest('/', requestBody, 'https://interworky.com/functions/slack');
  }, 100);
}
